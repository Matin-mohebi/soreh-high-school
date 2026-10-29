'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, ROLE_LABEL, type SessionUser } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard, Users, GraduationCap, Newspaper, FileText, ListOrdered,
  CalendarDays, ImageIcon, Mail, Settings, UserCog, ScrollText, Rocket,
  Menu as MenuIcon, X, Sun, Moon, LogOut, Globe, Hexagon,
} from 'lucide-react'
import { DashboardView } from '@/components/admin/DashboardView'
import { PeopleView } from '@/components/admin/PeopleView'
import { NewsView } from '@/components/admin/NewsView'
import { PagesView } from '@/components/admin/PagesView'
import { MenuView } from '@/components/admin/MenuView'
import { ScheduleView } from '@/components/admin/ScheduleView'
import { MediaView } from '@/components/admin/MediaView'
import { MessagesView } from '@/components/admin/MessagesView'
import { SettingsView } from '@/components/admin/SettingsView'
import { UsersView } from '@/components/admin/UsersView'
import { LogsView } from '@/components/admin/LogsView'
import { PublishView } from '@/components/admin/PublishView'

type View = {
  id: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean
}

const NAV: { group: string; items: View[] }[] = [
  {
    group: 'نمای کلی',
    items: [
      { id: 'dashboard', label: 'پیشخوان', icon: LayoutDashboard },
      { id: 'publish', label: 'انتشار در سایت', icon: Rocket, adminOnly: true },
    ],
  },
  {
    group: 'محتوا',
    items: [
      { id: 'staff', label: 'مدیر و معاونان', icon: Users },
      { id: 'students', label: 'دانش‌آموزان برتر', icon: GraduationCap },
      { id: 'news', label: 'اخبار و اطلاعیه‌ها', icon: Newspaper },
      { id: 'pages', label: 'برگه‌ها', icon: FileText },
      { id: 'menu', label: 'منوی سایت', icon: ListOrdered },
      { id: 'schedule', label: 'برنامه هفتگی', icon: CalendarDays },
    ],
  },
  {
    group: 'رسانه و پیام‌ها',
    items: [
      { id: 'media', label: 'کتابخانه رسانه', icon: ImageIcon },
      { id: 'messages', label: 'پیام‌های دریافتی', icon: Mail },
    ],
  },
  {
    group: 'سیستم',
    items: [
      { id: 'settings', label: 'تنظیمات', icon: Settings, adminOnly: true },
      { id: 'users', label: 'کاربران و دسترسی‌ها', icon: UserCog, adminOnly: true },
      { id: 'logs', label: 'گزارش فعالیت', icon: ScrollText, adminOnly: true },
    ],
  },
]

/** صفحه‌ی ورود */
function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const d = await api<{ user: SessionUser }>('/api/auth/login', {
        method: 'POST', body: { username, password },
      })
      toast({ title: `خوش آمدید، ${d.user.name}` })
      onLoggedIn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="soreh-card w-full max-w-sm p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0b2a52] to-[#1677ba] text-white shadow-lg">
            <Hexagon className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold">پنل مدیریت دبیرستان سوره</h1>
          <p className="mt-1 text-xs text-muted-foreground">Soreh High School — Admin Dashboard</p>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">نام کاربری یا ایمیل</span>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" autoComplete="username" autoFocus />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">رمز عبور</span>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoComplete="current-password" />
          </label>
          {error && <p className="rounded-lg bg-red-100 p-2.5 text-xs font-bold text-red-800 dark:bg-red-900/30 dark:text-red-300">{error}</p>}
          <Button type="submit" disabled={busy} className="mt-1">
            {busy ? 'در حال ورود…' : 'ورود به پنل'}
          </Button>
        </form>
        <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
          ورود امن سمت سرور با کوکی HttpOnly — حساب مدیر از نصب اولیه: <code dir="ltr">admin</code>
        </p>
      </div>
    </div>
  )
}

