import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** پیام‌های دریافتی فرم تماس */
export async function GET(req: NextRequest) {
  const user = await requireUser(req, 'messages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { q, page, pageSize } = parseListQuery(req)
  const where = q
    ? { OR: [{ name: { contains: q } }, { subject: { contains: q } }, { body: { contains: q } }] }
    : {}
  const [items, total] = await Promise.all([
    db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.message.count({ where }),
  ])
  return ok({ items, ...listMeta(total, { q, page, pageSize }) })
}
