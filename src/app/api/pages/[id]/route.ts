import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'pages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.pageBlock.findUnique({ where: { id } })
  if (!existing) return bad('برگه پیدا نشد.', 404)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const title = txt(body, 'title', 160) || existing.title
  const slug = body.slug !== undefined ? txt(body, 'slug', 80) : existing.slug
  if (slug !== existing.slug) {
    const dup = await db.pageBlock.findUnique({ where: { slug } })
    if (dup) return bad('این نامک قبلا استفاده شده است.')
  }
  const item = await db.pageBlock.update({
    where: { id },
    data: {
      title,
      slug,
      body: body.body !== undefined ? txt(body, 'body', 30000) : existing.body,
      showInNav: body.showInNav !== undefined ? Boolean(body.showInNav) : existing.showInNav,
      status: body.status === 'DRAFT' ? 'DRAFT' : body.status === 'PUBLISHED' ? 'PUBLISHED' : existing.status,
      order: body.order !== undefined ? Math.max(0, parseInt(String(body.order), 10) || 0) : existing.order,
    },
  })
  await logActivity({
    username: user.username, action: 'UPDATE', entity: 'page', entityId: id, detail: title,
  })
  return ok({ item })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'pages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.pageBlock.findUnique({ where: { id } })
  if (!existing) return bad('برگه پیدا نشد.', 404)
  await db.pageBlock.delete({ where: { id } })
  await logActivity({
    username: user.username, action: 'DELETE', entity: 'page', entityId: id, detail: existing.title,
  })
  return ok({ ok: true })
}
