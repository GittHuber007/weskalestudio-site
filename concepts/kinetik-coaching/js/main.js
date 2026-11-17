/* KINETIK · Concept Weskale Studio, marque fictive.
   Ouverture : image fixe au lever du soleil. Puis un départ de sprint au ralenti, piloté
   par le défilement (vidéo libre Mixkit découpée en images, chargées par fenêtre glissante).
   La largeur de la police variable suit la vitesse de défilement : la marque bouge avec vous. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;
  const small = () => innerWidth < 760;
  const params = new URLSearchParams(location.search);
  const hasG = () => !!(window.gsap && window.ScrollTrigger);
  const I18N = window.KN_I18N;
  let lang = "en";
  try { const st = localStorage.getItem("kinetik-lang"); if (st === "fr" || st === "en") lang = st; } catch (e) { /* stockage indisponible */ }
  const L = () => I18N.DYN[lang];

  /* ---------- Données d'exemple ---------- */
  const PRICES = { seance: 70, pack: 600, suivi: 240 };
  const SLOTS = [[6, 30], [7, 30], [8, 30], [12, 30], [17, 30], [18, 30], [19, 30]];
  const SEQ = {
    desk: { dir: "assets/seq/", n: 126, still: "assets/start.webp", ar: 16 / 9 },
    mob: { dir: "assets/seq-m/", n: 63, still: "assets/start-m.webp", ar: 3 / 4 },
  };

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  function initScroll() {
    if (hasG()) gsap.registerPlugin(ScrollTrigger);
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      if (hasG()) {
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const t = id.length > 1 ? $(id) : null;
      if (!t && id !== "#top") return;
      e.preventDefault();
      goTo(t || 0);
    }));
  }
  function goTo(t) {
    /* Décalage de l'en-tête fixe, lu au clic. */
    if (lenis) lenis.scrollTo(t, { duration: 1.2, offset: typeof t === "number" ? 0 : -Math.round($("#nav").offsetHeight) });
    else if (typeof t === "number") scrollTo({ top: t, behavior: reduced ? "auto" : "smooth" });
    else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  window.KN = { get lenis() { return lenis; } };
  const lock = (on) => { document.documentElement.classList.toggle("is-locked", on); if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------- Séquence du départ ---------- */
  const scene = $("#depart");
  const canvas = $("#sceneCanvas");
  const ctx = canvas.getContext("2d");
  const set = small() ? SEQ.mob : SEQ.desk;
  const N = set.n;
  const imgs = new Array(N).fill(null), ok = new Array(N).fill(false), fails = new Array(N).fill(0);
  const WIN = small() ? 10 : 18, KEY = 6, MAXF = 6;
  let want = 0, inflight = 0, started = false;
  const still = new Image();
  let stillOk = false;
  still.decoding = "async";
  still.onload = () => { stillOk = true; dirty = true; };
  $("#hudTot").textContent = String(N).padStart(3, "0");

  function load(k) {
    if (k < 0 || k >= N || imgs[k] || fails[k] >= 2) return;
    const im = new Image();
    im.decoding = "async";
    imgs[k] = im; inflight++;
    /* Image gardée décodée avant d'être dessinée : aucun décodage pendant le défilement. */
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { inflight--; if (imgs[k] !== im) { pump(); return; } ok[k] = true; dirty = true; pump(); }); };
    im.onerror = () => { inflight--; imgs[k] = null; fails[k]++; pump(); };
    im.src = `${set.dir}f_${String(k + 1).padStart(3, "0")}.webp`;
  }
  function pump() {
    if (!started) return;
    const q = [];
    for (let d = 0; d <= WIN; d++) { q.push(want + d); if (d) q.push(want - d); }
    for (let k = 0; k < N; k += KEY) q.push(k);
    for (const k of q) { if (inflight >= MAXF) break; load(k); }
    for (let k = 0; k < N; k++) {
      if (ok[k] && k % KEY && Math.abs(k - want) > WIN * 3) { imgs[k].src = ""; imgs[k] = null; ok[k] = false; }
    }
  }
  function startSeq() {
    if (started) return;
    started = true;
    still.src = set.still;
    load(0); pump();
  }
  function nearest(i) {
    if (ok[i]) return i;
    for (let d = 1; d < N; d++) { if (ok[i - d]) return i - d; if (ok[i + d]) return i + d; }
    return -1;
  }

  let cw = 0, ch = 0, dpr = 1, sw = 0, sh = 0, resized = true;
  /* Densité plafonnée (1,5 ordinateur, 2 téléphone), jamais au-delà des pixels de l'image source.
     Sur téléphone, la barre d'adresse qui bouge ne redimensionne pas le canvas. */
  const SRC_H = 720;
  function size() {
    const r = canvas.getBoundingClientRect();
    if (r.width === sw && small() && Math.abs(r.height - sh) < 160) return;
    sw = r.width; sh = r.height;
    const z0 = r.width >= 760 ? 1.12 : 1.02;
    const need = z0 * Math.max(r.width / set.ar, r.height);
    dpr = Math.max(0.5, Math.min(devicePixelRatio || 1, small() ? 2 : 1.5, SRC_H / Math.max(1, need)));
    cw = canvas.width = Math.max(1, Math.round(r.width * dpr));
    ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
    dirty = true; resized = true;
  }
  function draw(p) {
    const fi = Math.round(clamp((p - 0.04) / 0.82) * (N - 1));
    if (fi !== want) { want = fi; pump(); }
    const k = nearest(fi);
    const fr = k >= 0 ? imgs[k] : null;
    const base = fr || (stillOk ? still : null);
    if (!base) return false;
    // léger travelling avant pendant tout le plan
    // sur ordinateur, l'athlète passe à droite du centre pour laisser le texte à gauche
    const desk = cw / dpr >= 760, z0 = desk ? 1.12 : 1.02;
    /* Le canvas n'est redessiné que si l'image change. Le travelling avant (z0 vers z0 + 0,05)
       est un scale CSS du canvas, autour du point fixe du cadrage : même image à l'écran. */
    if (base !== drawnBase || resized) {
      const s = Math.max(cw / set.ar, ch) * z0;
      const h = s, w = s * set.ar;
      const x = (cw - w) / 2 + (desk ? Math.min((w - cw) / 2, cw * 0.09) : 0);
      ctx.fillStyle = "#f3efe7";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(base, x, (ch - h) * 0.42, w, h);
      const ox = !desk ? 50 : (w - cw) / 2 < cw * 0.09 ? 0 : 59;
      canvas.style.transformOrigin = ox + "% 42%";
      drawnBase = base; resized = false;
    }
    const zs = ((z0 + 0.05 * ease(p)) / z0).toFixed(4);
    if (zs !== drawnZ) { canvas.style.transform = "scale(" + zs + ")"; drawnZ = zs; }
    const hn = String(Math.max(0, k) + 1).padStart(3, "0");
    if (hn !== drawnHud) { hudNum.textContent = hn; drawnHud = hn; }
    return true;
  }
  let drawnBase = null, drawnZ = "", drawnHud = "";
  const hudNum = $("#hudNum");

  /* ---------- Textes de la séquence ---------- */
  const sIntro = $("#sceneIntro"), word = $("#sceneWord");
  const caps = $$(".cap").map((el) => ({ el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) }));
  const hudBar = $("#hudBar");
  function overlay(p) {
    const v = clamp((p - 0.04) / 0.08);
    sIntro.style.opacity = String(1 - v);
    sIntro.style.transform = `translate3d(0, ${-v * 60}px, 0)`;
    caps.forEach((c) => {
      const a = clamp((p - c.a) / 0.06), b = clamp((p - (c.b - 0.05)) / 0.05);
      c.el.style.setProperty("--a", a.toFixed(3));
      c.el.style.setProperty("--b", b.toFixed(3));
    });
    const wv = clamp((p - 0.86) / 0.1);
    word.style.opacity = String(ease(wv));
    word.style.fontVariationSettings = `"wdth" ${Math.round(50 + (small() ? 40 : 60) * ease(wv))}`;
    hudBar.style.transform = `scaleX(${clamp((p - 0.04) / 0.82).toFixed(4)})`;
  }

  /* ---------- Manifeste révélé mot à mot ---------- */
  const mani = $("#manifeste"), maniText = $("#maniText");
  let words = [], maniShown = -1;
  function splitMani() {
    words = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w"; w.textContent = t;
          frag.appendChild(w); words.push(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(maniText);
    maniText.setAttribute("aria-label", L().maniLabel);
    maniShown = -1;
  }
  function maniProgress(p) {
    const n = reduced ? words.length : Math.round(clamp((p - 0.05) / 0.6) * words.length);
    if (n !== maniShown) { words.forEach((w, i) => w.classList.toggle("on", i < n)); maniShown = n; }
  }

  /* ---------- Largeur de la police selon la vitesse ---------- */
  /* Seuls les titres visibles changent de largeur : le reste de la page n'est pas recalculé. */
  let wdShown = 72, wdT = 0;
  const kinOn = new Set();
  if ("IntersectionObserver" in window) {
    const kio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { kinOn.add(e.target); if (wdShown !== 72) e.target.style.setProperty("--wd", wdShown); }
      else { kinOn.delete(e.target); e.target.style.removeProperty("--wd"); }
    }));
    $$(".kin").forEach((el) => { if (el.id !== "footBrand") kio.observe(el); });
  }
  function stretch() {
    if (!lenis || touch || reduced || small()) return;
    const v = Math.abs(lenis.velocity || 0);
    const target = 72 + Math.round(clamp(v / 40) * 5) * 4; // 72 à 92, par paliers
    const now = performance.now();
    if (target !== wdShown && now - wdT > 140) { wdShown = target; wdT = now; kinOn.forEach((el) => el.style.setProperty("--wd", target)); }
  }

  /* ---------- Boucle de rendu ---------- */
  /* Positions des sections lues au chargement, au redimensionnement et au rafraîchissement,
     jamais pendant le défilement. La position de défilement vient de Lenis. */
  const geo = { s0: 0, sH: 1, m0: 0, mH: 1, vh: 1, heroB: 0 };
  function measure() {
    const y = scrollY, a = scene.getBoundingClientRect(), b = mani.getBoundingClientRect(), hr = $("#hero").getBoundingClientRect();
    geo.vh = innerHeight; geo.s0 = a.top + y; geo.sH = a.height; geo.m0 = b.top + y; geo.mH = b.height; geo.heroB = hr.bottom + y;
  }
  const sy = () => (lenis ? lenis.scroll : scrollY);
  const progAt = (top, h) => clamp((sy() - top) / Math.max(1, h - geo.vh));
  const prog = (el) => (el === scene ? progAt(geo.s0, geo.sH) : progAt(geo.m0, geo.mH));
  let pS = 0, shownS = -1, dirty = true, live = false;
  function tick() {
    const top = geo.s0 - sy();
    if (top < geo.vh * 2.5 && top + geo.sH > -geo.vh) {
      startSeq();
      const target = prog(scene);
      pS = reduced ? target : pS + (target - pS) * 0.22;
      if (Math.abs(target - pS) < 0.0004) pS = target;
      if (dirty || Math.abs(pS - shownS) > 0.00005) {
        if (draw(pS)) { dirty = false; shownS = pS; if (!live) { live = true; scene.classList.add("is-live"); } }
        overlay(pS);
      }
    }
    maniProgress(prog(mani));
    stretch();
  }

  /* ---------- Vidéos en boucle : lecture seulement à l'écran ---------- */
  function videos() {
    const vids = $$("video");
    if (reduced) return; // l'image d'attente suffit
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") { v.preload = "auto"; v.load(); } const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      else v.pause();
    }), { rootMargin: "200px 0px" });
    vids.forEach((v) => io.observe(v));
  }

  /* ---------- Formules et réservation ---------- */
  const money = (n) => L().money(n);
  function prices() {
    $$("[data-price]").forEach((el) => { el.textContent = money(PRICES[el.dataset.price]); });
  }
  const days = [];
  const base = new Date(); base.setHours(12, 0, 0, 0);
  for (let i = 1; i <= 14; i++) { const d = new Date(base); d.setDate(d.getDate() + i); days.push(d); }
  const key = (d) => `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  const seed = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
  const taken = (d, i) => d.getDay() === 0 || seed(key(d) + "-" + i) < 0.4;
  let selDay = null, selSlot = null;
  const dayEl = $("#days"), slotEl = $("#slots");
  const fmt = (d, o) => d.toLocaleDateString(L().locale, o);
  function renderDays() {
    dayEl.innerHTML = days.map((d, i) => {
      const closed = d.getDay() === 0;
      const label = closed ? L().closed : fmt(d, { weekday: "long", day: "numeric", month: "long" });
      return `<button type="button" class="day" data-i="${i}" aria-pressed="${i === selDay}" aria-label="${label}" ${closed ? "disabled" : ""}><small>${fmt(d, { weekday: "short" }).replace(".", "")}</small><b>${d.getDate()}</b></button>`;
    }).join("");
  }
  function renderSlots(anim) {
    if (selDay === null) { slotEl.innerHTML = ""; return; }
    const d = days[selDay];
    slotEl.innerHTML = SLOTS.map(([h, m], i) => {
      const t = L().time(h, m), off = taken(d, i);
      return `<button type="button" class="slot" data-s="${i}" aria-pressed="${i === selSlot}" ${off ? `disabled aria-label="${t}, ${L().taken}"` : ""}>${t}</button>`;
    }).join("");
    if (anim && hasG() && !reduced) gsap.from(".slot", { y: 10, opacity: 0, stagger: 0.025, duration: 0.4, ease: "power2.out" });
  }
  function pickDay(i, anim) {
    selDay = i; selSlot = null;
    $$(".day").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
    renderSlots(anim); summary();
  }
  dayEl.addEventListener("click", (e) => { const b = e.target.closest(".day"); if (b && !b.disabled) pickDay(+b.dataset.i, true); });
  slotEl.addEventListener("click", (e) => {
    const b = e.target.closest(".slot"); if (!b || b.disabled) return;
    selSlot = +b.dataset.s;
    $$(".slot").forEach((s) => s.setAttribute("aria-pressed", String(s === b)));
    $("#kErr").textContent = "";
    summary();
  });
  function nextSlot() {
    for (let i = 0; i < days.length; i++) for (let s = 0; s < SLOTS.length; s++) if (!taken(days[i], s)) {
      const day = i === 0 ? L().tomorrow : fmt(days[i], { weekday: "long", day: "numeric" });
      $("#nextSlot").textContent = `${day}, ${L().time(...SLOTS[s])}`;
      return;
    }
  }
  function summary() {
    $("#kSum").textContent = selDay !== null && selSlot !== null ? `· ${fmt(days[selDay], { weekday: "short", day: "numeric", month: "short" })}, ${L().time(...SLOTS[selSlot])}` : "";
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-book]"); if (!b) return;
    const r = $(`input[name=plan][value=${b.dataset.book}]`); if (r) r.checked = true;
    goTo($("#reserver"));
  });
  const modal = $("#modal");
  let lastFocus = null;
  function closeModal() { modal.hidden = true; lock(false); if (lastFocus) lastFocus.focus(); }
  $("#bookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const n = $("#kName"), m = $("#kMail");
    const okN = n.value.trim().length > 1, okM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim());
    n.classList.toggle("is-bad", !okN); m.classList.toggle("is-bad", !okM);
    if (selSlot === null) { $("#kErr").textContent = L().errTime; return; }
    if (!okN || !okM) { $("#kErr").textContent = L().errForm; (okN ? m : n).focus(); return; }
    $("#kErr").textContent = "";
    const plan = $("input[name=plan]:checked").value, place = $("input[name=place]:checked").value;
    const price = money(PRICES[plan]) + (plan === "suivi" ? " " + L().perMonth : "");
    $("#mRef").textContent = "KN-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    $("#mRecap").textContent = L().recap({ plan: L().plans[plan], price, date: fmt(days[selDay], { weekday: "long", day: "numeric", month: "long" }), time: L().time(...SLOTS[selSlot]), place: L().places[place] });
    lastFocus = document.activeElement;
    modal.hidden = false; lock(true);
    modal.querySelector(".btn[data-mclose]").focus();
    if (hasG() && !reduced) gsap.fromTo(".modal__panel", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- Langue : anglais par défaut, français complet ---------- */
  const EN = {}, ENATTR = [];
  $$("[data-i18n]").forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
  ["alt", "aria-label"].forEach((attr) => {
    const k = "data-i18n-" + attr;
    $$(`[${k}]`).forEach((el) => ENATTR.push({ el, attr, key: el.getAttribute(k), en: el.getAttribute(attr) }));
  });
  function applyLang(l) {
    lang = l === "fr" ? "fr" : "en";
    document.documentElement.lang = lang;
    document.title = I18N.meta[lang].title;
    const md = $('meta[name="description"]');
    if (md) md.setAttribute("content", I18N.meta[lang].desc);
    $$("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      const v = lang === "fr" ? I18N.FR[k] : EN[k];
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    ENATTR.forEach((o) => o.el.setAttribute(o.attr, lang === "fr" ? (I18N.FR[o.key] || o.en) : o.en));
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    splitMani();
    prices();
    renderDays();
    $$(".day").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === selDay)));
    renderSlots(false);
    nextSlot();
    summary();
    try { localStorage.setItem("kinetik-lang", lang); } catch (e) { /* stockage indisponible */ }
    if (hasG()) ScrollTrigger.refresh();
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ---------- Navigation ---------- */
  const nav = $("#nav"), hero = $("#hero");
  const onScroll = () => nav.classList.toggle("is-solid", geo.heroB - sy() < 70);
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Profondeur à la souris sur l'ouverture ---------- */
  function depth() {
    if (touch || reduced || !hasG()) return;
    const img = $("#heroMedia img");
    const qx = gsap.quickTo(img, "x", { duration: 1.4, ease: "power3.out" });
    const qy = gsap.quickTo(img, "y", { duration: 1.4, ease: "power3.out" });
    const qt = gsap.quickTo("#heroTitle", "x", { duration: 1.6, ease: "power3.out" });
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      qx(-nx * 26); qy(-ny * 16); qt(nx * 10);
    });
  }

  /* ---------- Animations d'entrée et de défilement ---------- */
  function intro() {
    if (!hasG() || reduced) return;
    const lines = $$("#heroTitle .ln > span");
    gsap.timeline()
      .fromTo("#heroMedia", { clipPath: "inset(12% 8% 12% 8% round 8px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.8, ease: "expo.inOut" })
      .fromTo("#heroMedia img", { scale: 1.22 }, { scale: 1.06, duration: 2.6, ease: "expo.out" }, 0)
      .from(lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.1 }, 0.7)
      .from(".hero .eyebrow, .hero__sub, .hero__cta > *", { y: 22, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 1.05)
      .from(".nav, .scroll-cue", { opacity: 0, duration: 1 }, 1.2);
  }
  function scrollAnims() {
    if (!hasG() || reduced) return;
    gsap.to("#heroMedia img", { yPercent: 8, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.4 } });
    gsap.to(".hero__inner", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "30% top", end: "bottom top", scrub: 0.4 } });
    gsap.fromTo("#coachMedia img", { yPercent: -8 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".coach", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.from("#coachMedia", { clipPath: "inset(100% 0 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".coach", start: "top 70%" } });
    gsap.from(".coach__name span", { yPercent: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "power4.out", scrollTrigger: { trigger: ".coach__name", start: "top 88%" } });
    gsap.to("#methodBand", { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: "#methodBand", start: "top bottom", end: "top top", scrub: 0.4 } });
    $$(".mstep__line").forEach((l) => gsap.from(l, { scaleX: 0, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: l, start: "top 90%" } }));
    gsap.from(".plan", { y: 60, opacity: 0, stagger: 0.1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".plans__grid", start: "top 85%" } });
    $$("[data-reveal]").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.fromTo("#footBrand", { "--wd": 50 }, { "--wd": small() ? 88 : 100, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
  }

  /* Paramètre de test temporaire : ?scroll=2400 */
  function testScroll() {
    const y = parseInt(params.get("scroll") || "", 10);
    if (isNaN(y)) return;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
    pS = prog(scene);
  }

  function start() {
    initScroll();
    applyLang(params.get("lang") || lang);
    const first = days.findIndex((d) => d.getDay() !== 0);
    pickDay(first, false);
    size(); measure();
    addEventListener("resize", () => { clearTimeout(size._t); size._t = setTimeout(() => { size(); measure(); }, 120); });
    addEventListener("load", measure);
    if (hasG()) { ScrollTrigger.addEventListener("refresh", measure); gsap.ticker.add(tick); }
    else { const loop = () => { tick(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    onScroll();
    videos();
    depth();

    const loader = $("#loader");
    const heroImg = $("#heroMedia img");
    const fast = reduced || !hasG() || params.has("scroll");
    const t0 = performance.now();
    if (!fast) gsap.to("#loaderBrand", { fontVariationSettings: '"wdth" 128', duration: 1.6, ease: "expo.inOut" });
    let done = false;
    (function wait() {
      const r = heroImg.complete ? 1 : 0;
      const el = performance.now() - t0;
      const k = Math.min(r ? 1 : 0.9, el / 1500);
      $("#loadCount").textContent = String(Math.round(k * 100)).padStart(3, "0");
      $("#loadBar").style.transform = `scaleX(${k})`;
      if ((!r || (!fast && el < 1500)) && el < 6000) { setTimeout(wait, 50); return; }
      if (done) return; done = true;
      $("#loadCount").textContent = "100";
      scrollAnims();
      if (fast) { loader.remove(); testScroll(); if (hasG()) ScrollTrigger.refresh(); return; }
      gsap.timeline({ onComplete: () => loader.remove() })
        .to(".loader__row, .loader__bar", { opacity: 0, duration: 0.35 })
        .to("#loaderBrand", { yPercent: -60, opacity: 0, duration: 0.7, ease: "expo.in" }, "<")
        .to(loader, { opacity: 0, duration: 0.6 }, "-=0.15")
        .add(intro, "-=0.55");
    })();
  }

  if (document.readyState !== "loading") start(); else addEventListener("DOMContentLoaded", start);
  addEventListener("load", () => { if (hasG()) ScrollTrigger.refresh(); });
})();
