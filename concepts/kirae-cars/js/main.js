(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  /* ---------- Langue : anglais par défaut, français complet ---------- */
  const I = window.KIRAE_I18N;
  let LANG = document.documentElement.lang === "fr" ? "fr" : "en";
  const tr = (pair) => pair[LANG === "fr" ? 1 : 0];
  const J = (k) => tr(I.js[k]);
  const fill = (str, o) => str.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const locale = () => (LANG === "fr" ? "fr-FR" : "en-GB");
  const mad = (n) => Math.round(n).toLocaleString(locale()).replace(/\u202f/g, "\u00a0");
  const hasG = !!window.gsap && !!window.ScrollTrigger;
  const FX = hasG && !WK.reduced;
  if (!FX) document.documentElement.classList.remove("fx");

  const SEQ = { dir: "assets/seq/", count: 190, mobileDir: "assets/seq-m/", mobileCount: 95 };
  const HERO_SEQ = { dir: "assets/seq-hero/", count: 192, mobileDir: "assets/seq-hero-m/", mobileCount: 96 };
  const HERO_FOCUS = 0.62; /* même cadrage que la photo d'ouverture (object-position 62 %) */

  /* Flotte d'exemple : prix fictifs, en dirhams par jour */
  const CARS = [
    { id: "citadine", img: "assets/car-city.webp", thumb: "assets/car-city-t.webp", price: 350, txt: I.cars[0] },
    { id: "suv", img: "assets/car-suv.webp", thumb: "assets/car-suv-t.webp", price: 690, txt: I.cars[1] },
    { id: "van", img: "assets/car-van.webp", thumb: "assets/car-van-t.webp", price: 890, txt: I.cars[2] },
  ];
  const OPTS = [
    { id: "child", price: 30, perDay: true },
    { id: "driver", price: 50, perDay: true },
    { id: "cover", price: 90, perDay: true },
    { id: "late", price: 150, perDay: false },
  ];
  const DELIVERY = { aeroport: 0, medina: 100, gueliz: 0 };
  const carName = (c) => tr(c.txt.name);
  const optLabel = (o) => tr(I.opts[o.id]);

  WK.initScroll();
  WK.cursor();

  /* ---------- Flotte : un panneau par voiture ---------- */
  $("#fleetPanels").innerHTML = CARS.map((c, i) => `
    <article class="fl${i === 0 ? " is-on" : ""}" data-car="${c.id}">
      <figure class="fl__img"><img src="${c.img}" alt="" loading="lazy" width="861" height="1468"></figure>
      <div class="fl__txt">
        <h3 class="fl__name"><span></span></h3>
        <div class="fl__more">
          <p class="fl__line"></p>
          <div class="fl__specs"></div>
          <div class="fl__foot"><p class="fl__price"><b>${c.price}</b><span class="fl__unit"></span></p><button class="btn btn--ghost" type="button" data-pick="${c.id}"></button></div>
        </div>
      </div>
    </article>`).join("");

  /* ---------- Simulateur ---------- */
  $("#bkCars").innerHTML = CARS.map((c, i) => `
    <label class="opt-car"><input type="radio" name="car" value="${c.id}" ${i === 1 ? "checked" : ""}><img src="${c.thumb}" alt="" loading="lazy" width="480" height="334"><b></b><span></span></label>`).join("");
  $("#bkOpts").innerHTML = OPTS.map((o) => `
    <label class="opt"><input type="checkbox" value="${o.id}"><span></span><small></small></label>`).join("");
  $("#bTime").innerHTML = Array.from({ length: 16 }, (_, i) => `<option>${String(7 + i).padStart(2, "0")}:00</option>`).join("");
  $("#bTime").value = "10:00";

  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const d1 = new Date(today); d1.setDate(d1.getDate() + 14);
  const d2 = new Date(d1); d2.setDate(d2.getDate() + 5);
  ["bFrom", "qFrom"].forEach((id) => { $("#" + id).value = iso(d1); $("#" + id).min = iso(today); });
  ["bTo", "qTo"].forEach((id) => { $("#" + id).value = iso(d2); $("#" + id).min = iso(today); });

  const fmt = (s) => new Date(s + "T12:00:00").toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "long" });
  const nDays = (n) => `${n} ${n > 1 ? J("days") : J("day")}`;
  const totalObj = { v: 0 };
  let lastTotal = 0;
  function compute() {
    const car = CARS.find((c) => c.id === ($("input[name=car]:checked") || {}).value) || CARS[1];
    const a = $("#bFrom").value, b = $("#bTo").value;
    const days = a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) : 0;
    const err = $("#tErr");
    $("#tCar").textContent = carName(car);
    if (!a || !b || days < 1) {
      err.textContent = J("errDates");
      $("#tDates").textContent = ""; $("#tLines").innerHTML = ""; setTotal(0); $("#bookBtn").disabled = true; return null;
    }
    err.textContent = ""; $("#bookBtn").disabled = false;
    $("#tDates").textContent = `${fmt(a)} → ${fmt(b)} · ${nDays(days)}`;
    const lines = [[`${car.price} MAD × ${nDays(days)}`, car.price * days]];
    $$("#bkOpts input:checked").forEach((i) => { const o = OPTS.find((x) => x.id === i.value); lines.push([optLabel(o), o.perDay ? o.price * days : o.price]); });
    const place = $("#bPlace").value;
    if (DELIVERY[place]) lines.push([J("delivery"), DELIVERY[place]]);
    let total = lines.reduce((s, l) => s + l[1], 0);
    let disc = 0;
    if (days >= 7) { disc = Math.round(car.price * days * 0.1); total -= disc; }
    $("#tLines").innerHTML = lines.map((l) => `<div class="tl"><span>${l[0]}</span><span>${mad(l[1])}</span></div>`).join("") +
      (disc ? `<div class="tl tl--disc"><span>${J("discount")}</span><span>−${mad(disc)}</span></div>` : "") +
      `<div class="tl"><span>${J("mileage")}</span><span>${J("unlimited")}</span></div>`;
    setTotal(total);
    return { car, a, b, days, total, place };
  }
  function setTotal(t) {
    if (!window.gsap || WK.reduced) { $("#tTotal").textContent = mad(t); return; }
    gsap.to(totalObj, { v: t, duration: 0.7, ease: "power3.out", onUpdate: () => $("#tTotal").textContent = mad(totalObj.v) });
    if (t !== lastTotal) gsap.fromTo("#tTotal", { color: "#e2a15c" }, { color: "#f3ebdf", duration: 0.8 });
    lastTotal = t;
  }
  $("#bookForm").addEventListener("input", compute);
  $("#bookForm").addEventListener("change", compute);

  const goBook = (d) => WK.lenis ? WK.lenis.scrollTo("#reserver", { duration: d, offset: -nav.offsetHeight }) : $("#reserver").scrollIntoView({ behavior: WK.reduced ? "auto" : "smooth" });
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pick]");
    if (!p) return;
    const r = $(`input[name=car][value=${p.dataset.pick}]`); if (r) { r.checked = true; compute(); }
    goBook(1.6);
  });
  $("#quick").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#bFrom").value = $("#qFrom").value; $("#bTo").value = $("#qTo").value; $("#bPlace").value = $("#qPlace").value;
    compute(); goBook(2);
  });

  const modal = $("#modal");
  const closeModal = () => { modal.hidden = true; WK.lock(false); $("#bookBtn").focus(); };
  $("#bookBtn").addEventListener("click", () => {
    const r = compute(); if (!r) return;
    const name = $("#bName"), phone = $("#bPhone");
    const okN = name.value.trim().length > 1, okP = /[0-9]{6,}/.test(phone.value.replace(/\D/g, ""));
    name.classList.toggle("is-bad", !okN); phone.classList.toggle("is-bad", !okP);
    if (!okN || !okP) { $("#tErr").textContent = J("errForm"); (okN ? phone : name).focus(); return; }
    $("#mRef").textContent = "KR-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    $("#mRecap").textContent = fill(J("recap"), { car: carName(r.car), a: fmt(r.a), b: fmt(r.b), place: tr(I.js.pick[r.place]), time: $("#bTime").value, total: mad(r.total) });
    modal.hidden = false; WK.lock(true);
    $(".modal__panel button").focus();
    if (window.gsap && !WK.reduced) gsap.fromTo(".modal__panel", { y: 40, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .7, ease: "expo.out" });
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-mclose]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > innerHeight * (FX ? (WK.small ? 3.1 : 3.5) : 0.9));
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Ouverture : profondeur à la souris (ordinateur) ---------- */
  const heroGl = (!WK.small && !WK.touch) ? WK.gl($("#heroMedia"), { src: "assets/hero.webp", mode: "depth", subject: [0.675, 0.27, 0.12, 0.14], focus: [0.62, 0.5], strength: 0.028, zoom: 1.04 }) : null;

  /* ---------- Manifeste : mots découpés ---------- */
  const mt = $("#manifestText");
  let words = [];
  const manifest = { p: 0 };
  function splitManifest() {
    const HL = J("highlight");
    mt.innerHTML = mt.textContent.trim().split(/\s+/).map((w) => `<span class="wd${HL.includes(w.replace(/[,.]$/, "")) ? " hl" : ""}">${w}</span>`).join(" ");
    words = $$(".wd", mt);
    paintManifest();
  }
  function paintManifest() {
    if (!FX) return;
    const n = words.length;
    words.forEach((w, i) => { const t = Math.min(1, Math.max(0, manifest.p * (n + 2) - i)); w.style.opacity = 0.14 + 0.86 * t; });
  }

  /* ---------- Application de la langue ---------- */
  function applyLang(l, save) {
    LANG = l === "fr" ? "fr" : "en";
    const root = document.documentElement;
    root.lang = LANG;
    $$("[data-i18n]").forEach((el) => { const v = I.t[el.dataset.i18n]; if (v) el.innerHTML = tr(v); });
    $$("[data-i18n-attr]").forEach((el) => el.dataset.i18nAttr.split(";").forEach((pair) => { const [attr, key] = pair.split(":"); if (I.t[key]) el.setAttribute(attr, tr(I.t[key])); }));
    document.title = tr(I.meta.title);
    const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute("content", tr(I.meta.desc));
    $$(".lang [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
    CARS.forEach((c) => {
      const f = $(`.fl[data-car="${c.id}"]`);
      f.querySelector(".fl__name span").textContent = carName(c);
      f.querySelector(".fl__line").textContent = tr(c.txt.line);
      f.querySelector(".fl__specs").innerHTML = tr(c.txt.specs).map((x) => `<span>${x}</span>`).join("");
      f.querySelector(".fl__unit").textContent = J("perDay");
      f.querySelector("[data-pick]").textContent = J("choose");
      f.querySelector(".fl__img img").alt = fill(J("carAlt"), { name: carName(c) });
      const o = $(`input[name=car][value="${c.id}"]`).parentNode;
      o.querySelector("b").textContent = carName(c);
      o.querySelector("span").textContent = `${c.price} ${J("perDay")}`;
    });
    OPTS.forEach((o) => {
      const el = $(`#bkOpts input[value="${o.id}"]`).parentNode;
      el.querySelector("span").textContent = optLabel(o);
      el.querySelector("small").textContent = `${o.price} MAD / ${o.perDay ? J("unitDay") : J("unitFlat")}`;
    });
    splitManifest();
    compute();
    if (save) { try { localStorage.setItem("kirae-lang", LANG); } catch (e) { /* stockage indisponible */ } }
    if (save && window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  applyLang(LANG, false);
  $$(".lang [data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== LANG) applyLang(b.dataset.lang, true); }));

  /* ---------- Séquence ---------- */
  const seqEl = $("#seq");
  /* la séquence de la palmeraie ne commence à charger qu'à l'approche de sa section */
  let seq = null, seqWant = 0;
  const startSeq = () => { if (seq) return; seq = WK.sequence({ canvas: $("#seqCanvas"), ...SEQ, fit: "cover", focusX: 0.5, onMissing: () => seqEl.classList.add("no-seq") }); seq.set(seqWant); };
  /* démarrage : à l'approche de la section (voir scrollAnims), ou au plus tard 5 s après le chargement */
  if (FX) addEventListener("load", () => setTimeout(startSeq, 5000));

  /* ouverture : le drone suit le SUV sur la piste */
  const heroEl = $("#hero");
  const heroSeq = FX ? WK.sequence({ canvas: $("#heroSeq"), ...HERO_SEQ, fit: "cover", focusX: HERO_FOCUS, onMissing: () => heroEl.classList.add("no-seq") }) : null;
  const caps = $$(".cap");
  let capOn = -1;
  function showCap(i) {
    if (i === capOn) return;
    const prev = caps[capOn]; capOn = i;
    $("#seqNum").textContent = String(i + 1).padStart(2, "0");
    if (!FX) return;
    if (prev) gsap.to(prev, { autoAlpha: 0, y: -40, duration: .4, ease: "power2.in", overwrite: true });
    const h = caps[i].querySelector("h2"), rest = caps[i].querySelectorAll("p");
    gsap.set(caps[i], { autoAlpha: 1, y: 0, overwrite: true });
    gsap.fromTo(h, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: "expo.out", delay: prev ? .15 : 0, overwrite: true });
    gsap.fromTo(rest, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: "power3.out", delay: prev ? .3 : .15, stagger: .05, overwrite: true });
  }
  function seqProgress(p) {
    seqWant = p; if (seq) seq.set(p);
    $("#seqFill").style.transform = `scaleX(${p})`;
    let k = 0; caps.forEach((c, i) => { if (p >= parseFloat(c.dataset.at)) k = i; });
    showCap(k);
  }

  function intro() {
    const tl = gsap.timeline();
    const chars = $$(".hero__line").map((l) => WK.splitChars(l)).flat();
    tl.fromTo("#heroFrame", { clipPath: "inset(46% 0% 46% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" })
      .from("#heroMedia", { scale: 1.3, duration: 2.6, ease: "expo.out" }, "<0.15")
      .from(chars, { yPercent: 105, duration: 1.2, ease: "power4.out", stagger: 0.03 }, "-=1.5")
      .from(".hero__content .eyebrow, .hero__sub, .hero__cta", { y: 20, opacity: 0, duration: 1, stagger: .1, ease: "power3.out" }, "-=.9")
      .from(".quick", { y: 40, opacity: 0, duration: 1.1, ease: "expo.out" }, "-=.8")
      .from(".nav, .hero__hint", { opacity: 0, duration: .8 }, "-=1");
  }

  function scrollAnims() {
    const mm = gsap.matchMedia();

    /* 1. le drone suit la voiture sur la piste, puis la nuit tombe */
    const hp = { v: 0 };
    /* la photo WebGL est couverte par la séquence dès les premiers pixels : elle s'arrête de dessiner */
    gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: () => "+=" + innerHeight * (WK.small ? 2.2 : 2.6), pin: true, scrub: 0.6, anticipatePin: 1,
      onUpdate: (s) => { if (heroGl) heroGl.paused = s.progress > 0.04; } } })
      .to(hp, { v: 1, ease: "none", duration: 1, onUpdate: () => heroSeq && heroSeq.set(hp.v) }, 0)
      .to("#heroSeq", { opacity: 1, ease: "none", duration: .03 }, 0)
      .to("#heroContent", { yPercent: -30, opacity: 0, ease: "none", duration: .22 }, 0)
      .to("#heroUi", { y: 40, opacity: 0, ease: "none", duration: .12 }, 0)
      .fromTo("#heroCap", { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "power2.out", duration: .14 }, .36)
      .to("#heroCap", { autoAlpha: 0, y: -40, ease: "power2.in", duration: .12 }, .7)
      .to("#heroCam", { scale: 1.08, ease: "none", duration: 1 }, 0)
      .to("#heroBlack", { opacity: 1, ease: "power1.in", duration: .16 }, .84);

    /* 2. manifeste mot par mot */
    gsap.timeline({ scrollTrigger: { trigger: "#manifest", start: "top top", end: () => "+=" + innerHeight * 1.1, pin: true, scrub: 0.5 } })
      .to(manifest, { p: 1, ease: "none", duration: .6, onUpdate: paintManifest })
      .to({}, { duration: .3 });

    /* 3. séquence épinglée */
    ScrollTrigger.create({ trigger: seqEl, start: "top 300%", once: true, onEnter: startSeq });
    ScrollTrigger.create({ trigger: seqEl, start: "top top", end: () => "+=" + innerHeight * (WK.small ? 2.6 : 3.4), pin: true, scrub: 0.6, onUpdate: (s) => seqProgress(s.progress) });
    gsap.fromTo("#seqCanvas", { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: seqEl, start: "top bottom", end: "top top", scrub: true } });

    /* 4. flotte : une voiture par écran */
    const fls = $$(".fl"), num = $("#fleetNum");
    const ftl = gsap.timeline({ scrollTrigger: { trigger: "#fleetStage", start: "top top", end: () => "+=" + innerHeight * 2.4, pin: true, scrub: 0.6,
      onUpdate: (s) => { const k = Math.min(fls.length - 1, Math.floor(s.progress * fls.length * 0.999 + 0.25)); fls.forEach((f, i) => f.classList.toggle("is-on", i === k)); num.textContent = "0" + (k + 1); } } });
    ftl.to({}, { duration: .35 });
    fls.forEach((f, i) => {
      if (!i) return;
      const prev = fls[i - 1];
      ftl.to(prev.querySelector(".fl__name span"), { yPercent: -110, ease: "power2.in", duration: .35 }, ">")
        .to(prev.querySelector(".fl__more"), { opacity: 0, y: -20, duration: .25 }, "<")
        .to(prev.querySelector(".fl__img img"), { scale: 1.08, yPercent: -6, ease: "none", duration: .7 }, "<")
        .fromTo(f.querySelector(".fl__img"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power3.inOut", duration: .7 }, "<")
        .fromTo(f.querySelector(".fl__img img"), { scale: 1.3 }, { scale: 1, ease: "power2.out", duration: .9 }, "<")
        .fromTo(f.querySelector(".fl__name span"), { yPercent: 110, opacity: 1 }, { yPercent: 0, ease: "power3.out", duration: .45 }, "<.3")
        .fromTo(f.querySelector(".fl__more"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .35 }, "<.15")
        .to({}, { duration: .35 });
    });

    /* 5. remise des clés : lent travelling avant */
    gsap.fromTo("#keysMedia img", { scale: 1.22, yPercent: -4 }, { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".keys", start: "top bottom", end: "bottom top", scrub: true } });

    /* routes : lignes qui se dessinent */
    $$(".route__svg path").forEach((p) => {
      const L = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: `${L} ${L}`, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut", scrollTrigger: { trigger: p, start: "top 88%" }, onComplete: () => gsap.set(p, { strokeDasharray: "5 8" }) });
    });
    gsap.from(".bk, .ticket", { y: 50, opacity: 0, stagger: .08, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".book__wrap", start: "top 85%" } });
    gsap.fromTo(".final__media img", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".final", start: "top bottom", end: "bottom bottom", scrub: true } });
    mm.add("(min-width: 760px)", () => {
      gsap.from(".route", { y: 60, opacity: 0, stagger: .12, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".routes__list", start: "top 85%" } });
    });
    WK.reveals(); WK.counters();
  }

  function start() {
    const first = (WK.small ? HERO_SEQ.mobileDir : HERO_SEQ.dir) + "f_001.webp";
    const urls = [WK.small ? "assets/hero-m.webp" : "assets/hero.webp", first];
    if (!FX) {
      WK.preload(urls).then(() => { const l = $("#loader"); if (l) l.remove(); if (hasG) { WK.reveals(); WK.counters(); } else $$("[data-reveal]").forEach((e) => e.style.opacity = 1); seqProgress(0); });
      return;
    }
    const prog = { v: 0 };
    WK.preload(urls, (p) => gsap.to(prog, { v: p, duration: .5, onUpdate: () => { $("#loadCount").textContent = Math.round(prog.v * 100); $("#loadFill").style.width = prog.v * 100 + "%"; } }))
      .then(() => new Promise((r) => setTimeout(r, 500)))
      .then(() => {
        $("#loadCount").textContent = "100"; $("#loadFill").style.width = "100%";
        gsap.timeline({ onComplete: () => { $("#loader").remove(); } })
          .to(".loader__brand, .loader__bar, .loader__count", { opacity: 0, y: -10, duration: .45, ease: "power2.in" })
          .to(".loader", { opacity: 0, duration: .4 }, "-=.1")
          .add(intro, "-=.35");
        scrollAnims(); seqProgress(0);
      });
  }
  WK.magnetic("[data-magnetic]");
  if (document.readyState !== "loading") start(); else addEventListener("DOMContentLoaded", start);
  const refresh = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };
  addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