export function AdminApp() {
  const [user, setUser] = useState<SessionUser | null | 'loading'>('loading')
  const [view, setView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    api<{ user: SessionUser | null }>('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('soreh-theme')
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
    const on = saved ? saved === 'dark' : prefers
    setDark(on)
    document.documentElement.classList.toggle('dark', on)
  }, [])

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('soreh-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      toast({ title: 'خارج شدید' })
    }
  }

  if (user === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <LoginScreen onLoggedIn={() => { api<{ user: SessionUser }>('/api/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)) }} />

  if (user.role === 'SUBSCRIBER') {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="soreh-card max-w-sm p-7 text-center">
          <h1 className="text-lg font-extrabold">حساب شما دسترسی مدیریتی ندارد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سلام {user.name}! حساب شما «کاربر عادی» است. برای دسترسی به پنل، با مدیر مدرسه تماس بگیرید.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" asChild><a href="/">مشاهده سایت</a></Button>
            <Button variant="destructive" onClick={logout}><LogOut className="ml-1 h-4 w-4" /> خروج</Button>
          </div>
        </div>
      </div>
    )
  }

  const current = NAV.flatMap((g) => g.items).find((v) => v.id === view)

  function go(id: string) {
    setView(id)
    setSidebarOpen(false)
  }

  const navForUser = NAV.map((g) => ({
    ...g,
    items: g.items.filter((v) => (user && user.role === 'ADMIN') || !v.adminOnly),
  }))

  return (
    <div className="flex min-h-screen">
      {/* سایدبار دسکتاپ */}
      <aside className="soreh-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto p-4 lg:flex">
        <Brand />
        <nav className="mt-4 flex-1 space-y-4">
          {navForUser.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wide text-white/40">{g.group}</p>
              <div className="space-y-1">
                {g.items.map((v) => (
                  <button key={v.id} className="soreh-sidebar-item" data-active={view === v.id} onClick={() => go(v.id)}>
                    <v.icon className="h-4 w-4" /> {v.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <UserBox user={user} onLogout={logout} />
      </aside>

      {/* سایدبار موبایل */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="soreh-sidebar absolute inset-y-0 right-0 flex w-72 flex-col overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button className="rounded-lg p-2 text-white/70 hover:bg-white/10" onClick={() => setSidebarOpen(false)} aria-label="بستن منو">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-4">
              {navForUser.map((g) => (
                <div key={g.group}>
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wide text-white/40">{g.group}</p>
                  <div className="space-y-1">
                    {g.items.map((v) => (
                      <button key={v.id} className="soreh-sidebar-item" data-active={view === v.id} onClick={() => go(v.id)}>
                        <v.icon className="h-4 w-4" /> {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <UserBox user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* بدنه */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="باز کردن منو">
            <MenuIcon className="h-5 w-5" />
          </button>
          <p className="truncate font-extrabold">{current?.label ?? 'پیشخوان'}</p>
          <div className="mr-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" asChild title="مشاهده سایت">
              <a href="/" target="_blank" rel="noreferrer" aria-label="مشاهده سایت عمومی">
                <Globe className="h-4.5 w-4.5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="تغییر حالت روشن و تاریک">
              {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          {view === 'dashboard' && <DashboardView go={go} isAdmin={user.role === 'ADMIN'} />}
          {view === 'staff' && <PeopleView kind="staff" />}
          {view === 'students' && <PeopleView kind="students" />}
          {view === 'news' && <NewsView />}
          {view === 'pages' && <PagesView />}
          {view === 'menu' && <MenuView />}
          {view === 'schedule' && <ScheduleView />}
          {view === 'media' && <MediaView />}
          {view === 'messages' && <MessagesView />}
          {view === 'settings' && <SettingsView isAdmin={user.role === 'ADMIN'} />}
          {view === 'users' && <UsersView currentUserId={user.id} />}
          {view === 'logs' && <LogsView />}
          {view === 'publish' && <PublishView />}
        </main>

        <footer className="mt-auto border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
          پنل مدیریت دبیرستان سوره — مهاجرت‌یافته از قالب وردپرس Class Stars
        </footer>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white shadow-inner">
        <Hexagon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-white">دبیرستان سوره</p>
        <p className="text-[10px] text-white/60">پنل مدیریت — Soreh High School</p>
      </div>
    </div>
  )
}

function UserBox({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3">
      <p className="truncate text-sm font-bold text-white">{user.name}</p>
      <p className="text-[10px] text-white/60">{ROLE_LABEL[user.role]} — <span dir="ltr">{user.username}</span></p>
      <Button variant="outline" size="sm" className="mt-2 w-full border-white/20 bg-transparent text-white hover:bg-white/10" onClick={onLogout}>
        <LogOut className="ml-1 h-3.5 w-3.5" /> خروج امن
      </Button>
    </div>
  )
}
