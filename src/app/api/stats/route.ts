import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok } from '@/lib/api'
import { requireUser, unauthorized, forbidden } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** آمار داشبورد — بر پایه‌ی داده‌ی واقعی پایگاه‌داده (بدون عدد جعلی) */
export async function GET(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return unauthorized()
  if (user.role === 'SUBSCRIBER') return forbidden()

  const [staff, students, news, newsPublished, pages, users, media, messages, messagesUnread, logs] =
    await Promise.all([
      db.staffMember.count(),
      db.student.count(),
      db.newsPost.count(),
      db.newsPost.count({ where: { status: 'PUBLISHED' } }),
      db.pageBlock.count(),
      db.user.count(),
      db.media.count(),
      db.message.count(),
      db.message.count({ where: { read: false } }),
      db.activityLog.count(),
    ])

  const recentLogs = await db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  return ok({
    counts: {
      staff, students, news, newsPublished, pages, users, media,
      messages, messagesUnread, logs,
    },
    recentLogs,
  })
}
