document.documentElement.classList.add('js');
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* header: solid after the first screen, light text over dark sections */
  var header = document.querySelector('.site-header');
  var cta = document.querySelector('.mobile-cta');
  var darks = [].slice.call(document.querySelectorAll('[data-dark]'));
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('solid', y > 40);
      var mid = 35, onDark = darks.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
      header.classList.toggle('on-dark', onDark);
    }
    if (cta) {
      var book = document.getElementById('book');
      var hide = y < 300 || (book && book.getBoundingClientRect().top < window.innerHeight);
      cta.classList.toggle('hide', !!hide);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  var tog = document.querySelector('.menu-toggle'), menu = document.getElementById('menu');
  if (tog && menu) {
    tog.addEventListener('click', function () {
      var open = tog.getAttribute('aria-expanded') === 'true';
      tog.setAttribute('aria-expanded', String(!open)); menu.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { tog.setAttribute('aria-expanded', 'false'); menu.hidden = true; document.body.style.overflow = ''; } });
  }

  /* reveal on scroll */
  var rev = [].slice.call(document.querySelectorAll('[data-reveal], .cut-svg'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('in'); });
  document.querySelectorAll('.cut-svg .draw').forEach(function (p) { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (e) {} });

  /* the 10x loupe: follows the pointer, drifts on its own when idle */
  function loupe(stage) {
    var lens = stage.querySelector('.lens'), img = stage.querySelector('img');
    if (!lens || !img) return;
    var zoom = 3.2, idle = true, t = 0, raf;
    function src() { return img.getAttribute('data-zoom') || img.currentSrc || img.src; }
    function place(x, y) {
      var r = stage.getBoundingClientRect(), w = r.width, h = r.height, lw = lens.offsetWidth;
      lens.style.left = x + 'px'; lens.style.top = y + 'px';
      lens.style.backgroundImage = 'url("' + src() + '")';
      lens.style.backgroundSize = (w * zoom) + 'px ' + (h * zoom) + 'px';
      lens.style.backgroundPosition = (-(x * zoom - lw / 2)) + 'px ' + (-(y * zoom - lw / 2)) + 'px';
    }
    function drift() {
      if (!idle) return;
      t += 0.006;
      var r = stage.getBoundingClientRect();
      place(r.width * (0.5 + 0.17 * Math.cos(t * 1.3)), r.height * (0.47 + 0.15 * Math.sin(t * 2.1)));
      raf = requestAnimationFrame(drift);
    }
    function move(e) {
      var r = stage.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
      idle = false; cancelAnimationFrame(raf);
      place(p.clientX - r.left, p.clientY - r.top);
    }
    stage.addEventListener('pointermove', move);
    stage.addEventListener('touchmove', move, { passive: true });
    stage.addEventListener('pointerleave', function () { if (stage.hasAttribute('data-drift') && !reduce) { idle = true; drift(); } else stage.classList.remove('live'); });
    stage.addEventListener('pointerenter', function () { stage.classList.add('live'); });
    if (stage.hasAttribute('data-drift') && !reduce) {
      var started = false;
      var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !started) { started = true; stage.classList.add('live'); drift(); } });
      o.observe(stage);
    }
    stage._loupe = { refresh: function () { if (!idle) return; } };
  }
  document.querySelectorAll('[data-loupe]').forEach(loupe);

  /* collections index: floating image follows the cursor */
  var fl = document.querySelector('.index-float');
  if (fl && fine) {
    var items = document.querySelectorAll('.index li');
    items.forEach(function (li) {
      li.addEventListener('mouseenter', function () {
        fl.querySelectorAll('img').forEach(function (im) { im.classList.toggle('cur', im.dataset.k === li.dataset.k); });
        fl.classList.add('on');
      });
      li.addEventListener('mouseleave', function () { fl.classList.remove('on'); });
    });
    window.addEventListener('mousemove', function (e) { fl.style.left = (e.clientX + 170) + 'px'; fl.style.top = e.clientY + 'px'; }, { passive: true });
  }

  /* the vault: drag to scroll with a mouse */
  document.querySelectorAll('.track').forEach(function (tr) {
    var down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = tr.scrollLeft; tr.classList.add('drag'); });
    window.addEventListener('mouseup', function () { down = false; tr.classList.remove('drag'); });
    tr.addEventListener('mousemove', function (e) { if (!down) return; var d = e.pageX - sx; if (Math.abs(d) > 4) moved = true; tr.scrollLeft = sl - d; });
    tr.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    tr.querySelectorAll('img').forEach(function (i) { i.draggable = false; });
  });

  /* collection filters */
  var chips = document.querySelectorAll('.chip');
  if (chips.length) {
    var cards = document.querySelectorAll('.card'), count = document.getElementById('count'), title = document.getElementById('col-title');
    function apply(f) {
      var n = 0;
      cards.forEach(function (c) { var ok = f === 'all' || c.dataset.cols.split(' ').indexOf(f) > -1; c.hidden = !ok; if (ok) n++; });
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', String(ch.dataset.filter === f)); if (ch.dataset.filter === f && title) title.textContent = ch.dataset.title || ch.textContent; });
      document.querySelectorAll('.col-intro').forEach(function (p) { p.hidden = p.dataset.for !== f; });
      if (count) count.textContent = n;
    }
    chips.forEach(function (ch) { ch.addEventListener('click', function () { apply(ch.dataset.filter); history.replaceState(null, '', ch.dataset.filter === 'all' ? location.pathname : '#' + ch.dataset.filter); }); });
    var h = location.hash.slice(1); if (h && document.querySelector('.chip[data-filter="' + h + '"]')) apply(h);
  }

  /* piece gallery: thumbnails swap the main image (the loupe reads it) */
  var main = document.querySelector('.pdp-main img');
  document.querySelectorAll('.thumb').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.thumb').forEach(function (x) { x.setAttribute('aria-current', 'false'); });
      b.setAttribute('aria-current', 'true');
      main.style.opacity = 0;
      setTimeout(function () { main.removeAttribute('srcset'); main.src = b.dataset.src; main.setAttribute('data-zoom', b.dataset.zoom); main.alt = b.dataset.alt; main.style.opacity = 1; }, 200);
    });
  });

  /* booking links scroll to the form; form is a preview */
  document.querySelectorAll('[data-book]').forEach(function (a) {
    a.addEventListener('click', function (e) { var b = document.getElementById('book'); if (b) { e.preventDefault(); b.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } });
  });
  document.querySelectorAll('.book-form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); var n = f.querySelector('.form-note'); if (n) n.hidden = false; });
  });
})();
