/* Akiba AVEC — noyau : registre chaîné, calculs, données de démonstration, rendu */
'use strict';

/* ---------- SHA-256 (fonctionne hors ligne, sans dépendance) ---------- */
function sha256(input) {
  const ascii0 = unescape(encodeURIComponent(input));
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  const maxWord = 4294967296;
  let result = '';
  const words = [];
  const bitLen = ascii0.length * 8;
  let hash = sha256.h = sha256.h || [];
  const k = sha256.k = sha256.k || [];
  let pc = k.length;
  const comp = {};
  for (let c = 2; pc < 64; c++) {
    if (!comp[c]) {
      for (let i = 0; i < 313; i += c) comp[i] = c;
      hash[pc] = (Math.pow(c, .5) * maxWord) | 0;
      k[pc++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
    }
  }
  let ascii = ascii0 + '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (bitLen / maxWord) | 0;
  words[words.length] = bitLen;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const old = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 14)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
        + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 17) ^ rr(w15, 19) ^ rr(w15, 25)) + w[i - 7] + (rr(w2, 15) ^ rr(w2, 17) ^ rr(w2, 22))) | 0);
      const t2 = (rr(a, 5) ^ rr(a, 30) ^ rr(a, 31)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) {
    const b = (hash[i] >> (j * 8)) & 255;
    result += (b < 16 ? '0' : '') + b.toString(16);
  }
  return result;
}

/* ---------- utilitaires ---------- */
const DAY = 864e5;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grp = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fc = n => (n < 0 ? '−' : '') + grp(Math.abs(n)) + ' FC';
const fck = n => Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M FC' : fc(n);
const pct = x => Math.round(x * 100) + ' %';
const fdate = ts => new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fdt = ts => new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const daysAgo = ts => Math.floor((Date.now() - ts) / DAY);
const ago = ts => { const d = daysAgo(ts); return d <= 0 ? "aujourd'hui" : d === 1 ? 'hier' : `il y a ${d} jours`; };
const initials = n => n.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
const ROLES = { president: 'Présidente', secretaire: 'Secrétaire', tresorier: 'Trésorière', compteur: 'Compteuse', membre: 'Membre' };
const roleLabel = m => {
  const base = ROLES[m.role] || 'Membre';
  const b = m.sex === 'M' ? base.replace('Présidente', 'Président').replace('Trésorière', 'Trésorier').replace('Compteuse', 'Compteur') : base;
  return m.key ? (m.role === 'membre' ? 'Porte-clé' : b + ' · porte-clé') : b;
};
const isBureau = m => m && ['president', 'secretaire', 'tresorier'].includes(m.role);
const TX = {
  EPARGNE: { l: 'Épargne (parts)', in: true },
  SOCIAL: { l: 'Caisse sociale', in: true },
  REMB: { l: 'Remboursement', in: true },
  AMENDE: { l: 'Amende', in: true },
  CREDIT: { l: 'Crédit accordé', in: false },
  AIDE: { l: 'Aide sociale', in: false },
  PARTAGE: { l: 'Partage fin de cycle', in: false },
  DEPART: { l: 'Remboursement de départ', in: false },
  DETTE: { l: 'Amende due (pas encore payée)', in: null },
  REPORT_OUT: { l: 'Report vers le cycle suivant', in: false },
  REPORT_IN: { l: 'Report du cycle précédent', in: true },
  ANNUL: { l: 'Annulation', in: null }
};

/* ---------- icônes ---------- */
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2c2.6.2 4.4 1.9 5 5"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 17c-3.3 0-6-1.3-6-3"/><path d="M15 12.5c3.4.2 6 1.4 6 3s-2.7 3-6 3-5-1-5.8-2.4"/>',
  book: '<path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h11"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
  unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.7-1.5"/>',
  check: '<path d="M4.5 12.5l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  map: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
  hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 6 18l-2.6-4.3a1.5 1.5 0 0 1 2.5-1.6L7 13.5"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  gavel: '<path d="M13 4l7 7M10 7l7 7M11.5 5.5l-4 4 7 7 4-4M9 12l-6 6 3 3 6-6"/>',
  split: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  building: '<path d="M4 21V5l8-2v18M12 8h8v13M4 21h17M7.5 8h1M7.5 12h1M7.5 16h1M15.5 12h1M15.5 16h1"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- registre chaîné (append-only) ---------- */
const payload = t => [t.seq, t.avecId, t.meetingId, t.type, t.memberId || '', t.amount, t.parts || 0, t.months || 0, t.rate || 0, t.ref || '', t.note || '', t.by || '', t.ts, t.cycle || 1, t.prev].join('|');

function appendTx(avec, f) {
  const prev = avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id;
  const t = Object.assign({ id: uid(), avecId: avec.id, ts: Date.now(), synced: false, cycle: avec.cycle.n }, f);
  t.seq = avec.tx.length + 1;
  t.prev = prev;
  t.hash = sha256(payload(t));
  avec.tx.push(t);
  return t;
}

