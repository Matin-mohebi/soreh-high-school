import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'messages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as { read?: boolean }
  const existing = await db.message.findUnique({ where: { id } })
  if (!existing) return bad('پیام پیدا نشد.', 404)
  const item = await db.message.update({ where: { id }, data: { read: Boolean(body.read) } })
  return ok({ item })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'messages')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.message.findUnique({ where: { id } })
  if (!existing) return bad('پیام پیدا نشد.', 404)
  await db.message.delete({ where: { id } })
  await logActivity({
    username: user.username, action: 'DELETE', entity: 'message', entityId: id, detail: existing.subject,
  })
  return ok({ ok: true })
}
