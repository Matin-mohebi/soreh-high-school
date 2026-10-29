'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft, ChevronRight, Search, X, ImageIcon,
} from 'lucide-react'
import { faDigits } from '@/lib/client'

/** سرصفحه‌ی هر ماژول */
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold md:text-2xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** جعبه‌ی جست‌وجو */
export function SearchBox({ value, onChange, placeholder = 'جست‌وجو…' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-9 pl-8"
        aria-label="جست‌وجو"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="پاک کردن جست‌وجو"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/** صفحه‌بندی */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-2" dir="ltr">
      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="صفحه قبل">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <span className="min-w-20 text-center text-sm font-bold">
        {faDigits(page)} / {faDigits(pages)}
      </span>
      <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="صفحه بعد">
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  )
}

/** گفت‌وگوی تایید عملیات مخرب */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean; title: string; desc: string; onYes: () => void; danger: boolean
  }>({ open: false, title: '', desc: '', onYes: () => {}, danger: true })

  const confirm = (title: string, desc: string, onYes: () => void, danger = true) =>
    setState({ open: true, title, desc, onYes, danger })

  const element = (
    <Dialog open={state.open} onOpenChange={(o) => !o && setState((s) => ({ ...s, open: false }))}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>{state.desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setState((s) => ({ ...s, open: false }))}>
            انصراف
          </Button>
          <Button
            variant={state.danger ? 'destructive' : 'default'}
            onClick={() => { state.onYes(); setState((s) => ({ ...s, open: false })) }}
          >
            تایید و انجام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { confirm, confirmDialog: element }
}

/** انتخاب عکس از کتابخانه رسانه یا ورود دستی نشانی */
export function PhotoPicker({ value, onChange, mediaUrl }: {
  value: string
  onChange: (v: string) => void
  mediaUrl: string
}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<{ id: string; filename: string; originalName: string; mime: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`${mediaUrl}?pageSize=60${q ? `&q=${encodeURIComponent(q)}` : ''}`)
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [open, q, mediaUrl])

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="thumb-box">
          {value ? <img src={value} alt="پیش‌نمایش" /> : <ImageIcon className="h-6 w-6" />}
        </div>
        <div className="flex-1 space-y-1.5">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="نشانی عکس (اختیاری)" dir="ltr" className="text-xs" />
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            انتخاب از کتابخانه رسانه
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>انتخاب از کتابخانه رسانه</DialogTitle>
            <DialogDescription>برای بارگذاری عکس جدید، ابتدا از ماژول «کتابخانه رسانه» آن را آپلود کنید.</DialogDescription>
          </DialogHeader>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی نام فایل…" />
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">در حال بارگذاری…</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">فایلی پیدا نشد.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="group overflow-hidden rounded-lg border"
                    onClick={() => { onChange(`/api/media/file/${m.filename}`); setOpen(false) }}
                    title={m.originalName}
                  >
                    {m.mime.startsWith('image/') ? (
                      <img src={`/api/media/file/${m.filename}`} alt={m.originalName} className="h-20 w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="grid h-20 w-full place-items-center text-xs">{m.originalName}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** نشان وضعیت */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: 'منتشر شده', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    DRAFT: { label: 'پیش‌نویس', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' }
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
}

/** فیلد فرم با برچسب و خطا */
export function Field({ label, error, children, required }: {
  label: string; error?: string; children: ReactNode; required?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold">
        {label}
        {required && <span className="mr-1 text-destructive">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs font-semibold text-destructive">{error}</span>}
    </label>
  )
}

/** حالت خالی */
export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="soreh-card flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-extrabold">{title}</p>
      {desc && <p className="max-w-md text-sm text-muted-foreground">{desc}</p>}
      {action}
    </div>
  )
}

/** اسپینر بارگذاری */
export function Loading({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </div>
  )
}
