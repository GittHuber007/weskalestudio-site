(function () {
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }

  /* header: solid after the hero, hides on scroll down, returns on scroll up */
  var hd = $('.hd'), lastY = scrollY;
  function onScroll() {
    var y = scrollY, lim = d.body.classList.contains('has-hero') ? innerHeight * .55 : 10;
    hd.classList.toggle('solid', y > lim);
    if (!hd.classList.contains('open')) hd.classList.toggle('hide', y > 300 && y > lastY + 2);
    if (y < lastY - 2) hd.classList.remove('hide');
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mega menus */
  $$('[data-mega]').forEach(function (b) {
    var m = d.getElementById(b.dataset.mega), t;
    function open() { clearTimeout(t); $$('.mega.on').forEach(function (x) { if (x !== m) x.classList.remove('on'); });
      $$('[data-mega]').forEach(function (x) { x.setAttribute('aria-expanded', x === b); }); m.classList.add('on'); hd.classList.add('open'); }
    function close() { t = setTimeout(function () { m.classList.remove('on'); b.setAttribute('aria-expanded', false); if (!$('.mega.on')) hd.classList.remove('open'); }, 160); }
    b.addEventListener('mouseenter', open); b.addEventListener('focus', open); b.addEventListener('mouseleave', close);
    m.addEventListener('mouseenter', function () { clearTimeout(t); }); m.addEventListener('mouseleave', close);
    b.addEventListener('click', function () { m.classList.contains('on') ? close() : open(); });
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.mega.on').forEach(function (m) { m.classList.remove('on'); }); hd.classList.remove('open'); closeBook(); closeZoom(); } });

  /* mobile drawer */
  var dr = $('.drawer');
  $$('[data-drawer]').forEach(function (b) { b.addEventListener('click', function () { var on = !dr.classList.contains('on'); dr.classList.toggle('on', on); d.body.style.overflow = on ? 'hidden' : ''; }); });

  /* booking panel */
  var bk = $('.book'), veil = $('.veil');
  function openBook(piece) {
    if (piece) { var f = $('[name=piece]', bk); if (f) f.value = piece; }
    bk.classList.remove('sent'); bk.classList.add('on'); veil.classList.add('on'); d.body.style.overflow = 'hidden';
    if (dr) dr.classList.remove('on');
  }
  function closeBook() { if (!bk) return; bk.classList.remove('on'); veil.classList.remove('on'); d.body.style.overflow = ''; }
  $$('[data-book]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openBook(a.dataset.book); }); });
  if (veil) veil.addEventListener('click', closeBook);
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeBook); });
  var form = $('.book form');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); bk.classList.add('sent'); });
  $$('.news').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var i = $('input', f); i.value = ''; i.placeholder = 'Design preview: nothing was sent'; }); });

  /* reveal on scroll */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  $$('[data-r]').forEach(function (el) { io.observe(el); });

  /* slow parallax on full-bleed bands */
  var bands = $$('.band img');
  function par() { bands.forEach(function (im) { var r = im.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; im.style.transform = 'scale(1.08) translate3d(0,' + (p * -4) + '%,0)'; }); }
  if (!reduce && bands.length) { addEventListener('scroll', par, { passive: true }); par(); }

  /* frame sequence: scroll-driven (home) or drag-driven (product) */
  function sequence(cv, getT) {
    var ctx = cv.getContext('2d'), N = +cv.dataset.frames, base = cv.dataset.base, fr = new Array(N), cur = -1;
    function ok(i) { var m = fr[i]; return m && m.complete && m.naturalWidth; }
    function load(i) { var m = new Image(); m.decoding = 'async'; m.onload = function () { cur = -1; }; m.src = base + String(i).padStart(3, '0') + '.webp'; fr[i] = m; }
    load(0); var order = [], seen = { 0: 1 };
    [8, 4, 2, 1].forEach(function (s) { for (var k = 0; k < N; k += s) if (!seen[k]) { seen[k] = 1; order.push(k); } });
    var oi = 0; (function pump() { for (var n = 0; n < 8 && oi < order.length; n++) load(order[oi++]); if (oi < order.length) setTimeout(pump, 40); })();
    function size() { var r = cv.getBoundingClientRect(), dp = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * dp); cv.height = Math.round(r.height * dp); cur = -1; }
    function near(i) { for (var k = 0; k < N; k++) { if (ok(i - k)) return i - k; if (ok(i + k)) return i + k; } return -1; }
    function draw() {
      var i = Math.max(0, Math.min(N - 1, Math.round(getT() * (N - 1)))), j = near(i);
      if (j >= 0 && j !== cur) { cur = j; var m = fr[j], s = Math.min(cv.width / m.naturalWidth, cv.height / m.naturalHeight) * (+cv.dataset.scale || 1) * (cv.width < cv.height ? 1.8 : 1),
        w = m.naturalWidth * s, h = m.naturalHeight * s; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(m, (cv.width - w) / 2, (cv.height - h) / 2, w, h); }
      requestAnimationFrame(draw);
    }
    addEventListener('resize', size); size(); requestAnimationFrame(draw);
  }
  var turn = $('.turn');
  if (turn) {
    var sides = $$('.turn-side', turn), bar = $('.turn-bar i', turn), tt = 0;
    sequence($('canvas', turn), function () {
      var r = turn.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / (turn.offsetHeight - innerHeight)));
      tt += (p - tt) * .12; bar.style.transform = 'scaleX(' + tt + ')';
      sides[0] && sides[0].classList.toggle('on', tt > .2 && tt < .62); sides[1] && sides[1].classList.toggle('on', tt > .55 && tt < .95);
      return tt;
    });
  }
  var spin = $('.spin canvas');
  if (spin) {
    var sp = { t: 0, v: 0, x: null, auto: true };
    sequence(spin, function () { if (sp.auto && sp.x === null) sp.t = (sp.t + .0016) % 1; else { sp.t = (sp.t + sp.v + 1) % 1; sp.v *= .92; } return sp.t; });
    spin.addEventListener('pointerdown', function (e) { sp.x = e.clientX; sp.auto = false; spin.setPointerCapture(e.pointerId); });
    spin.addEventListener('pointermove', function (e) { if (sp.x === null) return; var dx = e.clientX - sp.x; sp.x = e.clientX; sp.t = (sp.t + dx / spin.clientWidth * .9 + 1) % 1; sp.v = dx / spin.clientWidth * .05; });
    spin.addEventListener('pointerup', function () { sp.x = null; });
  }

  /* collection filters */
  var grid = $('.cgrid');
  if (grid) {
    var cards = $$('.card', grid), feat = $('.feat', grid), state = { col: 'all', type: 'all' }, cnt = $('.count');
    var params = new URLSearchParams(location.search); if (params.get('c')) state.col = params.get('c'); if (params.get('t')) state.type = params.get('t');
    function apply() {
      var n = 0;
      cards.forEach(function (c) { var show = (state.col === 'all' || c.dataset.cols.split(' ').indexOf(state.col) > -1) && (state.type === 'all' || c.dataset.type === state.type); c.hidden = !show; if (show) n++; });
      $$('.tabs [data-col]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.col === state.col); });
      var sel = $('.filt select'); if (sel) sel.value = state.type;
      if (feat) { var fi = feat.dataset[state.col.replace(/-./g, function (m) { return m[1].toUpperCase(); })] || feat.dataset.all; $('img', feat).src = fi.split('|')[0]; $('span', feat).textContent = fi.split('|')[1]; }
      var h = $('.col-h h1'), p = $('.col-h p'), meta = window.COLS && window.COLS[state.col]; if (meta) { h.textContent = meta[0]; p.textContent = meta[1]; }
      if (cnt) cnt.textContent = n + (n > 1 ? ' pieces' : ' piece');
      var q = new URLSearchParams(); if (state.col !== 'all') q.set('c', state.col); if (state.type !== 'all') q.set('t', state.type);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    $$('.tabs [data-col]').forEach(function (b) { b.addEventListener('click', function () { state.col = b.dataset.col; apply(); }); });
    var sel = $('.filt select'); if (sel) sel.addEventListener('change', function () { state.type = sel.value; apply(); });
    apply();
  }

  /* zoom */
  var zm = $('.zoom');
  function closeZoom() { if (zm) { zm.classList.remove('on'); d.body.style.overflow = ''; } }
  if (zm) {
    $$('.gal figure[data-zoom]').forEach(function (f) { f.addEventListener('click', function () { $('img', zm).src = f.dataset.zoom; zm.classList.toggle('scene', f.classList.contains('scene')); zm.classList.add('on'); d.body.style.overflow = 'hidden'; }); });
    zm.addEventListener('click', closeZoom);
  }
})();
