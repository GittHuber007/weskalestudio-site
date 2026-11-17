/* Alvéa : préchargeur, ouverture pilotée par le défilement (la fenêtre s'ouvre, la caméra entre dans la salle), lumière du nord, navigation. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = W.matchMedia("(max-width: 760px)").matches;
  const fine = W.matchMedia("(pointer: fine)").matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);

  if (!hasGsap) { H.classList.remove("js"); H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* Caméra : points de cadrage dans l'image (fractions), au fil du défilement */
  const CAM = mobile
    ? [[0, .52, .45, 1], [.18, .5, .5, 1], [.4, .43, .28, 1.15], [.64, .64, .5, 1], [.86, .71, .55, 1.35], [1, .71, .55, 1.42]]
    : [[0, .55, .5, 1], [.18, .5, .5, 1], [.4, .43, .3, 1.6], [.64, .64, .5, 1.45], [.86, .7, .55, 1.8], [1, .7, .55, 1.9]];
  function camAt(p) {
    for (let i = 1; i < CAM.length; i++) {
      if (p <= CAM[i][0]) {
        const a = CAM[i - 1], b = CAM[i], t = smooth(clamp((p - a[0]) / (b[0] - a[0]), 0, 1));
        return { fx: lerp(a[1], b[1], t), fy: lerp(a[2], b[2], t), z: lerp(a[3], b[3], t) };
      }
    }
    const l = CAM[CAM.length - 1]; return { fx: l[1], fy: l[2], z: l[3] };
  }

  /* Séquence d'images facultative (assets/film.json), chargée du plus grossier au plus fin */
  class Seq {
    constructor(dir, count) {
      this.dir = dir; this.count = count; this.imgs = new Array(count); this.onload = null;
      const seen = new Set(), order = [];
      const push = (i) => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0); push(count - 1);
      [32, 16, 8, 4, 2, 1].forEach((s) => { for (let i = 0; i < count; i += s) push(i); });
      this.queue = order;
    }
    src(i) { return this.dir + "f_" + String(i).padStart(3, "0") + ".webp"; }
    start() { for (let k = 0; k < 5; k++) this.next(); }
    next() {
      if (!this.queue.length) return;
      const i = this.queue.shift(), im = new Image();
      im.decoding = "async";
      im.src = this.src(i);
      im.decode().then(() => { this.imgs[i] = im; if (this.onload) this.onload(i); this.next(); }, () => this.next());
    }
    get(i) {
      if (this.imgs[i]) return this.imgs[i];
      for (let d = 1; d < this.count; d++) { if (this.imgs[i - d]) return this.imgs[i - d]; if (this.imgs[i + d]) return this.imgs[i + d]; }
      return null;
    }
  }

  /* Lenis */
  let lenis = null;
  function initLenis() {
    if (reduce || !W.Lenis) return;
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    W.ALVEA = { lenis };
  }
  // Decalage pour l'en-tete fixe quand la cible est une section
  const navH = () => { const n = $("#nav"); return n ? n.offsetHeight : 0; };
  function scrollTo(target, opts) {
    const off = typeof target === "number" ? 0 : -navH();
    if (lenis) lenis.scrollTo(target, Object.assign({ offset: off }, opts));
    else W.scrollTo({ top: typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY + off, behavior: reduce ? "auto" : "smooth" });
  }

  /* Ouverture */
  const film = $("#film"), stage = $(".film__stage", film), win = $("#filmWin"), frameEl = $("#filmFrame");
  const cv = $("#filmCv"), ctx = cv.getContext("2d"), still = $("#filmStill img");
  const state = { p: 0, mx: 0, my: 0, tx: 0, ty: 0 };
  let seq = null, camOn = true, slot = null, dpr = 1, last = "", lastWin = "";
  // Cadre de la fenetre : place une fois a la taille du creneau, puis deplace et agrandi par transform
  // (pas de left/top/width/height a chaque image, l'ombre n'est plus repeinte).
  let frameR = null, frameShift = 0;
  function setFrame() {
    if (!slot || !frameR) return;
    const R = frameR;
    frameEl.style.transform = `translate(${(R.x - slot.x).toFixed(1)}px, ${(R.y - slot.y + frameShift).toFixed(1)}px) scale(${(R.w / slot.w).toFixed(4)}, ${(R.h / slot.h).toFixed(4)})`;
  }

  // Resolution dynamique (ordinateur) : densite 1 pendant le defilement, pleine densite des l'arret.
  let lowRes = false, movedAt = 0, lastRP = -1;
  function setDpr() {
    const full = Math.min(W.devicePixelRatio || 1, mobile ? 2 : 1.5);
    dpr = lowRes ? Math.min(full, 1) : full;
    cv.width = Math.round(slot.W * dpr); cv.height = Math.round(slot.H * dpr);
    last = "";
  }
  function measure() {
    const s = stage.getBoundingClientRect(), r = $("#filmSlot").getBoundingClientRect();
    slot = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, W: s.width, H: s.height };
    const fs = frameEl.style; fs.left = slot.x + "px"; fs.top = slot.y + "px"; fs.width = slot.w + "px"; fs.height = slot.h + "px";
    setDpr();
    last = ""; lastWin = ""; render();
  }

  function render() {
    if (!slot) return;
    if (state.p !== lastRP) {
      if (lastRP >= 0 && !mobile && !lowRes && (W.devicePixelRatio || 1) > 1) { lowRes = true; setDpr(); }
      movedAt = performance.now(); lastRP = state.p;
    }
    const p = state.p, e = smooth(clamp((p - 0.015) / 0.16, 0, 1));
    const R = { x: lerp(slot.x, 0, e), y: lerp(slot.y, 0, e), w: lerp(slot.w, slot.W, e), h: lerp(slot.h, slot.H, e) };
    const rad = lerp(3, 0, e);
    // Fenetre et cadre : styles ecrits seulement quand ils changent (fige une fois la fenetre ouverte)
    const clip = `inset(${R.y.toFixed(1)}px ${(slot.W - R.x - R.w).toFixed(1)}px ${(slot.H - R.y - R.h).toFixed(1)}px ${R.x.toFixed(1)}px round ${rad.toFixed(1)}px)`;
    if (clip !== lastWin) {
      lastWin = clip; win.style.clipPath = clip;
      frameR = R; setFrame(); frameEl.style.opacity = String(1 - e);
    }

    let img = still;
    if (seq) { const i = clamp(Math.round(clamp((p - 0.04) / 0.86, 0, 1) * (seq.count - 1)), 0, seq.count - 1); img = seq.get(i) || still; }
    if (!img || !img.naturalWidth) return;
    const c = camOn ? camAt(p) : { fx: .5, fy: .5, z: 1 };
    const fx = c.fx + state.mx * 0.012 / c.z, fy = c.fy + state.my * 0.01 / c.z;
    const sig = [img.src, R.x | 0, R.y | 0, R.w | 0, R.h | 0, fx.toFixed(4), fy.toFixed(4), c.z.toFixed(4)].join();
    if (sig === last) return; last = sig;

    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sc = Math.max(R.w / iw, R.h / ih) * c.z, w = iw * sc, h = ih * sc;
    const x = clamp(R.x + R.w / 2 - fx * w, R.x + R.w - w, R.x), y = clamp(R.y + R.h / 2 - fy * h, R.y + R.h - h, R.y);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(R.x, R.y, R.w, R.h);
    ctx.drawImage(img, x, y, w, h);
    H.classList.remove("seq-wait");
  }

  const rails = $$("[data-rail]"); let railOn = -1;
  function filmTimeline() {
    gsap.set(cv, { opacity: 1 }); gsap.set("#filmStill", { autoAlpha: 0 });
    measure();
    W.addEventListener("resize", measure);
    gsap.ticker.add(() => { if (lowRes && performance.now() - movedAt > 180) { lowRes = false; setDpr(); render(); } });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (st) => {
          const p = st.progress, on = p < 0.47 ? 0 : p < 0.71 ? 1 : 2;
          if (on === railOn) return;
          railOn = on; rails.forEach((s) => s.classList.toggle("on", +s.dataset.rail === on));
        },
      },
    });
    tl.to(state, { p: 1, duration: 1, onUpdate: render }, 0);
    tl.to("#filmCue", { autoAlpha: 0, duration: 0.02 }, 0);
    tl.to("#filmHero", { y: -70, autoAlpha: 0, duration: 0.07, ease: "power1.in" }, 0.003);
    tl.to(".lightpatch--hero", { autoAlpha: 0, duration: 0.08 }, 0.01);
    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.17);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, 0.17);

    [[0.2, 0.37], [0.5, 0.67], [0.72, 0.85]].forEach(([a, b], k) => {
      const el = $(`[data-ch="${k}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -40, duration: 0.045, ease: "power1.in" }, b - 0.045);
    });

    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.86);
    tl.to("#filmVeil", { opacity: 1, duration: 0.1 }, 0.86);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" }, 0.9);
  }

  /* Profondeur à la souris, très légère */
  function pointer() {
    if (!fine || reduce) return;
    W.addEventListener("pointermove", (e) => { state.tx = e.clientX / W.innerWidth - 0.5; state.ty = e.clientY / W.innerHeight - 0.5; }, { passive: true });
    gsap.ticker.add(() => {
      const dx = state.tx - state.mx, dy = state.ty - state.my;
      if (Math.abs(dx) + Math.abs(dy) < 0.0005) return;
      state.mx += dx * 0.06; state.my += dy * 0.06; render();
    });
  }

  /* Texte du cabinet : les mots s'allument au défilement */
  let wordsTween = null;
  function introWords() {
    const p = $("#introText"); if (!p) return;
    if (wordsTween) { if (wordsTween.scrollTrigger) wordsTween.scrollTrigger.kill(); wordsTween.kill(); wordsTween = null; }
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduce) return;
    wordsTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: 0.4 } });
  }

  /* Le temps : la lumière de la fenêtre glisse sur le mur */
  function timeScene() {
    if (reduce) return;
    const st = { trigger: "#temps", start: "top bottom", end: "bottom top", scrub: 0.4 };
    gsap.fromTo("#timeLight", { xPercent: -18, skewX: -8, opacity: .35 }, { xPercent: 22, skewX: -22, opacity: .85, ease: "none", scrollTrigger: st });
    gsap.fromTo("#timeWord", { yPercent: 18 }, { yPercent: -12, ease: "none", scrollTrigger: { ...st } });
    gsap.fromTo(".time__win img", { scale: 1.14, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: "none", scrollTrigger: { ...st } });
    gsap.from(".time__body", { y: 50, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".time__body", start: "top 92%" } });
  }

  function reveals() {
    if (reduce) return;
    gsap.from(".care__head > *", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".care", start: "top 80%" } });
    ScrollTrigger.batch(".cr", { start: "top 92%", once: true, onEnter: (els) => gsap.from(els, { y: 34, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power3.out" }) });
    $$(".book__head > *, .bk").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 35 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#cabinet", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      e.preventDefault();
      if (a.id === "enterBtn" && !reduce) {
        scrollTo(film.offsetTop + film.offsetHeight - W.innerHeight * 1.02, { duration: 5.5, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
        return;
      }
      const t = id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: 1.6 });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.1 });
    if (!reduce) {
      const s = { e: 0 };
      tl.fromTo(win, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0);
      tl.fromTo(s, { e: 0 }, { e: 1, duration: 1.6, ease: "expo.inOut", onUpdate: () => {
        const k = 1 - s.e; win.style.transform = `translateY(${(k * 60).toFixed(1)}px)`; frameShift = k * 60; setFrame();
      } }, 0);
    }
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.3);
    tl.fromTo(".film__hero > [data-in]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0.6);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.8);
    tl.add(() => { win.style.transform = ""; frameShift = 0; setFrame(); });
    return tl;
  }

  async function loadSeq() {
    try {
      const r = await fetch("assets/film.json", { cache: "no-cache" });
      if (!r.ok) return;
      const j = await r.json(), s = mobile ? j.mobile : j.desktop;
      camOn = j.camera !== false;
      if (s && s.count > 1) {
        seq = new Seq(s.dir, s.count);
        seq.onload = (i) => { const cur = Math.round(clamp((state.p - 0.04) / 0.86, 0, 1) * (seq.count - 1)); if (Math.abs(i - cur) < 6) { last = ""; render(); } };
        seq.start();
      }
    } catch (e) { seq = null; }
  }

  async function boot() {
    const bar = $("#loaderBar");
    // Photo d'ouverture decodee avant le premier dessin du canvas
    const ready = still.decode ? still.decode().catch(() => {}) : Promise.resolve();
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    gsap.to(bar, { scaleX: 0.7, duration: 1.2, ease: "power2.out" });
    await Promise.race([Promise.all([ready, D.fonts ? D.fonts.ready : null]), wait(2600)]);
    if (!reduce) await Promise.race([loadSeq(), wait(800)]);
    gsap.to(bar, { scaleX: 1, duration: 0.35, ease: "power2.out" });
    await wait(380);

    initLenis();
    H.classList.add("ready");
    if (!reduce && still.naturalWidth) filmTimeline();
    intro();
    pointer(); introWords(); timeScene(); reveals(); navAndLinks();
    if (W.I18N) W.I18N.on(() => { introWords(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => { ScrollTrigger.refresh(); measure(); }, 1200);
  }

  boot();
})();
