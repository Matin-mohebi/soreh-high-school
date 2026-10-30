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

		apply();
	}

	function boot() {
		[].slice.call(document.querySelectorAll('[data-slider]')).forEach(init);
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
