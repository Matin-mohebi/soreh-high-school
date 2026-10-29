import { db } from '@/lib/db'
import {
  makeListHandler, makeCreateHandler, makeUpdateHandler, makeDeleteHandler, txt,
} from '@/lib/crud'

const cfg = {
  module: 'staff',
  delegate: db.staffMember,
  searchFields: ['name', 'role', 'bio'],
  validate: (body: Record<string, unknown>, isCreate: boolean) => {
    const name = txt(body, 'name', 120)
    if (isCreate && !name) return 'نام عضو را وارد کنید.'
    if (name && name.length < 2) return 'نام باید حداقل ۲ حرف باشد.'
    const data: Record<string, unknown> = {}
    if (name) data.name = name
    if (body.role !== undefined) data.role = txt(body, 'role', 120)
    if (body.bio !== undefined) data.bio = txt(body, 'bio', 2000)
    if (body.photoUrl !== undefined) data.photoUrl = txt(body, 'photoUrl', 500)
    if (body.order !== undefined) data.order = Math.max(0, parseInt(String(body.order), 10) || 0)
    return data
  },
  label: (item: { name: string }) => item.name,
}

export const GET = makeListHandler(cfg)
export const POST = makeCreateHandler(cfg)
export const PUT = makeUpdateHandler(cfg)
export const DELETE = makeDeleteHandler(cfg)

export const dynamic = 'force-dynamic'