function verifyChain(avec) {
  let prev = 'GENESE:' + avec.id;
  for (let i = 0; i < avec.tx.length; i++) {
    const t = avec.tx[i];
    if (t.seq !== i + 1 || t.prev !== prev || sha256(payload(t)) !== t.hash)
      return { ok: false, index: i, tx: t, reason: 'Écriture n°' + (i + 1) + ' modifiée après enregistrement' };
    prev = t.hash;
  }
  for (const m of avec.meetings) {
    if (m.status !== 'closed') continue;
    const sealed = avec.tx[m.sealSeq - 1];
    if (m.sealSeq > 0 && (!sealed || sealed.hash !== m.seal))
      return { ok: false, reason: 'Le sceau de la réunion n°' + m.n + ' ne correspond plus' };
    const late = avec.tx.find(t => t.meetingId === m.id && t.seq > m.sealSeq);
    if (late) return { ok: false, tx: late, reason: 'Écriture ajoutée à la réunion n°' + m.n + ' après sa clôture' };
  }
  return { ok: true, n: avec.tx.length, head: prev };
}

/* ---------- calculs ---------- */
function stats(avec, opt = {}) {
  const s = avec.settings;
  const cyc = opt.cycle || avec.cycle.n;
  const txs = avec.tx.filter(t => (t.cycle || 1) === cyc && (!opt.syncedOnly || t.synced));
  const annulled = new Set(txs.filter(t => t.type === 'ANNUL').map(t => t.ref));
  const act = txs.filter(t => t.type !== 'ANNUL' && !annulled.has(t.id));
  const mem = {};
  avec.members.forEach(x => mem[x.id] = { parts: 0, savings: 0, social: 0, fines: 0, fineDebt: 0, loans: [], left: !!x.left });
  const sum = { EPARGNE: 0, SOCIAL: 0, REMB: 0, AMENDE: 0, CREDIT: 0, AIDE: 0, PARTAGE: 0, DEPART: 0, DETTE: 0 };
  const rep = { REPORT_IN: { social: 0, credit: 0 }, REPORT_OUT: { social: 0, credit: 0 } };
  const loans = {};
  let parts = 0;
  for (const t of act) {
    if (rep[t.type]) { rep[t.type][t.ref] += t.amount; continue; }
    sum[t.type] += t.amount;
    const m = mem[t.memberId];
    if (t.type === 'EPARGNE') { parts += t.parts; if (m) { m.parts += t.parts; m.savings += t.amount; } }
    if (t.type === 'SOCIAL' && m) m.social += t.amount;
    if (t.type === 'AMENDE' && m) { m.fines += t.amount; if (t.ref === 'DETTE') m.fineDebt -= t.amount; }
    if (t.type === 'DETTE' && m) m.fineDebt += t.amount;
    if (t.type === 'CREDIT') loans[t.id] = { id: t.id, memberId: t.memberId, principal: t.amount, rate: t.rate, months: t.months, ts: t.ts, due: Math.round(t.amount * (1 + t.rate / 100 * t.months)), paid: 0, dueDate: t.ts + t.months * 28 * DAY, pays: [] };
    if (t.type === 'REMB' && loans[t.ref]) { loans[t.ref].paid += t.amount; loans[t.ref].pays.push(t); }
  }
  const now = Date.now();
  const loanList = Object.values(loans).map(l => {
    l.remaining = Math.max(0, l.due - l.paid);
    l.status = l.remaining === 0 ? 'solde' : now > l.dueDate ? 'retard' : 'cours';
    l.daysLate = l.status === 'retard' ? Math.floor((now - l.dueDate) / DAY) : 0;
    if (mem[l.memberId]) mem[l.memberId].loans.push(l);
    return l;
  }).sort((a, b) => b.ts - a.ts);
  const activeLoans = loanList.filter(l => l.status !== 'solde');
  const outstanding = activeLoans.reduce((a, l) => a + l.remaining, 0);
  const lateAmt = activeLoans.filter(l => l.status === 'retard').reduce((a, l) => a + l.remaining, 0);
  const interest = loanList.reduce((a, l) => a + Math.max(0, l.paid - l.principal), 0);
  const socialFund = sum.SOCIAL + rep.REPORT_IN.social - sum.AIDE - rep.REPORT_OUT.social;
  const loanFund = sum.EPARGNE + sum.REMB + sum.AMENDE + rep.REPORT_IN.credit - sum.CREDIT - sum.PARTAGE - sum.DEPART - rep.REPORT_OUT.credit;
  const active = avec.members.filter(x => !x.left);
  const activeParts = active.reduce((a, x) => a + mem[x.id].parts, 0);
  const fineDebt = active.reduce((a, x) => a + Math.max(0, mem[x.id].fineDebt), 0);
  const meetings = avec.meetings.filter(m => m.status === 'closed' && (m.cycle || 1) === cyc && (!opt.syncedOnly || m.synced));
  let pres = 0, slots = 0;
  meetings.forEach(m => Object.values(m.presence || {}).forEach(p => { slots++; if (p !== 'A') pres++; }));
  const ecarts = meetings.filter(m => m.closeCount !== m.closeExpected);
  return {
    sum, rep, mem, parts: activeParts, fineDebt, cycleN: cyc, loanList, activeLoans, outstanding, lateAmt, interest, socialFund, loanFund,
    cash: socialFund + loanFund, par: outstanding ? lateAmt / outstanding : 0,
    meetings, last: meetings[meetings.length - 1], attendance: slots ? pres / slots : 0, ecarts,
    women: active.filter(m => m.sex === 'F').length, activeCount: active.length,
    // valeur d'une part si le partage avait lieu aujourd'hui (caisse de crédit + crédits et amendes à recouvrer)
    shareValue: activeParts ? (loanFund + outstanding + fineDebt) / activeParts : s.partValue
  };
}

