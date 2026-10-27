/* ===========================================================================
   Akiba — un cycle entier, de la création au partage, pour cinq AVEC.

   Ce que cet essai fait, et pourquoi : la suite d'essais vérifie des gestes
   isolés. Personne n'avait encore fait vivre une AVEC d'un bout à l'autre —
   création, 52 réunions hebdomadaires, crédits remboursés sur plusieurs mois,
   pénalités de retard, absences justifiées ou non, puis le partage qui rend
   l'argent et ferme le cycle. C'est dans la durée que les erreurs d'arrondi,
   de report et de double comptage se voient : une erreur de 50 FC par réunion
   ne se remarque pas la première semaine, mais fait 2 600 FC au partage.

   L'essai passe par les vrais gestes de l'application — ACT.cNext, ACT.saveOpen,
   ACT.saveParts, ACT.lockPin avec les codes secrets, ACT.runShare — et non par
   des écritures fabriquées à la main. Le temps avance en remplaçant Date.now().

   Un onglet par AVEC, c'est-à-dire un téléphone par groupe, comme sur le terrain :
   tenir les cinq cahiers dans une seule page réenregistrait les cinq AVEC à chaque
   geste, ce qui n'arrive jamais dans un village — et rendait l'essai interminable.

   Usage :  node tests/cycle-complet.js
   =========================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const SRC = path.join(__dirname, '..');
const PORT = 5231, DEBUG = 9361;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
/* Un port par groupe, donc une origine par groupe. Sans cela les cinq onglets partagent le même
   localStorage : ce ne serait pas cinq téléphones mais un seul, et chaque groupe effacerait le
   cahier des autres en commençant le sien. */
const servir = port => http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(SRC, 'docs', u), (e, b) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(b);
  });
}).listen(port);

const dors = ms => new Promise(r => setTimeout(r, ms));
const profil = path.join(require('os').tmpdir(), 'akiba-cycle-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio',
  '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore' });

function onglet(port) {
  let ws, n = 0; const attente = {};
  const envoyer = (method, params) => new Promise((ok, ko) => { const i = ++n; attente[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method, params })); });
  const js = async expression => {
    const r = await envoyer('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
    return r.result.value;
  };
  return {
    ouvrir: async () => {
      const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?' + encodeURIComponent('http://127.0.0.1:' + port + '/'), { method: 'PUT' })).json();
      ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
      await new Promise(r => ws.onopen = r);
      ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && attente[d.id]) { d.error ? attente[d.id].ko(new Error(d.error.message)) : attente[d.id].ok(d.result); delete attente[d.id]; } };
      await envoyer('Runtime.enable', {});
      /* Cinq pages s'ouvrent en même temps : attendre une durée fixe ne suffit pas. Tant que le
         démarrage n'a pas fini de résoudre la licence, il redessine l'écran — et effacerait
         l'écran de création qu'on vient d'ouvrir, avec ce qui y a été tapé. */
      for (let i = 0; i < 300; i++) {
        if (await js("(typeof App === 'object' && typeof ACT === 'object' && typeof K === 'object' && !!K.data && !!App.licence && !!document.querySelector('.shell'))")) break;
        await dors(200);
      }
      await dors(400);
    },
    js,
    /* attendre qu'un écran soit réellement là avant d'y taper quoi que ce soit */
    attendre: async (expr, quoi) => {
      for (let i = 0; i < 150; i++) {
        if (await js('!!(' + expr + ')')) return true;
        await dors(200);
      }
      throw new Error('écran jamais prêt : ' + (quoi || expr));
    },
    /* Promise.resolve d'abord : sans lui, une réunion qui rend une promesse se sérialise en « {} »
       et tous les essais de la réunion échouent sans dire pourquoi. */
    jsj: async expr => JSON.parse(await js('Promise.resolve(' + expr + ').then(v => JSON.stringify(v))')),
  };
}

/* --- affichage en direct : une ligne qui s'efface et se réécrit, et des lignes qui restent --- */
const large = process.stdout.isTTY && process.stdout.columns ? process.stdout.columns - 1 : 110;
const vivant = t => { if (process.stdout.isTTY) process.stdout.write('\r' + t.slice(0, large).padEnd(large) + '\r'); };
const ligne = t => { if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat(large) + '\r'); console.log(t); };
const fc = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC';

let bons = 0, mauvais = 0;
const verifier = (cond, quoi, detail) => {
  if (cond) { bons++; return true; }
  mauvais++; ligne('  ✗ ' + quoi + (detail ? '  — ' + detail : ''));
  return false;
};

/* ---------------------------------------------------------------------------
   Les cinq groupes. Volontairement différents : un petit groupe de huit et un
   grand de trente ne se cassent pas aux mêmes endroits, et des règles variées
   font jouer les arrondis, les plafonds de crédit et les pénalités.
   --------------------------------------------------------------------------- */
const PRENOMS_F = ['Kavira', 'Masika', 'Kahindo', 'Furaha', 'Neema', 'Sifa', 'Zawadi', 'Rehema', 'Amani', 'Tulinabo', 'Jeanne', 'Esperance', 'Marceline', 'Chantal', 'Solange', 'Bibiche', 'Pascaline', 'Adolphine', 'Nsimire', 'Mwavita', 'Jolie', 'Fatuma', 'Generose', 'Bernadette', 'Henriette', 'Immaculee', 'Jacqueline', 'Josephine', 'Mapendo', 'Riziki', 'Sakina', 'Vumilia'];
const PRENOMS_M = ['Mumbere', 'Paluku', 'Kambale', 'Baraka', 'Juma', 'Mugisho', 'Bahati', 'Innocent', 'Fiston', 'Patient', 'Serge', 'Modeste'];
const NOMS = ['Siviri', 'Mbusa', 'Katembo', 'Muhindo', 'Kasereka', 'Sivyavugha', 'Wasukundi', 'Mastaki', 'Bisimwa', 'Lubunga', 'Mwenge', 'Byamungu', 'Ntakobajira', 'Kalunga', 'Ngoy', 'Ilunga', 'Tshibangu', 'Mukendi', 'Kabeya', 'Mwamba'];

