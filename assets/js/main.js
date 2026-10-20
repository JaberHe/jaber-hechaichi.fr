/* ==========================================================================
   Portfolio · Jaber Hechaichi
   Scripts de la page, sans dépendance. Chaque bloc est indépendant :
   1. Circuit animé et barre de progression au défilement
   2. Lien du menu actif selon la section visible
   3. Bouton « Copier l'email »
   4. Bouton « Réserver un échange » (pop-up Cal.com)
   ========================================================================== */

/* Réglages personnels : à modifier pour réutiliser le site */
var CONFIG = {
  email: 'jaber.hec@gmail.com',
  calLink: 'jaber-hechaichi/echange',   // partie de l'URL après https://cal.com/
  calNamespace: 'echange',
  calColors: { light: '#0a6cff', dark: '#3d8bff' }   // mêmes valeurs que --accent
};


/* 1. Circuit animé et barre de progression
   --------------------------------------------------------------------------
   Une piste verticale de circuit imprimé se remplit de bleu à mesure que l'on
   descend dans la page. Des dérivations s'allument au passage du fluide et la
   puce « DB » s'allume en bas de page. Sous 860 px, le CSS masque le circuit
   et affiche à la place une barre de progression en haut de l'écran.
   -------------------------------------------------------------------------- */
