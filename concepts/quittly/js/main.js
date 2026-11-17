/* Quittly : marque de logiciel fictive, concept Weskale Studio.
   Ouverture : la fenetre du produit se pose, un devis se compose au defilement,
   il est envoye, signe, transforme en facture, puis paye. Tout est pilote par une
   seule progression (0..1) de la section epinglee, donc reversible et sans saut. */
(function () {
  "use strict";
  const X = window.WX;
  const I = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { clamp, smoothstep: ss } = X;
  const seg = (a, b, p) => clamp((p - a) / (b - a), 0, 1);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const setT = (el, s) => { if (el && el._t !== s) { el._t = s; el.textContent = s; } };
  const unsplit = (el) => { delete el.dataset.split; el.removeAttribute("aria-label"); };

  // Devis d'exemple (montants fictifs)
  const DOC = { client: "Maison Arlo", lines: [1800, 540, 350], vat: 0.2, date: new Date(2026, 10, 17), due: new Date(2026, 11, 17) };
  DOC.sub = DOC.lines.reduce((a, b) => a + b, 0);
  DOC.tax = DOC.sub * DOC.vat;
  DOC.ttc = DOC.sub + DOC.tax;

  // Reperes de la timeline (progression de la section epinglee)
  const T = {
    hero: [0, 0.07], cam: [0.02, 0.16], type: [0.14, 0.21], row0: 0.21, rowStep: 0.055, rowLen: 0.05, sum: [0.37, 0.44],
    press: [0.455, 0.47], sig: [0.56, 0.63], conv: [0.68, 0.73], sweep: [0.665, 0.76], note: [0.8, 0.85], stamp: [0.84, 0.88],
    caps: [[0.12, 0.46], [0.46, 0.66], [0.66, 0.8], [0.8, 1.01]],
    pill: [[0.47, "sent"], [0.53, "viewed"], [0.63, "signed"], [0.705, "invoiced"], [0.85, "paid"]],
  };

  /* ================= Film ================= */
  const Film = {
    p: 0, pt: 0, m: [0, 0], mt: [0, 0], dirty: true, st: null, visible: true,
    init() {
      this.el = $(".film");
      this.shot = $(".shot");
      this.app = $(".app");
      this.hero = $(".hero");
      this.hint = $(".film__hint");
      this.bar = $(".film__bar i");
      this.note = $(".film__note");
      this.caps = $$(".cap");
      this.typeEl = $(".type");
      this.typeT = $(".type__t");
      this.rows = $$(".paper__rows .row[data-row]");
      this.sums = [$(".s-sub"), $(".s-vat"), $(".s-ttc")];
      this.send = $(".send");
      this.sendT = $(".send__t");
      this.pill = $(".pill");
      this.pillT = $(".pill__t");
      this.acts = $$(".act__list li").map((li) => ({ li, at: +li.dataset.at }));
      this.sig = $(".shot .sig");
      this.sigL = 300;
      try { this.sigL = this.sig.getTotalLength(); } catch (e) {}
      this.sig.style.strokeDasharray = this.sigL;
      this.swA = $$(".shot .swap__a");
      this.swB = $$(".shot .swap__b");
      this.sweep = $(".paper__sweep");
      this.noteEl = $(".note");
      this.noteV = $(".note__v");
      this.stamp = $(".shot .stamp");
      this.payT = $(".payline__t");
      this.crumbA = $(".crumb [data-i18n]");
      this.crumbB = $(".crumb__doc");
      this.navLi = $$(".side__nav li");
      this.layout();
      addEventListener("resize", () => { this.layout(); this.dirty = true; });
      if (!X.touch && X.anim) addEventListener("pointermove", (e) => { this.mt = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
      if ("IntersectionObserver" in window) new IntersectionObserver((e) => (this.visible = e[0].isIntersecting)).observe(this.el);
      this.tick = this.tick.bind(this);
      // Une seule boucle : celle de GSAP, qui fait aussi avancer Lenis
      if (X.anim) gsap.ticker.add(this.tick);
      else this.draw(1);
    },
    // Deux poses de la fenetre : sous le titre, inclinee ; puis posee a droite des legendes
    layout() {
      const W = innerWidth, H = innerHeight, compact = W < 760;
      this.app.classList.toggle("is-compact", compact);
      const bw = compact ? 420 : 1000, bh = compact ? 620 : 680;
      this.bw = bw; this.bh = bh;
      if (!X.anim) {
        const s = Math.min(1, (W - 40) / bw);
        this.shot.style.width = bw * s + "px"; this.shot.style.height = bh * s + "px";
        this.app.style.transform = `scale(${s})`; this.app.style.transformOrigin = "0 0";
        return;
      }
      const heroBottom = this.hero.offsetTop + this.hero.offsetHeight;
      let A, B;
      if (compact) {
        const top = 72, bottom = H - 292;
        const s = Math.min((W - 28) / bw, (bottom - top) / bh);
        B = { x: (W - bw * s) / 2, y: top + Math.max(0, (bottom - top - bh * s) / 2), s, rx: 0 };
        const sa = (W - 36) / bw;
        A = { x: (W - bw * sa) / 2, y: Math.min(Math.max(heroBottom + 34, H * 0.62), H * 0.86), s: sa, rx: 22 };
      } else {
        const gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gut")) || 60;
        const capsW = Math.min(W * 0.28, 420);
        const left = gut + capsW + Math.max(32, W * 0.03), right = W - gut, top = 92, bottom = H - 56;
        const s = Math.min((right - left) / bw, (bottom - top) / bh);
        B = { x: right - bw * s, y: top + (bottom - top - bh * s) / 2, s, rx: 0 };
        const sa = Math.min((W * 0.8) / bw, 1.1);
        A = { x: (W - bw * sa) / 2, y: Math.min(Math.max(heroBottom + 48, H * 0.64), H * 0.84), s: sa, rx: 26 };
      }
      this.A = A; this.B = B;
      this.shot.style.width = bw + "px"; this.shot.style.height = bh + "px";
    },
    tick() {
      // La progression arrive deja lissee par le scrub
      const dp = this.pt - this.p;
      this.p = this.pt;
      const mx = this.mt[0] - this.m[0], my = this.mt[1] - this.m[1];
      if (Math.abs(mx) + Math.abs(my) > 0.001) { this.m[0] += mx * 0.05; this.m[1] += my * 0.05; this.dirty = true; }
      if (dp !== 0) this.dirty = true;
      if (!this.visible || !this.dirty) return;
      this.dirty = false;
      this.draw(this.p);
    },
    draw(p) {
      const anim = X.anim;
      // Pose de la fenetre
      if (anim && this.A) {
        const e = ss(T.cam[0], T.cam[1], p), A = this.A, B = this.B;
        const x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e, s = A.s + (B.s - A.s) * e;
        const rx = A.rx + (B.rx - A.rx) * e - this.m[1] * 1.6 * e, ry = this.m[0] * 2.4 * e;
        this.shot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        this.shot.style.transformOrigin = "0 0";
        const h = 1 - ss(T.hero[0], T.hero[1], p);
        this.hero.style.opacity = h;
        this.hero.style.transform = `translateY(${(-70 * (1 - h)).toFixed(1)}px)`;
        this.hero.style.visibility = h < 0.01 ? "hidden" : "";
        if (this.hint) this.hint.style.opacity = 1 - ss(0, 0.03, p);
        this.bar.style.transform = `scaleX(${p})`;
        this.note.style.opacity = ss(0.14, 0.18, p);
        // Legendes : un mot a la fois
        this.caps.forEach((c, i) => {
          const [a, b] = T.caps[i];
          const tin = ss(a, a + 0.03, p), tout = i === this.caps.length - 1 ? 1 : 1 - ss(b - 0.03, b, p);
          const o = tin * tout;
          c.style.opacity = o;
          c.style.visibility = o < 0.01 ? "hidden" : "visible";
          const dy = (1 - tin) * 36 - (1 - tout) * 36;
          c.style.transform = (innerWidth < 760 ? "" : "translateY(-50%) ") + `translateY(${dy.toFixed(1)}px)`;
        });
      }
      // Saisie du nom du client
      const tt = seg(T.type[0], T.type[1], p), name = DOC.client;
      setT(this.typeT, name.slice(0, Math.round(tt * name.length)));
      this.typeEl.classList.toggle("is-typing", p > T.type[0] - 0.03 && p < T.type[1] + 0.02);
      // Lignes du devis
      this.rows.forEach((r, i) => {
        const a = T.row0 + i * T.rowStep, t = seg(a, a + T.rowLen, p);
        r.style.opacity = 0.08 + 0.92 * ss(0, 0.4, t);
        r.style.transform = `translateY(${((1 - eo(t)) * 10).toFixed(1)}px)`;
        setT(r.lastElementChild, t > 0 ? I.money(Math.round(DOC.lines[i] * eo(t))) : "");
      });
      const st = eo(seg(T.sum[0], T.sum[1], p));
      setT(this.sums[0], I.money(DOC.sub * st));
      setT(this.sums[1], I.money(DOC.tax * st));
      setT(this.sums[2], I.money(DOC.ttc * st));
      // Envoi et statut
      this.send.classList.toggle("is-press", p > T.press[0] && p < T.press[1]);
      this.send.classList.toggle("is-done", p >= T.press[1]);
      setT(this.sendT, I.t(p >= T.press[1] ? "send.done" : "send.idle"));
      let state = "draft";
      T.pill.forEach(([at, s]) => { if (p >= at) state = s; });
      if (this.pill.dataset.state !== state) this.pill.dataset.state = state;
      setT(this.pillT, I.t("pill." + state));
      this.acts.forEach((a) => a.li.classList.toggle("is-on", p >= a.at));
      // Signature
      this.sig.style.strokeDashoffset = (this.sigL * (1 - seg(T.sig[0], T.sig[1], p))).toFixed(1);
      // Devis -> facture
      const k = ss(T.conv[0], T.conv[1], p);
      this.swA.forEach((el) => { el.style.opacity = 1 - k; el.style.transform = `translateY(${(-k * 8).toFixed(1)}px)`; });
      this.swB.forEach((el) => { el.style.opacity = k; el.style.transform = `translateY(${((1 - k) * 8).toFixed(1)}px)`; });
      const sw = seg(T.sweep[0], T.sweep[1], p);
      this.sweep.style.transform = `translateX(${(-120 + sw * 400).toFixed(0)}%) skewX(-12deg)`;
      this.sweep.style.opacity = sw > 0 && sw < 1 ? 1 : 0;
      const inv = k > 0.5;
      setT(this.crumbA, I.t(inv ? "app.nav3" : "app.crumbQuotes"));
      setT(this.crumbB, inv ? (I.lang === "fr" ? "nº 0014" : "Nº 0014") : I.t("app.crumbDoc"));
      this.navLi.forEach((li, j) => li.classList.toggle("is-on", j === (inv ? 2 : 1)));
      // Paiement
      const n = eo(seg(T.note[0], T.note[1], p));
      this.noteEl.style.opacity = n;
      this.noteEl.style.transform = `translateY(${((1 - n) * -16).toFixed(1)}px) scale(${(0.96 + 0.04 * n).toFixed(3)})`;
      setT(this.noteV, I.money(DOC.ttc));
      const sp = seg(T.stamp[0], T.stamp[1], p), sb = sp < 1 ? eo(sp) : 1;
      this.stamp.style.opacity = ss(0, 0.3, sp);
      this.stamp.style.transform = `rotate(-11deg) scale(${(1.8 - 0.8 * sb).toFixed(3)})`;
      setT(this.payT, p >= T.stamp[0] ? I.t("doc.paidOn", { d: I.date(DOC.date) }) : I.t("doc.payOnline"));
    },
    // Textes qui dependent de la langue
    relabel() {
      setT($(".doc-date"), I.date(DOC.date));
      setT($(".doc-due"), I.date(DOC.due));
      [...this.rows, ...this.sums, this.sendT, this.pillT, this.noteV, this.payT, this.crumbA, this.crumbB].forEach((el) => el && (el._t = null));
      this.layout();
      this.dirty = true;
      if (!X.anim) this.draw(1);
    },
  };

  /* ================= Timeline epinglee ================= */
  function buildFilm() {
    if (!X.anim) return;
    const len = () => innerHeight * (X.mobile() ? 2 : 3);
    const prog = { v: 0 };
    const tw = gsap.to(prog, {
      v: 1, ease: "none",
      onUpdate: () => { Film.pt = prog.v; Film.dirty = true; },
      scrollTrigger: {
        trigger: ".film", start: "top top", end: () => "+=" + len(), pin: true, scrub: 0.4, invalidateOnRefresh: true,
        onRefresh: () => { Film.layout(); Film.dirty = true; },
      },
    });
    Film.st = tw.scrollTrigger;
  }

  /* ================= Editeur de devis ================= */
  const Ed = {
    vat: 20, paid: false, edited: false, lines: [],
    defaults() {
      this.client = I.t("try.clientV");
      this.lines = [{ d: I.t("try.d1"), q: 1, p: 1800 }, { d: I.t("try.d2"), q: 6, p: 90 }, { d: I.t("try.d3"), q: 1, p: 350 }];
    },
    init() {
      this.form = $(".ed__form");
      this.box = $(".ed__lines");
      this.cl = $(".ed__client");
      this.rowsEl = $(".lv-rows");
      this.paper = $(".paper--live");
      this.flip = $(".ed__flip");
      this.defaults();
      this.cl.value = this.client;
      this.form.addEventListener("submit", (e) => e.preventDefault());
      this.cl.addEventListener("input", () => { this.edited = true; this.render(); });
      this.box.addEventListener("input", (e) => {
        const t = e.target, i = +t.dataset.i, k = t.dataset.k;
        if (!k || !this.lines[i]) return;
        this.edited = true;
        if (k === "d") this.lines[i].d = t.value;
        else this.lines[i][k] = clamp(parseFloat(t.value) || 0, 0, k === "q" ? 999 : 999999);
        this.render();
      });
      this.box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-del]");
        if (!b || this.lines.length < 2) return;
        this.edited = true;
        this.lines.splice(+b.dataset.del, 1);
        this.drawForm(); this.render();
      });
      $(".ed__add").addEventListener("click", () => {
        if (this.lines.length >= 6) return;
        this.edited = true;
        this.lines.push({ d: I.t("try.new"), q: 1, p: 200 });
        this.drawForm(); this.render(true);
        const last = this.box.lastElementChild;
        last && last.querySelector("input").focus();
      });
      $$("[data-vat]").forEach((b) => b.addEventListener("click", () => {
        this.vat = +b.dataset.vat;
        $$("[data-vat]").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-checked", x === b); });
        this.render();
      }));
      this.flip.addEventListener("click", () => { this.paid = !this.paid; this.render(); });
      this.drawForm(); this.render();
    },
    drawForm() {
      this.box.innerHTML = "";
      this.lines.forEach((l, i) => {
        const row = document.createElement("div");
        row.className = "ed__line";
        const mk = (k, type, v, label, extra) => {
          const inp = document.createElement("input");
          inp.type = type; inp.value = v; inp.dataset.k = k; inp.dataset.i = i;
          inp.setAttribute("aria-label", `${label} ${i + 1}`);
          Object.assign(inp, extra || {});
          return inp;
        };
        row.append(
          mk("d", "text", l.d, I.t("try.item"), { maxLength: 42 }),
          mk("q", "number", l.q, I.t("try.qty"), { min: 0, max: 999, step: 1, inputMode: "numeric" }),
          mk("p", "number", l.p, I.t("try.price"), { min: 0, max: 999999, step: 10, inputMode: "decimal" })
        );
        const del = document.createElement("button");
        del.type = "button"; del.className = "ed__del"; del.dataset.del = i; del.textContent = "×";
        del.setAttribute("aria-label", `${I.t("try.del")} ${i + 1}`);
        if (this.lines.length < 2) del.disabled = true;
        row.append(del);
        this.box.append(row);
      });
      $(".ed__add").disabled = this.lines.length >= 6;
    },
    render(flashLast) {
      let sub = 0;
      this.rowsEl.innerHTML = "";
      this.lines.forEach((l, i) => {
        const t = (+l.q || 0) * (+l.p || 0);
        sub += t;
        const p = document.createElement("p");
        p.className = "row" + (flashLast && i === this.lines.length - 1 ? " is-new" : "");
        const a = document.createElement("span"); a.textContent = l.d.trim() || I.t("try.untitled");
        const b = document.createElement("span"); b.textContent = +l.q || 0;
        const c = document.createElement("b"); c.textContent = I.money(t);
        p.append(a, b, c);
        this.rowsEl.append(p);
      });
      const tax = (sub * this.vat) / 100;
      const today = new Date(), due = new Date(today.getTime() + 30 * 864e5);
      $(".lv-client").textContent = this.cl.value.trim() || I.t("try.noClient");
      $(".lv-date").textContent = I.date(today);
      $(".lv-sub").textContent = I.money(sub);
      $(".lv-vat").textContent = I.money(tax);
      $(".lv-vatl").textContent = I.t("doc.vatN", { n: this.vat });
      $(".lv-ttc").textContent = I.money(sub + tax);
      $(".lv-type").textContent = I.t(this.paid ? "doc.invoice" : "doc.quote");
      $(".lv-num").textContent = (I.lang === "fr" ? "nº " : "Nº ") + (this.paid ? "0015" : "0033");
      $(".lv-k3").textContent = I.t(this.paid ? "doc.due" : "doc.valid");
      $(".lv-v3").textContent = this.paid ? I.date(due) : I.t("doc.validV");
      this.paper.classList.toggle("is-paid", this.paid);
      this.flip.textContent = I.t(this.paid ? "try.back" : "try.flip");
    },
    relabel() {
      if (!this.edited) { this.defaults(); this.cl.value = this.client; }
      this.drawForm(); this.render();
    },
  };

  /* ================= Pour qui, tarifs ================= */
  function fillWho() {
    const list = I.t("who.list");
    const html = list.map((w) => `<span>${w}</span>`).join("");
    $(".marquee__track").innerHTML = html + html;
    $(".who__list").textContent = list.join(", ");
  }
  function fillPrices() { $$("[data-price]").forEach((b) => (b.textContent = I.money(+b.dataset.price, 0))); }

  /* ================= Prechargeur et entree ================= */
  const numEl = $(".loader__num"), lineEl = $(".loader__line i");
  let shown = 0;
  const setP = (p) => { if (p < shown) return; shown = p; numEl && (numEl.textContent = I.money(DOC.ttc * eo(p))); lineEl && (lineEl.style.transform = `scaleX(${p})`); };
  const ld = $(".loader__label");
  if (ld) ld.textContent = I.t("doc.total");

  function preload() {
    if (!X.anim) return Promise.resolve();
    const t0 = performance.now();
    let raf;
    const step = () => { setP(Math.min(0.9, (performance.now() - t0) / 1400)); raf = requestAnimationFrame(step); };
    step();
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.race([fonts, new Promise((r) => setTimeout(r, 4000))])
      .then(() => new Promise((r) => setTimeout(r, Math.max(0, 1100 - (performance.now() - t0)))))
      .then(() => { cancelAnimationFrame(raf); setP(1); });
  }

  fillWho();
  fillPrices();
  Film.init();
  Film.relabel();
  preload().then(start);

  // Bande defilante : animation en pause hors de l'ecran
  const mq = $(".marquee");
  if (mq && "IntersectionObserver" in window) new IntersectionObserver((e) => mq.classList.toggle("is-off", !e[0].isIntersecting)).observe(mq);

  function start() {
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildFilm();
    Ed.init();
    document.addEventListener("langchange", () => {
      if (ld) ld.textContent = I.t("doc.total");
      $$(".hero__title .l").forEach(unsplit);
      unsplit($(".who__title"));
      fillWho();
      fillPrices();
      Film.relabel();
      Ed.relabel();
      $$("[data-scrub-words]").forEach((el) => X.scrubWords(el));
      if (X.hasGsap) ScrollTrigger.refresh();
    });
    X.magnetic();
    X.reveals();
    links();
    intro();
  }

  function intro() {
    const loader = $(".loader");
    if (!X.anim) { loader && loader.remove(); return; }
    const chars = $$(".hero__title .l").flatMap((l) => X.split(l, true));
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".loader__line", { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "power3.in" }, 0.15)
      .to(".loader__mark, .loader__sum", { opacity: 0, y: -14, duration: 0.5, ease: "power2.in", stagger: 0.05 }, 0.2)
      .to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }, 0.6)
      .from(".film__glow", { opacity: 0, scale: 0.7, duration: 2.6, ease: "power2.out" }, 0.6)
      .from(chars, { yPercent: 110, duration: 1.4, stagger: 0.022 }, 0.8)
      .from(".hero .eyebrow, .hero__lead, .hero__cta, .film__hint", { opacity: 0, y: 22, duration: 1.2, stagger: 0.08 }, 1.1)
      .from(".app", { y: 120, opacity: 0, duration: 2, ease: "power3.out" }, 1.0)
      .from(".nav > *", { opacity: 0, y: -14, duration: 1, stagger: 0.06 }, 1.2);
  }

  // Liens internes : "Produit" vise la fenetre posee, au bon endroit de la section epinglee
  function links() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const el = id.length > 1 && document.querySelector(id);
      if (!el && id !== "#top") return;
      e.preventDefault();
      if (a.dataset.film && Film.st) { X.scrollTo(Film.st.start + (Film.st.end - Film.st.start) * +a.dataset.film); return; }
      X.scrollTo(id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY - 70);
    });
  }
})();
