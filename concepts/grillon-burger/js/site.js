/* Grillon : un seul plan. La photo d'ouverture devient la vidéo du burger
   qui s'ouvre au défilement, image par image sur un canvas. Puis la carte et le panier.
   Anglais par défaut, version française complète par le sélecteur EN / FR. */
(function () {
  "use strict";
  var W = window.W, RM = W.RM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* Téléphone ou écran en portrait : séquence recadrée sur le burger */
  var PORTRAIT = window.matchMedia("(max-width: 760px)").matches || innerWidth / innerHeight < 0.9;
  var SEQ = PORTRAIT
    ? { dir: "assets/seq-m/", n: 96, still: "assets/hero-m.webp" }
    : { dir: "assets/seq/", n: 192, still: "assets/hero.webp" };

  /* ---------- Textes : anglais et français ---------- */
  var T = {
    en: {
      title: "Grillon · Halal smash burgers in Lyon",
      desc: "Grillon, halal smash burgers in Lyon: fresh beef smashed on the griddle, melted cheddar, golden brioche. Alcohol-free. Weskale Studio concept, fictional brand.",
      loader: "Heating the griddle", concept: "Weskale Studio concept · fictional brand",
      logoAria: "Grillon, back to top", navAria: "Main navigation", navMenu: "Menu", navVisit: "Visit", navCart: "Cart",
      langAria: "Language", cartOpen: "Open cart", filmAria: "The Grillon, opened as you scroll",
      heroAlt: "Double smash burger with melted cheddar in kraft paper printed Grillon, on the griddle in front of glowing embers",
      eyebrow: "Halal smash burgers <i></i> Lyon 7th",
      h1a: "Smashed", h1b: "and <em>seared.</em>",
      lead: "Two patties of fresh beef pressed onto a blazing griddle, a crust that crunches, cheddar melting over the top. Halal, alcohol-free, cooked to order.",
      ctaOrder: "Order now", hint: "Scroll, it opens up",
      c1t: "The bun <em>rises.</em>", c1p: "Toasted in butter on the griddle. Crisp outside, soft inside.",
      c2t: "The cheddar <em>drips.</em>", c2p: "Laid on the patty while it is still searing, it melts on its own and runs down to the paper.",
      c3t: "Two patties, <em>one crust.</em>", c3p: "Halal beef smashed with one press of the spatula. The edges caramelize, the center stays juicy.",
      c4t: "Close it up. <em>It's ready.</em>", c4p: "Pickles, diced onion, Grillon sauce. Served in its paper, still steaming.",
      c4btn: "Add the Grillon · {p}",
      menuEyebrow: "The menu", menuTitle: "Pick one. <em>We smash.</em>", menuNote: "Everything is cooked to order. Sample prices.", menuCart: "View cart",
      vowsAria: "Our commitments", v1: "Halal meat", v2: "Zero alcohol", v3: "Cooked to order",
      finalAlt: "The Grillon closed again, cheddar running down the kraft paper printed Grillon",
      visitEyebrow: "Visit", visitTitle: "Eat in, <em>take out or delivery.</em>",
      whereT: "Where", whereD: "Lyon 7th", whenT: "When", whenD: "Every day, 11:30 am to 11 pm",
      orderT: "Order", orderD: "Online here, or at the counter", visitCart: "Open your cart",
      footNote: "Sample prices and opening hours. Image and video generated for this demo.", footTop: "Back to top",
      cartAria: "Cart", cartTitle: "Your cart", cartClose: "Close", cartCloseAria: "Close cart",
      modeLegend: "Pickup or delivery", modeTake: "Takeaway", modeDeliv: "Delivery", slot: "Time slot", total: "Total",
      fee: "Sample delivery fee: {p} included", submit: "Place order",
      legal: "Demo only: no order is sent and no payment is requested.",
      doneEyebrow: "Demo order", doneTitle: "It's on the grill.", doneA: "Order", doneB: ", ready around", doneBack: "Back to the site",
      empty: "Your cart is empty. Start with a Grillon.", added: "{n} added to your cart",
      addAria: "Add {n} to cart", incAria: "Add one more {n}", decAria: "Remove one {n}",
      asap: "As soon as possible, about 20 min"
    },
    fr: {
      title: "Grillon · Smash burger halal à Lyon",
      desc: "Grillon, smash burgers halal à Lyon : bœuf frais écrasé sur la plaque, cheddar fondu, brioche dorée. Sans alcool. Concept Weskale Studio, marque fictive.",
      loader: "Plaque en chauffe", concept: "Concept Weskale Studio · marque fictive",
      logoAria: "Grillon, retour en haut", navAria: "Navigation principale", navMenu: "La carte", navVisit: "Venir", navCart: "Panier",
      langAria: "Langue", cartOpen: "Ouvrir le panier", filmAria: "Le Grillon, ouvert au défilement",
      heroAlt: "Double smash burger au cheddar fondu dans son papier kraft imprimé Grillon, posé sur la plaque devant les braises",
      eyebrow: "Smash burger halal <i></i> Lyon 7e",
      h1a: "Écrasé", h1b: "à la <em>flamme.</em>",
      lead: "Deux steaks de bœuf frais pressés sur la plaque brûlante, une croûte qui croque, du cheddar qui fond par-dessus. Halal, sans alcool, cuit à la minute.",
      ctaOrder: "Commander", hint: "Défile, il s'ouvre",
      c1t: "La brioche <em>se lève.</em>", c1p: "Dorée au beurre sur la plaque. Croustillante dehors, moelleuse dedans.",
      c2t: "Le cheddar <em>coule.</em>", c2p: "Posé sur le steak encore brûlant, il fond tout seul et file jusqu'au papier.",
      c3t: "Deux steaks, <em>une croûte.</em>", c3p: "Bœuf halal écrasé d'un coup de spatule. Les bords caramélisent, le cœur reste juteux.",
      c4t: "On referme. <em>C'est prêt.</em>", c4p: "Pickles, oignon ciselé, sauce Grillon. Servi dans son papier, encore fumant.",
      c4btn: "Ajouter le Grillon · {p}",
      menuEyebrow: "La carte", menuTitle: "Choisis. <em>On écrase.</em>", menuNote: "Tout est cuit à la commande. Prix donnés à titre d'exemple.", menuCart: "Voir le panier",
      vowsAria: "Nos engagements", v1: "Viande halal", v2: "Zéro alcool", v3: "Cuit à la minute",
      finalAlt: "Le Grillon refermé, le cheddar coule sur le papier kraft imprimé Grillon",
      visitEyebrow: "Venir", visitTitle: "Sur place, <em>à emporter ou livré.</em>",
      whereT: "Où", whereD: "Lyon 7e", whenT: "Quand", whenD: "Tous les jours, 11 h 30 à 23 h",
      orderT: "Commander", orderD: "En ligne ici, ou au comptoir", visitCart: "Ouvrir le panier",
      footNote: "Prix et horaires donnés à titre d'exemple. Image et vidéo générées pour la démonstration.", footTop: "Haut de page",
      cartAria: "Panier", cartTitle: "Ton panier", cartClose: "Fermer", cartCloseAria: "Fermer le panier",
      modeLegend: "Mode de retrait", modeTake: "À emporter", modeDeliv: "Livraison", slot: "Créneau", total: "Total",
      fee: "Livraison d'exemple : {p} incluse", submit: "Valider la commande",
      legal: "Démonstration : aucune commande n'est envoyée, aucun paiement n'est demandé.",
      doneEyebrow: "Commande de démonstration", doneTitle: "C'est sur le feu.", doneA: "Numéro", doneB: ", prête vers", doneBack: "Retour au site",
      empty: "Ton panier est vide. Commence par un Grillon.", added: "{n} ajouté au panier",
      addAria: "Ajouter {n} au panier", incAria: "Ajouter un {n}", decAria: "Retirer un {n}",
      asap: "Dès que possible, environ 20 min"
    }
  };

  /* ---------- Carte (prix d'exemple) ---------- */
  var MENU = [
    { cat: { en: "Burgers", fr: "Burgers" }, items: [
      { id: "grillon", name: { en: "The Grillon", fr: "Le Grillon" }, price: 12.9, tag: { en: "Signature", fr: "Signature" },
        desc: { en: "Double smash, double cheddar, pickles, diced onion, Grillon sauce.", fr: "Double smash, double cheddar, pickles, oignon ciselé, sauce Grillon." } },
      { id: "solo", name: { en: "The Solo", fr: "Le Solo" }, price: 9.5,
        desc: { en: "One smashed patty, cheddar, pickles, Grillon sauce.", fr: "Un steak smashé, cheddar, pickles, sauce Grillon." } },
      { id: "triple", name: { en: "The Triple", fr: "Le Triple" }, price: 15.9,
        desc: { en: "Three patties, triple cheddar, onions grilled on the griddle.", fr: "Trois steaks, triple cheddar, oignon grillé sur la plaque." } },
      { id: "croustillant", name: { en: "The Crispy", fr: "Le Croustillant" }, price: 11.9,
        desc: { en: "Halal chicken breaded to order, tangy slaw, honey chili sauce.", fr: "Poulet halal pané à la minute, chou acidulé, sauce miel piment." } }
    ] },
    { cat: { en: "On the side", fr: "À côté" }, items: [
      { id: "frites", name: { en: "House fries", fr: "Frites maison" }, price: 3.9,
        desc: { en: "Cut in house, cooked twice, sea salt flakes.", fr: "Coupées sur place, deux cuissons, fleur de sel." } },
      { id: "frites-cheddar", name: { en: "Cheddar fries", fr: "Frites cheddar" }, price: 5.5,
        desc: { en: "Hot cheddar sauce and crispy onions.", fr: "Sauce cheddar chaude et oignon frit." } }
    ] },
    { cat: { en: "House drinks, alcohol-free", fr: "Boissons maison, sans alcool" }, items: [
      { id: "citronnade", name: { en: "Mint lemonade", fr: "Citronnade menthe" }, price: 3.9,
        desc: { en: "Fresh squeezed lemon, fresh mint, cane sugar.", fr: "Citron pressé, menthe fraîche, sucre de canne." } },
      { id: "the", name: { en: "Peach iced tea", fr: "Thé glacé pêche" }, price: 3.9,
        desc: { en: "Brewed every morning, served ice cold.", fr: "Infusé le matin, servi bien froid." } }
    ] },
    { cat: { en: "To finish", fr: "Pour finir" }, items: [
      { id: "cookie", name: { en: "Warm cookie", fr: "Cookie tiède" }, price: 3.5,
        desc: { en: "Gooey center, dark chocolate chips.", fr: "Cœur fondant, pépites de chocolat noir." } }
    ] }
  ];
  var BY_ID = {};
  MENU.forEach(function (c) { c.items.forEach(function (i) { BY_ID[i.id] = i; }); });

  /* ---------- Langue ---------- */
  var LKEY = "grillon-lang", lang = "en";
  try { var saved = localStorage.getItem(LKEY); if (saved === "fr" || saved === "en") lang = saved; } catch (e) {}
  var t = function (k, vars) {
    var s = T[lang][k]; if (s == null) s = T.en[k] || "";
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split("{" + v + "}").join(vars[v]); });
    return s;
  };
  var eur = function (n) { return lang === "fr" ? n.toFixed(2).replace(".", ",") + " €" : "€" + n.toFixed(2); };
  var hhmm = function (d) {
    var h = String(d.getHours()).padStart(2, "0"), m = String(d.getMinutes()).padStart(2, "0");
    return lang === "fr" ? h + " h " + m : h + ":" + m;
  };

  var renderMenu = function () {
    $("[data-menu]").innerHTML = MENU.map(function (c) {
      return '<div class="cat"><p class="cat__name"><span>' + c.cat[lang] + '</span><span>' + String(c.items.length).padStart(2, "0") + '</span></p>' +
        c.items.map(function (i) {
          return '<div class="item"><div><h3>' + i.name[lang] + (i.tag ? '<span class="tag">' + i.tag[lang] + '</span>' : "") + '</h3><p>' + i.desc[lang] + '</p></div>' +
            '<span class="item__price">' + eur(i.price) + '</span>' +
            '<button class="add" data-add="' + i.id + '" aria-label="' + t("addAria", { n: i.name[lang] }) + '">+</button></div>';
        }).join("") + "</div>";
    }).join("");
  };
  var renderVows = function () {
    $$("[data-vow]").forEach(function (el, i) {
      var w = t(el.dataset.vow), o = i % 2;
      el.innerHTML = [0, 1, 2].map(function (k) { return '<span' + ((k + o) % 2 ? ' class="o"' : "") + ">" + w + "</span>"; }).join('<em aria-hidden="true">·</em>');
      el.setAttribute("aria-label", w);
    });
  };
  var renderSlots = function () { // créneaux par quart d'heure, à partir de dans vingt minutes
    var sel = $("[data-slots]"), keep = sel.value;
    var d = new Date(Date.now() + 20 * 60000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    var opts = ['<option value="asap">' + t("asap") + "</option>"];
    for (var i = 0; i < 8; i++) { var dt = new Date(d.getTime() + i * 15 * 60000); opts.push('<option value="' + dt.getTime() + '">' + hhmm(dt) + "</option>"); }
    sel.innerHTML = opts.join("");
    if (keep && sel.querySelector('option[value="' + keep + '"]')) sel.value = keep;
  };

  var applyLang = function (l) {
    lang = l;
    try { localStorage.setItem(LKEY, l); } catch (e) {}
    document.documentElement.lang = l;
    document.title = t("title");
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("desc"));
    $$("[data-i18n]").forEach(function (el) {
      var k = el.dataset.i18n;
      var s = k === "c4btn" ? t(k, { p: eur(12.9) }) : k === "fee" ? t(k, { p: eur(2.5) }) : t(k);
      el.innerHTML = s;
      if (el.dataset.splitDone) { delete el.dataset.splitDone; el.removeAttribute("aria-label"); }
    });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$("[data-i18n-alt]").forEach(function (el) { el.setAttribute("alt", t(el.dataset.i18nAlt)); });
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === l)); });
    renderMenu(); renderVows(); renderSlots();
    if (typeof render === "function") render();
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (!b || b.dataset.lang === lang) return;
    applyLang(b.dataset.lang);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  /* ---------- Panier ---------- */
  var KEY = "grillon-cart";
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { cart = {}; }
  var cartEl = $("[data-cart]"), body = $("[data-cart-body]");
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
  var ids = function () { return Object.keys(cart).filter(function (k) { return cart[k] > 0 && BY_ID[k]; }); };
  var count = function () { return ids().reduce(function (s, k) { return s + cart[k]; }, 0); };
  var fee = function () { var m = $('input[name="mode"]:checked'); return m && m.value === "livraison" ? 2.5 : 0; };
  var total = function () { return ids().reduce(function (s, k) { return s + BY_ID[k].price * cart[k]; }, 0); };
  function render() {
    var list = ids();
    body.innerHTML = list.length ? list.map(function (k) {
      var i = BY_ID[k], nm = i.name[lang];
      return '<div class="cline"><h4>' + nm + '</h4><span class="cline__price">' + eur(i.price * cart[k]) + '</span>' +
        '<div class="qty"><button data-dec="' + k + '" aria-label="' + t("decAria", { n: nm }) + '">−</button><span>' + cart[k] + '</span><button data-inc="' + k + '" aria-label="' + t("incAria", { n: nm }) + '">+</button></div></div>';
    }).join("") : '<p class="cart__empty">' + t("empty") + "</p>";
    var tt = list.length ? total() + fee() : 0;
    $("[data-cart-total]").textContent = eur(tt);
    $("[data-cart-total-mini]").textContent = eur(list.length ? total() : 0);
    $("[data-fee]").hidden = !(fee() && list.length);
    $("[data-cart-submit]").disabled = !list.length;
    $$("[data-cart-count]").forEach(function (b) { b.textContent = count(); });
  }
  var add = function (id) {
    cart[id] = (cart[id] || 0) + 1; save(); render();
    var b = $(".nav__cart"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    W.toast(t("added", { n: BY_ID[id].name[lang] }));
  };
  var lastFocus = null;
  var openCart = function () {
    lastFocus = document.activeElement;
    $("[data-cart-done]").hidden = true; $("[data-cart-form]").hidden = false; body.hidden = false;
    cartEl.classList.add("open"); cartEl.setAttribute("aria-hidden", "false"); W.stop();
    setTimeout(function () { var x = $(".cart__x"); if (x) x.focus(); }, 300);
  };
  var closeCart = function () {
    cartEl.classList.remove("open"); cartEl.setAttribute("aria-hidden", "true"); W.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-add],[data-inc],[data-dec],[data-open-cart],[data-close-cart]");
    if (!el) return;
    if (el.dataset.add) add(el.dataset.add);
    else if (el.dataset.inc) { cart[el.dataset.inc]++; save(); render(); }
    else if (el.dataset.dec) { cart[el.dataset.dec]--; if (cart[el.dataset.dec] <= 0) delete cart[el.dataset.dec]; save(); render(); }
    else if (el.hasAttribute("data-open-cart")) openCart();
    else if (el.hasAttribute("data-close-cart")) closeCart();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cartEl.classList.contains("open")) closeCart(); });
  $$('input[name="mode"]').forEach(function (r) { r.addEventListener("change", render); });
  $("[data-cart-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!count()) return;
    var slot = $("[data-slots]").value;
    $("[data-order-n]").textContent = "G" + String(Math.floor(1000 + Math.random() * 9000));
    $("[data-order-t]").textContent = hhmm(slot === "asap" ? new Date(Date.now() + 20 * 60000) : new Date(+slot));
    cart = {}; save(); render();
    $("[data-cart-form]").hidden = true; body.hidden = true; $("[data-cart-done]").hidden = false;
  });
  applyLang(lang);

  /* ---------- Le film : séquence d'images sur canvas ----------
     Chargement progressif du grossier au fin (une image sur 32, puis 16, 8, 4, 2, 1),
     en servant d'abord les images proches de la position. On dessine toujours
     l'image chargée la plus proche, et la photo 2K couvre le tout début. */
  function Film(stage) {
    var cv = $(".film__canvas", stage), ctx = cv.getContext("2d");
    var n = SEQ.n, imgs = new Array(n), state = new Array(n).fill(0);
    var loading = 0, MAX = 6, cur = 0, p = 0, drawn = -2, drawnA = -1;
    var still = new Image(); still.decoding = "async"; still.src = SEQ.still;
    var order = [], seen = {};
    [32, 16, 8, 4, 2, 1].forEach(function (s) { for (var k = 0; k < n; k += s) if (!seen[k]) { seen[k] = 1; order.push(k); } });
    if (!seen[n - 1]) order.push(n - 1);
    var file = function (k) { return SEQ.dir + "f_" + String(k + 1).padStart(3, "0") + ".webp"; };
    var load = function (k) {
      if (k < 0 || k >= n || state[k]) return;
      var im = new Image(); im.decoding = "async";
      state[k] = 1; loading++; imgs[k] = im;
      im.onload = function () {
        var ready = function () { loading--; state[k] = 2; if (Math.abs(k - cur) < 8) draw(true); pump(); };
        if (im.decode) im.decode().then(ready, ready); else ready();
      };
      im.onerror = function () { loading--; state[k] = 3; imgs[k] = null; pump(); };
      im.src = file(k);
    };
    var pump = function () {
      for (var d = 0; d < 10 && loading < MAX; d++) { load(cur + d); load(cur - d); }
      for (var i = 0; i < order.length && loading < MAX; i++) load(order[i]);
    };
    var bg = "#050302";
    var geo = function (iw, ih) {
      var cw = cv.width, ch = cv.height, w, h, x, y;
      if (PORTRAIT) { // image carrée en haut, fondue dans le noir
        w = Math.min(cw * 1.04, ch * 0.6); h = w * ih / iw;
        x = (cw - w) / 2; y = Math.max(ch * 0.07, (ch * 0.5 - h) / 2 + ch * 0.05);
      } else {
        var s = Math.max(cw / iw, ch / ih); w = iw * s; h = ih * s;
        x = (cw - w) * 0.62; y = (ch - h) * 0.5;
      }
      return [x, y, w, h];
    };
    var nearest = function () {
      for (var d = 0; d < n; d++) {
        if (cur - d >= 0 && state[cur - d] === 2) return imgs[cur - d];
        if (cur + d < n && state[cur + d] === 2) return imgs[cur + d];
      }
      return null;
    };
    var draw = function (force) {
      var a = 1 - smooth(0.004, 0.035, p); // part de la photo 2K
      var im = nearest();
      var key = im ? imgs.indexOf(im) : -1;
      if (!force && key === drawn && Math.abs(a - drawnA) < 0.004) return;
      drawn = key; drawnA = a;
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      var g;
      if (im) { g = geo(im.naturalWidth, im.naturalHeight); ctx.drawImage(im, g[0], g[1], g[2], g[3]); }
      if (a > 0 && still.complete && still.naturalWidth) {
        g = geo(still.naturalWidth, still.naturalHeight);
        ctx.globalAlpha = im ? a : 1; ctx.drawImage(still, g[0], g[1], g[2], g[3]); ctx.globalAlpha = 1;
      }
      if (PORTRAIT && g) { // bords haut et bas fondus dans le noir
        var top = ctx.createLinearGradient(0, g[1], 0, g[1] + g[3] * 0.2);
        top.addColorStop(0, bg); top.addColorStop(1, "rgba(5,3,2,0)");
        ctx.fillStyle = top; ctx.fillRect(0, g[1] - 2, cv.width, g[3] * 0.2 + 2);
        var bot = ctx.createLinearGradient(0, g[1] + g[3] * 0.72, 0, g[1] + g[3]);
        bot.addColorStop(0, "rgba(5,3,2,0)"); bot.addColorStop(1, bg);
        ctx.fillStyle = bot; ctx.fillRect(0, g[1] + g[3] * 0.72, cv.width, g[3] * 0.28 + 2);
      }
    };
    var size = function () {
      var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, PORTRAIT ? 2 : 1.5);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
      draw(true);
    };
    addEventListener("resize", size);
    still.onload = function () { draw(true); };
    size(); pump();
    this.ready = new Promise(function (res) {
      var ok = 0, done = function () { if (++ok === 2) res(); };
      if (still.complete && still.naturalWidth) done(); else { still.addEventListener("load", done); still.addEventListener("error", done); }
      var f0 = setInterval(function () { if (state[0] >= 2) { clearInterval(f0); done(); } }, 30);
    });
    this.set = function (v) {
      p = clamp(v, 0, 1);
      var k = Math.round(p * (n - 1));
      if (k !== cur) { cur = k; pump(); }
      draw(false);
    };
    this.loaded = function () { return state.filter(function (s) { return s === 2; }).length / n; };
  }

  /* ---------- Braises qui montent dans l'ouverture ---------- */
  function Embers(cv) {
    var ctx = cv.getContext("2d"), parts = [], N = PORTRAIT ? 18 : 42, level = 1, vis = true;
    var size = function () { var d = Math.min(devicePixelRatio || 1, PORTRAIT ? 2 : 1.5); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    var sprite = document.createElement("canvas"), SR = 32;
    sprite.width = sprite.height = SR * 2;
    (function () {
      var sx = sprite.getContext("2d"), g = sx.createRadialGradient(SR, SR, 0, SR, SR, SR);
      g.addColorStop(0, "rgba(255,190,90,0.85)"); g.addColorStop(0.4, "rgba(255,100,30,0.3)"); g.addColorStop(1, "rgba(255,60,0,0)");
      sx.fillStyle = g; sx.fillRect(0, 0, SR * 2, SR * 2);
    })();
    size(); addEventListener("resize", size);
    var spawn = function (p, init) {
      var w = cv.clientWidth, h = cv.clientHeight;
      p.x = w * (PORTRAIT ? 0.1 + Math.random() * 0.8 : 0.3 + Math.random() * 0.7);
      p.y = init ? Math.random() * h : h * (PORTRAIT ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.3);
      p.vy = 0.2 + Math.random() * 0.7; p.vx = (Math.random() - 0.5) * 0.3; p.r = 0.5 + Math.random() * 1.5;
      p.life = 0; p.max = 220 + Math.random() * 260; p.ph = Math.random() * 6.28;
    };
    for (var i = 0; i < N; i++) { var p = {}; spawn(p, true); parts.push(p); }
    this.level = function (v) { level = v; cv.style.opacity = v; };
    var loop = function () {
      requestAnimationFrame(loop);
      if (!vis || level <= 0.01) return;
      ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
      ctx.globalCompositeOperation = "lighter";
      parts.forEach(function (p) {
        p.life++; p.y -= p.vy; p.ph += 0.03; p.x += p.vx + Math.sin(p.ph) * 0.22;
        if (p.life > p.max) spawn(p, false);
        var a = Math.sin(Math.PI * p.life / p.max), rr = p.r * 4;
        if (a <= 0) return;
        ctx.globalAlpha = a; ctx.drawImage(sprite, p.x - rr, p.y - rr, rr * 2, rr * 2);
      });
      ctx.globalAlpha = 1;
    };
    loop();
  }

  /* ---------- Grain : une tuile de bruit dessinée une seule fois ---------- */
  (function () {
    var g = $(".grain"); if (!g) return;
    try {
      var c = document.createElement("canvas"); c.width = c.height = 160;
      var x = c.getContext("2d"), d = x.createImageData(160, 160);
      for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      g.style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
    } catch (e) {}
  })();

  /* ---------- Démarrage ---------- */
  var stage = $(".film__stage");
  var film = new Film(stage);
  var embers = RM ? null : new Embers($(".film__embers"));

  var loader = $(".loader"), word = $(".loader__word"), cnt = $("[data-count]"), bar = $("[data-bar]");
  var shown = 0, t0 = performance.now(), MIN = RM ? 200 : 1300, isReady = false;
  film.ready.then(function () { isReady = true; });
  var closed = false;
  var tick = function () {
    if (closed) return;
    var time = clamp((performance.now() - t0) / MIN, 0, 1);
    var target = isReady ? 100 : Math.min(90, time * 90);
    shown += (Math.min(target, time * 100) - shown) * 0.16;
    cnt.textContent = String(Math.round(shown)).padStart(3, "0");
    bar.style.transform = "scaleX(" + shown / 100 + ")";
    word.style.setProperty("--fill", shown.toFixed(1) + "%");
    if (isReady && time >= 1 && shown > 98.5) return start();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(function () { if (!closed) start(); }, 6000); // jamais bloqué

  function start() {
    if (closed) return; closed = true;
    W.initScroll();
    W.nav();
    stage.parentNode.classList.add("film--ready");
    if (!W.hasGsap || !window.ScrollTrigger) {
      document.documentElement.classList.add("no-anim");
      if (loader) loader.remove();
      return;
    }
    var tl = gsap.timeline();
    tl.to(loader, { clipPath: "inset(0 0 100% 0)", duration: RM ? 0.01 : 1.05, ease: "expo.inOut", onComplete: function () { loader.remove(); } });
    if (!RM) {
      tl.fromTo(stage, { clipPath: "inset(16% 12% 16% 12% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.7, ease: "expo.inOut", clearProps: "clipPath" }, 0.25)
        .fromTo(".film__canvas", { scale: 1.18 }, { scale: 1, duration: 2.1, ease: "expo.inOut", clearProps: "transform" }, 0.25)
        .to(".hero__title .hl>span", { y: 0, yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 1.15)
        .to("[data-intro-fade]", { opacity: 1, duration: 1, stagger: 0.09, ease: "power2.out" }, 1.4)
        .fromTo(".nav", { yPercent: -100 }, { yPercent: 0, duration: 1, ease: "expo.out" }, 1.3);
    } else {
      gsap.set(".hero__title .hl>span", { yPercent: 0, y: 0 }); gsap.set("[data-intro-fade]", { opacity: 1 });
    }
    W.reveals();
    scrollFilm();
    vows();
    ScrollTrigger.refresh();
  }

  /* Le défilement pilote la vidéo, les chapitres et la barre de progression */
  function scrollFilm() {
    var hero = $(".hero"), meta = $(".film__meta"), barEl = $("[data-film-bar]"), num = $("[data-chap-n]");
    var chaps = $$(".chap").map(function (el) { return { el: el, a: parseFloat(el.dataset.from), b: parseFloat(el.dataset.to) }; });
    var target = 0, cur = 0, lastS = -1;
    var apply = function (v) {
      film.set(v);
      if (embers) embers.level(1 - smooth(0, 0.08, v));
      var h = smooth(0.0, 0.09, v);
      hero.style.opacity = 1 - h;
      hero.style.transform = "translate3d(0," + (-70 * h) + "px,0)";
      hero.style.visibility = h > 0.99 ? "hidden" : "visible";
      var active = 0;
      chaps.forEach(function (c, i) {
        var fin = smooth(c.a, c.a + 0.05, v), fout = c.b > 1 ? 0 : smooth(c.b - 0.04, c.b, v);
        var o = fin * (1 - fout);
        c.el.style.opacity = o;
        c.el.style.visibility = o > 0.01 ? "visible" : "hidden";
        c.el.classList.toggle("on", o > 0.5);
        var y = (1 - fin) * 46 - fout * 46;
        c.el.style.transform = (PORTRAIT ? "" : "translateY(-50%) ") + "translate3d(0," + y + "px,0)";
        if (v >= c.a) active = i + 1;
      });
      meta.style.opacity = smooth(0.08, 0.14, v);
      barEl.style.transform = "scaleX(" + v + ")";
      num.textContent = String(active).padStart(2, "0");
    };
    ScrollTrigger.create({ trigger: ".film", start: "top top", end: "bottom bottom",
      onUpdate: function (s) { target = clamp(s.progress / 0.9, 0, 1); } });
    var nav = $(".nav");
    ScrollTrigger.create({ trigger: ".film", start: "top top", end: "bottom top+=90",
      onToggle: function (s) { nav.classList.toggle("nav--film", s.isActive); } });
    nav.classList.add("nav--film");
    gsap.ticker.add(function () {
      cur += (target - cur) * (RM ? 1 : 0.22);
      if (Math.abs(target - cur) < 0.0004) cur = target;
      if (cur !== lastS) { lastS = cur; apply(cur); }
    });
    apply(0);
  }

  /* Les engagements glissent en sens contraire */
  function vows() {
    if (RM) return;
    $$("[data-drift]").forEach(function (el) {
      var d = parseFloat(el.dataset.drift);
      gsap.fromTo(el, { xPercent: -d * 6 }, { xPercent: d * 6, ease: "none",
        scrollTrigger: { trigger: ".vows", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });
  }
})();
