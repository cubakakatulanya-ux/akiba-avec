/* Les schémas du manuel, dessinés en SVG et rendus en image par un navigateur sans fenêtre.

   Un manuel qui n'a que des captures d'écran montre des boutons ; il n'explique pas le chemin.
   Ces sept dessins portent ce qu'aucune capture ne montre : où va le cahier, dans quel ordre,
   qui a le droit de quoi, et que faire quand ça coince. */
'use strict';

const VERT = '#0F4D3A', VERT2 = '#2E7D5B', OR = '#F2B705', ENCRE = '#1B2A24', GRIS = '#5C6B64',
  DOUX = '#D5E7DD', CLAIR = '#F1F6F2', LIGNE = '#D7DED9', ROUGE = '#A92C1A', AMBRE = '#A05A00';

/* briques communes */
const boite = (x, y, w, h, titre, sous, fond, bord, couleurTitre) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fond || '#fff'}" stroke="${bord || LIGNE}" stroke-width="2"/>
  <text x="${x + w / 2}" y="${y + (sous ? h / 2 - 8 : h / 2 + 7)}" text-anchor="middle" font-size="21" font-weight="700" fill="${couleurTitre || ENCRE}">${titre}</text>
  ${sous ? `<text x="${x + w / 2}" y="${y + h / 2 + 18}" text-anchor="middle" font-size="16" fill="${GRIS}">${sous}</text>` : ''}`;
const fleche = (x1, y1, x2, y2, texte, couleur, dessous) => {
  const c = couleur || VERT2;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3" marker-end="url(#pointe${c === VERT2 ? '' : c === OR ? 'Or' : 'Rouge'})"/>
  ${texte ? `<text x="${mx}" y="${my + (dessous ? 26 : -12)}" text-anchor="middle" font-size="16" font-weight="600" fill="${c}">${texte}</text>` : ''}`;
};
const pastille = (x, y, n) => `<circle cx="${x}" cy="${y}" r="17" fill="${OR}"/>
  <text x="${x}" y="${y + 7}" text-anchor="middle" font-size="18" font-weight="700" fill="${ENCRE}">${n}</text>`;

const page = (w, h, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;padding:0;background:#fff}svg{display:block;font-family:Ubuntu,system-ui,sans-serif}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <marker id="pointe" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 z" fill="${VERT2}"/></marker>
  <marker id="pointeOr" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 z" fill="${OR}"/></marker>
  <marker id="pointeRouge" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto"><path d="M0,0 L9,4 L0,8 z" fill="${ROUGE}"/></marker>
</defs>
${corps}</svg></body></html>`;

module.exports = [

/* 1 — où vit le cahier, et comment il voyage */
['ou-vit-le-cahier', page(1000, 430, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">Où vit le cahier, et comment il voyage</text>
  ${boite(40, 90, 260, 110, 'Akiba Suivi', 'l’animateur crée l’AVEC', CLAIR, LIGNE, VERT)}
  ${boite(370, 90, 260, 110, 'Akiba', 'le téléphone du groupe', DOUX, VERT2, VERT)}
  ${boite(700, 90, 260, 110, 'Akiba Suivi', 'l’organisation suit', CLAIR, LIGNE, VERT)}
  ${fleche(305, 130, 365, 130, 'image', OR)}
  ${fleche(305, 168, 365, 168, 'fichier')}
  ${fleche(695, 145, 635, 145, '')}
  <text x="665" y="124" text-anchor="middle" font-size="13" font-weight="700" fill="${VERT2}">la séance</text>
  <text x="665" y="176" text-anchor="middle" font-size="13" fill="${GRIS}">en images</text>
  ${boite(370, 260, 260, 100, 'Le journal scellé', 'une seule copie vivante', '#fff', VERT, VERT)}
  ${fleche(500, 205, 500, 255, '')}
  <text x="500" y="392" text-anchor="middle" font-size="16" fill="${GRIS}">Un seul téléphone tient le cahier à la fois. Les autres en gardent une copie à consulter.</text>
  <text x="170" y="236" text-anchor="middle" font-size="15" fill="${GRIS}">crée, puis remet</text>
  <text x="830" y="236" text-anchor="middle" font-size="15" fill="${GRIS}">reçoit, n’écrit pas</text>
`)],

