import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden, sanitizeText } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'news')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.newsPost.findUnique({ where: { id } })
  if (!existing) return bad('خبر پیدا نشد.', 404)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const title = txt(body, 'title', 160) || existing.title
  const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : body.status === 'DRAFT' ? 'DRAFT' : existing.status
  const wasPublished = existing.status === 'PUBLISHED'
  const item = await db.newsPost.update({
    where: { id },
    data: {
      title,
      excerpt: body.excerpt !== undefined ? txt(body, 'excerpt', 400) : existing.excerpt,
      body: body.body !== undefined ? sanitizeText(body.body, 20000) : existing.body,
      important: body.important !== undefined ? Boolean(body.important) : existing.important,
      status,
      publishedAt:
        status === 'PUBLISHED' ? (wasPublished ? existing.publishedAt : new Date()) : null,
    },
  })
  await logActivity({
    username: user.username, action: 'UPDATE', entity: 'news', entityId: id,
    detail: `${title} (${status === 'PUBLISHED' ? 'منتشر شده' : 'پیش‌نویس'})`,
  })
  return ok({ item })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'news')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.newsPost.findUnique({ where: { id } })
  if (!existing) return bad('خبر پیدا نشد.', 404)
  await db.newsPost.delete({ where: { id } })
  await logActivity({
    username: user.username, action: 'DELETE', entity: 'news', entityId: id, detail: existing.title,
  })
  return ok({ ok: true })
}