function loanLimit(avec, st, memberId) {
  const m = st.mem[memberId];
  if (!m) return { max: 0, why: 'Membre inconnu' };
  if (m.loans.some(l => l.status !== 'solde')) return { max: 0, why: 'A déjà un crédit en cours' };
  const bySavings = m.savings * avec.settings.maxMult;
  const max = Math.max(0, Math.min(bySavings, st.loanFund));
  return { max, why: max === 0 ? (m.savings === 0 ? "N'a pas encore d'épargne" : 'Caisse de crédit vide') : bySavings > st.loanFund ? 'Limité par l\'argent disponible' : `${avec.settings.maxMult} × son épargne` };
}

function health(avec, st, chain) {
  const alerts = [];
  const push = (lvl, title, detail) => alerts.push({ lvl, title, detail, avec });
  if (avec.cycle.end) {
    const left = Math.ceil((avec.cycle.end - Date.now()) / DAY);
    if (left < 0) push('bad', 'Cycle terminé, partage à faire', `Le cycle ${avec.cycle.n} devait finir le ${fdate(avec.cycle.end)}`);
    else if (left <= 28) push('warn', `Fin du cycle dans ${left} jours`, 'Préparer le partage : tous les crédits doivent être remboursés');
  }
  if (chain && !chain.ok) push('bad', 'Journal altéré', chain.reason);
  const recent = st.ecarts.filter(m => st.meetings.indexOf(m) >= st.meetings.length - 4);
  recent.forEach(m => push('bad', `Écart de caisse ${fc(m.closeCount - m.closeExpected)}`, `Réunion n°${m.n} du ${fdate(m.date)}${m.note ? ' — « ' + m.note + ' »' : ''}`));
  if (st.last) {
    const d = daysAgo(st.last.date);
    const freq = avec.settings.frequency || 7;
    if (d > freq * 3) push('bad', `Aucune réunion depuis ${d} jours`, 'Dernière réunion le ' + fdate(st.last.date));
    else if (d > freq + 2) push('warn', `Pas de réunion depuis ${d} jours`, 'Dernière réunion le ' + fdate(st.last.date));
  }
  const late = st.activeLoans.filter(l => l.status === 'retard');
  if (late.length) push(st.par > .1 ? 'bad' : 'warn', `${late.length} crédit${late.length > 1 ? 's' : ''} en retard`, `${fc(st.lateAmt)} à recouvrer · PAR ${pct(st.par)}`);
  const pending = avec.tx.filter(t => !t.synced).length;
  if (avec.orgId && pending && daysAgo(avec.lastSync || 0) > 3) push('warn', 'Données non synchronisées', `Dernière synchronisation ${ago(avec.lastSync || 0)}`);
  const level = alerts.some(a => a.lvl === 'bad') ? 'bad' : alerts.length ? 'warn' : 'good';
  return { level, alerts };
}

