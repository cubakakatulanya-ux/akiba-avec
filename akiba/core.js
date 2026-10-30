/* Akiba AVEC — noyau : registre chaîné, calculs, données de démonstration, rendu */
'use strict';

/* ---------- Le sceau des écritures ----------

   Chaque écriture du journal porte une empreinte de 256 bits calculée sur son contenu et sur
   l'empreinte de la précédente. Changer un chiffre dans un cahier casse la chaîne, et
   l'application le dit.

   Une précision honnête, pour qui reprendra ce code : cette fonction s'appelle sha256 et suit
   la structure de SHA-256 — mêmes constantes initiales, mêmes constantes de tour, mêmes
   soixante-quatre tours — mais trois de ses rotations s'écartent de la norme publiée. Elle ne
   rend donc PAS les valeurs officielles de SHA-256. Elle reste déterministe, chaînée et
   sensible au moindre bit changé, ce qui est ce qu'on lui demande : rendre une falsification
   visible. Elle n'est pas pour autant une primitive certifiée, et il ne faut pas s'en servir
   ailleurs comme d'un SHA-256.

   Elle ne peut pas être corrigée : chaque écriture de chaque journal, sur chaque téléphone,
   porte déjà un sceau calculé ainsi. En changer ferait passer tous les cahiers pour altérés.

   Ce qui a changé, en revanche, c'est la façon de la calculer. L'ancienne écriture refabriquait
   le tableau des huit registres à chaque tour — plus de deux mille recopies par bloc de
   soixante-quatre octets. Vérifier un journal de fin de cycle prenait des secondes sur un
   terminal de caisse. Ici : huit variables, un tableau de travail réutilisé, rien d'alloué
   pendant les tours. Les valeurs rendues sont identiques, vérifiées sur vingt mille entrées,
   longueurs de bloc limites comprises. */
const SHA_K = [], SHA_H0 = [], SHA_HEX = [];
(function constantesDuSceau() {
  /* les racines carrées et cubiques des premiers nombres premiers, comme dans SHA-256 */
  const composes = {};
  let pris = 0;
  for (let c = 2; pris < 64; c++) {
    if (!composes[c]) {
      for (let i = 0; i < 313; i += c) composes[i] = c;
      SHA_H0[pris] = (Math.pow(c, .5) * 4294967296) | 0;
      SHA_K[pris++] = (Math.pow(c, 1 / 3) * 4294967296) | 0;
    }
  }
  for (let i = 0; i < 256; i++) SHA_HEX.push((i < 16 ? '0' : '') + i.toString(16));
})();
const SHA_W = new Int32Array(64);

function sha256(input) {
  const s = unescape(encodeURIComponent(input));          // le sceau porte sur les octets UTF-8
  const n = s.length;
  const blocs = ((n + 8) >> 6) + 1;                       // bourrage compris
  const mots = new Int32Array(blocs << 4);
  for (let i = 0; i < n; i++) mots[i >> 2] |= s.charCodeAt(i) << ((3 - (i & 3)) << 3);
  mots[n >> 2] |= 0x80 << ((3 - (n & 3)) << 3);           // le 1 qui ferme le message
  mots[(blocs << 4) - 2] = ((n * 8) / 4294967296) | 0;    // la longueur, en bits
  mots[(blocs << 4) - 1] = n * 8;

  let h0 = SHA_H0[0], h1 = SHA_H0[1], h2 = SHA_H0[2], h3 = SHA_H0[3],
      h4 = SHA_H0[4], h5 = SHA_H0[5], h6 = SHA_H0[6], h7 = SHA_H0[7];
  const w = SHA_W;

  for (let b = 0; b < mots.length; b += 16) {
    for (let i = 0; i < 16; i++) w[i] = mots[b + i];
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      const m0 = ((x >>> 17) | (x << 15)) ^ ((x >>> 19) | (x << 13)) ^ ((x >>> 25) | (x << 7));
      const m1 = ((y >>> 15) | (y << 17)) ^ ((y >>> 17) | (y << 15)) ^ ((y >>> 22) | (y << 10));
      w[i] = (w[i - 16] + m0 + w[i - 7] + m1) | 0;
    }
    let a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 14) | (e << 18));
      const t1 = (hh + S1 + ((e & f) ^ (~e & g)) + SHA_K[i] + w[i]) | 0;
      const S0 = ((a >>> 5) | (a << 27)) ^ ((a >>> 30) | (a << 2)) ^ ((a >>> 31) | (a << 1));
      const t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + bb) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + hh) | 0;
  }

  const fin = [h0, h1, h2, h3, h4, h5, h6, h7];
  let out = '';
  for (let i = 0; i < 8; i++) {
    const v = fin[i];
    out += SHA_HEX[(v >>> 24) & 255] + SHA_HEX[(v >>> 16) & 255] + SHA_HEX[(v >>> 8) & 255] + SHA_HEX[v & 255];
  }
  return out;
}

/* ---------- utilitaires ---------- */
const DAY = 864e5;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grp = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fc = n => (n < 0 ? '−' : '') + grp(Math.abs(n)) + ' FC';
const fck = n => Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M FC' : fc(n);
const pct = x => Math.round(x * 100) + ' %';
/* la date suit la langue choisie quand Akiba sait la dire (voir CALENDRIER dans i18n.js) */
const fdate = ts => (typeof fdateL === 'function' ? fdateL(ts) : new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));
/* Une échéance ne doit jamais tomber un jour où le groupe ne se réunit pas : personne ne peut
   rembourser ce jour-là, et le crédit passerait « en retard » un jour sans réunion. On reporte
   donc l'échéance au premier jour de réunion qui suit — jamais avant, pour ne pénaliser personne.
   Le rythme de quinzaine se cale sur la dernière réunion tenue, qui est le rythme réel du groupe. */
