(function () {
	var root = document.documentElement;
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* --- دروازه ورود: فقط یک بار در هر نشست --- */
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
	}

	/* --- ظاهر شدن آرام عناصر هنگام اسکرول --- */
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

	/* --- شمارنده آمار --- */
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
})();
