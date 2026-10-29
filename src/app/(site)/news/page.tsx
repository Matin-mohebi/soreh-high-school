import { db } from '@/lib/db'
import { getChrome, faDate } from '@/lib/live'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'اخبار و اطلاعیه‌ها' }

export default async function NewsPage() {
  const [chrome, news] = await Promise.all([
    getChrome(),
    db.newsPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 60,
    }),
  ])

  return (
    <main id="main" className="page page--wide">
      <article className="page__in">
        <h1>{chrome.newsSection.title}</h1>
        <p className="prose">{chrome.newsSection.text}</p>
        <div style={{ marginTop: 18 }}>
          {news.length === 0 ? (
            <p className="empty-note">هنوز خبر یا اطلاعیه‌ای ثبت نشده است.</p>
          ) : (
            news.map((n, i) => (
              <article className="news-item" data-reveal key={n.id}>
                {n.important ? <span className="badge">مهم</span> : null}
                <h3>{n.title}</h3>
                <time>{faDate(n.publishedAt ?? n.createdAt)}</time>
                {n.excerpt ? <p>{n.excerpt}</p> : null}
                {n.body ? (
                  <details open={i === 0}>
                    <summary>ادامه مطلب</summary>
                    <div className="prose" dangerouslySetInnerHTML={{ __html: n.body }} />
                  </details>
                ) : null}
              </article>
            ))
          )}
        </div>
      </article>
    </main>
  )
}
