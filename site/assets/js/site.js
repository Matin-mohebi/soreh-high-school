/* =====================================================================
   دبیرستان سوره — جاوااسکریپت عمومی سایت
   پورت کامل assets/app.js قالب Class Stars + امکانات افزونه Toolkit
   + اتصال فرم‌های ورود/ثبت‌نام به سرویس backend در صورت اجرا
   ===================================================================== */
(function () {
        'use strict';
        var root = document.documentElement;
        var depth = parseInt(document.body.getAttribute('data-depth') || '0', 10);
        var up = depth ? '../'.repeat(depth) : './';
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* --- دروازه ورود: فقط یک بار در هر نشست (پورت app.js) --- */
        var gate = document.getElementById('gate');
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
                gate.querySelectorAll('[data-go]').forEach(function (a) {
                        a.addEventListener('click', function (e) { e.preventDefault(); closeGate(a.getAttribute('data-go')); });
                });
                var skip = gate.querySelector('[data-skip]');
                if (skip) skip.addEventListener('click', function () { closeGate(); });
                document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGate(); });
        } else if (gate) {
                gate.classList.add('is-closed');
        }

        /* --- ظاهر شدن آرام عناصر هنگام اسکرول (پورت app.js) --- */
        var items = document.querySelectorAll('[data-reveal]');
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

        /* --- شمارنده آمار (پورت app.js) --- */
        document.querySelectorAll('[data-count]').forEach(function (el) {
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

        /* --- Toolkit: یکسان‌سازی حروف فارسی/عربی برای جست‌وجوی دقیق --- */
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

        /* --- Toolkit: جست‌وجوی زنده در کارت‌ها (پورت toolkit.js) --- */
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
                input.placeholder = 'نام، سمت، پایه یا توضیحات…';
                input.setAttribute('aria-label', label);
                input.setAttribute('autocomplete', 'off');
                var icon = document.createElement('span');
                icon.className = 'cst-search__icon'; icon.setAttribute('aria-hidden', 'true');
                icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.5 4.5"></path></svg>';
                var count = document.createElement('span');
                count.className = 'cst-search__count'; count.setAttribute('aria-live', 'polite');
                var empty = document.createElement('p'); empty.className = 'cst-search__empty';
                empty.textContent = 'موردی با این عبارت پیدا نشد.'; empty.hidden = true;
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
                        count.textContent = query ? (visible.toLocaleString('fa-IR') + ' نتیجه') : '';
                        empty.hidden = !query || visible > 0;
                        grid.classList.toggle('cst-grid--filtered', !!query);
                }
                input.addEventListener('input', update);
                input.addEventListener('keydown', function (event) {
                        if (event.key === 'Escape' && input.value) { input.value = ''; update(); }
                });
                update();
        }

        /* --- Toolkit: نوار پیشرفت مطالعه + بازگشت به بالا --- */
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

        /* --- فرم‌های ورود/ثبت‌نام: اتصال به backend در صورت موجود بودن --- */
        function initAuth() {
                var form = document.querySelector('[data-auth]');
                if (!form) return;
                var kind = form.getAttribute('data-auth');
                var notice = document.querySelector('.msg--static');
                var btn = form.querySelector('button[type=submit]');
                form.addEventListener('submit', function (e) {
                        e.preventDefault();
                        var hp = form.querySelector('.hp');
                        if (hp && hp.value) return; /* تله ضد ربات */
                        var data = new FormData(form);
                        data.append('action', kind);
                        btn.disabled = true;
                        fetch(up + 'auth/' + kind, {
                                method: 'POST',
                                headers: { 'X-Requested-With': 'fetch' },
                                body: data,
                                credentials: 'same-origin'
                        }).then(function (r) {
                                if (!r.ok) throw new Error('http ' + r.status);
                                return r.json();
                        }).then(function (res) {
                                if (res && res.ok) {
                                        if (notice) { notice.hidden = true; }
                                        var msg = document.createElement('p');
                                        msg.className = 'msg';
                                        msg.setAttribute('role', 'alert');
                                        msg.textContent = kind === 'login' ? 'خوش آمدید! در حال انتقال…' : 'ثبت‌نام انجام شد! در حال انتقال…';
                                        form.prepend(msg);
                                        setTimeout(function () { location.href = up + (res.redirect || './'); }, 700);
                                } else {
                                        btn.disabled = false;
                                        var m2 = document.createElement('p');
                                        m2.className = 'msg';
                                        m2.setAttribute('role', 'alert');
                                        m2.textContent = (res && res.error) || 'خطایی رخ داد؛ دوباره تلاش کنید.';
                                        var old = form.querySelector('.msg');
                                        if (old) old.remove();
                                        form.prepend(m2);
                                }
                        }).catch(function () {
                                btn.disabled = false;
                                /* backend در دسترس نیست — پیام صادقانه نمایش داده می‌شود */
                                if (notice) notice.hidden = false;
                        });
                });
        }

        function init() {
                /* جست‌وجو فقط با فعال بودن امکان افزونه */
                var enabled = true;
                try { enabled = JSON.parse(document.documentElement.getAttribute('data-toolkit') || '{"liveSearch":true}').liveSearch !== false; } catch (e) {}
                if (enabled) {
                        makeSearch('staff', '.grid--staff', 'جست‌وجو در مدیر و معاونان', 'cst-staff-search');
                        makeSearch('students', '.grid--students', 'جست‌وجو در دانش‌آموزان برتر', 'cst-student-search');
                }
                initProgressAndTop();
                initAuth();
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
