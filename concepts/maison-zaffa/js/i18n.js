/* Maison Zaffa : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "maisonZaffa.lang";
  const FR = {
    "meta.title": "Maison Zaffa · Traiteur de mariages à Casablanca · Demande de date",
    "meta.desc": "Maison Zaffa, concept de traiteur de mariages à Casablanca : patios aux bougies, tables dressées, cuisine de fête, négafa et coordination. Devis et demande de date en ligne. Marque fictive, concept Weskale Studio.",
    "nav.home": "Maison Zaffa, retour en haut",
    "nav.main": "Navigation principale",
    "nav.table": "La table",
    "nav.house": "La maison",
    "nav.quote": "Devis",
    "nav.lang": "Langue",
    "nav.date": "Votre date",
    "film.aria": "Une nuit de mariage dans le patio d'un palais",
    "film.alt": "Réception de mariage la nuit dans le patio d'un palais à Casablanca : longues tables ivoire et or, bougies, lanternes de laiton, roses blanches, pièce montée, invités en caftan, et au premier plan un menu gravé Maison Zaffa",
    "hero.eyebrow": "Traiteur de mariages · Casablanca",
    "hero.sr": "Maison Zaffa, la nuit de noces de la première bougie à l'aube",
    "hero.lead": "La table, les fleurs, les tenues, la cuisine de fête et la nuit entière, portées par une seule maison.",
    "hero.quote": "Composer mon devis",
    "hero.enter": "Entrer dans la nuit",
    "ch0.n": "I · Le patio",
    "ch0.t": "Les lanternes s'allument une heure avant que le premier invité franchisse le seuil.",
    "ch1.n": "II · La table",
    "ch1.t": "Lin ivoire, assiettes dorées, roses blanches. Chaque couvert est posé à la main.",
    "ch2.n": "III · Le menu",
    "ch2.t": "Imprimé pour une seule nuit, et posé sur chaque assiette.",
    "film.end": "Une seule maison. <em>Toute la nuit.</em>",
    "rail.0": "Patio",
    "rail.1": "Table",
    "rail.2": "Menu",
    "film.cue": "Défiler pour entrer",
    "intro.eyebrow": "La maison",
    "intro.text": "Vous recevez vos invités. Nous veillons à tout le reste, du premier essai de caftan au dernier verre de thé à la menthe, à l'aube.",
    "rose.aria": "D'une seule rose à la table entière",
    "rose.alt": "Gros plan d'une pivoine blanche et d'une rose sur une table de mariage aux bougies",
    "rose.l1": "Une seule rose.",
    "rose.l2": "Puis <em>toute la table.</em>",
    "rose.cap": "Dressée la veille, allumée une heure avant l'arrivée des invités.",
    "crafts.aria": "Quatre métiers, une seule maison",
    "crafts.eyebrow": "Quatre métiers",
    "crafts.h": "Quatre métiers, <em>une seule voix.</em>",
    "crafts.p": "Un seul interlocuteur, du premier rendez-vous au départ du dernier invité.",
    "c1.w": "Festin",
    "c1.alt": "Pièce montée blanche à trois étages couronnée de roses, sur un présentoir doré entre les bougies",
    "c1.n": "01 · La cuisine",
    "c1.h": "Cuisine <em>de fête</em>",
    "c1.p": "Pastilla, méchoui, tajines de fête, pâtisseries fines et pièce montée. Service à l'assiette, servi chaud à trois cents invités.",
    "c2.w": "Lumière",
    "c2.alt": "Bougies ivoire allumées sur un chemin de table en lin, parsemé de pétales de rose et d'eucalyptus",
    "c2.n": "02 · La scénographie",
    "c2.h": "Fleurs <em>et bougies</em>",
    "c2.p": "Tables, arches florales, lanternes et bougies. Chaque lieu est dessiné sur papier avant d'être dressé.",
    "c3.w": "Caftan",
    "c3.alt": "Invités en caftans brodés et costumes sombres qui discutent dans le patio aux bougies",
    "c3.n": "03 · La négafa",
    "c3.h": "Tenues <em>et bijoux</em>",
    "c3.p": "Caftans, takchitas, bijoux et amariya. La mariée est accompagnée en coulisses à chaque changement de tenue.",
    "c4.w": "Promesse",
    "c4.alt": "La main de la mariée, avec sa bague, posée sur l'épaule du marié",
    "c4.n": "04 · La coordination",
    "c4.h": "Rien <em>à porter</em>",
    "c4.p": "Une coordinatrice tient le déroulé de la nuit. Le jour J, les mariés n'ont qu'à être là.",
    "devis.eyebrow": "Devis",
    "devis.h": "Composez <em>votre nuit</em>",
    "devis.sub": "Une première estimation en quelques gestes, puis votre demande de date. Montants d'exemple pour la démonstration.",
    "dv.guests": "Invités",
    "dv.tier": "Formule",
    "dv.t1": "Essentielle",
    "dv.t1d": "Dîner, service, décoration de table",
    "dv.t2": "Prestige",
    "dv.t2d": "Dîner et douceurs, fleurs, lumière",
    "dv.t3": "Royale",
    "dv.t3d": "Tout compris, scénographie complète",
    "dv.opts": "Options",
    "dv.o1": "Négafa et trois tenues",
    "dv.o2": "Amariya et porteurs",
    "dv.o3": "Orchestre andalou",
    "dv.o4": "Photo et film",
    "dv.o5": "Pièce montée",
    "dv.season": "Saison",
    "dv.s1": "Printemps",
    "dv.s2": "Été",
    "dv.s3": "Automne",
    "dv.s4": "Hiver",
    "sum.aria": "Votre estimation",
    "sum.title": "Estimation",
    "sum.note": "Estimation indicative, hors location du lieu. Prix d'exemple pour la démonstration.",
    "date.eyebrow": "Votre date",
    "date.h": "Réservez <em>votre date</em>",
    "date.sub": "Nous répondons avec nos disponibilités et un rendez-vous pour voir une table déjà dressée.",
    "date.alt": "Une lanterne de laiton et des bougies allumées parmi les roses blanches et orange de la table de mariage",
    "date.day": "Date du mariage",
    "date.name": "Vos prénoms",
    "date.namePh": "Salma et Youssef",
    "date.contact": "Téléphone ou e-mail",
    "date.contactPh": "vous@exemple.fr",
    "date.send": "Demander cette date",
    "foot.h1": "Casablanca et au-delà",
    "foot.p1": "Patios de palais, maisons de famille et jardins. Nous visitons chaque lieu avant de dessiner le plan de table.",
    "foot.h2": "La nuit",
    "foot.p2": "Aucun alcool n'est servi. Thé à la menthe, jus frais et pâtisseries jusqu'à l'aube.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Prix, formules et visuels sont des exemples pour la démonstration. Les personnes représentées sont fictives ou issues de vidéos libres de droits.",
    "foot.top": "Revenir au patio",
    "badge": "Concept Weskale Studio · marque fictive",
    /* Textes générés par le script */
    "js.perGuest": "{v} par invité",
    "js.pp": "{v} par invité",
    "js.line": "Formule {t}, {g} invités",
    "js.season": "Saison",
    "js.errDay": "Choisissez une date.",
    "js.errName": "Indiquez vos prénoms.",
    "js.errContact": "Indiquez un téléphone ou un e-mail.",
    "js.ok": "Merci {n}. Démonstration : aucune demande n'a été envoyée. Votre date du {d}, pour {g} invités, serait étudiée sous 48 h.",
  };
  const ENJS = {
    "js.perGuest": "{v} per guest",
    "js.pp": "{v} per guest",
    "js.line": "{t} package, {g} guests",
    "js.season": "Season",
    "js.errDay": "Choose a date.",
    "js.errName": "Add your names.",
    "js.errContact": "Add a phone number or an email.",
    "js.ok": "Thank you, {n}. Demonstration: no request was sent. Your date of {d}, for {g} guests, would be reviewed within 48 hours.",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = Object.assign({}, ENJS);
  const ATTRS = [["data-i18n", null], ["data-i18n-alt", "alt"], ["data-i18n-aria", "aria-label"], ["data-i18n-ph", "placeholder"]];
  ATTRS.forEach(([sel, attr]) => D.querySelectorAll(`[${sel}]`).forEach((el) => {
    const k = el.getAttribute(sel); EN[k] = attr ? el.getAttribute(attr) : el.innerHTML;
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
    locale: () => (lang === "fr" ? "fr-FR" : "en-GB"),
    t(k, vars) {
      let s = dict[lang][k] != null ? dict[lang][k] : EN[k];
      if (s == null) return k;
      if (vars) Object.keys(vars).forEach((v) => { s = s.split("{" + v + "}").join(vars[v]); });
      return s;
    },
    // Prix : « MAD 172,000 » en anglais, « 172 000 MAD » en français.
    money(n) {
      const v = new Intl.NumberFormat(I18N.locale(), { maximumFractionDigits: 0 }).format(Math.round(n));
      return lang === "fr" ? v + " MAD" : "MAD " + v;
    },
    on: (fn) => subs.push(fn),
    set(l) {
      if (l !== "fr" && l !== "en") return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      apply(); subs.forEach((fn) => fn(l));
    },
  });

  D.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) I18N.set(b.dataset.lang); }));
  apply();
})();
