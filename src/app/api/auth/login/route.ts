import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, sanitizeText } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { bad, jsonWithCors, corsPreflight } from '@/lib/api'

export const dynamic = 'force-dynamic'

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
  const username = sanitizeText(body.username, 64).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const remember = Boolean(body.remember)

  if (!username || !password) {
    return jsonWithCors(req, { error: 'نام کاربری و رمز عبور را وارد کنید.' }, 400)
  }

  const user = await db.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
  })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await logActivity({ username, action: 'LOGIN_FAILED', detail: 'نام کاربری یا رمز اشتباه' })
    return jsonWithCors(req, { error: 'نام کاربری یا رمز عبور اشتباه است.' }, 401)
  }

  const { token, expiresAt } = await createSession(user.id, remember)
  await logActivity({ username: user.username, action: 'LOGIN', detail: 'ورود موفق' })

  const res = jsonWithCors(req, {
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  })
  setSessionCookie(res as NextResponse, token, expiresAt)
  return res
}
