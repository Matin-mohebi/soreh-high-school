/* =====================================================================
   نماهای سیستم پنل — رسانه، تنظیمات، منو، ظاهر، سئو، امکانات،
   کاربران، گزارش فعالیت، انتشار تغییرات
   ===================================================================== */
import { faNum, faTime, h, toast, modal, confirmDialog, field, setErrors, input, textarea, select, paginate, downloadJSON, readFile } from './ui.js';
import { state, effective as eff, isDirty, discardDraft, setDraft, publishFile, logLocal, logsLocal, apiGet, apiSend } from './store.js';
import { validateSettings, validateContent, MEDIA_TYPES, MEDIA_MAX_BYTES, slugify } from '../validate.js';
import { renderHome } from '../render.js';

/* ---------- انتخاب تصویر از کتابخانه ---------- */
export function openMediaPicker(cb) {
  const items = (eff('media') || { items: [] }).items.filter((it) => (it.type || '').startsWith('image/'));
  const m = modal('انتخاب تصویر از کتابخانه رسانه',
    [items.length
      ? h('div', { class: 'media-grid' }, items.map((it) => h('div', { class: 'media-card' },
        h('div', { class: 'thumb', style: 'cursor:pointer', onclick: () => { m.close(); cb('media/' + it.file); toast('تصویر انتخاب شد'); } },
          h('img', { src: it.data || '../media/' + it.file, alt: it.file, loading: 'lazy' })),
        h('div', { class: 'meta' }, h('b', {}, it.file)))))
      : h('p', { class: 'empty' }, 'رسانه‌ای موجود نیست؛ ابتدا تصویری بارگذاری کنید.')],
    [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'بستن')]);
}

function dirtyBar(ctx, file) {
  if (!ctx.dirty(file)) return null;
  return h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px' },
    h('span', { class: 'tag' }, 'این بخش پیش‌نویس ذخیره‌شده دارد'),
    state.mode === 'connected' ? h('button', { class: 'btn btn--publish btn--sm', onclick: async (e) => {
      e.target.disabled = true;
      try { await publishFile(file); toast('منتشر شد'); ctx.render(); } catch (err) { toast(err.message, 'err'); e.target.disabled = false; }
    } }, 'انتشار') : null,
    h('button', { class: 'btn btn--ghost btn--sm', onclick: async () => {
      if (await confirmDialog('پیش‌نویس این بخش لغو و به نسخه منتشرشده بازگردد؟', 'بازگردانی')) { discardDraft(file); ctx.render(); }
    } }, 'لغو پیش‌نویس'));
}

