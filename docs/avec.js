/* Akiba AVEC — interface du groupe (bureau et membres) */
'use strict';

const parseAmt = s => parseInt(String(s ?? '').replace(/\D/g, ''), 10) || 0;
const _chain = {};
/* chainOf(avec) donne l'état du journal. Il vérifie tout la première fois, puis seulement ce
   qui a été ajouté depuis — et il garde la date de la dernière vérification complète, que
   l'écran affiche. chainOf(avec, true) force une vérification entière : c'est ce que font le
   démarrage, la clôture d'une réunion, la réception d'un cahier, le partage et le bouton
   « Vérifier maintenant ». La raison de ce partage est écrite dans le journal de ce fichier :
   trois mille hachages prennent huit secondes sur le processeur d'un terminal POS. */
function chainOf(avec, forcer) {
  const tamper = K.data.tamperV || 0;
  const c = _chain[avec.id];
  if (!forcer && c && c.tamper === tamper && c.res.ok && avec.tx.length >= c.n) {
    if (avec.tx.length === c.n) return c.res;
    const suite = verifyDepuis(avec, c.n);
    if (!suite.ok) { _chain[avec.id] = { n: avec.tx.length, tamper, quand: c.quand, res: suite }; return suite; }
    _chain[avec.id] = { n: avec.tx.length, tamper, quand: c.quand, res: Object.assign({}, c.res, { n: avec.tx.length, head: suite.head }) };
    return _chain[avec.id].res;
  }
  const res = verifyChain(avec);
  _chain[avec.id] = { n: avec.tx.length, tamper, quand: Date.now(), res };
  return res;
}
function cur() {
  const avec = avecById(K.session.avecId);
  const me = memberOf(avec, K.session.memberId);
  return { avec, me, st: stats(avec) };
}
const A_TABS = [
  { id: 'a.home', icon: 'home', label: 'Accueil' },
  { id: 'a.members', icon: 'users', label: 'Membres' },
  { id: 'a.loans', icon: 'coins', label: 'Crédits' },
  { id: 'a.journal', icon: 'book', label: 'Journal' },
  { id: 'a.more', icon: 'more', label: 'Plus' }
];
const cycleWeek = avec => Math.max(1, Math.floor((Date.now() - avec.cycle.start) / (7 * DAY)) + 1);
const aTop = (avec, sub, left = '') => topbar(avec.name, sub || `${esc(avec.village)} · cycle ${avec.cycle.n}, semaine ${cycleWeek(avec)}`, (left || `<button class="iconbtn" data-act="back" aria-label="Retour">${ic('back')}</button>`) + emblemeHtml(avec, 30), syncPill(avec));
const activeM = avec => avec.members.filter(m => !m.left);
const bureauOf = avec => activeM(avec).filter(isBureau);
const keyHolders = avec => { const k = activeM(avec).filter(m => m.key); return k.length >= 3 ? k : bureauOf(avec); };
const annulledSet = avec => new Set(avec.tx.filter(t => t.type === 'ANNUL').map(t => t.ref));

/* ---------- code secret ---------- */
function askPin(person, title, onOk) {
  App.pin = { person, title, onOk, val: '', fails: 0, lockUntil: 0 };
  App.openSheet(pinHtml());
}
function pinHtml() {
  const p = App.pin;
  return `<h2 style="text-align:center">${esc(p.title)}</h2>
    <p class="muted" style="text-align:center">${esc(p.person.name)}, tapez votre code secret</p>
    <div class="pin-dots">${[0, 1, 2, 3].map(i => `<span class="${i < p.val.length ? 'on' : ''}"></span>`).join('')}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="pinKey" data-k="${n}">${n}</button>`).join('')}
      <button class="fn" data-act="closeSheet">Annuler</button><button data-act="pinKey" data-k="0">0</button><button class="fn" data-act="pinKey" data-k="del" aria-label="Effacer">⌫</button></div>
    ${K.data.mode === 'prod' ? '' : '<p class="hint" style="text-align:center">Démonstration : les AVEC d\'exemple utilisent le code 1234</p>'}`;
}
ACT.pinKey = d => {
  const p = App.pin;
  if (!p) return;
  if (p.lockUntil > Date.now()) { App.toast('Trop d\'essais. Attendez quelques secondes.'); return; }
  if (d.k === 'del') p.val = p.val.slice(0, -1);
  else if (p.val.length < 4) p.val += d.k;
  if (p.val.length === 4) {
    if (p.val === p.person.pin) { const f = p.onOk; App.pin = null; App.sheet = null; f(); return; }
    p.fails++; p.val = '';
    if (p.fails >= 3) { p.lockUntil = Date.now() + 30000; p.fails = 0; App.toast('3 codes faux : clavier bloqué 30 secondes'); }
    else App.toast('Code incorrect');
  }
  App.sheet = pinHtml(); render();
};

/* ---------- accueil ---------- */
function meetingLi(avec, m) {
  const here = Object.values(m.presence || {}).filter(p => p !== 'A').length;
  const gap = m.closeCount - m.closeExpected;
  const chip = m.kind ? `<span class="chip brand">${m.kind === 'partage' ? 'Partage' : 'Reprise du cahier'}</span>` : m.status === 'open' ? '<span class="chip warn">En cours</span>' : gap ? `<span class="chip bad">Écart ${fc(gap)}</span>` : '<span class="chip good">Caisse juste</span>';
  return `<div class="li"><span class="av" style="border-radius:12px;font-family:var(--f-display)">${m.n}</span>
    <div class="grow"><b>${fdate(m.date)}</b><span class="small muted">${here}/${Object.keys(m.presence || {}).length} présents${m.synced || m.status === 'open' ? '' : ' · pas encore envoyée'}</span></div>${chip}</div>`;
}
/* ---------- les vignettes du cahier ----------

   La bande qui défilait ici répétait l'écran : « prochaine réunion n°15 » sous le bouton
   « Ouvrir la réunion n°15 », « fin du cycle dans 4 semaines » au-dessus d'une carte de cycle
   qui disait la même chose en jours, « journal, 600 écritures » juste avant la carte du
   journal. Neuf lignes dont sept étaient déjà là, et la seule information neuve — la formation
   — passait en dernier. Ce qui reste se lit d'un coup, en vignettes, comme sur la couverture. */

/* une vignette-geste : un signe, un mot, et ce qu'il faut savoir en petit */
const tuile = (icone, titre, sous, attrs, ton = '') =>
  `<button class="vignette geste" ${attrs}><span class="vic ${ton}">${ic(icone)}</span>
    <span class="nm">${titre}</span><span class="vl">${sous}</span></button>`;
/* une vignette-chiffre : un montant qu'on vient lire, pas un geste */
const chiffre = (nom, valeur, sous) =>
  `<div class="vignette chiffre"><span class="vk">${nom}</span><span class="vn num">${valeur}</span><span class="vl">${sous}</span></div>`;

/* ce qui n'est écrit nulle part ailleurs sur cet écran, et seulement quand cela vaut un geste */
function homeTuiles(avec, st, ch) {
  const nm = typeof nextModule === 'function' ? nextModule(avec) : null;
  const toSend = pending(avec);
  const t = [];
  if ((avec.waitlist || []).length) t.push(tuile('clip', 'Demandes de crédit', `${avec.waitlist.length} en attente, prioritaires`, 'data-act="go" data-to="a.loans"', 'or'));
  t.push(tuile(ch.ok ? 'shield' : 'alert', ch.ok ? 'Journal protégé' : 'Journal altéré !',
    ch.ok ? `${avec.tx.length} écritures scellées` : esc(ch.reason), 'data-act="go" data-to="a.journal"', ch.ok ? '' : 'mal'));
  if (typeof trainingCount === 'function') t.push(tuile('clip', 'Formation', `${trainingCount(avec)}/7 modules${nm ? ' · suite : ' + nm.t : ' · terminée'}`, 'data-act="go" data-to="t.home"'));
  t.push(tuile('sync', toSend ? 'À envoyer' : 'Tout est envoyé',
    toSend ? `${toSend} écriture${toSend > 1 ? 's' : ''} seulement sur ce téléphone` : "L'animateur a tout reçu",
    'data-act="go" data-to="dev.backup"', toSend ? 'or' : ''));
  return `<div class="grille-avec">${t.join('')}</div>`;
}
SCREENS['a.home'] = () => {
  const { avec, me, st } = cur();
  if (!isActive(avec)) return SCREENS['a.pending']();
  if (avec.movedOut) return SCREENS['a.moved']();
  if (!isBureau(me)) return SCREENS['a.member']({ id: me.id });
  const open = openMeeting(avec);
  const next = avec.meetings.reduce((a, m) => Math.max(a, m.n), 0) + 1;
  const h = health(avec, st, chainOf(avec));
  const ch = chainOf(avec);
  return `<div class="shell">${aTop(avec)}<main class="main">
    <!-- D'où vient ce cahier : un cahier reçu d'un autre téléphone est cohérent avec lui-même,
         donc impossible à distinguer d'un cahier complet. C'est le seul endroit où l'application
         peut dire qu'il ne l'est peut-être pas, et elle le dit avant tout le reste. -->
    ${envoiBloc(avec)}
    <div class="greet">${avatar(me)}<span class="grow"><b>Bonjour ${esc(me.name.split(' ')[0])}</b><span class="small muted">${roleLabel(me)} · ${fdate(Date.now())}</span></span>${open ? '<span class="chip warn">Réunion ouverte</span>' : ''}</div>
    <section class="caisse" aria-label="Caisse">
      <div class="locks" aria-hidden="true">${[1, 2, 3].map(() => `<span style="width:18px;height:18px;display:block">${ic('lock')}</span>`).join('')}</div>
      <div class="label" style="color:inherit;opacity:.8">Argent dans la caisse</div>
      <div class="big num">${grp(st.cash)}<small>FC</small></div>
      <div class="split"><div><span>Caisse de crédit</span><b class="num">${fc(st.loanFund)}</b></div><div><span>Caisse sociale</span><b class="num">${fc(st.socialFund)}</b></div></div>
    </section>
    ${open ? `<button class="btn primary block xl" data-act="go" data-to="a.meet">${ic('calendar')} Continuer la réunion n°${open.n}</button>`
      : `<button class="btn primary block xl" data-act="startMeeting">${ic('unlock')} Ouvrir la réunion n°${next}</button>`}
    <!-- Ce qu'il faut corriger passe avant ce qu'il faut lire : les alertes montent juste sous
         le bouton de la réunion, là où le regard tombe. -->
    ${h.alerts.length ? `<section class="section"><h2>À surveiller</h2>${h.alerts.map(a => `<div class="alert ${a.lvl}"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>${esc(a.title)}</b><span class="small">${esc(a.detail)}</span></div></div>`).join('')}</section>` : ''}
    <div class="grille-avec">
      ${chiffre('Épargne du cycle', fck(st.sum.EPARGNE), `${grp(st.parts)} parts`)}
      ${chiffre('Crédits à rembourser', fck(st.outstanding), `${st.activeLoans.length} crédits`)}
      ${chiffre('Présence', pct(st.attendance), `${st.meetings.length} réunions`)}
      ${chiffre("Valeur d'une part", fc(st.shareValue), `achetée ${fc(avec.settings.partValue)}`)}
    </div>
    ${cycleCard(avec, st)}
    <!-- trois réunions suffisent : au-delà, c'est le journal qu'on va chercher -->
    <section class="section"><h2>Dernières réunions</h2><div class="list">${avec.meetings.slice(-3).reverse().map(m => meetingLi(avec, m)).join('') || '<div class="li muted">Aucune réunion pour le moment</div>'}</div>
      ${avec.meetings.length > 3 ? '<button class="linkbtn" data-act="go" data-to="a.journal">Toutes les réunions, écriture par écriture</button>' : ''}</section>
    ${homeTuiles(avec, st, ch)}
  </main>${tabbar(A_TABS, 'a.home')}</div>`;
};
ACT.startMeeting = () => {
  const { avec, me } = cur();
  if (!isActive(avec)) return App.toast('L\'AVEC doit d\'abord être validée par l\'organisation');
  if (avec.movedOut) return App.toast('Cette AVEC est sur un autre téléphone : la réunion se tient là-bas');
  if (!isBureau(me)) return App.toast('Seul le bureau peut ouvrir une réunion');
  if (openMeeting(avec)) return App.go('a.meet');
  const n = avec.meetings.reduce((a, m) => Math.max(a, m.n), 0) + 1;
  const presence = {};
  activeM(avec).forEach(m => presence[m.id] = 'P');
  avec.meetings.push({ id: avec.id + '-r' + n + '-' + uid(), n, cycle: avec.cycle.n, date: Date.now(), status: 'open', presence, openedBy: me.id, stepDone: -1, synced: false });
  DB.save();
  App.go('a.meet', { step: '0' });
};

/* ---------- réunion ---------- */
const STEPS = [
  { id: 'presence', l: 'Présences' }, { id: 'ouverture', l: 'Comptage' }, { id: 'social', l: 'Sociale' }, { id: 'epargne', l: 'Épargne' },
  { id: 'remb', l: 'Rembours.' }, { id: 'credit', l: 'Crédits' }, { id: 'amende', l: 'Amendes' }, { id: 'cloture', l: 'Clôture' }
];

/* Ce que la voix dit à chaque étape de la réunion. Écrit pour être entendu : des phrases courtes,
   l'ordre des gestes, et ce qu'il ne faut pas oublier. Le secrétaire peut poser le téléphone,
   écouter, et faire — sans lire. Ce texte n'est jamais affiché : il n'existe que pour la voix. */
const VOIX_ETAPE = {
  presence: "Étape 1 sur 8 : les présences. Appelez chaque membre à haute voix. Pour chacun, touchez son nom : présent, en retard, ou absent. Un retard et une absence créent une amende, à l'étape des amendes. Quand tout le monde est appelé, touchez Suivant.",
  ouverture: "Étape 2 sur 8 : le comptage de la caisse. Ouvrez la caisse devant tout le monde. Comptez l'argent à haute voix, billet par billet. Écrivez le montant compté. Akiba le compare à ce que dit le cahier : s'il manque quelque chose, il le dit tout de suite, devant l'assemblée.",
  social: "Étape 3 sur 8 : la caisse sociale. Chaque membre présent verse sa cotisation. Touchez les noms de ceux qui ont payé. Si quelqu'un demande une aide, c'est ici : dites pourquoi, et l'assemblée décide avant d'enregistrer.",
  epargne: "Étape 4 sur 8 : l'épargne. Appelez les membres un par un. Pour chacun, touchez son nom, puis le nombre de parts qu'il achète aujourd'hui. L'argent entre dans la caisse au moment où vous enregistrez. Personne n'achète plus de parts que le règlement ne le permet.",
  remb: "Étape 5 sur 8 : les remboursements. Appelez ceux qui doivent rembourser. Pour chacun, touchez son nom et le montant qu'il apporte. Akiba calcule tout seul ce qui reste à payer et les intérêts. Un retard ajoute une pénalité : elle est proposée, l'assemblée décide.",
  credit: "Étape 6 sur 8 : les crédits. Chaque demande se dit à haute voix devant l'assemblée. Touchez le nom du membre, le montant et la durée. Akiba refuse ce que le règlement interdit et dit pourquoi. L'argent sort de la caisse devant tout le monde.",
  amende: "Étape 7 sur 8 : les amendes. Akiba propose les amendes de retard et d'absence relevées tout à l'heure. Ajoutez celles que l'assemblée décide. Chaque amende est dite à haute voix avec sa raison, et payée maintenant ou notée comme due.",
  cloture: "Étape 8 sur 8 : la clôture. Recomptez l'argent dans la caisse et écrivez ce que vous trouvez. Akiba compare avec ce qu'il attend. Puis les trois porte-clés tapent leur code secret, l'un après l'autre : la réunion est fermée et scellée. Après cela, plus personne ne peut rien changer. Remettez les reçus aux membres.",
};
const voixEtape = id => VOIX_ETAPE[id] ? `<p class="direaudio no-tr" hidden>${esc(VOIX_ETAPE[id])}</p>` : '';
function draft(key, init) { if (App.draftKey !== key) { App.draftKey = key; App.draft = init(); } return App.draft; }
const meetTx = (avec, m, types) => { const an = annulledSet(avec); return avec.tx.filter(t => t.meetingId === m.id && types.includes(t.type)).map(t => Object.assign({ annulled: an.has(t.id) }, t)); };
function txRows(avec, list, empty) {
  if (!list.length) return `<div class="li muted">${empty}</div>`;
  return list.map(t => { const mm = memberOf(avec, t.memberId);
    return `<div class="li" style="${t.annulled ? 'opacity:.5;text-decoration:line-through' : ''}">${mm ? avatar(mm) : ''}<div class="grow"><b>${esc(mm ? mm.name : '—')}</b><span class="small muted">${TX[t.type].l}${t.parts ? ' · ' + t.parts + ' parts' : ''}${t.note ? ' · ' + esc(t.note) : ''}</span></div><span class="end num">${fc(t.amount)}</span></div>`; }).join('');
}
/* mois de retard déjà facturés sur un crédit : la pénalité ne se paie jamais deux fois pour le même mois */
const penMonths = (avec, loan) => avec.tx.filter(t => t.type === 'AMENDE' && t.ref === 'PENAL:' + loan.id).reduce((a, t) => Math.max(a, t.months || 0), 0);
const doneBanner = txt => `<div class="alert good"><span style="width:22px;flex:none">${ic('check')}</span><div><b>Étape enregistrée</b><span class="small">${txt}</span></div></div>`;
const presentMembers = (avec, m) => activeM(avec).filter(x => m.presence[x.id] && m.presence[x.id] !== 'A');

/* ---------- retard ou absence justifiée ----------
   Les raisons qu'on entend vraiment dans un groupe de village, proposées d'un toucher ; le
   bureau peut toujours écrire autre chose. L'ordre suit la fréquence, pas l'alphabet. */
const MOTIFS = ['Maladie', 'Deuil dans la famille', 'Enfant malade', 'Accouchement', 'Voyage',
  'Travail aux champs', 'Marché éloigné', 'Convoqué ailleurs', 'Pluie / route coupée'];
const excuseDe = (m, id) => (m && m.excuses ? m.excuses[id] : null) || null;
const estJustifie = (m, id) => !!excuseDe(m, id);
function gapHtml(v, exp, filled) {
  if (!filled) return '';
  const g = v - exp;
  return g === 0 ? `<div class="alert good"><span style="width:22px;flex:none">${ic('check')}</span><div><b>La caisse est juste</b><span class="small">L'argent compté correspond au cahier.</span></div></div>`
    : `<div class="alert bad"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>Écart : ${fc(g)}</b><span class="small">${g < 0 ? 'Il manque de l\'argent' : 'Il y a trop d\'argent'}. L'écart sera signalé${' '}et doit être expliqué.</span></div></div>`;
}
INP.gap = el => {
  if (App.draft) App.draft[el.id] = el.value;
  const v = parseAmt(el.value), exp = +el.dataset.exp, filled = el.value.trim() !== '';
  document.getElementById(el.dataset.out).innerHTML = gapHtml(v, exp, filled);
  const wrap = document.getElementById(el.dataset.out + 'Note');
  if (wrap) wrap.hidden = !filled || v === exp;
  updateCloseBtn();
};
INP.keep = el => { if (App.draft) App.draft[el.id] = el.value; };

