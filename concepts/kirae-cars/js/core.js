/* Noyau commun des démos : défilement, texte, curseur, séquence d'images, effets WebGL sur photos.
   Aucune géométrie 3D : uniquement des photos et des vidéos générées, déformées par shader. */
(function () {
  "use strict";
  const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const WK = {
    reduced: mqReduced.matches,
    touch: window.matchMedia("(hover: none), (pointer: coarse)").matches,
    small: window.innerWidth < 760,
    lenis: null,
    params: new URLSearchParams(location.search),
  };
  const hasGsap = () => typeof window.gsap !== "undefined";

  /* ---------- Défilement fluide ---------- */
  WK.initScroll = function () {
    if (hasGsap() && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (WK.reduced || typeof window.Lenis === "undefined") return null;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    WK.lenis = window.__lenis = lenis;
    if (hasGsap()) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        const nav = document.querySelector(".nav");
        lenis.scrollTo(t, { offset: nav ? -nav.offsetHeight : 0, duration: 1.4 });
      });
    });
    return lenis;
  };
  /* Pendant le défilement, html.is-scrolling coupe les flous d'arrière-plan (CSS) ; ils reviennent à l'arrêt. */
  (function () {
    let t = 0, on = false;
    const root = document.documentElement;
    addEventListener("scroll", () => {
      if (!on) { on = true; root.classList.add("is-scrolling"); }
      clearTimeout(t); t = setTimeout(() => { on = false; root.classList.remove("is-scrolling"); }, 180);
    }, { passive: true });
  })();
  WK.lock = (on) => {
    document.documentElement.classList.toggle("is-locked", on);
    if (WK.lenis) on ? WK.lenis.stop() : WK.lenis.start();
  };

  /* ---------- Découpe du texte ---------- */
  WK.splitChars = function (el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((word) => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            [...word].forEach((c) => {
              const m = document.createElement("span"); m.className = "cm";
              const s = document.createElement("span"); s.className = "c"; s.textContent = c;
              m.appendChild(s); w.appendChild(m); out.push(s);
            });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    return out;
  };
  WK.splitLines = function (el) {
    if (!el || el.dataset.splitl) return [];
    el.dataset.splitl = "1";
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="lm"><span class="l">${p}</span></span>`).join("");
    return [...el.querySelectorAll(".l")];
  };

  /* ---------- Préchargeur ---------- */
  WK.preload = function (urls, onProgress) {
    let done = 0;
    const total = Math.max(1, urls.length);
    return Promise.all(urls.map((u) => new Promise((res) => {
      const finish = () => { done++; onProgress && onProgress(done / total); res(); };
      if (/\.(mp4|webm)$/i.test(u)) { finish(); return; }
      const im = new Image(); im.onload = finish; im.onerror = finish; im.src = u;
      if (im.complete) { /* cache */ }
    })));
  };

  /* ---------- Curseur et boutons magnétiques ---------- */
  WK.cursor = function () {
    if (WK.touch || WK.reduced) return;
    const c = document.createElement("div"); c.className = "cursor"; c.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"></span><span class="cursor__label"></span>';
    document.body.appendChild(c);
    document.documentElement.classList.add("has-cursor");
    const label = c.querySelector(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    let running = false;
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      c.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) requestAnimationFrame(loop); else running = false;
    };
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    c.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, input, select, label");
      c.classList.toggle("is-hover", !!t);
      const txt = t && t.dataset.cursor ? t.dataset.cursor : "";
      label.textContent = txt; c.classList.toggle("is-label", !!txt);
    });
  };
  WK.magnetic = function (sel) {
    if (WK.touch || WK.reduced || !hasGsap()) return;
    document.querySelectorAll(sel).forEach((el) => {
      const s = parseFloat(el.dataset.magnetic || 0.35);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.4)" }));
    });
  };

  /* Image de séquence décodée une seule fois, hors du fil principal (ImageBitmap) ; repli sur une image décodée. */
  WK.frame = (u) => (window.createImageBitmap && window.fetch)
    ? fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then((b) => createImageBitmap(b))
    : new Promise((res, rej) => { const im = new Image(); im.onload = () => (im.decode ? im.decode() : Promise.resolve()).then(() => res(im), () => res(im)); im.onerror = rej; im.src = u; });
  WK.free = (b) => { if (!b) return; if (b.close) b.close(); else b.src = ""; };

  /* ---------- Séquence d'images pilotée par le défilement ----------
     Images chargées par fenêtre glissante autour de l'image voulue, plus une image clé sur 8
     gardée en mémoire. On dessine toujours l'image chargée la plus proche : jamais d'écran vide. */
  WK.sequence = function (opt) {
    /* Version du 18/11/2026 : images fournies par WSFrames (js/frames.js), fondu entre images voisines,
       résolution fixe pendant le défilement. Même interface qu'avant (N, set, size). */
    const canvas = opt.canvas;
    const ctx = canvas.getContext("2d");
    const mobile = WK.small && opt.mobileDir;
    const dir = mobile ? opt.mobileDir : opt.dir;
    const N = mobile ? opt.mobileCount : opt.count;
    const pad = (k) => String(k + 1).padStart(3, "0");
    let cw = 0, ch = 0, lastF = -1;
    const store = new window.WSFrames.FrameStore({
      n: N, url: (k) => `${dir}f_${pad(k)}.webp`, el: canvas,
      onFrame: () => draw(true),
      onMissing: () => opt.onMissing && opt.onMissing(),
    });
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, WK.touch ? 2 : 1.5);
      const r = canvas.getBoundingClientRect();
      cw = canvas.width = Math.max(1, Math.round(r.width * dpr));
      ch = canvas.height = Math.max(1, Math.round(r.height * dpr));
      draw(true);
    }
    function draw(force) {
      if (!force && store.f === lastF) return;
      const pk = store.pick();
      if (!pk.im) return;
      lastF = store.f;
      // la taille de référence est celle des images pleine taille (les images clés sont plus petites)
      const iw = (store.size && store.size[0]) || pk.im.width || pk.im.naturalWidth, ih = (store.size && store.size[1]) || pk.im.height || pk.im.naturalHeight;
      const fit = typeof opt.fit === "function" ? opt.fit() : (opt.fit || "cover");
      const s = fit === "contain" ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
      const w = iw * s, h = ih * s;
      const fx = opt.focusX ?? 0.5, fy = opt.focusY ?? 0.5;
      const x = (cw - w) * fx, y = (ch - h) * fy;
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(pk.im, x, y, w, h);
      // fondu vers l'image suivante selon la position exacte : pas de palier entre deux images
      if (pk.nx) { ctx.globalAlpha = pk.t; ctx.drawImage(pk.nx, x, y, w, h); ctx.globalAlpha = 1; }
    }
    const api = {
      N,
      set(p) { store.set(Math.max(0, Math.min(1, p)) * (N - 1)); draw(); },
      size,
    };
    addEventListener("resize", () => { clearTimeout(api._t); api._t = setTimeout(size, 150); });
    size();
    return api;
  };

  /* ---------- Effets WebGL sur photos ----------
     Une photo sur un plan plein cadre (deux triangles), déformée par un shader :
     - "depth" : parallaxe 2,5D à la souris avec une carte de profondeur approchée (ellipse du sujet + luminance)
     - "hover" : ondulation autour du curseur et décalage chromatique selon la vitesse de défilement
     - "slider" : transition par dissolution bruitée entre plusieurs photos */
  const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;varying vec2 v;
uniform sampler2D t0;uniform sampler2D t1;uniform vec2 res;uniform vec2 ir0;uniform vec2 ir1;
uniform vec2 mouse;uniform float hover;uniform float time;uniform float vel;uniform float prog;uniform float mode;
uniform vec4 subj;uniform float zoom;uniform float strength;uniform vec2 focus;
vec2 cover(vec2 uv,vec2 ir){float rs=res.x/res.y,ri=ir.x/ir.y;vec2 s=rs<ri?vec2(rs/ri,1.):vec2(1.,ri/rs);return (uv-.5)*s/zoom+.5+(focus-.5)*(1.-s/zoom);}
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 uv=v;vec4 col;
 if(mode<.5){
  vec2 u=cover(uv,ir0);
  vec2 d=(u-subj.xy)/subj.zw;float depth=1.-smoothstep(.0,1.,length(d));
  float l=dot(texture2D(t0,u).rgb,vec3(.299,.587,.114));
  depth=clamp(depth*.85+l*.15,0.,1.);
  vec2 off=(mouse-.5)*strength*(depth-.35);
  u-=off;
  u.y+=sin(u.x*6.+time*.6)*.0009*(1.-depth);
  col=texture2D(t0,u);
 } else if(mode<1.5){
  vec2 u=cover(uv,ir0);
  vec2 m=mouse;float dist=distance(uv*vec2(res.x/res.y,1.),m*vec2(res.x/res.y,1.));
  float w=sin(dist*28.-time*3.)*.012*hover*smoothstep(.45,0.,dist);
  u+=normalize(uv-m+1e-4)*w;
  u.y+=sin(u.x*10.+time)*vel*.004;
  float sh=vel*.006+hover*.003;
  col=vec4(texture2D(t0,u+vec2(sh,0.)).r,texture2D(t0,u).g,texture2D(t0,u-vec2(sh,0.)).b,1.);
  col.rgb*=1.+hover*.06;
 } else {
  float nz=n(uv*4.+time*.05)*.65+n(uv*14.)*.35;
  float p=smoothstep(0.,1.,(prog*1.4-.2)+(nz-.5)*.4+(uv.x-.5)*.25);
  vec2 ua=cover(uv,ir0),ub=cover(uv,ir1);
  ua+= (nz-.5)*.08*p; ub-=(nz-.5)*.08*(1.-p);
  ua=(ua-.5)*(1.-p*.06)+.5; ub=(ub-.5)*(1.+(1.-p)*.06)+.5;
  vec2 m=(mouse-.5)*strength;ua-=m;ub-=m;
  col=mix(texture2D(t0,ua),texture2D(t1,ub),p);
 }
 gl_FragColor=vec4(col.rgb,1.);
}`;
  WK.gl = function (host, opt) {
    const canvas = document.createElement("canvas");
    canvas.className = "glfx";
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ["t0", "t1", "res", "ir0", "ir1", "mouse", "hover", "time", "vel", "prog", "mode", "subj", "zoom", "strength", "focus"].forEach((k) => U[k] = gl.getUniformLocation(pr, k));
    const modes = { depth: 0, hover: 1, slider: 2 };
    const st = { mouse: [0.5, 0.5], tm: [0.5, 0.5], hover: 0, th: 0, vel: 0, prog: 0, zoom: opt.zoom || 1, strength: opt.strength ?? 0.03 };
    const tex = [], sizes = [];
    const srcs = opt.srcs || [opt.src];
    let loaded = 0, visible = true, alive = true;
    const mk = (i, img) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      tex[i] = t; sizes[i] = [img.naturalWidth, img.naturalHeight];
    };
    const api = { canvas, st, a: 0, b: 1, ready: false, paused: false };
    srcs.forEach((s, i) => { const im = new Image(); im.onload = () => { mk(i, im); loaded++; if (loaded === srcs.length) { api.ready = true; host.appendChild(canvas); host.classList.add("gl-on"); resize(); } }; im.onerror = () => { }; im.src = s; });
    function resize() {
      const r = host.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, r.width * dpr); canvas.height = Math.max(1, r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    addEventListener("resize", () => api.ready && resize());
    if (opt.mouseTarget !== false && !WK.touch) {
      const tgt = opt.mouseTarget || (opt.mode === "hover" ? host : window);
      tgt.addEventListener("pointermove", (e) => {
        const r = host.getBoundingClientRect();
        if (opt.mode === "hover") st.tm = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
        else st.tm = [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
      }, { passive: true });
      if (opt.mode === "hover") { host.addEventListener("pointerenter", () => st.th = 1); host.addEventListener("pointerleave", () => st.th = 0); }
    }
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(host);
    const t0 = performance.now();
    let lastY = scrollY;
    function frame() {
      if (!alive) return;
      requestAnimationFrame(frame);
      if (!api.ready || !visible || api.paused) return;
      const dy = scrollY - lastY; lastY = scrollY;
      st.vel += (Math.max(-40, Math.min(40, dy)) / 40 - st.vel) * 0.1;
      st.mouse[0] += (st.tm[0] - st.mouse[0]) * 0.06; st.mouse[1] += (st.tm[1] - st.mouse[1]) * 0.06;
      st.hover += (st.th - st.hover) * 0.08;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[api.a] || tex[0]); gl.uniform1i(U.t0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[api.b] || tex[0]); gl.uniform1i(U.t1, 1);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      const s0 = sizes[api.a] || sizes[0], s1 = sizes[api.b] || sizes[0];
      gl.uniform2f(U.ir0, s0[0], s0[1]); gl.uniform2f(U.ir1, s1[0], s1[1]);
      gl.uniform2f(U.mouse, st.mouse[0], st.mouse[1]);
      gl.uniform1f(U.hover, st.hover); gl.uniform1f(U.time, (performance.now() - t0) / 1000);
      gl.uniform1f(U.vel, WK.reduced ? 0 : st.vel); gl.uniform1f(U.prog, st.prog);
      gl.uniform1f(U.mode, modes[opt.mode] || 0);
      const sj = opt.subject || [0.5, 0.5, 0.35, 0.5];
      gl.uniform4f(U.subj, sj[0], sj[1], sj[2], sj[3]);
      const fc = typeof opt.focus === "function" ? opt.focus() : (opt.focus || [0.5, 0.5]); gl.uniform2f(U.focus, fc[0], 1 - fc[1]);
      gl.uniform1f(U.zoom, st.zoom); gl.uniform1f(U.strength, WK.reduced ? 0 : st.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    frame();
    api.to = function (i) {
      if (!api.ready || i === api.b && st.prog > 0.5) return;
      if (WK.reduced || !hasGsap()) { api.a = i; api.b = i; st.prog = 0; return; }
      gsap.killTweensOf(st, "prog");
      api.a = st.prog > 0.5 ? api.b : api.a; api.b = i; st.prog = 0;
      gsap.to(st, { prog: 1, duration: 1.3, ease: "power2.inOut", onComplete: () => { api.a = i; st.prog = 0; } });
    };
    api.destroy = () => { alive = false; };
    return api;
  };

  /* ---------- Révélations au défilement ---------- */
  WK.reveals = function (root) {
    if (!hasGsap() || !window.ScrollTrigger) { document.querySelectorAll("[data-reveal]").forEach((e) => e.style.opacity = 1); return; }
    (root || document).querySelectorAll("[data-reveal]").forEach((el) => {
      const type = el.dataset.reveal;
      if (WK.reduced) { gsap.set(el, { opacity: 1 }); return; }
      if (type === "lines") {
        const ls = WK.splitLines(el); gsap.set(el, { opacity: 1 });
        gsap.from(ls, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 86%" } });
      } else if (type === "chars") {
        const cs = WK.splitChars(el); gsap.set(el, { opacity: 1 });
        gsap.from(cs, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.018, scrollTrigger: { trigger: el, start: "top 88%" } });
      } else if (type === "clip") {
        gsap.fromTo(el, { clipPath: "inset(18% 18% 18% 18%)", opacity: 1 }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        const im = el.querySelector("img"); if (im) gsap.fromTo(im, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      } else {
        gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", delay: parseFloat(el.dataset.delay || 0), scrollTrigger: { trigger: el, start: "top 90%" } });
      }
    });
  };

  /* ---------- Compteurs ---------- */
  WK.counters = function () {
    if (!hasGsap()) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
      if (WK.reduced) { el.textContent = to.toFixed(dec); return; }
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%" }, onUpdate: () => el.textContent = o.v.toFixed(dec).replace(".", ",") });
    });
  };

  window.WK = WK;
})();
