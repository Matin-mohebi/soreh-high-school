import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { jsonWithCors, corsPreflight } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return jsonWithCors(req, { user: null })
  return jsonWithCors(req, { user })
}
