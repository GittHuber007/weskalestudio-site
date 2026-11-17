/* Maison Ilvane : anglais par defaut (textes du HTML), francais complet ci-dessous.
   Changer de langue enregistre le choix et recharge la page a la meme hauteur :
   les titres sont decoupes lettre par lettre pour les animations, on ne les retraduit pas a chaud. */
(function () {
  "use strict";
  const root = document.documentElement;
  const lang = root.lang === "fr" ? "fr" : "en";
  const KEY = "ilvane-lang";

  const FR = {
    "meta.title": "Maison Ilvane · Haute joaillerie",
    "meta.desc": "Maison Ilvane, maison de haute joaillerie fictive. Concept Weskale Studio.",
    "nav.home": "Maison Ilvane, retour en haut",
    "nav.piece": "La pièce",
    "nav.gallery": "Galerie",
    "nav.compose": "Composer",
    "nav.salons": "Salons",
    "nav.cta": "Rendez-vous",
    "lang.label": "Langue",
    "film.aria": "Solitaire Ilvane, or rose et diamant",
    "film.alt": "Solitaire en or rose et diamant rond, posé sur un bloc de basalte, diamants flous en arrière-plan",
    "film.eyebrow": "Haute joaillerie · Paris",
    "film.title": '<span class="line">L\'éclat</span> <span class="line"><em>en suspens</em></span>',
    "film.lead": "Un diamant rond, six griffes d'or rose. Faites défiler : la pièce tourne sous vos yeux.",
    "film.seal": "Or rose 18 carats · Faite main à Paris ·",
    "film.hint": "Défiler",
    "step1.t": "La pierre",
    "step1.d": "Un diamant rond taille brillant. Cinquante sept facettes, taillées pour renvoyer la lumière vers l'œil.",
    "step2.t": "Six griffes",
    "step2.d": "Six griffes fines tiennent la pierre haut, pour que la lumière la traverse par tous les côtés.",
    "step3.t": "L'anneau",
    "step3.d": "Or rose 18 carats, lisse et poli miroir, affiné vers la pierre jusqu'à se faire oublier.",
    "film.facets": "facettes",
    "film.meter": "Un quart de tour",
    "prod.eyebrow": "La pièce",
    "prod.d": "Or rose 18 carats, diamant rond de 2,0 carats, six griffes. Une seule pierre, posée haut, sur un anneau qui s'efface.",
    "prod.metal": "Métal",
    "prod.metalv": "Or rose 18 ct",
    "prod.stone": "Pierre",
    "prod.stonev": "Diamant 2,0 ct",
    "prod.price": "Prix d'exemple",
    "prod.pricev": "24 800 €",
    "prod.compose": "Composer la vôtre",
    "prod.try": "Essayer en salon",
    "cur.compose": "Composer",
    "cur.try": "Essayer",
    "intro.aria": "La maison",
    "intro.eyebrow": "La maison",
    "intro.text": "Une pierre ne brille pas seule. Elle attend une monture qui la tienne assez haut, assez fine, pour que la lumière la traverse. Ilvane dessine ces montures une par une, autour de chaque pierre.",
    "gal.aria": "Galerie, une pièce à la fois",
    "gal.eyebrow": "La galerie",
    "cfg.aria": "Composer votre solitaire",
    "cfg.alt": "Aperçu du solitaire composé, posé sur un bloc de basalte gravé Maison Ilvane",
    "cfg.eyebrow": "Composer",
    "cfg.title": "Votre solitaire",
    "cfg.metal": "Métal",
    "cfg.rose": "Or rose",
    "cfg.yellow": "Or jaune",
    "cfg.white": "Or blanc",
    "cfg.stone": "Pierre",
    "cfg.diamond": "Diamant",
    "cfg.sapphire": "Saphir",
    "cfg.emerald": "Émeraude",
    "cfg.weight": "Poids de la pierre",
    "cfg.ct10": "1,0 ct",
    "cfg.ct15": "1,5 ct",
    "cfg.ct20": "2,0 ct",
    "cfg.size": "Tour de doigt",
    "cfg.total": "Prix indicatif",
    "cfg.note": "Prix d'exemple pour cette démonstration. Les teintes or jaune, or blanc et les pierres de couleur sont un aperçu calculé à partir de la photo en or rose.",
    "craft.aria": "Savoir-faire",
    "craft.alt": "Le solitaire vu de profil : la pierre tenue haut par ses griffes",
    "craft.eyebrow": "Savoir-faire",
    "craft.title": "Trois cents heures pour une bague qui paraît légère.",
    "craft.c1": "<b>Le dessin</b>Chaque monture naît à la gouache, à taille réelle, autour de la pierre choisie.",
    "craft.c2": "<b>La cire</b>Le modèle est sculpté dans la cire, puis coulé en or dans l'atelier.",
    "craft.c3": "<b>Le sertissage</b>Les griffes sont relevées et polies une à une, sous la loupe, jusqu'à se faire oublier.",
    "sal.aria": "Rendez-vous en salon",
    "sal.eyebrow": "Rendez-vous",
    "sal.title": "Un salon privé, une pierre, le temps qu'il faut.",
    "sal.lead": "Choisissez un salon et un créneau. La pièce que vous avez composée vous attendra sur son socle.",
    "sal.name": "Nom",
    "sal.nameph": "Votre nom",
    "sal.mail": "E-mail",
    "sal.mailph": "vous@exemple.fr",
    "sal.geneva": "Genève, rue du Rhône",
    "sal.slot": "Créneau",
    "sal.submit": "Demander le rendez-vous",
    "foot.house": "Maison Ilvane, haute joaillerie",
    "badge": "Concept Weskale Studio · marque fictive",
    "foot.visuals": "Visuels générés pour ce concept",
  };

  // Textes fabriques par le script (galerie, configurateur, formulaire)
  const JS = {
    en: {
      examplePrice: "Example price",
      metals: ["Rose gold", "Yellow gold", "White gold"],
      stones: ["Diamond", "Sapphire", "Emerald"],
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      hours: ["11 am", "3 pm", "5:30 pm"],
      at: "at",
      bad: "Please enter your name and a valid email address.",
      ok: (nom, salon, quand, cfg) => `Thank you ${nom}. Appointment requested in ${salon}, ${quand}, for a ${cfg}. Demonstration: nothing has been sent.`,
      cfg: (metal, stone, ct) => `${metal.toLowerCase()} solitaire with a ${ct} ${stone.toLowerCase()}`,
      sent: "Request noted",
      price: (n) => "€" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      gallery: [
        { col: "Aube collection", name: "Aube", em: "yellow gold", d: "18k yellow gold, a band paved with diamonds and four prongs that hold the stone high." },
        { col: "Six Griffes collection", name: "Six Griffes", em: "yellow gold", d: "A round diamond on a fine, smooth band. The purest line in the house." },
        { col: "Six Griffes collection", name: "Six Griffes", em: "white gold", d: "The same setting in 18k white gold, for a cooler light around the stone." },
        { col: "Aube collection", name: "Aube", em: "rose gold", d: "The Aube setting in 18k rose gold, paved band, four prongs." },
        { col: "Rosée collection", name: "Rosée", em: "drop earrings", d: "A pear shaped diamond beneath a round diamond, in 18k gold." },
        { col: "Constellation collection", name: "Constellation", em: "pendant", d: "A round diamond in a four prong setting on a very fine gold chain." },
      ],
    },
    fr: {
      examplePrice: "Prix d'exemple",
      metals: ["Or rose", "Or jaune", "Or blanc"],
      stones: ["Diamant", "Saphir", "Émeraude"],
      days: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
      hours: ["11 h", "15 h", "17 h 30"],
      at: "à",
      bad: "Indiquez votre nom et une adresse e-mail valide.",
      ok: (nom, salon, quand, cfg) => `Merci ${nom}. Rendez-vous demandé à ${salon}, ${quand}, pour un solitaire ${cfg}. Démonstration : rien n'a été envoyé.`,
      cfg: (metal, stone, ct) => `${metal.toLowerCase()}, ${stone.toLowerCase()} de ${ct}`,
      sent: "Demande notée",
      price: (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €",
      gallery: [
        { col: "Collection Aube", name: "Aube", em: "or jaune", d: "Or jaune 18 carats, un anneau pavé de diamants et quatre griffes qui tiennent la pierre haut." },
        { col: "Collection Six Griffes", name: "Six Griffes", em: "or jaune", d: "Un diamant rond sur un anneau fin et lisse. La ligne la plus pure de la maison." },
        { col: "Collection Six Griffes", name: "Six Griffes", em: "or blanc", d: "La même monture en or blanc 18 carats, pour une lumière plus froide autour de la pierre." },
        { col: "Collection Aube", name: "Aube", em: "or rose", d: "La monture Aube en or rose 18 carats, anneau pavé, quatre griffes." },
        { col: "Collection Rosée", name: "Dormeuses", em: "Rosée", d: "Une poire de diamant sous un diamant rond, en or 18 carats." },
        { col: "Collection Constellation", name: "Constellation", em: "pendentif", d: "Un diamant rond à quatre griffes sur une chaîne d'or très fine." },
      ],
    },
  };

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
      try { sessionStorage.setItem("ilvane-y", String(Math.round(scrollY))); } catch (e) {}
      const u = new URL(location.href);
      u.hash = "";
      if (stored) u.searchParams.delete("lang"); else u.searchParams.set("lang", b.dataset.lang);
      location.replace(u.toString());
    });
  });

  // Hauteur a retrouver apres un changement de langue (lue une seule fois)
  let backY = null;
  try { const y = sessionStorage.getItem("ilvane-y"); if (y != null) { backY = +y; sessionStorage.removeItem("ilvane-y"); } } catch (e) {}

  window.I18N = { lang, js: JS[lang], backY };
})();
