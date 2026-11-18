/* Maison Ilvane : haute joaillerie fictive, concept Weskale Studio. */
(function () {
  "use strict";
  const X = window.WX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mob = X.mobile();
  const TX = window.I18N.js; // textes de la langue choisie (js/i18n.js)
  const BACK = window.I18N.backY; // hauteur a retrouver apres un changement de langue

  const CFG = {
    // Video d'orbite (1280 x 720, 24 i/s, 190 images) decoupee en sequence
    seq: { dir: "assets/seq/", count: 190, mobileDir: "assets/seq-m/", mobileCount: 95 },
    // Video de fin (1280 x 720, 24 i/s, 192 images) : la bague scintille au-dessus de la plaque gravee
    seq2: { dir: "assets/seq2/", count: 192, mobileDir: "assets/seq2-m/", mobileCount: 96 },
    // Photo d'ouverture : la premiere image de la video, en 2K (meme cadrage)
    still: mob ? "assets/ilvane-m.webp" : "assets/ilvane.webp",
    // Meme photo avec la plaque gravee Maison Ilvane : fin du plan et configurateur
    logo: mob ? "assets/ilvane-logo-m.webp" : "assets/ilvane-logo.webp",
    // Centre du diamant dans la video (x, une mesure toutes les 10 images, la derniere a 189)
    track: [0.461, 0.469, 0.474, 0.488, 0.52, 0.535, 0.553, 0.557, 0.57, 0.585, 0.599, 0.614, 0.63, 0.644, 0.652, 0.659, 0.666, 0.664, 0.683, 0.689],
    stoneStill: [0.479, 0.478],
    // Textes de chaque piece dans js/i18n.js (meme ordre)
    gallery: [
      { img: "assets/g-aube.webp", n: 24800 },
      { img: "assets/g-six.webp", n: 21600 },
      { img: "assets/g-blanc.webp", n: 21900 },
      { img: "assets/g-rose.webp", n: 25000 },
      // Ajoutees automatiquement des que les visuels existent (voir GENERATIONS.md)
      { img: "assets/j-boucles.webp", n: 11400 },
      { img: "assets/j-pendentif.webp", n: 8900 },
    ],
  };

  CFG.gallery.forEach((g, i) => Object.assign(g, TX.gallery[i]));

  // Liste des fichiers presents (assets/manifest.json) : evite de demander une image absente
  let have = null;
  const manifest = fetch("assets/manifest.json", { cache: "no-store" }).then((r) => r.json()).then((l) => (have = new Set(l.map((f) => "assets/" + f)))).catch(() => (have = null));
  const exists = (u) => manifest.then(() => (have ? have.has(u) : X.loadImg(u).then(() => true, () => false)));

  /* ---------- Prechargeur : photo d'ouverture et premieres images ---------- */
  const pct = $(".loader__pct");
  let shown = 0;
  const setP = (p) => { const v = Math.round(p * 100); if (v >= shown) { shown = v; pct && (pct.textContent = v); } };
  if (X.hasGsap && !X.reduce) gsap.to(".gem__p", { strokeDashoffset: 0, duration: 2.2, stagger: 0.3, ease: "power2.inOut" });
  const S = CFG.seq, sdir = mob ? S.mobileDir : S.dir;
  const first = [0, 1, 2, 3, 4, 5].map((k) => `${sdir}f_${String(k).padStart(3, "0")}.webp`);

  Promise.all([
    X.preload([CFG.still, CFG.logo].concat(first), setP),
    Promise.all(CFG.gallery.map((g) => exists(g.img))).then((ok) => CFG.gallery.forEach((g, i) => (g.ok = ok[i]))),
  ]).then(start);

  function start() {
    setP(1);
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildFilm();
    buildGallery();
    buildConfig();
    buildCraft();
    buildForm();
    X.magnetic();
    X.reveals();
    intro();
  }

  function intro() {
    const loader = $(".loader");
    const chars = X.split($(".film__title"));
    if (!X.hasGsap) { loader && loader.remove(); return; }
    if (BACK != null) {
      // Changement de langue : pas de rideau, on revient a la meme hauteur
      loader && loader.remove();
      requestAnimationFrame(() => { ScrollTrigger.refresh(); X.lenis ? X.lenis.scrollTo(BACK, { immediate: true, force: true }) : scrollTo(0, BACK); ScrollTrigger.update(); });
      return;
    }
    if (X.reduce) { gsap.to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }); return; }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".loader__gem", { scale: 0.4, rotate: 45, opacity: 0, duration: 1, ease: "power3.in" }, 0.3)
      .to(".loader__name, .loader__pct", { opacity: 0, y: -20, duration: 0.8, ease: "power3.in" }, 0.35)
      .to(loader, { clipPath: "circle(0% at 60% 48%)", duration: 1.4, ease: "expo.inOut", onComplete: () => loader.remove() }, 0.9)
      .fromTo(".film__canvas, .film__poster", { scale: 1.18, filter: "brightness(.2)" }, { scale: 1, filter: "brightness(1)", duration: 2.6, ease: "expo.out", clearProps: "transform,filter" }, 1)
      .from(chars, { yPercent: 120, opacity: 0, duration: 1.5, stagger: 0.045 }, 1.7)
      .from(".film__hero .eyebrow, .film__lead, .film__seal, .film__hint", { opacity: 0, y: 24, duration: 1.2, stagger: 0.1 }, 2)
      .from(".nav > *", { opacity: 0, y: -24, duration: 1.2, stagger: 0.08 }, 1.9);
  }

  /* =================================================================
     Plan-sequence : photo 2K, puis la video d'orbite image par image,
     puis la caméra recule et la piece se pose sur son socle grave.
     ================================================================= */
  // Cadrage : point de l'image (fx, fy) place a l'ecran en (sx, sy), echelle z
  const VIEW = mob
    ? [[0, 2.25, 0.56, 0.47, 0.5, 0.33], [0.45, 2.15, 0.56, 0.47, 0.5, 0.34], [0.75, 2.05, 0.54, 0.47, 0.5, 0.34], [0.84, 2.05, 0.54, 0.47, 0.5, 0.34], [0.97, 1.5, 0.52, 0.5, 0.5, 0.26], [1, 1.5, 0.52, 0.5, 0.5, 0.26]]
    : [[0, 1.12, 0.56, 0.47, 0.66, 0.54], [0.14, 1.08, 0.555, 0.47, 0.62, 0.52], [0.45, 1, 0.56, 0.47, 0.6, 0.5], [0.75, 0.96, 0.53, 0.47, 0.56, 0.5], [0.84, 0.96, 0.53, 0.47, 0.56, 0.5], [0.97, 0.66, 0.52, 0.52, 0.29, 0.52], [1, 0.66, 0.52, 0.52, 0.29, 0.52]];
  const F0 = 0.03, F1 = 0.75; // la video joue entre ces deux positions
  function view(p) {
    let i = 0;
    while (i < VIEW.length - 2 && p > VIEW[i + 1][0]) i++;
    const a = VIEW[i], b = VIEW[i + 1], t = smooth(a[0], b[0], p);
    return a.map((v, k) => v + (b[k] - v) * t);
  }
  function trackX(fp) {
    const T = CFG.track, f = fp * 189, i = Math.min(T.length - 2, Math.floor(f / 10));
    const f0 = i * 10, f1 = i === T.length - 2 ? 189 : f0 + 10;
    return T[i] + (T[i + 1] - T[i]) * clamp((f - f0) / (f1 - f0)) + 0.018;
  }

  function buildFilm() {
    const canvas = $(".film__canvas");
    if (!X.hasGsap || X.reduce) { canvas.remove(); return; }
    const imgs = {};
    [["still", CFG.still], ["logo", CFG.logo]].forEach(([k, u]) => { const im = new Image(); im.decoding = "async"; im.onload = () => seq && seq.paint(true); im.src = u; imgs[k] = im; });
    const ok = (im) => im && im.complete && im.naturalWidth;
    const glow = $(".film__glow"), call = $(".film__call");
    const bar = $(".fm__bar i"), val = $(".fm__val");
    let P = 0, seq = null, seq2 = null, rect = [0, 0, 1, 1];

    const fade = (ctx, x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(2,2,2,1)"); g.addColorStop(1, "rgba(2,2,2,0)");
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    function render(ctx, frame, cw, ch, p, next, t) {
      const v = view(P);
      const base = mob ? cw / 1600 : Math.max(cw / 1600, ch / 900);
      const w = 1600 * base * v[1], h = 900 * base * v[1];
      const x = v[4] * cw - v[2] * w, y = v[5] * ch - v[3] * h;
      rect = [x, y, w, h];
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, cw, ch);
      // 1. photo 2K, 2. video, 3. fondu au noir sous un eclat de lumiere, 4. photo avec la plaque gravee
      const aS = frame ? 1 - smooth(0.012, 0.06, P) : 1;
      const aV = 1 - smooth(0.77, 0.797, P);
      const aL = smooth(0.783, 0.815, P);
      if (frame && aS < 1 && aV > 0) {
        ctx.globalAlpha = aV; ctx.drawImage(frame, x, y, w, h);
        // Fondu vers l'image suivante selon la position exacte : pas de palier entre deux images
        if (next) { ctx.globalAlpha = aV * t; ctx.drawImage(next, x, y, w, h); }
      }
      if (aS > 0 && aV > 0 && ok(imgs.still)) { ctx.globalAlpha = aS * aV; ctx.drawImage(imgs.still, x, y, w, h); }
      if (aL > 0) {
        // La premiere image de la video de fin est la photo a la plaque : on la garde tant que la video n'est pas prete
        const im2 = seq2 && P > 0.8 ? seq2.nearest(seq2.i) : null;
        const pic = im2 || (ok(imgs.logo) ? imgs.logo : null);
        if (pic) { ctx.globalAlpha = aL; ctx.drawImage(pic, x, y, w, h); }
      }
      ctx.globalAlpha = 1;
      // Bords fondus dans le noir : la piece flotte, sans cadre visible
      fade(ctx, 0, y, 0, y + h * 0.16, x, y, w, h * 0.16);
      fade(ctx, 0, y + h, 0, y + h * 0.78, x, y + h * 0.78, w, h * 0.22 + 1);
      fade(ctx, x, 0, x + w * 0.12, 0, x, y, w * 0.12, h);
      fade(ctx, x + w, 0, x + w * 0.84, 0, x + w * 0.84, y, w * 0.16 + 1, h);
      // Fin du plan : on assombrit la droite, ou arrive la fiche de la piece
      const aE = mob ? 0 : smooth(0.84, 0.95, P);
      if (aE > 0) {
        const g = ctx.createLinearGradient(cw * 0.46, 0, cw * 0.6, 0);
        g.addColorStop(0, "rgba(2,2,2,0)"); g.addColorStop(1, `rgba(2,2,2,${0.92 * aE})`);
        ctx.fillStyle = g; ctx.fillRect(cw * 0.46, 0, cw * 0.54, ch);
      }
      // Eclat : la lumiere part de la pierre et couvre le changement de plan
      const aF = Math.pow(Math.max(0, 1 - Math.abs(P - 0.79) / 0.028), 1.5);
      if (aF > 0) {
        const fx = x + 0.585 * w, fy = y + 0.47 * h, r = Math.max(cw, ch) * (0.12 + 0.3 * aF);
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, `rgba(255,252,248,${aF})`); g.addColorStop(0.12, `rgba(255,236,222,${0.75 * aF})`);
        g.addColorStop(0.4, `rgba(224,166,136,${0.2 * aF})`); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "screen"; ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch); ctx.globalCompositeOperation = "source-over";
      }
      if (!canvas.classList.contains("is-ready") && (frame || ok(imgs.still))) canvas.classList.add("is-ready");
    }
    seq = new X.Seq(canvas, { dir: S.dir, count: S.count, mobileDir: S.mobileDir, mobileCount: S.mobileCount, bg: "#020202", render });
    // Deuxieme sequence : chargee par la meme fenetre glissante, peinte par le rendu ci-dessus
    const S2 = CFG.seq2, c2 = document.createElement("canvas");
    seq2 = new X.Seq(c2, { dir: S2.dir, count: S2.count, mobileDir: S2.mobileDir, mobileCount: S2.mobileCount, render: () => seq.paint(true) });

    // Point du diamant a l'ecran (pixels CSS)
    const diamond = () => {
      const fp = clamp((P - F0) / (F1 - F0)), aL = smooth(0.783, 0.815, P);
      const fx = trackX(fp) * (1 - aL) + CFG.stoneStill[0] * aL, fy = CFG.stoneStill[1];
      const k = canvas.clientWidth / canvas.width || 1;
      return [(rect[0] + fx * rect[2]) * k, (rect[1] + fy * rect[3]) * k];
    };

    const steps = $$(".fstep");
    steps.forEach((s) => X.split($(".fstep__t", s)));
    const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: () => update(tl.progress()) });
    tl.to(".film__hero", { y: -70, opacity: 0, duration: 0.08 }, 0.005)
      .to(".film__hint", { opacity: 0, duration: 0.03 }, 0)
      .to(".film__seal", { opacity: 0, scale: 0.8, duration: 0.06 }, 0.02)
      .to(".film__veil", { opacity: mob ? 1 : 0.65, duration: 0.08 }, 0.02)
      .fromTo(".film__meter", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.06)
      .to(".film__meter", { opacity: 0, duration: 0.04 }, 0.76);
    const win = [[0.1, 0.32], [0.34, 0.53], [0.55, 0.74]];
    steps.forEach((s, i) => {
      const [t0, t1] = win[i], ch = $$(".c", s), rest = [$(".fstep__n", s), $(".fstep__d", s)];
      tl.set(s, { opacity: 1 }, t0)
        .fromTo(ch, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.003, duration: 0.04 }, t0)
        .fromTo(rest, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.04 }, t0 + 0.015)
        .to(ch, { yPercent: -115, opacity: 0, stagger: 0.002, duration: 0.035 }, t1 - 0.04)
        .to(rest, { opacity: 0, y: -18, duration: 0.035 }, t1 - 0.04)
        .set(s, { opacity: 0 }, t1);
    });
    tl.fromTo(call, { opacity: 0, "--l": 0 }, { opacity: 1, "--l": 1, duration: 0.04 }, 0.13)
      .to(call, { opacity: 0, duration: 0.03 }, 0.29)
      .fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 0.55, scale: 0.9, duration: 0.12 }, 0.4)
      .to(glow, { opacity: 0.25, scale: 0.7, duration: 0.12 }, 0.55)
      .to(glow, { opacity: 0, scale: 0.5, duration: 0.06 }, 0.68)
      .fromTo(".film__product", { opacity: 0, x: mob ? 0 : 40, y: mob ? 30 : 0 }, { opacity: 1, x: 0, y: 0, duration: 0.09 }, 0.87)
      .fromTo(".film__product > *", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.012, duration: 0.05 }, 0.88)
      .to({}, { duration: 0.001 }, 1);
    const prod = $(".film__product");
    function update(p) {
      P = p;
      const fp = clamp((p - F0) / (F1 - F0));
      if (p > 0.7) seq2.set(clamp((p - 0.8) / 0.2));
      seq.set(fp);
      const d = diamond();
      glow.style.left = d[0] + "px"; glow.style.top = d[1] + "px";
      call.style.transform = `translate3d(${d[0]}px,${d[1]}px,0)`;
      bar.style.transform = `scaleX(${fp})`;
      val.textContent = Math.round(fp * 90) + "°";
      prod.classList.toggle("is-on", p > 0.84);
    }
    ScrollTrigger.create({ trigger: ".film", start: "top top", end: "bottom bottom", scrub: 0.5, animation: tl });
    update(0);
    addEventListener("resize", () => update(P));
    // Leger mouvement a la souris sur le plan d'ouverture
    if (!X.touch) {
      const xTo = gsap.quickTo(canvas, "x", { duration: 1.2, ease: "power3" }), yTo = gsap.quickTo(canvas, "y", { duration: 1.2, ease: "power3" });
      addEventListener("pointermove", (e) => { xTo((e.clientX / innerWidth - 0.5) * -14); yTo((e.clientY / innerHeight - 0.5) * -10); }, { passive: true });
    }
  }

  /* ---------- Galerie : une piece a la fois, fondu par shader ---------- */
  function buildGallery() {
    const items = CFG.gallery.filter((g) => g.ok);
    const n = items.length;
    $(".gal").style.setProperty("--n", n);
    $(".gc__n").textContent = String(n).padStart(2, "0");
    $(".gal__names").innerHTML = items.map((g, i) => `
      <article class="gitem${i === 0 ? " is-on" : ""}">
        <p class="gitem__col">${g.col}</p>
        <h3 class="gitem__name">${g.name} <em>${g.em}</em></h3>
        <p class="gitem__d">${g.d}</p>
        <p class="gitem__price">${TX.price(g.n)}<small>${TX.examplePrice}</small></p>
      </article>`).join("");
    $(".gal__dots").innerHTML = items.map(() => "<i></i>").join("");
    const arts = $$(".gitem"), dots = $$(".gal__dots i");
    const fb = $(".gal__fallback");
    fb.src = items[0].img;
    if (!X.hasGsap || X.reduce) return;
    const st = X.stage($(".gal__gl"), { depthAmt: 0.012, vig: 0.28, grain: 0.02, disp: 0.2, bg: [0.035, 0.024, 0.02] });
    if (st) items.forEach((g) => st.add(g.img));
    arts.forEach((a) => X.split($(".gitem__name", a)));
    let cur = 0;
    const show = (k) => {
      if (k === cur) return;
      const out = arts[cur], inn = arts[k], dir = k > cur ? 1 : -1;
      cur = k;
      $(".gc__i").textContent = String(k + 1).padStart(2, "0");
      gsap.killTweensOf([out, inn, $$(".c", out), $$(".c", inn)]);
      gsap.to($$(".c", out), { yPercent: -110 * dir, opacity: 0, duration: 0.5, stagger: 0.012, ease: "power3.in" });
      gsap.to(out, { opacity: 0, duration: 0.5, delay: 0.25, onComplete: () => out.classList.remove("is-on") });
      inn.classList.add("is-on");
      gsap.fromTo(inn, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.3 });
      gsap.fromTo($$(".c", inn), { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.02, ease: "expo.out", delay: 0.35 });
      gsap.fromTo($$(".gitem__col, .gitem__d, .gitem__price", inn), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "expo.out", delay: 0.5 });
    };
    ScrollTrigger.create({
      trigger: ".gal", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (s) => {
        const x = s.progress * (n - 1), a = Math.min(n - 2, Math.floor(x)), m = smooth(0.3, 0.8, x - a);
        if (st) st.mix(a, a + 1, m);
        show(m > 0.5 ? a + 1 : a);
        dots.forEach((d, i) => d.style.setProperty("--f", clamp(x - i + 1)));
      },
    });
    dots.forEach((d, i) => d.style.setProperty("--f", i === 0 ? 1 : 0));
  }

  /* ---------- Configurateur : la photo en or rose, metal et pierre recalcules par shader ---------- */
  const CFS = `precision highp float;
varying vec2 v;
uniform sampler2D t0,t1;uniform vec2 res,s0,mouse,stonePos,stoneRad,ctr;
uniform float zoom,metalA,metalB,mixM,stoneA,stoneB,mixS;
vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}
// 0 or rose (la photo), 1 or jaune, 2 or blanc ; k = masque de la monture
vec3 metal(vec3 c,float m,float k){
  if(m<.5) return c;
  vec3 r;
  if(m<1.5){ vec3 h=rgb2hsv(c); r=hsv2rgb(vec3(h.x+.046,min(1.,h.y*1.06),min(1.,h.z*1.03))); }
  else { float l=dot(c,vec3(.299,.587,.114)); r=vec3(l*1.1)*vec3(.95,.98,1.03); }
  return mix(c,r,k);
}
vec3 stone(vec3 c,vec2 u,float s){
  if(s<.5) return c;
  float m=1.-smoothstep(.6,1.,length((u-stonePos)/stoneRad));
  vec3 h=rgb2hsv(c);
  m*=1.-smoothstep(.22,.45,h.y);
  float l=dot(c,vec3(.299,.587,.114));
  vec3 tint=s<1.5?vec3(.1,.26,1.):vec3(.04,.8,.4);
  vec3 col=tint*pow(l,1.15)*1.6+vec3(pow(l,7.)*.95);
  return mix(c,col,m);
}
void main(){
  float ra=res.x/res.y, ri=s0.x/s0.y;
  vec2 cover = ra>ri ? vec2(1.,ri/ra) : vec2(ra/ri,1.);
  vec2 u=(v-.5)*cover/zoom+ctr;
  u+=mouse*.006*(1.-length(v-.5));
  vec3 c=texture2D(t0,u).rgb;
  float k=texture2D(t1,u).r;
  vec3 mc=mix(metal(c,metalA,k),metal(c,metalB,k),mixM);
  vec3 r=mix(stone(mc,u,stoneA),stone(mc,u,stoneB),mixS);
  float d=length((v-.5)*vec2(ra,1.));
  r*=1.-.35*smoothstep(.45,1.2,d);
  gl_FragColor=vec4(r,1.);
}`;
  function buildConfig() {
    const state = { metal: 0, stone: 0, carat: 2 };
    let st = null;
    const names = { metal: TX.metals, stone: TX.stones };
    const u = { metalA: 0, metalB: 0, mixM: 0, stoneA: 0, stoneB: 0, mixS: 0 };
    $(".config__fallback").src = CFG.logo;
    try {
      st = new X.Stage($(".config__gl"), { fs: CFS, uniforms: ["stonePos", "stoneRad", "ctr", "metalA", "metalB", "mixM", "stoneA", "stoneB", "mixS"], mouse: true });
      // t0 = la photo, t1 = le masque de la monture (deuxieme element, jamais affiche seul)
      st.add(CFG.logo);
      st.add("assets/ring-mask.webp");
      st.a = 0; st.b = 1; st.prog = 0;
      st.zoom = mob ? 1 : 1.06;
      st.extra = (gl, U) => {
        gl.uniform2f(U.stonePos, 0.481, 0.481);
        gl.uniform2f(U.stoneRad, 0.078, 0.145);
        gl.uniform2f(U.ctr, mob ? 0.55 : 0.535, 0.5);
        for (const k in u) gl.uniform1f(U[k], u[k]);
      };
    } catch (e) { console.warn("[config]", e.message); $(".config__gl").remove(); }
    const fmt = TX.price;
    const price = () => {
      const base = { 1: 9800, 1.5: 15600, 2: 24800 }[state.carat];
      const p = Math.round((base * [1, 0.62, 0.7][state.stone] + [0, 0, 300][state.metal]) / 100) * 100;
      const el = $(".price");
      if (X.hasGsap && !X.reduce) {
        const o = { v: parseInt(el.textContent.replace(/\D/g, ""), 10) || p };
        gsap.to(o, { v: p, duration: 0.8, ease: "power3.out", onUpdate: () => (el.textContent = fmt(Math.round(o.v / 100) * 100)) });
      } else el.textContent = fmt(p);
    };
    const animate = (k, to) => {
      const A = k === "metal" ? "metalA" : "stoneA", B = k === "metal" ? "metalB" : "stoneB", M = k === "metal" ? "mixM" : "mixS";
      u[A] = state[k]; u[B] = to; u[M] = 0;
      if (X.hasGsap && !X.reduce) gsap.to(u, { [M]: 1, duration: 0.9, ease: "power2.inOut", onComplete: () => { u[A] = to; u[M] = 0; } });
      else { u[A] = to; }
    };
    // Sans WebGL, la photo ne peut montrer que l'or rose et le diamant
    if (!st) $$(".swatches .sw:not([data-v='0'])").forEach((b) => (b.disabled = true));
    $$(".swatches, .seg").forEach((g) => {
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b || b.disabled) return;
        const k = g.dataset.k, v = parseFloat(b.dataset.v);
        $$("button", g).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", x === b); });
        if (k === "carat") { state.carat = v; $(".ct__ct").textContent = b.textContent; }
        else { if (state[k] === v) return; animate(k, v); state[k] = v; $(k === "metal" ? ".ct__metal" : ".ct__stone").textContent = names[k][v]; }
        price();
      });
    });
    price();
  }

  /* ---------- Savoir-faire : l'arche s'ouvre ---------- */
  function buildCraft() {
    if (!X.hasGsap || X.reduce) { $(".craft__frame").style.clipPath = "none"; return; }
    gsap.timeline({ scrollTrigger: { trigger: ".craft", start: "top 75%", end: "top -10%", scrub: true } })
      .fromTo(".craft__frame", { clipPath: "inset(0% 22% 0% 22% round 999px 999px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "none" }, 0)
      .fromTo(".craft__img", { scale: 1.4 }, { scale: 1.02, ease: "none" }, 0);
  }

  /* ---------- Rendez-vous (demo) ---------- */
  function buildForm() {
    const slots = $(".slots");
    const jours = TX.days, heures = TX.hours;
    const d = new Date();
    let html = "", n = 0;
    while (n < 8) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      const h = heures[n % 3];
      html += `<button type="button" role="radio" aria-checked="${n === 0}" class="${n === 0 ? "is-on" : ""}" data-l="${jours[d.getDay()]} ${d.getDate()} ${TX.at} ${h}"><small>${jours[d.getDay()]} ${d.getDate()}</small>${h}</button>`;
      n++;
    }
    slots.innerHTML = html;
    slots.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", slots).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-checked", x === b); });
    });
    const f = $(".rform"), msg = $(".rform__msg");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const nom = f.nom.value.trim(), mail = f.mail.value.trim();
      const a = nom.length > 1, b = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail);
      f.nom.closest(".f").classList.toggle("is-bad", !a);
      f.mail.closest(".f").classList.toggle("is-bad", !b);
      if (!a || !b) { msg.textContent = TX.bad; return; }
      const s = $(".slots .is-on");
      const quand = s ? s.dataset.l : "";
      const cfg = TX.cfg($(".ct__metal").textContent, $(".ct__stone").textContent, $(".ct__ct").textContent);
      msg.textContent = TX.ok(nom, f.salon.value.split(",")[0], quand, cfg);
      $("button[type=submit] span", f).textContent = TX.sent;
    });
  }
})();
