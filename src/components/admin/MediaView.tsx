'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, faDate, faNum, type Paged } from '@/lib/client'
import { PageHeader, SearchBox, Pagination, useConfirm, Loading, EmptyState } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Upload, Trash2, Download, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Media = { id: string; filename: string; originalName: string; mime: string; size: number; createdAt: string }

const MAX_SIZE = 8 * 1024 * 1024

export function MediaView() {
  const [data, setData] = useState<Paged<Media> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { confirm, confirmDialog } = useConfirm()
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api<Paged<Media>>(`/api/media?page=${page}&pageSize=24${q ? `&q=${encodeURIComponent(q)}` : ''}`))
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

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
          throw new Error(`«${file.name}» بزرگ‌تر از ۸ مگابایت است.`)
        }
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/media', { method: 'POST', body: fd })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(d.error || 'بارگذاری انجام نشد.')
      }
      toast({ title: 'بارگذاری انجام شد' })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function remove(m: Media) {
    confirm('حذف اطمینانی', `فایل «${m.originalName}» حذف شود؟ اگر در محتوایی استفاده شده باشد، تصویر آن بخش خالی می‌شود.`, async () => {
      try {
        await api(`/api/media/${m.id}`, { method: 'DELETE' })
        await load()
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  function copyUrl(m: Media) {
    const url = `${location.origin}/api/media/file/${m.filename}`
    navigator.clipboard.writeText(url).then(
      () => toast({ title: 'نشانی کپی شد', description: url }),
      () => setError('کپی نشانی انجام نشد.')
    )
  }

  return (
    <div>
      <PageHeader
        title="کتابخانه رسانه"
        desc="عکس‌ها و فایل‌های قابل دانلود مدرسه. فایل‌های تصویری می‌توانند عکس اعضا و دانش‌آموزان باشند."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,application/zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain"
              onChange={(e) => upload(e.target.files)}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="ml-1 h-4 w-4" /> {uploading ? 'در حال بارگذاری…' : 'بارگذاری فایل'}
            </Button>
          </>
        }
      />

      <div
        className={`mb-4 rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? 'border-[#2189d2] bg-[#e8f3fd]' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files) }}
        role="button"
        aria-label="ناحیه‌ی بارگذاری فایل"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-bold">فایل را اینجا بکشید یا کلیک کنید</p>
        <p className="mt-1 text-xs text-muted-foreground">حداکثر ۸ مگابایت — تصاویر، PDF، ZIP و فایل‌های آفیس</p>
      </div>

      {error && <p className="mb-3 text-sm font-bold text-destructive">{error}</p>}

      <div className="mb-4">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="جست‌وجوی نام فایل…" />
      </div>

      {loading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={q ? 'فایلی پیدا نشد' : 'کتابخانه خالی است'} desc="اولین عکس یا فایل را بارگذاری کنید." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.items.map((m) => (
            <div key={m.id} className="soreh-card overflow-hidden">
              <div className="h-28 bg-secondary">
                {m.mime.startsWith('image/') ? (
                  <img src={`/api/media/file/${m.filename}`} alt={m.originalName} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-full place-items-center text-3xl">📄</div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-bold" title={m.originalName}>{m.originalName}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{faNum(Math.max(1, Math.round(m.size / 1024)))} کیلوبایت — {faDate(m.createdAt)}</p>
                <div className="mt-1.5 flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={`/api/media/file/${m.filename}`} download={m.originalName} target="_blank" rel="noreferrer" aria-label="دانلود">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(m)} aria-label="کپی نشانی">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="mr-auto h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(m)} aria-label="حذف">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}

      {confirmDialog}
    </div>
  )
}
