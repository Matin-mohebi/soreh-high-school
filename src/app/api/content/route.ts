import { NextRequest } from 'next/server'
import { jsonWithCors, corsPreflight } from '@/lib/api'
import { buildContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

/** پیش‌نمایش محتوای منتشرشونده (همان content.json سایت استاتیک) */
export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function GET(req: NextRequest) {
  const content = await buildContent()
  return jsonWithCors(req, content)
}
