/* La revue du dessin.

   Un écran peut s'afficher sans erreur et rester mauvais : un texte gris clair sur fond vert
   qu'on ne lit pas au soleil, un bouton de 28 pixels qu'un pouce rate, une phrase coupée en
   plein milieu, une page qui laisse les deux tiers de l'écran vides sur un ordinateur. Rien
   de tout cela ne lève d'exception : il faut le mesurer.

   Ce banc ouvre tous les écrans, à la taille en cours, et regarde quatre choses :

     1. le contraste de chaque texte contre son vrai fond, selon la norme WCAG (4,5:1, ou 3:1
        pour les gros caractères) — c'est ce qui décide si une présidente lit son cahier à midi,
        dehors, sur un écran rayé ;
     2. la taille des cibles tactiles : 40 pixels au moins, sinon le doigt rate ;
     3. les textes coupés par un débordement caché, hors des coupures voulues (…) ;
     4. la part de la largeur réellement occupée, pour repérer les écrans qui laissent du vide.

   Les couleurs sont lues telles que le navigateur les calcule, après le thème : c'est donc le
   contraste réel, pas celui de la feuille de style. */
'use strict';
module.exports = `(() => {
  const lum = c => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const rgb = s => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const melange = (av, ar) => av.c.map((x, i) => x * av.a + ar[i] * (1 - av.a));
  /* le vrai fond d'un élément : on remonte jusqu'à une couleur opaque, en empilant les voiles */
  /* Les bandeaux de marque — la couverture, l'en-tête, la caisse — sont des dégradés. Le banc
     les écartait : « non jugé ». C'était un trou, et c'est justement là que se trouve le texte
     le plus regardé de l'application. On ne peut pas lire un pixel, mais on peut lire les
     arrêts du dégradé : on retient le pire, c'est-à-dire l'arrêt le plus proche de la couleur
     du texte. Une image, elle, reste hors de portée. */
  function arretsDegrade(s) {
    if (/url\\(/.test(s)) return null;                                          // une vraie image : non jugé
    const m = String(s).match(/rgba?\\([^)]+\\)/g);
    if (!m) return null;
    const cs = m.map(rgb).filter(c => c && c.a >= .5).map(c => c.c);
    return cs.length ? cs : null;
  }
  function fond(el) {
    const pile = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const a = arretsDegrade(cs.backgroundImage);
        return a ? { arrets: a } : null;
      }
      const b = rgb(cs.backgroundColor);
      if (b && b.a > 0) { pile.push(b); if (b.a === 1) break; }
    }
    if (!pile.length) return [255, 255, 255];
    let base = pile[pile.length - 1].c;
    for (let i = pile.length - 2; i >= 0; i--) base = melange(pile[i], base);
    return base;
  }
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.1; };

  /* Les aperçus de papier — cartes de membre, livrets — sont dessinés à la taille réelle de
     l'impression : leur petit corps et leurs filets gris appartiennent à la feuille, pas à
     l'écran, et se jugent sur le papier. Le texte réservé à la voix (sr-only) est coupé exprès. */
  const papier = el => !!el.closest('.livret, .livrets, .carte, .cartes, .sr-only');
  const res = { contraste: [], cibles: [], coupes: [], petits: [] };
  const racine = document.querySelector('.shell') || document.body;

  for (const el of racine.querySelectorAll('*')) {
    if (!visible(el) || papier(el)) continue;
    const cs = getComputedStyle(el);
    /* le texte propre à cet élément, pas celui de ses enfants */
    const mot = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (mot) {
      const taille = parseFloat(cs.fontSize), gras = +cs.fontWeight >= 700;
      const ar = fond(el), av = rgb(cs.color);
      if (ar && av) {
        /* sur un dégradé : le pire des arrêts */
        const fonds = ar.arrets || [ar];
        let r = Infinity, pire = fonds[0];
        for (const f of fonds) { const x = ratio(melange(av, f), f); if (x < r) { r = x; pire = f; } }
        const seuil = (taille >= 24 || (taille >= 18.66 && gras)) ? 3 : 4.5;
        if (r < seuil - 0.05) res.contraste.push({ t: mot.slice(0, 38), r: Math.round(r * 100) / 100, seuil, px: Math.round(taille), cl: String(el.className).split(' ')[0] });
      }
      if (taille < 12) res.petits.push({ t: mot.slice(0, 30), px: Math.round(taille * 10) / 10, cl: String(el.className).split(' ')[0] });
    }
    /* un texte coupé par un débordement caché, sans les trois points qui l'annoncent */
    if (cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0
        && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' && mot)
      res.coupes.push({ t: mot.slice(0, 30), de: el.scrollWidth - el.clientWidth, cl: String(el.className).split(' ')[0] });
  }

  if (innerWidth < 500) {
    for (const el of racine.querySelectorAll('button, a[href], input, select, textarea, [data-act]')) {
      if (!visible(el) || papier(el)) continue;
      /* une case à cocher vit dans son étiquette : c'est l'étiquette entière qu'on touche */
      const et = el.closest('label');
      if (et && et !== el && et.getBoundingClientRect().height >= 40) continue;
      /* un lien au fil d'une phrase n'est pas une cible à viser : c'est du texte */
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
      const r = el.getBoundingClientRect();
      if (r.height < 40 || r.width < 32) res.cibles.push({ t: (el.textContent || el.getAttribute('aria-label') || el.outerHTML).trim().replace(/\s+/g, ' ').slice(0, 46), h: Math.round(r.height), w: Math.round(r.width), cl: (String(el.className).split(' ')[0] || el.tagName) + (el.getAttribute('data-act') ? '/' + el.getAttribute('data-act') : '') });
    }
  }

  /* L'ajustement : dans une même rangée de vignettes ou de boutons, tout doit s'aligner.
     Une vignette plus haute que sa voisine, un bouton qui dépasse, une grille dont la dernière
     case est seule et étirée : rien de tout cela n'est une erreur, et tout cela se voit. */
  res.rangs = [];
  for (const g of racine.querySelectorAll('.grid2, .grid3, .vignettes, .tuiles, .list, .liens, .row')) {
    if (!visible(g)) continue;
    const enf = [...g.children].filter(visible);
    if (enf.length < 2) continue;
    const r = enf.map(e => e.getBoundingClientRect());
    /* on ne compare que ce qui est réellement sur la même ligne */
    const lignes = {};
    r.forEach((x, i) => { const cle = Math.round(x.top / 4); (lignes[cle] = lignes[cle] || []).push({ x, e: enf[i] }); });
    for (const cle of Object.keys(lignes)) {
      let l = lignes[cle]; if (l.length < 2) continue;
      /* On ne compare que des cases de même nature : deux vignettes, deux boutons. Une ligne
         « intitulé à gauche, chiffre à droite » n'est pas une rangée mal ajustée, c'est une
         ligne de lecture — ses deux moitiés n'ont aucune raison d'avoir la même hauteur. */
      const par = {};
      l.forEach(o => { const k = String(o.e.className).split(' ')[0] || o.e.tagName; (par[k] = par[k] || []).push(o); });
      const famille = Object.values(par).filter(v => v.length >= 2).sort((a, b) => b.length - a.length)[0];
      if (!famille) continue;
      l = famille;
      const h = l.map(o => o.x.height), hmin = Math.min(...h), hmax = Math.max(...h);
      if (hmax - hmin > 6) res.rangs.push({ cl: String(g.className).split(' ')[0], ecart: Math.round(hmax - hmin), n: l.length,
        t: (l[0].e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 26) });
    }
  }

  /* la part de la largeur occupée : un écran qui laisse la moitié vide sur un ordinateur */
  let large = 0;
  for (const el of racine.querySelectorAll('.main > *, .couv > *, main > *')) { const r = el.getBoundingClientRect(); if (r.width > large) large = r.width; }
  res.largeur = Math.round(large);
  res.part = Math.round(large / innerWidth * 100);
  res.hauteur = Math.round(Math.max(document.body.scrollHeight, racine.scrollHeight));
  return res;
})()`;
