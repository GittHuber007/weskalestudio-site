/* LUEUR · Concept Weskale Studio, marque fictive.
   Ouverture en un seul plan piloté par le défilement : la caméra avance dans le grand salon
   (image fixe) jusqu'à la scène, puis la vidéo Flow prend le relais (séquence découpée). */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = () => innerWidth < 760;
  const params = new URLSearchParams(location.search);
  const hasG = () => !!(window.gsap && window.ScrollTrigger);
  const I18N = window.LU_I18N;
  let lang = "en";
  try { const st = localStorage.getItem("lueur-lang"); if (st === "fr" || st === "en") lang = st; } catch (e) { /* stockage indisponible */ }
  const L = () => I18N.DYN[lang];

  /* Plan d'ouverture : image fixe (2400 × 1340, ou recadrage téléphone 900 × 1064) puis séquence. */
  const SEQ = {
    desk: { dir: "assets/seq/", n: 190, still: "assets/hero.webp", sar: 2400 / 1340, far: 16 / 9, from: [0.5, 0.5, 1], to: [0.62, 0.48, 1.16] },
    mob: { dir: "assets/seq-m/", n: 95, still: "assets/hero-m.webp", sar: 900 / 1064, far: 3 / 4, from: [0.62, 0.45, 1], to: [0.68, 0.47, 1.12] },
  };
  const P_PUSH = 0.12, P_SEQ = 0.16; // fin de l'avancée, début de la séquence

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
    if (lenis) lenis.scrollTo(t, { duration: 1.8, offset: typeof t === "number" ? 0 : -$("#nav").offsetHeight });
    else if (typeof t === "number") scrollTo({ top: t, behavior: reduced ? "auto" : "smooth" });
    else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  const lock = (on) => { document.documentElement.classList.toggle("is-locked", on); if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------- Séquence ---------- */
  const scene = $("#scene");
  const canvas = $("#sceneCanvas");
  const ctx = canvas.getContext("2d");
  const set = small() ? SEQ.mob : SEQ.desk;
  const N = set.n;
  const imgs = new Array(N).fill(null), ok = new Array(N).fill(false), fails = new Array(N).fill(0);
  const WIN = small() ? 12 : 16, KEY = 6, MAXF = 6;
  let want = 0, inflight = 0;
  const still = new Image();
  let stillOk = false;
  still.decoding = "async";
  still.onload = () => { stillOk = true; dirty = true; };
  still.src = set.still;
  $("#hudTot").textContent = String(N).padStart(3, "0");

  /* Image décodée une seule fois, hors du fil principal (ImageBitmap) ; repli sur une image décodée. */
  const frameLoad = (u) => (window.createImageBitmap && window.fetch)
    ? fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then((b) => createImageBitmap(b))
    : new Promise((res, rej) => { const im = new Image(); im.onload = () => (im.decode ? im.decode() : Promise.resolve()).then(() => res(im), () => res(im)); im.onerror = rej; im.src = u; });
  const frameFree = (b) => { if (!b) return; if (b.close) b.close(); else b.src = ""; };
  function load(k) {
    if (k < 0 || k >= N || imgs[k] || fails[k] >= 2) return;
    const tok = {};
    imgs[k] = tok; inflight++;
    frameLoad(`${set.dir}f_${String(k + 1).padStart(3, "0")}.webp`).then((bm) => {
      inflight--;
      if (imgs[k] !== tok) { frameFree(bm); return; }
      imgs[k] = bm; ok[k] = true; dirty = true; pump();
    }, () => { inflight--; if (imgs[k] === tok) imgs[k] = null; fails[k]++; pump(); });
  }
  function pump() {
    const q = [];
    for (let k = 0; k < N; k += KEY * 2) q.push(k);
    for (let d = 0; d <= WIN; d++) { q.push(want + d); if (d) q.push(want - d); }
    for (const k of q) { if (inflight >= MAXF) break; load(k); }
    for (let k = 0; k < N; k++) {
      if (ok[k] && k % (KEY * 2) && Math.abs(k - want) > WIN + 6) { frameFree(imgs[k]); imgs[k] = null; ok[k] = false; }
    }
  }
  function nearest(i) {
    if (ok[i]) return i;
    for (let d = 1; d < N; d++) { if (ok[i - d]) return i - d; if (ok[i + d]) return i + d; }
    return -1;
  }

  let cw = 0, ch = 0, dpr = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, small() ? 2 : 1.5);
    const r = canvas.getBoundingClientRect();
    cw = canvas.width = Math.max(1, Math.round(r.width * dpr));
    ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
    dirty = true;
  }
  /* Image couvrant l'écran, agrandie de z, le point (fx, fy) ramené vers le centre sans laisser de bord vide. */
  function cover(ar, fx, fy, z) {
    const s = Math.max(cw / ar, ch) * z;
    const w = ar * s, h = s;
    const x = clamp(cw / 2 - fx * w, cw - w, 0);
    const y = clamp(ch / 2 - fy * h, ch - h, 0);
    return { x, y, w, h };
  }
  function draw(p) {
    const fi = Math.round(clamp((p - P_SEQ) / (0.99 - P_SEQ)) * (N - 1));
    if (fi !== want) { want = fi; pump(); }
    const k = nearest(fi);
    const fr = k >= 0 ? imgs[k] : null;
    if (!fr && !stillOk) return false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    // 1. avancée dans le salon, vers les globes
    const t = ease(clamp(p / P_PUSH));
    const mix = clamp((p - (P_PUSH - 0.03)) / (P_SEQ - P_PUSH + 0.03)); // 0 = salon, 1 = séquence
    if (stillOk && mix < 1) {
      const a = set.from, b = set.to;
      const r = cover(set.sar, lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t) * (1 + 0.12 * mix));
      ctx.drawImage(still, r.x, r.y, r.w, r.h);
    }
    // 2. passage sous les globes
    if (fr && mix > 0) {
      ctx.globalAlpha = stillOk ? mix : 1;
      const r = cover(set.far, 0.5, 0.5, 1.1 - 0.1 * ease(mix));
      ctx.drawImage(fr, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
    }
    // éclat doré pendant le passage
    const flare = Math.sin(Math.PI * mix);
    if (flare > 0.01) {
      const g = ctx.createRadialGradient(cw * 0.5, ch * 0.32, 0, cw * 0.5, ch * 0.32, Math.max(cw, ch) * 0.7);
      g.addColorStop(0, `rgba(255, 214, 150, ${0.5 * flare})`);
      g.addColorStop(1, "rgba(255, 214, 150, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "source-over";
    }
    $("#hudNum").textContent = String(Math.max(0, k) + 1).padStart(3, "0");
    return true;
  }

  /* ---------- Textes de la scène ---------- */
  const hero = $("#hero");
  const caps = $$(".cap").map((el) => ({ el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) }));
  const hudBar = $("#hudBar");
  let heroLive = false;
  function overlay(p) {
    const v = clamp(p / 0.09);
    if (heroLive) {
      hero.style.opacity = String(1 - v * 1.15);
      hero.style.transform = `translate3d(0, ${-v * 70}px, 0)`;
      hero.style.visibility = v >= 0.99 ? "hidden" : "visible";
    }
    scene.classList.toggle("is-orbit", p > 0.08);
    caps.forEach((c) => {
      const a = clamp((p - c.a) / 0.07), b = clamp((p - (c.b - 0.06)) / 0.06);
      c.el.style.setProperty("--a", a.toFixed(3));
      c.el.style.setProperty("--b", b.toFixed(3));
    });
    hudBar.style.transform = `scaleX(${clamp(p / 0.99).toFixed(4)})`;
  }

  /* ---------- Manifeste tapé au défilement ---------- */
  const mani = $("#manifeste"), maniText = $("#maniText"), beam = $("#maniBeam");
  let chars = [], maniShown = -1;
  function splitMani() {
    chars = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          [...word].forEach((c) => { const s = document.createElement("span"); s.className = "c"; s.textContent = c; w.appendChild(s); chars.push(s); });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(maniText);
    maniText.setAttribute("aria-label", L().maniLabel);
    maniShown = -1; maniP = -1;
  }
  function maniProgress(p) {
    const n = Math.round(clamp((p - 0.06) / 0.62) * chars.length);
    if (n !== maniShown) {
      chars.forEach((c, i) => { c.classList.toggle("on", i < n); c.classList.toggle("caret", i === n - 1 || (n === 0 && i === 0)); });
      maniShown = n;
    }
    beam.style.transform = `scaleX(${(0.04 + 0.96 * ease(clamp(p / 0.8))).toFixed(4)})`;
    beam.style.opacity = String(0.4 + 0.6 * clamp(p / 0.8));
  }

  /* ---------- Boucle de rendu ---------- */
  const geo = new Map();
  const measure = () => {
    [scene, mani].forEach((el) => { let top = 0, n = el; while (n) { top += n.offsetTop; n = n.offsetParent; } geo.set(el, { top, h: el.offsetHeight }); });
    navLimit = geo.get(scene).top + geo.get(scene).h - 80;
    dirty = true;
  };
  const curY = () => (lenis ? lenis.scroll : scrollY);
  const prog = (el) => { const g = geo.get(el); return clamp((curY() - g.top) / Math.max(1, g.h - innerHeight)); };
  let pS = 0, shownS = -1, dirty = true, live = false, navLimit = Infinity, maniP = -1;
  function tick() {
    const target = prog(scene);
    pS = reduced ? target : pS + (target - pS) * 0.2;
    if (Math.abs(target - pS) < 0.0004) pS = target;
    if (dirty || Math.abs(pS - shownS) > 0.00005) {
      if (draw(pS)) { dirty = false; shownS = pS; if (!live) { live = true; scene.classList.add("is-live"); } }
      overlay(pS);
    }
    const pm = prog(mani);
    if (pm !== maniP) { maniP = pm; maniProgress(pm); }
    requestAnimationFrame(tick);
  }

  /* ---------- Formats : vidéos chargées à l'approche, lues seulement à l'écran ---------- */
  function initVideos() {
    const vids = $$(".fmt__video");
    if (reduced || !("IntersectionObserver" in window)) return;
    const near = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const v = e.target;
      if (!v.src) { v.src = v.dataset.src; v.load(); }
      near.unobserve(v);
    }), { rootMargin: "120% 0px" });
    const seen = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } else v.pause();
    }), { threshold: 0.15 });
    vids.forEach((v) => { near.observe(v); seen.observe(v); });
  }

  /* ---------- Demande de projet ---------- */
  const TYPES = ["launch", "dinner", "brand", "gala", "show", "other"];
  const BUDGETS = ["b1", "b2", "b3", "b4"];
  const pick = { type: null, budget: null };
  function buildPills() {
    const d = L();
    $("#pType").innerHTML = TYPES.map((k) => `<button type="button" class="pill" data-k="${k}" aria-pressed="${pick.type === k}">${d.types[k]}</button>`).join("");
    $("#pBudget").innerHTML = BUDGETS.map((k) => `<button type="button" class="pill" data-k="${k}" aria-pressed="${pick.budget === k}">${d.budgets[k]}</button>`).join("");
    guests();
  }
  [["#pType", "type"], ["#pBudget", "budget"]].forEach(([sel, key]) => {
    $(sel).addEventListener("click", (e) => {
      const b = e.target.closest(".pill"); if (!b) return;
      pick[key] = pick[key] === b.dataset.k && key === "budget" ? null : b.dataset.k;
      $$(".pill", $(sel)).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.k === pick[key])));
      if (key === "type") $("#pErr").textContent = "";
    });
  });
  const range = $("#pGuests");
  function guests() {
    const v = +range.value;
    $("#pGuestsOut").textContent = L().guests(v);
    range.style.setProperty("--fill", ((v - range.min) / (range.max - range.min)) * 100 + "%");
  }
  range.addEventListener("input", guests);
  const now = new Date();
  const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  $("#pMonth").min = ym(now);
  const modal = $("#modal");
  let lastFocus = null;
  function closeModal() { modal.hidden = true; lock(false); if (lastFocus) lastFocus.focus(); }
  $("#pf").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = L();
    const n = $("#pName"), m = $("#pMail");
    if (!pick.type) { $("#pErr").textContent = d.errType; $("#pType .pill").focus(); return; }
    const okN = n.value.trim().length > 1, okM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim());
    n.classList.toggle("is-bad", !okN); m.classList.toggle("is-bad", !okM);
    if (!okN || !okM) { $("#pErr").textContent = d.errForm; (okN ? m : n).focus(); return; }
    $("#pErr").textContent = "";
    const mv = $("#pMonth").value;
    const month = mv ? new Date(mv + "-15T12:00:00").toLocaleDateString(d.locale, { month: "long", year: "numeric" }) : d.noMonth;
    $("#mName").textContent = d.nameSep + n.value.trim().split(/\s+/)[0];
    $("#mRef").textContent = "LU" + Math.random().toString(36).slice(2, 7).toUpperCase();
    $("#mRecap").textContent = d.recap({
      type: d.types[pick.type], guests: d.guests(+range.value), city: $("#pCity").value.trim() || "Paris",
      month, budget: pick.budget ? d.budgets[pick.budget] : d.noBudget, mail: m.value.trim(),
    });
    lastFocus = document.activeElement;
    modal.hidden = false; lock(true);
    modal.querySelector(".btn[data-mclose]").focus();
    if (window.gsap && !reduced) gsap.fromTo(".modal__panel", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- Langue : anglais par défaut, français complet ---------- */
  const EN = {}, ENATTR = [];
  $$("[data-i18n]").forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });
  ["alt", "aria-label", "placeholder"].forEach((attr) => {
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
    buildPills();
    if (geo.size) measure();
    try { localStorage.setItem("lueur-lang", lang); } catch (e) { /* stockage indisponible */ }
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* Pendant le défilement, html.is-scrolling coupe les flous d'arrière-plan (CSS) ; ils reviennent à l'arrêt. */
  (function () {
    let t = 0, on = false;
    const root = document.documentElement;
    addEventListener("scroll", () => {
      if (!on) { on = true; root.classList.add("is-scrolling"); }
      clearTimeout(t); t = setTimeout(() => { on = false; root.classList.remove("is-scrolling"); }, 180);
    }, { passive: true });
  })();

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-solid", curY() > navLimit);
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Animations d'entrée et de défilement ---------- */
  function intro() {
    if (!hasG() || reduced) { heroLive = true; return; }
    const lines = $$("#heroTitle .ln > span");
    gsap.timeline({ onComplete: () => { heroLive = true; gsap.set(canvas, { clearProps: "filter" }); } })
      .fromTo(canvas, { filter: "brightness(0.1)" }, { filter: "brightness(1)", duration: 2.4, ease: "power2.inOut" })
      .from(lines, { yPercent: 110, duration: 1.3, ease: "power4.out", stagger: 0.1 }, 0.4)
      .from(".hero .eyebrow, .hero__sub, .hero__cta > *", { y: 22, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.9)
      .from(".nav, .scroll-cue", { opacity: 0, duration: 1 }, 1.1);
  }
  function scrollAnims() {
    if (!hasG() || reduced) return;
    const fmts = $$(".fmt");
    fmts.forEach((f, i) => {
      gsap.from(f.querySelector(".fmt__word"), { yPercent: 50, opacity: 0, ease: "none", scrollTrigger: { trigger: f, start: "top 85%", end: "top 15%", scrub: true } });
      gsap.from(f.querySelector(".fmt__side"), { y: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: f, start: "top 60%", end: "top 10%", scrub: true } });
      const next = fmts[i + 1];
      if (!next) return;
      const media = f.querySelector(".fmt__media");
      const dim = document.createElement("div"); dim.className = "fmt__dim"; media.appendChild(dim);
      const fst = { trigger: next, start: "top bottom", end: "top top", scrub: true };
      gsap.to(media, { scale: 0.86, ease: "none", scrollTrigger: fst });
      gsap.to(dim, { opacity: 0.65, ease: "none", scrollTrigger: { ...fst } });
      gsap.to(f.querySelector(".fmt__in"), { opacity: 0, y: -60, ease: "none", scrollTrigger: { trigger: next, start: "top 70%", end: "top 20%", scrub: true } });
    });
    $$("[data-reveal]").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.from(".foot__brand", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 80%" } });
    gsap.from(".foot__beam", { scaleX: 0, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".foot", start: "top 85%" } });
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
    window.LU = { get lenis() { return lenis; } }; // accès de contrôle (captures)
    applyLang(params.get("lang") || lang);
    size(); measure();
    addEventListener("resize", () => { clearTimeout(size._t); size._t = setTimeout(() => { size(); measure(); onScroll(); }, 120); });
    if (hasG()) ScrollTrigger.addEventListener("refresh", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    load(0); pump();
    requestAnimationFrame(tick);
    onScroll();
    initVideos();

    const loader = $("#loader");
    const firstKeys = [0];
    for (let k = KEY * 2; k < N; k += KEY * 2) firstKeys.push(k); // les mêmes images clés que la file de chargement
    const ready = () => (stillOk ? 1 : 0) + firstKeys.filter((k) => ok[k]).length;
    const need = firstKeys.length + 1;
    const t0 = performance.now();
    const fast = reduced || !hasG() || params.has("scroll");
    let done = false;
    if (!fast) {
      gsap.to(".loader__beam", { scaleY: 1, duration: 1.3, ease: "expo.inOut" });
      gsap.to(".loader__brand", { opacity: 1, duration: 1.2, delay: 0.3 });
    }
    (function wait() {
      const r = ready() / need;
      $("#loadCount").textContent = String(Math.round(r * 100)).padStart(3, "0");
      const elapsed = performance.now() - t0;
      if ((r < 1 || (!fast && elapsed < 1500)) && elapsed < 6000) { setTimeout(wait, 60); return; }
      if (done) return; done = true;
      $("#loadCount").textContent = "100";
      scrollAnims();
      if (fast) { loader.remove(); heroLive = true; testScroll(); if (hasG()) ScrollTrigger.refresh(); return; }
      gsap.timeline({ onComplete: () => loader.remove() })
        .to(".loader__brand, .loader__count", { opacity: 0, duration: 0.4 })
        .to(".loader__beam", { scaleX: 40, opacity: 0, duration: 0.7, ease: "expo.in" }, "<0.1")
        .to(loader, { opacity: 0, duration: 0.6 }, "-=0.2")
        .add(intro, "-=0.5");
    })();
  }

  if (document.readyState !== "loading") start(); else addEventListener("DOMContentLoaded", start);
  addEventListener("load", () => { if (hasG()) ScrollTrigger.refresh(); else measure(); });
})();
