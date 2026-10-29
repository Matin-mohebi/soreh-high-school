import { NextRequest } from 'next/server'
import { jsonWithCors, corsPreflight, bad } from '@/lib/api'
import { db } from '@/lib/db'
import { sanitizeText } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** فرم تماس عمومی سایت — پیام‌ها در پایگاه‌داده ذخیره و از داشبورد خوانده می‌شوند */

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
  const email = sanitizeText(body.email, 120)
  const phone = sanitizeText(body.phone, 30)
  const subject = sanitizeText(body.subject, 150)
  const message = sanitizeText(body.body, 4000)

  if (!name || name.length < 2) return jsonWithCors(req, { error: 'نام خود را وارد کنید.' }, 400)
  if (!subject) return jsonWithCors(req, { error: 'موضوع پیام را وارد کنید.' }, 400)
  if (!message || message.length < 5) return jsonWithCors(req, { error: 'متن پیام را کامل‌تر بنویسید.' }, 400)

  // محدودیت ساده: حداکثر ۵ پیام در دقیقه برای هر نام
  const recent = await db.message.count({
    where: { name, createdAt: { gte: new Date(Date.now() - 60_000) } },
  })
  if (recent >= 5) return jsonWithCors(req, { error: 'تعداد پیام‌های ارسالی زیاد است؛ کمی بعد تلاش کنید.' }, 429)

  await db.message.create({ data: { name, email, phone, subject, body: message } })
  return jsonWithCors(req, { ok: true }, 201)
}
