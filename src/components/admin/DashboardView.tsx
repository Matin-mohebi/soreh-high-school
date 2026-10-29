'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, faNum, faDate } from '@/lib/client'
import { Loading, PageHeader } from '@/components/admin/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users, GraduationCap, Newspaper, FileText, ImageIcon, Mail,
  Plus, Upload, Globe, Rocket, UserPlus, LayoutDashboard,
} from 'lucide-react'

type Stats = {
  counts: Record<string, number>
  recentLogs: { id: string; username: string; action: string; entity: string; detail: string; createdAt: string }[]
}

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'ورود', LOGIN_FAILED: 'ورود ناموفق', LOGOUT: 'خروج', CREATE: 'ایجاد',
  UPDATE: 'ویرایش', DELETE: 'حذف', PUBLISH: 'انتشار', UPLOAD: 'بارگذاری',
  REGISTER: 'ثبت‌نام', SEED: 'بذرگذاری',
}

const ENTITY_LABEL: Record<string, string> = {
  staff: 'مدیر و معاونان', students: 'دانش‌آموزان برتر', student: 'دانش‌آموز', news: 'خبر',
  page: 'برگه', menu: 'منو', settings: 'تنظیمات', media: 'رسانه', user: 'کاربر',
  message: 'پیام', schedule: 'برنامه هفتگی', site: 'سایت', database: 'پایگاه‌داده',
}

export function DashboardView({ go, isAdmin }: { go: (v: string) => void; isAdmin: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Stats>('/api/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="p-6 text-sm font-bold text-destructive">{error}</p>
  if (!stats) return <Loading />

  const c = stats.counts
  const cards = [
    { label: 'مدیر و معاونان', value: c.staff, icon: Users, view: 'staff', color: 'text-[#1d6fa8]' },
    { label: 'دانش‌آموزان برتر', value: c.students, icon: GraduationCap, view: 'students', color: 'text-[#1677ba]' },
    { label: 'خبرها', value: c.news, icon: Newspaper, view: 'news', color: 'text-[#0a2347]' },
    { label: 'برگه‌ها', value: c.pages, icon: FileText, view: 'pages', color: 'text-[#2a6bb0]' },
    { label: 'رسانه‌ها', value: c.media, icon: ImageIcon, view: 'media', color: 'text-[#5bb6f0]' },
    { label: 'پیام‌های خوانده‌نشده', value: c.messagesUnread, icon: Mail, view: 'messages', color: 'text-[#c2413b]' },
  ]

  return (
    <div>
      <PageHeader
        title="پیشخوان دبیرستان سوره"
        desc="نمای کلی وضعیت وب‌سایت مدرسه — همه‌ی اعداد از پایگاه‌داده‌ی واقعی خوانده می‌شوند."
        actions={
          <Button onClick={() => go('publish')}>
            <Rocket className="ml-1 h-4 w-4" /> انتشار تغییرات
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((k) => (
          <button
            key={k.label}
            onClick={() => go(k.view)}
            className="soreh-card group p-4 text-right transition hover:-translate-y-0.5"
          >
            <k.icon className={`mb-2 h-5 w-5 ${k.color}`} />
            <p className="text-2xl font-extrabold fa-num">{faNum(k.value ?? 0)}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{k.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="soreh-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard className="h-4 w-4" /> میانبرهای پرکاربرد
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => go('staff')}>
              <Plus className="ml-1 h-4 w-4" /> افزودن عضو مدیریت
            </Button>
            <Button variant="secondary" size="sm" onClick={() => go('students')}>
              <Plus className="ml-1 h-4 w-4" /> افزودن دانش‌آموز برتر
            </Button>
            <Button variant="secondary" size="sm" onClick={() => go('news')}>
              <Plus className="ml-1 h-4 w-4" /> ثبت خبر یا اطلاعیه
            </Button>
            <Button variant="secondary" size="sm" onClick={() => go('media')}>
              <Upload className="ml-1 h-4 w-4" /> بارگذاری رسانه
            </Button>
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => go('users')}>
                <UserPlus className="ml-1 h-4 w-4" /> مدیریت کاربران
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <Globe className="ml-1 h-4 w-4" /> مشاهده سایت
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="soreh-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">آخرین فعالیت‌ها</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-y-auto">
            {stats.recentLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">هنوز فعالیتی ثبت نشده است.</p>
            )}
            {stats.recentLogs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 rounded-lg border p-2 text-xs">
                <div>
                  <span className="font-bold">{ACTION_LABEL[l.action] ?? l.action}</span>
                  {l.entity && <span className="text-muted-foreground"> در {ENTITY_LABEL[l.entity] ?? l.entity}</span>}
                  {l.detail && <span className="block text-muted-foreground">{l.detail}</span>}
                </div>
                <span className="whitespace-nowrap text-muted-foreground">{faDate(l.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
