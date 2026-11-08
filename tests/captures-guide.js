/* Les captures du guide, celles qui voyagent DANS l'application.

   Le guide doit se lire sans réseau, sur un terminal qui n'a que quelques mégaoctets : ces
   images sont donc prises en JPEG, à une taille de téléphone, et pèsent quelques dizaines de
   kilooctets chacune. Elles sont écrites dans akiba/, à côté du code, et la construction les
   copie et les met dans le cache hors ligne comme n'importe quel fichier de l'application.

   Usage :  node tests/captures-guide.js                                                   */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..', 'docs');
const SORTIE = path.join(__dirname, '..', 'akiba');
const PORT = 5221, DEBUG = 9365;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/* nom du fichier, geste qui ouvre l'écran, hauteur gardée (le haut de l'écran suffit) */
const VUES = [
  ['guide-accueil', "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.home');", 980],
  ['guide-reunion', "const a=avecById('avec1'); a.meetings=a.meetings.filter(m=>m.status!=='open'); K.session={kind:'avec',avecId:a.id,memberId:bureauOf(a)[0].id}; const n=a.meetings.reduce((x,m)=>Math.max(x,m.n),0)+1, pr={}; activeM(a).forEach(x=>pr[x.id]='P'); a.meetings.push({id:a.id+'-gd',n,cycle:a.cycle.n,date:Date.now(),status:'open',presence:pr,openedBy:K.session.memberId,stepDone:2,openExpected:stats(a).cash,openCount:stats(a).cash,synced:false}); DB.save(); App.go('a.meet',{step:4});", 1080],
  ['guide-guichet', "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.guichet');", 820],
  ['guide-recu', "const a=avecById('avec1'); K.session={kind:'avec',avecId:a.id,memberId:bureauOf(a)[0].id}; const m=a.meetings.filter(x=>x.status==='closed').slice(-1)[0]; App.go('a.receipt',{id:m.id});", 1080],
];

const dors = ms => new Promise(r => setTimeout(r, ms));
const serveur = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(RACINE, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
}).listen(PORT);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-gd-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; };

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  let total = 0;
  for (const [nom, geste, haut] of VUES) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: Math.round(haut / 1.5), deviceScaleFactor: 1.5, mobile: true });
    await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
    for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
    await dors(700);
    await js("if (!K.data.avecs.length) DB.reset(); try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); 1", false);
    await js('(async () => { ' + geste + ' })()');
    await dors(700);
    const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 74 });
    const f = path.join(SORTIE, nom + '.jpg');
    fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
    const ko = Math.round(fs.statSync(f).size / 1024);
    total += ko;
    console.log(nom + '.jpg · ' + ko + ' Ko');
  }
  console.log('total : ' + total + ' Ko dans akiba/');
  ws.close(); chrome.kill(); serveur.close(); process.exit(0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
