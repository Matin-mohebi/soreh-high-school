import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** گزارش فعالیت — فقط مدیر کل */
export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  const { q, page, pageSize } = parseListQuery(req, 15)
  const where = q
    ? {
        OR: [
          { username: { contains: q } },
          { action: { contains: q.toUpperCase() } },
          { entity: { contains: q } },
          { detail: { contains: q } },
        ],
      }
    : {}
  const [items, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
  ])
  return ok({ items, ...listMeta(total, { q, page, pageSize }) })
}
