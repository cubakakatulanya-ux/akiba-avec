/* Essais de bout en bout d'Akiba : ouvre l'application dans un navigateur sans fenêtre,
   exécute tests/suite.js dans la page, puis vérifie la mise en page sur téléphone et sur ordinateur.
   Usage : node test-e2e.js [dossier]      (par défaut akiba/) */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, process.argv[2] || 'docs');
const PORT = 5199, DEBUG = 9343;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const serveur = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(RACINE, u);
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  });
}).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const profil = path.join(require('os').tmpdir(), 'akiba-essais-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });

let ws, n = 0; const attente = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; attente[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (expr, attendre = true) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: attendre, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value;
};

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const cible = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(cible.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && attente[d.id]) { d.error ? attente[d.id].ko(new Error(d.error.message)) : attente[d.id].ok(d.result); delete attente[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');

  const erreursConsole = [];
  await cdp('Log.enable').catch(() => {});
  ws.addEventListener('message', e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon|ERR_CONNECTION_CLOSED|fonts\.googleapis/.test(d.params.entry.text)) erreursConsole.push(d.params.entry.text.slice(0, 160));
    if (d.method === 'Runtime.exceptionThrown') erreursConsole.push('exception : ' + (d.params.exceptionDetails.exception || {}).description);
  });

  /* téléphone d'abord */
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && typeof SCREENS !== 'undefined' && typeof K !== 'undefined' && !!(K.data && K.data.avecs && K.data.avecs.length)", false)) break; } catch (e) {} }
  await dors(900);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await dors(300);

  /* mise en page : téléphone */
  const pose = [];
  const mesure = async (ecran, avant = '') => {
    await js(avant + ";App.go('" + ecran + "');1", false);
    await dors(120);
    return js("({h:document.documentElement.scrollHeight,vh:innerHeight,w:document.documentElement.scrollWidth,vw:innerWidth})", false);
  };
  await js('if (!K.data.avecs.length) DB.reset();1');   // Akiba Suivi démarre vide : on recharge la démonstration pour les essais
  const SESSION_AVEC = "K.session={kind:'avec',avecId:'avec1',memberId:avecById('avec1').members[0].id}";
  for (const [ecran, avant] of [['login', 'K.session=null'], ['a.home', SESSION_AVEC], ['a.members', SESSION_AVEC], ['a.loans', SESSION_AVEC], ['a.journal', SESSION_AVEC], ['guide', SESSION_AVEC], ['a.more', SESSION_AVEC]]) {
    const m = await mesure(ecran, avant);
    pose.push({ ecran, ...m, deborde: m.w > m.vw });
  }

  /* la batterie, dans la page */
  const suite = fs.readFileSync(path.join(__dirname, 'tests', 'suite.js'), 'utf8');
  await js(suite + ';1', false);
  const resultats = await js('__akibaTests()');

  /* mise en page : ordinateur */
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await dors(300);
  const poseOrdi = [];
  for (const [ecran, avant] of [['login', 'K.session=null'], ['a.home', SESSION_AVEC], ['a.members', SESSION_AVEC], ['guide', SESSION_AVEC]]) {
    const m = await mesure(ecran, avant);
    poseOrdi.push({ ecran, ...m, deborde: m.w > m.vw });
  }

  /* rapport */
  const reussis = resultats.filter(r => r.ok).length;
  console.log('\n=== Essais fonctionnels ===');
  for (const r of resultats) console.log((r.ok ? '  OK   ' : '  ÉCHEC') + ' ' + r.nom + (r.detail ? '  — ' + r.detail : ''));
  console.log('\n=== Mise en page téléphone (375 x 812) ===');
  for (const p of pose) console.log('  ' + (p.deborde ? 'ÉCHEC' : 'OK   ') + ' ' + p.ecran.padEnd(11) + ' hauteur ' + p.h + '/' + p.vh + ' · largeur ' + p.w + '/' + p.vw + (p.deborde ? ' — DÉBORDEMENT' : ''));
  console.log('\n=== Mise en page ordinateur (1440 x 900) ===');
  for (const p of poseOrdi) console.log('  ' + (p.deborde ? 'ÉCHEC' : 'OK   ') + ' ' + p.ecran.padEnd(11) + ' hauteur ' + p.h + '/' + p.vh + (p.deborde ? ' — débordement horizontal ' + p.w + '/' + p.vw : ''));
  console.log('\n=== Erreurs de console ===');
  console.log(erreursConsole.length ? erreursConsole.map(e => '  ' + e).join('\n') : '  aucune');

  const echecs = resultats.length - reussis + pose.filter(p => p.deborde).length + poseOrdi.filter(p => p.deborde).length + erreursConsole.length;
  console.log('\nRésultat : ' + reussis + '/' + resultats.length + ' essais fonctionnels réussis, ' + echecs + ' problème(s) au total.');

  ws.close(); chrome.kill(); serveur.close();
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error('ERREUR DU LANCEUR :', e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
