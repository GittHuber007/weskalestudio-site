/* Lexaris Avocats : cabinet d'avocats d'affaires fictif à Paris, concept Weskale Studio.
   Une seule ambiance : noir profond et ivoire. Un sujet par écran.
   1. Ouverture : la bibliothèque du cabinet (image Google Flow) en WebGL, profondeur à la souris,
      puis poussée de caméra vers la plaque LEXARIS au défilement.
   2. La lecture : la caméra monte le long des rayonnages (séquence assets/seq/lib/), trois légendes.
   3. Le cabinet : texte qui s'éclaire au défilement.
   4. Expertises : six domaines, un par écran, fondu WebGL entre les photos.
   5. À la table : la vidéo des mains s'ouvre jusqu'à remplir l'écran.
   6. Associés : ex-libris typographiques (personnes fictives, aucune photo).
   7. Le sceau : la signature se trace au défilement (assets/seq/sig/), trois engagements.
   8. Demande confidentielle (démonstration, rien n'est envoyé).
   Textes : anglais dans le HTML, français dans js/i18n.js (window.LX pour les textes du script). */
(function () {
  "use strict";
  const X = window.WX;
  const L = window.LX || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mob = X.mobile();

  const CFG = {
    hero: mob ? "assets/img/hero-m.webp" : "assets/img/hero.webp",
    // Plaque LEXARIS, en coordonnées de l'image (cible de la poussée de caméra)
    plaque: mob ? [0.52, 0.408] : [0.762, 0.408],
    lib: mob ? { dir: "assets/seq/lib-m/", count: 120 } : { dir: "assets/seq/lib/", count: 180 },
    sig: mob ? { dir: "assets/seq/sig-m/", count: 62 } : { dir: "assets/seq/sig/", count: 124 },
    stills: ["assets/img/archives.webp", "assets/img/allee.webp", "assets/img/rayons.webp", "assets/img/table.webp"],
  };
  const frame = (dir, k) => `${dir}f_${String(k).padStart(3, "0")}.webp`;

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
  X.preload([CFG.hero, frame(CFG.lib.dir, 0), frame(CFG.lib.dir, 1), frame(CFG.lib.dir, 2)], (p) => setP(p * 0.92)).then(start, start);

  function start() {
    setP(1);
    X.smooth();
    X.nav($(".nav"));
    X.cursor();
    buildHero();
    buildReading();
    buildPractices();
    buildTable();
    buildPlates();
    buildSeal();
    buildForm();
    X.magnetic();
    X.reveals();
    // Retour après un changement de langue : même hauteur, sans rejouer l'entrée
    let back = null;
    try { back = sessionStorage.getItem("lexaris-y"); sessionStorage.removeItem("lexaris-y"); } catch (e) {}
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
    tl.to(".loader__mark span", { letterSpacing: "1.2em", opacity: 0, duration: 1.1, ease: "power2.in" }, 0.1)
      .to(".loader__mark small, .loader__count, .loader__line", { opacity: 0, duration: 0.5 }, 0.1)
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut", onComplete: () => loader.remove() }, 0.8)
      .fromTo(".hero__media", { clipPath: "inset(30% 36% 30% 36%)", scale: 1.18 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 2.2, ease: "expo.inOut", clearProps: "clipPath" }, 0.8)
      .from(chars, { yPercent: 115, duration: 1.4, stagger: 0.022 }, 1.9)
      .from(".hero__copy .eyebrow, .hero__sub, .hero__copy .btn", { opacity: 0, y: 22, duration: 1.2, stagger: 0.09 }, 2.2)
      .from(".nav > *", { opacity: 0, y: -24, duration: 1.2, stagger: 0.08 }, 2.1)
      .from(".hero__scroll", { opacity: 0, duration: 1 }, 2.6);
  }

  /* Légendes calées sur une plage de progression : data-at="début,fin" */
  const ranges = (els) => els.map((el) => { const [a, b] = el.dataset.at.split(",").map(Number); return { el, a, b }; });
  const showRanges = (list, p) => list.forEach((r) => {
    const on = p >= r.a && p < r.b;
    if (on !== r.on) { r.on = on; r.el.classList.toggle("is-on", on); }
  });

  /* ---------- 1. Ouverture ---------- */
  function buildHero() {
    const hero = $(".hero");
    const st = X.stage($(".hero__gl"), { depthAmt: 0.02, vig: 0.3, grain: 0.018, disp: 0.1, bg: [0.03, 0.03, 0.027] });
    if (st) { st.add(CFG.hero); st.focus = CFG.plaque.slice(); }
    if (!X.hasGsap) return;
    // Respiration lente de la photo, puis poussée de caméra vers la plaque
    const cam = { z: 1 }, push = { z: 1 };
    if (st && !X.reduce) gsap.to(cam, { z: 1.04, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1 });
    if (st) gsap.ticker.add(() => (st.zoom = cam.z * push.z));
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(push, { z: mob ? 2.3 : 3.4, duration: 1, ease: "power2.in" }, 0)
      .to(".hero__copy", { y: -90, opacity: 0, duration: 0.25 }, 0)
      .to(".hero__scroll", { opacity: 0, duration: 0.06 }, 0)
      .to(".hero__veil", { opacity: 0.55, duration: 0.3 }, 0.1)
      .fromTo(".hero__note", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14 }, 0.3)
      .to(".hero__note", { opacity: 0, y: -30, duration: 0.12 }, 0.68)
      .to(".hero__shut", { opacity: 1, duration: 0.14 }, 0.84)
      .to({}, { duration: 0.001 }, 1);
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.6, animation: tl });
  }

  /* ---------- 2. La lecture ----------
     Elle chevauche le dernier écran de l'ouverture (fini au noir) et apparaît en fondu en s'épinglant. */
  function buildReading() {
    const sec = $(".reading"), pin = $(".reading__pin");
    const seq = new X.Seq($(".reading__seq"), { dir: CFG.lib.dir, count: CFG.lib.count, bg: "#080807", poster: frame(CFG.lib.dir, 0) });
    seq.set(0);
    seq.c.classList.add("is-ready");
    if (!X.hasGsap) return;
    sec.classList.add("is-linked");
    pin.style.opacity = 0;
    const caps = ranges($$(".reading .cap"));
    const hudBar = $(".reading__hud .hud__bar i"), hudN = $(".reading__hud .hud__n"), shut = $(".reading__shut");
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.5,
      onUpdate: (s) => {
        const p = s.progress;
        pin.style.opacity = Math.min(1, p / 0.035);
        seq.set(p);
        showRanges(caps, p);
        shut.style.opacity = Math.max(0, (p - 0.94) / 0.06);
        if (hudBar) hudBar.style.transform = `scaleX(${p})`;
        if (hudN) hudN.textContent = String(Math.round(p * 100)).padStart(3, "0");
      },
    });
  }

  /* ---------- 3. Expertises ---------- */
  function buildPractices() {
    const sec = $(".practices");
    const items = $$(".pr"), list = $(".practices__list"), cur = $(".pr__cur"), barI = $(".practices__bar i");
    // positions lues hors du defilement (au depart et au redimensionnement)
    let offs = [];
    const measure = () => { offs = items.map((it) => it.offsetTop + it.offsetHeight / 2); };
    measure();
    const st = X.stage($(".practices__gl"), { depthAmt: 0.018, vig: 0.5, grain: 0.02, disp: 0.14, bg: [0.03, 0.03, 0.027] });
    if (st) CFG.stills.forEach((u) => st.add(u));
    let idx = -1;
    const setIdx = (i) => {
      if (i === idx) return;
      idx = i;
      items.forEach((el, k) => el.classList.toggle("is-on", k === i));
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
      const it = items[i];
      if (st) st.go(+it.dataset.img, 1.3);
      // La liste glisse pour garder le domaine actif au centre
      const off = offs[i];
      if (window.gsap && !X.reduce) gsap.to(list, { y: -off, duration: 1, ease: "power3.out" });
      else list.style.transform = `translateY(${-off}px)`;
    };
    setIdx(0);
    addEventListener("resize", () => { measure(); const i = idx; idx = -1; setIdx(i); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); const i = idx; idx = -1; setIdx(i); });
    if (!X.hasGsap) return;
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "bottom bottom",
      onUpdate: (s) => {
        setIdx(Math.min(items.length - 1, Math.floor(s.progress * items.length * 0.999)));
        if (barI) barI.style.transform = `scaleY(${s.progress})`;
      },
    });
  }

  /* ---------- 4. À la table ---------- */
  function buildTable() {
    const sec = $(".table"), v = $(".table__video");
    // Vidéo chargée seulement à l'approche, jouée seulement à l'écran
    let loaded = false;
    const load = () => { if (loaded) return; loaded = true; v.src = mob ? v.dataset.srcM : v.dataset.src; };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((e) => {
        e.forEach((en) => {
          if (en.isIntersecting) { load(); if (!X.reduce) { const p = v.play(); p && p.catch(() => {}); } }
          else v.pause();
        });
      }, { rootMargin: "300px 0px" }).observe(sec);
    } else load();
    const title = $(".table__title");
    const words = X.split(title, false);
    if (!X.hasGsap) return;
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.fromTo(".table__frame", { clipPath: mob ? "inset(26% 12% 26% 12%)" : "inset(20% 31% 20% 31%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.inOut" }, 0)
      .fromTo(".table__video", { scale: 1.25 }, { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0)
      .fromTo(".table__veil", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.3)
      .fromTo(".table__k", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.1 }, 0.42)
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.25, stagger: 0.02, ease: "power3.out" }, 0.45)
      .fromTo(".table__note", { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.7)
      .to({}, { duration: 0.15 }, 0.85);
    ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.6, animation: tl });
  }

  /* ---------- 5. Associés : inclinaison en perspective ---------- */
  function buildPlates() {
    if (X.touch || X.reduce || !window.gsap) return;
    $$("[data-tilt]").forEach((el) => {
      const inn = $(".plate__in", el);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(inn, { rotateY: x * 14, rotateX: -y * 12, duration: 0.6, ease: "power3.out" });
        el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
        el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      });
      el.addEventListener("pointerleave", () => gsap.to(inn, { rotateY: 0, rotateX: 0, duration: 1.1, ease: "elastic.out(1,0.5)" }));
    });
  }

  /* ---------- 6. Le sceau ---------- */
  function buildSeal() {
    const sec = $(".seal");
    const seq = new X.Seq($(".seal__seq"), { dir: CFG.sig.dir, count: CFG.sig.count, bg: "#ece4d4", poster: frame(CFG.sig.dir, 0), focus: mob ? [0.42, 0.6] : [0.5, 0.5] });
    seq.set(0);
    seq.c.classList.add("is-ready");
    if (!X.hasGsap) { seq.set(1); return; }
    const vows = ranges($$(".vow"));
    const chars = X.split($(".seal__title"));
    gsap.from(chars, { yPercent: 115, duration: 1.3, stagger: 0.02, ease: "expo.out", scrollTrigger: { trigger: sec, start: "top 45%", once: true } });
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "bottom bottom", scrub: X.reduce ? true : 0.5,
      onUpdate: (s) => {
        // La signature se trace sur les trois premiers quarts, puis reste posée
        seq.set(Math.min(1, s.progress / 0.8));
        showRanges(vows, s.progress);
      },
    });
  }

  /* ---------- 7. Demande confidentielle (démonstration) ---------- */
  function buildForm() {
    const f = $(".cform"), out = $(".cform__ok");
    if (!f) return;
    const ref = () => {
      const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let s = "";
      for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
      return `LX ${s}`;
    };
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = f.elements.namedItem("name").value.trim(), mail = f.elements.namedItem("email").value.trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
        out.className = "cform__ok is-bad";
        out.textContent = L.bad || "Please give your name and a valid email address.";
        return;
      }
      const ch = f.querySelector('input[name="channel"]:checked');
      const chTxt = (L.ch && ch && L.ch[ch.value]) || "";
      const r = ref();
      out.className = "cform__ok is-ok";
      out.innerHTML = "";
      const wax = document.createElement("div");
      wax.className = "wax";
      wax.setAttribute("aria-hidden", "true");
      wax.innerHTML = "<span>L</span>";
      const p = document.createElement("p");
      p.textContent = L.ok ? L.ok(name, r, chTxt) : `Thank you, ${name}. Reference ${r}. Demonstration only: nothing has been sent.`;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn";
      again.innerHTML = `<span></span><i class="btn__line"></i>`;
      again.firstChild.textContent = L.again || "New request";
      again.addEventListener("click", () => { f.reset(); out.className = "cform__ok"; out.innerHTML = ""; f.classList.remove("is-sealed"); });
      out.append(wax, p, again);
      f.classList.add("is-sealed");
      if (window.gsap && !X.reduce) gsap.fromTo(wax, { scale: 1.8, opacity: 0, rotate: -20 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(2)" });
    });
  }
})();
