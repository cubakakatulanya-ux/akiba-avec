/* Fabrique la présentation des deux applications Akiba, au format PowerPoint.
   Usage :  node manuel/faire-presentation.js                                          */
const fs = require('fs'), path = require('path');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require('C:/Users/CUBAKA/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/local-agent-mode-sessions/skills-plugin/4df56be6-8a0d-4200-87bb-8a6cb54bf43c/8076de61-5e5c-42e2-8b42-a760f850e0f8/skills/pptx/scripts/apply_theme.js');

const CAP = path.join(__dirname, 'captures');
const img = p => fs.readFileSync(path.join(CAP, p + '.png')).toString('base64');
const IMG = p => ({ data: 'image/png;base64,' + img(p) });

const THEME = {
  name: 'Akiba',
  headFontFace: 'Trebuchet MS',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1B2A24', lt1: 'FFFFFF', dk2: '0F4D3A', lt2: 'F1F6F2',
    accent1: '0F4D3A', accent2: 'F2B705', accent3: '2E7D5B', accent4: 'D5E7DD',
    accent5: 'A05A00', accent6: '5C6B64', hlink: '0F4D3A', folHlink: '5C6B64',
  },
};
const VERT = '0F4D3A', OR = 'F2B705', ENCRE = '1B2A24', GRIS = '5C6B64', DOUX = 'D5E7DD', CLAIR = 'F1F6F2';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.3 x 7.5 pouces
pres.author = 'Entreprise Sociale Ubora';
pres.company = 'Entreprise Sociale Ubora';
pres.title = 'Akiba et Akiba Suivi';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

/* ---------- les cadres ---------- */
pres.defineSlideMaster({
  title: 'COUVERTURE', background: { color: VERT },
  objects: [
    { text: { text: '', options: { placeholder: 'titre', x: 0.9, y: 2.4, w: 11.5, h: 1.5, fontSize: 54, bold: true, color: 'FFFFFF', fontFace: 'Trebuchet MS' } } },
    { text: { text: '', options: { placeholder: 'sous', x: 0.9, y: 3.9, w: 11.5, h: 1.2, fontSize: 20, color: DOUX } } },
    { text: { text: 'Entreprise Sociale Ubora · Goma, RDC', options: { x: 0.9, y: 6.5, w: 8, h: 0.4, fontSize: 12, color: DOUX } } },
  ],
});
pres.defineSlideMaster({
  title: 'TITRE', background: { color: 'FFFFFF' },
  objects: [
    { text: { text: '', options: { placeholder: 'titre', x: 0.7, y: 0.45, w: 12, h: 0.9, fontSize: 32, bold: true, color: VERT, fontFace: 'Trebuchet MS' } } },
    { text: { text: 'Akiba · Entreprise Sociale Ubora', options: { x: 0.7, y: 6.95, w: 6, h: 0.3, fontSize: 10, color: GRIS } } },
  ],
  slideNumber: { x: 12.15, y: 6.95, fontSize: 10, color: GRIS },
});
pres.defineSlideMaster({
  title: 'SECTION', background: { color: CLAIR },
  objects: [
    { text: { text: '', options: { placeholder: 'titre', x: 1.0, y: 3.0, w: 11.3, h: 1.2, fontSize: 40, bold: true, color: VERT, fontFace: 'Trebuchet MS' } } },
    { text: { text: '', options: { placeholder: 'sous', x: 1.0, y: 4.2, w: 11.3, h: 1.0, fontSize: 17, color: GRIS } } },
  ],
  slideNumber: { x: 12.15, y: 6.95, fontSize: 10, color: GRIS },
});

