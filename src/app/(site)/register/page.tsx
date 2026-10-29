import { RegisterForm } from '@/components/site/forms'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'ثبت‌نام' }

export default function RegisterPage() {
  return (
    <main id="main" className="page">
      <article className="page__in">
        <h1>ثبت‌نام</h1>
        <RegisterForm />
      </article>
    </main>
  )
}
