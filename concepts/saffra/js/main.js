/* Saffra : préchargeur, ouverture pilotée par le défilement (caméra sur la photo, vapeur en WebGL,
   ou séquence d'images si une vidéo est déposée), scènes vidéo, menu, navigation. */
(function () {
  "use strict";
  /* Classe is-scrolling pendant le defilement : les flous d'arriere-plan se mettent en pause (identique au repos) */
  (function () {
    let tm = 0;
    addEventListener("scroll", () => {
      if (!tm) document.documentElement.classList.add("is-scrolling");
      clearTimeout(tm);
      tm = setTimeout(() => { tm = 0; document.documentElement.classList.remove("is-scrolling"); }, 180);
    }, { passive: true });
  })();

  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = W.matchMedia("(max-width: 760px)");
  let mobile = mq.matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const APP = (W.SAFFRA = {});

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* Séquence d'images (si Ace dépose une vidéo) : chargement du plus grossier au plus fin */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.onload = null; this.dead = false;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8, 4, 2, 1].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order; this.want = 0; this.started = false;
    }
    src(i) { return this.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp"; }
    first() {
      return new Promise((res) => {
        const im = new Image();
        im.onload = () => { this.imgs[0] = im; res(true); };
        im.onerror = () => { this.dead = true; res(false); };
        im.src = this.src(0);
      });
    }
    start() { this.queue = this.queue.filter((i) => !this.imgs[i]); for (let k = 0; k < 6; k++) this.next(); }
    // Les images cles d'abord (la file), puis celles autour de la position courante des que le defilement avance
    pick() {
      const c = Math.round(this.want), q = this.queue;
      if (this.started) for (let d = 0; d <= 10; d++) for (const i of [c + d, c - d]) { const k = q.indexOf(i); if (k >= 0) return q.splice(k, 1)[0]; }
      return q.shift();
    }
    next() {
      if (!this.queue.length) return;
      const i = this.pick(), im = new Image();
      im.decoding = "async";
      const done = () => { this.imgs[i] = im; if (this.onload) this.onload(i); this.next(); };
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).then(done, done); };
      im.onerror = () => this.next();
      im.src = this.src(i);
    }
    get(i) {
      if (this.imgs[i]) return this.imgs[i];
      for (let d = 1; d < this.count; d++) { if (this.imgs[i - d]) return this.imgs[i - d]; if (this.imgs[i + d]) return this.imgs[i + d]; }
      return null;
    }
  }

  /* Lenis */
  function initLenis() {
    if (reduce || !W.Lenis) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    APP.lenis = lenis;
  }
  function scrollTo(target, opts) {
    if (APP.lenis) APP.lenis.scrollTo(target, opts);
    else W.scrollTo({ top: (typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY) + ((opts && opts.offset) || 0), behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- Ouverture ---------- */
  const film = $("#film"), stage = $(".film__stage"), cam = $("#filmCam"), stillImg = $("#filmStill img");
  const cv = $("#filmCv"), ctx = cv.getContext("2d");
  let seq = null;
  const frame = { f: 0 };
  let drawn = null;

  // Caméra : un point de la photo (coordonnées 0..1) amené à un point de l'écran, avec un zoom.
  // Plans : vue d'ensemble, couvercle de cuivre, glaçage au safran, gravure SAFFRA dans la terre.
  const SHOTS = {
    d: [{ fx: .62, fy: .5, s: 1, tx: .62, ty: .5 }, { fx: .575, fy: .2, s: 1.38, tx: .66, ty: .42 }, { fx: .8, fy: .5, s: 1.62, tx: .64, ty: .5 }, { fx: .552, fy: .6, s: 1.85, tx: .66, ty: .5 }],
    m: [{ fx: .72, fy: .5, s: 1, tx: .5, ty: .5 }, { fx: .58, fy: .2, s: 1.18, tx: .5, ty: .32 }, { fx: .8, fy: .5, s: 1.32, tx: .5, ty: .34 }, { fx: .55, fy: .6, s: 1.46, tx: .45, ty: .36 }],
  };
  const camState = { fx: 0, fy: 0, s: 1, tx: .5, ty: .5, mx: 0, my: 0 };
  const view = { X: 0, Y: 0, s: 1, ox: 0, oy: 0, iw: 1, ih: 1 };

  function coverBox() {
    const Wd = stage.clientWidth, Hd = stage.clientHeight;
    const nw = stillImg.naturalWidth || 2400, nh = stillImg.naturalHeight || 1340;
    const k = Math.max(Wd / nw, Hd / nh), iw = nw * k, ih = nh * k;
    const pos = parseFloat(getComputedStyle(stillImg).objectPosition) / 100;
    return { Wd, Hd, iw, ih, ox: (Wd - iw) * (isNaN(pos) ? .5 : pos), oy: (Hd - ih) * .5 };
  }
  function applyCam() {
    const b = coverBox(), s = camState.s;
    const px = b.ox + camState.fx * b.iw, py = b.oy + camState.fy * b.ih;
    let X = camState.tx * b.Wd - s * px + camState.mx, Y = camState.ty * b.Hd - s * py + camState.my;
    X = clamp(X, b.Wd - s * b.Wd, 0); Y = clamp(Y, b.Hd - s * b.Hd, 0);
    cam.style.transform = `translate3d(${X.toFixed(2)}px, ${Y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
    Object.assign(view, { X, Y, s, ox: b.ox, oy: b.oy, iw: b.iw, ih: b.ih, Wd: b.Wd, Hd: b.Hd });
  }

  function sizeCanvas() {
    const dpr = Math.min(W.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    drawn = null; draw();
  }
  function draw() {
    if (!seq) return;
    const i = clamp(Math.round(frame.f), 0, seq.count - 1);
    if (i !== seq.want) { seq.want = i; seq.started = true; }
    const img = seq.get(i);
    if (!img || img === drawn) return;
    const cw = cv.width, ch = cv.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) * (mobile ? .72 : .5), (ch - h) * .5, w, h);
    drawn = img;
  }

  /* Vapeur : un shader de bruit qui monte du plat, calé sur la photo et sur la caméra */
  const steam = (function () {
    const c = $("#steam");
    if (reduce || !c) return null;
    const gl = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;
uniform vec2 uRes;uniform float uQ;uniform vec2 uT;uniform float uS;uniform vec2 uO;uniform vec2 uIK;uniform float uTime;uniform float uAmt;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float plume(vec2 uv,vec2 src,float w,float hgt,float t,float seed){
  float up=src.y-uv.y; if(up<-.04)return 0.;
  float k=clamp(up/hgt,0.,1.);
  float sway=(fbm(vec2(up*2.6-t*.12,seed+t*.04))-.5)*.16*k+sin(up*8.-t*.7+seed)*.018*k;
  float dx=(uv.x-src.x-sway-k*.02)*1.79;
  float wd=w*(.3+1.6*k);
  float m=exp(-dx*dx/(wd*wd))*smoothstep(-.04,.05,up)*(1.-smoothstep(.45,1.,k));
  vec2 q=vec2(uv.x*1.79*6.,uv.y*6.+t*.32+seed);
  float d=fbm(q+vec2(fbm(q*.7-t*.06),fbm(q*.9+3.1))*1.8);
  return m*smoothstep(.38,.86,d);
}
void main(){
  vec2 fr=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uQ;
  vec2 uv=((fr-uT)/uS-uO)/uIK;
  float t=uTime;
  float a=plume(uv,vec2(.7,.43),.07,.48,t,0.)+.7*plume(uv,vec2(.79,.36),.05,.4,t*1.1,4.3)+.45*plume(uv,vec2(.63,.47),.04,.3,t*.9,8.1);
  a=clamp(a*uAmt,0.,1.)*.62;
  gl_FragColor=vec4(vec3(1.,.93,.8)*a,a);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["uRes", "uQ", "uT", "uS", "uO", "uIK", "uTime", "uAmt"].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
    const Q = mobile ? .5 : .55; // rendu à demi-résolution : la vapeur est floue par nature
    const st = { amt: .75, run: false, t0: performance.now() };
    function size() { c.width = Math.max(2, Math.round(c.clientWidth * Q)); c.height = Math.max(2, Math.round(c.clientHeight * Q)); gl.viewport(0, 0, c.width, c.height); }
    function frameDraw(now) {
      if (!st.run) return;
      gl.uniform2f(U.uRes, c.width, c.height); gl.uniform1f(U.uQ, Q);
      gl.uniform2f(U.uT, view.X, view.Y); gl.uniform1f(U.uS, view.s);
      gl.uniform2f(U.uO, view.ox, view.oy); gl.uniform2f(U.uIK, view.iw, view.ih);
      gl.uniform1f(U.uTime, (now - st.t0) / 1000); gl.uniform1f(U.uAmt, st.amt);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frameDraw);
    }
    size(); W.addEventListener("resize", size);
    return {
      st,
      play() { if (st.run) return; st.run = true; c.classList.add("on"); requestAnimationFrame(frameDraw); },
      stop() { st.run = false; },
    };
  })();

  function filmTimeline() {
    const useSeq = !!(seq && !seq.dead && seq.imgs[0]);
    const shots = mobile ? SHOTS.m : SHOTS.d;
    Object.assign(camState, shots[0]);
    if (!useSeq) { applyCam(); W.addEventListener("resize", () => { mobile = mq.matches; applyCam(); }); }
    if (useSeq) { gsap.set(cv, { opacity: 1 }); sizeCanvas(); W.addEventListener("resize", sizeCanvas); }
    if (steam && !useSeq) {
      steam.play();
      ScrollTrigger.create({ trigger: film, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? steam.play() : steam.stop()) });
    }

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.4 ? 0 : p < 0.64 ? 1 : 2;
          $$("[data-rail]").forEach((s) => s.classList.toggle("on", +s.dataset.rail === on));
        },
      },
    });
    tl.to({}, { duration: 1 }, 0);

    if (useSeq) {
      // La vidéo du tajine : la première image remplace tout de suite la photo, puis le couvercle se lève au défilement.
      gsap.set("#filmStill", { autoAlpha: 0 });
      tl.to(frame, { f: seq.count - 1, duration: 0.84, onUpdate: draw }, 0.02);
      tl.fromTo(cam, { scale: 1, transformOrigin: mobile ? "72% 50%" : "70% 55%" }, { scale: 1.08, duration: 0.9 }, 0.02);
    } else {
      const go = (shot, at, dur) => tl.to(camState, { ...shot, duration: dur, ease: "sine.inOut", onUpdate: applyCam }, at);
      go(shots[1], 0.05, 0.25);
      go(shots[2], 0.36, 0.24);
      go(shots[3], 0.62, 0.22);
      if (steam) tl.to(steam.st, { amt: 1.25, duration: 0.3 }, 0.32);
    }

    tl.to("#filmHero", { autoAlpha: 0, y: -40, duration: 0.07 }, 0.03);
    tl.to("#filmCue", { autoAlpha: 0, duration: 0.04 }, 0.02);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.08);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.84 }, 0.08);
    const chs = [[0.15, 0.36], [0.4, 0.6], [0.66, 0.82]];
    chs.forEach(([a, b], i) => {
      const el = `[data-ch="${i}"]`;
      tl.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -26, duration: 0.04, ease: "power2.in" }, b);
    });
    tl.to("#filmDim", { opacity: 0.74, duration: 0.07 }, 0.86);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.88);
    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.9);

    // Profondeur à la souris : la caméra suit très légèrement le pointeur.
    if (!mobile && !useSeq) {
      const qx = gsap.quickTo(camState, "mx", { duration: 1.4, ease: "power3.out", onUpdate: applyCam });
      const qy = gsap.quickTo(camState, "my", { duration: 1.4, ease: "power3.out", onUpdate: applyCam });
      W.addEventListener("pointermove", (e) => { qx((e.clientX / W.innerWidth - .5) * -18); qy((e.clientY / W.innerHeight - .5) * -12); }, { passive: true });
    }
  }

  /* Manifeste : les mots s'allument au défilement */
  let introTween = null;
  function introWords() {
    const p = $("#introText"); if (!p) return;
    if (introTween) { introTween.scrollTrigger && introTween.scrollTrigger.kill(); introTween.kill(); introTween = null; }
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = D.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) frag.appendChild(D.createTextNode(w));
            else { const s = D.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(p);
    if (reduce) return;
    introTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: 0.4 } });
  }

  /* Scènes vidéo : chargement à l'approche, lecture seulement à l'écran */
  function scenes() {
    $$(".scene").forEach((sc) => {
      const v = $(".scene__vid", sc), word = $(".scene__word", sc), cap = $(".scene__cap", sc);
      if (v && !reduce) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          if (e.isIntersecting) {
            if (!v.src) { v.src = v.dataset.src; v.preload = "auto"; }
            const p = v.play(); if (p && p.catch) p.catch(() => {});
          } else if (v.src) v.pause();
        }), { rootMargin: "30% 0px" });
        io.observe(sc);
      }
      if (reduce) return;
      gsap.fromTo($(".scene__media", sc), { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: sc, start: "top bottom", end: "bottom top", scrub: 0.4 } });
      const dir = sc.classList.contains("scene--atlas") ? -1 : 1;
      gsap.fromTo(word, { xPercent: 14 * dir }, { xPercent: -10 * dir, ease: "none", scrollTrigger: { trigger: sc, start: "top bottom", end: "bottom top", scrub: 0.4 } });
      gsap.from(cap.children, { y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: sc, start: "top 55%" } });
      gsap.fromTo(sc, { clipPath: "inset(8% 6% 0% 6% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: sc, start: "top bottom", end: "top 20%", scrub: 0.4 } });
    });
  }

  /* Menu : le plat actif suit le défilement et le survol */
  function menu() {
    const list = $("#menuList"), items = $$("li", list), figs = $$(".menu__fig [data-m]");
    const set = (i) => {
      list.classList.add("has-on");
      items.forEach((li) => li.classList.toggle("on", +li.dataset.m === i));
      figs.forEach((f) => f.classList.toggle("is-on", +f.dataset.m === i));
    };
    items.forEach((li) => {
      const i = +li.dataset.m;
      ScrollTrigger.create({ trigger: li, start: "top 60%", end: "bottom 60%", onToggle: (s) => s.isActive && set(i) });
      li.addEventListener("pointerenter", () => set(i));
    });
    if (reduce) return;
    gsap.from(".menu__head > *", { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".menu", start: "top 75%" } });
    gsap.fromTo(".menu__fig", { clipPath: "inset(100% 0 0 0 round 999px 999px 4px 4px)" }, { clipPath: "inset(0% 0 0 0 round 999px 999px 4px 4px)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".menu__body", start: "top 80%" } });
  }

  function reveals() {
    if (reduce) return;
    $$(".book__head > *, .rs__row, .rs__foot, .foot__grid > *").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 40, opacity: .2 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#maison", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      const t = id === "#" || id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: 1.4, offset: t === 0 ? 0 : -nav.offsetHeight });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(cam, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: "power2.out" }, 0);
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.14, ease: "expo.out" }, 0.35);
    tl.fromTo(".film__hero > [data-in]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0.65);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.8);
    return tl;
  }

  async function manifest() {
    try {
      const r = await fetch("assets/manifest.json", { cache: "no-cache" });
      if (!r.ok) return null;
      const j = await r.json(), f = j && j.film;
      if (!f || !(f.desktop > 0)) return null;
      return mobile ? (f.mobile > 0 ? new Seq("assets/seq/m/", f.mobile) : null) : new Seq("assets/seq/d/", f.desktop);
    } catch (e) { return null; }
  }

  /* Démarrage */
  async function boot() {
    const bar = $("#loaderBar");
    const stillReady = stillImg.complete && stillImg.naturalWidth ? Promise.resolve() : new Promise((r) => { stillImg.addEventListener("load", r, { once: true }); stillImg.addEventListener("error", r, { once: true }); });
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    gsap.to(bar, { scaleX: 0.6, duration: 1.2, ease: "power2.out" });
    const [, sq] = await Promise.all([Promise.race([Promise.all([stillReady, D.fonts ? D.fonts.ready : null]), timeout(2500)]), reduce ? null : manifest()]);
    seq = sq;
    if (seq) { seq.onload = (i) => { if (Math.abs(i - frame.f) < 6) { drawn = null; draw(); } }; await Promise.race([seq.first(), timeout(1800)]); }
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await timeout(380);

    initLenis();
    H.classList.add("ready");
    intro();
    if (!reduce) { filmTimeline(); if (seq && !seq.dead) seq.start(); }
    introWords(); scenes(); menu(); reveals(); navAndLinks();
    if (W.I18N) I18N.on(() => { introWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);

  }

  boot();
})();
