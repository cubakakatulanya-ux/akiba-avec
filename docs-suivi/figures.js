/* Les figures du guide : des dessins, pas des photos.

   Un guide qui n'a que du texte se lit mal quand on cherche un chemin — où va le cahier, dans
   quel ordre se tient une séance, ce que personne ne peut faire. Ces figures sont écrites en
   SVG, à l'intérieur de la page : elles ne pèsent rien, elles ne demandent aucun réseau, elles
   restent nettes sur n'importe quel écran, et elles prennent les couleurs du thème — fond
   clair ou fond sombre — parce qu'elles n'utilisent que les variables de la feuille de style.

   Chaque figure porte un titre lisible par la voix : ce n'est pas une image muette. */
'use strict';

const FIG = {};

/* le cadre commun : une boîte qui respire, avec son titre dessous */
const figCadre = (titre, w, h, corps) => `<figure class="fig">
  <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(titre)}" preserveAspectRatio="xMidYMid meet">${corps}</svg>
  <figcaption>${esc(titre)}</figcaption></figure>`;

const fBoite = (x, y, w, h, t, s, fort) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="${fort ? 'f-b2' : 'f-b'}"/>
  <text x="${x + w / 2}" y="${y + (s ? h / 2 - 6 : h / 2 + 6)}" text-anchor="middle" class="f-t">${t}</text>
  ${s ? `<text x="${x + w / 2}" y="${y + h / 2 + 16}" text-anchor="middle" class="f-s">${s}</text>` : ''}`;
const fFleche = (x1, y1, x2, y2, t, or) => `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${or ? 'f-l2' : 'f-l'}" marker-end="url(#${or ? 'fp2' : 'fp'})"/>
  ${t ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" class="${or ? 'f-e2' : 'f-e'}">${t}</text>` : ''}`;
const fNum = (x, y, n) => `<circle cx="${x}" cy="${y}" r="14" class="f-n"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="f-nt">${n}</text>`;

/* 1 — où vit le cahier */
FIG.cahier = () => figCadre('Où vit le cahier, et comment il voyage', 760, 300, `
  ${fBoite(10, 40, 220, 92, 'Akiba Suivi', 'l’animateur crée l’AVEC')}
  ${fBoite(270, 40, 220, 92, 'Akiba', 'le téléphone du groupe', true)}
  ${fBoite(530, 40, 220, 92, 'Akiba Suivi', 'l’organisation suit')}
  ${fFleche(234, 72, 266, 72, 'image', true)}
  ${fFleche(234, 108, 266, 108, 'fichier')}
  ${fFleche(526, 86, 494, 86, '')}
  <text x="510" y="146" text-anchor="middle" class="f-s">la séance, en images</text>
  ${fBoite(270, 196, 220, 76, 'Le journal scellé', 'une seule copie vivante')}
  ${fFleche(380, 136, 380, 192, '')}
  <text x="380" y="292" text-anchor="middle" class="f-s">Un seul téléphone tient le cahier à la fois.</text>`);

/* 2 — la réunion en huit étapes */
FIG.etapes = () => figCadre('La réunion, en huit étapes', 760, 230, `
  ${['Présences', 'Comptage', 'Sociale', 'Épargne'].map((t, i) => {
    const x = 10 + i * 190;
    return `${fBoite(x, 24, 160, 62, '', '')}${fNum(x + 26, 55, i + 1)}
      <text x="${x + 52}" y="61" class="f-t2">${t}</text>
      ${i < 3 ? fFleche(x + 164, 55, x + 186, 55, '') : ''}`;
  }).join('')}
  ${['Rembours.', 'Crédits', 'Amendes', 'Clôture'].map((t, i) => {
    const x = 10 + i * 190;
    return `${fBoite(x, 128, 160, 62, '', '', i === 3)}${fNum(x + 26, 159, i + 5)}
      <text x="${x + 52}" y="165" class="f-t2">${t}</text>
      ${i < 3 ? fFleche(x + 164, 159, x + 186, 159, '') : ''}`;
  }).join('')}
  <path d="M 700 88 L 700 107 L 36 107 L 36 124" class="f-l f-pointille" marker-end="url(#fp)"/>
  <text x="380" y="220" text-anchor="middle" class="f-s">Aucune étape qui engage de l’argent ne se saute.</text>`);

/* 3 — les trois poches */
FIG.poches = () => figCadre('Les trois poches de la caisse', 760, 300, `
  ${[['Caisse de crédit', 'se prête · se partage'], ['Caisse sociale', 'ne se prête pas'], ['Dépôts du guichet', 'ne se prêtent jamais']]
    .map((v, i) => { const x = 10 + i * 253;
      return `${fBoite(x, 30, 233, 96, v[0], v[1], i === 0)}`; }).join('')}
  ${fFleche(126, 132, 300, 186, '')}
  ${fFleche(380, 132, 380, 186, '')}
  ${fFleche(636, 132, 462, 186, '')}
  ${fBoite(250, 190, 260, 70, 'ARGENT DANS LA CAISSE', 'la somme des trois', true)}
  <text x="380" y="288" text-anchor="middle" class="f-s">L’argent déposé au guichet n’est jamais prêté.</text>`);

/* 4 — le journal scellé */
FIG.journal = () => figCadre('Pourquoi une écriture ne peut pas être changée', 760, 210, `
  ${[1, 2, 3, 4].map((n, i) => { const x = 20 + i * 185;
    return `${fBoite(x, 24, 150, 78, '', '', false)}
      <text x="${x + 75}" y="52" text-anchor="middle" class="f-t2">écriture n°${n}</text>
      <text x="${x + 75}" y="76" text-anchor="middle" class="${i === 2 ? 'f-alerte' : 'f-s'}">${i === 2 ? '9c1f… ✗' : ['7a40…', 'b2e8…', '', 'd071…'][i]}</text>
      ${i < 3 ? fFleche(x + 154, 63, x + 180, 63, '') : ''}`; }).join('')}
  <text x="380" y="142" text-anchor="middle" class="f-t2">Chaque empreinte dépend de la ligne et de celle d’avant.</text>
  <text x="380" y="176" text-anchor="middle" class="f-alerte">Changer la troisième casse toutes les suivantes — et Akiba le dit.</text>`);

/* 5 — qui peut quoi */
FIG.droits = () => figCadre('Qui peut quoi', 760, 250, `
  ${[['Un membre', 'son compte,\nson livret'], ['Le bureau', 'la réunion,\nles crédits'], ['L’animateur', 'crée, remet,\nconsulte'], ['L’organisation', 'valide, exporte,\ndébloque']]
    .map((v, i) => { const x = 10 + i * 190;
      return `${fBoite(x, 24, 170, 104, '', '', i === 1)}
        <text x="${x + 85}" y="56" text-anchor="middle" class="f-t">${v[0]}</text>
        ${v[1].split('\n').map((l, j) => `<text x="${x + 85}" y="${84 + j * 20}" text-anchor="middle" class="f-s">${l}</text>`).join('')}`; }).join('')}
  <text x="380" y="172" text-anchor="middle" class="f-alerte">Ce que personne ne peut faire</text>
  <text x="380" y="202" text-anchor="middle" class="f-s">Sortir l’argent d’un autre · modifier une séance scellée · effacer une écriture</text>
  <text x="380" y="228" text-anchor="middle" class="f-s">Accorder un crédit seul · partager avec des crédits dehors</text>`);

/* 6 — que faire si */
FIG.sifaute = () => figCadre('Que faire si le téléphone refuse un geste', 760, 300, `
  ${fBoite(250, 14, 260, 54, 'Le téléphone refuse', '', true)}
  ${fFleche(380, 72, 380, 96, '')}
  ${fBoite(230, 100, 300, 50, 'Akiba affiche-t-il un message ?', '')}
  <path d="M 230 125 L 150 125 L 150 166" class="f-l" marker-end="url(#fp)"/>
  <text x="186" y="116" text-anchor="middle" class="f-e">oui</text>
  <path d="M 530 125 L 610 125 L 610 166" class="f-l2" marker-end="url(#fp2)"/>
  <text x="576" y="116" text-anchor="middle" class="f-e2">non</text>
  ${fBoite(10, 170, 280, 110, '', '')}
  <text x="150" y="200" text-anchor="middle" class="f-t2">Cherchez-le dans</text>
  <text x="150" y="226" text-anchor="middle" class="f-t2">« Un message vous bloque »</text>
  <text x="150" y="256" text-anchor="middle" class="f-s">quinze messages y sont expliqués</text>
  ${fBoite(470, 170, 280, 110, '', '')}
  <text x="610" y="196" text-anchor="middle" class="f-t2">Vérifiez dans cet ordre</text>
  <text x="610" y="222" text-anchor="middle" class="f-s">qui est connecté · une séance</text>
  <text x="610" y="244" text-anchor="middle" class="f-s">ouverte · le groupe validé</text>
  <text x="610" y="266" text-anchor="middle" class="f-s">la date du téléphone</text>`);

/* Une capture de l'écran réel, prise sur l'application elle-même et rangée à côté du code :
   elle s'affiche sans réseau, comme le reste du guide. Elle est volontairement petite —
   quelques dizaines de kilooctets — parce qu'elle voyage dans un terminal de village. */
FIG.photo = (fichier, legende) => `<figure class="fig fig-photo">
  <img src="${fichier}" alt="${esc(legende)}" loading="lazy" decoding="async">
  <figcaption>${esc(legende)}</figcaption></figure>`;

/* les pointes de flèche, posées une seule fois dans la page */
function figDefs() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <marker id="fp" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" class="f-pointe"/></marker>
    <marker id="fp2" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" class="f-pointe2"/></marker>
  </defs></svg>`;
}
