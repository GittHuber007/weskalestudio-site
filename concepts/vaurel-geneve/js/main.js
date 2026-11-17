/* Vaurel Genève : maison horlogère fictive, concept Weskale Studio.
   Une seule ambiance : noir et or. Un objet par écran.
   1. Ouverture : le chronographe, poussée de caméra au défilement.
      Si une séquence est déposée dans assets/seq-chrono/ (et seq-chrono-m/),
      elle est détectée seule et remplace la poussée de caméra.
   2. Vue éclatée : séquence assets/seq-eclatee/ si déposée, sinon image fixe assets/eclatee.webp,
      trois fiches reliées par des lignes de rappel. Masquée tant qu'aucun visuel n'est déposé.
   3. Calibre : séquence vidéo pilotée par le défilement (assets/seq/, seq-m/).
   4. Atelier : typographie (photo optionnelle assets/atelier.webp).
   5. Cadrans : même montre, trois cadrans, dissolution WebGL.
   6. Rendez-vous privé (démonstration, rien n'est envoyé).
   Textes : anglais dans le HTML, français dans js/i18n.js (window.VL pour les textes du script). */
(function () {
  "use strict";
  const X = window.WX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mob = X.mobile();

  const CFG = {
    hero: mob ? "assets/hero-m.webp" : "assets/hero.webp",
    heroDepth: mob ? "assets/hero-depth-m.jpg" : "assets/hero-depth.jpg",
    // Logo du cadran, en coordonnées de l'image (cible de la poussée de caméra)
    heroFocus: mob ? [0.47, 0.35] : [0.694, 0.345],
    // Séquence du chronographe : nombre d'images lu dans assets/emplacements.json
    chrono: { dir: mob ? "assets/seq-chrono-m/" : "assets/seq-chrono/" },
    // Séquence du calibre (vidéo d'ouverture du cadran onyx, coupée avant le fondu final)
    calibre: { dir: "assets/seq/", count: 138, mobileDir: "assets/seq-m/", mobileCount: 69 },
    // Vue éclatée : points visés par les lignes de rappel, en coordonnées de l'image finale (0 à 1).
    // Valeurs provisoires : elles peuvent être remplacées par "points" dans assets/emplacements.json.
    eclatee: {
      dir: mob ? "assets/seq-eclatee-m/" : "assets/seq-eclatee/",
      still: mob ? "assets/eclatee-m.webp" : "assets/eclatee.webp",
      points: [[0.6, 0.26], [0.6, 0.5], [0.6, 0.74]],
      sides: ["r", "l", "r"],
      focus: [0.5, 0.5],
    },
    models: [
      { img: "assets/hero.webp", m: "assets/hero-m.webp" },
      { img: "assets/m-onyx.webp", m: "assets/m-onyx-m.webp" },
      { img: "assets/m-ossature.webp", m: "assets/m-ossature-m.webp" },
    ].map((m, i) => Object.assign(m, (window.VL && VL.models[i]) || {})),
  };

  /* ---------- Emplacements à remplir (assets/emplacements.json) ----------
     Le script _outils/deposer-sequence.sh découpe la vidéo et met ce fichier à jour. */
  const slots = fetch("assets/emplacements.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {}), () => ({})).catch(() => ({}));

  /* ---------- Préchargeur ---------- */
  const num = $(".loader__num"), bar = $(".loader__line i");
  let shown = 0;
  const setP = (p) => {
    const v = Math.round(p * 100);
    if (v < shown) return;
    shown = v;
    if (num) num.textContent = String(v).padStart(3, "0");
    if (bar) bar.style.transform = `scaleX(${p})`;
  };

  const frame = (dir, k) => `${dir}f_${String(k).padStart(3, "0")}.webp`;
  slots.then((j) => {
    const c = (j && j.chronographe) || {};
    CFG.chrono.count = (mob ? c.mobile : c.desktop) || 0;
    CFG.atelier = !!(j && j.atelier);
    const e = (j && j.eclatee) || {};
    CFG.eclatee.count = (mob ? e.mobile : e.desktop) || 0;
    CFG.eclatee.image = !!e.image;
    if (Array.isArray(e.points) && e.points.length === 3) CFG.eclatee.points = e.points;
    if (Array.isArray(e.sides) && e.sides.length === 3) CFG.eclatee.sides = e.sides;
    if (Array.isArray(e.focus)) CFG.eclatee.focus = e.focus;
    // Avec la séquence : on attend ses premières images ; sinon la photo et sa carte de profondeur
    const first = CFG.chrono.count > 1 ? [0, 1, 2, 3, 4, 5].map((k) => frame(CFG.chrono.dir, k)) : [CFG.hero, CFG.heroDepth];
    return X.preload(first, (p) => setP(p * 0.9));
  }).then(start, start);

  function start() {
    setP(1);
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildHero();
    buildEclatee();
    buildCalibre();
    buildAtelier();
    buildCadrans();
    buildForm();
    X.magnetic();
    X.reveals();
    // Retour après un changement de langue : même hauteur, sans rejouer l'entrée
    let back = null;
    try { back = sessionStorage.getItem("vaurel-y"); sessionStorage.removeItem("vaurel-y"); } catch (e) {}
    if (back != null && X.hasGsap) {
      const l = $(".loader"); l && l.remove();
      X.split($(".hero__title"));
      ScrollTrigger.refresh();
      const y = +back;
      if (X.lenis) X.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
      ScrollTrigger.update();
    } else intro();
    if (X.hasGsap) addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- Entrée orchestrée ---------- */
  function intro() {
    const loader = $(".loader");
    const chars = X.split($(".hero__title"));
    if (!X.hasGsap) { loader && loader.remove(); return; }
    if (X.reduce) { gsap.to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() }); return; }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".loader__mark span", { letterSpacing: "1.1em", opacity: 0, duration: 1.1, ease: "power2.in" }, 0.1)
      .to(".loader__mark small, .loader__count, .loader__line", { opacity: 0, duration: 0.5 }, 0.1)
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut", onComplete: () => loader.remove() }, 0.8)
      .fromTo(".hero__media", { clipPath: "inset(18% 24% 18% 40%)", scale: 1.14 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 2.2, ease: "expo.inOut", clearProps: "clipPath" }, 0.8)
      .from(chars, { yPercent: 115, duration: 1.4, stagger: 0.022 }, 1.9)
      .from(".hero__copy .eyebrow, .hero__sub, .hero__copy .btn, .hero__ref", { opacity: 0, y: 22, duration: 1.2, stagger: 0.09 }, 2.2)
      .from(".nav > *", { opacity: 0, y: -24, duration: 1.2, stagger: 0.08 }, 2.1)
      .from(".hero__scroll", { opacity: 0, duration: 1 }, 2.6);
  }

  /* ---------- 1. Ouverture ---------- */
  function buildHero() {
    const D = CFG.chrono;
    const hero = $(".hero");
    if (D.count > 1) {
      // Séquence du chronographe déposée : elle pilote l'ouverture
      hero.classList.add("has-seq");
      // Sur téléphone, le cadrage suit le cadran : à droite au début de l'arc, au centre à la fin
      const ease = (t) => t * t * (3 - 2 * t);
      const seq = new X.Seq($(".hero__seq"), { dir: D.dir, count: D.count, bg: "#030303", poster: frame(D.dir, 0), focus: mob ? (p) => [0.72 - 0.08 * ease(p), 0.5] : [0.5, 0.5] });
      seq.set(0);
      $(".hero__gl").remove();
      seq.c.classList.add("is-ready");
      if (!X.hasGsap) return;
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.to(".hero__copy, .hero__ref", { y: -80, opacity: 0, duration: 0.18 }, 0.02)
        .fromTo(".hero__note", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1 }, 0.35)
        .to(".hero__note", { opacity: 0, y: -30, duration: 0.1 }, 0.7)
        .to(".hero__scroll", { opacity: 0, duration: 0.05 }, 0)
        .to(".hero__shut", { opacity: 1, duration: 0.12 }, 0.88)
        .to({}, { duration: 0.001 }, 1);
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.5, animation: tl, onUpdate: (s) => seq.set(s.progress) });
      return;
    }
    $(".hero__seq").remove();
    const st = X.stage($(".hero__gl"), { depthAmt: 0.022, vig: 0.22, grain: 0.016, disp: 0.1 });
    if (st) {
      st.add(CFG.hero, CFG.heroDepth);
      st.focus = CFG.heroFocus.slice();
    }
    if (!X.hasGsap) return;
    // Respiration lente de la photo, puis poussée de caméra vers le logo du cadran
    const cam = { z: 1 };
    if (st && !X.reduce) gsap.to(cam, { z: 1.045, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    const push = { z: 1 };
    if (st) gsap.ticker.add(() => (st.zoom = cam.z * push.z));
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(push, { z: mob ? 2.4 : 3.1, duration: 1, ease: "power2.in" }, 0)
      .to(".hero__copy, .hero__ref", { y: -90, opacity: 0, duration: 0.3 }, 0)
      .to(".hero__scroll", { opacity: 0, duration: 0.08 }, 0)
      .fromTo(".hero__note", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14 }, 0.3)
      .to(".hero__note", { opacity: 0, y: -30, duration: 0.12 }, 0.66)
      .to(".hero__shut", { opacity: 1, duration: 0.2 }, 0.8);
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.6, animation: tl });
  }

  /* Section qui succède à un plan qui finit au noir : elle chevauche le dernier écran
     du précédent et apparaît en fondu dès qu'elle s'épingle. */
  const linkIn = (section, pin) => {
    section.classList.add("is-linked");
    pin.style.opacity = 0;
    return (p) => (pin.style.opacity = Math.min(1, p / 0.035));
  };

  /* ---------- 2. Vue éclatée ---------- */
  function buildEclatee() {
    const E = CFG.eclatee;
    const sec = $(".eclatee");
    const hasSeq = E.count > 1;
    if (!hasSeq && !E.image) {
      // Aucun visuel déposé : la section reste masquée, les liens passent au calibre
      $$('a[href="#eclatee"]').forEach((a) => (a.closest(".nav__left") ? a.remove() : (a.href = "#calibre")));
      return;
    }
    sec.hidden = false;
    const pin = $(".eclatee__pin"), still = $(".eclatee__still"), canvas = $(".eclatee__canvas");
    const cards = $$(".xcard"), svg = $(".eclatee__lines");
    let aspect = 16 / 9, seq = null, zoom = 1;
    if (E.image) {
      still.src = E.still;
      still.addEventListener("load", () => { aspect = still.naturalWidth / still.naturalHeight; layout(); }, { once: true });
    } else still.remove();
    if (hasSeq) {
      // Sur téléphone, la montre assemblée est à droite : le cadrage glisse vers le centre de la vue éclatée
      const ease = (t) => t * t * (3 - 2 * t);
      seq = new X.Seq(canvas, { dir: E.dir, count: E.count, bg: "#030303", poster: E.dir + "f_000.webp", focus: mob ? (p) => [0.7 - 0.2 * ease(p), E.focus[1]] : E.focus });
      seq.c.classList.add("is-ready");
      seq.set(0);
      if (E.image) { canvas.after(still); still.style.opacity = 0; }
      else X.loadImg(seq.file(E.count - 1)).then((im) => { aspect = im.naturalWidth / im.naturalHeight; layout(); }, () => {});
    } else canvas.remove();
    const media = E.image ? still : canvas;
    // Courbe de défilement de la vidéo : le passage confus (images 72 à 96 environ) est traversé vite
    const curve = (q) => {
      const K = E.curve || [[0, 0], [0.42, 0.375], [0.46, 0.5], [1, 1]];
      for (let k = 1; k < K.length; k++) if (q <= K[k][0]) return K[k - 1][1] + ((q - K[k - 1][0]) / (K[k][0] - K[k - 1][0])) * (K[k][1] - K[k - 1][1]);
      return 1;
    };
    const head = $(".eclatee__head");

    // Lignes de rappel : du bord de chaque fiche jusqu'au point visé sur l'image
    // pathLength="1" : le tracé se dessine de 1 à 0 quelle que soit sa longueur réelle
    svg.innerHTML = cards.map(() => '<path class="xl" pathLength="1"/><circle class="xd" r="4"/>').join("");
    const paths = $$(".xl", svg), dots = $$(".xd", svg);
    function toScreen(u, v) {
      const cw = media.offsetWidth, ch = media.offsetHeight;
      // Même cadrage que l'image (couverture du cadre, point de cadrage E.focus)
      const w = Math.max(cw, ch * aspect), h = w / aspect;
      const x0 = Math.min(0, Math.max(cw - w, cw / 2 - w * E.focus[0]));
      const y0 = Math.min(0, Math.max(ch - h, ch / 2 - h * E.focus[1]));
      let x = x0 + u * w, y = y0 + v * h;
      x = cw / 2 + (x - cw / 2) * zoom; y = ch / 2 + (y - ch / 2) * zoom;
      return [media.offsetLeft + x, media.offsetTop + y];
    }
    function layout() {
      const pr = pin.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${pr.width} ${pr.height}`);
      cards.forEach((c, i) => {
        const [px, py] = toScreen(E.points[i][0], E.points[i][1]);
        const side = E.sides[i] === "l" ? "l" : "r";
        c.classList.toggle("xcard--l", side === "l");
        let ax, ay;
        if (mob) {
          // Téléphone : fiches en bas, la ligne monte vers le point
          const cr = c.getBoundingClientRect();
          ax = cr.left - pr.left + 12; ay = cr.top - pr.top - 10;
          paths[i].setAttribute("d", `M${ax},${ay} L${ax},${Math.max(py + 18, ay - 40)} L${px},${py}`);
        } else {
          // Une fiche à gauche passe sous le titre
          const minY = side === "l" ? head.offsetTop + head.offsetHeight + 28 : 110;
          c.style.top = `${Math.max(minY, Math.min(pr.height - 200, py - 40))}px`;
          const cr = c.getBoundingClientRect();
          ax = side === "l" ? cr.right - pr.left + 18 : cr.left - pr.left - 18;
          ay = cr.top - pr.top + 34;
          const ex = side === "l" ? Math.min(px - 40, ax + 80) : Math.max(px + 40, ax - 80);
          paths[i].setAttribute("d", `M${ax},${ay} L${ex},${ay} L${px},${py}`);
        }
        dots[i].setAttribute("cx", px); dots[i].setAttribute("cy", py);
      });
    }
    addEventListener("resize", () => requestAnimationFrame(layout));
    layout();
    if (!X.hasGsap) { cards.forEach((c) => (c.style.opacity = 1)); paths.forEach((p) => (p.style.strokeDashoffset = 0)); return; }

    const fade = linkIn(sec, pin);
    // Avec la séquence : le démontage occupe la première moitié, les fiches arrivent sur l'image finale
    const t0 = hasSeq ? 0.5 : 0.2, step = mob ? 0.17 : 0.12;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    cards.forEach((c, i) => {
      const a = t0 + i * step;
      tl.fromTo(c, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.05 }, a)
        .fromTo(paths[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.07 }, a + 0.02)
        .fromTo(dots[i], { opacity: 0 }, { opacity: 1, duration: 0.03 }, a + 0.07);
      if (mob && i < cards.length - 1) {
        tl.to(c, { opacity: 0, y: -16, duration: 0.04 }, a + step - 0.04)
          .to(paths[i], { opacity: 0, duration: 0.04 }, a + step - 0.04)
          .to(dots[i], { opacity: 0, duration: 0.04 }, a + step - 0.04);
      }
    });
    if (mob) tl.to(".eclatee__head", { opacity: 0, y: -16, duration: 0.04 }, t0 - 0.05);
    tl.fromTo(".eclatee__note", { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0 + 0.04)
      .to(".eclatee__shut", { opacity: 1, duration: 0.08 }, 0.92)
      .to({}, { duration: 0.001 }, 1);
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.5, animation: tl,
      onUpdate: (self) => {
        fade(self.progress);
        if (seq) {
          const q = Math.min(1, self.progress / 0.5);
          seq.set(curve(q));
          // Fin de la vidéo : passage sur l'image 2K nette, identique à la dernière image
          if (E.image) still.style.opacity = Math.max(0, Math.min(1, (q - 0.94) / 0.06));
        }
        else if (!X.reduce) { zoom = 1.06 - self.progress * 0.06; still.style.transform = `scale(${zoom})`; layout(); }
      },
      onRefresh: layout,
    });
  }

  /* ---------- 3. Calibre : séquence pilotée par le défilement ---------- */
  function buildCalibre() {
    const C = CFG.calibre;
    const steps = $$(".calibre .step");
    const figs = $$(".calibre__figs > div");
    const hbar = $(".hud__bar i"), hframe = $(".hud__frame");
    const pin = $(".calibre__pin");
    const seq = new X.Seq($(".calibre__canvas"), {
      dir: C.dir, count: C.count, mobileDir: C.mobileDir, mobileCount: C.mobileCount,
      bg: "#030303", poster: mob ? "assets/m-onyx-m.webp" : null,
      // Sur téléphone : la montre est à droite au début, le mouvement au centre ensuite
      focus: mob ? (p) => [0.68 - Math.min(1, p / 0.45) * 0.12, 0.5] : [0.5, 0.5],
    });
    seq.c.classList.add("is-ready");
    $(".calibre__fallback").classList.add("is-under");
    seq.set(0);
    if (!X.hasGsap) { steps[0] && (steps[0].style.opacity = 1); return; }
    const fade = linkIn($(".calibre"), pin);

    steps.forEach((s) => X.split($(".step__t", s)));
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    const marks = [0, 0.27, 0.54], span = 0.27;
    steps.forEach((s, i) => {
      const t0 = marks[i];
      const chars = $$(".c", s);
      const rest = [$(".step__n", s), $(".step__d", s)];
      tl.set(s, { opacity: 1 }, t0);
      if (i > 0) tl.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.004, duration: 0.05 }, t0)
        .fromTo(rest, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.05 }, t0 + 0.02);
      tl.to(chars, { yPercent: -110, stagger: 0.003, duration: 0.045 }, t0 + span - 0.06)
        .to(rest, { opacity: 0, y: -18, duration: 0.045 }, t0 + span - 0.06)
        .set(s, { opacity: 0 }, t0 + span);
    });
    figs.forEach((f, i) => tl.fromTo(f, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.06 }, 0.83 + i * 0.035));
    tl.fromTo(".calibre__veil", { "--side": 1 }, { "--side": 0.75, duration: 0.3 }, 0.5);
    tl.fromTo(".calibre__veil", { "--low": 0 }, { "--low": 1, duration: 0.08 }, 0.8);
    tl.to({}, { duration: 0.001 }, 1);
    ScrollTrigger.create({
      trigger: ".calibre", start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.5,
      animation: tl,
      onUpdate: (self) => {
        fade(self.progress);
        // La vidéo occupe les 82 premiers pour cent, puis l'image finale reste pour les chiffres
        seq.set(Math.min(1, self.progress / 0.82));
        hbar.style.transform = `scaleX(${self.progress})`;
        hframe.textContent = String(seq.i).padStart(3, "0");
      },
    });
  }

  /* ---------- 3. Atelier ---------- */
  function buildAtelier() {
    if (!CFG.atelier) return;
    const fig = $(".atelier__media");
    $(".atelier__img").src = "assets/atelier.webp";
    fig.hidden = false;
    if (!X.hasGsap || X.reduce) return;
    gsap.fromTo(fig, { clipPath: "inset(18% 22% 18% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: fig, start: "top 85%", end: "center 50%", scrub: true } });
  }

  /* ---------- 4. Cadrans : configurateur ---------- */
  function buildCadrans() {
    const M = CFG.models;
    const pick = $(".cadrans__pick");
    const nameEl = $(".cadrans__name");
    const fb = $(".cadrans__fallback");
    $(".ci__tot").textContent = String(M.length).padStart(2, "0");
    $(".vform__model").innerHTML = M.map((m) => `<option>${m.name}</option>`).join("");
    pick.innerHTML = M.map((m, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span>${m.name}</button>`).join("");
    fb.src = mob ? M[0].m : M[0].img;
    M.forEach((m) => { const i = new Image(); i.src = mob ? m.m : m.img; });

    const st = X.stage($(".cadrans__gl"), { depthAmt: 0.008, vig: 0.24, grain: 0.016, disp: 0.16 });
    if (st) { M.forEach((m) => st.add(mob ? m.m : m.img)); st.focus = mob ? [0.5, 0.45] : [0.66, 0.5]; }
    let cur = 0;
    const show = (i) => {
      if (i === cur) return;
      cur = i;
      const m = M[i];
      if (st) st.go(i, 1.6);
      else fb.src = mob ? m.m : m.img;
      $(".ci__cur").textContent = String(i + 1).padStart(2, "0");
      $$("button", pick).forEach((b, k) => { b.classList.toggle("is-on", k === i); b.setAttribute("aria-selected", k === i); });
      const swap = () => {
        nameEl.textContent = m.name;
        delete nameEl.dataset.split;
        $$(".cadrans__meta dd").forEach((d) => (d.textContent = m[d.dataset.k]));
        if (!X.hasGsap || X.reduce) return;
        gsap.fromTo(X.split(nameEl), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.03, ease: "expo.out" });
        gsap.fromTo(".cadrans__meta dd", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" });
      };
      if (!X.hasGsap || X.reduce) swap();
      else gsap.to([...$$(".c", nameEl), ...$$(".cadrans__meta dd")], { yPercent: -110, opacity: 0, duration: 0.4, stagger: 0.012, ease: "power3.in", onComplete: () => { gsap.set(".cadrans__meta dd", { yPercent: 0 }); gsap.set($$(".c", nameEl), { opacity: 1 }); swap(); } });
    };
    $$("button", pick)[0].classList.add("is-on");
    nameEl.textContent = M[0].name;
    $$(".cadrans__meta dd").forEach((d) => (d.textContent = M[0][d.dataset.k]));
    X.split(nameEl);

    let trig = null;
    if (X.hasGsap) {
      trig = ScrollTrigger.create({
        trigger: ".cadrans", start: "top top", end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress, n = M.length;
          show(Math.min(n - 1, Math.floor(p * n)));
          if (st) st.zoom = 1 + p * 0.035;
        },
      });
    }
    pick.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const i = +b.dataset.i;
      if (!trig) { show(i); return; }
      const y = trig.start + ((i + 0.5) / M.length) * (trig.end - trig.start);
      if (X.lenis) X.lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: X.reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- 5. Rendez-vous privé (démonstration) ---------- */
  function buildForm() {
    const days = $(".days");
    const names = VL.days, long = VL.daysLong;
    const d = new Date();
    let html = "", n = 0;
    while (n < 6) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      html += `<button type="button" role="radio" aria-checked="${n === 0}" class="${n === 0 ? "is-on" : ""}" data-l="${long[d.getDay()]} ${d.getDate()}">${names[d.getDay()]}<b>${d.getDate()}</b></button>`;
      n++;
    }
    days.innerHTML = html;
    days.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", days).forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-checked", x === b); });
    });
    const f = $(".vform"), msg = $(".vform__msg");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = f.name.value.trim(), email = f.email.value.trim();
      const okName = name.length > 1, okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      f.name.closest(".field").classList.toggle("is-bad", !okName);
      f.email.closest(".field").classList.toggle("is-bad", !okMail);
      if (!okName || !okMail) { msg.textContent = VL.bad; return; }
      const day = $(".days .is-on");
      msg.textContent = VL.ok(name, f.model.value, day ? day.dataset.l : "", f.salon.options[f.salon.selectedIndex].text);
      f.querySelector("button[type=submit] span").textContent = VL.sent;
    });
  }
})();
