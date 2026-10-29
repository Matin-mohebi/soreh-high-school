#!/usr/bin/env python3
"""
پاک‌سازی داده‌های آزمایشی تکراری و درج محتوای نمونه برای دبیرستان سوره.
- حذف رکوردهای تکراری (staff/news دوبله)
- درج اخبار نمونه، برگه‌ها، منو و برنامه هفتگی نمونه
- همه محتواها از پنل مدیریت قابل ویرایش یا حذف هستند.
"""
import sqlite3, uuid, json
from datetime import datetime

con = sqlite3.connect('/home/z/my-project/db/custom.db')
cur = con.cursor()
now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3] + 'Z'

def uid():
    return 'c' + uuid.uuid4().hex[:24]

# ---------- ۱) پاک‌سازی تکراری‌ها ----------
# کارکنان: فقط یکی از هر (name, role) نگه داشته می‌شود
rows = cur.execute('SELECT id, name, role FROM StaffMember ORDER BY createdAt ASC').fetchall()
seen, dup = set(), []
for r in rows:
    key = (r[1].strip(), r[2].strip())
    if key in seen:
        dup.append(r[0])
    else:
        seen.add(key)
for i in dup:
    cur.execute('DELETE FROM StaffMember WHERE id=?', (i,))
print('staff duplicates removed:', len(dup))

# اخبار: فقط یکی از هر عنوان
rows = cur.execute('SELECT id, title FROM NewsPost ORDER BY createdAt ASC').fetchall()
seen, dup = set(), []
for r in rows:
    key = r[1].strip()
    if key in seen:
        dup.append(r[0])
    else:
        seen.add(key)
for i in dup:
    cur.execute('DELETE FROM NewsPost WHERE id=?', (i,))
print('news duplicates removed:', len(dup))

# عنوان «سلام دنیا» آزمایشی است؛ اگر باقی مانده حذف می‌شود
cur.execute("DELETE FROM NewsPost WHERE title LIKE '%سلام دنیا%'")

# ---------- ۲) اخبار نمونه ----------
NEWS = [
    {
        'title': 'آغاز سال تحصیلی جدید مبارک',
        'excerpt': 'سال تحصیلی جدید را به همه دانش‌آموزان، والدین و همکاران گرامی تبریک می‌گوییم.',
        'body': '<p>همکاران گرامی، دانش‌آموزان عزیز و والدین محترم؛</p><p>سال تحصیلی جدید را به شما تبریک و تهنیت می‌گوییم. امیدواریم سالی پر از موفقیت، سلامتی و پیشرفت تحصیلی برای همه شما رقم بخورد.</p><p>لطفاً برنامه‌های آموزشی و اطلاعیه‌های مدرسه را در همین صفحه دنبال کنید.</p>',
        'important': 1,
    },
    {
        'title': 'جلسه انجمن اولیا و مربیان',
        'excerpt': 'زمان جلسه انجمن اولیا و مربیان متعاقباً از طریق همین صفحه اعلام می‌شود.',
        'body': '<p>اولیای محترم؛</p><p>جلسه انجمن اولیا و مربیان در ابتدای سال تحصیلی برگزار خواهد شد. زمان دقیق جلسه پس از نهایی شدن تقویم آموزشی از همین طریق اطلاع‌رسانی می‌شود.</p><p>حضور شما در این جلسه نقش مؤثری در هماهنگی خانه و مدرسه دارد.</p>',
        'important': 0,
    },
    {
        'title': 'ثبت‌نام دانش‌آموزان جدید',
        'excerpt': 'مراحل ثبت‌نام دانش‌آموزان جدید از طریق دفتر مدرسه انجام می‌شود.',
        'body': '<p>والدین گرامی؛</p><p>ثبت‌نام دانش‌آموزان جدید در دبیرستان سوره از طریق دفتر مدرسه انجام می‌شود. برای اطلاع از مدارک لازم و زمان مراجعه، با دفتر مدرسه تماس بگیرید یا از طریق فرم «تماس با ما» همین سایت پیام بگذارید تا در اولین فرصت با شما تماس بگیریم.</p>',
        'important': 0,
    },
]
cur.execute('SELECT COUNT(*) FROM NewsPost')
if cur.fetchone()[0] == 0:
    for i, n in enumerate(NEWS):
        cur.execute(
            'INSERT INTO NewsPost (id,title,excerpt,body,important,status,publishedAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
            (uid(), n['title'], n['excerpt'], n['body'], n['important'], 'PUBLISHED', now, now, now))
    print('sample news inserted:', len(NEWS))

