/* =====================================================================
   پنل مدیریت دبیرستان سوره — روتر و پوسته
   حالت‌ها: prototype (روی GitHub Pages — پیش‌نمایش محلی، برچسب صادقانه)
            connected (سرو شده توسط admin-server — احراز هویت واقعی + انتشار)
   ===================================================================== */
import { h, toast, modal, field, input, setErrors } from './ui.js';
import { state, detectMode, refreshPublished, effective as eff, isDirty, dirtyFiles, apiGet, apiSend, loadTheme, saveTheme, logLocal } from './store.js';
import { dashboardView, staffView, studentsView, announcementsView, pagesView } from './views1.js';
import { mediaView, settingsView, menuView, appearanceView, seoView, featuresView, usersView, logsView, publishView } from './views2.js';

const ROUTES = [
  { id: '', title: 'پیشخوان', ic: '📊', grp: 'اصلی', view: dashboardView },
  { id: 'publish', title: 'انتشار تغییرات', ic: '🚀', grp: 'اصلی', view: publishView, badge: true },
  { id: 'staff', title: 'مدیر و معاونان', ic: '👔', grp: 'محتوا', view: staffView },
  { id: 'students', title: 'دانش‌آموزان برتر', ic: '🏆', grp: 'محتوا', view: studentsView },
  { id: 'announcements', title: 'اطلاعیه‌ها', ic: '📣', grp: 'محتوا', view: announcementsView },
  { id: 'pages', title: 'برگه‌ها', ic: '📄', grp: 'محتوا', view: pagesView },
  { id: 'media', title: 'کتابخانه رسانه', ic: '🖼️', grp: 'محتوا', view: mediaView },
  { id: 'settings', title: 'اطلاعات مدرسه', ic: '🏫', grp: 'تنظیمات', view: settingsView },
  { id: 'menu', title: 'منوی سایت', ic: '🧭', grp: 'تنظیمات', view: menuView },
  { id: 'appearance', title: 'ظاهر', ic: '🎨', grp: 'تنظیمات', view: appearanceView },
  { id: 'seo', title: 'سئو', ic: '🔍', grp: 'تنظیمات', view: seoView },
  { id: 'features', title: 'امکانات سایت', ic: '⚙️', grp: 'تنظیمات', view: featuresView },
  { id: 'users', title: 'کاربران', ic: '👥', grp: 'سیستم', view: usersView },
  { id: 'logs', title: 'گزارش فعالیت', ic: '📝', grp: 'سیستم', view: logsView },
];

let pending = {};
const ctx = {
  state,
  eff,
  dirty: (f) => isDirty(state.published, f),
  nav(route, action) { if (action) pending[route] = action; location.hash = '#/' + route; },
  render() { renderCurrent(); },
  async refresh() { await refreshPublished(); renderSidebar(); renderCurrent(); },
  takePending(route) { const a = pending[route]; delete pending[route]; return a; },
};

const viewHost = document.getElementById('adm-view');
const titleEl = document.getElementById('adm-title');
const navEl = document.getElementById('adm-nav');
const badgeEl = document.getElementById('adm-mode-badge');
const userEl = document.getElementById('adm-user');
const noteEl = document.getElementById('adm-mode-note');
let currentRoute = '';

function renderSidebar() {
  navEl.innerHTML = '';
  let lastGrp = '';
  for (const r of ROUTES) {
    if (r.grp !== lastGrp) {
      navEl.append(h('div', { class: 'grp' }, r.grp));
      lastGrp = r.grp;
    }
    const a = h('a', { href: '#/' + r.id, class: r.id === currentRoute ? 'on' : '' },
      h('span', { class: 'ic' }, r.ic), r.title,
      r.badge && dirtyFiles(state.published).length ? h('span', { class: 'n' }, String(dirtyFiles(state.published).length)) : null);
    navEl.append(a);
  }
  noteEl.textContent = state.mode === 'connected'
    ? 'متصل به سرویس مدیریت — انتشار فعال است'
    : 'حالت پیش‌نمایش: تغییرات فقط در این مرورگر ذخیره می‌شوند';
}

