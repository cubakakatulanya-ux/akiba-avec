/* Les captures annotées du manuel.

   Une capture d'écran montre ce qui est à l'écran ; elle n'apprend rien. Ce programme pose
   des repères numérotés sur les éléments qui comptent — le grand bouton, la caisse, les
   alertes — avec une flèche vers chacun. Le manuel, en face, dit ce que porte chaque numéro.

   Les repères sont dessinés dans la page avant la photo : ils sont donc toujours placés sur
   l'élément réel, même si l'écran change.

   Usage :  node tests/captures-annotees.js                                               */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const SORTIE = path.join(__dirname, '..', 'manuel/captures/annote');
const PORT = 5213, DEBUG = 9359;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(SORTIE, { recursive: true });

/* Chaque entrée : le nom de l'image, la cible, le geste qui ouvre l'écran, et les repères.
   Un repère vise un élément par un morceau de son texte, ou par un sélecteur. */
const VUES = [
  ['accueil-groupe', 'docs', 1440, 900, "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.home');", [
    ['.tabbar', 'La navigation : accueil, membres, crédits, journal', 'droite'],
    ['selecteur:.caisse', 'L’argent du groupe, et ses deux poches', 'droite'],
    ['texte:À surveiller', 'Ce qui demande une action', 'droite'],
    ['.btn.primary', 'Le geste du jour : un seul grand bouton', 'gauche'],
    ['.sync', 'Ce qui n’existe encore que sur ce téléphone', 'gauche'],
  ]],
  ['reunion-remboursements', 'docs', 390, 844, "const a=avecById('avec1'); a.meetings=a.meetings.filter(m=>m.status!=='open'); K.session={kind:'avec',avecId:a.id,memberId:bureauOf(a)[0].id}; const n=a.meetings.reduce((x,m)=>Math.max(x,m.n),0)+1, pr={}; activeM(a).forEach(x=>pr[x.id]='P'); a.meetings.push({id:a.id+'-an',n,cycle:a.cycle.n,date:Date.now(),status:'open',presence:pr,openedBy:K.session.memberId,stepDone:3,openExpected:stats(a).cash,openCount:stats(a).cash,synced:false}); DB.save(); App.go('a.meet',{step:4});", [
    ['selecteur:.etapes, .steps, .shell main nav', 'Les huit étapes, et où l’on en est', 'bas'],
    ['texte:Échéance', 'Remettre le montant prévu', 'gauche'],
    ['texte:Solder', 'Écrire tout ce qui reste, même avant la fin', 'droite'],
    ['texte:Enregistrer les remboursements', 'Passer à l’étape suivante', 'gauche'],
  ]],
  ['membres', 'docs', 1440, 900, "K.session={kind:'avec',avecId:'avec1',memberId:bureauOf(avecById('avec1'))[0].id}; App.go('a.members');", [
    ['texte:Ajouter', 'Un nouveau membre', 'bas'],
    ['texte:Cartes', 'Dix cartes par feuille A4', 'bas'],
    ['texte:Livrets', 'Une page A4 par membre', 'bas'],
  ]],
  ['tableau-animateur', 'docs-suivi', 1440, 900, "K.session={kind:'anim',userId:K.data.users.find(u=>u.role==='anim').id}; App.go('n.home');", [
    ['texte:Mes AVEC', 'Les groupes de cet animateur', 'droite'],
    ['texte:Recevoir une AVEC', 'Reprendre le cahier d’un groupe', 'droite'],
    ['texte:Exporter vers Excel', 'Le rapport, hors connexion', 'droite'],
  ]],
];

const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-an-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; };

/* le dessin des repères, posé dans la page */
const POSE = `window.__repere = (reperes) => {
  document.querySelectorAll('.__rep').forEach(e => e.remove());
  const trouve = (c) => {
    if (c.startsWith('selecteur:')) return document.querySelector(c.slice(10));
    if (c.startsWith('texte:')) { const t = c.slice(6);
      return [...document.querySelectorAll('.shell *')].find(e => e.children.length <= 2 && (e.textContent || '').trim().startsWith(t)); }
    return document.querySelector(c);
  };
  let n = 0, poses = [], idx = -1;
  for (const [cible, , cote] of reperes) {
    idx++;
    const el = trouve(cible); if (!el) continue;
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    n++;
    let x = cote === 'gauche' ? r.left - 34 : cote === 'bas' ? r.left + r.width / 2 - 15 : r.right + 6;
    let y = cote === 'bas' ? r.bottom + 6 : r.top + Math.min(r.height / 2, 22) - 15;
    x = Math.max(4, Math.min(x, innerWidth - 36)); y = Math.max(4, Math.min(y, innerHeight - 36));
    const d = document.createElement('div');
    d.className = '__rep';
    d.textContent = n;
    d.setAttribute('style', 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:30px;height:30px;border-radius:50%;'
      + 'background:#F2B705;color:#1B2A24;font:700 17px/30px Ubuntu,system-ui,sans-serif;text-align:center;z-index:99999;'
      + 'box-shadow:0 0 0 3px rgba(255,255,255,.95),0 2px 6px rgba(0,0,0,.35)');
    document.body.appendChild(d);
    /* le cadre qui entoure l'élément visé */
    const c = document.createElement('div');
    c.className = '__rep';
    c.setAttribute('style', 'position:fixed;left:' + (r.left - 3) + 'px;top:' + (r.top - 3) + 'px;width:' + (r.width + 6) + 'px;height:'
      + (Math.min(r.height, innerHeight - r.top) + 6) + 'px;border:2.5px solid #F2B705;border-radius:10px;z-index:99998;pointer-events:none');
    document.body.appendChild(c);
    poses.push(idx);
  }
  return poses;
};1`;

(async () => {
  /* un serveur par dossier : les deux applications ont chacune le leur */
  const serveurs = {};
  for (const d of ['docs', 'docs-suivi']) {
    const racine = path.join(__dirname, '..', d);
    serveurs[d] = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
      fs.readFile(path.join(racine, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
        r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
    }).listen(d === 'docs' ? PORT : PORT + 1);
  }
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  for (const [nom, dossier, w, h, geste, reperes] of VUES) {
    const port = dossier === 'docs' ? PORT : PORT + 1;
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 500 });
    await cdp('Page.navigate', { url: 'http://localhost:' + port + '/?x=' + Math.random() });
    for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
    await dors(800);
    await js("if (!K.data.avecs.length) DB.reset(); try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); 1", false);
    await js(geste + ' 1', false);
    await dors(700);
    await js(POSE, false);
    const poses = await js('window.__repere(' + JSON.stringify(reperes) + ')', false);
    await dors(300);
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SORTIE, nom + '.png'), Buffer.from(r.data, 'base64'));
    console.log(nom + ' · ' + poses.length + '/' + reperes.length + ' repère(s)');
    poses.forEach((i, k) => console.log('      ' + (k + 1) + '. ' + reperes[i][1]));
  }
  ws.close(); chrome.kill(); Object.values(serveurs).forEach(s => s.close()); process.exit(0);
})().catch(e => { console.error('ERREUR :', e.message); try { chrome.kill(); } catch (x) {} process.exit(2); });
