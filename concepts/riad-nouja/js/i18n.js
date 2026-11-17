/* Riad Nouja : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "riadNouja.lang";
  const FR = {
    "meta.title": "Riad Nouja · Maison d'hôtes dans la médina de Marrakech · Réservation directe",
    "meta.desc": "Riad Nouja, concept de maison d'hôtes de quatre chambres dans la médina de Marrakech : patio, fontaine de zellige, oranger et réservation directe. Marque fictive, concept Weskale Studio.",
    "nav.home": "Riad Nouja, retour en haut",
    "nav.main": "Navigation principale",
    "nav.house": "La maison",
    "nav.rooms": "Chambres",
    "nav.access": "Accès",
    "nav.lang": "Langue",
    "nav.book": "Réserver",
    "film.aria": "Entrer dans le riad",
    "film.alt": "Le patio du Riad Nouja vu depuis la porte de cèdre sculpté : plaque de laiton au nom de la maison, fontaine de zellige en étoile et oranger",
    "hero.eyebrow": "Maison d'hôtes · Médina de Marrakech",
    "hero.l1": "Quatre chambres",
    "hero.l2": "autour d'un patio",
    "hero.lead": "Une porte de cèdre, une fontaine de zellige, un oranger. Le reste de la ville s'arrête au seuil.",
    "hero.book": "Réserver en direct",
    "hero.enter": "Entrer dans le riad",
    "ch0.n": "I · Le seuil",
    "ch0.t": "La porte s'ouvre sur un passage coudé. Depuis la ruelle, on ne voit rien du patio.",
    "ch1.n": "II · Le patio",
    "ch1.t": "Le ciel sert de plafond. Les galeries des étages desservent les chambres.",
    "ch2.n": "III · La fontaine",
    "ch2.t": "Une étoile de zellige à huit branches, posée pièce par pièce. Le bruit de l'eau couvre celui de la ville.",
    "film.end": "Quatre chambres seulement, <em>pour que le patio reste calme.</em>",
    "rail.0": "Seuil",
    "rail.1": "Patio",
    "rail.2": "Fontaine",
    "film.cue": "Défiler pour entrer",
    "intro.eyebrow": "La maison",
    "intro.text": "Riad Nouja est une maison d'hôtes de quatre chambres, au fond d'une ruelle calme de la médina. On y vient pour la lumière du patio, le petit déjeuner sur la terrasse et le silence, à quelques minutes à pied des souks.",
    "mat.aria": "Les matières de la maison",
    "mat1.w": "Cèdre",
    "mat1.alt": "Détail de la porte en cèdre sculpté et de sa plaque de laiton gravée Riad Nouja",
    "mat1.n": "01 · La porte",
    "mat1.h": "Cèdre <em>sculpté</em>",
    "mat1.p": "Sculptée à la main dans le cèdre, la porte n'affiche qu'une plaque de laiton. C'est le seul signe de la maison dans la ruelle.",
    "mat2.w": "Zellige",
    "mat2.alt": "La fontaine en étoile du patio, habillée de zellige bleu, blanc et ocre",
    "mat2.n": "02 · La fontaine",
    "mat2.h": "Zellige <em>taillé</em>",
    "mat2.p": "Chaque tesselle est taillée au marteau puis posée à la main, motif par motif, autour d'une vasque de pierre blanche.",
    "mat3.w": "Oranger",
    "mat3.alt": "L'oranger du patio, chargé de fruits, devant les arches des galeries",
    "mat3.n": "03 · Le jardin",
    "mat3.h": "L'oranger <em>du patio</em>",
    "mat3.p": "Planté au pied des galeries, il donne de l'ombre l'après-midi. Ses fruits finissent pressés au petit déjeuner.",
    "mat4.w": "Laiton",
    "mat4.alt": "Le salon du patio : banquettes, coussins, tapis et lanternes de laiton",
    "mat4.n": "04 · Le salon",
    "mat4.h": "Lanternes <em>de laiton</em>",
    "mat4.p": "Banquettes, tapis et lanternes : le patio sert de salon, du thé du matin à la dernière lumière du soir.",
    "rooms.alt": "Les galeries des étages, autour du patio, sur lesquelles ouvrent les chambres",
    "rooms.cap": "Les quatre chambres ouvrent sur les galeries du patio.",
    "rooms.eyebrow": "Les chambres",
    "rooms.h": "Quatre chambres, <em>pas une de plus</em>",
    "rooms.note": "Chambres et prix d'exemple, pour la démonstration.",
    "book.eyebrow": "Réservation directe",
    "book.h": "Réserver <em>en direct</em>",
    "book.sub": "Vos dates, votre chambre, vos coordonnées. Le total s'affiche à chaque étape, taxe de séjour comprise.",
    "bk.steps": "Étapes de la réservation",
    "bk.tab0": "Dates",
    "bk.tab1": "Chambre",
    "bk.tab2": "Coordonnées",
    "bk.leg0": "Vos dates",
    "bk.prev": "Mois précédent",
    "bk.next": "Mois suivant",
    "bk.legSel": "Votre séjour",
    "bk.legOff": "Complet",
    "bk.adults": "Adultes",
    "bk.children": "Enfants",
    "bk.adLess": "Un adulte de moins",
    "bk.adMore": "Un adulte de plus",
    "bk.chLess": "Un enfant de moins",
    "bk.chMore": "Un enfant de plus",
    "bk.next0": "Choisir la chambre",
    "bk.leg1": "La chambre",
    "bk.room": "Chambre",
    "bk.extras": "Sur demande",
    "bk.x1": "Transfert depuis l'aéroport",
    "bk.x2": "Hammam et gommage",
    "bk.x3": "Dîner à la table d'hôtes",
    "bk.next1": "Continuer",
    "bk.leg2": "Vos coordonnées",
    "bk.name": "Nom",
    "bk.namePh": "Votre nom",
    "bk.mail": "E-mail",
    "bk.mailPh": "vous@exemple.fr",
    "bk.confirm": "Confirmer la réservation",
    "sum.aria": "Récapitulatif",
    "sum.title": "Votre séjour",
    "sum.note": "Démonstration : aucun paiement n'est demandé et aucune réservation réelle n'est créée. Prix d'exemple.",
    "foot.h1": "Accès",
    "foot.p1": "La maison donne sur une ruelle piétonne. Nous venons vous chercher au parking le plus proche et portons vos bagages jusqu'à la chambre. L'adresse exacte part avec la confirmation.",
    "foot.h2": "Arrivée et départ",
    "foot.p2": "Arrivée à partir de 14 h, départ avant 11 h. Petit déjeuner servi sur la terrasse, de 8 h à 10 h 30.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Chambres, prix, horaires et visuels sont des exemples pour la démonstration.",
    "foot.top": "Revenir à la porte",
    "badge": "Concept Weskale Studio · marque fictive",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = {};
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
    t: (k) => (dict[lang][k] != null ? dict[lang][k] : EN[k]),
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
