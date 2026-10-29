'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { PageHeader, Loading, EmptyState, useConfirm } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, GripVertical, Plus, Check } from 'lucide-react'

type MenuItem = { id: string; label: string; href: string; order: number }

/** مدیریت منوی ناوبری سایت */
export function MenuView() {
  const [items, setItems] = useState<MenuItem[] | null>(null)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState({ label: '', href: '' })
  const [saving, setSaving] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    try {
      const d = await api<{ items: MenuItem[] }>('/api/menu')
      setItems(d.items)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!draft.label.trim() || !draft.href.trim()) return
    setSaving(true)
    try {
      await api('/api/menu', { method: 'POST', body: draft })
      setDraft({ label: '', href: '' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function update(item: MenuItem, patch: Partial<MenuItem>) {
    try {
      await api(`/api/menu/${item.id}`, { method: 'PUT', body: { ...item, ...patch } })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function remove(item: MenuItem) {
    confirm('حذف اطمینانی', `آیتم «${item.label}» از منوی سایت حذف شود؟`, async () => {
      try {
        await api(`/api/menu/${item.id}`, { method: 'DELETE' })
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  async function move(index: number, dir: -1 | 1) {
    if (!items) return
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    setSaving(true)
    try {
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) {
          await api(`/api/menu/${reordered[i].id}`, { method: 'PUT', body: { ...reordered[i], order: i } })
        }
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (error && !items) return <p className="p-4 text-sm font-bold text-destructive">{error}</p>
  if (!items) return <Loading />

  return (
    <div>
      <PageHeader
        title="منوی سایت"
        desc="ترتیب و فهرست پیوندهای ناوبری در بالای همه‌ی صفحه‌های سایت. برای جابه‌جایی از دکمه‌های ▲▼ استفاده کنید."
      />

      <div className="soreh-card mb-4 grid gap-2 p-4 sm:grid-cols-[1fr_1.4fr_auto]">
        <Input value={draft.label} onChange={(e) => setDraft((s) => ({ ...s, label: e.target.value }))} placeholder="برچسب (مثلا: تماس با ما)" />
        <Input value={draft.href} onChange={(e) => setDraft((s) => ({ ...s, href: e.target.value }))} dir="ltr" placeholder="./news.html یا ./index.html#about" />
        <Button onClick={add} disabled={saving || !draft.label.trim() || !draft.href.trim()}>
          <Plus className="ml-1 h-4 w-4" /> افزودن
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="منو خالی است" desc="منوی پیش‌فرض سایت تا زمانی که آیتمی اضافه کنید نمایش داده می‌شود." />
      ) : (
        <div className="space-y-2">
          {items.map((m, i) => (
            <div key={m.id} className="soreh-card flex flex-wrap items-center gap-2 p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input
                defaultValue={m.label}
                onBlur={(e) => e.target.value !== m.label && update(m, { label: e.target.value })}
                className="w-40"
                aria-label="برچسب"
              />
              <Input
                defaultValue={m.href}
                onBlur={(e) => e.target.value !== m.href && update(m, { href: e.target.value })}
                dir="ltr"
                className="w-64 flex-1"
                aria-label="آدرس"
              />
              <div className="flex items-center gap-1" dir="ltr">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="بالا">
                  ▲
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="پایین">
                  ▼
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(m)}>
                <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
              </Button>
            </div>
          ))}
          {error && <p className="text-sm font-bold text-destructive">{error}</p>}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> ویرایش‌ها با خروج از کادر متن ذخیره می‌شوند.
          </p>
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
