import { LoginForm } from '@/components/site/forms'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ورود' }

export default function LoginPage() {
  return (
    <main id="main" className="page">
      <article className="page__in">
        <h1>ورود</h1>
        <LoginForm />
      </article>
    </main>
  )
}
