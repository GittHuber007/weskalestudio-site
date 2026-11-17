/* Rendezia : SaaS fictif d'agenda pour cabinets de sante, concept Weskale Studio.
   Ouverture : l'interface du produit mise en scene en grand, en profondeur, pilotee par le defilement.
   Une soiree dans l'agenda : il se remplit, les rappels partent, une annulation est reprise. */
(function () {
  "use strict";
  const X = window.WX, I = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ================= Donnees d'exemple (fictives) ================= */
  const DAYS = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"];
  const H0 = 480, H1 = 840; // grille de 8 h a 14 h
  // day : index du jour, s : debut en minutes, d : duree, p : praticien (a Dr Morel, b J. Petit)
  // on : heure de reservation en ligne pendant la soiree (minutes), absent = deja dans l'agenda
  const EV = [
    { id: "camille", day: 0, s: 480, d: 60, p: "a", n: "Camille R.", t: "first" },
    { id: "leo", day: 0, s: 600, d: 30, p: "b", n: "Léo D.", t: "follow" },
    { id: "sarah", day: 0, s: 720, d: 60, p: "a", n: "Sarah K.", t: "session" },
    { id: "hugo", day: 1, s: 570, d: 30, p: "b", n: "Hugo T.", t: "follow", sms: 1 },
    { id: "ines", day: 1, s: 600, d: 60, p: "a", n: "Inès B.", t: "first", on: 1334, sms: 2 },
    { id: "nora", day: 1, s: 750, d: 60, p: "b", n: "Nora L.", t: "first", on: 1385, sms: 3 },
    { id: "paul", day: 2, s: 480, d: 30, p: "a", n: "Paul M.", t: "session" },
    { id: "marc", day: 2, s: 630, d: 60, p: "a", n: "Marc V.", t: "session", cancel: 1 },
    { id: "zoe", day: 2, s: 630, d: 60, p: "a", n: "Zoé F.", t: "first", wait: 1 },
    { id: "alix", day: 2, s: 750, d: 30, p: "b", n: "Alix G.", t: "follow", on: 1298 },
    { id: "emma", day: 3, s: 540, d: 60, p: "b", n: "Emma P.", t: "session" },
    { id: "yanis", day: 3, s: 660, d: 30, p: "a", n: "Yanis C.", t: "follow", on: 1272 },
    { id: "adam", day: 3, s: 750, d: 60, p: "b", n: "Adam S.", t: "first", on: 1361 },
    { id: "lucas", day: 4, s: 480, d: 90, p: "a", n: "Lucas H.", t: "long" },
    { id: "jade", day: 4, s: 630, d: 60, p: "b", n: "Jade M.", t: "session", on: 1315 },
    { id: "rayan", day: 4, s: 750, d: 30, p: "a", n: "Rayan K.", t: "follow", on: 1407 },
  ];
  const PRAC = { a: { n: "Dr Morel", k: "bk.osteo" }, b: { n: "J. Petit", k: "bk.physio" } };
  const pct = (m) => ((m - H0) / (H1 - H0)) * 100;

  /* ================= Interface de l'ouverture ================= */
  function buildApp() {
    const times = $(".cal__times"), days = $(".cal__days");
    for (let m = H0; m < H1; m += 60) times.insertAdjacentHTML("beforeend", `<span style="top:${pct(m)}%" data-time="${m}"></span>`);
    DAYS.forEach((iso, i) => {
      const col = document.createElement("div");
      col.className = "day" + (i === 0 ? " day--today" : "");
      col.dataset.i = i;
      col.innerHTML = `<p class="day__h"><span data-date="${iso}" data-fmt="wd"></span> <b data-date="${iso}" data-fmt="dnum"></b></p><div class="day__b"></div>`;
      const body = col.querySelector(".day__b");
      EV.filter((e) => e.day === i).forEach((e) => {
        const el = document.createElement("div");
        el.className = `ev ev--${e.p}` + (e.on ? " ev--on" : "") + (e.cancel ? " ev--cancel" : "") + (e.wait ? " ev--wait" : "") + (e.d <= 30 ? " ev--s" : "");
        el.dataset.id = e.id;
        el.style.top = pct(e.s) + "%";
        el.style.height = `calc(${(e.d / (H1 - H0)) * 100}% - 3px)`;
        const tag = e.on ? `<em class="ev__tag" data-i18n="app.online.tag"></em>` : e.wait ? `<em class="ev__tag" data-i18n="app.wait.tag"></em>` : "";
        el.innerHTML = `<b>${e.n}</b><small><span data-time="${e.s}"></span> · <span data-i18n="type.${e.t}"></span></small>${tag}${e.sms ? '<i class="ev__ok" aria-hidden="true"></i>' : ""}`;
        body.appendChild(el);
      });
      days.appendChild(col);
    });
  }

  /* ================= Le plan pilote par le defilement ================= */
  const Film = {
    init() {
      const film = $(".film");
      if (!X.anim) { film.classList.add("is-static"); return; }
      const vw = () => innerWidth, vh = () => innerHeight;
      const mob = () => X.mobile();
      const rig = $(".rig"), clockEl = $(".cal__clock");
      const ev = (id) => $(`.ev[data-id="${id}"]`);
      const clock = { m: 1260 };
      // L'heure n'est reecrite que si elle change : sinon toute la fenetre se repeint a chaque image
      let shownClock = "";
      const setClock = (e) => { const v = I.time(Math.round(clock.m)); if (v !== shownClock || (e && e.type)) { shownClock = v; clockEl.textContent = v; } };
      document.addEventListener("langchange", setClock);
      setClock();

      // Poses de la camera sur l'interface
      const P = {
        hero: () => ({ x: 0, y: mob() ? vh() * 0.5 : vh() * 0.47, scale: mob() ? 0.96 : 0.9, rotateX: mob() ? 26 : 34, rotateY: 0 }),
        chap: () => (mob() ? { x: 0, y: vh() * 0.1, scale: 1, rotateX: 10, rotateY: 0 } : { x: vw() * 0.22, y: vh() * 0.02, scale: 0.9, rotateX: 6, rotateY: 15 }),
        chap3: () => (mob() ? { x: 0, y: vh() * 0.1, scale: 1, rotateX: 10, rotateY: 0 } : { x: vw() * 0.2, y: vh() * 0.02, scale: 0.92, rotateX: 4, rotateY: -9 }),
        out: () => ({ x: 0, y: mob() ? -vh() * 0.02 : -vh() * 0.04, scale: mob() ? 0.92 : 0.8, rotateX: 0, rotateY: 0 }),
      };
      gsap.set(rig, Object.assign({ xPercent: -50, yPercent: -50 }, P.hero()));

      const online = EV.filter((e) => e.on).sort((a, b) => a.on - b.on);
      const chaps = $$(".chap");
      gsap.set(chaps, { yPercent: mob() ? 0 : -50 });
      const cardIn = { opacity: 1, z: 0, y: 0, scale: 1, duration: 3, ease: "power3.out" };
      const cardOut = { opacity: 0, y: -24, duration: 2.4, ease: "power2.in" };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: film, start: "top top", end: () => "+=" + vh() * (mob() ? 3 : 4),
          pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => film.classList.toggle("is-on", s.progress > 0.01),
        },
      });

      // 0 a 12 : le titre s'efface, l'interface se redresse et vient au premier plan
      tl.to(".hero", { y: () => -vh() * 0.16, opacity: 0, duration: 8, ease: "power1.in" }, 0)
        .to(".film__hint", { opacity: 0, duration: 3 }, 0)
        .to(rig, Object.assign({ duration: 14, ease: "power2.inOut" }, { x: () => P.chap().x, y: () => P.chap().y, scale: () => P.chap().scale, rotateX: () => P.chap().rotateX, rotateY: () => P.chap().rotateY }), 0)
        .to(".light__beam", { opacity: 0.55, scaleX: 0.8, duration: 14 }, 0)
        .to(".veil", { opacity: 1, duration: 6 }, 8);

      // Chapitre 1 : la soiree, les reservations en ligne arrivent
      const chapIn = (i, at) => tl.fromTo(chaps[i], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 3, ease: "power2.out" }, at);
      const chapOut = (i, at) => tl.to(chaps[i], { opacity: 0, y: -30, duration: 3, ease: "power2.in" }, at);
      chapIn(0, 11);
      tl.to(clock, { m: 1420, duration: 28, onUpdate: setClock }, 13);
      online.forEach((e, k) => {
        const at = 13 + ((e.on - 1260) / 160) * 28;
        tl.fromTo(ev(e.id), { opacity: 0, scale: 0.7, z: 120 }, { opacity: 1, scale: 1, z: 0, duration: 2.2, ease: "back.out(1.6)" }, at);
        if (e.id === "ines") {
          tl.fromTo(ev("ines"), { "--hl": 0 }, { "--hl": 1, duration: 1.5 }, at + 0.5)
            .fromTo(".card--book", { opacity: 0, z: -60, y: 40, scale: 0.9 }, cardIn, at + 1)
            .to(".card--book", cardOut, at + 9)
            .to(ev("ines"), { "--hl": 0, duration: 2 }, at + 9);
        }
      });
      chapOut(0, 40);

      // Chapitre 2 : les rappels partent, un par un, et sortent de l'ecran vers nous
      chapIn(1, 43);
      [1, 2, 3].forEach((n, k) => {
        const at = 45 + k * 5;
        const e = EV.find((x) => x.sms === n);
        tl.fromTo(`.sms--${n}`, { opacity: 0, z: -80, y: 50, scale: 0.85 }, Object.assign({}, cardIn, { z: 40 + k * 50 }), at)
          .fromTo(`.sms--${n} .sms__yes`, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 1.6, ease: "power2.out" }, at + 2.4)
          .fromTo(`.sms--${n} .sms__ok`, { opacity: 0 }, { opacity: 1, duration: 1.2 }, at + 3.4)
          .fromTo(ev(e.id).querySelector(".ev__ok"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "back.out(2)" }, at + 3.6);
      });
      tl.to(".sms", Object.assign({}, cardOut, { stagger: 0.6 }), 64);
      chapOut(1, 64);

      // Chapitre 3 : une annulation, reprise par la liste d'attente
      tl.to(rig, { x: () => P.chap3().x, y: () => P.chap3().y, scale: () => P.chap3().scale, rotateX: () => P.chap3().rotateX, rotateY: () => P.chap3().rotateY, duration: 8, ease: "power2.inOut" }, 64);
      chapIn(2, 68);
      tl.fromTo(ev("zoe"), { opacity: 0, scale: 0.6, z: 160 }, { opacity: 0, scale: 0.6, z: 160, duration: 0.1 }, 0)
        .to(ev("marc"), { "--x": 1, duration: 2 }, 70)
        .fromTo(".card--cancel", { opacity: 0, z: -60, y: 40, scale: 0.9 }, cardIn, 70.5)
        .to(ev("marc"), { opacity: 0, scale: 0.92, duration: 2.5 }, 75)
        .to(".card--cancel", cardOut, 76)
        .fromTo(".card--wait", { opacity: 0, z: -60, y: 40, scale: 0.9 }, cardIn, 77)
        .to(ev("zoe"), { opacity: 1, scale: 1, z: 0, duration: 3, ease: "back.out(1.4)" }, 79)
        .fromTo(ev("zoe"), { "--hl": 0 }, { "--hl": 1, duration: 1.5 }, 81)
        .to(".card--wait", cardOut, 87)
        .to(ev("zoe"), { "--hl": 0, duration: 2 }, 88);
      chapOut(2, 87);

      // Sortie : l'interface recule, une phrase de fin
      tl.to(rig, { x: () => P.out().x, y: () => P.out().y, scale: () => P.out().scale, rotateX: 0, rotateY: 0, duration: 9, ease: "power2.inOut" }, 89)
        .to(".veil", { opacity: 0, duration: 6 }, 89)
        .fromTo(".film__out", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 4, ease: "power2.out" }, 94)
        .to({}, { duration: 2 }, 98)
        .fromTo(".film__bar i", { scaleX: 0 }, { scaleX: 1, duration: 100 }, 0);

      this.tl = tl;

      // Lumiere qui suit doucement la souris
      if (!X.touch) {
        const qx = gsap.quickTo(".light", "x", { duration: 1.6, ease: "power3.out" });
        const qy = gsap.quickTo(".scene", "y", { duration: 1.6, ease: "power3.out" });
        const qz = gsap.quickTo(".scene", "x", { duration: 1.6, ease: "power3.out" });
        addEventListener("pointermove", (e) => {
          const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
          qx(nx * 60); qz(nx * -14); qy(ny * -10);
        }, { passive: true });
      }
    },
  };

  /* ================= Demo interactive : reserver comme un patient ================= */
  const Demo = {
    st: { prac: "a", type: "first", day: 1, slot: null, mine: [], done: false },
    init() {
      this.bk = $(".bk"); this.pr = $(".pr");
      this.go = $(".bk__go");
      this.base = EV.filter((e) => !e.cancel).map((e) => Object.assign({}, e));
      this.bk.addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (!b || b.disabled) return;
        const g = b.parentElement.dataset.g, v = b.dataset.v;
        if (g === "prac") this.st.prac = v;
        if (g === "type") this.st.type = v;
        if (g === "day") this.st.day = +v;
        if (g !== "slot") this.st.slot = null;
        else this.st.slot = +v;
        this.st.done = false;
        this.render();
      });
      // Fleches du clavier dans chaque groupe de choix
      this.bk.addEventListener("keydown", (e) => {
        const b = e.target.closest("[data-v]");
        if (!b || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
        const list = [...b.parentElement.querySelectorAll("[data-v]:not([disabled])")];
        const k = list.indexOf(b) + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
        const nb = list[(k + list.length) % list.length];
        if (nb) { e.preventDefault(); nb.click(); const g = nb.parentElement.dataset.g; const f = $(`[data-g="${g}"] [aria-checked="true"]`, this.bk); f && f.focus(); }
      });
      this.go.addEventListener("click", () => this.book());
      $(".pr__reset").addEventListener("click", () => { this.st.mine = []; this.st.slot = null; this.st.done = false; this.render(); });
      document.addEventListener("langchange", () => this.render());
      this.render();
    },
    all() { return this.base.concat(this.st.mine); },
    dur() { return this.st.type === "first" ? 60 : 30; },
    free() {
      const { prac, day } = this.st, d = this.dur();
      const busy = this.all().filter((e) => e.day === day && e.p === prac);
      const out = [];
      for (let s = H0; s + d <= H1; s += 30) if (!busy.some((e) => s < e.s + e.d && e.s < s + d)) out.push(s);
      return out;
    },
    radio(g, items) {
      const box = $(`[data-g="${g}"]`, this.bk);
      box.innerHTML = items.map((it) => `<button type="button" role="radio" data-v="${it.v}" aria-checked="${it.on}" tabindex="${it.on ? 0 : -1}">${it.h}</button>`).join("");
      if (!items.some((it) => it.on) && box.firstChild) box.firstChild.tabIndex = 0;
    },
    render() {
      const st = this.st;
      this.radio("prac", Object.keys(PRAC).map((k) => ({ v: k, on: st.prac === k, h: `<b>${PRAC[k].n}</b><small>${I.t(PRAC[k].k)}</small>` })));
      this.radio("type", [
        { v: "first", on: st.type === "first", h: `<b>${I.t("type.first")}</b><small>60 min</small>` },
        { v: "follow", on: st.type === "follow", h: `<b>${I.t("type.follow")}</b><small>30 min</small>` },
      ]);
      this.radio("day", [1, 2, 3, 4].map((i) => ({ v: i, on: st.day === i, h: `<small>${I.date(DAYS[i], "wd")}</small><b>${I.date(DAYS[i], "dnum")}</b>` })));
      const fr = this.free();
      const slots = $('[data-g="slot"]', this.bk);
      if (!fr.length) slots.innerHTML = `<p class="slots__none">${I.t("bk.none")}</p>`;
      else this.radio("slot", fr.map((s) => ({ v: s, on: st.slot === s, h: I.time(s) })));
      if (st.done) { this.go.disabled = false; this.go.textContent = I.t("bk.done"); }
      else if (st.slot == null) { this.go.disabled = true; this.go.textContent = I.t("bk.pick"); }
      else { this.go.disabled = false; this.go.textContent = I.t("bk.go", { date: I.date(DAYS[st.day], "dmid"), time: I.time(st.slot) }); }
      this.renderPr();
    },
    renderPr(fresh) {
      const st = this.st, iso = DAYS[st.day];
      $(".pr__day", this.pr).textContent = I.date(iso, "dlong");
      $(".pr__who", this.pr).innerHTML = `<i class="pa"></i>Dr Morel <i class="pb"></i>J. Petit`;
      const list = this.all().filter((e) => e.day === st.day).sort((a, b) => a.s - b.s || a.p.localeCompare(b.p));
      const ol = $(".pr__list", this.pr);
      ol.innerHTML = list.length ? list.map((e) => `<li class="pe pe--${e.p}${e.mine ? " pe--mine" : ""}${e === fresh ? " is-new" : ""}"><span class="pe__t mono">${I.time(e.s)}</span><span class="pe__n"><b>${e.mine ? I.t("pr.you") : e.n}</b><small>${I.t("type." + e.t)} · ${e.d} min · ${PRAC[e.p].n}</small></span>${e.mine ? `<em class="pe__tag">${I.t("pr.just")}</em>` : e.on ? `<em class="pe__tag pe__tag--dim">${I.t("app.online.tag")}</em>` : ""}</li>`).join("") : `<li class="pe pe--empty">${I.t("pr.empty")}</li>`;
      const notes = $(".pr__notes", this.pr);
      const last = st.mine[st.mine.length - 1];
      if (st.done && last) {
        const prev = DAYS[last.day - 1];
        notes.innerHTML = `<p class="note"><i class="dot dot--ok"></i>${I.t("pr.n1")}</p><p class="note"><i class="dot dot--accent"></i>${I.t("pr.n2", { date: I.date(prev, "dmid"), time: I.time(1080) })}</p>`;
        if (fresh && X.anim) gsap.from(notes.children, { opacity: 0, y: 12, duration: 0.7, stagger: 0.45, delay: 0.5, ease: "power3.out" });
      } else notes.innerHTML = "";
      if (fresh && X.anim) {
        const li = $(".is-new", ol);
        li && gsap.from(li, { opacity: 0, x: -24, scale: 0.97, duration: 0.9, ease: "expo.out" });
      }
    },
    book() {
      const st = this.st;
      if (st.done) { st.done = false; st.slot = null; this.render(); return; }
      if (st.slot == null) return;
      const e = { day: st.day, s: st.slot, d: this.dur(), p: st.prac, t: st.type, mine: true };
      st.mine.push(e);
      st.slot = null; st.done = true;
      this.render();
      this.renderPr(e);
    },
  };

  /* ================= Simulateur de tarif ================= */
  const Calc = {
    BASE: 29, OPT: { sms: 9, wait: 6 },
    init() {
      this.n = $("#calc-n"); this.out = $(".calc__n"); this.bill = "m";
      this.priceEl = $(".calc__price b"); this.shown = 88;
      this.n.addEventListener("input", () => this.update());
      $$(".tg input").forEach((c) => c.addEventListener("change", () => this.update()));
      $$("[data-bill]").forEach((b) => b.addEventListener("click", () => { this.bill = b.dataset.bill; this.update(); }));
      $(".calc__go").addEventListener("click", (e) => { e.preventDefault(); toast(I.t("calc.toast")); });
      document.addEventListener("langchange", () => this.update(true));
      this.update(true);
    },
    update(instant) {
      const n = +this.n.value;
      const opts = $$(".tg input").filter((c) => c.checked);
      const month = n * this.BASE + opts.reduce((s, c) => s + this.OPT[c.dataset.opt], 0);
      const y = this.bill === "y";
      const target = y ? Math.round((month * 10) / 12) : month;
      this.out.textContent = n;
      this.n.style.setProperty("--p", ((n - 1) / 11) * 100 + "%");
      $$("[data-bill]").forEach((b) => { const on = b.dataset.bill === this.bill; b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1; });
      let det = I.t(n === 1 ? "calc.detail.1" : "calc.detail.n", { n, p: I.eur(this.BASE) }) + (opts.length ? I.t("calc.detail.opt") : "");
      if (y) det += I.t("calc.detail.y", { t: I.eur(month * 10) });
      $(".calc__detail").textContent = det;
      const set = (v) => (this.priceEl.textContent = I.eur(Math.round(v)));
      if (instant || !X.anim) { this.shown = target; set(target); return; }
      const o = { v: this.shown };
      this.shown = target;
      gsap.to(o, { v: target, duration: 0.6, ease: "power3.out", onUpdate: () => set(o.v), overwrite: true });
    },
  };

  /* ================= Presence humaine : photo si elle existe, sinon typographie ================= */
  function people() {
    const fig = $(".people__media");
    const src = fig.dataset.photo;
    // La photo n'est chargee que si assets/manifest.json l'annonce ("people": true) : aucune requete en 404
    fetch("assets/manifest.json").then((r) => (r.ok ? r.json() : {})).then((m) => (m && m.people ? X.loadImg(src) : Promise.reject())).then(() => {
      const img = document.createElement("img");
      img.src = src; img.loading = "lazy"; img.dataset.i18nAlt = "people.alt"; img.alt = I.t("people.alt");
      fig.prepend(img); fig.classList.add("has-photo");
    }).catch(() => {});
    const jobs = $$(".people__jobs li");
    const on = (k) => jobs.forEach((li, i) => li.classList.toggle("on", i === k));
    on(0);
    if (X.anim) ScrollTrigger.create({ trigger: ".people", start: "top 70%", end: "bottom 30%", onUpdate: (s) => on(Math.min(jobs.length - 1, Math.floor(s.progress * jobs.length))) });
  }

  /* ================= Petit message ================= */
  let tt;
  function toast(msg) {
    const t = $(".toast");
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("is-on"), 4200);
  }

  /* ================= Demarrage ================= */
  buildApp();
  I.apply();
  const lenis = X.smooth();
  X.nav($(".nav"));
  Film.init();
  Demo.init();
  Calc.init();
  people();
  X.reveals();
  X.cursor();
  X.magnetic();
  document.addEventListener("langchange", () => {
    $$("[data-scrub-words]").forEach((el) => X.scrubWords(el));
    if (X.hasGsap) ScrollTrigger.refresh();
  });

  // Ancres : defilement doux, en tenant compte de la section epinglee
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("calc__go")) return;
    const id = a.getAttribute("href");
    const t = id === "#top" ? document.body : $(id);
    if (!t) return;
    e.preventDefault();
    X.scrollTo(id === "#top" || id === "#product" ? 0 : t);
  });

  // Prechargeur : polices pretes, puis entree orchestree
  const loader = $(".loader");
  if (!X.anim) { loader && loader.remove(); document.documentElement.classList.add("is-in"); return; }
  if (lenis) lenis.stop();
  gsap.to(".loader__line i", { scaleX: 0.7, duration: 1.2, ease: "power2.out" });
  const ready = Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, new Promise((r) => setTimeout(r, 700))]), new Promise((r) => setTimeout(r, 4000))]);
  ready.then(() => {
    ScrollTrigger.refresh();
    const tl = gsap.timeline({ onComplete: () => { lenis && lenis.start(); document.documentElement.classList.add("is-in"); } });
    tl.to(".loader__line i", { scaleX: 1, duration: 0.4, ease: "power2.inOut" })
      .to(".loader__mark, .loader__line", { opacity: 0, y: -12, duration: 0.5, ease: "power2.in" }, "+=0.05")
      .to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }, "-=0.1")
      .from(".hero__title .l > span", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1 }, "-=0.35")
      .from(".pill, .hero__lead, .hero__cta", { opacity: 0, y: 20, duration: 1, ease: "expo.out", stagger: 0.08 }, "-=1.1")
      .from(".scene", { opacity: 0, yPercent: 14, duration: 1.8, ease: "expo.out" }, "-=1.1")
      .from(".nav, .film__hint", { opacity: 0, duration: 0.8 }, "-=1.4");
  });
})();
