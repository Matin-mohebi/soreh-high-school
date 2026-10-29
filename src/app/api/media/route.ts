import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { ok, bad, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 8 * 1024 * 1024 // ۸ مگابایت
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

/** کتابخانه‌ی رسانه — فایل‌ها روی دیسک در پوشه‌ی db/media ذخیره می‌شوند */
export async function GET(req: NextRequest) {
  const user = await requireUser(req, 'media')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { q, page, pageSize } = parseListQuery(req)
  const where = q ? { originalName: { contains: q } } : {}
  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.media.count({ where }),
  ])
  return ok({ items, ...listMeta(total, { q, page, pageSize }) })
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req, 'media')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return bad('فایلی ارسال نشد.')
  }
  const file = form.get('file')
  if (!(file instanceof File)) return bad('فایلی ارسال نشد.')
  if (file.size === 0) return bad('فایل خالی است.')
  if (file.size > MAX_SIZE) return bad('حجم فایل بیش از ۸ مگابایت است.')
  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_MIME.has(mime)) return bad('این نوع فایل پذیرفته نمی‌شود.')

  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().slice(0, 8)
  const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : 'bin'
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${safeExt}`

  const fs = await import('fs/promises')
  const path = await import('path')
  const dir = path.join(process.cwd(), 'db', 'media')
  await fs.mkdir(dir, { recursive: true })
  const buf = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(dir, filename), buf)

  const item = await db.media.create({
    data: {
      filename,
      originalName: file.name.slice(0, 200),
      mime,
      size: file.size,
    },
  })
  await logActivity({
    username: user.username, action: 'UPLOAD', entity: 'media', entityId: item.id,
    detail: file.name.slice(0, 200),
  })
  const res = NextResponse.json({ item, url: `/api/media/file/${filename}` }, { status: 201 })
  return res
}
