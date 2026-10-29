'use client'

/**
 * افکت‌های سمت کلاینت وب‌سایت دبیرستان سوره
 * پورت کامل رفتارهای assets/app.js قالب Class Stars و افزونه Class Stars Toolkit:
 *   ۱) دروازه ورود (نشست‌محور با sessionStorage)
 *   ۲) ظاهر شدن آرام عناصر با اسکرول (data-reveal)
 *   ۳) شمارنده آمار با ارقام فارسی (data-count)
 *   ۴) جست‌وجوی زنده در کارت‌ها با نرمال‌سازی فارسی
 *   ۵) نوار پیشرفت مطالعه + دکمه سه‌بعدی بازگشت به بالا
 * محتوای صفحه سمت سرور رندر شده است؛ این کامپوننت فقط رفتارها را اضافه می‌کند.
 */

import { useEffect } from 'react'

function faNum(v: string | number) {
  return String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

/** نرمال‌سازی متن فارسی برای جست‌وجو (پورت از toolkit.js) */
function norm(text: unknown) {
  return String(text || '')
    .replace(/[\u064A\u0649]/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u200C\u200D\u064B-\u0652\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .trim()
}

export function SiteEffects({ search, progress, backToTop }: { search: boolean; progress: boolean; backToTop: boolean }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: (() => void)[] = []

    /* ---------- دروازه ورود ---------- */
    const gate = document.getElementById('gate')
    if (gate && !document.documentElement.classList.contains('seen')) {
      document.body.style.overflow = 'hidden'
      let closed = false
      const closeGate = (target?: string | null) => {
        if (closed) return
        closed = true
        try { sessionStorage.setItem('cs_gate', '1') } catch {}
        gate.classList.add('is-closed')
        document.body.style.overflow = ''
        setTimeout(() => document.documentElement.classList.add('seen'), reduce ? 0 : 900)
        if (target) {
          const el = document.getElementById(target)
          if (el) setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 250)
        }
      }
      gate.querySelectorAll<HTMLElement>('[data-go]').forEach((a) => {
        const h = (e: Event) => { e.preventDefault(); closeGate(a.getAttribute('data-go')) }
        a.addEventListener('click', h)
        cleanups.push(() => a.removeEventListener('click', h))
      })
      const skip = gate.querySelector<HTMLElement>('[data-skip]')
      skip?.addEventListener('click', () => closeGate())
      const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGate() }
      document.addEventListener('keydown', key)
      cleanups.push(() => document.removeEventListener('keydown', key))
    } else {
      gate?.remove()
    }

    /* ---------- ظاهر شدن با اسکرول ---------- */
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window) || reduce) {
      items.forEach((el) => el.classList.add('is-in'))
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          en.target.classList.add('is-in')
          io.unobserve(en.target)
        })
      }, { threshold: 0.12 })
      items.forEach((el, i) => {
        el.style.setProperty('--d', `${(i % 4) * 90}ms`)
        io.observe(el)
      })
      cleanups.push(() => io.disconnect())
    }

    /* ---------- شمارنده آمار ---------- */
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const end = parseInt(el.getAttribute('data-count') ?? '', 10)
      if (!end || reduce || !('IntersectionObserver' in window)) return
      const fmt = new Intl.NumberFormat('fa-IR', { useGrouping: false })
      const seen = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return
        seen.disconnect()
        const t0 = performance.now()
        const dur = 1400
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1)
          el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }, { threshold: 0.6 })
      seen.observe(el)
      cleanups.push(() => seen.disconnect())
    })

    /* ---------- جست‌وجوی زنده (پورت toolkit.js) ---------- */
    if (search) {
      const cfg = {
        searchPlaceholder: 'نام، سمت، پایه یا توضیحات…',
        emptyResult: 'موردی با این عبارت پیدا نشد.',
        resultLabel: 'نتیجه',
      }
      const makeSearch = (sectionId: string, gridSelector: string, label: string, id: string) => {
        const section = document.getElementById(sectionId)
        const grid = section?.querySelector(gridSelector)
        if (!section || !grid || section.querySelector('.cst-search')) return
        const wrap = document.createElement('div')
        wrap.className = 'cst-search'
        const input = document.createElement('input')
        input.type = 'search'
        input.id = id
        input.className = 'cst-search__input'
        input.placeholder = cfg.searchPlaceholder
        input.setAttribute('aria-label', label)
        input.setAttribute('autocomplete', 'off')
        const icon = document.createElement('span')
        icon.className = 'cst-search__icon'
        icon.setAttribute('aria-hidden', 'true')
        icon.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.5 4.5"></path></svg>'
        const count = document.createElement('span')
        count.className = 'cst-search__count'
        count.setAttribute('aria-live', 'polite')
        const empty = document.createElement('p')
        empty.className = 'cst-search__empty'
        empty.textContent = cfg.emptyResult
        empty.hidden = true
        wrap.appendChild(icon)
        wrap.appendChild(input)
        wrap.appendChild(count)
        grid.parentNode?.insertBefore(wrap, grid)
        grid.parentNode?.insertBefore(empty, grid.nextSibling)
        const cards = Array.from(grid.children).filter((el) => el.matches('.person, .kid')) as HTMLElement[]
        const texts = cards.map((card) =>
          norm(Array.from(card.querySelectorAll('h3, p, .rank')).map((el) => el.textContent).join(' '))
        )
        const update = () => {
          const query = norm(input.value)
          let visible = 0
          cards.forEach((card, i) => {
            const isEmpty = card.classList.contains('person--empty') || card.classList.contains('kid--empty')
            const match = !query || (!isEmpty && texts[i].indexOf(query) !== -1)
            card.hidden = !match
            if (match && !isEmpty) visible++
          })
          count.textContent = query ? `${faNum(visible)} ${cfg.resultLabel}` : ''
          empty.hidden = !query || visible > 0
          grid.classList.toggle('cst-grid--filtered', !!query)
        }
        input.addEventListener('input', update)
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && input.value) { input.value = ''; update() }
        })
        update()
      }
      makeSearch('staff', '.grid--staff', 'جست‌وجو در مدیر و معاونان', 'cst-staff-search')
      makeSearch('students', '.grid--students', 'جست‌وجو در دانش‌آموزان برتر', 'cst-student-search')
    }

    /* ---------- نوار پیشرفت + بازگشت به بالا ---------- */
    let barSpan: HTMLElement | null = null
    if (progress) {
      const bar = document.createElement('div')
      bar.className = 'cst-progress'
      bar.setAttribute('aria-hidden', 'true')
      bar.innerHTML = '<span></span>'
      document.body.appendChild(bar)
      barSpan = bar.querySelector('span')
      cleanups.push(() => bar.remove())
    }
    if (backToTop) {
      const topBtn = document.createElement('button')
      topBtn.className = 'cst-top'
      topBtn.type = 'button'
      topBtn.setAttribute('aria-label', 'بازگشت به بالای صفحه')
      topBtn.title = 'بازگشت به بالای صفحه'
      topBtn.hidden = true
      topBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-7 7 7M12 7v12"/></svg>'
      document.body.appendChild(topBtn)
      topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }))
      cleanups.push(() => topBtn.remove())

      let ticking = false
      const update = () => {
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const percent = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
        if (barSpan) barSpan.style.width = `${percent}%`
        const show = window.scrollY > 480
        if (show && topBtn.hidden) {
          topBtn.hidden = false
          window.requestAnimationFrame(() => topBtn.classList.add('is-visible'))
        } else if (!show && !topBtn.hidden) {
          topBtn.classList.remove('is-visible')
          topBtn.hidden = true
        }
        ticking = false
      }
      const onScroll = () => { if (!ticking) { window.requestAnimationFrame(update); ticking = true } }
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
      update()
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [search, progress, backToTop])

  return null
}