/* ---------- stockage ---------- */
const K = { data: null, session: null };
// ⚠ NE JAMAIS CHANGER cette clé : les données réelles des téléphones installés y sont rangées.
// Une évolution des données se fait dans migrate(), jamais en changeant la clé.
const STORE = 'kitabu.avec.v4';
const OLD_STORES = ['kitabu.avec.v3', 'kitabu.avec.v2', 'kitabu.avec.v1'];
function migrate(d) {
  d.net = d.net || { online: true };
  d.orgs = d.orgs || []; d.users = d.users || []; d.avecs = d.avecs || [];
  d.avecs.forEach(a => {
    ['meetings', 'tx', 'visits', 'cycles', 'security', 'rescue', 'members'].forEach(k => { if (!Array.isArray(a[k])) a[k] = []; });
    a.status = a.status || 'active';
    a.settings = Object.assign({ partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, cycleMonths: 12, frequency: 7 }, a.settings || {});
    a.cycle = a.cycle || { n: 1, start: a.createdAt || Date.now() };
    if (!a.cycle.end) a.cycle.end = a.cycle.start + a.settings.cycleMonths * 30 * DAY;
    if (!a.requestCode) a.requestCode = randCode(6);
    a.members.forEach(m => { if (!m.phone) m.phone = '—'; if (m.activity == null) m.activity = ''; if (m.address == null) m.address = ''; if (!m.role) m.role = 'membre'; });
  });
  d.schema = 5;
  return d;
}
const DB = {
  load() {
    try { const raw = localStorage.getItem(STORE); if (raw) K.data = JSON.parse(raw); } catch (e) { K.data = null; }
    if (!K.data || !K.data.avecs) {
      // récupérer les vraies données laissées par une ancienne version (jamais les données de démonstration)
      for (const key of OLD_STORES) {
        try { const old = JSON.parse(localStorage.getItem(key) || 'null'); if (old && old.mode === 'prod' && Array.isArray(old.avecs)) { K.data = old; K.recovered = key; break; } } catch (e) { /* clé illisible : on passe */ }
      }
    }
    if (!K.data || !K.data.avecs) K.data = seed();
    migrate(K.data);
    try { K.session = JSON.parse(localStorage.getItem(STORE + '.s') || 'null'); } catch (e) { K.session = null; }
  },
  save() {
    try { localStorage.setItem(STORE, JSON.stringify(K.data)); localStorage.setItem(STORE + '.s', JSON.stringify(K.session)); } catch (e) { /* stockage indisponible : l'app continue en mémoire */ }
  },
  reset() { K.data = seed(); K.session = null; DB.save(); }
};
const avecById = id => K.data.avecs.find(a => a.id === id);
const userById = id => K.data.users.find(u => u.id === id);
const memberOf = (avec, id) => avec.members.find(m => m.id === id);
const openMeeting = avec => avec.meetings.find(m => m.status === 'open');
const pending = avec => avec.tx.filter(t => !t.synced).length;
const isActive = avec => !avec.status || avec.status === 'active';

/* Codes transmis par téléphone, vérifiables sans internet.
   Démonstration : secret partagé par organisation. En production : signature numérique (clé privée chez l'organisation). */
const RESCUE_DEMO = ['2468-1357', '9753-8642', '1357-2468', '8642-9753', '1470-2580', '3690-1470'];
const hashCode = c => sha256('KITABU-SECOURS|' + String(c).replace(/\D/g, ''));
const orgSecret = orgId => { const o = K.data.orgs.find(x => x.id === orgId); return o ? (o.secret || 'mwangaza-demo-7Q4') : 'sans-organisation'; };
function signCode(kind, orgId, req) {
  const h = sha256('KITABU-' + kind + '|' + orgSecret(orgId) + '|' + String(req).toUpperCase().replace(/[^A-Z0-9]/g, ''));
  return String(parseInt(h.slice(0, 12), 16) % 1e8).padStart(8, '0');
}
const fmtCode = c => String(c).replace(/^(\d{4})(\d{4})$/, '$1 $2');
function randCode(n) {
  const A = 'ACDEFHJKLMNPQRTUVWXY34679', r = new Uint32Array(n);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else for (let i = 0; i < n; i++) r[i] = Math.floor(Math.random() * 1e9);
  return Array.from(r, x => A[x % A.length]).join('');
}

function syncAvec(avec) {
  if (!K.data.net.online) { App.toast('Pas de réseau. Tout reste enregistré sur ce téléphone.'); return false; }
  const n = pending(avec);
  avec.tx.forEach(t => t.synced = true);
  avec.meetings.forEach(m => { if (m.status === 'closed') m.synced = true; });
  avec.lastSync = Date.now();
  DB.save();
  App.toast(n ? `${n} écriture${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''} au serveur` : 'Déjà à jour');
  return true;
}

