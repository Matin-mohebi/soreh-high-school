/* =====================================================================
   وضعیت و ذخیره‌سازی پنل مدیریت
   دو حالت: connected (متصل به admin-server) / prototype (پیش‌نمایش محلی)
   پیش‌نویس‌ها در localStorage نگهداری می‌شوند و هرگز به‌صورت خودکار منتشر نمی‌شوند.
   ===================================================================== */
import { validateContent, CONTENT_FILES } from '../validate.js';

const DRAFT_KEY = 'soreh_drafts_v1';
const LOG_KEY = 'soreh_logs_v1';
const THEME_KEY = 'soreh_admin_theme';

export const API = '../api/';

export async function apiGet(path) {
  const res = await fetch(API + path, { credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch' } });
  if (!res.ok) { const e = new Error('http ' + res.status); e.status = res.status; throw e; }
  return res.json();
}
export async function apiSend(path, body, method = 'POST') {
  const res = await fetch(API + path, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || ('http ' + res.status)); e.status = res.status; e.data = data; throw e; }
  return data;
}

/* ---------- محتوای منتشرشده (فایل‌های content/ سایت) ---------- */
export async function loadPublished() {
  const files = ['settings', 'staff', 'students', 'announcements', 'pages', 'media'];
  const out = {};
  await Promise.all(files.map(async (f) => {
    const name = f === 'media' ? 'media' : f;
    try {
      const res = await fetch(`../content/${name}.json`, { cache: 'no-store' });
      if (!res.ok) throw 0;
      out[f] = await res.json();
    } catch {
      out[f] = f === 'settings' ? {} : (f === 'media' ? { items: [] } : []);
    }
  }));
  out.media = out.media && Array.isArray(out.media.items) ? out.media : { items: [] };
  return out;
}

/* ---------- پیش‌نویس‌ها ---------- */
function readDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
}
function writeDrafts(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}
export const drafts = readDrafts();

export function getDraft(file) { return drafts[file]; }
export function setDraft(file, data) {
  if (data === null) delete drafts[file]; else drafts[file] = data;
  writeDrafts(drafts);
}
export function discardDraft(file) { setDraft(file, null); }
export function discardAll() { for (const f of Object.keys(drafts)) delete drafts[f]; writeDrafts({}); }

export function effective(file) {
  const pub = state.published || {};
  return file in drafts ? drafts[file] : pub[file];
}

export function isDirty(published, file) {
  if (!(file in drafts)) return false;
  return JSON.stringify(drafts[file]) !== JSON.stringify(published[file]);
}
export function dirtyFiles(published) {
  return CONTENT_FILES.filter((f) => isDirty(published, f));
}

/* ---------- گزارش فعالیت ---------- */
export function logLocal(action, detail) {
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch {}
  logs.unshift({ ts: Date.now(), action, detail: detail || '', user: 'پیش‌نویس محلی' });
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 300)));
}
export function logsLocal() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}

/* ---------- حالت ---------- */
export const state = {
  mode: 'prototype',       /* 'prototype' | 'connected' */
  user: null,
  published: null,         /* content از سرور/فایل‌های سایت */
  serverLogs: [],
  serverInfo: null,
};

export async function detectMode() {
  try {
    const s = await apiGet('session');
    if (s && s.authenticated) { state.mode = 'connected'; state.user = s.user; }
  } catch (e) {
    /* 401 = سرویس موجود است ولی نشست ندارد → حالت متصل با فرم ورود
       404/خطای دیگر = میزبانی استاتیک → حالت پیش‌نمایش */
    state.mode = (e && e.status === 401) ? 'connected' : 'prototype';
  }
  return state.mode;
}

export async function refreshPublished() {
  state.published = await loadPublished();
  if (state.mode === 'connected') {
    try { state.serverLogs = (await apiGet('logs')).logs || []; } catch { state.serverLogs = []; }
    try { state.serverInfo = await apiGet('status'); } catch { state.serverInfo = null; }
  }
  return state.published;
}

/* ---------- انتشار (فقط در حالت متصل) ---------- */
export async function publishFile(file) {
  const data = effective(state.published, file);
  const check = validateContent(file + (file === 'media' ? '' : '.json'), data);
  if (!check.ok) {
    const e = new Error('محتوا اعتبارسنجی نشد؛ ابتدا خطاها را برطرف کنید.');
    e.validation = check.errors;
    throw e;
  }
  const payloadName = file === 'media' ? 'media' : file;
  await apiSend('content/' + payloadName, { data }, 'PUT');
  logLocal('publish', `${payloadName}.json منتشر شد`);
  setDraft(file, null);
}

/* ---------- تم ---------- */
export function loadTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
export function saveTheme(t) { localStorage.setItem(THEME_KEY, t); }
