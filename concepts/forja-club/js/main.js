/* FORJA Club · Weskale Studio concept, fictional brand.
   1. Ouverture : l'image générée avec le logo FORJA, poussée de caméra et poussière de magnésie au défilement.
   2. La répétition : séquence d'images tirée d'une vidéo Mixkit (168 images en 1280 px,
      84 images carrées de 720 px sur téléphone), dessinée sur un canvas selon le défilement.
   3. Manifeste tapé, 4. disciplines une par écran, 5. coaching, 6. abonnements, 7. séance d'essai. */
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
  const I18N = window.FJ_I18N;
  let lang = "en";
  try { const st = localStorage.getItem("forja-lang"); if (st === "fr" || st === "en") lang = st; } catch (e) { /* stockage indisponible */ }
  const L = () => I18N.DYN[lang];

  /* ---------- Données d'exemple ---------- */
  const PLANS = { essential: { m: 89, y: 74 }, club: { m: 149, y: 124 }, private: { m: 290, y: 242 } };
  const TIMES = [[7, 0], [12, 30], [18, 0], [19, 0], [20, 0]];
  let bill = "m";
  const pick = { disc: 0, day: -1, time: -1, plan: "" };

  const SEQ = {
    desk: { dir: "assets/seq/", n: 168 },
    mob: { dir: "assets/seq-m/", n: 84 },
  };

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  function initScroll() {
    if (hasG()) gsap.registerPlugin(ScrollTrigger);
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      if (hasG()) {
        lenis.on("scroll", ScrollTrigger.update);
        ScrollTrigger.addEventListener("refresh", measureAll);
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
    if (lenis) lenis.scrollTo(t, { duration: 1.6, offset: typeof t === "number" ? 0 : -$("#nav").offsetHeight });
    else if (typeof t === "number") scrollTo({ top: t, behavior: reduced ? "auto" : "smooth" });
    else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  const lock = (on) => { document.documentElement.classList.toggle("is-locked", on); if (lenis) on ? lenis.stop() : lenis.start(); };
  const geo = new Map();
  let vh = innerHeight;
  function measureAll() {
    vh = innerHeight;
    [open, rep, mani, disc].forEach((el) => { if (el) geo.set(el, { top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight }); });
  }
  const prog = (el) => { const g = geo.get(el); if (!g) return 0; return clamp((scrollY - g.top) / Math.max(1, g.h - vh)); };
  const onScreen = (el) => { const g = geo.get(el); return !!g && scrollY < g.top + g.h && scrollY + vh > g.top; };

  /* ---------- 1. Ouverture ---------- */
  const open = $("#open"), media = $("#openMedia"), sweep = $("#sweep"), hero = $("#hero");
  const rules = $$(".rule").map((el) => ({ el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) }));
  let heroLive = false, mx = 0, my = 0, smx = 0, smy = 0;
  if (!touch && !reduced) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  /* Variables --a et --b : écrites seulement si elles changent */
  function setAB(p, c) {
    const a = clamp((p - c.a) / 0.07).toFixed(3), b = clamp((p - (c.b - 0.05)) / 0.05).toFixed(3);
    if (a !== c.va) { c.va = a; c.el.style.setProperty("--a", a); }
    if (b !== c.vb) { c.vb = b; c.el.style.setProperty("--b", b); }
  }
  function openFrame(p) {
    smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
    const push = ease(clamp(p / 0.95));
    const s = 1 + 0.2 * push;
    const tx = (small() ? 0 : -6 * push) + smx * -1.4, ty = -2 * push + smy * -1.2;
    media.style.transform = `translate3d(${tx.toFixed(3)}%, ${ty.toFixed(3)}%, 0) scale(${s.toFixed(4)})`;
    media.style.setProperty("--dim", p > 0.82 ? (0.7 * clamp((p - 0.82) / 0.18)).toFixed(3) : "0");
    const sw = clamp((p - 0.08) / 0.3);
    sweep.style.opacity = String(Math.sin(sw * Math.PI) * 0.9);
    sweep.style.transform = `translateX(${(-30 + sw * 150).toFixed(2)}vw) skewX(-14deg)`;
    if (heroLive) {
      const v = clamp(p / 0.12);
      hero.style.opacity = String(1 - v * 1.15);
      hero.style.transform = `translate3d(0, ${-v * 80}px, 0)`;
      hero.style.visibility = v >= 0.99 ? "hidden" : "visible";
    }
    open.classList.toggle("is-on", p > 0.04);
    rules.forEach(setAB.bind(null, p));
  }

  /* Poussière de magnésie : quelques grains qui dérivent dans la lumière */
  const dust = $("#dust"), dctx = dust.getContext("2d");
  let dw = 0, dh = 0, motes = [];
  function dustSize() {
    const r = Math.min(devicePixelRatio || 1, 1.5);
    dw = dust.width = Math.round(dust.clientWidth * r);
    dh = dust.height = Math.round(dust.clientHeight * r);
    const n = reduced ? 0 : small() ? 34 : 80;
    motes = Array.from({ length: n }, () => newMote(true));
  }
  function newMote(any) {
    return {
      x: dw * (0.35 + Math.random() * 0.65), y: any ? Math.random() * dh : dh * (0.6 + Math.random() * 0.4),
      r: (0.6 + Math.random() * 2.2) * (dw / 1440 + 0.4), vx: 0.05 + Math.random() * 0.25, vy: -(0.08 + Math.random() * 0.35),
      a: 0.15 + Math.random() * 0.5, t: Math.random() * 6.28,
    };
  }
  function dustFrame(p) {
    if (!motes.length) return;
    dctx.clearRect(0, 0, dw, dh);
    const k = 1 - clamp((p - 0.8) / 0.2);
    for (const m of motes) {
      m.t += 0.01; m.x += m.vx + Math.sin(m.t) * 0.15; m.y += m.vy;
      if (m.y < -10 || m.x > dw + 10) Object.assign(m, newMote(false));
      dctx.globalAlpha = m.a * k;
      dctx.fillStyle = "#e8ecef";
      dctx.beginPath(); dctx.arc(m.x, m.y, m.r, 0, 6.283); dctx.fill();
    }
    dctx.globalAlpha = 1;
  }

  /* ---------- 2. La répétition ---------- */
  const rep = $("#rep"), canvas = $("#repCanvas"), ctx = canvas.getContext("2d"), hudNum = $("#hudNum");
  const set = small() ? SEQ.mob : SEQ.desk;
  const N = set.n;
  const imgs = new Array(N).fill(null), ok = new Array(N).fill(false), fails = new Array(N).fill(0);
  const WIN = small() ? 10 : 18, KEY = 6, MAXF = 6;
  let want = 0, inflight = 0;
  $("#hudTot").textContent = String(N).padStart(3, "0");
  function load(k) {
    if (k < 0 || k >= N || imgs[k] || fails[k] >= 2) return;
    const im = new Image();
    im.decoding = "async";
    imgs[k] = im; inflight++;
    im.onload = () => { im.decode().catch(() => {}).then(() => { inflight--; if (imgs[k] !== im) { pump(); return; } ok[k] = true; dirty = true; pump(); }); };
    im.onerror = () => { inflight--; imgs[k] = null; fails[k]++; pump(); };
    im.src = `${set.dir}f_${String(k + 1).padStart(3, "0")}.webp`;
  }
  function pump() {
    const q = [];
    for (let d = 0; d <= WIN; d++) { q.push(want + d); if (d) q.push(want - d); }
    for (let k = 0; k < N; k += KEY) q.push(k);
    for (const k of q) { if (inflight >= MAXF) break; load(k); }
    for (let k = 0; k < N; k++) {
      if (ok[k] && k % KEY && Math.abs(k - want) > WIN * 3) { imgs[k].src = ""; imgs[k] = null; ok[k] = false; }
    }
  }
  function nearest(i) {
    if (ok[i]) return i;
    for (let d = 1; d < N; d++) { if (ok[i - d]) return i - d; if (ok[i + d]) return i + d; }
    return -1;
  }
  let cw = 0, ch = 0;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, small() ? 2 : 1.5);
    const r = canvas.getBoundingClientRect();
    cw = canvas.width = Math.max(1, Math.round(r.width * dpr));
    ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
    dirty = true;
    dustSize();
    measureAll();
  }
  function draw(p) {
    const fi = Math.round(clamp((p - 0.02) / 0.94) * (N - 1));
    if (fi !== want) { want = fi; pump(); }
    const k = nearest(fi);
    if (k < 0) return false;
    const im = imgs[k];
    const z = 1.04 + 0.08 * p;
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight) * z;
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    const fadeIn = clamp(p / 0.05), fadeOut = clamp((p - 0.95) / 0.05);
    const dark = Math.max(1 - fadeIn, fadeOut) * 0.9;
    if (dark > 0.01) { ctx.fillStyle = `rgba(0,0,0,${dark.toFixed(3)})`; ctx.fillRect(0, 0, cw, ch); }
    const hn = String(k + 1).padStart(3, "0");
    if (hudNum.textContent !== hn) hudNum.textContent = hn;
    return true;
  }
  const caps = $$(".cap").map((el) => ({ el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) }));
  const hudBar = $("#hudBar"), repWord = $("#repWord");
  function repOverlay(p) {
    caps.forEach(setAB.bind(null, p));
    hudBar.style.transform = `scaleX(${clamp((p - 0.02) / 0.94).toFixed(4)})`;
    repWord.style.transform = `translate(-50%, ${(-p * 8).toFixed(2)}vh) scale(${(1 + p * 0.08).toFixed(4)})`;
  }

  /* ---------- 3. Manifeste ---------- */
  const mani = $("#mani"), maniText = $("#maniText"), graze = $("#maniGraze");
  let chars = [], maniShown = -1;
  function splitMani() {
    chars = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
          [...word].forEach((c) => { const s = document.createElement("span"); s.className = "c"; s.textContent = c; w.appendChild(s); chars.push(s); });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(maniText);
    maniText.setAttribute("aria-label", L().maniLabel);
    maniShown = -1;
  }
  function maniFrame(p) {
    const n = Math.round(clamp((p - 0.05) / 0.62) * chars.length);
    if (n !== maniShown) { chars.forEach((c, i) => c.classList.toggle("on", i < n)); maniShown = n; }
    graze.style.transform = `scaleX(${(0.04 + 0.96 * ease(clamp(p / 0.8))).toFixed(4)})`;
    graze.style.opacity = String(0.4 + 0.6 * clamp(p / 0.8));
  }

  /* ---------- 4. Disciplines ---------- */
  const disc = $("#disciplines"), dImgs = $$(".disc__media img"), dItems = $$(".d"), discBar = $("#discBar"), discNum = $("#discNum");
  let dIdx = -1;
  function discFrame(p) {
    const i = Math.min(3, Math.floor(clamp(p) * 4 * 0.999));
    if (i !== dIdx) {
      dIdx = i;
      dImgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
      dItems.forEach((d, k) => d.classList.toggle("is-on", k === i));
      discNum.textContent = String(i + 1).padStart(2, "0");
    }
    discBar.style.transform = `scaleX(${clamp(p).toFixed(4)})`;
  }

  /* ---------- Boucle de rendu ---------- */
  let pR = 0, shownR = -1, dirty = true, pO = 0;
  function tick() {
    const tO = prog(open);
    pO = reduced ? tO : pO + (tO - pO) * 0.14;
    if (onScreen(open)) { openFrame(pO); dustFrame(pO); }
    if (onScreen(rep)) {
      const target = prog(rep);
      pR = reduced ? target : pR + (target - pR) * 0.2;
      if (Math.abs(target - pR) < 0.0004) pR = target;
      if (dirty || Math.abs(pR - shownR) > 0.00005) { if (draw(pR)) { dirty = false; shownR = pR; } repOverlay(pR); }
    }
    maniFrame(prog(mani));
    discFrame(prog(disc));
    if (!hasG()) requestAnimationFrame(tick);
  }

  /* ---------- 5. Vidéo du coaching : chargée et lue seulement à l'écran ---------- */
  const vid = $("#coachVid");
  if (!reduced && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        if (!vid.src) { vid.src = vid.dataset.src; vid.preload = "auto"; }
        const pr = vid.play(); if (pr && pr.catch) pr.catch(() => {});
      } else if (!vid.paused) vid.pause();
    }), { rootMargin: "200px 0px" }).observe(vid);
  }

  /* ---------- 6. Abonnements ---------- */
  function renderPrices(anim) {
    const d = L();
    $$("[data-price]").forEach((el) => {
      const to = PLANS[el.dataset.price][bill];
      const from = parseInt(el.dataset.v || to, 10);
      el.dataset.v = to;
      if (!anim || !hasG() || reduced) { el.textContent = d.money(to); return; }
      const o = { v: from };
      gsap.to(o, { v: to, duration: 0.7, ease: "power3.out", onUpdate: () => { el.textContent = d.money(Math.round(o.v)); } });
    });
    $$("[data-per]").forEach((el) => { el.textContent = bill === "m" ? d.perM : d.perY; });
  }
  $$("[data-bill]").forEach((b) => b.addEventListener("click", () => {
    bill = b.dataset.bill;
    $$("[data-bill]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderPrices(true);
  }));
  $$("[data-plan]").forEach((b) => b.addEventListener("click", () => {
    pick.plan = b.dataset.plan;
    renderPlanLine();
    goTo($("#trial"));
  }));
  function renderPlanLine() { $("#tPlan").textContent = pick.plan ? L().interest(L().plans[pick.plan]) : ""; }

  /* ---------- 7. Séance d'essai ---------- */
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i + 1); return d; });
  function buildTrial() {
    const d = L();
    $("#tDisc").innerHTML = d.disc.map((t, i) => `<button type="button" aria-pressed="${i === pick.disc}" data-v="${i}">${t}</button>`).join("");
    $("#tDay").innerHTML = days.map((x, i) => `<button type="button" aria-pressed="${i === pick.day}" data-v="${i}"><small>${x.toLocaleDateString(d.locale, { weekday: "short" }).replace(".", "")}</small>${x.getDate()}</button>`).join("");
    $("#tTime").innerHTML = TIMES.map((t, i) => `<button type="button" aria-pressed="${i === pick.time}" data-v="${i}">${d.time(t[0], t[1])}</button>`).join("");
    renderPlanLine();
  }
  $$(".tags").forEach((g) => g.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    pick[g.dataset.group] = parseInt(b.dataset.v, 10);
    $$("button", g).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#tErr").textContent = "";
  }));
  const modal = $("#modal");
  let lastFocus = null;
  function closeModal() { modal.hidden = true; lock(false); if (lastFocus) lastFocus.focus(); }
  $("#tf").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = L();
    if (pick.day < 0 || pick.time < 0) { $("#tErr").textContent = d.errPick; return; }
    const n = $("#tName"), t = $("#tTel");
    const okN = n.value.trim().length > 1, okT = (t.value.match(/\d/g) || []).length >= 8;
    n.classList.toggle("is-bad", !okN); t.classList.toggle("is-bad", !okT);
    if (!okN || !okT) { $("#tErr").textContent = d.errForm; (okN ? t : n).focus(); return; }
    $("#tErr").textContent = "";
    $("#mRef").textContent = "FJ" + Math.random().toString(36).slice(2, 7).toUpperCase();
    $("#mRecap").textContent = d.recap({
      name: n.value.trim(), disc: d.disc[pick.disc],
      day: days[pick.day].toLocaleDateString(d.locale, { weekday: "long", day: "numeric", month: "long" }),
      time: d.time(TIMES[pick.time][0], TIMES[pick.time][1]), plan: pick.plan ? d.plans[pick.plan] : "",
    });
    lastFocus = document.activeElement;
    modal.hidden = false; lock(true);
    modal.querySelector(".btn[data-mclose]").focus();
    if (hasG() && !reduced) gsap.fromTo(".modal__panel", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- Langue : anglais par défaut, français complet ---------- */
  const EN = {}, ENATTR = [];
  $$("[data-i18n]").forEach((el) => { if (!(el.dataset.i18n in EN)) EN[el.dataset.i18n] = el.innerHTML; });
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
    renderPrices(false);
    buildTrial();
    try { localStorage.setItem("forja-lang", lang); } catch (e) { /* stockage indisponible */ }
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  let idleT = 0, solid = null;
  const onScroll = () => {
    const s = scrollY > vh * 0.6;
    if (s !== solid) { solid = s; nav.classList.toggle("is-solid", s); }
    const h = document.documentElement;
    if (!h.classList.contains("is-scrolling")) h.classList.add("is-scrolling");
    clearTimeout(idleT); idleT = setTimeout(() => h.classList.remove("is-scrolling"), 160);
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Entrée et animations au défilement ---------- */
  function intro() {
    if (!hasG() || reduced) { heroLive = true; return; }
    const lines = $$("#heroTitle .ln > span");
    gsap.timeline({ onComplete: () => { heroLive = true; } })
      .fromTo(media, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: "power2.inOut" })
      .from(lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.1 }, 0.3)
      .from(".hero .eyebrow, .hero__sub, .hero__cta > *", { y: 22, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.8)
      .from(".nav, .scroll-cue", { opacity: 0, duration: 1 }, 1);
  }
  function scrollAnims() {
    if (!hasG() || reduced) return;
    $$("[data-reveal]").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.from(".coach__media video", { scale: 1.15, ease: "none", scrollTrigger: { trigger: ".coach", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.from(".coach__media", { clipPath: "inset(0 100% 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".coach", start: "top 70%" } });
    gsap.from(".plan", { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".plans__grid", start: "top 85%" } });
    gsap.from(".trial__media img", { scale: 1.2, ease: "none", scrollTrigger: { trigger: ".trial", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.from(".foot__brand", { yPercent: 30, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 80%" } });
    gsap.from(".foot__graze", { scaleX: 0, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".foot", start: "top 85%" } });
  }

  /* Paramètre de contrôle : ?scroll=2400 */
  function testScroll() {
    const y = parseInt(params.get("scroll") || "", 10);
    if (isNaN(y)) return;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
    pO = prog(open); pR = prog(rep);
  }

  function start() {
    initScroll();
    applyLang(params.get("lang") || lang);
    size();
    addEventListener("resize", () => { clearTimeout(size._t); size._t = setTimeout(size, 150); });
    load(0); pump();
    measureAll();
    if (hasG()) gsap.ticker.add(tick); else requestAnimationFrame(tick);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
    onScroll();

    const loader = $("#loader");
    const still = $("#openMedia img");
    const firstKeys = [0];
    for (let k = KEY; k < N; k += KEY * 3) firstKeys.push(k);
    const ready = () => (still.complete && still.naturalWidth ? 1 : 0) + firstKeys.filter((k) => ok[k]).length;
    const need = firstKeys.length + 1;
    const t0 = performance.now();
    const fast = reduced || !hasG() || params.has("scroll");
    if (!fast) {
      gsap.to(".loader__graze", { scaleX: 1, duration: 1.3, ease: "expo.inOut" });
      gsap.to(".loader__brand span", { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: "power4.out", delay: 0.2 });
    }
    let done = false;
    (function wait() {
      const r = ready() / need;
      $("#loadCount").textContent = String(Math.round(r * 100)).padStart(3, "0");
      const el = performance.now() - t0;
      if ((r < 1 || (!fast && el < 1500)) && el < 6000) { setTimeout(wait, 60); return; }
      if (done) return; done = true;
      $("#loadCount").textContent = "100";
      scrollAnims();
      if (fast) { loader.remove(); heroLive = true; testScroll(); if (hasG()) ScrollTrigger.refresh(); return; }
      gsap.timeline({ onComplete: () => loader.remove() })
        .to(".loader__brand span", { yPercent: -110, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power3.in" })
        .to(".loader__graze, .loader__count", { opacity: 0, duration: 0.5 }, "<0.1")
        .to(loader, { opacity: 0, duration: 0.6 }, "-=0.2")
        .add(intro, "-=0.5");
    })();
  }

  if (document.readyState !== "loading") start(); else addEventListener("DOMContentLoaded", start);
  addEventListener("load", () => { measureAll(); if (hasG()) ScrollTrigger.refresh(); });
})();