/* 2 — la réunion en huit étapes */
['huit-etapes', page(1000, 330, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">La réunion, en huit étapes</text>
  ${['Présences', 'Comptage', 'Caisse sociale', 'Épargne'].map((t, i) => {
    const x = 40 + i * 240;
    return `${boite(x, 70, 200, 78, '', '', CLAIR)}${pastille(x + 32, 109, i + 1)}
      <text x="${x + 60}" y="${116}" font-size="17" font-weight="600" fill="${ENCRE}">${t}</text>
      ${i < 3 ? fleche(x + 205, 109, x + 235, 109, '') : ''}`;
  }).join('')}
  ${['Remboursements', 'Crédits', 'Amendes', 'Clôture à 3 clés'].map((t, i) => {
    const x = 40 + i * 240;
    return `${boite(x, 190, 200, 78, '', '', i === 3 ? DOUX : CLAIR, i === 3 ? VERT2 : LIGNE)}${pastille(x + 32, 229, i + 5)}
      <text x="${x + 60}" y="${236}" font-size="${t.length > 13 ? 15 : 17}" font-weight="600" fill="${ENCRE}">${t}</text>
      ${i < 3 ? fleche(x + 205, 229, x + 235, 229, '') : ''}`;
  }).join('')}
  <path d="M 140 148 L 140 161 L 760 161" fill="none" stroke="${VERT2}" stroke-width="0" />
  <path d="M 940 148 L 940 169 L 140 169 L 140 184" fill="none" stroke="${VERT2}" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#pointe)"/>
  <text x="500" y="308" text-anchor="middle" font-size="16" fill="${GRIS}">Aucune étape qui engage de l’argent ne se saute. Une séance interrompue se reprend là où elle s’est arrêtée.</text>
`)],

/* 3 — la vie d'un cycle */
['vie-du-cycle', page(1000, 300, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">La vie d’un cycle, de la création au partage</text>
  ${[['Création', 'avec l’assemblée'], ['Validation', 'par l’organisation'], ['Réunions', 'chaque semaine'], ['Partage', 'tout est rendu'], ['Cycle suivant', 'règles reconduites']].map((v, i) => {
    const x = 28 + i * 196;
    return `${boite(x, 90, 168, 96, v[0], v[1], i === 3 ? DOUX : '#fff', i === 3 ? VERT2 : LIGNE, VERT)}
      ${i < 4 ? fleche(x + 173, 138, x + 221, 138, '') : ''}`;
  }).join('')}
  <path d="M 940 190 Q 960 250 500 250 Q 40 250 60 190" fill="none" stroke="${VERT2}" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#pointe)"/>
  <text x="500" y="276" text-anchor="middle" font-size="16" fill="${GRIS}">La caisse sociale et la carte de secours passent au cycle suivant ; le journal continue.</text>
`)],

/* 4 — les trois poches de l'argent */
['trois-poches', page(1000, 420, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">Les trois poches de la caisse</text>
  ${[['Caisse de crédit', 'parts achetées + intérêts', ['se prête', VERT2], ['se partage en fin de cycle', VERT2], '#fff', VERT2],
     ['Caisse sociale', 'cotisation de solidarité', ['ne se prête pas', ROUGE], ['ne se partage pas', ROUGE], CLAIR, LIGNE],
     ['Dépôts du guichet', 'l’argent confié par un membre', ['ne se prête jamais', ROUGE], ['se reprend à tout moment', VERT2], CLAIR, LIGNE]]
    .map((v, i) => { const x = 40 + i * 320;
      return `<rect x="${x}" y="80" width="280" height="166" rx="14" fill="${v[4]}" stroke="${v[5]}" stroke-width="2"/>
        <text x="${x + 140}" y="116" text-anchor="middle" font-size="21" font-weight="700" fill="${VERT}">${v[0]}</text>
        <text x="${x + 140}" y="146" text-anchor="middle" font-size="15" fill="${GRIS}">${v[1]}</text>
        <line x1="${x + 55}" y1="166" x2="${x + 225}" y2="166" stroke="${v[5]}" stroke-width="1.5"/>
        <text x="${x + 140}" y="196" text-anchor="middle" font-size="16" font-weight="700" fill="${v[2][1]}">${v[2][0]}</text>
        <text x="${x + 140}" y="224" text-anchor="middle" font-size="16" font-weight="700" fill="${v[3][1]}">${v[3][0]}</text>`; }).join('')}
  <rect x="300" y="316" width="400" height="76" rx="14" fill="${VERT}"/>
  <text x="500" y="350" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">ARGENT DANS LA CAISSE</text>
  <text x="500" y="374" text-anchor="middle" font-size="15" fill="${DOUX}">la somme des trois, et rien d’autre</text>
  ${fleche(180, 251, 420, 311, '')}
  ${fleche(500, 251, 500, 311, '')}
  ${fleche(820, 251, 580, 311, '')}
`)],

/* 5 — le journal scellé */
['journal-scelle', page(1000, 290, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">Pourquoi une écriture ne peut pas être changée</text>
  ${[1, 2, 3, 4].map((n, i) => {
    const x = 60 + i * 230;
    return `${boite(x, 85, 170, 100, '', '', i === 2 ? '#FBE7C6' : '#fff', i === 2 ? AMBRE : LIGNE)}
      <text x="${x + 85}" y="${118}" text-anchor="middle" font-size="16" font-weight="700" fill="${ENCRE}">écriture n°${n}</text>
      <text x="${x + 85}" y="${146}" text-anchor="middle" font-size="14" fill="${GRIS}">empreinte</text>
      <text x="${x + 85}" y="${166}" text-anchor="middle" font-size="14" font-family="monospace" fill="${i === 2 ? AMBRE : VERT2}">${i === 2 ? '9c1f…' : ['7a40…', 'b2e8…', '', 'd071…'][i]}</text>
      ${i < 3 ? fleche(x + 175, 135, x + 225, 135, '') : ''}`;
  }).join('')}
  <text x="500" y="222" text-anchor="middle" font-size="17" fill="${ENCRE}">Chaque empreinte est calculée à partir de la précédente <tspan font-weight="700">et</tspan> du contenu de la ligne.</text>
  <text x="500" y="252" text-anchor="middle" font-size="17" font-weight="700" fill="${AMBRE}">Changer la troisième ligne casse les empreintes de toutes celles qui suivent — et Akiba le dit.</text>
`)],

