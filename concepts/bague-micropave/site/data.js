// Donnees de la page : paires comparatives (rendu Liori / etude) et tableau gagne / egalite / perdu.
// Le detail et les mesures sont dans controle/RAPPORT.md.
window.LIORI_PAIRS = [
  { a: "site/ref/render-1.webp", na: "render 1 · 1100 px", b: "site/img/cmp-dessus.webp", b2: "site/img/cmp-dessus-1600.webp", nb: "top view · rendered at 1600 px" },
  { a: "site/ref/render-3.webp", na: "render 3 · 1100 px", b: "site/img/cmp-face.webp", b2: "site/img/cmp-face-1600.webp", nb: "front view · rendered at 1600 px" },
  { a: "site/ref/render-4.webp", na: "render 4 · 1100 px", b: "site/img/cmp-dos.webp", b2: "site/img/cmp-dos-1600.webp", nb: "back view · rendered at 1600 px" },
  { a: "site/ref/video-image-200.webp", na: "turntable video · 720 px, watermark", b: "site/tt/blanc/1080/000.webp", b2: "site/tt/blanc/1600/000.webp", nb: "turntable frame 0 · rendered at 1600 px, no watermark" }
];
window.LIORI_SCORE = [
  { v: "tie", en: ["Geometry", "Every element is modelled and holds up at 2200 px macro scale. From the top, their claw tip is a slimmer teardrop than ours."],
              fr: ["Géométrie", "Tout est modélisé et tient en macro 2200 px. Vue de dessus, leur bout de griffe est une goutte plus effilée que la nôtre."] },
  { v: "tie", en: ["Diamond", "Exact 57-facet brilliant with spectral fire. At small size their stone sparkles slightly more; ours has crisper contrast."],
              fr: ["Diamant", "Brillant exact de 57 facettes, feu spectral. À petite taille leur pierre scintille un peu plus ; la nôtre a un contraste plus net."] },
  { v: "tie", en: ["Metal", "Near-chrome rhodium with soft gradients; measured brightness histogram matches theirs."],
              fr: ["Métal", "Rhodium presque chromé, dégradés doux ; histogramme de luminosité mesuré équivalent au leur."] },
  { v: "tie", en: ["Light", "Same studio feel: their video's grey backdrop and a very light contact shadow."],
              fr: ["Lumière", "Même studio : le fond gris de leur vidéo, ombre de contact très légère."] },
  { v: "win", en: ["Resolution", "Viewer drawn live at your screen's full pixel density vs a 720 px video; stills 1600 px vs 1100 px; 2200 px macros they do not have."],
              fr: ["Résolution", "Visionneuse calculée en direct à la pleine densité de votre écran, contre une vidéo 720 px ; vues 1600 px contre 1100 px ; macros 2200 px qu'ils n'ont pas."] },
  { v: "win", en: ["Interaction", "Real-time 3D: free rotation in every direction, zoom, the four metals switched live, no watermark, vs an autoplay 720 px video with a logo."],
              fr: ["Interaction", "3D en temps réel : rotation libre dans tous les sens, zoom, les quatre métaux changés en direct, sans filigrane, contre une vidéo 720 px avec logo."] },
  { v: "win", en: ["Extras", "Four metals in the viewer and four macro close-ups."],
              fr: ["Extras", "Quatre métaux dans la visionneuse et quatre gros plans macro."] }
];
