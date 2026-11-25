(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobile menu
  const toggle = $('.menu-toggle'), menu = $('#menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menu.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    $$('a', menu).forEach(a => a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false'); menu.hidden = true; document.body.style.overflow = '';
    }));
  }

  // Collection filter (driven by the URL hash)
  const grid = $('.grid-wrap .grid');
  if (grid) {
    const names = { all: 'All pieces' };
    $$('.chip').forEach(c => { if (c.dataset.filter !== 'all') names[c.dataset.filter] = c.textContent; });
    const apply = () => {
      const key = (location.hash || '#all').slice(1);
      const f = names[key] ? key : 'all';
      let n = 0;
      $$('.card', grid).forEach(card => {
        const show = f === 'all' || card.dataset.cols.split(' ').includes(f);
        card.hidden = !show; if (show) n++;
      });
      $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      $$('.col-intro').forEach(p => { p.hidden = p.dataset.for !== f; });
      $('#col-title').textContent = names[f];
      $('#count').textContent = n;
      document.title = names[f] + ' · J. Birnbach';
    };
    $$('.chip').forEach(c => c.addEventListener('click', () => {
      history.replaceState(null, '', c.dataset.filter === 'all' ? location.pathname : '#' + c.dataset.filter);
      apply();
    }));
    window.addEventListener('hashchange', apply);
    apply();
  }

  // Product gallery
  const gallery = $('.gallery');
  if (gallery) {
    const track = $('.slides', gallery), slides = $$('.slide', gallery), thumbs = $$('.thumb', gallery), counter = $('.gc-i', gallery);
    const go = i => track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    thumbs.forEach(t => t.addEventListener('click', () => go(+t.dataset.i)));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting && en.intersectionRatio > .6) {
        const i = slides.indexOf(en.target);
        counter.textContent = i + 1;
        thumbs.forEach((t, k) => k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'));
      }
    }), { root: track, threshold: [.6] });
    slides.forEach(s => io.observe(s));
    track.addEventListener('keydown', ev => {
      const cur = +counter.textContent - 1;
      if (ev.key === 'ArrowRight' && cur < slides.length - 1) { ev.preventDefault(); go(cur + 1); }
      if (ev.key === 'ArrowLeft' && cur > 0) { ev.preventDefault(); go(cur - 1); }
    });
    // Zoom (desktop only: on a phone the swipe is the gallery)
    const lb = $('.lightbox'), lbImg = lb && $('img', lb);
    if (lb && matchMedia('(hover:hover) and (min-width:900px)').matches) {
      slides.forEach(s => s.addEventListener('click', () => {
        const im = $('img', s);
        lbImg.src = im.currentSrc.replace(/-(400|800)\.webp$/, '-1400.webp');
        lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = im.currentSrc; };
        lbImg.alt = im.alt; lb.hidden = false; $('.lb-close', lb).focus();
      }));
      const close = () => { lb.hidden = true; };
      $('.lb-close', lb).addEventListener('click', close);
      lb.addEventListener('click', e => { if (e.target === lb) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
  }

  // Turn viewer: crossfade between real photographs of the same piece
  $$('.turn-view').forEach(v => {
    const frames = $$('.turn-frame', v), range = $('.turn-range', v), stage = $('.turn-stage', v), max = frames.length - 1;
    const set = t => {
      t = Math.max(0, Math.min(max, t)); range.value = t;
      const near = Math.round(t); frames.forEach((f, k) => { f.style.opacity = k === near ? 1 : 0; });
    };
    range.addEventListener('input', () => set(+range.value));
    let drag = null;
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, t: +range.value }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => { if (drag) set(drag.t + (e.clientX - drag.x) / stage.clientWidth * max * 1.4); });
    const end = () => { drag = null; };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    set(+range.value);
  });

  // Booking form: preview only, nothing is sent
  $$('.book-form').forEach(form => form.addEventListener('submit', ev => {
    ev.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.classList.toggle('invalid', bad); f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    const note = $('.form-note', form); note.hidden = false;
    $('button[type=submit]', form).disabled = true;
  }));

  // Mobile booking button hides when the booking section is on screen
  const cta = $('.mobile-cta'), book = $('#book');
  if (cta && book) {
    new IntersectionObserver(([en]) => cta.classList.toggle('away', en.isIntersecting), { threshold: .05 }).observe(book);
    const first = $('.hero .actions, .pdp-info .actions');
    const onScroll = () => cta.classList.toggle('shown', !first || first.getBoundingClientRect().bottom < 0);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // Gentle reveal on scroll
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const els = $$('.section-head, .tile, .facts li, .spot-text, .rc-row li, .rc-item, .book-intro, .book-form');
    els.forEach(el => el.classList.add('reveal'));
    const ro = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => ro.observe(el));
  }
})();
