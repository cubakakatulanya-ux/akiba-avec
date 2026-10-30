/* ===========================================================================
   Akiba sur un terminal POS Android — MediaTek MT8766, Android 13.

   Ce que ce banc approche, et ce qu'il ne peut pas faire. Le MT8766 est un
   quatre cœurs Cortex-A53 à 2 GHz avec 2 Go de mémoire : c'est environ six
   fois plus lent qu'un ordinateur de bureau sur un seul fil d'exécution. On
   bride donc le processeur d'autant, et on émule l'écran du terminal. C'est
   une approximation honnête, pas une mesure sur l'appareil : les chiffres
   donnent un ordre de grandeur et des seuils dépassés, pas des millisecondes
   exactes. Ce qui ne peut pas être éprouvé ici est dit à la fin.

   Usage :  node tests/pos-mt8766.js
            POS_BRIDAGE=8 node tests/pos-mt8766.js     (plus pessimiste)
   =========================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const SRC = path.join(__dirname, '..');
const PORT = 5501, DEBUG = 9391;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BRIDAGE = Math.max(1, +(process.env.POS_BRIDAGE || 6));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(SRC, 'docs', u), (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(b);
  });
}).listen(PORT);

const dors = ms => new Promise(r => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-pos-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ferme = false;
const refermer = () => { if (!ferme) { ferme = true; try { chrome.kill(); } catch (e) { /* parti */ } } };
['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'].forEach(s => process.on(s, () => { refermer(); process.exit(130); }));
process.on('exit', refermer);

const large = process.stdout.isTTY && process.stdout.columns ? process.stdout.columns - 1 : 110;
const ligne = t => console.log(t === undefined ? '' : t);
const trait = () => ligne('  ' + '─'.repeat(Math.min(large - 2, 100)));
let bons = 0, mauvais = 0;
const passe = (q, p) => { bons++; ligne('  ✓ ' + q + (p ? '  — ' + p : '')); };
const echoue = (q, p) => { mauvais++; ligne('  ✗ ' + q + (p ? '  — ' + p : '')); };
const note = (q, p) => ligne('  ○ ' + q + (p ? '  — ' + p : ''));
const verifier = (c, q, p) => { c ? passe(q, p) : echoue(q, p); return !!c; };

/* Le terminal : un POS MT8766 courant. 5,5 pouces, 720 x 1280 points matériels,
   soit 360 x 640 points de dessin — plus étroit et plus court que le téléphone
   de référence (375 x 812) sur lequel les écrans ont été réglés. */
const TERMINAL = { width: 360, height: 640, deviceScaleFactor: 2, mobile: true };
const UA_POS = 'Mozilla/5.0 (Linux; Android 13; POS MT8766) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

