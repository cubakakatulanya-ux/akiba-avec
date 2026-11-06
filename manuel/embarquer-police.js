/* Embarquer la police Ubuntu dans le fichier Word.

   Demander « police Ubuntu » dans un document ne suffit pas : Word la remplace par une autre
   sur toute machine où elle n'est pas installée — et sur Windows, elle ne l'est jamais. La
   seule façon d'être sûr que le manuel s'affiche comme il a été dessiné, chez Ubora comme
   chez un partenaire, est de mettre la police À L'INTÉRIEUR du document.

   Word sait le faire depuis toujours : les fichiers de police vivent dans word/fonts/ sous
   l'extension .odttf, « brouillés » par un XOR des trente-deux premiers octets avec la clé
   déclarée dans fontTable.xml. C'est ce que fait ce programme.

   La police Ubuntu est publiée par Canonical sous Ubuntu Font Licence 1.0, qui autorise
   l'incorporation dans un document.

   Tout passe par JSZip : ni zip ni unzip n'existent sous Windows, et un document à moitié
   réécrit vaut moins qu'un document qu'on n'a pas touché.

   Usage :  node manuel/embarquer-police.js [chemin/vers/fichier.docx]                    */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const JSZip = require('jszip');

const DOCX = process.argv[2] || path.join(__dirname, 'Akiba-manuel-utilisation.docx');
const POLICES = path.join(__dirname, 'polices');
const VARIANTES = [['embedRegular', 'Ubuntu-Regular.ttf'], ['embedBold', 'Ubuntu-Bold.ttf'],
  ['embedItalic', 'Ubuntu-Italic.ttf'], ['embedBoldItalic', 'Ubuntu-BoldItalic.ttf']];

/* le brouillage prévu par la norme : les 32 premiers octets, XOR avec la clé lue à l'envers */
function brouiller(donnees, guid) {
  const hex = guid.replace(/[{}-]/g, ''), cle = [];
  for (let i = hex.length - 2; i >= 0; i -= 2) cle.push(parseInt(hex.substr(i, 2), 16));
  const out = Buffer.from(donnees);
  for (let i = 0; i < 32 && i < out.length; i++) out[i] ^= cle[i % 16];
  return out;
}
const guid = () => { const b = crypto.randomBytes(16).toString('hex').toUpperCase();
  return `{${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}}`; };

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(DOCX));

  /* 1. les quatre variantes, brouillées, et leurs liens */
  const rels = [], entrees = [];
  VARIANTES.forEach(([balise, fichier], i) => {
    const src = path.join(POLICES, fichier);
    if (!fs.existsSync(src)) throw new Error('police absente : ' + src);
    const g = guid(), nom = 'font' + (i + 1) + '.odttf', rid = 'rIdFont' + (i + 1);
    zip.file('word/fonts/' + nom, brouiller(fs.readFileSync(src), g));
    rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/${nom}"/>`);
    entrees.push(`<w:${balise} r:id="${rid}" w:fontKey="${g}"/>`);
  });

  /* 2. la déclaration de la police */
  const decl = `<w:font w:name="Ubuntu"><w:panose1 w:val="020B0503030403020204"/><w:charset w:val="00"/>`
    + `<w:family w:val="swiss"/><w:pitch w:val="variable"/>${entrees.join('')}</w:font>`;
  const ftExistant = zip.file('word/fontTable.xml');
  if (ftExistant) {
    let x = await ftExistant.async('string');
    x = x.replace(/<w:font w:name="Ubuntu">[\s\S]*?<\/w:font>/g, '');
    if (!/xmlns:r=/.test(x)) x = x.replace('<w:fonts ', '<w:fonts xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
    /* docx-js écrit une table vide, refermée sur elle-même : il faut l'ouvrir avant d'y mettre
       quoi que ce soit, sinon la déclaration part dans le vide et Word ne voit aucune police. */
    x = /<\/w:fonts>/.test(x) ? x.replace('</w:fonts>', decl + '</w:fonts>')
      : x.replace(/\/>\s*$/, '>' + decl + '</w:fonts>');
    if (!/w:name="Ubuntu"/.test(x)) throw new Error('la déclaration de la police n’a pas pu être posée');
    zip.file('word/fontTable.xml', x);
  } else {
    zip.file('word/fontTable.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + decl + '</w:fonts>');
  }
  zip.file('word/_rels/fontTable.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels.join('') + '</Relationships>');

  /* 3. types de contenu */
  let c = await zip.file('[Content_Types].xml').async('string');
  if (!/Extension="odttf"/.test(c))
    c = c.replace(/(<Types[^>]*>)/, '$1<Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/>');
  if (!/fontTable\.xml/.test(c))
    c = c.replace('</Types>', '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/></Types>');
  if (!/settings\.xml/.test(c))
    c = c.replace('</Types>', '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>');
  zip.file('[Content_Types].xml', c);

  /* 4. les liens du document vers la table des polices et les réglages */
  let d = await zip.file('word/_rels/document.xml.rels').async('string');
  if (!/fontTable\.xml/.test(d))
    d = d.replace('</Relationships>', '<Relationship Id="rIdFontTable" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/></Relationships>');
  if (!/settings\.xml/.test(d))
    d = d.replace('</Relationships>', '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', d);

  /* 5. dire à Word d'utiliser les polices embarquées */
  const stExistant = zip.file('word/settings.xml');
  if (stExistant) {
    let x = await stExistant.async('string');
    if (!/embedTrueTypeFonts/.test(x)) x = x.replace(/(<w:settings[^>]*>)/, '$1<w:embedTrueTypeFonts/><w:saveSubsetFonts w:val="false"/>');
    zip.file('word/settings.xml', x);
  } else {
    zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:embedTrueTypeFonts/><w:saveSubsetFonts w:val="false"/></w:settings>');
  }

  /* on n'écrase l'original qu'une fois la nouvelle archive complète en mémoire */
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  if (buf.length < 100000) throw new Error('archive suspecte : rien n’a été remplacé');
  fs.writeFileSync(DOCX, buf);
  console.log('police Ubuntu embarquée (4 variantes) dans ' + path.basename(DOCX) + ' · ' + Math.round(buf.length / 1024) + ' Ko');
})().catch(e => { console.error('ERREUR : ' + e.message); process.exit(1); });
