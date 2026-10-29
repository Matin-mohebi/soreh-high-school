import { db } from '@/lib/db'
import { getSettings, boolVal } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'برنامه هفتگی' }

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه']

export default async function SchedulePage() {
  const [settings, rows] = await Promise.all([
    getSettings(),
    db.scheduleEntry.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] }),
  ])

  const enabled = boolVal(settings['schedule.enabled'])
  const title = settings['schedule.title']
  const text = settings['schedule.text']
  const days = DAYS.map((day, i) => ({
    day,
    rows: rows.filter((r) => r.day === i).map((r) => ({ time: r.time, subject: r.subject, teacher: r.teacher })),
  }))
  const hasRows = days.some((d) => d.rows.length > 0)

  return (
    <main id="main" className="page page--wide">
      <article className="page__in">
        <h1>{title}</h1>
        <p className="prose">{text}</p>
        <div style={{ marginTop: 18 }}>
          {!enabled ? (
            <p className="empty-note">نمایش برنامه هفتگی در حال حاضر غیرفعال است.</p>
          ) : !hasRows ? (
            <p className="empty-note">برنامه هفتگی هنوز توسط مدرسه ثبت نشده است.</p>
          ) : (
            <div className="sched">
              <table>
                <thead>
                  <tr><th>روز</th><th>ساعت</th><th>درس</th><th>دبیر</th></tr>
                </thead>
                <tbody>
                  {days.map((d) =>
                    d.rows.map((r, i) => (
                      <tr key={`${d.day}-${i}`}>
                        {i === 0 ? <td className="day-h" rowSpan={d.rows.length}>{d.day}</td> : null}
                        <td className="t">{r.time}</td>
                        <td>{r.subject}</td>
                        <td>{r.teacher}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </main>
  )
}
