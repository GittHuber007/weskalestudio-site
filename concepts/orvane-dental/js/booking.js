/* Orvane Dental : liste des soins, réservation simple et échange simulé avec l'assistant. Démonstration : rien n'est envoyé. */
(function () {
  "use strict";
  const D = document, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const T = (k) => (W.I18N ? I18N.t(k) : k);
  const L = () => (W.I18N ? I18N.lang : "en");
  const LOC = () => (L() === "fr" ? "fr-FR" : "en-GB");
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CARE = [
    { id: "veneers", price: 2900, unit: true,
      en: ["Porcelain veneers", "Shaped by hand and matched to your shade in daylight. You try the result on before anything is final."],
      fr: ["Facettes en céramique", "Façonnées à la main et accordées à votre teinte, à la lumière du jour. Vous essayez le résultat avant que rien ne soit définitif."] },
    { id: "aligners", price: 9500,
      en: ["Clear aligners", "Discreet trays planned from a digital scan, with progress reviewed together at each visit."],
      fr: ["Aligneurs transparents", "Des gouttières discrètes, planifiées à partir d'une empreinte numérique, avec un point ensemble à chaque visite."] },
    { id: "whitening", price: 1200,
      en: ["Whitening", "In the chair or at home, with gentle care for sensitive teeth."],
      fr: ["Blanchiment", "Au fauteuil ou à la maison, avec des soins doux pour les dents sensibles."] },
    { id: "implants", price: 6800,
      en: ["Implants", "Guided placement, then a crown made to sit exactly where the old tooth stood."],
      fr: ["Implants", "Une pose guidée, puis une couronne faite pour prendre exactement la place de l'ancienne dent."] },
    { id: "design", price: 1500,
      en: ["Smile design", "Photos, scan and a trial smile you can see and feel before deciding."],
      fr: ["Design du sourire", "Photos, empreinte et un sourire d'essai que vous voyez et sentez avant de décider."] },
    { id: "hygiene", price: 450,
      en: ["Hygiene", "An unhurried cleaning and polish, with advice that fits your routine."],
      fr: ["Hygiène", "Un détartrage et un polissage sans hâte, avec des conseils adaptés à vos habitudes."] },
  ];
  const CONSULT = { en: "Consultation", fr: "Consultation" };
  const TIMES = ["09:30", "11:00", "12:30", "15:00", "17:30", "19:30"];

  const money = (n) => new Intl.NumberFormat(LOC()).format(n);
  const priceTxt = (c) => L() === "fr"
    ? `à partir de ${money(c.price)} AED${c.unit ? " par dent" : ""}`
    : `from AED ${money(c.price)}${c.unit ? " per tooth" : ""}`;

  /* Liste des soins */
  function renderCare() {
    const ol = $("#careList"); if (!ol) return;
    ol.innerHTML = CARE.map((c, i) => {
      const [name, txt] = c[L()];
      return `<li class="care__row"><span class="care__n">${String(i + 1).padStart(2, "0")}</span><h3 class="care__name">${name}</h3><p class="care__txt">${txt}</p><p class="care__price">${priceTxt(c)}</p></li>`;
    }).join("");
  }

  /* Réservation */
  const state = { treat: "consult", day: 0, time: null };
  const days = [];
  (function buildDays() {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    while (days.length < 7) { d.setDate(d.getDate() + 1); if (d.getDay() !== 5) days.push(new Date(d)); } // fermé le vendredi
  })();
  // Créneaux déjà pris : fixes pour la démonstration, différents selon le jour.
  const taken = (di, ti) => ((di * 7 + ti * 3) % 5 === 0) || (di === 0 && ti < 2);

  function radio(container, items, current, onPick) {
    container.innerHTML = items.map((it) => `<button type="button" role="radio" class="${it.cls || "chip"}" data-v="${it.v}" aria-checked="${String(it.v === current)}"${it.off ? " disabled" : ""}>${it.html}</button>`).join("");
    container.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => onPick(b.dataset.v)));
  }

  function treatName(id) { if (id === "consult") return CONSULT[L()]; const c = CARE.find((x) => x.id === id); return c ? c[L()][0] : ""; }

  function renderBooking() {
    const tr = $("#bkTreat"), dy = $("#bkDays"), tm = $("#bkTimes"); if (!tr) return;
    radio(tr, [{ v: "consult" }].concat(CARE.map((c) => ({ v: c.id }))).map((x) => ({ v: x.v, html: treatName(x.v) })), state.treat, (v) => { state.treat = v; renderBooking(); });
    const wd = new Intl.DateTimeFormat(LOC(), { weekday: "short" }), dn = new Intl.DateTimeFormat(LOC(), { day: "numeric" }), mo = new Intl.DateTimeFormat(LOC(), { month: "short" });
    radio(dy, days.map((d, i) => ({ v: String(i), cls: "day", html: `<small>${wd.format(d)}</small><b>${dn.format(d)}</b><small>${mo.format(d)}</small>` })), String(state.day), (v) => {
      state.day = +v; if (state.time != null && taken(state.day, TIMES.indexOf(state.time))) state.time = null; renderBooking();
    });
    radio(tm, TIMES.map((t, i) => ({ v: t, html: L() === "fr" ? t.replace(":", " h ") : t, off: taken(state.day, i) })), state.time, (v) => { state.time = v; renderBooking(); });
    summary();
  }

  function summary() {
    const s = $("#bkSum"); if (!s) return;
    const d = days[state.day];
    const date = new Intl.DateTimeFormat(LOC(), { weekday: "long", day: "numeric", month: "long" }).format(d);
    const time = state.time ? (L() === "fr" ? state.time.replace(":", " h ") : state.time) : (L() === "fr" ? "heure à choisir" : "time to choose");
    s.innerHTML = `<b>${treatName(state.treat)}</b><span>${date} · ${time}</span>`;
  }

  function initBooking() {
    const f = $("#bk"); if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $("#bkMsg"), name = $("#bkName"), contact = $("#bkContact");
      msg.classList.remove("ok");
      if (!state.time) { msg.textContent = L() === "fr" ? "Choisissez d'abord une heure." : "Please choose a time first."; return; }
      if (!name.value.trim()) { msg.textContent = L() === "fr" ? "Indiquez votre nom." : "Please add your name."; name.focus(); return; }
      if (!contact.value.trim()) { msg.textContent = L() === "fr" ? "Indiquez un téléphone ou un e-mail." : "Please add a phone number or an email."; contact.focus(); return; }
      const d = new Intl.DateTimeFormat(LOC(), { weekday: "long", day: "numeric", month: "long" }).format(days[state.day]);
      const t = L() === "fr" ? state.time.replace(":", " h ") : state.time;
      msg.textContent = L() === "fr"
        ? `Merci, ${name.value.trim()}. Votre demande pour le ${d} à ${t} est notée. Démonstration : rien n'a été envoyé.`
        : `Thank you, ${name.value.trim()}. Your request for ${d} at ${t} is noted. Demonstration: nothing has been sent.`;
      msg.classList.add("ok");
    });
  }

  /* Échange simulé avec l'assistant */
  const CALL = {
    en: [["p", "Hello, is it too late to book a whitening appointment?"],
         ["a", "Not at all. I can offer Tuesday at 10:30 or Wednesday at 18:00. Which suits you best?"],
         ["p", "Wednesday evening, please."],
         ["a", "It's booked: whitening, Wednesday at 18:00. The confirmation is on its way to your phone."]],
    fr: [["p", "Bonjour, est-il trop tard pour réserver un blanchiment ?"],
         ["a", "Pas du tout. Je peux vous proposer mardi à 10 h 30 ou mercredi à 18 h. Qu'est-ce qui vous convient le mieux ?"],
         ["p", "Mercredi soir, s'il vous plaît."],
         ["a", "C'est réservé : blanchiment, mercredi à 18 h. La confirmation arrive sur votre téléphone."]],
  };
  let callTimer = [], callSeen = false;
  function playCall() {
    const ol = $("#callLines"); if (!ol) return;
    callTimer.forEach(clearTimeout); callTimer = [];
    const who = { p: L() === "fr" ? "Patiente" : "Patient", a: "Assistant" };
    const lines = CALL[L()];
    ol.innerHTML = "";
    if (reduce) { ol.innerHTML = lines.map(([w, t]) => `<li class="msg msg--${w} on"><small>${who[w]}</small><p>${t}</p></li>`).join(""); return; }
    let at = 300;
    lines.forEach(([w, t]) => {
      callTimer.push(setTimeout(() => {
        const li = D.createElement("li");
        li.className = `msg msg--${w}`;
        li.innerHTML = `<small>${who[w]}</small><p><span class="typing"><i></i><i></i><i></i></span></p>`;
        ol.appendChild(li);
        requestAnimationFrame(() => li.classList.add("on"));
        callTimer.push(setTimeout(() => { li.querySelector("p").textContent = t; }, 900));
      }, at));
      at += 900 + Math.min(2600, 900 + t.length * 22);
    });
  }
  function initCall() {
    const box = $("#call"); if (!box) return;
    $("#callReplay").addEventListener("click", playCall);
    if ("IntersectionObserver" in W) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !callSeen) { callSeen = true; playCall(); io.disconnect(); } }), { threshold: 0.35 });
      io.observe(box);
    } else playCall();
  }

  function renderAll() { renderCare(); renderBooking(); if (callSeen) playCall(); }
  renderAll(); initBooking(); initCall();
  if (W.I18N) I18N.on(renderAll);
})();
