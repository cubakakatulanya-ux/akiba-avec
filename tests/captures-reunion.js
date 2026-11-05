/* Les captures de la réunion, étape par étape.

   Le manuel doit montrer les huit étapes d'une séance telles qu'elles se présentent au
   secrétaire, et les trois feuilles qui portent l'argent : accorder un crédit, le journal de
   la séance, montrer la séance à l'animateur. Ce programme tient une vraie réunion sur les
   données de démonstration et photographie chaque étape.

   Usage :  node tests/captures-reunion.js                                    */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..', 'docs');
const SORTIE = path.join(__dirname, '..', 'manuel/captures/reunion');
const PORT = 5208, DEBUG = 9353;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

fs.mkdirSync(SORTIE, { recursive: true });
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.join(RACINE, u);
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
}).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-cr-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; };
const image = async nom => { const r = await cdp('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SORTIE, nom + '.png'), Buffer.from(r.data, 'base64')); return nom; };

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  const faites = [];
  for (const [etiq, w, h, dsf, mob] of [['tel', 390, 844, 2, true], ['ordi', 1440, 900, 1, false]]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: mob });
    await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
    for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs && K.data.avecs.length)", false)) break; } catch (e) {} }
    await dors(900);
    await js("try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); DB.reset(); 1", false);
    await dors(700);
    /* une séance fraîche, tenue par la présidente */
    await js(`const a = K.data.avecs[0];
      a.meetings = a.meetings.filter(m => m.status !== 'open');
      K.session = { kind: 'avec', avecId: a.id, memberId: bureauOf(a)[0].id };
      const n = a.meetings.reduce((x, m) => Math.max(x, m.n), 0) + 1, presence = {};
      activeM(a).forEach((x, i) => presence[x.id] = i === 3 ? 'R' : i === 7 ? 'A' : 'P');
      a.meetings.push({ id: a.id + '-cap', n, cycle: a.cycle.n, date: Date.now(), status: 'open',
        presence, openedBy: K.session.memberId, stepDone: 0, openExpected: stats(a).cash, openCount: 0, synced: false });
      DB.save(); 1`, false);
    for (let e = 1; e <= 8; e++) {
      await js(`App.go('a.meet', { step: ${e} }); 1`, false);
      await dors(520);
      faites.push(await image(etiq + '-etape-' + e));
    }
    /* les feuilles qui portent l'argent */
    const feuilles = [
      ['credit', "App.go('a.meet',{step:6}); ACT.loanSheet({});"],
      ['journal-seance', "const a=K.data.avecs[0]; const m=a.meetings.filter(x=>x.status==='closed').slice(-1)[0]; ACT.journalReunionVoir({ id: a.id, m: m.id });"],
      ['montrer-animateur', "const a=K.data.avecs[0]; const m=a.meetings.filter(x=>x.status==='closed').slice(-1)[0]; await ACT.qrReunion({ id: a.id, m: m.id });"],
    ];
    for (const [nom, geste] of feuilles) {
      try { await js('(async () => { ' + geste + ' })()'); } catch (err) { continue; }
      await dors(900);
      if (!(await js('!!App.sheet', false))) continue;
      faites.push(await image(etiq + '-feuille-' + nom));
      await js('App.closeSheet();1', false);
    }
  }
  console.log(faites.length + ' images dans ' + SORTIE);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error('ERREUR :', e.message); try { chrome.kill(); } catch (x) {} process.exit(2); });