/* 6 — qui peut quoi */
['qui-peut-quoi', page(1000, 400, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">Qui peut quoi</text>
  ${[['Un membre', 'voit son compte, son livret,\nle journal du groupe', CLAIR],
     ['Le bureau', 'tient la réunion, accorde,\nannule, imprime, sauvegarde', DOUX],
     ['L’animateur', 'crée l’AVEC, la remet,\nconsulte sa copie', CLAIR],
     ['L’organisation', 'valide, débloque, exporte,\nmesure l’impact', CLAIR]].map((v, i) => {
    const x = 28 + i * 245;
    return `${boite(x, 80, 220, 170, '', '', v[2], i === 1 ? VERT2 : LIGNE)}
      <text x="${x + 110}" y="118" text-anchor="middle" font-size="20" font-weight="700" fill="${VERT}">${v[0]}</text>
      ${v[1].split('\n').map((l, j) => `<text x="${x + 110}" y="${158 + j * 24}" text-anchor="middle" font-size="15" fill="${ENCRE}">${l}</text>`).join('')}`;
  }).join('')}
  <text x="500" y="300" text-anchor="middle" font-size="17" font-weight="700" fill="${ROUGE}">Ce que personne ne peut faire</text>
  <text x="500" y="332" text-anchor="middle" font-size="16" fill="${ENCRE}">Sortir l’argent d’un autre membre · modifier une réunion scellée · effacer une écriture</text>
  <text x="500" y="362" text-anchor="middle" font-size="16" fill="${ENCRE}">Accorder un crédit seul · ouvrir deux comptages à la fois · partager avec des crédits dehors</text>
`)],

/* 7 — l'arbre du dépannage */
['que-faire-si', page(1000, 470, `
  <text x="500" y="34" text-anchor="middle" font-size="24" font-weight="700" fill="${VERT}">Que faire si…</text>
  ${boite(350, 70, 300, 64, 'Le téléphone refuse un geste', '', '#fff', VERT, VERT)}
  ${fleche(500, 139, 500, 175, '')}
  ${boite(330, 180, 340, 60, 'Akiba affiche-t-il un message ?', '', CLAIR)}
  <path d="M 330 210 L 230 210 L 230 258" fill="none" stroke="${VERT2}" stroke-width="3" marker-end="url(#pointe)"/>
  <text x="285" y="198" text-anchor="middle" font-size="16" font-weight="700" fill="${VERT2}">oui</text>
  <path d="M 670 210 L 770 210 L 770 258" fill="none" stroke="${OR}" stroke-width="3" marker-end="url(#pointeOr)"/>
  <text x="716" y="198" text-anchor="middle" font-size="16" font-weight="700" fill="${AMBRE}">non</text>
  ${boite(20, 265, 420, 170, '', '', CLAIR)}
  <text x="50" y="300" font-size="18" font-weight="700" fill="${VERT}">Chercher le message au chapitre 16.1</text>
  <text x="50" y="334" font-size="15" fill="${ENCRE}">Seize messages y sont expliqués mot pour mot,</text>
  <text x="50" y="358" font-size="15" fill="${ENCRE}">avec le geste qui débloque.</text>
  <text x="50" y="396" font-size="15" fill="${GRIS}">« licence », « déjà active », « il manque une</text>
  <text x="50" y="418" font-size="15" fill="${GRIS}">réunion », « réservé au bureau »…</text>
  ${boite(560, 265, 420, 170, '', '', CLAIR)}
  <text x="590" y="300" font-size="18" font-weight="700" fill="${VERT}">Vérifier dans cet ordre</text>
  <text x="590" y="334" font-size="15" fill="${ENCRE}">1. Qui est connecté ? (bureau ou membre)</text>
  <text x="590" y="358" font-size="15" fill="${ENCRE}">2. Une réunion ou un guichet est-il ouvert ?</text>
  <text x="590" y="382" font-size="15" fill="${ENCRE}">3. Le groupe est-il validé ?</text>
  <text x="590" y="406" font-size="15" fill="${ENCRE}">4. La date du téléphone est-elle juste ?</text>
`)],

];
