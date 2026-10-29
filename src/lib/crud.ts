import { NextRequest } from 'next/server'
import { parseListQuery, listMeta, ok, bad } from '@/lib/api'
import { requireUser, sanitizeText, forbidden, unauthorized } from '@/lib/auth'
import { logActivity } from '@/lib/log'

/**
 * کارخانه‌ی CRUD برای ماژول‌های محتوا.
 * همه‌ی مسیرها: بررسی نشست + نقش، جست‌وجو، صفحه‌بندی، اعتبارسنجی، گزارش فعالیت.
 */

type Delegate = any

export type CrudConfig = {
  module: string
  delegate: Delegate
  searchFields: string[]
  /** اعتبارسنجی و پاک‌سازی بدنه؛ رشته‌ی بازگشتی = پیام خطا */
  validate: (body: Record<string, unknown>, isCreate: boolean) => Record<string, unknown> | string
  label: (item: any) => string
}

function buildWhere(cfg: CrudConfig, q: string) {
  if (!q) return undefined
  return {
    OR: cfg.searchFields.map((f) => ({ [f]: { contains: q } })),
  } as any
}

export function makeListHandler(cfg: CrudConfig) {
  return async function GET(req: NextRequest) {
    const user = await requireUser(req, cfg.module)
    if (!user) {
      const s = await requireUser(req)
      return s ? forbidden() : unauthorized()
    }
    const { q, page, pageSize } = parseListQuery(req)
    const where = buildWhere(cfg, q)
    const [items, total] = await Promise.all([
      cfg.delegate.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      cfg.delegate.count({ where }),
    ])
    return ok({ items, ...listMeta(total, { q, page, pageSize }) })
  }
}

export function makeCreateHandler(cfg: CrudConfig) {
  return async function POST(req: NextRequest) {
    const user = await requireUser(req, cfg.module)
    if (!user) {
      const s = await requireUser(req)
      return s ? forbidden() : unauthorized()
    }
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return bad('بدنه‌ی درخواست نامعتبر است.')
    }
    const validated = cfg.validate(body, true)
    if (typeof validated === 'string') return bad(validated)
    const item = await cfg.delegate.create({ data: validated })
    await logActivity({
      username: user.username,
      action: 'CREATE',
      entity: cfg.module,
      entityId: item.id,
      detail: cfg.label(item),
    })
    return ok({ item }, { status: 201 })
  }
}

export function makeUpdateHandler(cfg: CrudConfig) {
  return async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const user = await requireUser(req, cfg.module)
    if (!user) {
      const s = await requireUser(req)
      return s ? forbidden() : unauthorized()
    }
    const { id } = await ctx.params
    const existing = await cfg.delegate.findUnique({ where: { id } })
    if (!existing) return bad('مورد مورد نظر پیدا نشد.', 404)
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return bad('بدنه‌ی درخواست نامعتبر است.')
    }
    const validated = cfg.validate(body, false)
    if (typeof validated === 'string') return bad(validated)
    const item = await cfg.delegate.update({ where: { id }, data: validated })
    await logActivity({
      username: user.username,
      action: 'UPDATE',
      entity: cfg.module,
      entityId: id,
      detail: cfg.label(item),
    })
    return ok({ item })
  }
}

export function makeDeleteHandler(cfg: CrudConfig) {
  return async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const user = await requireUser(req, cfg.module)
    if (!user) {
      const s = await requireUser(req)
      return s ? forbidden() : unauthorized()
    }
    const { id } = await ctx.params
    const existing = await cfg.delegate.findUnique({ where: { id } })
    if (!existing) return bad('مورد مورد نظر پیدا نشد.', 404)
    await cfg.delegate.delete({ where: { id } })
    await logActivity({
      username: user.username,
      action: 'DELETE',
      entity: cfg.module,
      entityId: id,
      detail: cfg.label(existing),
    })
    return ok({ ok: true })
  }
}

/** پاک‌سازی متن مشترک */
export function txt(body: Record<string, unknown>, key: string, maxLen = 2000, fallback = ''): string {
  const v = body[key]
  if (v === undefined || v === null) return fallback
  return sanitizeText(v, maxLen)
}
