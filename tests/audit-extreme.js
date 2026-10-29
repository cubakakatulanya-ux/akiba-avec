/* ===========================================================================
   AKIBA — audit de robustesse, de fiabilité financière et de sécurité.

   Tout se passe dans un navigateur sans fenêtre, sur une copie servie depuis
   docs/, avec des données entièrement fictives. Rien de ce qui est en
   production n'est touché : l'essai commence par vider le stockage local de
   son propre onglet et n'écrit nulle part ailleurs.

   Ce fichier NE CORRIGE RIEN. Il constate, et dit ce qu'il n'a pas pu tester.

   Usage :  node tests/audit-extreme.js            (tout)
            AUDIT_LOTS=A,B,C node tests/audit-extreme.js
   =========================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const SRC = path.join(__dirname, '..');
const PORT = 5301, DEBUG = 9371;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const servir = port => http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(SRC, 'docs', u), (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(b);
  });
}).listen(port);

const dors = ms => new Promise(r => setTimeout(r, ms));
const profil = path.join(require('os').tmpdir(), 'akiba-audit-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });
let ferme = false;
const refermer = () => { if (!ferme) { ferme = true; try { chrome.kill(); } catch (e) { /* déjà parti */ } } };
['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'].forEach(s => process.on(s, () => { refermer(); process.exit(130); }));
process.on('exit', refermer);

function onglet(port) {
  let ws, n = 0, cible = null; const attente = {};
  const envoyer = (method, params) => new Promise((ok, ko) => { const i = ++n; attente[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method, params })); });
  const GARDE = 300000;                                            /* un onglet perdu doit le dire, pas figer l'audit */
  const js = async expression => {
    let t;
    const r = await Promise.race([
      envoyer('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
      new Promise((_, ko) => { t = setTimeout(() => ko(new Error('navigateur ' + port + ' sans réponse')), GARDE); }),
    ]).finally(() => clearTimeout(t));
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    port,
    ouvrir: async () => {
      const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + port + '/'), { method: 'PUT' })).json();
      cible = c.id;
      ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 512 * 1024 * 1024 });
      await new Promise(r => ws.onopen = r);
      ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && attente[d.id]) { d.error ? attente[d.id].ko(new Error(d.error.message)) : attente[d.id].ok(d.result); delete attente[d.id]; } };
      ws.onclose = () => Object.keys(attente).forEach(i => { attente[i].ko(new Error('connexion fermée')); delete attente[i]; });
      await envoyer('Runtime.enable', {});
      for (let i = 0; i < 400; i++) {
        if (await js("(typeof App === 'object' && typeof K === 'object' && !!K.data && !!App.licence && !!document.querySelector('.shell'))")) break;
        await dors(200);
      }
      /* le gardien de licence a ses propres essais : il ne doit pas redessiner pendant l'audit */
      /* Un onglet neuf sur la meme adresse herite du stockage du precedent : le demarrage le
         reconnait et affiche l ecran d un groupe. Vider les donnees sans revenir a l ecran
         d accueil fait alors planter le rendu, faute de session. On repart donc de l accueil. */
      await js("(async () => { delete window.KITABU_PWA; App.licence = await resolveLicence(); wipeTo(emptyData()); K.data.mode = 'prod'; App.screen = 'login'; App.params = {}; App.hist = []; App.sheet = null; DB.save(); render(); return 1; })()");
    },
    fermer: async () => {
      try { if (ws) ws.close(); } catch (e) { /* rien */ }
      try { if (cible) await fetch('http://127.0.0.1:' + DEBUG + '/json/close/' + cible); } catch (e) { /* rien */ }
    },
    js,
    jsj: async expr => JSON.parse(await js('Promise.resolve(' + expr + ').then(v => JSON.stringify(v))')),
  };
}

