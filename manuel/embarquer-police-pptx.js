/* Embarquer la police Ubuntu dans la présentation PowerPoint.

   Même raison que pour le manuel : une police demandée n'est pas une police présente. Le
   format PowerPoint stocke les siennes dans ppt/fonts/, en clair cette fois (pas de
   brouillage, contrairement à Word), déclarées par <p:embeddedFontLst> dans presentation.xml.

   Usage :  node manuel/embarquer-police-pptx.js [chemin/vers/fichier.pptx]               */
const fs = require('fs'), path = require('path');
const JSZip = require('jszip');

const PPTX = process.argv[2] || path.join(__dirname, 'Akiba-presentation.pptx');
const POLICES = path.join(__dirname, 'polices');
const VARIANTES = [['regular', 'Ubuntu-Regular.ttf'], ['bold', 'Ubuntu-Bold.ttf'],
  ['italic', 'Ubuntu-Italic.ttf'], ['boldItalic', 'Ubuntu-BoldItalic.ttf']];

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(PPTX));

  const liens = [], parts = [];
  VARIANTES.forEach(([balise, fichier], i) => {
    const src = path.join(POLICES, fichier);
    if (!fs.existsSync(src)) throw new Error('police absente : ' + src);
    const nom = 'font' + (i + 1) + '.fntdata', rid = 'rIdUbuntu' + (i + 1);
    zip.file('ppt/fonts/' + nom, fs.readFileSync(src));
    liens.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/${nom}"/>`);
    parts.push(`<p:${balise} r:id="${rid}"/>`);
  });

  /* 1. la déclaration, juste avant </p:presentation> — l'ordre des enfants est imposé par le
        schéma : embeddedFontLst vient après sldSz/notesSz, donc avant defaultTextStyle. */
  let p = await zip.file('ppt/presentation.xml').async('string');
  if (!/embeddedFontLst/.test(p)) {
    const bloc = `<p:embeddedFontLst><p:embeddedFont><p:font typeface="Ubuntu" panose="020B0503030403020204" pitchFamily="34" charset="0"/>${parts.join('')}</p:embeddedFont></p:embeddedFontLst>`;
    p = /<p:defaultTextStyle>/.test(p) ? p.replace('<p:defaultTextStyle>', bloc + '<p:defaultTextStyle>')
      : p.replace('</p:presentation>', bloc + '</p:presentation>');
    /* l'attribut qui dit « ces polices sont embarquées » */
    if (!/embedTrueTypeFonts/.test(p)) p = p.replace('<p:presentation ', '<p:presentation embedTrueTypeFonts="1" ');
    zip.file('ppt/presentation.xml', p);
  }

  /* 2. les liens */
  let r = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
  if (!/fonts\//.test(r)) r = r.replace('</Relationships>', liens.join('') + '</Relationships>');
  zip.file('ppt/_rels/presentation.xml.rels', r);

  /* 3. le type de contenu des .fntdata */
  let c = await zip.file('[Content_Types].xml').async('string');
  if (!/Extension="fntdata"/.test(c))
    c = c.replace(/(<Types[^>]*>)/, '$1<Default Extension="fntdata" ContentType="application/x-fontdata"/>');
  zip.file('[Content_Types].xml', c);

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  if (buf.length < 100000) throw new Error('archive suspecte : rien n’a été remplacé');
  fs.writeFileSync(PPTX, buf);
  console.log('police Ubuntu embarquée (4 variantes) dans ' + path.basename(PPTX) + ' · ' + Math.round(buf.length / 1024) + ' Ko');
})().catch(e => { console.error('ERREUR : ' + e.message); process.exit(1); });
