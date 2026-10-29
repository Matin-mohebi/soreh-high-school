'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, faDate, type Paged } from '@/lib/client'
import { PageHeader, SearchBox, Pagination, useConfirm, Loading, EmptyState } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Mail, MailOpen, Trash2, Reply } from 'lucide-react'

type Msg = {
  id: string; name: string; email: string; phone: string
  subject: string; body: string; read: boolean; createdAt: string
}

export function MessagesView() {
  const [data, setData] = useState<Paged<Msg> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<Msg | null>(null)
  const { confirm, confirmDialog } = useConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<Msg>>(`/api/messages?page=${page}&pageSize=10${q ? `&q=${encodeURIComponent(q)}` : ''}`))
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

  async function openMsg(m: Msg) {
    setOpen(m)
    if (!m.read) {
      try {
        await api(`/api/messages/${m.id}`, { method: 'PATCH', body: { read: true } })
        await load()
      } catch {}
    }
  }

  function remove(m: Msg) {
    confirm('حذف اطمینانی', `پیام «${m.subject}» حذف شود؟`, async () => {
      try {
        await api(`/api/messages/${m.id}`, { method: 'DELETE' })
        if (open?.id === m.id) setOpen(null)
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div>
      <PageHeader
        title="پیام‌های دریافتی"
        desc="پیام‌های ارسال‌شده از فرم «تماس با ما» در سایت."
      />

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجو در پیام‌ها…" />
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="p-4 text-sm font-bold text-destructive">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'پیامی پیدا نشد' : 'پیامی دریافت نشده است'} desc="پیام‌های فرم تماس سایت اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="space-y-2">
          {data.items.map((m) => (
            <button
              key={m.id}
              onClick={() => openMsg(m)}
              className={`soreh-card flex w-full flex-wrap items-center gap-3 p-4 text-right transition hover:-translate-y-0.5 ${!m.read ? 'border-r-4 border-r-[#2189d2]' : ''}`}
            >
              {m.read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-[#2189d2]" />}
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{m.subject} {!m.read && <span className="mr-1 inline-block rounded bg-[#2189d2] px-1.5 text-[10px] text-white">جدید</span>}</p>
                <p className="text-xs text-muted-foreground">{m.name} — {faDate(m.createdAt)}</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); remove(m) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); remove(m) } }}
                aria-label={`حذف پیام ${m.subject}`}
              >
                <Trash2 className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="soreh-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">{open.subject}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              از {open.name}
              {open.email && <> — <span dir="ltr">{open.email}</span></>}
              {open.phone && <> — <span dir="ltr">{open.phone}</span></>}
              — {faDate(open.createdAt)}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{open.body}</p>
            <div className="mt-5 flex gap-2">
              {open.email && (
                <Button variant="secondary" size="sm" asChild>
                  <a href={`mailto:${open.email}`}><Reply className="ml-1 h-3.5 w-3.5" /> پاسخ با ایمیل</a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(null)}>بستن</Button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
