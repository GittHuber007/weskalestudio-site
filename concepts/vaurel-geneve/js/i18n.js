/* Vaurel : anglais par defaut (textes du HTML), francais complet ci-dessous.
   Changer de langue enregistre le choix (localStorage, avec repli ?lang=) et recharge la page
   a la meme hauteur : les titres sont decoupes lettre par lettre, on ne les retraduit pas a chaud. */
(function () {
  "use strict";
  const root = document.documentElement;
  const lang = root.lang === "fr" ? "fr" : "en";
  const KEY = "vaurel-lang";

  const FR = {
    "meta.title": "Vaurel Genève · Haute horlogerie",
    "meta.desc": "Vaurel, maison horlogère fictive à Genève. Concept Weskale Studio.",
    "nav.sections": "Sections",
    "nav.exploded": "Vue éclatée",
    "nav.calibre": "Calibre",
    "nav.dials": "Cadrans",
    "nav.home": "Vaurel, retour en haut",
    "nav.cta": "Rendez-vous privé",
    "nav.ctaShort": "Rendez-vous",
    "lang.label": "Langue",
    "hero.aria": "Chronographe en or jaune",
    "hero.alt": "Chronographe Vaurel en or jaune, cadran noir à trois compteurs, posé sur une plaque de marbre noir",
    "hero.eyebrow": "Maison Vaurel · Genève",
    "hero.title": '<span class="line">Chronographe</span><span class="line"><em>en or jaune</em></span>',
    "hero.sub": "Trois compteurs, une lunette tachymétrique gravée dans l'or et un cadran noir laqué. Boîtier de 40 mm, bracelet en or massif.",
    "hero.btn": "Ouvrir la montre",
    "hero.noteK": "Lunette tachymétrique",
    "hero.noteT": "Gravée dans l'or, l'échelle lit une vitesse moyenne sur un kilomètre, à partir du chronographe.",
    "hero.ref": "<span>Réf.</span> V.40 Chronographe",
    "hero.scroll": "Défiler",
    "ex.aria": "Vue éclatée du chronographe",
    "ex.alt": "Vue éclatée du chronographe Vaurel, couche par couche",
    "ex.eyebrow": "Vue éclatée",
    "ex.title": "Couche par couche",
    "ex.c1k": "Boîtier et lunette",
    "ex.c1v": "Or 18 carats",
    "ex.c1d": "Boîtier, lunette et bracelet en or jaune massif, polis et satinés à la main.",
    "ex.c2k": "Mouvement",
    "ex.c2d": "Mouvement mécanique à chronographe, 31 rubis, ponts décorés à la main.",
    "ex.c3k": "Réserve de marche",
    "ex.c3d": "Trois jours d'autonomie une fois le remontage complet.",
    "ex.note": "Produit fictif. Données d'illustration.",
    "cal.s1n": "I · Le cadran",
    "cal.s1d": "Une pierre noire polie, des index appliqués en or. C'est le cadran du modèle Onyx, boîtier de 39 mm.",
    "cal.s2n": "II · Dessous",
    "cal.s2t": "Le mouvement",
    "cal.s2d": "Le cadran s'efface. Ponts rhodiés, roues en or, rubis sertis dans leurs chatons, vis bleuies à la flamme.",
    "cal.s3t": "À la main",
    "cal.s3d": "Remontage manuel. Chaque pont est anglé et décoré à la main, puis laissé visible sur le modèle Ossature.",
    "cal.f1": "Réserve de marche",
    "cal.f2v": "28 800",
    "cal.f2": "Alternances par heure",
    "cal.f3": "Rubis",
    "at.aria": "Atelier",
    "at.alt": "Mains d'un horloger qui assemble un mouvement",
    "at.eyebrow": "Atelier",
    "at.text": "Une montre se juge à ce qu'on ne voit pas : l'angle d'un pont, le bleu d'une vis, la régularité d'une seconde.",
    "at.l1t": "Anglage",
    "at.l1d": "Chaque arête de pont limée à quarante-cinq degrés, puis polie jusqu'à tenir une seule ligne de lumière.",
    "at.l2t": "Côtes de Genève",
    "at.l2d": "Des stries parallèles tracées d'un seul passage sur les ponts, sans reprise.",
    "at.l3t": "Bleuissage",
    "at.l3d": "Des vis d'acier chauffées lentement jusqu'à un bleu profond et régulier.",
    "cfg.aria": "Choisir un cadran",
    "cfg.eyebrow": "Trois cadrans",
    "cfg.case": "Boîtier",
    "cfg.dial": "Cadran",
    "cfg.price": "Prix indicatif",
    "cfg.tabs": "Cadrans",
    "rdv.aria": "Rendez-vous privé",
    "rdv.eyebrow": "Sur rendez-vous",
    "rdv.title": "Voir la montre au poignet",
    "rdv.lead": "Choisissez un salon, un modèle et un jour. La maison prépare les pièces à l'avance.",
    "rdv.name": "Nom",
    "rdv.nameP": "Votre nom",
    "rdv.email": "E-mail",
    "rdv.emailP": "vous@exemple.com",
    "rdv.salon": "Salon",
    "rdv.geneve": "Genève",
    "rdv.dubai": "Dubaï",
    "rdv.model": "Modèle",
    "rdv.day": "Jour",
    "rdv.send": "Demander le rendez-vous",
    "foot.house": "Vaurel Genève, haute horlogerie",
    "foot.concept": "Concept Weskale Studio · marque fictive",
    "foot.images": "Images générées pour ce concept",
  };

  // Textes fabriques par le script (configurateur, formulaire)
  const JS = {
    en: {
      models: [
        { name: "Chronograph", case: "18k yellow gold, 40 mm", dial: "Black lacquer, three counters", price: "CHF 48,500" },
        { name: "Onyx", case: "18k yellow gold, 39 mm", dial: "Onyx, small seconds", price: "CHF 32,400" },
        { name: "Ossature", case: "18k yellow gold, 39 mm", dial: "Calibre V.21 on view", price: "CHF 61,900" },
      ],
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      daysLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      bad: "Please enter your name and a valid email address.",
      ok: (name, model, day, salon) => `Thank you, ${name}. Viewing of the ${model} requested for ${day}, ${salon} salon. Demonstration only: nothing has been sent.`,
      sent: "Request noted",
    },
    fr: {
      models: [
        { name: "Chronographe", case: "Or jaune 18 carats, 40 mm", dial: "Noir laqué, trois compteurs", price: "48 500 CHF" },
        { name: "Onyx", case: "Or jaune 18 carats, 39 mm", dial: "Onyx, petite seconde", price: "32 400 CHF" },
        { name: "Ossature", case: "Or jaune 18 carats, 39 mm", dial: "Calibre V.21 apparent", price: "61 900 CHF" },
      ],
      days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      daysLong: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
      bad: "Indiquez votre nom et une adresse e-mail valide.",
      ok: (name, model, day, salon) => `Merci, ${name}. Rendez-vous demandé pour le modèle ${model}, ${day}, salon de ${salon}. Démonstration : rien n'a été envoyé.`,
      sent: "Demande notée",
    },
  };
  window.VL = Object.assign({ lang }, JS[lang]);

  if (lang === "fr") {
    document.title = FR["meta.title"];
    const md = document.querySelector('meta[name="description"]');
    md && md.setAttribute("content", FR["meta.desc"]);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = FR[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (FR[key] != null) el.setAttribute(attr, FR[key]);
      });
    });
  }

  // Selecteur EN / FR
  document.querySelectorAll(".lang [data-lang]").forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", on);
    b.addEventListener("click", () => {
      if (b.dataset.lang === lang) return;
      let stored = false;
      try { localStorage.setItem(KEY, b.dataset.lang); stored = localStorage.getItem(KEY) === b.dataset.lang; } catch (e) {}
      try { sessionStorage.setItem("vaurel-y", String(Math.round(scrollY))); } catch (e) {}
      const u = new URL(location.href);
      u.hash = "";
      if (stored) u.searchParams.delete("lang"); else u.searchParams.set("lang", b.dataset.lang);
      location.replace(u.toString());
    });
  });
})();
