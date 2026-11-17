/* Horizon Atlas : préchargeur, plan-séquence de la cour (profondeur WebGL pilotée par le défilement), valeurs, parcours. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = W.matchMedia("(max-width: 760px)").matches;
  const fine = W.matchMedia("(pointer: fine)").matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const HA = (W.HA = {});

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* ---------- Lenis ---------- */
  function initLenis() {
    if (reduce || !W.Lenis) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    HA.lenis = lenis;
  }
  function scrollTo(target, opts) {
    if (HA.lenis) HA.lenis.scrollTo(target, opts);
    else W.scrollTo({ top: typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY, behavior: reduce ? "auto" : "smooth" });
  }

  // Porte d'entrée, sous HORIZON ATLAS, en coordonnées de l'image (0 à 1).
  const FOCUS = [0.368, 0.52];
  /* Origine de la poussée de caméra : la porte, là où elle tombe à l'écran */
  function aimCamera() {
    const vw = W.innerWidth, vh = W.innerHeight;
    const fx = parseFloat(getComputedStyle(H).getPropertyValue("--fx")) || 0.5;
    const bw = Math.max(vw, vh * 1.791), bh = Math.max(vh, vw / 1.791);
    const x = vw / 2 - bw * fx + FOCUS[0] * bw, y = vh / 2 - bh / 2 + FOCUS[1] * bh;
    $("#filmCam").style.transformOrigin = `${x}px ${y}px`;
    const g = $("#filmGlow"); g.style.left = x + "px"; g.style.top = y + "px";
  }

  /* ---------- Photo en profondeur (WebGL brut, sans bibliothèque) ----------
     La carte de profondeur fait avancer les arcades proches plus vite que l'arche du fond :
     un vrai travelling avant, à partir d'une seule photo. */
  function DepthGL(canvas, imgUrl, depthUrl) {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) return null;
    const vs = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}";
    const fs = [
      "precision mediump float;varying vec2 v;uniform sampler2D t,d;uniform float z,k;uniform vec2 m,f;",
      "void main(){",
      " float dp=texture2D(d,v).r;",
      " vec2 q=v-f;",
      " float s=1.+z*(.6+.7*dp);",                // le proche grandit plus vite que le fond
      " vec2 uv=f+q/s;",
      " uv+=m*(dp-.35)*k;",                       // profondeur à la souris
      " float d2=texture2D(d,uv).r;",
      " uv=f+q/(1.+z*(.6+.7*d2))+m*(d2-.35)*k;",  // seconde passe : bords plus propres
      " vec3 c=texture2D(t,clamp(uv,.001,.999)).rgb;",
      " gl_FragColor=vec4(c,1.);}",
    ].join("");
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    const uz = U("z"), uk = U("k"), um = U("m"), uf = U("f");
    gl.uniform1i(U("t"), 0); gl.uniform1i(U("d"), 1);
    gl.uniform2f(uf, FOCUS[0], FOCUS[1]); // la porte sous le nom de l'école
    gl.uniform1f(uk, mobile ? 0 : 0.018);
    function tex(unit, img) {
      const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    }
    const load = (u) => new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const st = { z: 0, mx: 0, my: 0, tx: 0, ty: 0, ok: false };
    let dirty = true;
    /* Résolution dynamique : densité réduite pendant le défilement (0,67 sur ordinateur, 0,8 sur téléphone),
       pleine densité 180 ms après l'arrêt (400 ms au doigt, pour ne pas réallouer le canvas entre deux glissés). Au repos l'image est identique. */
    let low = false, movedAt = 0, lastY;
    function size() {
      const full = Math.min(W.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      const dpr = low ? Math.min(full, mobile ? 0.8 : 0.67) : full;
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); dirty = true; }
    }
    function render() {
      if (!st.ok) return;
      const y = W.scrollY, now = performance.now(); /* lecture sans mise en page */
      if (y !== lastY) { if (lastY !== undefined && !low) { low = true; size(); } lastY = y; movedAt = now; }
      else if (low && now - movedAt > (mobile ? 400 : 180)) { low = false; size(); }
      st.mx += (st.tx - st.mx) * 0.06; st.my += (st.ty - st.my) * 0.06;
      if (Math.abs(st.tx - st.mx) > 1e-4 || Math.abs(st.ty - st.my) > 1e-4) dirty = true;
      if (!dirty) return;
      gl.uniform1f(uz, st.z); gl.uniform2f(um, st.mx, st.my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); dirty = false;
    }
    const api = {
      ready: Promise.all([load(imgUrl), load(depthUrl)]).then(([a, b]) => {
        tex(0, a); tex(1, b); size(); st.ok = true; dirty = true; render(); return true;
      }).catch(() => false),
      set z(v) { if (v !== st.z) { st.z = v; dirty = true; } },
      mouse(x, y) { st.tx = x; st.ty = y; },
      size, render,
    };
    W.addEventListener("resize", size);
    return api;
  }

  /* ---------- Séquence d'images (si une vidéo est déposée dans assets/seq/) ---------- */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.dead = !count; this.onload = null;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8, 4, 2, 1].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order; this.asked = new Set(); this.want = 0;
    }
    src(i) { return this.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp"; }
    start() { for (let k = 0; k < 5; k++) this.next(); }
    /* D'abord les images autour de la position courante, puis les images clés dans l'ordre prévu. */
    pick() {
      for (let d = 0; d <= 10; d++) for (const k of [this.want + d, this.want - d]) if (k >= 0 && k < this.count && !this.asked.has(k)) return k;
      while (this.queue.length) { const k = this.queue.shift(); if (!this.asked.has(k)) return k; }
      return -1;
    }
    next() {
      const i = this.pick(); if (i < 0) return;
      this.asked.add(i);
      const im = new Image();
      im.decoding = "async";
      /* Image gardée décodée avant d'être dessinée : aucun décodage pendant le défilement. */
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { this.imgs[i] = im; if (this.onload) this.onload(i); this.next(); }); };
      im.onerror = () => this.next();
      im.src = this.src(i);
    }
    get(i) {
      if (this.imgs[i]) return this.imgs[i];
      for (let d = 1; d < this.count; d++) { if (this.imgs[i - d]) return this.imgs[i - d]; if (this.imgs[i + d]) return this.imgs[i + d]; }
      return null;
    }
  }

  /* ---------- Plan-séquence ---------- */
  const film = $("#film");
  let depth = null;
  const seq = new Seq(mobile ? film.dataset.seqM : film.dataset.seqD, +(mobile ? film.dataset.countM : film.dataset.countD) || 0);
  const cv = $("#filmCv"), ctx = cv.getContext("2d");
  const frame = { f: 0 };
  /* Densité plafonnée (1,5 ordinateur, 2 téléphone) et jamais au-delà des pixels de l'image source. */
  const SRC = mobile ? [406, 720] : [1280, 720];
  let drawnImg = null;
  function sizeSeq() {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = Math.max(0.5, Math.min(W.devicePixelRatio || 1, mobile ? 2 : 1.5, Math.min(SRC[0] / w, SRC[1] / h)));
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (cw === cv.width && Math.abs(ch - cv.height) < 160 * dpr) return;
    cv.width = cw; cv.height = ch; drawnImg = null; drawSeq();
  }
  function drawSeq() {
    if (seq.dead) return;
    const fi = clamp(Math.round(frame.f), 0, seq.count - 1); seq.want = fi;
    const img = seq.get(fi); if (!img || img === drawnImg) return;
    drawnImg = img;
    const cw = cv.width, ch = cv.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  seq.onload = (i) => { if (Math.abs(i - frame.f) < 6) drawSeq(); };

  function filmTimeline() {
    const hasSeq = !seq.dead;
    const z = { v: 0 };
    const rails = $$("[data-rail]"); let railOn = -1;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.26 ? 0 : p < 0.52 ? 1 : 2;
          if (on !== railOn) { railOn = on; rails.forEach((s) => s.classList.toggle("on", +s.dataset.rail === on)); }
        },
      },
    });
    tl.to({}, { duration: 1 }, 0);

    // Travelling avant : la profondeur WebGL, plus une poussée de caméra vers l'arche.
    tl.to(z, { v: 1, duration: 0.5, ease: "power1.inOut", onUpdate: () => { if (depth) { depth.z = z.v * (mobile ? 0.5 : 0.7); depth.render(); } } }, 0.02);
    tl.fromTo("#filmCam", { scale: 1 }, { scale: mobile ? 1.5 : 1.8, duration: 0.42, ease: "power1.in" }, 0.02);
    tl.to("#filmCam", { scale: mobile ? 3 : 3.6, duration: 0.12, ease: "power2.in" }, 0.44);

    tl.to("#filmCue", { autoAlpha: 0, duration: 0.025 }, 0);
    tl.to("#filmHero", { y: -90, scale: 1.06, autoAlpha: 0, duration: 0.075, ease: "power1.in" }, 0.004);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.06);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0.02);

    [[0.08, 0.24], [0.28, 0.44], [0.6, 0.8]].forEach(([a, b], k) => {
      const el = $(`[data-ch="${k}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 44, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.055, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -44, scale: 1.1, duration: 0.05, ease: "power1.in" }, b - 0.05);
    });

    // La lumière de la classe envahit le cadre, puis la phrase de fin arrive.
    // La porte s'ouvre sur la lumière, et la lumière devient l'allée de la bibliothèque.
    tl.fromTo("#filmGlow", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.7, duration: 0.12, ease: "power2.in" }, 0.42);
    if (hasSeq) {
      tl.fromTo(cv, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.53);
      tl.to(frame, { f: seq.count - 1, duration: 0.4, onUpdate: drawSeq }, 0.53);
      tl.to("#filmGlow", { opacity: 0, duration: 0.07 }, 0.55);
      tl.fromTo(cv, { scale: 1.12 }, { scale: 1, duration: 0.2, ease: "power2.out" }, 0.53);
    }
    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.84);
    tl.to("#filmDim", { opacity: 1, duration: 0.1 }, 0.84);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, ease: "power2.out" }, 0.87);
  }

  function initDepth() {
    if (reduce) return;
    const c = $("#filmGl");
    depth = DepthGL(c, mobile ? "assets/hero-m.webp" : "assets/hero.webp", "assets/hero-depth.jpg");
    if (!depth) return;
    depth.ready.then((ok) => {
      if (!ok) { depth = null; return; }
      c.classList.add("on");
      gsap.ticker.add(depth.render);
    });
    if (fine) W.addEventListener("pointermove", (e) => { if (depth) depth.mouse((e.clientX / W.innerWidth - 0.5) * 2, (e.clientY / W.innerHeight - 0.5) * 2); }, { passive: true });
  }

  /* ---------- Valeurs : un mot par écran ---------- */
  function values() {
    const vals = $$(".val"), imgs = $$(".vals__media img"), dots = $$(".vals__dots i");
    let cur = -1;
    function show(i) {
      if (i === cur) return;
      const prevI = cur; cur = i;
      vals.forEach((v, k) => v.classList.toggle("is-on", k === i));
      imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
      if (reduce) return;
      const v = vals[i], dir = prevI < i ? 1 : -1;
      gsap.fromTo($(".val__w", v), { yPercent: 70 * dir, opacity: 0, filter: "blur(12px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.1, ease: "expo.out", overwrite: true });
      gsap.fromTo([$(".val__n", v), $(".val__p", v)], { y: 24 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.12, stagger: 0.06, ease: "power3.out", overwrite: true });
      gsap.fromTo(imgs[i], { scale: 1.16 }, { scale: 1.04, duration: 2.4, ease: "power2.out", overwrite: true });
    }
    show(0);
    if (reduce) return;
    ScrollTrigger.create({
      trigger: ".vals", start: "top top", end: "bottom bottom",
      onUpdate: (st) => show(clamp(Math.floor(st.progress * vals.length), 0, vals.length - 1)),
    });
  }

  /* ---------- Texte qui s'allume au défilement ---------- */
  const wordsTweens = [];
  function lightWords() {
    wordsTweens.forEach((t) => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    wordsTweens.length = 0;
    $$("[data-words]").forEach((p) => {
      // On garde les balises <em> : on découpe chaque nœud texte en mots.
      const walk = (node) => Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = D.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) frag.appendChild(D.createTextNode(w));
            else { const s = D.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) walk(n);
      });
      walk(p);
      if (reduce) return;
      wordsTweens.push(gsap.to($$(".w", p), { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: 0.4 } }));
    });
  }

  /* ---------- Apparitions ---------- */
  function reveals() {
    if (reduce) return;
    // Transmission : la classe s'ouvre en arche.
    gsap.fromTo(".pass__fig", { clipPath: "inset(18% 22% 0% 22% round 999px 999px 0 0)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)", ease: "none", scrollTrigger: { trigger: ".pass", start: "top 85%", end: "center 55%", scrub: 0.4 } });
    gsap.fromTo("#passImg", { scale: 1.3, yPercent: -6 }, { scale: 1.02, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".pass", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.from(".pass__p", { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".pass__p", start: "top 90%" } });

    // Parcours : quatre arches qui montent, comme quatre âges.
    gsap.from(".path__head > *", { y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".path__head", start: "top 85%" } });
    $$(".cyc").forEach((c, i) => {
      const fig = $(".cyc__fig", c);
      gsap.fromTo(fig, { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0 0)", duration: 1.6, delay: mobile ? 0 : i * 0.12, ease: "expo.out", scrollTrigger: { trigger: mobile ? c : ".path__list", start: "top 82%" } });
      gsap.fromTo($("img", fig), { scale: 1.35 }, { scale: 1, duration: 2.2, delay: mobile ? 0 : i * 0.12, ease: "expo.out", scrollTrigger: { trigger: mobile ? c : ".path__list", start: "top 82%" } });
      gsap.from($$(".cyc__age, .cyc__h, .cyc__p", c), { y: 24, autoAlpha: 0, duration: 1, stagger: 0.07, delay: mobile ? 0.1 : 0.3 + i * 0.12, ease: "power3.out", scrollTrigger: { trigger: mobile ? c : ".path__list", start: "top 82%" } });
      if (!mobile) gsap.to(c, { y: (i % 2 ? -1 : 1) * 40, ease: "none", scrollTrigger: { trigger: ".path", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });

    $$(".enrol__intro > *, .wizard").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.fromTo(".foot__bg img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
    gsap.fromTo(".foot__mark", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  /* Vidéo de la transmission : elle ne joue que lorsqu'elle est à l'écran */
  function passVideo() {
    const v = $("#passImg"); if (!v || !("IntersectionObserver" in W)) return;
    if (reduce) { v.preload = "metadata"; return; }
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { rootMargin: "200px 0px" }).observe(v);
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#valeurs", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      const t = id === "#" || id === "#top" ? 0 : $(id);
      /* Décalage de l'en-tête fixe, lu au clic. */
      if (t !== null) scrollTo(t, { duration: 1.2, offset: t === 0 ? 0 : -Math.round(nav.offsetHeight) });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo("#filmBox", { scale: 1.12 }, { scale: 1, duration: 2.8, ease: "expo.out" }, 0);
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.25);
    tl.fromTo(".film__hero > [data-in]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0.55);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.7);
    return tl;
  }

  /* ---------- Démarrage ---------- */
  async function boot() {
    const bar = $("#loaderBar");
    const stillImg = $("#filmStill img");
    const stillReady = stillImg.complete && stillImg.naturalWidth ? Promise.resolve() : new Promise((r) => { stillImg.addEventListener("load", r, { once: true }); stillImg.addEventListener("error", r, { once: true }); });
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    gsap.to(bar, { scaleX: 0.6, duration: 1.2, ease: "power2.out" });
    aimCamera(); W.addEventListener("resize", aimCamera);
    initDepth();
    await Promise.race([Promise.all([stillReady, D.fonts ? D.fonts.ready : null, depth ? depth.ready : null]), timeout(2600)]);
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await timeout(380);

    initLenis();
    H.classList.add("ready");
    intro();
    if (!reduce) {
      filmTimeline();
      if (!seq.dead) { sizeSeq(); W.addEventListener("resize", sizeSeq); seq.start(); }
    }
    values(); lightWords(); reveals(); passVideo(); navAndLinks();
    if (W.I18N) W.I18N.on(() => { lightWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);

  }

  boot();
})();
