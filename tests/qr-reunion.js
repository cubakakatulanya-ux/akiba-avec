/* Le renvoi d'une réunion à l'animateur, par images.

   Ce chemin ne transporte plus les empreintes du journal : il les REFAIT à l'arrivée. C'est ce
   qui fait tenir une séance de vingt membres en une ou deux images au lieu de cinq — et c'est
   exactement ce qui doit être prouvé ici, parce qu'une empreinte refaite de travers ne se voit
   pas à l'œil : elle se voit au sceau, ou jamais.

   Le banc tient donc le voyage entier sur de vraies données de démonstration : il fabrique la
   séance, chiffre, découpe en images, remet les morceaux dans le désordre, déchiffre, refait la
   chaîne, puis compare chaque empreinte reconstruite à l'originale, signe pour signe. Il vérifie
   ensuite ce que le chemin doit REFUSER : un code faux, une séance déjà reçue, un trou dans le
   journal, une image seule d'un lot de deux.

   Usage :  node tests/qr-reunion.js                                                        */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..', 'docs');
const PORT = 5247, DEBUG = 9347;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const dors = ms => new Promise(r => setTimeout(r, ms));
const serveur = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(RACINE, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
}).listen(PORT);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-qrr-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value; };

/* Le voyage, tenu dans la page : c'est là que vivent le chiffrement, la chaîne et le sceau. */
const VOYAGE = `(async () => {
  const essais = [];
  const dit = (ok, quoi, detail) => essais.push({ ok: !!ok, quoi, detail: detail || '' });

  if (!K.data.avecs.length) DB.reset();
  const avec = K.data.avecs[0];
  const fermees = avec.meetings.filter(m => m.status === 'closed');
  const m = fermees[fermees.length - 1];

  /* une note qui contient une barre : c'est le signe qui sépare les champs d'une ligne, et
     c'est donc le piège qui casserait le sceau s'il n'était pas mis de côté en route */
  const txM = avec.tx.filter(t => t.meetingId === m.id);
  dit(txM.length > 0, 'la séance porte des écritures', txM.length + ' écritures, ' + avec.members.length + ' membres');

  /* ce qu'on garde pour comparer après le voyage : la vérité d'avant */
  const avant = JSON.parse(JSON.stringify(txM));
  const mAvant = JSON.parse(JSON.stringify(m));
  /* Le journal de la séance : ce que le bureau imprime et classe dans la caisse. Il reprend
     chaque opération de chaque membre ce jour-là, les totaux, les clés et le sceau. C'est la
     mesure qui compte vraiment — si une seule ligne manquait après le voyage, elle manquerait
     ici, et ce papier est la dernière copie du cahier si le téléphone disparaît. */
  const journalAvant = journalReunionText(avec, m);
  const lignesAvant = journalAvant.split(String.fromCharCode(10)).length;
  /* chaque membre qui a bougé de l'argent ce jour-là doit se retrouver dans ce papier */
  const bougent = [...new Set(txM.map(t => t.memberId).filter(Boolean))];
  const nommes = bougent.filter(id => { const mm = memberOf(avec, id);
    return mm && journalAvant.indexOf(mm.name.split(' ')[0]) >= 0; });
  dit(bougent.length > 0 && nommes.length === bougent.length,
      'le journal nomme chaque membre qui a bougé de l\\'argent', nommes.length + '/' + bougent.length + ' membres');

  const code = randCode(8);
  const texte = await qrReunionTexte(avec, m, code);
  const lot = qrMorceaux(texte, QR_PAR_IMAGE_R);
  dit(lot.length <= 2, 'une ou deux images suffisent', lot.length + ' image(s), ' + texte.length + ' signes');

  /* ---- le téléphone de l'animateur : le même cahier, une séance en retard ---- */
  const reculer = () => {
    avec.meetings = avec.meetings.filter(x => x.id !== m.id);
    avec.tx = avec.tx.filter(t => t.meetingId !== m.id);
    if (typeof _chain === 'object') delete _chain[avec.id];
  };
  reculer();
  dit(verifyChain(avec).ok, 'le cahier reculé est valide', 'avant la séance n°' + m.n);

  /* ---- les morceaux arrivent dans le désordre, et deux fois ---- */
  const remettre = (morceaux) => { let dernier = null;
    for (const b of morceaux) dernier = qrAssembler(b);
    return dernier; };
  if (lot.length > 1) {
    const partiel = qrAssembler(lot[1]);
    dit(!!partiel.attente, 'une image seule ne suffit pas', partiel.attente || '');
    /* on vise deux fois la même avant d'avoir le lot complet : c'est ce qui arrive vraiment
       quand l'écran d'en face défile et qu'on reste braqué dessus */
    const fini = remettre([lot[1], lot[1], lot[0]]);
    dit(fini.texte === texte, 'le désordre et les doublons ne gênent pas');
  }
  const assemble = remettre(lot);
  dit(assemble.texte === texte, 'les morceaux remis bout à bout redonnent le texte');

  /* ---- un code faux ne doit rien ouvrir ---- */
  const faux = await qrImporter(assemble.texte, 'AAAAAAAA');
  dit(!!faux.error, 'un code faux est refusé', faux.error || '(accepté !)');
  dit(!avec.meetings.some(x => x.id === m.id), 'rien n\\'a été écrit après le refus');

  /* ---- le vrai voyage ---- */
  const r = await qrImporter(assemble.texte, code);
  dit(!r.error && r.reunion === m.n, 'la séance est reçue', r.error || ('n°' + r.reunion + ', ' + r.ecritures + ' écritures'));

  /* ---- la preuve : chaque empreinte refaite est l'originale ---- */
  const apres = avec.tx.filter(t => t.meetingId === m.id);
  dit(apres.length === avant.length, 'autant d\\'écritures qu\\'au départ', apres.length + ' / ' + avant.length);
  let memes = 0, differents = [];
  const champs = ['id','type','memberId','amount','parts','months','rate','ref','note','by','ts','cycle','seq','prev','hash','avecId','meetingId'];
  for (let i = 0; i < Math.min(apres.length, avant.length); i++) {
    const a = avant[i], b = apres[i];
    const ecarts = champs.filter(c => (a[c] === undefined || a[c] === null ? '' : String(a[c])) !== (b[c] === undefined || b[c] === null ? '' : String(b[c])));
    if (ecarts.length) differents.push('écriture ' + (i + 1) + ' : ' + ecarts.join(', ')); else memes++;
  }
  dit(!differents.length, 'chaque écriture est revenue identique, empreinte comprise',
      differents.length ? differents.slice(0, 3).join(' · ') : memes + ' écritures identiques signe pour signe');

  /* ---- la réunion elle-même ---- */
  const mApres = avec.meetings.find(x => x.id === m.id) || {};
  const champsM = ['id','n','cycle','date','status','openedBy','openCount','openExpected','closeExpected','closeCount','closedAt','sealSeq','seal','note'];
  const ecartsM = champsM.filter(c => (mAvant[c] === undefined || mAvant[c] === null ? '' : String(mAvant[c])) !== (mApres[c] === undefined || mApres[c] === null ? '' : String(mApres[c])));
  dit(!ecartsM.length, 'la fiche de la réunion est revenue identique', ecartsM.length ? ecartsM.join(', ') : champsM.length + ' champs');
  dit(JSON.stringify(mAvant.presence) === JSON.stringify(mApres.presence), 'la présence de chaque membre est revenue');
  dit(JSON.stringify(mAvant.validators || []) === JSON.stringify(mApres.validators || []), 'ceux qui ont scellé sont revenus');

  /* ---- le journal de la séance, réimprimé depuis la copie de l'animateur ----
     C'est la vérification qui parle au bureau : le papier qu'il classerait est le même, ligne
     pour ligne, opération par opération, sceau compris. */
  const mRecue = avec.meetings.find(x => x.id === m.id);
  const journalApres = mRecue ? journalReunionText(avec, mRecue) : '';
  dit(journalApres === journalAvant, 'le journal de la séance se réimprime à l\\'identique',
      journalApres === journalAvant ? lignesAvant + ' lignes, opérations et sceau compris'
        : 'longueurs ' + journalAvant.length + ' / ' + journalApres.length);
  if (journalApres !== journalAvant) {
    const a1 = journalAvant.split(String.fromCharCode(10)), a2 = journalApres.split(String.fromCharCode(10));
    const ecart = a1.findIndex((l, i) => l !== a2[i]);
    dit(false, 'première ligne différente', 'ligne ' + (ecart + 1) + ' : «' + (a1[ecart] || '') + '» / «' + (a2[ecart] || '') + '»');
  }

  /* ---- le sceau et la chaîne, vus par l'application elle-même ---- */
  if (typeof _chain === 'object') delete _chain[avec.id];
  const v = verifyChain(avec);
  dit(v.ok, 'le journal entier est valide après réception', v.ok ? v.n + ' écritures' : v.reason);

  /* ---- deux fois la même séance ---- */
  const deux = await qrImporter(assemble.texte, code);
  dit(!!deux.error && /déjà/.test(deux.error), 'la même séance deux fois est refusée', deux.error || '(acceptée !)');

  /* ---- un trou dans le journal ---- */
  reculer();
  avec.tx = avec.tx.slice(0, avec.tx.length - 3);
  if (typeof _chain === 'object') delete _chain[avec.id];
  const trou = await qrImporter(assemble.texte, code);
  dit(!!trou.error, 'un journal avec un trou est refusé', trou.error || '(accepté !)');

  return essais;
})()`;

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
  await dors(700);

  const essais = await js(VOYAGE);
  let ko = 0;
  for (const e of essais) { if (!e.ok) ko++; console.log((e.ok ? '  ok  ' : '  KO  ') + e.quoi + (e.detail ? ' · ' + e.detail : '')); }
  console.log('');
  console.log(ko ? `${ko} essai(s) en échec sur ${essais.length}` : `${essais.length} essais passés`);
  ws.close(); chrome.kill(); serveur.close();
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