SCREENS['a.meet'] = p => {
  const { avec, me, st } = cur();
  const m = openMeeting(avec);
  if (!m) return SCREENS['a.home']();
  const step = p.step != null && p.step !== '' ? Math.min(+p.step, m.stepDone + 1) : Math.min(m.stepDone + 1, 7);
  const bar = `<div class="steps" role="list">${STEPS.map((s, i) => `<button class="stp ${i === step ? 'cur' : i <= m.stepDone ? 'done' : ''}" data-act="go" data-to="a.meet" data-step="${i}" ${i > m.stepDone + 1 ? 'disabled' : ''}><i>${i <= m.stepDone && i !== step ? '✓' : i + 1}</i>${s.l}</button>`).join('')}</div>`;
  return `<div class="shell">${topbar(`Réunion n°${m.n}`, `${fdate(m.date)} · étape ${step + 1} sur 8`, backBtn('a.home'), syncPill(avec))}
    <main class="main">${bar}<div class="row">${speakBtn('step' + step, '.main .direaudio, .main h2, .main > div > p.muted, .main .hint', 'Écouter cette étape', I18N.cur())}</div>${voixEtape(STEPS[step].id)}${STEP[STEPS[step].id](avec, m, st, me, step)}</main></div>`;
};
ACT.stepDone = d => {
  const { avec } = cur(); const m = openMeeting(avec);
  m.stepDone = Math.max(m.stepDone, +d.i); DB.save();
  App.go('a.meet', { step: String(+d.i + 1) });
};
const nextBtn = (i, label) => `<div class="sticky-foot"><button class="btn primary block xl" data-act="${typeof label === 'object' ? label.act : 'stepDone'}" data-i="${i}">${typeof label === 'object' ? label.text : label} ${ic('chev')}</button></div>`;

/* ---------- reprise d'une réunion à l'autre ---------- */
const lastClosedMeeting = avec => avec.meetings.filter(x => x.status === 'closed' && !x.kind && (x.cycle || 1) === avec.cycle.n).sort((a, b) => b.date - a.date)[0] || null;
function partsIn(avec, meeting, memberId) {
  if (!meeting) return 0;
  const an = annulledSet(avec);
  return avec.tx.filter(t => t.meetingId === meeting.id && t.type === 'EPARGNE' && t.memberId === memberId && !an.has(t.id)).reduce((a, t) => a + (t.parts || 0), 0);
}
const installment = l => Math.min(l.remaining, Math.ceil(l.due / l.months / 100) * 100);
function loanDueNow(l, date) {
  if (l.status === 'retard') return true;
  const last = l.pays.length ? l.pays[l.pays.length - 1].ts : l.ts;
  return date - last >= 25 * DAY;                                     // environ un mois depuis le crédit ou le dernier paiement
}
function previousCard(avec, m, st) {
  const prev = lastClosedMeeting(avec);
  if (!prev) return '';
  const absents = Object.values(prev.presence || {}).filter(v => v === 'A').length;
  const dueLoans = st.activeLoans.filter(l => loanDueNow(l, m.date));
  const debts = activeM(avec).filter(x => st.mem[x.id].fineDebt > 0);
  const gap = prev.closeCount - prev.closeExpected;
  const cell = (label, value, extra = '') => `<div><span class="small muted">${label}</span><b class="num" style="display:block">${value}</b>${extra}</div>`;
  return `<section class="card stack prev">
    <div class="row between"><span class="label">Depuis la réunion n°${prev.n}</span><span class="small muted">${fdate(prev.date)}</span></div>
    <div class="grid2">
      ${cell('Caisse fermée avec', fc(prev.closeCount), gap ? `<span class="chip bad">écart ${fc(gap)}</span>` : '')}
      ${cell('Échéances aujourd\'hui', dueLoans.length ? fc(dueLoans.reduce((a, l) => a + installment(l), 0)) : 'aucune', dueLoans.length ? `<span class="small muted">${dueLoans.length} crédit${dueLoans.length > 1 ? 's' : ''}</span>` : '')}
      ${cell('Amendes dues', debts.length ? `${debts.length} membre${debts.length > 1 ? 's' : ''}` : 'aucune')}
      ${cell('Absents la dernière fois', absents)}
    </div>
    <p class="hint">Akiba reprend la suite : parts habituelles proposées, échéances pré-remplies, amendes dues rappelées.</p>
  </section>`;
}

