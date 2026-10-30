/* سایت هنرستان‌های غیردولتی سوره زنجان — اسکریپت مشترک */
(function () {
        'use strict';

        var PORTAL = 'https://www.sooreh-honar.ir/portal/index.html';

        var MENU = [
                { t: 'صفحه اصلی', h: './index.html' },
                { t: 'درباره هنرستان', h: './about.html' },
                { t: 'معرفی رشته‌ها', h: './majors.html' },
                { t: 'آموزشگاه فنی و حرفه‌ای', h: './vocational.html' },
                { t: 'مشاوره و هدایت تحصیلی', h: './counseling.html' },
                { t: 'ثبت‌نام آنلاین', h: './register.html' },
                { t: 'اخبار و اطلاعیه‌ها', h: './news.html' },
                { t: 'افتخارات', h: './honors.html' },
                { t: 'فعالیت‌های هنرجویان', h: './activities.html' },
                { t: 'آموزش‌های مجازی', h: './elearning.html' },
                { t: 'کنکور هنر', h: './konkur.html' },
                { t: 'کتابخانه مجازی', h: './library.html' },
                { t: 'ورود کاربران', h: './login.html' }
        ];

        /* ---------- ابزارها ---------- */
        function faDigits(s) {
                return String(s).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[+d]; });
        }
        var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        function faDate(raw) {
                if (!raw) return '';
                var p = String(raw).split(' ')[0].split('/');
                if (p.length < 3) return raw;
                return faDigits(+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + faDigits(+p[0]);
        }
        function faYear(raw) { return faDigits(String(raw).split(' ')[0].split('/')[0]); }
        function esc(s) {
                return String(s).replace(/[&<>"']/g, function (c) {
                        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
                });
        }
        function el(html) {
                var d = document.createElement('div');
                d.innerHTML = html.trim();
                return d.firstChild;
        }

        /* ---------- منوی بالا ---------- */
        var nav = document.querySelector('[data-menu]');
        if (nav) {
                var here = location.pathname.split('/').pop() || 'index.html';
                nav.innerHTML = MENU.map(function (m) {
                        var active = m.h.split('/').pop() === here ? ' aria-current="page"' : '';
                        return '<a href="' + m.h + '"' + active + '>' + m.t + '</a>';
                }).join('');
                var acts = document.querySelector('[data-acts]');
                if (acts) {
                        acts.innerHTML =
                                '<a class="btn btn--sm" href="./register.html">ثبت‌نام آنلاین</a>' +
                                '<button class="burger" type="button" aria-label="باز و بسته کردن منو" aria-expanded="false">' +
                                '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>';
                        var burger = acts.querySelector('.burger');
                        burger.addEventListener('click', function () {
                                var open = nav.classList.toggle('is-open');
                                burger.setAttribute('aria-expanded', open ? 'true' : 'false');
                        });
                        document.addEventListener('click', function (e) {
                                if (!nav.contains(e.target) && !acts.contains(e.target)) nav.classList.remove('is-open');
                        });
                }
        }

        /* ---------- ظاهر شدن با اسکرول ---------- */
        var revealEls = [].slice.call(document.querySelectorAll('[data-reveal]'));
        if ('IntersectionObserver' in window && revealEls.length) {
                var io = new IntersectionObserver(function (entries) {
                        entries.forEach(function (en) {
                                if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
                        });
                }, { threshold: 0.12 });
                revealEls.forEach(function (n) { io.observe(n); });
        } else {
                revealEls.forEach(function (n) { n.classList.add('is-in'); });
        }

        /* ---------- شمارنده آمار ---------- */
        function countUp(node) {
                var target = parseInt(String(node.getAttribute('data-count')).replace(/[^0-9]/g, ''), 10) || 0;
                var suffix = node.getAttribute('data-suffix') || '';
                if (!target) { node.textContent = faDigits(node.getAttribute('data-count')) + suffix; return; }
                var dur = 1400, t0 = null;
                function step(t) {
                        if (!t0) t0 = t;
                        var k = Math.min((t - t0) / dur, 1);
                        k = 1 - Math.pow(1 - k, 3);
                        node.textContent = faDigits(Math.round(target * k)) + suffix;
                        if (k < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
        }
        var counters = [].slice.call(document.querySelectorAll('[data-count]'));
        if (counters.length) {
                var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
                        es.forEach(function (en) {
                                if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
                        });
                }, { threshold: 0.4 }) : null;
                counters.forEach(function (n) { cio ? cio.observe(n) : countUp(n); });
        }

        /* ---------- خبر ---------- */
        var NEWS = (window.SOREH && window.SOREH.news) || [];
        var CATS = (window.SOREH && window.SOREH.catLabels) || {};
        var CAT_ORDER = ['honors', 'events', 'courses', 'guidance', 'exams', 'school'];

        /* مودال جزئیات خبر (همه آیتم‌های خبری کلیک‌پذیر هستند) */
        function newsModal(i) {
                var n = NEWS[i];
                if (!n) return;
                var old = document.querySelector('.news-modal');
                if (old) old.remove();
                var link = location.origin + location.pathname + '#n-' + i;
                var ov = el('<div class="news-modal" role="dialog" aria-modal="true" aria-label="جزئیات خبر">' +
                        '<div class="news-modal__backdrop" data-close></div>' +
                        '<div class="news-modal__box">' +
                        '<button class="news-modal__x" type="button" aria-label="بستن" data-close>' +
                        '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
                        '<time>' + faDate(n.d) + '</time>' +
                        '<h3>' + esc(n.t) + '</h3>' +
                        '<p class="cat-row"><span class="cat">' + esc(CATS[n.c] || 'خبر') + '</span></p>' +
                        '<p class="news-modal__body">این خبر در آرشیو وب‌سایت هنرستان‌های سوره زنجان ثبت شده است. شرح کامل این خبر به‌همراه تصاویر، در سامانه اصلی هنرستان منتشر شده است.</p>' +
                        '<p class="news-modal__acts">' +
                        '<a class="btn btn--sm" href="' + PORTAL + '" target="_blank" rel="noopener">متن کامل در سامانه اصلی ↗</a>' +
                        '<button class="btn btn--sm btn--ghost" type="button" data-copy="' + link + '">کپی پیوند خبر</button>' +
                        '</p>' +
                        '</div></div>');
                document.body.appendChild(ov);
                document.body.style.overflow = 'hidden';
                ov.addEventListener('click', function (e) {
                        if (e.target.closest('[data-close]')) { ov.remove(); document.body.style.overflow = ''; }
                        if (e.target.closest('[data-copy]')) {
                                var txt = e.target.closest('[data-copy]').getAttribute('data-copy');
                                var done = function () { e.target.closest('[data-copy]').textContent = 'کپی شد ✓'; };
                                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
                                else { done(); }
                        }
                });
                document.addEventListener('keydown', function esc2(e) {
                        if (e.key === 'Escape') { var m = document.querySelector('.news-modal'); if (m) { m.remove(); document.body.style.overflow = ''; } document.removeEventListener('keydown', esc2); }
                });
        }

        function newsItemHTML(n, i, base) {
                var href = base ? base + '#n-' + i : '#n-' + i;
                return '<a class="news-item" href="' + href + '"' + (base ? '' : ' id="n-' + i + '"') + ' data-reveal>' +
                        '<time>' + faDate(n.d) + '</time>' +
                        '<div><p class="t">' + esc(n.t) + '</p>' +
                        '<p class="meta"><span class="cat">' + esc(CATS[n.c] || 'خبر') + '</span>' +
                        (base ? '' : '<span class="more">جزئیات خبر ' + icon('go') + '</span>') + '</p></div>' +
                        '</a>';
        }
        function icon2(name) {
                return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
        }
        function icon(name) { return icon2(name); }
        function mountNews(sel, limit) {
                var box = document.querySelector(sel);
                if (!box) return;
                var isHome = !!limit;
                var items = limit ? NEWS.slice(0, limit) : NEWS;
                box.innerHTML = items.map(function (n, k) { return newsItemHTML(n, k, isHome ? './news.html' : ''); }).join('');
                var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
                        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
                }, { threshold: 0.08 }) : null;
                [].slice.call(box.querySelectorAll('[data-reveal]')).forEach(function (n, i) {
                        n.style.setProperty('--d', Math.min(i * 45, 400) + 'ms');
                        io ? io.observe(n) : n.classList.add('is-in');
                });
        }

        /* صفحه اصلی: آخرین مطالب + متولدین امروز */
        if (document.querySelector('[data-news]')) mountNews('[data-news]', 7);

        /* لینک عمیق: باز شدن خودکار جزئیات خبر با news.html#n-<i> */
        if (document.querySelector('[data-news-filters]') && location.hash.indexOf('#n-') === 0) {
                var ni = parseInt(location.hash.replace('#n-', ''), 10);
                if (!isNaN(ni) && NEWS[ni]) {
                        setTimeout(function () {
                                var target = document.getElementById('n-' + ni);
                                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setTimeout(function () { newsModal(ni); }, 450);
                        }, 250);
                }
        }
        var bday = document.querySelector('[data-bday]');
        if (bday && window.SOREH && window.SOREH.bdays) {
                var list = window.SOREH.bdays;
                bday.innerHTML = '<p class="ttl"><svg viewBox="0 0 24 24"><path d="M12 3v3M8 6c0-1.7 1.8-3 4-3s4 1.3 4 3c0 1.2-1 2-2 2H10c-1.2 0-2-.8-2-2z"/><path d="M4 13c1.5-1.6 3-1.6 4.5 0S11.5 14.6 13 13s3-1.6 4.5 0 2.5 1.4 2.5 1.4"/><path d="M4 13v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M12 10v3"/></svg> متولدین امروز</p>' +
                        '<ul>' + list.map(function (b) {
                                return '<li><b>' + esc(b.name) + '</b><span>' + esc(b.cls) + '</span></li>';
                        }).join('') + '</ul>' +
                        '<p class="hint">تولدشان مبارک! 🎉</p>';
        }

        /* ---------- صفحه اخبار: فیلتر سال/دسته + جستجو ---------- */
        var newsBox = document.querySelector('[data-news-filters]');
        if (newsBox) {
                var years = [];
                NEWS.forEach(function (n) { var y = faYear(n.d); if (years.indexOf(y) < 0) years.push(y); });
                var catChips = CAT_ORDER.filter(function (c) { return NEWS.some(function (n) { return n.c === c; }); });

                var wrap = document.querySelector('[data-news-filters]');
                wrap.innerHTML =
                        '<div class="filters">' +
                        '<div class="chips chips--years" role="group" aria-label="فیلتر سال">' +
                        '<button class="chip is-active" type="button" data-y="*">همه سال‌ها</button>' +
                        years.map(function (y) { return '<button class="chip" type="button" data-y="' + y + '">سال ' + y + '</button>'; }).join('') +
                        '</div>' +
                        '<div class="chips chips--cats" role="group" aria-label="فیلتر موضوع">' +
                        '<button class="chip is-active" type="button" data-c="*">همه موضوع‌ها</button>' +
                        catChips.map(function (c) { return '<button class="chip" type="button" data-c="' + c + '">' + esc(CATS[c]) + '</button>'; }).join('') +
                        '</div>' +
                        '<div class="search"><input type="search" placeholder="جستجو در عنوان خبرها…" aria-label="جستجو در اخبار"></div>' +
                        '</div>' +
                        '<p class="news-count" data-news-count aria-live="polite"></p>' +
                        '<div class="news-list" data-news-all></div>' +
                        '<p class="empty" hidden>خبری با این مشخصات پیدا نشد؛ فیلترها را تغییر دهید.</p>';

                var list = wrap.querySelector('[data-news-all]');
                var countEl = wrap.querySelector('[data-news-count]');
                var emptyEl = wrap.querySelector('.empty');
                var state = { y: '*', c: '*', q: '' };

                /* پشتیبانی از جستجوی عمیق: news.html?q=کلیدواژه */
                try {
                        var qq = new URLSearchParams(location.search).get('q');
                        if (qq) { state.q = qq.trim(); wrap.querySelector('input').value = state.q; }
                } catch (err) { /* بی‌اهمیت */ }

                function apply() {
                        var out = NEWS.filter(function (n) {
                                if (state.y !== '*' && faYear(n.d) !== state.y) return false;
                                if (state.c !== '*' && n.c !== state.c) return false;
                                if (state.q && n.t.indexOf(state.q) < 0) return false;
                                return true;
                        });
                        list.innerHTML = out.map(function (n) {
                                var i = NEWS.indexOf(n);
                                return newsItemHTML(n, i, '');
                        }).join('');
                        countEl.textContent = 'نمایش ' + faDigits(out.length) + ' خبر از مجموع ' + faDigits(NEWS.length) + ' خبر و اطلاعیه ثبت‌شده';
                        emptyEl.hidden = out.length > 0;
                }

                /* کلیک روی هر خبر = باز شدن جزئیات */
                list.addEventListener('click', function (e) {
                        var a = e.target.closest('a.news-item');
                        if (!a) return;
                        e.preventDefault();
                        newsModal(parseInt(String(a.getAttribute('href')).replace('#n-', ''), 10) || 0);
                });

                wrap.addEventListener('click', function (e) {
                        var chip = e.target.closest('.chip');
                        if (!chip) return;
                        var group = chip.parentElement;
                        [].slice.call(group.querySelectorAll('.chip')).forEach(function (c) { c.classList.remove('is-active'); });
                        chip.classList.add('is-active');
                        if (chip.hasAttribute('data-y')) state.y = chip.getAttribute('data-y');
                        if (chip.hasAttribute('data-c')) state.c = chip.getAttribute('data-c');
                        apply();
                });
                wrap.querySelector('input').addEventListener('input', function () {
                        state.q = this.value.trim();
                        apply();
                });
                apply();
        }

        /* ---------- فرم‌ها (نسخه استاتیک — ذخیره محلی + پیام) ---------- */
        function handleForm(sel, okText, extra) {
                var f = document.querySelector(sel);
                if (!f) return;
                f.addEventListener('submit', function (e) {
                        e.preventDefault();
                        if (!f.checkValidity()) { f.reportValidity(); return; }
                        var hp = f.querySelector('.hp input');
                        if (hp && hp.value) return; /* تله ربات */
                        var data = {};
                        [].slice.call(f.elements).forEach(function (inp) {
                                if (inp.name && inp.type !== 'submit' && !(inp.type === 'checkbox' && !inp.checked)) data[inp.name] = inp.value;
                        });
                        try {
                                var key = 'soreh_' + sel.replace(/[^a-z]/g, '');
                                var arr = JSON.parse(localStorage.getItem(key) || '[]');
                                data._at = new Date().toISOString();
                                arr.push(data);
                                localStorage.setItem(key, JSON.stringify(arr));
                        } catch (err) { /* بی‌اهمیت */ }
                        var msg = f.querySelector('[data-form-msg]');
                        if (!msg) {
                                msg = el('<p class="msg msg--ok" role="status"></p>');
                                f.appendChild(msg);
                        }
                        msg.textContent = okText;
                        if (extra) {
                                var note = el('<span class="form-note" style="display:block"></span>');
                                note.textContent = extra;
                                msg.appendChild(note);
                        }
                        f.reset();
                        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
        }
        handleForm('[data-form-register]',
                'ثبت‌نام شما با موفقیت در این نسخه ذخیره شد.',
                'توجه: این سایت استاتیک است؛ برای نهایی‌شدن ثبت‌نام حتماً با شعبه موردنظر تماس بگیرید.');
        handleForm('[data-form-contact]',
                'پیام شما ذخیره شد؛ در اسرع وقت با شما تماس گرفته می‌شود.',
                'توجه: برای پیگیری فوری، با تلفن هنرستان تماس بگیرید.');
        handleForm('[data-form-login]', null, null);

        /* فرم ورود: نمایش پیام راهنما به‌جای ورود واقعی */
        var loginForm = document.querySelector('[data-form-login]');
        if (loginForm) {
                loginForm.addEventListener('submit', function () {
                        var msg = loginForm.querySelector('[data-form-msg]');
                        setTimeout(function () {
                                msg.className = 'msg msg--warn';
                                msg.innerHTML = 'ورود کاربران (معلمان، هنرجویان و اولیا) از طریق سامانه اصلی هنرستان انجام می‌شود. ' +
                                        '<a href="' + PORTAL + '" target="_blank" rel="noopener" style="color:#fff;font-weight:700">ورود به سامانه اصلی ↗</a>';
                        }, 10);
                });
        }

        /* ---------- اسلایدر سه‌بعدی (کاورفلو راست‌به‌چپ) ---------- */
        /* کارت وسط بزرگ‌تر، کارت‌های کناری بخشی از دید؛ جابه‌جایی با کشیدن
           انگشت/ماوس، فلش‌ها، نقطه‌ها و کلیدهای جهت‌دار. کلیک روی کارت کناری
           آن را به وسط می‌آورد و کلیک روی کارت وسط، لینک خودش را باز می‌کند. */
        (function () {
                var grids = [].slice.call(document.querySelectorAll('.cards[data-slider3d]'));
                if (!grids.length) return;

                grids.forEach(function (grid) {
                        if (grid.getAttribute('data-s3')) return;
                        grid.setAttribute('data-s3', '1');

                        var cards = [].slice.call(grid.children).filter(function (c) { return c.classList.contains('card'); });
                        var n = cards.length;
                        if (n < 2) return;

                        var label = grid.getAttribute('data-slider3d') || 'اسلایدر';
                        var wrap = document.createElement('div');
                        wrap.className = 'slider3d';
                        grid.parentNode.insertBefore(wrap, grid);

                        var prevBtn = document.createElement('button');
                        prevBtn.type = 'button';
                        prevBtn.className = 'slider3d__btn slider3d__btn--prev';
                        prevBtn.setAttribute('aria-label', 'اسلاید قبلی');
                        prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

                        var nextBtn = document.createElement('button');
                        nextBtn.type = 'button';
                        nextBtn.className = 'slider3d__btn slider3d__btn--next';
                        nextBtn.setAttribute('aria-label', 'اسلاید بعدی');
                        nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

                        var stage = document.createElement('div');
                        stage.className = 'slider3d__stage';
                        stage.setAttribute('role', 'group');
                        stage.setAttribute('aria-label', label);
                        stage.tabIndex = 0;

                        var track = document.createElement('div');
                        track.className = 'slider3d__track';

                        wrap.appendChild(stage);
                        stage.appendChild(track);
                        track.appendChild(grid);
                        grid.classList.add('slider3d__grid');
                        stage.appendChild(prevBtn);
                        stage.appendChild(nextBtn);

                        var nav = document.createElement('div');
                        nav.className = 'slider3d__nav';
                        var dots = [];
                        for (var di = 0; di < n; di++) {
                                (function (idx) {
                                        var d = document.createElement('button');
                                        d.type = 'button';
                                        d.className = 'slider3d__dot';
                                        d.setAttribute('aria-label', 'نمایش مورد ' + faDigits(idx + 1));
                                        d.addEventListener('click', function () { go(idx - active); });
                                        nav.appendChild(d);
                                        dots.push(d);
                                })(di);
                        }
                        wrap.appendChild(nav);

                        var active = 0, dragDX = 0, dragging = false, moved = false, captured = false;
                        var startX = 0, lastDragEnd = 0;
                        var step = 240, maxSide = 2;

                        /* فاصله‌ی آیتم از اسلاید فعال با در نظر گرفتن چرخش بی‌پایان */
                        function signedOffset(i) {
                                var o = (i - active) % n;
                                if (o > n / 2) o -= n;
                                if (o < -n / 2) o += n;
                                return o;
                        }

                        function layout() {
                                var vw = stage.clientWidth || 900;
                                var mobile = vw < 700;
                                var cardW = mobile ? Math.min(vw * 0.72, 420) : Math.min(Math.max(270, vw * 0.42), 400);
                                step = cardW * (mobile ? 0.6 : 0.52);
                                maxSide = mobile ? 1 : 2;
                                cards.forEach(function (c) { c.style.width = cardW + 'px'; });
                                var h = 0;
                                cards.forEach(function (c) { h = Math.max(h, c.offsetHeight); });
                                track.style.height = h + 'px';
                                render(true);
                        }

                        function render(instant) {
                                if (instant) track.classList.add('no-anim');
                                cards.forEach(function (card, i) {
                                        var o = signedOffset(i);
                                        var ao = Math.abs(o);
                                        var hidden = ao > maxSide;
                                        var x = -o * step + dragDX;                       /* بعدی سمت چپ (راست‌به‌چپ) */
                                        var y = Math.min(ao, 3) * 12;
                                        var z = -Math.min(ao, 3) * 120;
                                        var rot = -Math.sign(o) * 34 * Math.min(ao, 1);
                                        var sc = 1 - Math.min(ao, 3) * 0.08;
                                        card.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y + 'px,' + z + 'px) rotateY(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
                                        card.style.opacity = hidden ? '0' : (ao === 0 ? '1' : (ao === 1 ? '0.92' : '0.62'));
                                        card.style.zIndex = String(60 - Math.min(ao, 5) * 10);
                                        card.classList.toggle('is-active', ao === 0);
                                        card.classList.toggle('is-side', ao > 0 && !hidden);
                                        card.classList.toggle('is-hidden', hidden);
                                        card.setAttribute('aria-hidden', hidden ? 'true' : 'false');
                                        if (ao === 0) card.removeAttribute('tabindex');
                                        else card.setAttribute('tabindex', '-1');
                                        dots[i].classList.toggle('is-active', ao === 0);
                                        if (ao === 0) dots[i].setAttribute('aria-current', 'true');
                                        else dots[i].removeAttribute('aria-current');
                                });
                                if (instant) {
                                        void track.offsetWidth;
                                        track.classList.remove('no-anim');
                                }
                        }

                        function go(dir) { active = (active + dir + n) % n; render(); }

                        prevBtn.addEventListener('click', function () { go(-1); });
                        nextBtn.addEventListener('click', function () { go(1); });

                        stage.addEventListener('keydown', function (e) {
                                if (e.key === 'ArrowLeft') { e.preventDefault(); go(1); }
                                else if (e.key === 'ArrowRight') { e.preventDefault(); go(-1); }
                        });

                        /* کلیک روی کارت کناری = آوردن آن به وسط؛ کارت وسط لینک می‌ماند */
                        grid.addEventListener('click', function (e) {
                                var card = e.target.closest('.card');
                                if (!card) return;
                                if (moved && Date.now() - lastDragEnd < 350) { e.preventDefault(); return; }
                                var i = cards.indexOf(card);
                                if (i < 0 || i === active) return;
                                e.preventDefault();
                                go(i - active);
                        });

                        stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

                        /* کشیدن با انگشت یا ماوس */
                        stage.addEventListener('pointerdown', function (e) {
                                if (e.pointerType === 'mouse' && e.button !== 0) return;
                                dragging = true; moved = false; captured = false;
                                startX = e.clientX;
                                dragDX = 0;
                                stage.classList.add('is-dragging');
                                track.classList.add('no-anim');
                        });
                        stage.addEventListener('pointermove', function (e) {
                                if (!dragging) return;
                                dragDX = e.clientX - startX;
                                if (!captured && Math.abs(dragDX) > 8) {
                                        captured = true;
                                        moved = true;
                                        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* بی‌اهمیت */ }
                                }
                                if (captured) render();
                        });
                        function endDrag() {
                                if (!dragging) return;
                                dragging = false;
                                stage.classList.remove('is-dragging');
                                track.classList.remove('no-anim');
                                var dx = dragDX;
                                dragDX = 0;
                                if (captured) {
                                        lastDragEnd = Date.now();
                                        var th = Math.min(90, step * 0.28);
                                        if (dx < -th) go(1);
                                        else if (dx > th) go(-1);
                                        else render();
                                }
                        }
                        stage.addEventListener('pointerup', endDrag);
                        stage.addEventListener('pointercancel', endDrag);
                        window.addEventListener('pointerup', endDrag);

                        /* اندازه‌گیری اولیه + تغییر اندازه + پایان بارگذاری فونت‌ها */
                        layout();
                        var rT;
                        window.addEventListener('resize', function () {
                                clearTimeout(rT);
                                rT = setTimeout(layout, 120);
                        });
                        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); });
                        window.addEventListener('load', layout);
                });
        })();

        /* ---------- سال جاری پاورقی ---------- */
        var y = document.querySelector('[data-year]');
        if (y) y.textContent = faDigits('1405');
})();