const JOURS_IDX = { Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
function jourDeReunion(avec, ts) {
  const idx = JOURS_IDX[(avec.settings || {}).meetingDay];
  if (idx == null || !ts) return ts;
  const d = new Date(ts); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ((idx - d.getDay() + 7) % 7));
  if (((avec.settings || {}).frequency || 7) === 14) {
    const refs = (avec.meetings || []).filter(m => m.date);
    const ref = new Date(refs.length ? refs[refs.length - 1].date : avec.cycle.start); ref.setHours(12, 0, 0, 0);
    if (Math.abs(Math.round((d - ref) / (7 * DAY))) % 2 === 1) d.setDate(d.getDate() + 7);
  }
  return d.getTime();
}
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
  /* Les frais du groupe : cahier, stylos, encre de l'imprimante, transport du secrétaire.
     Sans ce type, il fallait les coder en « aide sociale », ce qui débitait la caisse de
     solidarité au nom d'un membre qui n'avait rien reçu. La dépense sort de la caisse
     sociale, comme dans la pratique AVEC, mais elle s'appelle par son nom. */
  DEPENSE: { l: 'Dépense du groupe', in: false },
  PARTAGE: { l: 'Partage fin de cycle', in: false },
  DEPART: { l: 'Remboursement de départ', in: false },
  DETTE: { l: 'Amende due (pas encore payée)', in: null },
  REPORT_OUT: { l: 'Report vers le cycle suivant', in: false },
  REPORT_IN: { l: 'Report du cycle précédent', in: true },
  EXT_IN: { l: 'Crédit extérieur reçu', in: true },
  EXT_FEE: { l: 'Frais du crédit extérieur', in: false },
  EXT_REPAY: { l: 'Remboursement au prêteur', in: false },
  EXT_GUAR: { l: 'Garantie retenue par le prêteur', in: false },
  GEO: { l: 'Point GPS du groupe', in: null },
  EXCUSE: { l: 'Absence ou retard justifié', in: null },
  /* Les arrivées et les départs de membres : aucun argent, mais la liste de ceux qui ont
     droit à une part devient aussi infalsifiable que les sommes. */
  MEMBRE: { l: 'Membre inscrit ou sorti', in: null },
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
const penRate = s => (s.penaltyRate != null ? s.penaltyRate : s.rate);   // taux de pénalité de retard, par mois
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* bande défilante : { icon, label, value } ou simple texte ; le texte est toujours échappé */
function ticker(items, opts = {}) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return '';
  const one = list.map(x => {
    const o = typeof x === 'string' ? { label: x } : x;
    return `<span>${o.icon ? ic(o.icon) : ''}${o.label ? esc(o.label) : ''}${o.value != null && o.value !== '' ? `${o.label ? ' ' : ''}<b>${esc(o.value)}</b>` : ''}</span>`;
  }).join('');
  /* Rien ne défile. Un texte en mouvement est coupé aux deux bords et illisible pour quelqu'un
     qui déchiffre lentement — c'est exactement le public de cette application. Les mêmes repères
     s'affichent donc d'un coup, et passent à la ligne quand il y en a trop. */
  return `<div class="reperes${opts.cls ? ' ' + opts.cls : ''}" aria-label="${esc(opts.aria || 'Repères')}">${one}</div>`;
}

/* ---------- registre chaîné (append-only) ---------- */
const payload = t => [t.seq, t.avecId, t.meetingId, t.type, t.memberId || '', t.amount, t.parts || 0, t.months || 0, t.rate || 0, t.ref || '', t.note || '', t.by || '', t.ts, t.cycle || 1, t.prev].join('|');

/* Les choix du règlement, écrits une seule fois. Ils servent à la création du groupe et au
   vote du cycle suivant : séparés, les deux écrans finissaient par ne plus proposer les mêmes
   valeurs, et une règle votée à la création devenait impossible à reconduire. */
const REGLES_CHOIX = {
  partValue: [[200, '200 FC'], [500, '500 FC'], [1000, '1 000 FC'], [2000, '2 000 FC'], [5000, '5 000 FC']],
  maxParts: [[3, '1 à 3 parts'], [5, '1 à 5 parts'], [10, '1 à 10 parts']],
  socialFee: [[0, 'Aucune'], [200, '200 FC'], [300, '300 FC'], [500, '500 FC'], [1000, '1 000 FC']],
  cycleMonths: [[6, '6 mois'], [9, '9 mois'], [12, '12 mois']],
  rate: [[2, '2 % par mois'], [5, '5 % par mois'], [10, '10 % par mois']],
  maxMult: [[2, '2 × l\'épargne'], [3, '3 × l\'épargne'], [4, '4 × l\'épargne']],
  maxMonths: [[1, '1 mois'], [2, '2 mois'], [3, '3 mois'], [6, '6 mois']],
  fineAbsent: [[200, '200 FC'], [500, '500 FC'], [1000, '1 000 FC']],
  fineLate: [[100, '100 FC'], [200, '200 FC'], [500, '500 FC']],
  penaltyRate: [[0, 'Aucune pénalité'], [2, '2 % par mois'], [5, '5 % par mois'], [10, '10 % par mois']],
  frequency: [[7, 'Chaque semaine'], [14, 'Toutes les 2 semaines']],
};

function appendTx(avec, f) {
  const prev = avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id;
  const t = Object.assign({ id: uid(), avecId: avec.id, ts: Date.now(), synced: false, cycle: avec.cycle.n }, f);
  t.seq = avec.tx.length + 1;
  t.prev = prev;
  t.hash = sha256(payload(t));
  avec.tx.push(t);
  return t;
}

/* La liste des membres doit correspondre au journal. Elle n'était protégée par rien : un nom
   ajouté directement dans les données restait invisible — journal valide, aucune trace — et
   il entrait dans le décompte annoncé aux partenaires, pouvait porter une clé, et figurer
   parmi ceux qui scellent une réunion. Chaque arrivée et chaque départ laisse maintenant une
   écriture, et cette fonction compare les deux. */
/* Vérifier seulement la suite du journal, à partir d'une écriture déjà vérifiée. Sert entre
   deux vérifications complètes, pour les écritures que l'application vient d'ajouter. Les
   sceaux des réunions closes sont tous revus : ils se comptent en dizaines, pas en milliers. */
