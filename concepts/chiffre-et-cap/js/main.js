/* Chiffre & Cap : cabinet d'expertise comptable fictif, concept Weskale Studio.
   Ouverture : plan de camera pilote par le defilement sur la photo du dirigeant (Google Flow),
   avec sa carte de profondeur (WebGL brut, repli en canvas 2D). Puis un grand nombre
   par ecran, le simulateur, la fondatrice, les missions et la prise de rendez-vous. */
(function () {
  "use strict";
  const X = window.WX;
  const I18N = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { clamp, smoothstep: ss } = X;
  const MOB = X.mobile();
  const PAPER = [241 / 255, 236 / 255, 226 / 255];
  const IMG_AR = 2752 / 1536;

  const CFG = {
    hero: "assets/hero.webp",
    depth: "assets/hero-depth.jpg",
    pin: MOB ? 3 : 4, // longueur de l'ouverture epinglee, en hauteurs d'ecran (norme : 250 a 400 vh, 200 a 300 sur telephone)
  };
  // Reperes de la timeline de l'ouverture (progression 0..1)
  const T = { c1: [0.14, 0.37], c2: [0.45, 0.68], c3: [0.85, 1.2], fade: [0.72, 0.86] };

  /* ================= Camera sur la photo ================= */
  // z : zoom par rapport au cadrage plein ecran ; (fx, fy) point de l'image place en (sx, sy) de l'ecran ;
  // d : poussee en profondeur (les plans proches avancent plus vite que le fond).
  // Reperes de l'image : tablette (0.6, 0.57), pochette gravee CHIFFRE & CAP (0.475, 0.85), visage (0.8, 0.24).
  function cams(W, H) {
    if (H > W * 1.05) {
      return [
        { p: 0, z: 1.0, fx: 0.7, fy: 0.5, sx: 0.5, sy: 0.5, d: 0 },
        { p: 0.08, z: 1.0, fx: 0.7, fy: 0.5, sx: 0.5, sy: 0.5, d: 0 },
        { p: 0.3, z: 1.5, fx: 0.6, fy: 0.57, sx: 0.5, sy: 0.32, d: 0.25 },
        { p: 0.4, z: 1.55, fx: 0.6, fy: 0.57, sx: 0.5, sy: 0.32, d: 0.28 },
        { p: 0.56, z: 1.0, fx: 0.475, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.12 },
        { p: 0.7, z: 1.04, fx: 0.475, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.14 },
        { p: 0.9, z: 1.0, fx: 0.62, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.04 },
        { p: 1, z: 1.0, fx: 0.62, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.04 },
      ];
    }
    return [
      { p: 0, z: 1.0, fx: 0.5, fy: 0.5, sx: 0.5, sy: 0.5, d: 0 },
      { p: 0.06, z: 1.0, fx: 0.5, fy: 0.5, sx: 0.5, sy: 0.5, d: 0 },
      { p: 0.28, z: 2.2, fx: 0.6, fy: 0.56, sx: 0.64, sy: 0.48, d: 0.3 },
      { p: 0.38, z: 2.3, fx: 0.6, fy: 0.56, sx: 0.64, sy: 0.48, d: 0.34 },
      { p: 0.56, z: 1.6, fx: 0.475, fy: 0.84, sx: 0.36, sy: 0.7, d: 0.24 },
      { p: 0.68, z: 1.66, fx: 0.475, fy: 0.84, sx: 0.36, sy: 0.7, d: 0.26 },
      { p: 0.9, z: 1.04, fx: 0.55, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.06 },
      { p: 1, z: 1.02, fx: 0.55, fy: 0.5, sx: 0.5, sy: 0.5, d: 0.04 },
    ];
  }
  function camAt(K, p) {
    let i = 0;
    while (i < K.length - 2 && p > K[i + 1].p) i++;
    const a = K[i], b = K[i + 1], t = ss(a.p, b.p, p);
    const o = {};
    ["z", "fx", "fy", "sx", "sy", "d"].forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
    return o;
  }
  // Taille de l'image affichee et point vise, recale pour ne jamais montrer de bord
  function frame(W, H, c) {
    const dw = Math.max(W, H * IMG_AR) * c.z, dh = dw / IMG_AR;
    const hx = (c.sx * W) / dw, hx2 = ((1 - c.sx) * W) / dw;
    const hy = (c.sy * H) / dh, hy2 = ((1 - c.sy) * H) / dh;
    const fx = clamp(c.fx, hx, 1 - hx2), fy = clamp(c.fy, hy, 1 - hy2);
    return { dw, dh, fx, fy };
  }

  const VS = "attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
  const FS = `precision highp float;
varying vec2 v;
uniform sampler2D uImg; uniform sampler2D uDep;
uniform vec2 uRes; uniform vec2 uDisp; uniform vec2 uF; uniform vec2 uS;
uniform float uDolly; uniform vec2 uMouse; uniform float uFade; uniform vec3 uPaper; uniform float uTime;
void main(){
  vec2 s = vec2(v.x, 1. - v.y);
  vec2 base = uF + (s - uS) * uRes / uDisp;
  vec2 p = base;
  float d = texture2D(uDep, p).r;
  for (int i = 0; i < 3; i++) {
    p = uF + (base - uF) / (1. + uDolly * (d - .38));
    d = texture2D(uDep, clamp(p, .001, .999)).r;
  }
  p += uMouse * (d - .45) * .012;
  p = clamp(p, .001, .999);
  vec3 c = texture2D(uImg, p).rgb;
  // Lumiere du jour, legerement chaude, et vignette tres douce
  c = mix(c, c * vec3(1.02, 1.0, .965), .5);
  float vig = smoothstep(1.2, .3, length(v - .5) * 1.25);
  c *= mix(1., vig, .12);
  // Grain de papier
  float g = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  c += (g - .5) * .025;
  c = mix(c, uPaper, uFade);
  gl_FragColor = vec4(c, 1.);
}`;

  const Film = {
    p: 0, pt: 0, m: [0, 0], mt: [0, 0], dirty: true, visible: true, gl: null, st: null,
    init() {
      this.cv = $(".film__cv");
      this.tryGL();
      if (!this.gl) this.ctx = this.cv.getContext("2d", { alpha: false });
      this.resize();
      addEventListener("resize", () => this.resize(true));
      if (!X.touch && X.anim) addEventListener("pointermove", (e) => { this.mt = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
      if ("IntersectionObserver" in window) new IntersectionObserver((e) => (this.visible = e[0].isIntersecting)).observe($(".film"));
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    },
    tryGL() {
      try {
        const gl = this.cv.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false });
        if (!gl) return;
        const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
        gl.useProgram(pr);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "a");
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        this.U = {};
        ["uImg", "uDep", "uRes", "uDisp", "uF", "uS", "uDolly", "uMouse", "uFade", "uPaper", "uTime"].forEach((n) => (this.U[n] = gl.getUniformLocation(pr, n)));
        gl.uniform1i(this.U.uImg, 0); gl.uniform1i(this.U.uDep, 1);
        gl.uniform3f(this.U.uPaper, PAPER[0], PAPER[1], PAPER[2]);
        this.gl = gl;
        this.cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.gl = null; this.ctx = null; this.cv.style.display = "none"; });
      } catch (e) { this.gl = null; }
    },
    tex(unit, img) {
      const gl = this.gl, t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    },
    preload(onP) {
      let done = 0;
      const step = () => { done++; onP(done / 2); };
      return Promise.race([
        Promise.all([
          X.loadImg(CFG.hero).then((i) => (this.img = i)).catch(() => {}).then(step),
          X.loadImg(CFG.depth).then((i) => (this.dep = i)).catch(() => {}).then(step),
        ]),
        new Promise((r) => setTimeout(r, 8000)),
      ]).then(() => {
        if (this.gl && this.img && this.dep) { try { this.tex(0, this.img); this.tex(1, this.dep); } catch (e) { this.gl = null; } }
        if (!this.gl && !this.ctx) this.ctx = this.cv.getContext("2d", { alpha: false });
        this.ready = !!this.img;
        if (this.ready) $(".film").classList.add("is-ready");
        this.dirty = true;
      });
    },
    // Resolution dynamique : densite reduite pendant le defilement, pleine densite des l'arret (180 ms).
    // Au repos l'image est identique ; en mouvement le shader traite et transmet 3 a 4 fois moins de pixels
    // (0,55 sur ordinateur, 1 sur telephone), sur tous les ecrans et non plus seulement en haute densite.
    resize(force) {
      const full = Math.min(devicePixelRatio || 1, MOB ? 2 : 1.5);
      const dpr = this.low ? Math.min(full, MOB ? 1 : 0.55) : full;
      if (!force && dpr === this.dpr) return;
      this.dpr = dpr;
      this.W = Math.round(innerWidth * dpr); this.H = Math.round(innerHeight * dpr);
      this.cv.width = this.W; this.cv.height = this.H;
      if (this.gl) this.gl.viewport(0, 0, this.W, this.H);
      this.dirty = true;
    },
    tick(t) {
      requestAnimationFrame(this.tick);
      // La progression arrive deja lissee par le scrub de la timeline
      const now = performance.now();
      if (this.pt !== this.p) {
        this.p = this.pt; this.dirty = true; this.moved = now;
        if (!this.low) { this.low = true; this.resize(); }
      } else if (this.low && now - this.moved > 180) { this.low = false; this.resize(); }
      const mx = this.mt[0] - this.m[0], my = this.mt[1] - this.m[1];
      if (Math.abs(mx) + Math.abs(my) > 0.001) { this.m[0] += mx * 0.05; this.m[1] += my * 0.05; this.dirty = true; }
      if (!this.visible || !this.dirty || !this.ready) return;
      this.dirty = false;
      this.draw(this.p, t);
    },
    draw(p, t) {
      const W = this.W, H = this.H;
      const c = camAt(cams(W, H), p);
      const f = frame(W, H, c);
      const fade = X.anim ? ss(T.fade[0], T.fade[1], p) : 0;
      if (this.gl) {
        const gl = this.gl, U = this.U;
        gl.uniform2f(U.uRes, W, H); gl.uniform2f(U.uDisp, f.dw, f.dh);
        gl.uniform2f(U.uF, f.fx, f.fy); gl.uniform2f(U.uS, c.sx, c.sy);
        gl.uniform1f(U.uDolly, c.d); gl.uniform2f(U.uMouse, this.m[0], this.m[1]);
        gl.uniform1f(U.uFade, fade); gl.uniform1f(U.uTime, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return;
      }
      if (!this.ctx) return;
      const g = this.ctx;
      const z = 1 + c.d * 0.12;
      const dw = f.dw * z, dh = f.dh * z;
      g.globalAlpha = 1;
      g.drawImage(this.img, c.sx * W - f.fx * dw, c.sy * H - f.fy * dh, dw, dh);
      if (fade > 0) { g.globalAlpha = fade; g.fillStyle = "#F1ECE2"; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    },
  };

  /* ================= Timeline epinglee de l'ouverture ================= */
  function buildFilm() {
    if (!X.anim) return;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      // Le canvas suit la progression lissee de la timeline (scrub court)
      onUpdate() { Film.pt = this.progress(); },
      scrollTrigger: {
        trigger: ".film", start: "top top", end: () => "+=" + innerHeight * CFG.pin, pin: true, scrub: 0.4,
        invalidateOnRefresh: true,
      },
    });
    Film.st = tl.scrollTrigger;
    tl.to(".film__hero > *", { y: -50, opacity: 0, stagger: 0.006, duration: 0.05 }, 0.02)
      .to(".film__hint", { opacity: 0, duration: 0.03 }, 0.01)
      .to(".film__veil", { opacity: MOB ? 1 : 0.35, duration: 0.08 }, 0.04);
    [["chap--1", T.c1], ["chap--2", T.c2], ["chap--3", T.c3]].forEach(([c, [a, b]]) => {
      const sel = "." + c;
      tl.set(sel, { autoAlpha: 1 }, a - 0.001)
        .fromTo(sel + " .eyebrow, " + sel + " .chap__text", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05 }, a + 0.02)
        .fromTo(sel + " .chap__title .l > span", { yPercent: 108 }, { yPercent: 0, duration: 0.06, stagger: 0.02, ease: "power2.out" }, a);
      if (b < 1) tl.to(sel, { opacity: 0, y: -40, duration: 0.05 }, b - 0.05).set(sel, { autoAlpha: 0, y: 0 }, b);
    });
    tl.to(".film__veil", { opacity: 0, duration: 0.06 }, 0.76)
      .fromTo(".film__bar i", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .set({}, {}, 1);
  }

  /* ================= Chiffres : un grand nombre par ecran ================= */
  const Ledger = {
    ca: [29400, 31200, 34800, 32100, 36500, 35200, 38900, 27600, 33400, 39800, 42100, 31800],
    ch: [25100, 24800, 27300, 26200, 27900, 26800, 28400, 24900, 26100, 28700, 29600, 18600],
    init() {
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      let t = 25000;
      const tr = this.ca.map((v, i) => (t += (v - this.ch[i]) * 0.55));
      this.vals = [sum(this.ca), sum(this.ca) - sum(this.ch), Math.round(tr[11])];
      this.val = $(".ledger__val");
      this.labels = $$(".ledger__labels li");
      this.cur = -1;
      this.drawChart();
      this.months();
      this.sr();
      if (!X.anim) { this.show(this.vals[0]); this.stage(0); this.labels.forEach((l) => l.classList.add("is-on")); return; }
      this.show(0);
      const o = { v: 0 };
      const line = $(".lc__line"), cost = $(".lc__cost"), area = $(".lc__area");
      const L1 = line.getTotalLength(), L2 = cost.getTotalLength();
      gsap.set(line, { strokeDasharray: L1, strokeDashoffset: L1 });
      gsap.set(cost, { strokeDasharray: L2, strokeDashoffset: L2 });
      gsap.set(area, { opacity: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: ".ledger", start: "top top", end: () => "+=" + innerHeight * (MOB ? 2.4 : 2.8), pin: ".ledger__pin", scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (s) => this.stage(s.progress < 0.38 ? 0 : s.progress < 0.7 ? 1 : 2),
        },
      });
      const set = () => this.show(o.v);
      tl.fromTo(".ledger__head", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.06 }, 0)
        .to(o, { v: this.vals[0], duration: 0.26, ease: "power2.out", onUpdate: set }, 0.02)
        .to(line, { strokeDashoffset: 0, duration: 0.28 }, 0.02)
        .to(o, { v: this.vals[1], duration: 0.2, ease: "power2.inOut", onUpdate: set }, 0.4)
        .to(cost, { strokeDashoffset: 0, duration: 0.22 }, 0.38)
        .to(o, { v: this.vals[2], duration: 0.2, ease: "power2.inOut", onUpdate: set }, 0.72)
        .to(area, { opacity: 1, duration: 0.2 }, 0.7)
        .set({}, {}, 1);
      this.stage(0);
    },
    stage(i) {
      if (i === this.cur) return;
      this.cur = i;
      this.labels.forEach((l, k) => l.classList.toggle("is-on", k === i));
    },
    show(v) { this.lastV = v; this.val.textContent = I18N.num(v); },
    sr() { $$(".ledger__sr").forEach((b, i) => (b.textContent = ": " + I18N.eur(this.vals[i]))); },
    months() {
      const box = $(".ledger__months");
      box.innerHTML = I18N.t("led.months").split(",").map((m) => `<span>${m}</span>`).join("");
    },
    drawChart() {
      const NS = "http://www.w3.org/2000/svg";
      const L = 0, R = 1200, Tp = 40, B = 380, max = 48000;
      const Xp = (i) => L + (i * (R - L)) / 11, Yp = (v) => B - (v / max) * (B - Tp);
      const smooth = (pts) => pts.reduce((d, p, i, a) => {
        if (!i) return `M${p[0]},${p[1]}`;
        const [x0, y0] = a[i - 1], cx = (x0 + p[0]) / 2;
        return d + ` C${cx},${y0} ${cx},${p[1]} ${p[0]},${p[1]}`;
      }, "");
      const caP = this.ca.map((v, i) => [Xp(i), Yp(v)]), chP = this.ch.map((v, i) => [Xp(i), Yp(v)]);
      $(".lc__line").setAttribute("d", smooth(caP));
      $(".lc__cost").setAttribute("d", smooth(chP));
      $(".lc__area").setAttribute("d", smooth(caP) + ` L${R},${B} L${L},${B} Z`);
      const g = $(".lc__grid");
      [0, 1, 2, 3, 4].forEach((k) => { const l = document.createElementNS(NS, "line"); const y = Tp + (k * (B - Tp)) / 4; l.setAttribute("x1", 0); l.setAttribute("x2", 1200); l.setAttribute("y1", y); l.setAttribute("y2", y); g.appendChild(l); });
      // Degrade laiton de la surface
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML = '<linearGradient id="lcArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#B28B4F" stop-opacity=".22"/><stop offset="1" stop-color="#B28B4F" stop-opacity="0"/></linearGradient>';
      $(".ledger__chart").prepend(defs);
    },
    // Changement de langue : mois, valeurs lues par les lecteurs d'ecran, separateur des milliers
    relabel() { this.months(); this.sr(); this.show(this.lastV || 0); },
  };

  /* ================= Simulateur « combien je me verse » ================= */
  function calc(statut, B, part) {
    const S = B * part;
    const netSal = statut === "sasu" ? S / 1.82 : S / 1.45;
    let soc = S - netSal;
    const Rr = B - S;
    const is = Rr <= 42500 ? Rr * 0.15 : 42500 * 0.15 + (Rr - 42500) * 0.25;
    const D = Rr - is;
    let pfu, netDiv;
    if (statut === "sasu") { pfu = D * 0.3; netDiv = D - pfu; }
    else { const sd = D * 0.4; soc += sd; pfu = D * 0.128; netDiv = D - sd - pfu; }
    return { net: netSal + netDiv, soc, is, pfu };
  }
  const Sim = {
    init() {
      this.root = $(".sim");
      this.benef = $('input[name="benef"]');
      this.part = $('input[name="part"]');
      this.seg = $(".sim .seg");
      this.shown = { v: 0 };
      this.first = true;
      this.stack = { net: $(".stack .s-net"), soc: $(".stack .s-soc"), is: $(".stack .s-is"), pfu: $(".stack .s-div") };
      this.root.addEventListener("input", () => this.update());
      this.root.addEventListener("change", () => this.update());
      this.update();
      if (X.anim) {
        gsap.from(".sim__sheet", { y: 70, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".sim__sheet", start: "top 88%", once: true } });
        // Le curseur glisse une fois quand le simulateur apparait, pour montrer qu'il se manipule
        ScrollTrigger.create({ trigger: ".sim__sheet", start: "top 55%", once: true, onEnter: () => {
          const o = { v: 60 };
          const upd = () => { this.part.value = Math.round(o.v); this.update(); };
          gsap.timeline().to(o, { v: 25, duration: 1.1, ease: "power2.inOut", onUpdate: upd }).to(o, { v: 60, duration: 1.1, ease: "power2.inOut", onUpdate: upd });
        } });
      }
    },
    res(k) { return $(`[data-res="${k}"]`); },
    update() {
      const statut = $('input[name="statut"]:checked').value, Bv = +this.benef.value, p = +this.part.value / 100;
      const eur = I18N.eur;
      this.seg.classList.toggle("is-right", statut === "eurl");
      this.benef.style.setProperty("--fill", ((Bv - 20000) / 280000) * 100 + "%");
      this.part.style.setProperty("--fill", p * 100 + "%");
      $('[data-out="benef"]').textContent = eur(Bv);
      $('[data-out="part"]').textContent = Math.round(p * 100) + " %";
      const r = calc(statut, Bv, p);
      const paint = () => { this.res("net").textContent = eur(this.shown.v); this.res("mois").textContent = I18N.t("sim.month", { v: eur(this.shown.v / 12) }); };
      if (this.first || !X.anim) { this.shown.v = r.net; paint(); }
      else gsap.to(this.shown, { v: r.net, duration: 0.7, ease: "power3.out", overwrite: true, onUpdate: paint });
      this.res("netb").textContent = eur(r.net); this.res("soc").textContent = eur(r.soc);
      this.res("is").textContent = eur(r.is); this.res("pfu").textContent = eur(r.pfu);
      Object.entries(this.stack).forEach(([k, el]) => (el.style.width = `calc(${(r[k] / Bv) * 100}% - 3px)`));
      const pts = []; let bi = 0, bv = -1, mx = 0, mn = Infinity;
      for (let i = 0; i <= 100; i++) { const n = calc(statut, Bv, i / 100).net; pts.push(n); if (n > bv) { bv = n; bi = i; } mx = Math.max(mx, n); mn = Math.min(mn, n); }
      const lo = mn * 0.92, Xc = (i) => (i / 100) * 400, Yc = (n) => 124 - ((n - lo) / (mx - lo || 1)) * 104;
      const d = pts.map((n, i) => `${i ? "L" : "M"}${Xc(i).toFixed(1)},${Yc(n).toFixed(1)}`).join(" ");
      $(".curve__line").setAttribute("d", d);
      $(".curve__area").setAttribute("d", d + " L400,130 L0,130 Z");
      const dot = $(".curve__dot");
      if (X.hasGsap) gsap.to(dot, { attr: { cx: Xc(p * 100), cy: Yc(pts[Math.round(p * 100)]) }, duration: this.first ? 0 : 0.4, ease: "power3.out" });
      else { dot.setAttribute("cx", Xc(p * 100)); dot.setAttribute("cy", Yc(pts[Math.round(p * 100)])); }
      const best = $(".curve__best");
      best.setAttribute("x1", Xc(bi)); best.setAttribute("x2", Xc(bi));
      $(".curve__bestlabel").setAttribute("x", Math.min(360, Math.max(40, Xc(bi))));
      const gap = Math.round(bv - r.net);
      this.res("advice").textContent = gap < 300 ? I18N.t("sim.adviceBest") : I18N.t("sim.advice", { p: bi, g: eur(gap) });
      this.first = false;
    },
  };

  /* ================= Fondatrice ================= */
  function founder() {
    if (!X.anim) return;
    gsap.fromTo(".founder__pic img", { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".founder", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    gsap.fromTo(".founder__pic", { clipPath: "inset(18% 12% 18% 12%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".founder", start: "top 90%", end: "top 25%", scrub: 0.4 } });
    gsap.from(".founder__plate", { opacity: 0, y: 20, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".founder__pic", start: "top 40%", once: true } });
    gsap.from(".founder__name, .founder__t, .founder__second, .founder__note", { opacity: 0, y: 26, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ".founder__name", start: "top 88%", once: true } });
  }

  /* ================= Missions ================= */
  function missions() {
    const rows = $$(".row");
    rows.forEach((d) => d.addEventListener("toggle", () => { if (d.open) rows.forEach((o) => o !== d && (o.open = false)); }));
    if (!X.anim) return;
    gsap.from(".row", { opacity: 0, y: 30, duration: 1, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".rows", start: "top 85%", once: true } });
  }

  /* ================= Rendez-vous ================= */
  const Book = {
    times: [[9, 0], [11, 30], [14, 0], [17, 30]],
    init() {
      this.form = $(".book");
      this.err = $(".book__err");
      this.ok = $(".book__ok");
      const d = new Date(); d.setHours(12, 0, 0, 0);
      this.dates = [];
      while (this.dates.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) this.dates.push(new Date(d)); }
      this.render();
      this.form.addEventListener("change", () => { $(".seg--small").classList.toggle("is-right", this.form.format.value === "office"); this.err.textContent = ""; });
      this.form.addEventListener("submit", (e) => this.submit(e));
    },
    hour([h, m]) { return I18N.lang === "fr" ? `${h} h ${String(m).padStart(2, "0")}` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; },
    longDay(i) { return new Intl.DateTimeFormat(I18N.locale(), { weekday: "long", day: "numeric", month: "long" }).format(this.dates[i]); },
    render() {
      const f = this.form, dSel = f.jour && f.jour.value, hSel = f.h && f.h.value;
      const wd = new Intl.DateTimeFormat(I18N.locale(), { weekday: "short" }), mo = new Intl.DateTimeFormat(I18N.locale(), { month: "short" });
      $(".book__days").innerHTML = this.dates.map((d, i) => `<label><input type="radio" name="jour" value="${i}"${String(i) === dSel ? " checked" : ""} aria-label="${this.longDay(i)}"><span><small>${wd.format(d).replace(".", "")}</small><b class="num">${d.getDate()}</b><small>${mo.format(d).replace(".", "")}</small></span></label>`).join("");
      $(".book__times").innerHTML = this.times.map((t, i) => `<label><input type="radio" name="h" value="${i}"${String(i) === hSel ? " checked" : ""}><span class="num">${this.hour(t)}</span></label>`).join("");
      this.err.textContent = "";
      if (!this.ok.hidden && this.last) this.confirm();
    },
    submit(e) {
      e.preventDefault();
      const f = this.form;
      let m = "";
      if (!f.jour.value || !f.h.value) m = I18N.t("rdv.errSlot");
      else if (!f.nom.value.trim()) { m = I18N.t("rdv.errName"); f.nom.focus(); }
      else if (!/^\S+@\S+\.\S+$/.test(f.email.value)) { m = I18N.t("rdv.errMail"); f.email.focus(); }
      this.err.textContent = m;
      if (m) { if (X.anim) gsap.fromTo(f, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" }); return; }
      this.last = { n: f.nom.value.trim(), f: f.format.value, d: +f.jour.value, h: +f.h.value };
      this.confirm();
      if (X.anim) gsap.from(this.ok, { y: 14, opacity: 0, duration: 0.6, ease: "power3.out" });
    },
    confirm() {
      const L = this.last;
      this.ok.hidden = false;
      this.ok.textContent = I18N.t("rdv.ok", { n: L.n, f: I18N.t(L.f === "office" ? "rdv.office" : "rdv.visio").toLowerCase(), d: this.longDay(L.d), h: this.hour(this.times[L.h]) });
    },
  };

  /* ================= Prechargeur et entree ================= */
  const pctEl = $(".loader__pct span"), lineEl = $(".loader__line i");
  let shown = 0;
  const setP = (p) => { const v = Math.round(p * 100); if (v >= shown) { shown = v; pctEl && (pctEl.textContent = String(v).padStart(3, "0")); lineEl && (lineEl.style.transform = `scaleX(${p})`); } };

  Film.init();
  let target = 0;
  const fake = setInterval(() => { target = Math.min(0.9, target + 0.04); setP(target * 0.5 + 0.0); }, 60);
  Promise.all([
    Film.preload((p) => setP(0.3 + p * 0.6)),
    document.fonts ? document.fonts.ready.catch(() => {}) : 0,
    new Promise((r) => setTimeout(r, X.anim ? 900 : 0)),
  ]).then(() => { clearInterval(fake); start(); });

  function start() {
    setP(1);
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildFilm();
    Ledger.init();
    Sim.init();
    founder();
    missions();
    Book.init();
    footer();
    X.magnetic();
    X.reveals();
    links();
    document.addEventListener("langchange", () => {
      Ledger.relabel();
      Sim.update();
      Book.render();
      $$("[data-scrub-words]").forEach((el) => X.scrubWords(el));
      if (X.hasGsap) ScrollTrigger.refresh();
    });
    intro();
  }

  function intro() {
    const loader = $(".loader");
    if (!X.anim) { loader && loader.remove(); return; }
    const chars = $$(".hero__title .l > span");
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".loader__line", { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "power3.in" }, 0)
      .to(".loader__name, .loader__pct, .loader__mark, .loader__label", { opacity: 0, y: -14, duration: 0.5, stagger: 0.03, ease: "power2.in" }, 0.05)
      .to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }, 0.55)
      .fromTo(".film__stage", { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 2.4, ease: "power2.out" }, 0.45)
      .from(chars, { yPercent: 112, duration: 1.4, stagger: 0.1 }, 0.9)
      .from(".film__hero .eyebrow, .hero__lead, .hero__cta, .film__hint", { opacity: 0, y: 24, duration: 1.2, stagger: 0.08 }, 1.2)
      .from(".nav > *", { opacity: 0, y: -16, duration: 1, stagger: 0.06 }, 1.2);
  }

  function footer() {
    if (!X.anim) return;
    gsap.fromTo(".rose .needle", { rotate: -160, transformOrigin: "100px 100px" }, { rotate: 0, transformOrigin: "100px 100px", ease: "elastic.out(1,.35)", duration: 2.6, scrollTrigger: { trigger: ".foot", start: "top 75%", once: true } });
    gsap.from(".foot__giant", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 80%", once: true } });
  }

  // Liens internes : « Méthode » vise le premier chapitre de l'ouverture
  function links() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const el = id.length > 1 && document.querySelector(id);
      if (!el && id !== "#top") return;
      e.preventDefault();
      if (a.dataset.film && Film.st) { X.scrollTo(Film.st.start + (Film.st.end - Film.st.start) * +a.dataset.film); return; }
      if (id === "#top") { X.scrollTo(0); return; }
      // Section epinglee : on vise le debut de son declencheur, pas la position du pin
      const st = X.hasGsap && ScrollTrigger.getAll().find((s) => s.trigger === el);
      X.scrollTo(st ? st.start : el.getBoundingClientRect().top + scrollY - X.navH());
    });
  }
})();