(function () {
  var svg = document.getElementById('circuit');
  if (!svg) return;
  var bar = document.getElementById('progress');
  var NS = 'http://www.w3.org/2000/svg';
  var W = 120;   // largeur du SVG en px, identique à .circuit dans le CSS

  // Points de passage de la piste principale : [x en px, y en fraction de la
  // hauteur d'écran]. Entre deux x différents, un coude à 45° est ajouté.
  var WAY = [[60, 0], [60, .10], [88, .20], [88, .34], [40, .46], [40, .60], [76, .72], [76, .84], [60, .90]];
  // Dérivations : [x de départ, y en fraction de la hauteur, sens (1 droite, -1 gauche)]
  var BRANCHES = [[60, .05, 1], [88, .26, 1], [88, .30, -1], [40, .52, -1], [40, .56, 1], [76, .78, 1], [76, .80, -1]];

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pts, lens, total, branches, chip, head, halo, fill, H;
  var cur = 0, target = 0, ticking = false;

  // Crée un élément SVG avec ses attributs
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  // Convertit une liste de points en attribut "d" de <path>
  function d(p) { return 'M' + p.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L'); }

  // Dessine (ou redessine au redimensionnement) tout le circuit
  function build() {
    H = window.innerHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    var chipTop = Math.round(H * .92);

    // Points de la piste en px, avec les coudes à 45°
    pts = [[WAY[0][0], 0]];
    for (var i = 1; i < WAY.length; i++) {
      var x = WAY[i][0], y = WAY[i][1] * H, px = pts[pts.length - 1][0];
      if (x !== px) pts.push([px, y - Math.abs(x - px)]);
      pts.push([x, y]);
    }
    pts.push([60, chipTop]);

    // Longueur cumulée à chaque point, pour savoir jusqu'où remplir
    lens = [0];
    for (i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    total = lens[lens.length - 1];

    // Dérivations : piste grise, remplissage bleu masqué, pastille au bout
    branches = BRANCHES.map(function (b) {
      var x = b[0], y = b[1] * H, s = b[2], len = s > 0 ? W - 12 - x : x - 12;
      var bp = [[x, y], [x + s * 14, y + 14], [x + s * len, y + 14]];
      var g = el('g', { 'class': 'branch' });
      el('path', { d: d(bp), 'class': 'trace' }, g);
      var bl = 14 * Math.SQRT2 + (len - 14);
      var f = el('path', { d: d(bp), 'class': 'fill', 'stroke-dasharray': bl, 'stroke-dashoffset': bl }, g);
      el('circle', { cx: x + s * len, cy: y + 14, r: 4, 'class': 'pad' }, g);
      return { g: g, f: f, at: lengthAtY(y) / total, on: false };
    });

    // Piste principale. Le remplissage utilise stroke-dasharray/dashoffset :
    // un offset égal à la longueur totale masque tout, 0 affiche tout.
    el('path', { d: d(pts), 'class': 'trace' });
    fill = el('path', { d: d(pts), 'class': 'fill', 'stroke-dasharray': total, 'stroke-dashoffset': total });
    chip = el('rect', { x: 40, y: chipTop, width: 40, height: 26, rx: 3, 'class': 'chip' });
    el('text', { x: 60, y: chipTop + 16.5, 'text-anchor': 'middle', 'class': 'chip-label' }).textContent = 'DB';
    halo = el('circle', { r: 8, 'class': 'head-halo' });
    head = el('circle', { r: 4, 'class': 'head' });
    draw(cur);
  }

  // Longueur de piste parcourue quand le fluide atteint la hauteur y
  function lengthAtY(y) {
    for (var i = 1; i < pts.length; i++) {
      if (pts[i][1] >= y && pts[i][0] === pts[i - 1][0]) return lens[i - 1] + (y - pts[i - 1][1]);
    }
    return total;
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

  // Affiche l'état du circuit pour une progression p entre 0 et 1
  function draw(p) {
    var L = p * total, q = pointAt(L);
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    fill.setAttribute('stroke-dashoffset', total - L);
    head.setAttribute('cx', q[0]); head.setAttribute('cy', q[1]);
    halo.setAttribute('cx', q[0]); halo.setAttribute('cy', q[1]);
    branches.forEach(function (b) {
      var on = p >= b.at;
      if (on !== b.on) {
        b.on = on;
        b.f.setAttribute('stroke-dashoffset', on ? 0 : b.f.getAttribute('stroke-dasharray'));
        b.g.classList.toggle('on', on);
      }
    });
    chip.classList.toggle('on', p > .995);
  }

  // Progression du défilement dans la page, entre 0 et 1
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  }

  // Le fluide rattrape la position de défilement en douceur (12 % de l'écart
  // par image) au lieu de sauter, ce qui donne l'effet de liquide.
  function loop() {
    cur += (target - cur) * .12;
    if (Math.abs(target - cur) < .0005) cur = target;
    draw(cur);
    ticking = cur !== target;
    if (ticking) requestAnimationFrame(loop);
  }
  function onScroll() {
    target = progress();
    if (reduce) { cur = target; draw(cur); return; }   // pas d'animation si l'utilisateur la désactive
    if (!ticking) { ticking = true; requestAnimationFrame(loop); }
  }

  build();
  cur = target = progress();
  draw(cur);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { build(); onScroll(); });
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


/* 3. Bouton « Copier l'email »
   --------------------------------------------------------------------------
   Copie l'adresse dans le presse-papiers, sur ordinateur comme sur téléphone :
   1. API Clipboard moderne ;
   2. sinon, ancienne méthode execCommand('copy') via un champ caché
      (nécessaire sur certains navigateurs mobiles et dans les iframes) ;
   3. en dernier recours, l'adresse est sélectionnée à l'écran.
   -------------------------------------------------------------------------- */
(function () {
  var btn = document.getElementById('copy-mail');
  if (!btn) return;
  var label = btn.textContent;

  function feedback(text) {
    btn.textContent = text;
    btn.classList.add('done');
    setTimeout(function () { btn.textContent = label; btn.classList.remove('done'); }, 2000);
  }

  // Copie via un champ texte temporaire. Le champ est en lecture seule et en
  // 16 px pour éviter que le clavier ou le zoom ne s'ouvrent sur iPhone.
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);   // iOS
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function fallback() {
    if (legacyCopy(CONFIG.email)) { feedback('Email copié'); return; }
    var s = window.getSelection(), rg = document.createRange();
    rg.selectNodeContents(document.getElementById('mail'));
    s.removeAllRanges();
    s.addRange(rg);
    feedback('Adresse sélectionnée');
  }

  btn.addEventListener('click', function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(CONFIG.email).then(function () { feedback('Email copié'); }, fallback);
    } else {
      fallback();
    }
  });
})();


/* 4. Bouton « Réserver un échange »
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
