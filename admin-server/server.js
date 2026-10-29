/* =====================================================================
   سرویس مدیریت دبیرستان سوره — admin-server
   اجرا:  node server.js            (پس از ساخت .env از روی .env.example)
   ابزار: node server.js hashpass <رمز>   → مقدار ADMIN_PASSWORD_HASH

   امنیت:
   - احراز هویت سمت سرور (scrypt) + نشست کوکی HttpOnly/SameSite=Strict
   - محدودسازی نرخ تلاش ورود، بررسی Origin، هدر X-Requested-With
   - توکن GitHub فقط در همین پروسه (env) — هرگز به مرورگر فرستاده نمی‌شود
   - اعتبارسنجی یکسان محتوا با پنل (validate.js مشترک)
   ===================================================================== */
import { createServer } from 'node:http';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent, validateMediaName, MEDIA_TYPES, MEDIA_MAX_BYTES, toEnDigits } from '../site/assets/js/validate.js';
import { renderHome, renderAuthPage, renderAnnouncement, renderAnnouncementsIndex, renderCustomPage, render404 } from '../site/assets/js/render.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');
const SITE_DIR = join(ROOT, 'site');
const DIST_DIR = join(ROOT, 'dist');
const DATA_DIR = join(ROOT, 'admin-server', 'data');
mkdirSync(DATA_DIR, { recursive: true });

/* ---------- .env ---------- */
function loadEnv() {
  const p = join(ROOT, 'admin-server', '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const CONF = {
  PORT: parseInt(process.env.PORT || '8787', 10),
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || '',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
  SESSION_SECRET: process.env.SESSION_SECRET || '',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GITHUB_REPO: process.env.GITHUB_REPO || 'Matin-mohebi/soreh-high-school',
  GITHUB_BRANCH: process.env.GITHUB_BRANCH || 'main',
};

/* ابزار ساخت هش رمز */
if (process.argv[2] === 'hashpass') {
  const pw = process.argv[3] || '';
  if (pw.length < 8) { console.error('رمز باید حداقل ۸ کاراکتر باشد.'); process.exit(1); }
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pw, salt, 64).toString('hex');
  console.log(`ADMIN_PASSWORD_HASH=${salt}:${hash}`);
  process.exit(0);
}

const missing = [];
if (!CONF.ADMIN_USERNAME) missing.push('ADMIN_USERNAME');
if (!CONF.ADMIN_PASSWORD_HASH || !CONF.ADMIN_PASSWORD_HASH.includes(':')) missing.push('ADMIN_PASSWORD_HASH (با دستور hashpass بسازید)');
if (!CONF.SESSION_SECRET || CONF.SESSION_SECRET.length < 32) missing.push('SESSION_SECRET (حداقل ۳۲ نویسه تصادفی)');
const githubReady = !!CONF.GITHUB_TOKEN;
if (!githubReady) console.warn('⚠ GITHUB_TOKEN تنظیم نشده — انتشار به GitHub غیرفعال است (فقط ذخیره‌ی محلی).');
if (missing.length) {
  console.error('✗ متغیرهای محیطی ناقص:', missing.join(', '));
  console.error('  فایل .env.example را به .env کپی و مقدارها را پر کنید.');
  process.exit(1);
}

/* ---------- ذخیره‌سازی ساده ---------- */
const readJson = (p, fb) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; } };
const writeJson = (p, v) => { writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); };

const USERS_FILE = join(DATA_DIR, 'users.json');
const LOG_FILE = join(DATA_DIR, 'activity.json');
const users = () => readJson(USERS_FILE, []);
const saveUsers = (u) => writeJson(USERS_FILE, u);
const logs = () => readJson(LOG_FILE, []);
function log(action, detail, user = 'system') {
  const l = logs();
  l.unshift({ ts: Date.now(), action, detail: detail || '', user });
  writeJson(LOG_FILE, l.slice(0, 500));
  console.log(`[log] ${user}: ${action} — ${detail || ''}`);
}

/* ---------- محتوا ---------- */
const CONTENT_FILES = ['settings', 'staff', 'students', 'announcements', 'pages', 'media'];
function readContent(name) {
  const f = join(CONTENT_DIR, name + '.json');
  return readJson(f, name === 'media' ? { items: [] } : (name === 'settings' ? {} : []));
}
function writeContent(name, data) {
  writeJson(join(CONTENT_DIR, name + '.json'), data);
}
function allContent() {
  const out = {};
  for (const f of CONTENT_FILES) out[f] = readContent(f);
  return out;
}

