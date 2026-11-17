/* Alvéa : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "alvea.lang";
  const FR = {
    "meta.title": "Alvéa · Cabinet dentaire à Ixelles, Bruxelles",
    "meta.desc": "Alvéa, concept de cabinet dentaire calme à Ixelles, Bruxelles : lumière du nord, frêne clair, du temps pour expliquer et une prise de rendez-vous simple. Marque fictive, concept Weskale Studio.",
    "nav.home": "Alvéa, retour en haut",
    "nav.main": "Navigation principale",
    "nav.practice": "Le cabinet",
    "nav.care": "Soins",
    "nav.visit": "Venir",
    "nav.lang": "Langue",
    "nav.book": "Rendez-vous",
    "film.aria": "Entrer dans le cabinet",
    "film.alt": "La salle de soins Alvéa : panneaux de frêne clair avec le logo alvea en lettres sauge, une grande fenêtre au nord, une dentiste souriante qui parle avec une patiente détendue dans le fauteuil",
    "hero.eyebrow": "Cabinet dentaire · Ixelles, Bruxelles",
    "hero.l1": "Des soins calmes,",
    "hero.l2": "à la lumière du nord.",
    "hero.lead": "Un cabinet calme dans une maison bruxelloise. On prend le temps de montrer, d'expliquer et de décider avec vous, avant tout soin.",
    "hero.book": "Prendre rendez-vous",
    "hero.enter": "Entrer",
    "ch0.n": "I · La pièce",
    "ch0.t": "Lumière du nord, frêne clair, murs sauge. Ici, rien ne vous presse.",
    "ch1.n": "II · L'échange",
    "ch1.t": "Chaque option en mots simples, avec son coût, avant le premier geste.",
    "ch2.n": "III · Vous",
    "ch2.t": "Vous décidez. On prend le temps qu'il faut.",
    "film.end": "Rien ne se fait <em>sans vous.</em>",
    "rail.0": "Pièce",
    "rail.1": "Échange",
    "rail.2": "Vous",
    "film.cue": "Défiler pour entrer",
    "intro.eyebrow": "Le cabinet",
    "intro.text": "Alvéa est un petit cabinet dentaire à Ixelles, dans une maison de ville aux hautes fenêtres orientées au nord. Deux salles de soins, du frêne clair et du sauge, et des rendez-vous qui commencent à l'heure, avec de la place pour vos questions.",
    "time.alt": "La fenêtre au nord de la salle de soins, un rideau de lin tiré et un arbre en feuilles dehors",
    "time.word": "Le temps.",
    "time.eyebrow": "La première visite",
    "time.txt": "Une première visite dure quarante-cinq minutes : un bilan complet, des photos si besoin, et un plan écrit que vous emportez. Pas de salle d'attente bondée, pas de course entre deux fauteuils.",
    "time.f1b": "45 min",
    "time.f1": "pour une première visite",
    "time.f2b": "Par écrit",
    "time.f2": "chaque plan et chaque tarif",
    "time.f3b": "Chaque matin",
    "time.f3": "des créneaux gardés pour les urgences",
    "care.eyebrow": "Soins",
    "care.h": "Des soins, <em>sans hâte.</em>",
    "care.note": "Soins et durées d'exemple, pour la démonstration.",
    "book.eyebrow": "Rendez-vous",
    "book.h": "Prendre <em>rendez-vous.</em>",
    "book.sub": "Trois choix, moins d'une minute. Vous recevez une confirmation, puis un rappel la veille.",
    "book.call": "Vous préférez appeler ? Notre assistant téléphonique répond à toute heure et réserve les mêmes créneaux.",
    "book.note": "Démonstration : aucun rendez-vous n'est créé et rien de ce que vous saisissez ne quitte cette page.",
    "bk.s0": "Motif",
    "bk.s1": "Horaire",
    "bk.s2": "Vous",
    "bk.q0": "Pour quel motif ?",
    "bk.q1": "Choisissez un jour, puis une heure.",
    "bk.days": "Jour",
    "bk.slots": "Heure",
    "bk.back": "Retour",
    "bk.q2": "Vos coordonnées.",
    "bk.name": "Nom et prénom",
    "bk.namePh": "Votre nom",
    "bk.mail": "E-mail",
    "bk.mailPh": "vous@exemple.be",
    "bk.first": "C'est ma première visite chez Alvéa",
    "bk.confirm": "Confirmer le rendez-vous",
    "bk.doneEyebrow": "Rendez-vous de démonstration",
    "bk.ics": "Ajouter au calendrier",
    "bk.again": "Modifier",
    "foot.h1": "Venir",
    "foot.p1": "Ixelles, Bruxelles, à quelques minutes à pied de la place Flagey. L'adresse exacte part avec votre confirmation.",
    "foot.h2": "Horaires",
    "foot.p2": "Du lundi au vendredi, de 8 h à 19 h. Le samedi matin, urgences uniquement.",
    "foot.h3": "Accès",
    "foot.p3": "Entrée de plain-pied et salle de soins au rez-de-chaussée. Arrêts de tram et de bus tout proches.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Soins, durées, horaires et visuels sont des exemples pour la démonstration.",
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
