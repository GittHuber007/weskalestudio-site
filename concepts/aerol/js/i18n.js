/* Aerol : textes en deux langues. Anglais par defaut, francais au choix (memorise).
   Aucun tiret de ponctuation dans les deux langues. */
(function () {
  "use strict";
  const D = {
    en: {
      "meta.title": "Aerol One · Noise cancelling headphones",
      "meta.desc": "Aerol, a fictional audio brand. A Weskale Studio concept.",
      "nav.home": "Aerol, back to top",
      "nav.sections": "Sections",
      "nav.anat": "Anatomy",
      "nav.order": "Order",
      "nav.faq": "Questions",
      "nav.cartOpen": "Open the cart",
      "nav.cart": "Cart",
      "nav.lang": "Language",
      "film.aria": "Aerol One, anatomy of the headphones",
      "film.alt": "Aerol One headphones in graphite and aluminium, engraved AEROL, resting on a block of basalt",
      "hero.eyebrow": "Wireless headphones · active noise cancelling",
      "hero.lead": "Brushed aluminium, leather and basalt. Headphones built to last, and made to be forgotten.",
      "hero.cta": "Order · €449",
      "hero.inside": "See inside",
      "hero.hint": "Scroll",
      "chap.eyebrow": "Anatomy",
      "chap.aria": "Opened, layer by layer.",
      "chap.l1": "Opened,",
      "chap.l2": "layer by layer.",
      "chap.text": "Two aluminium shells, a headband wrapped in leather, and everything that works in between.",
      "still.alt": "Exploded view of the headphones: cushions, shells, electronics, batteries and drivers lined up along one axis",
      "specs.aria": "Concept specifications",
      "spec.a.k": "01 · Materials",
      "spec.a.t": "Shells machined then brushed, leather headband, memory foam cushions.",
      "spec.b.k": "02 · Drivers",
      "spec.b.t": "Dynamic drivers with a copper voice coil.",
      "spec.c.k": "03 · Battery life",
      "spec.c.t": "Stated with active noise cancelling on. One battery in each cup.",
      "specs.note": "Specifications of a fictional product, for illustration only.",
      "quiet.aria": "Noise cancelling",
      "quiet.eyebrow": "Noise cancelling",
      "quiet.text": "The noise of the city drops a notch. Your music stays exactly where you left it.",
      "order.aria": "Order",
      "order.eyebrow": "Order",
      "order.finish": "Finish",
      "order.add": "Add to cart",
      "order.imgAlt": "Aerol One, {name} finish",
      "perk.1": "Free delivery",
      "perk.2": "Returns within 30 days",
      "perk.3": "Two years of warranty",
      "fin.graphite.name": "Graphite",
      "fin.graphite.desc": "Brushed aluminium tinted graphite, black leather. The most discreet finish.",
      "fin.nuit.name": "Midnight",
      "fin.nuit.desc": "Aluminium anodised midnight blue, matching leather. Almost black in low light.",
      "fin.sable.name": "Sand",
      "fin.sable.desc": "Aluminium anodised in sand, light leather that develops a patina over time.",
      "faq.aria": "Frequently asked questions",
      "faq.eyebrow": "Questions",
      "faq.q1": "How long does the battery last?",
      "faq.a1": "Stated battery life is forty hours with active noise cancelling on. It charges over USB-C.",
      "faq.q2": "Can the cushions be replaced?",
      "faq.a2": "Yes. They attach with magnets and come off by hand, no tools needed.",
      "faq.q3": "Can I return it?",
      "faq.a3": "You have thirty days to send it back, with return shipping covered.",
      "foot.concept": "Weskale Studio concept · fictional brand",
      "foot.visuals": "Visuals generated for this concept",
      "cart.aria": "Cart",
      "cart.title": "Cart",
      "cart.close": "Close",
      "cart.closeAria": "Close the cart",
      "cart.empty": "Your cart is empty.",
      "cart.delivery": "Delivery",
      "cart.free": "Free",
      "cart.total": "Total",
      "cart.go": "Checkout",
      "cart.msg": "Demo: no payment is requested or stored. On the real site, this step opens secure checkout.",
      "cart.minus": "Remove one",
      "cart.plus": "Add one",
      "cart.rm": "Remove",
      "cart.added": "Aerol One {name} added to cart",
    },
    fr: {
      "meta.title": "Aerol One · Casque à réduction de bruit",
      "meta.desc": "Aerol, marque audio fictive. Concept Weskale Studio.",
      "nav.home": "Aerol, retour en haut",
      "nav.sections": "Sections",
      "nav.anat": "Anatomie",
      "nav.order": "Commander",
      "nav.faq": "Questions",
      "nav.cartOpen": "Ouvrir le panier",
      "nav.cart": "Panier",
      "nav.lang": "Langue",
      "film.aria": "Aerol One, anatomie du casque",
      "film.alt": "Casque Aerol One graphite et aluminium, gravé AEROL, posé sur un bloc de basalte",
      "hero.eyebrow": "Casque sans fil · réduction de bruit active",
      "hero.lead": "Aluminium brossé, cuir et basalte. Un casque pensé pour durer, et pour se faire oublier.",
      "hero.cta": "Commander · 449 €",
      "hero.inside": "Voir l'intérieur",
      "hero.hint": "Faire défiler",
      "chap.eyebrow": "Anatomie",
      "chap.aria": "Ouvert, couche par couche.",
      "chap.l1": "Ouvert,",
      "chap.l2": "couche par couche.",
      "chap.text": "Deux coques d'aluminium, un arceau gainé de cuir, et tout ce qui travaille entre les deux.",
      "still.alt": "Vue éclatée du casque : coussinets, coques, électronique, batteries et haut-parleurs alignés dans l'axe",
      "specs.aria": "Fiche technique du concept",
      "spec.a.k": "01 · Matériaux",
      "spec.a.t": "Coques usinées puis brossées, arceau en cuir, coussinets à mémoire de forme.",
      "spec.b.k": "02 · Haut-parleurs",
      "spec.b.t": "Transducteurs dynamiques, bobine mobile en cuivre.",
      "spec.c.k": "03 · Autonomie",
      "spec.c.t": "Annoncée avec la réduction de bruit active. Une batterie dans chaque coque.",
      "specs.note": "Spécifications d'un produit fictif, données à titre d'illustration.",
      "quiet.aria": "Réduction de bruit",
      "quiet.eyebrow": "Réduction de bruit",
      "quiet.text": "Le bruit de la ville baisse d'un cran. Votre musique reste exactement là où vous l'aviez laissée.",
      "order.aria": "Commander",
      "order.eyebrow": "Commander",
      "order.finish": "Finition",
      "order.add": "Ajouter au panier",
      "order.imgAlt": "Aerol One, finition {name}",
      "perk.1": "Livraison offerte",
      "perk.2": "Retour sous 30 jours",
      "perk.3": "Garantie deux ans",
      "fin.graphite.name": "Graphite",
      "fin.graphite.desc": "Aluminium brossé teinté graphite, cuir noir. La finition la plus discrète.",
      "fin.nuit.name": "Nuit",
      "fin.nuit.desc": "Aluminium anodisé bleu nuit, cuir assorti. Presque noir sous une lumière basse.",
      "fin.sable.name": "Sable",
      "fin.sable.desc": "Aluminium anodisé sable, cuir clair qui se patine avec le temps.",
      "faq.aria": "Questions fréquentes",
      "faq.eyebrow": "Questions",
      "faq.q1": "Combien de temps tient la batterie ?",
      "faq.a1": "L'autonomie annoncée est de quarante heures avec la réduction de bruit active. La recharge se fait en USB-C.",
      "faq.q2": "Les coussinets se remplacent-ils ?",
      "faq.a2": "Oui. Ils tiennent par aimants et se changent à la main, sans outil.",
      "faq.q3": "Puis-je le retourner ?",
      "faq.a3": "Vous avez trente jours pour le renvoyer, frais de retour offerts.",
      "foot.concept": "Concept Weskale Studio · marque fictive",
      "foot.visuals": "Visuels générés pour ce concept",
      "cart.aria": "Panier",
      "cart.title": "Panier",
      "cart.close": "Fermer",
      "cart.closeAria": "Fermer le panier",
      "cart.empty": "Votre panier est vide.",
      "cart.delivery": "Livraison",
      "cart.free": "Offerte",
      "cart.total": "Total",
      "cart.go": "Commander",
      "cart.msg": "Démonstration : aucun paiement n'est demandé ni enregistré. Sur le vrai site, cette étape ouvre le paiement sécurisé.",
      "cart.minus": "Retirer un exemplaire",
      "cart.plus": "Ajouter un exemplaire",
      "cart.rm": "Retirer",
      "cart.added": "Aerol One {name} ajouté au panier",
    },
  };
  const KEY = "aerol-lang";
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  const I = (window.I18N = { lang: saved === "fr" ? "fr" : "en" });
  I.t = (k, v) => {
    let s = (D[I.lang] && D[I.lang][k]) || D.en[k] || k;
    if (v) Object.keys(v).forEach((n) => (s = s.replace("{" + n + "}", v[n])));
    return s;
  };
  // Prix : "€1,407" en anglais, "1 407 €" en francais
  I.eur = (n) => (I.lang === "fr" ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €" : "€" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
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