/* ---------------------------------------------------------------- affichage */
const large = process.stdout.isTTY && process.stdout.columns ? process.stdout.columns - 1 : 110;
const vivant = t => { if (process.stdout.isTTY) process.stdout.write('\r' + t.slice(0, large).padEnd(large) + '\r'); };
const ligne = t => { if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(large) + '\r'); console.log(t === undefined ? '' : t); };
const fc = v => (v === null || v === undefined || isNaN(v) ? '—' : String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC');
const trait = () => ligne('  ' + '─'.repeat(Math.min(large - 2, 104)));

/* Chaque constat est enregistré, jamais inventé. « passe » veut dire : vérifié par
   une mesure dans l'application. « manque » veut dire : non testable ici, et pourquoi. */
const CONSTATS = [];
const passe = (lot, quoi, preuve) => { CONSTATS.push({ lot, etat: 'passe', quoi, preuve }); ligne('  ✓ ' + quoi + (preuve ? '  — ' + preuve : '')); };
const echoue = (lot, quoi, preuve, gravite = 'majeur') => { CONSTATS.push({ lot, etat: 'echoue', quoi, preuve, gravite }); ligne('  ✗ ' + quoi + (preuve ? '  — ' + preuve : '')); };
const absent = (lot, quoi, pourquoi) => { CONSTATS.push({ lot, etat: 'absent', quoi, preuve: pourquoi }); ligne('  ○ ' + quoi + '  — ' + pourquoi); };
const verifier = (cond, lot, quoi, preuve, gravite) => { cond ? passe(lot, quoi, preuve) : echoue(lot, quoi, preuve, gravite); return !!cond; };



/* ===========================================================================
   Fabrique d'AVEC fictives : passe par le vrai ACT.cCreate, donc par les vraies
   règles (bureau, trois clés, codes secrets, carte de secours, journal scellé).
   =========================================================================== */
const FABRIQUE = `(nb, membresParGroupe, lieux, regles, graine) => {
  /* Chaque lot repart d un cahier vide : sinon il herite de l etat laisse par le lot precedent
     — une AVEC marquee « a verifier », un stockage sature — et ses constats ne mesurent plus
     l application mais l ordre des lots. Un banc d audit dont le resultat depend de l ordre ne
     vaut rien. */
  wipeTo(emptyData()); K.data.mode = 'prod';
  App.screen = 'login'; App.params = {}; App.hist = []; App.sheet = null; App.cdraft = null;
  let g = graine;
  const alea = () => { g = (g * 1103515245 + 12345) & 0x7fffffff; return g / 0x7fffffff; };
  const F = ['Kavira','Masika','Kahindo','Furaha','Neema','Sifa','Zawadi','Rehema','Amani','Jeanne','Chantal','Solange','Bibiche','Nsimire','Mwavita','Fatuma','Generose','Henriette','Josephine','Riziki'];
  const H = ['Mumbere','Paluku','Kambale','Baraka','Juma','Mugisho','Bahati','Innocent','Fiston','Serge'];
  const N = ['Siviri','Mbusa','Katembo','Muhindo','Kasereka','Mastaki','Bisimwa','Lubunga','Byamungu','Kalunga','Ngoy','Ilunga','Tshibangu','Mukendi','Kabeya','Mwamba'];
  const faits = [];
  for (let i = 0; i < nb; i++) {
    const lieu = lieux[i % lieux.length];
    const r = regles[i % regles.length];
    const membres = [];
    const vus = {};
    while (membres.length < membresParGroupe) {
      const homme = membres.length > 0 && alea() < 0.2;
      const p = homme ? H[Math.floor(alea() * H.length)] : F[Math.floor(alea() * F.length)];
      const nom = p + ' ' + N[Math.floor(alea() * N.length)];
      if (vus[nom]) continue;
      vus[nom] = 1;
      membres.push({ id: 'n' + membres.length, name: nom, sex: homme ? 'M' : 'F', phone: '—' });
    }
    const M = membres.map(m => m.id);
    App.cdraft = {
      from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: membres.length, editing: null,
      roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
      g: { name: lieu.nom + ' ' + (i + 1), province: lieu.prov, territoire: lieu.terr, entite: 'territoire',
           secteur: '', groupement: '', village: lieu.village, animId: '', meetingDay: 'Samedi', frequency: 7,
           createdOn: new Date(Date.now()).toISOString().slice(0, 10), embleme: Object.assign({}, EMB_DEFAUT) },
      r: Object.assign({ cycleStart: new Date(Date.now()).toISOString().slice(0, 10) }, r),
      rep: { social: '', credit: '', rows: {} },
    };
    ACT.cCreate();
    const d = App.cdraft;
    if (!d || !d.avecId) return { erreur: 'création refusée au groupe ' + (i + 1) };
    faits.push(d.avecId);
    App.cdraft = null;
  }
  DB.save();
  return { faits };
}`;

const LIEUX = [
  { nom: 'Bomoko', prov: 'Sud-Ubangi', terr: 'Gemena', village: 'Mabaya' },
  { nom: 'Lisanga', prov: 'Sud-Ubangi', terr: 'Budjala', village: 'Mondamba' },
  { nom: 'Bolingo', prov: 'Kinshasa', terr: 'Kimbanseke', village: 'Mikonga' },
];
const REGLES = [
  { partValue: 500, maxParts: 5, socialFee: 300, rate: 5, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, penaltyRate: 5, cycleMonths: 12 },
  { partValue: 1000, maxParts: 3, socialFee: 500, rate: 10, maxMult: 2, maxMonths: 6, fineAbsent: 1000, fineLate: 500, penaltyRate: 10, cycleMonths: 12 },
  { partValue: 2000, maxParts: 5, socialFee: 1000, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 100, penaltyRate: 2, cycleMonths: 12 },
];

/* Un cycle écrit directement dans le journal par appendTx : c'est le moteur financier
   qu'on audite ici, pas l'enchaînement des huit étapes — celui-là est couvert par
   tests/cycle-complet.js, qui passe par les vrais gestes. La différence est dite dans
   le rapport : ces réunions ne sont pas saisies à l'écran. */
const CYCLER = `(avecId, semaines, opt) => {
  const a = avecById(avecId);
  const chef = a.members.find(x => x.role === 'president');
  const pv = a.settings.partValue;
  const SEM = 7 * 24 * 3600 * 1000;
  const t0 = a.cycle.start;
  let credits = 0;
  for (let s = 1; s <= semaines; s++) {
    const ts = t0 + s * SEM;
    const n = a.meetings.reduce((x, m) => Math.max(x, m.n), 0) + 1;
    const m = { id: a.id + '-r' + n + '-' + uid(), n, cycle: a.cycle.n, date: ts, status: 'open',
      presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
    const actifs = activeM(a);
    actifs.forEach((x, i) => { m.presence[x.id] = ((i * 7 + s * 3) % 100) < (opt.pAbsent || 10) ? 'A' : 'P'; });
    a.meetings.push(m);
    const avant = stats(a).cash;
    m.openExpected = m.openCount = avant;
    /* épargne et caisse sociale */
    actifs.filter(x => m.presence[x.id] === 'P').forEach((x, i) => {
      const p = 1 + ((i + s) % a.settings.maxParts);
      appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: x.id, parts: p, amount: p * pv, by: chef.id, ts });
      if ((i + s) % 10 !== 0) appendTx(a, { meetingId: m.id, type: 'SOCIAL', memberId: x.id, amount: a.settings.socialFee, by: chef.id, ts });
    });
    /* remboursements : l'échéance du jour, sauf un emprunteur sur cinq */
    stats(a).activeLoans.forEach(l => {
      if ((l.memberId.charCodeAt(l.memberId.length - 1) + s) % 5 === 0) return;
      const du = Math.min(l.remaining, Math.ceil(l.due / l.months / 100) * 100);
      if (du > 0) appendTx(a, { meetingId: m.id, type: 'REMB', memberId: l.memberId, ref: l.id, amount: du, by: chef.id, ts });
    });
    /* amendes d'absence : une dette, pas d'argent dans la caisse */
    actifs.filter(x => m.presence[x.id] === 'A').forEach(x =>
      appendTx(a, { meetingId: m.id, type: 'DETTE', memberId: x.id, amount: a.settings.fineAbsent, note: 'Absence', by: chef.id, ts }));
    /* crédits */
    if (s >= 4 && s <= semaines - 8) {
      const st = stats(a);
      const libres = actifs.filter(x => m.presence[x.id] === 'P' && !st.mem[x.id].loans.some(l => l.status !== 'solde'));
      for (let k = 0; k < (opt.credits || 2) && k < libres.length; k++) {
        const x = libres[(s * 3 + k * 5) % libres.length];
        const lim = loanLimit(a, stats(a), x.id);
        const mois = Math.min(a.settings.maxMonths, 2 + (k % 2));
        if (!lim.max || ts + mois * 28 * 24 * 3600 * 1000 > a.cycle.end) continue;
        const montant = Math.floor(lim.max * 0.8 / 500) * 500;
        if (montant < 1000) continue;
        appendTx(a, { meetingId: m.id, type: 'CREDIT', memberId: x.id, amount: montant, months: mois,
          rate: a.settings.rate, note: 'petit commerce', by: chef.id, ts });
        credits++;
      }
    }
    const apres = stats(a);
    Object.assign(m, { status: 'closed', closedAt: ts, closeExpected: apres.cash, closeCount: apres.cash,
      validators: keyHolders(a).slice(0, 3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length - 1].hash });
  }
  DB.save();
  const st = stats(a);
  return { credits, tx: a.tx.length, reunions: a.meetings.length, caisse: st.cash, encours: st.outstanding, chaine: verifyChain(a).ok };
}`;

/* =========================================================================== */
(async () => {
  servir(PORT); servir(PORT + 1);
  for (let i = 0; i < 160; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const T = onglet(PORT); await T.ouvrir();
  const js = T.js, jsj = T.jsj;
  const LOTS = (process.env.AUDIT_LOTS || 'A,B,C,D,E,F,G,H,I,J,K,L').split(',').map(x => x.trim());
  const fait = l => LOTS.includes(l);
  const t0 = Date.now();

  ligne();
  ligne('  AKIBA — AUDIT DE ROBUSTESSE, DE FIABILITÉ FINANCIÈRE ET DE SÉCURITÉ');
  ligne('  données fictives, navigateur isolé, stockage vidé au départ · ' + new Date().toLocaleString('fr-FR'));
  trait();

  /* ======================= LOT A — ÉCHELLE ======================= */
  if (fait('A')) {
    ligne('  LOT A — 100 AVEC, 2 500 membres');
    vivant('  création de 100 AVEC …');
    const tA = Date.now();
    const a = await jsj('(' + FABRIQUE + ')(100, 25, ' + JSON.stringify(LIEUX) + ', ' + JSON.stringify(REGLES) + ', 424242)');
    if (a.erreur) { echoue('A', '100 AVEC créées', a.erreur, 'bloquant'); }
    else {
      const m = await jsj(`(() => {
        const n = K.data.avecs.length;
        const membres = K.data.avecs.reduce((s, x) => s + x.members.length, 0);
        const noms = new Set(K.data.avecs.map(x => x.name)).size;
        const pins = K.data.avecs.map(x => new Set(x.members.map(y => y.pin)).size);
        const cles = K.data.avecs.map(x => x.members.filter(y => y.key).length);
        const chaines = K.data.avecs.filter(x => !verifyChain(x).ok).length;
        const poids = (localStorage.getItem('kitabu.avec.v4') || '').length;
        const lieux = {};
        K.data.avecs.forEach(x => { lieux[x.territoire] = (lieux[x.territoire] || 0) + 1; });
        return { n, membres, noms, pinsMin: Math.min.apply(null, pins), clesOk: cles.every(c => c === 3),
          chaines, poids: Math.round(poids / 1024), lieux };
      })()`);
      verifier(m.n === 100 && m.membres === 2500, 'A', '100 AVEC et 2 500 membres créés',
        m.n + ' AVEC · ' + m.membres + ' membres · ' + JSON.stringify(m.lieux), 'bloquant');
      verifier(m.noms === 100, 'A', 'chaque AVEC porte un nom distinct', m.noms + ' noms');
      verifier(m.pinsMin === 25, 'A', 'les 25 codes secrets d un groupe sont tous differents', 'minimum observe : ' + m.pinsMin);
      verifier(m.clesOk, 'A', 'trois porte-cles dans chaque groupe');
      verifier(m.chaines === 0, 'A', 'les 100 journaux sont scelles des la creation', m.chaines + ' altere(s)', 'bloquant');
      passe('A', 'poids du stockage a la creation', m.poids + ' Ko pour 100 AVEC vides');
      passe('A', 'duree de creation', Math.round((Date.now() - tA) / 1000) + ' s pour 100 AVEC');

      const r = await jsj(`(() => {
        const mesure = f => { const t = performance.now(); try { f(); } catch (e) { return -1; } return Math.round(performance.now() - t); };
        const a0 = K.data.avecs[0];
        K.session = { kind: 'avec', avecId: a0.id, memberId: a0.members[0].id };
        return { accueil: mesure(() => SCREENS['a.home']()), membres: mesure(() => SCREENS['a.members']()) };
      })()`);
      verifier(r.accueil >= 0 && r.accueil < 1500, 'A', 'l accueil d un groupe reste utilisable a cette echelle', r.accueil + ' ms');
      verifier(r.membres >= 0 && r.membres < 1500, 'A', 'la liste des 25 membres reste utilisable', r.membres + ' ms');
    }
    trait();
  }

  /* ======================= LOT C — SITUATION 2 : LES 850 000 ======================= */
  if (fait('C')) {
    ligne('  LOT C — situation 2 : le solde de caisse apres une reunion');
    const c = await jsj(`(() => {
      wipeTo(emptyData()); K.data.mode = 'prod'; App.cdraft = null;
      const membres = Array.from({ length: 10 }, (_, i) => ({ id: 'n' + i, name: 'Membre Essai ' + (i + 1), sex: 'F', phone: '—' }));
      const M = membres.map(m => m.id);
      App.cdraft = { from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: 10, editing: null,
        roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
        g: { name: 'Caisse Essai', province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secteur: '', groupement: '',
             village: 'Mabaya', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: new Date().toISOString().slice(0,10), embleme: Object.assign({}, EMB_DEFAUT) },
        r: { partValue: 1000, maxParts: 10, socialFee: 0, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200,
             penaltyRate: 10, cycleMonths: 12, cycleStart: new Date().toISOString().slice(0,10) },
        rep: { social: '', credit: '', rows: {} } };
      ACT.cCreate();
      const id = App.cdraft.avecId; App.cdraft = null;
      const a = avecById(id);
      const chef = a.members[0];
      const m0 = { id: a.id + '-r0', n: 1, cycle: 1, date: Date.now(), status: 'closed', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
      a.meetings.push(m0);
      /* 1 010 000 d epargne, moins un credit de 160 000, donne exactement 850 000 en caisse
         au debut de la reunion de l enonce */
      a.members.slice(0, 10).forEach(x => appendTx(a, { meetingId: m0.id, type: 'EPARGNE', memberId: x.id, parts: 101, amount: 101000, by: chef.id }));
      m0.closeExpected = m0.closeCount = stats(a).cash;
      m0.sealSeq = a.tx.length; m0.seal = a.tx[a.tx.length - 1].hash;
      const depart = stats(a).cash;

      const m1 = { id: a.id + '-r1', n: 2, cycle: 1, date: Date.now(), status: 'open', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
      a.meetings.push(m1);
      const cr = appendTx(a, { meetingId: m1.id, type: 'CREDIT', memberId: a.members[7].id, amount: 160000, months: 1, rate: 12.5, note: 'pour l essai', by: chef.id });

      const avant = stats(a).cash;
      a.members.slice(0, 5).forEach(x => appendTx(a, { meetingId: m1.id, type: 'EPARGNE', memberId: x.id, parts: 50, amount: 50000, by: chef.id }));
      appendTx(a, { meetingId: m1.id, type: 'REMB', memberId: a.members[7].id, ref: cr.id, amount: 180000, by: chef.id });
      appendTx(a, { meetingId: m1.id, type: 'CREDIT', memberId: a.members[8].id, amount: 400000, months: 2, rate: 10, note: 'commerce', by: chef.id });
      const depenseFaite = !!TX.DEPENSE;
      if (depenseFaite) appendTx(a, { meetingId: m1.id, type: 'DEPENSE', memberId: null, amount: 30000, note: 'cahier et stylos', by: chef.id });
      DB.save();
      const st = stats(a);
      const entrees = a.tx.filter(t => TX[t.type] && TX[t.type].in === true).reduce((s, t) => s + t.amount, 0);
      const sorties = a.tx.filter(t => TX[t.type] && TX[t.type].in === false).reduce((s, t) => s + t.amount, 0);
      const rembs = a.tx.filter(t => t.type === 'REMB');
      return {
        depart, avant, cash: st.cash, social: st.socialFund, credit: st.loanFund,
        entrees, sorties, equation: entrees - sorties,
        nbRemb: rembs.length, sommeRemb: rembs.reduce((s, t) => s + t.amount, 0),
        encours: st.outstanding, capitalOut: st.capitalOut, capitalBack: st.capitalBack, capitalDue: st.capitalDue,
        depenseFaite, typesSortie: Object.keys(TX).filter(k => TX[k].in === false),
        parts: st.parts, partsMembres: activeM(a).reduce((s, x) => s + st.mem[x.id].parts, 0),
        chaine: verifyChain(a).ok, id,
      };
    })()`);
    if (!c.depenseFaite) absent('C', 'une depense autorisee du groupe', 'aucun type d ecriture ne permet une depense ; sorties possibles : ' + c.typesSortie.join(', '));
    passe('C', 'caisse avant la reunion de l enonce', fc(c.avant));
    const attendu = c.depenseFaite ? 850000 : 880000;
    verifier(c.cash === attendu, 'C', 'le solde apres la reunion est celui du cahier',
      'obtenu ' + fc(c.cash) + ' pour ' + fc(attendu) + ' attendu' + (c.depenseFaite ? '' : ' (depense de 30 000 impossible a enregistrer)'), 'bloquant');
    verifier(c.equation === c.cash, 'C', 'caisse finale = entrees reelles moins sorties reelles',
      fc(c.entrees) + ' moins ' + fc(c.sorties) + ' donne ' + fc(c.equation) + ' pour une caisse de ' + fc(c.cash), 'bloquant');
    verifier(c.nbRemb === 1 && c.sommeRemb === 180000, 'C', 'le remboursement n est compte qu une fois',
      c.nbRemb + ' ecriture, ' + fc(c.sommeRemb));
    /* Deux grandeurs differentes, qui doivent toutes deux etre justes et distinctes :
       la creance entiere (capital + interets a venir) et le capital encore dehors. */
    verifier(c.capitalDue === c.capitalOut - c.capitalBack && c.capitalDue === 400000, 'C',
      'capital encore dehors = capital decaisse moins capital rembourse',
      fc(c.capitalOut) + ' decaisses moins ' + fc(c.capitalBack) + ' rendus donne ' + fc(c.capitalDue), 'bloquant');
    verifier(c.encours === 480000, 'C', 'la creance entiere ajoute les interets a venir au capital',
      fc(c.encours) + ' de creance pour ' + fc(c.capitalDue) + ' de capital, soit ' + fc(c.encours - c.capitalDue) + ' d interets', 'bloquant');
    verifier(c.parts === c.partsMembres, 'C', 'total des parts du groupe = somme des parts des membres', c.parts + ' = ' + c.partsMembres);
    verifier(c.social + c.credit === c.cash, 'C', 'caisse sociale et caisse de credit se partagent exactement la caisse',
      fc(c.social) + ' sociale + ' + fc(c.credit) + ' credit = ' + fc(c.cash));
    verifier(c.chaine, 'C', 'journal intact apres ces operations', '', 'bloquant');
    trait();
  }


  /* sonde libre : AUDIT_SONDE=<chemin d un fichier .js qui exporte une expression> */
  if (process.env.AUDIT_SONDE) {
    const expr = require(require('path').resolve(process.env.AUDIT_SONDE));
    ligne('  SONDE');
    ligne(JSON.stringify(await jsj(expr), null, 2).split(String.fromCharCode(10)).map(l => '    ' + l).join(String.fromCharCode(10)));
    trait();
  }
  /* ======================= LOT D — FRAUDE ET MANIPULATION ======================= */
  if (fait('D')) {
    ligne('  LOT D — situation 4 : fraude et manipulation');
    const d = await jsj(`(async () => {
      wipeTo(emptyData()); K.data.mode = 'prod'; App.cdraft = null;
      const faire = (nom, nb) => {
        const membres = Array.from({ length: nb }, (_, i) => ({ id: 'n' + i, name: nom + ' Membre ' + (i + 1), sex: 'F', phone: '—' }));
        const M = membres.map(m => m.id);
        App.cdraft = { from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: nb, editing: null,
          roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
          g: { name: nom, province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secteur: '', groupement: '',
               village: 'Mabaya', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: new Date().toISOString().slice(0,10), embleme: Object.assign({}, EMB_DEFAUT) },
          r: { partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200,
               penaltyRate: 10, cycleMonths: 12, cycleStart: new Date().toISOString().slice(0,10) },
          rep: { social: '', credit: '', rows: {} } };
        ACT.cCreate();
        const id = App.cdraft.avecId; App.cdraft = null; return id;
      };
      const idA = faire('Groupe A', 12), idB = faire('Groupe B', 12);
      const a = avecById(idA), b = avecById(idB);
      const chef = a.members.find(x => x.role === 'president');
      const secr = a.members.find(x => x.role === 'secretaire');
      K.session = { kind: 'avec', avecId: idA, memberId: chef.id };

      /* une reunion fermee et scellee, avec de l epargne et un credit rembourse en partie */
      const m0 = { id: a.id + '-r1', n: 1, cycle: 1, date: Date.now(), status: 'open', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
      activeM(a).forEach(x => m0.presence[x.id] = 'P');
      a.meetings.push(m0);
      const cot = a.members.map(x => appendTx(a, { meetingId: m0.id, type: 'EPARGNE', memberId: x.id, parts: 5, amount: 5000, by: chef.id }));
      const cr = appendTx(a, { meetingId: m0.id, type: 'CREDIT', memberId: a.members[9].id, amount: 10000, months: 2, rate: 10, note: 'essai', by: chef.id });
      const rb = appendTx(a, { meetingId: m0.id, type: 'REMB', memberId: a.members[9].id, ref: cr.id, amount: 4000, by: chef.id });
      Object.assign(m0, { status: 'closed', closedAt: Date.now(), closeExpected: stats(a).cash, closeCount: stats(a).cash,
        validators: keyHolders(a).slice(0, 3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length - 1].hash });
      DB.save();
      const res = {};

      /* 1. modifier une cotisation deja validee */
      const sauve1 = cot[0].amount;
      cot[0].amount = 50000;
      res.cotisationModifiee = { detecte: !verifyChain(a).ok, raison: (verifyChain(a).reason || '') };
      cot[0].amount = sauve1;
      res.apresRemise = verifyChain(a).ok;

      /* 2. supprimer un remboursement */
      const i = a.tx.indexOf(rb);
      const copie = a.tx.splice(i, 1)[0];
      res.rembSupprime = { detecte: !verifyChain(a).ok, raison: (verifyChain(a).reason || '') };
      a.tx.splice(i, 0, copie);
      res.apresRemise2 = verifyChain(a).ok;

      /* 3. accorder un credit sans la validation d un deuxieme membre du bureau */
      const m1 = { id: a.id + '-r2', n: 2, cycle: 1, date: Date.now(), status: 'open', presence: {}, openedBy: chef.id, stepDone: 5, synced: false };
      activeM(a).forEach(x => m1.presence[x.id] = 'P');
      a.meetings.push(m1); DB.save();
      App.draftKey = null; App.go('a.meet', { step: '5' });
      ACT.creditSheet({});
      const avant3 = a.tx.length;
      document.getElementById('crM').value = a.members[3].id;
      document.getElementById('crA').value = '5000';
      document.getElementById('crD').value = '1';
      document.getElementById('crP').value = 'sans validation';
      document.getElementById('crAp').value = secr.id;
      document.getElementById('crPin').value = '0000';          /* mauvais code */
      window.__dit = ''; const vrai = App.toast; App.toast = function (t) { window.__dit = t; return vrai.apply(this, arguments); };
      ACT.saveCredit();
      res.creditSansCode = { refuse: a.tx.length === avant3, message: window.__dit };
      /* et avec un membre qui n est pas du bureau */
      document.getElementById('crAp').value = a.members[8].id;
      document.getElementById('crPin').value = a.members[8].pin;
      window.__dit = '';
      const avant3b = a.tx.length;
      ACT.saveCredit();
      res.creditParNonBureau = { refuse: a.tx.length === avant3b, message: window.__dit, dansListe: [...document.getElementById('crAp').options].some(o => o.value === a.members[8].id) };
      App.toast = vrai;
      App.closeSheet();

      /* 4. modifier le taux d interet apres coup */
      const avantTaux = stats(a).loanList.find(l => l.id === cr.id);
      const dueAvant = avantTaux.due;
      a.settings.rate = 50;
      const apresTaux = stats(a).loanList.find(l => l.id === cr.id);
      res.tauxRetroactif = { dueAvant, dueApres: apresTaux.due, tauxDuCredit: apresTaux.rate };
      a.settings.rate = 10;

      /* 5. creer un faux membre, directement dans les donnees */
      const avant5 = a.members.length;
      a.members.push({ id: a.id + '-faux', name: 'Faux Membre', sex: 'F', phone: '—', pin: '4321', joined: Date.now(), role: 'membre', key: false });
      DB.save();
      res.fauxMembre = { ajoute: a.members.length === avant5 + 1, chaineOk: verifyChain(a).ok,
        listeOk: verifyMembres(a).ok, raison: verifyMembres(a).reason || '',
        partageRefuse: (() => { K.session = { kind: 'avec', avecId: a.id, memberId: chef.id }; return sharePret(a, stats(a)) || 'aucune'; })(),
        alerte: health(a, stats(a), verifyChain(a)).alerts.some(x => /membres/i.test(x.title)),
        traceSecurite: (a.security || []).some(s => /faux/i.test(JSON.stringify(s))),
        comptePourLePartage: sharePlan(a, stats(a)).rows.some(r => r.x.id === a.id + '-faux') };
      a.members = a.members.filter(x => x.id !== a.id + '-faux');

      /* 6. modifier un montant apres la cloture de la reunion */
      const sauve6 = cot[1].amount; cot[1].amount = 1;
      res.montantApresCloture = { detecte: !verifyChain(a).ok, raison: (verifyChain(a).reason || '') };
      cot[1].amount = sauve6;

      /* 6b. refaire le hachage pour masquer la fraude : la chaine entiere doit etre reecrite */
      const sauve6b = cot[2].amount;
      cot[2].amount = 99000;
      cot[2].hash = sha256(payload(cot[2]));
      res.hachageRefait = { detecte: !verifyChain(a).ok, raison: (verifyChain(a).reason || '') };
      cot[2].amount = sauve6b; cot[2].hash = sha256(payload(cot[2]));
      res.apresRemise3 = verifyChain(a).ok;

      /* 7. voir les donnees financieres d une autre AVEC */
      K.session = { kind: 'avec', avecId: idB, memberId: chef.id };   /* membre du groupe A, cahier du groupe B */
      let fuite = null;
      try { const c = cur(); fuite = c && c.avec ? c.avec.name : null; } catch (e) { fuite = 'refus: ' + e.message; }
      const ecran = (() => { try { return SCREENS['a.home']().indexOf('Groupe B') > 0 ? 'affiche B' : 'autre'; } catch (e) { return 'refus'; } })();
      res.autreAvec = { fuite, ecran };
      K.session = { kind: 'avec', avecId: idA, memberId: chef.id };

      /* 8. changer les regles au milieu du cycle, par l interface */
      /* Ce qui compte n est pas qu une fonction d ecran puisse etre appelee, mais qu un chemin
         y mene : on vote les regles, puis on appuie sur Retour comme le ferait un telephone. */
      a.cycle.rulesPending = true;
      App.go('a.newCycle');
      const v = (idf, x) => { const e = document.getElementById(idf); if (e) e.value = String(x); };
      v('ncP', 1000); v('ncS', 500); v('ncR', 10); v('ncD', 3); v('ncC', 12); v('ncF', 500); v('ncL', 200);
      v('ncPn', 10); v('ncX', 3); v('ncM', 5); v('ncQ', 7);
      const ap2 = bureauOf(a).find(y => y.id !== chef.id);
      v('ncAp', ap2.id); v('ncPin', ap2.pin);
      ACT.saveNewCycle();
      const reglesAvant = JSON.stringify(a.settings), finAvant = a.cycle.end;
      ACT.back();
      res.reglesEnCoursDeCycle = { ecranApresRetour: App.screen, champPresent: !!document.getElementById('ncP'),
        horsHistorique: typeof NO_BACK !== 'undefined' && NO_BACK.includes('a.newCycle'),
        reglesIntactes: JSON.stringify(a.settings) === reglesAvant && a.cycle.end === finAvant,
        gardeDansLEcran: SCREENS['a.newCycle'].toString().indexOf('rulesPending') > 0 };

      /* 9. un membre simple peut-il ouvrir une reunion ou accorder un credit ? */
      K.session = { kind: 'avec', avecId: idA, memberId: a.members[9].id };
      window.__dit = ''; const vrai2 = App.toast; App.toast = function (t) { window.__dit = t; return vrai2.apply(this, arguments); };
      const avant9 = a.meetings.length;
      ACT.startMeeting();
      res.membreOuvreReunion = { refuse: a.meetings.length === avant9, message: window.__dit };
      App.toast = vrai2;
      K.session = { kind: 'avec', avecId: idA, memberId: chef.id };

      DB.save();
      return res;
    })()`);

    verifier(d.cotisationModifiee.detecte, 'D', 'modifier une cotisation validee est detecte', d.cotisationModifiee.raison, 'bloquant');
    verifier(d.rembSupprime.detecte, 'D', 'supprimer un remboursement est detecte', d.rembSupprime.raison, 'bloquant');
    verifier(d.montantApresCloture.detecte, 'D', 'modifier un montant apres la cloture est detecte', d.montantApresCloture.raison, 'bloquant');
    verifier(d.hachageRefait.detecte, 'D', 'refaire le hachage d une ecriture ne suffit pas a masquer la fraude', d.hachageRefait.raison, 'bloquant');
    verifier(d.apresRemise && d.apresRemise2 && d.apresRemise3, 'D', 'le journal redevient valide quand on remet la valeur d origine', 'les trois remises en etat sont propres');
    verifier(d.creditSansCode.refuse, 'D', 'un credit sans le code du deuxieme membre du bureau est refuse', d.creditSansCode.message, 'bloquant');
    verifier(d.creditParNonBureau.refuse && !d.creditParNonBureau.dansListe, 'D',
      'un credit valide par quelqu un hors du bureau est refuse', d.creditParNonBureau.message + ' · propose dans la liste : ' + d.creditParNonBureau.dansListe);
    verifier(d.tauxRetroactif.dueApres === d.tauxRetroactif.dueAvant, 'D',
      'changer le taux du groupe ne change pas un credit deja accorde',
      'a rembourser ' + fc(d.tauxRetroactif.dueAvant) + ' avant, ' + fc(d.tauxRetroactif.dueApres) + ' apres · taux garde par le credit : ' + d.tauxRetroactif.tauxDuCredit + ' %', 'bloquant');
    verifier(d.membreOuvreReunion.refuse, 'D', 'un membre simple ne peut pas ouvrir une reunion', d.membreOuvreReunion.message);
    /* le faux membre : ce que l application voit, et ce qu elle ne voit pas */
    /* La chaine ne couvre pas la liste des membres : c est verifyMembres qui la couvre, en la
       comparant aux ecritures d inscription. Et le partage doit refuser. */
    verifier(!d.fauxMembre.listeOk, 'D', 'un faux membre ajoute dans les donnees est detecte',
      d.fauxMembre.raison, 'bloquant');
    verifier(d.fauxMembre.alerte, 'D', 'l accueil signale la liste alteree', 'alerte presente : ' + d.fauxMembre.alerte);
    verifier(/membres/i.test(d.fauxMembre.partageRefuse || ''), 'D',
      'le partage refuse tant que la liste des membres ne correspond pas au journal', d.fauxMembre.partageRefuse, 'bloquant');
    /* acces a une autre AVEC */
    if (d.autreAvec.ecran === 'affiche B')
      echoue('D', 'un responsable peut ouvrir le cahier d une autre AVEC du meme telephone',
        'session detournee vers « ' + d.autreAvec.fuite + ' » : l ecran du groupe s affiche', 'majeur');
    else passe('D', 'le cahier d une autre AVEC ne s ouvre pas avec la session du premier groupe', JSON.stringify(d.autreAvec));
    const rg = d.reglesEnCoursDeCycle;
    verifier(rg.ecranApresRetour !== 'a.newCycle' && !rg.champPresent && rg.reglesIntactes, 'D',
      'apres avoir vote les regles, le bouton Retour ne ramene pas au vote',
      'ecran atteint : ' + rg.ecranApresRetour + ' · ecarte de l historique : ' + rg.horsHistorique + ' · regles intactes : ' + rg.reglesIntactes);
    if (!rg.gardeDansLEcran)
      CONSTATS.push({ lot: 'D', etat: 'note', quoi: 'l ecran du reglement ne verifie pas lui-meme qu un vote est attendu',
        preuve: 'il est hors historique, donc aucun chemin n y mene en cours de cycle ; la garde manque seulement en profondeur' });
    trait();
  }

  /* ======================= LOT E — 500 CREDITS ======================= */
  if (fait('E')) {
    ligne('  LOT E — situation 5 : 500 credits, interets, retards, remboursements partiels');
    vivant('  500 credits …');
    const e = await jsj(`(() => {
      wipeTo(emptyData()); K.data.mode = 'prod'; App.cdraft = null;
      const JOUR = 24 * 3600 * 1000;
      const membres = Array.from({ length: 35 }, (_, i) => ({ id: 'n' + i, name: 'Emprunteur ' + (i + 1), sex: 'F', phone: '—' }));
      const M = membres.map(m => m.id);
      App.cdraft = { from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: 35, editing: null,
        roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
        g: { name: 'Credits Essai', province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secteur: '', groupement: '',
             village: 'Mabaya', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: new Date().toISOString().slice(0,10), embleme: Object.assign({}, EMB_DEFAUT) },
        r: { partValue: 1000, maxParts: 10, socialFee: 0, rate: 10, maxMult: 3, maxMonths: 6, fineAbsent: 500, fineLate: 200,
             penaltyRate: 10, cycleMonths: 12, cycleStart: new Date(Date.now() - 300 * JOUR).toISOString().slice(0,10) },
        rep: { social: '', credit: '', rows: {} } };
      ACT.cCreate();
      const id = App.cdraft.avecId; App.cdraft = null;
      const a = avecById(id); a.cycle.end = Date.now() + 400 * JOUR;
      const chef = a.members[0];
      const m0 = { id: a.id + '-r1', n: 1, cycle: 1, date: Date.now() - 300 * JOUR, status: 'open', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
      a.meetings.push(m0);
      a.members.forEach(x => appendTx(a, { meetingId: m0.id, type: 'EPARGNE', memberId: x.id, parts: 500, amount: 500000, by: chef.id, ts: Date.now() - 300 * JOUR }));

      const TAUX = [2, 5, 10], MOIS = [1, 2, 3, 6];
      const prets = [];
      let g = 987654;
      const alea = () => { g = (g * 1103515245 + 12345) & 0x7fffffff; return g / 0x7fffffff; };
      for (let k = 0; k < 500; k++) {
        const x = a.members[k % a.members.length];
        const taux = TAUX[k % TAUX.length], mois = MOIS[k % MOIS.length];
        const capital = 1000 + Math.floor(alea() * 60) * 500;
        const ts = Date.now() - Math.floor(200 - (k / 500) * 180) * JOUR;
        const t = appendTx(a, { meetingId: m0.id, type: 'CREDIT', memberId: x.id, amount: capital, months: mois, rate: taux, note: 'essai ' + k, by: chef.id, ts });
        /* trois profils : solde entierement, rembourse en partie, ne rembourse rien */
        const profil = k % 5;
        const du = Math.round(capital * (1 + taux / 100 * mois));
        let paye = 0;
        if (profil === 0 || profil === 1) {                       /* solde, en deux ou trois versements */
          const n = 2 + (k % 2);
          for (let v = 0; v < n; v++) {
            const part = v === n - 1 ? du - paye : Math.floor(du / n / 100) * 100;
            appendTx(a, { meetingId: m0.id, type: 'REMB', memberId: x.id, ref: t.id, amount: part, by: chef.id, ts: ts + (v + 1) * 20 * JOUR });
            paye += part;
          }
        } else if (profil === 2 || profil === 3) {                /* partiel */
          const part = Math.floor(du * 0.4 / 100) * 100;
          appendTx(a, { meetingId: m0.id, type: 'REMB', memberId: x.id, ref: t.id, amount: part, by: chef.id, ts: ts + 20 * JOUR });
          paye = part;
        }
        prets.push({ id: t.id, capital, taux, mois, du, paye, ts });
      }
      DB.save();
      const st = stats(a);
      const parId = {};
      st.loanList.forEach(l => parId[l.id] = l);
      let dueFaux = 0, resteFaux = 0, etatFaux = 0, penaliteFaux = 0;
      const exemples = [];
      prets.forEach(p => {
        const l = parId[p.id];
        if (!l) { dueFaux++; return; }
        if (l.due !== p.du) { dueFaux++; if (exemples.length < 3) exemples.push('du ' + l.due + ' au lieu de ' + p.du); }
        if (l.remaining !== Math.max(0, p.du - p.paye)) { resteFaux++; if (exemples.length < 3) exemples.push('reste ' + l.remaining + ' au lieu de ' + (p.du - p.paye)); }
        const attendu = l.remaining === 0 ? 'solde' : (Date.now() > l.dueDate ? 'retard' : 'cours');
        if (l.status !== attendu) { etatFaux++; if (exemples.length < 3) exemples.push('etat ' + l.status + ' au lieu de ' + attendu); }
        if (l.status === 'retard' && !(l.penalty > 0) && penRate(a.settings) > 0) penaliteFaux++;
      });
      const capitalDecaisse = a.tx.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
      const totalRembourse = a.tx.filter(t => t.type === 'REMB').reduce((s, t) => s + t.amount, 0);
      const capitalRembourse = st.loanList.reduce((s, l) => s + Math.min(l.paid, l.principal), 0);
      const interetsPercus = st.loanList.reduce((s, l) => s + Math.max(0, l.paid - l.principal), 0);
      return {
        nb: st.loanList.length, dueFaux, resteFaux, etatFaux, penaliteFaux, exemples,
        soldes: st.loanList.filter(l => l.status === 'solde').length,
        enCours: st.loanList.filter(l => l.status === 'cours').length,
        retards: st.loanList.filter(l => l.status === 'retard').length,
        capitalDecaisse, totalRembourse, capitalRembourse, interetsPercus,
        interetStats: st.interest, encours: st.outstanding,
        capitalEnCours: st.loanList.reduce((s, l) => s + Math.max(0, l.principal - Math.min(l.paid, l.principal)), 0),
        chaine: verifyChain(a).ok, tx: a.tx.length,
      };
    })()`);
    verifier(e.nb === 500, 'E', '500 credits enregistres', e.nb + ' credits · ' + e.tx + ' ecritures', 'bloquant');
    verifier(e.dueFaux === 0, 'E', 'l interet est calcule selon le taux et la duree de chaque credit',
      e.dueFaux + ' ecart(s) ' + (e.exemples.length ? '· ' + e.exemples.join(' ; ') : ''), 'bloquant');
    verifier(e.resteFaux === 0, 'E', 'le reste a payer suit les remboursements partiels', e.resteFaux + ' ecart(s)', 'bloquant');
    verifier(e.etatFaux === 0, 'E', 'l etat du credit (solde, en cours, en retard) est juste', e.etatFaux + ' ecart(s) sur ' + e.nb);
    verifier(e.penaliteFaux === 0, 'E', 'un credit en retard porte une penalite', e.penaliteFaux + ' retard(s) sans penalite');
    passe('E', 'repartition des 500 credits', e.soldes + ' soldes · ' + e.enCours + ' en cours · ' + e.retards + ' en retard');
    verifier(e.totalRembourse === e.capitalRembourse + e.interetsPercus, 'E',
      'capital rembourse et interets percus se distinguent et se recomposent',
      fc(e.capitalRembourse) + ' de capital + ' + fc(e.interetsPercus) + ' d interets = ' + fc(e.totalRembourse) + ' recu', 'bloquant');
    verifier(e.interetStats === e.interetsPercus, 'E', 'l interet annonce par l application est celui des credits',
      fc(e.interetStats) + ' contre ' + fc(e.interetsPercus));
    passe('E', 'encours annonce par l application', fc(e.encours) + ' (capital et interets restant dus)');
    passe('E', 'capital encore dehors', fc(e.capitalEnCours) + ' sur ' + fc(e.capitalDecaisse) + ' decaisses');
    verifier(e.chaine, 'E', 'journal intact apres 500 credits et leurs remboursements', '', 'bloquant');
    trait();
  }


  /* ======================= LOT G — CONCURRENCE, HORS LIGNE, SYNCHRONISATION ======================= */
  if (fait('G')) {
    ligne('  LOT G — situations 1 et 3 : deux appareils, trente jours hors ligne, synchronisation');

    /* G0 — ce que l application appelle « envoyer au serveur » */
    const g0 = await jsj(`(async () => {
      wipeTo(emptyData()); K.data.mode = 'prod'; App.cdraft = null;
      const membres = Array.from({ length: 12 }, (_, i) => ({ id: 'n' + i, name: 'Membre ' + (i + 1), sex: 'F', phone: '—' }));
      const M = membres.map(m => m.id);
      App.cdraft = { from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: 12, editing: null,
        roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
        g: { name: 'Reseau Essai', province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secteur: '', groupement: '',
             village: 'Mabaya', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: new Date().toISOString().slice(0,10), embleme: Object.assign({}, EMB_DEFAUT) },
        r: { partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200,
             penaltyRate: 10, cycleMonths: 12, cycleStart: new Date().toISOString().slice(0,10) },
        rep: { social: '', credit: '', rows: {} } };
      ACT.cCreate();
      const id = App.cdraft.avecId; App.cdraft = null;
      const a = avecById(id);
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: id, memberId: chef.id };
      const m0 = { id: a.id + '-r1', n: 1, cycle: 1, date: Date.now(), status: 'closed', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
      a.meetings.push(m0);
      a.members.forEach(x => appendTx(a, { meetingId: m0.id, type: 'EPARGNE', memberId: x.id, parts: 5, amount: 5000, by: chef.id }));
      m0.closeExpected = m0.closeCount = stats(a).cash; m0.sealSeq = a.tx.length; m0.seal = a.tx[a.tx.length - 1].hash;
      DB.save();

      /* on écoute tout ce qui sortirait du téléphone */
      const sorties = [];
      const vraiFetch = window.fetch;
      window.fetch = function (u, o) { sorties.push(String(u)); return vraiFetch.apply(this, arguments); };
      const vraiXHR = window.XMLHttpRequest.prototype.open;
      window.XMLHttpRequest.prototype.open = function (m, u) { sorties.push('xhr ' + u); return vraiXHR.apply(this, arguments); };
      const vraiBeacon = navigator.sendBeacon;
      let beacons = 0;
      try { navigator.sendBeacon = function (u) { beacons++; sorties.push('beacon ' + u); return true; }; } catch (e) { /* non modifiable */ }

      K.data.net.online = true;
      const enAttenteAvant = pending(a);
      window.__dit = ''; const vrai = App.toast; App.toast = function (t) { window.__dit = t; return vrai.apply(this, arguments); };
      /* On ouvre la feuille de sauvegarde et on regarde ce qu elle affiche, sans produire de
         fichier : rien ne doit laisser croire que le cahier est sorti du telephone. */
      let plante = null, feuille = '';
      try { ACT.syncSheet(); feuille = (document.body.innerHTML.match(/<h2>[^<]*<\\/h2>/) || [''])[0]; } catch (e) { plante = String(e.message || e); }
      const texteFeuille = document.body.innerText || '';
      App.closeSheet();
      const rendu = typeof window.syncAvec === 'function';
      const message = window.__dit;
      App.toast = vrai;
      window.fetch = vraiFetch; window.XMLHttpRequest.prototype.open = vraiXHR;
      try { navigator.sendBeacon = vraiBeacon; } catch (e) { /* rien */ }

      return {
        id, enAttenteAvant, enAttenteApres: pending(a), rendu, message,
        sorties, beacons, dernierEnvoi: a.lastSync ? 'enregistre' : 'jamais',
        pastille: syncPill(a).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim(),
        toutMarqueEnvoye: a.tx.every(t => t.synced),
        ditPasDeServeur: /serveur/i.test(texteFeuille),
        ditQueCaNExistePasAilleurs: /que sur ce t/i.test(texteFeuille),
        plante, feuille,
      };
    })()`);
    verifier(!g0.plante, 'G', 'la feuille de sauvegarde s ouvre', g0.plante || g0.feuille);
    verifier(g0.rendu === false, 'G', 'la fonction qui annoncait un envoi au serveur n existe plus',
      'syncAvec encore present : ' + g0.rendu, 'bloquant');
    verifier(g0.enAttenteApres === g0.enAttenteAvant && !g0.toutMarqueEnvoye, 'G',
      'aucun geste ne fait croire que le cahier est a l abri sans fichier produit',
      g0.enAttenteAvant + ' ecritures avant, ' + g0.enAttenteApres + ' apres · ' + g0.sorties.length + ' requete(s) reseau · derniere sortie : ' + g0.dernierEnvoi, 'bloquant');
    verifier(g0.ditPasDeServeur && g0.ditQueCaNExistePasAilleurs, 'G',
      'la feuille dit qu il n y a pas de serveur et que le cahier n existe que sur ce telephone',
      'parle du serveur : ' + g0.ditPasDeServeur + ' · dit « que sur ce telephone » : ' + g0.ditQueCaNExistePasAilleurs, 'bloquant');
    passe('G', 'ce que montre la pastille', g0.pastille);

    /* G1 — deux appareils tiennent la meme AVEC */
    const U = onglet(PORT + 1); await U.ouvrir();
    /* On passe par le vrai bouton d envoi, pas par buildTransfer : c est transferRun qui
       marque l AVEC comme partie, et c est cette marque qui empeche deux cahiers vivants. */
    const envoi = await jsj(`(async () => {
      const a = avecById(${JSON.stringify(g0.id)});
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
      App.lastTransfer = null;
      await ACT.transferRun({ id: a.id });
      App.closeSheet();
      return { fichier: App.lastTransfer ? App.lastTransfer.file : null, code: App.lastTransfer ? App.lastTransfer.code : null,
        movedOut: !!a.movedOut, trace: (a.security || []).some(x => /envoy/i.test(JSON.stringify(x))) };
    })()`);
    verifier(!!envoi.fichier && envoi.movedOut, 'G', 'l envoi marque l AVEC comme partie et laisse une trace',
      'marquee : ' + envoi.movedOut + ' · trace de securite : ' + envoi.trace, 'bloquant');
    const fichier = envoi.fichier;
    const g1b = await U.jsj(`(async () => {
      App.licence = { ok: true, data: { id: 'ESSAI', name: 'Essai', kind: 'org' } };
      const r = await importTransfer(${JSON.stringify(fichier)}, ${JSON.stringify(envoi.code)});
      return { recu: r.id || null, erreur: r.error || null, tx: r.id ? avecById(r.id).tx.length : 0 };
    })()`);
    verifier(!!g1b.recu, 'G', 'le deuxieme telephone recoit l AVEC par le fichier de transfert',
      g1b.erreur || (g1b.tx + ' ecritures recues'), 'bloquant');

    /* le premier a-t-il rendu la main ? */
    const g1c = await jsj(`(() => {
      const a = avecById(${JSON.stringify(g0.id)});
      window.__dit = ''; const vrai = App.toast; App.toast = function (t) { window.__dit = t; return vrai.apply(this, arguments); };
      const avant = a.meetings.length;
      ACT.startMeeting();
      const refus = a.meetings.length === avant;
      App.toast = vrai;
      return { movedOut: !!a.movedOut, refus, message: window.__dit };
    })()`);
    verifier(g1c.refus, 'G', 'le telephone qui a envoye l AVEC ne peut plus ouvrir de reunion',
      g1c.message + ' · marque comme partie : ' + g1c.movedOut, 'bloquant');

    /* G2 — une sauvegarde d avant le transfert remet l AVEC en service : deux copies vivantes */
    /* Le vrai chemin de la divergence : une sauvegarde faite AVANT l envoi, restauree ensuite
       sur un telephone neuf. Remettre movedOut a null dans les donnees, comme le faisait cet
       essai, n est pas un geste que l application permet. */
    const g2 = await jsj(`(async () => {
      const a = avecById(${JSON.stringify(g0.id)});
      /* on refait ce que fait ACT.restoreRun : l AVEC revit, mais marquee a verifier */
      const derniere = a.meetings.filter(m => m.status === 'closed').reduce((x, m) => Math.max(x, m.n), 0);
      a.movedOut = null;
      a.recuDe = { quand: Date.now() - 86400000, reunions: derniere, ecritures: a.tx.length,
        tete: a.tx.length ? a.tx[a.tx.length - 1].hash : null, caisse: stats(a).cash,
        par: 'sauvegarde restauree', recuLe: Date.now(), confirme: null };
      DB.save();
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
      const avant = a.meetings.length;
      ACT.startMeeting();
      const m = openMeeting(a);
      if (m) { activeM(a).forEach(x => m.presence[x.id] = 'P');
        appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[0].id, parts: 3, amount: 3000, by: chef.id });
        Object.assign(m, { status: 'closed', closedAt: Date.now(), closeExpected: stats(a).cash, closeCount: stats(a).cash,
          validators: keyHolders(a).slice(0,3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length-1].hash }); }
      DB.save();
      const chef2 = a.members.find(x => x.role === 'president' && !x.left);
      K.session = { kind: 'avec', avecId: a.id, memberId: chef2.id };
      return { ouverte: a.meetings.length > avant, tx: a.tx.length, tete: a.tx[a.tx.length - 1].hash.slice(0, 10),
        /* ce que l application dit de cette copie ressuscitee */
        signale: /Cahier reçu d/.test(SCREENS['a.home']()),
        partage: (() => { App.draftKey = null; App.go('a.shareRun'); const st = stats(a);
          App.draft.closeCount = String(st.cash); keyHolders(a).slice(0, 3).forEach(h => { App.draft.locks[h.id] = true; });
          return sharePret(a, stats(a)) || 'aucune'; })() };
    })()`);
    /* pendant ce temps, l autre telephone travaille aussi */
    const g2b = await U.jsj(`(() => {
      const a = avecById(${JSON.stringify(g0.id)});
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
      ACT.startMeeting();
      const m = openMeeting(a);
      if (m) { activeM(a).forEach(x => m.presence[x.id] = 'P');
        appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[1].id, parts: 4, amount: 4000, by: chef.id });
        Object.assign(m, { status: 'closed', closedAt: Date.now(), closeExpected: stats(a).cash, closeCount: stats(a).cash,
          validators: keyHolders(a).slice(0,3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length-1].hash }); }
      DB.save();
      return { tx: a.tx.length, tete: a.tx[a.tx.length - 1].hash.slice(0, 10), caisse: stats(a).cash };
    })()`);
    const divergent = g2.tete !== g2b.tete;
    /* On ne peut pas empecher deux copies d exister sans serveur : une sauvegarde ne sait pas
       ce qui s est passe apres elle. Ce qu on exige, c est que l application ne presente aucune
       des deux comme la verite, et qu elle refuse de partager avant verification. */
    passe('G', 'deux copies peuvent exister apres restauration d une sauvegarde ancienne',
      'telephone 1 : ' + g2.tx + ' ecritures (tete ' + g2.tete + ') · telephone 2 : ' + g2b.tx + ' ecritures (tete ' + g2b.tete + ')');
    verifier(g2.signale === true, 'G', 'la copie restauree est signalee comme venant d ailleurs',
      'bandeau affiche : ' + g2.signale, 'bloquant');
    verifier(/autre t|plus r/i.test(g2.partage), 'G', 'la copie restauree ne peut pas partager avant verification',
      g2.partage, 'bloquant');

    /* G3 — l application sait-elle dire laquelle des deux copies est la bonne ? */
    const fichier2 = await U.js(`buildTransfer(avecById(${JSON.stringify(g0.id)}), 'ESSAI1234')`);
    const g3 = await jsj(`(async () => {
      const a = avecById(${JSON.stringify(g0.id)});
      const avant = { tx: a.tx.length, tete: a.tx[a.tx.length - 1].hash.slice(0, 10), caisse: stats(a).cash };
      const r = await importTransfer(${JSON.stringify(fichier2)}, 'ESSAI1234');
      const b = avecById(${JSON.stringify(g0.id)});
      return { erreur: r.error || null, recu: r.id || null,
        apres: { tx: b.tx.length, tete: b.tx[b.tx.length - 1].hash.slice(0, 10), caisse: stats(b).cash }, avant,
        ecrase: r.id ? (avant.tete !== b.tx[b.tx.length - 1].hash.slice(0, 10)) : false };
    })()`);
    if (g3.erreur) passe('G', 'recevoir la copie divergente de l autre telephone est refuse', g3.erreur);
    else if (g3.ecrase)
      echoue('G', 'recevoir la copie de l autre telephone ecrase le cahier local sans avertir',
        'avant : ' + g3.avant.tx + ' ecritures, ' + fc(g3.avant.caisse) + ' · apres : ' + g3.apres.tx + ' ecritures, ' + fc(g3.apres.caisse) + ' — les ecritures locales sont perdues', 'bloquant');
    else passe('G', 'la reception ne change rien au cahier local', JSON.stringify(g3));
    absent('G', 'une fusion des deux cahiers divergents', 'l application n a aucun mecanisme de rapprochement : elle refuse ou remplace, elle ne reconcilie pas');

    /* G4 — trente jours hors ligne, puis transfert : rien ne doit manquer */
    const g4 = await U.jsj(`(async () => {
      const a = avecById(${JSON.stringify(g0.id)});
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
      K.data.net.online = false;
      const JOUR = 24 * 3600 * 1000;
      const t0 = Date.now();
      const avant = a.tx.length;
      for (let s = 1; s <= 4; s++) {                               /* quatre reunions en trente jours */
        const ts = t0 + s * 7 * JOUR;
        const n = a.meetings.reduce((x, m) => Math.max(x, m.n), 0) + 1;
        const m = { id: a.id + '-h' + n, n, cycle: 1, date: ts, status: 'open', presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
        activeM(a).forEach((x, i) => m.presence[x.id] = i % 7 === 0 ? 'A' : 'P');
        a.meetings.push(m);
        activeM(a).filter(x => m.presence[x.id] === 'P').forEach((x, i) => {
          appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: x.id, parts: 1 + (i % 5), amount: (1 + (i % 5)) * 1000, by: chef.id, ts });
          appendTx(a, { meetingId: m.id, type: 'SOCIAL', memberId: x.id, amount: 500, by: chef.id, ts });
        });
        if (s === 2) appendTx(a, { meetingId: m.id, type: 'CREDIT', memberId: a.members[4].id, amount: 10000, months: 2, rate: 10, note: 'hors ligne', by: chef.id, ts });
        if (s === 4) appendTx(a, { meetingId: m.id, type: 'REMB', memberId: a.members[4].id, ref: a.tx.find(t => t.type === 'CREDIT' && t.note === 'hors ligne').id, amount: 6000, by: chef.id, ts });
        activeM(a).filter(x => m.presence[x.id] === 'A').forEach(x =>
          appendTx(a, { meetingId: m.id, type: 'DETTE', memberId: x.id, amount: a.settings.fineAbsent, note: 'Absence', by: chef.id, ts }));
        Object.assign(m, { status: 'closed', closedAt: ts, closeExpected: stats(a).cash, closeCount: stats(a).cash,
          validators: keyHolders(a).slice(0,3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length-1].hash });
      }
      /* un membre change de statut pendant la periode hors ligne */
      a.members[11].left = Date.now();
      DB.save();
      const st = stats(a);
      const f = await buildTransfer(a, 'HORSLIGNE1');
      return { avant, apres: a.tx.length, reunions: a.meetings.length, enAttente: pending(a),
        caisse: st.cash, social: st.socialFund, encours: st.outstanding, parts: st.parts,
        chaine: verifyChain(a).ok, fichier: f.length, actifs: activeM(a).length };
    })()`);
    verifier(g4.chaine, 'G', 'trente jours de reunions hors ligne restent scelles', g4.apres - g4.avant + ' nouvelles ecritures, ' + g4.reunions + ' reunions', 'bloquant');
    passe('G', 'tout reste en attente d envoi tant qu il n y a pas de reseau', g4.enAttente + ' ecritures en attente');
    trait();
    await U.fermer();
  }


  /* ======================= LOT B — LES QUATRE EQUATIONS, A L ECHELLE ======================= */
  if (fait('B')) {
    ligne('  LOT B — les quatre equations obligatoires, sur 20 AVEC ayant vecu 20 semaines');
    vivant('  20 AVEC x 20 semaines …');
    const b = await jsj('(' + FABRIQUE + ')(20, 25, ' + JSON.stringify(LIEUX) + ', ' + JSON.stringify(REGLES) + ', 112233)');
    if (b.erreur) echoue('B', '20 AVEC pretes', b.erreur, 'bloquant');
    else {
      const bb = await jsj(`(() => {
        const cycler = ${CYCLER};
        const sorties = K.data.avecs.map(a => cycler(a.id, 20, { pAbsent: 12, credits: 2 }));
        const ecarts = [];
        K.data.avecs.forEach(a => {
          const st = stats(a);
          const entrees = a.tx.filter(t => TX[t.type] && TX[t.type].in === true).reduce((s, t) => s + t.amount, 0);
          const sortiesFC = a.tx.filter(t => TX[t.type] && TX[t.type].in === false).reduce((s, t) => s + t.amount, 0);
          if (entrees - sortiesFC !== st.cash) ecarts.push(a.name + ' : caisse ' + st.cash + ' contre ' + (entrees - sortiesFC));
          const encours = st.loanList.reduce((s, l) => s + l.remaining, 0);
          if (encours !== st.outstanding) ecarts.push(a.name + ' : encours ' + st.outstanding + ' contre ' + encours);
          const parts = activeM(a).reduce((s, x) => s + st.mem[x.id].parts, 0);
          if (parts !== st.parts) ecarts.push(a.name + ' : parts ' + st.parts + ' contre ' + parts);
          if (st.socialFund + st.loanFund !== st.cash) ecarts.push(a.name + ' : sociale+credit ' + (st.socialFund + st.loanFund) + ' contre ' + st.cash);
          if (st.socialFund < 0 || st.loanFund < 0) ecarts.push(a.name + ' : une caisse negative');
          if (!verifyChain(a).ok) ecarts.push(a.name + ' : journal altere');
        });
        return { n: K.data.avecs.length, ecarts, tx: K.data.avecs.reduce((s, a) => s + a.tx.length, 0),
          credits: sorties.reduce((s, x) => s + x.credits, 0),
          poids: Math.round((localStorage.getItem('kitabu.avec.v4') || '').length / 1024) };
      })()`);
      verifier(bb.ecarts.length === 0, 'B', 'les quatre equations tiennent sur les 20 AVEC',
        bb.ecarts.length ? bb.ecarts.slice(0, 4).join(' | ') : bb.tx + ' ecritures, ' + bb.credits + ' credits verifies', 'bloquant');
      passe('B', 'poids du stockage apres 20 cycles partiels', bb.poids + ' Ko pour 20 AVEC de 25 membres sur 20 semaines');
    }
    trait();
  }

  /* ======================= LOT F — 50 PARTAGES, DONT DES SITUATIONS NON REGLEES ======================= */
  if (fait('F')) {
    ligne('  LOT F — situation 6 : cloture de 50 AVEC, avec des situations non reglees');
    vivant('  50 AVEC x 44 semaines …');
    const f0 = await jsj('(' + FABRIQUE + ')(50, 20, ' + JSON.stringify(LIEUX) + ', ' + JSON.stringify(REGLES) + ', 778899)');
    if (f0.erreur) echoue('F', '50 AVEC pretes', f0.erreur, 'bloquant');
    else {
      const f = await jsj(`(() => {
        const cycler = ${CYCLER};
        K.data.avecs.forEach(a => cycler(a.id, 44, { pAbsent: 12, credits: 2 }));
        const bilan = { bloques: 0, prets: 0, raisons: {}, cas: [] };
        K.data.avecs.forEach((a, i) => {
          const chef = a.members.find(x => x.role === 'president');
          K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
          const genre = i % 5;
          let pose = '';
          /* une séance de régularisation, ouverte puis scellée : écrire dans une réunion déjà
             close est détecté par la vérification du journal, et c'est voulu. */
          const ouvrir = () => {
            const n = a.meetings.reduce((x, y) => Math.max(x, y.n), 0) + 1;
            const mm = { id: a.id + '-reg' + n, n, cycle: a.cycle.n, date: Date.now(), status: 'open',
              presence: {}, openedBy: chef.id, stepDone: 7, synced: false };
            activeM(a).forEach(x => mm.presence[x.id] = 'P');
            a.meetings.push(mm);
            mm.openExpected = mm.openCount = stats(a).cash;
            return mm;
          };
          const sceller = mm => { const st2 = stats(a); Object.assign(mm, { status: 'closed', closedAt: Date.now(),
            closeExpected: st2.cash, closeCount: st2.cash, validators: keyHolders(a).slice(0, 3).map(h => h.id),
            sealSeq: a.tx.length, seal: a.tx[a.tx.length - 1].hash }); };
          if (genre === 0) { pose = 'credit non rembourse'; }                 /* on laisse les credits en cours */
          if (genre === 1) {                                                  /* un membre part avec une dette */
            const st0 = stats(a);
            const endette = activeM(a).find(x => st0.mem[x.id].loans.some(l => l.status !== 'solde'));
            if (endette) { endette.left = Date.now(); pose = 'membre sorti avec credit'; } else pose = 'aucun endette a sortir';
          }
          if (genre === 2) {                                                  /* amendes impayees */
            const mm = ouvrir();
            activeM(a).slice(0, 5).forEach(x => appendTx(a, { meetingId: mm.id, type: 'DETTE', memberId: x.id, amount: 5000, note: 'Amende impayee', by: chef.id }));
            sceller(mm);
            pose = 'amendes impayees';
          }
          if (genre === 3) {                                                  /* ecart de caisse non explique */
            pose = 'ecart de caisse';
          }
          if (genre === 4) {                                                  /* tout est regle : le partage doit passer */
            const mm = ouvrir();
            stats(a).activeLoans.forEach(l => appendTx(a, { meetingId: mm.id, type: 'REMB', memberId: l.memberId, ref: l.id, amount: l.remaining, note: 'solde avant partage', by: chef.id }));
            const st1 = stats(a);
            activeM(a).forEach(x => { const d = st1.mem[x.id].fineDebt; if (d > 0) appendTx(a, { meetingId: mm.id, type: 'AMENDE', ref: 'DETTE', memberId: x.id, amount: d, note: 'amendes payees', by: chef.id }); });
            sceller(mm);
            pose = 'tout regle';
          }
          DB.save();
          App.draftKey = null; App.go('a.shareRun');
          const st = stats(a);
          if (genre !== 3) App.draft.closeCount = String(st.cash);
          else App.draft.closeCount = String(st.cash - 12345);                /* comptage faux, sans explication */
          keyHolders(a).slice(0, 3).forEach(h => { App.draft.locks[h.id] = true; });
          const faute = sharePret(a, stats(a));
          const plan = sharePlan(a, stats(a));
          if (faute) { bilan.bloques++; bilan.raisons[faute] = (bilan.raisons[faute] || 0) + 1; }
          else bilan.prets++;
          if (bilan.cas.length < 5 || genre === 4) bilan.cas.push({ pose, faute: faute || 'aucune', bloques: plan.blocked.length,
            pool: Math.round(plan.pool), caisse: st.cash, encours: st.outstanding });
          /* l equation du partage : fonds partageables = liquidites, pas les creances */
          /* la retenue doit valoir exactement ce que le membre doit, et l argent doit se boucler */
          const retenu = plan.rows.reduce((x, r) => x + r.ded, 0);
          const du = plan.rows.reduce((x, r) => x + r.loanRem + r.debt, 0);
          if (retenu !== du) bilan.retenueFausse = (bilan.retenueFausse || 0) + 1;
          if (plan.rows.some(r => r.ded > 0 && r.net > 0 && r.grossR !== r.net + r.ded)) bilan.partIncoherente = (bilan.partIncoherente || 0) + 1;
          bilan.avecRetenue = (bilan.avecRetenue || 0) + (retenu > 0 ? 1 : 0);
          bilan.retenuTotal = (bilan.retenuTotal || 0) + retenu;
          bilan.dernier = { pose, pool: Math.round(plan.pool), caisse: st.cash, credit: st.loanFund,
            encours: st.outstanding, dettes: st.fineDebt, aDonner: Math.round(plan.paid), retenu,
            depasseLaCaisse: Math.round(plan.paid) > st.cash };
        });
        /* un dernier cas, fabrique exprès : un membre doit plus que sa part */
        const a0 = K.data.avecs[0];
        const chef0 = a0.members.find(x => x.role === 'president');
        K.session = { kind: 'avec', avecId: a0.id, memberId: chef0.id };
        const victime = activeM(a0)[7];
        const nD = a0.meetings.reduce((x, y) => Math.max(x, y.n), 0) + 1;
        const mD = { id: a0.id + '-dette', n: nD, cycle: a0.cycle.n, date: Date.now(), status: 'open',
          presence: {}, openedBy: chef0.id, stepDone: 7, synced: false };
        activeM(a0).forEach(x => mD.presence[x.id] = 'P');
        a0.meetings.push(mD);
        mD.openExpected = mD.openCount = stats(a0).cash;
        appendTx(a0, { meetingId: mD.id, type: 'DETTE', memberId: victime.id, amount: 9000000, note: 'dette enorme', by: chef0.id });
        const stD = stats(a0);
        Object.assign(mD, { status: 'closed', closedAt: Date.now(), closeExpected: stD.cash, closeCount: stD.cash,
          validators: keyHolders(a0).slice(0, 3).map(h => h.id), sealSeq: a0.tx.length, seal: a0.tx[a0.tx.length - 1].hash });
        DB.save();
        App.draftKey = null; App.go('a.shareRun');
        App.draft.closeCount = String(stats(a0).cash);
        keyHolders(a0).slice(0, 3).forEach(h => { App.draft.locks[h.id] = true; });
        const planD = sharePlan(a0, stats(a0));
        bilan.detteSuperieure = { faute: sharePret(a0, stats(a0)) || 'aucune', bloques: planD.blocked.length,
          nomsBloques: planD.blocked.map(r => r.x.name).slice(0, 2) };
        return bilan;
      })()`);
      passe('F', '50 clotures examinees', f.prets + ' autorisees, ' + f.bloques + ' bloquees');
      Object.keys(f.raisons).forEach(r => passe('F', 'motif de blocage rencontre', r + ' (' + f.raisons[r] + ' fois)'));
      const regle = f.cas.filter(c => c.pose === 'tout regle');
      verifier(regle.length > 0 && regle.every(c => c.faute === 'aucune'), 'F',
        'une AVEC dont tout est regle peut partager', regle.length + ' cas, fautes : ' + regle.map(c => c.faute).join(', '), 'bloquant');
      /* Un credit non rembourse ou une amende impayee ne doivent pas bloquer : la methode AVEC
         les regle par retenue sur la part du membre, et c est ce que fait l application. */
      verifier(!f.retenueFausse, 'F', 'la retenue sur la part egale exactement ce que le membre doit',
        (f.retenueFausse || 0) + ' ecart(s) sur 50 clotures · ' + (f.avecRetenue || 0) + ' AVEC avec retenue, ' + fc(f.retenuTotal || 0) + ' retenus en tout', 'bloquant');
      verifier(!f.partIncoherente, 'F', 'part inscrite = argent recu + dettes retenues', (f.partIncoherente || 0) + ' ecart(s)', 'bloquant');
      const dd = f.detteSuperieure || {};
      verifier(dd.bloques > 0 && /rembours/i.test(dd.faute || ''), 'F',
        'un membre qui doit plus que sa part fait refuser le partage, et il est nomme',
        (dd.faute || '') + ' · ' + (dd.bloques || 0) + ' membre(s) : ' + (dd.nomsBloques || []).join(', '), 'bloquant');
      verifier(f.bloques > 0, 'F', 'un ecart de caisse non explique bloque le partage', f.bloques + ' cloture(s) refusee(s) sur 50');
      verifier(f.dernier && !f.dernier.depasseLaCaisse, 'F',
        'les fonds a distribuer ne depassent pas les liquidites',
        f.dernier ? fc(f.dernier.aDonner) + ' a donner pour ' + fc(f.dernier.caisse) + ' en caisse' : '', 'bloquant');
      trait();
    }
  }

  /* ======================= LOT I — EXPORTS ET RAPPORTS ======================= */
  if (fait('I')) {
    ligne('  LOT I — situation 8 : exports et rapports confrontes au journal');
    const i0 = await jsj('(' + FABRIQUE + ')(12, 20, ' + JSON.stringify(LIEUX) + ', ' + JSON.stringify(REGLES) + ', 445566)');
    if (i0.erreur) echoue('I', '12 AVEC pretes', i0.erreur, 'bloquant');
    else {
      const i = await jsj(`(() => {
        const cycler = ${CYCLER};
        K.data.avecs.forEach(a => cycler(a.id, 16, { pAbsent: 10, credits: 2 }));
        /* l export appartient a Akiba Suivi : on met en place une organisation et son animateur */
        K.data.orgs = [{ id: 'orgA', name: 'ONG Essai', zone: 'Sud-Ubangi', province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secret: 'x', rescue: [] }];
        K.data.users = [{ id: 'uOrg', role: 'org', orgId: 'orgA', name: 'Coordination Essai', pin: '1234' },
          { id: 'uAnim', role: 'anim', orgId: 'orgA', name: 'Animateur Essai', pin: '2345' }];
        K.data.avecs.forEach(x => { x.orgId = 'orgA'; x.animId = 'uAnim'; x.status = 'active'; });
        K.session = { kind: 'org', userId: 'uOrg' };
        DB.save();
        const t = performance.now();
        const feuilles = exportSheets(K.data.avecs);
        const duree = Math.round(performance.now() - t);
        const noms = feuilles.map(f => f.name);
        /* on compare chaque total chiffre des feuilles au journal */
        const reel = K.data.avecs.reduce((acc, a) => {
          const st = stats(a);
          acc.caisse += st.cash; acc.epargne += a.tx.filter(x => x.type === 'EPARGNE').reduce((s, x) => s + x.amount, 0);
          acc.credits += a.tx.filter(x => x.type === 'CREDIT').reduce((s, x) => s + x.amount, 0);
          acc.rembs += a.tx.filter(x => x.type === 'REMB').reduce((s, x) => s + x.amount, 0);
          acc.social += st.socialFund; acc.encours += st.outstanding; acc.membres += activeM(a).length;
          acc.parts += st.parts;
          return acc;
        }, { caisse: 0, epargne: 0, credits: 0, rembs: 0, social: 0, encours: 0, membres: 0, parts: 0 });
        /* le fichier Excel se construit-il, et que pese-t-il ? */
        let xlsx = null, erreurXlsx = null;
        try { const b = buildXlsx(feuilles); xlsx = b && b.size ? b.size : (b && b.byteLength) || null; } catch (e) { erreurXlsx = String(e.message || e); }
        /* ce que l export compte, et ce qu il laisse de cote */
        const marque = K.data.avecs.reduce((acc, a) => {
          const tout = stats(a), envoye = stats(a, { syncedOnly: true });
          acc.caisseTout += tout.cash; acc.caisseEnvoyee += envoye.cash;
          acc.epargneTout += tout.sum.EPARGNE || 0; acc.epargneEnvoyee += envoye.sum.EPARGNE || 0;
          acc.enAttente += pending(a);
          return acc;
        }, { caisseTout: 0, caisseEnvoyee: 0, epargneTout: 0, epargneEnvoyee: 0, enAttente: 0 });
        return { feuilles: noms, nb: feuilles.length, duree, reel, xlsx, erreurXlsx, marque,
          colonnes: feuilles.map(f => ({ nom: f.name, cols: (f.cols || []).length, lignes: (f.rows || []).length })) };
      })()`);
      passe('I', 'feuilles produites', i.nb + ' feuilles : ' + i.feuilles.join(', '));
      passe('I', 'duree de l export', i.duree + ' ms pour 12 AVEC');
      verifier(i.xlsx && !i.erreurXlsx, 'I', 'le fichier Excel se construit', i.erreurXlsx || Math.round(i.xlsx / 1024) + ' Ko');
      passe('I', 'lignes par feuille', i.colonnes.map(c => c.nom + ' ' + c.lignes).join(' · '));
      /* Le point decisif : exportSheets appelle stats(a, { syncedOnly: true }). Ce que l export
         additionne n est donc pas le journal, mais la part des ecritures marquees « envoyees ». */
      /* On relit ce que l export produit reellement, feuille par feuille, au lieu de recalculer
         un filtre : c est le fichier remis au partenaire qui doit coller au journal. */
      const lu = await jsj(`(() => {
        const f = exportSheets(K.data.avecs);
        const feuille = n => f.find(x => x.name === n);
        const valeur = (fe, li) => { const r = (fe.rows || []).find(r => String(r[0]).toLowerCase().indexOf(li) >= 0); if (!r) return null; const v = r[1]; return v && typeof v === 'object' ? v.v : v; };
        const syn = feuille('Synthèse');
        const colTotal = (nom, titre) => { const fe = feuille(nom); if (!fe) return null;
          const k = (fe.cols || []).findIndex(c => String(c.h || c).toLowerCase().indexOf(titre) >= 0);
          if (k < 0) return null;
          return (fe.rows || []).reduce((s2, r) => { const v = r[k]; const n2 = v && typeof v === 'object' ? v.v : v; return s2 + (typeof n2 === 'number' ? n2 : 0); }, 0); };
        return { synCaisse: valeur(syn, 'argent en caisse'), synEpargne: valeur(syn, 'épargne du cycle'),
          synAttente: valeur(syn, 'pas encore transmises'), synSource: valeur(syn, 'source'),
          avecCaisse: colTotal('AVEC', 'argent en caisse'), reunions: (feuille('Réunions').rows || []).length,
          credits: (feuille('Crédits').rows || []).length };
      })()`);
      verifier(lu.synCaisse === i.reel.caisse, 'I', 'le total de caisse de la synthese egale le journal',
        fc(lu.synCaisse) + ' exporte contre ' + fc(i.reel.caisse) + ' au journal', 'bloquant');
      verifier(lu.synEpargne === i.reel.epargne, 'I', 'le total d epargne de la synthese egale le journal',
        fc(lu.synEpargne) + ' contre ' + fc(i.reel.epargne), 'bloquant');
      verifier(lu.avecCaisse === i.reel.caisse, 'I', 'la feuille AVEC se recoupe avec la synthese',
        fc(lu.avecCaisse) + ' contre ' + fc(i.reel.caisse), 'bloquant');
      verifier(lu.reunions > 0 && lu.credits > 0, 'I', 'les feuilles Reunions et Credits ne sont pas vides',
        lu.reunions + ' reunions, ' + lu.credits + ' credits', 'bloquant');
      verifier(typeof lu.synAttente === 'number', 'I', 'le fichier dit combien d ecritures ne sont pas encore transmises',
        lu.synAttente + ' en attente · source annoncee : « ' + lu.synSource + ' »', 'bloquant');
      passe('I', 'totaux du journal, pour comparaison', 'caisse ' + fc(i.reel.caisse) + ' · epargne ' + fc(i.reel.epargne)
        + ' · credits ' + fc(i.reel.credits) + ' · remboursements ' + fc(i.reel.rembs) + ' · ' + i.reel.membres + ' membres · ' + i.reel.parts + ' parts');
      /* la comparaison ligne a ligne : on relit les feuilles et on resomme */
      const j = await jsj(`(() => {
        const feuilles = exportSheets(K.data.avecs);
        const somme = (nomFeuille, titreColonne) => {
          const f = feuilles.find(x => x.name === nomFeuille);
          if (!f) return { absent: true };
          const k = (f.cols || []).findIndex(c => String(c).toLowerCase().indexOf(titreColonne) >= 0);
          if (k < 0) return { colonneAbsente: (f.cols || []).join(' | ') };
          return { total: (f.rows || []).reduce((s, r) => s + (typeof r[k] === 'number' ? r[k] : 0), 0), lignes: (f.rows || []).length };
        };
        return { feuilles: feuilles.map(f => ({ nom: f.name, cols: f.cols })),
          essais: { caisse: somme('AVEC', 'caisse'), parts: somme('Membres', 'part'), epargne: somme('Membres', 'épargne') } };
      })()`);
      const dit = JSON.stringify(j.essais);
      if (j.essais.caisse && j.essais.caisse.total !== undefined)
        verifier(j.essais.caisse.total === i.reel.caisse, 'I', 'le total de caisse exporte egale celui du journal',
          fc(j.essais.caisse.total) + ' exporte contre ' + fc(i.reel.caisse) + ' au journal', 'bloquant');
      else CONSTATS.push({ lot: 'I', etat: 'note', quoi: 'colonnes des feuilles', preuve: JSON.stringify(j.feuilles).slice(0, 600) });
      if (j.essais.epargne && j.essais.epargne.total !== undefined)
        verifier(j.essais.epargne.total === i.reel.epargne, 'I', 'le total d epargne exporte egale celui du journal',
          fc(j.essais.epargne.total) + ' contre ' + fc(i.reel.epargne), 'bloquant');
      if (j.essais.parts && j.essais.parts.total !== undefined)
        verifier(j.essais.parts.total === i.reel.parts, 'I', 'le total des parts exporte egale celui du journal',
          j.essais.parts.total + ' contre ' + i.reel.parts, 'bloquant');
      absent('I', 'un dossier de financement pour une institution financiere', 'a verifier dans l ecran IMF : non mesure par cet audit');
      trait();
    }
  }

  /* ======================= LOT K — STOCKAGE ET RECUPERATION ======================= */
  if (fait('K')) {
    ligne('  LOT K — situation 10 : limites de stockage et recuperation');
    /* Le lot K mesure la saturation du stockage : il doit donc partir d un stockage propre,
       sinon il mesure ce que les lots precedents ont laisse et non le comportement de
       l application. On vide, puis on se donne deux petits groupes. */
    await js("(() => { Object.keys(localStorage).filter(k => k.indexOf('audit-') === 0).forEach(k => localStorage.removeItem(k)); wipeTo(emptyData()); K.data.mode = 'prod'; App.screen = 'login'; App.params = {}; App.hist = []; DB.save(); return 1; })()");
    if (!(await js('K.data.avecs.length'))) await jsj('(' + FABRIQUE + ')(2, 12, ' + JSON.stringify(LIEUX) + ', ' + JSON.stringify(REGLES) + ', 909090)');
    await jsj('(() => { const cycler = ' + CYCLER + '; K.data.avecs.forEach(a => cycler(a.id, 6, { pAbsent: 10, credits: 1 })); return 1; })()');
    const quota = await jsj(`(() => {
      /* combien le navigateur accepte-t-il dans localStorage ? on le mesure, on ne le suppose pas */
      let mo = 0; const bloc = 'x'.repeat(128 * 1024);
      try { for (let i = 0; i < 400; i++) { localStorage.setItem('audit-mesure-' + i, bloc); mo += 128; } } catch (e) { /* plein */ }
      const atteint = mo;
      for (let i = 0; i < 400; i++) localStorage.removeItem('audit-mesure-' + i);
      const deja = (localStorage.getItem('kitabu.avec.v4') || '').length;
      return { libreKo: atteint, dejaKo: Math.round(deja / 1024), totalKo: atteint + Math.round(deja / 1024) };
    })()`);
    passe('K', 'capacite reelle du stockage local de ce navigateur',
      'environ ' + Math.round(quota.totalKo / 1024 * 10) / 10 + ' Mo au total (' + quota.dejaKo + ' Ko deja pris par les donnees)');
    const k = await jsj(`(async () => {
      const avant = (localStorage.getItem('kitabu.avec.v4') || '').length;
      /* on remplit le stockage jusqu au refus, avec une autre cle, pour voir ce que fait DB.save */
      let bourrage = 0;
      const bloc = 'x'.repeat(256 * 1024);
      try { for (let i = 0; i < 200; i++) { localStorage.setItem('audit-bourrage-' + i, bloc); bourrage++; } } catch (e) { /* plein */ }
      window.__dit = ''; const vrai = App.toast; App.toast = function (t) { window.__dit = t; return vrai.apply(this, arguments); };
      const a = K.data.avecs[0];
      const chef = a.members.find(x => x.role === 'president');
      /* une reunion neuve, encore ouverte : ecrire dans une reunion scellee casserait le sceau,
         ce qui est le comportement voulu et n a rien a voir avec le stockage. */
      const m = { id: a.id + '-k' + Date.now(), n: a.meetings.reduce((x, y) => Math.max(x, y.n), 0) + 1,
        cycle: a.cycle.n, date: Date.now(), status: 'open', presence: {}, openedBy: chef.id, stepDone: 0, synced: false };
      activeM(a).forEach(x => m.presence[x.id] = 'P');
      a.meetings.push(m);
      /* et il faut que les donnees GROSSISSENT : remplacer une valeur de meme taille ne demande
         aucune place neuve au navigateur, et la sauvegarde reussirait meme le stockage plein. */
      for (let i = 0; i < 4000; i++)
        appendTx(a, { meetingId: m.id, type: 'EPARGNE', memberId: a.members[i % a.members.length].id, parts: 1, amount: 1000, by: chef.id, note: 'remplissage ' + i });
      const txEnMemoire = a.tx.length;
      const sauve = DB.save();
      const message = window.__dit;
      App.toast = vrai;
      /* la donnee est-elle encore en memoire, et l application le dit-elle ? */
      const relu = localStorage.getItem('kitabu.avec.v4');
      let perdu = null;
      try { const d = JSON.parse(relu); const a2 = d.avecs.find(x => x.id === a.id); perdu = a2 ? a.tx.length - a2.tx.length : 'AVEC absente'; } catch (e) { perdu = 'illisible'; }
      for (let i = 0; i < bourrage; i++) localStorage.removeItem('audit-bourrage-' + i);
      const apresMenage = DB.save();
      return { avant: Math.round(avant / 1024), bourrage: Math.round(bourrage * 256 / 1024) + ' Mo', sauve, message,
        ecartEnStockage: perdu, repriseApresMenage: apresMenage, chaine: verifyChain(a).ok, txEnMemoire };
    })()`);
    passe('K', 'stockage occupe par les donnees avant saturation', k.avant + ' Ko');
    passe('K', 'remplissage force', 'environ ' + k.bourrage + ' ajoutes jusqu au refus');
    if (k.sauve === false && k.message)
      passe('K', 'une sauvegarde impossible est annoncee a l utilisateur', '« ' + k.message + ' »');
    else if (k.sauve === false)
      echoue('K', 'une sauvegarde impossible n est pas annoncee', 'DB.save a rendu false sans message', 'bloquant');
    else
      CONSTATS.push({ lot: 'K', etat: 'note', quoi: 'le stockage n a pas pu etre sature dans ce navigateur', preuve: 'DB.save a reussi ; le comportement en cas de quota depasse n est donc pas mesure ici' });
    verifier(k.repriseApresMenage !== false, 'K', 'la sauvegarde repart apres liberation du stockage', 'DB.save rend ' + k.repriseApresMenage);
    verifier(k.chaine, 'K', 'le journal en memoire reste intact apres un refus de sauvegarde', k.txEnMemoire + ' ecritures en memoire');
    /* le point qui compte : ce qui est en memoire et ce qui est sur le disque peuvent differer */
    if (k.sauve === false && typeof k.ecartEnStockage === 'number' && k.ecartEnStockage > 0)
      passe('K', 'l ecart entre la memoire et le stockage est annonce, non masque',
        k.ecartEnStockage + ' ecritures presentes en memoire mais absentes du stockage, et l application le dit : « ' + k.message + ' »');
    else if (k.sauve === false)
      echoue('K', 'une perte de donnees au stockage n est pas annoncee', 'DB.save a echoue, message : « ' + k.message + ' », ecart mesure : ' + k.ecartEnStockage, 'bloquant');
    trait();
  }

  /* ======================= LOT J — INTELLIGENCE ARTIFICIELLE ======================= */
  if (fait('J')) {
    ligne('  LOT J — situation 9 : intelligence artificielle');
    const j = await jsj(`(() => {
      const src = Object.keys(window).filter(k => /ia|ai|llm|gpt|claude/i.test(k));
      const alertes = typeof health === 'function';
      const a = K.data.avecs[0];
      let exemple = null;
      if (alertes && a) { const h = health(a, stats(a), verifyChain(a)); exemple = { niveau: h.level, nb: h.alerts.length, titres: h.alerts.slice(0, 4).map(x => x.lvl + ' : ' + x.title) }; }
      return { clesSuspectes: src, alertes, exemple };
    })()`);
    absent('J', 'un module d intelligence artificielle', 'aucun n existe dans l application : pas d appel a un modele, pas de cle, pas d ecran');
    if (j.alertes) passe('J', 'a la place, des alertes calculees par des regles explicites',
      j.exemple ? 'niveau ' + j.exemple.niveau + ', ' + j.exemple.nb + ' alertes · ' + (j.exemple.titres.join(' ; ') || 'aucune') : '');
    passe('J', 'aucune decision automatique de credit, d exclusion ou de modification financiere', 'il n y a aucun automate qui deciderait a la place de l assemblee');
    trait();
  }

  /* ======================= LOT L — UNE AVEC EN CRISE ======================= */
  if (fait('L')) {
    ligne('  LOT L — defi ultime : une AVEC de 25 membres en crise');
    const V = onglet(PORT + 1); await V.ouvrir();
    /* le telephone du tresorier : trois reunions hors ligne, puis il est perdu */
    const l0 = await jsj(`(async () => {
      wipeTo(emptyData()); K.data.mode = 'prod'; App.cdraft = null;
      const membres = Array.from({ length: 25 }, (_, i) => ({ id: 'n' + i, name: 'Crise Membre ' + (i + 1), sex: 'F', phone: '—' }));
      const M = membres.map(m => m.id);
      App.cdraft = { from: 'login', step: 5, prep: false, mode: 'new', names: '', members: membres, nextId: 25, editing: null,
        roles: { P: M[0], S: M[1], T: M[2], C1: M[3], C2: M[4], K1: M[0], K2: M[5], K3: M[6] },
        g: { name: 'AVEC en crise', province: 'Sud-Ubangi', territoire: 'Gemena', entite: 'territoire', secteur: '', groupement: '',
             village: 'Mabaya', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: new Date().toISOString().slice(0,10), embleme: Object.assign({}, EMB_DEFAUT) },
        r: { partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200,
             penaltyRate: 10, cycleMonths: 12, cycleStart: new Date(Date.now() - 300 * 86400000).toISOString().slice(0,10) },
        rep: { social: '', credit: '', rows: {} } };
      ACT.cCreate();
      const id = App.cdraft.avecId; App.cdraft = null;
      const a = avecById(id); a.cycle.end = Date.now() + 10 * 86400000;
      const cycler = ${CYCLER};
      cycler(id, 30, { pAbsent: 10, credits: 2 });
      /* la photographie envoyee au president, AVANT les trois dernieres reunions */
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: id, memberId: chef.id };
      await ACT.transferRun({ id });
      App.closeSheet();
      const photo = { fichier: App.lastTransfer.file, code: App.lastTransfer.code, tx: a.tx.length, caisse: stats(a).cash };
      /* le tresorier reprend la main et tient trois reunions de plus, hors ligne */
      a.movedOut = null; DB.save();
      cycler(id, 3, { pAbsent: 10, credits: 0 });
      const st = stats(a);
      const perdu = { tx: a.tx.length, caisse: st.cash, reunions: a.meetings.length, encours: st.outstanding };
      return { id, photo, perdu, nouvellesEcritures: perdu.tx - photo.tx };
    })()`);
    passe('L', 'le telephone du tresorier avant sa perte', l0.perdu.tx + ' ecritures, ' + l0.perdu.reunions + ' reunions, caisse ' + fc(l0.perdu.caisse));
    passe('L', 'la copie que detient le president', l0.photo.tx + ' ecritures, caisse ' + fc(l0.photo.caisse)
      + ' — il manque ' + l0.nouvellesEcritures + ' ecritures, soit trois reunions');

    /* le president ouvre sa copie, plus ancienne */
    const l1 = await V.jsj(`(async () => {
      App.licence = { ok: true, data: { id: 'ESSAI', name: 'Essai', kind: 'org' } };
      const r = await importTransfer(${JSON.stringify(l0.photo.fichier)}, ${JSON.stringify(l0.photo.code)});
      if (r.error) return { erreur: r.error };
      const a = avecById(r.id);
      const chef = a.members.find(x => x.role === 'president');
      K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
      const st = stats(a);
      /* 1. un pret rembourse en partie, puis saisi une deuxieme fois — par le vrai geste */
      const enCours = stats(a).activeLoans[0];
      let doubleDetecte = { absent: true };
      if (enCours) {
        ACT.startMeeting();
        const m = openMeeting(a);
        activeM(a).forEach(x => m.presence[x.id] = 'P');
        m.stepDone = 3; DB.save();
        App.draftKey = null; App.go('a.meet', { step: '4' });
        const champ = document.getElementById('rb-' + enCours.id);
        const moitie = Math.floor(enCours.remaining / 2 / 100) * 100;
        window.__dit = ''; const vr = App.toast; App.toast = function (t) { window.__dit = t; return vr.apply(this, arguments); };
        if (champ) { champ.value = String(moitie); ACT.saveRemb(); }
        const apres1 = stats(a).loanList.find(x => x.id === enCours.id);
        /* on revient a l etape des remboursements et on resaisit le meme montant */
        App.go('a.meet', { step: '4' });
        const champ2 = document.getElementById('rb-' + enCours.id);
        if (champ2) { champ2.value = String(moitie); ACT.saveRemb(); }
        const apres2 = stats(a).loanList.find(x => x.id === enCours.id);
        /* et une saisie franchement superieure au reste du */
        App.go('a.meet', { step: '4' });
        const champ3 = document.getElementById('rb-' + enCours.id);
        window.__dit = '';
        let refusTrop = null;
        if (champ3) { champ3.value = String(apres2.remaining + 50000); const n0 = a.tx.length; ACT.saveRemb(); refusTrop = { refuse: a.tx.length === n0, message: window.__dit }; }
        App.toast = vr;
        const l = stats(a).loanList.find(x => x.id === enCours.id);
        doubleDetecte = { du: l.due, paye: l.paid, reste: l.remaining, tropPaye: l.paid > l.due,
          deuxSaisies: { apres1: apres1 ? apres1.paid : null, apres2: apres2 ? apres2.paid : null, moitie },
          refusTrop, nbRemb: a.tx.filter(t => t.type === 'REMB' && t.ref === enCours.id).length };
        const mo = openMeeting(a);
        if (mo) { Object.assign(mo, { status: 'closed', closedAt: Date.now(), closeExpected: stats(a).cash, closeCount: stats(a).cash,
          validators: keyHolders(a).slice(0, 3).map(h => h.id), sealSeq: a.tx.length, seal: a.tx[a.tx.length - 1].hash }); }
        DB.save();
      }
      /* 2. un membre quitte le groupe avec un credit non solde */
      const st2 = stats(a);
      const endette = activeM(a).find(x => st2.mem[x.id].loans.some(l => l.status !== 'solde'));
      let depart = null;
      if (endette) {
        const d = departCalc(a, stats(a), endette);
        depart = { nom: endette.name, calcul: d };
      }
      /* 3. le comite veut partager */
      App.draftKey = null; App.go('a.shareRun');
      const stp = stats(a);
      App.draft.closeCount = String(stp.cash);
      keyHolders(a).slice(0, 3).forEach(h => { App.draft.locks[h.id] = true; });
      const faute = sharePret(a, stats(a));
      /* 3 bis. LE POINT DECISIF : un journal detectablement altere empeche-t-il le partage ? */
      const cot = a.tx.find(t => t.type === 'EPARGNE');
      const sauveM = cot.amount;
      cot.amount = sauveM + 500000;
      const chAlteree = verifyChain(a);
      App.draftKey = null; App.go('a.shareRun');
      const stA = stats(a);
      App.draft.closeCount = String(stA.cash);
      keyHolders(a).slice(0, 3).forEach(h => { App.draft.locks[h.id] = true; });
      const partageSurJournalAltere = { chaineOk: chAlteree.ok, raison: chAlteree.reason || '',
        faute: sharePret(a, stats(a)) || 'aucune',
        caisseAnnoncee: stA.cash,
        aDistribuer: Math.round(sharePlan(a, stats(a)).paid) };
      cot.amount = sauveM;

      /* 4. l agent partenaire veut un rapport tout de suite */
      let rapport = null;
      try {
        const f = exportSheets([a]);
        rapport = { feuilles: f.length, lignes: f.reduce((s, x) => s + (x.rows || []).length, 0) };
      } catch (e) { rapport = { erreur: String(e.message || e) }; }
      /* 5. que dit l application de l etat du cahier ? */
      const ch = verifyChain(a);
      const h = health(a, stats(a), ch);
      return {
        tx: a.tx.length, caisse: stats(a).cash, chaine: ch.ok, doubleDetecte, depart, faute: faute || 'aucune', rapport, partageSurJournalAltere,
        alertes: h.alerts.map(x => x.lvl + ' : ' + x.title), niveau: h.level,
        enAttente: pending(a), derniereSync: a.lastSync ? 'enregistree' : 'jamais',
        /* la provenance du cahier : c est elle qui doit empecher de le croire complet */
        provenance: a.recuDe ? { reunions: a.recuDe.reunions, ecritures: a.recuDe.ecritures,
          caisse: a.recuDe.caisse, quand: a.recuDe.quand, confirme: a.recuDe.confirme } : null,
        bandeau: (() => { try { return /Cahier reçu d/.test(SCREENS['a.home']()); } catch (e) { return 'erreur'; } })(),
        partageAvantVerif: sharePret(a, stats(a)) || 'aucune',
        apresConfirmation: (() => {
          if (!a.recuDe) return null;
          a.recuDe.confirme = Date.now();
          const f2 = sharePret(a, stats(a)) || 'aucune';
          a.recuDe.confirme = null;
          return f2;
        })(),
      };
    })()`);
    if (l1.erreur) echoue('L', 'le president peut ouvrir sa copie', l1.erreur, 'bloquant');
    else {
      passe('L', 'le president travaille sur sa copie', l1.tx + ' ecritures, caisse ' + fc(l1.caisse));
      verifier(l1.chaine, 'L', 'le cahier du president est coherent avec lui-meme', l1.chaine ? '' : 'altere par l essai lui-meme', 'bloquant');
      /* la double saisie, par le vrai geste de l etape des remboursements */
      const dd2 = l1.doubleDetecte;
      if (dd2.absent) absent('L', 'un pret a rembourser deux fois', 'aucun credit en cours a ce moment du scenario');
      else {
        verifier(!dd2.tropPaye, 'L', 'deux saisies du meme remboursement ne font pas payer plus que du',
          'paye ' + fc(dd2.paye) + ' pour ' + fc(dd2.du) + ' du · ' + dd2.nbRemb + ' ecriture(s) · apres la 1re ' + fc(dd2.deuxSaisies.apres1) + ', apres la 2e ' + fc(dd2.deuxSaisies.apres2), 'majeur');
        if (dd2.refusTrop) verifier(dd2.refusTrop.refuse, 'L', 'une saisie superieure au reste du est refusee', dd2.refusTrop.message, 'bloquant');
      }
      if (l1.depart) passe('L', 'le depart d un membre endette est chiffre', l1.depart.nom + ' : ' + JSON.stringify(l1.depart.calcul));
      else absent('L', 'un membre endette a faire sortir', 'aucun credit en cours a ce moment du scenario');
      /* LE POINT DECISIF */
      const pa = l1.partageSurJournalAltere;
      if (!pa.chaineOk && pa.faute === 'aucune')
        echoue('L', 'le partage est autorise sur un journal detectablement altere',
          'le journal est refuse par la verification (« ' + pa.raison + ' ») et l application le signale a l accueil, mais la cloture du cycle ne le verifie pas : elle accepte de distribuer ' + fc(pa.aDistribuer) + ' sur une caisse annoncee a ' + fc(pa.caisseAnnoncee) + '. C est l operation la plus irreversible de l application.', 'bloquant');
      else passe('L', 'un journal altere empeche le partage', pa.faute + ' (chaine valide : ' + pa.chaineOk + ')');
      if (l1.rapport && l1.rapport.erreur)
        echoue('L', 'une AVEC autonome ne peut pas produire le rapport Excel demande par un partenaire',
          'l export est reserve a une session d organisation ou d animateur : ' + l1.rapport.erreur, 'moyen');
      else passe('L', 'le rapport pour le partenaire se produit immediatement', JSON.stringify(l1.rapport));
      passe('L', 'ce que l application signale au comite', 'niveau ' + l1.niveau + ' · ' + (l1.alertes.join(' ; ') || 'aucune alerte'));
      /* LE POINT CRUCIAL : un cahier recu se presente-t-il encore comme complet ? */
      const pv = l1.provenance;
      verifier(!!pv, 'L', 'le cahier garde la trace de sa provenance',
        pv ? 'copie le ' + new Date(pv.quand).toLocaleDateString('fr-FR') + ' a la reunion n°' + pv.reunions
          + ', ' + pv.ecritures + ' ecritures, caisse ' + fc(pv.caisse) : 'aucune provenance enregistree', 'bloquant');
      verifier(l1.bandeau === true, 'L', 'l accueil du groupe dit que le cahier vient d un autre telephone',
        'bandeau affiche : ' + l1.bandeau, 'bloquant');
      verifier(/autre t|plus r/i.test(l1.partageAvantVerif), 'L',
        'le partage est refuse tant que personne n a verifie que ce cahier est le dernier',
        l1.partageAvantVerif, 'bloquant');
      verifier(l1.apresConfirmation === 'aucune' || !/autre t/i.test(l1.apresConfirmation || ''), 'L',
        'apres confirmation du bureau, le partage redevient possible', String(l1.apresConfirmation));
      passe('L', 'ce que le comite peut constater lui-meme', 'la copie s arretait a la reunion n°' + (pv ? pv.reunions : '?')
        + ' ; il suffit de demander au porteur precedent ou il en etait pour voir l ecart');
    }
    await V.fermer();
    trait();
  }

  /* ======================= CE QUI N A PAS ETE TESTE, ET POURQUOI ======================= */
  if (LOTS.length > 6) {
    ligne('  NON EXECUTE — a ne pas confondre avec un essai reussi');
    const nonFait = [
      ['un cycle de 52 semaines sur les 100 AVEC', 'duree : environ 25 minutes pour 5 AVEC par les vrais gestes. Mesure ici : 20 AVEC sur 20 semaines et 50 AVEC sur 44 semaines, reunions ecrites par appendTx.'],
      ['les 2 500 membres passes par les huit etapes de reunion a l ecran', 'tests/cycle-complet.js le fait pour 5 AVEC et 265 reunions ; cet audit-ci ecrit les reunions dans le journal sans passer par les ecrans.'],
      ['1 000 utilisateurs connectes, les API et les permissions cote serveur', 'Akiba n a ni serveur ni API ni base de donnees : tout vit dans le telephone. Il n y a donc rien a eprouver de ce cote, et c est aussi ce qui limite la synchronisation.'],
      ['la lecture audio en francais et en langues locales', 'la voix est couverte par tests/suite.js (debit, silences, qualite de voix) mais sa prononciation reelle en lingala, kiswahili, kikongo et tshiluba ne peut pas etre jugee par une machine.'],
      ['le carnet du membre confronte au registre pendant une correction', 'non mesure : demande deux sessions simultanees sur le meme telephone, ce que l application ne permet pas.'],
      ['le dossier de financement pour une institution financiere', 'l ecran IMF existe ; son contenu n a pas ete confronte au journal dans cet audit.'],
      ['telephones Android peu performants, batterie, consommation de donnees', 'non mesurable depuis un navigateur sans fenetre sur un ordinateur.'],
      ['un pret a rembourser deux fois et un membre endette a faire sortir, dans le scenario de crise', 'le scenario a fini avec tous les credits soldes ; ces deux cas sont couverts separement par les lots E et F.'],
    ];
    nonFait.forEach(([quoi, pourquoi]) => { CONSTATS.push({ lot: 'N', etat: 'nonfait', quoi, preuve: pourquoi }); ligne('  · ' + quoi + String.fromCharCode(10) + '      ' + pourquoi); });
    trait();
  }

  /* ======================= RECAPITULATIF ======================= */
  const par = e => CONSTATS.filter(c => c.etat === e);
  const bloquants = par('echoue').filter(c => c.gravite === 'bloquant');
  const majeurs = par('echoue').filter(c => c.gravite === 'majeur');
  const moyens = par('echoue').filter(c => c.gravite === 'moyen');
  ligne('  RECAPITULATIF');
  ligne('   · verifications passees : ' + par('passe').length);
  ligne('   · defauts : ' + par('echoue').length + ' (' + bloquants.length + ' bloquants, ' + majeurs.length + ' majeurs, ' + moyens.length + ' moyens)');
  ligne('   · fonctions absentes ou non applicables : ' + par('absent').length);
  ligne('   · essais non executes : ' + par('nonfait').length);
  ligne('   · notes : ' + par('note').length);
  if (par('echoue').length) {
    ligne();
    ligne('  DEFAUTS, DU PLUS GRAVE AU MOINS GRAVE');
    ['bloquant', 'majeur', 'moyen'].forEach(g => par('echoue').filter(c => (c.gravite || 'majeur') === g)
      .forEach((c, i) => { ligne('   [' + g.toUpperCase() + '] lot ' + c.lot + ' — ' + c.quoi); ligne('      ' + c.preuve); }));
  }
  trait();
  try { fs.writeFileSync(require('path').join(__dirname, '..', 'tests', 'audit-constats.json'), JSON.stringify(CONSTATS, null, 2)); ligne('  constats enregistres dans tests/audit-constats.json'); } catch (e) { /* rien */ }
  ligne('  duree : ' + Math.round((Date.now() - t0) / 1000) + ' s');
  await T.fermer(); refermer(); process.exit(0);
})().catch(e => { ligne('  ECHEC DU LANCEUR : ' + (e && e.message ? e.message : e)); refermer(); process.exit(2); });
