/* Fabrique le manuel d'utilisation d'Akiba et d'Akiba Suivi, au format Word.

   Le contenu vit dans contenu-1.js … contenu-4.js, sous forme de blocs simples ; ce
   programme ne fait que les mettre en page. Police Ubuntu, corps 12, images prises
   automatiquement par tests/captures.js sur les applications réellement publiées.

   Usage :  node manuel/faire-manuel.js                                                   */
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, Table, TableRow,
  TableCell, WidthType, ShadingType, BorderStyle, PageBreak, LevelFormat, Footer, PageNumber,
  TableOfContents, PositionalTab, PositionalTabAlignment, PositionalTabLeader } = require('docx');

const RACINE = __dirname;
const F = 'Ubuntu';
const VERT = '0F4D3A', ENCRE = '1B2A24', GRIS = '5C6B64', OR = 'F2B705', LIGNE = 'E2E5E2', BANDE = 'F4F7F4';

/* ---------- petits outils de mise en forme ---------- */
/* Le gras s'écrit **ainsi** dans le texte, et un nom de fichier `ainsi` : un manuel se relit
   mieux en clair qu'en balises. Les accents graves ne doivent pas se retrouver imprimés — on
   ne distribue pas à un village un document qui montre sa propre ponctuation de travail. La
   police embarquée n'a pas de variante à chasse fixe ; un nom de fichier se distingue donc
   par le gras, qui se lit aussi bien sur papier qu'à l'écran. */