function verifyDepuis(avec, depuis) {
  let prev = depuis > 0 ? avec.tx[depuis - 1].hash : 'GENESE:' + avec.id;
  for (let i = depuis; i < avec.tx.length; i++) {
    const t = avec.tx[i];
    if (t.seq !== i + 1 || t.prev !== prev || sha256(payload(t)) !== t.hash)
      return { ok: false, index: i, tx: t, reason: 'Écriture n°' + (i + 1) + ' modifiée après enregistrement' };
    prev = t.hash;
  }
  for (const m of avec.meetings) {
    if (m.status !== 'closed') continue;
    const scelle = avec.tx[m.sealSeq - 1];
    if (m.sealSeq > 0 && (!scelle || scelle.hash !== m.seal))
      return { ok: false, reason: 'Le sceau de la réunion n°' + m.n + ' ne correspond plus' };
  }
  return { ok: true, n: avec.tx.length, head: prev };
}

function verifyMembres(avec) {
  const connus = new Set();
  (avec.tx || []).forEach(t => { if (t.type === 'MEMBRE' && t.memberId) connus.add(t.memberId); });
  if (!connus.size) return { ok: true, sansJournal: true };          // AVEC d'avant cette version
  const intrus = (avec.members || []).filter(m => !connus.has(m.id));
  return intrus.length
    ? { ok: false, intrus: intrus.map(m => m.name), reason: intrus.length === 1
        ? `« ${intrus[0].name} » ne figure pas dans le journal du groupe`
        : `${intrus.length} membres ne figurent pas dans le journal du groupe` }
    : { ok: true };
}

/* La dernière écriture de chaque réunion, relevée en une seule passe. Sans cela, vérifier un
   journal de fin de cycle relisait tout le journal pour chacune des réunions closes. */
function derniereEcritureParReunion(avec) {
  const d = new Map();
  for (const t of avec.tx) {
    const v = d.get(t.meetingId);
    if (v === undefined || t.seq > v.seq) d.set(t.meetingId, t);
  }
  return d;
}

