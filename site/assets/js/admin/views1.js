/* =====================================================================
   نماهای محتوایی پنل — پیشخوان، مدیران، دانش‌آموزان، اطلاعیه‌ها، برگه‌ها
   ===================================================================== */
import { faNum, faTime, esc, h, toast, modal, confirmDialog, field, setErrors, input, textarea, paginate, downloadJSON } from './ui.js';
import { state, effective as eff, isDirty, discardDraft, setDraft, publishFile, logLocal, logsLocal, discardAll } from './store.js';
import { validatePerson, validateAnnouncement, validatePage, slugify, toEnDigits } from '../validate.js';

/* ابزار مشترک */
export function dirtyTag(ctx, file) {
  if (!ctx.dirty(file)) return null;
  return h('span', { class: 'tag tag--warn' }, 'پیش‌نویس ذخیره‌شده');
}
function publishQuickBtn(ctx, file) {
  if (state.mode !== 'connected' || !ctx.dirty(file)) return null;
  return h('button', {
    class: 'btn btn--publish btn--sm',
    onclick: async (e) => {
      e.target.disabled = true;
      try { await publishFile(file); toast('فایل ' + file + '.json منتشر شد'); ctx.render(); }
      catch (err) { toast(err.message || 'انتشار ناموفق بود', 'err'); e.target.disabled = false; }
    },
  }, 'انتشار سریع');
}
function restoreBtn(ctx, file) {
  if (!ctx.dirty(file)) return null;
  return h('button', {
    class: 'btn btn--ghost btn--sm',
    onclick: async () => {
      const ok = await confirmDialog('نسخه‌ی منتشرشده‌ی این بخش جایگزین پیش‌نویس شود؟', 'بازگردانی');
      if (!ok) return;
      discardDraft(file);
      toast('به نسخه منتشرشده بازگشت');
      ctx.render();
    },
  }, 'بازگردانی نسخه منتشرشده');
}
function header(ctx, file, title, addLabel, onAdd, extra) {
  return h('div', { class: 'list-head' },
    h('div', { class: 'search' }, input({ type: 'search', placeholder: 'جست‌وجو…', 'aria-label': 'جست‌وجو', oninput: (e) => rerenderList(e.target.value) })),
    h('div', {}, dirtyTag(ctx, file) || '', ' ', restoreBtn(ctx, file) || '', ' ', publishQuickBtn(ctx, file) || ''),
    extra || null,
    h('button', { class: 'btn', onclick: onAdd }, '+ ' + addLabel));
}
/* باز-render فهرست با حفظ عبارت جست‌وجو */
let _listRenderer = null;
function rerenderList(q) { if (_listRenderer) _listRenderer(q); }
function setListRenderer(fn) { _listRenderer = fn; }