/* Les règles ne prennent que les valeurs que l'assemblée peut réellement voter dans
   l'application : écrire 1 500 FC dans un choix qui ne propose pas 1 500 remettrait la
   règle à zéro sans rien dire. Tous les cycles font 12 mois, soit 360 jours : le partage
   tombe donc juste après la 51e semaine. */
const GROUPES = [
  { nom: 'Tuungane Kirumba', village: 'Kirumba', prov: 'Nord-Kivu', terr: 'T:Lubero', n: 8,
    r: { partValue: 200, maxParts: 3, socialFee: 200, rate: 2, maxMult: 2, maxMonths: 1, fineAbsent: 200, fineLate: 100, penaltyRate: 0, cycleMonths: 12 } },
  { nom: 'Bomoko Gemena', village: 'Mabaya', prov: 'Sud-Ubangi', terr: 'V:Gemena', n: 12,
    r: { partValue: 500, maxParts: 5, socialFee: 300, rate: 5, maxMult: 3, maxMonths: 2, fineAbsent: 500, fineLate: 200, penaltyRate: 2, cycleMonths: 12 } },
  { nom: 'Mapendo Bukavu', village: 'Nyalukemba', prov: 'Sud-Kivu', terr: 'V:Bukavu', n: 18,
    r: { partValue: 1000, maxParts: 3, socialFee: 500, rate: 10, maxMult: 2, maxMonths: 3, fineAbsent: 1000, fineLate: 500, penaltyRate: 5, cycleMonths: 12 } },
  { nom: 'Umoja Kananga', village: 'Katoka', prov: 'Kasaï-Central', terr: 'V:Kananga', n: 25,
    r: { partValue: 2000, maxParts: 5, socialFee: 1000, rate: 10, maxMult: 3, maxMonths: 6, fineAbsent: 500, fineLate: 200, penaltyRate: 10, cycleMonths: 12 } },
  { nom: 'Twende Kolwezi', village: 'Dilala', prov: 'Lualaba', terr: 'V:Kolwezi', n: 30,
    r: { partValue: 5000, maxParts: 10, socialFee: 500, rate: 5, maxMult: 4, maxMonths: 3, fineAbsent: 1000, fineLate: 500, penaltyRate: 10, cycleMonths: 12 } },
];
const PLANS = [
  { pAbsent: 8, pRetard: 12, credits: 1 },
  { pAbsent: 10, pRetard: 15, credits: 2 },
  { pAbsent: 12, pRetard: 12, credits: 2 },
  { pAbsent: 14, pRetard: 18, credits: 3 },
  { pAbsent: 10, pRetard: 20, credits: 3 },
];

/* un hasard reproductible : le même essai doit donner le même résultat deux fois de suite.
   Les listes de membres sont tirées avant d'ouvrir les onglets, car les cinq groupes
   avancent ensuite en parallèle et l'ordre des tirages ne serait plus le même. */
let graine = 20261027;
const alea = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const entre = (a, b) => a + Math.floor(alea() * (b - a + 1));
function listeMembres(n) {
  const vus = new Set(), out = [];
  while (out.length < n) {
    const homme = out.length > 0 && alea() < 0.2;                  // la présidente est une femme dans la plupart des AVEC
    const p = homme ? PRENOMS_M[entre(0, PRENOMS_M.length - 1)] : PRENOMS_F[entre(0, PRENOMS_F.length - 1)];
    const nom = p + ' ' + NOMS[entre(0, NOMS.length - 1)];
    if (vus.has(nom)) continue;
    vus.add(nom);
    out.push(nom + (homme ? ', h' : ', f') + (alea() < 0.4 ? ', 099' + entre(1000000, 9999999) : ''));
  }
  return out;
}
const MEMBRES = GROUPES.map(g => listeMembres(g.n - 1));           // un de plus sera ajouté par la fiche détaillée

const SEMAINE = 7 * 24 * 3600 * 1000;
const depart = new Date('2026-01-10T09:00:00').getTime();          // un samedi

