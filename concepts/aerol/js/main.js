/* Aerol : marque audio fictive, concept Weskale Studio.
   Un seul plan continu pilote par le defilement :
   photo d'ouverture -> sequence video (le casque se demonte) -> vue eclatee nette. */
(function () {
  "use strict";
  const X = window.WX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { clamp, smoothstep: ss } = X;
  const MOB = X.mobile();

  const CFG = {
    // Sequence inversee de la video d'assemblage : f_000 = casque assemble, derniere = eclate
    seq: MOB ? { dir: "assets/seq-m/", n: 91 } : { dir: "assets/seq/", n: 181 },
    hero: MOB ? "assets/hero-m.webp" : "assets/hero.webp",
    end: MOB ? "assets/eclate-m.webp" : "assets/eclate.webp",
    pin: MOB ? 3 : 4, // longueur de la section epinglee, en hauteurs d'ecran (norme : 250 a 400 vh, 200 a 300 sur telephone)
    finishes: [
      { id: "graphite", img: "assets/c-graphite.webp", c: "radial-gradient(circle at 35% 30%,#9a9a96,#3a3a39 60%,#121212)", price: 449 },
      { id: "nuit", img: "assets/c-nuit.webp", c: "radial-gradient(circle at 35% 30%,#8ea2c8,#2b3a5c 60%,#0c1220)", price: 469 },
      { id: "sable", img: "assets/c-sable.webp", c: "radial-gradient(circle at 35% 30%,#f0dcc0,#a8875f 60%,#4a3826)", price: 469 },
    ],
  };
  // Reperes de la timeline (progression 0..1 de la section epinglee)
  const T = { heroOut: 0.02, xf0: 0.06, xf1: 0.15, f0: 0.1, f1: 0.86, end0: 0.84, end1: 0.91 };
  const I18N = window.I18N;
  const eur = (n) => I18N.eur(n);
  const finName = (f) => I18N.t(`fin.${f.id}.name`);
  const fileOf = (k) => `${CFG.seq.dir}f_${String(k).padStart(3, "0")}.webp`;
  // Alignement mesure (boites englobantes) entre le casque de la photo d'ouverture et celui de f_000
  const ALIGN = { h: [0.51, 0.38], f: [0.586, 0.436], s: 0.77 };
  // Copie de la photo d'ouverture aux bords fondus vers le noir, pour le fondu vers la video
  function soften(img) {
    try {
      const w = img.naturalWidth, h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh); };
      fade(0, h, 0, h * 0.86, 0, h * 0.86, w, h * 0.14);
      fade(0, 0, w * 0.06, 0, 0, 0, w * 0.06, h);
      fade(w, 0, w * 0.94, 0, w * 0.94, 0, w * 0.06, h);
      return c;
    } catch (e) { return null; }
  }

  /* ================= Film : canvas + chargement progressif ================= */
  const Film = {
    imgs: [], ok: null, hero: null, end: null,
    p: 0, pt: 0, m: [0, 0], mt: [0, 0], dirty: true, visible: true, st: null,
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
      if (!seen.has(this.n - 1)) this.order.splice(1, 0, this.n - 1);
      this.active = 0;
      this.resize();
      addEventListener("resize", () => this.resize(true));
      if (!X.touch && X.anim) addEventListener("pointermove", (e) => { this.mt = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
      if ("IntersectionObserver" in window) new IntersectionObserver((e) => (this.visible = e[0].isIntersecting)).observe($(".film"));
      this.specs = $$(".spec").map((el) => ({ el, part: el.dataset.part.split(",").map(Number), anchor: el.dataset.anchor }));
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    },
    req(k) {
      if (k < 0 || k >= this.n || this.ok[k]) return false;
      this.ok[k] = 1; this.active++;
      const im = new Image();
      im.decoding = "async";
      // Image decodee hors du fil principal avant d'etre dessinee
      const fail = () => { this.ok[k] = 3; this.active--; this.pump(); };
      im.src = fileOf(k);
      im.decode().then(() => { this.imgs[k] = im; this.ok[k] = 2; this.active--; this.dirty = true; this.pump(); }, fail);
      return true;
    },
    // File d'attente : d'abord les images autour de la position courante, puis l'ordre grossier a fin
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
    // Premiere vague : photo d'ouverture, premiere image, et une image sur 16 pour le prechargeur
    preload(onP) {
      const first = this.order.slice(0, Math.ceil(this.n / 16) + 1);
      let done = 0; const total = first.length + 2;
      const step = () => { done++; onP(done / total); };
      const wait = (k) => new Promise((r) => { this.req(k); const t = setInterval(() => { if (this.ok[k] >= 2) { clearInterval(t); step(); r(); } }, 30); });
      return Promise.race([
        Promise.all([
          X.loadImg(CFG.hero).then((i) => { this.hero = i; this.heroSoft = soften(i); }).catch(() => {}).then(step),
          X.loadImg(CFG.end).then((i) => (this.end = i)).catch(() => {}).then(step),
          ...first.map(wait),
        ]),
        new Promise((r) => setTimeout(r, 9000)),
      ]).then(() => { this.dirty = true; this.key = ""; this.pump(); });
    },
    // Resolution dynamique (ordinateur) : densite 1 pendant le defilement, pleine densite des l'arret.
    // Au repos l'image est identique ; en mouvement il y a 2,25 fois moins de pixels a dessiner.
    resize(force) {
      const full = Math.min(devicePixelRatio || 1, MOB ? 2 : 1.5);
      const dpr = this.low ? Math.min(full, 1) : full;
      if (!force && dpr === this.dpr) return;
      this.dpr = dpr;
      this.W = Math.round(innerWidth * dpr); this.H = Math.round(innerHeight * dpr);
      this.cv.width = this.W; this.cv.height = this.H;
      this.cv.style.width = innerWidth + "px"; this.cv.style.height = innerHeight + "px";
      this.dirty = true; this.key = "";
      if (this.specs) this.specs.forEach((sp) => (sp.r = null));
    },
    frameAt(p) { return clamp((p - T.f0) / (T.f1 - T.f0), 0, 1) * (this.n - 1); },
    // Camera : z = largeur de l'image en multiples de la largeur d'ecran,
    // le point (fx, fy) de l'image est place en (sx, sy) de l'ecran.
    cams() {
      const W = this.W, H = this.H, AR = 16 / 9;
      if (H > W * 1.05) {
        return [
          { p: 0, z: 2.0, fx: 0.51, fy: 1, sx: 0.5, sy: 0.8 },
          { p: 0.15, z: 2.1, fx: 0.58, fy: 1, sx: 0.5, sy: 0.86 },
          { p: 0.36, z: 2.0, fx: 0.57, fy: 1, sx: 0.5, sy: 0.86 },
          { p: 0.7, z: 1.04, fx: 0.5, fy: 1, sx: 0.5, sy: 0.78 },
          { p: 1, z: 1.0, fx: 0.5, fy: 1, sx: 0.5, sy: 0.78 },
        ];
      }
      const zc = Math.max(1, (H * AR) / W), ze = Math.min(1, (H * AR) / W) * 0.97;
      return [
        { p: 0, z: zc, fx: 0.5, fy: 1, sx: 0.56, sy: 1 },
        { p: 0.15, z: zc * 1.03, fx: 0.56, fy: 1, sx: 0.56, sy: 1 },
        { p: 0.38, z: zc * 1.05, fx: 0.55, fy: 1, sx: 0.54, sy: 1 },
        { p: 0.72, z: ze, fx: 0.5, fy: 1, sx: 0.5, sy: 1 },
        { p: 1, z: ze * 0.985, fx: 0.5, fy: 1, sx: 0.5, sy: 1 },
      ];
    },
    cam(p) {
      const K = this.cams();
      let i = 0;
      while (i < K.length - 2 && p > K[i + 1].p) i++;
      const a = K[i], b = K[i + 1], t = ss(a.p, b.p, p);
      const o = {};
      ["z", "fx", "fy", "sx", "sy"].forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
      return o;
    },
    rect(c) {
      const W = this.W, H = this.H;
      const dw = W * c.z, dh = dw / (16 / 9);
      let dx = W * c.sx - c.fx * dw + this.m[0] * W * 0.006;
      const dy = H * c.sy - c.fy * dh + this.m[1] * H * 0.004;
      if (dw >= W) dx = clamp(dx, W - dw, 0);
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
      requestAnimationFrame(this.tick);
      // La progression arrive deja lissee par le scrub de la timeline
      const now = performance.now();
      if (this.pt !== this.p) {
        this.p = this.pt; this.dirty = true; this.moved = now;
        if (!MOB && !this.low && devicePixelRatio > 1) { this.low = true; this.resize(); }
      } else if (this.low && now - this.moved > 180) { this.low = false; this.resize(); }
      const mx = this.mt[0] - this.m[0], my = this.mt[1] - this.m[1];
      if (Math.abs(mx) + Math.abs(my) > 0.001) { this.m[0] += mx * 0.05; this.m[1] += my * 0.05; this.dirty = true; }
      if (!this.visible || !this.dirty) return;
      this.dirty = false;
      // On ne redessine que si l'image affichee, son cadrage ou les fiches changent
      const p = this.p, r = this.rect(this.cam(p));
      const key = [this.nearest(Math.floor(this.frameAt(p))), Math.round(r.dx), Math.round(r.dy), Math.round(r.dw), Math.round(ss(T.xf0, T.xf1, p) * 200), Math.round(ss(T.end0, T.end1, p) * 200),
        this.specs.map((sp) => Math.round((+gsap.getProperty(sp.el, "opacity") || 0) * 60) + "/" + Math.round(+gsap.getProperty(sp.el, "y") || 0)).join()].join("|");
      if (key === this.key) return;
      this.key = key;
      this.draw(p);
    },
    draw(p) {
      const g = this.ctx, W = this.W, H = this.H;
      const r = this.rect(this.cam(p));
      g.globalAlpha = 1;
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);
      const xf = ss(T.xf0, T.xf1, p), endA = ss(T.end0, T.end1, p);
      // Passage photo -> video : les deux casques restent superposes pendant le fondu.
      // Mesure : le casque de la video fait 0,77 fois celui de la photo.
      // e = 0 : cadrage de la photo ; e = 1 : cadrage de la video.
      const e = xf * xf * (3 - 2 * xf);
      const sc = 1 + (ALIGN.s - 1) * e;
      const cx = ALIGN.h[0] + (ALIGN.f[0] - ALIGN.h[0]) * e, cy = ALIGN.h[1] + (ALIGN.f[1] - ALIGN.h[1]) * e;
      const place = (k, c) => { const w = r.dw * k, h = r.dh * k; return [r.dx + cx * r.dw - c[0] * w, r.dy + cy * r.dh - c[1] * h, w, h]; };
      const vid = endA > 0 ? [r.dx, r.dy, r.dw, r.dh] : place(sc / ALIGN.s, ALIGN.f);
      const put = (img, a, R) => { if (!img || a <= 0) return; g.globalAlpha = a; g.drawImage(img, R[0], R[1], R[2], R[3]); };
      // Sequence (avec fondu entre deux images voisines)
      if (xf > 0 && endA < 1) {
        const i0 = Math.floor(this.frameAt(p));
        const a = this.nearest(i0);
        if (a >= 0) put(this.imgs[a], 1, vid);
      }
      if (xf < 1) put(this.heroSoft || this.hero, 1 - xf, place(sc, ALIGN.h));
      if (endA > 0) put(this.end, endA, [r.dx, r.dy, r.dw, r.dh]);
      const dip = Math.sin(Math.PI * xf) * 0.3;
      if (dip > 0.01) { g.globalAlpha = dip; g.fillStyle = "#000"; g.fillRect(0, 0, W, H); }
      g.globalAlpha = 1;
      // Haut de l'image adouci quand il reste du noir au-dessus
      if (r.dy > 1) {
        const h = r.dh * 0.1, gr = g.createLinearGradient(0, r.dy, 0, r.dy + h);
        gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.fillRect(0, r.dy - 1, W, h + 1);
      }
      // Fondu vers le noir sous l'image quand elle ne touche pas le bas de l'ecran
      const bottom = r.dy + r.dh;
      if (bottom < H - 1) {
        const h = r.dh * 0.22, gr = g.createLinearGradient(0, bottom - h, 0, bottom);
        gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "#000");
        g.fillStyle = gr; g.fillRect(0, bottom - h, W, h + 1);
        g.fillStyle = "#000"; g.fillRect(0, bottom, W, H - bottom);
      }
      if (r.dw < W - 1) {
        const w = r.dw * 0.06;
        [[r.dx, r.dx + w, 1], [r.dx + r.dw, r.dx + r.dw - w, 1]].forEach(([x0, x1]) => {
          const gr = g.createLinearGradient(x0, 0, x1, 0);
          gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, w, H);
        });
      }
      this.lines(r);
    },
    // Lignes de rappel entre chaque fiche et sa piece (ecran large seulement)
    lines(r) {
      if (!X.anim || this.H > this.W || innerWidth < 900) return;
      const g = this.ctx, d = this.dpr;
      this.specs.forEach((s) => {
        const a = +gsap.getProperty(s.el, "opacity") || 0;
        if (a < 0.02) return;
        // Rectangle mesure une fois (pas de lecture de mise en page a chaque image)
        if (!s.r) { const y0 = +gsap.getProperty(s.el, "y") || 0, q = s.el.getBoundingClientRect(); s.r = { left: q.left, right: q.right, top: q.top - y0, bottom: q.bottom - y0 }; }
        const dy = +gsap.getProperty(s.el, "y") || 0;
        const b = { left: s.r.left, right: s.r.right, top: s.r.top + dy, bottom: s.r.bottom + dy };
        const ax = (s.anchor[1] === "r" ? b.right + 12 : b.left - 12) * d;
        const ay = (s.anchor[0] === "b" ? b.bottom + 10 : b.top - 10) * d;
        const px = r.dx + s.part[0] * r.dw, py = r.dy + s.part[1] * r.dh;
        const k = ss(0, 1, a);
        g.globalAlpha = 0.55 * a;
        g.strokeStyle = "#ece9e4"; g.lineWidth = 1 * d;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + (px - ax) * k, ay + (py - ay) * k); g.stroke();
        if (k > 0.98) {
          g.globalAlpha = a;
          g.beginPath(); g.arc(px, py, 5 * d, 0, Math.PI * 2); g.stroke();
          g.fillStyle = "#c9895e"; g.beginPath(); g.arc(px, py, 2 * d, 0, Math.PI * 2); g.fill();
        }
      });
      g.globalAlpha = 1;
    },
  };

  /* ================= Timeline epinglee ================= */
  function buildFilm() {
    if (!X.anim) return;
    const nums = $$(".spec [data-num]");
    nums.forEach((n) => (n.textContent = "0"));
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      // Le canvas suit la progression lissee de la timeline (scrub court)
      onUpdate() { Film.pt = this.progress(); Film.pump(); },
      scrollTrigger: {
        trigger: ".film", start: "top top", end: () => "+=" + innerHeight * CFG.pin, pin: true, scrub: 0.4,
        invalidateOnRefresh: true,
        onRefresh: () => { Film.specs.forEach((sp) => (sp.r = null)); Film.key = ""; },
      },
    });
    Film.st = tl.scrollTrigger;
    tl.to(".film__hero > *", { y: -50, opacity: 0, stagger: 0.008, duration: 0.05 }, T.heroOut)
      .to(".film__hint", { opacity: 0, duration: 0.03 }, 0.01)
      .fromTo(".chap .eyebrow, .chap__text", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05 }, 0.17)
      .fromTo(".chap__title .l > span", { yPercent: 105 }, { yPercent: 0, duration: 0.07, stagger: 0.02, ease: "power2.out" }, 0.15)
      .set(".chap", { opacity: 1 }, 0.149)
      .to(".chap", { opacity: 0, y: -40, duration: 0.05 }, 0.4);
    $$(".spec").forEach((el, i) => {
      const at = 0.7 + i * 0.06;
      tl.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, at);
      const n = el.querySelector("[data-num]");
      if (n) { const o = { v: 0 }; tl.to(o, { v: +n.dataset.num, duration: 0.06, ease: "power2.out", onUpdate: () => (n.textContent = Math.round(o.v)) }, at); }
    });
    tl.fromTo(".specs__note", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.88)
      .fromTo(".film__bar i", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .set({}, {}, 1);
  }

  /* ================= Prechargeur et entree ================= */
  const pctEl = $(".loader__pct span"), lineEl = $(".loader__line i");
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
    Order.init();
    Cart.init();
    document.addEventListener("langchange", () => {
      Order.relabel();
      Cart.render();
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
    const chars = X.split($(".hero__title .l"), true).concat(X.split($(".hero__title .l--i"), true));
    if (!X.anim) { loader && loader.remove(); return; }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    Film.introTl = tl;
    tl.to(".loader__line", { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "power3.in" }, 0)
      .to(".loader__name, .loader__pct", { opacity: 0, y: -14, duration: 0.5, ease: "power2.in" }, 0.05)
      .to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }, 0.55)
      .fromTo(".film__stage", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.4, ease: "power2.out" }, 0.5)
      .from(chars, { yPercent: 115, duration: 1.4, stagger: 0.045 }, 1.0)
      .from(".film__hero .eyebrow, .hero__lead, .hero__cta, .film__hint", { opacity: 0, y: 24, duration: 1.2, stagger: 0.08 }, 1.4)
      .from(".nav > *", { opacity: 0, y: -16, duration: 1, stagger: 0.06 }, 1.3);
  }

  // Liens internes : "Anatomie" vise la vue eclatee, au bon endroit de la section epinglee
  function links() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const el = id.length > 1 && document.querySelector(id);
      if (!el && id !== "#top") return;
      e.preventDefault();
      if (a.dataset.film && Film.st) { X.scrollTo(Film.st.start + (Film.st.end - Film.st.start) * +a.dataset.film); return; }
      X.scrollTo(id === "#top" ? 0 : el.getBoundingClientRect().top + scrollY - X.navH());
    });
  }

  /* ================= Configurateur ================= */
  const Order = {
    cur: 0,
    init() {
      const F = CFG.finishes, box = $(".order__imgs"), sw = $(".finishes");
      box.innerHTML = F.map((f, i) => `<img class="order__img${i ? "" : " is-on"}" src="${f.img}" alt="${I18N.t("order.imgAlt", { name: finName(f) })}" ${i ? 'loading="lazy"' : ""}>`).join("");
      sw.innerHTML = F.map((f, i) => `<button type="button" class="fin${i ? "" : " is-on"}" role="radio" aria-checked="${!i}" data-i="${i}"><i style="background:${f.c}"></i><span>${finName(f)}</span></button>`).join("");
      sw.addEventListener("click", (e) => { const b = e.target.closest(".fin"); if (b) this.set(+b.dataset.i); });
      sw.addEventListener("keydown", (e) => {
        if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
        e.preventDefault();
        const n = (this.cur + (/Right|Down/.test(e.key) ? 1 : F.length - 1)) % F.length;
        this.set(n); sw.children[n].focus();
      });
      $(".order .add").addEventListener("click", () => Cart.add(F[this.cur]));
      this.text(0);
      if (X.anim && !X.touch) {
        const v = $(".order__view");
        v.addEventListener("pointermove", (e) => { const r = v.getBoundingClientRect(); gsap.to(".order__imgs", { x: ((e.clientX - r.left) / r.width - 0.5) * -14, y: ((e.clientY - r.top) / r.height - 0.5) * -10, duration: 1, ease: "power3.out" }); });
        v.addEventListener("pointerleave", () => gsap.to(".order__imgs", { x: 0, y: 0, duration: 1.2, ease: "power3.out" }));
      }
      if (X.anim) gsap.fromTo(".order__view", { clipPath: "inset(14% 10% 14% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".order", start: "top 90%", end: "top 30%", scrub: 0.4 } });
    },
    text(i) {
      const f = CFG.finishes[i];
      $(".order__desc").textContent = I18N.t(`fin.${f.id}.desc`);
      $(".order__price").textContent = eur(f.price);
    },
    // Changement de langue : libelles, textes alternatifs, description et prix
    relabel() {
      const F = CFG.finishes;
      $$(".fin span").forEach((sp, k) => (sp.textContent = finName(F[k])));
      $$(".order__img").forEach((im, k) => (im.alt = I18N.t("order.imgAlt", { name: finName(F[k]) })));
      $(".order__name").textContent = finName(F[this.cur]);
      this.text(this.cur);
    },
    set(i) {
      if (i === this.cur) return;
      const imgs = $$(".order__img"), prev = this.cur, f = CFG.finishes[i];
      this.cur = i;
      this.text(i);
      $$(".fin").forEach((b, k) => { b.classList.toggle("is-on", k === i); b.setAttribute("aria-checked", k === i); });
      const nm = $(".order__name");
      imgs.forEach((im, k) => { im.style.zIndex = k === i ? 2 : k === prev ? 1 : 0; });
      imgs[i].classList.add("is-on");
      if (X.anim) {
        gsap.fromTo(imgs[i], { clipPath: "inset(0% 0% 0% 100%)", scale: 1.06 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.1, ease: "expo.inOut", onComplete: () => imgs.forEach((im, k) => k !== i && im.classList.remove("is-on")) });
        gsap.to(nm, { yPercent: -100, opacity: 0, duration: 0.35, ease: "power3.in", onComplete: () => { nm.textContent = finName(f); gsap.fromTo(nm, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: "expo.out" }); } });
      } else {
        imgs.forEach((im, k) => k !== i && im.classList.remove("is-on"));
        nm.textContent = finName(f);
      }
    },
  };

  /* ================= Panier (fonctionne en demo, aucun paiement) ================= */
  const Cart = {
    items: [],
    init() {
      try { this.items = JSON.parse(localStorage.getItem("aerol-cart-v2") || "[]").filter((x) => CFG.finishes.some((f) => f.id === x.id)); } catch (e) { this.items = []; }
      this.el = $(".cart");
      $(".nav__cart").addEventListener("click", () => this.open());
      $(".cart__close").addEventListener("click", () => this.close());
      $(".cart__veil").addEventListener("click", () => this.close());
      addEventListener("keydown", (e) => { if (e.key === "Escape") this.close(); });
      $(".cart__items").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-a]");
        if (!b) return;
        const it = this.items.find((x) => x.id === b.dataset.id);
        if (!it) return;
        if (b.dataset.a === "plus") it.q = Math.min(5, it.q + 1);
        if (b.dataset.a === "minus") it.q -= 1;
        if (b.dataset.a === "rm" || it.q < 1) this.items = this.items.filter((x) => x !== it);
        this.save();
      });
      $(".cart__go").addEventListener("click", () => {
        $(".cart__msg").textContent = I18N.t("cart.msg");
      });
      this.render();
    },
    add(f) {
      const it = this.items.find((x) => x.id === f.id);
      if (it) it.q = Math.min(5, it.q + 1);
      else this.items.push({ id: f.id, price: f.price, img: f.img, q: 1 });
      this.save();
      const cnt = $(".cart-count");
      cnt.classList.remove("bump"); void cnt.offsetWidth; cnt.classList.add("bump");
      const t = $(".toast");
      t.textContent = I18N.t("cart.added", { name: finName(f) });
      t.classList.add("is-on");
      clearTimeout(this.tt);
      this.tt = setTimeout(() => t.classList.remove("is-on"), 2200);
    },
    save() { try { localStorage.setItem("aerol-cart-v2", JSON.stringify(this.items)); } catch (e) {} this.render(); },
    render() {
      const n = this.items.reduce((s, x) => s + x.q, 0), tot = this.items.reduce((s, x) => s + x.q * x.price, 0);
      $(".cart-count").textContent = n;
      $(".cart__total b").textContent = eur(tot);
      this.el.classList.toggle("is-empty", !n);
      $(".cart__msg").textContent = "";
      $(".cart__items").innerHTML = this.items.map((x) => `
        <li class="ci"><img src="${x.img}" alt="">
          <div><h3>Aerol One, ${finName(x)}</h3><p class="mono">${eur(x.price)}</p>
            <div class="qty"><button type="button" data-a="minus" data-id="${x.id}" aria-label="${I18N.t("cart.minus")}">−</button><span>${x.q}</span><button type="button" data-a="plus" data-id="${x.id}" aria-label="${I18N.t("cart.plus")}">+</button></div></div>
          <div class="ci__right"><b>${eur(x.q * x.price)}</b><button type="button" class="ci__rm mono" data-a="rm" data-id="${x.id}">${I18N.t("cart.rm")}</button></div></li>`).join("");
    },
    open() { this.el.classList.add("is-open"); this.el.setAttribute("aria-hidden", "false"); X.lenis && X.lenis.stop(); setTimeout(() => $(".cart__close").focus(), 50); },
    close() { this.el.classList.remove("is-open"); this.el.setAttribute("aria-hidden", "true"); X.lenis && X.lenis.start(); },
  };
})();