/* ============================== رسانه ============================== */
export function mediaView(ctx, host) {
  let q = '', typeF = '';
  const list = () => ((eff('media') || { items: [] }).items || []).slice();

  async function handleFiles(files) {
    const items = list();
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!MEDIA_TYPES[ext]) { toast('فرمت «' + f.name + '» مجاز نیست (png/jpg/webp/gif/svg/ico/pdf)', 'err'); continue; }
      if (f.size > MEDIA_MAX_BYTES) { toast('حجم «' + f.name + '» بیش از ۲ مگابایت است', 'err'); continue; }
      const safe = f.name.replace(/[^\w.-]/g, '_');
      if (state.mode === 'connected') {
        try {
          const buf = new Uint8Array(await f.arrayBuffer());
          let bin = ''; buf.forEach((b) => { bin += String.fromCharCode(b); });
          await apiSend('media', { name: safe, data: btoa(bin) });
          logLocal('media-upload', safe);
          toast('بارگذاری شد: ' + safe);
        } catch (err) { toast('بارگذاری ناموفق: ' + err.message, 'err'); }
      } else {
        if (f.size > 1.2 * 1024 * 1024) { toast('در حالت پیش‌نمایش حداکثر حجم هر فایل ۱٫۲ مگابایت است', 'err'); continue; }
        const data = await readFile(f, 'dataURL');
        items.push({ file: safe, type: f.type || MEDIA_TYPES[ext], size: f.size, date: new Date().toISOString().slice(0, 10), data });
        setDraft('media', { items });
        logLocal('media-draft', safe + ' (پیش‌نویس محلی)');
        toast('به پیش‌نویس محلی افزوده شد: ' + safe);
      }
    }
    if (state.mode === 'connected') await ctx.refresh();
    ctx.render();
  }

  function render() {
    host.innerHTML = '';
    const drop = h('div', { class: 'drop' }, 'فایل را اینجا رها کنید یا برای انتخاب کلیک کنید', h('br'), h('small', {}, 'PNG · JPG · WebP · GIF · SVG · ICO · PDF — حداکثر ۲ مگابایت'));
    const fi = input({ type: 'file', accept: Object.values(MEDIA_TYPES).join(','), multiple: true });
    fi.style.display = 'none';
    drop.addEventListener('click', () => fi.click());
    fi.addEventListener('change', () => handleFiles([...fi.files]));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); handleFiles([...e.dataTransfer.files]); });

    const items = list()
      .filter((it) => !typeF || (it.type || '').startsWith(typeF))
      .filter((it) => !q || it.file.toLowerCase().includes(q.toLowerCase()));
    const grid = h('div', { class: 'media-grid' });
    host.append(
      h('div', { class: 'alert alert--info' }, state.mode === 'connected'
        ? 'فایل‌های بارگذاری‌شده در مخزن (پوشه‌ی media سایت) ذخیره و با انتشار، روی وب‌سایت قرار می‌گیرند.'
        : 'در حالت پیش‌نمایش، فایل‌ها به‌صورت محلی در همین مرورگر ذخیره می‌شوند و روی وب‌سایت منتشر نمی‌شوند.'),
      dirtyBar(ctx, 'media'),
      drop, fi,
      h('div', { class: 'list-head', style: 'margin-top:18px' },
        h('div', { class: 'search' }, input({ type: 'search', placeholder: 'جست‌وجوی نام فایل…', oninput: (e) => { q = e.target.value; render(); } })),
        (() => {
          const s = select([['', 'همه انواع'], ['image/', 'تصاویر'], ['application/', 'اسناد']], typeF);
          s.addEventListener('change', () => { typeF = s.value; render(); });
          return s;
        })()),
      grid, h('div', {}));
    const pagerHost = host.lastChild;
    paginate(items, 1, 12, (slice) => {
      grid.innerHTML = '';
      if (!slice.length) { grid.append(h('p', { class: 'empty', style: 'grid-column:1/-1' }, 'رسانه‌ای یافت نشد.')); return; }
      slice.forEach((it) => {
        const isImg = (it.type || '').startsWith('image/');
        grid.append(h('div', { class: 'media-card' },
          h('div', { class: 'thumb' }, isImg ? h('img', { src: it.data || '../media/' + it.file, alt: it.file, loading: 'lazy' }) : h('span', { class: 'file-ic' }, '📄')),
          h('div', { class: 'meta' },
            h('b', { title: it.file }, it.file),
            h('small', {}, faNum(Math.max(1, Math.round((it.size || 0) / 1024))) + ' کیلوبایت' + (it.data ? ' · پیش‌نویس محلی' : '')),
            h('div', { class: 'ops' },
              h('button', { class: 'btn btn--ghost btn--sm', onclick: () => {
                navigator.clipboard?.writeText((eff('settings')?.site?.siteUrl || '') + 'media/' + it.file).then(() => toast('نشانی کپی شد'), () => toast('کپی ناموفق بود', 'err'));
              } }, 'کپی نشانی'),
              h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
                if (!(await confirmDialog(`«${it.file}» حذف شود؟`, 'حذف'))) return;
                if (state.mode === 'connected') {
                  try { await apiSend('media/' + encodeURIComponent(it.file), {}, 'DELETE'); logLocal('media-delete', it.file); toast('حذف شد'); await ctx.refresh(); ctx.render(); }
                  catch (err) { toast('حذف ناموفق: ' + err.message, 'err'); }
                } else {
                  const items2 = list().filter((x) => x !== it);
                  setDraft('media', { items: items2 });
                  logLocal('media-delete', it.file + ' (پیش‌نویس)');
                  toast('حذف شد'); ctx.render();
                }
              } }, 'حذف')))));
      });
    }, pagerHost);
  }
  render();
}

