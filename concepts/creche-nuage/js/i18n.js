/* Nuage : anglais par défaut (texte du HTML), français complet ici. Langue mémorisée en localStorage. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "nuage.lang";
  const FR = {
    "meta.title": "Nuage · Crèche bilingue, de 10 semaines à 3 ans",
    "meta.desc": "Nuage, concept de crèche bilingue français et anglais pour les enfants de 10 semaines à 3 ans : une pièce calme dans la lumière du matin, visites et pré-inscription en ligne. Marque fictive, concept Weskale Studio.",
    "nav.home": "Nuage, retour en haut",
    "nav.main": "Navigation principale",
    "nav.approach": "L'approche",
    "nav.day": "Une journée",
    "nav.langs": "Deux langues",
    "nav.lang": "Langue",
    "nav.visit": "Réserver une visite",
    "film.aria": "Entrer dans la pièce",
    "film.alt": "La salle de jeux de Nuage dans la lumière du matin : nuages de feutre au plafond, le mot nuage peint en bleu ciel au mur, et de petites mains qui empilent des cubes en bois",
    "hero.eyebrow": "Crèche bilingue · de 10 semaines à 3 ans",
    "hero.l1": "Ici, chaque matin",
    "hero.l2": "commence en douceur.",
    "hero.lead": "Une pièce calme et lumineuse, où votre enfant découvre le monde à son rythme, en français et en anglais.",
    "hero.visit": "Réserver une visite",
    "hero.enter": "Entrer",
    "rail.0": "Hauteur",
    "rail.1": "Mains",
    "rail.2": "Lumière",
    "ch0.n": "I · À hauteur d'enfant",
    "ch0.t": "Chaises basses, étagères ouvertes, adultes qui s'agenouillent pour parler. La pièce est pensée pour les plus petits.",
    "ch1.n": "II · Les mains d'abord",
    "ch1.t": "Empiler, rater, recommencer. Bien avant les mots, l'enfant apprend avec ses mains.",
    "ch2.n": "III · La lumière du matin",
    "ch2.t": "Des rideaux de lin, un tapis clair, personne de pressé. Ici, la journée commence doucement.",
    "film.end": "Deux langues, <em>un seul rythme : le sien.</em>",
    "film.cue": "Défiler pour entrer",
    "ap.eyebrow": "Notre approche",
    "ap.text": "Nuage est une petite crèche bilingue pour les enfants de 10 semaines à 3 ans. Une pièce baignée de lumière le matin, des jouets en bois à portée de main et des adultes qui prennent le temps. Chaque journée se vit en français et en anglais, sans leçon, comme on parle en famille.",
    "day.eyebrow": "Une journée chez Nuage",
    "day.h": "Du premier câlin <em>aux retrouvailles.</em>",
    "day.note": "Horaires d'exemple, pour la démonstration.",
    "m0.time": "8<small>h</small>00",
    "m1.time": "9<small>h</small>30",
    "m2.time": "11<small>h</small>45",
    "m3.time": "13<small>h</small>00",
    "m4.time": "15<small>h</small>30",
    "m5.time": "17<small>h</small>30",
    "m0.alt": "Des rideaux de lin traversés par la lumière du matin",
    "m1.alt": "Des arches en bois pastel empilées sur un tapis crème, près de petites mains et de la main d'une éducatrice",
    "m3.alt": "Une lampe en papier en forme de nuage, au-dessus de l'espace de sieste",
    "m4.alt": "Des étagères en bois clair avec des peluches, un arc-en-ciel en bois et une petite table ronde",
    "m2.ph": "Bon <em>appétit</em>",
    "m5.ph": "À <em>demain</em>",
    "m0.h": "Bonjour, hello",
    "m0.p": "Un mot pour chaque parent, un signe à la fenêtre, un début tout doux.",
    "m1.h": "Jouer",
    "m1.p": "Empiler, comparer, recommencer. La motricité fine se construit une arche en bois après l'autre.",
    "m2.h": "Le repas",
    "m2.p": "Des repas de saison adaptés à chaque âge, pris lentement à une table basse.",
    "m3.h": "La sieste",
    "m3.p": "Chacun son doudou, chacun son rythme, sous une lumière douce.",
    "m4.h": "Le jeu libre",
    "m4.p": "Des jouets simples, en bois et en tissu, rangés à hauteur d'enfant.",
    "m5.h": "Les retrouvailles",
    "m5.p": "Le carnet du jour, partagé avec vous : ce qu'il a mangé, découvert et aimé.",
    "lg.eyebrow": "Deux langues",
    "lg.h": "Chaque mot, <em>deux fois.</em>",
    "lg.p": "Un adulte parle anglais avec les enfants, un autre parle français, toujours le même. Les enfants entendent les deux toute la journée, dans les chansons, au repas et au coucher, et répondent dans celle qui vient en premier.",
    "vi.eyebrow": "Visites et inscriptions",
    "vi.h": "Venez voir <em>la pièce.</em>",
    "vi.sub": "Réservez une visite avec votre enfant, ou envoyez une demande de pré-inscription. Chaque famille reçoit une réponse personnelle.",
    "vf.mode": "Type de demande",
    "vf.tVisit": "Réserver une visite",
    "vf.tEnrol": "Pré-inscription",
    "vf.day": "Choisissez un jour",
    "vf.time": "Heure",
    "vf.dob": "Date de naissance de l'enfant, ou date prévue",
    "vf.start": "Entrée souhaitée",
    "vf.week": "Jours d'accueil",
    "vf.name": "Votre nom",
    "vf.namePh": "Camille Martin",
    "vf.mail": "E-mail",
    "vf.mailPh": "vous@exemple.fr",
    "vf.msg": "Un mot sur votre enfant (facultatif)",
    "vf.msgPh": "Prénom, habitudes, ce que vous aimeriez que l'on sache",
    "vf.sendVisit": "Demander la visite",
    "vf.sendEnrol": "Envoyer la demande",
    "vf.demo": "Démonstration : rien n'a été envoyé ni conservé. Sur le vrai site, l'équipe confirmerait par e-mail.",
    "vf.again": "Nouvelle demande",
    "vf.errSlot": "Choisissez un jour et une heure.",
    "vf.errDob": "Indiquez la date de naissance, ou la date prévue.",
    "vf.errAge": "Nuage accueille les enfants jusqu'à 3 ans : à la date d'entrée choisie, votre enfant aura passé cet âge.",
    "vf.errWeek": "Choisissez au moins un jour d'accueil.",
    "vf.errName": "Indiquez votre nom.",
    "vf.errMail": "Indiquez une adresse e-mail valide.",
    "vf.thanks": "Merci, {name}.",
    "vf.sumVisit": "Votre visite : {day}, à {time}. Venez avec votre enfant, la visite dure environ 45 minutes.",
    "vf.sumEnrol": "Votre demande de pré-inscription : entrée en {start}, {days} par semaine ({list}).",
    "vf.day1": "jour",
    "vf.dayN": "jours",
    "vf.t1": "9 h 30",
    "vf.t2": "16 h 30",
    "facts.aria": "Informations pratiques",
    "f.ages": "Âges",
    "f.agesV": "De 10 semaines à 3 ans",
    "f.langs": "Langues",
    "f.langsV": "Français et anglais, chaque jour",
    "f.open": "Ouverture",
    "f.openV": "Du lundi au vendredi, de 8 h à 18 h 30",
    "f.visit": "Visites",
    "f.visitV": "Avec votre enfant, environ 45 minutes",
    "f.note": "Démonstration : horaires, créneaux et durées sont des exemples. Aucune donnée n'est envoyée ni conservée.",
    "foot.claim": "À très vite, <em>petit nuage.</em>",
    "foot.addr": "L'adresse est communiquée à la confirmation de la visite.",
    "foot.concept": "Concept Weskale Studio · marque fictive. Horaires, créneaux et visuels sont des exemples pour la démonstration.",
    "foot.top": "Revenir au matin",
    "badge": "Concept Weskale Studio · marque fictive",
  };

  // Textes anglais qui n'existent pas dans le HTML (messages du formulaire).
  const EN_EXTRA = {
    "vf.sendEnrol": "Send the request",
    "vf.errSlot": "Please choose a day and a time.",
    "vf.errDob": "Please give the date of birth, or the due date.",
    "vf.errAge": "Nuage welcomes children up to 3 years: on the chosen start date, your child will be older than that.",
    "vf.errWeek": "Please choose at least one day.",
    "vf.errName": "Please give your name.",
    "vf.errMail": "Please give a valid email address.",
    "vf.thanks": "Thank you, {name}.",
    "vf.sumVisit": "Your visit: {day}, at {time}. Come with your child, the visit takes about 45 minutes.",
    "vf.sumEnrol": "Your pre-enrolment request: starting in {start}, {days} a week ({list}).",
    "vf.day1": "day",
    "vf.dayN": "days",
    "vf.t1": "9:30 am",
    "vf.t2": "4:30 pm",
  };

  // L'anglais est lu dans le HTML au démarrage : une seule source par langue.
  const EN = Object.assign({}, EN_EXTRA);
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
      let s = dict[lang][k] != null ? dict[lang][k] : EN[k] != null ? EN[k] : k;
      if (vars) Object.keys(vars).forEach((v) => { s = s.split("{" + v + "}").join(vars[v]); });
      return s;
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
