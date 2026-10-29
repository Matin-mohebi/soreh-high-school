import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden, canManage, sanitizeText } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

/** اخبار: فهرست عمومی با فیلتر وضعیت برای پیش‌نمایش، و مدیریتی با جست‌وجو/صفحه‌بندی */
export async function GET(req: NextRequest) {
  const { q, page, pageSize } = parseListQuery(req)
  const sp = req.nextUrl.searchParams
  const all = sp.get('all') === '1'
  if (all) {
    const user = await requireUser(req, 'news')
    if (!user) {
      const s = await requireUser(req)
      return s ? forbidden() : unauthorized()
    }
    const where = q
      ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { body: { contains: q } }] }
      : {}
    const [items, total] = await Promise.all([
      db.newsPost.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.newsPost.count({ where }),
    ])
    return ok({ items, ...listMeta(total, { q, page, pageSize }) })
  }
  // فهرست عمومی: فقط منتشرشده‌ها
  const items = await db.newsPost.findMany({
    where: {
      status: 'PUBLISHED',
      ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 60,
  })
  return ok({ items, total: items.length })
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req, 'news')
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
  const title = txt(body, 'title', 160)
  if (!title) return bad('عنوان خبر را وارد کنید.')
  const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  const item = await db.newsPost.create({
    data: {
      title,
      excerpt: txt(body, 'excerpt', 400),
      body: sanitizeText(body.body, 20000),
      important: Boolean(body.important),
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })
  await logActivity({
    username: user.username, action: 'CREATE', entity: 'news', entityId: item.id, detail: title,
  })
  return ok({ item }, { status: 201 })
}
