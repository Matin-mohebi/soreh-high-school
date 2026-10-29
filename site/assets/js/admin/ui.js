/* =====================================================================
   اجزای رابط کاربری پنل مدیریت — مودال، تأیید، توست، فرم، صفحه‌بندی
   ===================================================================== */
export function faNum(v) { return String(v ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]); }
export function faTime(ts) {
  try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts)); }
  catch { return new Date(ts).toLocaleString('fa-IR'); }
}
export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat(9)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

/* ---------- توست ---------- */
export function toast(msg, type = 'ok') {
  const root = document.getElementById('adm-toast-root');
  const t = h('div', { class: `toast toast--${type}`, role: 'status' }, msg);
  root.append(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3200);
}

/* ---------- مودال ---------- */
export function modal(title, bodyNodes, ops) {
  const root = document.getElementById('adm-modal-root');
  root.innerHTML = '';
  const box = h('div', { class: 'modal', role: 'dialog', 'aria-label': title },
    h('h3', {}, title),
    ...[].concat(bodyNodes),
    h('div', { class: 'ops' }, ...[].concat(ops || [])),
  );
  const bg = h('div', { class: 'modal-bg' }, box);
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  function close() { root.innerHTML = ''; }
  root.append(bg);
  return { close, box };
}

/* ---------- تأیید عملیات ---------- */
export function confirmDialog(message, okLabel = 'بله، انجام بده') {
  return new Promise((resolve) => {
    const root = document.getElementById('adm-confirm-root');
    root.innerHTML = '';
    const ok = h('button', { class: 'btn btn--danger' }, okLabel);
    const no = h('button', { class: 'btn btn--ghost' }, 'انصراف');
    const box = h('div', { class: 'confirm-box', role: 'alertdialog', 'aria-label': 'تأیید' },
      h('p', {}, message), h('div', { class: 'ops' }, no, ok));
    const bg = h('div', { class: 'modal-bg' }, box);
    function done(v) { root.innerHTML = ''; resolve(v); }
    ok.addEventListener('click', () => done(true));
    no.addEventListener('click', () => done(false));
    bg.addEventListener('mousedown', (e) => { if (e.target === bg) done(false); });
    root.append(bg);
    ok.focus();
  });
}

/* ---------- فیلد فرم ---------- */
export function field({ label, hint, input, name }) {
  const err = h('div', { class: 'err', 'data-err': name || '' });
  const wrap = h('div', { class: 'field' },
    label ? h('label', {}, label, hint ? h('small', {}, ' — ' + hint) : null) : null,
    input, err);
  wrap.dataset.name = name || '';
  return wrap;
}
export function setErrors(formEl, errors) {
  formEl.querySelectorAll('.field').forEach((f) => {
    const name = f.dataset.name;
    const msg = errors && errors[name];
    f.classList.toggle('invalid', !!msg);
    const e = f.querySelector('.err');
    if (e) e.textContent = msg || '';
  });
}
export function input({ type = 'text', value = '', ...rest }) {
  const i = h('input', { type, ...rest });
  i.value = value ?? '';
  return i;
}
export function textarea(value = '', attrs = {}) {
  const t = h('textarea', attrs);
  t.value = value ?? '';
  return t;
}
export function select(options, value) {
  const s = h('select', {});
  for (const [v, label] of options) {
    const o = h('option', { value: v }, label);
    if (String(v) === String(value)) o.selected = true;
    s.append(o);
  }
  return s;
}

/* ---------- صفحه‌بندی + جست‌وجو ---------- */
export function paginate(items, page, per, render, pagerHost) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / per));
  page = Math.min(Math.max(1, page), pages);
  const slice = items.slice((page - 1) * per, page * per);
  const body = render(slice);
  if (pages > 1) {
    const mk = (label, p, opts = {}) => h('button', {
      class: p === page ? 'on' : '', disabled: !!opts.dis,
      onclick: () => { if (!opts.dis) renderPage(p); },
    }, label);
    const bar = h('div', { class: 'pager' },
      mk('‹', page - 1, { dis: page === 1 }),
      Array.from({ length: pages }, (_, i) => mk(faNum(i + 1), i + 1)),
      mk('›', page + 1, { dis: page === pages }));
    pagerHost.innerHTML = '';
    pagerHost.append(bar);
  } else if (pagerHost) pagerHost.innerHTML = '';
  function renderPage(p) { paginate(items, p, per, render, pagerHost); }
  return { body, page, pages, total };
}

export function downloadJSON(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

export function readFile(file, as = 'dataURL') {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    if (as === 'dataURL') r.readAsDataURL(file); else r.readAsText(file);
  });
}
