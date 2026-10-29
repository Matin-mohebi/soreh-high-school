'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, DAY_NAMES } from '@/lib/client'
import { PageHeader, Loading, useConfirm } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Save } from 'lucide-react'

type Row = { day: number; time: string; subject: string; teacher: string }

/** ویرایشگر برنامه هفتگی */
export function ScheduleView() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState('')
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    try {
      const d = await api<{ items: (Row & { id: string; order: number })[] }>('/api/schedule')
      setRows(d.items.map((r) => ({ day: r.day, time: r.time, subject: r.subject, teacher: r.teacher })))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function addRow(day: number) {
    setRows((s) => [...(s ?? []), { day, time: '', subject: '', teacher: '' }])
  }
  function patch(index: number, patch: Partial<Row>) {
    setRows((s) => (s ?? []).map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  function removeRow(index: number) {
    setRows((s) => (s ?? []).filter((_, i) => i !== index))
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api('/api/schedule', { method: 'PUT', body: { rows } })
      setSavedAt(new Date().toLocaleTimeString('fa-IR'))
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!rows) return <Loading />

  return (
    <div>
      <PageHeader
        title="برنامه هفتگی"
        desc="جدول برنامه‌ی کلاس‌ها؛ پس از انتشار در صفحه‌ی «برنامه هفتگی» سایت نمایش داده می‌شود."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save className="ml-1 h-4 w-4" /> {saving ? 'در حال ذخیره…' : 'ذخیره‌ی برنامه'}
          </Button>
        }
      />

      {error && <p className="mb-3 text-sm font-bold text-destructive">{error}</p>}
      {savedAt && !error && <p className="mb-3 text-sm font-bold text-emerald-600">ذخیره شد ({savedAt}).</p>}

      <div className="space-y-4">
        {DAY_NAMES.map((dayName, day) => {
          const dayRows = rows.map((r, i) => ({ ...r, _i: i })).filter((r) => r.day === day)
          return (
            <div key={dayName} className="soreh-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-extrabold">{dayName}</h3>
                <Button variant="outline" size="sm" onClick={() => addRow(day)}>
                  <Plus className="ml-1 h-3.5 w-3.5" /> ردیف
                </Button>
              </div>
              {dayRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">ردیفی برای این روز ثبت نشده است.</p>
              ) : (
                <div className="grid gap-2">
                  {dayRows.map((r) => (
                    <div key={r._i} className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2">
                      <Input value={r.time} onChange={(e) => patch(r._i, { time: e.target.value })} placeholder="۰۸:۰۰–۰۹:۳۰" dir="ltr" className="text-center text-xs" />
                      <Input value={r.subject} onChange={(e) => patch(r._i, { subject: e.target.value })} placeholder="درس" />
                      <Input value={r.teacher} onChange={(e) => patch(r._i, { teacher: e.target.value })} placeholder="دبیر" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeRow(r._i)} aria-label="حذف ردیف">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {confirmDialog}
    </div>
  )
}
