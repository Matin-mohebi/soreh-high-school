import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

const DAYS = 6

/** برنامه هفتگی: خواندن برای همه‌ی کاربران واردشده، ذخیره فقط مدیر */
export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  const items = await db.scheduleEntry.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] })
  return ok({ items })
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const rows = Array.isArray(body.rows) ? body.rows : null
  if (!rows) return bad('ساختار برنامه هفتگی نامعتبر است.')
  if (rows.length > 300) return bad('تعداد ردیف‌های برنامه بیش از حد مجاز است.')

  const clean = [] as { day: number; time: string; subject: string; teacher: string; order: number }[]
  for (const raw of rows) {
    const r = raw as Record<string, unknown>
    const day = Math.min(DAYS - 1, Math.max(0, parseInt(String(r.day ?? 0), 10) || 0))
    const time = String(r.time ?? '').trim().slice(0, 30)
    const subject = String(r.subject ?? '').trim().slice(0, 120)
    const teacher = String(r.teacher ?? '').trim().slice(0, 120)
    if (!time && !subject && !teacher) continue
    clean.push({ day, time, subject, teacher, order: clean.length })
  }

  await db.$transaction([
    db.scheduleEntry.deleteMany({}),
    ...clean.map((r) => db.scheduleEntry.create({ data: r })),
  ])
  await logActivity({
    username: user.username, action: 'UPDATE', entity: 'schedule',
    detail: `${clean.length} ردیف برنامه ذخیره شد`,
  })
  const items = await db.scheduleEntry.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] })
  return ok({ items })
}
