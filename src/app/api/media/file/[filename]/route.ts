import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { corsHeaders, corsPreflight } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** سرو فایل‌های رسانه (عمومی — تصاویر سایت) */
export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ filename: string }> }) {
  const { filename } = await ctx.params
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  const media = await db.media.findUnique({ where: { filename: safeName } })
  if (!media) {
    return NextResponse.json({ error: 'فایل پیدا نشد.' }, { status: 404 })
  }
  const fs = await import('fs/promises')
  const path = await import('path')
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'db', 'media', safeName))
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': media.mime,
        'Content-Length': String(buf.length),
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders(req),
      },
    })
  } catch {
    return NextResponse.json({ error: 'فایل روی دیسک یافت نشد.' }, { status: 404 })
  }
}
