/* Noyau commun du lot 6 (Vaurel, Maison Ilvane, Aerol).
   Rien ici ne construit d'objet 3D : on anime des photos et des sequences
   d'images issues de videos. WebGL ne sert qu'a deformer des photos posees
   sur un rectangle plein ecran. */
(function () {
  "use strict";
  const W = (window.WX = {});
  const root = document.documentElement;
  W.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  W.touch = matchMedia("(hover: none)").matches;
  W.mobile = () => innerWidth < 760;
  W.hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (W.hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("anim");
  }
  if (W.reduce) root.classList.add("reduce");
  if (W.touch) root.classList.add("touch");

  /* ---------- Decoupe du texte (mots, lettres) ---------- */
  W.split = (el, chars = true) => {
    if (!el) return [];
    if (!el.dataset.split) {
      el.dataset.split = "1";
      el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
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
                [...part].forEach((ch) => {
                  const c = document.createElement("span");
                  c.className = "c";
                  c.textContent = ch;
                  w.appendChild(c);
                });
              } else {
                const i = document.createElement("span");
                i.className = "wi";
                i.textContent = part;
                w.appendChild(i);
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

  /* ---------- Defilement fluide ---------- */
  W.smooth = () => {
    if (W.reduce || !window.Lenis || !W.hasGsap) return null;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    W.lenis = lenis;
    return lenis;
  };
  W.scrollTo = (target) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    const nav = document.querySelector(".nav");
    if (W.lenis) W.lenis.scrollTo(el, { duration: 1.6, offset: nav ? -nav.offsetHeight : 0 });
    else el.scrollIntoView({ behavior: W.reduce ? "auto" : "smooth" });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    W.scrollTo(el);
  });

  /* Pendant le defilement, html.is-scrolling coupe les flous d'arriere-plan (CSS) ; ils reviennent a l'arret. */
  (() => {
    let t = 0, on = false;
    const root = document.documentElement;
    addEventListener("scroll", () => {
      if (!on) { on = true; root.classList.add("is-scrolling"); }
      clearTimeout(t); t = setTimeout(() => { on = false; root.classList.remove("is-scrolling"); }, 180);
    }, { passive: true });
  })();

  /* ---------- Curseur et boutons magnetiques ---------- */
  W.cursor = () => {
    if (W.touch || W.reduce) return;
    const c = document.createElement("div");
    c.className = "cursor";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><b class="cursor__label"></b></span>';
    document.body.appendChild(c);
    const dot = c.firstChild, ring = c.lastChild, label = ring.firstChild;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    let running = false;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; c.classList.add("is-on"); if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("is-on"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, input, select, label");
      c.classList.toggle("is-hover", !!t);
      const txt = t && t.dataset ? t.dataset.cursor || "" : "";
      label.textContent = txt;
      c.classList.toggle("has-label", !!txt);
    });
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      // la boucle s'arrete quand l'anneau a rejoint le pointeur
      if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) requestAnimationFrame(loop); else running = false;
    };
  };
  W.magnetic = (sel = "[data-magnetic]") => {
    if (W.touch || W.reduce || !W.hasGsap) return;
    document.querySelectorAll(sel).forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.45)" }));
    });
  };

  /* ---------- Navigation qui se transforme ---------- */
  W.nav = (el) => {
    if (!el) return;
    let last = 0;
    const on = () => {
      const y = scrollY;
      el.classList.toggle("is-scrolled", y > 40);
      el.classList.toggle("is-hidden", y > 400 && y > last + 4 && !document.body.classList.contains("menu-open"));
      if (y < last - 4) el.classList.remove("is-hidden");
      last = y;
    };
    addEventListener("scroll", on, { passive: true });
    on();
  };

  /* ---------- Prechargement ---------- */
  W.preload = (urls, onProgress, maxMs = 7000) =>
    new Promise((resolve) => {
      let done = 0;
      const total = urls.length || 1;
      const tick = () => { done++; onProgress && onProgress(done / total); if (done >= total) resolve(); };
      if (!urls.length) { onProgress && onProgress(1); resolve(); return; }
      urls.forEach((u) => { const im = new Image(); im.onload = im.onerror = tick; im.src = u; });
      setTimeout(resolve, maxMs);
    });

  /* ---------- Apparitions, compteurs, lignes ---------- */
  W.reveals = () => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!W.hasGsap || W.reduce) { els.forEach((e) => e.classList.add("is-in")); return; }
    els.forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-in") });
    });
    document.querySelectorAll("[data-split-reveal]").forEach((el) => {
      const parts = W.split(el, false);
      gsap.from(parts, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.04, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    document.querySelectorAll("[data-scrub-words]").forEach((el) => {
      const parts = W.split(el, false);
      gsap.fromTo(parts, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
    document.querySelectorAll("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = o.v.toFixed(dec).replace(".", el.dataset.sep || ".")) }),
      });
    });
    document.querySelectorAll("[data-draw]").forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", scrollTrigger: { trigger: p.closest("svg") || p, start: "top 85%", once: true } });
    });
  };

  /* =================================================================
     Stage : photos sur un rectangle WebGL.
     - profondeur a la souris (carte de profondeur ou profondeur radiale)
     - transition par bruit entre deux photos (dissolution et deformation)
     ================================================================= */
  const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;