/* ---------- données de démonstration ---------- */
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function seed() {
  const now = Date.now();
  const F = ['Kavira', 'Masika', 'Kahambu', 'Mbambu', 'Kasoki', 'Furaha', 'Neema', 'Sifa', 'Mwamini', 'Katungu', 'Kyakimwa', 'Riziki', 'Faida', 'Espérance', 'Solange', 'Jeanine', 'Vagheni', 'Nziavake', 'Anuarite', 'Bahati'];
  const M = ['Kambale', 'Paluku', 'Muhindo', 'Kasereka', 'Kakule', 'Baraka', 'Katembo', 'Kasika'];
  const S = ['Mbusa', 'Vighano', 'Kamabu', 'Maliro', 'Kataliko', 'Kyavumba', 'Muhesi', 'Siviri', 'Ngeleza', 'Mathe', 'Vihamba', 'Kombi', 'Lwanzo', 'Musavuli', 'Kisuba', 'Vitsange'];
  const data = {
    v: 1, net: { online: true },
    orgs: [{ id: 'org1', name: 'Mwangaza Développement', zone: 'Nord-Kivu', secret: 'mwangaza-demo-7Q4' }],
    users: [
      { id: 'u-org', role: 'org', orgId: 'org1', name: 'Coordination Mwangaza', pin: '1234' },
      { id: 'u-a1', role: 'anim', orgId: 'org1', name: 'Esther Kahindo', pin: '1234', zone: 'Lubero' },
      { id: 'u-a2', role: 'anim', orgId: 'org1', name: 'Jean-Paul Mumbere', pin: '1234', zone: 'Lubero – Beni' }
    ],
    avecs: []
  };
  const defs = [
    { name: 'Tujenge Pamoja', village: 'Kirumba', terr: 'Lubero', org: 'org1', anim: 'u-a1', n: 18, weeks: 16, part: 1000, social: 500, p: 'good' },
    { name: 'Umoja ni Nguvu', village: 'Kanyabayonga', terr: 'Lubero', org: 'org1', anim: 'u-a1', n: 20, weeks: 14, part: 500, social: 300, p: 'ecart' },
    { name: 'Maendeleo ya Wamama', village: 'Luofu', terr: 'Lubero', org: 'org1', anim: 'u-a2', n: 16, weeks: 12, part: 1000, social: 500, p: 'missed' },
    { name: 'Amani Kwetu', village: 'Bingi', terr: 'Beni', org: 'org1', anim: 'u-a2', n: 15, weeks: 18, part: 2000, social: 500, p: 'late' },
    { name: 'Tushikamane', village: 'Vulamba, Butembo', terr: 'Butembo', org: null, anim: null, n: 12, weeks: 9, part: 1000, social: 500, p: 'auto' }
  ];
  defs.forEach((d, ai) => {
    const r = rng(97 + ai * 131);
    const pick = arr => arr[Math.floor(r() * arr.length)];
    const used = new Set();
    const members = [];
    for (let i = 0; i < d.n; i++) {
      const sex = (i === 3 || r() < .22) ? 'M' : 'F';
      let name;
      do { name = pick(sex === 'F' ? F : M) + ' ' + pick(S); } while (used.has(name));
      used.add(name);
      members.push({
        id: 'm' + ai + '-' + i, name, sex, pin: '1234',
        role: ['president', 'secretaire', 'tresorier', 'compteur', 'compteur'][i] || 'membre',
        key: i >= 5 && i <= 7,
        phone: r() < .2 ? '—' : '+243 9' + Math.floor(r() * 10) + ' ' + (100 + Math.floor(r() * 900)) + ' ' + (1000 + Math.floor(r() * 9000)),
        birthYear: r() < .15 ? null : new Date().getFullYear() - (19 + Math.floor(r() * 44)),
        activity: r() < .1 ? '' : pick(['Agriculture', 'Agriculture', 'Petit commerce', 'Petit commerce', 'Élevage', 'Couture', 'Pêche', 'Transport (moto, vélo)', 'Enseignement']),
        address: r() < .25 ? '' : pick(['Av. de la Paix', 'Av. du Marché', 'Quartier Mabanga', 'Cellule Kivika', 'Av. Lumumba']) + ', ' + d.village,
        joined: now - (d.weeks * 7 + 21) * DAY
      });
    }
    const gap = d.p === 'missed' ? 24 : d.p === 'good' ? 2 : 5;
    const start = now - ((d.weeks - 1) * 7 + gap) * DAY;
    const avec = {
      id: 'avec' + ai, name: d.name, village: d.village, territoire: d.terr, orgId: d.org, animId: d.anim,
      province: 'Nord-Kivu', entite: d.terr === 'Butembo' ? 'ville' : 'territoire', secteur: d.terr === 'Lubero' ? 'Bamate' : '', groupement: '',
      createdAt: start - 14 * DAY, cycle: { n: d.p === 'late' ? 2 : 1, start, end: start + (d.p === 'ecart' ? 4 : 12) * 30 * DAY },
      settings: { partValue: d.part, maxParts: 5, socialFee: d.social, rate: d.p === 'auto' ? 5 : 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, cycleMonths: d.p === 'ecart' ? 4 : 12 },
      members, meetings: [], tx: [], visits: [], lastSync: 0,
      status: 'active', requestCode: 'DEMO' + ai + 'X', rescue: RESCUE_DEMO.map(c => ({ h: hashCode(c), used: false })), security: [],
      cycles: d.p === 'late' ? [{ n: 1, start: start - 53 * 7 * DAY, end: start - 7 * DAY, parts: 1284, value: 2710, distributed: 3479640, socialKept: 38000, members: 15, meetings: 50 }] : []
    };
    data.avecs.push(avec);
    const lateIdx = [8, 9, 10];
    for (let w = 0; w < d.weeks; w++) {
      const date = start + w * 7 * DAY + 9 * 3600e3;
      let t = date;
      const tick = () => (t += 35e3 + Math.floor(r() * 30e3));
      const meet = { id: avec.id + '-r' + (w + 1), n: w + 1, cycle: avec.cycle.n, date, status: 'open', presence: {}, openedBy: members[0].id };
      avec.meetings.push(meet);
      if (w === 0 && d.p === 'late') appendTx(avec, { meetingId: meet.id, type: 'REPORT_IN', ref: 'social', amount: 38000, note: 'Caisse sociale gardée du cycle 1', by: members[2].id, ts: date });
      meet.openExpected = meet.openCount = stats(avec).cash;
      const by = members[2].id;
      members.forEach(m => { const x = r(); meet.presence[m.id] = x < .08 ? 'A' : x < .14 ? 'R' : 'P'; });
      const here = members.filter(m => meet.presence[m.id] !== 'A');
      here.forEach(m => appendTx(avec, { meetingId: meet.id, type: 'SOCIAL', memberId: m.id, amount: d.social, by, ts: tick() }));
      here.forEach(m => {
        const x = r(); const parts = x < .15 ? 1 : x < .35 ? 2 : x < .6 ? 3 : x < .75 ? 4 : 5;
        appendTx(avec, { meetingId: meet.id, type: 'EPARGNE', memberId: m.id, parts, amount: parts * d.part, by, ts: tick() });
      });
      let st = stats(avec);
      st.activeLoans.forEach(l => {
        if (meet.presence[l.memberId] === 'A') return;
        const idx = members.findIndex(m => m.id === l.memberId);
        if (d.p === 'late' && lateIdx.includes(idx)) return;
        const wk = Math.round((date - l.ts) / (7 * DAY));
        if (wk > 0 && wk % 4 === 0) {
          const amount = Math.min(l.remaining, Math.ceil(l.due / l.months / 100) * 100);
          appendTx(avec, { meetingId: meet.id, type: 'REMB', memberId: l.memberId, ref: l.id, amount, by, ts: tick() });
        }
      });
      if (w >= 2) {
        st = stats(avec);
        let fund = st.loanFund;
        here.forEach(m => {
          const idx = members.indexOf(m);
          const forced = d.p === 'late' && w === 3 && lateIdx.includes(idx);
          if (!forced && r() > .11) return;
          const lim = loanLimit(avec, st, m.id);
          const amount = Math.floor(Math.min(lim.max, fund * .6) * (forced ? .8 : .4 + .6 * r()) / 5000) * 5000;
          if (amount < 5000) return;
          appendTx(avec, { meetingId: meet.id, type: 'CREDIT', memberId: m.id, amount, months: forced ? 1 : 1 + Math.floor(r() * 3), rate: avec.settings.rate, by, note: pick(['Petit commerce', 'Semences de haricot', 'Frais scolaires', 'Achat de chèvre', 'Stock de farine']), ts: tick() });
          fund -= amount;
        });
      }
      const sf = stats(avec);
      members.forEach(m => {
        const p = meet.presence[m.id];
        // un absent ne paie pas sur place : l'amende devient une dette, payée à son retour
        if (p === 'A') { appendTx(avec, { meetingId: meet.id, type: 'DETTE', memberId: m.id, amount: 500, note: 'Absence', by, ts: tick() }); return; }
        if (p === 'R') appendTx(avec, { meetingId: meet.id, type: 'AMENDE', memberId: m.id, amount: 200, note: 'Retard', by, ts: tick() });
        if (sf.mem[m.id].fineDebt > 0) appendTx(avec, { meetingId: meet.id, type: 'AMENDE', ref: 'DETTE', memberId: m.id, amount: sf.mem[m.id].fineDebt, note: 'Amende d\'absence payée', by, ts: tick() });
      });
      st = stats(avec);
      if (w > 3 && r() < .1 && st.socialFund > 12000) appendTx(avec, { meetingId: meet.id, type: 'AIDE', memberId: pick(members).id, amount: 10000, note: pick(['Maladie d\'un enfant', 'Deuil dans la famille']), by, ts: tick() });
      meet.closeExpected = stats(avec).cash;
      meet.closeCount = meet.closeExpected;
      if (d.p === 'ecart' && w === d.weeks - 1) { meet.closeCount -= 3500; meet.note = 'La trésorière dit avoir laissé un billet à la maison'; }
      meet.status = 'closed';
      meet.closedAt = tick();
      meet.validators = members.filter(m => m.key).map(m => m.id);
      meet.sealSeq = avec.tx.length;
      meet.seal = avec.tx[avec.tx.length - 1].hash;
      const unsynced = d.p === 'auto' ? w >= d.weeks - 2 : d.p === 'good' && w === d.weeks - 1;
      meet.synced = !unsynced;
      avec.tx.filter(x => x.meetingId === meet.id).forEach(x => x.synced = !unsynced);
      if (!unsynced) avec.lastSync = meet.closedAt + 2 * 3600e3;
    }
    if (d.anim) avec.visits.push({ id: uid(), by: d.anim, ts: start + 5 * 7 * DAY, note: d.p === 'late' ? 'Rappel des règles de crédit. Trois membres ne remboursent pas, suivi à la prochaine visite.' : 'Réunion bien tenue, comptage public respecté, cahier du secrétaire à jour.', score: d.p === 'late' ? 2 : 3 });
  });
  // une AVEC créée par un animateur, qui attend la validation de l'organisation
  const pm = ['Bahati Kavugho', 'Furaha Masika', 'Neema Kahindo', 'Sifa Mbambu', 'Riziki Kasoki', 'Faida Katungu', 'Paluku Muhesi', 'Kambale Siviri', 'Mwamini Vihamba', 'Solange Lwanzo', 'Jeanine Kombi', 'Espérance Maliro']
    .map((name, i) => ({ id: 'mp-' + i, name, sex: /^(Paluku|Kambale)/.test(name) ? 'M' : 'F', pin: '1234', phone: '+243 99 ' + (401 + i) + ' 20 ' + (10 + i), role: ['president', 'secretaire', 'tresorier', 'compteur', 'compteur'][i] || 'membre', key: i >= 5 && i <= 7 }));
  data.avecs.push({
    id: 'avec-p', name: 'Tuungane Wamama', village: 'Mayangose', territoire: 'Beni', province: 'Nord-Kivu', entite: 'territoire', secteur: 'Beni-Mbau', groupement: '', orgId: 'org1', animId: 'u-a2',
    createdAt: now - 2 * DAY, submittedAt: now - 2 * DAY, cycle: { n: 1, start: now, end: now + 12 * 30 * DAY }, cycles: [],
    settings: { partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, cycleMonths: 12, meetingDay: 'Jeudi', frequency: 7 },
    members: pm, meetings: [], tx: [], visits: [], lastSync: now - 2 * DAY,
    status: 'pending', requestCode: 'TW7K3M', rescue: RESCUE_DEMO.map(c => ({ h: hashCode(c), used: false })), security: []
  });
  return data;
}

