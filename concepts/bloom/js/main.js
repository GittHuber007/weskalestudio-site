// Page Bracelet Bloom, serti : la piece en 3D temps reel, a faire tourner dans tous les sens.
import { startViewer } from './viewer.js';

/* ------------------------------------------------------------------ textes */
const I18N = {
  en: {
    hint: 'Turn the piece', front: 'Front', side: 'Profile', top: 'Top',
    credit: 'Concept Weskale Studio', loading: 'Loading', failed: 'Could not load',
    nogl: '3D display is not available on this device.',
    canvas: 'Bracelet Bloom, serti in 3D. Drag to turn the piece in any direction, arrow keys also work.',
  },
  fr: {
    hint: 'Faites tourner la pièce', front: 'Face', side: 'Profil', top: 'Dessus',
    credit: 'Concept Weskale Studio', loading: 'Chargement', failed: 'Chargement impossible',
    nogl: "L'affichage 3D n'est pas disponible sur cet appareil.",
    canvas: 'Bracelet Bloom, serti en 3D. Glissez pour tourner la pièce dans tous les sens, les flèches du clavier fonctionnent aussi.',
  },
};
let lang = 'en';
// Anglais par defaut ; francais via le selecteur ou le lien ?lang=fr (choix memorise).
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && I18N[q]) return q;
  try { const s = localStorage.getItem('bloom-lang'); if (s && I18N[s]) return s; } catch (e) { /* stockage indisponible */ }
  return 'en';
}
let loadFailed = false;
function applyLang(l) {
  lang = l;
  const t = I18N[l];
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t[el.dataset.i18n]; });
  if (loadFailed) document.querySelector('#loader .loader__label').textContent = t.failed;
  document.getElementById('scene').setAttribute('aria-label', t.canvas);
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  try { localStorage.setItem('bloom-lang', l); } catch (e) { /* stockage indisponible */ }
}
applyLang(pickLang());
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ------------------------------------------------------------------ 3D */
const loaderEl = document.getElementById('loader');
const fillEl = document.getElementById('loaderFill');
startViewer({
  onProgress(pct) { fillEl.style.width = `${Math.min(100, pct)}%`; },
  onReady() { fillEl.style.width = '100%'; setTimeout(() => loaderEl.classList.add('is-done'), 200); },
  onError(kind) {
    if (kind === 'nogl') {
      loaderEl.classList.add('is-done');
      document.getElementById('nogl').hidden = false;
      return;
    }
    loadFailed = true;
    loaderEl.querySelector('.loader__label').textContent = I18N[lang].failed;
  },
});
