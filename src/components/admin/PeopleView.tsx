'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, faNum, type Paged } from '@/lib/client'
import {
  PageHeader, SearchBox, Pagination, useConfirm, PhotoPicker, Field, Loading, EmptyState,
} from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, PackageOpen } from 'lucide-react'

/**
 * ماژول عمومی افراد — مدیر و معاونان (staff) و دانش‌آموزان برتر (students)
 * معادل انواع محتوای سفارشی staff و student در قالب وردپرس اصلی.
 */

type Person = {
  id: string; name: string; role?: string; bio?: string; rank?: string;
  grade?: string; note?: string; photoUrl: string; order: number
}

type FieldDef = {
  key: 'role' | 'bio' | 'rank' | 'grade' | 'note'
  label: string
  placeholder: string
  textarea?: boolean
}

export function PeopleView({ kind }: { kind: 'staff' | 'students' }) {
  const isStaff = kind === 'staff'
  const endpoint = isStaff ? '/api/staff' : '/api/students'
  const extraFields: FieldDef[] = isStaff
    ? [
        { key: 'role', label: 'سمت', placeholder: 'مثلا: معاون آموزشی' },
        { key: 'bio', label: 'توضیح کوتاه', placeholder: 'چند خط درباره این عضو…', textarea: true },
      ]
    : [
        { key: 'rank', label: 'رتبه', placeholder: 'مثلا: ۱' },
        { key: 'grade', label: 'پایه', placeholder: 'مثلا: دهم ریاضی' },
        { key: 'note', label: 'نکته کوتاه', placeholder: 'مثلا: برتر المپیاد ریاضی', textarea: true },
      ]

  const [data, setData] = useState<Paged<Person> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Person | null>(null)
  const [form, setForm] = useState({ name: '', photoUrl: '', order: 0 } as Record<string, string | number>)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await api<Paged<Person>>(`${endpoint}?page=${page}&pageSize=10${q ? `&q=${encodeURIComponent(q)}` : ''}`)
      setData(d)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  function openNew() {
    setEditing({ id: '', name: '', photoUrl: '', order: (data?.items.length ?? 0) } as Person)
    setForm({ name: '', photoUrl: '', order: data?.items.length ?? 0 })
    for (const f of extraFields) if (form[f.key] === undefined) setForm((s) => ({ ...s, [f.key]: '' }))
    setFormError('')
  }
  function openEdit(p: Person) {
    setEditing(p)
    setForm({ name: p.name, photoUrl: p.photoUrl, order: p.order, ...(p.role !== undefined ? { role: p.role } : {}), ...(p.bio !== undefined ? { bio: p.bio } : {}), ...(p.rank !== undefined ? { rank: p.rank } : {}), ...(p.grade !== undefined ? { grade: p.grade } : {}), ...(p.note !== undefined ? { note: p.note } : {}) })
    setFormError('')
  }

  async function save() {
    if (!String(form.name ?? '').trim()) {
      setFormError('نام را وارد کنید.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (editing?.id) {
        await api(`${endpoint}/${editing.id}`, { method: 'PUT', body: payload })
      } else {
        await api(endpoint, { method: 'POST', body: payload })
      }
      setEditing(null)
      await load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function remove(p: Person) {
    confirm(
      'حذف اطمینانی',
      `«${p.name}» برای همیشه حذف شود؟ این عملیات بازگشت‌پذیر نیست.`,
      async () => {
        try {
          await api(`${endpoint}/${p.id}`, { method: 'DELETE' })
          await load()
        } catch (e) {
          setError((e as Error).message)
        }
      }
    )
  }

  return (
    <div>
      <PageHeader
        title={isStaff ? 'مدیر و معاونان' : 'دانش‌آموزان برتر'}
        desc={isStaff
          ? 'همان بخشی که در صفحه‌ی اصلی سایت نمایش داده می‌شود (معادل نوع محتوای staff در قالب اصلی).'
          : 'برترین‌های کلاس که در صفحه‌ی اصلی سایت نمایش داده می‌شوند (معادل نوع محتوای student).'}
        actions={
          <Button onClick={openNew}>
            <Plus className="ml-1 h-4 w-4" /> {isStaff ? 'افزودن عضو' : 'افزودن دانش‌آموز'}
          </Button>
        }
      />

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجوی نام یا توضیحات…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={q ? 'نتیجه‌ای پیدا نشد' : 'هنوز موردی ثبت نشده است'}
          desc={q ? 'عبارت دیگری را امتحان کنید.' : 'با دکمه‌ی افزودن، اولین مورد را ثبت کنید تا در سایت نمایش داده شود.'}
          action={!q ? <Button onClick={openNew} variant="outline" size="sm"><PackageOpen className="ml-1 h-4 w-4" /> شروع کنید</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((p) => (
            <div key={p.id} className="soreh-card flex gap-3 p-4">
              <div className="thumb-box shrink-0">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} /> : <span className="text-xl font-extrabold">{p.name.slice(0, 1)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{p.name}</p>
                {isStaff && p.role && <p className="text-xs font-bold text-primary">{p.role}</p>}
                {!isStaff && (p.rank || p.grade) && (
                  <p className="text-xs font-bold text-primary">{[p.rank, p.grade].filter(Boolean).join(' — ')}</p>
                )}
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {isStaff ? p.bio : p.note || p.grade}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="ml-1 h-3.5 w-3.5" /> ویرایش
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(p)}>
                    <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
                  </Button>
                  <span className="mr-auto text-[10px] text-muted-foreground">ترتیب: {faNum(p.order)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'ویرایش' : 'افزودن'} {isStaff ? 'عضو مدیریت' : 'دانش‌آموز برتر'}</DialogTitle>
            <DialogDescription>این اطلاعات پس از انتشار، در صفحه‌ی اصلی سایت نمایش داده می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="نام و نام خانوادگی" required error={formError.includes('نام') ? formError : undefined}>
              <Input value={String(form.name ?? '')} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="مثلا: سارا محمدی" />
            </Field>
            {extraFields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.textarea ? (
                  <Textarea value={String(form[f.key] ?? '')} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3} />
                ) : (
                  <Input value={String(form[f.key] ?? '')} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                )}
              </Field>
            ))}
            <Field label="عکس">
              <PhotoPicker value={String(form.photoUrl ?? '')} onChange={(v) => setForm((s) => ({ ...s, photoUrl: v }))} mediaUrl="/api/media" />
            </Field>
            <Field label="ترتیب نمایش">
              <Input type="number" min={0} value={Number(form.order ?? 0)} onChange={(e) => setForm((s) => ({ ...s, order: Number(e.target.value) }))} dir="ltr" className="w-28" />
            </Field>
            {formError && !formError.includes('نام') && <p className="text-xs font-bold text-destructive">{formError}</p>}
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
