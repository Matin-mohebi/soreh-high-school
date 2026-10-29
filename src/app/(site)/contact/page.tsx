import { getSettings } from '@/lib/settings'
import { ContactForm } from '@/components/site/forms'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'تماس با ما' }

export default async function ContactPage() {
  const settings = await getSettings()

  return (
    <main id="main" className="page">
      <article className="page__in">
        <h1>{settings['contact.title']}</h1>
        <p className="prose">{settings['contact.text']}</p>
        {settings['footer.address'] ? (
          <p className="prose"><strong>نشانی:</strong> {settings['footer.address']}</p>
        ) : null}
        {settings['footer.phone'] ? (
          <p className="prose"><strong>تلفن:</strong> <span dir="ltr">{settings['footer.phone']}</span></p>
        ) : null}
        <ContactForm />
      </article>
    </main>
  )
}
