'use client'

/**
 * فرم‌های سمت کلاینت صفحات عمومی: ورود، ثبت‌نام و تماس.
 * ارسال به APIهای همان دامنه (/api/auth/*, /api/contact) با پیام خطای فارسی.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function Msg({ text, kind }: { text: string; kind: 'error' | 'ok' }) {
  if (!text) return null
  return (
    <p className="msg" role="alert" style={kind === 'ok' ? { background: 'linear-gradient(180deg,#2ea36a,#187a49)' } : undefined}>
      {text}
    </p>
  )
}

export function LoginForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [okMsg, setOkMsg] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(''); setOkMsg(''); setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      username: String(fd.get('username') ?? ''),
      password: String(fd.get('password') ?? ''),
      remember: fd.get('remember') === '1',
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOkMsg('ورود موفق؛ در حال انتقال…')
        const role = (d as { user?: { role?: string } }).user?.role
        setTimeout(() => {
          if (role === 'ADMIN' || role === 'EDITOR') router.push('/admin')
          else { setOkMsg(''); window.location.href = '/' }
        }, 600)
        return
      }
      setErr((d as { error?: string }).error || 'ورود انجام نشد؛ دوباره تلاش کنید.')
    } catch {
      setErr('ارتباط با سرور مدرسه برقرار نشد.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <Msg text={err} kind="error" />
      <Msg text={okMsg} kind="ok" />
      <label>نام کاربری یا ایمیل<input name="username" required autoComplete="username" dir="ltr" /></label>
      <label>رمز عبور<input type="password" name="password" required autoComplete="current-password" dir="ltr" /></label>
      <label className="check"><input type="checkbox" name="remember" value="1" /> مرا به خاطر بسپار</label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'در حال ورود…' : 'ورود'}</button>
      <p className="alt">حساب ندارید؟ <a href="/register">ثبت‌نام</a></p>
    </form>
  )
}

export function RegisterForm() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [okMsg, setOkMsg] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(''); setOkMsg(''); setBusy(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    /* تله ضد ربات — همان رویکرد قالب اصلی (فیلد پنهان website) */
    if (String(fd.get('website') ?? '') !== '') { setBusy(false); return }
    const payload = {
      name: String(fd.get('name') ?? ''),
      username: String(fd.get('username') ?? ''),
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOkMsg('ثبت‌نام انجام شد؛ خوش آمدید!')
        setTimeout(() => { window.location.href = '/' }, 800)
        return
      }
      setErr((d as { error?: string }).error || 'ثبت‌نام انجام نشد؛ دوباره تلاش کنید.')
    } catch {
      setErr('ارتباط با سرور مدرسه برقرار نشد.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <Msg text={err} kind="error" />
      <Msg text={okMsg} kind="ok" />
      <label>نام و نام خانوادگی<input name="name" required autoComplete="name" /></label>
      <label>نام کاربری (انگلیسی)<input name="username" required minLength={3} autoComplete="username" dir="ltr" /></label>
      <label>ایمیل<input type="email" name="email" required autoComplete="email" dir="ltr" /></label>
      <label>رمز عبور (حداقل ۸ کاراکتر)<input type="password" name="password" required minLength={8} autoComplete="new-password" dir="ltr" /></label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="btn" type="submit" disabled={busy}>{busy ? 'در حال ثبت…' : 'ثبت‌نام'}</button>
      <p className="alt">قبلا ثبت‌نام کرده‌اید؟ <a href="/login">ورود</a></p>
    </form>
  )
}

export function ContactForm() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [okMsg, setOkMsg] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(''); setOkMsg(''); setBusy(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      subject: String(fd.get('subject') ?? ''),
      body: String(fd.get('body') ?? ''),
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOkMsg('پیام شما ثبت شد. سپاس از همراهی شما.')
        form.reset()
      } else {
        setErr((d as { error?: string }).error || 'ارسال پیام انجام نشد.')
      }
    } catch {
      setErr('ارتباط با سرور مدرسه برقرار نشد.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth" onSubmit={submit} style={{ marginTop: 22 }}>
      <Msg text={err} kind="error" />
      <Msg text={okMsg} kind="ok" />
      <label>نام و نام خانوادگی<input name="name" required autoComplete="name" /></label>
      <label>ایمیل (اختیاری)<input type="email" name="email" autoComplete="email" dir="ltr" /></label>
      <label>تلفن (اختیاری)<input name="phone" autoComplete="tel" dir="ltr" /></label>
      <label>موضوع<input name="subject" required /></label>
      <label>متن پیام<textarea name="body" required /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'در حال ارسال…' : 'ارسال پیام'}</button>
    </form>
  )
}
