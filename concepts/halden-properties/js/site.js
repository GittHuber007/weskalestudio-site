/* Halden Properties : voyage dans la tour, simulateur et prise de rendez-vous.
   Projet fictif, prix d'exemple. Anglais par défaut, français via window.I18N. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const L = () => (window.I18N && window.I18N.lang === "fr" ? "fr" : "en");
  const nf = (v) => (L() === "fr" ? Math.round(v).toLocaleString("fr-FR").replace(/ | /g, " ") : Math.round(v).toLocaleString("en-US"));
  const aed = (v) => (L() === "fr" ? nf(v) + " AED" : "AED " + nf(v));

  /* Surfaces : m² en français, pieds carrés en anglais (usage à Dubaï). */
  const RES = [
    { t: { en: "One bedroom", fr: "Une chambre" }, m2: 80, sqft: 860, base: 2350000, floors: [8, 40] },
    { t: { en: "Two bedrooms", fr: "Deux chambres" }, m2: 132, sqft: 1420, base: 3900000, floors: [12, 56] },
    { t: { en: "Three bedrooms", fr: "Trois chambres" }, m2: 212, sqft: 2280, base: 6400000, floors: [30, 66] },
    { t: { en: "Penthouse", fr: "Penthouse" }, m2: 641, sqft: 6900, base: 24000000, floors: [69, 72] },
  ];
  const VIEWS = [{ t: { en: "Gulf view", fr: "Vue Golfe" }, k: 1.1 }, { t: { en: "City view", fr: "Vue Ville" }, k: 1 }];
  const TX = {
    en: {
      level: "Level", area: (r) => r.sqft.toLocaleString("en-US") + " sq ft", unit: (r, p) => aed(p / r.sqft) + " per sq ft",
      plan: [["On booking", 0.1], ["During construction, in six instalments", 0.5], ["On handover, late 2029", 0.4]],
      times: ["10:00", "11:30", "14:00", "16:30", "18:00"], fmt: ["at the sales gallery", "by video call"],
      err: "Please add your name and a valid email address.",
      ok: (n, d, t, f, r) => `Thank you, ${n}. Demo request saved: ${d} at ${t}, ${f}. Residence: ${r}. On the live site, an advisor would confirm the slot by email.`,
      locale: "en-GB",
    },
    fr: {
      level: "Niveau", area: (r) => r.m2 + " m²", unit: (r, p) => aed(p / r.m2) + " le m²",
      plan: [["À la réservation", 0.1], ["Pendant les travaux, en six versements", 0.5], ["À la remise des clés, fin 2029", 0.4]],
      times: ["10 h 00", "11 h 30", "14 h 00", "16 h 30", "18 h 00"], fmt: ["à la galerie de vente", "en visio"],
      err: "Indiquez votre nom et une adresse e-mail valide.",
      ok: (n, d, t, f, r) => `Merci, ${n}. Demande de démonstration enregistrée : ${d} à ${t}, ${f}. Résidence : ${r}. Sur le vrai site, un conseiller confirmerait le créneau par e-mail.`,
      locale: "fr-FR",
    },
  };
  const T = () => TX[L()];

  window.SITE = {
    intro(tl, core) {
      tl.add(core.revealSplit($(".vt__a")), "-=0.45");
      tl.add(core.revealSplit($(".vt__b"), 0.2), "<");
      tl.fromTo("[data-intro-fade]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1, ease: "power3.out" }, "-=1.1");
      tl.fromTo(".nav,.level", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, "-=1.1");
      tl.fromTo(".voy__media", { scale: 1.08 }, { scale: 1, duration: 2.8, ease: "expo.out" }, 0.5);
    },
    after(core) {
      core.navState($("#nav"));
      voyage(core);
      terrace(core);
      const sim = simulator();
      booking(sim);
      $$("[data-estimate]").forEach((b) => b.addEventListener("click", () => { sim.set(+b.dataset.estimate); go("#simulateur", core); }));
    },
  };

  function go(id, core) { const t = $(id); if (!t) return; if (core.lenis) core.lenis.scrollTo(t, { offset: core.headerOffset ? core.headerOffset(t) : 0, duration: 1.2 }); else t.scrollIntoView({ behavior: core.reduce ? "auto" : "smooth" }); }

  /* ---------- Le voyage ----------
     Une seule section épinglée, une seule caméra :
     1. montée le long de la façade (séquence d'images) ;
     2. la caméra plonge dans l'étage éclairé sous l'enseigne, qui s'ouvre sur le penthouse ;
     3. descente d'étage en étage, chaque résidence remonte par le bas de l'écran. */
  function voyage(core) {
    const root = $(".voy"), seq = root._seq;
    const slides = $$(".slide", root), imgs = slides.map((s) => $("img", s));
    const chaps = $$(".chap", root), hero = $(".voy__hero", root), title = $(".voy__title", root);
    const canvas = $("canvas", root), num = $("#levelNum"), bar = $("#levelBar");
    const anim = document.documentElement.classList.contains("anim");
    if (!anim || !seq) { root.classList.add("voy--static"); if (seq) seq.set(0); return; }

    const pool = (core.narrow() ? root.dataset.poolM : root.dataset.poolD).split(",").map(Number);
    const R = 3.6, DV = 1.1, HOLD = 0.55, S = 1.0, END = 0.35;
    const T = R + DV + HOLD + S * 3 + END;
    const LEVELS = [72, 48, 30, 16];
    const CH = [[0.55, 1.45], [1.6, 2.5], [2.65, 3.45]];
    const win = (t, a, b, f = 0.22) => clamp((t - a) / f) * clamp((b - t) / f);
    let lastActive = -2, lastNum = "";
    /* Taille de la section lue au rafraîchissement, jamais pendant le défilement. */
    let VW = root.clientWidth, VH = root.clientHeight;
    /* Longueur épinglée : 390 vh sur ordinateur, 290 vh sur téléphone (avant 860 vh). Les étapes restent les mêmes, resserrées. */
    const LEN = () => (core.narrow() ? 2.9 : 3.9);
    seq.anchor = [(pool[0] + pool[2]) / 2, (pool[1] + pool[3]) / 2];

    function update(prog) {
      const t = prog * T;
      // 1. Montée
      const p = clamp(t / R);
      // La vidéo part de l'image d'ouverture (même cadre, même nom) : bref fondu de la photo 2K vers la séquence.
      canvas.style.opacity = smooth(clamp(t / 0.15)).toFixed(3);
      const k = clamp(t / 0.55);
      title.style.transform = `translate3d(0,${-k * 6}vh,0) scale(${1 + k * 0.28})`;
      hero.style.opacity = (1 - smooth(k)).toFixed(3);
      hero.style.visibility = k >= 1 ? "hidden" : "";
      chaps.forEach((c, i) => { const a = win(t, CH[i][0], CH[i][1]); c.style.opacity = a.toFixed(3); c.style.transform = `translate3d(0,${(1 - a) * 3}vh,0)`; c.style.visibility = a > 0 ? "visible" : "hidden"; });
      // 2. Plongée dans l'étage éclairé sous l'enseigne du sommet
      const d = clamp((t - R) / DV), de = d * d;
      const z = 1 + de * 6.5;
      if (z !== seq.zoom) { seq.zoom = z; seq.dirty = true; }
      seq.set(p);
      const s0 = slides[0];
      if (d <= 0) { s0.style.clipPath = "inset(50% 50% 50% 50%)"; s0.style.opacity = 0; }
      else {
        const r = seq.rectOf(pool[0], pool[1], pool[2], pool[3]), vw = VW, vh = VH;
        const f = smooth(clamp((d - 0.38) / 0.62));
        const l = r.l * (1 - f), tp = r.t * (1 - f), rr = (vw - r.r) * (1 - f), b = (vh - r.b) * (1 - f);
        s0.style.clipPath = `inset(${tp.toFixed(1)}px ${rr.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${(2 * (1 - f)).toFixed(1)}px)`;
        s0.style.opacity = clamp(d / 0.12).toFixed(3);
        imgs[0].style.transform = `scale(${1.5 - 0.5 * smooth(d)})`;
      }
      // 3. Descente d'étage en étage
      const t0 = R + DV + HOLD;
      let active = d >= 1 ? 0 : -1, lvl = Math.round(72 * p);
      for (let i = 1; i < slides.length; i++) {
        const s = clamp((t - (t0 + (i - 1) * S)) / S), e = smooth(s);
        slides[i].style.clipPath = `inset(${((1 - e) * 100).toFixed(2)}% 0% 0% 0%)`;
        imgs[i].style.transform = `scale(${1.2 - 0.2 * e}) translate3d(0,${(1 - e) * 8}%,0)`;
        if (s > 0) imgs[i - 1].style.transform = `scale(1) translate3d(0,${-e * 10}%,0)`;
        if (s >= 0.5) active = i;
        if (s > 0) lvl = Math.round(LEVELS[i - 1] + (LEVELS[i] - LEVELS[i - 1]) * e);
      }
      if (d > 0 && t < t0) lvl = 72;
      if (active !== lastActive) { slides.forEach((s, i) => s.classList.toggle("on", i === active)); lastActive = active; }
      const nt = String(lvl).padStart(2, "0");
      if (nt !== lastNum) { num.textContent = nt; lastNum = nt; }
      bar.style.transform = `scaleY(${(lvl / 72).toFixed(3)})`;
    }

    const st = ScrollTrigger.create({
      trigger: root, start: "top top", end: () => "+=" + Math.round(window.innerHeight * LEN()), pin: true, scrub: 0.4, anticipatePin: 1,
      onUpdate: (st) => update(st.progress), onRefresh: (st) => { VW = root.clientWidth; VH = root.clientHeight; update(st.progress); },
    });
    update(0);
    /* Le lien « Résidences » mène au moment où le penthouse remplit l'écran. */
    $$('a[href="#residences"]').forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); e.stopImmediatePropagation();
      const y = st.start + (st.end - st.start) * ((R + DV + 0.15) / T);
      if (core.lenis) core.lenis.scrollTo(y, { duration: 1.8 }); else window.scrollTo(0, y);
    }, true));
    if (core.fine) root.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      gsap.to(seq, { px: -nx * 0.01, py: -ny * 0.008, duration: 1.4, ease: "power3", overwrite: true, onUpdate: () => { seq.dirty = true; seq.draw(); } });
    });
  }

  /* ---------- Terrasse : la caméra recule lentement ---------- */
  function terrace(core) {
    if (!window.gsap || core.reduce) return;
    gsap.fromTo(".ter__media img", { scale: 1.22, yPercent: -4 }, { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".ter", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.fromTo(".rdv__bg img", { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: "none", scrollTrigger: { trigger: ".rdv", start: "top bottom", end: "bottom top", scrub: 0.4 } });
  }

  /* ---------- Simulateur ---------- */
  function simulator() {
    const st = { type: 1, floor: 36, view: 0 };
    const tEl = $("#simType"), vEl = $("#simView"), floor = $("#simFloor"), price = $("#simPrice"), shown = { v: 0 };
    const press = (el, i) => el.querySelectorAll("button").forEach((x, k) => x.setAttribute("aria-pressed", String(k === i)));
    function render() {
      const l = L();
      tEl.innerHTML = RES.map((r, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.type}">${r.t[l]}<small>${T().area(r)}</small></button>`).join("");
      vEl.innerHTML = VIEWS.map((v, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.view}">${v.t[l]}</button>`).join("");
    }
    const clampFloor = () => { const [a, b] = RES[st.type].floors; floor.min = a; floor.max = b; st.floor = Math.min(b, Math.max(a, st.floor)); floor.value = st.floor; };
    tEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st.type = +b.dataset.i; press(tEl, st.type); clampFloor(); calc(); });
    vEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st.view = +b.dataset.i; press(vEl, st.view); calc(); });
    floor.addEventListener("input", () => { st.floor = +floor.value; calc(); });
    const out = (v) => (price.innerHTML = nf(v) + "<small>AED</small>");
    function calc(instant) {
      const r = RES[st.type], l = L(), tx = T();
      const p = r.base * (1 + (st.floor - r.floors[0]) * 0.006) * VIEWS[st.view].k;
      $("#simFloorOut").textContent = tx.level + " " + st.floor;
      $("#simMeta").textContent = `${r.t[l]} · ${tx.area(r)} · ${tx.level} ${st.floor} · ${VIEWS[st.view].t[l]} · ${tx.unit(r, p)}`;
      if (window.gsap && !instant) gsap.to(shown, { v: p, duration: 0.7, ease: "power2.out", onUpdate: () => out(shown.v) }); else { shown.v = p; out(p); }
      $("#plan").innerHTML = tx.plan.map(([lb, k]) => `<div class="plan__row"><span>${lb}</span><span>${Math.round(k * 100)}${l === "fr" ? " " : ""}%</span><span>${aed(p * k)}</span><i style="--k:${k / 0.5}"></i></div>`).join("");
    }
    render(); clampFloor(); calc();
    document.addEventListener("langchange", () => { render(); calc(true); });
    return { set(i) { st.type = i; press(tEl, i); clampFloor(); calc(); }, get type() { return st.type; } };
  }

  /* ---------- Prise de rendez-vous (démonstration, rien n'est envoyé) ---------- */
  function booking(sim) {
    const f = $("#rdvForm"), msg = $("#rdvMsg"), sel = $("#rdvType"), dayEl = $("#rdvDay"), timeEl = $("#rdvTime"), fmtEl = $("#rdvFmt");
    const days = [], d = new Date();
    while (days.length < 6) { d.setDate(d.getDate() + 1); days.push(new Date(d)); }
    const st = { day: 0, time: 1, fmt: 0 };
    let sent = null;
    function render() {
      const l = L(), loc = T().locale;
      const keep = sel.value || "1";
      sel.innerHTML = RES.map((r, i) => `<option value="${i}">${r.t[l]}</option>`).join(""); sel.value = keep;
      const wd = new Intl.DateTimeFormat(loc, { weekday: "short" }), dm = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" });
      dayEl.innerHTML = days.map((x, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.day}"><small>${wd.format(x).replace(".", "")}</small>${dm.format(x).replace(".", "")}</button>`).join("");
      timeEl.innerHTML = T().times.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="${i === st.time}">${t}</button>`).join("");
      if (sent) message(); else if (msg.classList.contains("err")) msg.textContent = T().err;
    }
    function message() {
      const full = new Intl.DateTimeFormat(T().locale, { weekday: "long", day: "numeric", month: "long" });
      msg.textContent = T().ok(sent.name, full.format(days[sent.day]), T().times[sent.time], T().fmt[sent.fmt], RES[sent.type].t[L()]);
    }
    const group = (el, key) => el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st[key] = $$("button", el).indexOf(b); $$("button", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
    group(dayEl, "day"); group(timeEl, "time"); group(fmtEl, "fmt");
    $("#simRdv").addEventListener("click", () => { sel.value = String(sim.type); });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.name.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value)) { msg.textContent = T().err; msg.classList.add("err"); return; }
      msg.classList.remove("err");
      sent = { name: f.name.value.trim().split(" ")[0], day: st.day, time: st.time, fmt: st.fmt, type: +sel.value };
      message();
      f.querySelector("button[type=submit]").disabled = true;
    });
    render();
    document.addEventListener("langchange", render);
  }
})();
