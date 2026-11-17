/* Nuage : préchargeur, plan-séquence piloté par le défilement, journée, deux langues, navigation. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = W.matchMedia("(max-width: 760px)");
  const mobile = mq.matches;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const NUAGE = (W.NUAGE = {});

  if (!hasGsap) { H.classList.add("ready"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) H.classList.add("js-film");

  /* ------------------------------------------------------------------
     Caméra virtuelle sur deux photos générées de 2400 × 1340.
     Scène A : la salle de jeux (assets/salle.webp), mot « nuage » peint au mur.
     Scène B : le tapis (assets/hero.webp), à hauteur d'enfant.
     Chaque clé : position (0 à 1), centre x, centre y, hauteur du cadre, en pixels source.
     Les trajets ont été vérifiés image par image : aucun visage d'enfant
     n'entre dans le cadre (A : x < 2232, l'enfant reste hors champ ; B : y > 880).
     ------------------------------------------------------------------ */
  const A = mobile ? 0.86 : 2.2; // rapport du cadre
  const PATH = mobile
    ? {
        a: [[0, 1790, 640, 980], [1, 1840, 680, 880]],
        b: [[0, 2030, 640, 760], [0.25, 1880, 1110, 460], [0.6, 1220, 1110, 460], [1, 420, 1110, 460]],
      }
    : {
        a: [[0, 1116, 640, 1012], [1, 1500, 650, 840]],
        b: [[0, 1900, 1112, 455], [0.5, 1350, 1110, 450], [1, 520, 1110, 450]],
      };
  const smooth = (t) => t * t * (3 - 2 * t);
  function camAt(keys, q) {
    for (let i = 0; i < keys.length - 1; i++) {
      const k0 = keys[i], k1 = keys[i + 1];
      if (q <= k1[0] || i === keys.length - 2) {
        const t = smooth(clamp((q - k0[0]) / (k1[0] - k0[0]), 0, 1));
        return [lerp(k0[1], k1[1], t), lerp(k0[2], k1[2], t), lerp(k0[3], k1[3], t)];
      }
    }
    return keys[0].slice(1);
  }

  const film = $("#film"), stage = $("#filmStage"), cv = $("#filmCv"), ctx = cv.getContext("2d");
  const frameEl = $("#filmFrame"), still = $("#filmStill");
  const st = { t: 0, eye: 1, scene: 0, a: 0, b: 0, fade: 1, word: 1 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let geo = null, dpr = 1, filmOn = true, drawReady = false;

  // Poussière dans la lumière : quelques particules lentes, dans le cadre seulement.
  const dust = Array.from({ length: mobile ? 14 : 26 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.004 + Math.random() * 0.01, o: Math.random() * Math.PI * 2,
  }));

  function measure() {
    dpr = Math.min(W.devicePixelRatio || 1, mobile ? 2 : 1.5);
    const vw = stage.clientWidth, vh = stage.clientHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    // Le cadre d'ouverture est défini en CSS : on le lit sans transformation.
    const prev = frameEl.style.transform; frameEl.style.transform = "none";
    const r = frameEl.getBoundingClientRect(), s = stage.getBoundingClientRect();
    frameEl.style.transform = prev;
    const open = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.width / A };
    let fw = vw, fh = vw / A;
    const maxH = mobile ? vh * 0.56 : vh - 320;
    if (fh > maxH) { fh = maxH; fw = fh * A; }
    const full = { x: (vw - fw) / 2, y: (vh - fh) / 2 - (mobile ? vh * 0.06 : 0), w: fw, h: fh };
    geo = { vw, vh, open, full };
    draw(performance.now());
  }

  const imgA = new Image(), imgB = new Image();
  imgA.decoding = imgB.decoding = "async";
  const XMAX_A = 2232; // au-delà, le bord du visage de l'enfant entre dans le champ

  function draw(now) {
    if (!geo || !drawReady) return;
    const { open, full, vw, vh } = geo;
    const t = st.t;
    const fx = lerp(open.x, full.x, t), fy = lerp(open.y, full.y, t), fw = lerp(open.w, full.w, t), fh = fw / A;
    const rad = lerp(mobile ? 10 : 14, 0, clamp(t * 1.4, 0, 1));

    // Le bloc DOM (image fixe et mot « nuage ») suit le cadre.
    const sc = fw / open.w;
    frameEl.style.transform = `translate3d(${fx - open.x}px, ${fy - open.y}px, 0) scale(${sc})`;

    // Caméra
    const k = st.scene ? camAt(PATH.b, st.b) : camAt(PATH.a, st.a);
    const breathe = reduce ? 0 : Math.sin(now / 2600) * 0.008;
    let sh = k[2] * (1 - breathe), sw = sh * A;
    let sx = k[0] - sw / 2 + mouse.x * sh * 0.035, sy = k[1] - sh / 2 + mouse.y * sh * 0.025;
    const img = st.scene && imgB.naturalWidth ? imgB : imgA;
    const maxX = img === imgA ? Math.min(XMAX_A, img.naturalWidth) : img.naturalWidth;
    sx = clamp(sx, 0, maxX - sw); sy = clamp(sy, 0, img.naturalHeight - sh);
    // Garde-fou : la scène B ne remonte jamais au-dessus du tapis.
    if (st.scene && !mobile) sy = Math.max(sy, 880);

    // Clignement : le cadre se ferme comme une paupière, sans déformer l'image.
    const e = clamp(st.eye, 0.002, 1);
    const dh = fh * e, dy = fy + (fh - dh) / 2;
    const shE = sh * e, syE = sy + (sh - shE) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    if (st.fade <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = st.fade;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(fx, dy, fw, dh, Math.min(rad, dh / 2)); else ctx.rect(fx, dy, fw, dh);
    ctx.clip();
    ctx.drawImage(img, sx, syE, sw, shE, fx, dy, fw, dh);

    // Lumière du matin : un voile chaud qui glisse lentement depuis la fenêtre.
    const lx = fx + fw * (0.15 + 0.1 * Math.sin(now / 5200));
    const g = ctx.createRadialGradient(lx, dy, 0, lx, dy, fw * 0.8);
    g.addColorStop(0, "rgba(255,246,228,0.30)"); g.addColorStop(1, "rgba(255,246,228,0)");
    ctx.fillStyle = g; ctx.fillRect(fx, dy, fw, dh);

    if (!reduce) {
      ctx.globalCompositeOperation = "lighter";
      for (const p of dust) {
        const px = fx + ((p.x + Math.sin(now / 4000 + p.o) * 0.02) % 1) * fw;
        const py = dy + ((p.y - (now / 1000) * p.s) % 1 + 1) % 1 * dh;
        ctx.fillStyle = `rgba(255,240,215,${0.22 + 0.18 * Math.sin(now / 900 + p.o)})`;
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function loop(now) {
    if (filmOn) {
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      draw(now);
    }
  }

  function filmTimeline() {
    measure();
    W.addEventListener("resize", () => { measure(); });
    gsap.set(cv, { autoAlpha: 1 });
    gsap.set(still, { autoAlpha: 0 });
    gsap.ticker.add(() => loop(performance.now()));
    ScrollTrigger.create({ trigger: film, start: "top bottom", end: "bottom top", onToggle: (s) => { filmOn = s.isActive; } });
    if (!mobile) {
      W.addEventListener("pointermove", (e) => { mouse.tx = (e.clientX / W.innerWidth - 0.5) * 2; mouse.ty = (e.clientY / W.innerHeight - 0.5) * 2; }, { passive: true });
    }

    // Au-dessus du canvas qui bouge : seulement opacité et translation (aucun flou animé).
    const rails = $$("[data-rail]");
    let railOn = -1;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: film, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (s) => {
          const p = s.progress, on = p < 0.51 ? 0 : p < 0.68 ? 1 : 2;
          if (on === railOn) return;
          railOn = on;
          rails.forEach((el) => el.classList.toggle("on", +el.dataset.rail === on));
        },
      },
    });
    tl.to({}, { duration: 1 }, 0); // la timeline dure exactement 1

    tl.to("#filmCue", { autoAlpha: 0, duration: 0.03 }, 0);
    tl.to("#filmHero", { y: -70, autoAlpha: 0, duration: 0.08, ease: "power1.in" }, 0.005);
    tl.to(st, { t: 1, duration: 0.2, ease: "power2.inOut" }, 0.02);
    tl.to(st, { a: 1, duration: 0.26 }, 0);

    // Clignement, puis la caméra se retrouve sur le tapis, à hauteur d'enfant.
    tl.to(st, { eye: 0, duration: 0.05, ease: "power2.in" }, 0.24);
    tl.set(st, { scene: 1 }, 0.29);
    tl.to(st, { eye: 1, duration: 0.05, ease: "power2.out" }, 0.29);
    tl.to(st, { b: 1, duration: 0.57 }, 0.29);

    tl.fromTo(".film__rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.31);
    tl.fromTo("#railBar", { scaleX: 0 }, { scaleX: 1, duration: 0.54 }, 0.32);
    [[0.34, 0.5], [0.52, 0.67], [0.69, 0.84]].forEach(([a, b], i) => {
      const el = $(`[data-ch="${i}"]`);
      tl.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.045, ease: "power2.out" }, a);
      tl.to(el, { autoAlpha: 0, y: -24, duration: 0.04, ease: "power1.in" }, b - 0.04);
    });

    // Fin : la pièce s'efface dans la lumière, la phrase reste.
    tl.to(".film__rail", { autoAlpha: 0, duration: 0.03 }, 0.85);
    tl.to(st, { t: 0.78, duration: 0.12, ease: "power1.inOut" }, 0.85);
    tl.to(st, { fade: 0, duration: 0.09, ease: "power1.in" }, 0.87);
    tl.fromTo("#filmEnd", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07, ease: "power2.out" }, 0.9);
  }

  /* Lenis */
  function initLenis() {
    if (reduce || !W.Lenis) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    // Pendant le défilement, les flous d'arrière-plan sont coupés (classe retirée à l'arrêt).
    let idle = 0;
    lenis.on("scroll", () => {
      if (!H.classList.contains("is-scrolling")) H.classList.add("is-scrolling");
      clearTimeout(idle); idle = setTimeout(() => H.classList.remove("is-scrolling"), 160);
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    NUAGE.lenis = lenis;
  }
  // Décalage de l'en-tête fixe, sauf pour les sections épinglées (elles commencent sous la barre).
  const headOffset = (target) => (typeof target === "number" || target.matches("#day, #languages") ? 0 : -($("#nav").offsetHeight || 0));
  function scrollTo(target, opts) {
    if (NUAGE.lenis) NUAGE.lenis.scrollTo(target, Object.assign({ offset: headOffset(target) }, opts));
    else W.scrollTo({ top: typeof target === "number" ? target : target.getBoundingClientRect().top + W.scrollY, behavior: reduce ? "auto" : "smooth" });
  }

  /* L'approche : les mots s'allument au défilement */
  let wordsTween = null;
  function approachWords() {
    const p = $("#approachText"); if (!p) return;
    if (wordsTween) { if (wordsTween.scrollTrigger) wordsTween.scrollTrigger.kill(); wordsTween.kill(); wordsTween = null; }
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    if (reduce) return;
    wordsTween = gsap.to($$(".w", p), { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: 0.4 } });
  }

  /* Une journée : un moment par écran */
  function day() {
    const sec = $("#day"), n = $$(".day__item").length;
    let cur = -1;
    const set = (i) => {
      if (i === cur) return; cur = i;
      $$("[data-m]", sec).forEach((el) => {
        const m = +el.dataset.m;
        el.classList.toggle("is-on", m === i);
        el.classList.toggle("is-past", m < i);
      });
    };
    set(0);
    if (reduce) { sec.classList.add("is-static"); return; }
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: () => "+=" + W.innerHeight * (mobile ? 0.58 : 0.7) * (n - 1), pin: ".day__pin", pinSpacing: true,
      onUpdate: (s) => set(clamp(Math.round(s.progress * (n - 1)), 0, n - 1)),
    });
    gsap.fromTo(".day__arch", { yPercent: 6 }, { yPercent: -4, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.4 } });
  }

  /* Deux langues : chaque mot, deux fois */
  const PAIRS = [["Hello", "Bonjour"], ["More", "Encore"], ["Water", "De l'eau"], ["Hug", "Câlin"], ["Moon", "Lune"], ["Thank you", "Merci"]];
  let pairIdx = 0;
  function renderPairs() {
    const box = $("#langsWords"), fr = W.I18N && I18N.lang === "fr";
    box.innerHTML = PAIRS.map(([en, f], i) =>
      `<div class="pair${i === pairIdx ? " is-on" : ""}" data-p="${i}"><span class="pair__a">${fr ? f : en}</span><span class="pair__b">${fr ? en : f}</span></div>`).join("") +
      `<p class="pair__count"><b>${String(pairIdx + 1).padStart(2, "0")}</b> / ${String(PAIRS.length).padStart(2, "0")}</p>`;
  }
  function setPair(i) {
    if (i === pairIdx) return; pairIdx = i;
    $$(".pair").forEach((p) => p.classList.toggle("is-on", +p.dataset.p === i));
    const c = $(".pair__count b"); if (c) c.textContent = String(i + 1).padStart(2, "0");
  }
  function langs() {
    renderPairs();
    if (reduce) return;
    ScrollTrigger.create({
      trigger: "#languages", start: "top top", end: () => "+=" + W.innerHeight * 0.45 * PAIRS.length, pin: ".langs__pin", pinSpacing: true,
      onUpdate: (s) => setPair(clamp(Math.floor(s.progress * PAIRS.length), 0, PAIRS.length - 1)),
    });
  }

  function reveals() {
    if (reduce) return;
    $$(".visit__head > *, .vf, .facts, .foot__claim").forEach((el) => gsap.from(el, { y: 30, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.fromTo(".foot__mark", { yPercent: 35 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  function navAndLinks() {
    const nav = $("#nav");
    ScrollTrigger.create({ trigger: "#approach", start: "top 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      e.preventDefault();
      if (a.id === "enterBtn" && !reduce) {
        // Entrer : le défilement joue tout le plan-séquence, lentement.
        scrollTo(film.offsetTop + film.offsetHeight - W.innerHeight * 1.02, { duration: 8, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
        return;
      }
      const t = id === "#" || id === "#top" ? 0 : $(id);
      if (t !== null) scrollTo(t, { duration: 1.6 });
    }));
  }

  function intro() {
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(".film__crop", { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" }, 0);
    tl.fromTo(cv, { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" }, 0);
    tl.fromTo(".film__title [data-in]", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.1, ease: "expo.out" }, 0.8);
    tl.fromTo(".film__hero [data-in]:not(.film__title [data-in])", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "power3.out" }, 1);
    tl.fromTo(".nav, .film__cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 1.1);
    return tl;
  }

  /* Démarrage : la photo d'abord, puis la caméra */
  async function boot() {
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    const ready = new Promise((r) => { imgA.onload = () => r(true); imgA.onerror = () => r(false); });
    imgA.src = still.currentSrc || still.src;
    imgB.src = film.dataset.sceneB; // le tapis : chargé en parallèle, utilisé après le clignement
    const ok = await Promise.race([Promise.all([ready, D.fonts ? D.fonts.ready : null]).then((v) => v[0]), timeout(3500).then(() => false)]);
    initLenis();
    H.classList.add("ready");
    if (!reduce && ok) { drawReady = true; filmTimeline(); }
    else if (!reduce) { H.classList.remove("js-film"); }
    intro();
    approachWords(); day(); langs(); reveals(); navAndLinks();
    if (W.I18N) I18N.on(() => { approachWords(); renderPairs(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  }

  boot();
})();
