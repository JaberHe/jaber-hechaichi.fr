/* ==========================================================================
   Portfolio · Jaber Hechaichi
   Scripts de la page, sans dépendance. Chaque bloc est indépendant :
   1. Circuit imprimé en fond de page et barre de progression
   2. Lien du menu actif selon la section visible
   3. Bouton « Réserver un échange » (pop-up Cal.com)
   ========================================================================== */

/* Réglages personnels : à modifier pour réutiliser le site */
var CONFIG = {
  calLink: 'jaber-hechaichi/echange',   // partie de l'URL après https://cal.com/
  calNamespace: 'echange',
  calColors: { light: '#0a6cff', dark: '#3d8bff' }   // mêmes valeurs que --accent
};


/* 1. Circuit imprimé en fond de page et barre de progression
   --------------------------------------------------------------------------
   Une piste de circuit imprimé est gravée dans la marge droite, sur toute la
   hauteur de la page : elle part de la puce « SRC » en haut et finit dans la
   puce « DB » en bas. Tout en haut de la page, seule la puce SRC est bleue.
   Au défilement, un liquide bleu descend le long de la piste, au rythme de la
   lecture, et atteint la puce DB en bas de page.
   Sous 860 px, le CSS masque le circuit et affiche une barre de progression.
   -------------------------------------------------------------------------- */
(function () {
  var svg = document.getElementById('circuit');
  if (!svg) return;
  var bar = document.getElementById('progress');
  var NS = 'http://www.w3.org/2000/svg';
  var W = 160;                                   // largeur du circuit en px (identique au CSS)
  var LANES = [104, 64, 120, 80, 48, 96, 72];    // colonne de la piste pour chaque section
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pts, lens, total, chip, fill, glow, maskPath, head, halo;
  var cur = 0, target = 0, ticking = false, lastH = 0;

  // Crée un élément SVG avec ses attributs
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  // Convertit une liste de points en attribut "d" de <path>
  function d(p) { return 'M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L'); }
  // Position d'un élément depuis le haut du document
  function docTop(node) { return node.getBoundingClientRect().top + window.scrollY; }

  // Ajoute un changement de colonne vers x2 avec un coude à 45°, à partir de y
  function jog(p, x2, y) {
    var x1 = p[p.length - 1][0];
    if (x1 === x2) return;
    p.push([x1, y]);
    p.push([x2, y + Math.abs(x2 - x1)]);
  }

  // Puce avec ses broches latérales et une étiquette
  function ic(cx, cy, w, h, label) {
    var g = el('g', { 'class': 'ic' });
    for (var i = 0; i < 4; i++) {
      var py = cy - h / 2 + 7 + i * ((h - 14) / 3);
      el('line', { x1: cx - w / 2 - 6, y1: py, x2: cx - w / 2, y2: py, 'class': 'leg' }, g);
      el('line', { x1: cx + w / 2, y1: py, x2: cx + w / 2 + 6, y2: py, 'class': 'leg' }, g);
    }
    el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 3, 'class': 'ic-body' }, g);
    el('text', { x: cx, y: cy + 3, 'text-anchor': 'middle', 'class': 'ic-label' }, g).textContent = label;
    return g;
  }

  // Dessine (ou redessine si la hauteur de la page change) tout le circuit
  function build() {
    var H = document.documentElement.scrollHeight;
    lastH = H;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('height', H);
    svg.innerHTML = '';

    // Lueur floue, et masque qui limite les reflets à la partie déjà remplie
    var defs = el('defs', {});
    var f = el('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: 4 }, f);
    var mask = el('mask', { id: 'filled', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);

    // Tracé : une colonne par section, coude à 45° avant chaque nouvelle section
    var marks = [].slice.call(document.querySelectorAll('main > section')).map(docTop);
    var srcY = 150, dbY = H - 144;
    pts = [[LANES[0], srcY + 22]];
    marks.forEach(function (y, i) {
      if (i === 0) return;
      var last = pts[pts.length - 1], x2 = LANES[i % LANES.length];
      jog(pts, x2, Math.max(last[1] + 20, y - 40 - Math.abs(x2 - last[0])));
    });
    jog(pts, 80, dbY - 96);
    pts.push([80, dbY - 26]);

    // Longueur cumulée à chaque point, pour savoir jusqu'où remplir
    lens = [0];
    for (var i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    total = lens[lens.length - 1];

    // Piste gravée grise, puis liquide. Le remplissage utilise
    // stroke-dasharray/dashoffset : offset = longueur totale masque tout, 0 affiche tout.
    var path = d(pts);
    el('path', { d: path, 'class': 'trace channel' });
    el('path', { d: path, 'class': 'trace main' });
    glow = el('path', { d: path, 'class': 'liquid-glow', 'stroke-dasharray': total, 'stroke-dashoffset': total, filter: 'url(#glow)' });
    fill = el('path', { d: path, 'class': 'liquid', 'stroke-dasharray': total, 'stroke-dashoffset': total });
    maskPath = el('path', { d: path, stroke: '#fff', 'stroke-width': 8, fill: 'none', 'stroke-dasharray': total, 'stroke-dashoffset': total }, mask);
    el('path', { d: path, 'class': 'flow', mask: 'url(#filled)' });   // reflets qui s'écoulent

    // Puce source (toujours bleue) et puce base de données (bleue à l'arrivée)
    ic(LANES[0], srcY, 40, 44, 'SRC').classList.add('on');
    chip = ic(80, dbY, 52, 52, 'DB');

    // Tête du liquide : une goutte avec un halo
    halo = el('circle', { r: 11, 'class': 'head-halo', filter: 'url(#glow)' });
    head = el('circle', { r: 4.5, 'class': 'head' });
    draw(cur);
  }

  // Coordonnées du point situé à la longueur L sur la piste
  function pointAt(L) {
    for (var i = 1; i < lens.length; i++) {
      if (lens[i] >= L) {
        var t = (L - lens[i - 1]) / ((lens[i] - lens[i - 1]) || 1);
        return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
      }
    }
    return pts[pts.length - 1];
  }

  // Progression du défilement, entre 0 (haut de page) et 1 (bas de page)
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  }

  // Affiche le circuit rempli sur une proportion p de sa longueur
  function draw(p) {
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    var L = p * total, off = total - L, q = pointAt(L);
    fill.setAttribute('stroke-dashoffset', off);
    glow.setAttribute('stroke-dashoffset', off);
    maskPath.setAttribute('stroke-dashoffset', off);
    head.setAttribute('cx', q[0]); head.setAttribute('cy', q[1]);
    halo.setAttribute('cx', q[0]); halo.setAttribute('cy', q[1]);
    var visible = p > .002 ? '' : 'none';           // pas de goutte tant que rien n'a coulé
    head.style.display = halo.style.display = visible;
    chip.classList.toggle('on', p > .998);
  }

  // Le liquide rattrape la position de défilement en douceur, image par image
  function loop() {
    cur += (target - cur) * .1;
    if (Math.abs(target - cur) < .0005) cur = target;
    draw(cur);
    ticking = cur !== target;
    if (ticking) requestAnimationFrame(loop);
  }
  function update() {
    target = progress();
    if (reduce) { cur = target; draw(cur); return; }   // pas d'animation si l'utilisateur la désactive
    if (!ticking) { ticking = true; requestAnimationFrame(loop); }
  }

  build();
  cur = target = progress();
  draw(cur);
  window.addEventListener('scroll', update, { passive: true });
  // Redessine si la hauteur de la page change (redimensionnement, polices chargées)
  function rebuildIfNeeded() { if (document.documentElement.scrollHeight !== lastH) { build(); update(); } }
  window.addEventListener('resize', rebuildIfNeeded);
  if (document.fonts) document.fonts.ready.then(rebuildIfNeeded);
  window.addEventListener('load', rebuildIfNeeded);
})();