/* Une réunion complète, par les vrais gestes. Renvoie ce qu'il faut pour vérifier. */
const REUNION = `async (avecId, sem, plan) => {
  K.session = null;
  const a0 = avecById(avecId);
  const chef = a0.members.find(x => x.role === 'president' && !x.left);
  K.session = { kind: 'avec', avecId, memberId: chef.id };

  /* ce que l'application dit à l'écran : si un geste est refusé, on veut lire pourquoi */
  let dit = '';
  if (!App.__toastVrai) { App.__toastVrai = App.toast; App.toast = function (t) { dit = t; window.__dernierDit = t; return App.__toastVrai.apply(this, arguments); }; }
  const lire = () => window.__dernierDit || '';

  const pin = async (membre, lancer) => {                         /* le vrai clavier à code, chiffre par chiffre */
    lancer();
    String(membre.pin).split('').forEach(k => ACT.pinKey({ k }));
    await new Promise(r => setTimeout(r, 0));
  };

  ACT.startMeeting();
  const a = avecById(avecId);
  const m = openMeeting(a);
  if (!m) return { erreur: 'la réunion ne s’ouvre pas' };

  /* --- étape 1 : les présences, avec retards, absences, et absences justifiées --- */
  const actifs = activeM(a);
  const retard = [], absent = [], justifie = [];
  /* à la dernière réunion avant le partage, tout le monde vient : c'est là que l'assemblée
     fait rentrer les derniers crédits et solder les amendes dues */
  actifs.forEach((x, i) => {
    const d = plan.derniere ? 100 : (i * 7 + sem * 3) % 100;
    if (d < plan.pAbsent) { m.presence[x.id] = 'A'; absent.push(x); }
    else if (d < plan.pAbsent + plan.pRetard) { m.presence[x.id] = 'R'; retard.push(x); }
    else m.presence[x.id] = 'P';
  });
  /* On passe par le vrai geste — toucher « Là / Retard / Absent » — pour les membres dont la
     présence a une conséquence. Chaque touche redessine l'écran : les trente faire une par une
     coûterait trente redessins par réunion sans rien vérifier de plus. */
  App.go('a.meet', { step: '0' });
  retard.concat(absent).forEach(x => ACT.pres({ id: x.id, v: m.presence[x.id] }));
  /* une absence sur trois est justifiée devant l'assemblée : pas d'amende, mais une écriture */
  absent.forEach((x, i) => { if (i % 3 === 0) { excuseEcrire(a, m, x, MOTIFS[(sem + i) % MOTIFS.length], chef); justifie.push(x); } });
  ACT.stepDone({ i: 0 });

  /* --- étape 2 : le comptage d'ouverture --- */
  let st = stats(a);
  const attenduOuv = st.cash;
  App.draftKey = null;
  App.go('a.meet', { step: '1' });
  App.draft.openCount = String(attenduOuv);
  ACT.saveOpen();
  const ouvOk = openMeeting(a).openCount === attenduOuv && openMeeting(a).stepDone >= 1;

  /* --- étape 3 : la caisse sociale --- */
  App.go('a.meet', { step: '2' });
  const presents = presentMembers(a, m);
  presents.forEach((x, i) => { App.draft.paid[x.id] = (i + sem) % 10 !== 0; });   /* un présent sur dix ne paie pas */
  const sociaux = presents.filter(x => App.draft.paid[x.id]).length;
  ACT.saveSocial();

  /* --- étape 4 : l'épargne --- */
  App.go('a.meet', { step: '3' });
  let partsTotal = 0;
  presentMembers(a, m).forEach((x, i) => {
    const p = Math.max(1, Math.min(a.settings.maxParts, 1 + ((i + sem) % a.settings.maxParts)));
    App.draft.parts[x.id] = p; partsTotal += p;
  });
  /* le règlement interdit d'acheter plus de parts que le maximum : on essaie quand même */
  const trop = (() => { const x = presentMembers(a, m)[0]; const avant = App.draft.parts[x.id];
    for (let k = 0; k < a.settings.maxParts + 3; k++) ACT.parts({ id: x.id, d: 1 });
    const plafonne = App.draft.parts[x.id] === a.settings.maxParts;
    partsTotal += App.draft.parts[x.id] - avant;
    return plafonne; })();
  ACT.saveParts();

  /* --- étape 5 : les remboursements --- */
  App.go('a.meet', { step: '4' });
  st = stats(a);
  let rembourse = 0;
  /* L'application pré-remplit l'échéance du jour pour chaque crédit : c'est ce que le secrétaire
     voit et accepte en réunion. On garde donc ce qu'elle propose — sauf qu'un emprunteur sur
     cinq n'apporte rien cette semaine, ce qui crée du retard, puis des pénalités.
     À la dernière réunion, l'assemblée fait tout rentrer : un crédit ne traverse pas le partage. */
  document.querySelectorAll('[id^="rb-"]').forEach(champ => {
    const l = st.activeLoans.find(x => 'rb-' + x.id === champ.id);
    if (!l) return;
    let v = parseAmt(champ.value);
    if (plan.derniere) v = l.remaining;
    else if ((l.memberId.charCodeAt(l.memberId.length - 1) + sem) % 5 === 0) v = 0;
    champ.value = String(v); rembourse += v;
  });
  ACT.saveRemb();

  /* --- étape 6 : les crédits --- */
  App.go('a.meet', { step: '5' });
  st = stats(a);
  let credits = 0, refuses = 0;
  if (sem >= 4 && sem <= 44) {
    const candidats = presentMembers(a, m).filter(x => !st.mem[x.id].loans.some(l => l.status !== 'solde'));
    const combien = Math.min(plan.credits, candidats.length);
    for (let k = 0; k < combien; k++) {
      const x = candidats[(sem * 3 + k * 5) % candidats.length];
      if (!x) continue;
      const lim = loanLimit(a, stats(a), x.id);
      if (!lim.max) continue;
      const mois = Math.min(a.settings.maxMonths, 2 + (k % 2));
      if (Date.now() + mois * 28 * 24 * 3600 * 1000 > a.cycle.end) continue;
      const montant = Math.floor(lim.max * 0.8 / 500) * 500;
      if (montant < 1000) continue;
      ACT.creditSheet({});
      document.getElementById('crM').value = x.id;
      document.getElementById('crA').value = String(montant);
      document.getElementById('crD').value = String(mois);
      document.getElementById('crP').value = 'petit commerce';
      /* un crédit demande la validation d'un deuxième membre du bureau, qui tape son code */
      const ap = bureauOf(a).find(y => y.id !== x.id);
      document.getElementById('crAp').value = ap.id;
      document.getElementById('crPin').value = ap.pin;
      const avant = a.tx.length;
      ACT.saveCredit();
      if (a.tx.length > avant) credits++;
      App.closeSheet();
    }
    /* et une demande au-dessus du plafond doit être refusée, avec la raison dite */
    const x = presentMembers(a, m)[0];
    const lim = loanLimit(a, stats(a), x.id);
    ACT.creditSheet({});
    document.getElementById('crM').value = x.id;
    document.getElementById('crA').value = String((lim.max || 1000) * 10 + 5000);
    document.getElementById('crD').value = '1';
    document.getElementById('crP').value = 'essai au-dessus du plafond';
    const ap2 = bureauOf(a).find(y => y.id !== x.id);
    document.getElementById('crAp').value = ap2.id;
    document.getElementById('crPin').value = ap2.pin;
    const avant2 = a.tx.length;
    ACT.saveCredit();
    refuses = a.tx.length === avant2 ? 1 : 0;
    App.closeSheet();
  }
  ACT.stepDone({ i: 5 });

  /* --- étape 7 : les amendes — les justifiés ne doivent pas y être --- */
  App.go('a.meet', { step: '6' });
  const proposes = Object.keys(App.draft.on || {}).filter(k => App.draft.on[k]);
  const justifiesProposes = justifie.filter(x => proposes.includes(x.id)).length;
  st = stats(a);
  presentMembers(a, m).forEach(x => { if (st.mem[x.id].fineDebt > 0) App.draft.pay[x.id] = true; });
  /* à la dernière réunion, aucune amende nouvelle : on solde ce qui est dû, on n'en crée pas */
  if (plan.derniere) App.draft.on = {};
  Object.keys(App.draft.pen || {}).forEach(k => App.draft.pen[k] = true);     /* l'assemblée accepte les pénalités proposées */
  const amendesAvant = a.tx.length;
  ACT.saveFines();
  const amendes = a.tx.length - amendesAvant;

  /* --- étape 8 : la clôture, le comptage et les trois clés --- */
  App.go('a.meet', { step: '7' });
  st = stats(a);
  const attenduFerm = st.cash;
  App.draft.closeCount = String(attenduFerm);
  const porteurs = keyHolders(a).slice(0, 3);
  let remplacements = 0;
  for (const h of porteurs) {
    if ((m.presence || {})[h.id] === 'A') {                        /* un porte-clé absent : l'assemblée désigne un remplaçant */
      const tres = a.members.find(x => x.role === 'tresorier');
      const trois = porteurs.map(x => x.id);
      const sub = activeM(a).find(x => (m.presence || {})[x.id] && (m.presence || {})[x.id] !== 'A'
        && !trois.includes(x.id) && !(tres && x.id === tres.id) && !Object.values(App.draft.subs || {}).includes(x.id));
      if (sub) { await pin(sub, () => ACT.lockSub({ id: h.id, sub: sub.id })); remplacements++; }
    } else await pin(h, () => ACT.lockPin({ id: h.id }));
  }
  const pret = closeReady(a);
  const cles = Object.keys(App.draft.locks || {}).length;
  window.__dernierDit = '';
  let boum = '';
  try { ACT.saveClose(); } catch (e) { boum = String(e && e.message || e); }
  const ferme = !openMeeting(a);
  const mf = a.meetings[a.meetings.length - 1];
  const apres = stats(a);
  return {
    ouvOk, trop, sociaux, partsTotal, rembourse, credits, refuses, amendes, remplacements,
    presents: presents.length, retards: retard.length, absents: absent.length, justifies: justifie.length,
    justifiesProposes, pret, ferme, scelle: mf.status === 'closed' && !!mf.seal,
    ecart: mf.closeCount - mf.closeExpected, cles: (mf.validators || []).length, clesDraft: cles, dit: lire(), boum,
    caisse: apres.cash, encours: apres.outstanding, chaine: verifyChain(a).ok, tx: a.tx.length
  };
}`;