function verifyChain(avec) {
  const fins = derniereEcritureParReunion(avec);
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
    const late = fins.get(m.id);
    if (late && late.seq > m.sealSeq) return { ok: false, tx: late, reason: 'Écriture ajoutée à la réunion n°' + m.n + ' après sa clôture' };
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
  /* Les totaux par type, initialisés depuis la table des types elle-même. En les écrivant à la
     main, un type nouveau donnait undefined + montant, soit NaN — et le NaN se propageait
     jusqu'à la caisse affichée. Le piège ne peut plus se reproduire. */
  const sum = {};
  Object.keys(TX).forEach(k => sum[k] = 0);
  const rep = { REPORT_IN: { social: 0, credit: 0 }, REPORT_OUT: { social: 0, credit: 0 } };
  const loans = {}, exts = {};
  let parts = 0;
  for (const t of act) {
    if (rep[t.type]) { rep[t.type][t.ref] += t.amount; continue; }
    sum[t.type] += t.amount;
    // crédit extérieur (IMF, banque…) : il renforce la caisse de crédit, mais reste une dette du groupe
    if (t.type === 'EXT_IN') exts[t.id] = { id: t.id, lender: t.note || '', ag: t.ref || '', principal: t.amount, rate: t.rate || 0, months: t.months || 1, ts: t.ts, due: Math.round(t.amount * (1 + (t.rate || 0) / 100 * (t.months || 1))), paid: 0, fees: 0, feeList: [], guar: 0, dueDate: jourDeReunion(avec, t.ts + (t.months || 1) * 30 * DAY) };
    if (t.type === 'EXT_FEE' && exts[t.ref]) { exts[t.ref].fees += t.amount; exts[t.ref].feeList.push(t); }
    if (t.type === 'EXT_REPAY' && exts[t.ref]) exts[t.ref].paid += t.amount;
    if (t.type === 'EXT_GUAR' && exts[t.ref]) exts[t.ref].guar += t.amount;
    const m = mem[t.memberId];
    if (t.type === 'EPARGNE') { parts += t.parts; if (m) { m.parts += t.parts; m.savings += t.amount; } }
    if (t.type === 'SOCIAL' && m) m.social += t.amount;
    if (t.type === 'AMENDE' && m) { m.fines += t.amount; if (t.ref === 'DETTE') m.fineDebt -= t.amount; }
    if (t.type === 'DETTE' && m) m.fineDebt += t.amount;
    if (t.type === 'CREDIT') loans[t.id] = { id: t.id, memberId: t.memberId, principal: t.amount, rate: t.rate, months: t.months, ts: t.ts, note: t.note || '', due: Math.round(t.amount * (1 + t.rate / 100 * t.months)), paid: 0, dueDate: jourDeReunion(avec, t.ts + t.months * 28 * DAY), pays: [] };
    if (t.type === 'REMB' && loans[t.ref]) { loans[t.ref].paid += t.amount; loans[t.ref].pays.push(t); }
  }
  const now = Date.now();
  const loanList = Object.values(loans).map(l => {
    l.remaining = Math.max(0, l.due - l.paid);
    l.status = l.remaining === 0 ? 'solde' : now > l.dueDate ? 'retard' : 'cours';
    l.daysLate = l.status === 'retard' ? Math.floor((now - l.dueDate) / DAY) : 0;
    // un crédit en retard continue de coûter l'intérêt du groupe, par mois commencé
    l.monthsLate = l.status === 'retard' ? Math.ceil(l.daysLate / 30) : 0;
    l.penalty = l.monthsLate ? Math.round(l.remaining * penRate(s) / 100 * l.monthsLate / 100) * 100 : 0;
    if (mem[l.memberId]) mem[l.memberId].loans.push(l);
    return l;
  }).sort((a, b) => b.ts - a.ts);
  const activeLoans = loanList.filter(l => l.status !== 'solde');
  const outstanding = activeLoans.reduce((a, l) => a + l.remaining, 0);
  const lateAmt = activeLoans.filter(l => l.status === 'retard').reduce((a, l) => a + l.remaining, 0);
  const penaltyTot = activeLoans.reduce((a, l) => a + (l.penalty || 0), 0);
  /* Capital et intérêts se suivent séparément. Un remboursement rend d'abord le capital,
     l'intérêt ensuite : « encours » est donc la créance entière, tandis que « capital encore
     dehors » est l'argent du groupe qui n'est pas rentré. Les deux chiffres ne disent pas la
     même chose, et un auditeur comme une IMF ont besoin des deux. */
  const interest = loanList.reduce((a, l) => a + Math.max(0, l.paid - l.principal), 0);
  const capitalOut = loanList.reduce((x, l) => x + l.principal, 0);
  const capitalBack = loanList.reduce((x, l) => x + Math.min(l.paid, l.principal), 0);
  const capitalDue = capitalOut - capitalBack;
  const socialFund = sum.SOCIAL + rep.REPORT_IN.social - sum.AIDE - sum.DEPENSE - rep.REPORT_OUT.social;
  const extList = Object.values(exts).map(e => {
    // la garantie déjà retenue par le prêteur éteint la fin de la dette : il ne reste à payer que le solde
    e.netIn = e.principal - e.guar;                                  // argent réellement entré dans la caisse
    e.remaining = Math.max(0, e.due - e.paid - e.guar);
    e.status = e.remaining === 0 ? 'solde' : now > e.dueDate ? 'retard' : 'cours';
    e.daysLate = e.status === 'retard' ? Math.floor((now - e.dueDate) / DAY) : 0;
    e.interestPaid = Math.max(0, e.paid + e.guar - e.principal);
    return e;
  }).sort((a, b) => b.ts - a.ts);
  const extDebt = extList.reduce((a, e) => a + e.remaining, 0);
  const loanFund = sum.EPARGNE + sum.REMB + sum.AMENDE + rep.REPORT_IN.credit + sum.EXT_IN - sum.EXT_FEE - sum.EXT_REPAY - sum.EXT_GUAR - sum.CREDIT - sum.PARTAGE - sum.DEPART - rep.REPORT_OUT.credit;
  const active = avec.members.filter(x => !x.left);
  const activeParts = active.reduce((a, x) => a + mem[x.id].parts, 0);
  const fineDebt = active.reduce((a, x) => a + Math.max(0, mem[x.id].fineDebt), 0);
  const meetings = avec.meetings.filter(m => m.status === 'closed' && (m.cycle || 1) === cyc && (!opt.syncedOnly || m.synced));
  let pres = 0, slots = 0;
  meetings.forEach(m => Object.values(m.presence || {}).forEach(p => { slots++; if (p !== 'A') pres++; }));
  const ecarts = meetings.filter(m => m.closeCount !== m.closeExpected);
  return {
    sum, rep, mem, parts: activeParts, fineDebt, cycleN: cyc, loanList, activeLoans, outstanding, lateAmt, penaltyTot, interest, socialFund, loanFund,
    extList, extDebt, extActive: extList.filter(e => e.status !== 'solde'), capitalOut, capitalBack, capitalDue,
    cash: socialFund + loanFund, par: outstanding ? lateAmt / outstanding : 0,
    meetings, last: meetings[meetings.length - 1], attendance: slots ? pres / slots : 0, ecarts,
    women: active.filter(m => m.sex === 'F').length, activeCount: active.length,
    // valeur d'une part si le partage avait lieu aujourd'hui : caisse de crédit + crédits et amendes à recouvrer − dette extérieure
    shareValue: activeParts ? (loanFund + outstanding + fineDebt - extDebt) / activeParts : s.partValue
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
  (st.extActive || []).forEach(e => {
    const left = Math.ceil((e.dueDate - Date.now()) / DAY);
    if (e.status === 'retard') push('bad', 'Crédit extérieur en retard', `${e.lender} · reste ${fc(e.remaining)} depuis le ${fdate(e.dueDate)}`);
    else if (left <= 28) push('warn', `Crédit extérieur à rembourser dans ${left} jours`, `${e.lender} · reste ${fc(e.remaining)}`);
    if (st.loanFund + st.outstanding < e.remaining) push('bad', 'Le fonds de crédit ne couvre plus la dette extérieure', `${e.lender} · reste ${fc(e.remaining)}`);
  });
  const pending = avec.tx.filter(t => !t.synced).length;
  /* Le risque n'est pas « pas synchronisé » — il n'y a rien à synchroniser — mais « rien
     n'est sorti du téléphone » : si le téléphone disparaît, ces écritures disparaissent. */
  /* Une caisse negative ne correspond a rien de reel : elle signale une reprise de cahier mal
     saisie, ou une ecriture venue d ailleurs. Mieux vaut le dire que de l afficher comme un
     solde. */
  if (st.socialFund < 0) push('bad', 'Caisse sociale négative', fc(st.socialFund) + ' : il est sorti plus que ce qui est entré');
  if (st.loanFund < 0) push('bad', 'Caisse de crédit négative', fc(st.loanFund) + ' : il est sorti plus que ce qui est entré');
  const vm = verifyMembres(avec);
  if (!vm.ok) push('bad', 'Liste des membres altérée', vm.reason);
  if (pending && daysAgo(avec.lastSync || 0) > 7)
    push('warn', 'Aucune sauvegarde récente', avec.lastSync ? `Dernière sortie du téléphone ${ago(avec.lastSync)} · ${pending} écriture(s) ne sont que sur ce téléphone`
      : `${pending} écriture(s) n'existent que sur ce téléphone, et nulle part ailleurs`);
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
    ['meetings', 'tx', 'visits', 'cycles', 'security', 'rescue', 'members', 'waitlist', 'extReqs'].forEach(k => { if (!Array.isArray(a[k])) a[k] = []; });
    if (!a.trainings || typeof a.trainings !== 'object') a.trainings = {};
    a.status = a.status || 'active';
    a.settings = Object.assign({ partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, cycleMonths: 12, frequency: 7 }, a.settings || {});
    /* Le jour de réunion n'a pas toujours été demandé. On le déduit des réunions déjà tenues —
       c'est le rythme réel du groupe — sinon du début du cycle. Sans lui, une échéance ne peut
       pas être reportée au bon jour. */
    if (!a.settings.meetingDay) {
      const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const tenues = (a.meetings || []).filter(m => m.date);
      const compte = {};
      tenues.forEach(m => { const j = new Date(m.date).getDay(); compte[j] = (compte[j] || 0) + 1; });
      const plus = Object.keys(compte).sort((x, y) => compte[y] - compte[x])[0];
      a.settings.meetingDay = JOURS_FR[plus != null ? +plus : new Date(a.cycle && a.cycle.start ? a.cycle.start : Date.now()).getDay()];
    }
    if (a.settings.penaltyRate == null) a.settings.penaltyRate = a.settings.rate;   // pénalité de retard : par défaut, le taux du crédit
    a.cycle = a.cycle || { n: 1, start: a.createdAt || Date.now() };
    if (!a.cycle.end) a.cycle.end = a.cycle.start + a.settings.cycleMonths * 30 * DAY;
    if (!a.requestCode) a.requestCode = randCode(6);
    a.members.forEach(m => { if (!m.phone) m.phone = '—'; if (m.activity == null) m.activity = ''; if (m.address == null) m.address = ''; if (!m.role) m.role = 'membre'; });
  });
  d.schema = 5;
  return d;
}
/* Reconnaît la démonstration livrée d'origine, et rien d'autre : les identifiants de la graine,
   le mode découverte, et l'organisation fictive. Au moindre doute — mode réel, un seul groupe
   inconnu, une organisation qui n'est pas celle de la graine — on ne touche à rien. */
