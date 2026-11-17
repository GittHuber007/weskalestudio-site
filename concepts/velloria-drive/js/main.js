/* VELLORIA · Concept Weskale Studio, marque fictive.
   Un seul plan piloté par le défilement : l'image d'ouverture se fond dans la séquence
   de l'orbite (192 images en 1280 px, 96 images recadrées en 960 × 720 sur téléphone). */
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

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = () => innerWidth < 760;
  const params = new URLSearchParams(location.search);
  const hasG = () => !!(window.gsap && window.ScrollTrigger);
  const I18N = window.VL_I18N;
  let lang = "en";
  try { const st = localStorage.getItem("velloria-lang"); if (st === "fr" || st === "en") lang = st; } catch (e) { /* stockage indisponible */ }
  const L = () => I18N.DYN[lang];
  const money = (n) => Math.round(n).toLocaleString(L().locale) + " AED";

  /* ---------- Données d'exemple ---------- */
  const CARS = [
    { id: "noctis", name: "Noctis", price: 14500 },
    { id: "opale", name: "Opale", price: 4200 },
    { id: "azurine", name: "Azurine", price: 3800 },
  ];
  const CHAUFFEUR = 1200, DEPOSIT = 10000;

  const SEQ = {
    desk: { dir: "assets/seq/", n: 192, still: "assets/hero.webp", ar: 16 / 9 },
    mob: { dir: "assets/seq-m/", n: 96, still: "assets/hero-m.webp", ar: 4 / 3 },
  };

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  function initScroll() {
    if (hasG()) gsap.registerPlugin(ScrollTrigger);
    // Lenis seulement avec GSAP (une seule boucle, celle du ticker) ; sinon defilement natif
    if (!reduced && window.Lenis && hasG()) {
      lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
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
    const off = typeof t === "number" ? 0 : $("#nav").offsetHeight;
    if (lenis) lenis.scrollTo(t, { duration: 1.4, offset: -off });
    else scrollTo({ top: typeof t === "number" ? t : t.getBoundingClientRect().top + scrollY - off, behavior: reduced ? "auto" : "smooth" });
  }
  const lock = (on) => { document.documentElement.classList.toggle("is-locked", on); if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------- Séquence de l'orbite ---------- */
  const scene = $("#scene");
  const canvas = $("#sceneCanvas");
  const ctx = canvas.getContext("2d");
  const set = small() ? SEQ.mob : SEQ.desk;
  const N = set.n;
  const imgs = new Array(N).fill(null), ok = new Array(N).fill(false), fails = new Array(N).fill(0);
  const WIN = small() ? 12 : 20, KEY = 6, MAXF = 6;
  let want = 0, inflight = 0;
  const still = new Image();
  let stillOk = false;
  still.decoding = "async";
  still.onload = () => { stillOk = true; dirty = true; };
  still.src = set.still;
  $("#hudTot").textContent = String(N).padStart(3, "0");

  function load(k) {
    if (k < 0 || k >= N || imgs[k] || fails[k] >= 2) return;
    const im = new Image();
    im.decoding = "async";
    imgs[k] = im; inflight++;
    // Image decodee avant d'etre peinte : aucun decodage pendant le defilement
    const ready = () => { inflight--; if (imgs[k] !== im) { pump(); return; } ok[k] = true; dirty = true; pump(); };
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).then(ready, ready); };
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

  let cw = 0, ch = 0, dpr = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, small() ? 2 : 1.5);
    const r = canvas.getBoundingClientRect();
    cw = canvas.width = Math.max(1, Math.round(r.width * dpr));
    ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
    dirty = true;
  }

  /* Cadre de l'image selon la progression : décalage de caméra à l'ouverture sur ordinateur,
     image pleine largeur et fondue dans le noir sur téléphone. */
  function frameRect(iw, ih, p) {
    const k = 1 - ease(clamp(p / 0.13));
    if (cw / dpr < 760) {
      const w = cw, h = (w * ih) / iw;
      const cy = ch * (0.29 + 0.11 * (1 - k));
      return { x: 0, y: cy - h / 2, w, h, mobile: true };
    }
    const s = Math.max(cw / iw, ch / ih) * (1 + 0.04 * k);
    const w = iw * s, h = ih * s;
    const shift = cw * 0.23 * k;
    return { x: (cw - w) / 2 + shift, y: (ch - h) / 2, w, h, shift };
  }
  function draw(p) {
    const fi = Math.round(clamp((p - 0.1) / 0.84) * (N - 1));
    if (fi !== want) { want = fi; pump(); }
    const k = nearest(fi);
    const fr = k >= 0 ? imgs[k] : null;
    const sa = stillOk ? 1 - clamp((p - 0.03) / 0.08) : 0;
    if (!fr && !stillOk) return false;
    const base = fr || still;
    const r = frameRect(set.ar, 1, p);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    if (fr) ctx.drawImage(fr, r.x, r.y, r.w, r.h);
    if (sa > 0 && stillOk) { ctx.globalAlpha = fr ? sa : 1; ctx.drawImage(still, r.x, r.y, r.w, r.h); ctx.globalAlpha = 1; }
    // fondus vers le noir sur les bords de l'image
    if (r.mobile) {
      fade(0, r.y - 1, 0, r.y + r.h * 0.3, r);
      fade(0, r.y + r.h + 1, 0, r.y + r.h * 0.62, r);
    } else if (r.shift > 1) {
      fade(r.x - 1, 0, r.x + r.w * 0.22, 0, r);
    }
    if (base) $("#hudNum").textContent = String(Math.max(0, k) + 1).padStart(3, "0");
    return true;
  }
  function fade(x0, y0, x1, y1, r) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    if (x0 === 0 && x1 === 0) ctx.fillRect(0, Math.min(y0, y1), cw, Math.abs(y1 - y0));
    else ctx.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), ch);
    // zone vide autour de l'image
    ctx.fillStyle = "#000";
    if (r.mobile) { ctx.fillRect(0, 0, cw, Math.max(0, r.y)); ctx.fillRect(0, r.y + r.h, cw, ch); }
    else if (r.x > 0) ctx.fillRect(0, 0, r.x, ch);
  }

  /* ---------- Textes de la scène ---------- */
  const hero = $("#hero");
  const caps = $$(".cap").map((el) => ({ el, a: parseFloat(el.dataset.in), b: parseFloat(el.dataset.out) }));
  const hudBar = $("#hudBar");
  let heroLive = false; // l'intro gère le titre tant qu'elle n'est pas finie
  function overlay(p) {
    const v = clamp(p / 0.07);
    if (heroLive) {
      hero.style.opacity = String(1 - v * 1.15);
      hero.style.transform = `translate3d(0, ${-v * 70}px, 0)`;
      hero.style.visibility = v >= 0.99 ? "hidden" : "visible";
    }
    scene.classList.toggle("is-orbit", p > 0.06);
    caps.forEach((c) => {
      const a = clamp((p - c.a) / 0.07), b = clamp((p - (c.b - 0.06)) / 0.06);
      c.el.style.setProperty("--a", a.toFixed(3));
      c.el.style.setProperty("--b", b.toFixed(3));
    });
    hudBar.style.transform = `scaleX(${clamp((p - 0.1) / 0.84).toFixed(4)})`;
  }

  /* ---------- Manifeste tapé au défilement ---------- */
  const mani = $("#manifeste"), maniText = $("#maniText"), ramp = $("#maniRamp");
  let chars = [];
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
    maniShown = -1;
  }
  let maniShown = -1;
  let maniP = -1;
  function maniProgress(p) {
    if (p === maniP && maniShown >= 0) return;
    maniP = p;
    const n = Math.round(clamp((p - 0.06) / 0.66) * chars.length);
    if (n !== maniShown) {
      chars.forEach((c, i) => { c.classList.toggle("on", i < n); c.classList.toggle("caret", i === n - 1 || (n === 0 && i === 0)); });
      maniShown = n;
    }
    ramp.style.transform = `scaleX(${(0.04 + 0.96 * ease(clamp(p / 0.8))).toFixed(4)})`;
    ramp.style.opacity = String(0.4 + 0.6 * clamp(p / 0.8));
  }

  /* ---------- Boucle de rendu ----------
     Une seule boucle (le ticker de GSAP, qui fait aussi tourner Lenis). La progression vient des
     ScrollTrigger (positions mises en cache) : aucune lecture de mise en page pendant le defilement. */
  const rect = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  let stScene = null, stMani = null;
  const prog = (el) => { const st = el === scene ? stScene : el === mani ? stMani : null; return st ? st.progress : rect(el); };
  let pS = 0, shownS = -1, dirty = true, live = false;
  function tick() {
    const target = prog(scene);
    pS = reduced ? target : pS + (target - pS) * 0.2;
    if (Math.abs(target - pS) < 0.0004) pS = target;
    if (dirty || Math.abs(pS - shownS) > 0.00005) {
      if (draw(pS)) { dirty = false; shownS = pS; if (!live) { live = true; scene.classList.add("is-live"); } }
      overlay(pS);
    }
    maniProgress(prog(mani));
    if (!hasG()) requestAnimationFrame(tick);
  }

  /* ---------- Flotte ---------- */
  function buildLists() {
    const d = L();
    const picked = ($("input[name=rcar]:checked") || {}).value || CARS[0].id;
    const hour = $("#rTime").value || "20";
    $$("[data-price]").forEach((el) => { const c = CARS.find((x) => x.id === el.dataset.price); if (c) el.textContent = money(c.price); });
    $("#alsoList").innerHTML = CARS.slice(1).map((c) => `
    <li class="also__row">
      <p class="also__name">${c.name}</p>
      <p class="also__type">${d.types[c.id]}</p>
      <p class="also__price"><b>${money(c.price)}</b> ${d.perDay}</p>
      <button class="btn btn--line" type="button" data-pick="${c.id}">${d.choose}</button>
    </li>`).join("");
    $("#rvCars").innerHTML = CARS.map((c) => `
    <label class="rcar"><input type="radio" name="rcar" value="${c.id}" ${c.id === picked ? "checked" : ""}>
      <span class="rcar__box"><b>${c.name}</b><span>${d.types[c.id]}</span><span>${money(c.price)} ${d.perDay}</span></span></label>`).join("");
    $("#chfPrice").textContent = `+ ${money(CHAUFFEUR)} ${d.perDay}`;
    $("#rTime").innerHTML = Array.from({ length: 24 }, (_, h) => `<option value="${h}">${d.hour(h)}</option>`).join("");
    $("#rTime").value = hour;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    const r = $(`input[name=rcar][value=${b.dataset.pick}]`);
    if (r) { r.checked = true; compute(); }
    goTo($("#reserver"));
  });

  /* ---------- Réservation ---------- */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const d1 = new Date(today); d1.setDate(d1.getDate() + 7);
  const d2 = new Date(d1); d2.setDate(d2.getDate() + 2);
  $("#rFrom").value = iso(d1); $("#rTo").value = iso(d2);
  $("#rFrom").min = $("#rTo").min = iso(today);
  const fmtDate = (s) => new Date(s + "T12:00:00").toLocaleDateString(L().locale, { weekday: "long", day: "numeric", month: "long" });
  const totalEl = $("#rvTotal"), tot = { v: 0 };
  function compute() {
    const car = CARS.find((c) => c.id === ($("input[name=rcar]:checked") || {}).value) || CARS[0];
    $("#rvCar").textContent = car.name;
    const a = $("#rFrom").value, b = $("#rTo").value;
    const days = a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) : 0;
    const d = L();
    if (days < 1) { $("#rvErr").textContent = d.errDates; $("#rvLines").innerHTML = ""; count(0); return null; }
    $("#rvErr").textContent = "";
    const lines = [[`${car.name} · ${d.day(days)}`, money(car.price * days)]];
    let total = car.price * days;
    if ($("#rChauffeur").checked) { lines.push([d.chauffeur, money(CHAUFFEUR * days)]); total += CHAUFFEUR * days; }
    lines.push([`${d.delivery} · ${$("#rWhere").selectedOptions[0].textContent}`, d.included]);
    lines.push([d.deposit, money(DEPOSIT)]);
    $("#rvLines").innerHTML = lines.map((l) => `<div class="rl"><span>${l[0]}</span><span>${l[1]}</span></div>`).join("");
    count(total);
    return { car, a, b, days, total };
  }
  function count(t) {
    if (!window.gsap || reduced || Math.abs(tot.v - t) < 1) { tot.v = t; totalEl.textContent = money(t); return; }
    gsap.to(tot, { v: t, duration: 0.8, ease: "power3.out", overwrite: true, onUpdate: () => { totalEl.textContent = money(tot.v); } });
  }
  $("#rvForm").addEventListener("input", compute);
  $("#rvForm").addEventListener("change", compute);
  const modal = $("#modal");
  let lastFocus = null;
  function closeModal() { modal.hidden = true; lock(false); if (lastFocus) lastFocus.focus(); }
  $("#rvForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = compute(); if (!r) return;
    const n = $("#rName"), t = $("#rTel");
    const okN = n.value.trim().length > 1, okT = (t.value.match(/\d/g) || []).length >= 8;
    n.classList.toggle("is-bad", !okN); t.classList.toggle("is-bad", !okT);
    if (!okN || !okT) { $("#rvErr").textContent = L().errForm; (okN ? t : n).focus(); return; }
    $("#mRef").textContent = "VL" + Math.random().toString(36).slice(2, 7).toUpperCase();
    $("#mRecap").textContent = L().recap({ car: r.car.name, a: fmtDate(r.a), b: fmtDate(r.b), where: L().where[$("#rWhere").value], time: $("#rTime").selectedOptions[0].textContent, chf: $("#rChauffeur").checked, total: money(r.total) });
    lastFocus = document.activeElement;
    modal.hidden = false; lock(true);
    modal.querySelector("[data-mclose].btn").focus();
    if (window.gsap && !reduced) gsap.fromTo(".modal__panel", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" });
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
    buildLists();
    compute();
    try { localStorage.setItem("velloria-lang", lang); } catch (e) { /* stockage indisponible */ }
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const onScroll = () => { if (!hasG()) nav.classList.toggle("is-solid", scene.getBoundingClientRect().bottom < 80); };
  if (!hasG()) addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Animations d'entrée et de défilement ---------- */
  function intro() {
    if (!hasG() || reduced) { heroLive = true; return; }
    const lines = $$("#heroTitle .ln > span");
    gsap.timeline({ onComplete: () => { heroLive = true; gsap.set(canvas, { clearProps: "filter" }); } })
      .fromTo(canvas, { filter: "brightness(0.15)" }, { filter: "brightness(1)", duration: 2.2, ease: "power2.inOut" })
      .from(lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.09 }, 0.35)
      .from(".hero .eyebrow, .hero__sub, .hero__cta > *", { y: 22, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, 0.8)
      .from(".nav, .scroll-cue", { opacity: 0, duration: 1 }, 1);
  }
  function scrollAnims() {
    if (!hasG()) return;
    if (reduced) return;
    gsap.from(".model__media", { clipPath: "inset(0 0 0 100%)", duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: ".model", start: "top 65%" } });
    gsap.fromTo(".model__name span:first-child", { xPercent: -8 }, { xPercent: 4, ease: "none", scrollTrigger: { trigger: ".model", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.fromTo(".model__name span:last-child", { xPercent: 8 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: ".model", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.from(".model__info > *", { y: 26, opacity: 0, duration: 1, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".model__info", start: "top 92%" } });
    gsap.from(".also__row", { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".also", start: "top 85%" } });
    $$("[data-reveal]").forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    gsap.from(".foot__brand", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 80%" } });
    gsap.from(".foot__ramp", { scaleX: 0, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".foot", start: "top 85%" } });
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
    size();
    addEventListener("resize", () => { clearTimeout(size._t); size._t = setTimeout(size, 120); });
    load(0); pump();
    if (hasG()) {
      stScene = ScrollTrigger.create({ trigger: scene, start: "top top", end: "bottom bottom" });
      stMani = ScrollTrigger.create({ trigger: mani, start: "top top", end: "bottom bottom" });
      ScrollTrigger.create({ trigger: scene, start: "bottom 80px", onEnter: () => nav.classList.add("is-solid"), onLeaveBack: () => nav.classList.remove("is-solid") });
      gsap.ticker.add(tick);
    } else requestAnimationFrame(tick);
    onScroll();

    const loader = $("#loader");
    const firstKeys = [0];
    for (let k = KEY; k < N; k += KEY * 2) firstKeys.push(k);
    const ready = () => (stillOk ? 1 : 0) + firstKeys.filter((k) => ok[k]).length;
    const need = firstKeys.length + 1;
    const t0 = performance.now();
    const fast = reduced || !hasG() || params.has("scroll");
    let ramped = false;
    if (!fast) {
      gsap.to(".loader__ramp", { scaleX: 1, duration: 1.3, ease: "expo.inOut" });
      gsap.to(".loader__brand", { opacity: 1, duration: 1.2, delay: 0.3 });
    }
    (function wait() {
      const r = ready() / need;
      $("#loadCount").textContent = String(Math.round(r * 100)).padStart(3, "0");
      const elapsed = performance.now() - t0;
      if ((r < 1 || (!fast && elapsed < 1500)) && elapsed < 6000) { setTimeout(wait, 60); return; }
      if (ramped) return; ramped = true;
      $("#loadCount").textContent = "100";
      scrollAnims();
      if (fast) { loader.remove(); heroLive = true; testScroll(); if (hasG()) ScrollTrigger.refresh(); return; }
      gsap.timeline({ onComplete: () => loader.remove() })
        .to(".loader__brand, .loader__count", { opacity: 0, duration: 0.4 })
        .to(".loader__ramp", { scaleY: 0, opacity: 0, duration: 0.6, ease: "expo.in" }, "<0.1")
        .to(loader, { opacity: 0, duration: 0.6 }, "-=0.2")
        .add(intro, "-=0.5");
    })();
  }

  if (document.readyState !== "loading") start(); else addEventListener("DOMContentLoaded", start);
  addEventListener("load", () => { if (hasG()) ScrollTrigger.refresh(); });
})();
