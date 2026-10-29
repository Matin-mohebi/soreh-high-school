import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/** برگه‌های ایستای ساخته‌شده در پنل مدیریت — معادل page.html?slug= در نسخه استاتیک */
export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pages = await db.pageBlock.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  const page = pages.find((p) => p.slug === slug) ?? pages.find((p) => p.showInNav)
  if (!page) notFound()

  const nav = pages.filter((p) => p.showInNav)

  return (
    <main id="main" className="page page--wide">
      <article className="page__in">
        <h1>{page.title}</h1>
        <div className="prose" dangerouslySetInnerHTML={{ __html: page.body || '<p>این برگه خالی است.</p>' }} />
        {nav.length > 0 ? (
          <p className="alt" style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {nav.map((p) => (
              <Link className="link" href={`/page/${p.slug}`} key={p.id}>{p.title}</Link>
            ))}
          </p>
        ) : null}
      </article>
    </main>
  )
}