# ---------- ۳) برگه‌های نمونه ----------
PAGES = [
    {
        'title': 'درباره دبیرستان سوره',
        'slug': 'about',
        'body': '<p>دبیرستان سوره با هدف پرورش دانش‌آموزانی مسئولیت‌پذیر و علاقه‌مند به یادگیری فعالیت می‌کند. تلاش ما فراهم کردن محیطی آرام، منظم و پویا برای تحصیل و رشد个人ی دانش‌آموزان است.</p><p>در این مدرسه پیگیری تحصیلی دانش‌آموزان، ارتباط منظم با خانواده‌ها و معرفی دانش‌آموزان کوشا از اولویت‌های کاری ماست. متن این برگه از پنل مدیریت قابل ویرایش است؛ مدیران می‌توانند تاریخچه و اطلاعات دقیق مدرسه را همین‌جا وارد کنند.</p>',
        'showInNav': 1,
    },
    {
        'title': 'راهنمای ثبت‌نام',
        'slug': 'registration-guide',
        'body': '<p>برای ثبت‌نام دانش‌آموز جدید، والدین گرامی می‌توانند با دفتر مدرسه تماس بگیرند یا از فرم «تماس با ما» در همین سایت درخواست خود را ثبت کنند تا راهنمایی لازم انجام شود.</p><ul><li>تماس یا ارسال پیام از طریق فرم تماس</li><li>مراجعه به دفتر مدرسه در ساعات اداری</li><li>تکمیل مدارک ثبت‌نام طبق راهنمای دفتر مدرسه</li></ul><p>این متن نمونه است و می‌توانید آن را از پنل مدیریت مطابق رویه واقعی مدرسه ویرایش کنید.</p>',
        'showInNav': 1,
    },
]
for p in PAGES:
    exists = cur.execute('SELECT COUNT(*) FROM PageBlock WHERE slug=?', (p['slug'],)).fetchone()[0]
    if not exists:
        cur.execute(
            'INSERT INTO PageBlock (id,title,slug,body,showInNav,status,"order",createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
            (uid(), p['title'], p['slug'], p['body'], p['showInNav'], 'PUBLISHED', 0, now, now))
print('pages ensured')

# ---------- ۴) منوی سایت (مسیرهای سایت زنده؛ در انتشار استاتیک به مسیر نسبی تبدیل می‌شود) ----------
MENU = [
    ('درباره', '/#about'),
    ('مدیر و معاونان', '/#staff'),
    ('دانش‌آموزان', '/#students'),
    ('اخبار', '/news'),
    ('برنامه هفتگی', '/schedule'),
    ('تماس با ما', '/contact'),
]
if cur.execute('SELECT COUNT(*) FROM MenuItem').fetchone()[0] == 0:
    for i, (label, href) in enumerate(MENU):
        cur.execute('INSERT INTO MenuItem (id,label,href,"order") VALUES (?,?,?,?)', (uid(), label, href, i))
    print('menu inserted')

# ---------- ۵) برنامه هفتگی نمونه ----------
SCHEDULE = [
    (0, '۰۷:۳۰ - ۰۹:۱۵', 'ریاضی', ''), (0, '۰۹:۳۰ - ۱۱:۱۵', 'فیزیک', ''),
    (1, '۰۷:۳۰ - ۰۹:۱۵', 'شیمی', ''), (1, '۰۹:۳۰ - ۱۱:۱۵', 'ادبیات فارسی', ''),
    (2, '۰۷:۳۰ - ۰۹:۱۵', 'زبان انگلیسی', ''), (2, '۰۹:۳۰ - ۱۱:۱۵', 'زیست‌شناسی', ''),
]
if cur.execute('SELECT COUNT(*) FROM ScheduleEntry').fetchone()[0] == 0:
    for day, time, subject, teacher in SCHEDULE:
        cur.execute('INSERT INTO ScheduleEntry (id,day,time,subject,teacher,"order") VALUES (?,?,?,?,?,?)',
                    (uid(), day, time, subject, teacher, 0))
    print('sample schedule inserted')

# ---------- ۶) تنظیم توضیح کوتاه بخش اخبار ----------
cur.execute("INSERT OR REPLACE INTO Setting (key,value,updatedAt) VALUES (?,?,?)",
            ('news.text', 'تازه‌ترین خبرها و اطلاعیه‌های دبیرستان سوره را اینجا دنبال کنید.', now))

con.commit()
print('done.')
