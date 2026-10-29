#!/usr/bin/env python3
"""
ساخت site.css برای وب‌سایت زنده Next.js دبیرستان سوره:
- ترکیب style.css + toolkit.css + extras.css سایت استاتیک
- تغییر نام متغیرهای CSS با پیشوند --cs- (جلوگیری از تداخل با توکن‌های shadcn)
- اسکوپ کردن همه سلکتورها زیر .cs (جلوگیری از نشت استایل به پنل مدیریت)
- @font-face محلی وزیرمتن (بدون وابستگی به Google Fonts)
"""
import re, os

SRC = '/home/z/my-project/public/site/assets/css'
OUT = '/home/z/my-project/src/styles/site.css'
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# متغیرهایی که باید پیشوند --cs- بگیرند (جلوگیری از تداخل با --accent و --card در shadcn)
VARS = ['paper', 'sand', 'ink-deep', 'ink', 'accent', 'sky-soft', 'sky',
        'grad-navy', 'grad-sky', 'pad', 'sec', 'ease', 'edge', 'glass', 'card',
        'c1', 'c2', 'c3']

def rename_vars(css: str) -> str:
    for v in VARS:
        css = re.sub(r'var\(--%s\b' % re.escape(v), f'var(--cs-{v}', css)
        css = re.sub(r'(?<![\w-])--%s\s*:' % re.escape(v), f'--cs-{v}:', css)
    return css

# سلکتورهایی که نباید پیشوند بگیرند
KEEP_EXACT = {'html', ':root', '@keyframes cs-float'}
KEEP_STARTSWITH = ('.js',)  # کلاس js روی <html> است و سلکتورهای آن را دست‌نخورده می‌گذاریم

def scope_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    if sel in KEEP_EXACT or any(sel.startswith(p) for p in KEEP_STARTSWITH):
        return sel
    if sel.startswith('@'):
        return sel  # at-rules داخلی نباید رسیده باشند
    return '.cs ' + sel

def scope_rules(css: str) -> str:
    """اسکوپ کردن سلکتورها در بلوک‌های سطح بالا و داخل @media"""
    out = []
    i, n = 0, len(css)
    while i < n:
        m = re.search(r'([^{}]+)\{', css[i:])
        if not m:
            out.append(css[i:])
            break
        out.append(css[i:i + m.start(1)])
        selector = m.group(1).strip()
        # پیدا کردن بدنه‌ی متوازن
        j = i + m.end()
        depth = 1
        while j < n and depth:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        body = css[i + m.end():j - 1]
        if selector.startswith('@media') or selector.startswith('@supports'):
            out.append(selector + '{' + scope_rules(body) + '}')
        elif selector.startswith('@keyframes') or selector.startswith('@font-face'):
            out.append(selector + '{' + body + '}')
        else:
            # reset جهانی: حالت خاص
            if selector == '*':
                out.append('.cs, .cs *{box-sizing:border-box;margin:0;padding:0}')
            elif selector == 'body':
                out.append('.cs{' + body + '}')
            elif selector in ('img', 'a') or selector == 'h1,h2,h3':
                parts = [scope_selector(s) for s in selector.split(',')]
                out.append(','.join(parts) + '{' + body + '}')
            else:
                parts = [scope_selector(s) for s in selector.split(',')]
                out.append(','.join(parts) + '{' + body + '}')
        i = j
    return ''.join(out)

def load(name: str) -> str:
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()

style_css = load('style.css')

combined = '\n\n'.join([style_css, load('toolkit.css'), load('extras.css')])
# حذف کامنت‌ها قبل از اسکوپ (کامنت داخل سلکتور باعث خرابی می‌شود)
combined = re.sub(r'/\*.*?\*/', '', combined, flags=re.S)
combined = rename_vars(combined)
combined = scope_rules(combined)

font_face = """/* ---- فونت محلی وزیرمتن (بدون وابستگی به CDN) ---- */
@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/Vazirmatn-Regular.woff2') format('woff2')}
@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:600;font-display:swap;src:url('/fonts/Vazirmatn-SemiBold.woff2') format('woff2')}
@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:800;font-display:swap;src:url('/fonts/Vazirmatn-ExtraBold.woff2') format('woff2')}
"""

header = """/* =====================================================================
   site.css — وب‌سایت دبیرستان سوره (تولیدشده از قالب Class Stars)
   با اسکریپت scripts/build-site-css.py ساخته می‌شود؛ ویرایش دستی نکنید.
   همه سلکتورها زیر .cs اسکوپ شده‌اند تا با پنل مدیریت تداخل نکنند.
   ===================================================================== */
"""

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(header + font_face + '\n' + combined)

print('OK →', OUT, f'({os.path.getsize(OUT)//1024}KB)')

# اعتبارسنجی ساده: توازن آکولادها
txt = open(OUT, encoding='utf-8').read()
print('braces balance:', txt.count('{') - txt.count('}'))
