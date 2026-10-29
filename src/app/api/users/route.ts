import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, bad, parseListQuery, listMeta } from '@/lib/api'
import { requireUser, unauthorized, forbidden, sanitizeText, isValidEmail } from '@/lib/auth'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

/** مدیریت کاربران — فقط مدیر کل */
export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  const { q, page, pageSize } = parseListQuery(req)
  const where = q
    ? { OR: [{ username: { contains: q } }, { name: { contains: q } }, { email: { contains: q } }] }
    : {}
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])
  return ok({ items, ...listMeta(total, { q, page, pageSize }) })
}

export async function POST(req: NextRequest) {
  const admin = await requireUser(req)
  if (!admin) return unauthorized()
  if (admin.role !== 'ADMIN') return forbidden()
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const name = sanitizeText(body.name, 80)
  const username = sanitizeText(body.username, 64).toLowerCase()
  const email = sanitizeText(body.email, 120).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const role = ['ADMIN', 'EDITOR', 'SUBSCRIBER'].includes(String(body.role)) ? String(body.role) : 'SUBSCRIBER'

  if (username.length < 3) return bad('نام کاربری باید حداقل ۳ حرف باشد.')
  if (!/^[a-z0-9._-]+$/.test(username)) return bad('نام کاربری فقط حروف انگلیسی، عدد و . _ -')
  if (!isValidEmail(email)) return bad('ایمیل معتبر وارد کنید.')
  if (password.length < 8) return bad('رمز عبور باید حداقل ۸ کاراکتر باشد.')

  const dupUser = await db.user.findUnique({ where: { username } })
  if (dupUser) return bad('این نام کاربری قبلا گرفته شده.')
  const dupEmail = await db.user.findUnique({ where: { email } })
  if (dupEmail) return bad('این ایمیل قبلا ثبت شده.')

  const passwordHash = await bcrypt.hash(password, 12)
  const item = await db.user.create({
    data: { username, email, name: name || username, passwordHash, role },
    select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
  })
  await logActivity({
    username: admin.username, action: 'CREATE', entity: 'user', entityId: item.id,
    detail: `${item.username} (${item.role})`,
  })
  return ok({ item }, { status: 201 })
}