/* ---------- moteur d'écran ---------- */
const SCREENS = {}, ACT = {}, INP = {};
const App = {
  screen: 'login', params: {}, sheet: null,
  hist: [],
  go(screen, params = {}, isBack = false) {
    const same = this.screen === screen && JSON.stringify(clean(this.params)) === JSON.stringify(clean(params));
    if (!isBack && this.screen && !same) {
      this.hist.push({ screen: this.screen, params: this.params });
      if (this.hist.length > 80) this.hist.shift();
      try { history.pushState({ kitabu: 1 }, ''); } catch (e) { /* historique du navigateur indisponible */ }
    }
    if (screen === 'login') this.hist = [];
    this.screen = screen; this.params = params; this.sheet = null; render(); window.scrollTo(0, 0);
  },
  openSheet(html) { this.sheet = html; render(); },
  closeSheet() { this.sheet = null; render(); },
  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = typeof I18N !== 'undefined' ? I18N.t(msg) : msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
};
function render() {
  const locked = typeof licenceRequired === 'function' && licenceRequired() && !(App.licence && App.licence.ok);
  const fn = locked && !/^adm\./.test(App.screen) ? SCREENS['lic.gate'] : (SCREENS[App.screen] || SCREENS.login);
  document.getElementById('app').innerHTML = fn(App.params) +
    (App.sheet ? `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="sheethead"><div class="grab"></div><button class="iconbtn shut" data-act="closeSheet" aria-label="Fermer">${ic('x')}</button></div>${App.sheet}</div></div>` : '');
  if (App.updateReady && !document.getElementById('updbar')) {
    const bar = document.createElement('div');
    bar.id = 'updbar'; bar.className = 'updbar'; bar.setAttribute('role', 'status');
    bar.innerHTML = `<span><b>Nouvelle version d\'Akiba</b><span class="small">Vos données sont gardées.</span></span><button class="btn sm primary" data-act="reloadApp">Mettre à jour</button>`;
    document.getElementById('app').appendChild(bar);
  }
  if (typeof I18N !== 'undefined') I18N.apply(document.getElementById('app'));
}
ACT.reloadApp = () => { DB.save(); location.reload(); };
ACT.scrim = (d, el, e) => { if (e.target === el) App.closeSheet(); };
ACT.closeSheet = () => App.closeSheet();
ACT.go = d => App.go(d.to, Object.assign({}, d));

