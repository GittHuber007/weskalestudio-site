/* Clef d'Azur, concept Weskale Studio (marque fictive).
   Anglais par défaut, français complet par le sélecteur EN / FR.
   Sans JavaScript, le contenu reste lisible : seuls les états animés dépendent de ce fichier. */
(function () {
  "use strict";
  const W = window, D = document, H = D.documentElement;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const NB = " ";

  /* ---------- Textes : [anglais, français] ---------- */
  const T = {
    "meta.title": ["Clef d'Azur · Villas above the sea in Nice", "Clef d'Azur · Villas face à la mer à Nice"],
    "meta.desc": ["Clef d'Azur, an estate agency concept in Nice: villas above the Baie des Anges, property search and valuation. Fictional brand, Weskale Studio concept.", "Clef d'Azur, concept d'agence immobilière à Nice : villas au-dessus de la Baie des Anges, recherche de biens et estimation. Marque fictive, concept Weskale Studio."],
    "nav.home": ["Clef d'Azur, back to top", "Clef d'Azur, retour en haut"],
    "nav.label": ["Main navigation", "Navigation principale"],
    "nav.biens": ["Properties", "Biens"],
    "nav.estim": ["Valuation", "Estimation"],
    "lang.label": ["Language", "Langue"],
    "film.label": ["From the gate of Villa Belvédère to the bay", "Du portail de la villa Belvédère jusqu'à la baie"],
    "film.alt": ["Belle Époque villa in pale stone above the bay of Nice at golden hour, umbrella pines, pool, engraved Clef d'Azur plate on the gate pillar", "Villa Belle Époque en pierre claire au-dessus de la baie de Nice à l'heure dorée, pins parasols, piscine, plaque gravée Clef d'Azur sur le pilier du portail"],
    "film.tag": ["Villas above the Baie des Anges", "Villas au-dessus de la Baie des Anges"],
    "film.scroll": ["Scroll to open the gate", "Faites défiler pour ouvrir"],
    "b1.k": ["Estate agency · Nice", "Agence immobilière · Nice"],
    "b1.t": ["Every house <em>has its key.</em>", "Chaque maison <em>a sa clef.</em>"],
    "b2.k": ["Villa Belvédère · Mont Boron", "Villa Belvédère · Mont Boron"],
    "f.surf": ["Living area", "Surface"],
    "f.rooms": ["Bedrooms", "Chambres"],
    "f.land": ["Garden", "Jardin"],
    "f.landV": ["2,800 m²", "2" + NB + "800 m²"],
    "f.price": ["Example price", "Prix d'exemple"],
    "f.priceV": ["€9.8M", "9,8" + NB + "M€"],
    "b3.t": ["The view first. <em>Then the house.</em>", "La vue d'abord. <em>La maison ensuite.</em>"],
    "bi.k": ["The selection", "La sélection"],
    "bi.h": ["Six houses, <em>chosen for the view</em>", "Six maisons, <em>choisies pour la vue</em>"],
    "bi.form": ["Search properties", "Rechercher un bien"],
    "bi.empty": ["No property matches. Widen the budget or the area.", "Aucun bien ne correspond. Élargissez le budget ou le quartier."],
    "bi.note": ["Photos of the areas, taken from Wikimedia Commons. The houses are shown in full during the viewing.", "Photos des quartiers, issues de Wikimedia Commons. Les maisons se découvrent en entier pendant la visite."],
    "bi.one": ["property", "bien"],
    "bi.many": ["properties", "biens"],
    "bi.beds": ["bedrooms", "chambres"],
    "bi.sea": ["sea view", "vue mer"],
    "bi.open": ["See the house", "Voir la maison"],
    "bi.area": ["The area", "Le quartier"],
    "bi.illus": ["Illustrative visual", "Visuel d'illustration"],
    "l.zone": ["Area", "Quartier"],
    "l.type": ["Type", "Type"],
    "l.max": ["Maximum budget", "Budget maximal"],
    "l.sea": ["Sea view only", "Vue mer seulement"],
    "l.ptype": ["Property type", "Type de bien"],
    "l.surf": ["Living area", "Surface habitable"],
    "l.opts": ["Features", "Atouts"],
    "l.name": ["Name", "Nom"],
    "l.tel": ["Phone", "Téléphone"],
    "o.all": ["All", "Tous"],
    "o.nolimit": ["No limit", "Sans limite"],
    "o.2": ["€2M", "2" + NB + "M€"],
    "o.4": ["€4M", "4" + NB + "M€"],
    "o.10": ["€10M", "10" + NB + "M€"],
    "o.sea": ["Sea view", "Vue mer"],
    "o.terr": ["Terrace", "Terrasse"],
    "o.pool": ["Pool", "Piscine"],
    "o.works": ["Work needed", "Travaux à prévoir"],
    "t.villa": ["Villa", "Villa"],
    "t.appart": ["Apartment", "Appartement"],
    "li.label": ["The evening light over the bay", "La lumière du soir sur la baie"],
    "li.alt": ["The Baie des Anges seen from Castle Hill in Nice at the end of the day, umbrella pine in the foreground", "La Baie des Anges vue de la colline du Château à Nice en fin de journée, pin parasol au premier plan"],
    "li.k": ["Our viewing rule", "Notre règle de visite"],
    "li.t": ["We never show a house on the Riviera <em>at noon.</em>", "On ne montre jamais une maison de la Côte <em>à midi.</em>"],
    "li.s": ["Viewings are set for the hour when the light reaches the terrace.", "Les visites se fixent à l'heure où la lumière arrive sur la terrasse."],
    "es.k": ["You are selling", "Vous vendez"],
    "es.h": ["What is <em>your view</em> worth?", "Combien vaut <em>votre vue</em>"+ NB + "?"],
    "es.lead": ["A first range straight away, from example prices per square metre. The real valuation is done on site, with an adviser.", "Une première fourchette tout de suite, à partir de prix au mètre carré d'exemple. L'estimation réelle se fait sur place, avec un conseiller."],
    "es.alt": ["Path under umbrella pines above the sea at Saint-Jean-Cap-Ferrat", "Sentier sous les pins parasols au-dessus de la mer à Saint-Jean-Cap-Ferrat"],
    "es.range": ["Indicative range", "Fourchette indicative"],
    "es.to": ["to", "à"],
    "es.note": ["Demonstration calculation with example prices. It does not replace an on-site valuation.", "Calcul de démonstration avec des prix d'exemple. Il ne remplace pas une estimation sur place."],
    "es.btn": ["Request an on-site valuation", "Demander l'estimation sur place"],
    "es.done": ["Request recorded for the demonstration. In the real version, an adviser calls you back to set the valuation visit.", "Demande enregistrée en démonstration. Dans la version réelle, un conseiller vous rappelle pour fixer la visite d'estimation."],
    "dw.close": ["Close", "Fermer"],
    "dw.surf": ["Living area", "Surface"],
    "dw.beds": ["Bedrooms", "Chambres"],
    "dw.out": ["Outside", "Extérieur"],
    "dw.view": ["View", "Vue"],
    "dw.sea": ["Sea, panoramic", "Mer, panoramique"],
    "dw.city": ["Roofs and hills", "Toits et collines"],
    "vi.when": ["Viewing at the hour of the evening light", "Visite à l'heure de la lumière du soir"],
    "vi.btn": ["Request the viewing", "Demander la visite"],
    "vi.noslot": ["Choose a viewing time.", "Choisissez une heure de visite."],
    "vi.nofield": ["Enter your name and a complete phone number.", "Indiquez votre nom et un numéro de téléphone complet."],
    "vi.ok": ["Demonstration request recorded: {b}, {d}. In the real version, an adviser confirms by phone.", "Demande de démonstration enregistrée : {b}, {d}. Dans la version réelle, un conseiller confirme par téléphone."],
    "ph.name": ["Your name", "Votre nom"],
    "ft.what": ["Estate agency<br>Nice · Riviera", "Agence immobilière<br>Nice · Côte d'Azur"],
    "ft.concept": ["Weskale Studio concept · fictional brand.<br>Properties and prices are examples for the demonstration.", "Concept Weskale Studio · marque fictive.<br>Biens et prix sont des exemples pour la démonstration."],
    "ft.credits": ["Villa Belvédère: generated image. Area photos from Wikimedia Commons, cropped and compressed: 3602kiva (CC0), villlamania, Michel G, Leicester Holyday (CC BY 3.0), Olivier Cleynen (CC BY 4.0), Jorge Franganillo, miketnorton (CC BY 2.0).", "Villa Belvédère : image générée. Photos des quartiers issues de Wikimedia Commons, recadrées et compressées : 3602kiva (CC0), villlamania, Michel G, Leicester Holyday (CC BY 3.0), Olivier Cleynen (CC BY 4.0), Jorge Franganillo, miketnorton (CC BY 2.0)."],
    "badge": ["Weskale Studio concept · fictional brand", "Concept Weskale Studio · marque fictive"],
  };

  /* ---------- Contenu de démonstration (prix d'exemple) ---------- */
  const ZONES = [
    { name: "Mont Boron", m2: 13500 },
    { name: "Cap Ferrat", m2: 26000 },
    { name: "Carré d'Or", m2: 9500 },
    { name: "Port Lympia", m2: 8800 },
    { name: "Fabron", m2: 8000 },
    { name: "Vieux-Nice", m2: 7200 },
    { name: "Cimiez", m2: 6800 },
  ];
  const ESTATES = [
    { name: "Villa Belvédère", zone: "Mont Boron", type: "villa", surf: 420, beds: 6, out: [2800, "garden"], sea: true, price: 9800000, img: "assets/img/villa-s.webp", cap: "illus",
      d: ["A Belle Époque villa in pale stone, restored, with a pool on the terrace and century-old umbrella pines facing the bay.", "Une villa Belle Époque en pierre claire, restaurée, avec piscine en terrasse et pins parasols centenaires face à la baie."] },
    { name: "Toit-terrasse du Port", zone: "Port Lympia", type: "appart", surf: 115, beds: 3, out: [90, "roof"], sea: true, price: 2650000, img: "assets/img/port.webp", cap: "Port Lympia",
      d: ["A whole roof terrace above the coloured facades of the harbour, for dinners facing the boats.", "Un toit-terrasse entier au-dessus des façades colorées du port, pour dîner face aux bateaux."] },
    { name: "Appartement des Anges", zone: "Carré d'Or", type: "appart", surf: 128, beds: 3, out: [18, "balcony"], sea: true, price: 1850000, img: "assets/img/baie.webp", pos: "50% 80%", cap: "Baie des Anges",
      d: ["A bright through living room two streets from the Promenade, with the sea from the balcony.", "Un séjour traversant et lumineux à deux rues de la Promenade, la mer depuis le balcon."] },
    { name: "Duplex du Château", zone: "Vieux-Nice", type: "appart", surf: 96, beds: 2, out: [30, "roof"], sea: false, price: 1290000, img: "assets/img/vieux.webp", cap: "Vieux-Nice",
      d: ["Under the old town roofs, a duplex with a small roof terrace looking towards Castle Hill.", "Sous les toits de la vieille ville, un duplex avec un petit toit-terrasse tourné vers la colline du Château."] },
    { name: "Villa des Caps", zone: "Cap Ferrat", type: "villa", surf: 380, beds: 5, out: [3000, "garden"], sea: true, price: 14500000, img: "assets/img/cap.webp", cap: "Cap Ferrat",
      d: ["On the peninsula, a garden of pines running down to the rocks, and the sea on three sides.", "Sur la presqu'île, un jardin de pins qui descend vers les rochers, et la mer sur trois côtés."] },
    { name: "Villa Fabron", zone: "Fabron", type: "villa", surf: 240, beds: 4, out: [1100, "garden"], sea: true, price: 3400000, img: "assets/img/crepuscule.webp", cap: "Promenade des Anglais",
      d: ["On the western hill, olive trees and an evening terrace above the curve of the Promenade.", "Sur la colline ouest, des oliviers et une terrasse du soir au-dessus de la courbe de la Promenade."] },
  ];
  const OUT = { garden: ["garden", "jardin"], roof: ["roof terrace", "toit-terrasse"], balcony: ["balcony", "balcon"] };

  let lang = H.lang === "fr" ? "fr" : "en";
  const fr = () => lang === "fr";
  const t = (k) => (T[k] ? T[k][fr() ? 1 : 0] : k);
  const tx = (arr) => arr[fr() ? 1 : 0];
  const locale = () => (fr() ? "fr-FR" : "en-GB");
  const num = (v) => Math.round(v).toLocaleString(fr() ? "fr-FR" : "en-GB").replace(/[   ]/g, NB);
  const money = (v) => (fr() ? num(v) + NB + "€" : "€" + num(v));
  const millions = (v) => {
    const m = (v / 1e6).toLocaleString(fr() ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 });
    return fr() ? m + NB + "M€" : "€" + m + "M";
  };
  const listeners = [];

  function applyLang(l, save) {
    lang = l === "fr" ? "fr" : "en";
    H.lang = lang;
    if (save) { try { localStorage.setItem("clefdazur-lang", lang); } catch (e) { /* stockage indisponible */ } }
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

  /* ---------- Défilement fluide ---------- */
  // Une seule boucle : Lenis tourne dans le ticker GSAP et pousse ScrollTrigger
  const G = W.gsap, ST = W.ScrollTrigger, hasST = !!(G && ST);
  if (hasST) G.registerPlugin(ST);
  let lenis = null;
  if (!reduce && W.Lenis) {
    lenis = new W.Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    if (hasST) { lenis.on("scroll", ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
  }
  // Ancres : decalage de la hauteur de l'en-tete fixe
  const scrollToEl = (target) => {
    const off = target === 0 ? 0 : -$("#nav").offsetHeight;
    if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: off });
    else if (target === 0) W.scrollTo(0, 0);
    else W.scrollTo({ top: target.getBoundingClientRect().top + W.scrollY + off, behavior: reduce ? "auto" : "smooth" });
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

  /* ---------- Ouverture pilotée par le défilement ----------
     1. De p = 0 à PA : la caméra recule sur l'image fixe (2752 px), de la plaque du portail
        jusqu'au cadre entier, qui est exactement la première image de la vidéo.
     2. De PA à 1 : la vidéo du drone, découpée en images, monte au-dessus de la villa vers la mer.
     x et y = point visé dans l'image (0 à 1), z = zoom. Sur téléphone, seul x change ensuite. */
  const PA = 0.16;
  const CAM = {
    land: [{ p: 0, x: 0.742, y: 0.862, z: 2.5 }, { p: 0.07, x: 0.7, y: 0.76, z: 1.8 }, { p: PA, x: 0.5, y: 0.5, z: 1 }],
    port: [{ p: 0, x: 0.742, y: 0.866, z: 1.7 }, { p: 0.07, x: 0.74, y: 0.75, z: 1.3 }, { p: PA, x: 0.74, y: 0.5, z: 1 }],
  };
  const PAN = [{ p: PA, x: 0.74 }, { p: 0.3, x: 0.42 }, { p: 0.55, x: 0.62 }, { p: 0.8, x: 0.42 }, { p: 1, x: 0.44 }];
  const SETS = { d: { dir: "assets/seq/d/", n: 190 }, m: { dir: "assets/seq/m/", n: 95 } };

  const film = $("#film"), stage = $("#stage"), canvas = $("#filmCanvas"), ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const still = $("#filmStill"), nav = $("#nav"), hud = $("#filmHud"), bar = $("#filmBar"), warm = $("#filmWarm");
  const word = $("#word"), wordLines = $$(".word__l > span", word), wordSub = $(".word__s", word);
  const beats = $$(".beat", film).map((el) => { const [a, b] = el.dataset.beat.split(" ").map(Number); return { el, a, b }; });
  const wb = word.dataset.beat.split(" ").map(Number);
  let imgReady = false, needDraw = true, mx = 0, my = 0, tmx = 0, tmy = 0;
  let set = null, frames = [];
  const isPortrait = () => canvas.width / canvas.height < 0.9;

  /* Chargement progressif : une image sur 16, puis sur 8, 4, 2, 1. */
  function loadOrder(n) {
    const order = [], seen = new Set();
    [16, 8, 4, 2, 1].forEach((st) => { for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); order.push(i); } });
    order.splice(order.indexOf(n - 1), 1); order.splice(1, 0, n - 1);
    return order;
  }
  function startSet() {
    const key = isPortrait() ? "m" : "d";
    if (set && set.key === key) return;
    set = { key, ...SETS[key], token: {} };
    frames = new Array(set.n); needDraw = true;
    firstFrames.need = Math.ceil(set.n / 16) + 1; firstFrames.got = 0;
    const token = set.token, order = loadOrder(set.n), asked = new Uint8Array(set.n), keys = firstFrames.need;
    let next = 0, active = 0;
    const pick = () => {
      if (next < keys) return order[next++];
      const cur = curFrame();
      for (let d = 0; d < 8; d++) for (const j of [cur + d, cur - d]) if (j >= 0 && j < set.n && !asked[j]) return j;
      while (next < order.length && asked[order[next]]) next++;
      return next < order.length ? order[next++] : -1;
    };
    const pump = () => {
      while (active < 4) {
        const i = pick();
        if (i < 0) return;
        if (asked[i]) continue;
        asked[i] = 1; active++;
        const img = new Image();
        img.src = set.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp";
        img.decode().then(() => { active--; if (set.token !== token) return; frames[i] = img; needDraw = true; firstFrames.got++; pump(); }, () => { active--; if (set.token === token) pump(); });
      }
    };
    set.pump = pump;
    pump();
  }
  const curFrame = () => (set && lastP >= PA ? Math.round(clamp((lastP - PA) / (1 - PA)) * (set.n - 1)) : 0);
  /* Image disponible la plus proche : le défilement ne montre jamais de trou. */
  function nearest(i) {
    if (frames[i]) return i;
    for (let d = 1; d < set.n; d++) {
      if (i - d >= 0 && frames[i - d]) return i - d;
      if (i + d < set.n && frames[i + d]) return i + d;
    }
    return -1;
  }
  function sizeCanvas() {
    // Plafond de densite : 1,5 sur ordinateur, 2 sur telephone.
    // Resolution dynamique (ordinateur) : densite 1 pendant le defilement, pleine densite des l'arret.
    const full = Math.min(W.devicePixelRatio || 1, W.innerWidth <= 760 ? 2 : 1.5);
    const dpr = lowRes ? Math.min(full, 1) : full;
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    ctx.imageSmoothingQuality = "high";
    needDraw = true;
  }
  function keyAt(keys, p, names) {
    let k = 0;
    while (k < keys.length - 2 && p > keys[k + 1].p) k++;
    const a = keys[k], b = keys[k + 1], u = easeIO(clamp((p - a.p) / (b.p - a.p)));
    const o = {};
    names.forEach((n) => (o[n] = lerp(a[n], b[n], u)));
    return o;
  }
  function paint(img, x, y, z) {
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih) * z * 1.02, w = iw * s, h = ih * s;
    const dx = clamp(cw / 2 - x * w + mx * cw * 0.006, cw - w, 0);
    const dy = clamp(ch / 2 - y * h + my * ch * 0.006, ch - h, 0);
    ctx.drawImage(img, dx, dy, w, h);
  }
  let lastKey = "";
  function draw(p) {
    const port = isPortrait();
    let i = -1;
    if (p >= PA && set) i = nearest(Math.round(clamp((p - PA) / (1 - PA)) * (set.n - 1)));
    const m = ":" + mx.toFixed(4) + ":" + my.toFixed(4) + ":" + canvas.width + "x" + canvas.height;
    if (i >= 0) {
      const x = port ? keyAt(PAN, p, ["x"]).x : 0.5, key = "f" + i + ":" + x.toFixed(4) + m;
      if (key === lastKey) return;
      lastKey = key; paint(frames[i], x, 0.5, 1);
    } else if (imgReady) {
      const c = keyAt(port ? CAM.port : CAM.land, Math.min(p, PA), ["x", "y", "z"]), key = "s" + c.x.toFixed(4) + c.y.toFixed(4) + c.z.toFixed(4) + m;
      if (key === lastKey) return;
      lastKey = key; paint(still, c.x, c.y, c.z);
    } else return;
    if (!film.classList.contains("is-live")) film.classList.add("is-live");
  }
  function fade(p, a, b) {
    const i = a <= 0 ? 1 : clamp((p - a) / 0.045);
    return Math.min(i, clamp((b - p) / 0.045));
  }

  let lastP = -1, lowRes = false, movedAt = 0;
  // Progression des deux sections collantes : ScrollTrigger avec un scrub court ;
  // repli par mesure directe si GSAP n'est pas charge.
  const prog = { film: 0, light: 0 }, seen = { film: true, light: false };
  if (hasST) {
    G.to(prog, { film: 1, ease: "none", scrollTrigger: { trigger: "#film", start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true } });
    G.to(prog, { light: 1, ease: "none", scrollTrigger: { trigger: "#lumiere", start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true } });
  }
  if ("IntersectionObserver" in W) {
    new IntersectionObserver((en) => en.forEach((x) => { seen[x.target.id === "film" ? "film" : "light"] = x.isIntersecting; })).observe($("#film"));
  }
  function updateFilm() {
    let p;
    if (hasST) { if (!seen.film) return; p = prog.film; }
    else {
      const r = film.getBoundingClientRect();
      if (r.bottom < 0) return;
      p = clamp(-r.top / Math.max(1, r.height - stage.clientHeight));
    }
    const now = performance.now();
    if (p !== lastP) { movedAt = now; if (!lowRes && lastP >= 0 && W.innerWidth > 760 && (W.devicePixelRatio || 1) > 1) { lowRes = true; sizeCanvas(); } }
    else if (lowRes && now - movedAt > 180) { lowRes = false; sizeCanvas(); }
    if (fine && !reduce) { mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06; }
    const moving = Math.abs(tmx - mx) > 0.001 || Math.abs(tmy - my) > 0.001;
    if (p !== lastP || needDraw || moving) { draw(p); needDraw = false; }
    if (p === lastP) return;
    lastP = p;
    if (set && set.pump && p >= PA) set.pump();

    beats.forEach(({ el, a, b }) => {
      const o = fade(p, a, b);
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - ease(o)) * 28}px)`;
    });
    const wo = fade(p, wb[0], wb[1]);
    const rise = clamp((p - wb[0]) / 0.08), leave = clamp((p - (wb[1] - 0.07)) / 0.07);
    wordLines.forEach((el, i) => {
      const r0 = ease(clamp(rise * 1.4 - i * 0.3));
      el.style.transform = `translateY(${(1 - r0) * 105 - leave * 30 * (i + 1)}%)`;
    });
    word.style.opacity = String(Math.min(wo > 0 ? 1 : 0, 1 - leave));
    wordSub.style.opacity = String(clamp(rise * 2 - 1) * (1 - leave));
    warm.style.opacity = String(0.6 + 0.4 * clamp(p / 0.6));
    bar.style.transform = `scaleX(${p})`;
    hud.style.opacity = String(1 - clamp((p - 0.9) / 0.06));
    nav.classList.toggle("is-solid", p > 0.985);
  }

  /* ---------- Interlude : l'arche s'ouvre sur la baie ---------- */
  const light = $("#lumiere"), lightPin = $(".light__pin", light), lightImg = $("#lightImg"), lightPic = $("img", lightImg), lightTxt = $("#lightTxt");
  let lastQ = -1;
  if ("IntersectionObserver" in W) new IntersectionObserver((en) => { seen.light = en[0].isIntersecting; }).observe(light);
  function updateLight() {
    let q;
    if (hasST) { if (!seen.light) return; q = prog.light; }
    else {
      const r = light.getBoundingClientRect(), vh = W.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      q = clamp(-r.top / Math.max(1, r.height - vh));
    }
    // Styles ecrits seulement quand la progression change
    if (q === lastQ) return;
    lastQ = q;
    const e = easeIO(clamp(q / 0.55));
    const narrow = W.innerWidth <= 700;
    const st = narrow ? [16, 18, 14] : [18, 36, 8];
    const top = st[0] * (1 - e), side = st[1] * (1 - e), bot = st[2] * (1 - e);
    const rad = (W.innerWidth * (1 - (2 * side) / 100)) / 2 * (1 - e);
    lightImg.style.clipPath = `inset(${top}% ${side}% ${bot}% ${side}% round ${rad}px ${rad}px 0 0)`;
    lightPic.style.transform = `scale(${1.18 - 0.18 * e})`;
    const o = clamp((q - 0.45) / 0.2);
    lightTxt.style.opacity = String(o);
    lightTxt.style.transform = `translateY(${(1 - ease(o)) * 40}px)`;
    lightPin.style.setProperty("--dark", String(o));
  }

  function frameUpdate() { updateFilm(); updateLight(); }
  function loop(time) {
    if (lenis) lenis.raf(time);
    frameUpdate();
    requestAnimationFrame(loop);
  }

  /* ---------- Préchargeur ---------- */
  const loader = $("#loader"), ldNum = $("#ldNum"), ldBar = $("#ldBar");
  let revealed = false, shown = 0, target = 0.1;
  const firstFrames = { need: 13, got: 0 };
  const tickLoader = () => {
    if (revealed) return;
    if (imgReady) target = Math.max(target, 0.45 + 0.55 * clamp(firstFrames.got / firstFrames.need));
    shown += (target - shown) * 0.12;
    ldNum.textContent = String(Math.round(shown * 100));
    ldBar.style.width = shown * 100 + "%";
    if (target >= 1 && shown > 0.985) { reveal(); return; }
    requestAnimationFrame(tickLoader);
  };
  function reveal() {
    if (revealed) return;
    revealed = true;
    ldNum.textContent = "100"; ldBar.style.width = "100%";
    lastP = -1; needDraw = true;
    const G = W.gsap;
    if (!G || reduce) { loader.remove(); return; }
    const first = beats[0].el;
    G.timeline({ defaults: { ease: "expo.out" } })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.3, ease: "expo.inOut", onComplete: () => loader.remove() })
      .fromTo(stage, { scale: 1.12 }, { scale: 1, duration: 2.6, clearProps: "transform" }, 0.25)
      .fromTo(first, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.8, clearProps: "opacity,transform", onComplete: () => { lastP = -1; } }, 0.8)
      .fromTo([nav, hud], { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 1.3, clearProps: "opacity,transform" }, 1);
  }
  function initFilm() {
    sizeCanvas();
    startSet();
    const ok = () => { imgReady = !!still.naturalWidth; needDraw = true; };
    if (still.complete && still.naturalWidth) ok();
    else { still.addEventListener("load", ok); still.addEventListener("error", () => { target = 1; }); }
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => { target = Math.max(target, 0.4); });
    requestAnimationFrame(tickLoader);
    setTimeout(() => { target = 1; }, 7000);
    let rz;
    W.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { sizeCanvas(); startSet(); lastP = -1; lastQ = -1; }, 120); });
    if (fine && !reduce) W.addEventListener("pointermove", (e) => { tmx = e.clientX / W.innerWidth - 0.5; tmy = e.clientY / W.innerHeight - 0.5; }, { passive: true });
  }

  /* ---------- Apparitions ---------- */
  function initReveal() {
    const els = $$("[data-rv]");
    if (!("IntersectionObserver" in W) || reduce) { els.forEach((e) => e.classList.add("in")); return; }
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
    const cards = $("#cards"), fZone = $("#fZone"), fType = $("#fType"), fMax = $("#fMax"), fSea = $("#fSea");
    [...new Set(ESTATES.map((e) => e.zone))].forEach((z) => fZone.insertAdjacentHTML("beforeend", `<option value="${z}">${z}</option>`));
    const capOf = (e) => (e.cap === "illus" ? t("bi.illus") : t("bi.area") + " · " + e.cap);
    const render = () => {
      cards.innerHTML = ESTATES.map((e, i) => `
      <li class="card" data-i="${i}">
        <button type="button" aria-label="${t("bi.open")}, ${e.name}, ${e.zone}">
          <span class="card__img"><img src="${e.img}" alt="" loading="lazy" style="object-position:${e.pos || "50% 50%"}"><span class="card__cap">${capOf(e)}</span></span>
          <span class="card__row"><span class="card__name">${e.name}</span><span class="card__price">${millions(e.price)}</span></span>
          <span class="card__meta">${e.zone} · ${t("t." + e.type)} · ${e.surf}${NB}m² · ${e.beds} ${t("bi.beds")}${e.sea ? " · " + t("bi.sea") : ""}</span>
          <span class="card__go">${t("bi.open")}</span>
        </button>
      </li>`).join("");
      apply(false);
    };
    const apply = (animate) => {
      const z = fZone.value, ty = fType.value, max = +fMax.value, sea = fSea.checked;
      let n = 0;
      const shownCards = [];
      $$(".card", cards).forEach((c) => {
        const e = ESTATES[+c.dataset.i];
        const ok = (!z || e.zone === z) && (!ty || e.type === ty) && (!max || e.price <= max) && (!sea || e.sea);
        c.hidden = !ok; if (ok) { n++; shownCards.push(c); }
      });
      $("#fCount").textContent = n;
      $("#fCountLbl").textContent = t((fr() ? n > 1 : n !== 1) ? "bi.many" : "bi.one");
      $("#cardsEmpty").hidden = n > 0;
      if (animate && W.gsap && !reduce) W.gsap.fromTo(shownCards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "expo.out", clearProps: "opacity,transform" });
    };
    $("#filters").addEventListener("change", () => apply(true));
    $("#filters").addEventListener("submit", (e) => e.preventDefault());
    cards.addEventListener("click", (ev) => { const c = ev.target.closest(".card"); if (c) openDrawer(+c.dataset.i); });
    listeners.push(render);
    render();
  }

  /* ---------- Fiche d'un bien et demande de visite ---------- */
  const dw = $("#drawer"), panel = $("#dwPanel");
  let cur = 0, lastFocus = null, slot = -1, lastMsg = null;
  const days = [];
  { const d = new Date(); d.setHours(12, 0, 0, 0); while (days.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)); } }
  const SL = [];
  days.forEach((d, i) => { SL.push([i, 17, 30]); SL.push([i, 18, 30]); });
  const slotLabel = ([i, h, m], long) => {
    const f = new Intl.DateTimeFormat(locale(), long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric" });
    const hh = fr() ? `${h}${NB}h${NB}${String(m).padStart(2, "0")}` : `${h}:${String(m).padStart(2, "0")}`;
    return f.format(days[i]).replace(".", "") + (fr() ? " à " : ", ") + hh;
  };
  function fillDrawer() {
    const e = ESTATES[cur];
    $("#dwImg").src = e.img;
    $("#dwImg").alt = "";
    $("#dwCap").textContent = e.cap === "illus" ? t("bi.illus") : t("bi.area") + " · " + e.cap;
    $("#dwZone").textContent = e.zone + " · " + t("t." + e.type);
    $("#dwTitle").textContent = e.name;
    $("#dwPrice").innerHTML = `${millions(e.price)}<small>${t("f.price")}</small>`;
    $("#dwFacts").innerHTML = `<div><dt>${t("dw.surf")}</dt><dd>${e.surf}${NB}m²</dd></div><div><dt>${t("dw.beds")}</dt><dd>${e.beds}</dd></div><div><dt>${t("dw.out")}</dt><dd>${tx(OUT[e.out[1]])}, ${num(e.out[0])}${NB}m²</dd></div><div><dt>${t("dw.view")}</dt><dd>${t(e.sea ? "dw.sea" : "dw.city")}</dd></div>`;
    $("#dwDesc").textContent = tx(e.d);
    $("#vSlots").innerHTML = SL.map((s, k) => `<button type="button" role="radio" aria-checked="${k === slot}" data-k="${k}">${slotLabel(s)}</button>`).join("");
    const msg = $("#vMsg");
    if (!lastMsg) msg.textContent = "";
    else if (lastMsg === "ok") msg.textContent = t("vi.ok").replace("{b}", e.name).replace("{d}", slotLabel(SL[slot], true));
    else msg.textContent = t(lastMsg);
  }
  function openDrawer(i) {
    cur = i; slot = -1; lastMsg = null; lastFocus = D.activeElement;
    fillDrawer();
    dw.hidden = false; H.style.overflow = "hidden"; if (lenis) lenis.stop();
    if (W.gsap && !reduce) {
      W.gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.9, ease: "expo.out" });
      W.gsap.fromTo("#dwScrim", { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }
    $("#dwClose").focus();
  }
  function closeDrawer() {
    const done = () => { dw.hidden = true; H.style.overflow = ""; if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); };
    if (W.gsap && !reduce) {
      W.gsap.to(panel, { xPercent: 100, duration: 0.55, ease: "expo.in", onComplete: done });
      W.gsap.to("#dwScrim", { opacity: 0, duration: 0.45 });
    } else done();
  }
  function initDrawer() {
    $("#dwClose").addEventListener("click", closeDrawer);
    $("#dwScrim").addEventListener("click", closeDrawer);
    D.addEventListener("keydown", (e) => {
      if (dw.hidden) return;
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") {
        const f = $$("button, input, select, a[href]", panel).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && D.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && D.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    $("#vSlots").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      slot = +b.dataset.k;
      $$("button", $("#vSlots")).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    });
    const f = $("#vf");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (slot < 0) lastMsg = "vi.noslot";
      else if (!f.nom.value.trim() || f.tel.value.replace(/\D/g, "").length < 9) lastMsg = "vi.nofield";
      else lastMsg = "ok";
      fillDrawer();
    });
    listeners.push(() => { if (!dw.hidden) fillDrawer(); });
  }

  /* ---------- Estimation ---------- */
  function initEstimate() {
    const f = $("#est"), zone = $("#eZone"), surf = $("#eSurf"), msg = $("#eMsg"), low = $("#eLow"), high = $("#eHigh");
    ZONES.forEach((z, i) => zone.insertAdjacentHTML("beforeend", `<option value="${i}">${z.name}</option>`));
    const shownV = { lo: 0, hi: 0 };
    const paint = () => { low.textContent = money(shownV.lo); high.textContent = money(shownV.hi); };
    const show = (lo, hi) => {
      if (W.gsap && !reduce) W.gsap.to(shownV, { lo, hi, duration: 0.7, ease: "power3.out", onUpdate: paint });
      else { shownV.lo = lo; shownV.hi = hi; paint(); }
    };
    const calc = () => {
      const fd = new FormData(f), s = +surf.value;
      $("#eSurfOut").textContent = s + NB + "m²";
      let k = +fd.get("type") || 1;
      fd.getAll("opt").forEach((o) => (k *= 1 + +o));
      const base = ZONES[+zone.value].m2 * s * k;
      show(Math.round((base * 0.92) / 10000) * 10000, Math.round((base * 1.08) / 10000) * 10000);
    };
    f.addEventListener("input", calc);
    f.addEventListener("change", calc);
    f.addEventListener("submit", (e) => { e.preventDefault(); msg.dataset.k = "es.done"; msg.textContent = t("es.done"); });
    listeners.push(() => { paint(); $("#eSurfOut").textContent = surf.value + NB + "m²"; if (msg.dataset.k) msg.textContent = t(msg.dataset.k); });
    calc();
  }

  initSearch();
  initDrawer();
  initEstimate();
  applyLang(lang, false);
  initReveal();
  initFilm();
  // Avec GSAP : une seule boucle, celle du ticker. Sans GSAP : boucle de secours.
  if (hasST) G.ticker.add(frameUpdate);
  else requestAnimationFrame(loop);
})();
