/* Qui a signé l'application posée sur le site ?
 *
 * La signature est ce qui prouve à un terminal qu'une Akiba vient bien d'Ubora. Si la fabrique
 * retombait un jour sur la clé de développement — elle est publique et partagée par tous les
 * projets Android du monde — n'importe qui pourrait fabriquer une fausse Akiba portant la même
 * signature, et plus rien ne distinguerait la vraie. Ce contrôle existe pour que cela ne puisse
 * pas passer inaperçu.
 *
 *   node tests/signature-apk.js
 *
 * L'empreinte attendue ci-dessous n'est pas un secret : c'est l'équivalent du numéro gravé sur
 * un sceau. Elle ne change que le jour où Ubora change de clé — et ce jour-là, les Akiba déjà
 * installées ne pourront plus être mises à jour par-dessus, il faudra les désinstaller.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const EMPREINTE_UBORA = 'A5:E8:6C:D3:E2:AB:8E:47:4C:23:46:F1:F7:16:94:2B:43:3E:A2:62:BB:AB:F0:35:B7:55:D7:BE:C4:01:91:40';
const FICHIER = process.argv[2] || path.join(__dirname, '..', 'docs', 'akiba.apk');

/* La signature d'un APK moderne ne vit pas dans un fichier qu'on peut lire : elle est dans un
   bloc posé entre les fichiers et leur index. On y retrouve le certificat du signataire. */
function certificats(apk) {
  const magie = Buffer.from('APK Sig Block 42');
  const fin = apk.lastIndexOf(magie);
  if (fin < 0) return [];
  const taille = Number(apk.readBigUInt64LE(fin - 8));
  let p = fin + 16 - taille;                       // le bloc va de sa taille d'ouverture à la magie
  const trouves = [];
  while (p < fin - 8) {
    const lg = Number(apk.readBigUInt64LE(p));
    const id = apk.readUInt32LE(p + 8);
    if (id === 0x7109871a || id === 0xf05368c0) {   // schémas de signature v2 et v3
      let q = p + 12 + 4;                           // on entre dans la suite des signataires
      q += 4;                                       // longueur du premier signataire
      q += 4;                                       // longueur de ses données signées
      let r = q;
      r += 4 + apk.readUInt32LE(r);                 // on saute les empreintes des fichiers
      const finCerts = r + 4 + apk.readUInt32LE(r); r += 4;
      while (r < finCerts) {
        const lgCert = apk.readUInt32LE(r); r += 4;
        trouves.push({ schema: id === 0x7109871a ? 'v2' : 'v3', der: apk.subarray(r, r + lgCert) });
        r += lgCert;
      }
    }
    p += 8 + lg;
  }
  return trouves;
}

const dit = s => console.log('  ' + s);
console.log('\n  LA SIGNATURE DE L\'APPLICATION ANDROID\n');

if (!fs.existsSync(FICHIER)) {
  dit('✗ aucune application à contrôler : ' + FICHIER);
  dit('    elle est fabriquée par GitHub et déposée dans docs/ ; faites « git pull ».');
  process.exit(1);
}

const liste = certificats(fs.readFileSync(FICHIER));
if (!liste.length) {
  dit('✗ l\'application ne porte aucune signature lisible');
  process.exit(1);
}

let ko = 0;
for (const c of liste) {
  const x = new crypto.X509Certificate(c.der);
  const emp = crypto.createHash('sha256').update(c.der).digest('hex').toUpperCase().match(/../g).join(':');
  const bon = emp === EMPREINTE_UBORA;
  if (!bon) ko++;
  dit((bon ? '✓' : '✗') + ' schéma ' + c.schema + ' — ' + x.subject.replace(/\n/g, ', '));
  dit('    valable jusqu\'au ' + x.validTo);
  if (!bon) {
    dit('    empreinte trouvée  : ' + emp);
    dit('    empreinte attendue : ' + EMPREINTE_UBORA);
    if (/Android Debug/i.test(x.subject))
      dit('    c\'est la clé de développement : publique, partagée, elle ne prouve rien.');
  }
}

const jours = Math.round((new Date(new Date(liste[0] && new crypto.X509Certificate(liste[0].der).validTo).getTime()) - Date.now()) / 864e5);
if (jours < 400) { dit('✗ la clé expire dans ' + jours + ' jours'); ko++; }

console.log('\n  ' + (ko ? 'RÉSULTAT : ' + ko + ' problème(s) — cette application ne doit pas être distribuée'
  : 'RÉSULTAT : signée par Ubora, et par personne d\'autre') + '\n');
process.exit(ko ? 1 : 0);
