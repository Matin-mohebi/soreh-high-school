import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

/** منوی ناوبری سایت */
export async function GET(req: NextRequest) {
  const user = await requireUser(req, 'menu')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const items = await db.menuItem.findMany({ orderBy: { order: 'asc' } })
  return ok({ items })
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req, 'menu')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const label = txt(body, 'label', 60)
  const href = txt(body, 'href', 300)
  if (!label) return bad('برچسب منو را وارد کنید.')
  if (!href) return bad('آدرس مقصد را وارد کنید.')
  const maxOrder = await db.menuItem.aggregate({ _max: { order: true } })
  const item = await db.menuItem.create({
    data: { label, href, order: (maxOrder._max.order ?? -1) + 1 },
  })
  await logActivity({
    username: user.username, action: 'CREATE', entity: 'menu', entityId: item.id, detail: label,
  })
  return ok({ item }, { status: 201 })
}
