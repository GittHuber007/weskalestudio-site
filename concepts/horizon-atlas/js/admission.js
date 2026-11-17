/* Horizon Atlas : demande d'admission en quatre étapes, avec choix de la visite. Démonstration, rien n'est envoyé. */
(function () {
  "use strict";
  const D = document, W = window;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const form = $("#wizard");
  if (!form) return;
  const L = () => (W.I18N ? W.I18N.lang : "en");
  const g = () => W.gsap;

  const LEVELS = {
    en: ["Nursery", "Pre-kindergarten", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12 · Baccalaureate"],
    fr: ["Petite section", "Moyenne section", "Grande section", "CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "Seconde", "Première", "Terminale"],
  };
  const TIMES = [[9, 30], [11, 0], [14, 30]];
  const TXT = {
    en: {
      hint: "Enter the date of birth: we suggest the matching level.",
      young: (y) => `For September ${y}, your child will still be a little young: the nursery class welcomes children from age 3.`,
      old: "At this age, the path at the school is complete. Our team will gladly advise you.",
      level: (y, l) => `Suggested level for September ${y}: <b>${l}</b>.`,
      need: "Please fill in this field.",
      noLevel: "This date of birth does not match any level of the school for that start date.",
      mail: "This email address does not look valid.",
      tel: "This phone number looks incomplete.",
      slot: "Choose a date and a time for the visit.",
      next: "Continue", confirm: "Confirm the visit",
      rows: ["Request", "Pupil", "Level", "Languages", "Visit"],
      ex: "example", start: "start", none: "not specified", at: "at",
    },
    fr: {
      hint: "Indiquez la date de naissance : nous vous proposons le niveau correspondant.",
      young: (y) => `Pour la rentrée ${y}, votre enfant sera encore un peu jeune : la petite section accueille les enfants dès 3 ans.`,
      old: "À cet âge, le parcours à l'école est terminé. Notre équipe vous orientera volontiers.",
      level: (y, l) => `Niveau proposé pour la rentrée ${y} : <b>${l}</b>.`,
      need: "Merci de compléter ce champ.",
      noLevel: "Cette date de naissance ne correspond à aucun niveau de l'école pour cette rentrée.",
      mail: "L'adresse e-mail ne semble pas valide.",
      tel: "Le numéro de téléphone semble incomplet.",
      slot: "Choisissez une date et une heure de visite.",
      next: "Continuer", confirm: "Confirmer la visite",
      rows: ["Demande", "Élève", "Niveau", "Langues", "Visite"],
      ex: "exemple", start: "rentrée", none: "non précisé", at: "à",
    },
  };
  const T = () => TXT[L()];

  const panes = $$(".pane", form), err = $("#wErr"), hint = $("#hint");
  const next = $("[data-next]", form), prev = $("[data-prev]", form), bar = $(".wizard__bar i", form);
  const marks = $$(".enrol__steps li");
  let step = 1;

  function fillLevels() {
    const keep = form.niveau.selectedIndex;
    form.niveau.innerHTML = "";
    LEVELS[L()].forEach((l, i) => { const o = D.createElement("option"); o.value = String(i); o.textContent = l; form.niveau.appendChild(o); });
    if (keep >= 0) form.niveau.selectedIndex = keep;
  }
  function suggested() {
    if (!form.naissance.value) return null;
    const by = new Date(form.naissance.value).getFullYear();
    return +form.rentree.value - by - 3;
  }
  function updateHint(animate) {
    const i = suggested(), t = T();
    if (i === null) hint.innerHTML = t.hint;
    else if (i < 0) hint.innerHTML = t.young(form.rentree.value);
    else if (i >= LEVELS.en.length) hint.innerHTML = t.old;
    else { hint.innerHTML = t.level(form.rentree.value, LEVELS[L()][i]); form.niveau.value = String(i); }
    if (animate && !reduce && g()) g().fromTo(hint, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 });
  }
  form.naissance.addEventListener("change", () => updateHint(true));
  form.rentree.addEventListener("change", () => updateHint(true));

  // Créneaux de visite : les six prochains mercredis et samedis
  const slots = $("#slots"), times = $("#times");
  function fillSlots() {
    const loc = L() === "fr" ? "fr-FR" : "en-GB";
    const keepD = form.jour ? form.jour.value : "", keepT = form.heure ? form.heure.value : "";
    const dFmt = new Intl.DateTimeFormat(loc, { weekday: "short" }), mFmt = new Intl.DateTimeFormat(loc, { month: "short" });
    slots.innerHTML = "";
    const d = new Date(); d.setHours(12, 0, 0, 0); let n = 0;
    while (n < 6) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 3 && d.getDay() !== 6) continue;
      const iso = d.toISOString().slice(0, 10);
      const l = D.createElement("label");
      l.innerHTML = `<input type="radio" name="jour" value="${iso}"><span><small>${dFmt.format(d)}</small><b>${d.getDate()}</b><i>${mFmt.format(d)}</i></span>`;
      slots.appendChild(l); n++;
    }
    times.innerHTML = TIMES.map(([h, m]) => `<label><input type="radio" name="heure" value="${h}:${m}"><span>${fmtTime(h, m)}</span></label>`).join("");
    if (keepD) { const r = $(`input[name="jour"][value="${keepD}"]`, slots); if (r) r.checked = true; }
    if (keepT) { const r = $(`input[name="heure"][value="${keepT}"]`, times); if (r) r.checked = true; }
  }
  function fmtTime(h, m) {
    if (L() === "fr") return `${h} h ${String(m).padStart(2, "0")}`;
    const ap = h >= 12 ? "pm" : "am", hh = h > 12 ? h - 12 : h;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
  }
  function fmtDay(iso) {
    const d = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat(L() === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(d);
  }

  function valid(s) {
    const t = T();
    const need = { 1: ["prenom", "nom", "naissance"], 3: ["parent", "email", "tel"] }[s] || [];
    for (const k of need) if (!form[k].value.trim()) { form[k].focus(); return t.need; }
    if (s === 1) { const i = suggested(); if (i !== null && (i < 0 || i >= LEVELS.en.length)) return t.noLevel; }
    if (s === 3 && !/^\S+@\S+\.\S+$/.test(form.email.value)) { form.email.focus(); return t.mail; }
    if (s === 3 && form.tel.value.replace(/\D/g, "").length < 9) { form.tel.focus(); return t.tel; }
    if (s === 4 && (!form.jour.value || !form.heure.value)) return t.slot;
    return "";
  }
  function setNextLabel() { $("#nextLabel").textContent = step === 4 ? T().confirm : T().next; }
  function go(to) {
    const from = panes.find((p) => p.classList.contains("is-on"));
    const dest = panes.find((p) => +p.dataset.step === to);
    const dir = to > step ? 1 : -1;
    step = to;
    const swap = () => {
      from.classList.remove("is-on"); dest.classList.add("is-on");
      if (!reduce && g()) g().fromTo(dest, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
    };
    if (reduce || !g()) swap(); else g().to(from, { x: -40 * dir, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: swap });
    bar.style.transform = `scaleX(${Math.min(to, 4) / 4})`;
    marks.forEach((m, i) => { m.classList.toggle("is-on", i + 1 === to); m.classList.toggle("is-done", i + 1 < to); });
    prev.style.visibility = to > 1 && to < 5 ? "visible" : "hidden";
    next.style.display = to === 5 ? "none" : "";
    setNextLabel();
    if (to === 5) done();
  }
  next.addEventListener("click", () => {
    const e = valid(step);
    err.textContent = e;
    if (e) { if (!reduce && g()) g().fromTo(form, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" }); return; }
    go(step + 1);
  });
  prev.addEventListener("click", () => { err.textContent = ""; go(step - 1); });

  let ref = "";
  function recap() {
    const t = T();
    const langs = $$('input[name="langue"]:checked', form).map((i) => i.nextElementSibling.textContent).join(", ") || t.none;
    const [hh, mm] = (form.heure.value || "0:0").split(":").map(Number);
    const rows = [
      [t.rows[0], `${ref} (${t.ex})`],
      [t.rows[1], `${form.prenom.value.trim()} ${form.nom.value.trim()}`],
      [t.rows[2], `${LEVELS[L()][+form.niveau.value] || ""}, ${t.start} ${form.rentree.value}`],
      [t.rows[3], langs],
      [t.rows[4], form.jour.value ? `${fmtDay(form.jour.value)}, ${fmtTime(hh, mm)}` : ""],
    ];
    const dl = $("#recap");
    dl.innerHTML = rows.map(() => "<div><dt></dt><dd></dd></div>").join("");
    $$("div", dl).forEach((r, i) => { $("dt", r).textContent = rows[i][0]; $("dd", r).textContent = rows[i][1]; });
    $(".done__name").textContent = form.prenom.value.trim() + ".";
  }
  function done() {
    ref = "HA-" + String(form.rentree.value).slice(2) + "-" + String(Math.floor(1000 + Math.random() * 9000));
    recap();
    const ps = $$(".pane--done .d");
    ps.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = reduce ? 0 : l; });
    if (!reduce && g()) g().to(ps, { strokeDashoffset: 0, duration: 1.6, stagger: 0.4, ease: "power2.inOut", delay: 0.3 });
  }
  $("[data-restart]").addEventListener("click", () => { form.reset(); fillLevels(); fillSlots(); updateHint(false); err.textContent = ""; go(1); });

  fillLevels(); fillSlots(); updateHint(false); setNextLabel();
  prev.style.visibility = "hidden";
  if (W.I18N) W.I18N.on(() => { fillLevels(); fillSlots(); updateHint(false); setNextLabel(); err.textContent = ""; if (step === 5) recap(); });
})();
