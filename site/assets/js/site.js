/* =====================================================================
   دبیرستان سوره — لایه محتوای استاتیک (مهاجرت از وردپرس)
   وظایف این فایل:
     ۱) خواندن assets/content.json و رندر محتوای پویا (بدون سرور)
     ۲) پورت کامل رفتارهای assets/app.js قالب (دروازه، ظاهرشدن، شمارنده)
     ۳) پورت کامل رفتارهای افزونه Class Stars Toolkit (جست‌وجو، نوار پیشرفت، بازگشت به بالا)
   فایل‌های اصلی قالب بدون تغییر در همین پوشه حفظ شده‌اند (app.js و toolkit.js).
   ===================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ابزارها ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function faNum(v) {
    return String(v).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function faDate(iso) {
    try {
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
    } catch (e) { return ''; }
  }
  /* نرمال‌سازی متن فارسی برای جست‌وجو (پورت از toolkit.js) */
  function norm(text) {
    return String(text || '')
      .replace(/[\u064A\u0649]/g, '\u06CC')
      .replace(/\u0643/g, '\u06A9')
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[\u200C\u200D\u064B-\u0652\u0640]/g, '')
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase()
      .trim();
  }

  /* ---------- خواندن محتوا ---------- */
  var C = null;
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, C);
  }

  /* ---------- اعمال مقادیر متنی روی عناصر data-cs ---------- */
  function applyTexts() {
    $$('[data-cs]').forEach(function (el) {
      var v = get(el.getAttribute('data-cs'));
      if (v === undefined || v === null) return;
      if (el.hasAttribute('data-cs-attr')) el.setAttribute(el.getAttribute('data-cs-attr'), v);
      else if (el.hasAttribute('data-cs-count')) {
        var digits = String(v).replace(/\D/g, '');
        el.setAttribute('data-count', digits);
        el.textContent = v;
      } else el.textContent = v;
    });
    /* فاوآیکون و عنوان */
    var fav = get('site.favicon');
    if (fav) {
      var link = $('link[rel="icon"]') || $('link[rel="shortcut icon"]');
      if (link) link.setAttribute('href', fav);
    }
    var seo = get('seo') || {};
    var pageTitle = document.body.getAttribute('data-title') || '';
    var siteName = get('site.name') || '';
    document.title = pageTitle ? (pageTitle + ' | ' + siteName) : (seo.title || siteName);
    function meta(name, val) {
      var m = $('meta[name="' + name + '"]') || $('meta[property="' + name + '"]');
      if (m && val) m.setAttribute('content', val);
    }
    meta('description', seo.description);
    meta('keywords', seo.keywords);
    meta('og:title', document.title);
    meta('og:description', seo.description);
    var og = $('meta[property="og:image"]');
    if (og && seo.ogImage) og.setAttribute('content', seo.ogImage);
  }

  /* ---------- منوی اصلی ---------- */
  function renderMenu() {
    var nav = $('[data-menu]');
    if (!nav) return;
    var items = (get('menu') || []).filter(function (m) { return m && m.label && m.href; });
    var here = location.pathname.split('/').pop() || 'index.html';
    nav.innerHTML = items.map(function (m) {
      var target = String(m.href);
      var page = target.split('#')[0].replace(/^\.\//, '');
      var active = page === here ? ' aria-current="page"' : '';
      var external = /^https?:/i.test(target) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + esc(target) + '"' + active + external + '>' + esc(m.label) + '</a>';
    }).join('');
  }

  /* ---------- برند هدر ---------- */
  function renderBrand() {
    var logo = get('site.logo');
    var name = get('site.name') || '';
    $$('.mark').forEach(function (a) {
      if (logo) {
        if (!$('.mark img', a)) a.insertAdjacentHTML('afterbegin', '<img alt="">');
        $('.mark img', a).src = logo;
        $('.mark img', a).alt = name;
      }
    });
    renderAuth();
  }

  /* ---------- وضعیت ورود (نیازمند سرویس حساب کاربری) ---------- */
  function renderAuth() {
    var acts = $('[data-acts]');
    if (!acts) return;
    var backend = (get('site.backendUrl') || '').replace(/\/$/, '');
    if (!backend) {
      acts.innerHTML =
        '<a href="./login.html">ورود</a>' +
        '<a class="btn btn--sm" href="./register.html">ثبت‌نام</a>';
      return;
    }
    fetch(backend + '/api/auth/me', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.user && d.user.name) {
          acts.innerHTML =
            '<span class="userchip">' + esc(d.user.name) + '</span>' +
            '<a href="#" data-logout>خروج</a>';
          var lo = $('[data-logout]', acts);
          if (lo) lo.addEventListener('click', function (e) {
            e.preventDefault();
            fetch(backend + '/api/auth/logout', { method: 'POST', credentials: 'include' })
              .then(function () { location.href = './index.html'; });
          });
        } else {
          acts.innerHTML =
            '<a href="./login.html">ورود</a>' +
            '<a class="btn btn--sm" href="./register.html">ثبت‌نام</a>';
        }
      })
      .catch(function () {
        acts.innerHTML =
          '<a href="./login.html">ورود</a>' +
          '<a class="btn btn--sm" href="./register.html">ثبت‌نام</a>';
      });
  }

  /* ---------- کارت‌های مدیر و معاونان / دانش‌آموزان برتر ---------- */
  function renderStaffStudents() {
    var staffGrid = $('.grid--staff');
    if (staffGrid) {
      var staff = (get('staff.items') || []);
      var html = staff.map(function (p) {
        return '<article class="person" data-reveal>' +
          '<div class="ph ph--portrait">' + (p.photo ? '<img loading="lazy" src="' + esc(p.photo) + '" alt="' + esc(p.name) + '">' : '') + '</div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p class="role">' + esc(p.role) + '</p>' +
          '<p>' + esc(String(p.bio || '').split(/\s+/).slice(0, 28).join(' ')) + '</p>' +
          '</article>';
      }).join('');
      for (var i = staff.length; i < 4; i++) {
        html += '<article class="person person--empty" data-reveal>' +
          '<div class="ph ph--portrait"></div>' +
          '<h3>نام مدیر یا معاون</h3>' +
          '<p class="role">سمت</p>' +
          '<p>توضیح کوتاه درباره این فرد اینجا نمایش داده می‌شود.</p>' +
          '</article>';
      }
      staffGrid.innerHTML = html;
    }

    var kidGrid = $('.grid--students');
    if (kidGrid) {
      var kids = (get('students.items') || []);
      var html2 = kids.map(function (p) {
        return '<article class="kid" data-reveal>' +
          '<div class="ph ph--square">' + (p.photo ? '<img loading="lazy" src="' + esc(p.photo) + '" alt="' + esc(p.name) + '">' : '') + '</div>' +
          (p.rank ? '<b class="rank">' + esc(p.rank) + '</b>' : '') +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p class="role">' + esc(p.grade) + '</p>' +
          '<p>' + esc(p.note) + '</p>' +
          '</article>';
      }).join('');
      for (var j = kids.length; j < 8; j++) {
        html2 += '<article class="kid kid--empty" data-reveal>' +
          '<div class="ph ph--square"></div>' +
          '<b class="rank">؟</b>' +
          '<h3>نام دانش‌آموز</h3>' +
          '<p class="role">پایه</p>' +
          '</article>';
      }
      kidGrid.innerHTML = html2;
    }
  }

  /* ---------- اخبار ---------- */
  function renderNews() {
    var wrap = $('[data-news]');
    if (!wrap) return;
    var items = (get('news.items') || []);
    if (!items.length) {
      wrap.innerHTML = '<p class="empty-note">هنوز خبر یا اطلاعیه‌ای ثبت نشده است.</p>';
      return;
    }
    wrap.innerHTML = items.map(function (n, i) {
      return '<article class="news-item" data-reveal>' +
        (n.important ? '<span class="badge">مهم</span> ' : '') +
        '<h3>' + esc(n.title) + '</h3>' +
        (n.date ? '<time>' + esc(faDate(n.date)) + '</time>' : '') +
        (n.excerpt ? '<p>' + esc(n.excerpt) + '</p>' : '') +
        (n.body ? '<details' + (i === 0 ? ' open' : '') + '><summary>ادامه مطلب</summary><div class="prose">' + n.body + '</div></details>' : '') +
        '</article>';
    }).join('');
  }

  /* ---------- برگه‌های ایستا (?slug=) ---------- */
  function renderPage() {
    var wrap = $('[data-page]');
    if (!wrap) return;
    var slug = new URLSearchParams(location.search).get('slug') || '';
    var pages = get('pages') || [];
    var p = pages.filter(function (x) { return x.slug === slug; })[0] ||
      pages.filter(function (x) { return x.showInNav; })[0];
    if (!p) {
      wrap.innerHTML = '<p class="empty-note">برگه‌ای برای نمایش پیدا نشد. از فهرست منوی بالا یکی را انتخاب کنید.</p>';
      return;
    }
    document.body.setAttribute('data-title', p.title);
    var h1 = document.querySelector('.page__in h1');
    if (h1) h1.textContent = p.title;
    wrap.innerHTML = p.body || '<p>این برگه خالی است.</p>';
    /* فهرست برگه‌ها */
    var list = $('[data-page-list]');
    if (list) {
      var nav = pages.filter(function (x) { return x.showInNav; });
      list.innerHTML = nav.length
        ? nav.map(function (x) { return '<a class="link" href="./page.html?slug=' + encodeURIComponent(x.slug) + '">' + esc(x.title) + '</a>'; }).join(' ')
        : '';
    }
  }

  /* ---------- برنامه هفتگی ---------- */
  function renderSchedule() {
    var wrap = $('[data-schedule]');
    if (!wrap) return;
    var s = get('schedule') || {};
    if (s.enabled === false) {
      wrap.innerHTML = '<p class="empty-note">نمایش برنامه هفتگی در حال حاضر غیرفعال است.</p>';
      return;
    }
    var days = s.days || [];
    var hasRows = days.some(function (d) { return (d.rows || []).length; });
    if (!hasRows) {
      wrap.innerHTML = '<p class="empty-note">برنامه هفتگی هنوز توسط مدرسه ثبت نشده است.</p>';
      return;
    }
    var html = '<div class="sched"><table><thead><tr>' +
      '<th>روز</th><th>ساعت</th><th>درس</th><th>دبیر</th>' +
      '</tr></thead><tbody>';
    days.forEach(function (d) {
      (d.rows || []).forEach(function (r, i) {
        html += '<tr>' +
          (i === 0 ? '<td class="day-h" rowspan="' + d.rows.length + '">' + esc(d.day) + '</td>' : '') +
          '<td class="t">' + esc(r.time) + '</td>' +
          '<td>' + esc(r.subject) + '</td>' +
          '<td>' + esc(r.teacher) + '</td>' +
          '</tr>';
      });
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
  }

  /* ---------- پایین صفحه: آدرس و تلفن فقط در صورت وجود ---------- */
  function renderFooter() {
    var address = get('footer.address');
    var phone = get('footer.phone');
    var a = $('[data-foot-address]');
    var p = $('[data-foot-phone]');
    if (a && address) { a.textContent = address; a.hidden = false; }
    if (p && phone) { p.textContent = phone; p.hidden = false; }
  }

  /* ---------- بخش عضویت (طبق تنظیم) ---------- */
  function applyJoin() {
    var j = $('.join');
    if (j && get('join.enabled') === false) j.remove();
  }

  /* ---------- دروازه ورود (پورت app.js) ---------- */
  function initGate() {
    var root = document.documentElement;
    var gate = $('#gate');
    function closeGate(target) {
      if (!gate) return;
      try { sessionStorage.setItem('cs_gate', '1'); } catch (e) {}
      gate.classList.add('is-closed');
      document.body.style.overflow = '';
      setTimeout(function () { root.classList.add('seen'); }, reduce ? 0 : 900);
      if (target) {
        var el = document.getElementById(target);
        if (el) setTimeout(function () { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 250);
      }
    }
    if (gate && !root.classList.contains('seen')) {
      document.body.style.overflow = 'hidden';
      $$('[data-go]', gate).forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); closeGate(a.getAttribute('data-go')); });
      });
      var skip = $('[data-skip]', gate);
      if (skip) skip.addEventListener('click', function () { closeGate(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGate(); });
    } else if (gate) {
      gate.remove();
    }
  }

  /* ---------- ظاهر شدن با اسکرول (پورت app.js) ---------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduce) {
      items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        });
      }, { threshold: 0.12 });
      items.forEach(function (el, i) {
        el.style.setProperty('--d', ((i % 4) * 90) + 'ms');
        io.observe(el);
      });
    }
  }

  /* ---------- شمارنده آمار (پورت app.js) ---------- */
  function initCounters() {
    $$('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      if (!end || reduce || !('IntersectionObserver' in window)) return;
      var fmt = new Intl.NumberFormat('fa-IR', { useGrouping: false });
      var seen = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        seen.disconnect();
        var t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var p = Math.min((t - t0) / dur, 1);
          el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.6 });
      seen.observe(el);
    });
  }

  /* ---------- ابزارهای افزونه: جست‌وجوی زنده (پورت toolkit.js) ---------- */
  function initSearch() {
    var cfg = window.ClassStarsToolkit = {
      topLabel: 'بازگشت به بالای صفحه',
      staffLabel: get('staff.title') || 'جست‌وجوی مدیران',
      studentsLabel: get('students.title') || 'جست‌وجوی دانش‌آموزان',
      searchPlaceholder: 'نام، سمت، پایه یا توضیحات…',
      emptyResult: 'موردی با این عبارت پیدا نشد.',
      resultLabel: 'نتیجه'
    };
    if (get('toolkit.search') === false) return;

    function cardText(card) {
      var parts = [];
      card.querySelectorAll('h3, p, .rank').forEach(function (el) { parts.push(el.textContent); });
      return norm(parts.join(' '));
    }
    function makeSearch(sectionId, gridSelector, label, id) {
      var section = document.getElementById(sectionId);
      var grid = section && section.querySelector(gridSelector);
      if (!section || !grid || section.querySelector('.cst-search')) return;
      var wrap = document.createElement('div');
      wrap.className = 'cst-search';
      var input = document.createElement('input');
      input.type = 'search'; input.id = id; input.className = 'cst-search__input';
      input.placeholder = cfg.searchPlaceholder;
      input.setAttribute('aria-label', label);
      input.setAttribute('autocomplete', 'off');
      var icon = document.createElement('span');
      icon.className = 'cst-search__icon'; icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.5 4.5"></path></svg>';
      var count = document.createElement('span');
      count.className = 'cst-search__count'; count.setAttribute('aria-live', 'polite');
      var empty = document.createElement('p'); empty.className = 'cst-search__empty';
      empty.textContent = cfg.emptyResult; empty.hidden = true;
      wrap.appendChild(icon); wrap.appendChild(input); wrap.appendChild(count);
      grid.parentNode.insertBefore(wrap, grid);
      grid.parentNode.insertBefore(empty, grid.nextSibling);
      var cards = Array.prototype.slice.call(grid.children).filter(function (el) {
        return el.matches('.person, .kid');
      });
      var texts = cards.map(cardText);
      function update() {
        var query = norm(input.value);
        var visible = 0;
        cards.forEach(function (card, i) {
          var isEmpty = card.classList.contains('person--empty') || card.classList.contains('kid--empty');
          var match = !query || (!isEmpty && texts[i].indexOf(query) !== -1);
          card.hidden = !match;
          if (match && !isEmpty) visible++;
        });
        count.textContent = query ? (faNum(visible) + ' ' + cfg.resultLabel) : '';
        empty.hidden = !query || visible > 0;
        grid.classList.toggle('cst-grid--filtered', !!query);
      }
      input.addEventListener('input', update);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && input.value) { input.value = ''; update(); }
      });
      update();
    }
    makeSearch('staff', '.grid--staff', cfg.staffLabel, 'cst-staff-search');
    makeSearch('students', '.grid--students', cfg.studentsLabel, 'cst-student-search');
  }

  /* ---------- نوار پیشرفت + بازگشت به بالا (پورت toolkit.js) ---------- */
  function initProgressAndTop() {
    if (get('toolkit.progress') === false && get('toolkit.backToTop') === false) return;
    if (get('toolkit.progress') !== false) {
      var bar = document.createElement('div');
      bar.className = 'cst-progress'; bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span></span>';
      document.body.appendChild(bar);
    }
    var topBtn = null;
    if (get('toolkit.backToTop') !== false) {
      topBtn = document.createElement('button');
      topBtn.className = 'cst-top'; topBtn.type = 'button';
      topBtn.setAttribute('aria-label', 'بازگشت به بالای صفحه');
      topBtn.title = 'بازگشت به بالای صفحه'; topBtn.hidden = true;
      topBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-7 7 7M12 7v12"/></svg>';
      document.body.appendChild(topBtn);
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
    var barSpan = bar ? bar.querySelector('span') : null;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var percent = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      if (barSpan) barSpan.style.width = percent + '%';
      if (topBtn) {
        var show = window.scrollY > 480;
        if (show && topBtn.hidden) {
          topBtn.hidden = false;
          window.requestAnimationFrame(function () { topBtn.classList.add('is-visible'); });
        } else if (!show && !topBtn.hidden) {
          topBtn.classList.remove('is-visible');
          topBtn.hidden = true;
        }
      }
      ticking = false;
    }
    function onScroll() { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------- فرم‌های ورود / ثبت‌نام / تماس ---------- */
  function initForms() {
    var backend = (get('site.backendUrl') || '').replace(/\/$/, '');
    $$('[data-auth-form]').forEach(function (form) {
      var kind = form.getAttribute('data-auth-form');
      var msg = $('.msg', form.parentNode) || form.parentNode.insertBefore(Object.assign(document.createElement('p'), { className: 'msg', role: 'alert', hidden: true }), form);
      function show(text) { msg.hidden = false; msg.textContent = text; }
      if (!backend) {
        form.hidden = true;
        show('سرویس حساب کاربری روی این نسخه استاتیک فعال نیست. برای فعال‌سازی، آدرس سرویس مدیریت (backend) را در تنظیمات داشبورد وارد کنید.');
        return;
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var fd = new FormData(form);
        var payload = {};
        fd.forEach(function (v, k) { payload[k] = v; });
        var url = backend + (kind === 'register' ? '/api/auth/register' : '/api/auth/login');
        fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (res.ok) {
              show(kind === 'register' ? 'ثبت‌نام انجام شد؛ در حال انتقال…' : 'ورود موفق؛ در حال انتقال…');
              var next = new URLSearchParams(location.search).get('next');
              setTimeout(function () { location.href = next || './index.html'; }, 700);
            } else {
              show((res.d && res.d.error) || 'عملیات انجام نشد؛ دوباره تلاش کنید.');
            }
          })
          .catch(function () { show('ارتباط با سرویس مدرسه برقرار نشد.'); });
      });
    });

    $$('[data-contact-form]').forEach(function (form) {
      var msg = $('.msg', form.parentNode) || form.parentNode.insertBefore(Object.assign(document.createElement('p'), { className: 'msg', role: 'alert', hidden: true }), form);
      function show(text) { msg.hidden = false; msg.textContent = text; }
      if (!backend) {
        form.hidden = true;
        show('برای دریافت پیام‌ها، سرویس مدیریت مدرسه باید فعال باشد. اطلاعات تماس مدرسه در پایین صفحه موجود است.');
        return;
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var fd = new FormData(form);
        var payload = {};
        fd.forEach(function (v, k) { payload[k] = v; });
        fetch(backend + '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (res.ok) { show('پیام شما ثبت شد. سپاس از همراهی شما.'); form.reset(); }
            else show((res.d && res.d.error) || 'ارسال پیام انجام نشد.');
          })
          .catch(function () { show('ارتباط با سرویس مدرسه برقرار نشد.'); });
      });
    });
  }

  /* ---------- شروع ---------- */
  fetch('assets/content.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      C = data;
      applyTexts();
      renderMenu();
      renderBrand();
      renderStaffStudents();
      renderNews();
      renderPage();
      renderSchedule();
      renderFooter();
      applyJoin();
      initForms();
      initGate();
      initSearch();
      initReveal();
      initCounters();
      initProgressAndTop();
      document.dispatchEvent(new CustomEvent('cs:ready'));
    })
    .catch(function (err) {
      console.error('Soreh content load failed', err);
      initGate();
      initReveal();
      initCounters();
      initProgressAndTop();
    });
})();
