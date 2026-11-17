/* Saffra : réservation de table, en démonstration. Rien n'est envoyé. */
(function () {
  "use strict";
  const D = document, $ = (s) => D.querySelector(s);
  const form = $("#rs"); if (!form) return;
  const T = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const loc = () => (window.I18N ? I18N.locale : "en-GB");
  const TIMES = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
  const st = { day: null, time: null, guests: 2 };

  // Les 8 prochains soirs de service (fermé le lundi).
  const days = [];
  const d = new Date(); d.setHours(12, 0, 0, 0);
  while (days.length < 8) { if (d.getDay() !== 1) days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  // Quelques créneaux complets, déterministes pour la démonstration.
  const full = (di, ti) => (di * 3 + ti * 5) % 11 === 0;

  function fmtDay(dt, long) {
    return new Intl.DateTimeFormat(loc(), long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short" }).format(dt);
  }
  function fmtTime(t) {
    const [h, m] = t.split(":").map(Number);
    if (loc().startsWith("fr")) return h + " h" + (m ? " " + String(m).padStart(2, "0") : "");
    return new Intl.DateTimeFormat(loc(), { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, h, m));
  }

  function renderDays() {
    $("#rsDays").innerHTML = days.map((dt, i) =>
      `<button type="button" class="chip" role="radio" aria-checked="${st.day === i}" data-day="${i}"><small>${fmtDay(dt)}</small>${dt.getDate()}</button>`).join("");
  }
  function renderTimes() {
    $("#rsTimes").innerHTML = TIMES.map((t, i) => {
      const off = st.day != null && full(st.day, i);
      return `<button type="button" class="chip" role="radio" aria-checked="${st.time === i}" data-time="${i}" ${off ? "disabled" : ""}>${fmtTime(t)}${off ? `<small>${T("js.full")}</small>` : ""}</button>`;
    }).join("");
  }
  function sum() {
    const g = st.guests + " " + T(st.guests > 1 ? "js.guestN" : "js.guest1");
    $("#rsSum").innerHTML = st.day == null || st.time == null
      ? `<em>${g}</em> · ${T("js.pickDay")}`
      : `<em>${g}</em> · ${fmtDay(days[st.day], true)} ${T("js.at")} ${fmtTime(TIMES[st.time])}`;
  }
  function render() { renderDays(); renderTimes(); sum(); $("#rsGuests").textContent = st.guests; }

  form.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.day != null) { st.day = +b.dataset.day; if (st.time != null && full(st.day, st.time)) st.time = null; render(); $("#rsMsg").textContent = ""; }
    else if (b.dataset.time != null && !b.disabled) { st.time = +b.dataset.time; render(); $("#rsMsg").textContent = ""; }
    else if (b.dataset.g) { st.guests = Math.min(10, Math.max(1, st.guests + +b.dataset.g)); render(); }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#rsName").value.trim();
    if (st.day == null || st.time == null) { $("#rsMsg").textContent = T("js.needSlot"); return; }
    if (!name) { $("#rsMsg").textContent = T("js.needName"); $("#rsName").focus(); return; }
    const safe = name.replace(/[<>&"]/g, "");
    $("#rsDoneH").textContent = T("js.doneH", { name: safe });
    $("#rsDoneP").textContent = T("js.doneP", { g: st.guests + " " + T(st.guests > 1 ? "js.guestN" : "js.guest1"), day: fmtDay(days[st.day], true), time: fmtTime(TIMES[st.time]) });
    form.hidden = true; $("#rsDone").hidden = false;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
  $("#rsAgain").addEventListener("click", () => { $("#rsDone").hidden = true; form.hidden = false; if (window.ScrollTrigger) ScrollTrigger.refresh(); });

  if (window.I18N) I18N.on(() => { render(); if (!$("#rsDone").hidden) form.dispatchEvent(new Event("submit", { cancelable: true })); });
  render();
})();
