import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { buildContent } from '@/lib/content'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * معماری انتشار:
 *  گیت‌هاب‌پیجز نمی‌تواند به پایگاه‌داده متصل شود؛ بنابراین انتشار یعنی:
 *   ۱) ساخت content.json از پایگاه‌داده (و بازنویسی نشانی رسانه‌ها به پوشه‌ی uploads/)
 *   ۲) ساخت بسته‌ی استقرار (zip شامل سایت استاتیک + محتوای تازه + رسانه‌ها)
 *   ۳) در صورت تنظیم GITHUB_TOKEN (فقط سمت سرور): ارسال محتوا به مخزن با GitHub Contents API
 */

function rewriteMediaUrl(url: string, uploadsMap: Map<string, string>): string {
  const m = /^\/api\/media\/file\/([a-zA-Z0-9._-]+)$/.exec(url ?? '')
  if (m && uploadsMap.has(m[1])) return `./uploads/${m[1]}`
  return url
}

async function buildBundle() {
  const settings = await getSettings()
  const content = await buildContent()

  const fs = await import('fs/promises')
  const path = await import('path')

  // فهرست رسانه‌ها برای کپی و بازنویسی نشانی‌ها
  const mediaItems = await db.media.findMany()
  const uploadsMap = new Map(mediaItems.map((m) => [m.filename, m.filename]))

  // بازنویسی نشانی رسانه‌ها به مسیر نسبی uploads/ برای نسخه‌ی استاتیک
  for (const s of content.staff.items) s.photo = rewriteMediaUrl(s.photo, uploadsMap)
  for (const s of content.students.items) s.photo = rewriteMediaUrl(s.photo, uploadsMap)
  content.site.logo = rewriteMediaUrl(content.site.logo, uploadsMap)
  content.seo.ogImage = rewriteMediaUrl(content.seo.ogImage, uploadsMap)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outDir = path.join(process.cwd(), 'db', 'publish')
  await fs.mkdir(outDir, { recursive: true })
  const zipName = `soreh-site-${stamp}.zip`
  const zipPath = path.join(outDir, zipName)

  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip()
  zip.addLocalFolder(path.join(process.cwd(), 'public', 'site'))
  zip.addFile('assets/content.json', Buffer.from(JSON.stringify(content, null, 2), 'utf8'))
  for (const m of mediaItems) {
    const p = path.join(process.cwd(), 'db', 'media', m.filename)
    try {
      zip.addLocalFile(p, 'uploads', m.filename)
    } catch {
      // فایل رسانه روی دیسک نیست؛ از بسته حذف می‌ماند
    }
  }
  zip.writeZip(zipPath)

  // نگه‌داشتن ۱۰ بسته‌ی آخر
  const files = (await fs.readdir(outDir)).filter((f) => f.endsWith('.zip')).sort()
  while (files.length > 10) {
    const oldest = files.shift() as string
    await fs.rm(path.join(outDir, oldest), { force: true })
  }
  const stat = await fs.stat(zipPath)

  return { settings, content, zipName, zipPath, size: stat.size, mediaCount: mediaItems.length }
}

async function pushToGithub(contentJson: string, username: string) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const contentPath = process.env.GITHUB_CONTENT_PATH || 'site/assets/content.json'
  const pushMedia = process.env.GITHUB_PUSH_MEDIA === '1'
  const mediaPath = process.env.GITHUB_MEDIA_PATH || 'site/uploads'

  if (!token || !repo) {
    return {
      enabled: false,
      pushed: false,
      reason: 'GITHUB_TOKEN یا GITHUB_REPO در متغیرهای محیطی سرور تنظیم نشده است؛ بسته‌ی استقرار برای ارسال دستی آماده شد.',
    }
  }

  const api = `https://api.github.com/repos/${repo}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'soreh-admin',
  }

  async function putFile(path: string, contentBase64: string, message: string, branchRef: string) {
    // گرفتن sha فایل موجود (برای به‌روزرسانی)
    let sha: string | undefined
    const getRes = await fetch(`${api}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branchRef)}`, { headers })
    if (getRes.status === 200) {
      const j = await getRes.json()
      sha = j.sha
    } else if (getRes.status !== 404) {
      throw new Error(`GitHub GET ${path}: ${getRes.status}`)
    }
    const putRes = await fetch(`${api}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: contentBase64, branch: branchRef, ...(sha ? { sha } : {}) }),
    })
    if (!putRes.ok) {
      const t = await putRes.text()
      throw new Error(`GitHub PUT ${path}: ${putRes.status} ${t.slice(0, 200)}`)
    }
    return putRes.json()
  }

  try {
    const commits: string[] = []
    const r1 = await putFile(
      contentPath,
      Buffer.from(contentJson, 'utf8').toString('base64'),
      ` content: publish from admin dashboard (by ${username})\n\nAutomated content update for دبیرستان سوره website.`,
      branch
    )
    commits.push(String(r1?.commit?.html_url ?? ''))

    let mediaPushed = 0
    if (pushMedia) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const dir = path.join(process.cwd(), 'db', 'media')
      let names: string[] = []
      try { names = await fs.readdir(dir) } catch {}
      for (const name of names) {
        const buf = await fs.readFile(path.join(dir, name))
        await putFile(
          `${mediaPath}/${name}`,
          buf.toString('base64'),
          `media: sync ${name}`,
          branch
        )
        mediaPushed++
      }
    }

    return {
      enabled: true,
      pushed: true,
      repo,
      branch,
      contentPath,
      commitUrl: commits[0],
      mediaPushed,
      note: 'محتوا با موفقیت به مخزن ارسال شد؛ GitHub Actions آن را منتشر می‌کند.',
    }
  } catch (e) {
    return {
      enabled: true,
      pushed: false,
      reason: `ارسال به گیت‌هاب ناموفق بود: ${(e as Error).message.slice(0, 300)}`,
    }
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()

  const bundle = await buildBundle()
  const github = await pushToGithub(JSON.stringify(bundle.content, null, 2), user.username)

  await logActivity({
    username: user.username,
    action: 'PUBLISH',
    entity: 'site',
    detail: `بسته‌ی ${bundle.zipName} (${Math.round(bundle.size / 1024)}KB) — گیت‌هاب: ${github.pushed ? 'ارسال شد' : 'ارسال دستی'}`,
  })

  // نگارش‌های محلی برای دانلود از داشبورد
  const latest = { file: bundle.zipName, size: bundle.size, at: new Date().toISOString() }
  const fs = await import('fs/promises')
  const path = await import('path')
  await fs.writeFile(
    path.join(process.cwd(), 'db', 'publish', 'latest.json'),
    JSON.stringify(latest, null, 2)
  )

  return ok({
    bundle: { file: bundle.zipName, size: bundle.size, downloadUrl: `/api/publish/download?file=${encodeURIComponent(bundle.zipName)}` },
    contentSummary: {
      staff: bundle.content.staff.items.length,
      students: bundle.content.students.items.length,
      news: bundle.content.news.items.length,
      pages: bundle.content.pages.length,
      media: bundle.mediaCount,
      siteName: bundle.content.site.name,
    },
    github,
    publishedAt: new Date().toISOString(),
  })
}
