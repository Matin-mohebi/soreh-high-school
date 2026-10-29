(function () {
  'use strict';
  var cfg = window.ClassStarsToolkit || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* یکسان‌سازی حروف عربی/فارسی، ارقام و نیم‌فاصله برای جست‌وجوی دقیق‌تر */
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

  /* متن قابل جست‌وجوی کارت؛ لینک‌های «ویرایش» مدیر سایت حساب نمی‌شوند */
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
    input.placeholder = cfg.searchPlaceholder || 'جست‌وجو…';
    input.setAttribute('aria-label', label);
    input.setAttribute('autocomplete', 'off');
    var icon = document.createElement('span');
    icon.className = 'cst-search__icon'; icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.5 4.5"></path></svg>';
    var count = document.createElement('span');
    count.className = 'cst-search__count'; count.setAttribute('aria-live', 'polite');
    var empty = document.createElement('p'); empty.className = 'cst-search__empty';
    empty.textContent = cfg.emptyResult || 'موردی پیدا نشد.'; empty.hidden = true;
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
      count.textContent = query ? (visible.toLocaleString('fa-IR') + ' ' + (cfg.resultLabel || 'نتیجه')) : '';
      empty.hidden = !query || visible > 0;
      grid.classList.toggle('cst-grid--filtered', !!query);
    }
    input.addEventListener('input', update);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && input.value) { input.value = ''; update(); }
    });
    update();
  }

  function initProgressAndTop() {
    var bar = document.querySelector('.cst-progress span');
    var top = document.querySelector('.cst-top');
    if (!bar && !top) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var percent = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
      if (bar) bar.style.width = percent + '%';
      if (top) {
        var show = window.scrollY > 480;
        if (show && top.hidden) {
          top.hidden = false;
          window.requestAnimationFrame(function () { top.classList.add('is-visible'); });
        } else if (!show && !top.hidden) {
          top.classList.remove('is-visible');
          top.hidden = true;
        }
      }
      ticking = false;
    }
    function onScroll() { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    update();
  }

  function init() {
    makeSearch('staff', '.grid--staff', cfg.staffLabel || 'جست‌وجوی مدیران', 'cst-staff-search');
    makeSearch('students', '.grid--students', cfg.studentsLabel || 'جست‌وجوی دانش‌آموزان', 'cst-student-search');
    initProgressAndTop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
