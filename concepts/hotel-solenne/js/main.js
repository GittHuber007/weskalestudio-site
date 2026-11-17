/* Hôtel Solenne, concept Weskale Studio (marque fictive).
   Ouverture : l'image d'arrivée, puis un vol de drone en séquence d'images
   piloté par le défilement. Le contenu reste lisible sans JavaScript. */
(function () {
  "use strict";
  const W = window, D = document, H = D.documentElement;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portrait = () => W.innerWidth / W.innerHeight < 1;
  const wide = () => W.innerWidth >= 900;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const anim = hasGsap && !reduce;
  const loader = $("#loader");

  if (anim) { H.classList.add("anim"); gsap.registerPlugin(ScrollTrigger); }
  else if (loader) loader.remove();

  /* ---------- Séquence du drone ----------
     126 images en 1280 px (ordinateur), 63 images recadrées en portrait (téléphone).
     Chargement progressif : la première image, puis les autres par lots,
     en commençant par celles proches de la position du défilement. */
  const SEQ = { d: { dir: "assets/seq/d/", n: 126 }, m: { dir: "assets/seq/m/", n: 63 } };
  const canvas = $(".open__seq");
  const seq = {
    cfg: null, imgs: [], ok: [], want: 0, drawn: -1, busy: 0,
    init() {
      this.cfg = portrait() ? SEQ.m : SEQ.d;
      this.imgs = new Array(this.cfg.n).fill(null);
      this.ok = new Array(this.cfg.n).fill(false);
      this.ctx = canvas.getContext("2d");
      this.size();
      W.addEventListener("resize", () => this.size());
    },
    src(i) { return this.cfg.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp"; },
    load(i) {
      return new Promise((res) => {
        const im = new Image(); im.decoding = "async";
        /* Image gardée décodée avant d'être dessinée : aucun décodage pendant le défilement. */
        im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { this.ok[i] = true; if (Math.abs(i - this.want) < 2) this.draw(true); res(true); }); };
        im.onerror = () => res(false);
        im.src = this.src(i); this.imgs[i] = im;
      });
    },
    next() {
      let best = -1, bd = 1e9;
      for (let i = 0; i < this.cfg.n; i++) {
        if (this.imgs[i]) continue;
        const d = i >= this.want ? i - this.want : (this.want - i) * 1.5;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    },
    pump() {
      while (this.busy < 6) {
        const i = this.next(); if (i < 0) return;
        this.busy++; this.load(i).then(() => { this.busy--; this.pump(); });
      }
    },
    start(firstCount) {
      const first = Array.from({ length: Math.min(firstCount, this.cfg.n) }, (_, i) => this.load(i));
      return Promise.all(first).then(() => this.pump());
    },
    size() {
      /* Densité plafonnée (1,5 ordinateur, 2 téléphone), jamais au-delà des pixels de l'image source.
         Sur téléphone, la barre d'adresse qui bouge ne redimensionne pas le canvas. */
      const r = canvas.getBoundingClientRect(), mob = this.cfg === SEQ.m;
      if (this.sw === r.width && mob && Math.abs(this.sh - r.height) < 160) return;
      this.sw = r.width; this.sh = r.height;
      const src = mob ? [476, 712] : [1280, 712];
      const dpr = Math.max(0.5, Math.min(W.devicePixelRatio || 1, mob ? 2 : 1.5, Math.min(src[0] / (r.width || 1), src[1] / (r.height || 1))));
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
      this.draw(true);
    },
    set(p) {
      const w = Math.round(clamp(p, 0, 1) * (this.cfg.n - 1));
      if (w !== this.want) { this.want = w; this.pump(); }
      this.draw();
    },
    draw(force) {
      let i = -1;
      for (let d = 0; d < this.cfg.n; d++) {
        if (this.ok[this.want - d]) { i = this.want - d; break; }
        if (this.ok[this.want + d]) { i = this.want + d; break; }
      }
      if (i < 0 || (!force && i === this.drawn)) return;
      const im = this.imgs[i], cw = canvas.width, ch = canvas.height, iw = im.naturalWidth, ih = im.naturalHeight;
      if (!iw) return;
      const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
      this.ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
      this.drawn = i;
    },
  };

  /* ---------- Découpes de texte ---------- */
  function splitWords(el) {
    const walk = (node) => Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const f = D.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(D.createTextNode(" ")); return; }
          const s = D.createElement("span"); s.className = "w"; s.textContent = t; f.appendChild(s);
        });
        n.replaceWith(f);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  }
  function splitLines(el) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="ln" aria-hidden="true"><span>${l.trim()}</span></span>`).join("");
  }

  /* ---------- Défilement fluide ---------- */
  let lenis = null;
  function initLenis() {
    if (!anim || !W.Lenis) return;
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const navOffset = () => { const n = $("#nav"); return n ? -Math.round(n.offsetHeight) : 0; };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); const t = id.length > 1 ? $(id) : D.body;
    if (!t) return; e.preventDefault();
    /* Décalage de l'en-tête fixe, lu au clic. */
    if (lenis) lenis.scrollTo(id === "#top" ? 0 : t, { duration: 1.2, offset: id === "#top" ? 0 : navOffset() }); else t.scrollIntoView();
  }));

  /* ---------- Ouverture épinglée ---------- */
  function initOpening() {
    const stage = $(".open__stage"), img = $(".open__img img"), hero = $(".open__hero"), steps = $$(".step"), bar = $("#openBar");
    const FADE_END = 0.16;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(img, { scale: 1.24, duration: FADE_END }, 0)
      .to(hero, { y: -90, autoAlpha: 0, duration: 0.09 }, 0)
      .to(".open__cue", { autoAlpha: 0, duration: 0.04 }, 0)
      .to(canvas, { opacity: 1, duration: 0.06 }, 0.1);
    const at = [0.22, 0.48, 0.74];
    steps.forEach((s, i) => {
      const t = $(".step__t", s);
      tl.fromTo(s, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, at[i]);
      tl.fromTo(t, { scale: 0.94, transformOrigin: "0% 100%" }, { scale: 1.05, duration: i < 2 ? 0.24 : 0.26 }, at[i]);
      if (i < 2) tl.to(s, { autoAlpha: 0, y: -40, duration: 0.05, ease: "power2.in" }, at[i] + 0.19);
    });
    tl.set({}, {}, 1);
    ScrollTrigger.create({
      /* 300 vh sur ordinateur, 240 vh sur téléphone (avant 480 et 360) : mêmes étapes, resserrées. */
      trigger: "#open", start: "top top", end: () => "+=" + Math.round(W.innerHeight * (portrait() ? 2.4 : 3.0)),
      pin: stage, pinSpacing: true, scrub: 0.4, animation: tl, invalidateOnRefresh: true,
      onUpdate: (st) => { const p = st.progress; seq.set((p - 0.1) / 0.9); bar.style.transform = "scaleX(" + p.toFixed(4) + ")"; },
    });
    if (W.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const x = gsap.quickTo(".open__img", "x", { duration: 1.6, ease: "power3" }), y = gsap.quickTo(".open__img", "y", { duration: 1.6, ease: "power3" });
      stage.addEventListener("pointermove", (e) => { x(-(e.clientX / W.innerWidth - 0.5) * 18); y(-(e.clientY / W.innerHeight - 0.5) * 12); });
    }
  }

  /* ---------- Langues : anglais par défaut, français complet ---------- */
  const I18N = {
    en: {
      docTitle: "Hôtel Solenne · Biarritz · Facing the Atlantic",
      docDesc: "Hôtel Solenne, an Art Deco hotel concept facing the ocean in Biarritz, with online booking. Fictional brand, Weskale Studio concept.",
      navMain: "Main navigation", navHouse: "The house", navRooms: "Rooms", navBook: "Book", navLogo: "Hôtel Solenne, back to top", langGroup: "Language",
      openAria: "Arriving at Hôtel Solenne",
      heroAlt: "Hôtel Solenne, a white Art Deco facade facing the Atlantic at golden hour, its name in bronze letters on the facade",
      kick: "Biarritz · Basque coast",
      title: '<span class="ln"><span>Facing</span></span><span class="ln"><span><em>the Atlantic</em></span></span>',
      lead: "An Art Deco hotel set on the sand, with rooms turned towards the open sea.",
      s1t: "From the beach", s1d: "You arrive from the sand, up the stone staircase.",
      s2t: "The facade", s2d: "White, curved, turned towards the open sea. The name in bronze letters.",
      s3t: "The terrace", s3d: "Breakfast is served facing the swell, while the beach is still empty.",
      cue: "Scroll",
      maniKick: "The house",
      mani: "A 1930s hotel set on the sand of Biarritz. Curves, bronze, tall windows. <em>And the ocean in every room.</em>",
      faceAlt: "Detail of the facade: the name Hotel Solenne in bronze letters above the curved balconies",
      faceKick: "The facade",
      faceT: "Curved balconies, tall windows, bronze lettering. <em>Art Deco as it was drawn for the seafront.</em>",
      oceanH: "The ocean<br><em>at the foot of the steps</em>",
      oceanAlt: "Atlantic waves on the beach at golden hour, rocks in the mist",
      oceanP: "The swell breaks a few metres from the front steps. Sea-facing rooms open their windows onto that sound, from sunrise to sunset.",
      terrAlt: "The hotel's stone terrace and its two staircases leading down to the beach",
      terrP: "Two stone staircases lead from the terrace down to the beach. You go for a swim without crossing a street.",
      roomsH: "The rooms", roomsNote: "Sample prices per night, for demonstration only.",
      bookH: "Book<br><em>your nights</em>", bookSub: "Tap your arrival night, then your last night.",
      stripAria: "Available nights", roomLab: "Room", typeAria: "Room type", guestsLab: "Guests",
      breakOpt: "Breakfast facing the sea, €24 per person per night",
      namePh: "Your name", nameAria: "Name", mailPh: "you@example.com", mailAria: "Email address", confirm: "Confirm",
      demoNote: "Demonstration: no real booking, no payment.",
      footAddr: "Hôtel Solenne<br>Biarritz, Basque coast",
      footConcept: "Weskale Studio concept · fictional brand.<br>Hotel, prices and visuals are examples.",
      badge: "Weskale Studio concept · fictional brand",
    },
    fr: {
      docTitle: "Hôtel Solenne · Biarritz · Face à l'Atlantique",
      docDesc: "Hôtel Solenne, concept d'hôtel art déco face à l'océan à Biarritz, avec réservation en ligne. Marque fictive, concept Weskale Studio.",
      navMain: "Navigation principale", navHouse: "La maison", navRooms: "Chambres", navBook: "Réserver", navLogo: "Hôtel Solenne, retour en haut", langGroup: "Langue",
      openAria: "Arrivée à l'Hôtel Solenne",
      heroAlt: "L'Hôtel Solenne, façade art déco blanche face à l'Atlantique à l'heure dorée, son nom en lettres de bronze sur la façade",
      kick: "Biarritz · Côte basque",
      title: '<span class="ln"><span>Face à</span></span><span class="ln"><span><em>l\'Atlantique</em></span></span>',
      lead: "Un hôtel art déco posé sur le sable, et des chambres tournées vers le large.",
      s1t: "Par la plage", s1d: "On arrive depuis le sable, par l'escalier de pierre.",
      s2t: "La façade", s2d: "Blanche, arrondie, tournée vers le large. Le nom en lettres de bronze.",
      s3t: "La terrasse", s3d: "Le petit déjeuner se prend face à la houle, quand la plage est encore vide.",
      cue: "Défiler",
      maniKick: "La maison",
      mani: "Un hôtel des années 30, posé sur le sable de Biarritz. Des courbes, du bronze, de grandes fenêtres. <em>Et l'océan dans chaque chambre.</em>",
      faceAlt: "Détail de la façade : le nom Hotel Solenne en lettres de bronze au-dessus des balcons arrondis",
      faceKick: "La façade",
      faceT: "Garde-corps arrondis, fenêtres hautes, lettres de bronze. <em>L'art déco tel qu'on le dessinait face à la mer.</em>",
      oceanH: "L'océan<br><em>au pied des marches</em>",
      oceanAlt: "Vagues de l'Atlantique sur la plage à l'heure dorée, rochers dans la brume",
      oceanP: "La houle arrive à quelques mètres du perron. Les chambres côté mer ouvrent leurs fenêtres sur ce bruit, du lever au coucher du soleil.",
      terrAlt: "Terrasse en pierre de l'hôtel et ses deux escaliers qui descendent sur la plage",
      terrP: "Deux escaliers de pierre descendent de la terrasse vers la plage. On part se baigner sans traverser de rue.",
      roomsH: "Les chambres", roomsNote: "Prix d'exemple, par nuit, pour la démonstration.",
      bookH: "Réserver<br><em>vos nuits</em>", bookSub: "Touchez la nuit d'arrivée, puis la dernière nuit.",
      stripAria: "Nuits disponibles", roomLab: "Chambre", typeAria: "Type de chambre", guestsLab: "Personnes",
      breakOpt: "Petit déjeuner face à la mer, 24 € par personne et par nuit",
      namePh: "Votre nom", nameAria: "Nom", mailPh: "vous@exemple.fr", mailAria: "Adresse e-mail", confirm: "Confirmer",
      demoNote: "Démonstration : aucune réservation réelle, aucun paiement.",
      footAddr: "Hôtel Solenne<br>Biarritz, Côte basque",
      footConcept: "Concept Weskale Studio · marque fictive.<br>Hôtel, prix et visuels sont des exemples.",
      badge: "Concept Weskale Studio · marque fictive",
    },
  };
  /* Textes de la réservation, dans les deux langues. */
  const B = {
    en: {
      locale: "en-GB",
      types: [["City Room", "22 m², garden side"], ["Ocean Room", "26 m², balcony over the sea"], ["Rotunda Suite", "48 m², in the curved corner, three windows onto the ocean"], ["Grand Suite", "70 m², lounge and loggia facing the open sea"]],
      eur: (v) => "€" + Math.round(v).toLocaleString("en-GB"),
      from: (p) => "from " + p, cap: (n) => `up to ${n} guests`,
      roomAria: (t, d, p) => `${t}, ${d}, from ${p} per night. Select and book`,
      night: (d) => `Night of ${d}`, full: "full", fullAria: ", fully booked",
      choose: "Choose your nights.", range: (a, b) => `From ${a} to ${b}`,
      nights: (n) => `${n} night${n > 1 ? "s" : ""}`, breakfast: (g) => `Breakfast, ${g} guest${g > 1 ? "s" : ""}`,
      tooMany: (t, n) => `${t}: ${n} guests at most.`, tooManySubmit: (t, n) => `${t}: ${n} guests at most. Choose a suite.`,
      fullErr: "One of the selected nights is fully booked.", noNight: "Choose at least one night.", who: "Please enter your name and a valid email address.",
      ok: (t, n, d, p) => `<strong>Demonstration stay confirmed</strong>${t}, ${n} from ${d}, ${p}. In the live version, the confirmation is sent by email.`,
    },
    fr: {
      locale: "fr-FR",
      types: [["Chambre Ville", "22 m², côté jardin"], ["Chambre Océan", "26 m², balcon sur la mer"], ["Suite Rotonde", "48 m², dans l'angle arrondi, trois fenêtres sur l'océan"], ["Grande Suite", "70 m², salon et loggia face au large"]],
      eur: (v) => Math.round(v).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " €",
      from: (p) => "dès " + p, cap: (n) => `${n} personnes au plus`,
      roomAria: (t, d, p) => `${t}, ${d}, dès ${p} la nuit. Choisir et réserver`,
      night: (d) => `Nuit du ${d}`, full: "complet", fullAria: ", complet",
      choose: "Choisissez vos nuits.", range: (a, b) => `Du ${a} au ${b}`,
      nights: (n) => `${n} nuit${n > 1 ? "s" : ""}`, breakfast: (g) => `Petit déjeuner, ${g} pers.`,
      tooMany: (t, n) => `${t} : ${n} personnes au plus.`, tooManySubmit: (t, n) => `${t} : ${n} personnes au plus. Choisissez une suite.`,
      fullErr: "Une des nuits choisies est complète.", noNight: "Choisissez au moins une nuit.", who: "Indiquez votre nom et une adresse e-mail valide.",
      ok: (t, n, d, p) => `<strong>Séjour de démonstration confirmé</strong>${t}, ${n} à partir du ${d}, ${p}. Dans la version réelle, la confirmation part par e-mail.`,
    },
  };
  let lang = H.lang === "fr" ? "fr" : "en";
  const L = () => B[lang];

  function applyText() {
    const t = I18N[lang];
    H.lang = lang;
    D.title = t.docTitle;
    const md = $('meta[name="description"]'); if (md) md.setAttribute("content", t.docDesc);
    $$("[data-i18n]").forEach((el) => { el.innerHTML = t[el.dataset.i18n]; });
    $$("[data-i18n-alt]").forEach((el) => el.setAttribute("alt", t[el.dataset.i18nAlt]));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t[el.dataset.i18nAria]));
    $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t[el.dataset.i18nPh]));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }
  let ready = false, maniTween = null;
  function setLang(l) {
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem("solenne-lang", l); } catch (e) { /* stockage indisponible : la langue vaut pour la visite */ }
    applyText();
    if (ready && anim) {
      $$("[data-lines]").forEach((h) => { splitLines(h); gsap.set($$(".ln>span", h), { yPercent: 0 }); });
      gsap.set(".open__title .ln>span", { yPercent: 0 });
      wordsScrub();
    }
    rooms(); setType(st.type);
    $("#sumMsg").textContent = "";
    if (ready && anim) ScrollTrigger.refresh();
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ---------- Manifeste, titres, façade, plans de cinéma ---------- */
  function wordsScrub() {
    const mani = $("[data-words]");
    if (maniTween) { maniTween.scrollTrigger && maniTween.scrollTrigger.kill(); maniTween.kill(); }
    splitWords(mani);
    maniTween = gsap.to($$(".w", mani), { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: mani, start: "top 78%", end: "bottom 45%", scrub: 0.4 } });
  }
  function initSections() {
    wordsScrub();
    $$("[data-lines]").forEach((h) => {
      splitLines(h);
      gsap.set($$(".ln>span", h), { yPercent: 110 });
      ScrollTrigger.create({ trigger: h, start: "top 85%", once: true, onEnter: () => gsap.fromTo($$(".ln>span", h), { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: "expo.out" }) });
    });
    $$(".chap__n, .chap__p, .book__sub, .rooms .note").forEach((el) => gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));

    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.fromTo(".face__frame", { width: "40vw", height: "58vh" }, { width: "100vw", height: "100vh", duration: 0.7, ease: "power1.inOut" }, 0)
        .fromTo(".face__frame img", { scale: 1.12 }, { scale: 1, duration: 0.8 }, 0)
        .fromTo(".face__word", { scale: 0.92, opacity: 1 }, { scale: 1.2, opacity: 0, duration: 0.5 }, 0)
        .fromTo(".face__frame", { "--shade": 0 }, { "--shade": 1, duration: 0.25 }, 0.6)
        .fromTo(".face__cap", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.72)
        .set({}, {}, 1);
      ScrollTrigger.create({ trigger: ".face", start: "top top", end: "+=140%", pin: ".face__pin", scrub: 0.4, animation: tl });
    });
    mm.add("(max-width: 899px)", () => {
      gsap.fromTo(".face__frame", { clipPath: "inset(14% 10% 14% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".face__frame", start: "top 95%", end: "top 35%", scrub: 0.4 } });
      gsap.fromTo(".face__word", { xPercent: 8 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: ".face", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });

    $$("[data-cine]").forEach((f) => {
      gsap.fromTo(f, { clipPath: "inset(10% 8% 10% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: f, start: "top 95%", end: "top 40%", scrub: 0.4 } });
      gsap.fromTo($("img", f), { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });

    const nav = $("#nav"); let last = 0;
    ScrollTrigger.create({ trigger: ".mani", start: "top 70px", onEnter: () => nav.classList.add("is-dark"), onLeaveBack: () => nav.classList.remove("is-dark") });
    W.addEventListener("scroll", () => {
      const y = W.scrollY, deep = nav.classList.contains("is-dark");
      if (deep && y > last + 4) nav.classList.add("is-hidden"); else if (y < last - 4 || !deep) nav.classList.remove("is-hidden");
      last = y;
    }, { passive: true });
  }

  /* ---------- Chambres et réservation (prix d'exemple) ---------- */
  const TYPES = [{ base: 190, cap: 2 }, { base: 260, cap: 2 }, { base: 420, cap: 3 }, { base: 640, cap: 3 }];
  const tName = (i) => L().types[i][0], tDesc = (i) => L().types[i][1];
  const eur = (v) => L().eur(v);
  const day0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const key = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967295; };
  const nightPrice = (base, d) => base * ((d.getDay() === 5 || d.getDay() === 6) ? 1.2 : 1) * (1 + (hash(key(d)) - 0.5) * 0.1);
  const full = (d) => hash(key(d) + 99) < 0.08;
  const st = { a: -1, b: -1, type: 1 };
  let render = () => 0;

  function rooms() {
    $("#roomsList").innerHTML = TYPES.map((t, i) => `<li class="room"><button type="button" data-i="${i}" aria-label="${L().roomAria(tName(i), tDesc(i), eur(t.base))}"><span class="room__t">${tName(i)}</span><span class="room__d">${tDesc(i)} · ${L().cap(t.cap)}</span><span class="room__p">${L().from(eur(t.base))}</span></button></li>`).join("");
    $("#types").innerHTML = TYPES.map((t, i) => `<button type="button" role="radio" aria-checked="${i === st.type}" data-i="${i}">${tName(i)}</button>`).join("");
  }
  function setType(i) {
    st.type = i;
    $$("#types button").forEach((x) => x.setAttribute("aria-checked", String(+x.dataset.i === i)));
    render();
  }

  function booking() {
    const today = day0(new Date());
    const days = Array.from({ length: 45 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i + 1); return d; });
    const strip = $("#strip"), rows = $("#sumRows"), msg = $("#sumMsg"), guests = $("#guests"), brk = $("#optBreak");
    const fmt = (o) => new Intl.DateTimeFormat(L().locale, o);
    const longDate = (d) => fmt({ weekday: "long", day: "numeric", month: "long" }).format(d);

    $("#roomsList").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      setType(+b.dataset.i);
      if (lenis) lenis.scrollTo("#reserver", { duration: 1.2, offset: navOffset() }); else $("#reserver").scrollIntoView();
    });
    $("#types").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setType(+b.dataset.i); });
    strip.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      const i = +b.dataset.i;
      if (st.a < 0 || st.b >= 0 || i < st.a) { st.a = i; st.b = -1; msg.textContent = ""; }
      else if (days.slice(st.a, i + 1).some(full)) { st.a = i; st.b = -1; msg.textContent = L().fullErr; }
      else st.b = i;
      render();
    });
    [guests, brk].forEach((x) => x.addEventListener("change", render));

    const nights = () => { if (st.a < 0) return []; return days.slice(st.a, (st.b >= 0 ? st.b : st.a) + 1); };
    render = function () {
      const T = TYPES[st.type], sx = strip.scrollLeft, wk = fmt({ weekday: "short" }), mo = fmt({ month: "short" });
      strip.innerHTML = days.map((d, i) => {
        const c = i === st.a ? "a" : i === st.b ? "b" : (st.a >= 0 && st.b >= 0 && i > st.a && i < st.b) ? "in" : "";
        return `<button type="button" class="${c}" data-i="${i}" ${full(d) ? "disabled" : ""} aria-pressed="${c !== ""}" aria-label="${L().night(longDate(d))}${full(d) ? L().fullAria : ""}"><small>${wk.format(d)}</small><b>${d.getDate()}</b><small>${mo.format(d)}</small><span>${full(d) ? L().full : eur(nightPrice(T.base, d))}</span></button>`;
      }).join("");
      strip.scrollLeft = sx;
      const ns = nights(), g = +guests.value;
      if (g > T.cap) msg.textContent = L().tooMany(tName(st.type), T.cap);
      if (!ns.length) { $("#sumDates").textContent = L().choose; rows.innerHTML = ""; return 0; }
      const out = new Date(ns[ns.length - 1]); out.setDate(out.getDate() + 1);
      $("#sumDates").textContent = L().range(longDate(ns[0]), longDate(out));
      const list = [[`${tName(st.type)}, ${L().nights(ns.length)}`, ns.reduce((a, d) => a + nightPrice(T.base, d), 0)]];
      if (brk.checked) list.push([L().breakfast(g), 24 * g * ns.length]);
      const tot = list.reduce((a, r) => a + r[1], 0);
      rows.innerHTML = list.map(([l, v]) => `<div class="r"><span>${l}</span><span>${eur(v)}</span></div>`).join("") + `<div class="r t"><span>Total</span><span>${eur(tot)}</span></div>`;
      return tot;
    };
    $("#sum").addEventListener("submit", (e) => {
      e.preventDefault();
      const ns = nights(), T = TYPES[st.type];
      if (!ns.length) { msg.textContent = L().noNight; return; }
      if (+guests.value > T.cap) { msg.textContent = L().tooManySubmit(tName(st.type), T.cap); return; }
      if (!$("#sName").value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($("#sMail").value)) { msg.textContent = L().who; return; }
      const tot = render();
      msg.innerHTML = L().ok(tName(st.type), L().nights(ns.length), longDate(ns[0]), eur(tot));
    });
    render();
  }

  /* ---------- Démarrage ---------- */
  applyText();
  rooms();
  booking();
  if (!anim) return;

  seq.init();
  initLenis();
  const heroImg = $(".open__img img");
  const heroReady = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.onload = heroImg.onerror = r; });
  const num = $("#loaderNum"), bar = $("#loaderBar"), shown = { v: 0 };
  const jobs = [heroReady, seq.start(portrait() ? 6 : 10)];
  let done = 0;
  jobs.forEach((j) => j.then(() => { done++; gsap.to(shown, { v: done / jobs.length * 100, duration: 0.5, onUpdate: () => { num.textContent = String(Math.round(shown.v)).padStart(2, "0"); bar.style.transform = "scaleX(" + shown.v / 100 + ")"; } }); }));

  Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 5000))]).then(() => {
    initOpening();
    initSections();
    ready = true;
    const tl = gsap.timeline();
    tl.to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut", delay: 0.4 }).add(() => loader.remove());
    tl.fromTo(".open__img", { scale: 1.14 }, { scale: 1.03, duration: 2.4, ease: "expo.out" }, "-=0.7");
    tl.fromTo(".open__title .ln>span", { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.12, ease: "expo.out" }, "<0.15");
    tl.fromTo(".open__hero .kick, .open__lead, .open__cue, .nav", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" }, "<0.3");
    ScrollTrigger.refresh();
    W.addEventListener("load", () => ScrollTrigger.refresh());
  });
})();