const DEMO_IDS = ['avec1', 'avec2', 'avec3', 'avec4', 'avec5', 'avec6'];
function estDemoSemee(d) {
  if (!d || d.mode === 'prod' || !Array.isArray(d.avecs) || !d.avecs.length) return false;
  if (!d.avecs.every(a => DEMO_IDS.includes(a.id))) return false;
  return (d.orgs || []).every(o => o.id === 'org1') && (d.users || []).every(u => /^u-(org|a\d)$/.test(u.id));
}
/* ---------- le magasin : IndexedDB s'il existe, localStorage sinon ----------
   Une seule base, un seul enregistrement, dont le nom est la clé historique. Rien d'autre n'y
   est rangé : si demain il faut y mettre autre chose, ce sera un autre magasin. */
const IDB = {
  nom: 'akiba', magasin: 'cahier', base: null, dispo: null, enCours: null,
  ouvrir() {
    if (this.base) return Promise.resolve(this.base);
    if (this.dispo === false) return Promise.resolve(null);        // réponse ferme : pas de base ici
    if (this.enCours) return this.enCours;                         // une ouverture suffit pour tout le monde
    this.enCours = new Promise(resolve => {
      let rendu = false;
      /* Deux pièges, appris en essayant.
         1. Un simple délai dépassé ne doit PAS conclure qu'il n'y a pas de base : sur une machine
            chargée, le téléphone basculerait pour toute la session sur un stockage plafonné à
            5 Mo. On laisse alors « dispo » à null — « on ne sait pas encore » — et le prochain
            enregistrement réessaiera.
         2. Une base qui finit par s'ouvrir après le délai ne doit pas être perdue : on la garde
            quand elle arrive, même si l'appelant est déjà reparti sans elle. */
      const rendre = (v, ferme) => {
        if (v) this.base = v;
        if (ferme) this.dispo = !!v;
        if (!rendu) { rendu = true; resolve(v); }
      };
      setTimeout(() => rendre(null, false), 8000);
      let d;
      try { d = indexedDB.open(this.nom, 1); } catch (e) { this.enCours = null; return rendre(null, true); }
      d.onupgradeneeded = () => { try { d.result.createObjectStore(this.magasin); } catch (e) { /* déjà là */ } };
      d.onsuccess = () => rendre(d.result, true);
      d.onerror = () => { this.enCours = null; rendre(null, true); };
      d.onblocked = () => { this.enCours = null; rendre(null, true); };
    });
    return this.enCours;
  },
  async lire(cle) {
    const b = await this.ouvrir();
    if (!b) return undefined;
    return new Promise(resolve => {
      try {
        const r = b.transaction(this.magasin, 'readonly').objectStore(this.magasin).get(cle);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => resolve(undefined);
      } catch (e) { resolve(undefined); }
    });
  },
  async ecrire(cle, valeur) {
    const b = await this.ouvrir();
    if (!b) return false;
    return new Promise(resolve => {
      try {
        const t = b.transaction(this.magasin, 'readwrite');
        t.objectStore(this.magasin).put(valeur, cle);
        t.oncomplete = () => resolve(true);
        t.onerror = () => resolve(false);
        t.onabort = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  },
};

const DB = {
  aEcrire: null, enVol: null, confirme: 0, enPanne: false,
  /* Le démarrage attend d'avoir réellement lu les données avant que quoi que ce soit
     s'affiche : un écran juste après un écran faux vaut moins qu'un écran qui attend. */
  async pret() {
    let brut;
    try { brut = await IDB.lire(STORE); } catch (e) { brut = undefined; }
    if (brut) {
      try { K.data = typeof brut === 'string' ? JSON.parse(brut) : brut; } catch (e) { K.data = null; }
    }
    /* Rien dans la base : soit c'est un téléphone neuf, soit il vient d'une version qui
       rangeait tout dans localStorage. Dans ce cas on reprend ses données et on les recopie. */
    if (!K.data || !K.data.avecs) {
      this.load();
      if (IDB.dispo && K.data && K.data.avecs) { K.reprisLocal = true; await IDB.ecrire(STORE, JSON.stringify(K.data)); }
    } else {
      migrate(K.data);
      try { K.session = JSON.parse(localStorage.getItem(STORE + '.s') || 'null'); } catch (e) { K.session = null; }
    }
    DB.confirme = Date.now();
    return K.data;
  },
  load() {
    try { const raw = localStorage.getItem(STORE); if (raw) K.data = JSON.parse(raw); } catch (e) { K.data = null; }
    if (!K.data || !K.data.avecs) {
      // récupérer les vraies données laissées par une ancienne version (jamais les données de démonstration)
      for (const key of OLD_STORES) {
        try { const old = JSON.parse(localStorage.getItem(key) || 'null'); if (old && old.mode === 'prod' && Array.isArray(old.avecs)) { K.data = old; K.recovered = key; break; } } catch (e) { /* clé illisible : on passe */ }
      }
    }
    /* Akiba Suivi démarre vide : ses utilisateurs sont des professionnels, leurs données arrivent
       des groupes. Seule l'application du village est livrée avec une démonstration.
       La démonstration reste accessible par « Remettre la démo » dans le village. */
    if (!K.data || !K.data.avecs) K.data = (typeof estSuivi === 'function' && estSuivi() && typeof emptyData === 'function') ? Object.assign(emptyData(), { mode: 'demo' }) : seed();
    /* Un téléphone de suivi semé par une ancienne version garde ses groupes fictifs à vie :
       on les retire. Seulement la démonstration d'origine — identifiants de la graine, mode
       découverte, aucune écriture ajoutée par un vrai animateur — jamais de vraies données. */
    if (typeof estSuivi === 'function' && estSuivi() && typeof emptyData === 'function' && estDemoSemee(K.data)) {
      K.data = Object.assign(emptyData(), { mode: 'demo', i18n: K.data.i18n || {}, i18nV: K.data.i18nV || 0, langs: K.data.langs || [] });
      K.session = null;
      try { localStorage.setItem(STORE, JSON.stringify(K.data)); } catch (e) { /* rien */ }
    }
    migrate(K.data);
    try { K.session = JSON.parse(localStorage.getItem(STORE + '.s') || 'null'); } catch (e) { K.session = null; }
  },
  /* Rend true quand le téléphone a bien gardé l'écriture. Un échec — mémoire pleine, navigation
     privée — laissait jusqu'ici l'application tourner en mémoire sans rien dire, et tout se perdait
     à la fermeture. On le dit une fois, et l'appelant qui peut revenir en arrière le fait. */
  save() {
    const texte = JSON.stringify(K.data);
    /* la session reste dans localStorage : elle est minuscule, et l'autre onglet doit la voir */
    try { localStorage.setItem(STORE + '.s', JSON.stringify(K.session)); } catch (e) { /* sans importance */ }
    /* IDB.dispo vaut null tant que l ouverture de la base n a pas abouti. Retomber sur
       localStorage dans ce cas-la, c est decider sur une information qu on n a pas encore : la
       premiere ecriture d une session partait vers un stockage plafonne a 5 Mo alors que la base
       l aurait acceptee. On ne retombe donc que lorsqu on SAIT qu il n y a pas de base. */
    if (IDB.dispo !== false) {
      /* Une seule valeur en attente, la plus récente, et une seule transaction à la fois : deux
         enregistrements rapprochés ne peuvent pas se croiser dans le désordre, et mille
         enregistrements d'affilée n'empilent pas mille copies du cahier en mémoire. */
      DB.aEcrire = texte;
      if (!DB.enVol) {
        DB.enVol = (async () => {
          while (DB.aEcrire !== null) {
            const t = DB.aEcrire;
            DB.aEcrire = null;
            const ok = await IDB.ecrire(STORE, t);
            if (ok) { DB.confirme = Date.now(); DB.enPanne = false; }
            else if (!DB.enPanne) { DB.enPanne = true; if (typeof App !== 'undefined' && App.toast) App.toast('Le téléphone n’arrive plus à garder les écritures. Exportez vos données.'); }
          }
          DB.enVol = null;
        })();
      }
      /* un témoin pour l'onglet voisin : lui seul passe par localStorage */
      try { localStorage.setItem(STORE + '.t', String(Date.now())); } catch (e) { /* sans importance */ }
      return !DB.enPanne;
    }
    /* Pas d'IndexedDB : on garde l'ancien comportement, plafond compris, et on le dit. */
    try {
      localStorage.setItem(STORE, texte);
      DB.enPanne = false;
      DB.confirme = Date.now();
      return true;
    } catch (e) {
      if (!DB.enPanne && typeof App !== 'undefined' && App.toast) App.toast('Le téléphone n’arrive plus à garder les écritures : mémoire pleine. Exportez vos données.');
      DB.enPanne = true;
      return false;
    }
  },
  /* Attendre que tout ce qui a été demandé soit réellement écrit. Appelé quand l'application
     passe à l'arrière-plan, et par les essais qui vérifient ce qui est sur le disque. */
  async vide() {
    /* la boucle peut relancer un tour pendant qu'on l'attend : on attend jusqu'à ce qu'il ne
       reste plus rien ni en vol ni en attente */
    for (let i = 0; i < 1000 && (DB.enVol || DB.aEcrire !== null && DB.aEcrire !== undefined); i++) await (DB.enVol || Promise.resolve());
    return DB.confirme;
  },
  /* la graine passe par migrate() comme toute donnée chargée : mêmes valeurs par défaut, mêmes règles */
  reset() { K.data = seed(); migrate(K.data); K.session = null; DB.save(); }
};
const avecById = id => K.data.avecs.find(a => a.id === id);
const userById = id => K.data.users.find(u => u.id === id);
const memberOf = (avec, id) => avec.members.find(m => m.id === id);
/* Le but d'un crédit et le motif d'une aide sont écrits dans la note, suivis de la mention de
   validation. Pour un tableau, on ne garde que ce qu'a dit l'assemblée. */
const butDe = note => String(note || '').split(' · ')[0].trim();
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
/* un code se dicte et se retape d'un bloc : pas de tiret ni d'espace à recopier de travers */
const fmtCode = c => String(c).replace(/[^0-9A-Za-z]/g, '');
function randCode(n) {
  const A = 'ACDEFHJKLMNPQRTUVWXY34679', r = new Uint32Array(n);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else for (let i = 0; i < n; i++) r[i] = Math.floor(Math.random() * 1e9);
  return Array.from(r, x => A[x % A.length]).join('');
}

/* Akiba n'a pas de serveur : rien ne part jamais tout seul du téléphone. Ce qui sort, ce sont
   des fichiers — la sauvegarde chiffrée, ou le fichier de transfert vers un autre téléphone.
   Cette fonction note donc ce qui vient réellement d'être mis à l'abri dans un fichier, et
   c'est le seul moment où le compteur « à sauvegarder » retombe à zéro. Elle ne s'appelle
   jamais d'elle-même : un bouton ne peut pas sauvegarder à votre place. */
function marquerSorti(avec, comment) {
  if (!avec) return 0;
  const n = pending(avec);
  avec.tx.forEach(t => t.synced = true);
  avec.meetings.forEach(m => { if (m.status === 'closed') m.synced = true; });
  avec.lastSync = Date.now();
  avec.lastSyncKind = comment || 'fichier';
  return n;
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
    orgs: [{ id: 'org1', name: 'Mwangaza Développement', zone: 'Nord-Kivu', province: 'Nord-Kivu', territoire: 'Lubero', entite: 'territoire', secret: 'mwangaza-demo-7Q4', rescue: RESCUE_DEMO.map(c => ({ h: hashCode(c), used: false })) }],
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
      /* un signe différent par groupe : la démonstration doit montrer à quoi sert le signe,
         et six arbres verts identiques ne montrent rien */
      embleme: [{ signe: 'arbre', teinte: 'vert' }, { signe: 'epi', teinte: 'jaune' }, { signe: 'chevre', teinte: 'terre' },
        { signe: 'poisson', teinte: 'ciel' }, { signe: 'soleil', teinte: 'grenat' }, { signe: 'panier', teinte: 'nuit' }][ai % 6],
      province: 'Nord-Kivu', entite: d.terr === 'Butembo' ? 'ville' : 'territoire', secteur: d.terr === 'Lubero' ? 'Bamate' : '', groupement: '',
      createdAt: start - 14 * DAY, cycle: { n: d.p === 'late' ? 2 : 1, start, end: start + (d.p === 'ecart' ? 4 : 12) * 30 * DAY },
      settings: { partValue: d.part, maxParts: 5, socialFee: d.social, rate: d.p === 'auto' ? 5 : 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, cycleMonths: d.p === 'ecart' ? 4 : 12 },
      members, meetings: [], tx: [], visits: [], lastSync: 0,
      status: 'active', requestCode: 'DEMO' + ai + 'X', rescue: RESCUE_DEMO.map(c => ({ h: hashCode(c), used: false })), security: [],
      // formation déjà réalisée par l'animateur (démonstration) : modules 1 à 4 avant la 1re réunion, puis 5, 6 et 7
      trainings: Object.fromEntries((d.anim ? ['m1', 'm2', 'm3', 'm4'].concat(d.p === 'missed' ? [] : ['m5', 'm6'], d.p === 'late' ? ['m7'] : []) : [])
        .map((k, i) => [k, { ts: start + (i < 4 ? (i - 3) * 7 : (i - 3) * 28) * DAY, by: d.anim }])),
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
      // démonstration : crédit extérieur d'une IMF, approuvé par l'AG, avec garantie retenue et frais
      if (d.p === 'good' && w === 5) {
        const ext = appendTx(avec, { meetingId: meet.id, type: 'EXT_IN', amount: 330000, rate: 2, months: 6, note: 'IMF Tujenge Mikopo', ref: `AG du ${isoDay(date - 7 * DAY)} : 16 pour, 1 contre`, by, ts: tick() });
        appendTx(avec, { meetingId: meet.id, type: 'EXT_GUAR', ref: ext.id, amount: 30000, note: 'Garantie gardée par IMF Tujenge Mikopo', by, ts: ext.ts + 1 });
        appendTx(avec, { meetingId: meet.id, type: 'EXT_FEE', ref: ext.id, amount: 10000, note: 'Frais d\'adhésion', by, ts: tick() });
        appendTx(avec, { meetingId: meet.id, type: 'EXT_FEE', ref: ext.id, amount: 5000, note: 'Frais de dossier', by, ts: tick() });
      }
      if (d.p === 'good' && (w === 9 || w === 13)) {
        const e = stats(avec).extActive[0];
        if (e) appendTx(avec, { meetingId: meet.id, type: 'EXT_REPAY', ref: e.id, amount: Math.min(e.remaining, 56000), note: e.lender, by, ts: tick() });
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

/* Deux applications depuis la même source : « avec » dans les villages, « suivi » pour les animateurs,
   les organisations et Ubora. La cible est posée par la construction (build.js) ; sans elle, on est côté village. */
const CIBLE = (typeof window !== 'undefined' && window.AKIBA_CIBLE) || 'avec';
const estSuivi = () => CIBLE === 'suivi';
const ECRANS_SUIVI = /^(n[.]|o[.]|adm[.]|s[.]org|l[.]users)/;   // l.users : la connexion du personnel                 // animateur, organisation, administrateur
const ecranDisponible = s => estSuivi() || !ECRANS_SUIVI.test(s);
const APP_NOM = () => estSuivi() ? 'Akiba Suivi' : 'Akiba';
/* la feuille de style s'appuie dessus pour la mise en page ordinateur du suivi */
try { document.documentElement.dataset.cible = CIBLE; } catch (e) { /* hors navigateur */ }

/* Fond clair ou fond sombre : au choix de l'utilisateur, ou comme le réglage du téléphone.
   Le choix est gardé sur l'appareil ; il ne voyage pas avec les données du groupe. */
const THEME_STORE = 'kitabu.theme';
const THEMES = { auto: 'Comme le téléphone', light: 'Fond clair', dark: 'Fond sombre' };
/* Le fond sombre par défaut, et non « comme le téléphone ». Un écran sombre fatigue moins l'œil
   le soir — l'heure des réunions — et consomme moins sur les écrans OLED, ce qui compte quand on
   recharge au panneau solaire. « Comme le téléphone » et le fond clair restent à un toucher, dans
   Apparence ; un choix déjà fait par quelqu'un n'est jamais écrasé. */
const THEME_DEFAUT = 'dark';
const themeChoisi = () => { try { return THEMES[localStorage.getItem(THEME_STORE)] ? localStorage.getItem(THEME_STORE) : THEME_DEFAUT; } catch (e) { return THEME_DEFAUT; } };
function appliquerTheme(v = themeChoisi()) {
  try {
    const r = document.documentElement;
    if (v === 'auto') delete r.dataset.theme; else r.dataset.theme = v;
    const sombre = v === 'dark' || (v === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', sombre ? '#131F1B' : '#0F4D3A');
  } catch (e) { /* hors navigateur */ }
}
appliquerTheme();

const App = {
  screen: 'login', params: {}, sheet: null,
  hist: [],
  go(screen, params = {}, isBack = false) {
    if (!ecranDisponible(screen)) {                                 // espace réservé à Akiba Suivi : on reste à l'accueil
      screen = 'login'; params = {};
      setTimeout(() => this.toast('Cet espace se trouve dans l’application Akiba Suivi'), 0);
    }
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
    /* le son dit ce que le message dit, pour qui ne regarde pas l'écran ou ne sait pas lire */
    if (typeof jouerSon === 'function') { const s = sonDuMessage(msg); jouerSon(s); vibrer(s === 'erreur' ? [30, 50, 30] : 18); }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
};
function render() {
  /* Tant que le cahier n'est pas lu, il n'y a rien de vrai à montrer. La lecture passe par
     IndexedDB, donc elle n'est plus instantanée, et quelques événements du navigateur —
     l'invite d'installation, le retour de réseau, le service worker — peuvent demander un
     dessin avant. On ne dessine pas : le premier écran viendra du démarrage. */
  if (!K.data) return;
  // libre à installer et à découvrir ; un téléphone avec de vraies données doit être validé
  const locked = typeof licenceRequired === 'function' && licenceRequired() && K.data.mode === 'prod' && !(App.licence && App.licence.ok);
  const fn = locked && !/^adm\./.test(App.screen) ? SCREENS['lic.gate'] : (SCREENS[App.screen] || SCREENS.login);
  const screenHtml = fn(App.params);
  // animation d'entrée seulement quand l'écran ou la feuille change (pas à chaque touche du clavier)
  const appEl = document.getElementById('app'), key = App.screen + JSON.stringify(App.params || {});
  appEl.classList.toggle('enter', key !== render.lastKey);
  appEl.classList.toggle('sheet-enter', !!App.sheet && !render.hadSheet);
  render.lastKey = key; render.hadSheet = !!App.sheet;
  appEl.innerHTML = screenHtml + (typeof appFooter === 'function' ? appFooter(screenHtml) : '') +
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
  else if (K.session) ACT.logout();                       // écran d'accueil d'un compte : retour = quitter vers l'accueil
  else if (App.screen !== 'login') App.go('login', {}, true);
}
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
  // le voile d'une feuille ne doit pas avaler les clics à l'intérieur : sinon les cases et les boutons « Homme / Femme » ne cochent plus
  if (el.dataset.act === 'scrim' && e.target !== el) return;
  const f = ACT[el.dataset.act];
  if (f) { e.preventDefault(); f(el.dataset, el, e); }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-in]');
  if (el && INP[el.dataset.in]) INP[el.dataset.in](el, e);
});

/* ---------- pièces communes ---------- */
const avatar = m => `<span class="av ${m.sex === 'F' ? 'f' : ''}">${typeof photoDe === 'function' && photoDe(m) ? `<img src="${photoDe(m)}" alt="">` : esc(initials(m.name))}</span>`;
const stampsHtml = (n, max = 5) => `<span class="stamps" aria-label="${n} parts">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</span>`;
const topbar = (title, sub, left = '', right = '') => {
  // flèche retour et bouton de déconnexion sur tous les écrans à barre verte
  if (!left) left = `<button class="iconbtn" data-act="back" aria-label="Retour">${ic('back')}</button>`;
  if (K.session && !right.includes('data-act="logout"')) right += `<button class="iconbtn" data-act="logout" aria-label="Se déconnecter">${ic('logout')}</button>`;
  return `<header class="topbar">${left}<div class="t"><b>${esc(title)}</b><span>${sub}</span></div>${right}</header>`;
};
const backBtn = (to, extra = '') => `<button class="iconbtn" data-act="back" data-to="${to}" ${extra} aria-label="Retour">${ic('back')}</button>`;
/* La pastille ne dépend plus du réseau : le réseau ne met rien à l'abri. Elle dit une seule
   chose, celle qui compte si le téléphone tombe dans la rivière — combien d'écritures
   n'existent que là. */
function syncPill(avec) {
  const n = pending(avec);
  const label = n ? `${n} à sauvegarder` : 'Sauvegardé';
  return `<button class="sync ${n ? 'off' : ''}" data-act="syncSheet" aria-label="État de la sauvegarde"><i></i>${label}</button>`;
}
function tabbar(items, cur) {
  return `<nav class="tabbar"><div class="in">${items.map(t => `<button class="tab ${t.id === cur ? 'on' : ''}" data-act="go" data-to="${t.id}">${ic(t.icon)}${t.label}</button>`).join('')}</div></nav>`;
}
ACT.syncSheet = () => {
  const avec = K.session && K.session.avecId ? avecById(K.session.avecId) : null;
  const n = avec ? pending(avec) : 0;
  App.openSheet(`
    <h2>Sauvegarde</h2>
    <div class="alert ${n ? 'warn' : 'good'}">${icSpan(n ? 'alert' : 'shield')}<div><b>${n ? n + ' écriture' + (n > 1 ? 's' : '') + ' n\'existe' + (n > 1 ? 'nt' : '') + ' que sur ce téléphone' : 'Tout est sorti du téléphone'}</b>
      <span class="small">Akiba n'envoie rien toute seule : il n'y a pas de serveur. Vos écritures sortent du téléphone quand vous créez un <b>fichier de sauvegarde</b>, ou quand vous envoyez l'AVEC à un autre téléphone. Tant que vous ne l'avez pas fait, le cahier n'existe qu'ici.</span></div></div>
    ${avec ? `<div class="grid2"><div class="kpi"><span>À sauvegarder</span><b class="num">${n}</b></div><div class="kpi"><span>Dernière sortie</span><b style="font-size:1.05rem">${avec.lastSync ? ago(avec.lastSync) : 'jamais'}</b></div></div>
    ${avec.lastSync ? `<p class="hint">Dernière sortie du téléphone : ${fdt(avec.lastSync)}${avec.lastSyncKind ? ' (' + esc(avec.lastSyncKind) + ')' : ''}.</p>` : ''}
    <button class="btn primary block xl" data-act="backupSheet">${ic('shield')} Créer une sauvegarde</button>
    <p class="hint">Le fichier est chiffré par un mot de passe. Gardez-le ailleurs que sur ce téléphone : chez la présidente, au bureau de l'organisation, sur une carte mémoire.</p>` : ''}
    ${K.data.mode === 'prod' ? '' : `<div class="row between card"><div><b>Simuler l'absence de réseau</b><p class="hint">Démonstration : pour tester le mode village</p></div><button class="toggle ${on ? '' : 'on'}" data-act="toggleNet" aria-label="Simuler hors ligne"></button></div>`}`);
};
/* « Envoyer maintenant » n'existe plus : il n'envoyait nulle part. Le geste qui protège est la
   sauvegarde, et elle demande un mot de passe — donc une décision, pas un simple toucher. */
ACT.toggleNet = () => {
  if (K.data.mode === 'prod') return; K.data.net.online = !K.data.net.online; DB.save(); ACT.syncSheet(); };
