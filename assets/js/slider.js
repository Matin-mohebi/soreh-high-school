/* =====================================================================
   اسلایدرهای صفحه اصلی سوره
   حالت cover (سه‌بعدی/کاورفلو) برای «معرفی رشته‌ها» و «فعالیت‌ها»
   حالت focus (کارت وسط بزرگ‌تر) برای «چرا باید هنرستان سوره را انتخاب کرد؟»
   پشتیبانی از کشیدن انگشت، درگ ماوس، فلش‌ها، نقطه‌ها و کیبورد
   ===================================================================== */
(function () {
        'use strict';

        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        function init(root) {
                var viewport = root.querySelector('.slider__viewport');
                if (!viewport || viewport.getAttribute('data-slider-ready')) return;
                viewport.setAttribute('data-slider-ready', '1');

                var cards = [].slice.call(viewport.querySelectorAll(':scope > .card'));
                if (!cards.length) return;

                var mode = root.getAttribute('data-slider') === 'focus' ? 'focus' : 'cover';
                var prevBtn = root.querySelector('[data-slider-prev]');
                var nextBtn = root.querySelector('[data-slider-next]');
                var dotsBox = root.querySelector('[data-slider-dots]');
                var rtl = getComputedStyle(viewport).direction === 'rtl';
                var active = -1;
                var dragging = false;
                var moved = false;

                /* ------- نمایش خودکار (autoplay) -------
                   فقط وقتی data-slider-autoplay روی اسلایدر باشد فعال می‌شود؛
                   با هاور ماوس، لمس، فوکوس کیبورد، خروج از دید، مخفی شدن تب
                   و دکمه توقف، متوقف می‌شود و بعد ادامه پیدا می‌کند. */
                var autoAttr = root.getAttribute('data-slider-autoplay');
                var autoMs = parseInt(autoAttr, 10);
                var autoDelay = autoAttr !== null && autoAttr !== '' ? (isNaN(autoMs) ? 4200 : Math.max(autoMs, 2000)) : 0;
                var autoTimer = 0;
                var autoFlags = { hover: false, hold: false, focus: false, touch: false, visible: true, touchT: 0 };

                function canAuto() {
                        return !!autoDelay && !reduceMotion && !dragging &&
                                !autoFlags.hover && !autoFlags.hold && !autoFlags.focus &&
                                !autoFlags.touch && autoFlags.visible && !document.hidden;
                }
                function stopAuto() {
                        if (autoTimer) { window.clearInterval(autoTimer); autoTimer = 0; }
                }
                function startAuto() {
                        stopAuto();
                        if (!canAuto()) return;
                        autoTimer = window.setInterval(function () {
                                if (!canAuto()) { stopAuto(); return; }
                                /* رسیدن به آخرین کارت → برگشت به اول */
                                if (active >= cards.length - 1) goLoopStart();
                                else go(active + 1);
                        }, autoDelay);
                }
                function syncAuto() { canAuto() ? startAuto() : stopAuto(); }
                /* با هر جابه‌جایی، شمارنده زمان دوباره از صفر شمرده می‌شود */
                function bumpAuto() { if (autoDelay && autoTimer) startAuto(); }

                /* نقطه‌های ناوبری */
                if (dotsBox) {
                        cards.forEach(function (_, i) {
                                var b = document.createElement('button');
                                b.type = 'button';
                                b.className = 'slider__dot';
                                b.setAttribute('aria-label', 'نمایش گزینه ' + (i + 1));
                                b.addEventListener('click', function () { go(i); });
                                dotsBox.appendChild(b);
                        });
                }
                var dots = dotsBox ? [].slice.call(dotsBox.children) : [];

                function stepW() {
                        if (cards.length > 1) {
                                var d = Math.abs(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left);
                                if (d > 10) return d;
                        }
                        return cards[0].getBoundingClientRect().width || 320;
                }

                function nearestCard() {
                        var vp = viewport.getBoundingClientRect();
                        var cx = vp.left + vp.width / 2;
                        var best = 0, bestD = Infinity;
                        cards.forEach(function (c, i) {
                                var r = c.getBoundingClientRect();
                                var d = Math.abs(r.left + r.width / 2 - cx);
                                if (d < bestD) { bestD = d; best = i; }
                        });
                        return best;
                }

                /* اعمال تبدیل‌ها بر اساس فاصله هر کارت از مرکز */
                function apply() {
                        var vp = viewport.getBoundingClientRect();
                        var cx = vp.left + vp.width / 2;
                        var sw = stepW() || 320;
                        var best = 0, bestD = Infinity;
                        var ts = cards.map(function (c, i) {
                                var r = c.getBoundingClientRect();
                                var t = (r.left + r.width / 2 - cx) / sw;
                                if (Math.abs(t) < bestD) { bestD = Math.abs(t); best = i; }
                                return t;
                        });
                        active = best;
                        cards.forEach(function (c, i) {
                                var t = clamp(ts[i], -2.6, 2.6);
                                var a = Math.abs(t);
                                var tr, op;
                                if (mode === 'cover') {
                                        var ry = clamp(t * 30, -52, 52);
                                        var tz = -Math.min(a, 3) * 85;
                                        var s = 1 - Math.min(a, 2.5) * 0.13;
                                        tr = 'rotateY(' + ry.toFixed(2) + 'deg) translateZ(' + tz.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
                                        op = 1 - Math.min(a, 2.4) * 0.22;
                                } else {
                                        var s2 = 1.05 - Math.min(a, 2) * 0.14;
                                        tr = 'scale(' + s2.toFixed(3) + ')';
                                        op = 1 - Math.min(a, 2.4) * 0.2;
                                }
                                c.style.transform = tr;
                                c.style.opacity = Math.max(0.28, op).toFixed(3);
                                c.style.zIndex = String(200 - Math.round(Math.abs(ts[i]) * 20));
                                c.classList.toggle('is-active', i === active);
                        });
                        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === active); });
                        if (prevBtn) prevBtn.classList.toggle('is-off', active <= 0);
                        if (nextBtn) nextBtn.classList.toggle('is-off', active >= cards.length - 1);
                }

                var raf = 0;
                function onScroll() {
                        if (raf) return;
                        raf = requestAnimationFrame(function () { raf = 0; apply(); });
                }
                viewport.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', onScroll);

                function go(i) {
                        i = clamp(i, 0, cards.length - 1);
                        cards[i].scrollIntoView({
                                behavior: reduceMotion ? 'auto' : 'smooth',
                                inline: 'center',
                                block: 'nearest'
                        });
                        bumpAuto();
                }

                /* برگشت اسلایدر خودکار به کارت اول: اسکرول بلند از روی چند نقطه
                   snap رد می‌شود و scroll-snap-stop:always آن را وسط راه متوقف
                   می‌کند؛ برای همین در طول این انیمیشن snap موقتاً خاموش می‌شود. */
                function goLoopStart() {
                        viewport.style.scrollSnapType = 'none';
                        cards[0].scrollIntoView({
                                behavior: reduceMotion ? 'auto' : 'smooth',
                                inline: 'center',
                                block: 'nearest'
                        });
                        window.clearTimeout(goLoopStart.t);
                        goLoopStart.t = window.setTimeout(function () {
                                viewport.style.scrollSnapType = '';
                        }, reduceMotion ? 60 : 950);
                }

                if (prevBtn) prevBtn.addEventListener('click', function () { go(active - 1); });
                if (nextBtn) nextBtn.addEventListener('click', function () { go(active + 1); });

                /* کیبورد: در RTL فلش چپ یعنی گزینه بعدی */
                viewport.addEventListener('keydown', function (e) {
                        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                        e.preventDefault();
                        var fwd = rtl ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
                        go(active + (fwd ? 1 : -1));
                });

                /* درگ با ماوس (لمس به‌صورت بومی اسکرول می‌شود) */
                var startX = 0, startScroll = 0;
                viewport.addEventListener('pointerdown', function (e) {
                        if (e.pointerType === 'touch' || e.button !== 0) return;
                        dragging = true; moved = false;
                        startX = e.clientX;
                        startScroll = viewport.scrollLeft;
                        viewport.classList.add('is-drag');
                        viewport.style.scrollSnapType = 'none';
                });
                window.addEventListener('pointermove', function (e) {
                        if (!dragging) return;
                        var dx = e.clientX - startX;
                        if (Math.abs(dx) > 4) moved = true;
                        viewport.scrollLeft = startScroll + (rtl ? dx : -dx);
                });
                window.addEventListener('pointerup', function () {
                        if (!dragging) return;
                        dragging = false;
                        viewport.classList.remove('is-drag');
                        if (moved) go(nearestCard());
                        /* بازگرداندن snap بعد از پایان اسکرول نرم */
                        setTimeout(function () { viewport.style.scrollSnapType = ''; }, 700);
                        setTimeout(function () { moved = false; }, 120);
                });
                /* جلوگیری از باز شدن لینک بعد از درگ */
                viewport.addEventListener('click', function (e) {
                        if (moved) { e.preventDefault(); e.stopPropagation(); }
                }, true);

                /* ------- سیم‌کشی وقفه‌های نمایش خودکار ------- */
                if (autoDelay) {
                        root.addEventListener('pointerenter', function (e) {
                                if (e.pointerType !== 'touch') { autoFlags.hover = true; syncAuto(); }
                        });
                        root.addEventListener('pointerleave', function (e) {
                                if (e.pointerType !== 'touch') { autoFlags.hover = false; syncAuto(); }
                        });
                        root.addEventListener('focusin', function () { autoFlags.focus = true; syncAuto(); });
                        root.addEventListener('focusout', function (e) {
                                if (!root.contains(e.relatedTarget)) { autoFlags.focus = false; syncAuto(); }
                        });
                        root.addEventListener('touchstart', function () {
                                autoFlags.touch = true; syncAuto();
                                window.clearTimeout(autoFlags.touchT);
                        }, { passive: true });
                        root.addEventListener('touchend', function () {
                                window.clearTimeout(autoFlags.touchT);
                                autoFlags.touchT = window.setTimeout(function () {
                                        autoFlags.touch = false; syncAuto();
                                }, 4500);
                        }, { passive: true });
                        document.addEventListener('visibilitychange', syncAuto);
                        if ('IntersectionObserver' in window) {
                                new IntersectionObserver(function (entries) {
                                        autoFlags.visible = entries[0].isIntersecting;
                                        syncAuto();
                                }, { threshold: 0.3 }).observe(root);
                        }
                        /* دکمه توقف/ادامه برای کاربر */
                        if (dotsBox) {
                                var pb = document.createElement('button');
                                pb.type = 'button';
                                pb.className = 'slider__auto';
                                pb.setAttribute('aria-label', 'توقف نمایش خودکار');
                                pb.title = 'توقف / ادامه نمایش خودکار';
                                pb.innerHTML = '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
                                pb.addEventListener('click', function () {
                                        autoFlags.hold = !autoFlags.hold;
                                        pb.classList.toggle('is-holding', autoFlags.hold);
                                        pb.setAttribute('aria-label', autoFlags.hold ? 'ادامه نمایش خودکار' : 'توقف نمایش خودکار');
                                        syncAuto();
                                });
                                dotsBox.appendChild(pb);
                        }
                        syncAuto();
                }

                apply();
        }

        function boot() {
                [].slice.call(document.querySelectorAll('[data-slider]')).forEach(init);
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
})();
