'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, faDate, type Paged } from '@/lib/client'
import { PageHeader, SearchBox, Pagination, Loading, EmptyState } from '@/components/admin/shared'

type Log = {
  id: string; username: string; action: string; entity: string
  entityId: string; detail: string; createdAt: string
}

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'ورود', LOGIN_FAILED: 'ورود ناموفق', LOGOUT: 'خروج', CREATE: 'ایجاد',
  UPDATE: 'ویرایش', DELETE: 'حذف', PUBLISH: 'انتشار', UPLOAD: 'بارگذاری',
  REGISTER: 'ثبت‌نام', SEED: 'بذرگذاری',
}
const ENTITY_LABEL: Record<string, string> = {
  staff: 'مدیر و معاونان', students: 'دانش‌آموزان برتر', news: 'خبر', page: 'برگه',
  menu: 'منو', settings: 'تنظیمات', media: 'رسانه', user: 'کاربر', message: 'پیام',
  schedule: 'برنامه هفتگی', site: 'سایت', database: 'پایگاه‌داده',
}

export function LogsView() {
  const [data, setData] = useState<Paged<Log> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<Log>>(`/api/logs?page=${page}&pageSize=15${q ? `&q=${encodeURIComponent(q)}` : ''}`))
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

  return (
    <div>
      <PageHeader
        title="گزارش فعالیت"
        desc="تمام تغییرات مهم مدیریتی همراه با کاربر و زمان؛ برای شفافیت و ردیابی."
      />
      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجو در رویدادها…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'رویدادی پیدا نشد' : 'هنوز رویدادی ثبت نشده است'} />
      ) : (
        <div className="soreh-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="p-3 text-right font-bold">رویداد</th>
                <th className="p-3 text-right font-bold">کاربر</th>
                <th className="p-3 text-right font-bold">جزئیات</th>
                <th className="p-3 text-left font-bold">زمان</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      l.action.includes('FAILED') || l.action === 'DELETE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : l.action === 'PUBLISH' || l.action === 'CREATE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'}`}>
                      {ACTION_LABEL[l.action] ?? l.action}
                    </span>
                  </td>
                  <td className="p-3 text-xs" dir="ltr">{l.username || '—'}</td>
                  <td className="p-3 text-xs">
                    {l.entity && <span className="font-bold">{ENTITY_LABEL[l.entity] ?? l.entity}</span>}
                    {l.detail && <span className="text-muted-foreground"> — {l.detail}</span>}
                  </td>
                  <td className="p-3 text-left text-xs text-muted-foreground">{faDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  )
}
