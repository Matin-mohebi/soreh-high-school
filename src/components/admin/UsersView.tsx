'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, faDate, ROLE_LABEL, type Paged } from '@/lib/client'
import { PageHeader, SearchBox, Pagination, useConfirm, Field, Loading, EmptyState } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react'

type User = { id: string; username: string; email: string; name: string; role: string; createdAt: string }

export function UsersView({ currentUserId }: { currentUserId: string }) {
  const [data, setData] = useState<Paged<User> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'SUBSCRIBER' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<User>>(`/api/users?page=${page}&pageSize=10${q ? `&q=${encodeURIComponent(q)}` : ''}`))
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
    setEditing({ id: '', username: '', email: '', name: '', role: 'SUBSCRIBER', createdAt: '' })
    setForm({ name: '', username: '', email: '', password: '', role: 'SUBSCRIBER' })
    setFormError('')
  }
  function openEdit(u: User) {
    setEditing(u)
    setForm({ name: u.name, username: u.username, email: u.email, password: '', role: u.role })
    setFormError('')
  }

  async function save() {
    if (!editing?.id && form.password.length < 8) { setFormError('رمز عبور باید حداقل ۸ کاراکتر باشد.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing?.id) {
        const payload: Record<string, unknown> = { name: form.name, email: form.email, role: form.role }
        if (form.password) payload.password = form.password
        await api(`/api/users/${editing.id}`, { method: 'PUT', body: payload })
      } else {
        await api('/api/users', { method: 'POST', body: form })
      }
      setEditing(null)
      await load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function remove(u: User) {
    confirm('حذف اطمینانی', `حساب «${u.username}» حذف شود؟ نشست‌های فعال او بسته می‌شود.`, async () => {
      try {
        await api(`/api/users/${u.id}`, { method: 'DELETE' })
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div>
      <PageHeader
        title="کاربران و دسترسی‌ها"
        desc="مدیر کل: دسترسی کامل — ویراستار محتوا: مدیریت محتوا بدون تنظیمات و انتشار — کاربر عادی: فقط حساب عمومی سایت."
        actions={<Button onClick={openNew}><Plus className="ml-1 h-4 w-4" /> کاربر جدید</Button>}
      />

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجوی نام کاربری، نام یا ایمیل…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'نتیجه‌ای پیدا نشد' : 'کاربری پیدا نشد'} />
      ) : (
        <div className="soreh-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="p-3 text-right font-bold">کاربر</th>
                <th className="p-3 text-right font-bold">نقش</th>
                <th className="p-3 text-right font-bold">تاریخ عضویت</th>
                <th className="p-3 text-left font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-bold">{u.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{u.username} — {u.email}</p>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.role === 'ADMIN' ? 'bg-[#0a2347] text-white dark:bg-[#1c3d5f]' : u.role === 'EDITOR' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' : 'bg-muted text-muted-foreground'}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                    {u.id === currentUserId && <span className="mr-1 text-[10px] text-muted-foreground">(شما)</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{faDate(u.createdAt)}</td>
                  <td className="p-3 text-left">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="ml-1 h-3.5 w-3.5" /> ویرایش
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                      disabled={u.id === currentUserId}
                      onClick={() => remove(u)}
                      title={u.id === currentUserId ? 'حساب خودتان قابل حذف نیست' : undefined}
                    >
                      <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'ویرایش کاربر' : 'کاربر جدید'}</DialogTitle>
            <DialogDescription>نقش‌ها: مدیر کل (همه‌ی دسترسی‌ها)، ویراستار محتوا (مدیریت محتوا)، کاربر عادی (حساب عمومی سایت).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="نام و نام خانوادگی">
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            {!editing?.id && (
              <Field label="نام کاربری (انگلیسی)" required>
                <Input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} dir="ltr" />
              </Field>
            )}
            <Field label="ایمیل" required>
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} dir="ltr" type="email" />
            </Field>
            <Field label="نقش">
              <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v }))} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">مدیر کل</SelectItem>
                  <SelectItem value="EDITOR">ویراستار محتوا</SelectItem>
                  <SelectItem value="SUBSCRIBER">کاربر عادی</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={editing?.id ? 'رمز عبور جدید (برای تغییر پر کنید)' : 'رمز عبور (حداقل ۸ کاراکتر)'} required={!editing?.id}>
              <Input value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} dir="ltr" type="password" autoComplete="new-password" />
            </Field>
            {formError && <p className="text-xs font-bold text-destructive">{formError}</p>}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={save} disabled={saving}>
              {editing?.id ? (<><KeyRound className="ml-1 h-4 w-4" /> ذخیره</>) : 'ایجاد کاربر'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
