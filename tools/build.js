/* =====================================================================
   ساخت سایت استاتیک دبیرستان سوره
   ورودی: content/*.json + site/  →  خروجی: dist/
   بدون وابستگی خارجی (فقط Node stdlib)
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderHome, renderAuthPage, renderAnnouncement, renderAnnouncementsIndex, renderCustomPage, render404, renderSitemap } from '../site/assets/js/render.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const SITE = join(ROOT, 'site');
const DIST = join(ROOT, 'dist');

function readJson(p, fb) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fb; }
}

function walk(dir, cb) {
  for (const name of readdirSync(dir)) {
    if (name === '.gitkeep') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  }
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  walk(src, (p) => {
    const rel = p.slice(src.length + 1);
    const out = join(dest, rel);
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(p, out);
  });
}

/* نسخه‌ی دارایی‌ها برای cache-busting: هش کوتاه از محتوای css/js */
function assetVersion() {
  const h = createHash('sha1');
  try {
    walk(join(SITE, 'assets'), (p) => {
      if (/\.(css|js|woff2)$/.test(p)) h.update(readFileSync(p));
    });
  } catch {}
  return h.digest('hex').slice(0, 8);
}

/* ---------- ۱. خواندن محتوا ---------- */
const data = {
  settings: readJson(join(CONTENT, 'settings.json'), {}),
  staff: readJson(join(CONTENT, 'staff.json'), []),
  students: readJson(join(CONTENT, 'students.json'), []),
  announcements: readJson(join(CONTENT, 'announcements.json'), []),
  pages: readJson(join(CONTENT, 'pages.json'), []),
  media: readJson(join(CONTENT, 'media.json'), { items: [] }),
};
data.settings = data.settings || {};
data.settings.__v = undefined;
const __v = assetVersion();
data.__v = __v;

/* ---------- ۲. پاک‌سازی و ساخت dist ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const write = (rel, html) => {
  const p = join(DIST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
  console.log('  ✓', rel);
};

console.log('ساخت سایت دبیرستان سوره…');

/* صفحات اصلی */
write('index.html', renderHome(data, { depth: 0 }));
write('login/index.html', renderAuthPage(data, 'login', { depth: 1 }));
write('register/index.html', renderAuthPage(data, 'register', { depth: 1 }));
write('announcements/index.html', renderAnnouncementsIndex(data, { depth: 1 }));
for (const a of data.announcements || []) {
  const slug = String(a.slug || '').trim();
  if (!slug) continue;
  write(`announcements/${encodeURIComponent(slug)}/index.html`, renderAnnouncement(data, a, { depth: 1 }));
}
for (const p of data.pages || []) {
  if (p.published === false) continue;
  const slug = String(p.slug || '').trim();
  if (!slug) continue;
  write(`${encodeURIComponent(slug)}/index.html`, renderCustomPage(data, p, { depth: 1 }));
}
write('404.html', render404(data, { depth: 0 }));

/* sitemap + robots */
const siteUrl = (data.settings?.site?.siteUrl || '').replace(/\/?$/, '/');
if (data.settings?.seo?.sitemap !== false && siteUrl) {
  write('sitemap.xml', renderSitemap(data));
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);
} else {
  write('robots.txt', 'User-agent: *\nAllow: /\n');
}

/* ---------- ۳. کپی دارایی‌های ثابت ---------- */
copyDir(SITE, DIST);
copyDir(CONTENT, join(DIST, 'content'));

console.log(`\nانجام شد. خروجی: dist/  (نسخه دارایی‌ها: ${__v})`);
