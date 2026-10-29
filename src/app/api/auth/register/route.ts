import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, sanitizeText, isValidEmail } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { bad, jsonWithCors, corsPreflight } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * ثبت‌نام کاربران عادی سایت (نقش SUBSCRIBER) — معادل فرم ثبت‌نام قالب اصلی.
 * نکته امنیتی: نقش SUBSCRIBER هیچ دسترسی مدیریتی ندارد.
 */

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('درخواست نامعتبر است.')
  }

  const name = sanitizeText(body.name, 80)
  const username = sanitizeText(body.username, 64).toLowerCase()
  const email = sanitizeText(body.email, 120).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''

  if (username.length < 3) return jsonWithCors(req, { error: 'نام کاربری باید حداقل ۳ حرف باشد.' }, 400)
  if (!/^[a-z0-9._-]+$/.test(username)) return jsonWithCors(req, { error: 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد و . _ - باشد.' }, 400)
  if (!isValidEmail(email)) return jsonWithCors(req, { error: 'ایمیل معتبر وارد کنید.' }, 400)
  if (password.length < 8) return jsonWithCors(req, { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' }, 400)

  const dupUser = await db.user.findUnique({ where: { username } })
  if (dupUser) return jsonWithCors(req, { error: 'این نام کاربری قبلا گرفته شده.' }, 409)
  const dupEmail = await db.user.findUnique({ where: { email } })
  if (dupEmail) return jsonWithCors(req, { error: 'این ایمیل قبلا ثبت شده.' }, 409)

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { username, email, name: name || username, passwordHash, role: 'SUBSCRIBER' },
  })

  await logActivity({ username, action: 'REGISTER', entity: 'user', entityId: user.id })

  const { token, expiresAt } = await createSession(user.id)
  const res = jsonWithCors(req, {
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  }, 201)
  setSessionCookie(res, token, expiresAt)
  return res
}
