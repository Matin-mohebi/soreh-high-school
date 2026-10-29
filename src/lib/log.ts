import { db } from '@/lib/db'

/** ثبت رویداد در گزارش فعالیت (ActivityLog) */
export async function logActivity(opts: {
  username?: string
  action: string
  entity?: string
  entityId?: string
  detail?: string
}) {
  try {
    await db.activityLog.create({
      data: {
        username: opts.username ?? '',
        action: opts.action,
        entity: opts.entity ?? '',
        entityId: opts.entityId ?? '',
        detail: (opts.detail ?? '').slice(0, 500),
      },
    })
  } catch (e) {
    console.error('activity log failed', e)
  }
}
