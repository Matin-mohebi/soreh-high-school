import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { txt } from '@/lib/crud'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'menu')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.menuItem.findUnique({ where: { id } })
  if (!existing) return bad('آیتم منو پیدا نشد.', 404)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const label = txt(body, 'label', 60) || existing.label
  const href = txt(body, 'href', 300) || existing.href
  const order = body.order !== undefined ? Math.max(0, parseInt(String(body.order), 10) || 0) : existing.order
  const item = await db.menuItem.update({ where: { id }, data: { label, href, order } })
  await logActivity({
    username: user.username, action: 'UPDATE', entity: 'menu', entityId: id, detail: label,
  })
  return ok({ item })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'menu')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.menuItem.findUnique({ where: { id } })
  if (!existing) return bad('آیتم منو پیدا نشد.', 404)
  await db.menuItem.delete({ where: { id } })
  await logActivity({
    username: user.username, action: 'DELETE', entity: 'menu', entityId: id, detail: existing.label,
  })
  return ok({ ok: true })
}
