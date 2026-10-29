import { AuthActs } from '@/components/site/AuthActs'

/**
 * اسکلت مشترک صفحات عمومی — پورت مستقیم header.php / footer.php و دروازه ورود front-page.php
 * قالب Class Stars. محتوا از دیتابیس (تنظیمات + منو) سمت سرور می‌آید.
 */

export type ChromeData = {
  siteName: string
  logo: string
  menu: { label: string; href: string }[]
  footer: { note: string; address: string; phone: string }
  gate: { staffTitle: string; staffText: string; studentsTitle: string; studentsText: string; show: boolean }
}

export function SiteHeader({ data }: { data: ChromeData }) {
  return (
    <>
      <a className="skip" href="#main">رفتن به محتوا</a>
      <header className="bar">
        <a className="mark" href="/">
          {data.logo ? <img src={data.logo} alt={data.siteName} /> : null}
          {data.siteName}
        </a>
        <nav aria-label="منوی اصلی">
          {data.menu.filter((m) => m.label && m.href).map((m, i) => {
            const external = /^https?:/i.test(m.href)
            return (
              <a
                key={i}
                href={m.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {m.label}
              </a>
            )
          })}
        </nav>
        <AuthActs />
      </header>
    </>
  )
}

export function SiteGate({ data }: { data: ChromeData }) {
  if (!data.gate.show) return null
  return (
    <div className="gate" id="gate" role="dialog" aria-label="ورود به سایت">
      <a className="gate__half gate__half--staff" href="#staff" data-go="staff">
        <strong>{data.gate.staffTitle}</strong>
        <span>{data.gate.staffText}</span>
      </a>
      <a className="gate__half gate__half--students" href="#students" data-go="students">
        <strong>{data.gate.studentsTitle}</strong>
        <span>{data.gate.studentsText}</span>
      </a>
      <button className="gate__skip" type="button" data-skip>ورود به صفحه اصلی</button>
    </div>
  )
}

export function SiteFooter({ data }: { data: ChromeData }) {
  return (
    <footer className="foot">
      <p className="foot__name">{data.siteName}</p>
      <div className="foot__row">
        <span>{data.footer.note}</span>
        {data.footer.address ? <span>{data.footer.address}</span> : null}
        {data.footer.phone ? <span dir="ltr">{data.footer.phone}</span> : null}
      </div>
    </footer>
  )
}
