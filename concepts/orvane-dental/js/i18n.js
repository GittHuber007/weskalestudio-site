/* Orvane Dental : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "orvane.lang";
  const FR = {
    "meta.title": "Orvane Dental · Dentisterie esthétique à Jumeirah, Dubaï",
    "meta.desc": "Orvane Dental, concept de clinique de dentisterie esthétique à Jumeirah, Dubaï : une expérience patient sans hâte, une réservation simple et un assistant qui répond et réserve 24 h sur 24. Marque fictive, concept Weskale Studio.",
    "nav.home": "Orvane Dental, retour en haut",
    "nav.main": "Navigation principale",
    "nav.exp": "L'expérience",
    "nav.care": "Soins",
    "nav.assist": "Assistant 24 h sur 24",
    "nav.lang": "Langue",
    "nav.book": "Réserver",
    "film.aria": "Dans la clinique, puis un sourire, image par image",
    "film.alt": "Une salle de soin Orvane à Dubaï : murs blanc nacré, le nom ORVANE en laiton, une patiente souriante qui parle avec son dentiste, des palmiers derrière la baie vitrée",
    "hero.eyebrow": "Dentisterie esthétique · Jumeirah, Dubaï",
    "hero.l1": "Un sourire,",
    "hero.l2": "sans hâte.",
    "hero.lead": "Une clinique de dentisterie esthétique où chaque visite s'organise autour de vous : le temps de parler, le temps de voir, et des soins qui ne sont jamais pressés.",
    "hero.book": "Prendre rendez-vous",
    "hero.enter": "L'expérience",
    "ch0.n": "I · L'arrivée",
    "ch0.t": "Une lumière douce, des murs nacrés. <em>On vous attend.</em>",
    "ch1.n": "II · La consultation",
    "ch1.t": "Nous regardons votre sourire ensemble, <em>avant de décider quoi que ce soit.</em>",
    "ch2.n": "III · Le résultat",
    "ch2.t": "Un sourire qui vous ressemble toujours, <em>simplement reposé.</em>",
    "film.end": "Dentisterie esthétique, <em>Jumeirah.</em>",
    "rail.0": "Arrivée",
    "rail.1": "Consultation",
    "rail.2": "Résultat",
    "film.cue": "Défiler",
    "intro.eyebrow": "L'expérience patient",
    "intro.text": "Chez Orvane, la visite compte autant que le résultat. Chaque rendez-vous prend son temps, chaque étape est expliquée, et rien n'est décidé avant que vous l'ayez vu vous-même.",
    "exp.aria": "L'expérience, en trois étapes",
    "exp1.w": "Écouter.",
    "exp1.alt": "Dans la salle de soin, la patiente parle avec son dentiste avant que rien ne commence",
    "exp1.p": "La première visite est une conversation. Votre dentiste vous demande ce que vous aimeriez changer, et ce que vous préférez garder.",
    "exp2.w": "Voir.",
    "exp2.p": "Les radios et les photos sont regardées avec vous, à l'écran. Vous voyez le plan, étape par étape, avant qu'il commence.",
    "exp3.w": "Soigner.",
    "exp3.p": "Des gestes doux, une lumière douce. Chaque geste est expliqué au moment où il se fait, et vous pouvez faire une pause à tout moment.",
    "care.eyebrow": "Soins",
    "care.h": "Six soins, <em>une seule approche.</em>",
    "care.note": "Prix d'exemple pour la démonstration. Chaque plan est confirmé après la consultation.",
    "book.eyebrow": "Prendre rendez-vous",
    "book.h": "Choisissez un horaire. <em>Nous nous occupons du reste.</em>",
    "bk.treat": "Soin",
    "bk.day": "Jour",
    "bk.time": "Heure",
    "bk.taken": "Déjà réservé",
    "bk.name": "Nom",
    "bk.namePh": "Votre nom",
    "bk.phone": "Téléphone ou e-mail",
    "bk.phonePh": "Pour vous confirmer le rendez-vous",
    "bk.confirm": "Demander ce rendez-vous",
    "bk.note": "Démonstration : rien n'est envoyé et aucun rendez-vous n'est créé.",
    "as.aria": "L'assistant téléphonique",
    "as.eyebrow": "Répond et réserve, 24 h sur 24",
    "as.h": "Vous appelez après la fermeture ? <em>Un assistant répond.</em>",
    "as.p": "De jour comme de nuit, un assistant répond au téléphone de la clinique. Il comprend la demande, propose les horaires libres et réserve la visite, puis envoie la confirmation. Quand une question demande un dentiste, l'équipe vous rappelle.",
    "as.live": "Assistant · en ligne",
    "as.tag": "Échange simulé",
    "as.replay": "Rejouer",
    "foot.h1": "Venir",
    "foot.p1": "Jumeirah, Dubaï. L'adresse exacte et le stationnement vous sont envoyés avec la confirmation.",
    "foot.h2": "Horaires",
    "foot.p2": "Du samedi au jeudi, de 9 h à 21 h. En dehors de ces horaires, l'assistant prend votre appel et réserve votre visite.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Soins, prix, horaires et échange présentés sont des exemples pour la démonstration. Vidéos : Mixkit.",
    "foot.top": "Revenir en haut",
    "badge": "Concept Weskale Studio · marque fictive",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = {};
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

  window.I18N = {
    get lang() { return lang; },
    get locale() { return lang === "fr" ? "fr-FR" : "en-GB"; },
    t: (k) => (dict[lang][k] != null ? dict[lang][k] : EN[k]),
    on: (fn) => subs.push(fn),
    set(l) {
      if (l !== "fr" && l !== "en") return;
      lang = l;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      apply(); subs.forEach((fn) => fn(l));
    },
  };

  D.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== lang) window.I18N.set(b.dataset.lang); }));
  apply();
})();
