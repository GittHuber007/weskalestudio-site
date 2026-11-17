/* Halden Properties : anglais par défaut (dans le HTML), version française complète.
   La langue choisie est gardée en localStorage. Les textes anglais sont relus dans
   le HTML au chargement, avant la découpe des titres, pour pouvoir y revenir. */
(function () {
  "use strict";
  const D = document, H = D.documentElement, KEY = "halden-lang";
  const FR = {
    "ld.city": "Dubaï",
    "nav.res": "Résidences", "nav.sim": "Simulateur", "nav.rdv": "Rendez-vous", "nav.cta": "Prendre rendez-vous",
    "hero.tag": "Résidences sur plan · Dubaï",
    "hero.lead": "Une tour résidentielle de soixante-douze étages, au bord de l'eau. Livraison prévue fin 2029.",
    "hero.cue": "Défiler pour monter",
    "ch1.tag": "Niveau 00", "ch1.t": "Le socle", "ch1.p": "Un jardin de palmiers, un bassin miroir et un hall en travertin, à l'écart de la rue.",
    "ch2.tag": "Niveau 36", "ch2.t": "Les résidences", "ch2.p": "Deux cent dix-huit appartements, d'une à quatre chambres. Chaque séjour s'ouvre sur une terrasse.",
    "ch3.tag": "Niveau 72", "ch3.t": "La <em>couronne</em>", "ch3.p": "Quatre penthouses et une piscine suspendue, au-dessus de la ville.",
    "s1.n": "01 / 04 · Niveaux 69 à 72", "s1.d": "Un étage entier, une piscine privée et une vue sur trois côtés.", "s1.a": "641 m²", "s1.p": "À partir de <b>24 000 000 AED</b>",
    "s2.n": "02 / 04 · Niveaux 30 à 66", "s2.t": "Trois <em>chambres</em>", "s2.d": "Un séjour traversant, une cuisine fermée et une terrasse en angle.", "s2.a": "212 m²", "s2.p": "À partir de <b>6 400 000 AED</b>",
    "s3.n": "03 / 04 · Niveaux 12 à 56", "s3.t": "Deux <em>chambres</em>", "s3.d": "Deux chambres de part et d'autre du séjour, chacune avec sa salle de bains.", "s3.a": "132 m²", "s3.p": "À partir de <b>3 900 000 AED</b>",
    "s4.n": "04 / 04 · Niveaux 8 à 40", "s4.t": "Une <em>chambre</em>", "s4.d": "Un plan d'angle vitré sur toute la hauteur, tourné vers la ville.", "s4.a": "80 m²", "s4.p": "À partir de <b>2 350 000 AED</b>",
    "cap.btn": "Estimer ce bien",
    "lvl": "Niveau",
    "ter.tag": "Les terrasses", "ter.t": "Face au <em>couchant.</em>",
    "ter.p": "Toutes les résidences sont orientées à l'ouest. Le soleil se couche dans l'axe du séjour, au-dessus du Golfe.",
    "loc.1": "Centre-ville", "loc.2": "Aéroport international", "loc.3": "Plages", "loc.note": "Temps de trajet donnés à titre d'exemple pour ce concept.",
    "sim.tag": "Simulateur", "sim.t": "Estimer une <em>résidence.</em>", "sim.type": "Résidence", "sim.floor": "Étage", "sim.view": "Vue",
    "sim.price": "Prix indicatif", "sim.note": "Prix d'exemple pour un projet fictif. Ce n'est pas une offre.", "sim.cta": "Prendre rendez-vous pour ce bien",
    "rdv.tag": "Rendez-vous", "rdv.t": "Visiter la galerie <em>de vente.</em>",
    "rdv.p": "Maquette de la tour, échantillons de matériaux et plans détaillés. Quarante-cinq minutes, sur place ou en visio.",
    "rdv.fmt": "Format", "rdv.fmt1": "Galerie de vente", "rdv.fmt2": "Visio", "rdv.day": "Jour", "rdv.time": "Heure",
    "rdv.res": "Résidence", "rdv.name": "Nom", "rdv.email": "E-mail", "rdv.submit": "Demander ce créneau",
    "foot.1": "Halden Properties · Dubaï",
    "foot.3": "Concept Weskale Studio · marque fictive. Projet, chiffres et images sont des exemples générés.",
    "badge": "Concept Weskale Studio · marque fictive",
  };
  const FR_ATTR = {
    "nav.home": "Halden Properties, accueil", "nav.label": "Navigation principale", "lang.label": "Langue",
    "voy.label": "Halden One, de la base au sommet",
    "voy.alt": "Une tour résidentielle aux ailettes de bronze, éclairée au crépuscule, au-dessus d'un bassin miroir et d'un jardin de palmiers, avec HALDEN en lettres de bronze près du sommet",
    "s1.alt": "Piscine privée d'un penthouse au crépuscule, face aux tours de la ville",
    "s2.alt": "Grand séjour en travertin ouvert sur une terrasse, la ville en contrebas au crépuscule",
    "s3.alt": "Chambre aux murs habillés de chêne, face à une baie vitrée sur les tours au crépuscule",
    "s4.alt": "Séjour d'angle vitré sur toute la hauteur, ouvert sur les autoroutes éclairées de la ville",
    "ter.alt": "Une femme de dos sur la terrasse d'un penthouse, la main sur le garde-corps en verre, face à la ville au couchant",
    "sim.floor": "Étage", "rdv.nameph": "Votre nom", "rdv.emailph": "vous@exemple.com",
  };
  const META = {
    en: { title: D.title, desc: (D.querySelector('meta[name="description"]') || {}).content },
    fr: { title: "Halden One · Résidences sur plan à Dubaï · Halden Properties", desc: "Halden Properties, promoteur fictif imaginé par Weskale Studio : Halden One, soixante-douze étages de résidences sur plan à Dubaï." },
  };

  /* Textes anglais d'origine, relus avant toute découpe. */
  const nodes = Array.from(D.querySelectorAll("[data-i18n]")).map((el) => ({ el, key: el.dataset.i18n, en: el.innerHTML }));
  const attrs = [];
  D.querySelectorAll("[data-i18n-attr]").forEach((el) => el.dataset.i18nAttr.split(";").forEach((pair) => {
    const [name, key] = pair.split(":"); attrs.push({ el, name, key, en: el.getAttribute(name) });
  }));

  let lang = "en";
  try { const v = localStorage.getItem(KEY); if (v === "fr" || v === "en") lang = v; } catch (e) { /* stockage indisponible : anglais */ }

  function apply(l, save) {
    lang = l === "fr" ? "fr" : "en";
    H.lang = lang;
    nodes.forEach((n) => {
      const html = lang === "fr" && FR[n.key] != null ? FR[n.key] : n.en;
      if (n.el.innerHTML === html) return;
      const wasSplit = !!n.el.dataset.splitDone;
      n.el.innerHTML = html;
      if (wasSplit && window.CORE) { delete n.el.dataset.splitDone; window.CORE.split(n.el); }
    });
    attrs.forEach((a) => { const v = lang === "fr" && FR_ATTR[a.key] != null ? FR_ATTR[a.key] : a.en; if (v != null) a.el.setAttribute(a.name, v); });
    D.title = META[lang].title;
    const md = D.querySelector('meta[name="description"]'); if (md && META[lang].desc) md.content = META[lang].desc;
    D.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    if (save) { try { localStorage.setItem(KEY, lang); } catch (e) { /* rien à faire */ } }
    D.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  window.I18N = { get lang() { return lang; }, set: (l) => apply(l, true) };
  apply(lang, false);
  D.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === lang) return;
    apply(b.dataset.lang, true);
    if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
  });
})();