/* ---------------------------------------------------------------------------
   Un groupe, du premier écran de création au deuxième cycle — sur son téléphone.
   --------------------------------------------------------------------------- */
const etat = GROUPES.map(() => 'attente');

async function unGroupe(gi) {
  const g = GROUPES[gi], plan = PLANS[gi], r = g.r, nom = g.nom;
  const T = onglet(PORT + gi); await T.ouvrir();   /* son propre port, donc son propre téléphone */
  const js = T.js, jsj = T.jsj;
  const horloge = t => js('window.__t = ' + t + ', 1');

  /* le temps, et un cahier vide : on part d'un téléphone neuf, pas de la démonstration */
  await js(`(async () => {
    window.__t = ${depart};
    Date.now = () => window.__t;                                   /* le temps avance quand l'essai le dit */
    /* Le gardien de licence a ses propres essais ; ici il ne doit pas redessiner l'écran au
       milieu d'une saisie. On le met donc hors jeu une fois pour de bon, au lieu de forcer
       App.licence — que la vérification de la liste de blocage recalculerait plus tard. */
    delete window.KITABU_PWA;
    App.licence = await resolveLicence();
    wipeTo(emptyData());
    K.data.mode = 'prod';
    DB.save();
    render();
    return !!App.licence.ok;
  })()`);

  /* ===== 1. LA CRÉATION — les cinq étapes de l'assistant ===== */
  etat[gi] = 'création';
  await js(`(() => { App.cdraft = null; App.go('c.avec', { from: 'login' }); ACT.cPrepOk(); return App.cdraft.step; })()`);
  await T.attendre("document.getElementById('cgN')", 'premier écran de création');

  const e1 = await jsj(`(() => {
    /* le signe d'abord : le choisir redessine l'écran, et effacerait ce qui vient d'être tapé */
    ACT.cEmbleme({ signe: ${JSON.stringify(['epi', 'arbre', 'poisson', 'houe', 'colline'][gi])}, teinte: ${JSON.stringify(['terre', 'vert', 'ciel', 'jaune', 'grenat'][gi])} });
    document.getElementById('cgN').value = ${JSON.stringify(nom)};
    const p = document.getElementById('cgProv'); p.value = ${JSON.stringify(g.prov)}; INP.geoProv(p);
    document.getElementById('cgTerr').value = ${JSON.stringify(g.terr)};
    document.getElementById('cgV').value = ${JSON.stringify(g.village)};
    document.getElementById('cgJ').value = 'Samedi';
    document.getElementById('cgQ').value = '7';
    ACT.cNext();
    return { etape: App.cdraft.step, nom: App.cdraft.g.name, village: App.cdraft.g.village, prov: App.cdraft.g.province };
  })()`);
  verifier(e1.etape === 2 && e1.nom === nom && e1.village === g.village, 'création ' + nom + ' : étape 1 (groupe et lieu)', JSON.stringify(e1));

  const retour = await jsj(`(() => { ACT.cPrev(); const ok0 = App.cdraft.step === 1; ACT.cNext();
    return { ok0, ok1: App.cdraft.step === 2, nom: App.cdraft.g.name }; })()`);
  verifier(retour.ok0 && retour.ok1 && retour.nom === nom, 'création ' + nom + ' : on revient en arrière sans rien perdre', JSON.stringify(retour));

  const e2 = await jsj(`(() => {
    const v = (id, x) => document.getElementById(id).value = String(x);
    v('crP', ${r.partValue}); v('crX', ${r.maxParts}); v('crS', ${r.socialFee}); v('crC', ${r.cycleMonths});
    v('crR', ${r.rate}); v('crM', ${r.maxMult}); v('crD', ${r.maxMonths});
    v('crF', ${r.fineAbsent}); v('crL', ${r.fineLate}); v('crPn', ${r.penaltyRate});
    v('crB', '${new Date(depart).toISOString().slice(0, 10)}');
    ACT.cNext();
    return { etape: App.cdraft.step, r: App.cdraft.r };
  })()`);
  verifier(e2.etape === 3, 'création ' + nom + ' : étape 2 (règlement)');
  /* une règle votée doit être exactement celle qui a été choisie : un choix absent de la liste
     la remettrait silencieusement à zéro, et le groupe tournerait toute l'année avec 0 FC la part */
  verifier(Object.keys(r).every(k => e2.r[k] === r[k]), 'création ' + nom + ' : chaque règle votée est bien enregistrée',
    Object.keys(r).filter(k => e2.r[k] !== r[k]).map(k => k + ' : ' + e2.r[k] + ' au lieu de ' + r[k]).join(', '));

  const e3 = await jsj(`(() => {
    document.getElementById('cmL').value = ${JSON.stringify(MEMBRES[gi].join('\n'))};
    ACT.cImport();
    const apresListe = App.cdraft.members.length;
    /* une fiche complète : nom, sexe, date de naissance, téléphone */
    document.getElementById('mfName').value = 'Mwavita Kahambu';
    const sx = document.querySelector('input[name="mfSex"][value="F"]'); if (sx) sx.checked = true;
    const nai = document.getElementById('mfNai'); if (nai) nai.value = '1984-06-21';
    const tel = document.getElementById('mfTel'); if (tel) tel.value = '0991234567';
    ACT.cAddMember();
    const n0 = App.cdraft.members.length;
    document.getElementById('mfName').value = 'Ab';
    ACT.cAddMember();
    const trop = App.cdraft.members.length === n0;
    document.getElementById('mfName').value = '';
    ACT.cNext();
    const fiche = App.cdraft.members.find(m => m.name === 'Mwavita Kahambu') || {};
    return { etape: App.cdraft.step, apresListe, total: App.cdraft.members.length, trop, ne: fiche.birthDate, tel: fiche.phone };
  })()`);
  verifier(e3.apresListe === g.n - 1, 'création ' + nom + ' : la liste collée ajoute ' + (g.n - 1) + ' membres', String(e3.apresListe));
  verifier(e3.total === g.n, 'création ' + nom + ' : ' + g.n + ' membres inscrits', String(e3.total));
  verifier(e3.trop, 'création ' + nom + ' : un nom trop court est refusé');
  verifier(e3.ne === '1984-06-21', 'création ' + nom + ' : la date de naissance est gardée', String(e3.ne));
  verifier(e3.etape === 4, 'création ' + nom + ' : étape 3 (membres)');

  const e4 = await jsj(`(() => {
    const M = App.cdraft.members.map(m => m.id);
    const v = (id, x) => document.getElementById(id).value = x;
    /* d'abord une faute : le trésorier ne peut pas garder une clé */
    v('cbP', M[0]); v('cbS', M[1]); v('cbT', M[2]); v('cbC1', M[3]); v('cbC2', M[4]);
    v('cbK1', M[2]); v('cbK2', M[5]); v('cbK3', M[6]);
    ACT.cNext();
    const refuseTresorier = App.cdraft.step === 4;
    /* puis une autre : deux fois la même clé */
    v('cbK1', M[5]); v('cbK2', M[5]); v('cbK3', M[6]);
    ACT.cNext();
    const refuseDouble = App.cdraft.step === 4;
    /* et le président ne peut pas être aussi secrétaire */
    v('cbK1', M[0]); v('cbK2', M[5]); v('cbK3', M[6]);
    v('cbS', M[0]);
    ACT.cNext();
    const refuseBureau = App.cdraft.step === 4;
    /* enfin le bon bureau */
    v('cbS', M[1]);
    ACT.cNext();
    return { etape: App.cdraft.step, refuseTresorier, refuseDouble, refuseBureau };
  })()`);
  verifier(e4.refuseTresorier, 'création ' + nom + ' : le trésorier ne peut pas garder une clé');
  verifier(e4.refuseDouble, 'création ' + nom + ' : deux clés à la même personne sont refusées');
  verifier(e4.refuseBureau, 'création ' + nom + ' : le bureau doit être trois personnes différentes');
  verifier(e4.etape === 5, 'création ' + nom + ' : étape 4 (bureau et clés)');

  const faite = await jsj(`(() => {
    ACT.cMode({ v: 'new' });
    ACT.cCreate();
    const d = App.cdraft;
    const a = avecById(d.avecId);
    const codes = d.codes ? d.codes.length : 0, secours = (a.rescue || []).length;
    ACT.cDone({ to: 'a.home' });
    return { id: a.id, membres: a.members.length, codes, secours, cycle: a.cycle.n, chaine: verifyChain(a).ok,
      cles: a.members.filter(m => m.key).length, pins: new Set(a.members.map(m => m.pin)).size,
      caisse: stats(a).cash, fin: a.cycle.end, regles: a.settings };
  })()`);
  verifier(faite.membres === g.n && faite.cycle === 1, 'création ' + nom + ' : AVEC créée au cycle 1');
  verifier(faite.cles === 3, 'création ' + nom + ' : trois porte-clés', String(faite.cles));
  verifier(faite.secours === 6, 'création ' + nom + ' : carte de secours de 6 codes', String(faite.secours));
  verifier(faite.codes === g.n, 'création ' + nom + ' : un code secret par membre', String(faite.codes));
  verifier(faite.caisse === 0, 'création ' + nom + ' : la caisse d’un nouveau groupe part à zéro', fc(faite.caisse));
  verifier(faite.chaine, 'création ' + nom + ' : journal scellé dès la création');
  ligne('  ✓ ' + nom.padEnd(20) + ' créée · ' + String(g.n).padStart(2) + ' membres · part ' + fc(r.partValue)
    + ' · intérêt ' + r.rate + ' %/mois · crédit max ' + r.maxMult + '× · fin de cycle ' + new Date(faite.fin).toLocaleDateString('fr-FR'));

  /* ===== 2. LES 52 RÉUNIONS ===== */
  const id = faite.id;
  const b = { reunions: 0, parts: 0, credits: 0, refuses: 0, amendes: 0, absents: 0, retards: 0, justifies: 0, remb: 0, ecarts: 0, remplacements: 0 };
  const jalons = [];
  for (let sem = 1; sem <= 52; sem++) {
    etat[gi] = 's' + sem;
    await horloge(depart + sem * SEMAINE);
    const consignes = Object.assign({}, plan, { derniere: sem === 52 });
    const x = await jsj(`(${REUNION})(${JSON.stringify(id)}, ${sem}, ${JSON.stringify(consignes)})`);
    if (x.erreur) { verifier(false, 'semaine ' + sem + ' · ' + nom, x.erreur); continue; }
    b.reunions++; b.parts += x.partsTotal; b.credits += x.credits; b.refuses += x.refuses;
    b.amendes += x.amendes; b.absents += x.absents; b.retards += x.retards; b.justifies += x.justifies;
    b.remb += x.rembourse; b.remplacements += x.remplacements; if (x.ecart !== 0) b.ecarts++;

    /* ce qui doit être vrai à chaque réunion, sans exception */
    const q = 's' + String(sem).padStart(2) + ' ' + nom + ' : ';
    verifier(x.ouvOk, q + 'comptage d’ouverture enregistré');
    verifier(x.trop, q + 'le maximum de parts est respecté');
    verifier(x.justifiesProposes === 0, q + 'aucune amende proposée à un absent justifié', String(x.justifiesProposes));
    verifier(x.refuses <= 1, q + 'crédit au-dessus du plafond refusé');
    verifier(x.pret && x.ferme && x.scelle, q + 'réunion fermée et scellée', JSON.stringify({ pret: x.pret, cles: x.clesDraft, ferme: x.ferme, scelle: x.scelle, dit: x.dit, boum: x.boum }));
    verifier(x.cles >= 3, q + 'trois clés au sceau', String(x.cles));
    verifier(x.ecart === 0, q + 'la caisse comptée est celle du cahier', fc(x.ecart));
    verifier(x.chaine, q + 'journal intact');
    /* un repère qui reste à l'écran tous les trois mois : la ligne vivante, elle, s'efface */
    if (sem % 13 === 0) {
      jalons.push('s' + sem + ' ' + fc(x.caisse));
      ligne('    ' + nom.padEnd(20) + ' semaine ' + String(sem).padStart(2) + ' · caisse ' + fc(x.caisse).padStart(13)
        + ' · ' + String(x.encours ? fc(x.encours) : 'rien').padStart(13) + ' en crédit dehors · ' + String(x.tx).padStart(4) + ' écritures');
    }
  }
  ligne('  ✓ ' + nom.padEnd(20) + ' ' + b.reunions + ' réunions · ' + jalons.join(' → '));

  /* ===== 3. LE PARTAGE ===== */
  etat[gi] = 'partage';
  await horloge(depart + 53 * SEMAINE);

  /* Le partage n'est pas une réunion : c'est une séance à part, et l'application refuse de
     partager tant qu'une réunion est ouverte. On passe donc par l'écran « Partage de fin de
     cycle », puis par la séance de partage, comme le groupe le fait. */
  const refus = await jsj(`(() => {
    const id = ${JSON.stringify(id)};
    const a = avecById(id);
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: id, memberId: chef.id };

    /* 1. une réunion ouverte interdit le partage */
    ACT.startMeeting();
    const ouverte = sharePret(a, stats(a));
    const m = openMeeting(a);
    a.meetings = a.meetings.filter(x => x.id !== m.id);             /* l'assemblée la referme */
    DB.save();

    /* 2. l'écran du partage, celui que l'assemblée lit avant de décider */
    App.go('a.share');
    const tableau = document.body.innerHTML;
    const plan = sharePlan(a, stats(a));

    /* 3. la séance de partage : d'abord sans rien, puis avec le comptage seul */
    App.draftKey = null; App.go('a.shareRun');
    const ecran = !!document.getElementById('closeCount');
    const sansRien = sharePret(a, stats(a));
    const boutonMort = (document.getElementById('closeBtn') || {}).disabled;
    App.draft.closeCount = String(stats(a).cash);
    const sansCles = sharePret(a, stats(a));
    return { ouverte, ecran, sansRien, sansCles, boutonMort,
      montreValeur: tableau.indexOf('Une part vaut en moyenne') > 0,
      montreBenefice: tableau.indexOf('Bénéfice du cycle à partager') > 0,
      bloques: plan.blocked.length, parts: plan.parts };
  })()`);
  verifier(/réunion/i.test(refus.ouverte), 'partage ' + nom + ' : refusé pendant qu’une réunion est ouverte', refus.ouverte);
  verifier(refus.montreValeur && refus.montreBenefice, 'partage ' + nom + ' : l’écran montre la valeur d’une part et le bénéfice');
  verifier(refus.ecran, 'partage ' + nom + ' : la séance de partage s’ouvre');
  verifier(/comptage|clé/i.test(refus.sansRien), 'partage ' + nom + ' : refusé sans comptage ni clé', refus.sansRien);
  verifier(refus.boutonMort === true, 'partage ' + nom + ' : le bouton reste éteint tant qu’il manque quelque chose', String(refus.boutonMort));
  verifier(/comptage|clé/i.test(refus.sansCles), 'partage ' + nom + ' : refusé sans les trois clés', refus.sansCles);

  const p = await jsj(`(async () => {
    const id = ${JSON.stringify(id)};
    const a = avecById(id);
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    const pin = async (membre, lancer) => { lancer(); String(membre.pin).split('').forEach(k => ACT.pinKey({ k })); await new Promise(r => setTimeout(r, 0)); };

    /* Rien ne doit rester dehors : la dernière réunion a fait rentrer les crédits et solder les
       amendes. On le vérifie ici plutôt que de le corriger — si quelque chose reste, le partage
       doit être refusé, et c'est cela qu'il faut voir. */
    App.draftKey = null; App.go('a.shareRun');
    let st = stats(a);
    const resteCredits = st.activeLoans.reduce((s, l) => s + l.remaining, 0);
    const resteAmendes = activeM(a).reduce((s, x) => s + Math.max(0, st.mem[x.id].fineDebt), 0);
    const avantCaisse = st.cash, avantSocial = st.socialFund, avantCredit = st.loanFund;
    App.draft.closeCount = String(st.cash);
    for (const h of keyHolders(a).slice(0, 3)) await pin(h, () => ACT.lockPin({ id: h.id }));

    const plan = sharePlan(a, stats(a));
    const pret = sharePret(a, stats(a));
    const somme = plan.rows.reduce((s, x) => s + x.net, 0);
    const epargnes = plan.rows.reduce((s, x) => s + x.d.savings, 0);
    const bonus = plan.rows.reduce((s, x) => s + x.bonus, 0);

    const txAvant = a.tx.length, cyclesAvant = a.cycles.length;
    ACT.runShare();
    ACT.shareGo();
    String(chef.pin).split('').forEach(k => ACT.pinKey({ k }));
    await new Promise(r => setTimeout(r, 0));

    const z = avecById(id);
    const cyc = z.cycles[z.cycles.length - 1] || null;
    const apres = stats(z);
    const der = z.meetings[z.meetings.length - 1] || {};
    return {
      pret, membres: plan.rows.length, parts: plan.parts, valeurPart: Math.round(plan.value),
      epargnes, bonus: Math.round(bonus), distribue: somme, bloques: plan.blocked.length,
      pourcent: epargnes ? Math.round(bonus / epargnes * 1000) / 10 : 0,
      resteCredits, resteAmendes,
      lignesPartage: z.tx.filter(t => t.type === 'PARTAGE' && t.cycle === cyclesAvant + 1).length,
      cycleFerme: cyclesAvant + 1 === z.cycles.length, nouveauCycle: z.cycle.n,
      reglesAttendues: !!z.cycle.rulesPending, attente: (z.waitlist || []).length,
      gardeSocial: cyc ? cyc.socialKept : null,
      reportIn: z.tx.filter(t => t.type === 'REPORT_IN' && t.cycle === z.cycle.n).reduce((s, t) => s + t.amount, 0),
      caisseApres: apres.cash, chaine: verifyChain(z).ok,
      reunionPartage: der.kind, scelle: !!der.seal, valide: (der.validators || []).length,
      avantCaisse, avantSocial, avantCredit,
      /* la part de chacun, pour vérifier qu'on ne rend ni trop ni trop peu */
      detail: plan.rows.map(x => ({ parts: x.d.parts, epargne: x.d.savings, recu: x.net, brut: Math.round(x.gross) })),
    };
  })()`);

  verifier(p.resteCredits === 0, 'partage ' + nom + ' : plus aucun crédit dehors après la dernière réunion', fc(p.resteCredits));
  verifier(p.resteAmendes === 0, 'partage ' + nom + ' : plus aucune amende due après la dernière réunion', fc(p.resteAmendes));
  verifier(p.pret === '', 'partage ' + nom + ' : toutes les conditions réunies', p.pret);
  verifier(p.bloques === 0, 'partage ' + nom + ' : personne ne reste débiteur', String(p.bloques));
  verifier(p.lignesPartage === p.membres, 'partage ' + nom + ' : une part écrite par membre', p.lignesPartage + '/' + p.membres);
  verifier(p.cycleFerme && p.nouveauCycle === 2, 'partage ' + nom + ' : cycle 1 fermé, cycle 2 ouvert', String(p.nouveauCycle));
  verifier(p.reglesAttendues, 'partage ' + nom + ' : le nouveau cycle attend un règlement voté');
  verifier(p.attente === 0, 'partage ' + nom + ' : les demandes de crédit ne traversent pas le partage');
  verifier(p.reunionPartage === 'partage' && p.scelle, 'partage ' + nom + ' : la réunion de partage est scellée');
  verifier(p.chaine, 'partage ' + nom + ' : journal intact après le partage');
  verifier(p.bonus > 0, 'partage ' + nom + ' : le cycle a produit un bénéfice', fc(p.bonus));
  verifier(p.reportIn >= p.gardeSocial, 'partage ' + nom + ' : la caisse sociale est reportée au cycle suivant', fc(p.reportIn) + ' / ' + fc(p.gardeSocial));
  /* l'argent rendu plus ce qui est gardé ne peut pas dépasser ce qu'il y avait dans la caisse */
  verifier(p.distribue + p.gardeSocial <= p.avantCaisse + 1, 'partage ' + nom + ' : on ne distribue pas plus que la caisse',
    fc(p.distribue) + ' + ' + fc(p.gardeSocial) + ' pour ' + fc(p.avantCaisse));
  verifier(p.detail.every(d => d.recu >= 0), 'partage ' + nom + ' : personne ne reçoit un montant négatif');
  verifier(p.detail.every(d => d.epargne > 0), 'partage ' + nom + ' : chaque membre a épargné pendant le cycle');
  /* chacun doit retrouver au moins son épargne : une année d'épargne ne peut pas rendre moins
     que ce qui a été versé, puisque les bénéfices sont positifs et les dettes déjà soldées */
  verifier(p.detail.every(d => d.brut >= d.epargne), 'partage ' + nom + ' : chacun retrouve au moins son épargne',
    p.detail.filter(d => d.brut < d.epargne).length + ' membre(s) en dessous');
  ligne('  ✓ ' + nom.padEnd(20) + ' partage · ' + String(p.membres).padStart(2) + ' membres · ' + String(p.parts).padStart(4)
    + ' parts · épargné ' + fc(p.epargnes).padStart(13) + ' · bénéfice ' + fc(p.bonus).padStart(12)
    + ' (+' + String(p.pourcent).padStart(4) + ' %) · rendu ' + fc(p.distribue).padStart(13));

  /* ===== 4. LE CYCLE SUIVANT ===== */
  etat[gi] = 'cycle 2';
  const s2 = await jsj(`(() => {
    const id = ${JSON.stringify(id)};
    const a = avecById(id);
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: id, memberId: chef.id };
    App.go('a.newCycle');
    const v = (idf, x) => { const e = document.getElementById(idf); if (e) e.value = String(x); };
    const s = a.settings;
    /* l'assemblée garde les mêmes règles — ncX est le crédit maximum et ncM les parts par
       réunion : les deux noms se ressemblent et se confondent très facilement */
    v('ncP', s.partValue); v('ncS', s.socialFee); v('ncR', s.rate); v('ncD', s.maxMonths);
    v('ncC', s.cycleMonths); v('ncF', s.fineAbsent); v('ncL', s.fineLate);
    v('ncPn', s.penaltyRate != null ? s.penaltyRate : s.rate);
    v('ncX', s.maxMult); v('ncM', s.maxParts); v('ncQ', s.frequency || 7);
    const ap = bureauOf(a).find(y => y.id !== chef.id);
    v('ncAp', ap.id); v('ncPin', ap.pin);
    const avantRegles = JSON.stringify(s);
    ACT.saveNewCycle();
    const z = avecById(id);
    return { enAttente: !!z.cycle.rulesPending, cycle: z.cycle.n, chaine: verifyChain(z).ok,
      reglesGardees: JSON.stringify(z.settings) === avantRegles,
      caisse: stats(z).cash, report: stats(z).socialFund,
      tx: z.tx.length, reunions: z.meetings.length,
      poids: Math.round((localStorage.getItem('kitabu.avec.v4') || '').length / 1024) };
  })()`);
  verifier(!s2.enAttente, 'cycle 2 ' + nom + ' : le règlement est voté, le groupe peut reprendre');
  verifier(s2.reglesGardees, 'cycle 2 ' + nom + ' : les règles reconduites sont inchangées');
  verifier(s2.chaine, 'cycle 2 ' + nom + ' : journal intact');
  ligne('  ✓ ' + nom.padEnd(20) + ' cycle 2 ouvert · caisse de départ ' + fc(s2.caisse)
    + ' (dont sociale ' + fc(s2.report) + ') · ' + s2.tx + ' écritures · ' + s2.poids + ' Ko');

  etat[gi] = 'fini';
  return { nom, b, p, s2 };
}

