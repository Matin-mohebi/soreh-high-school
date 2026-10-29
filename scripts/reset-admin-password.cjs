#!/usr/bin/env node
/**
 * تنظیم رمز حساب admin به admin (طبق درخواست صریح کاربر).
 * رمز با bcrypt هش می‌شود؛ پس از ورود می‌توان از بخش «کاربران و دسترسی‌ها» تغییرش داد.
 */
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin', 12)
  await db.user.update({
    where: { username: 'admin' },
    data: { passwordHash: hash },
  })
  console.log('OK — admin password reset to "admin" (bcrypt)')
  const users = await db.user.findMany({ select: { username: true, role: true } })
  console.log('users:', JSON.stringify(users))
}

main().finally(() => db.$disconnect())
