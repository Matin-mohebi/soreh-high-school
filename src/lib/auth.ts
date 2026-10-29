import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

/**
 * احراز هویت سمت سرور:
 * - رمزها با bcrypt هش می‌شوند (هرگز در کد کلاینت نیستند)
 * - توکن نشست تصادفی ۳۲ بایتی است؛ فقط هش آن در پایگاه‌داده ذخیره می‌شود
 * - کوکی HttpOnly + SameSite=Lax (در حالت HTTPS: Secure)
 */

export const SESSION_COOKIE = 'soreh_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14 // ۱۴ روز

export type Role = 'ADMIN' | 'EDITOR' | 'SUBSCRIBER'

export type SessionUser = {
  id: string
  username: string
  email: string
  name: string
  role: Role
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function cookieSecure() {
  return process.env.NODE_ENV === 'production' && process.env.COOKIE_INSECURE !== '1'
}

export async function createSession(userId: string, remember = true) {
  const token = crypto.randomBytes(32).toString('hex')
  const ttl = remember ? SESSION_TTL_MS : 1000 * 60 * 60 * 8
  const expiresAt = new Date(Date.now() + ttl)
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  })
  return { token, expiresAt }
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    maxAge: 0,
  })
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
  }
}

/** خطای 401 برای درخواست‌های بدون نشست معتبر */
export function unauthorized() {
  return NextResponse.json({ error: 'برای انجام این عملیات باید وارد حساب مدیریتی شوید.' }, { status: 401 })
}

/** خطای 403 برای نقش‌های فاقد صلاحیت */
export function forbidden() {
  return NextResponse.json({ error: 'شما اجازه انجام این عملیات را ندارید.' }, { status: 403 })
}

/**
 * بررسی نقش:
 *  - ADMIN: همه‌ی دسترسی‌ها
 *  - EDITOR: مدیریت محتوا (کارکنان، دانش‌آموزان، اخبار، برگه‌ها، منو، رسانه، پیام‌ها، برنامه)
 *  - SUBSCRIBER: هیچ دسترسی مدیریتی
 */
export const EDITOR_MODULES = [
  'staff', 'students', 'news', 'pages', 'menu', 'media', 'messages', 'schedule',
]

export function canManage(user: SessionUser | null, module?: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (user.role === 'EDITOR' && (!module || EDITOR_MODULES.includes(module))) return true
  return false
}

/** میانبر: کاربر مجاز یا null */
export async function requireUser(req: NextRequest, module?: string): Promise<SessionUser | null> {
  const user = await getSessionUser(req)
  if (!canManage(user, module)) return null
  return user
}

/** نرمال‌سازی ورودی متنی سمت سرور */
export function sanitizeText(v: unknown, maxLen = 5000): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLen)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}