/* ============================== پیشخوان ============================== */
export function dashboardView(ctx, host) {
  const staff = eff('staff') || [];
  const students = eff('students') || [];
  const ann = eff('announcements') || [];
  const pages = (eff('pages') || []).filter((p) => p.published !== false);
  const media = (eff('media') || { items: [] }).items || [];
  const dirty = ['settings', 'staff', 'students', 'announcements', 'pages', 'media'].filter((f) => ctx.dirty(f));

  const stat = (n, label, ic) => h('div', { class: 'stat' }, h('span', { class: 'ic' }, ic), h('b', {}, faNum(n)), h('span', {}, label));
  host.append(
    h('div', { class: 'stat-grid' },
      stat(staff.length, 'مدیر و معاون', '👔'),
      stat(students.length, 'دانش‌آموز برتر', '🏆'),
      stat(ann.length, 'اطلاعیه', '📣'),
      stat(pages.length, 'برگه منتشرشده', '📄'),
      stat(media.length, 'رسانه', '🖼️')),
    h('div', { class: 'dash-grid' },
      h('div', {},
        h('div', { class: 'adm-card' },
          h('h2', {}, 'تغییرات در انتظار انتشار ', dirty.length ? h('span', { class: 'tag tag--danger' }, faNum(dirty.length) + ' فایل') : h('span', { class: 'tag tag--ok' }, 'همگام')),
          dirty.length
            ? h('p', { style: 'font-size:13.5px;color:var(--a-ink2)' }, 'فایل‌های دارای پیش‌نویس: ', dirty.map((f) => h('span', { class: 'tag', style: 'margin:2px' }, f + '.json')))
            : h('p', { style: 'font-size:13.5px;color:var(--a-ink2)' }, 'همه‌ی تغییرات روی وب‌سایت منتشر شده است.'),
          h('div', { style: 'display:flex;gap:10px;margin-top:10px;flex-wrap:wrap' },
            h('button', { class: 'btn btn--publish', onclick: () => ctx.nav('publish') }, 'مدیریت انتشار'),
            dirty.length ? h('button', { class: 'btn btn--ghost', onclick: async () => {
              const ok = await confirmDialog('همه‌ی پیش‌نویس‌های ذخیره‌شده حذف شوند؟ این عمل بازگشت‌پذیر نیست.', 'حذف همه');
              if (ok) { discardAll(); logLocal('drafts-discard', 'همه پیش‌نویس‌ها حذف شد'); ctx.refresh(); }
            } }, 'لغو همه پیش‌نویس‌ها') : null)),
        h('div', { class: 'adm-card' },
          h('h2', {}, 'میانبرها'),
          h('div', { class: 'shortcut-grid' },
            h('button', { class: 'btn btn--ghost', onclick: () => ctx.nav('staff', 'add') }, '➕ افزودن مدیر یا معاون'),
            h('button', { class: 'btn btn--ghost', onclick: () => ctx.nav('students', 'add') }, '➕ افزودن دانش‌آموز برتر'),
            h('button', { class: 'btn btn--ghost', onclick: () => ctx.nav('announcements', 'add') }, '📣 ثبت اطلاعیه'),
            h('button', { class: 'btn btn--ghost', onclick: () => ctx.nav('media') }, '🖼️ کتابخانه رسانه')))),
      h('div', {},
        h('div', { class: 'adm-card' },
          h('h2', {}, 'فعالیت اخیر'),
          state.mode === 'connected'
            ? (state.serverLogs.length
              ? h('ul', { class: 'log-list' }, state.serverLogs.slice(0, 8).map((l) => h('li', {}, h('time', {}, faTime(l.ts)), h('span', { class: 'what' }, h('span', { class: 'log-act' }, l.action), ' — ', l.detail || ''))))
              : h('p', { class: 'empty' }, 'فعالیتی ثبت نشده است.'))
            : (logsLocal().length
              ? h('ul', { class: 'log-list' }, logsLocal().slice(0, 8).map((l) => h('li', {}, h('time', {}, faTime(l.ts)), h('span', { class: 'what' }, h('span', { class: 'log-act' }, l.action), ' — ', l.detail || ''))))
              : h('p', { class: 'empty' }, 'در این مرورگر فعالیتی ثبت نشده است.'))),
        h('div', { class: 'adm-card' },
          h('h2', {}, 'وضعیت انتشار'),
          h('p', { style: 'font-size:13.5px' }, 'نشانی وب‌سایت: ', h('a', { href: (eff('settings')?.site?.siteUrl || '..'), target: '_blank', rel: 'noopener' }, eff('settings')?.site?.siteUrl || 'مشاهده سایت')),
          state.mode === 'connected' && state.serverInfo?.github?.configured
            ? h('p', { style: 'font-size:13.5px' }, 'مخزن: ', h('a', { href: 'https://github.com/' + state.serverInfo.github.repo + '/actions', target: '_blank', rel: 'noopener' }, state.serverInfo.github.repo + ' — GitHub Actions'))
            : h('p', { style: 'font-size:13.5px;color:var(--a-ink2)' }, 'حالت پیش‌نمایش: انتشار مستقیم در دسترس نیست؛ از بخش «انتشار تغییرات» بسته‌ی محتوا را بگیرید یا سرویس مدیریت را اجرا کنید.')))));
}

