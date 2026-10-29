import { db } from '@/lib/db'
import { getSettings, parseStats, boolVal, SETTING_DEFAULTS } from '@/lib/settings'
import type { SiteContent } from '@/lib/content'

/**
 * لایه داده صفحات عمومی «زنده» — رندر سمت سرور از دیتابیس.
 * هر تغییری در پنل مدیریت بی‌درنگ در همین صفحات دیده می‌شود.
 */

export const DEFAULT_MENU: { label: string; href: string }[] = [
  { label: 'درباره', href: '/#about' },
  { label: 'مدیر و معاونان', href: '/#staff' },
  { label: 'دانش‌آموزان', href: '/#students' },
  { label: 'اخبار', href: '/news' },
  { label: 'برنامه هفتگی', href: '/schedule' },
  { label: 'تماس با ما', href: '/contact' },
]

/** favicon تنظیمات به سبک استاتیک است؛ برای سایت زنده مسیر واقعی می‌سازیم */
export function liveAssetPath(p: string): string {
  if (!p) return ''
  if (/^https?:/i.test(p) || p.startsWith('/')) return p
  return p.replace(/^\.\//, '/site/')
}

export async function getChrome() {
  const [settings, menuRows] = await Promise.all([
    getSettings(),
    db.menuItem.findMany({ orderBy: { order: 'asc' } }),
  ])
  const menu = menuRows.length
    ? menuRows.map((m) => ({ label: m.label, href: m.href }))
    : DEFAULT_MENU
  return {
    siteName: settings['site.name'],
    logo: liveAssetPath(settings['site.logo']),
    menu,
    footer: { note: settings['footer.note'], address: settings['footer.address'], phone: settings['footer.phone'] },
    gate: {
      staffTitle: settings['staff.title'],
      staffText: settings['staff.gateText'],
      studentsTitle: settings['students.title'],
      studentsText: settings['students.gateText'],
    },
    toolkit: {
      search: boolVal(settings['toolkit.search']),
      progress: boolVal(settings['toolkit.progress']),
      backToTop: boolVal(settings['toolkit.backToTop']),
    },
    seo: {
      title: settings['seo.title'],
      description: settings['seo.description'],
      keywords: settings['seo.keywords'],
      ogImage: settings['seo.ogImage'],
    },
    favicon: liveAssetPath(settings['site.favicon']) || '/site/assets/img/favicon.svg',
    joinEnabled: boolVal(settings['join.enabled']),
    site: {
      name: settings['site.name'],
      nameEn: settings['site.nameEn'],
      tagline: settings['site.tagline'],
    },
    about: {
      title: settings['about.title'],
      text: settings['about.text'],
      stats: parseStats(settings['about.stats']),
    },
    hero: { text: settings['hero.text'], image: settings['hero.image'] },
    staffSection: { title: settings['staff.title'], text: settings['staff.text'] },
    studentsSection: { title: settings['students.title'], text: settings['students.text'] },
    newsSection: { title: settings['news.title'], text: settings['news.text'] },
  }
}

export type Chrome = Awaited<ReturnType<typeof getChrome>>

/** داده کامل سایت (همان ساختار content.json) برای صفحه‌هایی که همه‌چیز لازم دارند */
export async function getFullContent(): Promise<SiteContent> {
  const { buildContent } = await import('@/lib/content')
  return buildContent()
}

export function faDate(iso: string | Date | null | undefined, withTime = false): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

export { SETTING_DEFAULTS }
