'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { PageHeader, Field, PhotoPicker, Loading, useConfirm } from '@/components/admin/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/** تنظیمات سایت — معادل کامل سفارشی‌سازی (Customizer) قالب Class Stars */

type Settings = Record<string, string>

const TABS = [
  { id: 'identity', label: 'هویت مدرسه' },
  { id: 'sections', label: 'بخش‌های صفحه اصلی' },
  { id: 'footer', label: 'پابرگ و تماس' },
  { id: 'seo', label: 'سئو' },
  { id: 'appearance', label: 'ظاهر و ابزارها' },
  { id: 'services', label: 'سرویس‌ها' },
]

export function SettingsView({ isAdmin }: { isAdmin: boolean }) {
  const [s, setS] = useState<Settings | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState([{ n: '', label: '' }, { n: '', label: '' }, { n: '', label: '' }])
  const { confirm, confirmDialog } = useConfirm()
  const { toast } = useToast()

  useEffect(() => {
    api<{ settings: Settings }>('/api/settings')
      .then((d) => {
        setS(d.settings)
        try { setStats(JSON.parse(d.settings['about.stats'])) } catch {}
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error && !s) return <p className="p-4 text-sm font-bold text-destructive">{error}</p>
  if (!s) return <Loading />

  const set = (k: string, v: string) => setS((old) => ({ ...(old ?? {}), [k]: v }))
  const setBool = (k: string, v: boolean) => setS((old) => ({ ...(old ?? {}), [k]: v ? 'true' : 'false' }))

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api('/api/settings', { method: 'PUT', body: { settings: { ...s, 'about.stats': JSON.stringify(stats) } } })
      toast({ title: 'تنظیمات ذخیره شد', description: 'برای اعمال در سایت عمومی، از ماژول «انتشار» استفاده کنید.' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const saveBtn = (
    <Button onClick={save} disabled={saving || !isAdmin} title={!isAdmin ? 'فقط مدیر کل می‌تواند تنظیمات را تغییر دهد' : undefined}>
      <Save className="ml-1 h-4 w-4" /> {saving ? 'در حال ذخیره…' : 'ذخیره‌ی تنظیمات'}
    </Button>
  )

  return (
    <div>
      <PageHeader title="تنظیمات سایت" desc="همه‌ی متن‌ها و گزینه‌های قالب Class Stars از اینجا قابل ویرایش است." actions={saveBtn} />
      {!isAdmin && (
        <p className="mb-4 rounded-lg bg-amber-100 p-3 text-sm font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          نقش شما اجازه‌ی ویرایش تنظیمات را ندارد؛ مقادیر فقط خواندنی هستند.
        </p>
      )}

      <Tabs defaultValue="identity" dir="rtl">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="identity" className="soreh-card grid gap-4 p-5">
          <Field label="نام فارسی مدرسه" required>
            <Input value={s['site.name']} onChange={(e) => set('site.name', e.target.value)} />
          </Field>
          <Field label="نام انگلیسی">
            <Input value={s['site.nameEn']} onChange={(e) => set('site.nameEn', e.target.value)} dir="ltr" />
          </Field>
          <Field label="شعار یا توضیح کوتاه">
            <Input value={s['site.tagline']} onChange={(e) => set('site.tagline', e.target.value)} />
          </Field>
          <Field label="نشانی سایت (برای سئو و انتشار)">
            <Input value={s['site.siteUrl']} onChange={(e) => set('site.siteUrl', e.target.value)} dir="ltr" placeholder="https://soreh-high-school.github.io/" />
          </Field>
          <p className="text-xs text-muted-foreground">نشانک (favicon) پیش‌فرض یک نشان متن‌ساخته با حرف «س» است؛ می‌توانید عکس دلخواه را از کتابخانه انتخاب کنید.</p>
        </TabsContent>

        <TabsContent value="sections" className="grid gap-4">
          <div className="soreh-card grid gap-4 p-5">
            <h3 className="font-extrabold">بخش اول (معرفی)</h3>
            <Field label="متن معرفی زیر نام مدرسه">
              <Textarea value={s['hero.text']} onChange={(e) => set('hero.text', e.target.value)} rows={3} />
            </Field>
          </div>
          <div className="soreh-card grid gap-4 p-5">
            <h3 className="font-extrabold">درباره مدرسه و آمار</h3>
            <Field label="عنوان بخش درباره">
              <Input value={s['about.title']} onChange={(e) => set('about.title', e.target.value)} />
            </Field>
            <Field label="متن درباره مدرسه">
              <Textarea value={s['about.text']} onChange={(e) => set('about.text', e.target.value)} rows={3} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((st, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3">
                  <Field label={`عدد آمار ${i + 1}`}>
                    <Input value={st.n} onChange={(e) => setStats((old) => old.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))} dir="ltr" />
                  </Field>
                  <Field label={`عنوان آمار ${i + 1}`}>
                    <Input value={st.label} onChange={(e) => setStats((old) => old.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  </Field>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">توجه: آمار فعلی همان مقادیر پیش‌فرض قالب اصلی است؛ حتما اعداد واقعی مدرسه را وارد کنید.</p>
          </div>
          <div className="soreh-card grid gap-4 p-5">
            <h3 className="font-extrabold">سرتیتر بخش‌ها و دروازه ورود</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان بخش مدیر و معاونان"><Input value={s['staff.title']} onChange={(e) => set('staff.title', e.target.value)} /></Field>
              <Field label="متن دروازه (مدیر و معاونان)"><Input value={s['staff.gateText']} onChange={(e) => set('staff.gateText', e.target.value)} /></Field>
              <Field label="توضیح بخش مدیر و معاونان"><Textarea value={s['staff.text']} onChange={(e) => set('staff.text', e.target.value)} rows={2} /></Field>
              <Field label="عنوان بخش دانش‌آموزان برتر"><Input value={s['students.title']} onChange={(e) => set('students.title', e.target.value)} /></Field>
              <Field label="متن دروازه (دانش‌آموزان برتر)"><Input value={s['students.gateText']} onChange={(e) => set('students.gateText', e.target.value)} /></Field>
              <Field label="توضیح بخش دانش‌آموزان برتر"><Textarea value={s['students.text']} onChange={(e) => set('students.text', e.target.value)} rows={2} /></Field>
            </div>
          </div>
          <div className="soreh-card grid gap-4 p-5">
            <h3 className="font-extrabold">عکس بالای صفحه (اختیاری)</h3>
            <PhotoPicker value={s['hero.image']} onChange={(v) => set('hero.image', v)} mediaUrl="/api/media" />
          </div>
        </TabsContent>

        <TabsContent value="footer" className="soreh-card grid gap-4 p-5">
          <Field label="یادداشت پابرگ"><Input value={s['footer.note']} onChange={(e) => set('footer.note', e.target.value)} /></Field>
          <Field label="آدرس مدرسه"><Input value={s['footer.address']} onChange={(e) => set('footer.address', e.target.value)} placeholder="در صورت خالی بودن نمایش داده نمی‌شود" /></Field>
          <Field label="تلفن مدرسه"><Input value={s['footer.phone']} onChange={(e) => set('footer.phone', e.target.value)} dir="ltr" placeholder="در صورت خالی بودن نمایش داده نمی‌شود" /></Field>
          <Field label="عنوان صفحه اخبار"><Input value={s['news.title']} onChange={(e) => set('news.title', e.target.value)} /></Field>
          <Field label="توضیح صفحه اخبار"><Textarea value={s['news.text']} onChange={(e) => set('news.text', e.target.value)} rows={2} /></Field>
          <Field label="عنوان فرم تماس"><Input value={s['contact.title']} onChange={(e) => set('contact.title', e.target.value)} /></Field>
          <Field label="توضیح فرم تماس"><Textarea value={s['contact.text']} onChange={(e) => set('contact.text', e.target.value)} rows={2} /></Field>
        </TabsContent>

        <TabsContent value="seo" className="soreh-card grid gap-4 p-5">
          <Field label="عنوان سایت (سئو)"><Input value={s['seo.title']} onChange={(e) => set('seo.title', e.target.value)} /></Field>
          <Field label="توضیح متا"><Textarea value={s['seo.description']} onChange={(e) => set('seo.description', e.target.value)} rows={3} /></Field>
          <Field label="کلیدواژه‌ها (با ویرگول)"><Textarea value={s['seo.keywords']} onChange={(e) => set('seo.keywords', e.target.value)} rows={2} /></Field>
          <Field label="عکس اشتراک‌گذاری (OG)">
            <PhotoPicker value={s['seo.ogImage']} onChange={(v) => set('seo.ogImage', v)} mediaUrl="/api/media" />
          </Field>
          <p className="text-xs text-muted-foreground">در نسخه‌ی استاتیک، موتورهای جست‌وجو عمدتا تگ‌های اولیه‌ی HTML را می‌خوانند؛ این مقادیر هنگام انتشار در content.json قرار می‌گیرند و توسط جاوااسکریپت سایت به‌روزرسانی می‌شوند.</p>
        </TabsContent>

        <TabsContent value="appearance" className="soreh-card grid gap-4 p-5">
          <h3 className="font-extrabold">ابزارهای افزونه Class Stars Toolkit</h3>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">جست‌وجوی زنده در مدیران و دانش‌آموزان</span>
            <Switch checked={s['toolkit.search'] !== 'false'} onCheckedChange={(v) => setBool('toolkit.search', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">نوار پیشرفت مطالعه</span>
            <Switch checked={s['toolkit.progress'] !== 'false'} onCheckedChange={(v) => setBool('toolkit.progress', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">دکمه بازگشت به بالای صفحه</span>
            <Switch checked={s['toolkit.backToTop'] !== 'false'} onCheckedChange={(v) => setBool('toolkit.backToTop', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">بخش دعوت به عضویت در صفحه اصلی</span>
            <Switch checked={s['join.enabled'] !== 'false'} onCheckedChange={(v) => setBool('join.enabled', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">نمایش برنامه هفتگی</span>
            <Switch checked={s['schedule.enabled'] !== 'false'} onCheckedChange={(v) => setBool('schedule.enabled', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-bold">فرم تماس</span>
            <Switch checked={s['contact.enabled'] !== 'false'} onCheckedChange={(v) => setBool('contact.enabled', v)} />
          </div>
        </TabsContent>

        <TabsContent value="services" className="soreh-card grid gap-4 p-5">
          <Field label="نشانی سرویس مدیریت (Backend URL)">
            <Input value={s['site.backendUrl']} onChange={(e) => set('site.backendUrl', e.target.value)} dir="ltr" placeholder="https://admin.example.com" />
          </Field>
          <p className="text-sm leading-7 text-muted-foreground">
            وقتی سایت استاتیک روی گیت‌هاب‌پیجز منتشر می‌شود، فرم‌های «ورود، ثبت‌نام و تماس» به این نشانی وصل می‌شوند.
            این همان نشانی همین پنل است (مثلا نشانی فعلی). اگر خالی بماند، آن فرم‌ها در سایت عمومی پیام راهنما نشان می‌دهند و غیرفعال می‌شوند.
          </p>
          <Field label="نشانک (favicon)">
            <PhotoPicker value={s['site.favicon']} onChange={(v) => set('site.favicon', v)} mediaUrl="/api/media" />
          </Field>
          <Field label="لوگو (اختیاری)">
            <PhotoPicker value={s['site.logo']} onChange={(v) => set('site.logo', v)} mediaUrl="/api/media" />
          </Field>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-end">{saveBtn}</div>
      {confirmDialog}
    </div>
  )
}