/* ---------- GitHub publishing ---------- */
const GH = 'https://api.github.com';
function ghHeaders() {
  return {
    'Authorization': `Bearer ${CONF.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'soreh-admin-server',
  };
}
async function ghPutFile(repoPath, contentBuf, message) {
  if (!githubReady) return { skipped: true };
  let sha;
  const get = await fetch(`${GH}/repos/${CONF.GITHUB_REPO}/contents/${encodePath(repoPath)}?ref=${CONF.GITHUB_BRANCH}`, { headers: ghHeaders() });
  if (get.ok) sha = (await get.json()).sha;
  const res = await fetch(`${GH}/repos/${CONF.GITHUB_REPO}/contents/${encodePath(repoPath)}`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: contentBuf.toString('base64'), branch: CONF.GITHUB_BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub ${res.status}: ${t.slice(0, 200)}`);
  }
  return { skipped: false, commit: (await res.json()).commit?.sha?.slice(0, 7) };
}
async function ghDeleteFile(repoPath, message) {
  if (!githubReady) return { skipped: true };
  const get = await fetch(`${GH}/repos/${CONF.GITHUB_REPO}/contents/${encodePath(repoPath)}?ref=${CONF.GITHUB_BRANCH}`, { headers: ghHeaders() });
  if (get.status === 404) return { skipped: true };
  if (!get.ok) throw new Error('GitHub GET ' + get.status);
  const sha = (await get.json()).sha;
  const res = await fetch(`${GH}/repos/${CONF.GITHUB_REPO}/contents/${encodePath(repoPath)}`, {
    method: 'DELETE',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: CONF.GITHUB_BRANCH }),
  });
  if (!res.ok) throw new Error('GitHub DELETE ' + res.status);
  return { skipped: false };
}
function encodePath(p) { return p.split('/').map(encodeURIComponent).join('/'); }

/* ---------- نشست‌ها ---------- */
const sessions = new Map(); /* token → {user, exp} */
const SESSION_TTL = 1000 * 60 * 60 * 8; /* ۸ ساعت */
function sign(token) { return createHmac('sha256', CONF.SESSION_SECRET).update(token).digest('base64url'); }
function makeSession(user) {
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, { user, exp: Date.now() + SESSION_TTL });
  return `${token}.${sign(token)}`;
}
function readSession(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [token, sig] = cookieValue.split('.');
  try {
    const want = sign(token);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  } catch { return null; }
  const s = sessions.get(token);
  if (!s || s.exp < Date.now()) { sessions.delete(token); return null; }
  return s;
}
setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) if (s.exp < now) sessions.delete(t);
}, 60000).unref();

/* ---------- محدودسازی نرخ ---------- */
const attempts = new Map(); /* ip → [ts] */
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const arr = (attempts.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  attempts.set(ip, arr);
  return arr.length > max;
}

/* ---------- رمز ---------- */
function verifyPassword(pw, stored) {
  const [salt, want] = String(stored).split(':');
  if (!salt || !want) return false;
  const got = scryptSync(pw, salt, 64);
  try { return timingSafeEqual(got, Buffer.from(want, 'hex')); } catch { return false; }
}

/* ---------- پاسخ‌ها ---------- */
function json(res, code, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}
function html(res, code, body, extraHeaders = {}) {
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...extraHeaders,
  });
  res.end(body);
}
function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/* ---------- بدنه ---------- */
function readBody(req, limit = MEDIA_MAX_BYTES * 1.4) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ---------- دارایی‌های استاتیک ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
function serveStatic(res, baseDir, relPath) {
  const safe = normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  const full = join(baseDir, safe);
  if (!full.startsWith(baseDir)) return false;
  if (!existsSync(full) || !full.startsWith(join(baseDir, ''))) return false;
  const ext = full.slice(full.lastIndexOf('.')).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', ...securityHeaders() });
  res.end(readFileSync(full));
  return true;
}