/* ---------- briques ---------- */
const carte = (s, x, y, w, h, titre, texte, teinte) => {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: teinte || CLAIR }, line: { color: 'E2E5E2', width: 1 }, objectName: 'carte-' + titre.slice(0, 14) });
  s.addText(titre, { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.4, fontSize: 16, bold: true, color: VERT, isTextBox: true, margin: 0, fontFace: 'Trebuchet MS' });
  s.addText(texte, { x: x + 0.25, y: y + 0.62, w: w - 0.5, h: h - 0.8, fontSize: 13, color: ENCRE, isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });
};
const stat = (s, x, y, w, chiffre, mot) => {
  s.addText(chiffre, { x, y, w, h: 0.85, fontSize: 44, bold: true, color: VERT, align: 'center', isTextBox: true, margin: 0, fontFace: 'Trebuchet MS' });
  s.addText(mot, { x, y: y + 0.85, w, h: 0.6, fontSize: 12, color: GRIS, align: 'center', isTextBox: true, margin: 0 });
};
const pastille = (s, x, y, n) => {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color: OR }, line: { color: OR, width: 1 }, objectName: 'pastille-' + n });
  s.addText(String(n), { x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: ENCRE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
};
const liste = (s, x, y, w, h, items, taille) => s.addText(
  items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
  { x, y, w, h, fontSize: taille || 15, color: ENCRE, isTextBox: true, paraSpaceAfter: 8, lineSpacingMultiple: 1.05 });

/* ================================ les diapositives ================================ */
pres.addSection({ title: 'Ouverture' });
let s = pres.addSlide({ masterName: 'COUVERTURE', sectionTitle: 'Ouverture' });
s.addText('AKIBA', { placeholder: 'titre' });
s.addText('Le cahier de l’AVEC dans le téléphone — et le suivi des groupes pour les animateurs et les organisations.', { placeholder: 'sous' });
s.addShape(pres.ShapeType.rect, { x: 0.9, y: 2.15, w: 1.6, h: 0.08, fill: { color: OR }, line: { color: OR, width: 0 }, objectName: 'trait-titre' });
s.addText('akiba.uborardc.com     ·     akibas.uborardc.com', { x: 0.9, y: 5.6, w: 9, h: 0.4, fontSize: 14, color: 'FFFFFF', isTextBox: true });
s.addNotes('Deux applications construites à partir du même code : le cahier du groupe, et le suivi.');

pres.addSection({ title: 'Le problème et la réponse' });
s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Le problème et la réponse' });
s.addText('Ce que coûte un cahier de papier', { placeholder: 'titre' });
carte(s, 0.7, 1.6, 3.9, 2.0, 'Il se perd', 'Une pluie, un incendie, un déménagement : le cycle entier disparaît, et avec lui la preuve de ce que chacun a versé.');
carte(s, 4.8, 1.6, 3.9, 2.0, 'Il se rature', 'Une ligne corrigée au stylo ne dit pas qui l’a corrigée, ni quand. Le doute s’installe, et le groupe se défait.');
carte(s, 8.9, 1.6, 3.7, 2.0, 'Il ne se lit pas', 'Pour une IMF ou un bailleur, un cahier manuscrit n’est pas un dossier : il n’est ni vérifiable ni comparable.');
s.addText('Et pourtant le cahier marche : il est public, il se lit à haute voix, il ne demande pas de réseau. Akiba garde cela, et retire le reste.',
  { x: 0.7, y: 4.0, w: 11.9, h: 0.9, fontSize: 17, italic: true, color: VERT, isTextBox: true });
stat(s, 0.7, 5.0, 3.9, '15 à 35', 'personnes par groupe');
stat(s, 4.8, 5.0, 3.9, '6 à 12', 'mois par cycle');
stat(s, 8.9, 5.0, 3.7, '0', 'réseau nécessaire');

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Le problème et la réponse' });
s.addText('Deux applications, une seule source', { placeholder: 'titre' });
carte(s, 0.7, 1.5, 5.9, 2.5, 'Akiba — le cahier du groupe', 'Pour le bureau et les membres, sur le terminal du village.\n\nTenir la réunion, l’épargne, les crédits, la caisse sociale, le guichet, et imprimer les reçus.\n\nakiba.uborardc.com', DOUX);
carte(s, 6.9, 1.5, 5.7, 2.5, 'Akiba Suivi — animateurs et ONG', 'Pour ceux qui accompagnent les groupes, sur téléphone et sur ordinateur.\n\nCréer les AVEC, suivre, alerter, exporter vers Excel, préparer un dossier IMF.\n\nakibas.uborardc.com', CLAIR);
s.addText('Les deux adresses sont deux réserves séparées : les données ne se mélangent jamais. Un seul téléphone tient le cahier d’un groupe à la fois.',
  { x: 0.7, y: 4.2, w: 11.9, h: 0.6, fontSize: 15, color: GRIS, isTextBox: true });
s.addImage(Object.assign(IMG('avec/tel-login'), { x: 2.3, y: 4.75, w: 0.88, h: 1.9 }));
s.addImage(Object.assign(IMG('suivi/tel-n-home'), { x: 9.5, y: 4.75, w: 0.88, h: 1.9 }));
s.addText('Le groupe', { x: 1.0, y: 5.5, w: 1.1, h: 0.4, fontSize: 13, bold: true, color: VERT, align: 'right', isTextBox: true });
s.addText('L’animateur', { x: 10.6, y: 5.5, w: 1.4, h: 0.4, fontSize: 13, bold: true, color: VERT, isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Le problème et la réponse' });
s.addText('Où vit le cahier, et comment il voyage', { placeholder: 'titre' });
s.addImage(Object.assign(IMG('schema/ou-vit-le-cahier'), { x: 1.15, y: 1.5, w: 11.0, h: 4.73 }));
s.addText('Le cahier naît chez l’animateur, vit sur le téléphone du groupe, et remonte en copie — jamais l’inverse.',
  { x: 0.7, y: 6.4, w: 11.2, h: 0.5, fontSize: 15, italic: true, color: VERT, isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Le problème et la réponse' });
s.addText('Trois principes qui ne bougent pas', { placeholder: 'titre' });
const principes = [
  ['Tout fonctionne sans réseau', 'Akiba n’a pas de serveur. Rien ne part du téléphone tout seul : ce qui sort, sort parce que quelqu’un l’a décidé.'],
  ['Rien ne s’efface', 'Chaque écriture porte l’empreinte de la précédente. Corriger, c’est écrire une annulation : la trace de l’erreur reste.'],
  ['L’assemblée décide, Akiba écrit', 'L’application propose, vérifie, refuse ce qui est hors règlement. Elle ne vote pas, et l’argent se compte à haute voix.'],
];
principes.forEach(([t, d], i) => {
  const y = 1.7 + i * 1.65;
  pastille(s, 0.75, y + 0.1, i + 1);
  s.addText(t, { x: 1.45, y, w: 10.8, h: 0.45, fontSize: 20, bold: true, color: VERT, isTextBox: true, margin: 0, fontFace: 'Trebuchet MS' });
  s.addText(d, { x: 1.45, y: y + 0.5, w: 10.8, h: 0.8, fontSize: 14, color: ENCRE, isTextBox: true, margin: 0 });
});

pres.addSection({ title: 'Akiba — le cahier du groupe' });
s = pres.addSlide({ masterName: 'SECTION', sectionTitle: 'Akiba — le cahier du groupe' });
s.addText('Akiba', { placeholder: 'titre' });
s.addText('Ce que le bureau d’une AVEC fait, réunion après réunion.', { placeholder: 'sous' });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba — le cahier du groupe' });
s.addText('L’accueil du groupe', { placeholder: 'titre' });
s.addImage(Object.assign(IMG('avec/ordi-a-home'), { x: 0.7, y: 1.45, w: 8.3, h: 5.19 }));
liste(s, 9.3, 1.5, 3.3, 5.0, [
  'L’argent en caisse, et ses deux poches : crédit et caisse sociale.',
  'Ce qui demande une action : écart, retard, fin de cycle.',
  'Les chiffres du cycle : épargne, crédits dehors, présence, valeur d’une part.',
  'Un seul grand bouton doré : le geste du jour.',
], 13);

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba — le cahier du groupe' });
s.addText('La réunion, en huit étapes', { placeholder: 'titre' });
const etapes = ['Présences', 'Comptage', 'Caisse sociale', 'Épargne en parts', 'Remboursements', 'Nouveaux crédits', 'Amendes', 'Clôture à 3 clés'];
etapes.forEach((t, i) => {
  const x = 0.7 + (i % 4) * 3.1, y = 1.6 + Math.floor(i / 4) * 1.5;
  s.addShape(pres.ShapeType.roundRect, { x, y, w: 2.85, h: 1.25, rectRadius: 0.08, fill: { color: i === 7 ? DOUX : CLAIR }, line: { color: 'E2E5E2', width: 1 }, objectName: 'etape-' + (i + 1) });
  pastille(s, x + 0.18, y + 0.18, i + 1);
  s.addText(t, { x: x + 0.72, y: y + 0.2, w: 2.0, h: 0.85, fontSize: 14, bold: true, color: ENCRE, isTextBox: true, margin: 0, valign: 'middle' });
});
s.addImage(Object.assign(IMG('reunion/tel-etape-8'), { x: 0.7, y: 4.75, w: 1.0, h: 2.17 }));
s.addText('La séance ne se ferme qu’avec les trois codes des porte-clés. Une fois scellée, elle ne se modifie plus : une erreur se corrige par une annulation, qui laisse les deux lignes visibles.',
  { x: 2.0, y: 4.85, w: 10.6, h: 1.0, fontSize: 15, color: ENCRE, isTextBox: true });
s.addText('Si un porte-clé manque, l’assemblée désigne un remplaçant pour cette séance — et son nom reste dans le journal.',
  { x: 2.0, y: 5.95, w: 10.6, h: 0.8, fontSize: 14, italic: true, color: GRIS, isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba — le cahier du groupe' });
s.addText('Le guichet, entre les réunions', { placeholder: 'titre' });
s.addImage(Object.assign(IMG('avec/ordi-a-guichet'), { x: 6.7, y: 1.5, w: 5.9, h: 3.69 }));
liste(s, 0.7, 1.55, 5.7, 3.6, [
  'Facultatif : l’assemblée le vote, ou pas.',
  'Un membre confie de l’argent, ou le reprend, un autre jour que la réunion.',
  'L’argent déposé n’est jamais prêté : il dort dans la caisse.',
  'Un retrait demande le code du membre lui-même — pas celui du bureau.',
  'La séance s’ouvre et se ferme par un comptage à deux.',
], 15);
s.addImage(Object.assign(IMG('schema/trois-poches'), { x: 0.75, y: 5.3, w: 4.85, h: 2.09 }));
carte(s, 6.9, 5.3, 5.7, 1.5, 'Pourquoi cela compte', 'Là où la réunion est hebdomadaire et le marché quotidien, un groupe qui ne rend pas l’argent entre deux séances pousse ses membres vers le prêteur du coin.', DOUX);

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba — le cahier du groupe' });
s.addText('Ce qui sort sur le papier', { placeholder: 'titre' });
const papiers = [
  ['Reçu de réunion', 'les totaux, la caisse, les trois clés, le sceau'],
  ['Journal de la séance', 'toutes les écritures, les cumuls, à classer dans le coffre'],
  ['Reçu du membre', 'ce qu’il a versé, ce qu’il doit, et sa preuve'],
  ['Livret A4', 'la page du membre, qu’il garde chez lui'],
  ['Cartes de membre', 'dix par feuille, à découper'],
  ['Relevé de compte', 'les mouvements d’un membre, sur le rouleau'],
];
papiers.forEach(([t, d], i) => {
  const x = 0.7 + (i % 3) * 4.05, y = 1.55 + Math.floor(i / 3) * 1.5;
  carte(s, x, y, 3.8, 1.3, t, d);
});
s.addImage(Object.assign(IMG('avec/ordi-a-receipt'), { x: 4.3, y: 4.75, w: 4.7, h: 2.15 }));

pres.addSection({ title: 'Akiba Suivi' });
s = pres.addSlide({ masterName: 'SECTION', sectionTitle: 'Akiba Suivi' });
s.addText('Akiba Suivi', { placeholder: 'titre' });
s.addText('Les animateurs créent les groupes ; les organisations les suivent et rendent compte.', { placeholder: 'sous' });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba Suivi' });
s.addText('L’animateur crée le groupe avec l’assemblée', { placeholder: 'titre' });
s.addImage(Object.assign(IMG('suivi/ordi-c-avec'), { x: 0.7, y: 1.45, w: 7.4, h: 4.63 }));
['Le groupe et son lieu', 'Le règlement voté', 'Les membres', 'Le bureau et les trois clés', 'Le démarrage'].forEach((t, i) => {
  const y = 1.6 + i * 0.78;
  pastille(s, 8.6, y, i + 1);
  s.addText(t, { x: 9.2, y: y + 0.02, w: 3.4, h: 0.4, fontSize: 14, bold: true, color: ENCRE, isTextBox: true, margin: 0, valign: 'middle' });
});
s.addText('Trois quarts d’heure, sans réseau. À la fin, Akiba affiche une seule fois le code secret de chaque membre et la carte de secours du groupe.',
  { x: 0.7, y: 6.2, w: 11.9, h: 0.7, fontSize: 14, italic: true, color: GRIS, isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba Suivi' });
s.addText('Remettre le cahier au village, sans réseau', { placeholder: 'titre' });
carte(s, 0.7, 1.5, 5.9, 2.4, 'Par image', 'L’animateur montre une image à l’écran, le téléphone du groupe la photographie, et le code de huit signes se dit de vive voix.\n\nPour un groupe neuf, le jour de sa création.', DOUX);
carte(s, 6.9, 1.5, 5.7, 2.4, 'Par fichier', 'Un fichier .akiba chiffré part par WhatsApp, Bluetooth ou carte mémoire ; le code se donne par un autre canal.\n\nPour tout cahier qui a déjà vécu.', CLAIR);
s.addImage(Object.assign(IMG('avec/ordi-feuille-recevoir'), { x: 3.3, y: 4.1, w: 6.7, h: 2.6 }));
s.addText('Et dans l’autre sens : après la clôture, la séance remonte à l’animateur en deux ou trois images. Sa copie se prolonge — elle ne remplace rien.',
  { x: 0.7, y: 6.7, w: 11.2, h: 0.5, fontSize: 13, color: GRIS, isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Akiba Suivi' });
s.addText('L’organisation voit ce que les groupes lui envoient', { placeholder: 'titre' });
s.addImage(Object.assign(IMG('suivi/ordi-o-home'), { x: 0.7, y: 1.45, w: 7.9, h: 4.94 }));
liste(s, 8.9, 1.5, 3.7, 4.6, [
  'Alertes : écart de caisse, réunion manquée, crédit en retard, fin de cycle.',
  'Valider une AVEC — par réseau, ou par un appel et huit chiffres dictés.',
  'Débloquer un membre qui a perdu son code.',
  'Exporter vers Excel : huit feuilles, sans donnée personnelle.',
  'Mesurer l’impact sur les journaux scellés, pas sur des déclarations.',
], 13);

pres.addSection({ title: 'Ce qui tient' });
s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Ce qui tient' });
s.addText('Ce qui protège l’argent', { placeholder: 'titre' });
const prot = [
  ['Un code par membre', 'personne n’agit à la place d’un autre'],
  ['Deux validations par crédit', 'jamais une seule personne'],
  ['Le code du membre pour un retrait', 'pas même le bureau'],
  ['Trois clés à la clôture', 'trois codes différents'],
  ['Comptage à l’ouverture et à la fin', 'tout écart s’explique par écrit'],
  ['Journal scellé par empreintes', 'une ligne modifiée se voit'],
  ['Preuve sur chaque reçu', 'un faux papier ne tombe pas juste'],
  ['Carte de secours', 'un code oublié ne bloque pas le groupe'],
];
prot.forEach(([t, d], i) => {
  const x = 0.7 + (i % 2) * 6.1, y = 1.55 + Math.floor(i / 2) * 1.32;
  s.addShape(pres.ShapeType.ellipse, { x, y: y + 0.12, w: 0.34, h: 0.34, fill: { color: DOUX }, line: { color: DOUX, width: 1 }, objectName: 'p' + i });
  s.addText(t, { x: x + 0.52, y, w: 5.3, h: 0.42, fontSize: 15, bold: true, color: ENCRE, isTextBox: true, margin: 0 });
  s.addText(d, { x: x + 0.52, y: y + 0.42, w: 5.3, h: 0.5, fontSize: 13, color: GRIS, isTextBox: true, margin: 0 });
});

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Ce qui tient' });
s.addText('Éprouvé, et mesuré', { placeholder: 'titre' });
stat(s, 0.7, 1.6, 2.9, '79 / 79', 'essais fonctionnels, sur les deux applications');
stat(s, 3.8, 1.6, 2.9, '2 314', 'vérifications sur un cycle complet de 52 semaines');
stat(s, 6.9, 1.6, 2.9, '265', 'réunions tenues de bout en bout par les vrais écrans');
stat(s, 10.0, 1.6, 2.6, '0', 'défaut à l’audit de robustesse');
carte(s, 0.7, 3.5, 5.9, 1.6, 'Ce qui est mesuré automatiquement', 'Contraste de chaque texte contre son fond (norme WCAG), taille des cibles du pouce, textes coupés, rangées mal ajustées — sur tous les écrans, en téléphone et en ordinateur.');
carte(s, 6.9, 3.5, 5.7, 1.6, 'Et sur le terminal', 'Accueil en 750 ms sur un processeur bridé au niveau du MT8766, reçus à 32 colonnes sans accent, signature de l’APK vérifiée à chaque fabrication.');
s.addText('Ce que ces bancs ne peuvent pas éprouver, et qui reste à faire sur le terminal : le scan par la caméra, le choix de fichier, et l’impression réelle.',
  { x: 0.7, y: 5.4, w: 11.9, h: 0.6, fontSize: 14, italic: true, color: 'A05A00', isTextBox: true });

s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Ce qui tient' });
s.addText('Ce qu’Akiba ne fait pas', { placeholder: 'titre' });
liste(s, 0.7, 1.6, 11.9, 3.6, [
  'Pas de fusion de deux cahiers qui ont divergé : un seul téléphone tient le cahier à la fois.',
  'Pas de serveur, donc pas de synchronisation automatique : tout passe par un fichier, une image, ou un envoi décidé.',
  'Pas de mobile money : Akiba enregistre de l’argent compté à la main.',
  'Pas de comptabilité d’ONG : Akiba tient le cahier d’un groupe, pas les comptes de l’organisation.',
], 16);
carte(s, 0.7, 5.0, 11.9, 1.6, 'Pourquoi le dire', 'Un outil qui promet tout se fait prendre au premier cas difficile. Un groupe qui connaît la limite — un seul téléphone, une sauvegarde après chaque séance — ne la rencontre jamais.', DOUX);

pres.addSection({ title: 'Déploiement' });
s = pres.addSlide({ masterName: 'TITRE', sectionTitle: 'Déploiement' });
s.addText('Ce qu’il faut pour commencer', { placeholder: 'titre' });
carte(s, 0.7, 1.55, 3.9, 2.1, 'Le matériel', 'Un terminal Android avec imprimante par groupe, ou un téléphone ordinaire.\n\nUn téléphone ou un ordinateur par animateur.');
carte(s, 4.8, 1.55, 3.9, 2.1, 'L’installation', 'Ouvrir l’adresse, installer l’icône. Sur un terminal de caisse, installer l’application Android.\n\nAucun serveur à monter.');
carte(s, 8.9, 1.55, 3.7, 2.1, 'La validation', 'Chaque téléphone qui porte de vraies données est validé un par un par Ubora, pour une durée donnée.');
s.addText('La formation', { x: 0.7, y: 3.9, w: 11.9, h: 0.45, fontSize: 20, bold: true, color: VERT, isTextBox: true, fontFace: 'Trebuchet MS' });
liste(s, 0.7, 4.35, 11.9, 2.2, [
  'Sept modules de formation pour les animateurs, dans l’application elle-même.',
  'Un guide complet hors connexion, qui se lit et s’écoute, en français, kiswahili et lingála.',
  'Un manuel d’utilisation illustré, et une démonstration intégrée pour s’entraîner sans toucher à de vraies données.',
], 15);

s = pres.addSlide({ masterName: 'COUVERTURE', sectionTitle: 'Déploiement' });
s.addText('Essayez-la aujourd’hui', { placeholder: 'titre' });
s.addText('La démonstration est ouverte à tous, sans compte et sans réseau : un groupe de vingt membres, quatorze réunions déjà tenues, et tous les gestes possibles.', { placeholder: 'sous' });
s.addShape(pres.ShapeType.rect, { x: 0.9, y: 2.15, w: 1.6, h: 0.08, fill: { color: OR }, line: { color: OR, width: 0 }, objectName: 'trait-fin' });
s.addText([
  { text: 'akiba.uborardc.com', options: { bold: true, breakLine: true } },
  { text: 'le cahier du groupe', options: { fontSize: 14, color: DOUX, breakLine: true } },
  { text: ' ', options: { fontSize: 10, breakLine: true } },
  { text: 'akibas.uborardc.com', options: { bold: true, breakLine: true } },
  { text: 'animateurs et organisations', options: { fontSize: 14, color: DOUX } },
], { x: 0.9, y: 5.0, w: 7, h: 1.6, fontSize: 20, color: 'FFFFFF', isTextBox: true });
s.addText('0998 275 144', { x: 9.0, y: 5.6, w: 3.4, h: 0.5, fontSize: 18, color: OR, align: 'right', isTextBox: true });

pres.writeFile({ fileName: path.join(__dirname, 'Akiba-presentation.pptx') })
  .then(async f => { await applyTheme(f, THEME); console.log('écrit : ' + f); })
  .catch(e => { console.error(e); process.exit(1); });
