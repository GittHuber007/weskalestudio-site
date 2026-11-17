/* Nuage : demande de visite et de pré-inscription. Démonstration, rien n'est envoyé. */
(function () {
  "use strict";
  const D = document, $ = (s) => D.querySelector(s), $$ = (s) => Array.from(D.querySelectorAll(s));
  const I = window.I18N;
  const form = $("#vf"); if (!form || !I) return;

  const state = { mode: "visit", day: null, time: null, week: new Set([0, 1, 3, 4]) };
  const TIMES = ["vf.t1", "vf.t2"];

  // Les 8 prochains jours ouvrés, à partir de demain.
  function nextWeekdays(n) {
    const out = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w > 0 && w < 6) out.push(new Date(d)); }
    return out;
  }
  const days = nextWeekdays(8);
  const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

  function chip(label, pressed, attrs) {
    const b = D.createElement("button");
    b.type = "button"; b.className = "chip"; b.innerHTML = label;
    Object.keys(attrs).forEach((k) => b.setAttribute(k, attrs[k]));
    b.setAttribute(attrs.role === "radio" ? "aria-checked" : "aria-pressed", String(pressed));
    return b;
  }

  function render() {
    const loc = I.locale;
    const wk = new Intl.DateTimeFormat(loc, { weekday: "short" });
    const dm = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" });
    const dayBox = $("#vfDays"); dayBox.innerHTML = "";
    days.forEach((d) => {
      const k = iso(d);
      const b = chip(`<span>${wk.format(d)}</span><b>${dm.format(d)}</b>`, state.day === k, { role: "radio", "data-day": k });
      b.addEventListener("click", () => { state.day = k; render(); });
      dayBox.appendChild(b);
    });
    const timeBox = $("#vfTimes"); timeBox.innerHTML = "";
    TIMES.forEach((t) => {
      const b = chip(I.t(t), state.time === t, { role: "radio", "data-time": t });
      b.addEventListener("click", () => { state.time = t; render(); });
      timeBox.appendChild(b);
    });

    // Jours d'accueil : lundi à vendredi, dans la langue choisie.
    const weekBox = $("#vfWeek"); weekBox.innerHTML = "";
    const monday = new Date(2026, 10, 16, 12);
    const longWk = new Intl.DateTimeFormat(loc, { weekday: "short" });
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const b = chip(longWk.format(d), state.week.has(i), { "data-wd": String(i) });
      b.addEventListener("click", () => { state.week.has(i) ? state.week.delete(i) : state.week.add(i); render(); });
      weekBox.appendChild(b);
    }

    // Entrée souhaitée : les 12 prochains mois.
    const sel = $("#vfStart"), keep = sel.value;
    const my = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" });
    sel.innerHTML = "";
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1, 12);
      const o = D.createElement("option"); o.value = iso(d); o.textContent = my.format(d); sel.appendChild(o);
    }
    if (keep) sel.value = keep;

    $$(".vf__tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.mode === state.mode)));
    $$(".vf__panel").forEach((p) => { p.hidden = p.dataset.panel !== state.mode; });
    $("#vfSubmit").textContent = I.t(state.mode === "visit" ? "vf.sendVisit" : "vf.sendEnrol");
  }

  $$(".vf__tab").forEach((t) => t.addEventListener("click", () => { state.mode = t.dataset.mode; $("#vfErr").textContent = ""; render(); }));

  function fail(key) { $("#vfErr").textContent = I.t(key); return false; }

  function validate() {
    if (state.mode === "visit") {
      if (!state.day || !state.time) return fail("vf.errSlot");
    } else {
      const dob = $("#vfDob").value;
      if (!dob) return fail("vf.errDob");
      const start = new Date($("#vfStart").value), birth = new Date(dob + "T12:00:00");
      const limit = new Date(birth); limit.setFullYear(birth.getFullYear() + 3);
      if (start > limit) return fail("vf.errAge");
      if (!state.week.size) return fail("vf.errWeek");
    }
    if (!$("#vfName").value.trim()) return fail("vf.errName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#vfMail").value.trim())) return fail("vf.errMail");
    $("#vfErr").textContent = "";
    return true;
  }

  let last = null;
  function summary() {
    if (!last) return;
    const loc = I.locale;
    $("#vfDoneH").textContent = I.t("vf.thanks", { name: last.name });
    if (last.mode === "visit") {
      const day = new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }).format(new Date(last.day + "T12:00:00"));
      $("#vfDoneP").textContent = I.t("vf.sumVisit", { day, time: I.t(last.time) });
    } else {
      const start = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(new Date(last.start + "T12:00:00"));
      const wk = new Intl.DateTimeFormat(loc, { weekday: "long" });
      const list = last.week.map((i) => wk.format(new Date(2026, 10, 16 + i, 12))).join(", ");
      const n = last.week.length;
      $("#vfDoneP").textContent = I.t("vf.sumEnrol", { start, days: n + " " + I.t(n > 1 ? "vf.dayN" : "vf.day1"), list });
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    last = {
      mode: state.mode, name: $("#vfName").value.trim(), day: state.day, time: state.time,
      start: $("#vfStart").value, week: Array.from(state.week).sort(),
    };
    summary();
    form.classList.add("is-done");
    $("#vfDone").hidden = false;
    $("#vfDoneH").setAttribute("tabindex", "-1");
    $("#vfDoneH").focus({ preventScroll: true });
  });

  $("#vfAgain").addEventListener("click", () => {
    form.reset(); last = null; state.day = null; state.time = null; state.week = new Set([0, 1, 3, 4]);
    form.classList.remove("is-done"); $("#vfDone").hidden = true; render();
  });

  I.on(() => { render(); summary(); });
  render();
})();
