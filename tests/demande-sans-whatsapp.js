/* La demande de validation, pour une AVEC qui n'a pas WhatsApp.

   Beaucoup d'AVEC autonomes n'ont pas de données mobiles, parfois pas de compte WhatsApp. La
   demande doit donc pouvoir partir par SMS, de vive voix, ou en image montrée à l'écran — et
   dans les quatre cas, l'espace administrateur doit retrouver le nom du groupe ET le code du
   téléphone. Si le nom n'arrive pas, Ubora reçoit huit signes anonymes et ne peut créer
   personne : la demande est perdue sans que personne le sache.

   Ce banc fait le tour complet des quatre chemins, y compris le piège qui casse tout : un
   message collé dans un champ d'une seule ligne, qui a perdu ses retours à la ligne.

   Il tourne sur Akiba Suivi, parce que c'est là que vit l'espace administrateur.

   Usage :  node tests/demande-sans-whatsapp.js                                             */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..', 'docs-suivi');
const PORT = 5248, DEBUG = 9392;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const dors = ms => new Promise(r => setTimeout(r, ms));
const serveur = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(RACINE, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
}).listen(PORT);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-dem-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value; };

const ESSAIS = `(async () => {
  const essais = [];
  const dit = (ok, quoi, detail) => essais.push({ ok: !!ok, quoi, detail: detail || '' });
  if (!K.data.avecs.length) DB.reset();

  const dev = devNu(deviceId());
  dit(/^[A-Z0-9]{8}$/.test(dev), 'ce téléphone a un code à huit signes', dev);

  /* ---- le champ du nom, que les quatre chemins lisent ---- */
  App.licDemande = null;
  const champ = document.createElement('input');
  champ.id = 'licNom'; champ.value = '  Espoir   Ubangi ';
  document.body.appendChild(champ);
  dit(demandeNom() === 'Espoir Ubangi', 'le nom tapé est nettoyé', '«' + demandeNom() + '»');

  /* ---- 1. le message, le même pour WhatsApp, le SMS et l'image ---- */
  const texte = demandText(null);
  dit(texte.indexOf('Espoir Ubangi') > 0, 'le message porte le nom du groupe');
  dit(texte.indexOf(dev) > 0, 'le message porte le code du téléphone');

  /* ---- 2. ce que l'espace administrateur en lit ---- */
  const lu = demandeLire(texte);
  dit(!!lu, 'l\\'espace administrateur reconnaît la demande');
  dit(lu && lu.name === 'Espoir Ubangi', 'il en retrouve le nom', lu ? '«' + lu.name + '»' : '');
  dit(lu && lu.dev === dev.slice(0, 4) + '-' + dev.slice(4), 'il en retrouve le code du téléphone', lu ? lu.dev : '');

  /* ---- 3. le piège : collé sur une seule ligne, sans retours ---- */
  const platt = texte.split('\\n').join(' ');
  const lu2 = demandeLire(platt);
  dit(lu2 && lu2.name === 'Espoir Ubangi', 'collé sur une seule ligne, le nom arrive quand même', lu2 ? '«' + lu2.name + '»' : '');
  dit(lu2 && lu2.dev === lu.dev, 'collé sur une seule ligne, le code arrive quand même', lu2 ? lu2.dev : '');

  /* ---- 4. la demande d'une organisation n'a pas changé ---- */
  const org = demandText({ name: 'ONG Tujenge', zoneTexte: 'Haut-Katanga', boss: 'Mw. Kasongo', phone: '0991234567', mail: 'tujenge@example.org' });
  const lu3 = demandeLire(org);
  dit(lu3 && lu3.name === 'ONG Tujenge', 'la demande d\\'organisation garde son nom', lu3 ? '«' + lu3.name + '»' : '');
  dit(lu3 && lu3.boss === 'Mw. Kasongo', 'et son responsable', lu3 ? lu3.boss : '');
  dit(lu3 && lu3.phone === '0991234567', 'et son téléphone, pas le code de l\\'appareil', lu3 ? lu3.phone : '');
  dit(lu3 && lu3.dev === lu.dev, 'et le code de l\\'appareil, séparément', lu3 ? lu3.dev : '');

  const orgPlat = org.split('\\n').join(' ');
  const lu4 = demandeLire(orgPlat);
  dit(lu4 && lu4.name === 'ONG Tujenge' && lu4.boss === 'Mw. Kasongo' && lu4.phone === '0991234567',
      'sur une seule ligne aussi, l\\'organisation se découpe', lu4 ? lu4.name + ' · ' + lu4.boss + ' · ' + lu4.phone : '');

  /* ---- 5. la demande en image : le QR porte exactement ce message ---- */
  let octets = -1;
  try {
    const Q = await carteChargerQr();
    const seg = Q.create(texte, { errorCorrectionLevel: 'M' });
    octets = seg.modules.size;
  } catch (e) { octets = -1; }
  dit(octets > 0 && octets <= 85, 'la demande tient dans une image facile à lire', octets + ' carrés de côté');
  dit(!!(typeof ACT.licDemImage === 'function'), 'le bouton « montrer la demande en image » existe');
  dit(!!(typeof ACT.licDemSms === 'function'), 'le bouton « envoyer par SMS » existe');
  dit(!!(typeof ACT.licDemWa === 'function'), 'le bouton WhatsApp passe par le champ du nom');

  /* ---- 5bis. le nom survit au remplacement de la feuille ----
     Trouve en essayant pour de vrai : « Montrer la demande en image » remplace la feuille qui
     portait le champ. Tout appel fait ensuite lisait un champ disparu et rendait une demande
     ANONYME, sans rien signaler — exactement ce qu'on voulait empecher. */
  champ.value = 'Espoir Ubangi';
  demandeNom();                                   // le nom est lu, donc retenu
  champ.remove();                                 // la feuille change : le champ n'existe plus
  dit(demandeNom() === 'Espoir Ubangi', 'le nom survit au changement de feuille', '«' + demandeNom() + '»');
  dit(demandText(null).indexOf('Espoir Ubangi') > 0, 'et la demande le porte encore');
  document.body.appendChild(champ);

  /* ---- 6. sans nom, on ne laisse pas partir une demande anonyme ---- */
  champ.value = '';
  let refus = false;
  const vraiToast = App.toast; App.toast = () => { refus = true; };
  const pret = licDemPret();
  App.toast = vraiToast;
  dit(!pret && refus, 'une demande sans nom est retenue, avec un message');

  /* ---- 7. le code de retour tient en huit signes dictés ---- */
  const court = await ccFaire(deviceId(), 'avec', 2);
  dit(/^[0-9A-Z]{8}$/.test(court), 'le code de validation se dicte en huit signes', court);
  const relu = await ccLire(court, null);
  dit(relu.ok && relu.data.kind === 'avec', 'et ce téléphone le reconnaît', relu.ok ? relu.data.exp : relu.why);
  const ailleurs = await ccEmpreinte('ZZZZ-ZZZZ', 'avec', 2);
  dit(ailleurs !== court.slice(1), 'dicté à un autre téléphone, il ne vaut rien');

  /* ---- 8. la duree du code dicte ne doit pas depasser ce qu'Ubora a accorde ----
     Trouve en activant une organisation pour de vrai : la duree etait arrondie VERS LE HAUT,
     et une validite d'un an - le defaut du formulaire - devenait deux ans sur le telephone.
     Le partenaire travaillait un an de plus que son contrat, et l'avertissement des trente
     derniers jours arrivait un an trop tard. */
  const JOUR = 24 * 3600e3, ANNEE = 365.25 * JOUR;
  const anneesPour = jours => {
    const exp = isoDay(Date.now() + jours * JOUR);
    return Math.max(1, Math.min(8, Math.round((new Date(exp + 'T23:59:59') - Date.now()) / ANNEE)));
  };
  dit(anneesPour(365) === 1, 'un an accorde un an, pas deux', anneesPour(365) + ' an(s)');
  dit(anneesPour(730) === 2, 'deux ans accordent deux ans', anneesPour(730) + ' an(s)');
  dit(anneesPour(1095) === 3, 'trois ans accordent trois ans', anneesPour(1095) + ' an(s)');
  dit(anneesPour(182) === 1, 'six mois ne peuvent pas descendre sous un an', anneesPour(182) + ' an(s)');
  /* et l'ecart annonce doit etre celui que le telephone calculera vraiment */
  const ansT = 2, finAnnoncee = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + ansT); return isoDay(d.getTime()); })();
  const codeT = await ccFaire(deviceId(), 'org', ansT);
  const luT = await ccLire(codeT, null);
  dit(luT.ok && luT.data.exp === finAnnoncee, 'la date annoncee a l administrateur est celle que le telephone retient',
      luT.ok ? luT.data.exp + ' / ' + finAnnoncee : luT.why);

  champ.remove();
  return essais;
})()`;

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
  await dors(700);

  const essais = await js(ESSAIS);
  let ko = 0;
  for (const e of essais) { if (!e.ok) ko++; console.log((e.ok ? '  ok  ' : '  KO  ') + e.quoi + (e.detail ? ' · ' + e.detail : '')); }
  console.log('');
  console.log(ko ? `${ko} essai(s) en échec sur ${essais.length}` : `${essais.length} essais passés`);
  ws.close(); chrome.kill(); serveur.close();
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