/* --------------------------------------------------------------------------- */
(async () => {
  for (let i = 0; i < 120; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }

  ligne('');
  ligne('  AKIBA — un cycle entier, de la création au partage');
  ligne('  cinq AVEC sur cinq téléphones · 52 réunions chacune · départ le ' + new Date(depart).toLocaleDateString('fr-FR'));
  ligne('  ' + '─'.repeat(Math.min(large - 2, 100)));

  GROUPES.forEach((_, i) => servir(PORT + i));
  const t0 = Date.now();
  const minuterie = setInterval(() => vivant('  ' + GROUPES.map((g, i) => g.nom.split(' ')[0] + ' ' + etat[i]).join(' · ')
    + '   [' + Math.round((Date.now() - t0) / 1000) + ' s]'), 400);

  let res;
  try { res = await Promise.all(GROUPES.map((_, i) => unGroupe(i))); }
  finally { clearInterval(minuterie); }

  ligne('  ' + '─'.repeat(Math.min(large - 2, 100)));
  ligne('  Bilan du cycle 1');
  res.forEach(x => ligne('   · ' + x.nom.padEnd(20) + String(x.b.reunions).padStart(2) + ' réunions · '
    + String(x.b.parts).padStart(4) + ' parts · ' + String(x.b.credits).padStart(3) + ' crédits accordés, '
    + x.b.refuses + ' refusés · ' + String(x.b.amendes).padStart(3) + ' amendes · '
    + String(x.b.absents).padStart(3) + ' absences dont ' + x.b.justifies + ' justifiées · '
    + x.b.retards + ' retards · ' + x.b.remplacements + ' clés remplacées · ' + x.b.ecarts + ' écart(s) de caisse'));

  const tx = res.reduce((s, x) => s + x.s2.tx, 0), reunions = res.reduce((s, x) => s + x.s2.reunions, 0);
  ligne('  ' + '─'.repeat(Math.min(large - 2, 100)));
  ligne('  ' + reunions + ' réunions tenues · ' + tx + ' écritures scellées · '
    + Math.round((Date.now() - t0) / 1000) + ' s');
  ligne('');
  ligne(mauvais ? '  RÉSULTAT : ' + bons + ' vérifications passées, ' + mauvais + ' ÉCHEC(S)'
                : '  RÉSULTAT : ' + bons + ' vérifications passées, aucun échec');
  ligne('');
  chrome.kill(); process.exit(mauvais ? 1 : 0);
})().catch(e => { ligne('  ÉCHEC DU LANCEUR : ' + (e && e.message ? e.message : e)); chrome.kill(); process.exit(2); });
