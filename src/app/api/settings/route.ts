import { NextRequest } from 'next/server'
import { ok, bad } from '@/lib/api'
import { requireUser, unauthorized, forbidden, sanitizeText } from '@/lib/auth'
import { getSettings, putSettings, SETTING_DEFAULTS } from '@/lib/settings'
import { logActivity } from '@/lib/log'

export const dynamic = 'force-dynamic'

/** تنظیمات سایت — فقط مدیر کل (ADMIN) */
export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  return ok({ settings: await getSettings() })
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'ADMIN') return forbidden()
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return bad('بدنه‌ی درخواست نامعتبر است.')
  }
  const incoming = (body.settings ?? body) as Record<string, unknown>
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(incoming)) {
    if (!(k in SETTING_DEFAULTS)) continue
    clean[k] = sanitizeText(v, 20000)
  }
  const keys = await putSettings(clean)
  if (!keys.length) return bad('هیچ تنظیم معتبری برای ذخیره ارسال نشد.')
  await logActivity({
    username: user.username, action: 'UPDATE', entity: 'settings',
    detail: `${keys.length} تنظیم ذخیره شد`,
  })
  return ok({ settings: await getSettings() })
}
