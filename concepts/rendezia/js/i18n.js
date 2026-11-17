/* Rendezia : textes en deux langues. Anglais par defaut, francais au choix (memorise).
   Dates, heures et prix suivent la langue. Aucun tiret de ponctuation dans les deux langues. */
(function () {
  "use strict";
  const D = {
    en: {
      "meta.title": "Rendezia · The online calendar for care practices",
      "meta.desc": "Rendezia, a fictional scheduling software for care practices. A Weskale Studio concept.",
      "nav.home": "Rendezia, back to top",
      "nav.sections": "Sections",
      "nav.product": "Product",
      "nav.demo": "Live demo",
      "nav.pricing": "Pricing",
      "nav.faq": "Questions",
      "nav.lang": "Language",
      "nav.cta": "Start free trial",
      "film.aria": "Rendezia, the calendar in action",
      "hero.pill.b": "New",
      "hero.pill": "The waitlist refills every cancelled slot",
      "hero.l1": "The calendar",
      "hero.l2": "that fills itself.",
      "hero.lead": "Online booking day and night, reminders by text, a waitlist that takes back every freed slot. You treat patients. Rendezia handles the calendar.",
      "hero.cta": "Start free trial",
      "hero.demo": "Try the live demo",
      "hero.hint": "Scroll",
      "app.practice": "Morel Practice",
      "app.tag": "Example · fictional data",
      "app.nav.cal": "Calendar",
      "app.nav.pat": "Patients",
      "app.nav.wait": "Waitlist",
      "app.nav.sms": "Reminders",
      "app.nav.set": "Settings",
      "app.online": "Online booking",
      "app.on": "Open around the clock",
      "app.online.tag": "Online",
      "app.wait.tag": "Waitlist",
      "type.first": "First visit",
      "type.follow": "Follow-up",
      "type.session": "Session",
      "type.long": "Long session",
      "c.book.k": "Booked online",
      "c.book.s": "First visit with Dr Morel",
      "c.cancel.k": "Cancelled",
      "c.cancel.s": "slot offered to the waitlist",
      "c.wait.k": "Slot filled",
      "c.wait.s": "First on the waitlist, accepted in 3 minutes",
      "sms.text": "Morel Practice: {name}, your visit is on {date} at {time} with {who}. Reply YES to confirm.",
      "sms.yes": "YES",
      "sms.ok": "Confirmed",
      "ch1.k": "Online booking",
      "ch1.t1": "Booked",
      "ch1.t2": "while you sleep.",
      "ch1.p": "Patients pick a free slot online, at any hour. It lands in your calendar on the spot.",
      "ch2.k": "Reminders",
      "ch2.t1": "Reminders",
      "ch2.t2": "go out on their own.",
      "ch2.p": "A text the day before, with one word to confirm. Nobody has to pick up the phone.",
      "ch3.k": "Waitlist",
      "ch3.t1": "A cancellation?",
      "ch3.t2": "Already filled.",
      "ch3.p": "The freed slot goes to the waitlist. The first patient to accept takes it.",
      "out.1": "One evening in the calendar.",
      "out.2": "Not a single phone call.",
      "say.aria": "Less phone, more care",
      "say.text": "Less time on the phone. More time with the people you treat.",
      "demo.k": "Live demo",
      "demo.t1": "Book as a patient.",
      "demo.t2": "Watch the practice side.",
      "bk.aria": "Booking page, demo",
      "bk.sub": "Osteopathy and physiotherapy · book online",
      "bk.who": "With",
      "bk.type": "Visit",
      "bk.day": "Day",
      "bk.slot": "Free slots",
      "bk.none": "No free slot this day. Try another one.",
      "bk.pick": "Pick a slot",
      "bk.go": "Book {date} at {time}",
      "bk.done": "Booked. Book another one",
      "bk.note": "Demo: no data is collected or sent.",
      "bk.osteo": "Osteopath",
      "bk.physio": "Physiotherapist",
      "pr.aria": "Practice calendar, demo",
      "pr.k": "Practice view",
      "pr.you": "You",
      "pr.just": "Booked online · just now",
      "pr.empty": "No visit booked yet.",
      "pr.n1": "Confirmation sent by text to the patient",
      "pr.n2": "Reminder scheduled for {date} at {time}",
      "pr.reset": "Reset the demo",
      "people.k": "For care teams",
      "people.t1": "One calendar",
      "people.t2": "for the whole practice.",
      "people.p": "Each practitioner, room and visit length, with breaks and holidays. Patients only ever see what is free.",
      "job.1": "Osteopaths",
      "job.2": "Physiotherapists",
      "job.3": "Dentists",
      "job.4": "Speech therapists",
      "job.5": "Psychologists",
      "job.6": "Midwives",
      "job.7": "Dietitians",
      "people.alt": "A practitioner checks the day's calendar on a tablet between two patients",
      "f.1.t": "Online booking, around the clock",
      "f.1.p": "A page in your name, showing your real free slots.",
      "f.2.t": "Text reminders",
      "f.2.p": "Sent the day before, confirmed in one word.",
      "f.3.t": "Waitlist",
      "f.3.p": "Every freed slot is offered again right away.",
      "pricing.k": "Pricing",
      "pricing.t1": "One clear price,",
      "pricing.t2": "per practitioner.",
      "calc.n": "Practitioners",
      "calc.sms": "Unlimited text reminders",
      "calc.wait": "Waitlist",
      "calc.bill": "Billing",
      "calc.m": "Monthly",
      "calc.y": "Yearly",
      "calc.free": "2 months free",
      "calc.total": "Your plan",
      "calc.per": "/ month",
      "calc.detail.1": "{n} practitioner × {p}",
      "calc.detail.n": "{n} practitioners × {p}",
      "calc.detail.opt": " + options",
      "calc.detail.y": ", billed {t} a year",
      "calc.go": "Start the 14 day trial",
      "calc.fine": "No card · cancel any time · example prices, excl. tax",
      "calc.toast": "Demo: no account is created. On the real site, this opens the sign up.",
      "faq.t1": "Questions",
      "faq.q1": "Do patients need an account?",
      "faq.a1": "No. A name, a phone number and the reason for the visit are enough to book.",
      "faq.q2": "Can I import my current calendar?",
      "faq.a2": "Yes, from a file or from another online calendar. The team helps you set up.",
      "faq.q3": "Where is the data stored?",
      "faq.a3": "In this concept, on servers in Europe, with a host certified for health data.",
      "faq.q4": "What if a patient does not show up?",
      "faq.a4": "Mark the visit as missed in one click. You can then ask that patient for a deposit on future bookings.",
      "final.t1": "Give your days",
      "final.t2": "back to care.",
      "final.cta": "Start free trial",
      "foot.concept": "Weskale Studio concept · fictional brand",
      "foot.data": "Names, calendars and prices are examples",
    },
    fr: {
      "meta.title": "Rendezia · L'agenda en ligne des cabinets de santé",
      "meta.desc": "Rendezia, logiciel fictif de rendez-vous pour cabinets de santé. Un concept Weskale Studio.",
      "nav.home": "Rendezia, retour en haut",
      "nav.sections": "Sections",
      "nav.product": "Produit",
      "nav.demo": "Démo",
      "nav.pricing": "Tarifs",
      "nav.faq": "Questions",
      "nav.lang": "Langue",
      "nav.cta": "Essai gratuit",
      "film.aria": "Rendezia, l'agenda en action",
      "hero.pill.b": "Nouveau",
      "hero.pill": "La liste d'attente reprend chaque annulation",
      "hero.l1": "L'agenda",
      "hero.l2": "qui se remplit seul.",
      "hero.lead": "Réservation en ligne jour et nuit, rappels par SMS, liste d'attente qui reprend chaque créneau libéré. Vous soignez. Rendezia s'occupe de l'agenda.",
      "hero.cta": "Essai gratuit",
      "hero.demo": "Essayer la démo",
      "hero.hint": "Défiler",
      "app.practice": "Cabinet Morel",
      "app.tag": "Exemple · données fictives",
      "app.nav.cal": "Agenda",
      "app.nav.pat": "Patients",
      "app.nav.wait": "Liste d'attente",
      "app.nav.sms": "Rappels",
      "app.nav.set": "Réglages",
      "app.online": "Réservation en ligne",
      "app.on": "Ouverte jour et nuit",
      "app.online.tag": "En ligne",
      "app.wait.tag": "Liste d'attente",
      "type.first": "Bilan",
      "type.follow": "Suivi",
      "type.session": "Séance",
      "type.long": "Séance longue",
      "c.book.k": "Réservé en ligne",
      "c.book.s": "Bilan avec Dr Morel",
      "c.cancel.k": "Annulé",
      "c.cancel.s": "créneau proposé à la liste d'attente",
      "c.wait.k": "Créneau repris",
      "c.wait.s": "Première de la liste d'attente, acceptée en 3 minutes",
      "sms.text": "Cabinet Morel : {name}, votre rendez-vous est le {date} à {time} avec {who}. Répondez OUI pour confirmer.",
      "sms.yes": "OUI",
      "sms.ok": "Confirmé",
      "ch1.k": "Réservation en ligne",
      "ch1.t1": "On réserve",
      "ch1.t2": "pendant que vous dormez.",
      "ch1.p": "Vos patients choisissent un créneau libre en ligne, à toute heure. Il s'affiche aussitôt dans l'agenda.",
      "ch2.k": "Rappels",
      "ch2.t1": "Le rappel",
      "ch2.t2": "part tout seul.",
      "ch2.p": "Un SMS la veille, avec un mot pour confirmer. Personne n'a besoin de décrocher.",
      "ch3.k": "Liste d'attente",
      "ch3.t1": "Une annulation ?",
      "ch3.t2": "Déjà reprise.",
      "ch3.p": "Le créneau libéré part à la liste d'attente. Le premier patient qui accepte le prend.",
      "out.1": "Une soirée dans l'agenda.",
      "out.2": "Pas un seul appel.",
      "say.aria": "Moins de téléphone, plus de soin",
      "say.text": "Moins de temps au téléphone. Plus de temps pour les patients que vous soignez.",
      "demo.k": "Démo",
      "demo.t1": "Réservez comme un patient.",
      "demo.t2": "Regardez côté cabinet.",
      "bk.aria": "Page de réservation, démonstration",
      "bk.sub": "Ostéopathie et kinésithérapie · réservation en ligne",
      "bk.who": "Avec",
      "bk.type": "Motif",
      "bk.day": "Jour",
      "bk.slot": "Créneaux libres",
      "bk.none": "Aucun créneau libre ce jour. Essayez un autre jour.",
      "bk.pick": "Choisissez un créneau",
      "bk.go": "Réserver le {date} à {time}",
      "bk.done": "Réservé. En réserver un autre",
      "bk.note": "Démonstration : aucune donnée n'est collectée ni envoyée.",
      "bk.osteo": "Ostéopathe",
      "bk.physio": "Kinésithérapeute",
      "pr.aria": "Agenda du cabinet, démonstration",
      "pr.k": "Côté cabinet",
      "pr.you": "Vous",
      "pr.just": "Réservé en ligne · à l'instant",
      "pr.empty": "Aucun rendez-vous pour l'instant.",
      "pr.n1": "Confirmation envoyée au patient par SMS",
      "pr.n2": "Rappel prévu le {date} à {time}",
      "pr.reset": "Remettre la démo à zéro",
      "people.k": "Pour les équipes de soin",
      "people.t1": "Un seul agenda",
      "people.t2": "pour tout le cabinet.",
      "people.p": "Chaque praticien, chaque salle, chaque durée de séance, avec les pauses et les congés. Les patients ne voient que ce qui est libre.",
      "job.1": "Ostéopathes",
      "job.2": "Kinésithérapeutes",
      "job.3": "Dentistes",
      "job.4": "Orthophonistes",
      "job.5": "Psychologues",
      "job.6": "Sages-femmes",
      "job.7": "Diététiciens",
      "people.alt": "Une praticienne consulte l'agenda du jour sur une tablette entre deux patients",
      "f.1.t": "Réservation en ligne, jour et nuit",
      "f.1.p": "Une page à votre nom, avec vos vrais créneaux libres.",
      "f.2.t": "Rappels par SMS",
      "f.2.p": "Envoyés la veille, confirmés en un mot.",
      "f.3.t": "Liste d'attente",
      "f.3.p": "Chaque créneau libéré est aussitôt reproposé.",
      "pricing.k": "Tarifs",
      "pricing.t1": "Un prix clair,",
      "pricing.t2": "par praticien.",
      "calc.n": "Praticiens",
      "calc.sms": "Rappels SMS illimités",
      "calc.wait": "Liste d'attente",
      "calc.bill": "Facturation",
      "calc.m": "Mensuel",
      "calc.y": "Annuel",
      "calc.free": "2 mois offerts",
      "calc.total": "Votre abonnement",
      "calc.per": "/ mois",
      "calc.detail.1": "{n} praticien × {p}",
      "calc.detail.n": "{n} praticiens × {p}",
      "calc.detail.opt": " + options",
      "calc.detail.y": ", soit {t} par an",
      "calc.go": "Commencer l'essai de 14 jours",
      "calc.fine": "Sans carte · sans engagement · prix d'exemple, hors taxes",
      "calc.toast": "Démonstration : aucun compte n'est créé. Sur le vrai site, ce bouton ouvre l'inscription.",
      "faq.t1": "Questions",
      "faq.q1": "Mes patients doivent-ils créer un compte ?",
      "faq.a1": "Non. Un nom, un numéro de téléphone et le motif suffisent pour réserver.",
      "faq.q2": "Puis-je importer mon agenda actuel ?",
      "faq.a2": "Oui, depuis un fichier ou un autre agenda en ligne. L'équipe vous accompagne au démarrage.",
      "faq.q3": "Où sont hébergées les données ?",
      "faq.a3": "Dans ce concept, sur des serveurs en Europe, chez un hébergeur certifié pour les données de santé.",
      "faq.q4": "Et si un patient ne vient pas ?",
      "faq.a4": "Vous le marquez absent en un clic. Vous pouvez ensuite lui demander un acompte pour ses prochains rendez-vous.",
      "final.t1": "Rendez vos journées",
      "final.t2": "au soin.",
      "final.cta": "Essai gratuit",
      "foot.concept": "Concept Weskale Studio · marque fictive",
      "foot.data": "Les noms, agendas et prix sont des exemples",
    },
  };
  const KEY = "rendezia-lang";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const I = (window.I18N = { lang: saved === "fr" ? "fr" : "en" });
  I.t = (k, v) => {
    let s = (D[I.lang] && D[I.lang][k]) || D.en[k] || k;
    if (v) Object.keys(v).forEach((n) => (s = s.split("{" + n + "}").join(v[n])));
    return s;
  };
  const loc = () => (I.lang === "fr" ? "fr-FR" : "en-GB");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const grp = (n, sep) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  // Prix : "€88" en anglais, "88 €" en francais (espace insecable)
  I.eur = (n) => (I.lang === "fr" ? grp(n, " ") + " €" : "€" + grp(n, ","));
  // Heure : minutes depuis minuit. "9:30 am" en anglais, "09:30" en francais
  I.time = (m) => {
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0");
    if (I.lang === "fr") return String(h).padStart(2, "0") + ":" + mm;
    return ((h + 11) % 12) + 1 + ":" + mm + (h < 12 ? " am" : " pm");
  };
  // Dates : formats propres a chaque langue, sans decalage de fuseau
  I.date = (iso, fmt) => {
    const d = new Date(iso + "T12:00:00Z");
    const f = (o) => new Intl.DateTimeFormat(loc(), Object.assign({ timeZone: "UTC" }, o)).format(d);
    const fr = I.lang === "fr";
    switch (fmt) {
      case "week": return fr ? "Semaine du " + f({ day: "numeric", month: "long" }) : "Week of " + f({ day: "numeric", month: "long" });
      case "head": return cap(f({ weekday: "short" }).replace(".", "")) + " " + f({ day: "numeric" });
      case "wd": return cap(f({ weekday: "short" }).replace(".", ""));
      case "dnum": return f({ day: "numeric" });
      case "dlong": return cap(f({ weekday: "long", day: "numeric", month: "long" }));
      case "dmid": return fr ? f({ weekday: "long", day: "numeric", month: "long" }) : f({ weekday: "short", day: "numeric", month: "short" });
      default: return cap(f({ weekday: "short", day: "numeric", month: "short" }).replace(/\./g, ""));
    }
  };
  I.apply = () => {
    document.documentElement.lang = I.lang;
    document.title = I.t("meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = I.t("meta.desc");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = I.t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", I.t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = I.t(el.dataset.i18nAlt)));
    document.querySelectorAll("[data-date]").forEach((el) => (el.textContent = I.date(el.dataset.date, el.dataset.fmt)));
    document.querySelectorAll("[data-time]").forEach((el) => (el.textContent = I.time(+el.dataset.time)));
    document.querySelectorAll("[data-price]").forEach((el) => (el.textContent = "+ " + I.eur(+el.dataset.price)));
    document.querySelectorAll("[data-sms]").forEach((el) => {
      const [name, iso, t, who] = el.dataset.sms.split("|");
      el.textContent = I.t("sms.text", { name, date: I.date(iso, "dmid"), time: I.time(+t), who });
    });
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
})();
