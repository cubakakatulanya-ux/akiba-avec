/* Akiba — le banc de la mise à jour.

   C'est la panne la plus grave que cette application puisse avoir, et la seule qu'on ne voit
   jamais en la testant : une mise à jour qui ne part pas. Les groupes sont à Kanyabayonga, à
   Bwito, à Lubero ; personne ne va aller leur réinstaller le cahier à la main. Si le service
   worker se casse, chaque téléphone reste figé sur sa version pour toujours — et si la mise à
   jour efface les données, c'est un cycle d'épargne qui disparaît.

   Le banc fait donc ce que fait un vrai téléphone, en vrai, avec un vrai navigateur :

     1. il ouvre l'application servie depuis un dossier, attend que le service worker prenne la
        main, et écrit des données dans le cahier ;
     2. il refabrique l'application — nouveau numéro de version, nouveau service worker ;
     3. il demande la mise à jour comme l'application le fait toute seule à l'ouverture ;
     4. il vérifie que la nouvelle version a pris, que le cahier est intact, que l'ancien cache
        a bien été effacé, et que l'application s'ouvre encore sans réseau.

   Usage : node tests/mise-a-jour.js */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const RACINE = path.join(__dirname, '..', 'docs');
const PORT = 5201, DEBUG = 9345;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const serveur = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(RACINE, u);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    /* comme GitHub Pages : les fichiers peuvent être gardés un moment par le navigateur, mais
       le service worker, lui, est toujours redemandé — c'est la règle du navigateur, pas la
       nôtre, et le banc doit vivre avec elle */
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' });
    res.end(b);
  });
}).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const profil = path.join(require('os').tmpdir(), 'akiba-maj-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });

let ws, n = 0; const attente = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; attente[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (expr, attendre = true) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: attendre, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value;
};

let passes = 0, echecs = 0;
const ligne = s => console.log(s);
const verifier = (ok, nom, detail) => { if (ok) { passes++; ligne('  ✓ ' + nom + (detail ? '  — ' + detail : '')); } else { echecs++; ligne('  ✗ ' + nom + (detail ? '  — ' + detail : '')); } };
const trait = () => ligne('  ' + '─'.repeat(92));

/* attendre qu'une condition soit vraie dans la page, sans dormir au hasard */
async function jusqua(expr, quoi, max = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) { if (await js(expr, false)) return Math.round(Date.now() - t0); await dors(200); }
  throw new Error('délai dépassé : ' + quoi);
}

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const cible = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(cible.webSocketDebuggerUrl, { maxPayload: 32 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && attente[d.id]) { d.error ? attente[d.id].ko(new Error(d.error.message)) : attente[d.id].ok(d.result); delete attente[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');

  ligne('');
  ligne('  AKIBA — LE BANC DE LA MISE À JOUR');
  trait();

  /* ---------- 1. la première ouverture ---------- */
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' });
  await jusqua("typeof App !== 'undefined' && typeof K !== 'undefined' && !!(K.data && K.data.avecs)", 'le chargement de l’application');
  const v1 = await js('window.KITABU_VERSION', false);
  const pris = await jusqua('!!navigator.serviceWorker.controller', 'la prise en main par le service worker', 25000);
  verifier(!!v1, 'l’application s’ouvre et annonce sa version', v1);
  verifier(true, 'le service worker prend la main à la première ouverture', pris + ' ms');

  const enLigne1 = (await (await fetch('http://localhost:' + PORT + '/version.txt?x=1')).text()).trim();
  verifier(enLigne1 === v1, 'le numéro servi en ligne est celui de la page', enLigne1 === v1 ? v1 : enLigne1 + ' contre ' + v1);

  /* des données dans le cahier : c'est elles qu'une mauvaise mise à jour effacerait */
  const avant = await js(`(async () => {
    if (!K.data.avecs.length) DB.reset();
    const a = K.data.avecs[0];
    K.session = { kind: 'avec', avecId: a.id, memberId: bureauOf(a)[0].id };
    const x = activeM(a).find(m => !isBureau(m));
    const st = stats(a);
    ACT.guichetOuvrirSheet(); document.getElementById('guA').value = String(st.cash); ACT.guichetOuvrir(); App.closeSheet();
    ACT.guichetDepotSheet(); document.getElementById('dpM').value = x.id; document.getElementById('dpA').value = '4500'; ACT.saveDepot(); App.closeSheet();
    DB.save(); await DB.vide();
    return { avecs: K.data.avecs.length, tx: a.tx.length, caisse: stats(a).cash, compte: stats(a).mem[x.id].libre, membre: x.id };
  })()`);
  verifier(avant.compte === 4500, 'un dépôt est écrit avant la mise à jour', avant.tx + ' écritures, caisse ' + avant.caisse + ' FC');

  /* ---------- 2. on publie une nouvelle version ---------- */
  trait();
  await dors(1100);                                                   // le numéro va à la seconde : on la laisse tourner
  execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), 'docs', 'avec'], { stdio: 'ignore' });
  const v2 = fs.readFileSync(path.join(RACINE, 'version.txt'), 'utf8').trim();
  verifier(v2 !== v1, 'une nouvelle publication porte un nouveau numéro', v1 + ' → ' + v2);

  /* ---------- 3. une séance de guichet est ouverte : on ne reprend PAS la main ----------
     De l'argent est sur la table et le trésorier compte. Recharger la page sous ses doigts
     serait la pire façon d'annoncer une bonne nouvelle. */
  await js(`(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); return 1; })()`);
  /* On ATTEND le bandeau au lieu de dormir un temps choisi au hasard. Dormir 2,5 s marchait
     presque toujours : sur une machine occupée, le service worker mettait parfois plus
     longtemps à voir la nouvelle version, et le banc annonçait trois échecs pour une
     application qui faisait son travail — la preuve étant que les deux derniers essais, eux,
     la trouvaient bien mise à jour. Un banc qui échoue au hasard finit par ne plus être cru. */
  const venu = await jusqua("!!document.getElementById('updbar')", 'le bandeau de mise à jour');
  const pendant = await js(`({ version: window.KITABU_VERSION, bandeau: !!document.getElementById('updbar'), ecran: App.screen })`, false);
  verifier(pendant.version === v1, 'pendant une séance de guichet, l’application ne se recharge pas toute seule', 'reste en ' + pendant.version);
  verifier(pendant.bandeau, 'un bandeau « Mettre à jour » apparaît à la place', 'écran ' + pendant.ecran + ', après ' + venu + ' ms');

  /* ---------- 4. le guichet fermé, la mise à jour se prend d'un toucher ---------- */
  await js(`(async () => {
    const a = K.data.avecs[0], st = stats(a);
    ACT.guichetFermerSheet();
    document.getElementById('gfA').value = String(st.cash);
    document.getElementById('gfPin').value = memberOf(a, document.getElementById('gfAp').value).pin;
    ACT.guichetFermer(); App.closeSheet(); DB.save(); await DB.vide(); return 1;
  })()`);
  await js(`(() => { ACT.reloadApp(); return 1; })()`, false).catch(() => {});
  await jusqua("typeof App !== 'undefined' && typeof K !== 'undefined' && !!(K.data && K.data.avecs)", 'le rechargement demandé');
  const v3 = await js('window.KITABU_VERSION', false).catch(() => '');
  verifier(v3 === v2, 'le bouton du bandeau installe la nouvelle version', v3 ? v1 + ' → ' + v3 : 'aucune version lue');

  /* ---------- 5. rien n'a été perdu ---------- */
  await jusqua("typeof K !== 'undefined' && !!(K.data && K.data.avecs && K.data.avecs.length)", 'la relecture du cahier');
  const apres = await js(`(() => { const a = K.data.avecs[0]; const st = stats(a);
    return { avecs: K.data.avecs.length, tx: a.tx.length, caisse: st.cash, compte: st.mem['${avant.membre}'].libre, chaine: verifyChain(a).ok }; })()`);
  verifier(apres.tx === avant.tx, 'le journal est intact après la mise à jour', apres.tx + ' écritures, comme avant');
  verifier(apres.compte === 4500 && apres.caisse === avant.caisse, 'le compte et la caisse sont intacts', 'compte ' + apres.compte + ' FC, caisse ' + apres.caisse + ' FC');
  verifier(apres.chaine, 'le journal scellé se vérifie encore');

  /* ---------- 6. le cache : un seul, le nouveau ---------- */
  const caches = await js(`caches.keys()`);
  verifier(caches.length === 1 && caches[0] === v2, 'l’ancien cache est effacé, le nouveau reste seul', caches.join(', ') || 'aucun');
  const complet = await js(`(async () => { const c = await caches.open('${v2}'); const k = await c.keys();
    const noms = k.map(r => r.url.split('/').pop() || 'index');
    return { n: k.length, index: noms.some(x => x === '' || x === 'index.html'), coeur: ['core.js','avec.js','guichet.js'].every(f => noms.includes(f)) }; })()`);
  verifier(complet.index && complet.coeur, 'la nouvelle version est entière dans le téléphone', complet.n + ' fichiers gardés');

  /* ---------- 7. et toujours sans réseau ---------- */
  await cdp('Network.enable').catch(() => {});
  await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await cdp('Page.reload');
  let horsReseau = false;
  try { await jusqua("typeof App !== 'undefined' && !!(K.data && K.data.avecs && K.data.avecs.length)", 'l’ouverture hors réseau', 15000); horsReseau = true; } catch (e) { /* noté ci-dessous */ }
  const vOff = horsReseau ? await js('window.KITABU_VERSION', false) : '';
  verifier(horsReseau && vOff === v2, 'l’application s’ouvre sans réseau, dans sa nouvelle version', vOff || 'écran vide');
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  /* ---------- 8. un écran calme : la mise à jour se prend toute seule ----------
     « Calme » ne veut pas dire « l'accueil » : la liste des membres, les crédits ou les réglages
     sont des écrans où personne n'écrit rien. C'est là que la plupart des téléphones se
     trouvent quand une version sort, et c'est là que la mise à jour doit se faire sans rien
     demander à personne. */
  await js(`(() => { K.session = { kind:'avec', avecId: K.data.avecs[0].id, memberId: bureauOf(K.data.avecs[0])[0].id }; App.go('a.members'); return App.screen; })()`, false);
  await dors(1100);
  execFileSync(process.execPath, [path.join(__dirname, '..', 'build.js'), 'docs', 'avec'], { stdio: 'ignore' });
  const v4 = fs.readFileSync(path.join(RACINE, 'version.txt'), 'utf8').trim();
  await js(`(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); return 1; })()`);
  let seul = false;
  try { await jusqua(`window.KITABU_VERSION === '${v4}'`, 'la mise à jour toute seule', 15000); seul = true; } catch (e) { /* noté */ }
  verifier(seul, 'sur un écran calme, la mise à jour se prend toute seule', seul ? v2 + ' → ' + v4 : 'restée en ' + await js('window.KITABU_VERSION', false));

  trait();
  ligne('  CE QUE CE BANC NE PEUT PAS ÉPROUVER');
  ligne('  ○ la mise à jour de l’application Android elle-même — le pont natif et le verrou anti-suppression');
  ligne('    changent avec l’APK, qui se réinstalle à la main ; seul le contenu se met à jour tout seul');
  ligne('  ○ un téléphone resté des mois hors réseau, puis rallumé : le banc saute l’attente, pas la logique');
  trait();
  ligne('  RÉSULTAT : ' + passes + ' vérification' + (passes > 1 ? 's' : '') + ' passée' + (passes > 1 ? 's' : '') + ', ' + (echecs ? echecs + ' à corriger' : 'rien à corriger'));
  ligne('');

  ws.close(); chrome.kill(); serveur.close();
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error('ERREUR DU LANCEUR :', e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
