import { db } from '@/lib/db'
import { getChrome, faDate } from '@/lib/live'
import { SiteGate } from '@/components/site/Chrome'

export const dynamic = 'force-dynamic'

/**
 * صفحه اصلی — پورت کامل front-page.php قالب Class Stars:
 * دروازه ورود، بخش اول، درباره و آمار، مدیر و معاونان، دانش‌آموزان برتر،
 * اخبار (امکان جدید) و دعوت به عضویت. همه داده‌ها زنده از دیتابیس.
 */
export default async function HomePage() {
  const [chrome, staff, students, news] = await Promise.all([
    getChrome(),
    db.staffMember.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], take: 40 }),
    db.student.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], take: 40 }),
    db.newsPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 4,
    }),
  ])

  const trimBio = (bio: string) => bio.split(/\s+/).slice(0, 28).join(' ')

  return (
    <>
      <SiteGate
        data={{
          siteName: chrome.siteName,
          logo: '',
          menu: [],
          footer: chrome.footer,
          gate: { ...chrome.gate, show: true },
        }}
      />

      <main id="main">
        {/* ---------- بخش اول ---------- */}
        <section className={chrome.hero.image ? 'hero hero--img' : 'hero hero--noimg'}>
          <div className="hero__text">
            <h1 data-reveal>{chrome.siteName}</h1>
            <p data-reveal>{chrome.hero.text}</p>
            <p className="hero__acts" data-reveal>
              <a className="btn" href="#students">برترین‌ها را ببینید</a>
              <a className="link" href="#staff">آشنایی با مدیریت</a>
            </p>
          </div>
          {chrome.hero.image ? (
            <div className="hero__img"><img src={chrome.hero.image} alt={chrome.siteName} /></div>
          ) : null}
        </section>

        {/* ---------- درباره و آمار ---------- */}
        <section className="about" id="about">
          <div className="about__text">
            <h2 data-reveal>{chrome.about.title}</h2>
            <p data-reveal>{chrome.about.text}</p>
          </div>
          <ul className="stats">
            {chrome.about.stats.map((s, i) => (
              <li data-reveal key={i}>
                <b data-count={s.n.replace(/\D/g, '')}>{s.n}</b>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- مدیر و معاونان ---------- */}
        <section className="staff" id="staff">
          <div className="head">
            <h2 data-reveal>{chrome.staffSection.title}</h2>
            <p data-reveal>{chrome.staffSection.text}</p>
          </div>
          <div className="grid grid--staff">
            {staff.map((p) => (
              <article className="person" data-reveal key={p.id}>
                <div className="ph ph--portrait">
                  {p.photoUrl ? <img loading="lazy" src={p.photoUrl} alt={p.name} /> : null}
                </div>
                <h3>{p.name}</h3>
                <p className="role">{p.role}</p>
                <p>{trimBio(p.bio)}</p>
              </article>
            ))}
            {Array.from({ length: Math.max(0, 4 - staff.length) }).map((_, i) => (
              <article className="person person--empty" data-reveal key={`se${i}`}>
                <div className="ph ph--portrait" />
                <h3>نام مدیر یا معاون</h3>
                <p className="role">سمت</p>
                <p>توضیح کوتاه درباره این فرد اینجا نمایش داده می‌شود.</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- دانش‌آموزان برتر ---------- */}
        <section className="students" id="students">
          <div className="head">
            <h2 data-reveal>{chrome.studentsSection.title}</h2>
            <p data-reveal>{chrome.studentsSection.text}</p>
          </div>
          <div className="grid grid--students">
            {students.map((p) => (
              <article className="kid" data-reveal key={p.id}>
                <div className="ph ph--square">
                  {p.photoUrl ? <img loading="lazy" src={p.photoUrl} alt={p.name} /> : null}
                </div>
                {p.rank ? <b className="rank">{p.rank}</b> : null}
                <h3>{p.name}</h3>
                <p className="role">{p.grade}</p>
                <p>{p.note}</p>
              </article>
            ))}
            {Array.from({ length: Math.max(0, 8 - students.length) }).map((_, i) => (
              <article className="kid kid--empty" data-reveal key={`ke${i}`}>
                <div className="ph ph--square" />
                <b className="rank">؟</b>
                <h3>نام دانش‌آموز</h3>
                <p className="role">پایه</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- اخبار و اطلاعیه‌ها ---------- */}
        <section className="staff" id="news">
          <div className="head">
            <h2 data-reveal>{chrome.newsSection.title}</h2>
            <p data-reveal>{chrome.newsSection.text}</p>
          </div>
          {news.length === 0 ? (
            <p className="empty-note">هنوز خبر یا اطلاعیه‌ای ثبت نشده است.</p>
          ) : (
            news.map((n) => (
              <article className="news-item" data-reveal key={n.id}>
                {n.important ? <span className="badge">مهم</span> : null}
                <h3>{n.title}</h3>
                <time>{faDate(n.publishedAt ?? n.createdAt)}</time>
                {n.excerpt ? <p>{n.excerpt}</p> : null}
                {n.body ? (
                  <details open>
                    <summary>ادامه مطلب</summary>
                    <div className="prose" dangerouslySetInnerHTML={{ __html: n.body }} />
                  </details>
                ) : null}
              </article>
            ))
          )}
          <p style={{ marginTop: 18 }}>
            <a className="link" href="/news">مشاهده همه اخبار و اطلاعیه‌ها</a>
          </p>
        </section>

        {/* ---------- دعوت به عضویت ---------- */}
        {chrome.joinEnabled ? (
          <section className="join" id="join">
            <h2 data-reveal>عضو خانواده مدرسه شوید</h2>
            <p data-reveal>با ساخت حساب، از اخبار و اطلاعیه‌های مدرسه باخبر بمانید.</p>
            <p className="hero__acts" data-reveal>
              <a className="btn" href="/register">ثبت‌نام</a>
              <a className="link" href="/login">ورود</a>
            </p>
          </section>
        ) : null}
      </main>
    </>
  )
}