varying vec2 v;
uniform sampler2D t0,t1,d0,d1;
uniform vec2 res,s0,s1,mouse,focus,pan;
uniform float prog,time,zoom,depthAmt,h0,h1,fitK,disp,vig,grain;
uniform vec3 bg;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
vec2 fitUV(vec2 uv,vec2 img){
  float ra=res.x/res.y, ri=img.x/img.y;
  vec2 cover = ra>ri ? vec2(1.,ri/ra) : vec2(ra/ri,1.);
  vec2 contain = ra>ri ? vec2(ra/ri,1.) : vec2(1.,ri/ra);
  vec2 sc = mix(contain,cover,fitK);
  return (uv-.5)*sc+.5;
}
vec3 pick(sampler2D t,sampler2D d,float hd,vec2 uv,vec2 size,float z,vec2 off){
  vec2 u=fitUV(uv,size)+pan;
  u=(u-focus)/(zoom*z)+focus;
  float dep = hd>.5 ? texture2D(d,u).r : clamp(1.-length((u-.5)*vec2(1.,1.3))*1.6,0.,1.);
  u += mouse*(dep-.35)*depthAmt + off;
  if(u.x<0.||u.x>1.||u.y<0.||u.y>1.) return bg;
  return texture2D(t,u).rgb;
}
void main(){
  vec2 uv=v;
  float n=noise(uv*3.5+vec2(time*.04,0.))*.65+noise(uv*11.)*.35;
  float m=smoothstep(n-.18,n+.18,prog*1.36-.18);
  vec2 dir=vec2(n-.5,(n-.5)*.6);
  vec3 c0=pick(t0,d0,h0,uv,s0,1.,dir*prog*disp);
  vec3 c=c0;
  if(prog>0.001){
    vec3 c1=pick(t1,d1,h1,uv,s1,1.+(1.-prog)*.06,-dir*(1.-prog)*disp);
    c=mix(c0,c1,m);
  }
  float d=length((uv-.5)*vec2(res.x/res.y,1.));
  c*=1.-vig*smoothstep(.45,1.25,d);
  c+=(hash(uv*res+time)-.5)*grain;
  gl_FragColor=vec4(c,1.);
}`;

  function compile(gl, vs, fs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  W.compile = compile;

  function texFrom(gl, img) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  W.texFrom = texFrom;
  const loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = url; });
  W.loadImg = loadImg;

  /* Echelle de densite adaptative, partagee par les canvas WebGL pendant le defilement (0,3 a 1, depart a 0,5).
     Elle baisse par paliers quand deux images de suite depassent 18,5 ms, remonte apres 90 images rapides,
     au plus une fois toutes les 250 ms. Sur une machine rapide elle monte a 1 : aucun changement visible. */
  const DRS = W.DRS || (W.DRS = (() => {
    const o = { k: 0.5 };
    let last = 0, slow = 0, fast = 0, changed = 0, sy = -1, movedAt = -1e9;
    const tick = (t) => {
      requestAnimationFrame(tick);
      const y = scrollY; // lecture sans mise en page
      if (y !== sy) { sy = y; movedAt = t; }
      if (t - movedAt < 180 && last) {
        const dt = t - last;
        if (dt > 18.5) { slow++; fast = 0; } else if (dt < 17.5) { fast++; slow = 0; }
        if (t - changed > 250) {
          if (slow >= 2 && o.k > 0.3) { o.k = Math.max(0.3, Math.round(o.k * 0.85 * 20) / 20); changed = t; slow = 0; }
          else if (fast >= 90 && o.k < 1) { o.k = Math.min(1, Math.round(o.k * 1.1 * 20) / 20); changed = t; fast = 0; }
        }
      } else { slow = 0; }
      last = t;
    };
    requestAnimationFrame(tick);
    return o;
  })());

  class Stage {
    constructor(canvas, o = {}) {
      this.c = canvas;
      this.o = Object.assign({ fitK: 1, depthAmt: 0.02, disp: 0.12, vig: 0.35, grain: 0.025, bg: [0, 0, 0], zoom: 1, mobileFitK: null }, o);
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
      if (!gl) throw new Error("webgl indisponible");
      this.gl = gl;
      this.pr = compile(gl, VS, o.fs || FS);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(this.pr, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.useProgram(this.pr);
      this.u = {};
      ["t0", "t1", "d0", "d1", "res", "s0", "s1", "mouse", "focus", "pan", "prog", "time", "zoom", "depthAmt", "h0", "h1", "fitK", "disp", "vig", "grain", "bg"].concat(o.uniforms || []).forEach((n) => (this.u[n] = gl.getUniformLocation(this.pr, n)));
      this.items = [];
      this.a = 0; this.b = 0; this.prog = 0; this.zoom = this.o.zoom; this.focus = [0.5, 0.5]; this.pan = [0, 0];
      this.m = [0, 0]; this.mt = [0, 0];
      this.blank = texFrom(gl, (() => { const k = document.createElement("canvas"); k.width = k.height = 2; return k; })());
      this.visible = true;
      this.extra = null;
      this.resize();
      addEventListener("resize", () => this.resize());
      if ("IntersectionObserver" in window) new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }).observe(canvas);
      if (!W.touch && !W.reduce && o.mouse !== false) {
        addEventListener("pointermove", (e) => { this.mt = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
      }
      this.t0 = performance.now();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }
    add(url, depth) {
      const it = { tex: null, dt: null, w: 1, h: 1, ready: false };
      const i = this.items.push(it) - 1;
      it.p = loadImg(url).then((img) => {
        it.tex = texFrom(this.gl, img); it.w = img.naturalWidth; it.h = img.naturalHeight; it.ready = true;
        if (i === this.a) this.c.classList.add("is-ready");
      }).catch(() => {});
      if (depth) loadImg(depth).then((img) => (it.dt = texFrom(this.gl, img))).catch(() => {});
      return i;
    }
    // Resolution dynamique adaptative : pendant le defilement, la densite suit W.DRS.k (voir plus haut), qui ne
    // baisse que si les images depassent 16,7 ms ; pleine densite 180 ms apres l'arret. Au repos l'image est
    // identique ; sur une machine rapide la densite reste pleine meme en mouvement.
    resize() {
      const full = Math.min(devicePixelRatio || 1, 1.5);
      this.k = DRS.k;
      const dpr = this.low ? full * DRS.k : full;
      const w = Math.max(2, Math.round(this.c.clientWidth * dpr)), h = Math.max(2, Math.round(this.c.clientHeight * dpr));
      if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
      this.gl.viewport(0, 0, w, h);
      this.dirty = true;
    }
    set(i) { this.a = i; this.b = i; this.prog = 0; if (this.items[i] && this.items[i].ready) this.c.classList.add("is-ready"); }
    mix(a, b, p) { this.a = a; this.b = b; this.prog = Math.max(0, Math.min(1, p)); }
    go(i, dur = 1.4) {
      if (i === this.a && this.prog === 0) return;
      if (this.tw) { this.tw.kill(); if (this.prog > 0.5) this.a = this.b; }
      this.b = i;
      const o = { p: 0 };
      if (!window.gsap || W.reduce) { this.set(i); return; }
      this.tw = gsap.to(o, { p: 1, duration: dur, ease: "power2.inOut", onUpdate: () => (this.prog = o.p), onComplete: () => { this.a = i; this.prog = 0; this.tw = null; } });
    }
    bind(unit, it, name, dname, hname, sname) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, it && it.ready ? it.tex : this.blank);
      gl.uniform1i(this.u[name], unit);
      gl.activeTexture(gl.TEXTURE0 + unit + 2);
      gl.bindTexture(gl.TEXTURE_2D, it && it.dt ? it.dt : this.blank);
      gl.uniform1i(this.u[dname], unit + 2);
      gl.uniform1f(this.u[hname], it && it.dt ? 1 : 0);
      gl.uniform2f(this.u[sname], it ? it.w : 1, it ? it.h : 1);
    }
    loop(now) {
      requestAnimationFrame(this.loop);
      if (!this.visible) return;
      const A = this.items[this.a];
      if (!A || !A.ready) return;
      const sy = scrollY; // lecture sans mise en page
      if (sy !== this.sy) { this.sy = sy; this.movedAt = now; if (!this.low && this.sy0 !== undefined) { this.low = true; this.resize(); } this.sy0 = sy; }
      else if (this.low && now - this.movedAt > (W.touch ? 400 : 180)) { this.low = false; this.resize(); }
      if (this.low && this.k !== DRS.k) this.resize();
      this.m[0] += (this.mt[0] - this.m[0]) * 0.06;
      this.m[1] += (this.mt[1] - this.m[1]) * 0.06;
      const gl = this.gl, u = this.u, o = this.o;
      gl.useProgram(this.pr);
      this.bind(0, A, "t0", "d0", "h0", "s0");
      this.bind(1, this.items[this.b], "t1", "d1", "h1", "s1");
      gl.uniform2f(u.res, this.c.width, this.c.height);
      gl.uniform2f(u.mouse, this.m[0], this.m[1]);
      gl.uniform1f(u.prog, this.prog);
      gl.uniform1f(u.time, (now - this.t0) / 1000);
      gl.uniform1f(u.zoom, this.zoom);
      gl.uniform2f(u.focus, this.focus[0], this.focus[1]);
      gl.uniform2f(u.pan, this.pan[0], this.pan[1]);
      gl.uniform1f(u.depthAmt, o.depthAmt);
      gl.uniform1f(u.fitK, W.mobile() && o.mobileFitK != null ? o.mobileFitK : o.fitK);
      gl.uniform1f(u.disp, o.disp);
      gl.uniform1f(u.vig, o.vig);
      gl.uniform1f(u.grain, W.reduce ? 0 : o.grain);
      gl.uniform3f(u.bg, o.bg[0], o.bg[1], o.bg[2]);
      if (this.extra) this.extra(gl, u);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  W.Stage = Stage;
  W.stage = (canvas, o) => {
    try { return new Stage(canvas, o); } catch (e) { console.warn("[stage]", e.message); canvas && canvas.remove(); return null; }
  };

  /* =================================================================
     Seq : sequence d'images pilotee par le defilement, sur un canvas.
     Version du 18/11/2026, enchainement fluide :
     - Les fichiers compresses (webp) de chaque sequence sont telecharges tot,
       d'abord autour de la position, puis tout le reste en fond, et gardes
       en memoire (quelques Mo).
     - Seule une vingtaine d'images decodees est gardee autour de la position
       (memoire limitee sur iPhone) ; decoder un fichier deja en memoire prend
       quelques millisecondes, hors du fil principal.
     - Resolution fixe : l'image ne devient plus floue pendant le defilement.
     - Fondu entre les deux images voisines selon la position exacte :
       le mouvement suit le geste, sans palier.
     ================================================================= */
  const NET = { busy: 0, max: 6, all: false };
  const SEQS = [];
  const netPump = () => {
    while (NET.busy < NET.max) {
      let best = null, bp = Infinity;
      for (const s of SEQS) { const r = s.next(); if (r && r[1] < bp) { best = [s, r[0]]; bp = r[1]; } }
      if (!best) return;
      const s = best[0], k = best[1];
      s.bs[k] = 1; NET.busy++;
      fetch(s.file(k)).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => { s.blob[k] = b; s.bs[k] = 2; s.got(k); }, () => { s.bs[k] = ++s.tries[k] >= 2 ? 3 : 0; })
        .finally(() => { NET.busy--; netPump(); });
    }
  };
  // Une fois la page chargee, toutes les sequences se telechargent en fond, dans l'ordre de la page
  const netAll = () => setTimeout(() => { NET.all = true; netPump(); }, 400);
  if (document.readyState === "complete") netAll(); else addEventListener("load", netAll, { once: true });
  const bmp = (b) => window.createImageBitmap
    ? createImageBitmap(b)
    : new Promise((res, rej) => { const u = URL.createObjectURL(b), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = rej; im.src = u; });
  const bmpFree = (b) => { if (b && b.close) b.close(); };
  const fw = (im) => im.naturalWidth || im.width, fh = (im) => im.naturalHeight || im.height;

  class Seq {
    constructor(canvas, o) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.o = Object.assign({ pad: 3, ext: "webp", ahead: 12, behind: 5, bg: "#000", fit: 1, mobileFit: 1.55, poster: null }, o);
      const mob = W.mobile() && this.o.mobileDir;
      this.dir = mob ? this.o.mobileDir : this.o.dir;
      this.n = mob ? this.o.mobileCount : this.o.count;
      const z = () => new Array(this.n).fill(0);
      this.imgs = new Array(this.n).fill(null); this.st = z(); // images decodees : 0 absente, 1 en cours, 2 prete, 3 echouee
      this.blob = new Array(this.n).fill(null); this.bs = z(); this.tries = z(); // fichiers : 0 absent, 1 en cours, 2 recu, 3 echoue
      this.i = 0; this.f = 0; this.d = 1; this.p = 0; this.lastF = -1;
      // Images cles (une sur KS), decodees en petite taille et gardees tant que la sequence est proche :
      // en defilement tres rapide, on peint la plus proche en attendant la bonne image en pleine taille
      this.KS = W.mobile() ? 6 : 8; this.kimg = new Array(this.n).fill(null); this.kst = z();
      this.order = SEQS.length; this.near = true;
      if (this.o.poster) { this.poster = new Image(); this.poster.onload = () => this.paint(true); this.poster.src = this.o.poster; }
      this.resize();
      addEventListener("resize", () => { this.resize(); this.paint(true); });
      // Sequence loin de l'ecran : on libere ses images decodees (les fichiers restent en memoire)
      if ("IntersectionObserver" in window && canvas.isConnected) {
        new IntersectionObserver((e) => {
          this.near = e[e.length - 1].isIntersecting;
          if (this.near) { this.want(this.i, this.d); this.paint(true); } else this.drop();
          netPump();
        }, { rootMargin: "150% 0px" }).observe(canvas);
      }
      SEQS.push(this);
      this.want(0, 1);
      netPump();
    }
    file(k) { return `${this.dir}f_${String(k).padStart(this.o.pad, "0")}.${this.o.ext}`; }
    // Prochain fichier a telecharger : le plus proche de la position, en avance dans le sens du geste
    next() {
      if (!this.near && !NET.all) return null;
      const base = this.near ? 0 : 1e5 + this.order * 1e3;
      let bk = -1, bp = Infinity;
      for (let k = 0; k < this.n; k++) {
        if (this.bs[k] !== 0) continue;
        // Une image sur six passe d'abord (du grossier au fin) : en defilement rapide, l'image peinte reste a 3 images au plus de la bonne
        const dk = (k - this.i) * this.d, pr = base + (dk >= 0 ? dk : -2 * dk) * (k % 6 ? 1 : 0.2);
        if (pr < bp) { bp = pr; bk = k; }
      }
      return bk < 0 ? null : [bk, bp];
    }
    win(i, d) { const a = this.o.ahead, b = this.o.behind; return d > 0 ? [i - b, i + a] : [i - a, i + b]; }
    got(k) {
      if (k === 0) this.decodeKey(0); // premiere image toujours prete : la section s'ouvre sur une image
      if (!this.near) return;
      if (k % this.KS === 0 || k === this.n - 1) this.decodeKey(k);
      const w = this.win(this.i, this.d); if (k >= w[0] && k <= w[1]) this.decode(k);
    }
    decodeKey(k) {
      if (this.kst[k] || !this.blob[k]) return;
      this.kst[k] = 1;
      const b = this.blob[k], o = { resizeWidth: 640, resizeQuality: "medium" };
      (window.createImageBitmap ? createImageBitmap(b, o).catch(() => createImageBitmap(b)) : bmp(b)).then((bm) => {
        if (this.kst[k] !== 1) { bmpFree(bm); return; }
        this.kimg[k] = bm; this.kst[k] = 2;
      }, () => { if (this.kst[k] === 1) this.kst[k] = 3; });
    }
    decode(k) {
      if (k < 0 || k >= this.n || this.st[k] || !this.blob[k]) return;
      const tok = {};
      this.imgs[k] = tok; this.st[k] = 1;
      bmp(this.blob[k]).then((bm) => {
        if (this.imgs[k] !== tok) { bmpFree(bm); return; }
        this.imgs[k] = bm; this.st[k] = 2;
        if (Math.abs(k - this.f) < 2.5) this.paint(true);
      }, () => { if (this.imgs[k] === tok) { this.imgs[k] = null; this.st[k] = 3; } });
    }
    free(k) { if (this.st[k] === 2) bmpFree(this.imgs[k]); this.imgs[k] = null; this.st[k] = 0; }
    drop() {
      for (let k = 0; k < this.n; k++) {
        if (this.st[k] === 1 || this.st[k] === 2) this.free(k);
        if (k === 0) continue;
        if (this.kst[k] === 2) bmpFree(this.kimg[k]);
        if (this.kst[k] === 1 || this.kst[k] === 2) { this.kimg[k] = null; this.kst[k] = 0; }
      }
    }
    want(i, d) {
      const w = this.win(i, d), lo = w[0], hi = w[1];
      for (let k = 0; k < this.n; k++) if ((k < lo - 3 || k > hi + 3) && (this.st[k] === 1 || this.st[k] === 2)) this.free(k);
      if (!this.near) return;
      for (let k = 0; k < this.n; k += this.KS) this.decodeKey(k);
      this.decodeKey(this.n - 1);
      this.decode(i);
      for (let s = 1; s <= Math.max(this.o.ahead, this.o.behind); s++) {
        const a = i + s * d, b = i - s * d;
        if (a >= lo && a <= hi) this.decode(a);
        if (b >= lo && b <= hi) this.decode(b);
      }
    }
    // Image a peindre si la bonne n'est pas encore prete : pleine taille a 2 images pres, sinon image cle la plus proche
    close(f) {
      const i = Math.round(f);
      for (let d = 1; d <= 2; d++) { if (this.st[i - d] === 2) return this.imgs[i - d]; if (this.st[i + d] === 2) return this.imgs[i + d]; }
      let bk = -1, bd = Infinity;
      for (let k = 0; k < this.n; k++) if (this.kst[k] === 2 && Math.abs(k - f) < bd) { bd = Math.abs(k - f); bk = k; }
      return bk >= 0 ? this.kimg[bk] : this.nearest(i);
    }
    nearest(i) {
      const ok = (k) => k >= 0 && k < this.n && this.st[k] === 2;
      if (ok(i)) return this.imgs[i];
      for (let d = 1; d < this.n; d++) { if (ok(i - d)) return this.imgs[i - d]; if (ok(i + d)) return this.imgs[i + d]; }
      return null;
    }
    // Resolution fixe, la meme pendant le defilement et au repos
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, W.touch ? 2 : 1.5);
      this.c.width = Math.round(this.c.clientWidth * dpr);
      this.c.height = Math.round(this.c.clientHeight * dpr);
    }
    motion() {}
    set(p) {
      this.p = Math.max(0, Math.min(1, p));
      const f = this.p * (this.n - 1), i = Math.round(f);
      this.f = f;
      if (i !== this.i || !this.ready) {
        if (i !== this.i) this.d = i > this.i ? 1 : -1;
        this.i = i; this.ready = true;
        this.want(i, this.d);
        netPump();
      }
      this.paint();
    }
    paint(force) {
      if (!force && this.f === this.lastF && !this.o.render) return;
      // Les deux images qui encadrent la position exacte, fondues l'une dans l'autre
      const a = Math.floor(this.f), b = Math.min(this.n - 1, a + 1), t = this.f - a;
      const A = this.st[a] === 2 ? this.imgs[a] : null, B = this.st[b] === 2 ? this.imgs[b] : null;
      let im = A || (t > 0.5 ? B : null) || this.close(this.f);
      const nx = A && B && b !== a && t > 0.01 ? B : null;
      // Rendu personnalise (cadrage anime, fondus) : il recoit l'image courante, la suivante et la part de fondu
      if (this.o.render) { this.lastF = this.f; this.o.render(this.ctx, im, this.c.width, this.c.height, this.p, im === A ? nx : null, t); return; }
      if (!im && this.poster && this.poster.naturalWidth) im = this.poster;
      if (!im) return;
      this.lastF = this.f;
      const cw = this.c.width, ch = this.c.height, ctx = this.ctx;
      const iw = fw(im), ih = fh(im);
      const contain = Math.min(cw / iw, ch / ih), cover = Math.max(cw / iw, ch / ih);
      const k = W.mobile() ? this.o.mobileFit : this.o.fit;
      const s = Math.min(cover, contain * (k <= 1 ? 1 : k)) * (k < 1 ? k : 1) || cover;
      const sc = this.o.fit === 1 && !W.mobile() ? cover : s;
      const w = iw * sc, h = ih * sc;
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.o.bg;
      ctx.fillRect(0, 0, cw, ch);
      // Point de l'image a garder au centre (produit souvent decentre)
      const fx = W.mobile() ? (this.o.mobileFocusX ?? 0.5) : (this.o.focusX ?? 0.5);
      let x = cw / 2 - w * fx;
      if (w > cw) x = Math.min(0, Math.max(cw - w, x)); else x = (cw - w) / 2;
      const y = (ch - h) / 2 + (this.o.offsetY || 0) * ch;
      ctx.drawImage(im, x, y, w, h);
      if (nx && im === A) { ctx.globalAlpha = t; ctx.drawImage(nx, x, y, w, h); ctx.globalAlpha = 1; }
    }
  }
  W.Seq = Seq;
})();
