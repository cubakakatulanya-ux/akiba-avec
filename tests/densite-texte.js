/* Combien de mots l'application fait-elle lire, écran par écran ?

   Akiba s'adresse à des gens qui lisent peu et qui travaillent debout, en assemblée. Chaque
   phrase qu'on ajoute « pour être clair » est une phrase que personne ne lira, et qui pousse
   le bouton utile plus bas. Ce banc ne juge pas le style : il compte, pour que la discussion
   porte sur des chiffres plutôt que sur des impressions.

   Trois mesures par écran :
     — les mots en tout ;
     — les mots D'EXPLICATION : ce qui est écrit en muted, hint, small, tip, alert — le texte
       qu'on lit une fois et jamais plus, par opposition aux noms, montants et boutons ;
     — combien de pixels de haut il faut descendre avant d'atteindre le premier bouton.

   Usage :  node tests/densite-texte.js [docs|docs-suivi] [--tout]                          */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const CIBLE_DOSSIER = process.argv.find(a => a === 'docs-suivi') ? 'docs-suivi' : 'docs';
const TOUT = process.argv.includes('--tout');
const RACINE = path.join(__dirname, '..', CIBLE_DOSSIER);
const PORT = 5252, DEBUG = 9348;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const dors = ms => new Promise(r => setTimeout(r, ms));
const serveur = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(RACINE, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
}).listen(PORT);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-dt-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value; };

/* la mesure, faite dans la page : on compte ce qui est VISIBLE, pas ce qui est dans le code */
const MESURE = `(() => {
  const main = document.querySelector('.shell main') || document.querySelector('.main');
  if (!main) return null;
  const mots = t => (String(t || '').trim().match(/[^\\s]+/g) || []).length;
  const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const total = mots(main.innerText);
  /* ce qui explique, par opposition à ce qui agit ou chiffre */
  const EXPL = '.muted, .hint, .small, .tip, .alert span, p.lead, .pas3 span, .echange span';
  let expl = 0;
  main.querySelectorAll(EXPL).forEach(e => { if (!visible(e)) return;
    /* on ne compte pas deux fois un texte imbriqué */
    if (e.parentElement && e.parentElement.closest(EXPL)) return;
    expl += mots(e.innerText); });
  /* à quelle hauteur se trouve le premier bouton : c'est ce qu'il faut lire ou sauter */
  const haut = main.getBoundingClientRect().top;
  const b = [...main.querySelectorAll('button, .btn, a.btn')].filter(visible)[0];
  const avantBouton = b ? Math.max(0, Math.round(b.getBoundingClientRect().top - haut)) : null;
  const paragraphes = [...main.querySelectorAll('p, .hint, .tip')].filter(visible)
    .map(e => ({ mots: mots(e.innerText), texte: e.innerText.trim().replace(/\\s+/g, ' ').slice(0, 90) }))
    .filter(x => x.mots >= 12).sort((a, b) => b.mots - a.mots);
  return { total, expl, part: total ? Math.round(expl * 100 / total) : 0, avantBouton, paragraphes };
})()`;

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
  await dors(700);
  await js("if (!K.data.avecs.length) DB.reset(); try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); 1", false);
  await js('window.__ECRANS = ' + require('./ecrans.js') + ';1', false);
  await js(`window.__ouvre = (i) => { const [id, cible, avant, p] = window.__ECRANS[i];
    try { if (typeof avant === 'function') avant(); App.go(id, typeof p === 'function' ? p() : p); return { id }; }
    catch (e) { return { id, erreur: e.message }; } };1`, false);

  const CIBLE = await js('window.AKIBA_CIBLE || "avec"', false);
  const nb = await js('window.__ECRANS.length', false);
  const lignes = [];
  for (let i = 0; i < nb; i++) {
    const [id, cible] = await js('(([a,b]) => [a,b])(window.__ECRANS[' + i + '])', false);
    if (cible && cible !== CIBLE) continue;
    const o = await js('window.__ouvre(' + i + ')', false);
    if (o.erreur) continue;
    await dors(140);
    const m = await js(MESURE, false);
    if (m) lignes.push({ ecran: id, ...m });
  }

  /* on garde le pire passage de chaque écran : certains apparaissent deux fois */
  const parEcran = new Map();
  for (const l of lignes) { const a = parEcran.get(l.ecran); if (!a || l.total > a.total) parEcran.set(l.ecran, l); }
  const tri = [...parEcran.values()].sort((a, b) => b.total - a.total);

  const nom = CIBLE === 'suivi' ? 'AKIBA SUIVI' : 'AKIBA';
  console.log('');
  console.log(`  ${nom} — COMBIEN DE MOTS L'APPLICATION FAIT LIRE`);
  console.log('  ' + '─'.repeat(92));
  console.log('  écran'.padEnd(20) + 'mots'.padStart(6) + 'explication'.padStart(14) + 'part'.padStart(7) + 'px avant le 1er bouton'.padStart(26));
  const montre = TOUT ? tri : tri.slice(0, 12);
  for (const l of montre) {
    console.log('  ' + l.ecran.padEnd(18) + String(l.total).padStart(6) + String(l.expl).padStart(14)
      + (l.part + ' %').padStart(7) + (l.avantBouton === null ? '—' : String(l.avantBouton)).padStart(26));
  }
  const tot = tri.reduce((a, l) => a + l.total, 0), totE = tri.reduce((a, l) => a + l.expl, 0);
  console.log('  ' + '─'.repeat(92));
  console.log(`  ${tri.length} écrans · ${tot} mots en tout · ${totE} d'explication (${Math.round(totE * 100 / tot)} %) · ${Math.round(tot / tri.length)} mots par écran en moyenne`);
  console.log('');
  console.log('  LES PLUS LONGS PARAGRAPHES');
  const paras = [];
  for (const l of tri) (l.paragraphes || []).forEach(p => paras.push({ ecran: l.ecran, ...p }));
  paras.sort((a, b) => b.mots - a.mots).slice(0, 12).forEach(p =>
    console.log(`  ${String(p.mots).padStart(3)} mots · ${p.ecran.padEnd(14)} « ${p.texte}… »`));
  console.log('');

  ws.close(); chrome.kill(); serveur.close(); process.exit(0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
