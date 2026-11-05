/* Rend les schémas SVG en images, par le même navigateur sans fenêtre que les captures.
   Usage :  node manuel/faire-schemas.js                                                  */
const fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');
const SCHEMAS = require('./schemas.js');
const SORTIE = path.join(__dirname, 'captures', 'schema');
const PORT = 5211, DEBUG = 9357;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(SORTIE, { recursive: true });

const pages = {};
SCHEMAS.forEach(([nom, html]) => pages['/' + nom] = html);
http.createServer((q, r) => {
  const h = pages[q.url.split('?')[0]];
  if (!h) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(h);
}).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-sch-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true }); return r.result.value; };

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');

  for (const [nom] of SCHEMAS) {
    const m = pages['/' + nom].match(/width="(\d+)" height="(\d+)"/);
    const w = +m[1], h = +m[2];
    /* deux fois la taille : le trait reste net une fois posé dans la page */
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false });
    await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' + nom });
    await dors(1200);
    await js("document.fonts ? document.fonts.ready.then(()=>1) : 1");
    await dors(300);
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SORTIE, nom + '.png'), Buffer.from(r.data, 'base64'));
  }
  console.log(SCHEMAS.length + ' schémas dans ' + SORTIE);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error('ERREUR :', e.message); try { chrome.kill(); } catch (x) {} process.exit(2); });
