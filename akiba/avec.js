/* Akiba AVEC — interface du groupe (bureau et membres) */
'use strict';

const parseAmt = s => parseInt(String(s ?? '').replace(/\D/g, ''), 10) || 0;
const _chain = {};
function chainOf(avec) {
  const key = avec.tx.length + ':' + (K.data.tamperV || 0);
  const c = _chain[avec.id];
  if (c && c.key === key) return c.res;
  const res = verifyChain(avec);
  _chain[avec.id] = { key, res };
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
const aTop = (avec, sub, left = '') => topbar(avec.name, sub || `${esc(avec.village)} · cycle ${avec.cycle.n}, semaine ${cycleWeek(avec)}`, left, syncPill(avec));
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
    <p class="muted">Bonjour ${esc(me.name.split(' ')[0])} · ${roleLabel(me)}</p>
    <section class="caisse" aria-label="Caisse">
      <div class="locks" aria-hidden="true">${[1, 2, 3].map(() => `<span style="width:18px;height:18px;display:block">${ic('lock')}</span>`).join('')}</div>
      <div class="label" style="color:inherit;opacity:.8">Argent dans la caisse</div>
      <div class="big num">${grp(st.cash)}<small>FC</small></div>
      <div class="split"><div><span>Caisse de crédit</span><b class="num">${fc(st.loanFund)}</b></div><div><span>Caisse sociale</span><b class="num">${fc(st.socialFund)}</b></div></div>
    </section>
    ${open ? `<button class="btn primary block xl" data-act="go" data-to="a.meet">${ic('calendar')} Continuer la réunion n°${open.n}</button>`
      : `<button class="btn primary block xl" data-act="startMeeting">${ic('unlock')} Ouvrir la réunion n°${next}</button>`}
    <div class="grid2">
      <div class="kpi"><span>Épargne du cycle</span><b class="num">${fck(st.sum.EPARGNE)}</b><span class="num">${grp(st.parts)} parts</span></div>
      <div class="kpi"><span>Crédits à rembourser</span><b class="num">${fck(st.outstanding)}</b><span>${st.activeLoans.length} crédits</span></div>
      <div class="kpi"><span>Présence</span><b class="num">${pct(st.attendance)}</b><span>${st.meetings.length} réunions</span></div>
      <div class="kpi"><span>Valeur d'une part</span><b class="num">${fc(st.shareValue)}</b><span>achetée ${fc(avec.settings.partValue)}</span></div>
    </div>
    ${cycleCard(avec, st)}
    ${h.alerts.length ? `<section class="section"><h2>À surveiller</h2>${h.alerts.map(a => `<div class="alert ${a.lvl}"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>${esc(a.title)}</b><span class="small">${esc(a.detail)}</span></div></div>`).join('')}</section>` : ''}
    <section class="section"><h2>Dernières réunions</h2><div class="list">${avec.meetings.slice(-5).reverse().map(m => meetingLi(avec, m)).join('') || '<div class="li muted">Aucune réunion pour le moment</div>'}</div></section>
    <button class="li card" data-act="go" data-to="a.journal" style="border-radius:var(--r)">
      <span style="width:28px;flex:none;color:${ch.ok ? 'var(--good)' : 'var(--bad)'}">${ic(ch.ok ? 'shield' : 'alert')}</span>
      <span class="grow"><b>${ch.ok ? 'Journal protégé' : 'Journal altéré !'}</b><span class="small muted">${ch.ok ? `${avec.tx.length} écritures scellées, aucune modification` : esc(ch.reason)}</span></span>${ic('chev')}</button>
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
function draft(key, init) { if (App.draftKey !== key) { App.draftKey = key; App.draft = init(); } return App.draft; }
const meetTx = (avec, m, types) => { const an = annulledSet(avec); return avec.tx.filter(t => t.meetingId === m.id && types.includes(t.type)).map(t => Object.assign({ annulled: an.has(t.id) }, t)); };
function txRows(avec, list, empty) {
  if (!list.length) return `<div class="li muted">${empty}</div>`;
  return list.map(t => { const mm = memberOf(avec, t.memberId);
    return `<div class="li" style="${t.annulled ? 'opacity:.5;text-decoration:line-through' : ''}">${mm ? avatar(mm) : ''}<div class="grow"><b>${esc(mm ? mm.name : '—')}</b><span class="small muted">${TX[t.type].l}${t.parts ? ' · ' + t.parts + ' parts' : ''}${t.note ? ' · ' + esc(t.note) : ''}</span></div><span class="end num">${fc(t.amount)}</span></div>`; }).join('');
}
const doneBanner = txt => `<div class="alert good"><span style="width:22px;flex:none">${ic('check')}</span><div><b>Étape enregistrée</b><span class="small">${txt}</span></div></div>`;
const presentMembers = (avec, m) => activeM(avec).filter(x => m.presence[x.id] && m.presence[x.id] !== 'A');
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
    <main class="main">${bar}<div class="row">${speakBtn('step' + step, '.main h2, .main > div > p.muted', 'Écouter cette étape', I18N.cur())}</div>${STEP[STEPS[step].id](avec, m, st, me, step)}</main></div>`;
};
ACT.stepDone = d => {
  const { avec } = cur(); const m = openMeeting(avec);
  m.stepDone = Math.max(m.stepDone, +d.i); DB.save();
  App.go('a.meet', { step: String(+d.i + 1) });
};
const nextBtn = (i, label) => `<div class="sticky-foot"><button class="btn primary block xl" data-act="${typeof label === 'object' ? label.act : 'stepDone'}" data-i="${i}">${typeof label === 'object' ? label.text : label} ${ic('chev')}</button></div>`;

const STEP = {
  presence(avec, m) {
    const c = { P: 0, R: 0, A: 0 };
    Object.values(m.presence).forEach(v => c[v]++);
    const locked = m.stepDone >= 6;
    return `<div><h2>Qui est là ?</h2><p class="muted">Touchez pour chaque membre. Les amendes d'absence et de retard seront proposées plus tard.</p></div>
      <div class="list">${activeM(avec).filter(x => m.presence[x.id]).map(x => `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">${roleLabel(x)}</span></div>
        <div class="seg">${[['P', 'Là'], ['R', 'Retard'], ['A', 'Absent']].map(([k, l]) => `<button class="${k} ${m.presence[x.id] === k ? 'on' : ''}" data-act="pres" data-id="${x.id}" data-v="${k}" ${locked ? 'disabled' : ''} aria-pressed="${m.presence[x.id] === k}">${l}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="totals"><span>${c.P} là · ${c.R} en retard · ${c.A} absents</span></div>
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
    const aideBtn = `<button class="btn ghost block" data-act="aideSheet">${ic('hand')} Donner une aide sociale</button>`;
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
    const dr = draft(m.id + ':ep', () => ({ parts: {} }));
    const max = avec.settings.maxParts;
    const tot = here.reduce((a, x) => a + (dr.parts[x.id] || 0), 0);
    return `<div><h2>Achat de parts</h2><p class="muted">1 part = ${fc(avec.settings.partValue)}. Chaque membre achète de 1 à ${max} parts.</p></div>
      <button class="btn ghost block" data-act="partsAll">Mettre 1 part à tout le monde</button>
      <div class="list">${here.map(x => { const n = dr.parts[x.id] || 0; return `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b>${stampsHtml(n, max)}<span class="small muted num">${n ? fc(n * avec.settings.partValue) : 'aucune part'} · total ${st.mem[x.id].parts} parts</span></div>
        <div class="pm"><button data-act="parts" data-id="${x.id}" data-d="-1" aria-label="Retirer une part">−</button><output>${n}</output><button class="plus" data-act="parts" data-id="${x.id}" data-d="1" aria-label="Ajouter une part">+</button></div></div>`; }).join('')}</div>
      <div class="totals"><span>${tot} parts</span><b class="num">${fc(tot * avec.settings.partValue)}</b></div>
      ${nextBtn(3, { act: 'saveParts', text: 'Enregistrer l\'épargne' })}`;
  },
  remb(avec, m, st) {
    if (m.stepDone >= 4) return `${doneBanner('Remboursements enregistrés.')}<div class="list">${txRows(avec, meetTx(avec, m, ['REMB']), 'Aucun remboursement')}</div>${nextBtn(4, 'Suivant')}`;
    const loans = st.activeLoans.slice().sort((a, b) => (b.status === 'retard') - (a.status === 'retard'));
    if (!loans.length) return `<div><h2>Remboursements</h2></div><div class="card muted">Aucun crédit en cours dans le groupe.</div>${nextBtn(4, 'Suivant')}`;
    return `<div><h2>Remboursements</h2><p class="muted">Écrivez ce que chaque membre rembourse aujourd'hui. Le bouton « Échéance » met le montant prévu.</p></div>
      <div class="list">${loans.map(l => { const x = memberOf(avec, l.memberId); const abs = m.presence[x.id] === 'A'; const inst = Math.min(l.remaining, Math.ceil(l.due / l.months / 100) * 100);
        return `<div class="mrow" style="flex-wrap:wrap">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted num">Reste ${fc(l.remaining)} · fin ${fdate(l.dueDate)}</span> ${l.status === 'retard' ? `<span class="chip bad">${l.daysLate} j de retard</span>` : ''}${abs ? ' <span class="chip">absent</span>' : ''}</div>
        <div class="row" style="gap:6px"><input id="rb-${l.id}" class="input num" style="width:112px;text-align:right" inputmode="numeric" placeholder="0" data-in="rembTotal" data-max="${l.remaining}" aria-label="Montant remboursé par ${esc(x.name)}"><button class="btn sm" data-act="fillInst" data-id="${l.id}" data-v="${inst}">Échéance</button></div></div>`; }).join('')}</div>
      <div class="totals"><span>Total reçu</span><b class="num" id="rbTot">0 FC</b></div>
      ${nextBtn(4, { act: 'saveRemb', text: 'Enregistrer les remboursements' })}`;
  },
  credit(avec, m, st) {
    const list = meetTx(avec, m, ['CREDIT']);
    return `<div><h2>Nouveaux crédits</h2><p class="muted">Un membre peut emprunter jusqu'à ${avec.settings.maxMult} fois son épargne, pour ${avec.settings.maxMonths} mois au plus, à ${avec.settings.rate} % par mois. L'assemblée écoute chaque demande.</p></div>
      <div class="card row between"><span class="label">Disponible pour prêter</span><b class="num" style="font-family:var(--f-display);font-size:1.4rem">${fc(st.loanFund)}</b></div>
      <div class="list">${txRows(avec, list, 'Aucun crédit accordé à cette réunion')}</div>
      <button class="btn brand block xl" data-act="creditSheet">${ic('plus')} Accorder un crédit</button>
      ${nextBtn(5, m.stepDone >= 5 ? 'Suivant' : 'Terminer les crédits')}`;
  },
  amende(avec, m, st) {
    const s = avec.settings;
    const extra = `<button class="btn ghost block" data-act="fineSheet">${ic('gavel')} Autre amende (bavardage, oubli…)</button>`;
    if (m.stepDone >= 6) return `${doneBanner('Amendes enregistrées.')}<div class="list">${txRows(avec, meetTx(avec, m, ['AMENDE', 'DETTE']), 'Aucune amende')}</div>${extra}${nextBtn(6, 'Suivant')}`;
    const late = activeM(avec).filter(x => m.presence[x.id] && m.presence[x.id] !== 'P');
    const debtors = presentMembers(avec, m).filter(x => st.mem[x.id].fineDebt > 0);
    const dr = draft(m.id + ':fine', () => { const o = {}, p = {}; late.forEach(x => o[x.id] = true); debtors.forEach(x => p[x.id] = true); return { on: o, pay: p }; });
    const others = meetTx(avec, m, ['AMENDE']);
    const tot = late.reduce((a, x) => a + (dr.on[x.id] && m.presence[x.id] === 'R' ? s.fineLate : 0), 0) + debtors.reduce((a, x) => a + (dr.pay[x.id] ? st.mem[x.id].fineDebt : 0), 0);
    return `<div><h2>Amendes</h2><p class="muted">Proposées selon les présences : absence ${fc(s.fineAbsent)}, retard ${fc(s.fineLate)}. Un absent ne paie pas aujourd'hui : son amende est notée comme dette et payée à son retour.</p></div>
      <div class="list">${late.length ? late.map(x => { const a = m.presence[x.id] === 'A'; return `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">${a ? 'Absence · dette de ' + fc(s.fineAbsent) : 'Retard · payé maintenant ' + fc(s.fineLate)}</span></div><button class="toggle ${dr.on[x.id] ? 'on' : ''}" data-act="dToggle" data-k="on" data-id="${x.id}" aria-label="Appliquer l'amende" aria-pressed="${!!dr.on[x.id]}"></button></div>`; }).join('') : '<div class="li muted">Tout le monde était à l\'heure</div>'}</div>
      ${others.length ? `<div class="list">${txRows(avec, others, '')}</div>` : ''}
      ${debtors.length ? `<h3>Amendes dues des réunions passées</h3><div class="list">${debtors.map(x => `<div class="mrow">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><span class="small muted">Doit ${fc(st.mem[x.id].fineDebt)}</span></div><button class="toggle ${dr.pay[x.id] ? 'on' : ''}" data-act="dToggle" data-k="pay" data-id="${x.id}" aria-label="Paie sa dette" aria-pressed="${!!dr.pay[x.id]}"></button></div>`).join('')}</div>` : ''}
      <div class="totals"><span>Argent reçu maintenant</span><b class="num">${fc(tot)}</b></div>${extra}
      ${nextBtn(6, { act: 'saveFines', text: 'Enregistrer les amendes' })}`;
  },
  cloture(avec, m, st) {
    const dr = draft(m.id + ':close', () => ({ locks: {} }));
    const all = meetTx(avec, m, ['SOCIAL', 'EPARGNE', 'REMB', 'AMENDE', 'CREDIT', 'AIDE']).filter(t => !t.annulled);
    const by = type => all.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0);
    const ins = ['EPARGNE', 'SOCIAL', 'REMB', 'AMENDE'], outs = ['CREDIT', 'AIDE'];
    const tIn = ins.reduce((a, k) => a + by(k), 0), tOut = outs.reduce((a, k) => a + by(k), 0);
    const holders = keyHolders(avec);
    const filled = (dr.closeCount || '').trim() !== '';
    return `<div><h2>Fermer la caisse</h2><p class="muted">Les compteurs recomptent tout l'argent. Les trois porte-clés confirment avec leur code, puis la caisse est fermée à clé.</p></div>
      <div class="card stack">
        <div class="stack" style="gap:6px">${ins.map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num" style="color:var(--good)">+ ${fc(by(k))}</b></div>`).join('')}
          ${outs.map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num" style="color:var(--bad)">− ${fc(by(k))}</b></div>`).join('')}</div>
        <div class="row between" style="border-top:1px solid var(--line);padding-top:10px"><span>Ouverture ${fc(m.openCount)} ${tOut > tIn ? '−' : '+'} ${fc(Math.abs(tIn - tOut))}</span></div>
        <div class="row between"><span class="label">Doit être dans la caisse</span><b class="num" style="font-family:var(--f-display);font-size:1.5rem">${fc(st.cash)}</b></div>
        <div class="field"><label for="closeCount">Argent compté (FC)</label><input id="closeCount" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0" value="${esc(dr.closeCount || '')}" data-in="gap" data-exp="${st.cash}" data-out="closeGap"></div>
        <div id="closeGap">${gapHtml(parseAmt(dr.closeCount), st.cash, filled)}</div>
        <div class="field" id="closeGapNote" ${filled && parseAmt(dr.closeCount) !== st.cash ? '' : 'hidden'}><label for="closeNote">Expliquez l'écart (obligatoire)</label><textarea id="closeNote" class="input" rows="2" data-in="keep">${esc(dr.closeNote || '')}</textarea></div>
      </div>
      <section class="section"><h3>Les trois clés</h3>
        <div class="locks3">${holders.slice(0, 3).map(h => `<button class="lock ${dr.locks[h.id] ? 'ok' : ''}" data-act="lockPin" data-id="${h.id}">${ic(dr.locks[h.id] ? 'lock' : 'key')}<b>${esc(h.name.split(' ')[0])}</b><span class="small muted">${dr.locks[h.id] ? 'confirmé' : 'toucher'}</span></button>`).join('')}</div></section>
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

ACT.pres = d => { const { avec } = cur(); openMeeting(avec).presence[d.id] = d.v; DB.save(); render(); };
ACT.dToggle = d => { App.draft[d.k][d.id] = !App.draft[d.k][d.id]; render(); };
ACT.parts = d => { const { avec } = cur(); const p = App.draft.parts; p[d.id] = Math.max(0, Math.min(avec.settings.maxParts, (p[d.id] || 0) + +d.d)); render(); };
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
  finishStep(avec, m, 6, 'Amendes enregistrées');
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
  Object.assign(m, {
    status: 'closed', closedAt: Date.now(), closeExpected: st.cash, closeCount: v, note: v !== st.cash ? dr.closeNote.trim() : '',
    validators: Object.keys(dr.locks), sealSeq: avec.tx.length, seal: avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id, stepDone: 7
  });
  if (m.openExpected === undefined) { m.openExpected = m.openCount = st.cash; }
  DB.save();
  if (K.data.net.online) syncAvec(avec);
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
ACT.creditSheet = () => {
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
  DB.save(); App.closeSheet(); App.toast(`Crédit de ${fc(a)} accordé à ${memberOf(avec, mid).name}`);
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
  const gap = m.closeCount - m.closeExpected;
  const an = annulledSet(avec);
  const list = avec.tx.filter(t => t.meetingId === m.id && t.type !== 'ANNUL' && !an.has(t.id));
  const s = k => list.filter(t => t.type === k).reduce((a, t) => a + t.amount, 0);
  return `<div class="shell">${aTop(avec, 'Réunion fermée')}<main class="main">
    <div class="alert good"><span style="width:26px;flex:none">${ic('lock')}</span><div><b>Réunion n°${m.n} fermée et scellée</b><span class="small">Plus personne ne peut modifier ces écritures.</span></div></div>
    <div class="receipt stack">
      <div class="row between"><span class="label">Reçu de réunion</span><span class="small muted">${fdt(m.closedAt)}</span></div>
      ${['EPARGNE', 'SOCIAL', 'REMB', 'AMENDE', 'CREDIT', 'AIDE'].map(k => `<div class="row between small"><span>${TX[k].l}</span><b class="num">${fc(s(k))}</b></div>`).join('')}
      <div class="row between" style="border-top:1px dashed var(--line);padding-top:8px"><span>Argent compté</span><b class="num">${fc(m.closeCount)}</b></div>
      ${gap ? `<div class="chip bad">Écart ${fc(gap)} — ${esc(m.note)}</div>` : '<div class="chip good">Caisse juste</div>'}
      <div class="small muted">Clés : ${m.validators.map(id => esc(memberOf(avec, id).name)).join(', ')}</div>
      <div><span class="label">Sceau</span><div class="mono" style="word-break:break-all">${m.seal.slice(0, 32).replace(/(.{4})/g, '$1 ')}</div></div>
    </div>
    <button class="btn primary block xl" data-act="go" data-to="a.home">Retour à l'accueil</button>
  </main></div>`;
};

/* ---------- membres & carnet ---------- */
SCREENS['a.members'] = () => {
  const { avec, st } = cur();
  const rows = avec.members.slice().sort((a, b) => (!!a.left - !!b.left) || st.mem[b.id].parts - st.mem[a.id].parts);
  return `<div class="shell">${aTop(avec)}<main class="main">
    <div class="row between"><h1>Membres</h1><span class="chip brand">${st.activeCount} · ${st.women} femmes</span></div>
    <button class="btn ghost block" data-act="addMemberSheet">${ic('plus')} Ajouter un membre</button>
    <div class="list">${rows.map(x => { const d = st.mem[x.id]; const l = d.loans.find(y => y.status !== 'solde');
      return `<button class="li" data-act="go" data-to="a.member" data-id="${x.id}">${avatar(x)}<span class="grow"><b>${esc(x.name)}</b><span class="small muted">${x.left ? 'A quitté le groupe' : roleLabel(x)} · ${d.parts} parts</span></span>
      <span class="end"><span class="num">${fc(d.savings)}</span><br>${l ? `<span class="chip ${l.status === 'retard' ? 'bad' : 'warn'}">crédit ${fck(l.remaining)}</span>` : ''}</span></button>`; }).join('')}</div>
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
      <div class="split"><div><span>Parts achetées</span><b class="num">${d.parts}</b></div><div><span>Valeur si partage</span><b class="num">${fc(d.parts * st.shareValue)}</b></div></div></section>
    <div class="row">${speakBtn('carnet', '.main h1, .caisse .label, .caisse .big, .caisse .split span, .caisse .split b', 'Écouter mon carnet', I18N.cur())}</div>
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
    <span class="small muted num">${withName ? fc(l.principal) + ' · ' : ''}remboursé ${fc(l.paid)} / ${fc(l.due)}</span>
    <div class="bar" style="margin-top:6px"><i style="width:${Math.round(prog * 100)}%;${l.status === 'retard' ? 'background:var(--bad)' : ''}"></i></div></div>
    <div class="end">${chip}<br><span class="num small">reste ${fc(l.remaining)}</span></div></div>`;
}
SCREENS['a.loans'] = () => {
  const { avec, st } = cur();
  const act = st.activeLoans.slice().sort((a, b) => b.daysLate - a.daysLate);
  const done = st.loanList.filter(l => l.status === 'solde');
  return `<div class="shell">${aTop(avec)}<main class="main">
    <h1>Crédits</h1>
    <div class="grid2"><div class="kpi"><span>À rembourser</span><b class="num">${fck(st.outstanding)}</b><span>${act.length} crédits en cours</span></div>
      <div class="kpi"><span>En retard</span><b class="num" style="color:${st.lateAmt ? 'var(--bad)' : 'inherit'}">${fck(st.lateAmt)}</b><span>PAR ${pct(st.par)}</span></div>
      <div class="kpi"><span>Intérêts gagnés</span><b class="num">${fck(st.interest)}</b><span>pour le partage</span></div>
      <div class="kpi"><span>Disponible</span><b class="num">${fck(st.loanFund)}</b><span>caisse de crédit</span></div></div>
    <section class="section"><h2>En cours</h2><div class="list">${act.map(l => loanLi(avec, l)).join('') || '<div class="li muted">Aucun crédit en cours</div>'}</div></section>
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
ACT.verifyNow = () => { const { avec } = cur(); delete _chain[avec.id]; const r = chainOf(avec); render(); App.toast(r.ok ? `Vérifié : ${r.n} écritures intactes` : 'Attention : ' + r.reason); };
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
