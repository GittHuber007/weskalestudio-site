/* Maison Zaffa : préchargeur, ouverture en mouvement de caméra, séquence de la rose, quatre métiers. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = W.matchMedia("(max-width: 760px)").matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const MZ = (W.MZ = {});

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* Séquence d'images : première image, puis du plus grossier au plus fin */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.onload = null; this.dead = false;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order; this.cur = 0;
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
    start() { this.queue = this.queue.filter((i) => !this.imgs[i]); this.busy = new Set(); for (let k = 0; k < 4; k++) this.next(); }
    pick() {
      // Images clés d'abord, puis la plus proche de la position courante
      while (this.queue.length) { const i = this.queue.shift(); if (!this.imgs[i] && !this.busy.has(i)) return i; }
      const c = Math.round(this.cur);
      for (let d = 0; d < this.count; d++) {
        for (const i of [c + d, c - d]) if (i >= 0 && i < this.count && !this.imgs[i] && !this.busy.has(i)) return i;
      }
      return -1;
    }
    next() {
      const i = this.pick(); if (i < 0) return;
      this.busy.add(i);
      const im = new Image();
      im.decoding = "async";
      const done = () => { this.busy.delete(i); this.imgs[i] = im; if (this.onload) this.onload(i); this.next(); };
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).then(done, done); };
      im.onerror = () => { this.busy.delete(i); this.imgs[i] = null; this.next(); };
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

  function initLenis() {
    if (reduce || !W.Lenis) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    MZ.lenis = lenis;
  }
  function scrollTo(target, opts) {
    if (MZ.lenis) MZ.lenis.scrollTo(target, Object.assign({ offset: typeof target === "number" ? 0 : -navH() }, opts));
    else W.scrollTo({ top: typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY, behavior: reduce ? "auto" : "smooth" });
  }
  const navH = () => { const n = D.getElementById("nav"); return n ? n.offsetHeight : 0; };

  /* 1. Ouverture : la caméra glisse du patio vers la table, puis jusqu'au menu gravé */
  function filmTimeline() {
    const film = $("#film"), rails = $$("[data-rail]");
    let railOn = -1;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.36 ? 0 : p < 0.6 ? 1 : 2;
          if (on === railOn) return;
          railOn = on; rails.forEach((s) => s.classList.toggle("on", +s.dataset.rail === on));
        },
      },
    });
    tl.to({}, { duration: 1 }, 0);
    // Mouvement de caméra : léger travelling latéral, puis plongée vers le menu au premier plan.
    tl.fromTo("#filmCam", { scale: 1.06, xPercent: mobile ? 0 : 3, yPercent: 0 },
      { scale: mobile ? 1.32 : 1.42, xPercent: mobile ? 0 : -1, yPercent: -2, duration: 0.5, ease: "power1.inOut" }, 0.02);
    tl.to("#filmCam", { scale: mobile ? 1.9 : 2.1, xPercent: 0, yPercent: -4, duration: 0.3, ease: "power2.in" }, 0.52);
    tl.to(".film__glow", { opacity: 0.35, duration: 0.4 }, 0.4);

    tl.to("#filmCue", { autoAlpha: 0, duration: 0.025 }, 0);
    tl.to("#filmHero", { y: -90, scale: 1.06, autoAlpha: 0, duration: 0.08, ease: "power1.in" }, 0.004);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.06);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.78 }, 0.02);

    [[0.12, 0.33], [0.38, 0.57], [0.61, 0.8]].forEach(([a, b], k) => {
      const el = $(`[data-ch="${k}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 44, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.055, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -44, scale: 1.1, duration: 0.05, ease: "power1.in" }, b - 0.05);
    });

    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.8);
    tl.to("#filmDim", { opacity: 1, duration: 0.12 }, 0.82);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, ease: "power2.out" }, 0.86);
  }

  /* 3. Une rose, puis la table : séquence vidéo pilotée par le défilement */
  function roseSequence() {
    const sec = $("#table"), cv = $("#roseCv"), ctx = cv.getContext("2d", { alpha: false });
    cv.style.opacity = "0"; // canvas opaque : caché jusqu'à la première image, l'affiche reste visible dessous
    const seq = new Seq(mobile ? sec.dataset.seqM : sec.dataset.seqD, +(mobile ? sec.dataset.countM : sec.dataset.countD));
    const frame = { f: 0 };
    let drawn = null;
    function size() {
      // Plafond 1,5 (ordinateur) ou 2 (téléphone), et jamais plus de pixels que l'image source n'en contient
      const im0 = seq.imgs[0], need = im0 ? Math.max(1, Math.min(im0.naturalWidth / cv.clientWidth, im0.naturalHeight / cv.clientHeight) * 1.0001) : 2;
      const dpr = Math.min(W.devicePixelRatio || 1, mobile ? 2 : 1.5, need);
      cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
      drawn = null; draw();
    }
    function draw() {
      const i = clamp(Math.round(frame.f), 0, seq.count - 1), img = seq.get(i);
      if (!img || img === drawn) return;
      const cw = cv.width, ch = cv.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = img;
      if (cv.style.opacity === "0") cv.style.opacity = "";
    }
    seq.onload = (i) => { if (Math.abs(i - frame.f) < 6) { drawn = null; draw(); } };

    const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.5 } });
    tl.to({}, { duration: 1 }, 0);
    tl.to(frame, { f: seq.count - 1, duration: 0.9, onUpdate: () => { seq.cur = frame.f; draw(); } }, 0.04);
    tl.fromTo('[data-rl="0"]', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" }, 0.04);
    tl.to('[data-rl="0"]', { autoAlpha: 0, y: -50, duration: 0.07, ease: "power1.in" }, 0.4);
    tl.fromTo('[data-rl="1"]', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" }, 0.58);
    tl.fromTo("#roseCap", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.7);

    seq.first().then((ok) => {
      if (!ok) return; // l'image fixe reste affichée
      size(); W.addEventListener("resize", size);
      ScrollTrigger.create({ trigger: sec, start: "top bottom", once: true, onEnter: () => seq.start() });
    });
  }

  /* 2. Les mots de la promesse s'allument au défilement */
  let wordsTween = null;
  function introWords() {
    const p = $("#introText"); if (!p) return;
    if (wordsTween) { if (wordsTween.scrollTrigger) wordsTween.scrollTrigger.kill(); wordsTween.kill(); wordsTween = null; }
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduce) { $$(".w", p).forEach((w) => (w.style.opacity = 1)); return; }
    wordsTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 42%", scrub: 0.3 } });
  }

  /* 4. Quatre métiers : travelling horizontal */
  function crafts() {
    const track = $("#craftsTrack"), panels = $$(".craft:not(.craft--title)");
    if (reduce) return;
    if (mobile) {
      panels.forEach((pn) => {
        const fig = $(".craft__fig", pn);
        gsap.fromTo(fig, { clipPath: "inset(14% 6% 0% 6% round 8px)" }, { clipPath: "inset(0% 0% 0% 0% round 8px)", ease: "none", scrollTrigger: { trigger: fig, start: "top 95%", end: "top 45%", scrub: 0.3 } });
        gsap.fromTo($(".craft__word", pn), { xPercent: 10 }, { xPercent: -10, ease: "none", scrollTrigger: { trigger: pn, start: "top bottom", end: "bottom top", scrub: 0.3 } });
      });
      return;
    }
    const dist = () => Math.max(0, track.scrollWidth - W.innerWidth);
    const h = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".crafts", start: "top top", end: () => "+=" + Math.round(dist() * 0.64), pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 } });
    panels.forEach((pn) => {
      const st = { containerAnimation: h, trigger: pn, start: "left right", end: "right left", scrub: 0.3 };
      gsap.fromTo($(".craft__fig img", pn), { xPercent: -6, scale: 1.16 }, { xPercent: 6, scale: 1.16, ease: "none", scrollTrigger: st });
      gsap.fromTo($(".craft__word", pn), { xPercent: 18 }, { xPercent: -18, ease: "none", scrollTrigger: { ...st } });
      gsap.fromTo($(".craft__cap", pn), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power2.out", scrollTrigger: { containerAnimation: h, trigger: pn, start: "left 70%", end: "left 25%", scrub: 0.3 } });
    });
  }

  function reveals() {
    if (reduce) return;
    $$(".devis__head > *, .dv > *, .sum, .date__head, .date__fields, .foot__grid > *").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 30 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "center bottom", scrub: 0.3 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#maison", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      if (a.id === "enterBtn" && !reduce) {
        const film = $("#film");
        scrollTo(film.offsetTop + film.offsetHeight - W.innerHeight * 1.02, { offset: 0, duration: 4, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
        return;
      }
      const t = id === "#" || id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: 1.6 });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo(".film__still img", { scale: 1.12 }, { scale: 1, duration: 2.8, ease: "expo.out" }, 0);
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.5, stagger: 0.14, ease: "expo.out" }, 0.25);
    tl.fromTo(".film__hero > [data-in]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0.6);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.7);
  }

  // Lueurs de l'ouverture : animation en pause hors de l'ecran
  (function () {
    const f = $("#film");
    if (f && "IntersectionObserver" in W) new IntersectionObserver((e) => f.classList.toggle("is-off", !e[0].isIntersecting)).observe(f);
  })();

  async function boot() {
    const bar = $("#loaderBar"), still = $(".film__still img");
    const ready = still.complete && still.naturalWidth ? Promise.resolve() : new Promise((r) => { still.addEventListener("load", r, { once: true }); still.addEventListener("error", r, { once: true }); });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    gsap.to(bar, { scaleX: 0.7, duration: 1.2, ease: "power2.out" });
    await Promise.race([Promise.all([ready, D.fonts ? D.fonts.ready : null]), wait(2800)]);
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await wait(380);

    initLenis();
    H.classList.add("ready");
    intro();
    if (!reduce) { filmTimeline(); roseSequence(); }
    introWords(); crafts(); reveals(); navAndLinks();
    if (W.I18N) I18N.on(() => { introWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  }

  boot();
})();
