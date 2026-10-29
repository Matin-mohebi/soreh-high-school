import { db } from '@/lib/db'
import {
  makeListHandler, makeCreateHandler, txt,
} from '@/lib/crud'

const cfg = {
  module: 'students',
  delegate: db.student,
  searchFields: ['name', 'rank', 'grade', 'note'],
  validate: (body: Record<string, unknown>, isCreate: boolean) => {
    const name = txt(body, 'name', 120)
    if (isCreate && !name) return 'نام دانش‌آموز را وارد کنید.'
    if (name && name.length < 2) return 'نام باید حداقل ۲ حرف باشد.'
    const data: Record<string, unknown> = {}
    if (name) data.name = name
    if (body.rank !== undefined) data.rank = txt(body, 'rank', 30)
    if (body.grade !== undefined) data.grade = txt(body, 'grade', 80)
    if (body.note !== undefined) data.note = txt(body, 'note', 300)
    if (body.photoUrl !== undefined) data.photoUrl = txt(body, 'photoUrl', 500)
    if (body.order !== undefined) data.order = Math.max(0, parseInt(String(body.order), 10) || 0)
    return data
  },
  label: (item: { name: string }) => item.name,
}

export const GET = makeListHandler(cfg)
export const POST = makeCreateHandler(cfg)

export const dynamic = 'force-dynamic'