const STEP = {
  presence(avec, m) {
    const c = { P: 0, R: 0, A: 0 };
    Object.values(m.presence).forEach(v => c[v]++);
    const locked = m.stepDone >= 6;
    return `${m.stepDone < 1 ? previousCard(avec, m, stats(avec)) : ''}<div><h2>Qui est là ?</h2><p class="muted">Touchez pour chaque membre. Les amendes d'absence et de retard seront proposées plus tard.</p></div>
      <div class="list">${activeM(avec).filter(x => m.presence[x.id]).map(x => { const ex = excuseDe(m, x.id); return `<div class="mrow" style="flex-wrap:wrap">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">${ex ? 'Justifié : ' + esc(ex.motif) : roleLabel(x)}</span></div>
        <div class="seg">${[['P', 'Là'], ['R', 'Retard'], ['A', 'Absent']].map(([k, l]) => `<button class="${k} ${m.presence[x.id] === k ? 'on' : ''}" data-act="pres" data-id="${x.id}" data-v="${k}" ${locked ? 'disabled' : ''} aria-pressed="${m.presence[x.id] === k}">${l}</button>`).join('')}</div>
        ${m.presence[x.id] !== 'P' && !locked ? `<button class="btn sm ${ex ? 'brand' : 'ghost'}" data-act="excuseSheet" data-id="${x.id}" style="flex-basis:100%;margin-top:2px">${ic(ex ? 'check' : 'book')} ${ex ? 'Motif : ' + esc(ex.motif) : 'Donner un motif (pas d’amende)'}</button>` : ''}</div>`; }).join('')}</div>
      <div class="totals"><span>${c.P} là · ${c.R} en retard · ${c.A} absents${(() => { const n = Object.keys(m.excuses || {}).length; return n ? ' · ' + n + ' justifié' + (n > 1 ? 's' : '') : ''; })()}</span></div>
      ${nextBtn(0, m.stepDone >= 0 ? 'Suivant' : 'Valider les présences')}`;
  },
  ouverture(avec, m, st) {
    if (m.stepDone >= 1) return `${doneBanner('Caisse ouverte et comptée devant tous.')}
      <div class="grid2"><div class="kpi"><span>Selon le cahier</span><b class="num">${fc(m.openExpected)}</b></div><div class="kpi"><span>Argent compté</span><b class="num">${fc(m.openCount)}</b></div></div>
      ${gapHtml(m.openCount, m.openExpected, true)}${nextBtn(1, 'Suivant')}`;
    const dr = draft(m.id + ':open', () => ({}));
    return `<div><h2>Ouvrir la caisse</h2><p class="muted">Les trois porte-clés ouvrent la caisse devant tout le monde. Les compteurs comptent l'argent à haute voix.</p></div>
      <div class="card stack"><div class="row between"><span class="label">Selon le cahier</span><b class="num" style="font-family:var(--f-display);font-size:1.4rem">${fc(st.cash)}</b></div>
        <div class="field"><label for="openCount">Argent compté (FC)</label><input id="openCount" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0" value="${esc(dr.openCount || '')}" data-in="gap" data-exp="${st.cash}" data-out="openGap"></div>
        <div id="openGap">${gapHtml(parseAmt(dr.openCount), st.cash, (dr.openCount || '').trim() !== '')}</div>
        <div class="field" id="openGapNote" ${dr.openCount && parseAmt(dr.openCount) !== st.cash ? '' : 'hidden'}><label for="openNote">Expliquez l'écart</label><textarea id="openNote" class="input" rows="2" data-in="keep">${esc(dr.openNote || '')}</textarea></div></div>
      ${nextBtn(1, { act: 'saveOpen', text: 'Caisse comptée' })}`;
  },
  social(avec, m, st) {
    const aides = meetTx(avec, m, ['AIDE']);
    /* La caisse sociale sert à deux choses : aider un membre, et payer ce que le groupe achète.
       Les deux boutons sont côte à côte, parce que les deux sortent du même argent. */
    const aideBtn = `<button class="btn ghost block" data-act="aideSheet">${ic('hand')} Donner une aide sociale</button>
      <button class="btn ghost block" data-act="depenseSheet">${ic('clip')} Dépense du groupe (cahier, stylos…)</button>`;
    if (m.stepDone >= 2) return `${doneBanner('Cotisations sociales enregistrées.')}<div class="list">${txRows(avec, meetTx(avec, m, ['SOCIAL', 'AIDE']), 'Aucune cotisation')}</div>${aideBtn}${nextBtn(2, 'Suivant')}`;
    const here = presentMembers(avec, m);
    const dr = draft(m.id + ':social', () => { const o = {}; here.forEach(x => o[x.id] = true); return { paid: o }; });
    const n = here.filter(x => dr.paid[x.id]).length;
    return `<div><h2>Caisse sociale</h2><p class="muted">Chaque membre présent verse ${fc(avec.settings.socialFee)}. Retirez ceux qui n'ont pas payé.</p></div>
      <div class="list">${here.map(x => `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted num">${fc(avec.settings.socialFee)}</span></div><button class="toggle ${dr.paid[x.id] ? 'on' : ''}" data-act="dToggle" data-k="paid" data-id="${x.id}" aria-label="A payé" aria-pressed="${!!dr.paid[x.id]}"></button></div>`).join('')}</div>
      <div class="totals"><span>${n} cotisations</span><b class="num">${fc(n * avec.settings.socialFee)}</b></div>
      ${aides.length ? `<div class="list">${txRows(avec, aides, '')}</div>` : ''}${aideBtn}
      ${nextBtn(2, { act: 'saveSocial', text: 'Enregistrer la caisse sociale' })}`;
  },
  epargne(avec, m, st) {
    if (m.stepDone >= 3) return `${doneBanner('Parts achetées et inscrites dans chaque carnet.')}<div class="list">${txRows(avec, meetTx(avec, m, ['EPARGNE']), 'Aucune part achetée')}</div>${nextBtn(3, 'Suivant')}`;
    const here = presentMembers(avec, m);
    const dr = draft(m.id + ':ep', () => {
      const prev = lastClosedMeeting(avec), o = {};
      if (prev) here.forEach(x => { const p = partsIn(avec, prev, x.id); if (p) o[x.id] = Math.min(p, avec.settings.maxParts); });
      return { parts: o, prefilled: Object.keys(o).length > 0 };
    });
    const max = avec.settings.maxParts;
    const tot = here.reduce((a, x) => a + (dr.parts[x.id] || 0), 0);
    return `<div><h2>Achat de parts</h2><p class="muted">1 part = ${fc(avec.settings.partValue)}. Chaque membre achète de 1 à ${max} parts.</p></div>
      ${dr.prefilled ? `<div class="tip">Proposé : les mêmes parts qu'à la dernière réunion. Ajustez avec + et −.</div>` : ''}
      <div class="grid2"><button class="btn ghost" data-act="partsAll">1 part à ceux à 0</button><button class="btn ghost" data-act="partsZero">Tout remettre à 0</button></div>
      <div class="list">${here.map(x => { const n = dr.parts[x.id] || 0; return `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b>${stampsHtml(n, max)}<span class="small muted num">${n ? fc(n * avec.settings.partValue) : 'aucune part'} · total ${st.mem[x.id].parts} parts</span></div>
        <div class="pm"><button data-act="parts" data-id="${x.id}" data-d="-1" aria-label="Retirer une part">−</button><output>${n}</output><button class="plus" data-act="parts" data-id="${x.id}" data-d="1" aria-label="Ajouter une part">+</button></div></div>`; }).join('')}</div>
      <div class="totals"><span>${tot} parts</span><b class="num">${fc(tot * avec.settings.partValue)}</b></div>
      ${nextBtn(3, { act: 'saveParts', text: 'Enregistrer l\'épargne' })}`;
  },
  remb(avec, m, st) {
    if (m.stepDone >= 4) return `${doneBanner('Remboursements enregistrés.')}<div class="list">${txRows(avec, meetTx(avec, m, ['REMB']), 'Aucun remboursement')}</div>${nextBtn(4, 'Suivant')}`;
    const loans = st.activeLoans.slice().sort((a, b) => (b.status === 'retard') - (a.status === 'retard'));
    const dueToday = l => m.presence[l.memberId] !== 'A' && loanDueNow(l, m.date);
    const preTotal = loans.reduce((a, l) => a + (dueToday(l) ? installment(l) : 0), 0);
    if (!loans.length) return `<div><h2>Remboursements</h2></div><div class="card muted">Aucun crédit en cours dans le groupe.</div>${nextBtn(4, 'Suivant')}`;
    return `<div><h2>Remboursements</h2><p class="muted">Les échéances du jour sont déjà écrites. Corrigez si un membre paie moins ou plus. Le bouton « Échéance » remet le montant prévu ; « Solder » écrit tout ce qui reste, même avant la fin du crédit.</p></div>
      <div class="list">${loans.map(l => { const x = memberOf(avec, l.memberId); const abs = m.presence[x.id] === 'A'; const inst = Math.min(l.remaining, Math.ceil(l.due / l.months / 100) * 100);
        return `<div class="mrow" style="flex-wrap:wrap">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted num">Reste ${fc(l.remaining)} · fin ${fdate(l.dueDate)}</span> ${l.status === 'retard' ? `<span class="chip bad">${l.daysLate} j de retard${l.penalty ? ` · pénalité ${fc(l.penalty)}` : ''}</span>` : ''}${abs ? ' <span class="chip">absent</span>' : ''}</div>
        <div class="row" style="gap:6px"><input id="rb-${l.id}" class="input num" style="width:112px;text-align:right" inputmode="numeric" placeholder="0" data-in="rembTotal" data-max="${l.remaining}" value="${dueToday(l) ? inst : ''}" aria-label="Montant remboursé par ${esc(x.name)}"><button class="btn sm" data-act="fillInst" data-id="${l.id}" data-v="${inst}">Échéance</button>${l.remaining > inst ? `<button class="btn sm ghost" data-act="fillInst" data-id="${l.id}" data-v="${l.remaining}">Solder</button>` : ''}</div></div>`; }).join('')}</div>
      <div class="totals"><span>Total reçu</span><b class="num" id="rbTot">${fc(preTotal)}</b></div>
      ${nextBtn(4, { act: 'saveRemb', text: 'Enregistrer les remboursements' })}`;
  },
  credit(avec, m, st) {
    const list = meetTx(avec, m, ['CREDIT']);
    return `<div><h2>Nouveaux crédits</h2><p class="muted">Un membre peut emprunter jusqu'à ${avec.settings.maxMult} fois son épargne, pour ${avec.settings.maxMonths} mois au plus, à ${avec.settings.rate} % par mois. L'assemblée écoute chaque demande.</p></div>
      <div class="card row between"><span class="label">Disponible pour prêter</span><b class="num" style="font-family:var(--f-display);font-size:1.4rem">${fc(st.loanFund)}</b></div>
      <!-- Le capital à part des intérêts : « encours » est la créance entière, le capital est
           l'argent du groupe encore dehors. Un auditeur et une IMF demandent les deux. -->
      ${st.capitalDue ? `<div class="receipt stack" style="gap:4px">
        <div class="row between small"><span class="muted">Capital prêté depuis le début du cycle</span><span class="num">${fc(st.capitalOut)}</span></div>
        <div class="row between small"><span class="muted">Capital déjà rendu</span><span class="num">${fc(st.capitalBack)}</span></div>
        <div class="row between"><span class="label">Capital encore dehors</span><b class="num">${fc(st.capitalDue)}</b></div>
        <div class="row between small"><span class="muted">Dont intérêts à venir</span><span class="num">${fc(st.outstanding - st.capitalDue)}</span></div>
      </div>` : ''}
      <div class="list">${txRows(avec, list, 'Aucun crédit accordé à cette réunion')}</div>
      ${waitBlock(avec, m, st)}
      <button class="btn brand block xl" data-act="creditSheet">${ic('plus')} Accorder un crédit</button>
      ${extMeetingBlock(avec, m, st)}
      ${nextBtn(5, m.stepDone >= 5 ? 'Suivant' : 'Terminer les crédits')}`;
  },
  amende(avec, m, st) {
    const s = avec.settings;
    const extra = `<button class="btn ghost block" data-act="fineSheet">${ic('gavel')} Autre amende (bavardage, oubli…)</button>`;
    if (m.stepDone >= 6) return `${doneBanner('Amendes enregistrées.')}<div class="list">${txRows(avec, meetTx(avec, m, ['AMENDE', 'DETTE']), 'Aucune amende')}</div>${extra}${nextBtn(6, 'Suivant')}`;
    const late = activeM(avec).filter(x => m.presence[x.id] && m.presence[x.id] !== 'P');
    const debtors = presentMembers(avec, m).filter(x => st.mem[x.id].fineDebt > 0);
    // un mois de retard ne se paie qu'une fois : on regarde ce qui a déjà été facturé sur ce crédit
    const lateLoans = st.activeLoans.filter(l => l.penalty > 0 && m.presence[l.memberId] && m.presence[l.memberId] !== 'A')
      .map(l => { const done = penMonths(avec, l); return Object.assign({}, l, { doneMonths: done, dueMonths: l.monthsLate - done, penalty: Math.round(l.remaining * penRate(avec.settings) / 100 * (l.monthsLate - done) / 100) * 100 }); })
      .filter(l => l.dueMonths > 0 && l.penalty > 0);
    /* une absence justifiée n'est pas proposée à l'amende : le bureau peut toujours la remettre */
    const dr = draft(m.id + ':fine', () => { const o = {}, p = {}, pe = {}; late.forEach(x => { if (!estJustifie(m, x.id)) o[x.id] = true; }); debtors.forEach(x => p[x.id] = true); lateLoans.forEach(l => pe[l.id] = true); return { on: o, pay: p, pen: pe }; });
    if (!dr.pen) dr.pen = {};
    const penRows = lateLoans.map(l => { const x = memberOf(avec, l.memberId);
      return `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">Crédit en retard de ${l.daysLate} j · pénalité ${fc(l.penalty)} (${penRate(avec.settings)} % × ${l.dueMonths} mois sur ${fc(l.remaining)})${l.doneMonths ? ` · ${l.doneMonths} mois déjà payés` : ''}</span></div>
        <button class="toggle ${dr.pen[l.id] ? 'on' : ''}" data-act="dToggle" data-k="pen" data-id="${l.id}" aria-label="Appliquer la pénalité" aria-pressed="${!!dr.pen[l.id]}"></button></div>`; }).join('');
    const others = meetTx(avec, m, ['AMENDE']);
    const tot = late.reduce((a, x) => a + (dr.on[x.id] && m.presence[x.id] === 'R' ? s.fineLate : 0), 0) + debtors.reduce((a, x) => a + (dr.pay[x.id] ? st.mem[x.id].fineDebt : 0), 0) + lateLoans.reduce((a, l) => a + (dr.pen[l.id] ? l.penalty : 0), 0);
    return `<div><h2>Amendes</h2><p class="muted">Proposées selon les présences : absence ${fc(s.fineAbsent)}, retard ${fc(s.fineLate)}. Un absent ne paie pas aujourd'hui : son amende est notée comme dette et payée à son retour. <b>Un motif justifié n'est pas proposé à l'amende</b> — l'assemblée peut toujours en décider autrement.</p></div>
      <div class="list">${late.length ? late.map(x => { const a = m.presence[x.id] === 'A', ex = excuseDe(m, x.id); return `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">${ex ? (a ? 'Absence justifiée' : 'Retard justifié') + ' : ' + esc(ex.motif) : a ? 'Absence · dette de ' + fc(s.fineAbsent) : 'Retard · payé maintenant ' + fc(s.fineLate)}</span></div><button class="toggle ${dr.on[x.id] ? 'on' : ''}" data-act="dToggle" data-k="on" data-id="${x.id}" aria-label="Appliquer l'amende" aria-pressed="${!!dr.on[x.id]}"></button></div>`; }).join('') : '<div class="li muted">Tout le monde était à l\'heure</div>'}</div>
      ${others.length ? `<div class="list">${txRows(avec, others, '')}</div>` : ''}
      ${penRows ? `<h3>Pénalités de retard sur les crédits</h3><p class="small muted">Taux de pénalité voté dans le règlement : ${penRate(s)} % par mois commencé, sur ce qui reste à rembourser. Un mois déjà payé ne l'est jamais deux fois.</p><div class="list">${penRows}</div>` : ''}
      ${debtors.length ? `<h3>Amendes dues des réunions passées</h3><div class="list">${debtors.map(x => `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">Doit ${fc(st.mem[x.id].fineDebt)}</span></div><button class="toggle ${dr.pay[x.id] ? 'on' : ''}" data-act="dToggle" data-k="pay" data-id="${x.id}" aria-label="Paie sa dette" aria-pressed="${!!dr.pay[x.id]}"></button></div>`).join('')}</div>` : ''}
      <div class="totals"><span>Argent reçu maintenant</span><b class="num">${fc(tot)}</b></div>${extra}
      ${nextBtn(6, { act: 'saveFines', text: 'Enregistrer les amendes' })}`;
  },
  cloture(avec, m, st) {
    const dr = draft(m.id + ':close', () => ({ locks: {} }));
    const all = meetTx(avec, m, ['SOCIAL', 'EPARGNE', 'REMB', 'AMENDE', 'CREDIT', 'AIDE', 'EXT_IN', 'EXT_FEE', 'EXT_GUAR', 'EXT_REPAY']).filter(t => !t.annulled);
    const by = type => all.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0);
    const ins = ['EPARGNE', 'SOCIAL', 'REMB', 'AMENDE'].concat(by('EXT_IN') ? ['EXT_IN'] : []), outs = ['CREDIT', 'AIDE'].concat(['EXT_FEE', 'EXT_GUAR', 'EXT_REPAY'].filter(k => by(k)));
    const tIn = ins.reduce((a, k) => a + by(k), 0), tOut = outs.reduce((a, k) => a + by(k), 0);
    const holders = keyHolders(avec);
    const filled = (dr.closeCount || '').trim() !== '';
    return `<div><h2>Fermer la caisse</h2><p class="muted">Les compteurs recomptent tout l'argent. Les trois porte-clés confirment avec leur code, puis la caisse est fermée à clé.</p></div>
      <div class="card stack">
        <div class="stack" style="gap:6px">${ins.map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num" style="color:var(--good)">+ ${fc(by(k))}</b></div>`).join('')}
          ${outs.map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num" style="color:var(--bad)">− ${fc(by(k))}</b></div>`).join('')}</div>
        <div class="row between" style="border-top:1px solid var(--line);padding-top:10px"><span>Ouverture ${fc(m.openCount != null ? m.openCount : st.cash - (tIn - tOut))} ${tOut > tIn ? '−' : '+'} ${fc(Math.abs(tIn - tOut))}</span></div>
        <div class="row between"><span class="label">Doit être dans la caisse</span><b class="num" style="font-family:var(--f-display);font-size:1.5rem">${fc(st.cash)}</b></div>
        <div class="field"><label for="closeCount">Argent compté (FC)</label><input id="closeCount" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0" value="${esc(dr.closeCount || '')}" data-in="gap" data-exp="${st.cash}" data-out="closeGap"></div>
        <div id="closeGap">${gapHtml(parseAmt(dr.closeCount), st.cash, filled)}</div>
        <div class="field" id="closeGapNote" ${filled && parseAmt(dr.closeCount) !== st.cash ? '' : 'hidden'}><label for="closeNote">Expliquez l'écart (obligatoire)</label><textarea id="closeNote" class="input" rows="2" data-in="keep">${esc(dr.closeNote || '')}</textarea></div>
      </div>
      <section class="section"><h3>Les trois clés</h3>
        <div class="locks3">${holders.slice(0, 3).map(h => {
          const sub = (dr.subs || {})[h.id] ? memberOf(avec, dr.subs[h.id]) : null;
          const absent = (m.presence || {})[h.id] === 'A' || !(m.presence || {})[h.id];
          const fait = dr.locks[h.id];
          return `<button class="lock ${fait ? 'ok' : absent ? 'absent' : ''}" data-act="${fait ? 'lockPin' : absent ? 'lockAbsent' : 'lockPin'}" data-id="${h.id}">${ic(fait ? 'lock' : absent ? 'alert' : 'key')}<b>${esc(h.name.split(' ')[0])}</b><span class="small muted">${sub ? 'par ' + esc(sub.name.split(' ')[0]) : fait ? 'confirmé' : absent ? 'absent' : 'toucher'}</span></button>`;
        }).join('')}</div>
        ${holders.slice(0, 3).some(h => ((m.presence || {})[h.id] === 'A' || !(m.presence || {})[h.id]) && !dr.locks[h.id])
          ? `<p class="hint">Un porte-clé est absent : touchez sa case. L'assemblée désignera quelqu'un pour le remplacer <b>aujourd'hui seulement</b>, et la décision restera écrite dans le journal.</p>` : ''}</section>
      <div class="sticky-foot"><button id="closeBtn" class="btn primary block xl" data-act="saveClose" data-exp="${st.cash}" ${closeReady(avec) ? '' : 'disabled'}>${ic('lock')} Fermer et sceller la réunion</button></div>`;
  }
};
function closeReady(avec) {
  const dr = App.draft || {};
  const holders = keyHolders(avec).slice(0, 3);
  return (dr.closeCount || '').trim() !== '' && holders.every(h => dr.locks && dr.locks[h.id]);
}
function updateCloseBtn() {
  const b = document.getElementById('closeBtn');
  if (b) b.disabled = !closeReady(cur().avec);
}

ACT.pres = d => {
  const { avec } = cur(); const m = openMeeting(avec);
  m.presence[d.id] = d.v;
  /* revenu présent : le motif n'a plus d'objet et ne doit pas traîner dans le journal */
  if (d.v === 'P' && m.excuses && m.excuses[d.id]) delete m.excuses[d.id];
  DB.save(); render();
};
ACT.excuseSheet = d => {
  const { avec, me } = cur(); const m = openMeeting(avec); const x = memberOf(avec, d.id);
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  const ex = excuseDe(m, d.id);
  const absent = m.presence[d.id] === 'A';
  App.openSheet(`<h2>${absent ? 'Absence' : 'Retard'} de ${esc(x.name.split(' ')[0])}</h2>
    <p class="muted">Quelle est la raison de ${absent ? 'cette absence' : 'ce retard'} ? L'assemblée en décide à haute voix.
      Avec un motif, l'amende n'est pas proposée, et la raison reste écrite dans le journal.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${MOTIFS.map(t => `<button class="btn sm ${ex && ex.motif === t ? 'brand' : 'ghost'}" data-act="excuseVite" data-id="${x.id}" data-m="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="field"><label for="exM">Autre motif</label><input id="exM" class="input" value="${esc(ex && MOTIFS.indexOf(ex.motif) < 0 ? ex.motif : '')}" autocomplete="off" placeholder="Ex. réunion à l’école"></div>
    <button class="btn primary block xl" data-act="excuseSave" data-id="${x.id}">${ic('check')} Garder ce motif</button>
    ${ex ? `<button class="btn ghost block" data-act="excuseEffacer" data-id="${x.id}">Retirer le motif (l’amende redevient due)</button>` : ''}`);
};
function excuseEcrire(avec, m, x, motif, par) {
  m.excuses = m.excuses || {};
  const quoi = m.presence[x.id] === 'A' ? 'Absence justifiée' : 'Retard justifié';
  m.excuses[x.id] = { motif: motif.slice(0, 60), par: par.id, ts: Date.now() };
  /* l'amende déjà proposée dans le brouillon doit suivre la décision */
  if (App.draft && App.draft.on) delete App.draft.on[x.id];
  /* Dans le journal scellé, et pas seulement dans le journal de sécurité : un motif décide si
     de l'argent est dû, il doit être aussi infalsifiable que l'amende qu'il remplace. */
  appendTx(avec, { type: 'EXCUSE', amount: 0, memberId: x.id, meetingId: m.id, by: par.id, note: quoi + ' : ' + motif.slice(0, 60) });
  secLog(avec, quoi, x.id, motif + ' · réunion n°' + m.n + ' · par ' + par.name);
  DB.save();
}
ACT.excuseVite = d => {
  const { avec, me } = cur(); const m = openMeeting(avec); const x = memberOf(avec, d.id);
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  excuseEcrire(avec, m, x, d.m, me);
  App.closeSheet(); render(); App.toast('Motif gardé : ' + d.m);
};
ACT.excuseSave = d => {
  const { avec, me } = cur(); const m = openMeeting(avec); const x = memberOf(avec, d.id);
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  const t = (fval('exM') || '').trim();
  if (t.length < 3) return App.toast('Écrivez le motif, ou touchez l’un de ceux proposés');
  excuseEcrire(avec, m, x, t, me);
  App.closeSheet(); render(); App.toast('Motif gardé : ' + t);
};
ACT.excuseEffacer = d => {
  const { avec, me } = cur(); const m = openMeeting(avec); const x = memberOf(avec, d.id);
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  if (m.excuses) delete m.excuses[x.id];
  if (App.draft && App.draft.on) App.draft.on[x.id] = true;
  /* on n'efface pas l'écriture d'origine — le journal ne s'efface jamais — on en ajoute une */
  appendTx(avec, { type: 'EXCUSE', amount: 0, memberId: x.id, meetingId: m.id, by: me.id, note: 'Motif retiré, l’amende redevient due' });
  secLog(avec, 'Motif retiré', x.id, 'réunion n°' + m.n + ' · par ' + me.name);
  DB.save(); App.closeSheet(); render(); App.toast('Motif retiré');
};
/* Confirmer qu'un cahier reçu est bien le plus récent. C'est une décision d'assemblée, pas
   un réglage : elle est validée par un deuxième membre du bureau et reste dans le registre
   de sécurité, parce qu'elle engage tout le partage qui suivra. */
ACT.recuSheet = () => {
  const { avec } = cur();
  const r = avec.recuDe;
  if (!r) return;
  const st = stats(avec);
  App.openSheet(`<h2>D'où vient ce cahier ?</h2>
    <p class="muted">Ce cahier a été reçu d'un autre téléphone. Il est cohérent, mais il ne contient que ce que l'autre téléphone avait <b>au moment de la copie</b> : des réunions tenues après, là-bas, n'y sont pas.</p>
    <div class="receipt stack" style="gap:4px">
      <div class="row between small"><span class="muted">Copié le</span><b>${fdt(r.quand)}</b></div>
      <div class="row between small"><span class="muted">Par</span><b>${esc(r.par || '—')}</b></div>
      <div class="row between small"><span class="muted">Dernière réunion dans la copie</span><b>n°${r.reunions}</b></div>
      <div class="row between small"><span class="muted">Écritures dans la copie</span><b class="num">${r.ecritures}</b></div>
      <div class="row between small"><span class="muted">Caisse à ce moment-là</span><b class="num">${fc(r.caisse)}</b></div>
      <div class="row between"><span class="label">Aujourd'hui, sur ce téléphone</span><b class="num">${fc(st.cash)}</b></div>
    </div>
    <div class="alert warn">${icSpan('alert')}<div><b>À vérifier avant de partager</b>
      <span class="small">Demandez au porteur du téléphone précédent à quelle réunion il s'était arrêté. Si c'est bien la n°${r.reunions}, confirmez ci-dessous. Sinon, récupérez d'abord son cahier : Akiba ne peut pas inventer les réunions manquantes.</span></div></div>
    ${approverFields(avec, cur().me, 'rc')}
    <button class="btn primary block xl" data-act="recuConfirmer">${ic('check')} C'est bien le cahier le plus récent</button>
    <button class="btn ghost block" data-act="closeSheet">Pas encore vérifié</button>`);
};
ACT.recuConfirmer = () => {
  const { avec, me } = cur();
  if (!avec.recuDe) return;
  if (!isBureau(me)) return App.toast('Seul le bureau peut confirmer');
  const ap = checkApprover(avec, 'rc', null); if (!ap) return;
  avec.recuDe.confirme = Date.now();
  avec.recuDe.confirmePar = me.name + ' et ' + ap.name;
  secLog(avec, 'Cahier reçu confirmé comme le plus récent', null,
    `réunion n°${avec.recuDe.reunions} · ${me.name}, validé par ${ap.name}`);
  DB.save(); App.closeSheet(); render();
  App.toast('Confirmé. Le partage est de nouveau possible.');
};
ACT.dToggle = d => { App.draft[d.k][d.id] = !App.draft[d.k][d.id]; render(); };
ACT.parts = d => { const { avec } = cur(); const p = App.draft.parts; p[d.id] = Math.max(0, Math.min(avec.settings.maxParts, (p[d.id] || 0) + +d.d)); render(); };
ACT.partsZero = () => { App.draft.parts = {}; App.draft.prefilled = false; render(); };
ACT.partsAll = () => { const { avec } = cur(); const m = openMeeting(avec); presentMembers(avec, m).forEach(x => { if (!App.draft.parts[x.id]) App.draft.parts[x.id] = 1; }); render(); };
ACT.fillInst = d => { const el = document.getElementById('rb-' + d.id); el.value = d.v; INP.rembTotal(); };
INP.rembTotal = () => {
  let t = 0;
  document.querySelectorAll('[id^="rb-"]').forEach(i => { const v = parseAmt(i.value); t += v; i.style.borderColor = v > +i.dataset.max ? 'var(--bad)' : ''; });
  const o = document.getElementById('rbTot'); if (o) o.textContent = fc(t);
};

function finishStep(avec, m, i, msg) { m.stepDone = Math.max(m.stepDone, i); DB.save(); App.toast(msg); App.go('a.meet', { step: String(i + 1) }); }
ACT.saveOpen = () => {
  const { avec, st } = cur(); const m = openMeeting(avec); const dr = App.draft;
  if (!(dr.openCount || '').trim()) return App.toast('Écrivez le montant compté');
  const v = parseAmt(dr.openCount);
  if (v !== st.cash && !(dr.openNote || '').trim()) return App.toast('Expliquez l\'écart avant de continuer');
  Object.assign(m, { openExpected: st.cash, openCount: v, openNote: v !== st.cash ? dr.openNote.trim() : '' });
  finishStep(avec, m, 1, 'Comptage d\'ouverture enregistré');
};
ACT.saveSocial = () => {
  const { avec, me } = cur(); const m = openMeeting(avec);
  presentMembers(avec, m).filter(x => App.draft.paid[x.id]).forEach(x => appendTx(avec, { meetingId: m.id, type: 'SOCIAL', memberId: x.id, amount: avec.settings.socialFee, by: me.id }));
  finishStep(avec, m, 2, 'Caisse sociale enregistrée');
};
ACT.saveParts = () => {
  const { avec, me } = cur(); const m = openMeeting(avec); const pv = avec.settings.partValue;
  let n = 0;
  presentMembers(avec, m).forEach(x => { const p = App.draft.parts[x.id] || 0; if (p) { n += p; appendTx(avec, { meetingId: m.id, type: 'EPARGNE', memberId: x.id, parts: p, amount: p * pv, by: me.id }); } });
  finishStep(avec, m, 3, `${n} parts enregistrées (${fc(n * pv)})`);
};
ACT.saveRemb = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const rows = st.activeLoans.map(l => ({ l, v: parseAmt((document.getElementById('rb-' + l.id) || {}).value) })).filter(r => r.v > 0);
  const bad = rows.find(r => r.v > r.l.remaining);
  if (bad) return App.toast(`${memberOf(avec, bad.l.memberId).name} doit seulement ${fc(bad.l.remaining)}`);
  rows.forEach(r => appendTx(avec, { meetingId: m.id, type: 'REMB', memberId: r.l.memberId, ref: r.l.id, amount: r.v, by: me.id }));
  finishStep(avec, m, 4, `${rows.length} remboursement${rows.length > 1 ? 's' : ''} enregistré${rows.length > 1 ? 's' : ''}`);
};
ACT.saveFines = () => {
  const { avec, me } = cur(); const m = openMeeting(avec); const s = avec.settings;
  const st = stats(avec);
  presentMembers(avec, m).filter(x => App.draft.pay[x.id] && st.mem[x.id].fineDebt > 0).forEach(x =>
    appendTx(avec, { meetingId: m.id, type: 'AMENDE', ref: 'DETTE', memberId: x.id, amount: st.mem[x.id].fineDebt, note: 'Amende due payée', by: me.id }));
  // un absent ne verse rien aujourd'hui : son amende devient une dette (pas d'argent dans la caisse)
  activeM(avec).filter(x => m.presence[x.id] && m.presence[x.id] !== 'P' && App.draft.on[x.id]).forEach(x => {
    const a = m.presence[x.id] === 'A';
    appendTx(avec, { meetingId: m.id, type: a ? 'DETTE' : 'AMENDE', memberId: x.id, amount: a ? s.fineAbsent : s.fineLate, note: a ? 'Absence' : 'Retard', by: me.id });
  });
  // pénalités de retard : une amende par crédit en retard, tracée par la référence du crédit
  st.activeLoans.filter(l => l.penalty > 0 && (App.draft.pen || {})[l.id] && m.presence[l.memberId] && m.presence[l.memberId] !== 'A').forEach(l => {
    const done = penMonths(avec, l), months = l.monthsLate - done;
    const amount = Math.round(l.remaining * penRate(s) / 100 * months / 100) * 100;
    if (months > 0 && amount > 0) appendTx(avec, { meetingId: m.id, type: 'AMENDE', ref: 'PENAL:' + l.id, memberId: l.memberId, amount, months: l.monthsLate, note: `Retard de crédit · ${months} mois`, by: me.id });
  });
  finishStep(avec, m, 6, 'Amendes enregistrées');
};
/* L'assemblée, et elle seule, désigne un remplaçant. Trois règles tiennent la décision :
   le remplaçant est présent, il n'est pas déjà l'un des trois, et ce n'est pas le trésorier —
   qui garde la caisse et ne peut donc pas garder une clé. Le remplacement ne vaut que pour cette
   réunion : à la suivante, le porte-clé retrouve sa clé sans rien faire. */
ACT.lockAbsent = d => {
  const { avec } = cur(); const m = openMeeting(avec); const h = memberOf(avec, d.id);
  if (!h || !m) return;
  const tresorier = avec.members.find(x => x.role === 'tresorier');
  const trois = keyHolders(avec).slice(0, 3).map(x => x.id);
  const candidats = activeM(avec).filter(x => (m.presence || {})[x.id] && (m.presence || {})[x.id] !== 'A'
    && !trois.includes(x.id) && !(tresorier && x.id === tresorier.id)
    && !Object.values(App.draft.subs || {}).includes(x.id));
  App.openSheet(`<h2>${esc(h.name)} est absent·e</h2>
    <p class="muted">La caisse ne s'ouvre qu'à trois clés. Si un porte-clé n'est pas là, l'assemblée désigne
      quelqu'un pour le remplacer <b>pour cette réunion seulement</b> — à la prochaine, ${esc(h.name.split(' ')[0])}
      retrouve sa clé sans rien faire.</p>
    <div class="alert warn">${icSpan('alert')}<div><b>La décision est écrite</b>
      <span class="small">Le nom du remplaçant reste dans le journal scellé et sur le reçu de la réunion. Personne ne peut l'effacer.</span></div></div>
    ${candidats.length
      ? `<p class="small muted">Qui l'assemblée désigne-t-elle ? Le trésorier et les deux autres porte-clés ne peuvent pas être choisis.</p>
         <div class="list">${candidats.map(x => `<button class="li" data-act="lockSub" data-id="${h.id}" data-sub="${x.id}">${avatar(x)}
           <span class="grow"><b>${esc(x.name)}</b><span class="small muted">${roleLabel(x)}</span></span>${ic('chev')}</button>`).join('')}</div>`
      : `<div class="alert bad">${icSpan('alert')}<div><b>Personne ne peut remplacer</b><span class="small">Il faut un membre présent qui ne soit ni trésorier ni porte-clé. La réunion ne peut pas être fermée aujourd'hui : reportez-la.</span></div></div>`}
    <button class="btn ghost block" data-act="closeSheet">Annuler</button>`);
};
ACT.lockSub = d => {
  const { avec } = cur(); const h = memberOf(avec, d.id), sub = memberOf(avec, d.sub);
  if (!h || !sub) return;
  const dr = App.draft;
  askPin(sub, 'Remplacer la clé de ' + h.name.split(' ')[0], () => {
    dr.subs = dr.subs || {};
    dr.subs[h.id] = sub.id;
    dr.locks[h.id] = true;
    App.draft = dr; render();
    App.toast(`${sub.name.split(' ')[0]} remplace la clé de ${h.name.split(' ')[0]}`);
  });
};
ACT.lockPin = d => {
  const { avec } = cur(); const h = memberOf(avec, d.id);
  if (App.draft.locks[h.id]) return;
  const dr = App.draft;
  askPin(h, 'Confirmer le comptage', () => { dr.locks[h.id] = true; App.draft = dr; render(); App.toast(`Clé de ${h.name.split(' ')[0]} confirmée`); });
};
ACT.saveClose = () => {
  const { avec, st } = cur(); const m = openMeeting(avec); const dr = App.draft;
  const v = parseAmt(dr.closeCount);
  if (!closeReady(avec)) return App.toast('Il manque le comptage ou une clé');
  if (v !== st.cash && !(dr.closeNote || '').trim()) return App.toast('Expliquez l\'écart : c\'est obligatoire');
/* un remplacement se garde : qui remplaçait qui, et pourquoi. Il part avec la réunion. */
  const subs = dr.subs || {};
  Object.keys(subs).forEach(absentId => {
    const a0 = memberOf(avec, absentId), s0 = memberOf(avec, subs[absentId]);
    if (a0 && s0) secLog(avec, 'Clé remplacée', absentId, `${s0.name} a remplacé ${a0.name}, absent·e, par décision de l'assemblée (réunion n°${m.n})`);
  });
  Object.assign(m, {
    status: 'closed', closedAt: Date.now(), closeExpected: st.cash, closeCount: v, note: v !== st.cash ? dr.closeNote.trim() : '',
    validators: Object.keys(dr.locks).map(id => subs[id] || id),
    keySubs: Object.keys(subs).length ? Object.keys(subs).map(id => ({ absent: id, par: subs[id] })) : undefined,
    sealSeq: avec.tx.length, seal: avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id, stepDone: 7
  });
  if (m.openExpected === undefined) { m.openExpected = m.openCount = st.cash; }
  chainOf(avec, true);                                               // la clôture engage : on vérifie tout le journal
  DB.save();
  /* la réunion est scellée : trois notes qui montent, que toute l’assemblée entend */
  if (typeof jouerSon === 'function') { jouerSon('scelle'); vibrer([25, 60, 25, 60, 40]); }
  /* On ne marque plus rien comme « envoyé » ici : fermer une réunion ne met pas le cahier à
     l'abri. Si rien n'est sorti du téléphone depuis longtemps, l'alerte de l'accueil le dit. */
  App.go('a.receipt', { id: m.id });
};

/* ---------- feuilles : aide, crédit, amende, annulation ---------- */
const memberOptions = (list, extra = () => '') => list.map(x => `<option value="${x.id}">${esc(x.name)}${extra(x)}</option>`).join('');
const approverFields = (avec, me, idp) => `<div class="grid2"><div class="field"><label for="${idp}Ap">2e membre du bureau</label><select id="${idp}Ap" class="input">${memberOptions(bureauOf(avec).filter(b => b.id !== me.id))}</select></div>
  <div class="field"><label for="${idp}Pin">Son code</label><input id="${idp}Pin" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>`;
function checkApprover(avec, idp, excludeId) {
  const ap = memberOf(avec, document.getElementById(idp + 'Ap').value);
  if (!ap) { App.toast('Choisissez un membre du bureau'); return null; }
  if (ap.id === excludeId) { App.toast('Le bénéficiaire ne peut pas valider pour lui-même'); return null; }
  if (document.getElementById(idp + 'Pin').value !== ap.pin) { App.toast(`Code de ${ap.name.split(' ')[0]} incorrect`); return null; }
  return ap;
}
ACT.aideSheet = () => {
  const { avec, me, st } = cur();
  App.openSheet(`<h2>Aide sociale</h2><p class="muted">Disponible dans la caisse sociale : <b class="num">${fc(st.socialFund)}</b></p>
    <div class="field"><label for="aiM">Membre aidé</label><select id="aiM" class="input">${memberOptions(activeM(avec))}</select></div>
    <div class="field"><label for="aiA">Montant</label><input id="aiA" class="input bignum num" inputmode="numeric" placeholder="0"></div>
    <div class="field"><label for="aiN">Raison</label><input id="aiN" class="input" placeholder="Maladie, deuil, incendie…"></div>
    ${approverFields(avec, me, 'ai')}
    <button class="btn primary block xl" data-act="saveAide">Donner l'aide</button>`);
};
/* Une dépense du groupe : le cahier, les stylos, l'encre, le transport du secrétaire. Elle
   sort de la caisse sociale, comme le veut la pratique AVEC, et elle est validée par un
   deuxième membre du bureau — c'est de l'argent commun qui s'en va. */
ACT.depenseSheet = () => {
  const { avec, me, st } = cur();
  App.openSheet(`<h2>Dépense du groupe</h2>
    <p class="muted">Pour ce que le groupe achète : un cahier, des stylos, de l'encre, le transport du secrétaire. L'argent sort de la caisse sociale : <b class="num">${fc(st.socialFund)}</b> disponibles.</p>
    <div class="field"><label for="deA">Montant</label><input id="deA" class="input bignum num" inputmode="numeric" placeholder="0"></div>
    <div class="field"><label for="deN">Pour quoi ?</label><input id="deN" class="input" placeholder="Cahier et stylos, encre, transport…"></div>
    ${approverFields(avec, me, 'de')}
    <button class="btn primary block xl" data-act="saveDepense">Enregistrer la dépense</button>`);
};
ACT.saveDepense = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  if (!m) return App.toast('La dépense s\'enregistre pendant une réunion');
  const amount = parseAmt(document.getElementById('deA').value), note = document.getElementById('deN').value.trim();
  if (!amount) return App.toast('Écrivez le montant');
  if (!note) return App.toast('Écrivez pour quoi le groupe a dépensé');
  if (amount > st.socialFund) return App.toast(`La caisse sociale n'a que ${fc(st.socialFund)}`);
  const ap = checkApprover(avec, 'de', null); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'DEPENSE', memberId: null, amount, note: `${note} · validé par ${ap.name}`, by: me.id });
  DB.save(); App.closeSheet(); App.toast('Dépense enregistrée');
};
ACT.saveAide = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const mid = document.getElementById('aiM').value, amount = parseAmt(document.getElementById('aiA').value), note = document.getElementById('aiN').value.trim();
  if (!amount) return App.toast('Écrivez le montant');
  if (amount > st.socialFund) return App.toast('La caisse sociale n\'a pas assez d\'argent');
  if (!note) return App.toast('Écrivez la raison de l\'aide');
  const ap = checkApprover(avec, 'ai', mid); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'AIDE', memberId: mid, amount, note: `${note} · validé par ${ap.name}`, by: me.id });
  DB.save(); App.closeSheet(); App.toast('Aide enregistrée');
};
/* demandes non servies : elles passent avant tout le monde à la réunion suivante, dans l'ordre d'arrivée */
const waitQueue = avec => (avec.waitlist || []).slice().sort((a, b) => a.ts - b.ts);
function waitBlock(avec, m, st) {
  const q = waitQueue(avec);
  const rows = q.map((w, i) => {
    const x = memberOf(avec, w.memberId);
    if (!x || x.left) return '';
    const absent = m.presence[x.id] === 'A';
    const lim = loanLimit(avec, st, x.id);
    return `<div class="mrow">${avatar(x)}<div class="grow"><b>${i + 1}. ${esc(x.name)}</b><span class="small muted">Demande ${fc(w.amount)} · notée le ${fdate(w.ts)}${absent ? ' · absent aujourd\'hui' : lim.max ? '' : ' · ' + esc(lim.why.toLowerCase())}</span></div>
      <div class="row" style="gap:6px"><button class="btn sm brand" data-act="creditSheet" data-mid="${x.id}" data-amount="${w.amount}" ${absent || !lim.max ? 'disabled' : ''}>Servir</button>
      <button class="iconbtn" style="color:var(--bad)" data-act="waitDrop" data-id="${w.id}" aria-label="Retirer la demande de ${esc(x.name)}">${ic('x')}</button></div></div>`;
  }).join('');
  return `<section class="section"><h3>Demandes en attente ${q.length ? `<span class="chip warn">${q.length}</span>` : ''}</h3>
    <p class="small muted">Les membres qui n'ont pas été servis aux réunions passées sont prioritaires, dans l'ordre où ils se sont inscrits. La liste repart à zéro au partage.</p>
    <div class="list">${rows || '<div class="li muted">Aucune demande en attente</div>'}</div>
    <button class="btn ghost block" data-act="waitSheet">${ic('clip')} Noter une demande non servie</button></section>`;
}
ACT.waitSheet = () => {
  const { avec, me } = cur(); const m = openMeeting(avec);
  if (!isBureau(me)) return App.toast('Seul le bureau peut noter une demande');
  if (!m) return App.toast('La demande se note pendant une réunion');
  const here = presentMembers(avec, m).filter(x => !(avec.waitlist || []).some(w => w.memberId === x.id));
  if (!here.length) return App.toast('Toutes les personnes présentes sont déjà inscrites');
  App.openSheet(`<h2>Demande non servie</h2><p class="muted">La caisse n'a pas assez d'argent aujourd'hui ? Notez la demande : ce membre passera en premier à la prochaine réunion.</p>
    <div class="field"><label for="wtM">Membre</label><select id="wtM" class="input">${memberOptions(here)}</select></div>
    <div class="field"><label for="wtA">Montant demandé (FC)</label><input id="wtA" class="input num" inputmode="numeric" placeholder="0"></div>
    <button class="btn primary block xl" data-act="saveWait">${ic('check')} Inscrire la demande</button>`);
};
ACT.saveWait = () => {
  const { avec, me } = cur();
  const mid = document.getElementById('wtM').value, amount = parseAmt(document.getElementById('wtA').value);
  if (!amount) return App.toast('Écrivez le montant demandé');
  avec.waitlist.push({ id: uid(), memberId: mid, amount, ts: Date.now(), by: me.id });
  DB.save(); App.closeSheet(); App.toast(`Demande de ${memberOf(avec, mid).name} inscrite`);
};
ACT.waitDrop = d => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Seul le bureau peut retirer une demande');
  avec.waitlist = (avec.waitlist || []).filter(w => w.id !== d.id);
  DB.save(); render(); App.toast('Demande retirée');
};
const waitServed = (avec, memberId) => { const n = (avec.waitlist || []).length; avec.waitlist = (avec.waitlist || []).filter(w => w.memberId !== memberId); return n !== avec.waitlist.length; };
ACT.creditSheet = (d = {}) => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const here = presentMembers(avec, m);
  App.openSheet(`<h2>Accorder un crédit</h2>
    <div class="field"><label for="crM">Membre</label><select id="crM" class="input" data-in="crCalc">${memberOptions(here, x => { const l = loanLimit(avec, st, x.id); return l.max ? ` — jusqu'à ${fc(l.max)}` : ' — ' + l.why.toLowerCase(); })}</select></div>
    <div class="grid2"><div class="field"><label for="crA">Montant (FC)</label><input id="crA" class="input num" inputmode="numeric" placeholder="0" data-in="crCalc"></div>
    <div class="field"><label for="crD">Durée</label><select id="crD" class="input" data-in="crCalc">${Array.from({ length: avec.settings.maxMonths }, (_, i) => `<option value="${i + 1}">${i + 1} mois</option>`).join('')}</select></div></div>
    <div class="field"><label for="crP">Pour quoi faire ?</label><input id="crP" class="input" placeholder="Ex. petit commerce, semences"></div>
    <div id="crOut" class="receipt" aria-live="polite"></div>
    ${approverFields(avec, me, 'cr')}
    <button class="btn primary block xl" data-act="saveCredit">Accorder le crédit</button>`);
  if (d.mid) { const sel = document.getElementById('crM'); if ([...sel.options].some(o => o.value === d.mid)) sel.value = d.mid; }
  if (d.amount) document.getElementById('crA').value = d.amount;
  INP.crCalc();
};
INP.crCalc = () => {
  const { avec, st } = cur();
  const mid = document.getElementById('crM').value;
  const a = parseAmt(document.getElementById('crA').value), mo = +document.getElementById('crD').value;
  const lim = loanLimit(avec, st, mid);
  const interest = Math.round(a * avec.settings.rate / 100 * mo);
  document.getElementById('crOut').innerHTML = `<div class="stack" style="gap:6px">
    <div class="row between"><span>Maximum permis</span><b class="num">${fc(lim.max)}</b></div><p class="hint">${esc(lim.why)}</p>
    ${a ? `<div class="row between"><span>Intérêt (${avec.settings.rate} % × ${mo} mois)</span><b class="num">${fc(interest)}</b></div>
    <div class="row between"><span>Total à rembourser</span><b class="num" style="font-family:var(--f-display);font-size:1.25rem">${fc(a + interest)}</b></div>
    <div class="row between small muted"><span>Chaque mois (4 réunions)</span><span class="num">${fc(Math.ceil((a + interest) / mo / 100) * 100)}</span></div>
    ${a > lim.max ? '<div class="chip bad">Montant trop élevé</div>' : ''}` : ''}</div>`;
};
ACT.saveCredit = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const mid = document.getElementById('crM').value;
  const a = parseAmt(document.getElementById('crA').value), mo = +document.getElementById('crD').value;
  const purpose = document.getElementById('crP').value.trim();
  const lim = loanLimit(avec, st, mid);
  if (!lim.max) return App.toast(lim.why);
  if (a < 1000) return App.toast('Écrivez le montant du crédit');
  if (a > lim.max) return App.toast(`Maximum permis : ${fc(lim.max)}`);
  if (!purpose) return App.toast('Écrivez à quoi servira le crédit');
  if (Date.now() + mo * 28 * DAY > avec.cycle.end) return App.toast(`Le crédit doit être remboursé avant la fin du cycle (${fdate(avec.cycle.end)}). Choisissez une durée plus courte.`);
  const ap = checkApprover(avec, 'cr', mid); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'CREDIT', memberId: mid, amount: a, months: mo, rate: avec.settings.rate, note: `${purpose} · 2e validation ${ap.name}`, by: me.id });
  const wasWaiting = waitServed(avec, mid);
  DB.save(); App.closeSheet(); App.toast(`Crédit de ${fc(a)} accordé à ${memberOf(avec, mid).name}${wasWaiting ? ' (demande en attente servie)' : ''}`);
};
ACT.fineSheet = () => {
  const { avec } = cur();
  App.openSheet(`<h2>Autre amende</h2>
    <div class="field"><label for="fiM">Membre</label><select id="fiM" class="input">${memberOptions(activeM(avec))}</select></div>
    <div class="grid2"><div class="field"><label for="fiA">Montant</label><input id="fiA" class="input num" inputmode="numeric" placeholder="200"></div>
    <div class="field"><label for="fiN">Raison</label><select id="fiN" class="input"><option>Bavardage</option><option>Téléphone en réunion</option><option>Oubli du carnet</option><option>Non-respect du règlement</option></select></div></div>
    <button class="btn primary block xl" data-act="saveFine">Enregistrer l'amende</button>`);
};
ACT.saveFine = () => {
  const { avec, me } = cur(); const m = openMeeting(avec);
  const amount = parseAmt(document.getElementById('fiA').value);
  if (!amount) return App.toast('Écrivez le montant');
  appendTx(avec, { meetingId: m.id, type: 'AMENDE', memberId: document.getElementById('fiM').value, amount, note: document.getElementById('fiN').value, by: me.id });
  DB.save(); App.closeSheet(); App.toast('Amende enregistrée');
};
ACT.annulSheet = d => {
  const { avec, me } = cur(); const t = avec.tx.find(x => x.id === d.id); const mm = memberOf(avec, t.memberId);
  App.openSheet(`<h2>Annuler une écriture</h2>
    <div class="receipt"><b>${TX[t.type].l} · ${fc(t.amount)}</b><p class="small muted">${esc(mm ? mm.name : '')} · écriture n°${t.seq}</p></div>
    <p class="hint">L'écriture n'est jamais effacée : une écriture d'annulation est ajoutée au journal, visible par tous, avec la raison.</p>
    <div class="field"><label for="anN">Raison de l'annulation</label><input id="anN" class="input" placeholder="Ex. erreur de montant"></div>
    ${approverFields(avec, me, 'an')}
    <button class="btn danger block xl" data-act="saveAnnul" data-id="${t.id}">Annuler cette écriture</button>`);
};
ACT.saveAnnul = d => {
  const { avec, me } = cur(); const m = openMeeting(avec); const t = avec.tx.find(x => x.id === d.id);
  const note = document.getElementById('anN').value.trim();
  if (!m || t.meetingId !== m.id) return App.toast('On ne peut annuler que pendant la réunion en cours');
  if (!note) return App.toast('Écrivez la raison');
  const ap = checkApprover(avec, 'an', null); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'ANNUL', memberId: t.memberId, ref: t.id, amount: t.amount, note: `${note} · validé par ${ap.name}`, by: me.id });
  DB.save(); App.closeSheet(); App.toast('Écriture annulée (visible dans le journal)');
};