/* ---------- رندر زنده سایت ---------- */
function siteData() {
  const d = allContent();
  d.__v = 'live';
  return d;
}
function serveSitePage(res, pathName) {
  const d = siteData();
  if (pathName === '/' || pathName === '') return html(res, 200, renderHome(d, { depth: 0 }));
  if (pathName === '/login/') return html(res, 200, renderAuthPage(d, 'login', { depth: 1 }));
  if (pathName === '/register/') return html(res, 200, renderAuthPage(d, 'register', { depth: 1 }));
  if (pathName === '/announcements/') return html(res, 200, renderAnnouncementsIndex(d, { depth: 1 }));
  const ann = (d.announcements || []).find((a) => a.slug === decodeURIComponent(pathName.replace(/^\/announcements\//, '').replace(/\/$/, '')));
  if (ann) return html(res, 200, renderAnnouncement(d, ann, { depth: 1 }));
  const page = (d.pages || []).find((p) => p.published !== false && p.slug === decodeURIComponent(pathName.replace(/^\//, '').replace(/\/$/, '')));
  if (page) return html(res, 200, renderCustomPage(d, page, { depth: 1 }));
  return html(res, 404, render404(d, { depth: 0 }));
}

/* ---------- سرور ---------- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathName = decodeURIComponent(url.pathname);
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
  const origin = req.headers.origin || '';
  const isMutation = req.method !== 'GET' && req.method !== 'HEAD';

  Object.entries(securityHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  try {
    /* ---------- CORS سخت‌گیرانه: فقط همین مبدأ ---------- */
    if (origin && !origin.includes(req.headers.host || '')) {
      return json(res, 403, { error: 'origin mismatch' });
    }

    /* ================= مسیرهای عمومی ================= */
    if (pathName.startsWith('/auth/')) {
      if (!isMutation) return json(res, 405, { error: 'method not allowed' });
      if (req.headers['x-requested-with'] !== 'fetch') return json(res, 403, { error: 'bad request' });
      if (rateLimited('auth:' + ip, 20, 10 * 60 * 1000)) return json(res, 429, { error: 'تلاش‌های زیادی انجام شده؛ کمی بعد دوباره امتحان کنید.' });
      const body = new URLSearchParams((await readBody(req, 64 * 1024)).toString());
      const honeypot = body.get('website');

      if (pathName === '/auth/register') {
        if (honeypot) return json(res, 400, { error: 'درخواست نامعتبر.' });
        const name = (body.get('name') || '').trim().slice(0, 80);
        const user = (body.get('user') || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        const email = (body.get('email') || '').trim().toLowerCase();
        const pass = body.get('pass') || '';
        if (user.length < 3 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: 'نام کاربری (حداقل ۳ حرف انگلیسی) و ایمیل معتبر وارد کنید.' });
        if (pass.length < 8) return json(res, 400, { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
        const list = users();
        if (list.some((u) => u.user === user)) return json(res, 400, { error: 'این نام کاربری قبلاً گرفته شده.' });
        if (list.some((u) => u.email === email)) return json(res, 400, { error: 'این ایمیل قبلاً ثبت شده.' });
        const salt = randomBytes(16).toString('hex');
        const id = Date.now().toString(36) + randomBytes(4).toString('hex');
        list.push({ id, user, email, name, hash: `${salt}:${scryptSync(pass, salt, 64).toString('hex')}`, created: Date.now() });
        saveUsers(list);
        log('user-register', `${user} (${email})`, 'عمومی');
        return json(res, 200, { ok: true, redirect: './' });
      }

      if (pathName === '/auth/login') {
        const user = (body.get('user') || '').trim().toLowerCase();
        const pass = body.get('pass') || '';
        const u = users().find((x) => x.user === user || x.email === user);
        if (!u || !verifyPassword(pass, u.hash)) return json(res, 400, { error: 'نام کاربری یا رمز عبور اشتباه است.' });
        return json(res, 200, { ok: true, redirect: './' });
      }
      return json(res, 404, { error: 'not found' });
    }

    /* ================= فایل‌های استاتیک از dist ================= */
    if (pathName.startsWith('/assets/') || pathName.startsWith('/media/') || pathName.startsWith('/content/') || pathName === '/favicon.svg' || pathName === '/robots.txt' || pathName === '/sitemap.xml') {
      const distFile = pathName === '/favicon.svg' ? 'assets/img/favicon.svg' : pathName.replace(/^\//, '');
      if (pathName.startsWith('/content/') && serveStatic(res, CONTENT_DIR, distFile)) return;
      if (serveStatic(res, DIST_DIR, distFile)) return;
      if (pathName.startsWith('/media/') && serveStatic(res, SITE_DIR, distFile)) return; /* رسانه‌ی تازه آپلودشده */
      return html(res, 404, render404(siteData(), { depth: 0 }));
    }

    /* ================= پنل مدیریت (فایل SPA) ================= */
    if (pathName === '/admin' || pathName === '/admin/') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (serveStatic(res, DIST_DIR, 'admin/index.html')) return;
      return html(res, 500, '<p>dist ساخته نشده — دستور npm run build را اجرا کنید.</p>');
    }

    /* ================= API پنل (نیازمند نشست مدیر؛ به‌جز login) ================= */
    if (pathName.startsWith('/api/')) {
      const cookie = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => {
        const i = c.indexOf('=');
        return [c.slice(0, i).trim(), c.slice(i + 1).trim()];
      }));
      const sess = readSession(cookie['soreh_admin']);

      /* ورود مدیر */
      if (pathName === '/api/login' && isMutation) {
        if (req.headers['x-requested-with'] !== 'fetch') return json(res, 403, { error: 'bad request' });
        if (rateLimited('login:' + ip, 10, 5 * 60 * 1000)) return json(res, 429, { error: 'تلاش‌های زیادی انجام شده؛ ۵ دقیقه صبر کنید.' });
        const { user, pass } = JSON.parse((await readBody(req, 16 * 1024)).toString() || '{}');
        const ok = user === CONF.ADMIN_USERNAME && verifyPassword(String(pass || ''), CONF.ADMIN_PASSWORD_HASH);
        if (!ok) { log('login-fail', `from ${ip}`, user || '?'); return json(res, 401, { error: 'نام کاربری یا رمز عبور اشتباه است.' }); }
        const token = makeSession(CONF.ADMIN_USERNAME);
        log('login', 'ورود موفق پنل', CONF.ADMIN_USERNAME);
        return json(res, 200, { ok: true, user: CONF.ADMIN_USERNAME }, {
          'Set-Cookie': `soreh_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`,
        });
      }

      if (pathName === '/api/session' && !isMutation) {
        if (sess) return json(res, 200, { authenticated: true, user: sess.user, github: githubReady });
        return json(res, 401, { authenticated: false });
      }

      if (!sess) return json(res, 401, { error: 'ابتدا وارد شوید.' });

      if (pathName === '/api/logout' && isMutation) {
        const token = (cookie['soreh_admin'] || '').split('.')[0];
        sessions.delete(token);
        return json(res, 200, { ok: true });
      }

      /* محتوا */
      if (pathName === '/api/content' && !isMutation) return json(res, 200, allContent());

      let m = pathName.match(/^\/api\/content\/([\w-]+)$/);
      if (m && isMutation) {
        const name = m[1];
        if (!CONTENT_FILES.includes(name)) return json(res, 404, { error: 'فایل ناشناخته' });
        if (req.headers['x-requested-with'] !== 'fetch') return json(res, 403, { error: 'bad request' });
        const { data } = JSON.parse((await readBody(req)).toString() || '{}');
        const check = validateContent(name === 'media' ? 'media.json' : name + '.json', data);
        if (!check.ok) return json(res, 400, { error: 'اعتبارسنجی ناموفق', validation: check.errors });
        writeContent(name, data);
        const commit = await ghPutFile(`content/${name}.json`, Buffer.from(JSON.stringify(data, null, 2) + '\n'), `پنل: بروزرسانی ${name}.json`).catch((e) => { throw e; });
        log('content-publish', `${name}.json${commit.commit ? ' → commit ' + commit.commit : ''}`, sess.user);
        return json(res, 200, { ok: true, commit: commit.commit || null, skipped: !!commit.skipped });
      }

      /* پیش‌نمایش سمت سرور */
      if (pathName === '/api/preview' && isMutation) {
        const { data } = JSON.parse((await readBody(req, 1024 * 1024)).toString() || '{}');
        const d = data && data.settings ? data : allContent();
        d.__v = 'preview';
        return json(res, 200, { ok: true, html: renderHome(d, { depth: 0 }) });
      }

      /* رسانه */
      if (pathName === '/api/media' && isMutation) {
        if (req.headers['x-requested-with'] !== 'fetch') return json(res, 403, { error: 'bad request' });
        const { name, data } = JSON.parse((await readBody(req)).toString() || '{}');
        if (!validateMediaName(name)) return json(res, 400, { error: 'نام فایل مجاز نیست.' });
        const buf = Buffer.from(data, 'base64');
        if (buf.length > MEDIA_MAX_BYTES) return json(res, 400, { error: 'حجم فایل بیش از ۲ مگابایت است.' });
        const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
        const repoPath = `site/media/${name}`;
        writeFileSync(join(SITE_DIR, 'media', name), buf);
        const commit = await ghPutFile(repoPath, buf, `پنل: بارگذاری رسانه ${name}`).catch((e) => { throw e; });
        const media = readContent('media');
        media.items = (media.items || []).filter((it) => it.file !== name);
        media.items.push({ file: name, type: MEDIA_TYPES[ext] || 'application/octet-stream', size: buf.length, date: new Date().toISOString().slice(0, 10) });
        writeContent('media', media);
        await ghPutFile('content/media.json', Buffer.from(JSON.stringify(media, null, 2) + '\n'), `پنل: بروزرسانی فهرست رسانه (${name})`).catch(() => {});
        mkdirSync(DIST_DIR + '/media', { recursive: true });
        writeFileSync(join(DIST_DIR, 'media', name), buf);
        log('media-upload', name, sess.user);
        return json(res, 200, { ok: true, commit: commit.commit || null });
      }

      m = pathName.match(/^\/api\/media\/([\w.-]+)$/);
      if (m && isMutation) {
        const name = m[1];
        if (!validateMediaName(name)) return json(res, 400, { error: 'نام فایل مجاز نیست.' });
        try { unlinkSync(join(SITE_DIR, 'media', name)); } catch {}
        try { unlinkSync(join(DIST_DIR, 'media', name)); } catch {}
        await ghDeleteFile(`site/media/${name}`, `پنل: حذف رسانه ${name}`).catch(() => {});
        const media = readContent('media');
        media.items = (media.items || []).filter((it) => it.file !== name);
        writeContent('media', media);
        await ghPutFile('content/media.json', Buffer.from(JSON.stringify(media, null, 2) + '\n'), `پنل: بروزرسانی فهرست رسانه (حذف ${name})`).catch(() => {});
        log('media-delete', name, sess.user);
        return json(res, 200, { ok: true });
      }

      /* کاربران */
      if (pathName === '/api/users' && !isMutation) {
        return json(res, 200, { users: users().map(({ hash, ...u }) => u) });
      }
      m = pathName.match(/^\/api\/users\/([\w-]+)$/);
      if (m && isMutation) {
        const list = users();
        const idx = list.findIndex((u) => u.id === m[1]);
        if (idx === -1) return json(res, 404, { error: 'کاربر یافت نشد.' });
        const removed = list.splice(idx, 1)[0];
        saveUsers(list);
        log('user-delete', removed.user, sess.user);
        return json(res, 200, { ok: true });
      }

      /* گزارش فعالیت */
      if (pathName === '/api/logs' && !isMutation) return json(res, 200, { logs: logs() });

      /* وضعیت */
      if (pathName === '/api/status' && !isMutation) {
        return json(res, 200, {
          github: { configured: githubReady, repo: CONF.GITHUB_REPO, branch: CONF.GITHUB_BRANCH },
          contentDir: 'content/',
          mediaDir: 'site/media/',
        });
      }

      return json(res, 404, { error: 'not found' });
    }

    /* ================= صفحات سایت (رندر زنده از محتوای فعلی) ================= */
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (pathName === '/' || /^\/(login|register|announcements)(\/)?$/.test(pathName) || pathName.startsWith('/announcements/') || /^\/[^/]+\/$/.test(pathName)) {
        return serveSitePage(res, pathName.endsWith('/') || pathName === '/' ? pathName : pathName + '/');
      }
      return serveSitePage(res, pathName); /* شامل 404 رندرشده */
    }

    return json(res, 405, { error: 'method not allowed' });
  } catch (err) {
    console.error('[error]', req.method, pathName, err.message);
    return json(res, err.message === 'payload too large' ? 413 : 500, { error: err.message || 'خطای داخلی سرور' });
  }
});

server.listen(CONF.PORT, () => {
  console.log('──────────────────────────────────────────────');
  console.log('  سرویس مدیریت دبیرستان سوره اجرا شد');
  console.log(`  پنل:        http://localhost:${CONF.PORT}/admin/`);
  console.log(`  سایت:       http://localhost:${CONF.PORT}/`);
  console.log(`  GitHub:     ${githubReady ? 'متصل → ' + CONF.GITHUB_REPO : 'غیرفعال (GITHUB_TOKEN تنظیم نشده)'}`);
  console.log('──────────────────────────────────────────────');
});
