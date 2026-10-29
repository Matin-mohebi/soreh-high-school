import { NextRequest, NextResponse } from 'next/server'

/** ابزارهای مشترک مسیرهای API */

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data as object, init)
}

export function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export type ListQuery = {
  q: string
  page: number
  pageSize: number
}

export function parseListQuery(req: NextRequest, defaultPageSize = 10): ListQuery {
  const sp = req.nextUrl.searchParams
  const q = (sp.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') ?? String(defaultPageSize), 10) || defaultPageSize))
  return { q, page, pageSize }
}

export function listMeta(total: number, { page, pageSize }: ListQuery) {
  return { total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

/**
 * CORS برای نقاط پایانی عمومی (فرم تماس و حساب کاربری از دامنه گیت‌هاب‌پیجز)
 * مبدأهای مجاز از متغیر محیطی CORS_ORIGINS (جدا با ویرگول) خوانده می‌شود؛
 * اگر CORS_OPEN=1 باشد همه مبدأها پذیرفته می‌شوند (حالت توسعه/پیش‌نمایش).
 */
export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowList = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  let allow = ''
  if (process.env.CORS_OPEN === '1' || process.env.NODE_ENV !== 'production') {
    allow = origin
  } else if (allowList.includes(origin)) {
    allow = origin
  }
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
  if (allow) {
    headers['Access-Control-Allow-Origin'] = allow
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

export function corsPreflight(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(req),
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export function jsonWithCors(req: NextRequest, data: unknown, status = 200) {
  return NextResponse.json(data as object, { status, headers: corsHeaders(req) })
}
