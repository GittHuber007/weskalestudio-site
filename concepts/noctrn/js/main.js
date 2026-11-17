/* NOCTRN : marque fictive de vetements techniques, concept Weskale Studio.
   Un seul plan continu pilote par le defilement :
   photo d'ouverture -> la camera avance sur la poitrine (marque, gouttes) -> elle plonge vers le sol
   -> sequence video de la pluie sur l'asphalte, avec la fiche technique. */
(function () {
  "use strict";
  const X = window.WX;
  const I18N = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { clamp, smoothstep: ss } = X;
  const MOB = X.mobile();

  const CFG = {
    // Video Mixkit 48004 etalonnee nuit (cyan, magenta), decoupee de f_001 a f_144 (mobile : f_001 a f_072)
    seq: MOB ? { dir: "assets/seq-m/", n: 72 } : { dir: "assets/seq/", n: 144 },
    hero: MOB ? "assets/hero-m.webp" : "assets/hero.webp",
    pin: MOB ? 2 : 3, // longueur de la section epinglee, en hauteurs d'ecran
    free: 150, ship: 9,
    products: [
      { id: "shell", img: "assets/p-shell.webp", price: 289, sizes: ["XS", "S", "M", "L", "XL"], out: ["XS"] },
      { id: "funnel", img: "assets/p-funnel.webp", price: 249, sizes: ["XS", "S", "M", "L", "XL"], out: [] },
      { id: "cargo", img: "assets/p-cargo.webp", price: 159, sizes: ["28", "30", "32", "34", "36"], out: ["36"] },
    ],
  };
  // Reperes de la timeline (progression 0..1 de la section epinglee)
  const T = { heroOut: 0.02, push1: 0.34, drop0: 0.33, drop1: 0.47, f0: 0.36, f1: 1, end0: 0.95 };
  const t = (k, v) => I18N.t(k, v);
  const eur = (n) => I18N.eur(n);
  const P = (id) => CFG.products.find((p) => p.id === id);
  const pName = (p) => t(`p.${p.id}.name`);
  const fileOf = (k) => `${CFG.seq.dir}f_${String(k + 1).padStart(3, "0")}.webp`;

  /* ================= Film : canvas + chargement progressif ================= */
  const Film = {
    p: 0, pt: 0, m: [0, 0], mt: [0, 0], dirty: true, visible: true, st: null, hero: null,
    init() {
      this.cv = $(".film__cv");
      this.ctx = this.cv.getContext("2d", { alpha: false });
      this.n = CFG.seq.n;
      this.ok = new Uint8Array(this.n); // 0 absente, 1 en cours, 2 prete, 3 echec
      this.imgs = new Array(this.n).fill(null);
      // Ordre de chargement du grossier au fin : 1 image sur 16, puis 8, 4, 2, 1
      const seen = new Set();
      this.order = [];
      [16, 8, 4, 2, 1].forEach((s) => { for (let k = 0; k < this.n; k += s) if (!seen.has(k)) { seen.add(k); this.order.push(k); } });
      this.active = 0;
      this.resize();
      addEventListener("resize", () => this.resize());
      if (!X.touch && X.anim) addEventListener("pointermove", (e) => { this.mt = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
      if ("IntersectionObserver" in window) new IntersectionObserver((e) => (this.visible = e[0].isIntersecting)).observe($(".film"));
      this.tick = this.tick.bind(this);
      // Une seule boucle : celle de GSAP, qui fait aussi avancer Lenis
      if (window.gsap) gsap.ticker.add(this.tick);
      else { const loop = () => { this.tick(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    },
    req(k) {
      if (k < 0 || k >= this.n || this.ok[k]) return false;
      this.ok[k] = 1; this.active++;
      const im = new Image();
      im.decoding = "async";
      const ready = () => { this.imgs[k] = im; this.ok[k] = 2; this.active--; this.dirty = true; this.pump(); };
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).then(ready, ready); };
      im.onerror = () => { this.ok[k] = 3; this.active--; this.pump(); };
      im.src = fileOf(k);
      return true;
    },
    // D'abord les images autour de la position courante, puis l'ordre grossier a fin
    pump() {
      const cur = Math.round(this.frameAt(this.pt));
      while (this.active < 6) {
        let k = -1;
        for (let d = 0; d < 10 && k < 0; d++) for (const j of [cur + d, cur - d]) if (j >= 0 && j < this.n && !this.ok[j]) { k = j; break; }
        if (k < 0) k = this.order.find((j) => !this.ok[j]);
        if (k === undefined || k < 0) return;
        this.req(k);
      }
    },
    // Premiere vague : photo d'ouverture et une image sur 16, pour le prechargeur
    preload(onP) {
      const first = this.order.slice(0, Math.ceil(this.n / 16));
      let done = 0; const total = first.length + 1;
      const step = () => { done++; onP(done / total); };
      const wait = (k) => new Promise((r) => { this.req(k); const iv = setInterval(() => { if (this.ok[k] >= 2) { clearInterval(iv); step(); r(); } }, 30); });
      return Promise.race([
        Promise.all([
          X.loadImg(CFG.hero).then((i) => (this.hero = i)).catch(() => {}).then(step),
          ...first.map(wait),
        ]),
        new Promise((r) => setTimeout(r, 9000)),
      ]).then(() => { this.dirty = true; this.pump(); });
    },
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, MOB ? 2 : 1.5);
      this.dpr = dpr;
      this.W = Math.round(innerWidth * dpr); this.H = Math.round(innerHeight * dpr);
      this.cv.width = this.W; this.cv.height = this.H;
      this.cv.style.width = innerWidth + "px"; this.cv.style.height = innerHeight + "px";
      this.dirty = true;
    },
    frameAt(p) { return clamp((p - T.f0) / (T.f1 - T.f0), 0, 1) * (this.n - 1); },
    // Camera sur la photo : k = zoom relatif au cadrage plein ecran,
    // le point (fx, fy) de l'image est place en (sx, sy) de l'ecran.
    cams() {
      if (this.H > this.W * 1.05) {
        return [
          { p: 0, k: 1, fx: 0.79, fy: 0.5, sx: 0.5, sy: 0.5 },
          { p: 0.08, k: 1.04, fx: 0.79, fy: 0.5, sx: 0.5, sy: 0.5 },
          { p: T.push1, k: 1.95, fx: 0.8, fy: 0.6, sx: 0.5, sy: 0.6 },
          { p: 1, k: 2.05, fx: 0.8, fy: 0.62, sx: 0.5, sy: 0.6 },
        ];
      }
      return [
        { p: 0, k: 1, fx: 0.5, fy: 0.5, sx: 0.5, sy: 0.5 },
        { p: 0.08, k: 1.04, fx: 0.52, fy: 0.5, sx: 0.5, sy: 0.5 },
        { p: T.push1, k: 2.5, fx: 0.8, fy: 0.6, sx: 0.68, sy: 0.54 },
        { p: 1, k: 2.6, fx: 0.8, fy: 0.62, sx: 0.68, sy: 0.54 },
      ];
    },
    cam(p) {
      const K = this.cams();
      let i = 0;
      while (i < K.length - 2 && p > K[i + 1].p) i++;
      const a = K[i], b = K[i + 1], e = ss(a.p, b.p, p);
      const o = {};
      ["k", "fx", "fy", "sx", "sy"].forEach((n) => (o[n] = a[n] + (b[n] - a[n]) * e));
      return o;
    },
    // Rectangle de dessin d'une image (iw x ih) qui couvre l'ecran, zoom k, point focal
    place(iw, ih, c) {
      const W = this.W, H = this.H;
      const s = Math.max(W / iw, H / ih) * c.k;
      const dw = iw * s, dh = ih * s;
      let dx = W * c.sx - c.fx * dw + this.m[0] * W * 0.008;
      let dy = H * c.sy - c.fy * dh + this.m[1] * H * 0.006;
      dx = clamp(dx, W - dw, 0); dy = clamp(dy, H - dh, 0);
      return { dx, dy, dw, dh };
    },
    nearest(i) {
      if (this.ok[i] === 2) return i;
      for (let d = 1; d < this.n; d++) {
        if (i - d >= 0 && this.ok[i - d] === 2) return i - d;
        if (i + d < this.n && this.ok[i + d] === 2) return i + d;
      }
      return -1;
    },
    tick() {
      // La progression arrive deja lissee par le scrub de la timeline
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
      const g = this.ctx, W = this.W, H = this.H, portrait = H > W * 1.05;
      g.globalAlpha = 1;
      g.fillStyle = "#050608";
      g.fillRect(0, 0, W, H);
      // Plongee : la photo monte et s'efface, la pluie arrive par le bas
      const d = ss(T.drop0, T.drop1, p);
      // Sequence de la pluie
      if (d > 0) {
        const f = this.frameAt(p), i0 = Math.floor(f), fr = f - i0;
        const a = this.nearest(i0);
        if (a >= 0) {
          const im = this.imgs[a];
          const k = 1.28 - 0.22 * d - 0.06 * ss(T.drop1, 1, p);
          const r = this.place(im.naturalWidth, im.naturalHeight, { k, fx: 0.5, fy: 0.55, sx: 0.5, sy: 0.55 });
          const off = (1 - d) * H * 0.35;
          g.globalAlpha = d;
          g.drawImage(im, r.dx, r.dy + off, r.dw, r.dh);
          if (a === i0 && fr > 0.02 && i0 + 1 < this.n && this.ok[i0 + 1] === 2) { g.globalAlpha = d * fr; g.drawImage(this.imgs[i0 + 1], r.dx, r.dy + off, r.dw, r.dh); }
        }
      }
      // Photo d'ouverture
      if (this.hero && d < 1) {
        const c = this.cam(p), im = this.hero;
        const r = this.place(im.naturalWidth, im.naturalHeight, c);
        g.globalAlpha = 1 - d;
        g.drawImage(im, r.dx, r.dy - d * H * 0.55, r.dw, r.dh);
      }
      g.globalAlpha = 1;
      // Voile de lecture : a gauche sur ordinateur, en haut et en bas sur telephone
      // Degrades crees une seule fois par taille d'ecran
      if (!this.grad || this.grad.W !== W || this.grad.H !== H) {
        const top = g.createLinearGradient(0, 0, 0, H * 0.42);
        top.addColorStop(0, "rgba(5,6,8,0.82)"); top.addColorStop(1, "rgba(5,6,8,0)");
        const bot = g.createLinearGradient(0, H, 0, H * 0.55);
        bot.addColorStop(0, "rgba(5,6,8,0.9)"); bot.addColorStop(1, "rgba(5,6,8,0)");
        const left = g.createLinearGradient(0, 0, W * 0.6, 0);
        left.addColorStop(0, "rgba(5,6,8,0.72)"); left.addColorStop(1, "rgba(5,6,8,0)");
        this.grad = { W, H, top, bot, left };
      }
      if (portrait) {
        g.fillStyle = this.grad.top; g.fillRect(0, 0, W, H * 0.42);
        g.fillStyle = this.grad.bot; g.fillRect(0, H * 0.55, W, H * 0.45);
      } else {
        g.fillStyle = this.grad.left; g.fillRect(0, 0, W * 0.6, H);
      }
      // Fin du plan : la nuit reprend le dessus avant la section suivante
      const end = ss(T.end0, 1, p);
      if (end > 0) { g.globalAlpha = end * 0.75; g.fillStyle = "#050608"; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    },
  };

  /* ================= Timeline epinglee ================= */
  function buildFilm() {
    if (!X.anim) return;
    const nums = $$(".spec [data-num]");
    nums.forEach((n) => (n.textContent = "0"));
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".film", start: "top top", end: () => "+=" + innerHeight * CFG.pin, pin: true, scrub: 0.4,
        invalidateOnRefresh: true,
      },
      onUpdate() { Film.pt = this.progress(); Film.dirty = true; Film.pump(); },
    });
    Film.st = tl.scrollTrigger;
    tl.to(".film__hero > *", { y: -50, opacity: 0, stagger: 0.008, duration: 0.05 }, T.heroOut)
      .to(".film__hint", { opacity: 0, duration: 0.03 }, 0.01)
      // Chapitre 1 : la camera avance sur la poitrine
      .set(".chap--1", { opacity: 1 }, 0.129)
      .fromTo(".chap--1 .eyebrow, .chap--1 .chap__text", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05 }, 0.15)
      .fromTo(".chap--1 .chap__title .l > span", { yPercent: 105 }, { yPercent: 0, duration: 0.07, stagger: 0.02, ease: "power2.out" }, 0.13)
      .to(".chap--1", { opacity: 0, y: -40, duration: 0.04 }, 0.31)
      // Chapitre 2 : la pluie
      .set(".chap--2", { opacity: 1 }, 0.469)
      .fromTo(".chap--2 .eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05 }, 0.49)
      .fromTo(".chap--2 .chap__title .l > span", { yPercent: 105 }, { yPercent: 0, duration: 0.07, stagger: 0.02, ease: "power2.out" }, 0.47)
      .to(".chap--2", { opacity: 0, y: -40, duration: 0.04 }, 0.62);
    $$(".spec").forEach((el, i) => {
      const at = 0.66 + i * 0.06;
      tl.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, at);
      const n = el.querySelector("[data-num]");
      if (n) { const o = { v: 0 }; tl.to(o, { v: +n.dataset.num, duration: 0.06, ease: "power2.out", onUpdate: () => (n.textContent = I18N.num(Math.round(o.v))) }, at); }
    });
    tl.fromTo(".specs__note", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.84)
      .to(".spec, .specs__note", { opacity: 0, duration: 0.03 }, 0.95)
      .fromTo(".film__bar i", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .set({}, {}, 1);
  }
  // Chiffres de la fiche au format de la langue (sans animation, ou apres un changement de langue)
  function relabelNums() {
    $$(".spec [data-num]").forEach((n) => {
      const v = parseInt(n.textContent.replace(/\D/g, ""), 10);
      n.textContent = I18N.num(X.anim && !isNaN(v) ? v : +n.dataset.num);
    });
  }

  /* ================= Prechargeur et entree ================= */
  const pctEl = $(".loader__pct"), lineEl = $(".loader__line i");
  let shown = 0;
  const setP = (p) => { const v = Math.round(p * 100); if (v >= shown) { shown = v; pctEl && (pctEl.textContent = v); lineEl && (lineEl.style.transform = `scaleX(${p})`); } };

  Film.init();
  Film.preload(setP).then(start);

  function start() {
    setP(1);
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildFilm();
    relabelNums();
    Shop.init();
    Sheet.init();
    Cart.init();
    look();
    document.addEventListener("langchange", () => {
      Shop.render();
      Sheet.relabel();
      Cart.render();
      relabelNums();
      $$("[data-scrub-words]").forEach((el) => X.scrubWords(el));
      if (X.hasGsap) ScrollTrigger.refresh();
    });
    X.magnetic();
    X.reveals();
    links();
    $(".film").classList.add("is-ready");
    intro();
  }

  function intro() {
    const loader = $(".loader");
    if (!X.anim) { loader && loader.remove(); return; }
    const chars = X.split($(".hero__title .l"), true).concat(X.split($(".hero__title .l--b"), true));
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".loader__line", { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "power3.in" }, 0)
      .to(".loader__name, .loader__meta", { opacity: 0, y: -14, duration: 0.5, ease: "power2.in" }, 0.05)
      .to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }, 0.55)
      .fromTo(".film__stage", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.4, ease: "power2.out" }, 0.5)
      .from(chars, { yPercent: 115, duration: 1.4, stagger: 0.04 }, 1.0)
      .from(".film__hero .eyebrow, .hero__lead, .hero__cta, .film__hint", { opacity: 0, y: 24, duration: 1.2, stagger: 0.08 }, 1.4)
      .from(".nav > *", { opacity: 0, y: -16, duration: 1, stagger: 0.06 }, 1.3);
  }

  // Liens internes : les liens "data-film" visent un moment precis de la section epinglee
  function links() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const el = id.length > 1 && document.querySelector(id);
      if (!el && id !== "#top") return;
      e.preventDefault();
      if (a.dataset.film && Film.st) { X.scrollTo(Film.st.start + (Film.st.end - Film.st.start) * +a.dataset.film); return; }
      const nav = $(".nav"), off = nav ? nav.offsetHeight : 0;
      X.scrollTo(id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY - off);
    });
  }

  /* ================= Lookbook : l'image s'ouvre jusqu'a remplir l'ecran ================= */
  function look() {
    if (!X.anim) return;
    gsap.fromTo(".look__frame", { clipPath: MOB ? "inset(12% 8% 12% 8%)" : "inset(16% 22% 16% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".look", start: "top 85%", end: "top top", scrub: 0.3 } });
    gsap.fromTo(".look__frame img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".look", start: "top bottom", end: "bottom top", scrub: 0.3 } });
    gsap.fromTo(".look__time", { yPercent: 40, opacity: 0 }, { yPercent: -30, opacity: 1, ease: "none", scrollTrigger: { trigger: ".look", start: "top 60%", end: "bottom 40%", scrub: 0.3 } });
    gsap.from(".look__copy > *", { opacity: 0, y: 30, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".look__copy", start: "top 85%", once: true } });
  }

  /* ================= Boutique ================= */
  const Shop = {
    init() {
      this.box = $(".shop__grid");
      this.render();
      this.box.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) Sheet.open(b.dataset.open); });
      if (X.anim) {
        const head = $$(".shop__title .l");
        gsap.from(head, { yPercent: 60, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".shop__head", start: "top 85%", once: true } });
        gsap.from(".card", { y: 80, opacity: 0, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".shop__grid", start: "top 85%", once: true } });
      }
    },
    render() {
      this.box.innerHTML = CFG.products.map((p, i) => `
        <article class="card">
          <button class="card__media" type="button" data-open="${p.id}" aria-label="${pName(p)}, ${t("shop.choose")}">
            <img src="${p.img}" alt="${t(`p.${p.id}.alt`)}" loading="lazy">
            <span class="card__n mono" aria-hidden="true">0${i + 1}</span>
          </button>
          <div class="card__info">
            <div><h3 class="display card__name">${pName(p)}</h3><p class="mono card__sub">${t(`p.${p.id}.cat`)} · ${t(`p.${p.id}.color`)}</p></div>
            <p class="card__price">${eur(p.price)}</p>
          </div>
          <button class="link card__go" type="button" data-open="${p.id}">${t("shop.choose")}</button>
        </article>`).join("");
    },
  };

  /* ================= Fiche produit : tailles ================= */
  const Sheet = {
    cur: null, size: null, last: null,
    init() {
      this.el = $(".sheet");
      this.el.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) return this.close();
        const b = e.target.closest(".size");
        if (b && !b.disabled) this.pick(b.dataset.size);
      });
      $(".sizes__row").addEventListener("keydown", (e) => {
        if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
        e.preventDefault();
        const opts = $$(".size:not([disabled])", this.el);
        const i = Math.max(0, opts.findIndex((o) => o.dataset.size === this.size));
        const n = opts[(i + (/Right|Down/.test(e.key) ? 1 : opts.length - 1)) % opts.length];
        this.pick(n.dataset.size); n.focus();
      });
      $(".sheet__add").addEventListener("click", () => this.add());
      addEventListener("keydown", (e) => { if (e.key === "Escape" && this.el.classList.contains("is-open")) this.close(); });
    },
    open(id) {
      this.cur = P(id); this.size = null; this.last = document.activeElement;
      this.fill();
      this.hint(t("sheet.pick"));
      this.el.classList.add("is-open"); this.el.setAttribute("aria-hidden", "false");
      X.lenis && X.lenis.stop();
      if (X.anim) gsap.fromTo(".sheet__img img", { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "expo.out" });
      setTimeout(() => $(".sheet__close").focus(), 60);
    },
    fill() {
      const p = this.cur; if (!p) return;
      const im = $(".sheet__img img");
      im.src = p.img; im.alt = t(`p.${p.id}.alt`);
      $(".sheet__cat").textContent = `${t(`p.${p.id}.cat`)} · ${t(`p.${p.id}.color`)}`;
      $(".sheet__name").textContent = pName(p);
      $(".sheet__price").textContent = eur(p.price);
      $(".sheet__desc").textContent = t(`p.${p.id}.desc`);
      $(".sizes__row").innerHTML = p.sizes.map((s) => {
        const out = p.out.includes(s), on = s === this.size;
        return `<button type="button" class="size${on ? " is-on" : ""}" role="radio" aria-checked="${on}" data-size="${s}"${out ? ` disabled aria-label="${t("sheet.soldout", { s })}"` : ""}>${s}</button>`;
      }).join("");
    },
    relabel() { if (this.cur) { this.fill(); this.hint(this.size ? t("sheet.fit") : t("sheet.pick")); } },
    hint(s, err) { const h = $(".sheet__hint"); h.textContent = s; h.classList.toggle("is-err", !!err); },
    pick(s) {
      this.size = s;
      $$(".size", this.el).forEach((b) => { const on = b.dataset.size === s; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
      this.hint(t("sheet.fit"));
    },
    add() {
      if (!this.size) { this.hint(t("sheet.err"), true); return; }
      Cart.add(this.cur, this.size);
      this.close();
    },
    close() {
      this.el.classList.remove("is-open"); this.el.setAttribute("aria-hidden", "true");
      X.lenis && X.lenis.start();
      this.last && this.last.focus && this.last.focus({ preventScroll: true });
    },
  };

  /* ================= Panier (fonctionne en demo, aucun paiement) ================= */
  const Cart = {
    items: [],
    init() {
      try { this.items = JSON.parse(localStorage.getItem("noctrn-cart-v3") || "[]").filter((x) => P(x.id)); } catch (e) { this.items = []; }
      this.el = $(".cart");
      $(".nav__cart").addEventListener("click", () => this.open());
      $(".cart__close").addEventListener("click", () => this.close());
      $(".cart__veil").addEventListener("click", () => this.close());
      addEventListener("keydown", (e) => { if (e.key === "Escape" && this.el.classList.contains("is-open")) this.close(); });
      $(".cart__items").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-a]");
        if (!b) return;
        const it = this.items.find((x) => x.key === b.dataset.key);
        if (!it) return;
        if (b.dataset.a === "plus") it.q = Math.min(5, it.q + 1);
        if (b.dataset.a === "minus") it.q -= 1;
        if (b.dataset.a === "rm" || it.q < 1) this.items = this.items.filter((x) => x !== it);
        this.save();
      });
      $(".cart__go").addEventListener("click", () => { $(".cart__msg").textContent = t("cart.msg"); });
      this.render();
    },
    add(p, size) {
      const key = p.id + "|" + size;
      const it = this.items.find((x) => x.key === key);
      if (it) it.q = Math.min(5, it.q + 1);
      else this.items.push({ key, id: p.id, size, q: 1 });
      this.save();
      const cnt = $(".cart-count");
      cnt.classList.remove("bump"); void cnt.offsetWidth; cnt.classList.add("bump");
      const toast = $(".toast");
      toast.textContent = t("cart.added", { name: pName(p), s: size });
      toast.classList.add("is-on");
      clearTimeout(this.tt);
      this.tt = setTimeout(() => toast.classList.remove("is-on"), 2400);
    },
    save() { try { localStorage.setItem("noctrn-cart-v3", JSON.stringify(this.items)); } catch (e) {} this.render(); },
    render() {
      const n = this.items.reduce((s, x) => s + x.q, 0);
      const sub = this.items.reduce((s, x) => s + x.q * P(x.id).price, 0);
      const ship = sub >= CFG.free || !sub ? 0 : CFG.ship;
      $(".cart-count").textContent = n;
      $(".cart__sub").textContent = eur(sub);
      $(".cart__ship").textContent = ship ? eur(ship) : t("cart.free");
      $(".cart__left").textContent = sub && sub < CFG.free ? t("cart.left", { n: eur(CFG.free - sub) }) : "";
      $(".cart__total b").textContent = eur(sub + ship);
      this.el.classList.toggle("is-empty", !n);
      $(".cart__msg").textContent = "";
      $(".cart__items").innerHTML = this.items.map((x) => {
        const p = P(x.id);
        return `<li class="ci"><img src="${p.img}" alt="">
          <div><h3>${pName(p)}</h3><p class="mono">${t("cart.size", { s: x.size })} · ${eur(p.price)}</p>
            <div class="qty"><button type="button" data-a="minus" data-key="${x.key}" aria-label="${t("cart.minus")}">−</button><span>${x.q}</span><button type="button" data-a="plus" data-key="${x.key}" aria-label="${t("cart.plus")}">+</button></div></div>
          <div class="ci__right"><b>${eur(x.q * p.price)}</b><button type="button" class="ci__rm mono" data-a="rm" data-key="${x.key}">${t("cart.rm")}</button></div></li>`;
      }).join("");
    },
    open() { this.last = document.activeElement; $(".toast").classList.remove("is-on"); this.el.classList.add("is-open"); this.el.setAttribute("aria-hidden", "false"); X.lenis && X.lenis.stop(); setTimeout(() => $(".cart__close").focus(), 50); },
    close() { this.el.classList.remove("is-open"); this.el.setAttribute("aria-hidden", "true"); X.lenis && X.lenis.start(); this.last && this.last.focus && this.last.focus({ preventScroll: true }); },
  };
})();
