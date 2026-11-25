(function () {
  var st = document.querySelector('.stage'); if (!st) return;
  var cv = st.querySelector('canvas'), ctx = cv.getContext('2d'), poster = st.querySelector('.poster');
  var N = +cv.dataset.frames, base = cv.dataset.base, fr = new Array(N);
  var A = st.querySelector('.title .a'), B = st.querySelector('.title .b'), ring = st.querySelector('.ring'), fin = st.querySelector('.final');
  var tag = st.querySelector('.tag'), cue = st.querySelector('.cue'), specs = st.querySelector('.specs'), bar = document.querySelector('.bar');
  var ch = [].slice.call(st.querySelectorAll('.chapter')).map(function (c) { var r = c.dataset.range.split(' ').map(Number); return { el: c, a: r[0], b: r[1] }; });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ok(i) { var m = fr[i]; return m && m.complete && m.naturalWidth; }
  function load(i) { var m = new Image(); m.decoding = 'async'; m.onload = function () { dirty = true; }; m.src = base + String(i).padStart(3, '0') + '.webp'; fr[i] = m; }
  // first frame, then every 6th, then every 2nd, then the rest: the turn is usable at once and sharpens as frames arrive
  load(0); var order = [], seen = {}; [6, 2, 1].forEach(function (s) { for (var k = 0; k < N; k += s) if (!seen[k]) { seen[k] = 1; if (k) order.push(k); } });
  var oi = 0; (function pump() { var n = 0; while (oi < order.length && n < 10) { load(order[oi++]); n++; } if (oi < order.length) setTimeout(pump, 30); })();
  function near(i, dir) { if (ok(i)) return i; for (var d = 1; d < N; d++) { var j = i + d * dir; if (j >= 0 && j < N && ok(j)) return j; j = i - d * dir; if (j >= 0 && j < N && ok(j)) return j; } return -1; }

  function blit(m, a) { var w = cv.width, h = cv.height, s = Math.min(w / m.naturalWidth, h / m.naturalHeight), dw = m.naturalWidth * s, dh = m.naturalHeight * s; ctx.globalAlpha = a; ctx.drawImage(m, (w - dw) / 2, (h - dh) / 2, dw, dh); }
  var lastF = -1, dirty = true;
  // fractional frame: draw the frame below, then blend the next one on top, so the turn never steps
  function draw(f) {
    if (!dirty && Math.abs(f - lastF) < 0.01) return; lastF = f; dirty = false;
    var i = Math.floor(f), t = f - i, a = near(i, -1), b = near(Math.min(i + 1, N - 1), 1);
    if (a < 0) return;
    ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    blit(fr[a], 1); if (b > a && t > 0.02) blit(fr[b], t); ctx.globalAlpha = 1;
    if (poster && !poster.hidden) poster.hidden = true;
  }

  function c(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ease(x) { return x * x * (3 - 2 * x); }        // smoothstep: no hard starts or stops
  function seg(p, a, b) { return ease(c((p - a) / (b - a), 0, 1)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // one continuous curve for the turn, slowed (never frozen) while each chapter is read
  function turn(p) {
    return lerp(0, .36, seg(p, 0, .24)) + lerp(0, .14, seg(p, .24, .62)) + lerp(0, .28, seg(p, .58, .82)) + lerp(0, .22, seg(p, .8, .96));
  }

  var mob = false, target = 0, sp = 0, running = false;
  function progress() { var r = st.getBoundingClientRect(); return c(-r.top / (st.offsetHeight - innerHeight), 0, 1); }

  function render(p) {
    draw(c(turn(p), 0, 1) * (N - 1));
    var t = seg(p, 0, .14);
    A.style.transform = 'translate3d(' + (-t * 28) + 'vw,' + (-t * 10) + 'vh,0)'; B.style.transform = 'translate3d(' + (t * 28) + 'vw,' + (t * 10) + 'vh,0)';
    A.style.opacity = B.style.opacity = 1 - t;
    tag.style.opacity = cue.style.opacity = 1 - seg(p, 0, .06);
    bar.classList.toggle('on', p > .07 && p < .995);
    var k1 = seg(p, .12, .26), k2 = seg(p, .4, .5), k3 = seg(p, .58, .68), k4 = seg(p, .8, .92), X = 0, Y = 0, S = 1;
    if (mob) { Y = -8 * k1; S = lerp(1, 1.9, k2); S = lerp(S, 1, k3); Y = lerp(Y, -6, k3); Y = lerp(Y, 0, k4); }
    else { X = lerp(0, 20, k1); S = lerp(1, .8, k1); X = lerp(X, -16, k2); S = lerp(S, 2.3, k2); X = lerp(X, 20, k3); S = lerp(S, .8, k3); X = lerp(X, 0, k4); S = lerp(S, .95, k4); }
    ring.style.transform = 'translate3d(calc(-50% + ' + X + 'vw),calc(-50% + ' + Y + 'vh),0) scale(' + S + ')';
    ch.forEach(function (q) {
      var i = seg(p, q.a, q.a + .06), o = seg(p, q.b - .06, q.b), v = i * (1 - o);
      q.el.style.opacity = v;
      q.el.style.transform = (mob ? '' : 'translateY(-50%) ') + 'translate3d(0,' + ((1 - i) * 28 - o * 28) + 'px,0)';
      q.el.style.pointerEvents = v > .5 ? 'auto' : 'none';
    });
    var g = seg(p, .88, .97); fin.style.opacity = g; specs.style.opacity = g;
  }

  // the page scrolls natively; the animation follows it with a soft lag, so wheel steps turn into one continuous motion
  function loop() {
    var d = target - sp; sp += d * (reduce ? 1 : .11);
    if (Math.abs(d) < .0004) sp = target;
    render(sp);
    if (sp !== target || dirty) requestAnimationFrame(loop); else running = false;
  }
  function kick() { target = progress(); if (!running) { running = true; requestAnimationFrame(loop); } }
  function resize() {
    mob = innerWidth < 760;
    var b = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr); dirty = true; kick();
  }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', resize);
  setInterval(function () { if (dirty && !running) kick(); }, 120);
  resize(); sp = target = progress(); render(sp);
})();
