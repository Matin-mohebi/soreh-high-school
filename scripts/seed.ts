/**
 * بذرگذاری پایگاه‌داده دبیرستان سوره
 * - ساخت حساب مدیر کل (نام کاربری: admin)
 * - ذخیره‌ی تنظیمات پیش‌فرض (متن‌های قالب Class Stars + نام مدرسه)
 * - هیچ محتوای جعلی (معلم/دانش‌آموز/خبر) ساخته نمی‌شود؛ محتوای واقعی را مدیر وارد می‌کند.
 *
 * اجرا: bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SETTING_DEFAULTS } from '../src/lib/settings'

const prisma = new PrismaClient()

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Soreh@Admin1404'

async function main() {
  console.log('… seeding Soreh High School database')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const admin = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      email: 'admin@soreh-high-school.local',
      name: 'مدیر دبیرستان سوره',
      passwordHash,
      role: 'ADMIN',
    },
  })

  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    })
  }

  await prisma.activityLog.create({
    data: {
      username: ADMIN_USERNAME,
      action: 'SEED',
      entity: 'database',
      detail: 'بذرگذاری اولیه: حساب مدیر کل و تنظیمات پیش‌فرض قالب Class Stars',
    },
  })

  console.log(`✓ admin user: ${admin.username}`)
  console.log(`✓ initial password: ${ADMIN_PASSWORD}  (حتما بعد از اولین ورود از بخش «کاربران» تغییر دهید)`)
  console.log(`✓ settings seeded: ${Object.keys(SETTING_DEFAULTS).length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
