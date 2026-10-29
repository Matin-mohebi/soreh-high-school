# دبیرستان سوره — Soreh High School

وب‌سایت رسمی **دبیرستان سوره** — مهاجرت‌یافته از وردپرس (قالب Class Stars + افزونه Class Stars Toolkit) به یک سایت استاتیک قابل میزبانی روی GitHub Pages، همراه با **پنل مدیریت فارسی راست‌چین** و سرویس انتشار امن.

**آدرس سایت:** https://matin-mohebi.github.io/soreh-high-school/
**پنل مدیریت (پیش‌نمایش):** https://matin-mohebi.github.io/soreh-high-school/admin/

> نشانی ترجیحی `https://soreh-high-school.github.io/` فقط با ساخت حساب سازمانی جدید به نام `soreh-high-school` ممکن است (API گیت‌هاب اجازه‌ی ساخت سازمان نمی‌دهد). راهنمای انتقال بعدی در پایین همین فایل آمده است.

---

## ساختار مخزن

| مسیر | نقش |
|---|---|
| `wordpress-source/` | فایل‌های اصلی وردپرس — دست‌نخورده (شاخه‌ی `migration/soreh-school` نیز نسخه‌ی خالص را نگه می‌دارد) |
| `content/*.json` | **منبع حقیقت محتوا** — همان چیزی که پنل مدیریت ویرایش می‌کند |
| `site/` | دارایی‌های استاتیک (CSS سه‌لایه‌ی قالب، JS، فونت وزیرمتن، پنل مدیریت) |
| `site/assets/js/render.js` | موتور رندر ایزومورفیک (build + پیش‌نمایش پنل + سرویس) |
| `tools/build.js` | ساخت `dist/` از `content/` + `site/` — بدون وابستگی |
| `admin/` (داخل site) | پنل مدیریت SPA (روی Pages: حالت پیش‌نمایش) |
| `admin-server/` | سرویس Node بدون وابستگی: احراز هویت واقعی + انتشار به GitHub |
| `.github/workflows/deploy.yml` | ساخت و انتشار خودکار روی GitHub Pages |

## راه‌اندازی محلی

```bash
npm run build        # ساخت dist/
npx serve dist       # یا هر وب‌سرور استاتیک
```

## انتشار محتوا از پنل

**حالت پیش‌نمایش (روی GitHub Pages):** ویرایش‌ها به‌صورت پیش‌نویس محلی ذخیره می‌شوند؛ از بخش «انتشار تغییرات» می‌توان JSON ها را دانلود و در پوشه‌ی `content/` کامیت کرد.

**حالت متصل (سرویس مدیریت):** با اجرای `admin-server` پنل به حالت واقعی می‌رود و انتشار = commit خودکار به مخزن → بازسازی خودکار سایت. راهنمای کامل: [`admin-server/README.md`](admin-server/README.md).

## مهاجرت به نشانی سازمانی `soreh-high-school.github.io`

1. حساب سازمانی جدید با نام `soreh-high-school` بسازید (فقط از رابط وب).
2. مخزن `soreh-high-school.github.io` را در همان سازمان بسازید و این مخزن را منتقل/کپی کنید.
3. در `content/settings.json` مقدار `site.siteUrl` را به `https://soreh-high-school.github.io/` تغییر دهید و یک بار منتشر کنید.

## امنیت

- هیچ توکن یا رمزی در کد فرانت‌اند نیست؛ توکن GitHub فقط داخل `admin-server` (متغیر محیطی).
- احراز هویت سمت سرور (scrypt + کوکی HttpOnly/SameSite=Strict) + محدودسازی نرخ + بررسی Origin.
- پنل روی میزبانی استاتیک **پیش‌نمایش (Prototype)** است و صادقانه برچسب خورده — ادعای احراز هویت واقعی ندارد.
- اطلاعات دانش‌آموزان (رتبه/پایه) محتوای عمومی نمایشی است؛ هیچ داده‌ی شخصی حساس در این سیستم نگهداری نمی‌شود.

## مجوز فونت

فونت [وزیرمتن](https://github.com/rastikerdar/vazirmatn) با مجوز OFL (فایل `site/assets/fonts/OFL.txt`).