(async () => {
  for (let i = 0; i < 120; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const cible = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + PORT + '/'), { method: 'PUT' })).json();
  const ws = new WebSocket(cible.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  let n = 0; const att = {};
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const js = async expression => {
    let t;
    const r = await Promise.race([
      cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
      new Promise((_, ko) => { t = setTimeout(() => ko(new Error('le terminal ne répond plus')), 300000); }),
    ]).finally(() => clearTimeout(t));
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
    return r.result.value;
  };
  const jsj = async e => JSON.parse(await js('Promise.resolve(' + e + ').then(v => JSON.stringify(v))'));
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Emulation.setDeviceMetricsOverride', TERMINAL);
  await cdp('Emulation.setUserAgentOverride', { userAgent: UA_POS });
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/' });
  for (let i = 0; i < 300; i++) { if (await js("(typeof App === 'object' && !!K.data && !!App.licence && !!document.querySelector('.shell'))")) break; await dors(200); }

  ligne();
  ligne('  AKIBA SUR TERMINAL POS ANDROID — MediaTek MT8766, Android 13');
  ligne('  écran émulé ' + TERMINAL.width + ' x ' + TERMINAL.height + ' · processeur bridé ' + BRIDAGE + '× · ' + new Date().toLocaleString('fr-FR'));
  trait();

  /* ---------- 1. ce que le terminal offre ---------- */
  const cap = await jsj(`(() => ({
    chrome: (navigator.userAgent.match(/Chrome\\/(\\d+)/) || [])[1] || '?',
    idb: typeof indexedDB !== 'undefined', idbActif: IDB.dispo,
    crypto: !!(window.crypto && crypto.subtle && crypto.subtle.encrypt),
    partage: !!(navigator.share && navigator.canShare),
    gps: !!navigator.geolocation,
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    scanQR: typeof carteScanDispo === 'function' ? carteScanDispo() : null,
    vibration: !!navigator.vibrate,
    voix: typeof speechSynthesis !== 'undefined',
    pos: typeof posAvailable === 'function' ? posAvailable() : null,
    memoire: navigator.deviceMemory || navigator.hardwareConcurrency || null,
    coeurs: navigator.hardwareConcurrency || null,
    ecran: { l: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
  }))()`);
  ligne('  CE QUE LE TERMINAL OFFRE');
  verifier(+cap.chrome >= 90, 'moteur du navigateur assez récent', 'Chrome ' + cap.chrome);
  verifier(cap.idb && cap.idbActif !== false, 'IndexedDB disponible : le cahier n’a pas de plafond', 'présent : ' + cap.idb + ' · actif : ' + cap.idbActif);
  verifier(cap.crypto, 'chiffrement disponible : sauvegardes et transferts protégés', 'crypto.subtle : ' + cap.crypto);
  verifier(cap.voix, 'lecture à voix haute disponible');
  ligne('  ○ écran ' + cap.ecran.l + ' x ' + cap.ecran.h + ' points de dessin (densité ' + cap.ecran.dpr + ') · ' + (cap.coeurs || '?') + ' cœurs annoncés');
  note('imprimante intégrée', cap.pos === false
    ? 'aucun pont détecté : dans un navigateur, c’est normal. Sur le terminal, il faut l’application Android qui expose window.AkibaPOS — voir la fiche en fin de banc.'
    : 'pont présent');
  if (!cap.gps) note('pas de GPS', 'le point du lieu de réunion devra être sauté ou pris sur un téléphone');
  if (!cap.camera) note('pas de caméra', 'photo du membre et lecture de QR indisponibles');

  /* ---------- 2. la mise en page sur un écran plus petit ---------- */
  trait();
  ligne('  LA MISE EN PAGE SUR 360 x 640');
  const ECRANS = ['login', 'a.home', 'a.members', 'a.meet', 'a.receipt', 'a.share', 'a.more', 'guide'];
  const mise = await jsj(`(async () => {
    const a = K.data.avecs[0];
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
    const out = [];
    for (const e of ${JSON.stringify(ECRANS)}) {
      App.sheet = null;
      try { App.go(e); } catch (err) { out.push({ e, erreur: String(err.message || err) }); continue; }
      await new Promise(r => requestAnimationFrame(() => r()));
      const deborde = [];
      document.querySelectorAll('.main *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > window.innerWidth + 1) {
          const style = getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') return;   /* un tableau qui défile, c'est voulu */
          let p = el.parentElement, dansUnDefilant = false;
          while (p) { const s2 = getComputedStyle(p); if (s2.overflowX === 'auto' || s2.overflowX === 'scroll') { dansUnDefilant = true; break; } p = p.parentElement; }
          if (!dansUnDefilant) deborde.push((el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0]).slice(0, 30) + ' (' + Math.round(r.right - window.innerWidth) + 'px)');
        }
      });
      /* les cibles tactiles : sur un POS on touche avec le doigt, parfois avec un gant */
      const petits = [];
      document.querySelectorAll('.main button, .main a, .main input, .main select').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.height < 40) petits.push((el.textContent || el.tagName).trim().slice(0, 22) + ' (' + Math.round(r.height) + 'px)');
      });
      out.push({ e, ecranAtteint: App.screen, deborde: deborde.slice(0, 4), nbDeborde: deborde.length,
        petits: petits.slice(0, 3), nbPetits: petits.length,
        hauteur: document.querySelector('.main') ? Math.round(document.querySelector('.main').scrollHeight) : 0 });
    }
    return out;
  })()`);
  let debordes = 0, cibles = 0;
  mise.forEach(m => {
    if (m.erreur) { echoue('écran ' + m.e, m.erreur); return; }
    if (m.nbDeborde) { debordes += m.nbDeborde; echoue('écran ' + m.e + ' : déborde à droite', m.nbDeborde + ' élément(s) · ' + m.deborde.join(', ')); }
    else passe('écran ' + m.e + ' tient dans la largeur', m.hauteur + 'px de haut, ' + Math.ceil(m.hauteur / TERMINAL.height) + ' écran(s) à faire défiler');
    if (m.nbPetits) cibles += m.nbPetits;
  });
  if (cibles) note('cibles tactiles sous 40 px', cibles + ' au total sur les ' + mise.length + ' écrans · exemples : ' + (mise.find(m => m.nbPetits) || {}).petits);

  /* ---------- 3. la vitesse, processeur bridé ---------- */
  trait();
  ligne('  LA VITESSE AVEC LE PROCESSEUR BRIDÉ ' + BRIDAGE + '×');
  await cdp('Emulation.setCPUThrottlingRate', { rate: BRIDAGE });
  const vite = await jsj(`(async () => {
    const a = K.data.avecs[0];
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
    /* Trois passages, et c'est la médiane qui compte : sur une machine qui fait autre chose en
       même temps, un passage isolé mesure surtout cette autre chose. On garde le minimum et le
       maximum pour que la dispersion reste visible.

       « avant » remet le terrain dans l'état voulu entre deux passages — vider la mémoire d'une
       vérification, par exemple — sans quoi le deuxième passage ne mesurerait plus la même
       chose que le premier. */
    const mesure = async (f, avant) => {
      const v = [];
      for (let i = 0; i < 3; i++) {
        if (avant) await avant();
        const t = performance.now();
        await f();
        v.push(performance.now() - t);
      }
      v.sort((x, y) => x - y);
      return { ms: Math.round(v[1]), bas: Math.round(v[0]), haut: Math.round(v[2]) };
    };
    const r = {};
    r.accueil = await mesure(() => { App.go('a.home'); });
    r.membres = await mesure(() => { App.go('a.members'); });
    r.journal = await mesure(() => { App.go('a.journal'); });
    r.stats = await mesure(() => { stats(a); });
    const oublier = () => { if (typeof _chain === 'object') Object.keys(_chain).forEach(k => delete _chain[k]); };
    r.chaine = await mesure(() => { verifyChain(a); }, oublier);
    r.uneEcriture = await mesure(() => {
      const m = { id: a.id + '-vitesse', n: 9000, cycle: a.cycle.n, date: Date.now(), status: 'open', presence: {}, openedBy: chef.id, stepDone: 0, synced: false };
      a.meetings.push(m);
      appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[0].id, parts: 1, amount: a.settings.partValue, by: chef.id });
    });
    r.enregistrer = await mesure(async () => { DB.save(); await DB.vide(); }, () => DB.vide());
    /* une réunion complète pèse une centaine d'écritures : on mesure le coût réel d'une étape */
    const m2 = a.meetings[a.meetings.length - 1];
    r.centEcritures = await mesure(() => {
      for (let i = 0; i < 100; i++) appendTx(a, { meetingId: m2.id, type: 'EPARGNE', memberId: a.members[i % a.members.length].id, parts: 1, amount: a.settings.partValue, by: chef.id, note: 'mesure ' + i });
    });
    r.enregistrerApres = await mesure(async () => { DB.save(); await DB.vide(); }, () => DB.vide());
    r.recu = await mesure(() => { const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0]; if (der) receiptText(a, der, a.members[0], memberReceipt(a, der, a.members[0]), true); });
    r.poidsKo = Math.round(JSON.stringify(K.data).length / 1024);
    r.ecritures = a.tx.length;
    return r;
  })()`);
  /* Seuils : au-delà, le secrétaire attend visiblement devant l'assemblée. 400 ms est la limite
     au-delà de laquelle un toucher ne paraît plus immédiat ; 1 s, celle où l'on se demande si
     l'appareil a compris. */
  /* Seuils tenus sur la médiane de trois passages. L'écart est affiché : s'il est large, c'est
     la machine qui bouge, et la mesure est à relire avec cette réserve. */
  const seuil = (nom, v, max) => {
    const m = typeof v === 'object' ? v : { ms: v, bas: v, haut: v };
    const ecart = m.bas === m.haut ? '' : ' · de ' + m.bas + ' à ' + m.haut;
    verifier(m.ms <= max, nom, m.ms + ' ms (limite ' + max + ' ms' + ')' + ecart);
  };
  seuil('ouvrir l’accueil du groupe', vite.accueil, 1000);
  seuil('ouvrir la liste des membres', vite.membres, 1000);
  seuil('ouvrir le journal complet', vite.journal, 1500);
  seuil('recalculer tous les comptes du groupe', vite.stats, 400);
  seuil('vérifier le journal entier', vite.chaine, 1500);
  seuil('enregistrer une écriture', vite.uneEcriture, 150);
  seuil('garder le cahier sur le terminal', vite.enregistrer, 1000);
  seuil('cent écritures, comme une étape de réunion', vite.centEcritures, 2000);
  seuil('garder le cahier après cent écritures', vite.enregistrerApres, 1500);
  seuil('préparer un reçu', vite.recu, 300);
  ligne('  ○ cahier de ' + vite.poidsKo + ' Ko, ' + vite.ecritures + ' écritures · chaque mesure est la médiane de trois passages');

  /* Le cas qui fait mal : la fin de cycle. L accueil vérifie le journal entier, et le résultat
     mis en mémoire tombe à chaque nouvelle écriture — donc après chaque geste de réunion, le
     retour à l accueil revérifie tout. Avec trois mille écritures et ce processeur, cela peut
     devenir une attente visible devant l assemblée. */
  ligne('  EN FIN DE CYCLE, QUAND LE JOURNAL EST LONG');
  await cdp('Emulation.setCPUThrottlingRate', { rate: BRIDAGE });
  const fin = await jsj(`(async () => {
    const a = K.data.avecs[0];
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
    const m = a.meetings[a.meetings.length - 1];
    while (a.tx.length < 3000)
      appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[a.tx.length % a.members.length].id,
        parts: 1, amount: a.settings.partValue, by: chef.id });
    /* Trois passages ici aussi. Entre chacun, on vide ce qui a été mis en mémoire et on laisse
       les écritures finir, sinon le deuxième passage mesurerait un journal déjà vérifié. */
    const oublier = () => { if (typeof _chain === 'object') Object.keys(_chain).forEach(k => delete _chain[k]); };
    const mesure = async (f2, avant) => {
      const v = [];
      for (let i = 0; i < 3; i++) {
        if (avant) avant();
        await DB.vide();
        const t = performance.now();
        f2();
        v.push(performance.now() - t);
      }
      v.sort((x, y) => x - y);
      return { ms: Math.round(v[1]), bas: Math.round(v[0]), haut: Math.round(v[2]) };
    };
    /* La boucle ci-dessus a demandé deux mille enregistrements en quelques millisecondes, ce
       qu aucune réunion ne fait. Il en reste un en attente, qui retomberait au milieu de la
       mesure suivante et lui prêterait un temps qui n est pas le sien. On le laisse finir
       d abord : ce qu on veut mesurer ici, c est la première vérification du journal. */
    await DB.vide();
    const premier = await mesure(() => { App.go('a.home'); }, oublier);       /* rien en mémoire : tout est revérifié */
    const second = await mesure(() => { App.go('a.members'); App.go('a.home'); });  /* vérification déjà faite */
    appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[0].id, parts: 1, amount: a.settings.partValue, by: chef.id });
    await DB.vide();
    const apresEcriture = await mesure(() => { App.go('a.home'); });    /* une écriture de plus : tout est à refaire */
    return { ecritures: a.tx.length, premier, second, apresEcriture, poidsKo: Math.round(JSON.stringify(K.data).length / 1024) };
  })()`);
  await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });
  ligne('  ○ journal porté à ' + fin.ecritures + ' écritures (' + fin.poidsKo + ' Ko)');
  seuil('accueil, journal jamais vérifié', fin.premier, 1500);
  seuil('accueil, vérification déjà faite', fin.second, 400);
  verifier(fin.apresEcriture.ms <= 1500, 'accueil juste après une écriture',
    fin.apresEcriture.ms + ' ms (limite 1500 ms) · de ' + fin.apresEcriture.bas + ' à ' + fin.apresEcriture.haut);
  await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });

  /* ---------- 4. le ticket ---------- */
  trait();
  ligne('  LE TICKET');
  const ticket = await jsj(`(() => {
    const a = K.data.avecs[0];
    const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    const x = a.members[0];
    const t = receiptText(a, der, x, memberReceipt(a, der, x), false);
    const lignes = t.split(String.fromCharCode(10));
    return { largeur: RECU_W, reglable: typeof recuLargeur === 'function',
      plusLongue: Math.max.apply(null, lignes.map(l => l.length)), lignes: lignes.length,
      accents: lignes.filter(l => /[éèêàçôûïÉÈÀÇ]/.test(l)).length,
      escpos: typeof escposBytes === 'function', pont: typeof printReceipt === 'function',
      apercu: lignes.slice(0, 6) };
  })()`);
  verifier(ticket.plusLongue <= ticket.largeur, 'aucune ligne ne dépasse la largeur du papier',
    'plus longue : ' + ticket.plusLongue + ' signes pour ' + ticket.largeur);
  verifier(ticket.accents === 0, 'aucun accent sur le ticket', ticket.accents + ' ligne(s) accentuée(s)');
  verifier(ticket.escpos && ticket.pont, 'commandes ESC/POS et pont d’impression présents');
  if (!ticket.reglable) echoue('la largeur du papier se règle',
    'elle est figée à ' + ticket.largeur + ' signes (58 mm). Un terminal à 80 mm imprimerait un ticket étroit avec une large marge, et il n’y a aucun moyen de le dire à l’application.');
  else passe('la largeur du papier se règle', '58 mm ou 80 mm');

  trait();
  ligne('  CE QUE CE BANC NE PEUT PAS ÉPROUVER');
  [['l’imprimante elle-même', 'il faut le terminal : largeur réelle du papier, vitesse du rouleau, qualité de la coupe, comportement quand le papier manque'],
   ['le pont natif window.AkibaPOS', 'il vit dans l’application Android qui enveloppe Akiba, pas dans la page'],
   ['la vitesse réelle du MT8766', 'le bridage du processeur approche un seul fil d’exécution ; la mémoire, le stockage lent et la thermique du terminal ne sont pas reproduits'],
   ['la batterie et la chaleur', 'un POS reste souvent branché, mais une réunion de deux heures sur batterie ne se mesure que sur l’appareil'],
   ['le lecteur de carte, le NFC, le clavier physique', 'Akiba ne s’en sert pas ; s’il faut s’en servir un jour, cela passera par le même pont natif']].forEach(([q, p]) => note(q, p));

  trait();
  ligne(mauvais ? '  RÉSULTAT : ' + bons + ' vérifications passées, ' + mauvais + ' à corriger'
                : '  RÉSULTAT : ' + bons + ' vérifications passées, rien à corriger');
  ligne();
  refermer(); process.exit(mauvais ? 1 : 0);
})().catch(e => { ligne('  ÉCHEC DU BANC : ' + (e && e.message ? e.message : e)); refermer(); process.exit(2); });
