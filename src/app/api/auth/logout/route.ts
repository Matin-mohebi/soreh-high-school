import { NextRequest } from 'next/server'
import { clearSession, clearSessionCookie, getSessionUser } from '@/lib/auth'
import { logActivity } from '@/lib/log'
import { jsonWithCors, corsPreflight } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  await clearSession(req)
  if (user) await logActivity({ username: user.username, action: 'LOGOUT' })
  const res = jsonWithCors(req, { ok: true })
  clearSessionCookie(res)
  return res
}
