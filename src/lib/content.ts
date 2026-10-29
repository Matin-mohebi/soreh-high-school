import { db } from '@/lib/db'
import { getSettings, parseStats, boolVal } from '@/lib/settings'

/**
 * ساخت content.json — همان ساختاری که سایت استاتیک (public/site) از آن استفاده می‌کند.
 * این تابع منبع واحد حقیقت برای انتشار است: داشبورد → انتشار → content.json
 */

export const SITE_PAGES: Record<string, string> = {
  'index.html': 'index.html',
  'news.html': 'news.html',
  'page.html': 'page.html',
  'schedule.html': 'schedule.html',
  'contact.html': 'contact.html',
  'login.html': 'login.html',
  'register.html': 'register.html',
  '404.html': '404.html',
}

export async function buildContent() {
  const [settings, staff, students, news, pages, menu, schedule] = await Promise.all([
    getSettings(),
    db.staffMember.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    db.student.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    db.newsPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 60,
    }),
    db.pageBlock.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    db.menuItem.findMany({ orderBy: { order: 'asc' } }),
    db.scheduleEntry.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] }),
  ])

  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه']

  return {
    site: {
      name: settings['site.name'],
      nameEn: settings['site.nameEn'],
      tagline: settings['site.tagline'],
      logo: settings['site.logo'],
      favicon: settings['site.favicon'],
      backendUrl: settings['site.backendUrl'],
      siteUrl: settings['site.siteUrl'],
    },
    seo: {
      title: settings['seo.title'],
      description: settings['seo.description'],
      keywords: settings['seo.keywords'],
      ogImage: settings['seo.ogImage'],
    },
    hero: { text: settings['hero.text'], image: settings['hero.image'] },
    about: {
      title: settings['about.title'],
      text: settings['about.text'],
      stats: parseStats(settings['about.stats']),
    },
    staff: {
      title: settings['staff.title'],
      text: settings['staff.text'],
      gateText: settings['staff.gateText'],
      items: staff.map((s) => ({
        name: s.name,
        role: s.role,
        bio: s.bio,
        photo: s.photoUrl,
      })),
    },
    students: {
      title: settings['students.title'],
      text: settings['students.text'],
      gateText: settings['students.gateText'],
      items: students.map((s) => ({
        name: s.name,
        rank: s.rank,
        grade: s.grade,
        note: s.note,
        photo: s.photoUrl,
      })),
    },
    news: {
      title: settings['news.title'],
      text: settings['news.text'],
      items: news.map((n) => ({
        title: n.title,
        excerpt: n.excerpt,
        body: n.body,
        important: n.important,
        date: (n.publishedAt ?? n.createdAt).toISOString(),
      })),
    },
    pages: pages.map((p) => ({
      title: p.title,
      slug: p.slug,
      body: p.body,
      showInNav: p.showInNav,
    })),
    menu:
      menu.length > 0
        ? menu.map((m) => ({ label: m.label, href: staticMenuHref(m.href) }))
        : [
            { label: 'درباره', href: './index.html#about' },
            { label: 'مدیر و معاونان', href: './index.html#staff' },
            { label: 'دانش‌آموزان', href: './index.html#students' },
            { label: 'اخبار', href: './news.html' },
            { label: 'برنامه هفتگی', href: './schedule.html' },
            { label: 'تماس با ما', href: './contact.html' },
          ],
    schedule: {
      enabled: boolVal(settings['schedule.enabled']),
      title: settings['schedule.title'],
      text: settings['schedule.text'],
      days: days.map((day, i) => ({
        day,
        rows: schedule
          .filter((r) => r.day === i)
          .map((r) => ({ time: r.time, subject: r.subject, teacher: r.teacher })),
      })),
    },
    contact: {
      enabled: boolVal(settings['contact.enabled']),
      title: settings['contact.title'],
      text: settings['contact.text'],
    },
    footer: {
      note: settings['footer.note'],
      address: settings['footer.address'],
      phone: settings['footer.phone'],
    },
    toolkit: {
      search: boolVal(settings['toolkit.search']),
      progress: boolVal(settings['toolkit.progress']),
      backToTop: boolVal(settings['toolkit.backToTop']),
    },
    join: { enabled: boolVal(settings['join.enabled']) },
  }
}

export type SiteContent = Awaited<ReturnType<typeof buildContent>>

/**
 * تبدیل مسیرهای «سایت زنده» به مسیرهای نسبی نسخه استاتیک (گیت‌هاب پیجز).
 * منو در دیتابیس با مسیرهای سایت زنده ذخیره می‌شود (/news)؛
 * در بسته انتشار به ./news.html و ... تبدیل می‌شود.
 */
export function staticMenuHref(href: string): string {
  const h = (href ?? '').trim()
  if (!h) return './index.html'
  if (/^https?:/i.test(h) || h.startsWith('mailto:')) return h
  if (h.startsWith('./') || h.startsWith('../')) return h
  // جداسازی انکر
  const [pathPart, hash] = h.split('#')
  const hashPart = hash ? `#${hash}` : ''
  const p = pathPart.replace(/\/+$/, '') || '/'
  if (p === '/') return `./index.html${hashPart}`
  if (p.startsWith('/page/')) return `./page.html?slug=${encodeURIComponent(p.slice('/page/'.length))}`
  const map: Record<string, string> = {
    '/news': './news.html',
    '/schedule': './schedule.html',
    '/contact': './contact.html',
    '/login': './login.html',
    '/register': './register.html',
  }
  return (map[p] ?? './index.html') + hashPart
}
