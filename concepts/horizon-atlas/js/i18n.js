/* Horizon Atlas : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "horizonAtlas.lang";
  const FR = {
    "meta.title": "École Horizon Atlas · École privée à Rabat, de la maternelle au baccalauréat",
    "meta.desc": "École Horizon Atlas, concept d'école privée à Rabat, de la maternelle au baccalauréat : les valeurs transmises, le parcours de quinze ans, la demande d'admission et la visite de l'école. Marque fictive, concept Weskale Studio.",
    "nav.home": "École Horizon Atlas, retour en haut",
    "nav.sub": "École · Rabat",
    "nav.main": "Navigation principale",
    "nav.values": "Ce que nous transmettons",
    "nav.path": "Le parcours",
    "nav.visit": "Visite",
    "nav.lang": "Langue",
    "nav.apply": "Admission",
    "film.aria": "Entrer dans l'école",
    "film.alt": "Le campus Horizon Atlas à l'heure dorée : arcades blanches, cèdre sculpté, oliviers et bassin miroir, avec HORIZON ATLAS en lettres de bronze au-dessus de l'entrée. Au loin, des élèves en uniforme bleu marine s'éloignent, vus de dos.",
    "hero.eyebrow": "École privée · Rabat · De la maternelle au baccalauréat",
    "hero.l1": "Élever",
    "hero.l2": "l'horizon.",
    "hero.lead": "Quinze années pour apprendre à penser librement, à travailler avec rigueur et à regarder loin.",
    "hero.apply": "Demander l'admission",
    "hero.visit": "Visiter l'école",
    "ch0.n": "I · Le campus",
    "ch0.t": "Chaque journée commence ici, sous les oliviers, avant la première sonnerie.",
    "ch1.n": "II · Le seuil",
    "ch1.t": "Une porte, franchie chaque matin. De l'autre côté, le travail commence.",
    "ch2.n": "III · La bibliothèque",
    "ch2.t": "Des livres transmis d'une génération à l'autre. Au bout de l'allée, la lumière.",
    "film.end": "Ce qui se transmet ici <em>dure toute une vie.</em>",
    "rail.0": "Le campus",
    "rail.1": "Le seuil",
    "rail.2": "La bibliothèque",
    "film.cue": "Défiler pour entrer",
    "vals.aria": "Ce que nous transmettons",
    "vals.eyebrow": "Ce que nous transmettons",
    "v0.w": "Curiosité",
    "v0.p": "Poser la bonne question avant de chercher la réponse.",
    "v1.w": "Rigueur",
    "v1.p": "Un travail fait avec soin, vérifié, et mené jusqu'au bout.",
    "v2.w": "Respect",
    "v2.p": "Écouter avant de répondre. Prendre soin du lieu et les uns des autres.",
    "v3.w": "Ouverture",
    "v3.p": "L'arabe, le français et l'anglais chaque jour : trois manières de lire le monde.",
    "pass.alt": "Une femme marche lentement entre deux hautes étagères de bibliothèque, vers la lumière d'une fenêtre",
    "pass.eyebrow": "Transmettre",
    "pass.q": "Derrière chaque réussite, <em>un professeur qui y a cru le premier.</em>",
    "pass.p": "Une école, ce sont d'abord des personnes. Des enseignants qui connaissent chaque élève, repèrent un doute avant qu'il ne devienne une difficulté, et demandent un peu plus à ceux qui peuvent le donner.",
    "path.eyebrow": "Le parcours",
    "path.h": "Quinze années <em>pour grandir.</em>",
    "c1.age": "De 3 à 5 ans",
    "c1.h": "Maternelle",
    "c1.p": "Les premières fois : tenir un crayon, raconter une histoire, compter les oliviers de la cour.",
    "c2.age": "De 6 à 10 ans",
    "c2.h": "Élémentaire",
    "c2.p": "Lire, écrire, raisonner. Des bases solides, construites avec méthode et patience.",
    "c3.age": "De 11 à 14 ans",
    "c3.h": "Collège",
    "c3.p": "L'âge des grandes questions. Laboratoire, débats, projets collectifs : apprendre à argumenter et à coopérer.",
    "c4.age": "De 15 à 17 ans",
    "c4.h": "Lycée",
    "c4.p": "Spécialités, orientation et baccalauréat, avec un accompagnement personnel vers les études supérieures, au Maroc ou à l'étranger.",
    "en.eyebrow": "Admission et visite",
    "en.h": "Quatre étapes, <em>une rencontre.</em>",
    "en.sub": "La demande commence ici, en quelques minutes. Elle se termine toujours par une visite de l'école, en famille, et un entretien avec la direction pédagogique.",
    "st.1": "L'élève",
    "st.2": "La scolarité",
    "st.3": "La famille",
    "st.4": "La visite",
    "f.first": "Prénom",
    "f.firstPh": "Yasmine",
    "f.last": "Nom",
    "f.lastPh": "Alaoui",
    "f.birth": "Date de naissance",
    "f.year": "Rentrée souhaitée",
    "f.y27": "Septembre 2027",
    "f.y28": "Septembre 2028",
    "f.level": "Niveau demandé",
    "f.school": "Établissement actuel (facultatif)",
    "f.schoolPh": "Nom de l'école actuelle",
    "f.langs": "Langues parlées à la maison",
    "l.ar": "Arabe",
    "l.am": "Amazigh",
    "l.fr": "Français",
    "l.en": "Anglais",
    "l.es": "Espagnol",
    "l.ot": "Autre",
    "f.parent": "Responsable légal",
    "f.parentPh": "Prénom et nom",
    "f.mail": "E-mail",
    "f.mailPh": "nom@exemple.ma",
    "f.tel": "Téléphone",
    "f.sib": "Un frère ou une sœur est déjà scolarisé à l'école",
    "f.visitLead": "Choisissez un moment pour visiter l'école et rencontrer la direction pédagogique.",
    "f.dayAria": "Date de la visite",
    "f.timeAria": "Heure de la visite",
    "done.k": "Demande reçue",
    "done.h": "À très bientôt,",
    "done.note": "Démonstration : aucune donnée n'a été envoyée ni conservée.",
    "done.again": "Recommencer",
    "w.back": "Retour",
    "w.next": "Continuer",
    "foot.claim": "Un jour, ils repasseront cette arche dans l'autre sens. <em>Prêts.</em>",
    "foot.concept": "Concept Weskale Studio · marque fictive. École, niveaux, horaires de visite et visuels sont des exemples pour la démonstration.",
    "foot.top": "Revenir à l'entrée",
    "badge": "Concept Weskale Studio · marque fictive",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = {};
  const ATTRS = [["data-i18n", null], ["data-i18n-alt", "alt"], ["data-i18n-aria", "aria-label"], ["data-i18n-ph", "placeholder"]];
  ATTRS.forEach(([sel, attr]) => D.querySelectorAll(`[${sel}]`).forEach((el) => {
    const k = el.getAttribute(sel); if (!(k in EN)) EN[k] = attr ? el.getAttribute(attr) : el.innerHTML;
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