/* ---------- reçu de réunion ---------- */
SCREENS['a.receipt'] = p => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === p.id);
  if (!m) return SCREENS['a.home']();            // lien périmé : on revient à l'accueil plutôt qu'un écran blanc
  const gap = m.closeCount - m.closeExpected;
  const an = annulledSet(avec);
  const list = avec.tx.filter(t => t.meetingId === m.id && t.type !== 'ANNUL' && !an.has(t.id));
  const s = k => list.filter(t => t.type === k).reduce((a, t) => a + t.amount, 0);
  return `<div class="shell">${aTop(avec, 'Réunion fermée')}<main class="main">
    <div class="alert good"><span style="width:26px;flex:none">${ic('lock')}</span><div><b>Réunion n°${m.n} fermée et scellée</b><span class="small">Plus personne ne peut modifier ces écritures.</span></div></div>
    <div class="receipt stack">
      <div class="row between"><span class="label">Reçu de réunion</span><span class="small muted">${fdt(m.closedAt)}</span></div>
      ${['EPARGNE', 'SOCIAL', 'REMB', 'AMENDE', 'CREDIT', 'AIDE', 'EXT_IN', 'EXT_FEE', 'EXT_REPAY'].filter(k => !/^EXT_/.test(k) || s(k)).map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num">${fc(s(k))}</b></div>`).join('')}
      <div class="row between" style="border-top:1px dashed var(--line);padding-top:8px"><span>Argent compté</span><b class="num">${fc(m.closeCount)}</b></div>
      ${gap ? `<div class="chip bad">Écart ${fc(gap)} — ${esc(m.note)}</div>` : '<div class="chip good">Caisse juste</div>'}
      <div class="small muted">Clés : ${m.validators.map(id => esc(memberOf(avec, id).name)).join(', ')}</div>
      <div><span class="label">Sceau</span><div class="mono" style="word-break:break-all">${m.seal.slice(0, 32).replace(/(.{4})/g, '$1 ')}</div></div>
    </div>
    <button class="btn brand block xl" data-act="go" data-to="a.receipts" data-id="${m.id}">${ic('clip')} Reçus des membres</button>
    <!-- Le papier est la seule sauvegarde qui survit à un téléphone perdu, volé, noyé ou cassé.
         On le recommande à chaque clôture, en disant pourquoi — pas comme une option de plus. -->
    <div class="alert">${icSpan('shield')}<div><b>Imprimez le journal de cette séance</b>
      <span class="small">Si le téléphone est perdu, volé ou cassé, ce papier est ce qui reste du cahier.
        Gardez-le dans la caisse, avec les trois clés : il reprend chaque écriture, les totaux et le sceau.</span>
      <button class="btn sm brand" style="margin-top:9px" data-act="journalReunionVoir" data-m="${m.id}">${ic('clip')} Journal de la séance</button></div></div>
    <button class="btn primary block xl" data-act="go" data-to="a.home">Retour à l'accueil</button>
  </main></div>`;
};

/* ---------- membres & carnet ---------- */
SCREENS['a.members'] = () => {
  const { avec, st } = cur();
  const rows = avec.members.slice().sort((a, b) => (!!a.left - !!b.left) || st.mem[b.id].parts - st.mem[a.id].parts);
  return `<div class="shell">${aTop(avec)}<main class="main">
    <div class="row between"><h1>Membres</h1><span class="chip brand">${st.activeCount} · ${st.women} femmes</span></div>
    <div class="grid2"><button class="btn ghost" data-act="addMemberSheet">${ic('plus')} Ajouter un membre</button>
      <button class="btn ghost" data-act="go" data-to="a.cards">${ic('clip')} Cartes des membres</button></div>
    <div class="list">${rows.map(x => { const d = st.mem[x.id]; const l = d.loans.find(y => y.status !== 'solde');
      /* Les parts ne sont pas répétées ici : l'épargne affichée à droite, c'est exactement les
         parts multipliées par leur valeur. Deux fois le même fait fait hésiter sur ce qu'on lit.
         Le compte de parts reste sur le carnet du membre, où il sert au partage. */
      return `<button class="li" data-act="go" data-to="a.member" data-id="${x.id}">${avatar(x)}<span class="grow"><b>${esc(x.name)}</b><span class="small muted">${x.left ? 'A quitté le groupe' : roleLabel(x)}${l ? ` · <b style="color:var(--${l.status === 'retard' ? 'bad' : 'warn'})">crédit ${fck(l.remaining)}</b>` : ''}</span></span>
      <span class="end"><span class="num">${fc(d.savings)}</span><span class="small muted">épargne</span></span></button>`; }).join('')}</div>
  </main>${tabbar(A_TABS, 'a.members')}</div>`;
};
SCREENS['a.member'] = p => {
  const { avec, me, st } = cur();
  const x = memberOf(avec, p.id) || me;
  const self = !isBureau(me);
  const d = st.mem[x.id];
  const an = annulledSet(avec);
  const hist = avec.tx.filter(t => t.memberId === x.id && t.type !== 'ANNUL').reverse().slice(0, 25);
  const closed = avec.meetings.filter(m => m.status === 'closed').slice(-12);
  const byMeet = {};
  avec.tx.forEach(t => { if (t.type === 'EPARGNE' && t.memberId === x.id && !an.has(t.id)) byMeet[t.meetingId] = (byMeet[t.meetingId] || 0) + t.parts; });
  const left = self ? '' : backBtn('a.members');
  const right = self ? `<button class="iconbtn" data-act="logout" aria-label="Quitter">${ic('logout')}</button>` : syncPill(avec);
  return `<div class="shell">${topbar(self ? 'Mon carnet' : 'Carnet de membre', esc(avec.name), left, right)}<main class="main">
    <div class="row">${avatar(x)}<div><h1 style="font-size:1.5rem">${esc(x.name)}</h1><span class="muted small">${roleLabel(x)}${ageOf(x) ? ' · ' + ageOf(x) + ' ans' : ''}${x.activity ? ' · ' + esc(x.activity) : ''}</span></div></div>
    <section class="caisse"><div class="label" style="color:inherit;opacity:.8">Mon épargne</div><div class="big num">${grp(d.savings)}<small>FC</small></div>
      <div class="split"><div><span>Parts achetées</span><b class="num">${d.parts}</b></div><div><span>Valeur estimée si partage</span><b class="num">${fc(d.parts * st.shareValue)}</b></div></div></section>
    <div class="row">${speakBtn('carnet', '.main h1, .caisse .label, .caisse .big, .caisse .split span, .caisse .split b', 'Écouter mon carnet', I18N.cur())}</div>
    ${typeof reveCarte === 'function' ? reveCarte(avec, st, x, self || isBureau(me)) : ''}
    <section class="section"><h2>Timbres d'épargne</h2><div class="card" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">
      ${closed.map(m => { const n = byMeet[m.id] || 0; return `<div style="text-align:center"><div class="small muted">R${m.n}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;justify-items:center;margin-top:3px">${Array.from({ length: 5 }, (_, i) => `<span style="width:9px;height:9px;border-radius:50%;${i < n ? 'background:var(--maize)' : 'border:1.5px solid var(--line)'}"></span>`).join('')}</div></div>`; }).join('') || '<span class="muted">Pas encore de réunion</span>'}
    </div></section>
    <section class="section"><h2>Crédits</h2>${d.loans.length ? `<div class="list">${d.loans.map(l => loanLi(avec, l, false)).join('')}</div>` : '<div class="card muted">Aucun crédit</div>'}</section>
    <div class="grid2"><div class="kpi"><span>Caisse sociale versée</span><b class="num">${fc(d.social)}</b></div><div class="kpi"><span>Amendes payées</span><b class="num">${fc(d.fines)}</b></div></div>
    ${memberInfo(x)}
    ${memberActions(avec, me, x, d)}
    <section class="section"><h2>Historique</h2><div class="list">${hist.map(t => `<div class="li" style="${an.has(t.id) ? 'opacity:.5;text-decoration:line-through' : ''}"><span class="grow"><b>${TX[t.type].l}${t.parts ? ' · ' + t.parts + ' parts' : ''}</b><span class="small muted">${fdate(t.ts)}${t.note ? ' · ' + esc(t.note) : ''}</span></span><span class="end num" style="color:${TX[t.type].in ? 'var(--ink)' : 'var(--warn)'}">${fc(t.amount)}</span></div>`).join('') || '<div class="li muted">Rien pour le moment</div>'}</div></section>
  </main>${self ? '' : tabbar(A_TABS, 'a.members')}</div>`;
};
function loanLi(avec, l, withName = true) {
  const x = memberOf(avec, l.memberId);
  const prog = Math.min(1, l.paid / l.due);
  const chip = l.status === 'solde' ? '<span class="chip good">Soldé</span>' : l.status === 'retard' ? `<span class="chip bad">${l.daysLate} j de retard</span>` : `<span class="chip warn">Fin ${fdate(l.dueDate)}</span>`;
  return `<div class="li" style="flex-wrap:wrap">${withName ? avatar(x) : ''}<div class="grow"><b>${withName ? esc(x.name) : fc(l.principal) + ' sur ' + l.months + ' mois'}</b>
    <!-- un seul nombre à lire : ce qui reste. La barre dit déjà la part remboursée, et « reste »
         est la seule somme qu'on réclame à la réunion — l'afficher trois fois ne l'éclaircit pas. -->
    <span class="small muted num">${withName ? 'emprunté ' + fc(l.principal) : 'remboursé ' + fc(l.paid) + ' / ' + fc(l.due)}</span>
    <div class="bar" style="margin-top:6px"><i style="width:${Math.round(prog * 100)}%;${l.status === 'retard' ? 'background:var(--bad)' : ''}"></i></div></div>
    <div class="end">${chip}<br><span class="num small">reste ${fc(l.remaining)}</span></div></div>`;
}
SCREENS['a.loans'] = () => {
  const { avec, st } = cur();
  const act = st.activeLoans.slice().sort((a, b) => b.daysLate - a.daysLate);
  const done = st.loanList.filter(l => l.status === 'solde');
  return `<div class="shell">${aTop(avec)}<main class="main">
    <h1>Crédits</h1>
    <div class="grille-avec">
      ${chiffre('À rembourser', fck(st.outstanding), `${act.length} crédits en cours`)}
      ${st.lateAmt ? `<div class="vignette chiffre mal"><span class="vk">En retard</span><span class="vn num">${fck(st.lateAmt)}</span><span class="vl">PAR ${pct(st.par)}</span></div>`
        : chiffre('En retard', 'Aucun', 'tous les crédits sont à jour')}
      ${chiffre('Intérêts gagnés', fck(st.interest), 'pour le partage')}
      ${chiffre('Disponible', fck(st.loanFund), 'caisse de crédit')}
    </div>
    <section class="section"><h2>En cours</h2><div class="list">${act.map(l => loanLi(avec, l)).join('') || '<div class="li muted">Aucun crédit en cours</div>'}</div></section>
    ${extLoansSection(avec, st)}
    ${done.length ? `<section class="section"><h2>Soldés</h2><div class="list">${done.slice(0, 15).map(l => loanLi(avec, l)).join('')}</div></section>` : ''}
  </main>${tabbar(A_TABS, 'a.loans')}</div>`;
};

/* ---------- journal ---------- */
SCREENS['a.journal'] = p => {
  const { avec, me } = cur();
  const ch = chainOf(avec);
  const an = annulledSet(avec);
  const open = openMeeting(avec);
  const limit = p.all ? avec.tx.length : 60;
  const rows = avec.tx.slice(-limit).reverse();
  const brokenId = ch.ok ? null : ch.tx && ch.tx.id;
  return `<div class="shell">${aTop(avec)}<main class="main">
    <h1>Journal</h1>
    <div class="alert ${ch.ok ? 'good' : 'bad'}"><span style="width:26px;flex:none">${ic(ch.ok ? 'shield' : 'alert')}</span><div>
      <b>${ch.ok ? `Journal intact · ${ch.n} écritures` : 'Fraude détectée'}</b>
      <span class="small">${ch.ok ? 'Chaque écriture porte l\'empreinte de la précédente. Changer un seul chiffre casse la chaîne.' : esc(ch.reason) + '. L\'animateur et l\'organisation voient cette alerte.'}</span></div></div>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn sm" data-act="verifyNow">${ic('shield')} Vérifier maintenant</button>
      <button class="btn sm brand" data-act="journalSheet">${ic('clip')} Imprimer le journal</button>
      ${K.data.mode === 'prod' ? '' : K.data.tamper ? `<button class="btn sm brand" data-act="untamper">Annuler la fraude simulée</button>` : `<button class="btn sm danger" data-act="tamper">Simuler une fraude</button>`}
    </div>
    <div class="list">${rows.map(t => { const mm = memberOf(avec, t.memberId); const canAnnul = open && t.meetingId === open.id && t.type !== 'ANNUL' && !an.has(t.id) && isBureau(me);
      return `<div class="li" style="${t.id === brokenId ? 'background:var(--bad-soft)' : ''}">
        <span class="mono muted" style="width:38px;flex:none">#${t.seq}</span>
        <span class="grow" style="${an.has(t.id) ? 'text-decoration:line-through;opacity:.55' : ''}"><b>${TX[t.type].l}${mm ? ' · ' + esc(mm.name) : ''}</b>
          <span class="small muted">${fdt(t.ts)}${t.note ? ' · ' + esc(t.note) : ''}</span>
          <span class="mono muted" style="display:block">${t.hash.slice(0, 12)}${t.synced ? '' : ' · non envoyé'}</span></span>
        <span class="end"><span class="num" style="color:${TX[t.type].in === null ? 'var(--ink-2)' : TX[t.type].in ? 'var(--good)' : 'var(--bad)'}">${TX[t.type].in === null ? '' : TX[t.type].in ? '+' : '−'}${fc(t.amount)}</span>
          ${canAnnul ? `<br><button class="btn sm ghost" style="min-height:30px;margin-top:4px" data-act="annulSheet" data-id="${t.id}">Annuler</button>` : ''}</span></div>`; }).join('')}</div>
    ${!p.all && avec.tx.length > limit ? `<button class="btn ghost block" data-act="go" data-to="a.journal" data-all="1">Voir les ${avec.tx.length} écritures</button>` : ''}
  </main>${tabbar(A_TABS, 'a.journal')}</div>`;
};
/* Depuis quand le journal a-t-il été vérifié en entier ? L'écran de sécurité le dit : une
   vérification qui date de la semaine dernière ne vaut pas celle d'il y a une minute. */
const chainQuand = avec => (_chain[avec.id] || {}).quand || 0;
ACT.verifyNow = () => { const { avec } = cur(); const r = chainOf(avec, true); render(); App.toast(r.ok ? `Vérifié : ${r.n} écritures intactes` : 'Attention : ' + r.reason); };
ACT.tamper = () => {
  if (K.data.mode === 'prod') return;   // démonstration seulement
  const { avec } = cur();
  const t = avec.tx[Math.floor(avec.tx.length * .6)];
  K.data.tamper = { avecId: avec.id, id: t.id, amount: t.amount };
  t.amount += 5000;
  K.data.tamperV = (K.data.tamperV || 0) + 1;
  DB.save(); render();
  App.toast(`Montant de l'écriture n°${t.seq} changé en cachette (+5 000 FC)`);
};
ACT.untamper = () => {
  const tp = K.data.tamper; const avec = avecById(tp.avecId);
  const t = avec.tx.find(x => x.id === tp.id); if (t) t.amount = tp.amount;
  K.data.tamper = null; K.data.tamperV = (K.data.tamperV || 0) + 1;
  DB.save(); render(); App.toast('Écriture restaurée');
};

/* « Plus », partage, cycles et gestion des membres : voir cycle.js */
ACT.logout = () => { K.session = null; DB.save(); App.go('login'); };
