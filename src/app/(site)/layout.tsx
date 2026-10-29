import type { Metadata, Viewport } from 'next'
import '@/styles/site.css'
import '@/styles/site-overrides.css'
import { getChrome } from '@/lib/live'
import { SiteHeader, SiteFooter } from '@/components/site/Chrome'
import { SiteEffects } from '@/components/site/SiteEffects'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const chrome = await getChrome()
    return {
      title: chrome.seo.title,
      description: chrome.seo.description,
      keywords: chrome.seo.keywords.split(',').map((s) => s.trim()).filter(Boolean),
      icons: { icon: chrome.favicon },
      openGraph: {
        title: chrome.seo.title,
        description: chrome.seo.description,
        type: 'website',
        ...(chrome.seo.ogImage ? { images: [chrome.seo.ogImage] } : {}),
      },
    }
  } catch {
    return { title: 'دبیرستان سوره | Soreh High School' }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * اسکریپت آغازین — معادل همان اسکریپت header.php قالب:
 * کلاس js همیشه و seen در صورت بسته‌بودن پیش‌تر دروازه (نشست‌محور).
 * این اسکریپت قبل از رندر اجرا می‌شود تا دروازه بدون پرش نمایش داده شود.
 */
const bootScript = "document.documentElement.classList.add('js');try{if(sessionStorage.getItem('cs_gate'))document.documentElement.classList.add('seen')}catch(e){}"

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getChrome()
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      <div className="cs" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader
          data={{
            siteName: chrome.siteName,
            logo: chrome.logo,
            menu: chrome.menu,
            footer: chrome.footer,
            gate: { ...chrome.gate, show: true },
          }}
        />
        <div style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <SiteFooter data={{ siteName: chrome.siteName, logo: '', menu: [], footer: chrome.footer, gate: { ...chrome.gate, show: false } }} />
      </div>
      <SiteEffects search={chrome.toolkit.search} progress={chrome.toolkit.progress} backToTop={chrome.toolkit.backToTop} />
    </>
  )
}
