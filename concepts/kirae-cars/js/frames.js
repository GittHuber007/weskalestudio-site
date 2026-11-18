/* Moteur d'images des séquences pilotées par le défilement (Weskale Studio, 18/11/2026).
   - Les fichiers compressés (webp) de chaque séquence sont téléchargés tôt, du grossier au fin
     (une image sur six d'abord), autour de la position puis tout le reste en fond, et gardés en mémoire.
   - Seule une vingtaine d'images décodées est gardée autour de la position (mémoire limitée sur iPhone).
   - Des images clés, décodées en petite taille, servent en défilement très rapide en attendant la bonne.
   - pick() rend l'image exacte et la suivante avec la part de fondu : le site les fond l'une dans l'autre,
     le mouvement suit le geste sans palier. */
(function () {
  "use strict";
  const NET = { busy: 0, max: 6, all: false };
  const STORES = [];
  const pump = () => {
    while (NET.busy < NET.max) {
      let best = null, bp = Infinity;
      for (const s of STORES) { const r = s.next(); if (r && r[1] < bp) { best = [s, r[0]]; bp = r[1]; } }
      if (!best) return;
      const s = best[0], k = best[1];
      s.bs[k] = 1; NET.busy++;
      fetch(s.url(k)).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => { s.blob[k] = b; s.bs[k] = 2; s.got(k); }, () => { s.bs[k] = ++s.tries[k] >= 2 ? 3 : 0; if (s.bs[k] === 3) s.failed(k); })
        .finally(() => { NET.busy--; pump(); });
    }
  };
  const goAll = () => setTimeout(() => { NET.all = true; pump(); }, 400);
  if (document.readyState === "complete") goAll(); else addEventListener("load", goAll, { once: true });
  const bmp = (b, o) => window.createImageBitmap
    ? (o ? createImageBitmap(b, o).catch(() => createImageBitmap(b)) : createImageBitmap(b))
    : new Promise((res, rej) => { const u = URL.createObjectURL(b), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = rej; im.src = u; });
  const free = (b) => { if (b && b.close) b.close(); };
  const small = () => innerWidth < 760;

  class FrameStore {
    /* o : { n, url(k), el (élément observé pour savoir si la séquence est proche de l'écran),
            onFrame(k) (une image utile vient d'être décodée), onMissing() (première image introuvable) } */
    constructor(o) {
      this.o = o; this.n = o.n; this.url = o.url;
      const z = () => new Array(this.n).fill(0);
      this.imgs = new Array(this.n).fill(null); this.st = z();
      this.blob = new Array(this.n).fill(null); this.bs = z(); this.tries = z();
      this.KS = small() ? 6 : 8; this.kimg = new Array(this.n).fill(null); this.kst = z();
      this.ahead = o.ahead || 16; this.behind = o.behind || 6;
      this.i = 0; this.f = 0; this.d = 1; this.near = true; this.order = STORES.length;
      if (o.el && o.el.isConnected && "IntersectionObserver" in window) {
        new IntersectionObserver((e) => {
          this.near = e[e.length - 1].isIntersecting;
          if (this.near) { this.want(); this.o.onFrame && this.o.onFrame(this.i); } else this.drop();
          pump();
        }, { rootMargin: "150% 0px" }).observe(o.el);
      }
      STORES.push(this);
      this.want();
      pump();
    }
    next() {
      if (!this.near && !NET.all) return null;
      const base = this.near ? 0 : 1e5 + this.order * 1e3;
      let bk = -1, bp = Infinity;
      for (let k = 0; k < this.n; k++) {
        if (this.bs[k] !== 0) continue;
        const dk = (k - this.i) * this.d, pr = base + (dk >= 0 ? dk : -2 * dk) * (k % 6 ? 1 : 0.2);
        if (pr < bp) { bp = pr; bk = k; }
      }
      return bk < 0 ? null : [bk, bp];
    }
    failed(k) { if (k === 0 && this.o.onMissing) this.o.onMissing(); }
    win() { return this.d > 0 ? [this.i - this.behind, this.i + this.ahead] : [this.i - this.ahead, this.i + this.behind]; }
    got(k) {
      if (k === 0 && !this.size) bmp(this.blob[0]).then((b) => { this.size = [b.width || b.naturalWidth, b.height || b.naturalHeight]; free(b); this.o.onSize && this.o.onSize(this.size); }, () => {});
      if (k === 0) this.decodeKey(0); // premiere image toujours prete : la section s'ouvre sur une image
      if (!this.near) return;
      if (k % this.KS === 0 || k === this.n - 1) this.decodeKey(k);
      const w = this.win(); if (k >= w[0] && k <= w[1]) this.decode(k);
    }
    decode(k) {
      if (k < 0 || k >= this.n || this.st[k] || !this.blob[k]) return;
      const tok = {}; this.imgs[k] = tok; this.st[k] = 1;
      bmp(this.blob[k]).then((b) => {
        if (this.imgs[k] !== tok) { free(b); return; }
        this.imgs[k] = b; this.st[k] = 2;
        if (Math.abs(k - this.f) < 2.5 && this.o.onFrame) this.o.onFrame(k);
      }, () => { if (this.imgs[k] === tok) { this.imgs[k] = null; this.st[k] = 3; } });
    }
    decodeKey(k) {
      if (this.kst[k] || !this.blob[k]) return;
      this.kst[k] = 1;
      bmp(this.blob[k], { resizeWidth: 640, resizeQuality: "medium" }).then((b) => {
        if (this.kst[k] !== 1) { free(b); return; }
        this.kimg[k] = b; this.kst[k] = 2;
        if (this.st[Math.round(this.f)] !== 2 && this.o.onFrame) this.o.onFrame(k);
      }, () => { if (this.kst[k] === 1) this.kst[k] = 3; });
    }
    freeAt(k) { if (this.st[k] === 2) free(this.imgs[k]); this.imgs[k] = null; this.st[k] = 0; }
    drop() {
      for (let k = 0; k < this.n; k++) {
        if (this.st[k] === 1 || this.st[k] === 2) this.freeAt(k);
        if (k === 0) continue;
        if (this.kst[k] === 2) free(this.kimg[k]);
        if (this.kst[k] === 1 || this.kst[k] === 2) { this.kimg[k] = null; this.kst[k] = 0; }
      }
    }
    want() {
      const w = this.win(), lo = w[0], hi = w[1], i = this.i, d = this.d;
      for (let k = 0; k < this.n; k++) if ((k < lo - 3 || k > hi + 3) && (this.st[k] === 1 || this.st[k] === 2)) this.freeAt(k);
      if (!this.near) return;
      for (let k = 0; k < this.n; k += this.KS) this.decodeKey(k);
      this.decodeKey(this.n - 1);
      this.decode(i);
      for (let s = 1; s <= Math.max(this.ahead, this.behind); s++) {
        const a = i + s * d, b = i - s * d;
        if (a >= lo && a <= hi) this.decode(a);
        if (b >= lo && b <= hi) this.decode(b);
      }
    }
    /* f : position exacte dans la séquence, de 0 à n - 1 (fractionnaire) */
    set(f) {
      this.f = Math.max(0, Math.min(this.n - 1, f));
      const i = Math.round(this.f);
      if (i !== this.i || !this.started) {
        if (i !== this.i) this.d = i > this.i ? 1 : -1;
        this.i = i; this.started = true;
        this.want(); pump();
      }
    }
    /* Image à peindre : { im, nx, t } ; nx est l'image suivante à fondre par-dessus avec l'opacité t. */
    pick() {
      const a = Math.floor(this.f), b = Math.min(this.n - 1, a + 1), t = this.f - a;
      const A = this.st[a] === 2 ? this.imgs[a] : null, B = this.st[b] === 2 ? this.imgs[b] : null;
      if (A) return { im: A, nx: B && b !== a && t > 0.01 ? B : null, t };
      if (B && t > 0.5) return { im: B, nx: null, t: 0 };
      const i = Math.round(this.f);
      for (let d = 1; d <= 2; d++) { if (this.st[i - d] === 2) return { im: this.imgs[i - d], nx: null, t: 0 }; if (this.st[i + d] === 2) return { im: this.imgs[i + d], nx: null, t: 0 }; }
      let bk = -1, bd = Infinity;
      for (let k = 0; k < this.n; k++) if (this.kst[k] === 2 && Math.abs(k - this.f) < bd) { bd = Math.abs(k - this.f); bk = k; }
      if (bk >= 0) return { im: this.kimg[bk], nx: null, t: 0 };
      for (let d = 0; d < this.n; d++) { if (this.st[i - d] === 2) return { im: this.imgs[i - d], nx: null, t: 0 }; if (this.st[i + d] === 2) return { im: this.imgs[i + d], nx: null, t: 0 }; }
      return { im: null, nx: null, t: 0 };
    }
  }
  window.WSFrames = { FrameStore, pump };
})();
