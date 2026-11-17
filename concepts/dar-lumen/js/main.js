/* Dar Lumen, concept Weskale Studio (marque fictive).
   Anglais par défaut, français complet par le sélecteur EN / FR.
   Le contenu reste lisible sans JavaScript : seuls les états animés dépendent de ce fichier. */
(function () {
  "use strict";
  const W = window, D = document, H = D.documentElement;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const NB = " ";

  /* ---------- Textes : [anglais, français] ---------- */
  const T = {
    "meta.title": ["Dar Lumen · Prestige real estate in Casablanca", "Dar Lumen · Immobilier de prestige à Casablanca"],
    "meta.desc": ["Dar Lumen, a prestige real estate agency concept in Casablanca. Fictional brand, Weskale Studio concept.", "Dar Lumen, concept d'agence d'immobilier de prestige à Casablanca. Marque fictive, concept Weskale Studio."],
    "nav.home": ["Dar Lumen, back to top", "Dar Lumen, retour en haut"],
    "nav.label": ["Main navigation", "Navigation principale"],
    "nav.biens": ["Properties", "Biens"],
    "nav.estim": ["Valuation", "Estimation"],
    "nav.cta": ["Private viewing", "Visite privée"],
    "nav.ctaS": ["Viewing", "Visite"],
    "lang.label": ["Language", "Langue"],
    "film.label": ["Arrival at Villa Horizon", "Arrivée à la villa Horizon"],
    "film.alt": ["White contemporary villa at blue hour, infinity pool, palm trees and ocean, brass Dar Lumen sign in the foreground", "Villa contemporaine blanche à l'heure bleue, piscine à débordement, palmiers et océan, enseigne en laiton Dar Lumen au premier plan"],
    "film.tag": ["Prestige real estate in Casablanca", "Immobilier de prestige à Casablanca"],
    "film.scroll": ["Scroll", "Faire défiler"],
    "b1.k": ["01 · Arrival", "01 · L'arrivée"],
    "b1.t": ["A house is discovered <em>in the order</em> it is lived in.", "On découvre une maison <em>dans l'ordre</em> où on la vit."],
    "b1.s": ["The pool, the facade, then the threshold. Every property is filmed at the hour its lights come on.", "Le bassin, la façade, puis le seuil. Chaque bien est filmé à l'heure où il s'allume."],
    "f.surf": ["Living area", "Surface"],
    "f.rooms": ["Bedrooms", "Chambres"],
    "f.land": ["Plot", "Terrain"],
    "f.landV": ["1,450 m²", "1" + NB + "450 m²"],
    "f.price": ["Example price", "Prix d'exemple"],
    "f.priceV": ["MAD 24.5 M", "24,5 M MAD"],
    "b3.k": ["03 · The viewing", "03 · La visite"],
    "b3.t": ["The rest is seen <em>by appointment.</em>", "Le reste se visite <em>sur rendez-vous.</em>"],
    "bi.k": ["November selection", "Sélection de novembre"],
    "bi.h": ["The <em>properties</em>", "Les <em>biens</em>"],
    "bi.lead": ["Six houses and apartments in Casablanca. One is shown on film here. The others are presented by appointment, with the full file.", "Six maisons et appartements à Casablanca. Un seul est montré en film ici. Les autres sont présentés sur rendez-vous, dossier complet à l'appui."],
    "bi.form": ["Search properties", "Rechercher un bien"],
    "bi.empty": ["No property matches. Widen the budget or the neighbourhood.", "Aucun bien ne correspond. Élargissez le budget ou le quartier."],
    "bi.one": ["property", "bien"],
    "bi.many": ["properties", "biens"],
    "bi.film": ["The film above", "Le film en ouverture"],
    "bi.rdv": ["By appointment", "Sur rendez-vous"],
    "bi.rooms": ["bedrooms", "chambres"],
    "bi.ask": ["Request a viewing of", "Demander une visite de"],
    "l.zone": ["Neighbourhood", "Quartier"],
    "l.type": ["Type", "Type"],
    "l.max": ["Maximum budget", "Budget maximal"],
    "l.ptype": ["Property type", "Type de bien"],
    "l.surf": ["Living area", "Surface habitable"],
    "l.opts": ["Features", "Atouts"],
    "l.bien": ["Property", "Bien"],
    "l.day": ["Day", "Jour"],
    "l.time": ["Time", "Heure"],
    "l.name": ["Name", "Nom"],
    "l.tel": ["Phone", "Téléphone"],
    "o.all": ["All", "Tous"],
    "o.nolimit": ["No limit", "Sans limite"],
    "o.8": ["MAD 8 M", "8 M MAD"],
    "o.15": ["MAD 15 M", "15 M MAD"],
    "o.20": ["MAD 20 M", "20 M MAD"],
    "o.sea": ["Sea view", "Vue mer"],
    "o.pool": ["Pool", "Piscine"],
    "o.works": ["Work needed", "Travaux à prévoir"],
    "t.villa": ["Villa", "Villa"],
    "t.appart": ["Apartment", "Appartement"],
    "t.maison": ["Townhouse", "Maison de ville"],
    "es.k": ["You are selling", "Vous vendez"],
    "es.h": ["A <em>valuation</em>", "Une <em>estimation</em>"],
    "es.lead": ["An initial range straight away, based on example prices per square metre. The real valuation is done on site, with an adviser.", "Une première fourchette tout de suite, à partir de prix au mètre carré d'exemple. L'estimation réelle se fait sur place, avec un conseiller."],
    "es.range": ["Indicative range", "Fourchette indicative"],
    "es.to": ["to", "à"],
    "es.note": ["Demonstration calculation. It does not replace an on-site valuation.", "Calcul de démonstration. Il ne remplace pas une estimation sur place."],
    "es.btn": ["Request an on-site valuation", "Demander l'estimation sur place"],
    "es.done": ["Request recorded for the demonstration. In the real version, an adviser calls you back to arrange the valuation visit.", "Demande enregistrée en démonstration. Dans la version réelle, un conseiller vous rappelle pour fixer la visite d'estimation."],
    "vi.alt": ["Brass Dar Lumen sign on a white wall, pool and ocean at blue hour", "Enseigne en laiton Dar Lumen sur un mur blanc, piscine et océan à l'heure bleue"],
    "vi.h": ["Choose <em>the hour</em>", "Choisir <em>l'heure</em>"],
    "vi.btn": ["Book the viewing", "Réserver la visite"],
    "vi.noslot": ["Choose a viewing time.", "Choisissez une heure de visite."],
    "vi.nofield": ["Enter your name and a complete phone number.", "Indiquez votre nom et un numéro de téléphone complet."],
    "vi.ok": ["Demonstration viewing booked: {b}, {d} at {h}. In the real version, the confirmation is sent by text message.", "Visite de démonstration réservée : {b}, {d} à {h}. Dans la version réelle, la confirmation part par SMS."],
    "ph.name": ["Your name", "Votre nom"],
    "ft.what": ["Prestige real estate<br>Casablanca", "Immobilier de prestige<br>Casablanca"],
    "ft.concept": ["Weskale Studio concept · fictional brand.<br>Properties, prices and visuals are examples generated for the demonstration.", "Concept Weskale Studio · marque fictive.<br>Biens, prix et visuels sont des exemples générés pour la démonstration."],
    "badge": ["Weskale Studio concept · fictional brand", "Concept Weskale Studio · marque fictive"],
  };
  let lang = H.lang === "fr" ? "fr" : "en";
  const t = (k) => (T[k] ? T[k][lang === "fr" ? 1 : 0] : k);
  const locale = () => (lang === "fr" ? "fr-FR" : "en-GB");
  const money = (v) => {
    const n = Math.round(v).toLocaleString(lang === "fr" ? "fr-FR" : "en-US").replace(/[   ]/g, NB);
    return lang === "fr" ? n + NB + "MAD" : "MAD" + NB + n;
  };
  const listeners = [];

  function applyLang(l, save) {
    lang = l === "fr" ? "fr" : "en";
    H.lang = lang;
    if (save) { try { localStorage.setItem("darlumen-lang", lang); } catch (e) { /* stockage indisponible */ } }
    D.title = t("meta.title");
    const md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    $$("[data-i18n-alt]").forEach((el) => el.setAttribute("alt", t(el.dataset.i18nAlt)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    listeners.forEach((fn) => fn());
  }
  D.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b && b.dataset.lang !== lang) applyLang(b.dataset.lang, true);
  });

  /* ---------- Contenu de démonstration (prix d'exemple) ---------- */
  const ZONES = [
    { name: "Aïn Diab", m2: 24000 },
    { name: "Anfa Supérieur", m2: 28000 },
    { name: "Californie", m2: 17000 },
    { name: "Racine", m2: 21000 },
  ];
  const ESTATES = [
    { name: "Villa Horizon", zone: "Aïn Diab", type: "villa", surf: 640, rooms: 5, price: 24500000, film: true },
    { name: "Penthouse Océane", zone: "Anfa Supérieur", type: "appart", surf: 310, rooms: 4, price: 9800000 },
    { name: "Villa des Oliviers", zone: "Californie", type: "villa", surf: 520, rooms: 6, price: 12900000 },
    { name: "Villa Corniche", zone: "Aïn Diab", type: "villa", surf: 480, rooms: 5, price: 18200000 },
    { name: "Maison Patio", zone: "Racine", type: "maison", surf: 380, rooms: 4, price: 7400000 },
    { name: "Appartement du Parc", zone: "Anfa Supérieur", type: "appart", surf: 210, rooms: 3, price: 6300000 },
  ];

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  if (!reduce && W.Lenis) lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  /* Pendant le défilement, les flous d'arrière-plan sont coupés (l'aspect au repos ne change pas). */
  let idleT = 0;
  const onMove = () => {
    if (!H.classList.contains("is-scrolling")) H.classList.add("is-scrolling");
    clearTimeout(idleT); idleT = setTimeout(() => H.classList.remove("is-scrolling"), 160);
  };
  if (lenis) lenis.on("scroll", onMove); else W.addEventListener("scroll", onMove, { passive: true });
  const scrollToEl = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: target === 0 ? 0 : -nav.offsetHeight });
    else if (target === 0) W.scrollTo(0, 0);
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  D.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    scrollToEl(target);
  });

  /* ---------- Plan-séquence piloté par le défilement ---------- */
  const film = $("#film"), stage = $(".film__stage", film), canvas = $("#filmCanvas"), ctx = canvas.getContext("2d");
  const media = $("#filmMedia"), still = $("#filmStill"), night = $("#filmNight"), low = $("#filmLow");
  const mark = $("#heroMark"), tag = $("#heroTag"), navLogo = $("#navLogo"), nav = $("#nav");
  const hud = $("#filmHud"), bar = $("#filmBar"), frameNum = $("#filmFrame");
  const beats = $$("[data-beat]", film).map((el) => { const [a, b] = el.dataset.beat.split(" ").map(Number); return { el, a, b }; });

  const portrait = W.matchMedia("(max-aspect-ratio: 9/10)");
  const SETS = { d: { dir: "assets/seq/d/", n: 192 }, m: { dir: "assets/seq/m/", n: 96 } };
  let set = null, frames = [], drawn = -1, needDraw = true, wantI = 0;

  /* Chargement progressif : une image sur 16, puis sur 8, 4, 2, 1. */
  function loadOrder(n) {
    const order = [], seen = new Set();
    [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); } });
    const last = order.indexOf(n - 1); order.splice(last, 1); order.splice(1, 0, n - 1);
    return order;
  }
  function startSet() {
    const key = portrait.matches ? "m" : "d";
    if (set && set.key === key) return;
    set = { key, ...SETS[key], token: {} };
    frames = new Array(set.n); drawn = -1; needDraw = true;
    const token = set.token, order = loadOrder(set.n);
    const keyCount = Math.ceil(set.n / 16) + 1; // une image sur 16 et la dernière
    const rest = new Set(order.slice(keyCount));
    let next = 0, active = 0;
    const pick = () => {
      if (next < keyCount) return order[next++];
      let best = -1, bd = Infinity;
      rest.forEach((i) => { const d = Math.abs(i - wantI); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) rest.delete(best);
      return best;
    };
    const pump = () => {
      while (active < 6) {
        const i = pick();
        if (i < 0) break;
        const img = new Image();
        active++;
        img.decoding = "async";
        img.onload = () => {
          img.decode().catch(() => {}).then(() => {
            active--; if (set.token !== token) return; frames[i] = img; needDraw = true; firstFrames.tick(); pump();
          });
        };
        img.onerror = () => { active--; pump(); };
        img.src = set.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp";
      }
    };
    pump();
  }
  /* Image disponible la plus proche de l'image voulue : le défilement ne montre jamais de trou. */
  function nearest(i) {
    if (frames[i]) return i;
    for (let d = 1; d < set.n; d++) {
      if (i - d >= 0 && frames[i - d]) return i - d;
      if (i + d < set.n && frames[i + d]) return i + d;
    }
    return -1;
  }
  let geo = { top: 0, span: 1, stageH: 1 };
  function measureFilm() {
    const stageH = stage.clientHeight;
    geo = { top: film.getBoundingClientRect().top + W.scrollY, span: Math.max(1, film.offsetHeight - stageH), stageH, h: film.offsetHeight };
    lastP = -1;
  }
  function sizeCanvas() {
    const dpr = Math.min(W.devicePixelRatio || 1, portrait.matches ? 2 : 1.5);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    needDraw = true;
    measureFilm();
  }
  function draw(i) {
    const img = frames[i];
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
    if (!film.classList.contains("is-live")) film.classList.add("is-live");
  }

  /* Le grand nom se range dans la navigation au premier défilement. */
  let markGeo = null;
  function measureMark() {
    const prev = mark.style.transform;
    mark.style.transform = "none";
    const inner = $(".mark__in", mark).getBoundingClientRect(), nl = navLogo.getBoundingClientRect();
    mark.style.transform = prev;
    markGeo = {
      dx: nl.left + nl.width / 2 - (inner.left + inner.width / 2),
      dy: nl.top + nl.height / 2 - (inner.top + inner.height / 2),
      s: nl.width / inner.width,
    };
  }

  let lastP = -1;
  function update() {
    const y = W.scrollY - geo.top;
    const p = clamp(y / geo.span);

    if (set && y < geo.h) {
      wantI = Math.round(clamp(p / 0.9) * (set.n - 1));
      const i = nearest(wantI);
      if (i >= 0 && (i !== drawn || needDraw)) { draw(i); needDraw = false; }
    }
    if (p === lastP) return;
    lastP = p;

    still.style.opacity = film.classList.contains("is-live") ? String(1 - clamp(p / 0.025)) : "1";

    if (markGeo) {
      const m = easeIO(clamp(p / 0.1));
      mark.style.transform = `translate3d(${markGeo.dx * m}px, ${markGeo.dy * m}px, 0) scale(${1 + (markGeo.s - 1) * m})`;
      const swap = clamp((m - 0.82) / 0.18);
      mark.style.opacity = String(1 - swap);
      navLogo.style.opacity = String(swap);
    }
    tag.style.opacity = String(1 - clamp(p / 0.045));
    tag.style.transform = `translateY(${-30 * clamp(p / 0.045)}px)`;

    beats.forEach(({ el, a, b }) => {
      const o = Math.min(clamp((p - a) / 0.045), clamp((b - p) / 0.045));
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - ease(o)) * 26}px)`;
    });

    const push = ease(clamp((p - 0.86) / 0.14));
    media.style.transform = push > 0 ? `scale(${1 + 0.35 * push})` : "";
    night.style.opacity = String(clamp((p - 0.9) / 0.1));
    low.style.opacity = String(clamp((p - 0.08) / 0.06));

    bar.style.transform = `scaleX(${clamp(p / 0.9)})`;
    hud.style.opacity = String(1 - clamp((p - 0.84) / 0.06));
    if (set) { const fn = String(Math.round(clamp(p / 0.9) * (set.n - 1)) + 1).padStart(3, "0") + " / " + set.n; if (frameNum.textContent !== fn) frameNum.textContent = fn; }

    nav.classList.toggle("is-solid", p > 0.97);
  }

  /* ---------- Préchargeur : image d'ouverture et premier jeu d'images ---------- */
  const firstFrames = { need: 0, got: 0, tick() { this.got++; progress(); } };
  const ldNum = $("#ldNum"), ldBar = $("#ldBar"), loader = $("#loader");
  let stillOk = false, revealed = false;
  function progress() {
    const ratio = clamp((Math.min(firstFrames.got, firstFrames.need) + (stillOk ? 2 : 0)) / (firstFrames.need + 2));
    ldNum.textContent = String(Math.round(ratio * 100));
    ldBar.style.width = ratio * 100 + "%";
    if (ratio >= 1) reveal();
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    measureMark();
    lastP = -1; update();
    const G = W.gsap;
    if (!G || reduce) { loader.remove(); return; }
    const inner = $(".mark__in", mark);
    G.timeline({ defaults: { ease: "expo.out" } })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut", onComplete: () => loader.remove() })
      .fromTo(media, { scale: 1.08 }, { scale: 1, duration: 2.4, clearProps: "transform" }, 0.2)
      .fromTo(inner, { yPercent: 40, opacity: 0, letterSpacing: "0.3em" }, { yPercent: 0, opacity: 1, letterSpacing: "0.14em", duration: 2, clearProps: "letterSpacing,transform", onComplete: () => { measureMark(); lastP = -1; } }, 0.55)
      .fromTo([tag, hud], { opacity: 0 }, { opacity: 1, duration: 1.4, clearProps: "opacity" }, 1.1)
      .fromTo(nav, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 1.2, clearProps: "opacity,transform" }, 1.2);
  }
  function initFilm() {
    sizeCanvas();
    startSet();
    firstFrames.need = Math.ceil(set.n / 16) + 1;
    const img = $("img", still);
    const ok = () => { stillOk = true; progress(); };
    if (img.complete && img.naturalWidth) ok(); else { img.addEventListener("load", ok); img.addEventListener("error", ok); }
    setTimeout(reveal, 6000);
    let rz;
    W.addEventListener("resize", () => {
      clearTimeout(rz);
      rz = setTimeout(() => { sizeCanvas(); startSet(); if (revealed) measureMark(); lastP = -1; }, 120);
    });
    W.addEventListener("load", measureFilm);
  }

  function loop(time) {
    if (lenis) lenis.raf(time);
    update();
    requestAnimationFrame(loop);
  }
  function startLoop() {
    if (W.gsap) {
      W.gsap.ticker.add((t) => { if (lenis) lenis.raf(t * 1000); update(); });
      W.gsap.ticker.lagSmoothing(0);
    } else requestAnimationFrame(loop);
  }

  /* ---------- Apparitions au défilement ---------- */
  function initReveal() {
    const els = $$("[data-rv], .visit__img");
    if (!("IntersectionObserver" in W)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      const el = x.target, k = $$("[data-rv]", el.parentElement).indexOf(el);
      el.style.transitionDelay = Math.max(0, k) * 0.08 + "s";
      el.classList.add("in"); io.unobserve(el);
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Recherche de biens ---------- */
  function initSearch() {
    const list = $("#list"), fZone = $("#fZone"), fType = $("#fType"), fMax = $("#fMax");
    ZONES.forEach((z) => fZone.insertAdjacentHTML("beforeend", `<option value="${z.name}">${z.name}</option>`));
    const render = () => {
      list.innerHTML = ESTATES.map((e, i) => `
      <li class="row${e.film ? " row--film" : ""}" data-i="${i}">
        <button type="button" class="row__btn" aria-label="${t("bi.ask")} ${e.name}, ${e.zone}">
          ${e.film ? '<span class="row__thumb"><img src="assets/villa-detail.webp" alt="" loading="lazy"></span>' : ""}
          <span class="row__n">${String(i + 1).padStart(2, "0")}</span>
          <span class="row__main"><span class="row__name">${e.name}</span><span class="row__tag">${t(e.film ? "bi.film" : "bi.rdv")}</span></span>
          <span class="row__zone">${e.zone} · ${t("t." + e.type)}</span>
          <span class="row__spec">${e.surf}${NB}m² · ${e.rooms} ${t("bi.rooms")}</span>
          <span class="row__price">${money(e.price)}<small>${t("f.price")}</small></span>
          <span class="row__go" aria-hidden="true"></span>
        </button>
      </li>`).join("");
      apply();
    };
    const apply = () => {
      const z = fZone.value, ty = fType.value, max = +fMax.value;
      let n = 0;
      $$(".row", list).forEach((row) => {
        const e = ESTATES[+row.dataset.i];
        const ok = (!z || e.zone === z) && (!ty || e.type === ty) && (!max || e.price <= max);
        row.hidden = !ok; if (ok) n++;
      });
      $("#fCount").textContent = n;
      $("#fCountLbl").textContent = t((lang === "fr" ? n > 1 : n !== 1) ? "bi.many" : "bi.one");
      $("#listEmpty").hidden = n > 0;
    };
    $("#filters").addEventListener("change", apply);
    $("#filters").addEventListener("submit", (e) => e.preventDefault());
    list.addEventListener("click", (ev) => {
      const row = ev.target.closest(".row"); if (!row) return;
      $("#vBien").value = ESTATES[+row.dataset.i].name;
      scrollToEl($("#visite"));
    });
    listeners.push(render);
    render();

    /* Aperçu qui suit le curseur, seulement pour le bien filmé. */
    const peek = $("#peek"), sec = $("#biens");
    if (fine && !reduce) {
      sec.addEventListener("pointermove", (e) => {
        const r = sec.getBoundingClientRect();
        peek.style.left = e.clientX - r.left + 190 + "px";
        peek.style.top = e.clientY - r.top + "px";
        peek.classList.toggle("on", !!e.target.closest(".row--film"));
      });
      sec.addEventListener("pointerleave", () => peek.classList.remove("on"));
    }
  }

  /* ---------- Estimation ---------- */
  function initEstimate() {
    const f = $("#est"), zone = $("#eZone"), surf = $("#eSurf"), msg = $("#eMsg");
    ZONES.forEach((z, i) => zone.insertAdjacentHTML("beforeend", `<option value="${i}">${z.name}</option>`));
    const low = $("#eLow"), high = $("#eHigh");
    const shown = { lo: 0, hi: 0 };
    const paint = () => { low.textContent = money(shown.lo); high.textContent = money(shown.hi); };
    const show = (lo, hi) => {
      if (W.gsap && !reduce) W.gsap.to(shown, { lo, hi, duration: 0.7, ease: "power3.out", onUpdate: paint });
      else { shown.lo = lo; shown.hi = hi; paint(); }
    };
    const calc = () => {
      const fd = new FormData(f), s = +surf.value;
      $("#eSurfOut").textContent = s + NB + "m²";
      let k = +fd.get("type") || 1;
      fd.getAll("opt").forEach((o) => (k *= 1 + +o));
      const base = ZONES[+zone.value].m2 * s * k;
      show(Math.round(base * 0.92 / 10000) * 10000, Math.round(base * 1.08 / 10000) * 10000);
    };
    f.addEventListener("input", calc);
    f.addEventListener("change", calc);
    f.addEventListener("submit", (e) => { e.preventDefault(); msg.dataset.k = "es.done"; msg.textContent = t("es.done"); });
    listeners.push(() => { paint(); if (msg.dataset.k) msg.textContent = t(msg.dataset.k); });
    calc();
  }

  /* ---------- Visite privée ---------- */
  function initVisit() {
    const bien = $("#vBien"), days = $("#vDays"), slots = $("#vSlots"), msg = $("#vMsg"), f = $("#vf");
    ESTATES.forEach((e) => bien.insertAdjacentHTML("beforeend", `<option>${e.name}</option>`));
    const SL = [[10, 0], [11, 30], [15, 0], [16, 30], [18, 0]];
    const hour = ([h, m]) => (lang === "fr" ? `${h}${NB}h${NB}${String(m).padStart(2, "0")}` : `${h}:${String(m).padStart(2, "0")}`);
    const list = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (list.length < 6) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) list.push(new Date(d)); }
    let day = 0, slot = -1, lastMsg = null;
    const renderSlots = () => {
      slots.innerHTML = SL.map((s, k) => {
        const busy = (list[day].getDate() * 7 + k * 3) % 5 === 0;
        return `<button type="button" role="radio" aria-checked="${k === slot}" data-k="${k}"${busy ? " disabled" : ""}>${hour(s)}</button>`;
      }).join("");
    };
    const renderDays = () => {
      const fDay = new Intl.DateTimeFormat(locale(), { weekday: "short" });
      days.innerHTML = list.map((x, k) => `<button type="button" role="radio" aria-checked="${k === day}" data-k="${k}">${fDay.format(x).replace(".", "")}<b>${x.getDate()}</b></button>`).join("");
    };
    const say = () => {
      if (!lastMsg) { msg.textContent = ""; return; }
      if (lastMsg === "ok") {
        const fLong = new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long" });
        msg.textContent = t("vi.ok").replace("{b}", bien.value).replace("{d}", fLong.format(list[day])).replace("{h}", hour(SL[slot]));
      } else msg.textContent = t(lastMsg);
    };
    days.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      day = +b.dataset.k; slot = -1;
      $$("button", days).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      renderSlots();
    });
    slots.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      slot = +b.dataset.k;
      $$("button", slots).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (slot < 0) lastMsg = "vi.noslot";
      else if (!f.nom.value.trim() || f.tel.value.replace(/\D/g, "").length < 9) lastMsg = "vi.nofield";
      else lastMsg = "ok";
      say();
    });
    listeners.push(() => { renderDays(); renderSlots(); say(); });
    renderDays(); renderSlots();
  }

  initSearch();
  initEstimate();
  initVisit();
  applyLang(lang, false);
  initReveal();
  initFilm();
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => { measureFilm(); if (revealed) { measureMark(); lastP = -1; } });
  startLoop();
})();
