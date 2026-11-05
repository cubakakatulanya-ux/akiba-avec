/* Les captures d'écran du manuel.

   Le manuel d'utilisation doit montrer ce que l'utilisateur voit, pas ce qu'on croit qu'il
   voit. Ce programme ouvre l'application comme le fait le banc d'essai, passe par tous les
   écrans de la cible, et enregistre une image de chacun — en téléphone et en ordinateur,
   sur fond clair, avec les données de démonstration.

   Il capture aussi les feuilles qui comptent : accorder un crédit, déposer au guichet,
   montrer l'AVEC en image. Ce sont elles qu'on cherche dans un manuel.

   Usage :  node tests/captures.js docs manuel/captures/avec
            node tests/captures.js docs-suivi manuel/captures/suivi            */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..', process.argv[2] || 'docs');
const SORTIE = path.join(__dirname, '..', process.argv[3] || 'manuel/captures');
const PORT = 5207, DEBUG = 9351;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.mkdirSync(SORTIE, { recursive: true });
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
const profil = path.join(require('os').tmpdir(), 'akiba-captures-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });

let ws, n = 0; const attente = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; attente[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (expr, attendre = true) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: attendre, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value;
};
async function image(nom) {
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(SORTIE, nom + '.png'), Buffer.from(r.data, 'base64'));
  return nom;
}

/* les feuilles qui méritent une image dans le manuel, et le geste qui les ouvre */
const FEUILLES = [
  ['credit', 'avec', "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.loans'); ACT.loanSheet({});"],
  ['guichet-depot', 'avec', "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.guichet'); ACT.guichetDepotSheet({});"],
  ['sauvegarde', '', "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.home'); ACT.syncSheet({});"],
  ['recevoir', '', "K.session=null; App.go('login'); ACT.receiveSheet({});"],
];

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const cible = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(cible.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && attente[d.id]) { d.error ? attente[d.id].ko(new Error(d.error.message)) : attente[d.id].ok(d.result); delete attente[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  const pose = async (w, h, dsf, mobile) => { await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile }); await dors(350); };
  await pose(390, 844, 2, true);
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && typeof K !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
  await dors(900);
  await js("if (!K.data.avecs.length) DB.reset(); try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); 1", false);

  await js('window.__ECRANS = ' + require('./ecrans.js') + ';1', false);
  await js(`window.__ouvre = i => { const [id, cible, sess, par] = window.__ECRANS[i];
    try { sess(); App.go(id, typeof par === 'function' ? par() : par); } catch (e) { return 'erreur'; } return App.screen; };1`, false);
  const CIBLE = await js('window.AKIBA_CIBLE || "avec"', false);
  const nb = await js('window.__ECRANS.length', false);

  const faites = [];
  for (const [etiq, w, h, dsf, mob] of [['tel', 390, 844, 2, true], ['ordi', 1440, 900, 2, false]]) {
    await pose(w, h, dsf, mob);
    const vus = {};
    for (let i = 0; i < nb; i++) {
      const [id, c] = await js('(([a,b]) => [a,b])(window.__ECRANS[' + i + '])', false);
      if (c && c !== CIBLE) continue;
      if (vus[id]) continue; vus[id] = 1;
      const r = await js('window.__ouvre(' + i + ')', false);
      if (r === 'erreur') continue;
      await dors(420);
      faites.push(await image(etiq + '-' + id.replace(/\./g, '-')));
    }
    for (const [nom, c, geste] of FEUILLES) {
      if (c && c !== CIBLE) continue;
      try { await js(geste + ';1', false); } catch (e) { continue; }
      await dors(500);
      if (!(await js("!!App.sheet", false))) continue;
      faites.push(await image(etiq + '-feuille-' + nom));
      await js('App.closeSheet();1', false);
    }
  }
  console.log(faites.length + ' images dans ' + SORTIE);
  ws.close(); chrome.kill(); serveur.close();
  process.exit(0);
})().catch(e => { console.error('ERREUR :', e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
