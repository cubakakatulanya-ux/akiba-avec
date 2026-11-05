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

  await js('if (!K.data.avecs.length) DB.reset();1');   // Akiba Suivi démarre vide : on recharge la démonstration pour les essais

  /* Revue de mise en page : tous les écrans de la cible, ouverts un par un.
     On attrape trois choses d'un coup — un écran qui lève une erreur, un écran qui
     déborde de la largeur du téléphone, et un écran vide. */
  await js('window.__ECRANS = ' + require('./tests/ecrans.js') + ';1', false);
  await js(`window.__akibaOuvre = i => {
    const [id, cible, sess, par] = window.__ECRANS[i];
    try {
      sess();
      App.go(id, typeof par === 'function' ? par() : par);
    } catch (e) { return { erreur: String(e && e.message || e).slice(0, 120) }; }
    const vw = innerWidth, dehors = [];
    for (const e of document.querySelectorAll('.shell *')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) continue;
      const cs = getComputedStyle(e);
      if (cs.position === 'fixed' || cs.position === 'absolute') continue;
      let coupe = false;                                   // un parent qui fait défiler n'est pas un débordement
      for (let p = e.parentElement; p && !coupe; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') coupe = true;
      }
      if (!coupe) dehors.push((e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0]).slice(0, 36));
    }
    /* la zone de contenu de l'écran, quel que soit son nom : .main pour les écrans ordinaires,
       .couv pour l'accueil, qui est une couverture pleine page et non une page à bandeau */
    const m = document.querySelector('.shell main') || document.querySelector('.main');
    return { arrive: App.screen, vide: !m || m.innerHTML.trim().length < 60, dehors: [...new Set(dehors)].slice(0, 3) };
  };1`, false);
  const DESSIN = require('./tests/design.js');
  const CIBLE = await js('window.AKIBA_CIBLE || "avec"', false);
  const nbEcrans = await js('window.__ECRANS.length', false);
  const revue = async () => {
    const out = [];
    for (let i = 0; i < nbEcrans; i++) {
      const [id, cible] = await js('(([a,b]) => [a,b])(window.__ECRANS[' + i + '])', false);
      if (cible && cible !== CIBLE) continue;
      const r = await js('window.__akibaOuvre(' + i + ')', false);
      await dors(90);
      const r2 = await js('window.__akibaOuvre(' + i + ')', false);   // après peinture : mesures stables
      const d = r.erreur ? null : await js(DESSIN, false);            // contraste, cibles, coupures
      out.push({ ecran: id, ...(r.erreur ? r : r2), dessin: d });
    }
    return out;
  };
  const pose = await revue();

  /* la batterie, dans la page */
  const suite = fs.readFileSync(path.join(__dirname, 'tests', 'suite.js'), 'utf8');
  await js(suite + ';1', false);
  const resultats = await js('__akibaTests()');

  /* les mêmes écrans, sur un ordinateur */
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await dors(300);
  const poseOrdi = await revue();

  /* Les feuilles : tout ce qui touche à l'argent passe par elles, et aucune revue ne les
     regardait. On les ouvre toutes, dans quatre situations. */
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  const feuilles = await js(require('./tests/feuilles.js'));

  /* rapport */
  const reussis = resultats.filter(r => r.ok).length;
  console.log('\n=== Essais fonctionnels ===');
  for (const r of resultats) console.log((r.ok ? '  OK   ' : '  ÉCHEC') + ' ' + r.nom + (r.detail ? '  — ' + r.detail : ''));
  const mauvais = p => !!(p.erreur || p.vide || (p.dehors && p.dehors.length));
  const ligne = p => '  ' + (mauvais(p) ? 'ÉCHEC' : 'OK   ') + ' ' + p.ecran.padEnd(12)
    + (p.erreur ? ' — erreur : ' + p.erreur
      : p.vide ? ' — écran vide'
        : (p.dehors && p.dehors.length) ? ' — déborde à droite : ' + p.dehors.join(', ')
          : (p.arrive && p.arrive !== p.ecran) ? ' (renvoyé vers ' + p.arrive + ')' : '');
  console.log('\n=== Revue des écrans, téléphone (375 x 812) ===');
  for (const p of pose) console.log(ligne(p));
  console.log('\n=== Revue des écrans, ordinateur (1440 x 900) ===');
  for (const p of poseOrdi) console.log(ligne(p));
  console.log('\n=== Revue des feuilles ===');
  /* Une feuille d'AVEC appelée depuis l'espace d'un animateur lève une erreur, et c'est normal :
     elle n'y est atteignable par aucun bouton. Ce qui compte, c'est qu'elle s'ouvre là où on
     l'atteint. Une feuille qui ne s'ouvre nulle part est, elle, hors d'usage. */
  const feuillesKo = feuilles.filter(f => !f.ouvre);
  for (const f of feuillesKo) console.log('  ÉCHEC ' + f.nom.padEnd(22) + ' — ne s’ouvre dans aucune situation' + (f.erreurs.length ? ' · ' + f.erreurs.join(' | ') : ''));
  console.log('  ' + (feuilles.length - feuillesKo.length) + '/' + feuilles.length + ' feuilles s’ouvrent sans erreur');

  /* Le dessin : ce qui se mesure sans l'œil — contraste réel, cibles du pouce, textes coupés.
     Un écran lisible dans un bureau peut être illisible dehors, et c'est dehors qu'on s'en sert. */
  const dessinRapport = (titre, liste, ordi) => {
    console.log('\n=== Revue du dessin, ' + titre + ' ===');
    const tot = { contraste: 0, cibles: 0, coupes: 0, petits: 0, rangs: 0 };
    const vus = {};
    for (const p of liste) {
      const d = p.dessin; if (!d) continue;
      for (const k of Object.keys(tot)) tot[k] += (d[k] || []).length;
      for (const c of d.contraste || []) { const cle = c.cl + '|' + c.r; if (!vus[cle]) { vus[cle] = 1; console.log('  CONTRASTE ' + String(c.r).padEnd(5) + ' pour ' + c.seuil + ' — ' + c.px + 'px .' + c.cl + ' « ' + c.t + ' » (' + p.ecran + ')'); } }
      for (const c of d.coupes || []) { const cle = 'x' + c.cl; if (!vus[cle]) { vus[cle] = 1; console.log('  COUPÉ     .' + c.cl + ' « ' + c.t + ' » perd ' + c.de + 'px (' + p.ecran + ')'); } }
      for (const c of d.petits || []) { const cle = 'p' + c.cl + c.px; if (!vus[cle]) { vus[cle] = 1; console.log('  PETIT     ' + c.px + 'px .' + c.cl + ' « ' + c.t + ' » (' + p.ecran + ')'); } }
      for (const c of d.rangs || []) { const cle = 'r' + c.cl + c.ecart; if (!vus[cle]) { vus[cle] = 1; console.log('  RANGÉE    .' + c.cl + ' — ' + c.n + ' cases, ' + c.ecart + 'px d’écart de hauteur, « ' + c.t + ' » (' + p.ecran + ')'); } }
      for (const c of d.cibles || []) { const cle = 'c' + c.cl + c.h; if (!vus[cle]) { vus[cle] = 1; console.log('  CIBLE     ' + c.w + 'x' + c.h + ' .' + c.cl + ' « ' + c.t + ' » (' + p.ecran + ')'); } }
    }
    if (ordi) {
      const etroits = liste.filter(p => p.dessin && p.dessin.part < 55).map(p => p.ecran + ' ' + p.dessin.part + '%');
      if (etroits.length) console.log('  VIDE      ' + etroits.length + ' écran(s) occupent moins de 55 % de la largeur : ' + etroits.join(', '));
    }
    console.log('  ' + tot.contraste + ' contraste(s) faible(s), ' + tot.coupes + ' texte(s) coupé(s), ' + tot.petits + ' texte(s) sous 12px, ' + tot.rangs + ' rangée(s) mal alignée(s)' + (ordi ? '' : ', ' + tot.cibles + ' cible(s) trop petite(s)'));
    return tot.contraste + tot.coupes + tot.petits + tot.rangs + (ordi ? 0 : tot.cibles);
  };
  const dessinTel = dessinRapport('téléphone', pose, false);
  const dessinOrdi = dessinRapport('ordinateur', poseOrdi, true);

  console.log('\n=== Erreurs de console ===');
  console.log(erreursConsole.length ? erreursConsole.map(e => '  ' + e).join('\n') : '  aucune');

  const echecs = resultats.length - reussis + pose.filter(mauvais).length + poseOrdi.filter(mauvais).length + erreursConsole.length + feuillesKo.length;
  console.log('\nRésultat : ' + reussis + '/' + resultats.length + ' essais fonctionnels réussis, ' + echecs + ' problème(s) au total.');

  ws.close(); chrome.kill(); serveur.close();
  process.exit(echecs ? 1 : 0);
})().catch(e => { console.error('ERREUR DU LANCEUR :', e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
