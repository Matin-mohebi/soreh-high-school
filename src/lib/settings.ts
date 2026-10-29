import { db } from '@/lib/db'

/**
 * تنظیمات سایت — معادل Customizer قالب Class Stars (functions.php → cs_fields)
 * هر کلید یک فیلد قابل ویرایش در داشبورد است.
 */

export const SETTING_DEFAULTS: Record<string, string> = {
  'site.name': 'دبیرستان سوره',
  'site.nameEn': 'Soreh High School',
  'site.tagline': 'جایی برای دیده شدن بهترین‌ها',
  'site.logo': '',
  'site.favicon': './assets/img/favicon.svg',
  'site.backendUrl': '',
  'site.siteUrl': '',

  'seo.title': 'دبیرستان سوره | Soreh High School',
  'seo.description':
    'وب‌سایت رسمی دبیرستان سوره؛ معرفی مدیر و معاونان، دانش‌آموزان برتر، اخبار و اطلاعیه‌های مدرسه.',
  'seo.keywords': 'دبیرستان سوره, Soreh High School, دبیرستان, مدرسه, دانش‌آموزان برتر',
  'seo.ogImage': '',

  'hero.text': 'جایی برای دیده شدن بهترین‌ها؛ مدیران، معاونان و دانش‌آموزان برتر کلاس.',
  'hero.image': '',

  'about.title': 'مدرسه‌ای که یادگیری را جدی می‌گیرد',
  'about.text': 'اینجا چند خط درباره تاریخچه، هدف و روش آموزشی مدرسه بنویسید.',
  'about.stats': JSON.stringify([
    { n: '1200', label: 'دانش‌آموز' },
    { n: '80', label: 'معلم' },
    { n: '25', label: 'سال سابقه' },
  ]),

  'staff.title': 'مدیر و معاونان',
  'staff.text': 'تیمی که مدرسه را اداره می‌کند.',
  'staff.gateText': 'با مدیر و معاونان آشنا شوید',

  'students.title': 'دانش‌آموزان برتر',
  'students.text': 'کسانی که با تلاش خودشان الگوی بقیه شدند.',
  'students.gateText': 'برترین‌های کلاس را ببینید',

  'news.title': 'اخبار و اطلاعیه‌ها',
  'news.text': 'تازه‌ترین خبرها و اطلاعیه‌های دبیرستان سوره را اینجا دنبال کنید.',

  'schedule.title': 'برنامه هفتگی',
  'schedule.text': 'برنامه هفتگی کلاس‌های دبیرستان سوره.',
  'schedule.enabled': 'true',

  'contact.title': 'تماس با ما',
  'contact.text': 'پیام‌های شما از طریق فرم زیر برای مدیریت مدرسه ارسال می‌شود.',
  'contact.enabled': 'true',

  'footer.note': 'همه حقوق محفوظ است.',
  'footer.address': '',
  'footer.phone': '',

  'toolkit.search': 'true',
  'toolkit.progress': 'true',
  'toolkit.backToTop': 'true',

  'join.enabled': 'true',
}

export type Settings = Record<string, string>

export async function getSettings(): Promise<Settings> {
  const rows = await db.setting.findMany()
  const out: Settings = { ...SETTING_DEFAULTS }
  for (const row of rows) out[row.key] = row.value
  return out
}

export async function putSettings(values: Record<string, string>) {
  const keys = Object.keys(values).filter((k) => k in SETTING_DEFAULTS)
  for (const key of keys) {
    await db.setting.upsert({
      where: { key },
      update: { value: String(values[key]) },
      create: { key, value: String(values[key]) },
    })
  }
  return keys
}

export function parseStats(raw: string): { n: string; label: string }[] {
  try {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) {
      return arr.slice(0, 4).map((s) => ({ n: String(s?.n ?? ''), label: String(s?.label ?? '') }))
    }
  } catch {}
  return JSON.parse(SETTING_DEFAULTS['about.stats'])
}

export function boolVal(v: string | undefined): boolean {
  return v !== 'false' && v !== '0'
}
