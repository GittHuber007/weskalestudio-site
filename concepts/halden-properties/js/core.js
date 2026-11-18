/* Noyau commun du lot 3 (Weskale Studio, concepts fictifs).
   Chaque site en garde une copie dans js/core.js et se règle par window.SITE.
   Principe de sûreté : le contenu est visible sans JavaScript. Les états
   cachés ne s'appliquent que sous html.anim, ajoutée seulement si GSAP est là. */
(function () {
  "use strict";
  const W = window, D = document, H = D.documentElement;
  const SITE = W.SITE || {};
  const reduce = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const narrow = () => W.innerWidth < 900;
  const hasGsap = !!(W.gsap && W.ScrollTrigger);
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const core = (W.CORE = { reduce, fine, narrow, $, $$, clamp, lenis: null });

  /* Image absente : on la masque et son cadre affiche une ambiance de secours. */
  const markMissing = (im) => { im.classList.add("is-missing"); const p = im.closest("[data-ph]") || im.parentElement; if (p) p.classList.add("ph-on"); };
  D.addEventListener("error", (e) => { if (e.target && e.target.tagName === "IMG") markMissing(e.target); }, true);
  D.addEventListener("DOMContentLoaded", () => $$("img").forEach((im) => { if (im.complete && im.getAttribute("src") && !im.naturalWidth) markMissing(im); }));

  if (hasGsap && !reduce) H.classList.add("anim");
  if (reduce) H.classList.add("reduce");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* Filet de sécurité : si quoi que ce soit bloque, on montre tout. */
  const failSafe = setTimeout(() => showAll(), 9000);
  function showAll() {
    H.classList.add("ready");
    H.classList.remove("anim");
    const l = $("#loader"); if (l) l.remove();
  }

  /* ---------- Découpe du texte en lignes et mots, masqués ---------- */
  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    const mode = el.dataset.split || "words";
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = D.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(D.createTextNode(" ")); return; }
            const m = D.createElement("span"); m.className = "sw";
            const i = D.createElement("span"); i.className = "si";
            if (mode === "chars") {
              Array.from(tok).forEach((c) => { const s = D.createElement("span"); s.className = "sc"; s.textContent = c; i.appendChild(s); });
            } else i.textContent = tok;
            m.appendChild(i); frag.appendChild(m);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  }
  core.split = split;
  $$("[data-split]").forEach(split);

  function revealSplit(el, delay = 0) {
    const targets = el.dataset.split === "chars" ? $$(".sc", el) : $$(".si", el);
    return gsap.fromTo(targets, { yPercent: 115, rotate: 4 }, {
      yPercent: 0, rotate: 0, duration: 1.25, ease: "expo.out",
      stagger: el.dataset.split === "chars" ? 0.028 : 0.07, delay,
    });
  }
  core.revealSplit = revealSplit;

  /* ---------- Défilement fluide ---------- */
  /* Décalage d'ancre : hauteur de l'en-tête fixe, sauf pour la section du haut. Lu au clic, jamais pendant le défilement. */
  core.headerOffset = (t) => { const n = $(".nav"); return !n || t.offsetTop < 10 ? 0 : -Math.round(n.offsetHeight); };
  function initLenis() {
    if (reduce || !W.Lenis || !hasGsap) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    core.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: core.headerOffset(t), duration: 1.2 });
    }));
  }

  /* ---------- Curseur et boutons magnétiques ---------- */
  function initCursor() {
    if (!fine || reduce || !hasGsap) return;
    const c = D.createElement("div"); c.className = "cur"; c.innerHTML = '<span class="cur__dot"></span><span class="cur__ring"><em></em></span>';
    D.body.appendChild(c); H.classList.add("has-cur");
    const ring = $(".cur__ring", c), dot = $(".cur__dot", c), label = $("em", c);
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    W.addEventListener("pointermove", (e) => { c.classList.add("on"); rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
    D.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, input, select, textarea, label");
      c.classList.toggle("is-hover", !!t);
      const txt = t && t.dataset.cursor; label.textContent = txt || ""; c.classList.toggle("is-label", !!txt);
    });
    $$("[data-magnetic]").forEach((b) => {
      const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" }), y = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.35); y((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  /* ---------- Révélations au défilement ---------- */
  function initReveals() {
    if (!hasGsap || reduce) return;
    $$("[data-split]:not([data-intro])").forEach((el) => {
      const targets = el.dataset.split === "chars" ? $$(".sc", el) : $$(".si", el);
      gsap.set(targets, { yPercent: 115 });
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => revealSplit(el) });
    });
    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out", delay: +(el.dataset.reveal || 0),
        scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    $$("[data-clip]").forEach((el) => {
      const from = el.dataset.clip === "up" ? "inset(100% 0% 0% 0%)" : el.dataset.clip === "side" ? "inset(0% 100% 0% 0%)" : "inset(12% 12% 12% 12% round 2px)";
      gsap.fromTo(el, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.5, ease: "expo.inOut",
        scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      const img = $("img", el); if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    $$("[data-parallax]").forEach((el) => {
      const a = +el.dataset.parallax || 12;
      gsap.fromTo(el, { yPercent: -a }, { yPercent: a, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, dec = +(el.dataset.dec || 0), o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: "power2.out", onUpdate: () => { el.textContent = o.v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); } }) });
    });
    $$("[data-draw]").forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(p, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", scrollTrigger: { trigger: p.closest("svg") || p, start: "top 80%", once: true } });
    });
    $$("[data-line]").forEach((el) => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 92%", once: true } }));
  }

  /* ---------- Galerie horizontale épinglée ---------- */
  function initHScroll() {
    if (!hasGsap || reduce) return;
    $$("[data-hscroll]").forEach((sec) => {
      const track = $("[data-track]", sec); if (!track) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const dist = () => track.scrollWidth - W.innerWidth;
        const tw = gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$("[data-hs-par]", track).forEach((img) => gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tw, start: "left right", end: "right left", scrub: 0.4 } }));
      });
    });
  }

  /* ---------- Profondeur à la souris et cartes qui pivotent ---------- */
  function initDepth() {
    if (!fine || reduce || !hasGsap) return;
    $$("[data-depth-scene]").forEach((scene) => {
      const layers = $$("[data-depth]", scene).map((l) => ({ l, k: +l.dataset.depth, x: gsap.quickTo(l, "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(l, "y", { duration: 1.2, ease: "power3" }) }));
      scene.addEventListener("pointermove", (e) => { const r = scene.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5; layers.forEach((o) => { o.x(-nx * o.k); o.y(-ny * o.k); }); });
      scene.addEventListener("pointerleave", () => layers.forEach((o) => { o.x(0); o.y(0); }));
    });
    $$("[data-tilt]").forEach((card) => {
      const k = +card.dataset.tilt || 8;
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3" }), ry = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3" });
      gsap.set(card, { transformPerspective: 1100 });
      card.addEventListener("pointermove", (e) => { const r = card.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * k); rx(-((e.clientY - r.top) / r.height - 0.5) * k); card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%"); card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%"); });
      card.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });
  }

  /* ---------- Séquence d'images pilotée par le défilement ----------
     Une vidéo générée, découpée en images WebP, dessinée sur un canvas.
     Fenêtre glissante : on ne garde décodées que les images autour de la
     position, sinon un téléphone sature sa mémoire. Image de secours : le
     poster, toujours affiché sous le canvas. */
  class Sequence {
    /* Version du 18/11/2026 : images fournies par WSFrames (js/frames.js), fondu entre images voisines,
       résolution fixe pendant le défilement. Même interface qu'avant pour site.js. */
    constructor(root) {
      this.root = root;
      this.canvas = $("canvas", root);
      this.ctx = this.canvas.getContext("2d");
      const m = narrow();
      this.mobile = m;
      this.dir = m ? root.dataset.seqM : root.dataset.seqD;
      this.count = +(m ? root.dataset.countM : root.dataset.countD);
      this.want = 0; this.prog = 0; this.lastF = -1;
      this.focusX = +(root.dataset.focusX || 0.5);
      this.focusY = +(root.dataset.focusY || 0.5);
      this.zoom = 1; this.px = 0; this.py = 0; this.anchor = null;
      let ready;
      this.ready = new Promise((r) => (ready = r));
      this.store = new W.WSFrames.FrameStore({
        n: this.count, url: (k) => this.src(k), el: this.canvas,
        onSize: (sz) => { this.iw = sz[0]; this.ih = sz[1]; this.cw = null; this.resize(); this.started = true; ready(); },
        onFrame: () => this.draw(true),
        onMissing: () => { this.dead = true; this.root.classList.add("seq-empty"); ready(); },
      });
      this.resize(); W.addEventListener("resize", () => this.resize());
    }
    src(i) { return this.dir + "f_" + String(i + 1).padStart(3, "0") + ".webp"; }
    resize() {
      /* Densité plafonnée : 1,5 sur ordinateur, 2 sur téléphone. Sur téléphone, la barre d'adresse
         qui apparaît ou disparaît ne redimensionne pas le canvas (seule la largeur compte). */
      const r = this.canvas.getBoundingClientRect();
      if (this.cw === r.width && this.mobile && Math.abs((this.ch || 0) - r.height) < 160) return;
      this.cw = r.width; this.ch = r.height;
      /* Jamais plus de pixels que l'image source en plein cadre : au-delà, le canvas ne fait qu'agrandir
         la même image, pour un coût de dessin bien plus élevé. Le rendu à l'écran reste le même. */
      let dpr = Math.min(W.devicePixelRatio || 1, this.mobile ? 2 : 1.5);
      if (this.iw && r.width && r.height) dpr = Math.max(0.5, Math.min(dpr, Math.min(this.iw / r.width, this.ih / r.height)));
      this.dpr = dpr;
      this.canvas.width = Math.max(1, Math.round(r.width * dpr)); this.canvas.height = Math.max(1, Math.round(r.height * dpr));
      this.draw(true);
    }
    set(p) {
      this.prog = clamp(p, 0, 1);
      const f = this.prog * (this.count - 1);
      this.want = Math.round(f);
      this.store.set(f);
      this.draw();
    }
    /* Géométrie de l'image à l'écran, en pixels du canvas. */
    geom() {
      const cw = this.canvas.width, ch = this.canvas.height, iw = this.iw || 16, ih = this.ih || 9;
      const s0 = Math.max(cw / iw, ch / ih), w0 = iw * s0, h0 = ih * s0;
      const x0 = (cw - w0) * this.focusX, y0 = (ch - h0) * this.focusY;
      const z = this.zoom, w = w0 * z, h = h0 * z;
      let x, y;
      if (this.anchor) { const [u, v] = this.anchor; x = x0 + u * w0 - u * w; y = y0 + v * h0 - v * h; }
      else { x = (cw - w) * this.focusX; y = (ch - h) * this.focusY; }
      return { x: x + this.px * cw, y: y + this.py * ch, w, h };
    }
    /* Rectangle (u0, v0, u1, v1) de l'image, converti en pixels CSS. */
    rectOf(u0, v0, u1, v1) {
      const g = this.geom(), k = 1 / (this.dpr || 1);
      return { l: (g.x + u0 * g.w) * k, t: (g.y + v0 * g.h) * k, r: (g.x + u1 * g.w) * k, b: (g.y + v1 * g.h) * k };
    }
    draw(force) {
      if (!this.iw) return;
      const f = this.store.f;
      if (!force && f === this.lastF && !this.dirty) return;
      const pk = this.store.pick();
      if (!pk.im) return;
      this.dirty = false; this.lastF = f;
      const g = this.geom(), ctx = this.ctx;
      ctx.globalAlpha = 1;
      ctx.drawImage(pk.im, g.x, g.y, g.w, g.h);
      /* Fondu vers l'image suivante selon la position exacte : pas de palier entre deux images */
      if (pk.nx) { ctx.globalAlpha = pk.t; ctx.drawImage(pk.nx, g.x, g.y, g.w, g.h); ctx.globalAlpha = 1; }
      this.root.classList.add("seq-live");
    }
  }
  core.Sequence = Sequence;

  /* Section épinglée : progression du défilement, étapes de texte. */
  function initSequences() {
    const list = [];
    $$("[data-seq]").forEach((root) => {
      const seq = new Sequence(root); list.push(seq); root._seq = seq;
      if (root.hasAttribute("data-seq-manual")) return; /* piloté par le site */
      const steps = $$("[data-step]", root).map((el) => { const [a, b] = el.dataset.step.split("-").map(Number); return { el, a, b }; });
      const bar = $("[data-seq-bar]", root), num = $("[data-seq-num]", root);
      const numFrom = +(num && num.dataset.from || 0), numTo = +(num && num.dataset.to || 100);
      const apply = (p) => {
        seq.set(p);
        steps.forEach((s) => s.el.classList.toggle("on", p >= s.a && p < s.b));
        if (bar) bar.style.transform = (bar.dataset.seqBar === "y" ? "scaleY(" : "scaleX(") + p + ")";
        if (num) num.textContent = String(Math.round(numFrom + (numTo - numFrom) * p)).padStart(String(numTo).length, "0");
        root.style.setProperty("--p", p.toFixed(4));
      };
      if (!hasGsap || reduce) {
        apply(+(root.dataset.still || 0.5));
        root.classList.add("seq-static");
        return;
      }
      const len = +(root.dataset.len || 300);
      ScrollTrigger.create({ trigger: root, start: "top top", end: "+=" + len + "%", pin: true, scrub: 0.4, anticipatePin: 1,
        onUpdate: (st) => apply(st.progress), onRefresh: (st) => apply(st.progress) });
      apply(0);
      if (fine) {
        root.addEventListener("pointermove", (e) => { const nx = e.clientX / W.innerWidth - 0.5, ny = e.clientY / W.innerHeight - 0.5; gsap.to(seq, { px: -nx * 0.012, py: -ny * 0.012, duration: 1.4, ease: "power3", overwrite: true, onUpdate: () => { seq.dirty = true; seq.draw(); } }); });
      }
      gsap.fromTo(seq, { zoom: 1.08 }, { zoom: 1, duration: 3.2, ease: "expo.out", delay: 0.2, onUpdate: () => { seq.dirty = true; seq.draw(); } });
    });
    return list;
  }

  /* ---------- Photos en WebGL : profondeur par shader et ondulation ----------
     three.js sert seulement à afficher des photos sur un plan, déformées par
     un shader. Aucun objet modélisé. Si WebGL manque, l'image HTML reste. */
  const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  const FRAG_DEPTH = `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uTex; uniform vec2 uRes, uImg, uMouse; uniform float uTime, uZoom, uHover, uHorizon, uWave;
    vec2 cover(vec2 uv){ float rs = uRes.x/uRes.y, ri = uImg.x/uImg.y; vec2 s = rs < ri ? vec2(rs/ri, 1.0) : vec2(1.0, ri/rs); return (uv - 0.5) * s / uZoom + 0.5; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
    void main(){
      vec2 uv = vUv;
      // Profondeur estimée : le bas du cadre est proche, le ciel est loin.
      float depth = smoothstep(uHorizon + 0.25, uHorizon - 0.45, 1.0 - uv.y);
      depth = 1.0 - depth;
      vec2 off = uMouse * (0.006 + 0.022 * depth);
      vec2 tuv = cover(uv) - off;
      // Respiration lente de la matière (eau, air chaud) sur la partie basse.
      float n = noise(tuv * 9.0 + vec2(uTime * 0.25, uTime * 0.18));
      tuv += vec2(n - 0.5) * 0.0028 * depth * uWave;
      // Ondulation au survol.
      float d = distance(vUv, uMouse * vec2(1.0,-1.0) * 0.5 + 0.5);
      tuv += normalize(vUv - (uMouse * vec2(1.0,-1.0) * 0.5 + 0.5) + 1e-4) * sin(d * 40.0 - uTime * 3.0) * 0.0025 * uHover * smoothstep(0.35, 0.0, d);
      vec3 col = texture2D(uTex, tuv).rgb;
      float vig = smoothstep(1.15, 0.35, length(vUv - 0.5) * 1.4);
      gl_FragColor = vec4(col * mix(0.82, 1.0, vig), 1.0);
    }`;
  const FRAG_SLIDE = `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uA, uB; uniform vec2 uRes, uImgA, uImgB; uniform float uMix, uTime, uHover; uniform vec2 uMouse;
    vec2 cover(vec2 uv, vec2 img){ float rs = uRes.x/uRes.y, ri = img.x/img.y; vec2 s = rs < ri ? vec2(rs/ri, 1.0) : vec2(1.0, ri/rs); return (uv - 0.5) * s + 0.5; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
    void main(){
      float n = noise(vUv * 6.0) * 0.6 + noise(vUv * 18.0) * 0.4;
      float t = smoothstep(0.0, 1.0, (uMix * 1.4 - 0.2) + (n - 0.5) * 0.5 + (vUv.x - 0.5) * 0.25);
      vec2 dir = vec2(0.06, 0.0);
      vec2 a = cover(vUv, uImgA) + dir * t * (1.0 - t) * 2.0 + vec2(0.0, sin(vUv.x * 10.0 + uTime) * 0.004 * uHover);
      vec2 b = cover(vUv, uImgB) - dir * (1.0 - t) * t * 2.0;
      vec3 ca = texture2D(uA, a).rgb, cb = texture2D(uB, b).rgb;
      float edge = smoothstep(0.0, 0.08, t) * smoothstep(0.0, 0.08, 1.0 - t);
      vec3 col = mix(ca, cb, t) + edge * 0.06;
      gl_FragColor = vec4(col, 1.0);
    }`;

  function glOK() { try { const c = D.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } }
  const loadTex = (url) => new Promise((res) => { new W.THREE.TextureLoader().load(url, (t) => { t.colorSpace = W.THREE.SRGBColorSpace; t.minFilter = W.THREE.LinearFilter; t.generateMipmaps = false; res(t); }, undefined, () => res(null)); });

  /* Photo plein cadre avec profondeur à la souris. <div data-gl-depth data-src="..."> contenant une <img> de secours. */
  core.glDepth = async function (el) {
    if (!W.THREE || reduce || !glOK()) return false;
    const T = W.THREE, src = el.dataset.src || ($("img", el) || {}).currentSrc;
    const tex = await loadTex(src); if (!tex) return false;
    const r = new T.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(W.devicePixelRatio, narrow() ? 1.5 : 1.75));
    const cv = r.domElement; cv.className = "gl-canvas"; el.appendChild(cv);
    const u = { uTex: { value: tex }, uRes: { value: new T.Vector2() }, uImg: { value: new T.Vector2(tex.image.width, tex.image.height) }, uMouse: { value: new T.Vector2() }, uTime: { value: 0 }, uZoom: { value: 1.06 }, uHover: { value: 0 }, uHorizon: { value: +(el.dataset.horizon || 0.45) }, uWave: { value: +(el.dataset.wave || 1) } };
    const scene = new T.Scene(), cam = new T.Camera();
    scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_DEPTH, uniforms: u })));
    const size = () => { const b = el.getBoundingClientRect(); r.setSize(b.width, b.height, false); u.uRes.value.set(b.width, b.height); };
    size(); new ResizeObserver(size).observe(el);
    const m = { x: 0, y: 0, h: 0 }, tgt = { x: 0, y: 0, h: 0 };
    el.addEventListener("pointermove", (e) => { const b = el.getBoundingClientRect(); tgt.x = ((e.clientX - b.left) / b.width - 0.5) * 2; tgt.y = -((e.clientY - b.top) / b.height - 0.5) * 2; tgt.h = 1; });
    el.addEventListener("pointerleave", () => { tgt.x = 0; tgt.y = 0; tgt.h = 0; });
    let vis = true; new IntersectionObserver((en) => { vis = en[0].isIntersecting; }).observe(el);
    el.glUniforms = u;
    const t0 = performance.now();
    (function loop() {
      requestAnimationFrame(loop); if (!vis) return;
      m.x += (tgt.x - m.x) * 0.05; m.y += (tgt.y - m.y) * 0.05; m.h += (tgt.h - m.h) * 0.04;
      u.uMouse.value.set(m.x, m.y); u.uHover.value = m.h; u.uTime.value = (performance.now() - t0) / 1000;
      r.render(scene, cam);
    })();
    el.classList.add("gl-on");
    return true;
  };

  /* Diaporama avec transition par dissolution et glissement en shader. */
  core.glSlider = async function (el, urls, onChange) {
    const T = W.THREE;
    const fallback = (i) => { const img = $("img", el); if (img) img.src = urls[i]; };
    let api = { go: (i) => { fallback(i); onChange && onChange(i); }, index: 0 };
    if (!T || reduce || !glOK()) return api;
    const texs = await Promise.all(urls.map(loadTex)); if (texs.some((t) => !t)) return api;
    const r = new T.WebGLRenderer({ antialias: false }); r.setPixelRatio(Math.min(W.devicePixelRatio, 1.75));
    const cv = r.domElement; cv.className = "gl-canvas"; el.appendChild(cv);
    const dim = (t) => new T.Vector2(t.image.width, t.image.height);
    const u = { uA: { value: texs[0] }, uB: { value: texs[0] }, uImgA: { value: dim(texs[0]) }, uImgB: { value: dim(texs[0]) }, uRes: { value: new T.Vector2() }, uMix: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 }, uMouse: { value: new T.Vector2() } };
    const scene = new T.Scene(), cam = new T.Camera();
    scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_SLIDE, uniforms: u })));
    const size = () => { const b = el.getBoundingClientRect(); r.setSize(b.width, b.height, false); u.uRes.value.set(b.width, b.height); };
    size(); new ResizeObserver(size).observe(el);
    let vis = true, busy = false; new IntersectionObserver((en) => { vis = en[0].isIntersecting; }).observe(el);
    el.addEventListener("pointerenter", () => gsap.to(u.uHover, { value: 1, duration: 0.8 }));
    el.addEventListener("pointerleave", () => gsap.to(u.uHover, { value: 0, duration: 0.8 }));
    const t0 = performance.now();
    (function loop() { requestAnimationFrame(loop); if (!vis) return; u.uTime.value = (performance.now() - t0) / 1000; r.render(scene, cam); })();
    el.classList.add("gl-on");
    api = {
      index: 0,
      go(i) {
        if (i === api.index || busy) return; busy = true;
        u.uA.value = texs[api.index]; u.uImgA.value = dim(texs[api.index]); u.uB.value = texs[i]; u.uImgB.value = dim(texs[i]); u.uMix.value = 0;
        api.index = i; onChange && onChange(i);
        gsap.to(u.uMix, { value: 1, duration: 1.5, ease: "power2.inOut", onComplete: () => { u.uA.value = texs[i]; u.uImgA.value = dim(texs[i]); u.uMix.value = 0; busy = false; } });
      },
    };
    return api;
  };

  /* ---------- Préchargeur puis entrée ---------- */
  core.boot = async function (extraWait) {
    initLenis();
    const seqs = initSequences();
    const loader = $("#loader"), num = loader && $("[data-loader-num]", loader), bar = loader && $("[data-loader-bar]", loader);
    const imgs = $$("img[data-pre]").map((im) => im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; }));
    const jobs = [...imgs, ...seqs.map((s) => s.ready), ...(extraWait || [])];
    let done = 0; const total = Math.max(1, jobs.length); const shown = { v: 0 };
    const tick = () => { done++; if (hasGsap) gsap.to(shown, { v: done / total * 100, duration: 0.6, onUpdate: () => { if (num) num.textContent = String(Math.round(shown.v)).padStart(2, "0"); if (bar) bar.style.transform = (bar.dataset.loaderBar === "y" ? "scaleY(" : "scaleX(") + shown.v / 100 + ")"; } }); };
    jobs.forEach((j) => j.then(tick, tick));
    await Promise.race([Promise.all(jobs.map((j) => j.catch(() => 0))), new Promise((r) => setTimeout(r, 6000))]);
    await new Promise((r) => setTimeout(r, hasGsap && !reduce ? 900 : 0));
    clearTimeout(failSafe);
    initCursor(); initDepth();
    if (!hasGsap || reduce) { showAll(); initReveals(); SITE.after && SITE.after(core); return; }
    H.classList.add("ready");
    initReveals(); initHScroll();
    const tl = gsap.timeline();
    if (loader) tl.to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }).add(() => loader.remove());
    SITE.intro && SITE.intro(tl, core);
    SITE.after && SITE.after(core);
    W.addEventListener("load", () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  };

  /* Navigation qui se transforme au défilement. */
  core.navState = function (nav, threshold) {
    let last = 0;
    const on = () => { const y = W.scrollY; nav.classList.toggle("is-scrolled", y > (threshold || 80)); nav.classList.toggle("is-hidden", y > 400 && y > last + 2); if (y < last - 2) nav.classList.remove("is-hidden"); last = y; };
    W.addEventListener("scroll", on, { passive: true }); on();
  };

  /* Démarrage après l'analyse du document : three.js (module) est alors chargé s'il a pu l'être. */
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", () => core.boot());
  else setTimeout(() => core.boot(), 0);

  /* Petits utilitaires de formulaires de démo. */
  core.money = (v, cur) => (cur === "AED" ? "AED " + Math.round(v).toLocaleString("en-US") : Math.round(v).toLocaleString("fr-FR").replace(/ /g, " ") + " " + (cur || "€"));
})();
