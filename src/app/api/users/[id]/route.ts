import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden, sanitizeText, isValidEmail } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireUser(req)
  if (!admin) return unauthorized()
  if (admin.role !== 'ADMIN') return forbidden()
  const { id } = await ctx.params
  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) return bad('کاربر پیدا نشد.', 404)

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = sanitizeText(body.name, 80) || existing.name
  if (body.email !== undefined) {
    const email = sanitizeText(body.email, 120).toLowerCase()
    if (!isValidEmail(email)) return bad('ایمیل معتبر وارد کنید.')
    const dup = await db.user.findFirst({ where: { email, NOT: { id } } })
    if (dup) return bad('این ایمیل قبلا ثبت شده.')
    data.email = email
  }
  if (body.role !== undefined) {
    const role = String(body.role)
    if (!['ADMIN', 'EDITOR', 'SUBSCRIBER'].includes(role)) return bad('نقش نامعتبر است.')
    if (existing.id === admin.id && role !== 'ADMIN') {
      return bad('نمی‌توانید نقش حساب خودتان را از مدیر کل تغییر دهید.')
    }
    data.role = role
  }
  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) return bad('رمز عبور باید حداقل ۸ کاراکتر باشد.')
    data.passwordHash = await bcrypt.hash(body.password, 12)
  }

  const item = await db.user.update({
    where: { id },
    data,
    select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
  })
  // اگر رمز تغییر کرد، نشست‌های قبلی آن کاربر باطل شود
  if (data.passwordHash) {
    await db.session.deleteMany({ where: { userId: id } })
  }
  await logActivity({
    username: admin.username, action: 'UPDATE', entity: 'user', entityId: id,
    detail: `${item.username}${data.passwordHash ? ' (تغییر رمز)' : ''}`,
  })
  return ok({ item })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireUser(req)
  if (!admin) return unauthorized()
  if (admin.role !== 'ADMIN') return forbidden()
  const { id } = await ctx.params
  const existing = await db.user.findUnique({ where: { id } })
  if (!existing) return bad('کاربر پیدا نشد.', 404)
  if (existing.id === admin.id) return bad('حساب کاربری خودتان را نمی‌توانید حذف کنید.')
  const adminsLeft = await db.user.count({ where: { role: 'ADMIN', NOT: { id } } })
  if (existing.role === 'ADMIN' && adminsLeft === 0) {
    return bad('آخرین مدیر کل قابل حذف نیست.')
  }
  await db.user.delete({ where: { id } })
  await logActivity({
    username: admin.username, action: 'DELETE', entity: 'user', entityId: id, detail: existing.username,
  })
  return ok({ ok: true })
}
