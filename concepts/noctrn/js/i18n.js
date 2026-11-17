/* NOCTRN : textes en deux langues. Anglais par defaut, francais au choix (memorise).
   Aucun tiret de ponctuation dans les deux langues. */
(function () {
  "use strict";
  const D = {
    en: {
      "meta.title": "NOCTRN · After midnight collection",
      "meta.desc": "NOCTRN, technical clothing for the city at night. A fictional brand, Weskale Studio concept.",
      "nav.home": "NOCTRN, back to top",
      "nav.sections": "Sections",
      "nav.shell": "The shell",
      "nav.shop": "Collection",
      "nav.look": "Lookbook",
      "nav.lang": "Language",
      "nav.cartOpen": "Open the cart",
      "nav.cart": "Cart",
      "loader.meta": "Collection 03 · After midnight",

      "film.aria": "Shell N°1, a technical jacket in the rain",
      "film.alt": "A young man in a black NOCTRN technical jacket, standing in the rain on a city street at night, cyan and magenta neon lights",
      "hero.eyebrow": "Collection 03 · After midnight",
      "c0.aria": "After midnight.",
      "hero.l1": "After",
      "hero.l2": "midnight.",
      "hero.lead": "Technical clothing for the city at night. Matte shells, sealed seams, wide cuts.",
      "hero.cta": "Shop the collection",
      "hero.rain": "Walk into the rain",
      "hero.hint": "Scroll",

      "c1.eyebrow": "01 · Shell N°1",
      "c1.aria": "Sealed against the night.",
      "c1.l1": "Sealed",
      "c1.l2": "against the night.",
      "c1.text": "Three-layer matte ripstop, a funnel collar that closes to the chin, and the NOCTRN mark printed on the chest.",

      "c2.eyebrow": "02 · Built for rain",
      "c2.aria": "Rain is the brief.",
      "c2.l1": "Rain is",
      "c2.l2": "the brief.",

      "specs.aria": "Concept specifications",
      "spec.a.k": "01 · Shell",
      "spec.a.u": "layers",
      "spec.a.t": "Matte ripstop nylon, water repellent finish, breathable membrane.",
      "spec.b.k": "02 · Seams",
      "spec.b.v": "Taped",
      "spec.b.t": "Every seam heat sealed from the inside.",
      "spec.c.k": "03 · Water column",
      "spec.c.t": "Waterproof rating stated for the fabric.",
      "specs.note": "Specifications of a fictional product, for illustration only.",

      "quiet.aria": "Manifesto",
      "quiet.eyebrow": "NOCTRN",
      "quiet.text": "The city empties around two. The streets stay wet. We design for the hours in between.",

      "shop.aria": "The collection",
      "shop.eyebrow": "Collection 03",
      "shop.l1": "Three pieces.",
      "shop.l2": "One night.",
      "shop.choose": "Choose a size",
      "shop.from": "Free delivery from €150",

      "look.aria": "Lookbook",
      "look.eyebrow": "Lookbook · Under the bridge",
      "look.alt": "A model in a black funnel neck jacket and wide charcoal cargo trousers under a concrete bridge at night, one red neon tube, wet ground",
      "look.text": "Between two showers, under the pillars of a bridge. Wet concrete, one red light and a city asleep.",
      "look.cta": "Shop the look",

      "p.shell.name": "Shell N°1",
      "p.shell.cat": "Technical jacket",
      "p.shell.color": "Matte black",
      "p.shell.desc": "Three-layer ripstop shell, fleece lined funnel collar, taped seams. Wide cut, long back.",
      "p.shell.alt": "Shell N°1, matte black technical jacket with the NOCTRN mark, worn in the rain",
      "p.funnel.name": "Funnel N°2",
      "p.funnel.cat": "Padded jacket",
      "p.funnel.color": "Ink black",
      "p.funnel.desc": "Light padding, high funnel collar, deep hand pockets. Made for the long walk home.",
      "p.funnel.alt": "Funnel N°2, ink black padded jacket with a high collar, worn under a concrete bridge",
      "p.cargo.name": "Cargo N°3",
      "p.cargo.cat": "Wide trousers",
      "p.cargo.color": "Charcoal",
      "p.cargo.desc": "Heavy cotton twill, flap pockets, ankles drawn in by a cord.",
      "p.cargo.alt": "Cargo N°3, wide charcoal trousers with flap pockets, on wet ground lit in red",

      "sheet.close": "Close",
      "sheet.size": "Size",
      "sheet.pick": "Pick a size.",
      "sheet.err": "Pick a size first.",
      "sheet.fit": "Wide cut. Take your usual size.",
      "sheet.soldout": "{s}, sold out",
      "sheet.add": "Add to cart",

      "cart.aria": "Cart",
      "cart.title": "Cart",
      "cart.close": "Close",
      "cart.closeAria": "Close the cart",
      "cart.empty": "Your cart is empty.",
      "cart.sub": "Subtotal",
      "cart.delivery": "Delivery",
      "cart.free": "Free",
      "cart.total": "Total",
      "cart.go": "Checkout",
      "cart.msg": "Demo: no payment is requested or stored. On the real site, this step opens secure checkout.",
      "cart.minus": "Remove one",
      "cart.plus": "Add one",
      "cart.rm": "Remove",
      "cart.size": "Size {s}",
      "cart.added": "{name}, size {s}, added to cart",
      "cart.left": "{n} more for free delivery",

      "foot.brand": "NOCTRN, technical clothing for the night",
      "foot.service": "Free delivery from €150 · Returns within 30 days",
      "foot.concept": "Weskale Studio concept · fictional brand",
      "foot.visuals": "Generated visuals · rain footage from Mixkit",
    },
    fr: {
      "meta.title": "NOCTRN · Collection Après minuit",
      "meta.desc": "NOCTRN, vêtements techniques pour la ville la nuit. Marque fictive, concept Weskale Studio.",
      "nav.home": "NOCTRN, retour en haut",
      "nav.sections": "Sections",
      "nav.shell": "La coque",
      "nav.shop": "Collection",
      "nav.look": "Lookbook",
      "nav.lang": "Langue",
      "nav.cartOpen": "Ouvrir le panier",
      "nav.cart": "Panier",
      "loader.meta": "Collection 03 · Après minuit",

      "film.aria": "Coque N°1, une veste technique sous la pluie",
      "film.alt": "Un jeune homme en veste technique noire NOCTRN, debout sous la pluie dans une rue la nuit, néons cyan et magenta",
      "hero.eyebrow": "Collection 03 · Après minuit",
      "c0.aria": "Après minuit.",
      "hero.l1": "Après",
      "hero.l2": "minuit.",
      "hero.lead": "Des vêtements techniques pour la ville la nuit. Coques mates, coutures scellées, volumes larges.",
      "hero.cta": "Voir la collection",
      "hero.rain": "Entrer sous la pluie",
      "hero.hint": "Défiler",

      "c1.eyebrow": "01 · Coque N°1",
      "c1.aria": "Scellée contre la nuit.",
      "c1.l1": "Scellée",
      "c1.l2": "contre la nuit.",
      "c1.text": "Ripstop mat trois couches, col cheminée fermé jusqu'au menton, et la marque NOCTRN imprimée sur la poitrine.",

      "c2.eyebrow": "02 · Sous l'averse",
      "c2.aria": "La pluie d'abord.",
      "c2.l1": "La pluie",
      "c2.l2": "d'abord.",

      "specs.aria": "Fiche technique du concept",
      "spec.a.k": "01 · Coque",
      "spec.a.u": "couches",
      "spec.a.t": "Nylon ripstop mat, finition déperlante, membrane respirante.",
      "spec.b.k": "02 · Coutures",
      "spec.b.v": "Scellées",
      "spec.b.t": "Chaque couture est thermocollée par l'intérieur.",
      "spec.c.k": "03 · Colonne d'eau",
      "spec.c.t": "Imperméabilité annoncée pour le tissu.",
      "specs.note": "Spécifications d'un produit fictif, données à titre d'illustration.",

      "quiet.aria": "Manifeste",
      "quiet.eyebrow": "NOCTRN",
      "quiet.text": "La ville se vide vers deux heures. Les rues restent mouillées. On dessine pour les heures entre les deux.",

      "shop.aria": "La collection",
      "shop.eyebrow": "Collection 03",
      "shop.l1": "Trois pièces.",
      "shop.l2": "Une seule nuit.",
      "shop.choose": "Choisir ma taille",
      "shop.from": "Livraison offerte dès 150 €",

      "look.aria": "Lookbook",
      "look.eyebrow": "Lookbook · Sous le pont",
      "look.alt": "Un mannequin en veste noire à col cheminée et cargo large anthracite sous un pont en béton la nuit, un néon rouge, sol mouillé",
      "look.text": "Entre deux averses, sous les piles d'un pont. Du béton mouillé, un seul néon rouge et la ville qui dort.",
      "look.cta": "Acheter le look",

      "p.shell.name": "Coque N°1",
      "p.shell.cat": "Veste technique",
      "p.shell.color": "Noir mat",
      "p.shell.desc": "Coque ripstop trois couches, col cheminée doublé de polaire, coutures thermocollées. Coupe large, dos rallongé.",
      "p.shell.alt": "Coque N°1, veste technique noir mat avec la marque NOCTRN, portée sous la pluie",
      "p.funnel.name": "Col N°2",
      "p.funnel.cat": "Veste matelassée",
      "p.funnel.color": "Noir encre",
      "p.funnel.desc": "Garnissage léger, col cheminée haut, poches profondes. Pensée pour les longs retours à pied.",
      "p.funnel.alt": "Col N°2, veste matelassée noir encre à col haut, portée sous un pont en béton",
      "p.cargo.name": "Cargo N°3",
      "p.cargo.cat": "Pantalon large",
      "p.cargo.color": "Anthracite",
      "p.cargo.desc": "Sergé de coton épais, poches à rabat, chevilles serrées par un cordon.",
      "p.cargo.alt": "Cargo N°3, pantalon large anthracite à poches à rabat, sur un sol mouillé éclairé en rouge",

      "sheet.close": "Fermer",
      "sheet.size": "Taille",
      "sheet.pick": "Choisis une taille.",
      "sheet.err": "Choisis d'abord une taille.",
      "sheet.fit": "Coupe large. Prends ta taille habituelle.",
      "sheet.soldout": "{s}, épuisé",
      "sheet.add": "Ajouter au panier",

      "cart.aria": "Panier",
      "cart.title": "Panier",
      "cart.close": "Fermer",
      "cart.closeAria": "Fermer le panier",
      "cart.empty": "Ton panier est vide.",
      "cart.sub": "Sous-total",
      "cart.delivery": "Livraison",
      "cart.free": "Offerte",
      "cart.total": "Total",
      "cart.go": "Commander",
      "cart.msg": "Démonstration : aucun paiement n'est demandé ni enregistré. Sur le vrai site, cette étape ouvre le paiement sécurisé.",
      "cart.minus": "Retirer un exemplaire",
      "cart.plus": "Ajouter un exemplaire",
      "cart.rm": "Retirer",
      "cart.size": "Taille {s}",
      "cart.added": "{name}, taille {s}, ajouté au panier",
      "cart.left": "Encore {n} pour la livraison offerte",

      "foot.brand": "NOCTRN, vêtements techniques pour la nuit",
      "foot.service": "Livraison offerte dès 150 € · Retours sous 30 jours",
      "foot.concept": "Concept Weskale Studio · marque fictive",
      "foot.visuals": "Visuels générés · pluie filmée par Mixkit",
    },
  };
  const KEY = "noctrn-lang";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const I = (window.I18N = { lang: saved === "fr" ? "fr" : "en" });
  I.t = (k, v) => {
    let s = (D[I.lang] && D[I.lang][k]) || D.en[k] || k;
    if (v) Object.keys(v).forEach((n) => (s = s.replace("{" + n + "}", v[n])));
    return s;
  };
  const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, I.lang === "fr" ? "\u00a0" : ",");
  I.num = group;
  // Prix : "€1,407" en anglais, "1 407 €" en francais
  I.eur = (n) => (I.lang === "fr" ? group(n) + " €" : "€" + group(n));
  I.apply = () => {
    document.documentElement.lang = I.lang;
    document.title = I.t("meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = I.t("meta.desc");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = I.t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", I.t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = I.t(el.dataset.i18nAlt)));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === I.lang));
  };
  I.set = (l) => {
    if (l === I.lang || !D[l]) return;
    I.lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    I.apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-lang]"); if (b) I.set(b.dataset.lang); });
  I.apply();
})();