/* ============================== تنظیمات مدرسه ============================== */
export function settingsView(ctx, host) {
  const file = 'settings';
  const s = JSON.parse(JSON.stringify(eff(file) || {}));
  s.site = s.site || {}; s.hero = s.hero || {}; s.about = s.about || { stats: [{}, {}, {}] };
  s.sections = s.sections || {}; s.footer = s.footer || {}; s.join = s.join || {};
  s.about.stats = [s.about.stats[0] || {}, s.about.stats[1] || {}, s.about.stats[2] || {}];

  const f = {
    schoolName: input({ value: s.site.schoolName || '', type: 'text' }),
    schoolNameEn: input({ value: s.site.schoolNameEn || '', type: 'text', dir: 'ltr' }),
    heroText: textarea(s.hero.text || ''),
    heroImage: input({ value: s.hero.image || '', type: 'url', dir: 'ltr' }),
    aboutTitle: input({ value: s.about.title || '', type: 'text' }),
    aboutText: textarea(s.about.text || ''),
    statN: s.about.stats.map((st) => input({ value: st.n ?? '', type: 'text' })),
    statL: s.about.stats.map((st) => input({ value: st.label ?? '', type: 'text' })),
    staffTitle: input({ value: s.sections.staffTitle || '', type: 'text' }),
    staffText: textarea(s.sections.staffText || ''),
    gateStaff: input({ value: s.sections.gateStaffText || '', type: 'text' }),
    studentsTitle: input({ value: s.sections.studentsTitle || '', type: 'text' }),
    studentsText: textarea(s.sections.studentsText || ''),
    gateStudents: input({ value: s.sections.gateStudentsText || '', type: 'text' }),
    address: input({ value: s.footer.address || '', type: 'text' }),
    phone: input({ value: s.footer.phone || '', type: 'text', dir: 'ltr' }),
    note: input({ value: s.footer.note || '', type: 'text' }),
    joinTitle: input({ value: s.join.title || '', type: 'text' }),
    joinText: input({ value: s.join.text || '', type: 'text' }),
  };
  f.joinEnabled = input({ type: 'checkbox' });
  f.joinEnabled.checked = s.join.enabled !== false;

  const form = h('form', {},
    h('div', { class: 'adm-card' }, h('h2', {}, 'شناسنامه مدرسه'),
      h('div', { class: 'frow' },
        field({ label: 'نام مدرسه (فارسی) *', name: 'site.schoolName', input: f.schoolName }),
        field({ label: 'نام انگلیسی', name: 'site.schoolNameEn', input: f.schoolNameEn })),
      h('p', { class: 'hint', style: 'font-size:12px;color:var(--a-ink2);margin:0' }, 'نام مدرسه در عنوان سایت، نوار بالا، هیرو و فوتر استفاده می‌شود.')),
    h('div', { class: 'adm-card' }, h('h2', {}, 'بخش اول صفحه (هیرو)'),
      field({ label: 'معرفی کوتاه زیر عنوان', name: 'hero.text', input: f.heroText }),
      h('div', { class: 'frow' },
        field({ label: 'عکس بالای صفحه (اختیاری)', name: 'hero.image', hint: 'نشانی تصویر', input: f.heroImage }),
        field({ label: ' ', name: '_pick', input: h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => openMediaPicker((v) => { f.heroImage.value = v; }) }, 'انتخاب از رسانه') }))),
    h('div', { class: 'adm-card' }, h('h2', {}, 'درباره مدرسه و آمار ', h('small', {}, 'مقادیر آمار نمونه‌ی قالب اصلی‌اند؛ با اعداد واقعی مدرسه جایگزین کنید')),
      field({ label: 'عنوان درباره', name: 'about.title', input: f.aboutTitle }),
      field({ label: 'متن درباره مدرسه', name: 'about.text', input: f.aboutText }),
      h('div', { class: 'frow' },
        field({ label: 'آمار ۱ — عدد', name: 'about.stats.0.n', input: f.statN[0] }), field({ label: 'آمار ۱ — عنوان', name: 'about.stats.0.l', input: f.statL[0] })),
      h('div', { class: 'frow' },
        field({ label: 'آمار ۲ — عدد', name: 'about.stats.1.n', input: f.statN[1] }), field({ label: 'آمار ۲ — عنوان', name: 'about.stats.1.l', input: f.statL[1] })),
      h('div', { class: 'frow' },
        field({ label: 'آمار ۳ — عدد', name: 'about.stats.2.n', input: f.statN[2] }), field({ label: 'آمار ۳ — عنوان', name: 'about.stats.2.l', input: f.statL[2] }))),
    h('div', { class: 'adm-card' }, h('h2', {}, 'بخش مدیر و معاونان'),
      h('div', { class: 'frow' },
        field({ label: 'عنوان بخش', name: 'sections.staffTitle', input: f.staffTitle }),
        field({ label: 'متن دروازه ورود', name: 'sections.gateStaffText', input: f.gateStaff })),
      field({ label: 'توضیح بخش', name: 'sections.staffText', input: f.staffText })),
    h('div', { class: 'adm-card' }, h('h2', {}, 'بخش دانش‌آموزان برتر'),
      h('div', { class: 'frow' },
        field({ label: 'عنوان بخش', name: 'sections.studentsTitle', input: f.studentsTitle }),
        field({ label: 'متن دروازه ورود', name: 'sections.gateStudentsText', input: f.gateStudents })),
      field({ label: 'توضیح بخش', name: 'sections.studentsText', input: f.studentsText })),
    h('div', { class: 'adm-card' }, h('h2', {}, 'پایین صفحه و تماس'),
      h('div', { class: 'frow' },
        field({ label: 'آدرس', name: 'footer.address', input: f.address }),
        field({ label: 'تلفن', name: 'footer.phone', input: f.phone })),
      field({ label: 'یادداشت پایین صفحه', name: 'footer.note', input: f.note }),
      h('p', { class: 'hint', style: 'font-size:12px;color:var(--a-ink2);margin:0' }, 'آدرس و تلفن رسمی مدرسه در منبع موجود نبود؛ تا زمان ثبت اطلاعات واقعی خالی بماند.')),
    h('div', { class: 'adm-card' }, h('h2', {}, 'دعوت به عضویت'),
      field({ label: 'نمایش بخش', name: 'join.enabled', input: h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:400' }, f.joinEnabled, 'بخش دعوت به ثبت‌نام نمایش داده شود') }),
      h('div', { class: 'frow' },
        field({ label: 'عنوان', name: 'join.title', input: f.joinTitle }),
        field({ label: 'متن', name: 'join.text', input: f.joinText }))),
    h('button', { class: 'btn', type: 'submit' }, 'ذخیره پیش‌نویس'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ns = JSON.parse(JSON.stringify(s));
    ns.site.schoolName = f.schoolName.value.trim();
    ns.site.schoolNameEn = f.schoolNameEn.value.trim();
    ns.hero.text = f.heroText.value;
    ns.hero.image = f.heroImage.value.trim();
    ns.about.title = f.aboutTitle.value.trim();
    ns.about.text = f.aboutText.value;
    ns.about.stats = [0, 1, 2].map((i) => ({ n: f.statN[i].value.trim(), label: f.statL[i].value.trim() }));
    ns.sections.staffTitle = f.staffTitle.value.trim();
    ns.sections.staffText = f.staffText.value;
    ns.sections.gateStaffText = f.gateStaff.value.trim();
    ns.sections.studentsTitle = f.studentsTitle.value.trim();
    ns.sections.studentsText = f.studentsText.value;
    ns.sections.gateStudentsText = f.gateStudents.value.trim();
    ns.footer.address = f.address.value.trim();
    ns.footer.phone = f.phone.value.trim();
    ns.footer.note = f.note.value.trim();
    ns.join.enabled = f.joinEnabled.checked;
    ns.join.title = f.joinTitle.value.trim();
    ns.join.text = f.joinText.value.trim();
    const v = validateSettings(ns);
    if (!v.ok) {
      setErrors(form, v.errors || {});
      toast('اعتبارسنجی ناموفق: ' + Object.values(v.errors)[0], 'err');
      return;
    }
    setDraft(file, ns);
    logLocal('draft-save', 'تنظیمات مدرسه ذخیره شد');
    toast('پیش‌نویس تنظیمات ذخیره شد — برای اعمال، منتشر کنید');
    ctx.render();
  });

  host.append(h('div', { class: 'alert alert--info' }, 'این بخش معادل «سفارشی‌سازی» وردپرس در قالب اصلی است.'), dirtyBar(ctx, file), form);
}

