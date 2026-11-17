/* Section « Concepts » de Weskale Studio : cartes construites depuis sites.js,
   filtre par univers, apparitions du site, survol des cartes. Sans dépendance.
   Textes en français ou en anglais selon <html lang>. */
(function () {
  "use strict";

  var racine = document.getElementById("concepts");
  if (!racine) return;

  var SITES = window.WESKALE_SITES || [];
  var UNIVERS = window.WESKALE_UNIVERS || [];
  var REFONTE = window.WESKALE_EN_REFONTE || [];
  var BASE = racine.getAttribute("data-base") || "";
  var VIGN = racine.getAttribute("data-vignettes") || "_galerie/vignettes/";
  var DOUX = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FIN = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* Langue de la page : français si <html lang> commence par « fr », anglais sinon. */
  var FR = /^fr/i.test(document.documentElement.lang || "");
  var T = FR ? {
    tout: "Tout", univers: "univers", concept: " concept", concepts: " concepts",
    refonte: "en refonte", ouvrir: "Ouvrir le site", onglet: ". S'ouvre dans un nouvel onglet"
  } : {
    tout: "All", univers: "sector", concept: " concept", concepts: " concepts",
    refonte: "being redesigned", ouvrir: "Open the site", onglet: ". Opens in a new tab"
  };
  function tr(o, champ) {
    var v = !FR && o[champ + "_en"] != null ? o[champ + "_en"] : o[champ];
    return v == null ? "" : v;
  }

  racine.classList.add("wk-js");

  function el(tag, classe, texte) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }
  function fleche() {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 12 12");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M3 9 9 3M4 3h5v5");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "1.6");
    svg.appendChild(p);
    return svg;
  }
  function deux(n) { return (n < 10 ? "0" : "") + n; }
  function q(nom) { return racine.querySelector('[data-wk="' + nom + '"]'); }
  function chaque(liste, f) { Array.prototype.forEach.call(liste, f); }

  /* Titre au style du site : le dernier mot en italique serif, puis un point. */
  function titre(parent, nom) {
    var mots = nom.split(" ");
    if (mots.length === 1) { parent.textContent = nom + "."; return; }
    var fin = mots.pop();
    parent.appendChild(document.createTextNode(mots.join(" ") + " "));
    parent.appendChild(el("em", null, fin));
    parent.appendChild(document.createTextNode("."));
  }

  /* Tailles dans la grille de 12 colonnes, selon le nombre de sites. */
  function tailles(n) {
    var motifs = [[7, 5], [4, 4, 4], [5, 7], [4, 4, 4]];
    var out = [], i = 0;
    if (n === 1) return [12];
    while (out.length < n) {
      var reste = n - out.length;
      var m = motifs[i++ % motifs.length];
      if (reste >= m.length) { out = out.concat(m); continue; }
      out = out.concat(reste === 1 ? [12] : reste === 2 ? [5, 7] : m.slice(0, reste));
    }
    return out;
  }

  /* Cohérence de sites.js, visible dans la console. */
  var connus = {}, slugs = {};
  UNIVERS.forEach(function (u) { connus[u.id] = true; });
  SITES.forEach(function (s) {
    slugs[s.slug] = true;
    if (!connus[s.univers]) console.warn("Concepts : univers inconnu pour " + s.slug + " : " + s.univers);
  });
  REFONTE.forEach(function (s) { if (!slugs[s]) console.warn("Concepts : " + s + " est en refonte mais absent de la liste."); });

  var groupes = UNIVERS.map(function (u) {
    return { u: u, sites: SITES.filter(function (s) { return s.univers === u.id; }) };
  }).filter(function (g) { return g.sites.length; });

  /* Construction */
  var conteneur = q("univers");
  var sections = [], cartes = [], rang = 0;
  var total = SITES.length;

  groupes.forEach(function (g, gi) {
    var sec = el("section", "wk-univers");
    sec.id = "concepts-" + g.u.id;
    sec.setAttribute("data-univers", g.u.id);
    sec.setAttribute("aria-labelledby", "wk-u-" + g.u.id);

    sec.appendChild(el("span", "wk-pastille", T.univers + " " + deux(gi + 1) + " / " + deux(groupes.length)));
    var tete = el("div", "wk-tete");
    var h3 = el("h3");
    h3.id = "wk-u-" + g.u.id;
    h3.setAttribute("data-wk-mots", "");
    titre(h3, tr(g.u, "nom"));
    tete.appendChild(h3);
    tete.appendChild(el("p", "wk-mono wk-rev", deux(g.sites.length) + (g.sites.length > 1 ? T.concepts : T.concept)));
    sec.appendChild(tete);

    var grille = el("ul", "wk-grille");
    var tl = tailles(g.sites.length);
    g.sites.forEach(function (s, i) {
      rang++;
      var refonte = REFONTE.indexOf(s.slug) !== -1;
      var marque = tr(s, "marque"), metier = tr(s, "metier"), lieu = tr(s, "lieu");
      var li = el("li", "wk-item wk-rev wk-item--g" + tl[i]);
      if (g.sites.length % 2 === 1 && i === g.sites.length - 1) li.classList.add("wk-item--seul");
      li.style.transitionDelay = Math.min(i, 4) * 35 + "ms";

      var a = el("a", "wk-carte");
      a.href = BASE + s.slug + "/index.html";
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", marque + ", " + metier + (lieu ? ", " + lieu : "") +
        (refonte ? ", " + T.refonte : "") + T.onglet);

      var nv = el("div", "wk-nv");
      nv.setAttribute("aria-hidden", "true");
      nv.appendChild(el("i")); nv.appendChild(el("i")); nv.appendChild(el("i"));
      nv.appendChild(el("span", null, s.slug));
      if (refonte) nv.appendChild(el("b", "wk-refonte", T.refonte));
      a.appendChild(nv);

      var ecran = el("div", "wk-ecran");
      var img = el("img");
      img.src = VIGN + s.slug + ".webp";
      img.alt = "";
      img.width = 900;
      img.height = 502;
      img.decoding = "async";
      if (gi > 0) img.loading = "lazy";
      ecran.appendChild(img);
      var ouvrir = el("span", "wk-ouvrir", T.ouvrir);
      ouvrir.setAttribute("aria-hidden", "true");
      ouvrir.appendChild(fleche());
      ecran.appendChild(ouvrir);
      a.appendChild(ecran);

      var tx = el("div", "wk-texte");
      tx.appendChild(el("span", "wk-num", deux(rang) + " / " + deux(total)));
      tx.appendChild(el("h4", null, marque));
      var meta = el("p", "wk-meta", metier);
      if (lieu) meta.appendChild(el("span", null, lieu));
      tx.appendChild(meta);
      var f = el("span", "wk-fleche");
      f.setAttribute("aria-hidden", "true");
      f.appendChild(fleche());
      tx.appendChild(f);
      a.appendChild(tx);

      li.appendChild(a);
      grille.appendChild(li);
      cartes.push(li);
    });
    sec.appendChild(grille);
    conteneur.appendChild(sec);
    sections.push(sec);
  });

  /* Mots des titres : apparition mot par mot, comme [data-mots] sur le site. */
  chaque(racine.querySelectorAll("[data-wk-mots]"), function (h) {
    var k = 0;
    (function coupe(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (m) {
            if (!m) return;
            if (/^\s+$/.test(m)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = el("span", "wk-mot", m);
            s.style.transitionDelay = (k++ * 16) + "ms";
            frag.appendChild(s);
          });
          c.parentNode.replaceChild(frag, c);
        } else coupe(c);
      });
    })(h);
  });

  /* Apparitions au défilement, avec rattrapage si l'on saute plus vite que l'observateur. */
  var blocs = Array.prototype.slice.call(racine.querySelectorAll(".wk-rev, [data-wk-mots]"));
  function montre(n) { n.classList.add("vu"); }
  if (DOUX || !("IntersectionObserver" in window)) {
    blocs.forEach(montre);
  } else {
    var oeil = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { montre(e.target); oeil.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: "0px 0px 14% 0px" });
    blocs.forEach(function (b) { oeil.observe(b); });
    var attend = false;
    window.addEventListener("scroll", function () {
      if (attend) return;
      attend = true;
      requestAnimationFrame(function () {
        attend = false;
        blocs.forEach(function (b) {
          if (!b.classList.contains("vu") && !b.closest("[hidden]") && b.getBoundingClientRect().top < innerHeight * 1.14) montre(b);
        });
      });
    }, { passive: true });
  }

  /* Filtre par univers */
  var listePuces = q("puces");
  var compte = q("compte");
  function puce(id, nom, n) {
    var li = el("li");
    var b = el("button", "wk-ong", nom + " ");
    b.type = "button";
    b.setAttribute("data-filtre", id);
    b.setAttribute("aria-pressed", id === "tout" ? "true" : "false");
    b.appendChild(el("b", null, deux(n)));
    li.appendChild(b);
    listePuces.appendChild(li);
    return b;
  }
  var puces = [puce("tout", T.tout, total)].concat(groupes.map(function (g) {
    return puce(g.u.id, tr(g.u, "court") || tr(g.u, "nom"), g.sites.length);
  }));

  function afficheCompte(n) {
    compte.textContent = "";
    compte.appendChild(el("b", null, deux(n)));
    compte.appendChild(document.createTextNode(" / " + deux(total) + T.concepts));
  }
  afficheCompte(total);

  function applique(id) {
    var n = 0;
    sections.forEach(function (sec) {
      var garde = id === "tout" || sec.getAttribute("data-univers") === id;
      sec.hidden = !garde;
      if (garde) {
        n += sec.querySelectorAll(".wk-item").length;
        chaque(sec.querySelectorAll(".wk-rev, [data-wk-mots]"), montre);
      }
    });
    puces.forEach(function (p) { p.setAttribute("aria-pressed", p.getAttribute("data-filtre") === id ? "true" : "false"); });
    afficheCompte(n);
  }
  var filtre = racine.querySelector(".wk-filtre");
  puces.forEach(function (p) {
    p.addEventListener("click", function () {
      if (p.getAttribute("aria-pressed") === "true") return;
      applique(p.getAttribute("data-filtre"));
      var haut = conteneur.getBoundingClientRect().top + window.pageYOffset - (parseFloat(getComputedStyle(filtre).top) || 0) - filtre.offsetHeight - 10;
      if (window.pageYOffset > haut) window.scrollTo({ top: haut, behavior: DOUX ? "auto" : "smooth" });
      var cible = p.offsetLeft - (listePuces.clientWidth - p.offsetWidth) / 2;
      listePuces.scrollTo({ left: Math.max(0, cible), behavior: DOUX ? "auto" : "smooth" });
    });
  });

  /* Un lien vers un univers masqué par le filtre réaffiche tout avant de défiler. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#concepts-"]');
    if (!a) return;
    var cible = document.getElementById(a.getAttribute("href").slice(1));
    if (cible && cible.hidden) applique("tout");
  });

  /* Survol : l'image glisse doucement à l'opposé du pointeur. */
  if (FIN && !DOUX) {
    cartes.forEach(function (li) {
      var ecran = li.querySelector(".wk-ecran");
      var img = ecran.querySelector("img");
      var image = 0;
      ecran.addEventListener("pointermove", function (e) {
        var r = ecran.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (image) cancelAnimationFrame(image);
        image = requestAnimationFrame(function () {
          img.style.setProperty("--wk-px", ((0.5 - x) * 14).toFixed(1) + "px");
          img.style.setProperty("--wk-py", ((0.5 - y) * 10).toFixed(1) + "px");
        });
      });
      ecran.addEventListener("pointerleave", function () {
        if (image) cancelAnimationFrame(image);
        img.style.setProperty("--wk-px", "0px");
        img.style.setProperty("--wk-py", "0px");
      });
    });
  }

  window.WESKALE_CONCEPTS = { total: total, univers: groupes.length, refonte: REFONTE.filter(function (s) { return slugs[s]; }).length };
})();