function runs(texte, opts = {}) {
  return String(texte).split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).map(bout => {
    const gras = /^\*\*[^*]+\*\*$/.test(bout), code = /^`[^`]+`$/.test(bout);
    return new TextRun(Object.assign({ text: gras || code ? bout.slice(gras ? 2 : 1, gras ? -2 : -1) : bout,
      bold: gras || code, font: F, size: 24, color: ENCRE }, opts));
  });
}
const p = (texte, opts = {}) => new Paragraph(Object.assign({ children: runs(texte), spacing: { after: 120, line: 290 } }, opts));
const puce = texte => new Paragraph({ children: runs(texte), numbering: { reference: 'puces', level: 0 }, spacing: { after: 70, line: 280 } });
const num = texte => new Paragraph({ children: runs(texte), numbering: { reference: 'chiffres', level: 0 }, spacing: { after: 70, line: 280 } });

function encadre(texte, couleur, titre) {
  return new Table({
    columnWidths: [9360],
    width: { size: 9360, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: couleur }, bottom: { style: BorderStyle.SINGLE, size: 2, color: couleur },
      left: { style: BorderStyle.SINGLE, size: 18, color: couleur }, right: { style: BorderStyle.SINGLE, size: 2, color: couleur },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: BANDE, color: 'auto' },
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      children: [new Paragraph({ children: [new TextRun({ text: titre, bold: true, font: F, size: 22, color: couleur })], spacing: { after: 50 } }),
        new Paragraph({ children: runs(texte), spacing: { after: 0, line: 280 } })] })] })],
  });
}

/* les images sont prises à 2× sur téléphone, 1× sur ordinateur : on rend la taille réelle */
function figure(chemin, legende) {
  const f = path.join(RACINE, 'captures', chemin + '.png');
  if (!fs.existsSync(f)) { console.warn('image absente : ' + chemin); return []; }
  const b = fs.readFileSync(f);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  const tel = /(^|\/)tel-/.test(chemin);
  const schema = /^schema\//.test(chemin);
  const large = tel ? 215 : schema ? 480 : 470;
  const haut = Math.round(large * h / w);
  return [
    new Paragraph({ children: [new ImageRun({ type: 'png', data: b, transformation: { width: large, height: haut } })],
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: legende, font: F, size: 19, color: GRIS, italics: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  ];
}

function tableau(entetes, lignes) {
  const nc = entetes.length;
  const largeur = 9360, col = Array(nc).fill(Math.floor(largeur / nc));
  col[nc - 1] = largeur - col[0] * (nc - 1);
  const cell = (t, gras, fond) => new TableCell({
    width: { size: col[0], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: fond, color: 'auto' },
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    children: [new Paragraph({ children: [new TextRun({ text: String(t), bold: !!gras, font: F, size: 21, color: gras ? 'FFFFFF' : ENCRE })], spacing: { after: 0 } })],
  });
  return new Table({
    columnWidths: col, width: { size: largeur, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: LIGNE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: LIGNE },
      left: { style: BorderStyle.SINGLE, size: 2, color: LIGNE }, right: { style: BorderStyle.SINGLE, size: 2, color: LIGNE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LIGNE }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LIGNE } },
    rows: [new TableRow({ tableHeader: true, children: entetes.map(t => cell(t, true, VERT)) })]
      .concat(lignes.map((l, i) => new TableRow({ children: l.map(t => cell(t, false, i % 2 ? BANDE : 'FFFFFF')) }))),
  });
}

/* ---------- le contenu, bloc par bloc ---------- */
const blocs = [].concat(
  require('./contenu-1.js'), require('./contenu-2.js'), require('./contenu-3.js'), require('./contenu-4.js'));

const corps = [];
for (const b of blocs) {
  const [k, a, c] = b;
  if (k === 'h1') corps.push(new Paragraph({ children: [new TextRun({ text: a, font: F, size: 40, bold: true, color: VERT })],
    heading: HeadingLevel.HEADING_1, spacing: { before: 0, after: 200 }, pageBreakBefore: true, keepNext: true }));
  else if (k === 'h2') corps.push(new Paragraph({ children: [new TextRun({ text: a, font: F, size: 30, bold: true, color: ENCRE })],
    heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, keepNext: true }));
  else if (k === 'h3') corps.push(new Paragraph({ children: [new TextRun({ text: a, font: F, size: 25, bold: true, color: VERT })],
    heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 90 }, keepNext: true }));
  else if (k === 'p') corps.push(p(a));
  else if (k === 'ul') a.forEach(x => corps.push(puce(x)));
  else if (k === 'ol') a.forEach(x => corps.push(num(x)));
  else if (k === 'fig') corps.push(...figure(a, c));
  /* la légende d'une capture annotée : le numéro du repère, puis ce qu'il désigne */
  else if (k === 'reperes') {
    a.forEach((t, i) => corps.push(new Paragraph({
      children: [new TextRun({ text: ' ' + (i + 1) + ' ', bold: true, font: F, size: 22, color: '1B2A24', shading: { type: ShadingType.CLEAR, fill: 'F2B705', color: 'auto' } })].concat(runs('   ' + t)),
      spacing: { after: 80, line: 280 }, indent: { left: 420 },
    })));
    corps.push(new Paragraph({ text: '', spacing: { after: 120 } }));
  }
  else if (k === 'tip') { corps.push(encadre(a, VERT, 'À RETENIR')); corps.push(new Paragraph({ text: '', spacing: { after: 160 } })); }
  else if (k === 'attention') { corps.push(encadre(a, 'A05A00', 'ATTENTION')); corps.push(new Paragraph({ text: '', spacing: { after: 160 } })); }
  else if (k === 'tbl') { corps.push(tableau(a, c)); corps.push(new Paragraph({ text: '', spacing: { after: 200 } })); }
  else if (k === 'saut') corps.push(new Paragraph({ children: [new PageBreak()] }));
}

/* ---------- couverture et sommaire ---------- */
const titre = (t, s, col, g) => new Paragraph({ children: [new TextRun({ text: t, font: F, size: s, bold: g !== false, color: col })],
  alignment: AlignmentType.CENTER, spacing: { after: 120 } });
const couverture = [
  new Paragraph({ text: '', spacing: { after: 1800 } }),
  titre('AKIBA', 92, VERT),
  titre('Le cahier de l’AVEC dans le téléphone', 28, ENCRE, false),
  new Paragraph({ text: '', spacing: { after: 500 } }),
  titre('MANUEL D’UTILISATION', 34, ENCRE),
  titre('Akiba · le cahier du groupe     ·     Akiba Suivi · animateurs et organisations', 22, GRIS, false),
  new Paragraph({ text: '', spacing: { after: 1400 } }),
  titre('Entreprise Sociale Ubora · Lubumbashi, République démocratique du Congo', 20, GRIS, false),
  titre('Pour les AVEC des vingt-six provinces', 20, GRIS, false),
  titre('akiba.uborardc.com     ·     akibas.uborardc.com', 20, GRIS, false),
  titre('Édition du ' + new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), 20, GRIS, false),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ children: [new TextRun({ text: 'Sommaire', font: F, size: 40, bold: true, color: VERT })], spacing: { after: 200 } }),
  new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }),
];

const doc = new Document({
  creator: 'Entreprise Sociale Ubora', title: 'Manuel d’utilisation — Akiba et Akiba Suivi',
  description: 'Manuel d’utilisation des deux applications Akiba',
  features: { updateFields: true },
  numbering: { config: [
    { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 420, hanging: 220 } }, run: { font: F, size: 24, color: VERT } } }] },
    { reference: 'chiffres', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 440, hanging: 240 } }, run: { font: F, size: 24, bold: true, color: VERT } } }] },
  ] },
  styles: { default: {
    document: { run: { font: F, size: 24, color: ENCRE }, paragraph: { spacing: { line: 290 } } },
    title: { run: { font: F, size: 56, bold: true, color: VERT }, paragraph: { spacing: { before: 0, after: 240 }, keepNext: true } },
    heading1: { run: { font: F, size: 40, bold: true, color: VERT }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } },
    heading2: { run: { font: F, size: 30, bold: true, color: ENCRE }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true } },
    heading3: { run: { font: F, size: 25, bold: true, color: VERT }, paragraph: { spacing: { before: 200, after: 90 }, keepNext: true } },
  } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1040, right: 1040 } } },
    footers: { default: new Footer({ children: [new Paragraph({ children: [
      new TextRun({ text: 'Akiba — manuel d’utilisation', font: F, size: 18, color: GRIS }),
      new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: 'margin', leader: PositionalTabLeader.NONE })], font: F, size: 18 }),
      new TextRun({ children: ['page ', PageNumber.CURRENT], font: F, size: 18, color: GRIS }),
    ], spacing: { before: 120 } })] }) },
    children: couverture.concat(corps),
  }],
});

Packer.toBuffer(doc).then(b => {
  const out = path.join(RACINE, 'Akiba-manuel-utilisation.docx');
  fs.writeFileSync(out, b);
  console.log('écrit : ' + out + ' · ' + Math.round(b.length / 1024) + ' Ko · ' + blocs.length + ' blocs');
});
