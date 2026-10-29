'use client'

/**
 * ناحیه ورود/خروج در هدر — وضعیت نشست از سرور خوانده می‌شود.
 * اگر کاربر مدیر یا ویراستار باشد لینک «پنل مدیریت» نیز نمایش داده می‌شود.
 */

import { useEffect, useState } from 'react'

type Me = {
  user: { id: string; username: string; name: string; role: string } | null
}

export function AuthActs() {
  const [user, setUser] = useState<Me['user'] | 'loading'>('loading')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: Me) => setUser(d.user))
      .catch(() => setUser(null))
  }, [])

  if (user === 'loading') return <span className="acts" aria-hidden="true" />

  async function logout(e: React.MouseEvent) {
    e.preventDefault()
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } finally {
      window.location.href = '/'
    }
  }

  if (user) {
    const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR'
    return (
      <div className="acts">
        {isStaff && <a href="/admin">پنل مدیریت</a>}
        <span className="userchip">{user.name}</span>
        <a href="#" data-logout onClick={logout}>خروج</a>
      </div>
    )
  }

  return (
    <div className="acts">
      <a href="/login">ورود</a>
      <a className="btn btn--sm" href="/register">ثبت‌نام</a>
    </div>
  )
}