/* ============================== منوی سایت ============================== */
export function menuView(ctx, host) {
  const file = 'settings';
  let menu = JSON.parse(JSON.stringify(eff(file)?.menu || []));
  const rows = h('div', { class: 'cards' });

  function redraw() {
    rows.innerHTML = '';
    if (!menu.length) rows.append(h('p', { class: 'empty' }, 'موردی نیست — «افزودن» را بزنید.'));
    menu.forEach((m, i) => {
      const lab = input({ value: m.label || '', type: 'text', placeholder: 'برچسب' });
      const href = input({ value: m.href || '', type: 'text', dir: 'ltr', placeholder: '#about یا about/ یا https://…' });
      lab.addEventListener('input', () => { menu[i].label = lab.value; });
      href.addEventListener('input', () => { menu[i].href = href.value; });
      rows.append(h('div', { class: 'item-card' },
        h('div', { class: 'info', style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' }, lab, href),
        h('div', { class: 'ops' },
          h('button', { class: 'btn btn--ghost btn--sm', title: 'بالا', onclick: () => { if (i > 0) { [menu[i - 1], menu[i]] = [menu[i], menu[i - 1]]; redraw(); } } }, '↑'),
          h('button', { class: 'btn btn--ghost btn--sm', title: 'پایین', onclick: () => { if (i < menu.length - 1) { [menu[i + 1], menu[i]] = [menu[i], menu[i + 1]]; redraw(); } } }, '↓'),
          h('button', { class: 'btn btn--danger btn--sm', onclick: () => { menu.splice(i, 1); redraw(); } }, 'حذف'))));
    });
  }
  redraw();
  const form = h('form', {},
    h('div', { class: 'adm-card' },
      h('h2', {}, 'آیتم‌های منوی اصلی ', h('small', {}, 'پیوندهای داخلی با # برای بخش‌های صفحه اصلی')),
      rows,
      h('div', { style: 'display:flex;gap:10px;margin-top:14px;flex-wrap:wrap' },
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => { menu.push({ label: '', href: '#about' }); redraw(); } }, '+ افزودن آیتم'),
        h('button', { class: 'btn', type: 'submit' }, 'ذخیره پیش‌نویس'))));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    menu = menu.filter((m) => (m.label || '').trim() && (m.href || '').trim());
    const s = JSON.parse(JSON.stringify(eff(file) || {}));
    s.menu = menu;
    const v = validateSettings(s);
    if (!v.ok) { toast('اعتبارسنجی: ' + Object.values(v.errors)[0], 'err'); return; }
    setDraft(file, s);
    logLocal('draft-save', 'منوی سایت ذخیره شد');
    toast('پیش‌نویس منو ذخیره شد'); ctx.render();
  });
  host.append(h('div', { class: 'alert alert--info' }, 'منوی پیش‌فرض قالب: درباره، مدیر و معاونان، دانش‌آموزان (+ اطلاعیه‌ها در این نسخه).'), dirtyBar(ctx, 'settings'), form);
}