/* ============================== مدیران و دانش‌آموزان ============================== */
function personView(ctx, host, kind) {
  const file = kind === 'staff' ? 'staff' : 'students';
  const list = () => (eff(file) || []).slice();
  const isStaff = kind === 'staff';
  const perPage = 8;
  let q = '';

  function saveList(newList, msg) {
    setDraft(file, newList);
    logLocal('draft-save', `${isStaff ? 'مدیران' : 'دانش‌آموزان'}: ${msg}`);
    toast(msg);
    ctx.render();
  }

  function openEditor(item, idx) {
    const isNew = !item;
    item = item || {};
    const f = { name: input({ value: item.name || '', type: 'text', placeholder: isStaff ? 'مثلا: علی محمدی' : 'مثلا: سارا احمدی' }) };
    const f2 = isStaff
      ? { role: input({ value: item.role || '', type: 'text', placeholder: 'مثلا: معاون آموزشی' }) }
      : { rank: input({ value: item.rank || '', type: 'text', placeholder: 'مثلا: ۱' }), grade: input({ value: item.grade || '', type: 'text', placeholder: 'مثلا: دهم ریاضی' }) };
    const bioOrNote = isStaff
      ? textarea(item.bio || '', { placeholder: 'توضیح کوتاه درباره فرد…' })
      : textarea(item.note || '', { placeholder: 'نکته کوتاه (مثلا: برتر المپیاد ریاضی)…' });
    const order = input({ value: item.order ?? '', type: 'number', placeholder: 'عدد ترتیب (کوچک‌تر = بالاتر)' });
    const photo = input({ value: item.photo || '', type: 'url', placeholder: 'نشانی عکس (اختیاری)', dir: 'ltr' });
    const pickBtn = h('button', { class: 'btn btn--ghost btn--sm', onclick: () => openMediaPicker((v) => { photo.value = v; }) }, 'انتخاب از رسانه');

    const form = h('form', {},
      h('div', { class: 'frow' },
        field({ label: 'نام و نام خانوادگی *', name: 'name', input: f.name }),
        isStaff ? field({ label: 'سمت *', name: 'role', input: f2.role }) : field({ label: 'رتبه *', name: 'rank', input: f2.rank })),
      !isStaff ? field({ label: 'پایه', name: 'grade', input: f2.grade }) : null,
      field({ label: isStaff ? 'بیوگرافی کوتاه' : 'نکته کوتاه', name: isStaff ? 'bio' : 'note', input: bioOrNote }),
      h('div', { class: 'frow' },
        field({ label: 'ترتیب نمایش', name: 'order', hint: 'خالی = آخر', input: order }),
        field({ label: 'عکس', name: 'photo', hint: 'از رسانه یا نشانی اینترنتی', input: photo })),
      h('div', { style: 'margin:-6px 0 14px' }, pickBtn));

    const m = modal(isNew ? (isStaff ? 'افزودن مدیر یا معاون' : 'افزودن دانش‌آموز برتر') : 'ویرایش',
      [form],
      [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'انصراف'),
        h('button', { class: 'btn', type: 'submit' }, isNew ? 'افزودن' : 'ذخیره')]);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const item2 = { ...item };
      item2.name = f.name.value.trim();
      if (isStaff) item2.role = f2.role.value.trim(); else { item2.rank = f2.rank.value.trim(); item2.grade = f2.grade.value.trim(); }
      if (isStaff) item2.bio = bioOrNote.value.trim(); else item2.note = bioOrNote.value.trim();
      const ord = toEnDigits(order.value.trim());
      if (ord) item2.order = parseInt(ord, 10); else delete item2.order;
      const ph = photo.value.trim();
      if (ph) item2.photo = ph; else delete item2.photo;
      if (isNew) item2.id = Date.now();
      const v = validatePerson(item2, isStaff ? 'staff' : 'student');
      setErrors(form, v.errors || {});
      if (!v.ok) { toast('لطفاً خطاهای فرم را برطرف کنید', 'err'); return; }
      const list2 = list();
      if (isNew) list2.push(item2); else list2[idx] = item2;
      m.close();
      saveList(list2, isNew ? 'عضو جدید افزوده شد' : 'تغییرات ذخیره شد');
    });
    setTimeout(() => f.name.focus(), 50);
  }

  function openMediaPicker(cb) {
    const items = (eff('media') || { items: [] }).items.filter((it) => (it.type || '').startsWith('image/'));
    const m = modal('انتخاب تصویر از کتابخانه رسانه',
      [items.length
        ? h('div', { class: 'media-grid' }, items.map((it) => h('div', { class: 'media-card' },
          h('div', { class: 'thumb', style: 'cursor:pointer', onclick: () => { m.close(); cb('media/' + it.file); toast('تصویر انتخاب شد'); } },
            h('img', { src: '../media/' + it.file, alt: it.file, loading: 'lazy' })),
          h('div', { class: 'meta' }, h('b', {}, it.file)))))
        : h('p', { class: 'empty' }, 'رسانه‌ای موجود نیست؛ ابتدا از بخش «کتابخانه رسانه» تصویر بارگذاری کنید.')],
      [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'بستن')]);
  }

  function render() {
    host.innerHTML = '';
    const all = list();
    const norm = (s) => String(s || '').replace(/[\u064A\u0649]/g, '\u06CC').replace(/\u0643/g, '\u06A9').replace(/[\u200C\u200D]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
    const filtered = q ? all.filter((p) => norm([p.name, p.role, p.grade, p.note, p.bio, p.rank].join(' ')).includes(norm(q))) : all;
    const sorted = filtered.slice().sort((a, b) => (a.order || 999999) - (b.order || 999999));
    const body = h('div', { class: 'cards' });
    host.append(
      h('div', { class: 'alert alert--info' }, isStaff
        ? 'این بخش معادل «مدیر و معاونان» در قالب اصلی است؛ ترتیب نمایش با فیلد ترتیب کنترل می‌شود.'
        : 'این بخش معادل «دانش‌آموزان برتر» در قالب اصلی است؛ رتبه، پایه و نکته هر دانش‌آموز در کارت او نمایش داده می‌شود.'),
      header(ctx, file, '', isStaff ? 'افزودن مدیر یا معاون' : 'افزودن دانش‌آموز برتر', () => openEditor(null)),
      body,
      h('div', {}));
    const pagerHost = host.lastChild;
    const { body: pageBody } = paginate(sorted, 1, perPage, (slice) => {
      body.innerHTML = '';
      if (!slice.length) { body.append(h('p', { class: 'empty' }, q ? 'موردی با این عبارت پیدا نشد.' : 'هنوز موردی ثبت نشده است — با دکمه‌ی «افزودن» شروع کنید.')); return; }
      slice.forEach((p) => {
        const idx = all.indexOf(p);
        body.append(h('div', { class: 'item-card' },
          h('div', { class: 'ph' }, p.photo ? h('img', { src: p.photo.startsWith('data:') || /^(https?:)?\/\//.test(p.photo) ? p.photo : '../' + p.photo, alt: '' }) : (isStaff ? '👤' : '🏆')),
          h('div', { class: 'info' },
            h('b', {}, p.name || '—'),
            h('small', {}, isStaff ? (p.role || '') : [p.rank && ('رتبه ' + p.rank), p.grade].filter(Boolean).join(' · ')),
            h('small', {}, p.bio || p.note || '')),
          h('div', { class: 'ops' },
            h('button', { class: 'btn btn--ghost btn--sm', onclick: () => openEditor(p, idx) }, 'ویرایش'),
            h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
              const ok = await confirmDialog(`«${p.name}» حذف شود؟ این تغییر ابتدا به‌صورت پیش‌نویس ذخیره می‌شود.`, 'حذف');
              if (!ok) return;
              const l2 = list(); l2.splice(idx, 1);
              saveList(l2, 'حذف شد: ' + (p.name || ''));
            } }, 'حذف'))));
      });
    }, pagerHost);
    body.after(pageBody);
  }
  setListRenderer((nq) => { q = nq || ''; render(); });
  render();
}
export function staffView(ctx, host) { personView(ctx, host, 'staff'); }
export function studentsView(ctx, host) { personView(ctx, host, 'student'); }

