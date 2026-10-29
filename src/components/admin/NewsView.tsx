'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, faDate, type Paged } from '@/lib/client'
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
import { Plus, Pencil, Trash2, Send, FileEdit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type News = {
  id: string; title: string; excerpt: string; body: string; important: boolean
  status: string; publishedAt: string | null; createdAt: string
}

export function NewsView() {
  const [data, setData] = useState<Paged<News> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<News | null>(null)
  const [form, setForm] = useState({ title: '', excerpt: '', body: '', important: false, status: 'DRAFT' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const { confirm, confirmDialog } = useConfirm()
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<News>>(`/api/news?all=1&page=${page}&pageSize=8${q ? `&q=${encodeURIComponent(q)}` : ''}`))
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
    setEditing({ id: '', title: '', excerpt: '', body: '', important: false, status: 'DRAFT', publishedAt: null, createdAt: '' })
    setForm({ title: '', excerpt: '', body: '', important: false, status: 'DRAFT' })
    setFormError('')
  }
  function openEdit(n: News) {
    setEditing(n)
    setForm({ title: n.title, excerpt: n.excerpt, body: n.body, important: n.important, status: n.status })
    setFormError('')
  }

  async function save(publishNow: boolean) {
    if (!form.title.trim()) {
      setFormError('عنوان خبر را وارد کنید.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, status: publishNow ? 'PUBLISHED' : form.status }
      if (editing?.id) {
        await api(`/api/news/${editing.id}`, { method: 'PUT', body: payload })
      } else {
        await api('/api/news', { method: 'POST', body: payload })
      }
      setEditing(null)
      toast({ title: publishNow ? 'خبر منتشر شد' : 'ذخیره شد', description: publishNow ? 'برای نمایش در سایت، تغییرات را منتشر کنید.' : 'خبر به‌عنوان پیش‌نویس ذخیره شد.' })
      await load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function remove(n: News) {
    confirm('حذف اطمینانی', `خبر «${n.title}» برای همیشه حذف شود؟`, async () => {
      try {
        await api(`/api/news/${n.id}`, { method: 'DELETE' })
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  async function togglePublish(n: News) {
    try {
      await api(`/api/news/${n.id}`, { method: 'PUT', body: { status: n.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="اخبار و اطلاعیه‌ها"
        desc="خبرها و اطلاعیه‌های مدرسه؛ پس از انتشار و اعمال تغییرات، در صفحه‌ی «اخبار» سایت نمایش داده می‌شوند."
        actions={
          <Button onClick={openNew}><Plus className="ml-1 h-4 w-4" /> ثبت خبر</Button>
        }
      />

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجو در خبرها…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'نتیجه‌ای پیدا نشد' : 'هنوز خبری ثبت نشده است'} desc="اولین اطلاعیه‌ی مدرسه را ثبت کنید." />
      ) : (
        <div className="space-y-3">
          {data.items.map((n) => (
            <div key={n.id} className="soreh-card flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold">{n.title}</p>
                  <StatusBadge status={n.status} />
                  {n.important && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">مهم</span>}
                </div>
                {n.excerpt && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{n.excerpt}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.status === 'PUBLISHED' ? `تاریخ انتشار: ${faDate(n.publishedAt)}` : `ایجاد: ${faDate(n.createdAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => togglePublish(n)}>
                  {n.status === 'PUBLISHED' ? (<><FileEdit className="ml-1 h-3.5 w-3.5" /> بازگرداندن به پیش‌نویس</>) : (<><Send className="ml-1 h-3.5 w-3.5" /> انتشار</>)}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(n)}>
                  <Pencil className="ml-1 h-3.5 w-3.5" /> ویرایش
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(n)}>
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
            <DialogTitle>{editing?.id ? 'ویرایش خبر' : 'ثبت خبر جدید'}</DialogTitle>
            <DialogDescription>متن کامل با قالب ساده (پاراگراف، تیتر و فهرست) پشتیبانی می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="عنوان" required error={formError.includes('عنوان') ? formError : undefined}>
              <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="مثلا: اطلاعیه آغاز ثبت‌نام" />
            </Field>
            <Field label="خلاصه (اختیاری)">
              <Input value={form.excerpt} onChange={(e) => setForm((s) => ({ ...s, excerpt: e.target.value }))} placeholder="یک یا دو جمله برای فهرست اخبار" />
            </Field>
            <Field label="متن کامل (اختیاری)">
              <Textarea value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} rows={7} placeholder="متن خبر…" />
            </Field>
            <div className="flex items-center gap-2">
              <Switch checked={form.important} onCheckedChange={(v) => setForm((s) => ({ ...s, important: v }))} id="imp" />
              <label htmlFor="imp" className="text-sm font-bold">نمایش برچسب «مهم»</label>
            </div>
            {formError && !formError.includes('عنوان') && <p className="text-xs font-bold text-destructive">{formError}</p>}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button variant="secondary" onClick={() => save(false)} disabled={saving}>ذخیره‌ی پیش‌نویس</Button>
            <Button onClick={() => save(true)} disabled={saving}><Send className="ml-1 h-4 w-4" /> انتشار</Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
