/* Lexaris : anglais par défaut (textes du HTML), français complet ci-dessous.
   Changer de langue enregistre le choix (localStorage, avec repli ?lang=) et recharge la page
   à la même hauteur : les titres sont découpés lettre par lettre, on ne les retraduit pas à chaud. */
(function () {
  "use strict";
  const root = document.documentElement;
  const lang = root.lang === "fr" ? "fr" : "en";
  const KEY = "lexaris-lang";

  const FR = {
    "meta.title": "Lexaris · Droit des affaires, Paris",
    "meta.desc": "Lexaris, cabinet d'avocats d'affaires fictif à Paris. Concept Weskale Studio.",
    "loader.sub": "Avocats · Paris",
    "nav.home": "Lexaris, retour en haut",
    "nav.sections": "Sections",
    "nav.firm": "Le cabinet",
    "nav.practices": "Expertises",
    "nav.partners": "Associés",
    "nav.cta": "Demande confidentielle",
    "nav.ctaShort": "Contact",
    "lang.label": "Langue",
    "hero.aria": "La bibliothèque du cabinet",
    "hero.alt": "Bibliothèque haussmannienne aux boiseries de noyer, table en marbre noir, hautes fenêtres et plaque de verre noir gravée LEXARIS",
    "hero.note": "Un cabinet d'avocats d'affaires, dans un appartement haussmannien du 8e arrondissement.",
    "rd.aria": "La lecture",
    "hero.eyebrow": "Droit des affaires · Paris 8e",
    "hero.title": '<span class="line">Le conseil,</span> <span class="line"><em>en confidence.</em></span>',
    "hero.sub": "Fusions, contentieux et gouvernance, pour les dirigeants qui ont besoin d'une réponse sûre, vite, et sans bruit.",
    "hero.btn": "Demander un rendez-vous",
    "hero.c1": "Tout dossier commence <em>par la lecture.</em>",
    "hero.c2": "La jurisprudence, la doctrine, <em>les petites lignes.</em>",
    "hero.c3": "Puis une position <em>qui tient.</em>",
    "hero.scroll": "Défiler",
    "firm.aria": "Le cabinet",
    "firm.eyebrow": "Le cabinet",
    "firm.text": "Nous intervenons quand l'enjeu est grand et que le silence compte autant que la stratégie. Un dossier, une équipe resserrée, un associé qui répond lui-même. Le reste ne regarde que vous.",
    "firm.sign": "Avocats à la Cour · Paris 8e",
    "pr.aria": "Expertises",
    "pr.eyebrow": "Expertises",
    "pr.lead": "Six domaines. <em>Une seule exigence.</em>",
    "pr.t1": "Fusions et acquisitions",
    "pr.d1": "Audit, négociation, garanties, closing.",
    "pr.t2": "Contentieux des affaires",
    "pr.d2": "Litiges entre associés, concurrence déloyale, ruptures de contrat.",
    "pr.t3": "Droit des sociétés",
    "pr.d3": "Pactes d'associés, gouvernance, opérations sur le capital.",
    "pr.t4": "Restructurations",
    "pr.d4": "Prévention, mandat ad hoc, conciliation.",
    "pr.t5": "Fiscalité des entreprises",
    "pr.d5": "Structuration, transmission, contrôle fiscal.",
    "pr.t6": "Arbitrage international",
    "pr.d6": "Procédures en français, en anglais et en arabe.",
    "tb.aria": "À la table",
    "tb.alt": "Des mains sur un contrat posé sur une table en bois, un stylo saisi pour signer",
    "tb.eyebrow": "À la table",
    "tb.title": '<span class="line">Un associé lit</span> <span class="line">chaque page.</span> <span class="line"><em>Un associé signe.</em></span>',
    "tb.note": "Images d'illustration",
    "pt.aria": "Associés",
    "pt.eyebrow": "Associés",
    "pt.title": "Ceux qui signent vos dossiers.",
    "pt.note": "Personnes et parcours fictifs, créés pour ce concept.",
    "pt.r1": "Associée gérante<br>Fusions et acquisitions",
    "pt.l1": "Français · Anglais",
    "pt.r2": "Associé<br>Contentieux des affaires",
    "pt.l2": "Français · Anglais · Allemand",
    "pt.r3": "Associée<br>Arbitrage international",
    "pt.l3": "Français · Anglais · Arabe",
    "sl.aria": "Nos engagements",
    "sl.title": '<span class="line">Rien ne sort</span> <span class="line"><em>de ces murs.</em></span>',
    "sl.t1": "Confidentialité",
    "sl.d1": "Échanges chiffrés, salle de réunion privée, et aucun client jamais cité en public.",
    "sl.t2": "Disponibilité",
    "sl.d2": "Un associé joignable directement, y compris la veille d'une signature.",
    "sl.t3": "Honoraires clairs",
    "sl.d3": "Une convention écrite dès le premier rendez-vous, au forfait ou au temps passé.",
    "ct.aria": "Demande confidentielle",
    "ct.eyebrow": "Demande confidentielle",
    "ct.title": "Parlons-en, entre ces murs.",
    "ct.f1k": "Cabinet",
    "ct.f1v": "Paris 8e, sur rendez-vous",
    "ct.f2k": "Rendez-vous",
    "ct.f2v": "Au cabinet ou en visioconférence chiffrée",
    "ct.f3k": "Réponse",
    "ct.f3v": "D'un associé, sous un jour ouvré",
    "ct.demo": "Démonstration · rien n'est envoyé",
    "ct.name": "Nom",
    "ct.nameP": "Votre nom",
    "ct.company": "Société",
    "ct.companyP": "Facultatif",
    "ct.email": "E-mail",
    "ct.emailP": "vous@exemple.fr",
    "ct.practice": "Domaine",
    "ct.channel": "Canal souhaité",
    "ct.ch1": "Appel chiffré",
    "ct.ch2": "Au cabinet",
    "ct.ch3": "Visioconférence",
    "ct.msg": "En quelques mots",
    "ct.msgP": "Aucun détail sensible à ce stade",
    "ct.discreet": "Contact discret : pas de message vocal, rien envoyé à mon bureau",
    "ct.send": "Envoyer sous pli scellé",
    "foot.house": "Lexaris Avocats, droit des affaires, Paris",
    "foot.concept": "Concept Weskale Studio · marque fictive",
    "foot.images": "Images : vidéos Mixkit et images générées pour ce concept",
  };

  // Textes utilisés par le script (main.js)
  const JS = {
    en: {
      bad: "Please give your name and a valid email address.",
      ch: { call: "an encrypted call", office: "a meeting at the firm", video: "a video call" },
      ok: (name, ref, ch) => `Thank you, ${name}. Your request is sealed under reference ${ref}. A partner would propose ${ch}. Demonstration only: nothing has been sent.`,
      sealed: "Sealed",
      again: "New request",
    },
    fr: {
      bad: "Indiquez votre nom et une adresse e-mail valide.",
      ch: { call: "un appel chiffré", office: "un rendez-vous au cabinet", video: "une visioconférence" },
      ok: (name, ref, ch) => `Merci, ${name}. Votre demande est scellée sous la référence ${ref}. Un associé vous proposerait ${ch}. Démonstration : rien n'a été envoyé.`,
      sealed: "Scellé",
      again: "Nouvelle demande",
    },
  };
  window.LX = Object.assign({ lang }, JS[lang]);

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

  // Sélecteur EN / FR
  document.querySelectorAll(".lang [data-lang]").forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", on);
    b.addEventListener("click", () => {
      if (b.dataset.lang === lang) return;
      let stored = false;
      try { localStorage.setItem(KEY, b.dataset.lang); stored = localStorage.getItem(KEY) === b.dataset.lang; } catch (e) {}
      try { sessionStorage.setItem("lexaris-y", String(Math.round(scrollY))); } catch (e) {}
      const u = new URL(location.href);
      u.hash = "";
      if (stored) u.searchParams.delete("lang"); else u.searchParams.set("lang", b.dataset.lang);
      location.replace(u.toString());
    });
  });
})();