/* ============================== اطلاعیه‌ها ============================== */
export function announcementsView(ctx, host) {
  const file = 'announcements';
  const list = () => (eff(file) || []).slice();
  let q = '';

  function openEditor(item, idx) {
    const isNew = !item;
    item = item || {};
    const title = input({ value: item.title || '', type: 'text', placeholder: 'مثلا: زمان‌بندی امتحانات پایان ترم' });
    const slug = input({ value: item.slug || '', type: 'text', dir: 'ltr', placeholder: 'exam-schedule (به انگلیسی، خط تیره)' });
    const date = input({ value: item.date || new Date().toISOString().slice(0, 10), type: 'date' });
    const body = textarea(item.body || '', { placeholder: 'متن کامل اطلاعیه…' });
    const pinned = input({ type: 'checkbox' });
    pinned.checked = !!item.pinned;
    const form = h('form', {},
      field({ label: 'عنوان *', name: 'title', input: title }),
      h('div', { class: 'frow' },
        field({ label: 'نامک (slug) *', name: 'slug', hint: 'در نشانی صفحه استفاده می‌شود', input: slug }),
        field({ label: 'تاریخ *', name: 'date', input: date })),
      field({ label: 'متن اطلاعیه *', name: 'body', input: body }),
      field({ label: 'سنجاق کردن (نمایش در صدر)', name: 'pinned', input: h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:400' }, pinned, 'این اطلاعیه مهم است') }));
    title.addEventListener('input', () => {
      if (!isNew && item.slug) return;
      if (!slug.dataset.touched) slug.value = slugify(title.value) || '';
    });
    slug.addEventListener('input', () => { slug.dataset.touched = '1'; });
    const m = modal(isNew ? 'ثبت اطلاعیه جدید' : 'ویرایش اطلاعیه',
      [form],
      [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'انصراف'),
        h('button', { class: 'btn', type: 'submit' }, isNew ? 'ثبت' : 'ذخیره')]);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const a = { ...item };
      a.title = title.value.trim();
      a.slug = slug.value.trim();
      a.date = date.value;
      a.body = body.value.trim();
      if (pinned.checked) a.pinned = true; else delete a.pinned;
      if (isNew) a.id = Date.now();
      const v = validateAnnouncement(a);
      setErrors(form, v.errors || {});
      if (!v.ok) { toast('لطفاً خطاهای فرم را برطرف کنید', 'err'); return; }
      const l2 = list();
      if (isNew) l2.push(a); else l2[idx] = a;
      m.close();
      setDraft(file, l2);
      logLocal('draft-save', `اطلاعیه: ${a.title}`);
      toast(isNew ? 'اطلاعیه ثبت شد' : 'تغییرات ذخیره شد');
      ctx.render();
    });
    setTimeout(() => title.focus(), 50);
  }

  function render() {
    host.innerHTML = '';
    const all = list().slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
    const norm = (s) => String(s || '').replace(/[\u064A\u0649]/g, '\u06CC').replace(/\u0643/g, '\u06A9').replace(/[\u200C\u200D]/g, '').toLowerCase().trim();
    const filtered = q ? all.filter((a) => norm(a.title + ' ' + a.body).includes(norm(q))) : all;
    const body = h('div', { class: 'cards' });
    host.append(header(ctx, file, '', 'ثبت اطلاعیه', () => openEditor(null)), body, h('div', {}));
    const pagerHost = host.lastChild;
    paginate(filtered, 1, 8, (slice) => {
      body.innerHTML = '';
      if (!slice.length) { body.append(h('p', { class: 'empty' }, q ? 'اطلاعیه‌ای با این عبارت پیدا نشد.' : 'هنوز اطلاعیه‌ای ثبت نشده است.')); return; }
      slice.forEach((a) => {
        const idx = list().indexOf(a);
        body.append(h('div', { class: 'item-card' },
          h('div', { class: 'ph' }, '📣'),
          h('div', { class: 'info' },
            h('b', {}, a.title || '—', a.pinned ? h('span', { class: 'pin' }, 'مهم') : null),
            h('small', {}, a.date ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(new Date(a.date + 'T00:00:00')) : ''),
            h('small', {}, a.body ? a.body.slice(0, 90) + (a.body.length > 90 ? '…' : '') : '')),
          h('div', { class: 'ops' },
            h('a', { class: 'btn btn--ghost btn--sm', href: '../announcements/' + encodeURIComponent(a.slug) + '/', target: '_blank', rel: 'noopener', title: 'نسخه منتشرشده' }, 'مشاهده'),
            h('button', { class: 'btn btn--ghost btn--sm', onclick: () => openEditor(a, idx) }, 'ویرایش'),
            h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
              const ok = await confirmDialog(`اطلاعیه «${a.title}» حذف شود؟`, 'حذف');
              if (!ok) return;
              const l2 = list(); l2.splice(idx, 1);
              setDraft(file, l2); logLocal('draft-save', 'حذف اطلاعیه: ' + a.title);
              toast('حذف شد'); ctx.render();
            } }, 'حذف'))));
      });
    }, pagerHost);
  }
  setListRenderer((nq) => { q = nq || ''; render(); });
  render();
}

