'use client'

/** ابزارهای سمت کلاینت داشبورد */

export async function api<T = unknown>(
  url: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'خطای غیرمنتظره در ارتباط با سرور')
  }
  return data as T
}

export type Paged<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  pages: number
}

export type SessionUser = {
  id: string
  username: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'SUBSCRIBER'
}

export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

export const faNum = (n: number) => faDigits(n.toLocaleString('en-US'))

export function faDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'مدیر کل',
  EDITOR: 'ویراستار محتوا',
  SUBSCRIBER: 'کاربر عادی',
}

export const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه']
