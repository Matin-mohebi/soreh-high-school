'use client'

import { useState } from 'react'
import { api, faNum } from '@/lib/client'
import { PageHeader, useConfirm } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Rocket, Download, Globe, ExternalLink, CheckCircle2, AlertCircle, Info } from 'lucide-react'

type PublishResult = {
  bundle: { file: string; size: number; downloadUrl: string }
  contentSummary: { staff: number; students: number; news: number; pages: number; media: number; siteName: string }
  github: { enabled: boolean; pushed: boolean; reason?: string; repo?: string; branch?: string; commitUrl?: string; mediaPushed?: number; note?: string }
  publishedAt: string
}

export function PublishView() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState('')
  const { confirm, confirmDialog } = useConfirm()

  async function publish() {
    confirm(
      'انتشار سایت',
      'بسته‌ی استقرار ساخته شود و (در صورت تنظیم بودن توکن سرور) به مخزن گیت‌هاب ارسال شود؟',
      async () => {
        setBusy(true)
        setError('')
        try {
          setResult(await api<PublishResult>('/api/publish', { method: 'POST' }))
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setBusy(false)
        }
      },
      false
    )
  }

  return (
    <div>
      <PageHeader
        title="انتشار در سایت عمومی"
        desc="سایت عمومی روی گیت‌هاب‌پیجز استاتیک است؛ انتشار یعنی ساخت content.json از پایگاه‌داده و تحویل آن به مخزن."
        actions={
          <Button onClick={publish} disabled={busy}>
            <Rocket className="ml-1 h-4 w-4" /> {busy ? 'در حال انتشار…' : 'انتشار تغییرات'}
          </Button>
        }
      />

      <div className="soreh-card mb-4 p-5">
        <h3 className="mb-2 flex items-center gap-2 font-extrabold"><Info className="h-4 w-4" /> معماری انتشار</h3>
        <ol className="list-decimal space-y-1.5 pr-5 text-sm leading-7 text-muted-foreground">
          <li>محتوای پایگاه‌داده به فایل <code className="rounded bg-muted px-1" dir="ltr">content.json</code> تبدیل می‌شود و نشانی رسانه‌ها به پوشه‌ی <code className="rounded bg-muted px-1" dir="ltr">uploads/</code> بازنویسی می‌شود.</li>
          <li>بسته‌ی ZIP شامل سایت استاتیک + محتوای تازه + رسانه‌ها ساخته می‌شود و از همین صفحه قابل دانلود است.</li>
          <li>اگر متغیرهای محیطی سرور (GITHUB_TOKEN و GITHUB_REPO) تنظیم شده باشند، محتوا مستقیم به مخزن ارسال و توسط GitHub Actions منتشر می‌شود. توکن هرگز به مرورگر فرستاده نمی‌شود.</li>
        </ol>
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-100 p-3 text-sm font-bold text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="soreh-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-extrabold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> انتشار انجام شد
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {[
                ['نام مدرسه', result.contentSummary.siteName],
                ['مدیر و معاونان', faNum(result.contentSummary.staff)],
                ['دانش‌آموزان برتر', faNum(result.contentSummary.students)],
                ['خبرهای منتشرشده', faNum(result.contentSummary.news)],
                ['رسانه‌ها', faNum(result.contentSummary.media)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="mt-1 font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <a href={result.bundle.downloadUrl}><Download className="ml-1 h-4 w-4" /> دانلود بسته‌ی استقرار ({faNum(Math.round(result.bundle.size / 1024))} کیلوبایت)</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/" target="_blank" rel="noreferrer"><Globe className="ml-1 h-4 w-4" /> مشاهده سایت</a>
              </Button>
            </div>
          </div>

          <div className={`soreh-card p-5 ${result.github.pushed ? '' : 'border-amber-300'}`}>
            <h3 className="mb-2 flex items-center gap-2 font-extrabold">
              {result.github.pushed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
              وضعیت ارسال به گیت‌هاب
            </h3>
            {result.github.pushed ? (
              <div className="space-y-1 text-sm">
                <p>مخزن: <code className="rounded bg-muted px-1" dir="ltr">{result.github.repo}</code> — شاخه: <code className="rounded bg-muted px-1" dir="ltr">{result.github.branch}</code></p>
                {result.github.mediaPushed ? <p>رسانه‌های ارسال‌شده: {faNum(result.github.mediaPushed)}</p> : null}
                {result.github.commitUrl && (
                  <a className="inline-flex items-center gap-1 font-bold text-primary" href={result.github.commitUrl} target="_blank" rel="noreferrer">
                    مشاهده کامیت <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted-foreground">{result.github.reason}</p>
            )}
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
