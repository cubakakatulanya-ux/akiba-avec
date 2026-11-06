/* Relire le manuel : le rendre en pages-images, pour le voir tel qu'il s'imprimera.

   Sans LibreOffice sur cette machine, le fichier Word ne peut pas être relu à l'œil. La page
   web du manuel, elle, se rend dans le même navigateur que les captures — à la largeur exacte
   d'une A4 — et se découpe en images d'une hauteur de page. C'est la relecture.

   Usage :  node manuel/relire.js [pas]        (par défaut, une image toutes les 1 050 px)   */
const fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');

const SORTIE = path.join(__dirname, 'relecture');
const HTML = path.join(__dirname, 'Akiba-manuel-utilisation.html');
const PAS = +(process.argv[2] || 1050);
const PORT = 5219, DEBUG = 9363;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.rmSync(SORTIE, { recursive: true, force: true });
fs.mkdirSync(SORTIE, { recursive: true });
const html = fs.readFileSync(HTML, 'utf8');
const serveur = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); }).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-rel-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true }); return r.result.value; };

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' });
  await dors(4500);
  const haut = await js('document.body.scrollHeight', false);
  const n2 = Math.ceil(haut / PAS);
  for (let i = 0; i < n2; i++) {
    await js('scrollTo(0,' + (i * PAS) + ');1', false);
    await dors(260);
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SORTIE, 'p' + String(i + 1).padStart(2, '0') + '.png'), Buffer.from(r.data, 'base64'));
  }
  console.log(n2 + ' images de ' + 794 + 'x1123 dans ' + SORTIE + ' (document de ' + haut + ' px)');
  ws.close(); chrome.kill(); serveur.close(); process.exit(0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
