/* =====================================================================
   موتور رندر دبیرستان سوره — ایزومورفیک (Node + مرورگر)
   ساختار HTML دقیقاً بر اساس قالب Class Stars (front-page/header/footer/page.php)
   استفاده‌شده در: tools/build.js، پیش‌نمایش پنل مدیریت، admin-server
   ===================================================================== */

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function faNum(v) {
  return String(v ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function faDate(iso) {
  try {
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return escapeHtml(iso);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  } catch { return escapeHtml(iso); }
}

function trimWords(text, n) {
  const words = String(text ?? '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/);
  return words.length <= n ? words.join(' ') : words.slice(0, n).join(' ') + '…';
}

function nl2br(s) { return escapeHtml(s).replace(/\r?\n/g, '<br>'); }

/* مسیر پایه نسبت به عمق صفحه (سازگار با زیرمسیر GitHub Pages) */
function base(depth) { return depth <= 0 ? './' : '../'.repeat(depth); }

function asset(depth, v) {
  const b = base(depth);
  return (p) => `${b}${p}?v=${v}`;
}

function head(data, { depth = 0, pageTitle, desc, path = '', ogType = 'website' } = {}) {
  const s = data.settings || {};
  const site = s.site || {};
  const seo = s.seo || {};
  const v = data.__v || '1';
  const A = asset(depth, v);
  const url = (site.siteUrl || '').replace(/\/?$/, '/');
  const fullTitle = pageTitle ? `${pageTitle} | ${site.schoolName || ''}` : (seo.title || site.schoolName || '');
  const description = escapeHtml(desc || seo.description || '');
  const canonical = url + path;
  const favicon = s.appearance?.favicon ? escUrl(s.appearance.favicon) : A('assets/img/favicon.svg');
  const ogImg = seo.ogImage ? escUrl(seo.ogImage) : '';
  return `<!DOCTYPE html>
<html lang="${escapeHtml(site.lang || 'fa-IR')}" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('cs_gate'))document.documentElement.classList.add('seen')}catch(e){}</script>
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${description}">
${seo.keywords ? `<meta name="keywords" content="${escapeHtml(seo.keywords)}">` : ''}
${url ? `<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:site_name" content="${escapeHtml(site.schoolName || '')}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${ogImg ? `<meta property="og:image" content="${escapeHtml(ogImg)}">` : ''}
<meta name="twitter:card" content="${ogImg ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escapeHtml(fullTitle)}">
<meta name="twitter:description" content="${description}">` : ''}
<meta name="theme-color" content="#0a2a52">
<link rel="icon" href="${escapeHtml(favicon)}" type="image/svg+xml">
<link rel="stylesheet" href="${A('assets/css/style.css')}">
${url ? `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"School","name":${JSON.stringify(site.schoolName || '')},"alternateName":${JSON.stringify(site.schoolNameEn || '')},"url":${JSON.stringify(url)}}
</script>` : ''}
</head>`;
}

function escUrl(u) { return String(u ?? '').trim(); }

function topBar(data, { depth = 0, activePage = false } = {}) {
  const s = data.settings || {};
  const site = s.site || {};
  const menu = Array.isArray(s.menu) ? s.menu : [];
  const b = base(depth);
  const A = asset(depth, data.__v || '1');
  const logo = s.appearance?.logo
    ? `<img src="${escapeHtml(logoUrl(s.appearance.logo, b))}" alt="">`
    : '';
  const items = menu.map((m) => {
    const href = String(m.href || '#');
    const abs = /^(https?:)?\/\//i.test(href);
    const target = abs ? ' target="_blank" rel="noopener"' : '';
    const url = abs ? href : (href.startsWith('#') ? `${b}${href.slice(1) ? href : ''}` : `${b}${href.replace(/^\.\//, '')}`);
    return `<a href="${escapeHtml(url)}"${target}>${escapeHtml(m.label || '')}</a>`;
  }).join('\n');
  return `<header class="bar">
<a class="mark" href="${b}">${logo}${escapeHtml(site.schoolName || '')}</a>
<nav aria-label="منوی اصلی">
${items}
</nav>
<div class="acts">
<a href="${b}login/">ورود</a>
<a class="btn btn--sm" href="${b}register/">ثبت‌نام</a>
</div>
</header>`;
}

function logoUrl(u, b) {
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  return b + String(u).replace(/^\//, '');
}

function mediaUrl(u, b) {
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
  return b + String(u).replace(/^\//, '');
}

function footer(data, { depth = 0 } = {}) {
  const s = data.settings || {};
  const site = s.site || {};
  const f = s.footer || {};
  return `<footer class="foot">
<p class="foot__name">${escapeHtml(site.schoolName || '')}</p>
<div class="foot__row">
<span>${escapeHtml(f.note || '')}</span>
${f.address ? `<span>${escapeHtml(f.address)}</span>` : ''}
${f.phone ? `<span dir="ltr">${escapeHtml(f.phone)}</span>` : ''}
</div>
<div class="foot__row foot__meta">
<span>${escapeHtml(site.schoolNameEn || '')}</span>
<span>ساخته‌شده با عشق برای یادگیری</span>
</div>
</footer>`;
}

function toolkitControls(data) {
  const t = data.settings?.toolkit || {};
  let out = '';
  if (t.progressBar) out += '<div class="cst-progress" aria-hidden="true"><span></span></div>';
  if (t.backToTop) out += '<button class="cst-top" type="button" aria-label="بازگشت به بالای صفحه" title="بازگشت به بالای صفحه" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-7 7 7M12 7v12"/></svg></button>';
  return out;
}

/* ---------- صفحه اصلی (معادل front-page.php) ---------- */
export function renderHome(data, opts = {}) {
  const depth = opts.depth ?? 0;
  const v = data.__v || '1';
  const A = asset(depth, v);
  const s = data.settings || {};
  const site = s.site || {};
  const hero = s.hero || {};
  const about = s.about || {};
  const sec = s.sections || {};
  const staff = (data.staff || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0) || (b.id || 0) - (a.id || 0));
  const students = (data.students || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0) || (b.id || 0) - (a.id || 0));
  const ann = (data.announcements || []).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
  const t = s.toolkit || {};

  const statsHtml = (about.stats || []).map((st) => `
<li data-reveal>
<b data-count="${escapeHtml(String(st.n).replace(/\D/g, ''))}">${faNum(st.n)}</b>
<span>${escapeHtml(st.label || '')}</span>
</li>`).join('');

  const staffCards = staff.map((p) => `
<article class="person" data-reveal>
<div class="ph ph--portrait">${p.photo ? `<img src="${escapeHtml(mediaUrl(p.photo, base(depth)))}" alt="${escapeHtml(p.name)}" loading="lazy">` : ''}</div>
<h3>${escapeHtml(p.name || '')}</h3>
<p class="role">${escapeHtml(p.role || '')}</p>
<p>${escapeHtml(trimWords(p.bio || '', 28))}</p>
</article>`).join('');
  let staffEmpty = '';
  for (let i = staff.length; i < 4; i++) {
    staffEmpty += `
<article class="person person--empty" data-reveal>
<div class="ph ph--portrait"></div>
<h3>نام مدیر یا معاون</h3>
<p class="role">سمت</p>
<p>توضیح کوتاه درباره این فرد اینجا نمایش داده می‌شود.</p>
</article>`;
  }

  const kidCards = students.map((p) => `
<article class="kid" data-reveal>
<div class="ph ph--square">${p.photo ? `<img src="${escapeHtml(mediaUrl(p.photo, base(depth)))}" alt="${escapeHtml(p.name)}" loading="lazy">` : ''}</div>
${p.rank ? `<b class="rank">${escapeHtml(p.rank)}</b>` : ''}
<h3>${escapeHtml(p.name || '')}</h3>
<p class="role">${escapeHtml(p.grade || '')}</p>
<p>${escapeHtml(p.note || '')}</p>
</article>`).join('');
  let kidEmpty = '';
  for (let i = students.length; i < 8; i++) {
    kidEmpty += `
<article class="kid kid--empty" data-reveal>
<div class="ph ph--square"></div>
<b class="rank">؟</b>
<h3>نام دانش‌آموز</h3>
<p class="role">پایه</p>
</article>`;
  }

  const annHtml = ann.length ? ann.map((a) => `
<article class="notice${a.pinned ? ' notice--pinned' : ''}" data-reveal>
<div class="notice__date"><b>${faDate(a.date)}</b>${a.pinned ? '<span class="pin">مهم</span>' : ''}</div>
<div class="notice__body">
<h3><a href="${base(depth)}announcements/${encodeURIComponent(a.slug)}/">${escapeHtml(a.title || '')}</a></h3>
<p>${escapeHtml(trimWords(a.body || '', 40))}</p>
</div>
</article>`).join('') : `
<p class="empty-note" data-reveal>فعلاً اطلاعیه‌ای ثبت نشده است.</p>`;

  const gateTextStaff = escapeHtml(sec.gateStaffText || '');
  const gateTextStudents = escapeHtml(sec.gateStudentsText || '');
  const join = s.join || {};

  return `${head(data, { depth, path: '', desc: s.seo?.description })}
<body data-depth="${depth}">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}

<div class="gate" id="gate" role="dialog" aria-label="ورود به سایت">
<a class="gate__half gate__half--staff" href="#staff" data-go="staff">
<strong>${escapeHtml(sec.staffTitle || '')}</strong>
<span>${gateTextStaff}</span>
</a>
<a class="gate__half gate__half--students" href="#students" data-go="students">
<strong>${escapeHtml(sec.studentsTitle || '')}</strong>
<span>${gateTextStudents}</span>
</a>
<button class="gate__skip" type="button" data-skip>ورود به صفحه اصلی</button>
</div>

<main id="main">

<section class="hero${hero.image ? ' hero--img' : ''}">
<div class="hero__text">
<h1 data-reveal>${escapeHtml(site.schoolName || '')}</h1>
<p data-reveal>${nl2br(hero.text || '')}</p>
<p class="hero__acts" data-reveal>
<a class="btn" href="#students">برترین‌ها را ببینید</a>
<a class="link" href="#staff">آشنایی با مدیریت</a>
</p>
</div>
${hero.image ? `<div class="hero__img"><img src="${escapeHtml(mediaUrl(hero.image, base(depth)))}" alt=""></div>` : ''}
</section>

<section class="about" id="about">
<div class="about__text">
<h2 data-reveal>${escapeHtml(about.title || '')}</h2>
<p data-reveal>${nl2br(about.text || '')}</p>
</div>
<ul class="stats">
${statsHtml}
</ul>
</section>

<section class="staff" id="staff">
<div class="head">
<h2 data-reveal>${escapeHtml(sec.staffTitle || '')}</h2>
<p data-reveal>${nl2br(sec.staffText || '')}</p>
</div>
<div class="grid grid--staff">
${staffCards}${staffEmpty}
</div>
</section>

<section class="students" id="students">
<div class="head">
<h2 data-reveal>${escapeHtml(sec.studentsTitle || '')}</h2>
<p data-reveal>${nl2br(sec.studentsText || '')}</p>
</div>
<div class="grid grid--students">
${kidCards}${kidEmpty}
</div>
</section>

<section class="announcements" id="announcements">
<div class="head">
<h2 data-reveal>اطلاعیه‌ها و اخبار</h2>
<p data-reveal>تازه‌ترین اطلاعیه‌های ${escapeHtml(site.schoolName || '')}</p>
</div>
<div class="notices">
${annHtml}
</div>
</section>

${join.enabled === false ? '' : `
<section class="join" id="join">
<h2 data-reveal>${escapeHtml(join.title || 'عضو خانواده مدرسه شوید')}</h2>
<p data-reveal>${escapeHtml(join.text || '')}</p>
<p class="hero__acts" data-reveal>
<a class="btn" href="${base(depth)}register/">ثبت‌نام</a>
<a class="link" href="${base(depth)}login/">ورود</a>
</p>
</section>`}

</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* ---------- برگه‌های ورود و ثبت‌نام (معادل shortcodeهای قالب) ---------- */
export function renderAuthPage(data, kind, opts = {}) {
  const depth = opts.depth ?? 1;
  const isLogin = kind === 'login';
  const title = isLogin ? 'ورود' : 'ثبت‌نام';
  const v = data.__v || '1';
  const A = asset(depth, v);
  const form = isLogin ? `
<form class="auth" data-auth="login">
<label>نام کاربری یا ایمیل<input name="user" required autocomplete="username" dir="ltr"></label>
<label>رمز عبور<input type="password" name="pass" required autocomplete="current-password" dir="ltr"></label>
<label class="check"><input type="checkbox" name="remember" value="1"> مرا به خاطر بسپار</label>
<button class="btn" type="submit">ورود</button>
<p class="alt">حساب ندارید؟ <a href="../register/">ثبت‌نام</a></p>
</form>` : `
<form class="auth" data-auth="register">
<label>نام و نام خانوادگی<input name="name" autocomplete="name"></label>
<label>نام کاربری (انگلیسی)<input name="user" required autocomplete="username" dir="ltr" minlength="3"></label>
<label>ایمیل<input type="email" name="email" required autocomplete="email" dir="ltr"></label>
<label>رمز عبور (حداقل ۸ کاراکتر)<input type="password" name="pass" required minlength="8" autocomplete="new-password" dir="ltr"></label>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn" type="submit">ثبت‌نام</button>
<p class="alt">قبلا ثبت‌نام کرده‌اید؟ <a href="../login/">ورود</a></p>
</form>`;

  return `${head(data, { depth, path: `${kind}/`, title, ogType: 'website' })}
<body data-depth="${depth}" class="page-body">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}
<main id="main" class="page">
<article class="page__in">
<h1>${title}</h1>
<div class="prose"><p>برای باخبر شدن از اطلاعیه‌های مدرسه، عضو خانواده ${escapeHtml(data.settings?.site?.schoolName || '')} شوید.</p></div>
${form}
<p class="msg msg--static" hidden>سرویس عضویت در نسخه‌ی میزبانی‌شده‌ی استاتیک فعال نیست؛ برای فعال‌سازی، سرویس مدیریت (admin-server) باید اجرا شود.</p>
</article>
</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* ---------- جزئیات اطلاعیه ---------- */
export function renderAnnouncement(data, item, opts = {}) {
  const depth = opts.depth ?? 1;
  const v = data.__v || '1';
  const A = asset(depth, v);
  return `${head(data, { depth, path: `announcements/${item.slug}/`, title: item.title, desc: trimWords(item.body || '', 30), ogType: 'article' })}
<body data-depth="${depth}" class="page-body">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}
<main id="main" class="page">
<article class="page__in page__in--wide">
<h1>${escapeHtml(item.title || '')}</h1>
<p class="page__date">${faDate(item.date)}${item.pinned ? ' · <b class="pin">مهم</b>' : ''}</p>
<div class="prose">${nl2br(item.body || '')}</div>
<p class="alt"><a href="../">همه اطلاعیه‌ها</a> · <a href="../../">صفحه اصلی</a></p>
</article>
</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* ---------- فهرست اطلاعیه‌ها ---------- */
export function renderAnnouncementsIndex(data, opts = {}) {
  const depth = opts.depth ?? 1;
  const v = data.__v || '1';
  const A = asset(depth, v);
  const ann = (data.announcements || []).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
  const items = ann.length ? ann.map((a) => `
<article class="notice${a.pinned ? ' notice--pinned' : ''}">
<div class="notice__date"><b>${faDate(a.date)}</b>${a.pinned ? '<span class="pin">مهم</span>' : ''}</div>
<div class="notice__body">
<h3><a href="${encodeURIComponent(a.slug)}/">${escapeHtml(a.title || '')}</a></h3>
<p>${escapeHtml(trimWords(a.body || '', 40))}</p>
</div>
</article>`).join('') : '<p class="empty-note">فعلاً اطلاعیه‌ای ثبت نشده است.</p>';
  return `${head(data, { depth, path: 'announcements/', title: 'اطلاعیه‌ها' })}
<body data-depth="${depth}" class="page-body">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}
<main id="main" class="page">
<article class="page__in page__in--wide">
<h1>اطلاعیه‌ها و اخبار</h1>
<div class="notices">${items}</div>
<p class="alt"><a href="../">صفحه اصلی</a></p>
</article>
</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* ---------- برگه‌های دلخواه (معادل page.php) ---------- */
export function renderCustomPage(data, page, opts = {}) {
  const depth = opts.depth ?? 1;
  const v = data.__v || '1';
  const A = asset(depth, v);
  return `${head(data, { depth, path: `${page.slug}/`, title: page.title, desc: trimWords(page.content || '', 30) })}
<body data-depth="${depth}" class="page-body">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}
<main id="main" class="page">
<article class="page__in page__in--wide">
<h1>${escapeHtml(page.title || '')}</h1>
<div class="prose">${nl2br(page.content || '')}</div>
<p class="alt"><a href="../">صفحه اصلی</a></p>
</article>
</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

/* ---------- صفحه ۴۰۴ ---------- */
export function render404(data, opts = {}) {
  const depth = opts.depth ?? 0;
  const v = data.__v || '1';
  const A = asset(depth, v);
  return `${head(data, { depth, path: '404.html', title: 'صفحه پیدا نشد' })}
<body data-depth="${depth}" class="page-body">
<a class="skip" href="#main">رفتن به محتوا</a>
${topBar(data, { depth })}
<main id="main" class="page">
<article class="page__in">
<h1>صفحه پیدا نشد</h1>
<div class="prose"><p>آدرسی که دنبال آن بودید وجود ندارد یا جابه‌جا شده است.</p></div>
<p class="hero__acts"><a class="btn" href="./">صفحه اصلی</a></p>
</article>
</main>
${footer(data, { depth })}
${toolkitControls(data)}
<script src="${A('assets/js/site.js')}" defer></script>
</body>
</html>`;
}

export function renderSitemap(data) {
  const url = (data.settings?.site?.siteUrl || '').replace(/\/?$/, '/');
  if (!url) return '';
  const ann = data.announcements || [];
  const pages = (data.pages || []).filter((p) => p.published !== false);
  const entries = [
    { loc: url },
    { loc: url + 'login/' },
    { loc: url + 'register/' },
    { loc: url + 'announcements/' },
    ...ann.map((a) => ({ loc: url + 'announcements/' + encodeURIComponent(a.slug) + '/' })),
    ...pages.map((p) => ({ loc: url + encodeURIComponent(p.slug) + '/' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `\t<url><loc>${escapeHtml(e.loc)}</loc></url>`).join('\n')}
</urlset>
`;
}
