/* Saffra : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "saffra.lang";
  const FR = {
    "meta.title": "Saffra · Cuisine marocaine contemporaine · Marrakech",
    "meta.desc": "Saffra, concept de restaurant marocain contemporain à Marrakech : tajines mijotés, safran, cuivre et terre, une carte sans alcool et la réservation de table. Marque fictive, concept Weskale Studio.",
    "nav.home": "Saffra, retour en haut",
    "nav.main": "Navigation principale",
    "nav.kitchen": "La cuisine",
    "nav.menu": "Menu dégustation",
    "nav.tea": "Le thé",
    "nav.lang": "Langue",
    "nav.book": "Réserver",
    "film.aria": "Le plat signature, en très gros plan",
    "film.alt": "Épaule d'agneau glacée au safran, abricots et amandes grillées dans un plat en terre cuite gravé SAFFRA, couvercle de tajine en cuivre martelé soulevé, vapeur qui monte",
    "hero.eyebrow": "Cuisine marocaine contemporaine · Marrakech",
    "hero.l1": "Le couvercle se lève.",
    "hero.l2": "La table se tait.",
    "hero.lead": "Les recettes des maisons de la médina, les produits de l'Atlas, la précision d'une cuisine gastronomique. Une table sans alcool, et un thé servi comme il se doit.",
    "hero.book": "Réserver une table",
    "hero.menu": "Le menu dégustation",
    "ch0.n": "I · Le cuivre",
    "ch0.t": "Martelé à la main dans la médina, le couvercle garde la vapeur jusqu'à la dernière seconde.",
    "ch1.n": "II · Le safran",
    "ch1.t": "Quelques pistils infusés dans le jus de cuisson. Le glaçage prend sa couleur, la salle prend son parfum.",
    "ch2.n": "III · La terre",
    "ch2.t": "Servi dans la terre où il a cuit, gravée au nom de la maison.",
    "film.end": "Sept heures à feu doux, <em>un instant à table.</em>",
    "rail.0": "Cuivre",
    "rail.1": "Safran",
    "rail.2": "Terre",
    "film.cue": "Défiler pour lever le couvercle",
    "intro.eyebrow": "La maison",
    "intro.text": "Nous cuisinons lentement et servons simplement. Chaque plat part d'une recette de maison marrakchie, puis passe par une cuisine gastronomique sans rien perdre de sa chaleur.",
    "s1.aria": "Le safran",
    "s1.w": "Safran",
    "s1.n": "01 · L'or rouge",
    "s1.h": "Une épice qui se pèse <em>au gramme</em>",
    "s1.p": "Le safran donne le ton de la maison : dans le glaçage de l'agneau, dans le bouillon du couscous, dans une crème en fin de repas. Toujours quelques pistils, jamais plus.",
    "s2.aria": "L'Atlas",
    "s2.w": "Atlas",
    "s2.n": "02 · La terre",
    "s2.h": "De la montagne <em>à l'assiette</em>",
    "s2.p": "Olives, amandes, abricots, miel de thym de montagne : la carte suit ce qui descend de la plaine du Haouz et des vallées de l'Atlas, saison après saison.",
    "menu.aria": "Menu dégustation",
    "menu.eyebrow": "Menu dégustation",
    "menu.h": "Cinq temps, <em>une seule histoire</em>",
    "menu.per": "par convive",
    "menu.sample": "Prix d'exemple",
    "ph.1": "Pastilla",
    "ph.2": "Salades",
    "ph.note": "Photographie à venir",
    "c1.h": "Pastilla de pigeon",
    "c1.p": "Feuille de warqa croustillante, amandes grillées, cannelle et sucre glace.",
    "c2.h": "Un jardin de salades",
    "c2.p": "Zaalouk fumé, carottes au cumin, betterave à la fleur d'oranger.",
    "c3.h": "Tajine de kefta",
    "c3.p": "Boulettes d'agneau épicées, mijotées dans une sauce tomate lente, cumin et coriandre.",
    "c4.h": "Épaule d'agneau au safran",
    "c4.p": "Abricots glacés, amandes grillées, servie dans sa terre sous le couvercle de cuivre.",
    "c5.h": "Thé à la menthe et douceurs",
    "c5.p": "Versé de haut à table, avec des cornes de gazelle et des dattes.",
    "s3.aria": "Le thé à la menthe",
    "s3.w": "Thé",
    "s3.n": "03 · Le dernier geste",
    "s3.h": "Versé de haut, <em>trois fois</em>",
    "s3.p": "Thé vert, menthe fraîche, un peu de sucre. Versé de haut pour qu'il mousse dans le verre, à la fin de chaque repas, offert par la maison.",
    "book.eyebrow": "Réservation",
    "book.h": "Votre table <em>vous attend</em>",
    "book.sub": "Dîner du mardi au dimanche. Choisissez un soir, une heure et le nombre de convives.",
    "rs.day": "Soir",
    "rs.time": "Heure",
    "rs.guests": "Convives",
    "rs.less": "Un convive de moins",
    "rs.more": "Un convive de plus",
    "rs.name": "Nom",
    "rs.namePh": "Votre nom",
    "rs.note": "Une attention particulière",
    "rs.notePh": "Anniversaire, allergie, table calme",
    "rs.confirm": "Confirmer la réservation",
    "rs.legal": "Démonstration : aucune réservation n'est envoyée et aucun paiement n'est demandé.",
    "done.eyebrow": "Réservation notée",
    "done.again": "Modifier la réservation",
    "foot.h1": "La maison",
    "foot.p1": "Hivernage, Marrakech. L'adresse exacte et l'itinéraire partent avec la confirmation.",
    "foot.h2": "Service",
    "foot.p2": "Du mardi au dimanche, de 19 h à 23 h. Fermé le lundi.",
    "foot.h3": "À boire",
    "foot.p3": "Une carte sans alcool : jus pressés, infusions de la maison et thé à la menthe.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Plats, prix, horaires et visuels sont des exemples pour la démonstration.",
    "foot.top": "Revenir à table",
    "badge": "Concept Weskale Studio · marque fictive",
    /* Textes composés par le script */
    "js.full": "complet",
    "js.pickDay": "Choisissez un soir et une heure.",
    "js.needName": "Indiquez un nom pour la réservation.",
    "js.needSlot": "Choisissez un soir et une heure.",
    "js.guest1": "convive",
    "js.guestN": "convives",
    "js.at": "à",
    "js.doneH": "À très bientôt, {name}.",
    "js.doneP": "Table pour {g} le {day} à {time}. Dans la version réelle, une confirmation partirait par e-mail ou WhatsApp, avec l'adresse exacte. Ici, rien n'est envoyé.",
  };
  const EN_JS = {
    "js.full": "full",
    "js.pickDay": "Choose an evening and a time.",
    "js.needName": "Please add a name for the booking.",
    "js.needSlot": "Choose an evening and a time.",
    "js.guest1": "guest",
    "js.guestN": "guests",
    "js.at": "at",
    "js.doneH": "See you soon, {name}.",
    "js.doneP": "A table for {g} on {day} at {time}. In the live version, a confirmation would be sent by email or WhatsApp with the exact address. Here, nothing is sent.",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = Object.assign({}, EN_JS);
  const ATTRS = [["data-i18n", null], ["data-i18n-alt", "alt"], ["data-i18n-aria", "aria-label"], ["data-i18n-ph", "placeholder"]];
  ATTRS.forEach(([sel, attr]) => D.querySelectorAll(`[${sel}]`).forEach((el) => {
    const k = el.getAttribute(sel); if (EN[k] == null) EN[k] = attr ? el.getAttribute(attr) : el.innerHTML;
  }));
  EN["meta.title"] = D.title;
  const meta = D.querySelector('meta[name="description"]');
  EN["meta.desc"] = meta ? meta.content : "";

  const dict = { en: EN, fr: FR };
  const subs = [];
  let lang = "en";
  try { const s = localStorage.getItem(KEY); if (s === "fr" || s === "en") lang = s; } catch (e) {}

  function apply() {
    const d = dict[lang];
    ATTRS.forEach(([sel, attr]) => D.querySelectorAll(`[${sel}]`).forEach((el) => {
      const v = d[el.getAttribute(sel)]; if (v == null) return;
      if (attr) el.setAttribute(attr, v); else el.innerHTML = v;
    }));
    D.title = d["meta.title"]; if (meta) meta.content = d["meta.desc"];
    H.lang = lang;
    D.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  const I18N = (window.I18N = {
    get lang() { return lang; },
    get locale() { return lang === "fr" ? "fr-FR" : "en-GB"; },
    t: (k, vars) => {
      let s = dict[lang][k] != null ? dict[lang][k] : EN[k];
      if (s && vars) Object.keys(vars).forEach((v) => { s = s.replace("{" + v + "}", vars[v]); });
      return s;
    },
    price: (n) => new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-GB", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n),
    on: (fn) => subs.push(fn),
    set(l) {
      if (l !== "fr" && l !== "en") return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      apply(); subs.forEach((fn) => fn(l));
    },
  });

  function prices() { D.querySelectorAll("[data-price]").forEach((el) => { el.textContent = I18N.price(+el.dataset.price); }); }
  subs.push(prices);
  D.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) I18N.set(b.dataset.lang); }));
  apply(); prices();
})();