/* ---------- retour : flèche en haut, bouton retour du téléphone ---------- */
function clean(p) { const o = Object.assign({}, p || {}); delete o.act; delete o.to; return o; }
function homeScreen() { const s = K.session; return !s ? 'login' : s.kind === 'avec' ? 'a.home' : s.kind === 'org' ? 'o.home' : 'n.home'; }
const NO_BACK = ['c.codes', 'a.shareRun', 's.org', 'a.newCycle'];
function backOk(e) {
  const kind = K.session && K.session.kind;
  if (NO_BACK.includes(e.screen)) return false;
  if (e.screen === App.screen && JSON.stringify(clean(e.params)) === JSON.stringify(clean(App.params))) return false;
  if (/^a\./.test(e.screen) && kind !== 'avec') return false;
  if (/^o\./.test(e.screen) && kind !== 'org') return false;
  if (/^n\./.test(e.screen) && kind !== 'anim' && kind !== 'org') return false;
  if (/^(login|l\.)/.test(e.screen) && K.session) return false;
  if (e.screen === 'c.avec' && (!App.cdraft || App.cdraft.done)) return false;
  if (e.screen === 'a.meet') { const a = K.session && avecById(K.session.avecId); if (!a || !openMeeting(a)) return false; }
  return true;
}
function goBack(d = {}) {
  while (App.hist.length) { const e = App.hist.pop(); if (backOk(e)) return App.go(e.screen, e.params, true); }
  const to = d.to && d.to !== App.screen ? d.to : homeScreen();
  if (to !== App.screen) App.go(to, clean(d), true);
}
const canGoBack = () => App.screen !== homeScreen() || App.hist.some(backOk);
ACT.back = d => goBack(d);
window.addEventListener('popstate', () => {
  if (App.sheet) App.closeSheet(); else goBack();
  try { history.pushState({ kitabu: 1 }, ''); } catch (e) { /* rien */ }
});
document.addEventListener('click', e => {
  if (K.session && App.lastAct && Date.now() - App.lastAct > 15 * 60e3) {
    App.lastAct = Date.now(); K.session = null; DB.save(); App.go('login');
    App.toast('Session fermée après 15 minutes sans activité');
    return;
  }
  App.lastAct = Date.now();
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = ACT[el.dataset.act];
  if (f) { e.preventDefault(); f(el.dataset, el, e); }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-in]');
  if (el && INP[el.dataset.in]) INP[el.dataset.in](el, e);
});

