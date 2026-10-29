'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, type Paged } from '@/lib/client'
import {
  PageHeader, SearchBox, Pagination, useConfirm, Field, Loading, EmptyState, StatusBadge,
} from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'

type Page = {
  id: string; title: string; slug: string; body: string
  showInNav: boolean; status: string; order: number
}

export function PagesView() {
  const [data, setData] = useState<Paged<Page> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Page | null>(null)
  const [form, setForm] = useState({ title: '', slug: '', body: '', showInNav: false, status: 'PUBLISHED', order: 0 })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<Page>>(`/api/pages?page=${page}&pageSize=10${q ? `&q=${encodeURIComponent(q)}` : ''}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [page, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  function openNew() {
    setEditing({ id: '', title: '', slug: '', body: '', showInNav: false, status: 'PUBLISHED', order: 0 })
    setForm({ title: '', slug: '', body: '', showInNav: false, status: 'PUBLISHED', order: 0 })
    setFormError('')
  }
  function openEdit(p: Page) {
    setEditing(p)
    setForm({ title: p.title, slug: p.slug, body: p.body, showInNav: p.showInNav, status: p.status, order: p.order })
    setFormError('')
  }

  async function save() {
    if (!form.title.trim()) { setFormError('عنوان برگه را وارد کنید.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing?.id) {
        await api(`/api/pages/${editing.id}`, { method: 'PUT', body: form })
      } else {
        await api('/api/pages', { method: 'POST', body: form })
      }
      setEditing(null)
      await load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function remove(p: Page) {
    confirm('حذف اطمینانی', `برگه‌ی «${p.title}» حذف شود؟`, async () => {
      try {
        await api(`/api/pages/${p.id}`, { method: 'DELETE' })
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div>
      <PageHeader
        title="برگه‌های سایت"
        desc="برگه‌های ایستا مانند «درباره ما» یا «قوانین مدرسه». برگه‌های فعال در نشانی page.html?slug=نامک نمایش داده می‌شوند."
        actions={<Button onClick={openNew}><Plus className="ml-1 h-4 w-4" /> برگه‌ی جدید</Button>}
      />

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجوی عنوان یا نامک…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'نتیجه‌ای پیدا نشد' : 'هنوز برگه‌ای ساخته نشده است'} desc="می‌توانید برگه‌هایی مثل «درباره مدرسه» بسازید و در منو قرار دهید." />
      ) : (
        <div className="space-y-3">
          {data.items.map((p) => (
            <div key={p.id} className="soreh-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold">{p.title}</p>
                  <StatusBadge status={p.status} />
                  {p.showInNav && <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">در منو</span>}
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">page.html?slug={p.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/site/page.html?slug=${encodeURIComponent(p.slug)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="ml-1 h-3.5 w-3.5" /> پیش‌نمایش
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="ml-1 h-3.5 w-3.5" /> ویرایش
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(p)}>
                  <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'ویرایش برگه' : 'برگه‌ی جدید'}</DialogTitle>
            <DialogDescription>نامک (slug) همان نشانی برگه در سایت است.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="عنوان" required error={formError.includes('عنوان') ? formError : undefined}>
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="مثلا: درباره دبیرستان سوره" />
            </Field>
            <Field label="نامک (انگلیسی، بدون فاصله)">
              <Input value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} dir="ltr" placeholder="about" />
            </Field>
            <Field label="محتوا">
              <Textarea value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} rows={8} placeholder="متن برگه…" />
            </Field>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="nav" checked={form.showInNav} onCheckedChange={(v) => setForm((s) => ({ ...s, showInNav: v }))} />
                <label htmlFor="nav" className="text-sm font-bold">نمایش فهرست برگه‌ها</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="pub" checked={form.status === 'PUBLISHED'} onCheckedChange={(v) => setForm((s) => ({ ...s, status: v ? 'PUBLISHED' : 'DRAFT' }))} />
                <label htmlFor="pub" className="text-sm font-bold">منتشر شده</label>
              </div>
            </div>
            {formError && !formError.includes('عنوان') && <p className="text-xs font-bold text-destructive">{formError}</p>}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
