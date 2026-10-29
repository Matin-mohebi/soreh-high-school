import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .slice(0, 80) || `page-${Date.now()}`
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req, 'pages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { q, page, pageSize } = parseListQuery(req)
  const where = q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] } : {}
  const [items, total] = await Promise.all([
    db.pageBlock.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.pageBlock.count({ where }),
  ])
  return ok({ items, ...listMeta(total, { q, page, pageSize }) })
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req, 'pages')
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
  if (!title) return bad('عنوان برگه را وارد کنید.')
  let slug = txt(body, 'slug', 80)
  if (!slug) slug = slugify(title)
  const dup = await db.pageBlock.findUnique({ where: { slug } })
  if (dup) return bad('این نامک قبلا استفاده شده است.')
  const item = await db.pageBlock.create({
    data: {
      title,
      slug,
      body: txt(body, 'body', 30000),
      showInNav: Boolean(body.showInNav),
      status: body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      order: Math.max(0, parseInt(String(body.order ?? 0), 10) || 0),
    },
  })
  await logActivity({
    username: user.username, action: 'CREATE', entity: 'page', entityId: item.id, detail: title,
  })
  return ok({ item }, { status: 201 })
}