function renderBadge() {
  if (state.mode === 'connected') {
    badgeEl.textContent = '● متصل به سرور';
    badgeEl.className = 'adm__badge live';
  } else {
    badgeEl.textContent = '● حالت پیش‌نمایش (Prototype)';
    badgeEl.className = 'adm__badge proto';
    badgeEl.title = 'روی میزبانی استاتیک، این پنل پیش‌نمایش محلی است؛ برای انتشار واقعی admin-server را اجرا کنید';
  }
}

function renderUser() {
  userEl.innerHTML = '';
  if (state.mode === 'connected' && state.user) {
    const name = state.user;
    userEl.append(
      h('span', { class: 'av' }, String(name).slice(0, 1)),
      h('span', {}, name),
      h('button', { onclick: doLogout }, 'خروج'));
  } else if (state.mode === 'connected') {
    userEl.append(h('button', { onclick: showLogin }, 'ورود مدیر'));
  } else {
    userEl.append(h('span', { class: 'av', title: 'پیش‌نمایش بدون احراز هویت' }, 'پ'));
  }
}

function renderCurrent() {
  const route = (location.hash || '#/').replace(/^#\//, '').split('?')[0];
  currentRoute = route;
  const r = ROUTES.find((x) => x.id === route) || ROUTES[0];
  titleEl.textContent = r.title;
  renderSidebar();
  viewHost.innerHTML = '';
  try {
    r.view(ctx, viewHost);
  } catch (err) {
    console.error(err);
    viewHost.append(h('div', { class: 'alert alert--warn' }, 'خطا در نمایش این بخش: ' + (err.message || err)));
  }
  /* باز کردن خودکار مودال افزودن از میانبرهای پیشخوان */
  if (r.id === 'staff' || r.id === 'students' || r.id === 'announcements') {
    if (ctx.takePending(r.id) === 'add') {
      setTimeout(() => {
        const addBtn = viewHost.querySelector('.list-head .btn');
        if (addBtn) addBtn.click();
      }, 60);
    }
  }
}

/* ---------- ورود مدیر (حالت متصل) ---------- */
function showLogin() {
  const u = input({ type: 'text', dir: 'ltr', placeholder: 'نام کاربری', autocomplete: 'username' });
  const p = input({ type: 'password', dir: 'ltr', placeholder: 'رمز عبور', autocomplete: 'current-password' });
  const form = h('form', {},
    field({ label: 'نام کاربری', name: 'user', input: u }),
    field({ label: 'رمز عبور', name: 'pass', input: p }));
  const m = modal('ورود مدیر', [form], [
    h('button', { class: 'btn btn--ghost', onclick: () => m.close() }, 'انصراف'),
    h('button', { class: 'btn', type: 'submit' }, 'ورود'),
  ]);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiSend('login', { user: u.value.trim(), pass: p.value });
      m.close();
      state.mode = 'connected';
      await ctx.refresh();
      renderBadge(); renderUser();
      toast('خوش آمدید، ' + state.user);
    } catch (err) {
      setErrors(form, { user: ' ' });
      toast(err.message || 'ورود ناموفق بود', 'err');
    }
  });
}

async function doLogout() {
  try { await apiSend('logout', {}); } catch {}
  state.user = null;
  renderBadge(); renderUser(); renderCurrent();
  toast('خارج شدید');
}

/* ---------- تم ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  saveTheme(t);
}
document.getElementById('adm-theme').addEventListener('click', () => {
  applyTheme(loadTheme() === 'dark' ? 'light' : 'dark');
});

/* ---------- موبایل ---------- */
const side = document.getElementById('adm-side');
document.getElementById('adm-burger').addEventListener('click', () => {
  side.classList.toggle('open');
  document.querySelector('.adm__backdrop')?.classList.toggle('show');
});
document.addEventListener('click', (e) => {
  if (side.classList.contains('open') && !side.contains(e.target) && !e.target.closest('#adm-burger')) {
    side.classList.remove('open');
    document.querySelector('.adm__backdrop')?.classList.remove('show');
  }
});
if (!document.querySelector('.adm__backdrop')) {
  document.body.append(h('div', { class: 'adm__backdrop' }));
}

/* ---------- شروع ---------- */
(async function boot() {
  applyTheme(loadTheme());
  await detectMode();
  if (state.mode === 'connected') {
    if (!state.user) { showLogin(); }
  }
  await refreshPublished();
  renderBadge(); renderUser(); renderSidebar(); renderCurrent();
  window.addEventListener('hashchange', renderCurrent);
})();
