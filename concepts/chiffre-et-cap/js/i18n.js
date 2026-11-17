/* Chiffre & Cap : textes en deux langues. Anglais par defaut, francais au choix (memorise).
   Aucun tiret de ponctuation dans les deux langues. */
(function () {
  "use strict";
  const D = {
    en: {
      "meta.title": "Chiffre & Cap · Chartered accountants for founders and freelancers",
      "meta.desc": "Chiffre & Cap, a fictional accounting firm for founders and freelancers. A Weskale Studio concept.",
      "nav.home": "Chiffre & Cap, back to top",
      "nav.sections": "Sections",
      "nav.method": "Method",
      "nav.figures": "Figures",
      "nav.sim": "Simulator",
      "nav.founder": "Founder",
      "nav.lang": "Language",
      "nav.cta": "Book a call",
      "nav.ctaShort": "Book",
      "loader.label": "Balancing the books",

      "film.aria": "Chiffre & Cap, how the firm works",
      "film.alt": "A company director in a navy suit reads his dashboard on a tablet at a light oak desk, beside a brass lamp and a black leather folder engraved CHIFFRE & CAP, with the city behind the window",
      "hero.eyebrow": "Chartered accountants · Founders and freelancers",
      "hero.l1": "Your numbers.",
      "hero.l2": "Your course.",
      "hero.aria": "Your numbers. Your course.",
      "hero.lead": "We keep your books, anticipate your taxes and help you decide. One expert who answers, and figures you can actually read.",
      "hero.cta": "Book a first call",
      "hero.sim": "How much can I pay myself?",
      "hero.hint": "Scroll",
      "c2.k": "02 · One partner",
      "c2.l1": "One name.",
      "c2.l2": "One direct line.",
      "c1.t": "Bank lines matched, invoices filed, a short comment on what moved. The year end holds no surprises.",
      "c1.k": "01 · Every month",
      "c1.l1": "Every month.",
      "c1.l2": "Not once a year.",
      "c2.t": "Your file has a single expert who knows it by heart. You call, the person who answers already has your figures open.",
      "c3.k": "03 · Before you decide",
      "c3.l1": "Simulate first.",
      "c3.l2": "Then sign.",
      "c3.t": "Your pay, a first hire, a new van: each decision is costed with you before it is made.",

      "led.aria": "A year of sample figures",
      "led.k": "Monthly dashboard",
      "led.title": "Your year, readable at a glance.",
      "led.s1": "Revenue over twelve months",
      "led.s2": "Profit before tax",
      "led.s3": "Cash at year end",
      "led.note": "Sample figures for a fictional services company. Nothing here describes a real client.",
      "led.months": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",

      "sim.aria": "Pay simulator",
      "sim.k": "Simulator",
      "sim.l1": "How much",
      "sim.l2": "can I pay myself?",
      "sim.lead": "Salary or dividends: move the sliders and see what is left for you. A simplified estimate under French rules, to open the conversation with your expert.",
      "sim.form": "Company form",
      "sim.sasu": "SASU",
      "sim.eurl": "EURL, corporate tax",
      "sim.benef": "Profit before your pay",
      "sim.part": "Share paid as salary",
      "sim.allDiv": "All dividends",
      "sim.allSal": "All salary",
      "sim.out": "Yours, per year",
      "sim.month": "that is {v} per month",
      "sim.net": "Net for you",
      "sim.soc": "Social contributions",
      "sim.is": "Corporate tax",
      "sim.pfu": "Tax on dividends",
      "sim.curve": "Net by share of salary",
      "sim.best": "best net",
      "sim.adviceBest": "You are close to the best net under these assumptions. Pension rights and cover remain to be weighed.",
      "sim.advice": "Under these assumptions, about {p} % as salary would leave {g} more per year. Salary also builds pension rights: a choice to make with your expert.",
      "sim.hyp": "Assumptions behind the estimate",
      "sim.h1": "SASU: contributions on the president's salary estimated at 82 % of net pay.",
      "sim.h2": "EURL: manager contributions estimated at 45 % of net pay; dividends subject to contributions (40 %), low share capital.",
      "sim.h3": "Corporate tax: 15 % up to €42,500, 25 % above.",
      "sim.h4": "Dividends: 30 % flat tax, or only its income tax part (12.8 %) after contributions in an EURL.",
      "sim.h5": "Salary shown before personal income tax, which depends on your household.",
      "sim.h6": "Simplified rates, to be checked every year. This is not personal advice.",

      "fd.aria": "The founder",
      "fd.k": "Founder",
      "fd.quote": "A good balance sheet is worthless if it arrives too late. So our clients see their figures every month.",
      "fd.name": "Claire Vasseur",
      "fd.role": "Founding partner, chartered accountant",
      "fd.alt": "Portrait of Claire Vasseur, founding partner of Chiffre & Cap",
      "fd.t": "Services companies, independent professions, business transfers. She signs every year end herself.",
      "fd.p2name": "Thomas Brémond",
      "fd.p2role": "Chartered accountant · startups, founder pay, trades",
      "fd.p2alt": "Portrait of Thomas Brémond, chartered accountant at Chiffre & Cap",
      "fd.note": "Fictional people. Portraits generated for this concept.",

      "ms.aria": "Services",
      "ms.k": "Services",
      "ms.title": "What counts, nothing more.",
      "ms.1.t": "Bookkeeping and year end",
      "ms.1.p": "from {v} excl. VAT / month",
      "ms.1.d": "Bank feeds, monthly reconciliation, annual accounts and tax return, and a closing meeting to explain it all.",
      "ms.2.t": "Tax returns and VAT",
      "ms.2.p": "included",
      "ms.2.d": "VAT, business property tax, corporate tax: prepared, checked and filed on time, with a reminder before each deadline.",
      "ms.3.t": "Payroll",
      "ms.3.p": "from {v} excl. VAT / payslip",
      "ms.3.d": "Payslips, social filings, staff joining and leaving, and plain answers to your questions as an employer.",
      "ms.4.t": "Starting a company",
      "ms.4.p": "from {v} excl. VAT",
      "ms.4.d": "A costed choice of company form, articles, registration and a first forecast.",
      "ms.5.t": "Forecast and dashboard",
      "ms.5.p": "from {v} excl. VAT",
      "ms.5.d": "Budget, cash plan, scenarios: a tool to decide, updated with you through the year.",
      "ms.note": "Sample prices for a fictional brand.",

      "rdv.aria": "Book a first call",
      "rdv.k": "First call",
      "rdv.l1": "Thirty minutes",
      "rdv.l2": "to take stock.",
      "rdv.t": "Free and with no commitment. We look at your situation together, you leave with concrete next steps.",
      "rdv.format": "Format",
      "rdv.visio": "Video call",
      "rdv.office": "At the office",
      "rdv.day": "Day",
      "rdv.time": "Time",
      "rdv.name": "Name",
      "rdv.email": "Email",
      "rdv.namePh": "Your name",
      "rdv.emailPh": "you@example.com",
      "rdv.submit": "Book this slot",
      "rdv.errSlot": "Choose a day and a time.",
      "rdv.errName": "Please enter your name.",
      "rdv.errMail": "This email address does not look valid.",
      "rdv.ok": "Noted, {n}: {f}, {d} at {h}. Demo only: no data was sent.",

      "foot.line": "Chiffre & Cap, chartered accountants",
      "foot.concept": "Weskale Studio concept · fictional brand",
      "foot.visuals": "Visuals generated for this concept · sample figures and prices",
    },
    fr: {
      "meta.title": "Chiffre & Cap · Expertise comptable pour dirigeants et indépendants",
      "meta.desc": "Chiffre & Cap, cabinet d'expertise comptable fictif pour dirigeants et indépendants. Un concept Weskale Studio.",
      "nav.home": "Chiffre et Cap, retour en haut",
      "nav.sections": "Sections",
      "nav.method": "Méthode",
      "nav.figures": "Chiffres",
      "nav.sim": "Simulateur",
      "nav.founder": "Fondatrice",
      "nav.lang": "Langue",
      "nav.cta": "Prendre rendez-vous",
      "nav.ctaShort": "Rendez-vous",
      "loader.label": "Les comptes s'équilibrent",

      "film.aria": "Chiffre & Cap, notre façon de travailler",
      "film.alt": "Un dirigeant en costume marine consulte son tableau de bord sur une tablette, à un bureau en chêne clair, près d'une lampe en laiton et d'une pochette en cuir noir gravée CHIFFRE & CAP, la ville derrière la vitre",
      "hero.eyebrow": "Expertise comptable · Dirigeants et indépendants",
      "hero.l1": "Vos chiffres.",
      "hero.l2": "Votre cap.",
      "hero.aria": "Vos chiffres. Votre cap.",
      "hero.lead": "Nous tenons vos comptes, anticipons vos impôts et vous aidons à décider. Un expert qui répond, et des chiffres que l'on comprend.",
      "hero.cta": "Prendre rendez-vous",
      "hero.sim": "Combien je me verse ?",
      "hero.hint": "Défiler",
      "c2.k": "02 · Un associé",
      "c2.l1": "Un nom.",
      "c2.l2": "Une ligne directe.",
      "c1.t": "Banque rapprochée, factures classées, un court commentaire sur ce qui a bougé. La clôture ne réserve aucune surprise.",
      "c1.k": "01 · Chaque mois",
      "c1.l1": "Chaque mois.",
      "c1.l2": "Pas une fois par an.",
      "c2.t": "Votre dossier a un seul expert, qui le connaît par cœur. Vous appelez, la personne qui répond a déjà vos chiffres sous les yeux.",
      "c3.k": "03 · Avant de décider",
      "c3.l1": "Simuler d'abord.",
      "c3.l2": "Signer ensuite.",
      "c3.t": "Votre rémunération, une première embauche, un nouvel utilitaire : chaque décision est chiffrée avec vous avant d'être prise.",

      "led.aria": "Une année de chiffres d'exemple",
      "led.k": "Tableau de bord mensuel",
      "led.title": "Votre année, lisible en un regard.",
      "led.s1": "Chiffre d'affaires sur douze mois",
      "led.s2": "Résultat avant impôt",
      "led.s3": "Trésorerie en fin d'année",
      "led.note": "Chiffres d'exemple pour une société de services fictive. Rien ici ne décrit un vrai client.",
      "led.months": "Janv.,Févr.,Mars,Avr.,Mai,Juin,Juil.,Août,Sept.,Oct.,Nov.,Déc.",

      "sim.aria": "Simulateur de rémunération",
      "sim.k": "Simulateur",
      "sim.l1": "Combien",
      "sim.l2": "je me verse ?",
      "sim.lead": "Salaire ou dividendes : déplacez les curseurs et voyez ce qui vous reste. Une estimation simplifiée, selon les règles françaises, pour ouvrir la discussion avec votre expert.",
      "sim.form": "Forme de la société",
      "sim.sasu": "SASU",
      "sim.eurl": "EURL à l'IS",
      "sim.benef": "Bénéfice avant votre rémunération",
      "sim.part": "Part versée en salaire",
      "sim.allDiv": "Tout en dividendes",
      "sim.allSal": "Tout en salaire",
      "sim.out": "Pour vous, par an",
      "sim.month": "soit {v} par mois",
      "sim.net": "Net pour vous",
      "sim.soc": "Cotisations sociales",
      "sim.is": "Impôt sur les sociétés",
      "sim.pfu": "Fiscalité des dividendes",
      "sim.curve": "Net selon la part de salaire",
      "sim.best": "meilleur net",
      "sim.adviceBest": "Vous êtes au plus près du meilleur net selon ces hypothèses. Restent à regarder vos droits à la retraite et votre protection.",
      "sim.advice": "Selon ces hypothèses, environ {p} % en salaire laisserait {g} de plus par an. Le salaire ouvre aussi des droits à la retraite : un arbitrage à faire avec votre expert.",
      "sim.hyp": "Les hypothèses du calcul",
      "sim.h1": "SASU : cotisations sur le salaire du président estimées à 82 % du net.",
      "sim.h2": "EURL : cotisations du gérant estimées à 45 % du net ; dividendes soumis à cotisations (40 %), capital social faible.",
      "sim.h3": "Impôt sur les sociétés : 15 % jusqu'à 42 500 €, 25 % au-delà.",
      "sim.h4": "Dividendes : prélèvement forfaitaire unique de 30 %, ou sa seule part d'impôt (12,8 %) après cotisations en EURL.",
      "sim.h5": "Salaire présenté avant impôt sur le revenu, qui dépend de votre foyer.",
      "sim.h6": "Taux simplifiés, à vérifier chaque année. Ceci n'est pas un conseil personnalisé.",

      "fd.aria": "La fondatrice",
      "fd.k": "Fondatrice",
      "fd.quote": "Un bon bilan ne sert à rien s'il arrive trop tard. Alors nos clients voient leurs chiffres chaque mois.",
      "fd.name": "Claire Vasseur",
      "fd.role": "Associée fondatrice, experte-comptable",
      "fd.alt": "Portrait de Claire Vasseur, associée fondatrice de Chiffre & Cap",
      "fd.t": "Sociétés de services, professions libérales, transmission d'entreprise. Elle signe elle-même chaque clôture.",
      "fd.p2name": "Thomas Brémond",
      "fd.p2role": "Expert-comptable · création, rémunération du dirigeant, artisanat",
      "fd.p2alt": "Portrait de Thomas Brémond, expert-comptable chez Chiffre & Cap",
      "fd.note": "Personnes fictives. Portraits générés pour ce concept.",

      "ms.aria": "Missions",
      "ms.k": "Missions",
      "ms.title": "Ce qui compte, rien de plus.",
      "ms.1.t": "Tenue comptable et bilan annuel",
      "ms.1.p": "dès {v} HT / mois",
      "ms.1.d": "Relevés bancaires importés, rapprochement chaque mois, bilan et liasse fiscale, et un rendez-vous de clôture pour tout expliquer.",
      "ms.2.t": "Déclarations fiscales et TVA",
      "ms.2.p": "incluses",
      "ms.2.d": "TVA, CFE, impôt sur les sociétés : préparées, vérifiées et télédéclarées dans les délais, avec un rappel avant chaque échéance.",
      "ms.3.t": "Paie",
      "ms.3.p": "dès {v} HT / bulletin",
      "ms.3.d": "Bulletins, déclarations sociales, entrées et sorties des salariés, et des réponses claires à vos questions d'employeur.",
      "ms.4.t": "Création d'entreprise",
      "ms.4.p": "dès {v} HT",
      "ms.4.d": "Choix du statut chiffré, statuts, immatriculation et premier prévisionnel.",
      "ms.5.t": "Prévisionnel et tableau de bord",
      "ms.5.p": "dès {v} HT",
      "ms.5.d": "Budget, plan de trésorerie, scénarios : un outil pour décider, mis à jour avec vous au fil de l'année.",
      "ms.note": "Prix d'exemple pour une marque fictive.",

      "rdv.aria": "Prendre un premier rendez-vous",
      "rdv.k": "Premier échange",
      "rdv.l1": "Trente minutes",
      "rdv.l2": "pour faire le point.",
      "rdv.t": "Offert et sans engagement. Nous regardons votre situation ensemble, vous repartez avec des pistes concrètes.",
      "rdv.format": "Format",
      "rdv.visio": "En visio",
      "rdv.office": "Au cabinet",
      "rdv.day": "Jour",
      "rdv.time": "Heure",
      "rdv.name": "Nom",
      "rdv.email": "E-mail",
      "rdv.namePh": "Votre nom",
      "rdv.emailPh": "vous@exemple.fr",
      "rdv.submit": "Réserver ce créneau",
      "rdv.errSlot": "Choisissez un jour et une heure.",
      "rdv.errName": "Indiquez votre nom.",
      "rdv.errMail": "L'adresse e-mail ne semble pas valide.",
      "rdv.ok": "C'est noté, {n} : {f}, {d} à {h}. Démonstration : aucune donnée n'a été envoyée.",

      "foot.line": "Chiffre & Cap, expertise comptable",
      "foot.concept": "Concept Weskale Studio · marque fictive",
      "foot.visuals": "Visuels générés pour ce concept · chiffres et prix d'exemple",
    },
  };
  const KEY = "chiffrecap-lang";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const I = (window.I18N = { lang: saved === "fr" ? "fr" : "en" });
  I.t = (k, v) => {
    let s = (D[I.lang] && D[I.lang][k]) || D.en[k] || k;
    if (v) Object.keys(v).forEach((n) => (s = s.split("{" + n + "}").join(v[n])));
    return s;
  };
  I.locale = () => (I.lang === "fr" ? "fr-FR" : "en-GB");
  // Nombres : "412,800" en anglais, "412 800" en francais (espace insecable fine)
  I.num = (n) => {
    const s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, I.lang === "fr" ? " " : ",");
    return (n < 0 ? "−" : "") + s;
  };
  // Prix : "€1,407" en anglais, "1 407 €" en francais
  I.eur = (n) => (I.lang === "fr" ? I.num(n) + " €" : "€" + I.num(n));
  I.apply = () => {
    document.documentElement.lang = I.lang;
    document.title = I.t("meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = I.t("meta.desc");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = I.t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", I.t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = I.t(el.dataset.i18nAlt)));
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = I.t(el.dataset.i18nPh)));
    document.querySelectorAll("[data-i18n-price]").forEach((el) => (el.textContent = I.t(el.dataset.i18nPrice, { v: I.eur(+el.dataset.v) })));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === I.lang));
  };
  I.set = (l) => {
    if (l === I.lang || !D[l]) return;
    I.lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    I.apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-lang]"); if (b) I.set(b.dataset.lang); });
  I.apply();
})();
