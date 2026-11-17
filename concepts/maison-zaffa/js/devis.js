/* Maison Zaffa : estimation en direct et demande de date (démonstration, rien n'est envoyé). */
(function () {
  "use strict";
  const D = document, $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const T = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const M = (n) => (window.I18N ? I18N.money(n) : Math.round(n) + " MAD");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const form = $("#dv"); if (!form) return;
  const range = $("#dvGuests"), out = $("#dvGuestsOut");

  function render() {
    const g = +range.value;
    const tierEl = $('input[name="tier"]:checked', form), tier = +tierEl.value;
    const seasonEl = $('input[name="season"]:checked', form), season = +seasonEl.value;
    const opts = $$('input[name="opt"]:checked', form);
    const base = g * tier * season, add = opts.reduce((s, o) => s + +o.value, 0), total = base + add;
    out.textContent = g;
    $$("[data-pp]").forEach((i) => { i.textContent = T("js.pp", { v: M(+i.dataset.pp) }); });
    $("#sumTotal").textContent = M(total);
    $("#sumPer").textContent = T("js.perGuest", { v: M(total / g) });
    const tName = $("b", tierEl.nextElementSibling).textContent;
    const sName = seasonEl.nextElementSibling.textContent;
    const lines = [[T("js.line", { t: tName, g: g }) + " · " + sName, base]];
    opts.forEach((o) => lines.push([o.nextElementSibling.textContent, +o.value]));
    $("#sumLines").innerHTML = lines.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(M(b))}</span></li>`).join("");
  }
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  render();

  /* Demande de date */
  const df = $("#date"), day = $("#dDay"), name = $("#dName"), contact = $("#dContact"), msg = $("#dMsg");
  const iso = (d) => d.toISOString().slice(0, 10);
  const now = new Date();
  day.min = iso(new Date(now.getTime() + 30 * 864e5));
  day.max = iso(new Date(now.getTime() + 3 * 365 * 864e5));
  let lastOk = null;

  function check(el, ok) { el.setAttribute("aria-invalid", ok ? "false" : "true"); return ok; }
  function okMsg() {
    if (!lastOk) return;
    const d = new Date(lastOk.day + "T12:00:00");
    const ds = new Intl.DateTimeFormat(I18N.locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
    msg.textContent = T("js.ok", { n: lastOk.name, d: ds, g: range.value });
  }
  df.addEventListener("submit", (e) => {
    e.preventDefault();
    lastOk = null;
    const v = contact.value.trim();
    const okDay = check(day, !!day.value && day.value >= day.min);
    const okName = check(name, name.value.trim().length > 1);
    const okContact = check(contact, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[+\d][\d\s.]{7,}$/.test(v));
    if (!okDay) { msg.textContent = T("js.errDay"); day.focus(); return; }
    if (!okName) { msg.textContent = T("js.errName"); name.focus(); return; }
    if (!okContact) { msg.textContent = T("js.errContact"); contact.focus(); return; }
    lastOk = { day: day.value, name: name.value.trim() };
    okMsg();
  });

  if (window.I18N) I18N.on(() => { render(); if (lastOk) okMsg(); else msg.textContent = ""; });
})();
