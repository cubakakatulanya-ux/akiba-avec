/* Le même manuel, en page web imprimable — puis en PDF.

   Deux raisons. La première est pratique : un PDF se lit sur n'importe quel téléphone, se
   met sur une clé, s'imprime au village, et ne dépend pas de la police installée sur la
   machine. La seconde est une question d'honnêteté : sans LibreOffice sur cette machine, le
   fichier Word ne peut pas être relu à l'œil. Le PDF, lui, se relit page par page — et comme
   il sort du même contenu que le Word, un défaut vu ici est un défaut corrigé là.

   Usage :  node manuel/faire-manuel-html.js                                              */
const fs = require('fs'), path = require('path'), http = require('http'), { spawn } = require('child_process');

const RACINE = __dirname;
const blocs = [].concat(require('./contenu-1.js'), require('./contenu-2.js'), require('./contenu-3.js'), require('./contenu-4.js'));
const PORT = 5215, DEBUG = 9361;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* **gras** et `nom de fichier` : les marques de travail ne doivent jamais s'imprimer. */
const gras = t => esc(t).split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  .map(b => /^\*\*/.test(b) ? '<b>' + b.slice(2, -2) + '</b>'
    : /^`/.test(b) ? '<code>' + b.slice(1, -1) + '</code>' : b).join('');
const b64 = p => { const f = path.join(RACINE, 'captures', p + '.png'); return fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : null; };

let n1 = 0;
const corps = blocs.map(([k, a, c]) => {
  if (k === 'h1') { n1++; return `<h1 id="c${n1}">${esc(a)}</h1>`; }
  if (k === 'h2') return `<h2>${esc(a)}</h2>`;
  if (k === 'h3') return `<h3>${esc(a)}</h3>`;
  if (k === 'p') return `<p>${gras(a)}</p>`;
  if (k === 'ul') return '<ul>' + a.map(x => `<li>${gras(x)}</li>`).join('') + '</ul>';
  if (k === 'ol') return '<ol>' + a.map(x => `<li>${gras(x)}</li>`).join('') + '</ol>';
  if (k === 'reperes') return '<ol class="reperes">' + a.map(x => `<li>${gras(x)}</li>`).join('') + '</ol>';
  if (k === 'tip') return `<div class="bloc tip"><b>À RETENIR</b><p>${gras(a)}</p></div>`;
  if (k === 'attention') return `<div class="bloc att"><b>ATTENTION</b><p>${gras(a)}</p></div>`;
  if (k === 'tbl') return `<table><thead><tr>${a.map(t => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>`
    + c.map(l => `<tr>${l.map(t => `<td>${gras(t)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
  if (k === 'fig') { const d = b64(a); if (!d) { console.warn('image absente : ' + a); return ''; }
    const tel = /(^|\/)tel-/.test(a);
    return `<figure class="${tel ? 'tel' : ''}"><img src="data:image/png;base64,${d}" alt=""><figcaption>${esc(c)}</figcaption></figure>`; }
  if (k === 'saut') return '<div class="saut"></div>';
  return '';
}).join('\n');

const sommaire = blocs.filter(b => b[0] === 'h1').map((b, i) => `<li><a href="#c${i + 1}">${esc(b[1])}</a></li>`).join('');

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Akiba — manuel d’utilisation</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 18mm 16mm 16mm; }
  :root { --vert:#26600E; --encre:#1B2A24; --gris:#5C6B64; --or:#F2B705; --ligne:#E2E5E2; --clair:#F4F7F4; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:Ubuntu,system-ui,sans-serif; font-size:12pt; line-height:1.5; color:var(--encre); }
  /* un nom de fichier : même police, mais détaché du texte courant, sans accents graves */
  code { font-family:inherit; font-weight:700; white-space:nowrap; }
  @media screen { body { padding:18mm 16mm; } }
  h1 { font-size:22pt; color:var(--vert); margin:0 0 10pt; page-break-before:always; page-break-after:avoid; }
  h1:first-of-type { page-break-before:avoid; }
  h2 { font-size:15pt; margin:16pt 0 6pt; page-break-after:avoid; }
  h3 { font-size:12.5pt; color:var(--vert); margin:12pt 0 4pt; page-break-after:avoid; }
  p { margin:0 0 7pt; }
  ul, ol { margin:0 0 8pt; padding-left:18pt; }
  li { margin:0 0 4pt; }
  ol.reperes { list-style:none; padding-left:0; counter-reset:rep; margin:4pt 0 12pt; }
  ol.reperes li { counter-increment:rep; padding-left:30pt; position:relative; margin-bottom:5pt; }
  ol.reperes li::before { content:counter(rep); position:absolute; left:0; top:1pt; width:19pt; height:19pt;
    border-radius:50%; background:var(--or); color:var(--encre); font-weight:700; font-size:10.5pt; text-align:center; line-height:19pt; }
  figure { margin:10pt 0 12pt; text-align:center; page-break-inside:avoid; }
  figure img { max-width:100%; border:1px solid var(--ligne); border-radius:4pt; }
  figure.tel img { max-width:46mm; }
  figcaption { font-size:9.5pt; color:var(--gris); font-style:italic; margin-top:3pt; }
  table { width:100%; border-collapse:collapse; margin:6pt 0 12pt; font-size:10.5pt; page-break-inside:avoid; }
  th { background:var(--vert); color:#fff; text-align:left; padding:5pt 7pt; font-weight:700; }
  td { border:1px solid var(--ligne); padding:5pt 7pt; vertical-align:top; }
  tbody tr:nth-child(even) td { background:var(--clair); }
  .bloc { border:1px solid var(--ligne); border-left:4pt solid var(--vert); background:var(--clair);
    padding:7pt 10pt; margin:8pt 0 12pt; page-break-inside:avoid; }
  .bloc b { display:block; font-size:9pt; letter-spacing:.08em; color:var(--vert); margin-bottom:2pt; }
  .bloc.att { border-left-color:#A05A00; } .bloc.att b { color:#A05A00; }
  .bloc p { margin:0; }
  .couv { height:245mm; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; page-break-after:always; }
  .couv .nom { font-size:58pt; font-weight:700; color:var(--vert); letter-spacing:.04em; }
  .couv .bar { width:48mm; height:3pt; background:var(--or); margin:6mm 0 8mm; }
  .couv .t { font-size:18pt; font-weight:700; }
  .couv .s { font-size:12pt; color:var(--gris); margin-top:3mm; }
  .couv .pied { margin-top:26mm; font-size:10.5pt; color:var(--gris); line-height:1.8; }
  .som { page-break-after:always; }
  .som h1 { page-break-before:avoid; }
  .som ol { font-size:12pt; columns:2; column-gap:12mm; list-style:none; padding-left:0; }
  .som a { color:var(--encre); text-decoration:none; }
  .saut { page-break-after:always; }
</style></head><body>
<div class="couv">
  <div class="nom">AKIBA</div><div class="bar"></div>
  <div class="t">MANUEL D’UTILISATION</div>
  <div class="s">Akiba — le cahier du groupe&nbsp;&nbsp;·&nbsp;&nbsp;Akiba Suivi — animateurs et organisations</div>
  <div class="pied">Entreprise Sociale Ubora · Lubumbashi, République démocratique du Congo<br>pour les AVEC des vingt-six provinces<br>
    akiba.uborardc.com&nbsp;&nbsp;·&nbsp;&nbsp;akibas.uborardc.com<br>
    Édition du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="som"><h1 style="page-break-before:avoid">Sommaire</h1><ol>${sommaire}</ol></div>
${corps}
</body></html>`;

const sortieHtml = path.join(RACINE, 'Akiba-manuel-utilisation.html');
fs.writeFileSync(sortieHtml, html);

/* ---- et le PDF, par le même navigateur sans fenêtre que les captures ---- */
const serveur = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); }).listen(PORT);
const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--force-color-profile=srgb',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-pdf-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/' });
  await dors(4500);
  const r = await cdp('Page.printToPDF', {
    printBackground: true, paperWidth: 8.27, paperHeight: 11.69,
    marginTop: 0.71, marginBottom: 0.63, marginLeft: 0.63, marginRight: 0.63,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:Ubuntu,sans-serif;font-size:8pt;color:#5C6B64;padding:0 16mm;display:flex;justify-content:space-between">'
      + '<span>Akiba — manuel d’utilisation</span><span>page <span class="pageNumber"></span> sur <span class="totalPages"></span></span></div>',
  });
  const out = path.join(RACINE, 'Akiba-manuel-utilisation.pdf');
  fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
  console.log('écrit : ' + out + ' · ' + Math.round(fs.statSync(out).size / 1024) + ' Ko');
  ws.close(); chrome.kill(); serveur.close(); process.exit(0);
})().catch(e => { console.error('ERREUR :', e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