/* ============================== برگه‌ها ============================== */
export function pagesView(ctx, host) {
  const file = 'pages';
  const list = () => (eff(file) || []).slice();
  let q = '';

  function openEditor(item, idx) {
    const isNew = !item;
    item = item || {};
    const title = input({ value: item.title || '', type: 'text', placeholder: 'مثلا: درباره دبیرستان' });
    const slug = input({ value: item.slug || '', type: 'text', dir: 'ltr', placeholder: 'about (انگلیسی و بدون فاصله)' });
    const content = textarea(item.content || '', { placeholder: 'متن برگه… (خط جدید = خط جدید)' });
    const published = input({ type: 'checkbox' });
    published.checked = item.published !== false;
    const form = h('form', {},
      field({ label: 'عنوان *', name: 'title', input: title }),
      field({ label: 'نامک *', name: 'slug', hint: 'نشانی: سایت/نامک/', input: slug }),
      field({ label: 'متن برگه *', name: 'content', input: content }),
      field({ label: 'وضعیت', name: 'published', input: h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:400' }, published, 'منتشر شود') }));
    const m = modal(isNew ? 'برگه جدید' : 'ویرایش برگه',
      [form],
      [h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'انصراف'),
        h('button', { class: 'btn', type: 'submit' }, isNew ? 'ایجاد' : 'ذخیره')]);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = { ...item };
      p.title = title.value.trim();
      p.slug = slug.value.trim();
      p.content = content.value.trim();
      if (published.checked) delete p.published; else p.published = false;
      if (isNew) p.id = Date.now();
      const v = validatePage(p);
      setErrors(form, v.errors || {});
      if (!v.ok) { toast('لطفاً خطاهای فرم را برطرف کنید', 'err'); return; }
      const l2 = list();
      if (isNew) l2.push(p); else l2[idx] = p;
      m.close();
      setDraft(file, l2);
      logLocal('draft-save', `برگه: ${p.title}`);
      toast('ذخیره شد'); ctx.render();
    });
    setTimeout(() => title.focus(), 50);
  }

  function render() {
    host.innerHTML = '';
    const all = list();
    const filtered = q ? all.filter((p) => (p.title + ' ' + p.slug).toLowerCase().includes(q.toLowerCase().trim())) : all;
    const body = h('div', { class: 'cards' });
    host.append(header(ctx, file, '', 'برگه جدید', () => openEditor(null)), body, h('div', {}));
    const pagerHost = host.lastChild;
    paginate(filtered, 1, 8, (slice) => {
      body.innerHTML = '';
      if (!slice.length) { body.append(h('p', { class: 'empty' }, q ? 'برگه‌ای پیدا نشد.' : 'برگه‌ای ساخته نشده است. برگه‌ها به‌صورت صفحه مستقل روی سایت منتشر می‌شوند.')); return; }
      slice.forEach((p) => {
        const idx = list().indexOf(p);
        body.append(h('div', { class: 'item-card' },
          h('div', { class: 'ph' }, '📄'),
          h('div', { class: 'info' },
            h('b', {}, p.title || '—', p.published === false ? h('span', { class: 'tag' }, 'پیش‌نویس عمومی') : h('span', { class: 'tag tag--ok' }, 'منتشر')),
            h('small', { dir: 'ltr', style: 'text-align:right' }, '/' + p.slug + '/')),
          h('div', { class: 'ops' },
            p.published !== false ? h('a', { class: 'btn btn--ghost btn--sm', href: '../' + encodeURIComponent(p.slug) + '/', target: '_blank', rel: 'noopener' }, 'مشاهده') : null,
            h('button', { class: 'btn btn--ghost btn--sm', onclick: () => openEditor(p, idx) }, 'ویرایش'),
            h('button', { class: 'btn btn--danger btn--sm', onclick: async () => {
              const ok = await confirmDialog(`برگه «${p.title}» حذف شود؟`, 'حذف');
              if (!ok) return;
              const l2 = list(); l2.splice(idx, 1);
              setDraft(file, l2); logLocal('draft-save', 'حذف برگه: ' + p.title);
              toast('حذف شد'); ctx.render();
            } }, 'حذف'))));
      });
    }, pagerHost);
  }
  setListRenderer((nq) => { q = nq || ''; render(); });
  render();
}
