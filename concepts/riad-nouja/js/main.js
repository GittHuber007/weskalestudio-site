/* Riad Nouja : préchargeur, plan-séquence piloté par le défilement, matières, navigation. */
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
  const mobile = W.matchMedia("(max-width: 760px)").matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const RIAD = (W.RIAD = {});

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* Séquence d'images : chargement progressif, du plus grossier au plus fin */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.want = 0; this.onload = null; this.dead = false;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8, 4, 2, 1].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order; this.active = 0;
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
      for (let d = 1; d < this.count; d++) {
        if (this.imgs[i - d]) return this.imgs[i - d];
        if (this.imgs[i + d]) return this.imgs[i + d];
      }
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
    RIAD.lenis = lenis;
  }
  function scrollTo(target, opts) {
    if (RIAD.lenis) RIAD.lenis.scrollTo(target, opts);
    else W.scrollTo({ top: (typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY) + ((opts && opts.offset) || 0), behavior: reduce ? "auto" : "smooth" });
  }

  /* Plan-séquence */
  const film = $("#film"), cv = $("#filmCv"), ctx = cv.getContext("2d");
  const seq = new Seq(mobile ? film.dataset.seqM : film.dataset.seqD, +(mobile ? film.dataset.countM : film.dataset.countD));
  const frame = { f: 0 };
  let drawn = null;

  function sizeCanvas() {
    const dpr = Math.min(W.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    drawn = null; draw();
  }
  function draw() {
    const i = clamp(Math.round(frame.f), 0, seq.count - 1);
    if (i !== seq.want) { seq.want = i; seq.started = true; }
    const img = seq.get(i);
    if (!img || (img === drawn)) return;
    const cw = cv.width, ch = cv.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    // Téléphone : le recadrage suit déjà la plaque, on garde un léger décalage vers elle au début.
    const fx = mobile ? 0.5 + 0.16 * (1 - clamp(i / (seq.count * 0.45), 0, 1)) : 0.5;
    ctx.drawImage(img, (cw - w) * fx, (ch - h) * 0.5, w, h);
    drawn = img;
    H.classList.remove("seq-wait");
  }
  seq.onload = (i) => { if (Math.abs(i - frame.f) < 6) { drawn = null; draw(); } };

  function filmTimeline() {
    const ok = !seq.dead;
    if (ok) { gsap.set(cv, { opacity: 1 }); sizeCanvas(); W.addEventListener("resize", sizeCanvas); }

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.345 ? 0 : p < 0.585 ? 1 : 2;
          $$("[data-rail]").forEach((s) => s.classList.toggle("on", +s.dataset.rail === on));
        },
      },
    });
    tl.to({}, { duration: 1 }, 0); // la timeline dure exactement 1

    if (ok) {
      tl.to(frame, { f: seq.count - 1, duration: 0.78, onUpdate: draw }, 0.02);
      tl.to("#filmStill", { autoAlpha: 0, duration: 0.05 }, 0.012);
    } else {
      tl.fromTo("#filmStill img", { scale: 1 }, { scale: 1.35, duration: 0.8 }, 0.02);
    }
    tl.to("#filmCue", { autoAlpha: 0, duration: 0.025 }, 0);
    tl.to("#filmHero", { y: -90, scale: 1.08, autoAlpha: 0, duration: 0.075, ease: "power1.in" }, 0.004);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.06);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.78 }, 0.02);

    [[0.11, 0.32], [0.37, 0.56], [0.6, 0.79]].forEach(([a, b], k) => {
      const el = $(`[data-ch="${k}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 44, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.055, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -44, scale: 1.12, duration: 0.05, ease: "power1.in" }, b - 0.05);
    });

    // La caméra continue d'avancer vers la fontaine pendant que la phrase de fin arrive.
    tl.to("#filmCam", { scale: mobile ? 1.22 : 1.3, duration: 0.2, ease: "power1.in" }, 0.8);
    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.8);
    tl.to("#filmDim", { opacity: 1, duration: 0.12 }, 0.82);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, ease: "power2.out" }, 0.86);
  }

  /* Texte d'introduction : les mots s'allument au défilement */
  let wordsTween = null;
  function introWords() {
    const p = $("#introText"); if (!p) return;
    if (wordsTween) { if (wordsTween.scrollTrigger) wordsTween.scrollTrigger.kill(); wordsTween.kill(); wordsTween = null; }
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduce) return;
    wordsTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 42%", scrub: 0.4 } });
  }

  /* Matières : travelling horizontal le long du patio */
  function materials() {
    const track = $("#matTrack"), panels = $$(".mat__panel");
    if (reduce) return;
    if (mobile) {
      panels.forEach((pn) => {
        const fig = $(".mat__fig", pn);
        gsap.fromTo(fig, { clipPath: "inset(18% 0% 0% 0% round 999px 999px 6px 6px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 6px 6px)", ease: "none", scrollTrigger: { trigger: fig, start: "top 95%", end: "top 45%", scrub: 0.4 } });
        gsap.fromTo($("img", fig), { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: 0.4 } });
        gsap.fromTo($(".mat__word", pn), { xPercent: 12 }, { xPercent: -12, ease: "none", scrollTrigger: { trigger: pn, start: "top bottom", end: "bottom top", scrub: 0.4 } });
      });
      return;
    }
    const dist = () => Math.max(0, track.scrollWidth - W.innerWidth);
    const h = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".mat", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
    panels.forEach((pn) => {
      const st = { containerAnimation: h, trigger: pn, start: "left right", end: "right left", scrub: true };
      gsap.fromTo($(".mat__fig img", pn), { xPercent: -7, scale: 1.16 }, { xPercent: 7, scale: 1.16, ease: "none", scrollTrigger: st });
      gsap.fromTo($(".mat__word", pn), { xPercent: 18 }, { xPercent: -18, ease: "none", scrollTrigger: { ...st } });
      gsap.fromTo($(".mat__cap", pn), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: { containerAnimation: h, trigger: pn, start: "left 70%", end: "left 25%", scrub: true } });
    });
  }

  /* Chambres et réservation : apparitions sobres */
  function reveals() {
    if (reduce) return;
    gsap.fromTo(".rooms__fig img", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".rooms", start: "top bottom", end: "center center", scrub: 0.4 } });
    $$(".room").forEach((r) => gsap.from(r, { y: 30, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 90%" } }));
    $$(".book__head > *, .bk, .sum, .foot__grid > *").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 30 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#maison", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2 && id !== "#") return;
      e.preventDefault();
      if (a.id === "enterBtn" && !reduce) {
        // Entrer dans le riad : le défilement joue tout le plan-séquence, lentement.
        scrollTo(film.offsetTop + film.offsetHeight - W.innerHeight * 1.02, { duration: 5.5, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
        return;
      }
      const t = id === "#" || id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: 1.4, offset: t === 0 ? 0 : -nav.offsetHeight });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo("#filmStill img", { scale: 1.1 }, { scale: 1, duration: 2.6, ease: "expo.out" }, 0);
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.25);
    tl.fromTo(".film__hero > [data-in]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0.55);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.7);
    return tl;
  }

  /* Démarrage : l'image fixe d'abord, puis la première image de la séquence */
  async function boot() {
    const bar = $("#loaderBar");
    const stillImg = $("#filmStill img");
    const stillReady = stillImg.complete && stillImg.naturalWidth ? Promise.resolve() : new Promise((r) => { stillImg.addEventListener("load", r, { once: true }); stillImg.addEventListener("error", r, { once: true }); });
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    gsap.to(bar, { scaleX: 0.6, duration: 1.2, ease: "power2.out" });
    await Promise.race([Promise.all([stillReady, D.fonts ? D.fonts.ready : null]), timeout(2500)]);
    let firstP = null;
    if (!reduce) { H.classList.add("seq-wait"); firstP = seq.first(); await Promise.race([firstP, timeout(1800)]); }
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await timeout(380);

    initLenis();
    H.classList.add("ready");
    intro();
    if (!reduce) {
      if (seq.imgs[0]) { filmTimeline(); seq.start(); }
      else firstP.then(() => { filmTimeline(); if (!seq.dead) seq.start(); ScrollTrigger.refresh(); });
    }
    introWords(); materials(); reveals(); navAndLinks();
    if (W.I18N) I18N.on(() => { introWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  }

  boot();
})();
