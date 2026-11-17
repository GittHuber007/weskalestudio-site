/* Orvane Dental : préchargeur, sourire piloté par le défilement, trois écrans d'expérience, navigation. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = W.matchMedia("(max-width: 760px)").matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const ORV = (W.ORV = {});

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* Séquence d'images : chargement progressif, du plus grossier au plus fin */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.onload = null; this.dead = false;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order; this.cur = 0; this.busy = new Set();
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

  /* Lenis */
  function initLenis() {
    if (reduce || !W.Lenis) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    ORV.lenis = lenis;
  }
  const navH = () => { const n = D.getElementById("nav"); return n ? n.offsetHeight : 0; };
  function scrollTo(target, opts) {
    if (ORV.lenis) ORV.lenis.scrollTo(target, Object.assign({ offset: typeof target === "number" ? 0 : -navH() }, opts));
    else W.scrollTo({ top: typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY, behavior: reduce ? "auto" : "smooth" });
  }

  /* 1. Ouverture : la caméra avance vers le « O » d'ORVANE au mur, qui s'ouvre sur un sourire */
  const film = $("#film"), cam = $("#filmCam"), smile = $("#filmSmile"), cv = $("#filmCv"), ctx = cv.getContext("2d", { alpha: false });
  cv.style.opacity = "0"; // canvas opaque : caché jusqu'à la première image dessinée
  const seq = new Seq(mobile ? film.dataset.seqM : film.dataset.seqD, +(mobile ? film.dataset.countM : film.dataset.countD));
  const frame = { f: 0 }, iris = { r: 0 };
  // Centre du « O » dans l'image d'ouverture (fraction de largeur et de hauteur), bureau et téléphone.
  const O = mobile ? { x: 0.236, y: 0.348 } : { x: 0.528, y: 0.348 };
  let origin = { x: 0, y: 0 }, drawn = null;

  function camOrigin() {
    const img = $("#filmStill img");
    const iw = img.naturalWidth || (mobile ? 864 : 2400), ih = img.naturalHeight || (mobile ? 1536 : 1340);
    const w = cam.clientWidth, h = cam.clientHeight, s = Math.max(w / iw, h / ih);
    origin = { x: (w - iw * s) / 2 + O.x * iw * s, y: (h - ih * s) / 2 + O.y * ih * s };
    cam.style.transformOrigin = `${origin.x}px ${origin.y}px`;
    setIris();
  }
  function setIris() {
    smile.style.clipPath = iris.r <= 0.5 ? "circle(0px at 50% 50%)" : `circle(${iris.r}px at ${origin.x}px ${origin.y}px)`;
  }
  function sizeCanvas() {
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
    ctx.drawImage(img, (cw - w) * 0.5, (ch - h) * 0.42, w, h);
    drawn = img;
    if (cv.style.opacity === "0") cv.style.opacity = "";
  }
  seq.onload = (i) => { if (Math.abs(i - frame.f) < 6) { drawn = null; draw(); } };

  function filmTimeline() {
    sizeCanvas();
    camOrigin();
    W.addEventListener("resize", () => { camOrigin(); sizeCanvas(); });
    const maxR = () => Math.hypot(Math.max(origin.x, W.innerWidth - origin.x), Math.max(origin.y, W.innerHeight - origin.y)) + 20;

    const rails = $$("[data-rail]");
    let railOn = -1, isDark = null;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5, invalidateOnRefresh: true,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.38 ? 0 : p < 0.63 ? 1 : 2, dark = p > 0.33 && p < 0.995;
          if (on !== railOn) { railOn = on; rails.forEach((s) => s.classList.toggle("on", +s.dataset.rail === on)); }
          if (dark !== isDark) { isDark = dark; H.classList.toggle("film-dark", dark); }
        },
      },
    });
    tl.to({}, { duration: 1 }, 0);

    tl.to("#filmCue", { autoAlpha: 0, duration: 0.025 }, 0);
    tl.to("#filmHero", { y: -80, autoAlpha: 0, duration: 0.07, ease: "power1.in" }, 0.004);
    // La caméra avance vers le nom en laiton.
    tl.fromTo(cam, { scale: 1 }, { scale: mobile ? 3 : 3.6, duration: 0.38, ease: "power2.in" }, 0);
    tl.to(".film__grade", { opacity: 0, duration: 0.1 }, 0.06);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.06);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0.02);
    // Le « O » s'ouvre comme un iris sur le sourire.
    tl.fromTo(iris, { r: 0 }, { r: () => maxR(), duration: 0.12, ease: "power2.inOut", onUpdate: setIris }, 0.29);
    tl.fromTo(cv, { scale: 1.25 }, { scale: 1, duration: 0.2, ease: "power2.out" }, 0.29);
    tl.fromTo(frame, { f: 0 }, { f: seq.count - 1, duration: 0.56, onUpdate: () => { seq.cur = frame.f; draw(); } }, 0.33);

    [[0.08, 0.27], [0.44, 0.62], [0.66, 0.82]].forEach(([a, b], k) => {
      const el = $(`[data-ch="${k}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -40, duration: 0.045, ease: "power1.in" }, b - 0.045);
    });

    // Fin : le nom de la maison s'inscrit en laiton devant le sourire.
    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.83);
    tl.to("#filmDim", { opacity: 1, duration: 0.1 }, 0.84);
    tl.fromTo(".film__word", { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.1, ease: "power2.out" }, 0.86);
    tl.fromTo(".film__sign", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.92);
  }

  /* 2. Propos : les mots s'allument au défilement */
  let wordsTween = null;
  function introWords() {
    const p = $("#introText"); if (!p) return;
    if (wordsTween) { if (wordsTween.scrollTrigger) wordsTween.scrollTrigger.kill(); wordsTween.kill(); wordsTween = null; }
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduce) return;
    wordsTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: 0.3 } });
  }

  /* 3. Expérience : trois écrans qui se recouvrent, une vidéo à la fois */
  function experience() {
    const sec = $("#experience"), layers = $$(".exp__layer", sec), vids = layers.map((l) => $("video", l));
    let current = -1;
    const play = (k) => {
      if (k === current) return; current = k;
      vids.forEach((v, i) => {
        if (!v) return;
        if (i === k && !reduce) { if (v.preload !== "auto") v.preload = "auto"; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        else v.pause();
      });
      $$("[data-dot]").forEach((d) => d.classList.toggle("on", +d.dataset.dot === k));
    };
    if (reduce) return;
    H.classList.add("js-exp");
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (st) => play(st.progress < 0.36 ? 0 : st.progress < 0.7 ? 1 : 2),
        onEnter: () => play(0), onEnterBack: () => play(2),
        onLeave: () => { vids.forEach((v) => v && v.pause()); current = -1; },
        onLeaveBack: () => { vids.forEach((v) => v && v.pause()); current = -1; },
      },
    });
    tl.to({}, { duration: 1 }, 0);
    tl.fromTo($(".exp__vid", layers[0]), { scale: 1.12 }, { scale: 1, duration: 0.35 }, 0);
    [1, 2].forEach((k) => {
      const at = k === 1 ? 0.3 : 0.64;
      tl.fromTo(layers[k], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.14, ease: "power2.inOut" }, at);
      tl.fromTo($(".exp__vid", layers[k]), { scale: 1.25, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 0.3 }, at);
      tl.to($(".exp__txt", layers[k - 1]), { autoAlpha: 0, y: -60, duration: 0.08 }, at);
      tl.to($(".exp__vid", layers[k - 1]), { scale: 0.92, yPercent: -6, duration: 0.14 }, at);
      tl.fromTo($(".exp__word", layers[k]), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.1, ease: "power3.out" }, at + 0.08);
      tl.fromTo($(".exp__p", layers[k]), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, at + 0.12);
    });
  }

  /* 4 et 5. Apparitions sobres */
  function reveals() {
    if (reduce) return;
    gsap.from(".care__head > *", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".care", start: "top 78%" } });
    ScrollTrigger.batch(".care__row", { start: "top 92%", onEnter: (els) => gsap.fromTo(els, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08, ease: "power3.out", overwrite: true }) });
    $$(".book__head > *, .bk, .assist, .foot__grid > *").forEach((el) => gsap.from(el, { y: 36, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 35 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.3 } });
    gsap.fromTo(".foot__bg img", { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.3 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#intro", start: "top 70px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2 && id !== "#") return;
      e.preventDefault();
      const t = id === "#" || id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: id === "#experience" ? 2.4 : 1.6 });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo("#filmStill img", { scale: 1.08 }, { scale: 1, duration: 2.6, ease: "expo.out" }, 0);
    tl.from(".film__title .ln", { y: 70, opacity: 0, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.25);
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
    if (!reduce) { firstP = seq.first(); await Promise.race([firstP, timeout(1800)]); }
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await timeout(380);

    initLenis();
    H.classList.add("ready");
    intro();
    if (!reduce) {
      // La timeline démarre tout de suite : l'image fixe porte la première partie.
      filmTimeline();
      if (seq.imgs[0]) { H.classList.add("seq-ok"); seq.start(); }
      else firstP.then((okFirst) => { if (okFirst) { H.classList.add("seq-ok"); seq.start(); sizeCanvas(); } });
    }
    introWords(); experience(); reveals(); navAndLinks();
    if (W.I18N) I18N.on(() => { introWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);

    // Contrôle local uniquement : ?scroll=1234 place la page à cette hauteur.
    const q = new URLSearchParams(location.search).get("scroll");
    if (q !== null) setTimeout(() => { if (ORV.lenis) ORV.lenis.scrollTo(+q, { immediate: true }); else W.scrollTo(0, +q); ScrollTrigger.update(); }, 300);
  }

  boot();
})();
