import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req, 'media')
  if (!user) {
    const s = await requireUser(req)
    return s ? forbidden() : unauthorized()
  }
  const { id } = await ctx.params
  const existing = await db.media.findUnique({ where: { id } })
  if (!existing) return bad('فایل پیدا نشد.', 404)

  const fs = await import('fs/promises')
  const path = await import('path')
  const safeName = path.basename(existing.filename)
  await fs.rm(path.join(process.cwd(), 'db', 'media', safeName), { force: true })

  await db.media.delete({ where: { id } })
  await logActivity({
    username: user.username, action: 'DELETE', entity: 'media', entityId: id,
    detail: existing.originalName,
  })
  return ok({ ok: true })
}
