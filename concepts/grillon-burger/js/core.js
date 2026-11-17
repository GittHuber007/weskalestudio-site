/* Moteur commun des démos Weskale Studio, lot 2.
   Sans dépendance obligatoire : chaque effet a un repli. Si gsap, Lenis ou three
   manquent, le contenu reste lisible et les photos restent affichées. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOUCH = window.matchMedia("(pointer: coarse)").matches;
  var SMALL = window.matchMedia("(max-width: 760px)").matches;
  var W = (window.W = { RM: RM, TOUCH: TOUCH, SMALL: SMALL, lenis: null });
  doc.classList.add("js");
  if (RM) doc.classList.add("rm");
  if (TOUCH) doc.classList.add("touch");

  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  W.hasGsap = hasGsap;

  /* ---------- Découpe du texte en mots et en lettres ---------- */
  W.split = function (el, chars) {
    if (!el || el.dataset.splitDone) return el;
    el.dataset.splitDone = "1";
    var walk = function (node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (k) {
        if (k.nodeType === 3) {
          var parts = k.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var wi = document.createElement("span"); wi.className = "wi";
            if (chars) {
              Array.from(p).forEach(function (ch) {
                var c = document.createElement("span"); c.className = "c"; c.textContent = ch; wi.appendChild(c);
              });
            } else wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, k);
        } else if (k.nodeType === 1 && k.tagName !== "BR") walk(k);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    Array.prototype.forEach.call(el.querySelectorAll(".w"), function (w) { w.setAttribute("aria-hidden", "true"); });
    return el;
  };

  /* ---------- Défilement fluide ---------- */
  W.initScroll = function () {
    if (RM || typeof window.Lenis === "undefined") return null;
    var lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    W.lenis = lenis;
    /* Pendant le défilement, les flous d'arrière-plan sont coupés (l'aspect au repos ne change pas). */
    var idleT = 0;
    lenis.on("scroll", function () {
      if (!doc.classList.contains("is-scrolling")) doc.classList.add("is-scrolling");
      clearTimeout(idleT); idleT = setTimeout(function () { doc.classList.remove("is-scrolling"); }, 160);
    });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var nav = document.querySelector(".nav");
      lenis.scrollTo(t, { offset: nav ? -nav.offsetHeight : 0, duration: 1.4 });
    });
    return lenis;
  };
  W.stop = function () { if (W.lenis) W.lenis.stop(); else document.body.style.overflow = "hidden"; };
  W.start = function () { if (W.lenis) W.lenis.start(); else document.body.style.overflow = ""; };

  /* ---------- Préchargeur : compte les vraies images ---------- */
  W.preload = function (opts) {
    opts = opts || {};
    var loader = document.querySelector(".loader");
    var count = loader && loader.querySelector("[data-count]");
    var bar = loader && loader.querySelector("[data-bar]");
    var urls = (opts.urls || []).filter(Boolean);
    var done = 0, shown = 0, finished = false;
    var t0 = performance.now();
    var minTime = RM ? 200 : (opts.min || 1400);
    return new Promise(function (resolve) {
      var finish = function () {
        if (finished) return; finished = true;
        var close = function () {
          if (!loader) return resolve();
          if (hasGsap && !RM) {
            gsap.to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut", onComplete: function () { loader.remove(); } });
            setTimeout(resolve, 380);
          } else { loader.remove(); resolve(); }
        };
        var wait = Math.max(0, minTime - (performance.now() - t0));
        setTimeout(close, wait);
      };
      var tick = function () {
        var target = urls.length ? (done / urls.length) * 100 : 100;
        var elapsed = Math.min(1, (performance.now() - t0) / minTime);
        var v = Math.min(target, elapsed * 100);
        shown += (v - shown) * 0.18;
        if (count) count.textContent = String(Math.round(shown)).padStart(3, "0");
        if (bar) bar.style.transform = "scaleX(" + (shown / 100) + ")";
        if (!finished || shown < 99) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      if (!urls.length) finish();
      urls.forEach(function (u) {
        var im = new Image();
        im.onload = im.onerror = function () { done++; if (done >= urls.length) finish(); };
        im.src = u;
      });
      setTimeout(finish, opts.max || 4500); // filet : jamais bloqué sur le préchargeur
    });
  };

  /* ---------- Curseur personnalisé ---------- */
  W.cursor = function () {
    if (TOUCH || RM) return;
    var c = document.createElement("div"); c.className = "cursor";
    c.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><em class="cursor__label"></em></span>';
    document.body.appendChild(c);
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    var label = c.querySelector(".cursor__label");
    addEventListener("pointermove", function (e) { x = e.clientX; y = e.clientY; c.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", function () { c.classList.remove("on"); });
    var loop = function () {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      c.style.setProperty("--x", x + "px"); c.style.setProperty("--y", y + "px");
      c.style.setProperty("--rx", rx + "px"); c.style.setProperty("--ry", ry + "px");
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-cursor], a, button, input, select, textarea, label");
      c.classList.toggle("hover", !!t);
      var txt = t && t.getAttribute("data-cursor");
      c.classList.toggle("label", !!txt);
      label.textContent = txt || "";
    });
  };

  /* ---------- Boutons magnétiques ---------- */
  W.magnetic = function (sel) {
    if (TOUCH || RM) return;
    document.querySelectorAll(sel || "[data-magnetic]").forEach(function (el) {
      var inner = el.querySelector("span") || el;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * 0.28 + "px," + dy * 0.36 + "px)";
        inner.style.transform = "translate(" + dx * 0.12 + "px," + dy * 0.14 + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; inner.style.transform = ""; });
    });
  };

  /* ---------- Cartes qui pivotent en perspective ---------- */
  W.tilt = function (sel, max) {
    if (TOUCH || RM) return;
    max = max || 8;
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", (-py * max).toFixed(2) + "deg");
        el.style.setProperty("--ry", (px * max).toFixed(2) + "deg");
        el.style.setProperty("--mx", ((px + 0.5) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((py + 0.5) * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  };

  /* ---------- Révélations au défilement ---------- */
  W.reveals = function () {
    if (!hasGsap || !window.ScrollTrigger) { doc.classList.add("no-anim"); return; }
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      var kind = el.getAttribute("data-reveal");
      if (kind === "words" || kind === "chars") {
        W.split(el, kind === "chars");
        var parts = el.querySelectorAll(kind === "chars" ? ".c" : ".wi");
        if (RM) return;
        gsap.fromTo(parts, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: "expo.out", stagger: kind === "chars" ? 0.018 : 0.045,
          scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      } else if (kind === "img") {
        if (RM) return;
        gsap.fromTo(el, { clipPath: "inset(18% 12% 18% 12%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "expo.out", duration: 1.6,
          scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        var im = el.querySelector("img");
        if (im) gsap.fromTo(im, { scale: 1.35 }, { scale: 1, ease: "expo.out", duration: 1.8, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      } else {
        if (RM) return;
        gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      }
    });
    document.querySelectorAll("[data-speed]").forEach(function (el) {
      if (RM) return;
      var s = parseFloat(el.getAttribute("data-speed"));
      gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });
    document.querySelectorAll("[data-count-to]").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-count-to"));
      var dec = (el.getAttribute("data-count-to").split(".")[1] || "").length;
      if (RM) { el.textContent = to.toFixed(dec); return; }
      var o = { v: 0 };
      gsap.to(o, { v: to, duration: 2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
    });
  };

  /* ---------- Navigation qui se transforme au défilement ---------- */
  W.nav = function (sel) {
    var nav = document.querySelector(sel || ".nav");
    if (!nav) return;
    var last = 0;
    var on = function (y) {
      nav.classList.toggle("nav--solid", y > 60);
      nav.classList.toggle("nav--hide", y > 400 && y > last + 2);
      if (y < last - 2) nav.classList.remove("nav--hide");
      last = y;
    };
    if (W.lenis) W.lenis.on("scroll", function (l) { on(l.scroll); });
    else addEventListener("scroll", function () { on(scrollY); }, { passive: true });
  };

  /* ---------- Séquence d'images pilotée par le défilement ----------
     Fenêtre glissante : on charge autour de l'image demandée, on garde des ancres
     régulières pour qu'un défilement rapide trouve toujours une image proche,
     et on libère le reste. Si la séquence manque, repli sur des photos fixes
     en fondu, puis sur une image de secours. */
  W.Sequence = function (canvas, o) {
    this.c = canvas; this.ctx = canvas.getContext("2d");
    this.o = o;
    var mob = SMALL || TOUCH;
    this.dir = mob && o.dirMobile ? o.dirMobile : o.dir;
    this.n = mob && o.countMobile ? o.countMobile : o.count;
    this.imgs = new Array(this.n || 0);
    this.state = new Array(this.n || 0).fill(0); // 0 rien, 1 en cours, 2 prête, 3 échec
    this.win = mob ? 14 : 22;
    this.anchorEvery = mob ? 6 : 8;
    this.loading = 0; this.maxLoading = 6;
    this.cur = 0; this.p = 0; this.fails = 0;
    this.stills = (o.stills || []).map(function (u) { var i = new Image(); i.src = u; return i; });
    this.mode = this.n ? "seq" : "stills";
    var self = this;
    this.resize = function () {
      var r = canvas.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * d)); canvas.height = Math.max(1, Math.round(r.height * d));
      self.draw(true);
    };
    addEventListener("resize", this.resize);
    this.stills.forEach(function (i) { i.onload = function () { self.draw(true); }; });
    this.resize();
    if (this.mode === "seq") this.pump();
  };
  W.Sequence.prototype.file = function (k) { return this.dir + "f_" + String(k + 1).padStart(3, "0") + "." + (this.o.ext || "webp"); };
  W.Sequence.prototype.load = function (k) {
    if (k < 0 || k >= this.n || this.state[k]) return;
    var self = this, im = new Image();
    this.state[k] = 1; this.loading++; this.imgs[k] = im;
    im.decoding = "async";
    im.onload = function () { self.loading--; self.state[k] = 2; if (Math.abs(k - self.cur) < 6) self.draw(); self.pump(); };
    im.onerror = function () {
      self.loading--; self.state[k] = 3; self.imgs[k] = null; self.fails++;
      if (k === 0 || self.fails > 6) { self.mode = "stills"; self.draw(true); }
      self.pump();
    };
    im.src = this.file(k);
  };
  W.Sequence.prototype.pump = function () {
    if (this.mode !== "seq") return;
    var c = this.cur, n = this.n;
    var order = [0];
    for (var d = 0; d <= this.win; d++) { order.push(c + d); if (d) order.push(c - Math.ceil(d / 2)); }
    for (var a = 0; a < n; a += this.anchorEvery) order.push(a);
    order.push(n - 1);
    for (var i = 0; i < order.length && this.loading < this.maxLoading; i++) this.load(order[i]);
    // libère ce qui est loin, sauf les ancres
    for (var k = 0; k < n; k++) {
      if (this.state[k] === 2 && Math.abs(k - c) > this.win * 2 && k % this.anchorEvery && k !== n - 1) {
        this.imgs[k].src = ""; this.imgs[k] = null; this.state[k] = 0;
      }
    }
  };
  W.Sequence.prototype.set = function (p) {
    this.p = Math.max(0, Math.min(1, p));
    if (this.mode === "seq") {
      var k = Math.round(this.p * (this.n - 1));
      if (k !== this.cur) { this.cur = k; this.pump(); }
    }
    this.draw();
  };
  W.Sequence.prototype.cover = function (im, alpha, zoom) {
    var cw = this.c.width, ch = this.c.height, iw = im.naturalWidth, ih = im.naturalHeight;
    if (!iw) return;
    var fit = this.o.fit === "contain" ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
    var s = fit * (zoom || 1);
    var fx = this.o.focusX == null ? 0.5 : this.o.focusX;
    var w = iw * s, h = ih * s, x = (cw - w) * fx, y = (ch - h) / 2;
    this.ctx.globalAlpha = alpha == null ? 1 : alpha;
    this.ctx.drawImage(im, x, y, w, h);
    this.ctx.globalAlpha = 1;
  };
  W.Sequence.prototype.draw = function () {
    var ctx = this.ctx;
    if (this.mode === "seq") {
      var best = null;
      for (var d = 0; d < this.n; d++) {
        var a = this.cur - d, b = this.cur + d;
        if (a >= 0 && this.state[a] === 2) { best = this.imgs[a]; break; }
        if (b < this.n && this.state[b] === 2) { best = this.imgs[b]; break; }
      }
      if (best) { ctx.clearRect(0, 0, this.c.width, this.c.height); this.cover(best, 1); return; }
    }
    // repli : photos fixes en fondu, avec un lent zoom
    var st = this.stills.filter(function (i) { return i.complete && i.naturalWidth; });
    if (!st.length) return;
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (st.length === 1) { this.cover(st[0], 1, 1 + this.p * 0.18); return; }
    var f = this.p * (st.length - 1), i0 = Math.floor(f), t = f - i0;
    var i1 = Math.min(st.length - 1, i0 + 1);
    this.cover(st[i0], 1, 1 + t * 0.06);
    if (t > 0) this.cover(st[i1], t, 1.06 - t * 0.06);
  };

  /* ---------- Photo en WebGL : profondeur à la souris, ondulation, fondu par shader ----------
     Uniquement des photos sur un plan. La profondeur vient d'une carte de
     luminance floutée de la photo elle-même : le sujet éclairé avance, le fond recule. */
  var VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  var FRAG = [
    "precision highp float;",
    "uniform sampler2D uA; uniform sampler2D uB; uniform vec2 uRes; uniform vec2 uSA; uniform vec2 uSB;",
    "uniform vec2 uMouse; uniform float uHover; uniform float uTime; uniform float uMix; uniform float uVel;",
    "uniform float uDepth; uniform float uRipple; uniform float uZoom; uniform vec2 uFocus;",
    "varying vec2 vUv;",
    "vec2 coverUv(vec2 uv, vec2 s){ float ra = uRes.x/uRes.y; float ri = s.x/s.y;",
    "  vec2 sc = ra > ri ? vec2(1.0, ri/ra) : vec2(ra/ri, 1.0);",
    "  vec2 off = (1.0 - sc) * uFocus; return (uv * sc + off - 0.5) / uZoom + 0.5; }",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }",
    "vec4 grab(sampler2D t, vec2 s, vec2 uv){",
    "  vec2 c = coverUv(uv, s);",
    "  float dep = dot(texture2D(t, c, 5.0).rgb, vec3(0.299,0.587,0.114));",
    "  vec2 m = (uMouse - 0.5);",
    "  c -= m * (dep - 0.35) * uDepth;",
    "  float d = distance(uv * vec2(uRes.x/uRes.y,1.0), uMouse * vec2(uRes.x/uRes.y,1.0));",
    "  float w = sin(d * 38.0 - uTime * 3.2) * smoothstep(0.42, 0.0, d) * uHover * uRipple;",
    "  c += normalize(uv - uMouse + 1e-4) * w * 0.006;",
    "  c.y += sin(uv.x * 3.1416) * uVel * 0.03;",
    "  float sh = uVel * 0.006 + uHover * uRipple * 0.0015;",
    "  return vec4(texture2D(t, c + vec2(sh,0.0)).r, texture2D(t, c).g, texture2D(t, c - vec2(sh,0.0)).b, 1.0); }",
    "void main(){",
    "  vec4 a = grab(uA, uSA, vUv);",
    "  if (uMix <= 0.001) { gl_FragColor = a; return; }",
    "  float n = noise(vUv * 6.0 + uTime * 0.2) * 0.5 + noise(vUv * 18.0) * 0.5;",
    "  float edge = smoothstep(uMix - 0.18, uMix + 0.02, n * 0.8 + vUv.y * 0.2);",
    "  vec2 uvB = vUv + (1.0 - uMix) * vec2(0.0, 0.05) * (1.0 - edge);",
    "  vec4 b = grab(uB, uSB, uvB);",
    "  gl_FragColor = mix(b, a, edge * (1.0 - step(0.999, uMix)));",
    "}"].join("\n");

  W.GLPhoto = function (host, o) {
    this.host = host; this.o = o || {};
    this.ok = false;
    if (typeof window.THREE === "undefined") return;
    var T = window.THREE;
    try {
      var r = new T.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch (e) { return; }
    this.r = r; r.setPixelRatio(Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : 2));
    r.outputColorSpace = T.LinearSRGBColorSpace;
    this.scene = new T.Scene(); this.cam = new T.Camera();
    this.loader = new T.TextureLoader();
    this.u = {
      uA: { value: null }, uB: { value: null }, uSA: { value: new T.Vector2(1, 1) }, uSB: { value: new T.Vector2(1, 1) },
      uRes: { value: new T.Vector2(1, 1) }, uMouse: { value: new T.Vector2(0.5, 0.5) }, uHover: { value: 0 },
      uTime: { value: 0 }, uMix: { value: 0 }, uVel: { value: 0 },
      uDepth: { value: RM ? 0 : (o.depth == null ? 0.035 : o.depth) }, uRipple: { value: RM ? 0 : (o.ripple == null ? 1 : o.ripple) },
      uZoom: { value: o.zoom || 1.06 }, uFocus: { value: new T.Vector2(o.focusX == null ? 0.5 : o.focusX, 0.5) }
    };
    var mat = new T.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, depthTest: false });
    this.scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));
    var cv = r.domElement; cv.className = "gl"; host.appendChild(cv);
    this.mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }; this.hover = 0; this.thover = 0;
    this.visible = true; this.dirty = true; this.vel = 0;
    var self = this;
    var target = o.mouseTarget || host;
    target.addEventListener("pointermove", function (e) {
      var b = host.getBoundingClientRect();
      self.mouse.tx = (e.clientX - b.left) / b.width; self.mouse.ty = 1 - (e.clientY - b.top) / b.height;
      self.thover = 1;
    }, { passive: true });
    target.addEventListener("pointerleave", function () { self.thover = 0; self.mouse.tx = 0.5; self.mouse.ty = 0.5; });
    new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; }).observe(host);
    this.size = function () { var b = host.getBoundingClientRect(); r.setSize(b.width, b.height, false); self.u.uRes.value.set(b.width, b.height); self.dirty = true; };
    addEventListener("resize", this.size); this.size();
    var t0 = performance.now();
    var loop = function () {
      requestAnimationFrame(loop);
      if (!self.visible || !self.u.uA.value) return;
      var m = self.mouse;
      m.x += (m.tx - m.x) * 0.06; m.y += (m.ty - m.y) * 0.06;
      self.hover += (self.thover - self.hover) * 0.05;
      self.u.uMouse.value.set(m.x, m.y); self.u.uHover.value = self.hover;
      self.u.uTime.value = (performance.now() - t0) / 1000;
      self.vel *= 0.9; self.u.uVel.value = self.vel;
      r.render(self.scene, self.cam);
    };
    if (W.lenis) W.lenis.on("scroll", function (l) { self.vel = Math.max(-1, Math.min(1, l.velocity / 60)); });
    this.ok = true;
    if (o.src) this.set(o.src, true);
    loop();
  };
  W.GLPhoto.prototype.tex = function (url, cb) {
    var T = window.THREE, self = this;
    this.cache = this.cache || {};
    if (this.cache[url]) return cb(this.cache[url]);
    this.loader.load(url, function (t) {
      t.colorSpace = T.NoColorSpace; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true;
      self.cache[url] = t; cb(t);
    });
  };
  W.GLPhoto.prototype.set = function (url, instant) {
    if (!this.ok) return;
    var self = this, u = this.u;
    this.tex(url, function (t) {
      var sz = new window.THREE.Vector2(t.image.width, t.image.height);
      if (instant || !u.uA.value || !W.hasGsap || RM) {
        u.uA.value = t; u.uSA.value = sz; u.uMix.value = 0; self.host.classList.add("gl-on"); return;
      }
      u.uB.value = t; u.uSB.value = sz;
      gsap.killTweensOf(u.uMix);
      u.uMix.value = 0.001;
      gsap.to(u.uMix, { value: 1, duration: 1.2, ease: "power2.inOut", onComplete: function () {
        u.uA.value = t; u.uSA.value = sz; u.uMix.value = 0; } });
    });
  };

  /* ---------- Marquee typographique ---------- */
  W.marquee = function (sel) {
    document.querySelectorAll(sel || "[data-marquee]").forEach(function (m) {
      var track = m.querySelector(".marquee__track");
      if (!track) return;
      track.innerHTML += track.innerHTML;
      if (RM || !W.hasGsap) return;
      var tw = gsap.to(track, { xPercent: -50, ease: "none", duration: parseFloat(m.getAttribute("data-marquee")) || 30, repeat: -1 });
      if (W.lenis) W.lenis.on("scroll", function (l) {
        gsap.to(tw, { timeScale: 1 + Math.min(4, Math.abs(l.velocity) / 8) * Math.sign(l.velocity || 1), duration: 0.3, overwrite: true });
      });
    });
  };

  /* ---------- Petit utilitaire de notification ---------- */
  W.toast = function (msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 2600);
  };
})();

/* Navigation claire ou sombre selon la section qu'elle survole */
window.W.navTheme = function (selDark) {
  var nav = document.querySelector(".nav");
  if (!nav || !window.ScrollTrigger) return;
  document.querySelectorAll(selDark).forEach(function (s) {
    ScrollTrigger.create({ trigger: s, start: "top 40px", end: "bottom 40px",
      onToggle: function (st) { nav.classList.toggle("nav--dark", st.isActive); } });
  });
};
