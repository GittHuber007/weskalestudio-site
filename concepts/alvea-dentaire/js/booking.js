/* Alvéa : liste des soins et prise de rendez-vous de démonstration, en anglais et en français. Aucune donnée envoyée. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const lang = () => (window.I18N ? window.I18N.lang : "en");

  const CARE = [
    { id: "check", min: 45 }, { id: "kids", min: 30 }, { id: "align", min: 60 },
    { id: "impl", min: 60 }, { id: "white", min: 60 }, { id: "urgent", min: 30 },
  ];
  const REASONS = [{ id: "first", min: 45 }].concat(CARE);

  const TXT = {
    en: {
      locale: "en-GB",
      care: {
        first: ["First visit", "Check-up, photographs if needed and a written plan."],
        check: ["Check-up and cleaning", "A full examination, scaling and polishing, and advice for home."],
        kids: ["Children", "First visits made gentle, at the child's pace, with a parent in the room."],
        align: ["Clear aligners", "A digital scan, a plan you can see, then short regular check-ins."],
        impl: ["Implants and crowns", "Planned with 3D imaging, explained step by step, priced in writing."],
        white: ["Whitening", "Supervised, in the chair or at home, always after a check-up."],
        urgent: ["Urgent care", "Pain or a broken tooth: slots kept free every morning, the same day."],
      },
      min: (m) => `${m} min`,
      today: "Today",
      time: (h, m) => `${h}:${String(m).padStart(2, "0")}`,
      noSlot: "No time left on this day. Please choose another one.",
      pickReason: "Choose a reason to see the free times.",
      sum: (r, d, t) => [r, d, t].filter(Boolean).join(" · "),
      needWho: "Please enter your name and a valid email address.",
      needSlot: "Choose a day and a time first.",
      when: (d, t) => `${d}, ${t}`,
      what: (r, m, first, ref) => `${r}, ${m}${first ? ", first visit" : ""}. Reference ${ref}. In the real version, the confirmation goes out by email and a reminder arrives the day before.`,
      ics: "Dental appointment at Alvéa (demonstration)",
    },
    fr: {
      locale: "fr-BE",
      care: {
        first: ["Première visite", "Bilan, photos si besoin et plan écrit."],
        check: ["Bilan et détartrage", "Un examen complet, détartrage et polissage, et des conseils pour la maison."],
        kids: ["Enfants", "Des premières visites en douceur, au rythme de l'enfant, avec un parent dans la salle."],
        align: ["Gouttières invisibles", "Une empreinte numérique, un plan que vous voyez, puis des contrôles courts et réguliers."],
        impl: ["Implants et couronnes", "Planifiés avec une imagerie 3D, expliqués pas à pas, chiffrés par écrit."],
        white: ["Blanchiment", "Encadré, au fauteuil ou à la maison, toujours après un bilan."],
        urgent: ["Urgences", "Douleur ou dent cassée : des créneaux gardés libres chaque matin, le jour même."],
      },
      min: (m) => `${m} min`,
      today: "Aujourd'hui",
      time: (h, m) => (m ? `${h}\u00a0h\u00a0${String(m).padStart(2, "0")}` : `${h}\u00a0h`),
      noSlot: "Plus d'horaire libre ce jour-là. Choisissez un autre jour.",
      pickReason: "Choisissez un motif pour voir les horaires libres.",
      sum: (r, d, t) => [r, d, t].filter(Boolean).join(" · "),
      needWho: "Indiquez votre nom et une adresse e-mail valide.",
      needSlot: "Choisissez d'abord un jour et une heure.",
      when: (d, t) => `${d}, ${t}`,
      what: (r, m, first, ref) => `${r}, ${m}${first ? ", première visite" : ""}. Référence ${ref}. Dans la version réelle, la confirmation part par e-mail et un rappel arrive la veille.`,
      ics: "Rendez-vous dentaire chez Alvéa (démonstration)",
    },
  };
  const T = () => TXT[lang()];

  /* Soins */
  function renderCare() {
    const list = $("#careList"); if (!list) return;
    list.innerHTML = CARE.map((c, i) => {
      const [t, d] = T().care[c.id];
      return `<li class="cr"><span class="cr__n">${String(i + 1).padStart(2, "0")}</span><h3 class="cr__t">${t}</h3><p class="cr__d">${d}</p><span class="cr__m">${T().min(c.min)}</span></li>`;
    }).join("");
  }

  /* Rendez-vous */
  const S = { step: 0, reason: null, day: null, slot: null, ref: null };
  const SLOTS = [[8, 0], [8, 45], [9, 30], [10, 15], [11, 0], [14, 0], [14, 45], [15, 30], [16, 15], [17, 0], [17, 45]];
  const URGENT = [[8, 0], [8, 30], [9, 0], [9, 30]];
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  function days() {
    const out = [], now = new Date(), d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const urgent = S.reason === "urgent";
    if (!urgent) d.setDate(d.getDate() + 1);
    while (out.length < 10) {
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function slotsFor(day) {
    const urgent = S.reason === "urgent", base = urgent ? URGENT : SLOTS, now = new Date();
    const isToday = key(day) === key(now);
    return base.map(([h, m], i) => {
      let free = hash(key(day) + ":" + i + ":" + (urgent ? "u" : "n")) % 3 !== 0;
      if (isToday && (h * 60 + m) < now.getHours() * 60 + now.getMinutes() + 60) free = false;
      return { h, m, free };
    });
  }

  const fmtDay = (d, opts) => new Intl.DateTimeFormat(T().locale, opts).format(d);
  const reasonName = () => (S.reason ? T().care[S.reason][0] : "");
  const reasonMin = () => (S.reason ? REASONS.find((r) => r.id === S.reason).min : 0);

  function go(step) {
    S.step = step;
    $$(".bk__panel").forEach((p) => p.classList.toggle("is-on", +p.dataset.step === step));
    $$("[data-dot]").forEach((li) => li.classList.toggle("on", +li.dataset.dot === Math.min(step, 2)));
    $("#bkMsg").textContent = "";
    summary();
    if (step === 3) { const done = $("#bkDone"); if (done) done.focus({ preventScroll: true }); }
  }

  function renderReasons() {
    $("#bkReasons").innerHTML = REASONS.map((r) =>
      `<button type="button" class="opt" role="radio" aria-checked="${S.reason === r.id}" data-reason="${r.id}"><span>${T().care[r.id][0]}</span><small>${T().min(r.min)}</small></button>`).join("");
  }
  function renderDays() {
    const list = days();
    if (!S.day || !list.some((d) => key(d) === key(S.day))) { S.day = list.find((d) => slotsFor(d).some((s) => s.free)) || list[0]; S.slot = null; }
    const today = key(new Date());
    $("#bkDays").innerHTML = list.map((d) => {
      const full = !slotsFor(d).some((s) => s.free);
      const top = key(d) === today ? T().today : fmtDay(d, { weekday: "short" });
      return `<button type="button" class="day" role="radio" aria-checked="${key(d) === key(S.day)}" data-day="${d.getTime()}" ${full ? "disabled" : ""} aria-label="${fmtDay(d, { weekday: "long", day: "numeric", month: "long" })}"><span>${top}</span><b>${d.getDate()}</b><span>${fmtDay(d, { month: "short" })}</span></button>`;
    }).join("");
    renderSlots();
  }
  function renderSlots() {
    const box = $("#bkSlots");
    if (!S.day) { box.innerHTML = ""; return; }
    const ss = slotsFor(S.day);
    if (!ss.some((s) => s.free)) { box.innerHTML = `<p class="bk__none">${T().noSlot}</p>`; return; }
    box.innerHTML = ss.map((s, i) => {
      const on = S.slot && S.slot.h === s.h && S.slot.m === s.m;
      return `<button type="button" class="slot" role="radio" aria-checked="${!!on}" data-slot="${i}" ${s.free ? "" : "disabled"}>${T().time(s.h, s.m)}</button>`;
    }).join("");
  }
  function summary() {
    const d = S.day && S.step > 0 ? fmtDay(S.day, { weekday: "long", day: "numeric", month: "long" }) : "";
    const t = S.slot && S.step > 0 ? T().time(S.slot.h, S.slot.m) : "";
    $("#bkSum").textContent = S.step === 3 ? "" : (S.reason ? T().sum(reasonName(), d, t) : T().pickReason);
  }
  function done() {
    const d = fmtDay(S.day, { weekday: "long", day: "numeric", month: "long" });
    $("#bkWhen").textContent = T().when(d.charAt(0).toUpperCase() + d.slice(1), T().time(S.slot.h, S.slot.m));
    $("#bkWhat").textContent = T().what(reasonName(), T().min(reasonMin()), $("#bkFirst").checked, S.ref);
    // Fichier calendrier généré dans la page, sans serveur.
    const st = new Date(S.day); st.setHours(S.slot.h, S.slot.m, 0, 0);
    const en = new Date(st.getTime() + reasonMin() * 60000);
    const f = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Alvea demo//EN", "BEGIN:VEVENT", `UID:${S.ref}@alvea.example`, `DTSTART:${f(st)}`, `DTEND:${f(en)}`, `SUMMARY:${T().ics}`, `DESCRIPTION:${reasonName()}`, "LOCATION:Ixelles\\, Bruxelles", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = $("#bkIcs");
    if (a.dataset.url) URL.revokeObjectURL(a.dataset.url);
    a.dataset.url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.href = a.dataset.url;
  }

  function bind() {
    $("#bkReasons").addEventListener("click", (e) => {
      const b = e.target.closest("[data-reason]"); if (!b) return;
      if (S.reason !== b.dataset.reason) { S.reason = b.dataset.reason; S.day = null; S.slot = null; }
      renderReasons(); renderDays(); go(1);
    });
    $("#bkDays").addEventListener("click", (e) => {
      const b = e.target.closest("[data-day]"); if (!b || b.disabled) return;
      S.day = new Date(+b.dataset.day); S.slot = null;
      renderDays(); summary();
    });
    $("#bkSlots").addEventListener("click", (e) => {
      const b = e.target.closest("[data-slot]"); if (!b || b.disabled) return;
      const s = slotsFor(S.day)[+b.dataset.slot]; S.slot = { h: s.h, m: s.m };
      renderSlots(); summary();
      setTimeout(() => go(2), 220);
    });
    $$("[data-back]").forEach((b) => b.addEventListener("click", () => go(+b.dataset.back)));
    $("#bkForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#bkName").value.trim(), mail = $("#bkMail").value.trim();
      if (!S.day || !S.slot) { go(1); $("#bkMsg").textContent = T().needSlot; return; }
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { $("#bkMsg").textContent = T().needWho; return; }
      S.ref = "AL" + (hash(name + mail + key(S.day) + S.slot.h + S.slot.m) % 90000 + 10000);
      done(); go(3);
    });
    $("#bkAgain").addEventListener("click", () => { S.slot = null; renderSlots(); go(1); });
  }

  function renderAll() {
    renderCare(); renderReasons();
    if (S.reason) renderDays();
    if (S.step === 3) done();
    summary();
  }

  renderAll(); bind();
  if (window.I18N) window.I18N.on(renderAll);
})();
