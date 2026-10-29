# وب‌سایت هنرستان‌های غیردولتی سوره زنجان

نسخه استاتیک (HTML/CSS/JS خالص) وب‌سایت هنرستان‌های غیردولتی دخترانه و پسرانه سوره زنجان، سازگار با GitHub Pages — بدون نیاز به سرور، PHP یا پایگاه‌داده.

## ساختار

- `index.html` و صفحات داخلی — ۱۲ صفحه مطابق منوی سایت
- `assets/css/style.css` — قالب پایه (برگرفته از قالب وردپرس «Class Stars»)
- `assets/css/extras.css` — افزودنی‌های طراحی و فونت سلف‌هاست
- `assets/js/data.js` — داده اخبار (۳۲۴ خبر واقعی با تاریخ شمسی) و متولدین امروز
- `assets/js/site.js` — رندر اخبار، فیلتر سال/موضوع، جستجو، فرم‌ها و منوی موبایل
- `assets/img/` — تصاویر و فاوآیکون
- `assets/fonts/` — فونت وزیرمتن (سلف‌هاست)
- `wordpress-class-stars/` و `wordpress-source/` — آرشیو فایل‌های اصلی وردپرس (حفظ‌شده)

## ویرایش اخبار

برای افزودن/ویرایش خبر، فایل `assets/js/data.js` را ویرایش کنید:

```js
{ "t": "عنوان خبر", "d": "1405/08/01 23:50:20", "c": "events" }
```

دسته‌ها: `honors` (افتخارات)، `events` (فعالیت‌ها)، `courses` (دوره‌های فنی-مهارتی)، `guidance` (مشاوره و کنکور)، `exams` (ثبت‌نام و امتحانات)، `school` (اخبار هنرستان).

## انتشار

با هر push به شاخه `migration/soreh-school`، اکشن `.github/workflows/deploy-pages.yml` سایت را به GitHub Pages منتشر می‌کند:

**https://matin-mohebi.github.io/soreh-high-school/**