/* 2. Lien du menu actif
   --------------------------------------------------------------------------
   Met en évidence dans le menu la section qui occupe le milieu de l'écran.
   -------------------------------------------------------------------------- */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var links = {};
  document.querySelectorAll('nav ul a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var a = links[e.target.id];
      if (a && e.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
        a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });   // bande de 5 % au milieu de l'écran

  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
})();


/* 3. Bouton « Réserver un échange »
   --------------------------------------------------------------------------
   Ouvre le calendrier Cal.com en pop-up. Le script Cal.com n'est chargé qu'au
   premier clic, pour garder la page légère. Si le script ne se charge pas
   (bloqueur, réseau), la page Cal.com s'ouvre dans un nouvel onglet.
   Ctrl/Cmd/Maj + clic garde le comportement normal du lien.
   -------------------------------------------------------------------------- */
(function () {
  var book = document.getElementById('book');
  if (!book) return;

  // Code d'intégration officiel de Cal.com, avec en plus le repli onerror
  function loadCal(fallbackUrl) {
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) {
          cal.ns = {}; cal.q = cal.q || [];
          var s = d.createElement('script');
          s.src = A;
          s.onerror = function () { window.open(fallbackUrl, '_blank', 'noopener'); };
          d.head.appendChild(s);
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); }, ns = ar[1];
          api.q = api.q || [];
          if (typeof ns === 'string') { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ['initNamespace', ns]); }
          else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    Cal('init', CONFIG.calNamespace, { origin: 'https://cal.com' });
    Cal.ns[CONFIG.calNamespace]('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
      cssVarsPerTheme: { light: { 'cal-brand': CONFIG.calColors.light }, dark: { 'cal-brand': CONFIG.calColors.dark } }
    });
  }

  book.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (!window.Cal) loadCal(book.href);
    Cal.ns[CONFIG.calNamespace]('modal', { calLink: CONFIG.calLink, config: { layout: 'month_view' } });
  });
})();
