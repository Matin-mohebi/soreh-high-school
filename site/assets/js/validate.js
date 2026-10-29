/* =====================================================================
   اعتبارسنجی محتوا — ایزومورفیک (پنل مدیریت + admin-server)
   قواعد اعتبارسنجی یکسان برای هر دو سمت؛ خروجی: {ok, errors:{field:msg}}
   ===================================================================== */

export const RESERVED_SLUGS = ['admin', 'assets', 'content', 'media', 'auth', 'login', 'register', 'announcements', 'api', '404'];

export function toEnDigits(s) {
  return String(s ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function slugify(s) {
  return toEnDigits(String(s || '')).toLowerCase().trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

const r = (cond, msg, acc, f) => { if (!cond) acc[f] = acc[f] || msg; };

/* ---------- settings ---------- */
export function validateSettings(s) {
  const e = {};
  s = s || {};
  const site = s.site || {};
  r(typeof site.schoolName === 'string' && site.schoolName.trim().length >= 2, 'نام مدرسه الزامی است (حداقل ۲ نویسه).', e, 'site.schoolName');
  r(!site.siteUrl || site.siteUrl === '' || /^https:\/\/[^\s]+\/$/.test(site.siteUrl), 'نشانی سایت باید با https شروع شود و با / تمام شود.', e, 'site.siteUrl');
  const stats = s.about?.stats || [];
  r(stats.length === 3, 'سه آمار لازم است.', e, 'about.stats');
  stats.forEach((st, i) => {
    r(String(st?.n ?? '').trim() !== '', 'عدد آمار خالی است.', e, `about.stats.${i}.n`);
    r(String(st?.label ?? '').trim() !== '', 'عنوان آمار خالی است.', e, `about.stats.${i}.l`);
  });
  (s.menu || []).forEach((m, i) => {
    r(String(m?.label ?? '').trim() !== '', 'برچسب منو الزامی است.', e, `menu.${i}.label`);
    r(String(m?.href ?? '').trim() !== '', 'مقصد منو الزامی است.', e, `menu.${i}.href`);
  });
  if (s.seo?.ogImage) r(/\.(png|jpe?g|webp|svg|gif)$/i.test(s.seo.ogImage) || /^(https?:)?\/\//.test(s.seo.ogImage), 'تصویر OG باید نشانی معتبر تصویر باشد.', e, 'seo.ogImage');
  return { ok: Object.keys(e).length === 0, errors: e };
}

/* ---------- staff / students ---------- */
export function validatePerson(p, kind) {
  const e = {};
  p = p || {};
  const isStaff = kind === 'staff';
  r(typeof p.name === 'string' && p.name.trim().length >= 2, 'نام الزامی است (حداقل ۲ نویسه).', e, 'name');
  if (isStaff) r(String(p.role ?? '').trim() !== '', 'سمت الزامی است.', e, 'role');
  else r(String(p.rank ?? '').trim() !== '', 'رتبه الزامی است.', e, 'rank');
  if (p.photo) r(/\.(png|jpe?g|webp|gif|svg)$/i.test(p.photo) || p.photo.startsWith('data:image/') || /^(https?:)?\/\//.test(p.photo), 'نشانی عکس معتبر نیست.', e, 'photo');
  r(!p.order || /^\d+$/.test(String(p.order)), 'ترتیب باید عدد باشد.', e, 'order');
  return { ok: Object.keys(e).length === 0, errors: e };
}

/* ---------- announcements ---------- */
export function validateAnnouncement(a) {
  const e = {};
  a = a || {};
  r(typeof a.title === 'string' && a.title.trim().length >= 3, 'عنوان الزامی است (حداقل ۳ نویسه).', e, 'title');
  r(/^\d{4}-\d{2}-\d{2}$/.test(String(a.date || '')), 'تاریخ معتبر نیست.', e, 'date');
  const slug = String(a.slug || '');
  r(/^[a-z0-9\u0600-\u06FF][a-z0-9\u0600-\u06FF-]*$/.test(slug), 'نامک فقط حروف، رقم و خط تیره.', e, 'slug');
  r(RESERVED_SLUGS.indexOf(slug) === -1, 'این نامک رزرو شده است.', e, 'slug');
  r(String(a.body ?? '').trim() !== '', 'متن اطلاعیه الزامی است.', e, 'body');
  return { ok: Object.keys(e).length === 0, errors: e };
}

/* ---------- pages ---------- */
export function validatePage(p) {
  const e = {};
  p = p || {};
  r(typeof p.title === 'string' && p.title.trim().length >= 2, 'عنوان برگه الزامی است.', e, 'title');
  const slug = String(p.slug || '');
  r(/^[a-z0-9\u0600-\u06FF][a-z0-9\u0600-\u06FF-]*$/.test(slug), 'نامک فقط حروف، رقم و خط تیره (بدون فاصله).', e, 'slug');
  r(RESERVED_SLUGS.indexOf(slug) === -1, 'این نامک رزرو شده است (login، register، admin و…).', e, 'slug');
  r(String(p.content ?? '').trim() !== '', 'متن برگه الزامی است.', e, 'content');
  return { ok: Object.keys(e).length === 0, errors: e };
}

/* ---------- media ---------- */
export const MEDIA_TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon', pdf: 'application/pdf',
};
export const MEDIA_MAX_BYTES = 2 * 1024 * 1024;

export function validateMediaName(name) {
  return /^[A-Za-z0-9._-]{1,80}$/.test(name) && /\.(png|jpe?g|webp|gif|svg|ico|pdf)$/i.test(name);
}

/* ---------- نگاشت نام فایل → اعتبارسنج ---------- */
export const VALIDATORS = {
  'settings.json': validateSettings,
  'staff.json': (list) => {
    const e = {};
    (Array.isArray(list) ? list : []).forEach((p, i) => {
      const v = validatePerson(p, 'staff');
      if (!v.ok) e[i] = v.errors;
    });
    return { ok: Object.keys(e).length === 0, errors: e };
  },
  'students.json': (list) => {
    const e = {};
    (Array.isArray(list) ? list : []).forEach((p, i) => {
      const v = validatePerson(p, 'student');
      if (!v.ok) e[i] = v.errors;
    });
    return { ok: Object.keys(e).length === 0, errors: e };
  },
  'announcements.json': (list) => {
    const e = {};
    (Array.isArray(list) ? list : []).forEach((a, i) => {
      const v = validateAnnouncement(a);
      if (!v.ok) e[i] = v.errors;
    });
    const slugs = (Array.isArray(list) ? list : []).map((a) => a.slug);
    if (new Set(slugs).size !== slugs.length) e._dup = 'نامک تکراری وجود دارد.';
    return { ok: Object.keys(e).length === 0, errors: e };
  },
  'pages.json': (list) => {
    const e = {};
    (Array.isArray(list) ? list : []).forEach((p, i) => {
      const v = validatePage(p);
      if (!v.ok) e[i] = v.errors;
    });
    const slugs = (Array.isArray(list) ? list : []).map((p) => p.slug);
    if (new Set(slugs).size !== slugs.length) e._dup = 'نامک تکراری وجود دارد.';
    return { ok: Object.keys(e).length === 0, errors: e };
  },
  'media.json': (m) => ({ ok: m && typeof m === 'object' && Array.isArray(m.items), errors: m ? {} : { _all: 'ساختار رسانه نامعتبر' } }),
};

export const CONTENT_FILES = Object.keys(VALIDATORS);

export function validateContent(name, data) {
  const fn = VALIDATORS[name];
  if (!fn) return { ok: false, errors: { _file: 'فایل ناشناخته' } };
  try {
    return fn(data);
  } catch (err) {
    return { ok: false, errors: { _exception: String(err && err.message || err) } };
  }
}
