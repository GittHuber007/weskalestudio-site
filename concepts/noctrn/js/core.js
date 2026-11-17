/* NOCTRN : outils communs (repris des demos refaites). Aucun objet 3D construit en code :
   on anime des photos et une sequence d images tiree d une video. */
(function () {
  "use strict";
  const W = (window.WX = {});
  const root = document.documentElement;
  W.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  W.touch = matchMedia("(hover: none)").matches;
  W.mobile = () => innerWidth < 760;
  W.hasGsap = !!(window.gsap && window.ScrollTrigger);
  W.anim = W.hasGsap && !W.reduce;
  if (W.hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (W.anim) root.classList.add("anim");
  if (W.reduce) root.classList.add("reduce");
  if (W.touch) root.classList.add("touch");

  W.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  W.smoothstep = (a, b, x) => { const t = W.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* Decoupe du texte en mots ou en lettres, lisible par les lecteurs d'ecran */
  W.split = (el, chars = true) => {
    if (!el) return [];
    if (!el.dataset.split) {
      el.dataset.split = "1";
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              const w = document.createElement("span");
              w.className = "w";
              w.setAttribute("aria-hidden", "true");
              if (chars) {
                [...part].forEach((ch) => { const c = document.createElement("span"); c.className = "c"; c.textContent = ch; w.appendChild(c); });
              } else {
                const i = document.createElement("span"); i.className = "wi"; i.textContent = part; w.appendChild(i);
              }
              frag.appendChild(w);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== "BR") {
            n.setAttribute("aria-hidden", "true");
            walk(n);
          }
        });
      };
      walk(el);
    }
    return [...el.querySelectorAll(chars ? ".c" : ".wi")];
  };

  /* Defilement fluide */
  W.smooth = () => {
    if (!W.anim || !window.Lenis) return null;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    W.lenis = lenis;
    return lenis;
  };
  W.scrollTo = (y) => {
    if (W.lenis) W.lenis.scrollTo(y, { duration: 1.2 });
    else scrollTo({ top: y, behavior: W.reduce ? "auto" : "smooth" });
  };

  /* Curseur discret et boutons magnetiques */
  W.cursor = () => {
    if (W.touch || W.reduce) return;
    const c = document.createElement("div");
    c.className = "cursor";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    let x = -100, y = -100, rx = x, ry = y, running = false;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; c.classList.add("is-on"); if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("is-on"));
    document.addEventListener("pointerover", (e) => c.classList.toggle("is-hover", !!e.target.closest("a, button, summary, [role=radio]")));
    const loop = () => {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      c.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) requestAnimationFrame(loop); else running = false;
    };
  };
  W.magnetic = (sel = "[data-magnetic]") => {
    if (W.touch || !W.anim) return;
    document.querySelectorAll(sel).forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.45)" }));
    });
  };

  /* Navigation qui se masque a la descente */
  W.nav = (el) => {
    if (!el) return;
    let last = 0;
    const on = () => {
      const y = scrollY;
      el.classList.toggle("is-scrolled", y > 40);
      el.classList.toggle("is-hidden", y > 400 && y > last + 4);
      if (y < last - 4) el.classList.remove("is-hidden");
      last = y;
    };
    addEventListener("scroll", on, { passive: true });
    on();
  };

  /* Chargement d'images */
  W.loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = url; });

  /* Phrase revelee mot a mot au defilement. Rappelee apres un changement de langue :
     le texte a ete remplace, on le redecoupe et on recree son declencheur. */
  W.scrubWords = (el) => {
    if (!W.anim) return;
    if (el._tw) { el._tw.scrollTrigger && el._tw.scrollTrigger.kill(); el._tw.kill(); el._tw = null; }
    if (!el.querySelector(".w")) { delete el.dataset.split; el.removeAttribute("aria-label"); }
    const parts = W.split(el, false);
    el._tw = gsap.fromTo(parts, { opacity: 0.1 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: 0.3 } });
  };

  /* Apparitions au defilement */
  W.reveals = () => {
    if (!W.anim) return;
    document.querySelectorAll("[data-split-reveal]").forEach((el) => {
      const parts = W.split(el, false);
      gsap.from(parts, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    document.querySelectorAll("[data-scrub-words]").forEach((el) => W.scrubWords(el));
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
  };
})();
