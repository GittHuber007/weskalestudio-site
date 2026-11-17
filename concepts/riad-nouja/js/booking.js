/* Riad Nouja : chambres et réservation directe de démonstration, en anglais et en français. Prix d'exemple, aucune donnée envoyée. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const lang = () => (window.I18N ? I18N.lang : "en");

  const ROOMS = [
    { cap: 2, m2: 26, p: 140 },
    { cap: 3, m2: 38, p: 190 },
    { cap: 2, m2: 30, p: 165 },
    { cap: 2, m2: 42, p: 240 },
  ];
  const TXT = {
    en: {
      locale: "en-GB",
      rooms: [
        ["Saffron Room", "Rose tadelakt walls, a low bed in white linen and a painted cedar ceiling. Light comes in through a mashrabiya screen."],
        ["Zellige Suite", "Green zellige wainscot, a brass lantern and an arched alcove with a daybed."],
        ["Hammam Room", "A bathtub carved into ochre tadelakt, with a small arched window onto the courtyard."],
        ["Terrace Suite", "On the roof, with its own private terrace and potted olive trees. The Atlas in the distance on clear mornings."],
      ],
      dow: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      night: "per night", choose: "Choose", guests: (n) => `${n} guests`, sizeLine: (r) => `${r.m2} m² · ${r.cap} guests`,
      full: "fully booked", taken: "Already booked on these dates", tooSmall: (n) => `${n} guests at most`,
      perPerson: "per person",
      pickArrival: "Choose an arrival date.", pickDeparture: (a) => `Arrival ${a}. Now choose your departure.`, range: (a, b) => `${a} to ${b}`,
      people: (ad, ch) => `${ad} adult${ad > 1 ? "s" : ""}${ch ? `, ${ch} child${ch > 1 ? "ren" : ""}` : ""}`,
      nights: (n) => `${n} night${n > 1 ? "s" : ""}`,
      pickDates: "Choose your dates", pickRoom: "Choose a room", tax: "Sample tourist tax", total: "Total",
      blocked: "The riad is fully booked on one of those nights. Your arrival date has been reset.",
      tooLong: "Online bookings are limited to fourteen nights.",
      needDates: "Choose an arrival date, then a departure date.", needRoom: "Choose an available room.",
      needWho: "Please enter your name and a valid email address.",
      done: "Demonstration booking confirmed",
      doneTxt: (room, a, b, tot, ref) => `${room}, ${a} to ${b}, ${tot}. Reference ${ref}. In the real version, the confirmation is sent by email and the stay is paid on arrival.`,
    },
    fr: {
      locale: "fr-FR",
      rooms: [
        ["Chambre Safran", "Tadelakt rose, lit bas en lin blanc, plafond de cèdre peint. La lumière passe par un moucharabieh."],
        ["Suite Zellige", "Soubassement de zellige vert, lanterne de laiton et alcôve en arche avec banquette de jour."],
        ["Chambre Hammam", "Baignoire creusée dans le tadelakt ocre, petite fenêtre en arche sur le patio."],
        ["Suite Terrasse", "Sur le toit, avec sa terrasse privée et ses oliviers en pot. L'Atlas au loin, les matins clairs."],
      ],
      dow: ["lu", "ma", "me", "je", "ve", "sa", "di"],
      night: "la nuit", choose: "Choisir", guests: (n) => `${n} pers.`, sizeLine: (r) => `${r.m2} m² · ${r.cap} pers.`,
      full: "complet", taken: "Déjà réservée sur ces dates", tooSmall: (n) => `${n} personnes au plus`,
      perPerson: "par personne",
      pickArrival: "Choisissez une date d'arrivée.", pickDeparture: (a) => `Arrivée ${a}. Choisissez le départ.`, range: (a, b) => `${a} au ${b}`,
      people: (ad, ch) => `${ad} adulte${ad > 1 ? "s" : ""}${ch ? `, ${ch} enfant${ch > 1 ? "s" : ""}` : ""}`,
      nights: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
      pickDates: "Choisissez vos dates", pickRoom: "Choisissez une chambre", tax: "Taxe de séjour d'exemple", total: "Total",
      blocked: "Le riad est complet une des nuits choisies. Votre date d'arrivée a été remplacée.",
      tooLong: "Quatorze nuits au plus en réservation en ligne.",
      needDates: "Choisissez une date d'arrivée, puis une date de départ.", needRoom: "Choisissez une chambre disponible.",
      needWho: "Indiquez votre nom et une adresse e-mail valide.",
      done: "Réservation de démonstration confirmée",
      doneTxt: (room, a, b, tot, ref) => `${room}, ${a} au ${b}, ${tot}. Référence ${ref}. Dans la version réelle, la confirmation part par e-mail et le séjour se règle à l'arrivée.`,
    },
  };
  const T = () => TXT[lang()];
  const TAX = 2.5; // taxe de séjour d'exemple, par adulte et par nuit
  const MAX_NIGHTS = 14;
  const eur = (v) => {
    const n = (Math.round(v * 100) / 100).toLocaleString(T().locale, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).replace(/[  ]/g, " ");
    return lang() === "fr" ? n + " €" : "€" + n;
  };
  const longDate = (d) => new Intl.DateTimeFormat(T().locale, { weekday: "short", day: "numeric", month: "long" }).format(d);
  const monthName = (d) => new Intl.DateTimeFormat(T().locale, { month: "long", year: "numeric" }).format(d);
  const day0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const key = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967295; };
  const fullDay = (d) => hash(key(d)) < 0.07;
  const roomTaken = (r, d) => hash(key(d) * 7 + r * 131) < 0.16;

  const today = day0(new Date());
  const st = { a: null, b: null, room: -1, ad: 2, ch: 0, step: 0, msg: null, done: false, view: new Date(today.getFullYear(), today.getMonth(), 1) };
  const nights = () => (st.a && st.b ? Math.round((st.b - st.a) / 864e5) : 0);
  const eachNight = (fn) => { if (!nights()) return; const d = new Date(st.a); while (d < st.b) { fn(new Date(d)); d.setDate(d.getDate() + 1); } };
  const roomName = (i) => T().rooms[i][0];

  function renderRoomList() {
    const list = $("#roomList"); if (!list) return;
    const t = T();
    list.innerHTML = ROOMS.map((r, i) => `<li class="room">
      <span class="room__n">0${i + 1}</span>
      <h3 class="room__t">${t.rooms[i][0]}</h3>
      <span class="room__p">${eur(r.p)} <small>${t.night}</small></span>
      <p class="room__d">${t.rooms[i][1]}</p>
      <span class="room__m">${t.sizeLine(r)}</span>
      <button type="button" class="room__go" data-room="${i}">${t.choose}</button>
    </li>`).join("");
  }

  function scrollToBook() {
    const el = $("#reserver");
    if (window.RIAD && RIAD.lenis) RIAD.lenis.scrollTo(el, { duration: 1.6, offset: -40 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  function go(n) {
    st.step = n;
    $$(".bk__step").forEach((f) => f.classList.toggle("is-on", +f.dataset.step === n));
    $$(".bk__tabs button").forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.go === n)));
  }

  function renderCal() {
    const t = T();
    $("#calDow").innerHTML = t.dow.map((d) => `<span>${d}</span>`).join("");
    $("#calLabel").textContent = monthName(st.view);
    $("#calPrev").disabled = st.view <= new Date(today.getFullYear(), today.getMonth(), 1);
    const first = new Date(st.view), lead = (first.getDay() + 6) % 7;
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < lead; i++) html += "<span></span>";
    for (let d = 1; d <= count; d++) {
      const x = new Date(first.getFullYear(), first.getMonth(), d);
      const past = x < today, off = !past && fullDay(x);
      const cls = [off ? "off" : "", st.a && +x === +st.a ? "a" : "", st.b && +x === +st.b ? "b" : "", st.a && st.b && x > st.a && x < st.b ? "in" : ""].join(" ").trim();
      html += `<button type="button" data-t="${+x}" class="${cls}" aria-label="${longDate(x)}${off ? ", " + t.full : ""}" ${past || off ? "disabled" : ""}>${d}</button>`;
    }
    $("#calDays").innerHTML = html;
  }

  function renderRooms() {
    const t = T(), guests = st.ad + st.ch;
    $("#bkRooms").innerHTML = ROOMS.map((r, i) => {
      let taken = false; eachNight((d) => { if (roomTaken(i, d)) taken = true; });
      const small = guests > r.cap, dis = taken || small;
      if (dis && st.room === i) st.room = -1;
      const note = taken ? t.taken : small ? t.tooSmall(r.cap) : t.sizeLine(r);
      return `<button type="button" role="radio" aria-checked="${st.room === i}" data-i="${i}" ${dis ? "disabled" : ""}><span><b>${t.rooms[i][0]}</b><small>${note}</small></span><span>${eur(r.p)}</span></button>`;
    }).join("");
  }

  function renderExtras() {
    $$(".bk__extras input").forEach((c) => {
      const i = c.parentElement.querySelector("i");
      i.textContent = eur(+c.dataset.price) + (c.dataset.per === "person" ? " " + T().perPerson : "");
    });
  }

  function renderSum() {
    const t = T(), n = nights(), persons = st.ad + st.ch;
    $("#sumDates").textContent = !st.a ? t.pickArrival : !st.b ? t.pickDeparture(longDate(st.a)) : t.range(longDate(st.a), longDate(st.b));
    const rows = [[t.people(st.ad, st.ch), n ? t.nights(n) : ""]];
    let tot = 0;
    if (n && st.room >= 0) {
      const r = ROOMS[st.room];
      rows.push([`${roomName(st.room)} · ${n} × ${eur(r.p)}`, r.p * n]);
      $$(".bk__extras input:checked").forEach((c) => {
        rows.push([c.parentElement.querySelector("[data-i18n]").textContent.trim(), +c.dataset.price * (c.dataset.per === "person" ? persons : 1)]);
      });
      rows.push([t.tax, TAX * st.ad * n]);
      tot = rows.slice(1).reduce((a, x) => a + x[1], 0);
    } else rows.push([n ? t.pickRoom : t.pickDates, ""]);
    $("#sumRows").innerHTML = rows.map(([l, v]) => `<div class="row"><span>${l}</span><span>${typeof v === "number" ? eur(v) : v}</span></div>`).join("") +
      (tot ? `<div class="row tot"><span>${t.total}</span><span>${eur(tot)}</span></div>` : "");
    return tot;
  }

  function renderGuests() {
    $("#bkAd").textContent = st.ad; $("#bkCh").textContent = st.ch;
    $$("[data-step-btn]").forEach((b) => {
      const k = b.dataset.stepBtn, d = +b.dataset.d, v = st[k] + d, tot = st.ad + st.ch + d;
      b.disabled = (k === "ad" ? v < 1 : v < 0) || (d > 0 && tot > 4);
    });
  }

  // Message : gardé sous forme de clé pour suivre le changement de langue.
  function say(k) { st.msg = k; st.done = false; renderMsg(); }
  function renderMsg() {
    const m = $("#bkMsg"), t = T();
    if (st.done) {
      const tot = renderSum(), ref = "NJ " + String(Math.floor(1000 + hash(key(st.a) + st.room) * 8999));
      m.innerHTML = `<strong>${t.done}</strong>${t.doneTxt(roomName(st.room), longDate(st.a), longDate(st.b), eur(tot), ref)}`;
    } else m.textContent = st.msg ? t[st.msg] : "";
  }

  function update() { renderCal(); renderRooms(); renderGuests(); renderSum(); }
  function renderAll() { renderRoomList(); renderExtras(); update(); renderMsg(); }

  function init() {
    if (!$("#bk")) return;
    $("#roomList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-room]"); if (!b) return;
      st.room = +b.dataset.room; say(null);
      go(nights() ? 1 : 0); update(); scrollToBook();
    });
    $("#calDays").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      const d = new Date(+b.dataset.t);
      say(null);
      if (!st.a || st.b || d <= st.a) { st.a = d; st.b = null; }
      else {
        let blocked = false; const x = new Date(st.a); while (x < d) { if (fullDay(x)) blocked = true; x.setDate(x.getDate() + 1); }
        if (blocked) { st.a = d; st.b = null; say("blocked"); }
        else if ((d - st.a) / 864e5 > MAX_NIGHTS) { say("tooLong"); return; }
        else st.b = d;
      }
      update();
    });
    $("#calPrev").addEventListener("click", () => { st.view = new Date(st.view.getFullYear(), st.view.getMonth() - 1, 1); renderCal(); });
    $("#calNext").addEventListener("click", () => { st.view = new Date(st.view.getFullYear(), st.view.getMonth() + 1, 1); renderCal(); });
    $$("[data-step-btn]").forEach((b) => b.addEventListener("click", () => { st[b.dataset.stepBtn] += +b.dataset.d; update(); }));
    $("#bkRooms").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || b.disabled) return; st.room = +b.dataset.i; say(null); update(); });
    $$(".bk__extras input").forEach((c) => c.addEventListener("change", renderSum));

    const check = (n) => {
      if (n >= 1 && !nights()) { go(0); say("needDates"); return false; }
      if (n >= 2 && st.room < 0) { go(1); say("needRoom"); return false; }
      say(null); return true;
    };
    $$("[data-next]").forEach((b) => b.addEventListener("click", () => { const n = +b.dataset.next; if (check(n)) go(n); }));
    $$(".bk__tabs button").forEach((b) => b.addEventListener("click", () => { const n = +b.dataset.go; if (check(n)) go(n); }));

    $("#bk").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!check(2)) return;
      const name = $("#bkName").value.trim(), mail = $("#bkMail").value.trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { say("needWho"); return; }
      st.done = true; renderMsg();
    });

    if (window.I18N) I18N.on(renderAll);
    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