/* ---------- pièces communes ---------- */
const avatar = m => `<span class="av ${m.sex === 'F' ? 'f' : ''}">${esc(initials(m.name))}</span>`;
const stampsHtml = (n, max = 5) => `<span class="stamps" aria-label="${n} parts">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</span>`;
const topbar = (title, sub, left = '', right = '') => {
  if (!left && canGoBack()) left = `<button class="iconbtn" data-act="back" aria-label="Retour">${ic('back')}</button>`;
  return `<header class="topbar">${left}<div class="t"><b>${esc(title)}</b><span>${sub}</span></div>${right}</header>`;
};
const backBtn = (to, extra = '') => `<button class="iconbtn" data-act="back" data-to="${to}" ${extra} aria-label="Retour">${ic('back')}</button>`;
function syncPill(avec) {
  const n = pending(avec), on = K.data.net.online;
  const label = !on ? `Hors ligne${n ? ' · ' + n : ''}` : n ? `${n} à envoyer` : 'À jour';
  return `<button class="sync ${on && !n ? '' : 'off'}" data-act="syncSheet" aria-label="État de synchronisation"><i></i>${label}</button>`;
}
function tabbar(items, cur) {
  return `<nav class="tabbar"><div class="in">${items.map(t => `<button class="tab ${t.id === cur ? 'on' : ''}" data-act="go" data-to="${t.id}">${ic(t.icon)}${t.label}</button>`).join('')}</div></nav>`;
}
ACT.syncSheet = () => {
  const avec = K.session && K.session.avecId ? avecById(K.session.avecId) : null;
  const on = K.data.net.online;
  App.openSheet(`
    <h2>Synchronisation</h2>
    <div class="alert ${on ? 'good' : 'warn'}">${ic(on ? 'cloud' : 'alert')}<div><b>${on ? 'Réseau disponible' : 'Pas de réseau'}</b><span class="small">Toutes les opérations sont d'abord enregistrées sur ce téléphone. Elles partent au serveur dès que le réseau revient.</span></div></div>
    ${avec ? `<div class="grid2"><div class="kpi"><span>En attente</span><b class="num">${pending(avec)}</b></div><div class="kpi"><span>Dernier envoi</span><b style="font-size:1.05rem">${avec.lastSync ? ago(avec.lastSync) : 'jamais'}</b></div></div>
    ${avec.orgId ? '' : '<p class="hint">Cette AVEC est autonome : la sauvegarde en ligne protège vos données si le téléphone est perdu. Aucune organisation ne les voit.</p>'}
    <button class="btn primary block xl" data-act="doSync">${ic('sync')} Envoyer maintenant</button>` : ''}
    ${K.data.mode === 'prod' ? '' : `<div class="row between card"><div><b>Simuler l'absence de réseau</b><p class="hint">Démonstration : pour tester le mode village</p></div><button class="toggle ${on ? '' : 'on'}" data-act="toggleNet" aria-label="Simuler hors ligne"></button></div>`}`);
};
ACT.doSync = () => { const a = avecById(K.session.avecId); syncAvec(a); App.closeSheet(); };
ACT.toggleNet = () => {
  if (K.data.mode === 'prod') return; K.data.net.online = !K.data.net.online; DB.save(); ACT.syncSheet(); };