/* ============================== ظاهر ============================== */
export function appearanceView(ctx, host) {
  const file = 'settings';
  const s = JSON.parse(JSON.stringify(eff(file) || {}));
  s.appearance = s.appearance || {};
  const logo = input({ value: s.appearance.logo || '', type: 'url', dir: 'ltr' });
  const favicon = input({ value: s.appearance.favicon || '', type: 'url', dir: 'ltr' });
  const form = h('form', {},
    h('div', { class: 'adm-card' },
      h('h2', {}, 'نشان سایت ', h('small', {}, 'در حال حاضر نشان پیش‌فرض (نگاره‌ی هندسی) استفاده می‌شود')),
      h('div', { class: 'frow' },
        field({ label: 'لوگو (در نوار بالا)', name: 'appearance.logo', input: logo }),
        field({ label: 'فاوآیکن (آیکن تب مرورگر)', name: 'appearance.favicon', input: favicon })),
      h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' },
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => openMediaPicker((v) => { logo.value = v; }) }, 'انتخاب لوگو از رسانه'),
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => openMediaPicker((v) => { favicon.value = v; }) }, 'انتخاب فاوآیکن از رسانه')),
      h('p', { class: 'hint', style: 'font-size:12px;color:var(--a-ink2)' }, 'لوگوی رسمی مدرسه در منبع موجود نبود؛ پس از دریافت فایل رسمی، از اینجا جایگزین کنید.')),
    h('button', { class: 'btn', type: 'submit' }, 'ذخیره پیش‌نویس'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ns = JSON.parse(JSON.stringify(eff(file) || {}));
    ns.appearance = { logo: logo.value.trim(), favicon: favicon.value.trim() };
    setDraft(file, ns);
    logLocal('draft-save', 'تنظیمات ظاهر ذخیره شد');
    toast('پیش‌نویس ظاهر ذخیره شد'); ctx.render();
  });
  host.append(dirtyBar(ctx, file), form);
}

/* ============================== سئو ============================== */
export function seoView(ctx, host) {
  const file = 'settings';
  const s = JSON.parse(JSON.stringify(eff(file) || {}));
  s.seo = s.seo || {};
  const siteUrl = input({ value: s.site?.siteUrl || '', type: 'url', dir: 'ltr', placeholder: 'https://…/' });
  const title = input({ value: s.seo.title || '', type: 'text' });
  const desc = textarea(s.seo.description || '');
  const kw = input({ value: s.seo.keywords || '', type: 'text' });
  const og = input({ value: s.seo.ogImage || '', type: 'url', dir: 'ltr' });
  const sitemap = input({ type: 'checkbox' }); sitemap.checked = s.seo.sitemap !== false;
  const form = h('form', {},
    h('div', { class: 'adm-card' },
      h('h2', {}, 'بهینه‌سازی موتور جست‌وجو'),
      field({ label: 'نشانی پایه سایت', name: 'siteUrl', hint: 'با https و اسلش پایانی', input: siteUrl }),
      field({ label: 'عنوان پیش‌فرض صفحه‌ها', name: 'seo.title', input: title }),
      field({ label: 'توضیحات متا', name: 'seo.description', input: desc }),
      h('div', { class: 'frow' },
        field({ label: 'کلیدواژه‌ها', name: 'seo.keywords', input: kw }),
        field({ label: 'تصویر اشتراک‌گذاری (OG)', name: 'seo.ogImage', input: og })),
      field({ label: 'نقشه سایت', name: 'seo.sitemap', input: h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:400' }, sitemap, 'ساخت sitemap.xml و robots.txt فعال باشد') })),
    h('button', { class: 'btn', type: 'submit' }, 'ذخیره پیش‌نویس'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ns = JSON.parse(JSON.stringify(eff(file) || {}));
    ns.site = ns.site || {};
    ns.site.siteUrl = siteUrl.value.trim();
    ns.seo = { title: title.value.trim(), description: desc.value.trim(), keywords: kw.value.trim(), ogImage: og.value.trim(), sitemap: sitemap.checked };
    const v = validateSettings(ns);
    if (!v.ok) { toast('اعتبارسنجی: ' + Object.values(v.errors)[0], 'err'); return; }
    setDraft(file, ns);
    logLocal('draft-save', 'تنظیمات سئو ذخیره شد');
    toast('پیش‌نویس سئو ذخیره شد'); ctx.render();
  });
  host.append(dirtyBar(ctx, file), form);
}

/* ============================== امکانات سایت (معادل افزونه Toolkit) ============================== */
export function featuresView(ctx, host) {
  const file = 'settings';
  const s = JSON.parse(JSON.stringify(eff(file) || {}));
  s.toolkit = s.toolkit || {};
  const opts = [
    ['liveSearch', 'جست‌وجوی زنده در کارت‌ها', 'معادل افزونه Class Stars Toolkit — با نرمال‌سازی حروف فارسی و ارقام'],
    ['progressBar', 'نوار پیشرفت مطالعه', 'نوار بالای صفحه هنگام اسکرول'],
    ['backToTop', 'دکمه بازگشت به بالا', 'دکمه سه‌بعدی شناور'],
    ['counters', 'شمارنده انیمیشنی آمار', 'شمارش اعداد با ارقام فارسی هنگام دیده شدن'],
    ['reveal', 'انیمیشن ظهور بخش‌ها', 'ظاهر شدن آرام هنگام اسکرول'],
  ];
  const boxes = {};
  const form = h('form', {},
    h('div', { class: 'adm-card' },
      h('h2', {}, 'امکانات فرانت‌اند (معادل افزونه‌ی قالب)'),
      opts.map(([k, t, d]) => {
        boxes[k] = input({ type: 'checkbox' });
        boxes[k].checked = s.toolkit[k] !== false;
        return field({ label: t, name: 'toolkit.' + k, hint: d, input: h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:400' }, boxes[k], 'فعال') });
      })),
    h('button', { class: 'btn', type: 'submit' }, 'ذخیره پیش‌نویس'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ns = JSON.parse(JSON.stringify(eff(file) || {}));
    ns.toolkit = Object.fromEntries(opts.map(([k]) => [k, boxes[k].checked]));
    setDraft(file, ns);
    logLocal('draft-save', 'امکانات سایت ذخیره شد');
    toast('پیش‌نویس امکانات ذخیره شد'); ctx.render();
  });
  host.append(dirtyBar(ctx, file), form);
}

/* ============================== کاربران ============================== */
export async function usersView(ctx, host) {
  if (state.mode !== 'connected') {
    host.append(
      h('div', { class: 'alert alert--warn' }, 'مدیریت کاربران فقط در حالت متصل به سرویس مدیریت (admin-server) در دسترس است.'),
      h('div', { class: 'adm-card' },
        h('h2', {}, 'چرا در حالت پیش‌نمایش نیست؟'),
        h('p', { style: 'font-size:13.5px' }, 'حساب‌های کاربری بازدیدکنندگان (مشترکان خبرنامه‌ی مدرسه) روی سرور و در دیتای محافظت‌شده نگهداری می‌شوند. ذخیره‌ی این اطلاعات در مرورگر یا فایل عمومی ممنوع است؛ بنابراین این بخش عمداً در حالت پیش‌نمایش غیرفعال است.')));
    return;
  }
  let users = [];
  try { users = (await apiGet('users')).users || []; } catch (err) { toast('دریافت کاربران ناموفق بود', 'err'); }
  const body = h('div', { class: 'cards' });
  host.append(h('div', { class: 'list-head' }, h('h2', { style: 'margin:0' }, 'کاربران ثبت‌نام‌شده (' + faNum(users.length) + ')')), body);
  if (!users.length) { body.append(h('p', { class: 'empty' }, 'هنوز کاربری ثبت‌نام نکرده است.')); return; }
  users.forEach((u) => {
    body.append(h('div', { class: 'item-card' },
      h('div', { class: 'ph' }, (u.name || u.user || '?').slice(0, 1)),
      h('div', { class: 'info' },
        h('b', {}, u.name || u.user),
        h('small', { dir: 'ltr', style: 'text-align:right' }, u.email || ''),
        h('small', {}, 'عضویت: ' + faTime(u.created))),
      h('div', { class: 'ops' },
        h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
          if (!(await confirmDialog(`حساب «${u.name || u.user}» حذف شود؟`, 'حذف'))) return;
          try { await apiSend('users/' + encodeURIComponent(u.id), {}, 'DELETE'); logLocal('user-delete', u.user); toast('حذف شد'); ctx.render(); }
          catch (err) { toast('حذف ناموفق: ' + err.message, 'err'); }
        } }, 'حذف'))));
  });
}

/* ============================== گزارش فعالیت ============================== */
export function logsView(ctx, host) {
  const logs = state.mode === 'connected' ? state.serverLogs : logsLocal();
  host.append(h('div', { class: 'adm-card' },
    h('h2', {}, state.mode === 'connected' ? 'گزارش فعالیت سرور' : 'گزارش فعالیت این مرورگر', ' ', h('small', {}, 'فقط تغییرات معنادار ثبت می‌شوند')),
    logs.length
      ? h('ul', { class: 'log-list' }, logs.slice(0, 60).map((l) => h('li', {}, h('time', {}, faTime(l.ts)), h('span', { class: 'what' }, h('span', { class: 'log-act' }, l.action), ' — ', l.detail || '', l.user ? ' (' + l.user + ')' : ''))))
      : h('p', { class: 'empty' }, 'موردی ثبت نشده است.'),
    state.mode !== 'connected' && logs.length ? h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn btn--ghost btn--sm', onclick: () => { localStorage.removeItem('soreh_logs_v1'); ctx.render(); } }, 'پاک‌سازی گزارش محلی')) : null));
}

/* ============================== انتشار تغییرات ============================== */
export function publishView(ctx, host) {
  const files = ['settings', 'staff', 'students', 'announcements', 'pages', 'media'].filter((f) => ctx.dirty(f));
  host.append(h('div', { class: 'alert alert--info' },
    state.mode === 'connected'
      ? 'تغییرات پس از انتشار، به مخزن GitHub اعمال می‌شوند و GitHub Actions طی ۱ تا ۲ دقیقه وب‌سایت را بازسازی می‌کند.'
      : 'شما در حالت پیش‌نمایش هستید: تغییرات فقط در همین مرورگر ذخیره می‌شوند و روی سایت عمومی منتشر نمی‌شوند. برای انتشار واقعی، سرویس مدیریت را اجرا کنید (راهنما در مخزن، پوشه‌ی admin-server).'));

  function openPreview() {
    const data = {
      settings: eff('settings') || {},
      staff: eff('staff') || [],
      students: eff('students') || [],
      announcements: eff('announcements') || [],
      pages: eff('pages') || [],
      media: eff('media') || { items: [] },
      __v: 'preview',
    };
    try {
      const html = renderHome(data, { depth: 0 });
      const baseHref = new URL('../', location.href).href;
      const w = window.open('', '_blank');
      if (!w) { toast('پنجره‌ی پیش‌نمایش مسدود شد؛ popup را مجاز کنید', 'err'); return; }
      w.document.open();
      w.document.write(html.replace('<head>', '<head><base href="' + baseHref + '">'));
      w.document.close();
      logLocal('preview', 'پیش‌نمایش صفحه اصلی با داده پیش‌نویس');
    } catch (err) { toast('پیش‌نمایش ناموفق: ' + err.message, 'err'); }
  }

  host.append(h('div', { style: 'margin-bottom:18px' },
    h('button', { class: 'btn btn--ghost', onclick: openPreview }, '👁️ پیش‌نمایش صفحه اصلی با داده‌ی پیش‌نویس')));

  if (!files.length) {
    host.append(h('div', { class: 'adm-card' }, h('p', { class: 'empty' }, 'تغییر منتشرنشده‌ای وجود ندارد — همه‌چیز همگام است.')));
    return;
  }

  if (state.mode === 'connected') {
    const pubAll = h('button', { class: 'btn btn--publish', onclick: async () => {
      if (!(await confirmDialog('همه‌ی ' + faNum(files.length) + ' فایل تغییرکرده منتشر شود؟', 'انتشار همه'))) return;
      pubAll.disabled = true;
      for (const f of files) {
        try { await publishFile(f); logLocal('publish', f + '.json'); }
        catch (err) { toast('انتشار ' + f + ' ناموفق: ' + err.message, 'err'); pubAll.disabled = false; ctx.render(); return; }
      }
      toast('همه تغییرات منتشر شد — GitHub Actions در حال بازسازی سایت است');
      ctx.refresh();
    } }, 'انتشار همه تغییرات (' + faNum(files.length) + ')');
    host.append(h('div', { style: 'margin-bottom:18px' }, pubAll));
  }

  files.forEach((f) => {
    const cur = JSON.stringify(eff(f), null, 2);
    const pub = JSON.stringify(state.published[f], null, 2);
    const item = h('div', { class: 'pub-item' },
      h('b', {}, f + '.json'),
      h('span', { class: 'tag' }, 'پیش‌نویس'),
      h('div', { class: 'ops' },
        h('button', { class: 'btn btn--ghost btn--sm', onclick: () => {
          modal('بررسی تغییرات — ' + f + '.json',
            [h('p', { style: 'font-size:13px;color:var(--a-ink2)' }, 'پیش‌نویس (نسخه‌ی جدید):'),
              h('pre', { class: 'diff-preview' }, cur.length > 8000 ? cur.slice(0, 8000) + '\n…' : cur)],
            [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'بستن')]);
          const m = document.querySelector('#adm-modal-root .modal-bg');
        } }, 'بررسی'),
        state.mode === 'connected' ? h('button', { class: 'btn btn--publish btn--sm', onclick: async (e) => {
          e.target.disabled = true;
          try { await publishFile(f); logLocal('publish', f + '.json'); toast('منتشر شد: ' + f + '.json'); ctx.refresh(); }
          catch (err) { toast(err.message, 'err'); e.target.disabled = false; }
        } }, 'انتشار') : h('button', { class: 'btn btn--ghost btn--sm', onclick: () => downloadJSON(f + '.json', eff(f)) }, 'دانلود JSON'),
        h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
          if (await confirmDialog('پیش‌نویس ' + f + '.json لغو شود؟', 'لغو')) { discardDraft(f); ctx.render(); }
        } }, 'لغو پیش‌نویس')));
    host.append(item);
  });

  if (state.mode !== 'connected') {
    host.append(h('div', { class: 'adm-card' },
      h('h2', {}, 'راه انتشار در حالت پیش‌نمایش'),
      h('ol', { style: 'font-size:13.5px;padding-inline-start:20px;display:grid;gap:8px' },
        h('li', {}, 'فایل‌های JSON بالا را دانلود کنید.'),
        h('li', {}, 'سرویس مدیریت را اجرا کنید: در پوشه‌ی admin-server دستور ', h('code', { dir: 'ltr' }, 'npm start'), ' (پس از تنظیم .env) — سپس همین پنل حالت متصل می‌شود و دکمه‌ی انتشار فعال خواهد شد.'),
        h('li', {}, 'یا فایل‌ها را دستی در پوشه‌ی content/ مخزن جایگزین و commit کنید؛ GitHub Actions خودکار بازسازی می‌کند.'))));
  }
}
