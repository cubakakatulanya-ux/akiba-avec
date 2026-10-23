/* Akiba AVEC — crédit extérieur (IMF, banque, ONG) et dossier pour une IMF.
   Le crédit extérieur est décidé par l'assemblée générale, enregistré pendant une réunion (argent compté),
   avec la validation d'un 2e membre du bureau. Il entre dans la caisse de crédit ; ses frais et ses
   remboursements en sortent. C'est une dette du groupe : elle est retirée de la valeur des parts,
   et le partage attend son remboursement complet. */
'use strict';

const EXT_FEES = ['Frais d\'adhésion', 'Frais de dossier', 'Assurance', 'Autres frais'];
const parseRate = v => { const n = parseFloat(String(v || '').replace(',', '.').replace(/[^\d.]/g, '')); return isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const extChip = e => e.status === 'solde' ? '<span class="chip good">Remboursé</span>' : e.status === 'retard' ? `<span class="chip bad">${e.daysLate} j de retard</span>` : `<span class="chip warn">Fin ${fdate(e.dueDate)}</span>`;
const extInstallment = e => Math.min(e.remaining, Math.ceil(e.due / e.months / 100) * 100);

/* dans la réunion, étape « Crédits » */
function extMeetingBlock(avec, m, st) {
  const list = meetTx(avec, m, ['EXT_IN', 'EXT_FEE', 'EXT_GUAR', 'EXT_REPAY']);
  return `<section class="section"><h3>Crédit extérieur (IMF, banque, ONG)</h3>
    <p class="small muted">Argent emprunté par le groupe après décision de l'assemblée générale. Il renforce la caisse de crédit ; c'est une dette du groupe.</p>
    ${list.length ? `<div class="list">${list.map(t => `<div class="li" style="${t.annulled ? 'opacity:.5;text-decoration:line-through' : ''}"><span class="grow"><b>${TX[t.type].l}</b><span class="small muted">${esc(t.note || '')}</span></span><span class="end num" style="color:${t.type === 'EXT_IN' ? 'var(--good)' : 'var(--bad)'}">${t.type === 'EXT_IN' ? '+' : '−'} ${fc(t.amount)}</span></div>`).join('')}</div>` : ''}
    <div class="grid2">
      <button class="btn ghost" data-act="extSheet">${ic('building')} Recevoir un crédit</button>
      <button class="btn ghost" data-act="go" data-to="a.ext">${ic('chev')} Suivi de la demande</button>
      ${st.extActive.length ? `<button class="btn ghost" data-act="extRepaySheet">${ic('coins')} Rembourser le prêteur</button>` : ''}
      ${st.extList.length ? `<button class="btn ghost" data-act="extFeeSheet">${ic('clip')} Payer des frais</button>` : ''}
    </div></section>`;
}

/* dans l'onglet « Crédits » */
function extLoansSection(avec, st) {
  if (!st.extList.length) return '';
  const row = (k, v, strong) => `<div class="row between small"><span class="muted">${k}</span><b class="num" ${strong ? 'style="font-size:1rem"' : ''}>${v}</b></div>`;
  return `<section class="section"><h2>Crédit extérieur</h2>
    <div class="grid2"><div class="kpi"><span>Dette extérieure</span><b class="num" style="color:${st.extDebt ? 'var(--warn)' : 'inherit'}">${fck(st.extDebt)}</b><span>déjà retirée de la valeur des parts</span></div>
      <div class="kpi"><span>Frais payés</span><b class="num">${fck(st.sum.EXT_FEE)}</b><span>adhésion, dossier…</span></div></div>
    ${st.extList.map(e => `<div class="card stack">
      <div class="row between"><div><b>${esc(e.lender)}</b><div class="small muted">${fdate(e.ts)} · ${esc(e.ag)}</div></div>${extChip(e)}</div>
      ${row('Montant accordé', fc(e.principal))}${e.guar ? row('− Garantie gardée par le prêteur', fc(e.guar)) : ''}${e.guar ? row('Entré dans la caisse', fc(e.netIn)) : ''}${row(`Intérêts (${String(e.rate).replace('.', ',')} % × ${e.months} mois)`, fc(e.due - e.principal))}${row('Frais', fc(e.fees))}
      ${row('Coût total (intérêts + frais)', fc(e.due - e.principal + e.fees))}${row('Remboursé', `${fc(e.paid)} / ${fc(e.due - e.guar)}`)}${e.guar ? row('Garantie déduite du solde', fc(e.guar)) : ''}
      <div class="bar"><i style="width:${Math.round(Math.min(1, (e.paid + e.guar) / e.due) * 100)}%;${e.status === 'retard' ? 'background:var(--bad)' : ''}"></i></div>
      ${row('Reste à rembourser', fc(e.remaining), true)}
    </div>`).join('')}</section>`;
}

/* recevoir un crédit extérieur */
ACT.extSheet = () => {
  const { avec, me } = cur();
  if (!openMeeting(avec)) return App.toast('Le crédit extérieur s\'enregistre pendant une réunion (argent compté)');
  App.openSheet(`<h2>Recevoir un crédit extérieur</h2>
    <p class="muted">Seulement après la décision de l'assemblée générale. L'argent entre dans la caisse de crédit. Le crédit doit être entièrement remboursé <b>avant la fin du cycle</b> (${fdate(cycleEnd(avec))}) et son intérêt ne peut pas dépasser <b>5 % par mois</b>.</p>
    <div class="field"><label for="exL">Prêteur</label><input id="exL" class="input" placeholder="Ex. IMF Tujenge Mikopo, COOPEC, ONG…"></div>
    <div class="grid2"><div class="field"><label for="exA">Montant accordé (FC)</label><input id="exA" class="input num" inputmode="numeric" placeholder="0" data-in="extCalc"></div>
      <div class="field"><label for="exD">Durée (mois)</label><input id="exD" class="input num" inputmode="numeric" value="6" data-in="extCalc"></div></div>
    <div class="grid2"><div class="field"><label for="exR">Intérêt par mois (%) — 5 % au maximum</label><input id="exR" class="input num" inputmode="decimal" placeholder="Ex. 2 ou 2,5" data-in="extCalc"></div>
      <div class="field"><label for="exGar">Garantie retenue (%)</label><input id="exGar" class="input num" inputmode="decimal" placeholder="Ex. 10" data-in="extCalc"></div></div>
    <p class="hint">La garantie est la part du crédit que le prêteur garde chez lui : elle n'entre pas dans la caisse et vient éteindre la fin de la dette au dernier remboursement.</p>
    <h3>Frais liés au crédit</h3>
    <p class="hint">S'ils sont retenus par le prêteur, écrivez-les quand même : Akiba compte le montant accordé, puis les frais qui sortent.</p>
    <div class="grid2">${EXT_FEES.map((f, i) => `<div class="field"><label for="exF${i}">${f}</label><input id="exF${i}" class="input num" inputmode="numeric" placeholder="0" data-in="extCalc"></div>`).join('')}</div>
    <div id="exOut" class="receipt" aria-live="polite"></div>
    <h3>Décision de l'assemblée générale</h3>
    <div class="grid2"><div class="field"><label for="exG">Date de l'AG</label><input id="exG" class="input" type="date" value="${isoDay(Date.now())}"></div>
      <div class="field"><label for="exP">Votes pour / contre</label><div class="row" style="gap:6px"><input id="exP" class="input num" inputmode="numeric" placeholder="pour"><input id="exC" class="input num" inputmode="numeric" placeholder="contre"></div></div></div>
    <label class="row small" style="gap:10px;align-items:flex-start"><input id="exOk" type="checkbox" style="width:22px;height:22px;flex:none"><span>L'assemblée générale a approuvé ce crédit, son montant, ses intérêts, ses frais et sa durée.</span></label>
    ${approverFields(avec, me, 'ex')}
    <button class="btn primary block xl" data-act="saveExt">${ic('check')} Enregistrer le crédit reçu</button>`);
  INP.extCalc();
};
function extRead() {
  const a = parseAmt(fval('exA')), months = parseInt(fval('exD'), 10) || 0, rate = parseRate(fval('exR'));
  const garPct = Math.min(50, Math.max(0, parseRate(fval('exGar'))));
  const guar = Math.round(a * garPct / 100 / 100) * 100;            // garantie gardée par le prêteur, arrondie à 100 FC
  const fees = EXT_FEES.map((l, i) => ({ l, v: parseAmt(fval('exF' + i)) })).filter(f => f.v > 0);
  const feeTot = fees.reduce((s, f) => s + f.v, 0), interest = Math.round(a * rate / 100 * months);
  return { a, months, rate, garPct, guar, fees, feeTot, interest, total: a + interest, cost: interest + feeTot, net: a - feeTot - guar, toPay: a + interest - guar };
}
INP.extCalc = () => {
  const o = document.getElementById('exOut'); if (!o) return;
  const { avec } = cur(); const x = extRead();
  if (!x.a) { o.innerHTML = '<p class="small muted">Écrivez le montant, la durée et l\'intérêt : Akiba calcule le coût.</p>'; return; }
  const row = (k, v, strong) => `<div class="row between ${strong ? '' : 'small'}"><span>${k}</span><b class="num">${v}</b></div>`;
  const end = Date.now() + x.months * 30 * DAY;
  o.innerHTML = `<div class="stack" style="gap:6px">
    ${row('Entre réellement dans la caisse', fc(x.net))}${x.guar ? row(`Garantie gardée par le prêteur (${String(x.garPct).replace('.', ',')} %)`, fc(x.guar)) : ''}${row('Intérêts', fc(x.interest))}${row('Frais', fc(x.feeTot))}
    ${row('Coût total du crédit', fc(x.cost), true)}
    ${row('Total à rendre au prêteur', fc(x.toPay), true)}${x.guar ? `<p class="hint">Sur ${fc(x.total)} dus, la garantie de ${fc(x.guar)} est déduite à la fin : le groupe ne verse que ${fc(x.toPay)}.</p>` : ''}
    ${x.months ? row('Chaque mois', fc(Math.ceil(x.toPay / x.months / 100) * 100)) : ''}
    ${x.months && x.a ? `<p class="hint">Coût réel : environ ${String(Math.round(x.cost / x.a / x.months * 1000) / 10).replace('.', ',')} % par mois (intérêts et frais compris). Fin : ${fdate(end)}.</p>` : ''}
    ${end > cycleEnd(avec) ? `<div class="chip bad">Fin après le cycle (${fdate(cycleEnd(avec))}) : choisissez une durée plus courte</div>` : ''}</div>`;
};
ACT.saveExt = () => {
  const { avec, me } = cur(); const m = openMeeting(avec);
  if (!m) return App.toast('Ouvrez d\'abord la réunion');
  const lender = (fval('exL') || '').trim(), x = extRead();
  const ag = fval('exG'), pour = parseInt(fval('exP'), 10) || 0, contre = parseInt(fval('exC'), 10) || 0;
  if (lender.length < 2) return App.toast('Écrivez le nom du prêteur');
  if (x.a < 10000) return App.toast('Écrivez le montant accordé');
  if (x.months < 1 || x.months > 36) return App.toast('Durée : entre 1 et 36 mois');
  if (x.rate < 0 || x.rate > 5) return App.toast('Intérêt du prêteur : 5 % par mois au maximum');
  if (x.feeTot >= x.a) return App.toast('Les frais ne peuvent pas dépasser le montant');
  if (x.garPct > 30) return App.toast('Garantie retenue : 30 % du crédit au maximum');
  if (x.guar + x.feeTot >= x.a) return App.toast('La garantie et les frais ne peuvent pas dépasser le montant');
  if (Date.now() + x.months * 30 * DAY > cycleEnd(avec)) return App.toast(`Le crédit doit être remboursé avant la fin du cycle (${fdate(cycleEnd(avec))}) : le partage se fait après`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ag || '') || ag > isoDay(Date.now())) return App.toast('Écrivez la date de l\'assemblée générale (aujourd\'hui ou avant)');
  if (pour <= contre) return App.toast('Écrivez les votes : la majorité doit être pour');
  if (!document.getElementById('exOk').checked) return App.toast('Confirmez la décision de l\'assemblée générale');
  const ap = checkApprover(avec, 'ex', null); if (!ap) return;
  const t = appendTx(avec, { meetingId: m.id, type: 'EXT_IN', amount: x.a, rate: x.rate, months: x.months, note: lender, ref: `AG du ${ag} : ${pour} pour, ${contre} contre · 2e validation ${ap.name}`, by: me.id });
  if (x.guar) appendTx(avec, { meetingId: m.id, type: 'EXT_GUAR', ref: t.id, amount: x.guar, note: `Garantie ${String(x.garPct).replace('.', ',')} % gardée par ${lender}`, by: me.id });
  x.fees.forEach(f => appendTx(avec, { meetingId: m.id, type: 'EXT_FEE', ref: t.id, amount: f.v, note: f.l, by: me.id }));
  extReqReceived(avec, lender);
  DB.save(); App.closeSheet(); App.toast(`Crédit extérieur de ${fc(x.a)} enregistré (${fc(x.net)} dans la caisse)`);
};

/* rembourser le prêteur */
const extOptions = list => list.map(e => `<option value="${e.id}">${esc(e.lender)} · reste ${fc(e.remaining)}</option>`).join('');
ACT.extRepaySheet = () => {
  const { avec, me, st } = cur();
  if (!openMeeting(avec)) return App.toast('Le remboursement s\'enregistre pendant une réunion');
  const e = st.extActive[0]; if (!e) return App.toast('Aucun crédit extérieur en cours');
  App.openSheet(`<h2>Rembourser le prêteur</h2>
    <p class="muted">L'argent sort de la caisse de crédit (disponible : <b class="num">${fc(st.loanFund)}</b>).</p>
    <div class="field"><label for="erE">Crédit</label><select id="erE" class="input">${extOptions(st.extActive)}</select></div>
    <div class="field"><label for="erA">Montant remboursé (FC)</label><input id="erA" class="input bignum num" inputmode="numeric" value="${extInstallment(e)}"></div>
    <p class="hint">Échéance mensuelle prévue : ${fc(extInstallment(e))}. Gardez le reçu du prêteur avec le cahier.</p>
    ${approverFields(avec, me, 'er')}
    <button class="btn primary block xl" data-act="saveExtRepay">${ic('check')} Enregistrer le remboursement</button>`);
};
ACT.saveExtRepay = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const e = st.extActive.find(x => x.id === fval('erE')), a = parseAmt(fval('erA'));
  if (!m || !e) return App.toast('Choisissez le crédit');
  if (!a) return App.toast('Écrivez le montant');
  if (a > e.remaining) return App.toast(`Il reste seulement ${fc(e.remaining)} à rembourser`);
  if (a > st.loanFund) return App.toast('La caisse de crédit n\'a pas assez d\'argent');
  const ap = checkApprover(avec, 'er', null); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'EXT_REPAY', ref: e.id, amount: a, note: `${e.lender} · 2e validation ${ap.name}`, by: me.id });
  DB.save(); App.closeSheet(); App.toast(a === e.remaining ? `Crédit de ${e.lender} entièrement remboursé` : `Remboursement de ${fc(a)} enregistré`);
};

/* frais payés plus tard (renouvellement, pénalité…) */
ACT.extFeeSheet = () => {
  const { avec, me, st } = cur();
  if (!openMeeting(avec)) return App.toast('Les frais s\'enregistrent pendant une réunion');
  App.openSheet(`<h2>Payer des frais</h2>
    <p class="muted">Frais liés au crédit extérieur, payés par la caisse de crédit.</p>
    <div class="field"><label for="efE">Crédit</label><select id="efE" class="input">${st.extList.map(e => `<option value="${e.id}">${esc(e.lender)} · ${fdate(e.ts)}</option>`).join('')}</select></div>
    <div class="grid2"><div class="field"><label for="efL">Nature</label><select id="efL" class="input">${EXT_FEES.concat(['Pénalité de retard']).map(f => `<option>${f}</option>`).join('')}</select></div>
      <div class="field"><label for="efA">Montant (FC)</label><input id="efA" class="input num" inputmode="numeric" placeholder="0"></div></div>
    ${approverFields(avec, me, 'ef')}
    <button class="btn primary block xl" data-act="saveExtFee">${ic('check')} Enregistrer les frais</button>`);
};
ACT.saveExtFee = () => {
  const { avec, me, st } = cur(); const m = openMeeting(avec);
  const e = st.extList.find(x => x.id === fval('efE')), a = parseAmt(fval('efA'));
  if (!m || !e) return App.toast('Choisissez le crédit');
  if (!a) return App.toast('Écrivez le montant');
  if (a > st.loanFund) return App.toast('La caisse de crédit n\'a pas assez d\'argent');
  const ap = checkApprover(avec, 'ef', null); if (!ap) return;
  appendTx(avec, { meetingId: m.id, type: 'EXT_FEE', ref: e.id, amount: a, note: `${fval('efL')} · 2e validation ${ap.name}`, by: me.id });
  DB.save(); App.closeSheet(); App.toast('Frais enregistrés');
};

/* ---------- dossier pour une IMF ---------- */
function imfIndicators(avec) {
  const st = stats(avec);
  const done = st.loanList.filter(l => l.status === 'solde');
  const onTime = done.filter(l => !l.pays.length || l.pays[l.pays.length - 1].ts <= l.dueDate + 7 * DAY).length;
  const months = Math.max(0, Math.floor((Date.now() - (avec.createdAt || avec.cycle.start)) / (30 * DAY)));
  const ch = chainOf(avec);
  return { st, months, onTime: done.length ? onTime / done.length : null, doneCount: done.length, chainOk: ch.ok, txCount: avec.tx.length };
}
SCREENS['a.imf'] = () => {
  const { avec, me } = cur();
  const i = imfIndicators(avec), st = i.st, bureau = isBureau(me);
  const qd = dataQuality(avec, st, chainOf(avec)), rd = imfReady(avec, st, chainOf(avec), qd);
  const kpi = (l, v, s) => `<div class="kpi"><span>${l}</span><b class="num">${v}</b><span>${s}</span></div>`;
  const shares = avec.imfShares || [];
  return `<div class="shell">${topbar('Dossier pour une IMF', esc(avec.name), backBtn('a.more'), syncPill(avec))}<main class="main">
    <div><h1>Montrer la bonne santé du groupe</h1><p class="muted">Une IMF (ou une banque) demande des chiffres avant d'accorder un crédit au groupe. Akiba prépare un fichier Excel à partir du cahier scellé.</p></div>
    <div class="grid2">
      ${kpi('Ancienneté', i.months + ' mois', `${avec.cycles.length} cycle${avec.cycles.length > 1 ? 's' : ''} terminé${avec.cycles.length > 1 ? 's' : ''}`)}
      ${kpi('Membres', st.activeCount, `${st.activeCount ? pct(st.women / st.activeCount) : '—'} de femmes`)}
      ${kpi('Présence', pct(st.attendance), `${st.meetings.length} réunions ce cycle`)}
      ${kpi('Épargne du cycle', fck(st.sum.EPARGNE), `valeur de la part ${fc(st.shareValue)}`)}
      ${kpi('Crédits accordés', st.loanList.length, fck(st.sum.CREDIT) + ' ce cycle')}
      ${kpi('Remboursés à temps', i.onTime === null ? '—' : pct(i.onTime), `${i.doneCount} crédits soldés`)}
      ${kpi('Portefeuille à risque', pct(st.par), fck(st.lateAmt) + ' en retard')}
      ${kpi('Écarts de caisse', st.ecarts.length, i.chainOk ? 'journal intact' : 'journal altéré')}
    </div>
    ${readyCard(rd)}
    ${qualityCard(qd)}
    ${st.extList.length ? `<div class="alert ${st.extDebt ? 'warn' : 'good'}">${icSpan('building')}<div><b>Crédit extérieur</b><span class="small">${st.extList.length} crédit(s) · reste ${fc(st.extDebt)} · frais payés ${fc(st.sum.EXT_FEE)}${st.sum.EXT_GUAR ? ` · garantie ${fc(st.sum.EXT_GUAR)}` : ''}</span></div></div>` : ''}
    ${bureau ? `<section class="card stack"><h2>Préparer le fichier</h2>
      <p class="small">Contenu : profil du groupe, indicateurs par cycle, réunions, crédits internes, crédits extérieurs, membres.
        <b>Jamais</b> de téléphone ni d'adresse.</p>
      <label class="row" style="gap:10px"><input id="imN" type="checkbox" style="width:22px;height:22px;flex:none"><span>Mettre les noms des membres (sinon « Membre 1, Membre 2… »)</span></label>
      <label class="row" style="gap:10px;align-items:flex-start"><input id="imA" type="checkbox" style="width:22px;height:22px;flex:none"><span>L'assemblée générale a accepté de partager ces informations avec l'IMF.</span></label>
      <div class="field"><label for="imI">Nom de l'IMF</label><input id="imI" class="input" placeholder="Ex. IMF Tujenge Mikopo"></div>
      <button class="btn primary block xl" data-act="imfDownload">${ic('chart')} Télécharger le dossier Excel</button>
      ${navigator.share ? `<button class="btn ghost block" data-act="imfShare">${ic('chat')} Partager (WhatsApp, e-mail…)</button>` : ''}
    </section>` : '<div class="card small muted">Seul le bureau (président, secrétaire, trésorier) peut préparer et partager le dossier.</div>'}
    ${shares.length ? `<section class="section"><h2>Déjà partagé</h2><div class="list">${shares.slice().reverse().map(s => `<div class="li"><span class="grow"><b>${esc(s.imf)}</b><span class="small muted">${fdt(s.ts)} · par ${esc((memberOf(avec, s.by) || {}).name || '—')} · ${s.names ? 'avec les noms' : 'sans les noms'}</span></span></div>`).join('')}</div></section>` : ''}
  </main></div>`;
};
function imfSheets(avec, names) {
  const i = imfIndicators(avec), st = i.st, s = avec.settings;
  const label = new Map(avec.members.map((m, k) => [m.id, names ? m.name : 'Membre ' + (k + 1)]));
  const org = avec.orgId ? (K.data.orgs.find(o => o.id === avec.orgId) || {}).name : '';
  const profile = [
    ['Nom du groupe', avec.name], ['Village / quartier', avec.village], ['Territoire / ville', avec.territoire], ['Province', avec.province],
    ['Accompagnement', org || 'AVEC autonome'], ['Date de création', { v: avec.createdAt || avec.cycle.start, t: 'd' }], ['Ancienneté (mois)', { v: i.months, t: 'n' }],
    ['Cycles terminés', { v: avec.cycles.length, t: 'n' }], ['Cycle en cours', { v: avec.cycle.n, t: 'n' }], ['Début du cycle', { v: avec.cycle.start, t: 'd' }], ['Fin prévue', { v: cycleEnd(avec), t: 'd' }],
    ['Membres actifs', { v: st.activeCount, t: 'n' }], ['Part de femmes', { v: st.activeCount ? st.women / st.activeCount : 0, t: 'p' }],
    ['Réunions', (s.meetingDay ? s.meetingDay + ', ' : '') + ((s.frequency || 7) === 14 ? 'toutes les 2 semaines' : 'chaque semaine')],
    ['Valeur d\'une part achetée (FC)', { v: s.partValue, t: 'n' }], ['Intérêt des crédits internes (% par mois)', { v: s.rate, t: 'n' }], ['Crédit maximum', `${s.maxMult} × l'épargne, ${s.maxMonths} mois au plus`],
    ['Argent en caisse (FC)', { v: st.cash, t: 'n' }], ['Caisse de crédit (FC)', { v: st.loanFund, t: 'n' }], ['Caisse sociale (FC)', { v: st.socialFund, t: 'n' }],
    ['Dette extérieure en cours (FC)', { v: st.extDebt, t: 'n' }],
    ['Journal des écritures', i.chainOk ? `Intact (${i.txCount} écritures scellées, vérifié le ${fdate(Date.now())})` : 'ALTÉRÉ'],
    ['Dossier préparé le', { v: Date.now(), t: 'd' }], ['Source', 'Application Akiba · Entreprise Sociale Ubora']
  ];
  const curRow = [avec.cycle.n, avec.cycle.start, cycleEnd(avec), st.activeCount, st.meetings.length, st.attendance, st.sum.EPARGNE, st.loanList.length, st.sum.CREDIT, st.interest, st.par, i.onTime, Math.round(st.shareValue), null, st.ecarts.length, st.socialFund];
  const past = avec.cycles.map(c => [c.n, c.start, c.end, c.members, c.meetings, null, null, null, null, null, null, null, c.value, c.distributed, null, c.socialKept]);
  const an = annulledSet(avec);
  const byMeet = {};
  avec.tx.forEach(t => { if (t.type === 'ANNUL' || an.has(t.id)) return; const b = byMeet[t.meetingId] = byMeet[t.meetingId] || {}; b[t.type] = (b[t.type] || 0) + t.amount; });
  return [
    { name: 'Profil', cols: [{ h: 'Rubrique', w: 36 }, { h: 'Valeur', w: 40 }], rows: profile },
    { name: 'Indicateurs par cycle', cols: [{ h: 'Cycle', w: 7, t: 'n' }, { h: 'Début', w: 12, t: 'd' }, { h: 'Fin', w: 12, t: 'd' }, { h: 'Membres', w: 9, t: 'n' }, { h: 'Réunions', w: 9, t: 'n' }, { h: 'Présence', w: 9, t: 'p' },
      { h: 'Épargne (FC)', w: 13, t: 'n' }, { h: 'Crédits accordés (nombre)', w: 11, t: 'n' }, { h: 'Crédits accordés (FC)', w: 13, t: 'n' }, { h: 'Intérêts gagnés (FC)', w: 12, t: 'n' },
      { h: 'PAR', w: 8, t: 'p' }, { h: 'Remboursés à temps', w: 11, t: 'p' }, { h: 'Valeur d\'une part (FC)', w: 12, t: 'n' }, { h: 'Montant partagé (FC)', w: 13, t: 'n' }, { h: 'Écarts de caisse', w: 9, t: 'n' }, { h: 'Caisse sociale (FC)', w: 12, t: 'n' }],
      rows: past.concat([curRow]) },
    { name: 'Réunions', cols: [{ h: 'N°', w: 6, t: 'n' }, { h: 'Date', w: 12, t: 'd' }, { h: 'Présence', w: 9, t: 'p' }, { h: 'Épargne (FC)', w: 12, t: 'n' }, { h: 'Caisse sociale (FC)', w: 12, t: 'n' }, { h: 'Remboursements (FC)', w: 13, t: 'n' }, { h: 'Crédits accordés (FC)', w: 13, t: 'n' }, { h: 'Amendes (FC)', w: 11, t: 'n' }, { h: 'Écart de caisse (FC)', w: 12, t: 'n' }],
      rows: st.meetings.map(m => { const pr = Object.values(m.presence || {}), b = byMeet[m.id] || {}; return [m.n, m.date, pr.length ? pr.filter(x => x !== 'A').length / pr.length : null, b.EPARGNE || 0, b.SOCIAL || 0, b.REMB || 0, b.CREDIT || 0, b.AMENDE || 0, (m.closeCount || 0) - (m.closeExpected || 0)]; }) },
    { name: 'Crédits internes', cols: [{ h: 'Membre', w: 22 }, { h: 'Sexe', w: 6 }, { h: 'Date', w: 12, t: 'd' }, { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Durée (mois)', w: 9, t: 'n' }, { h: 'Total dû (FC)', w: 12, t: 'n' }, { h: 'Remboursé (FC)', w: 12, t: 'n' }, { h: 'Reste (FC)', w: 11, t: 'n' }, { h: 'Situation', w: 11 }, { h: 'Jours de retard', w: 9, t: 'n' }],
      rows: st.loanList.map(l => { const m = memberOf(avec, l.memberId) || {}; return [label.get(l.memberId) || '—', m.sex === 'M' ? 'H' : 'F', l.ts, l.principal, l.months, l.due, l.paid, l.remaining, l.status === 'solde' ? 'Soldé' : l.status === 'retard' ? 'En retard' : 'En cours', l.daysLate]; }) },
    { name: 'Crédits extérieurs', cols: [{ h: 'Prêteur', w: 24 }, { h: 'Décision de l\'AG', w: 40 }, { h: 'Date', w: 12, t: 'd' }, { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Intérêt par mois', w: 9, t: 'p' }, { h: 'Durée (mois)', w: 9, t: 'n' }, { h: 'Frais (FC)', w: 11, t: 'n' }, { h: 'Garantie retenue (FC)', w: 13, t: 'n' }, { h: 'Total dû (FC)', w: 12, t: 'n' }, { h: 'Remboursé (FC)', w: 12, t: 'n' }, { h: 'Reste (FC)', w: 11, t: 'n' }, { h: 'Échéance', w: 12, t: 'd' }, { h: 'Situation', w: 11 }],
      rows: st.extList.map(e => [e.lender, e.ag, e.ts, e.principal, e.rate / 100, e.months, e.fees, e.guar, e.due, e.paid, e.remaining, e.dueDate, e.status === 'solde' ? 'Remboursé' : e.status === 'retard' ? 'En retard' : 'En cours']) },
    { name: 'Membres', cols: [{ h: 'Membre', w: 22 }, { h: 'Sexe', w: 6 }, { h: 'Âge', w: 6, t: 'n' }, { h: 'Activité', w: 20 }, { h: 'Rôle', w: 18 }, { h: 'Parts', w: 8, t: 'n' }, { h: 'Épargne (FC)', w: 12, t: 'n' }, { h: 'Crédit en cours (FC)', w: 13, t: 'n' }],
      rows: avec.members.filter(m => !m.left).map(m => { const d = st.mem[m.id]; return [label.get(m.id), m.sex === 'M' ? 'H' : 'F', ageOf(m), m.activity || '', roleLabel(m), d.parts, d.savings, d.loans.filter(l => l.status !== 'solde').reduce((a, l) => a + l.remaining, 0)]; }) }
  ];
}
function imfPrepare() {
  const { avec, me } = cur();
  if (!isBureau(me)) { App.toast('Réservé au bureau'); return null; }
  if (!document.getElementById('imA').checked) { App.toast('Confirmez l\'accord de l\'assemblée générale'); return null; }
  const imf = (fval('imI') || '').trim();
  if (imf.length < 2) { App.toast('Écrivez le nom de l\'IMF'); return null; }
  const names = document.getElementById('imN').checked;
  avec.imfShares = (avec.imfShares || []).concat([{ ts: Date.now(), by: me.id, imf, names }]);
  DB.save();
  const slug = avec.name.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { blob: buildXlsx(imfSheets(avec, names)), name: `Akiba-dossier-IMF-${slug}-${isoDay(Date.now())}.xlsx`, imf };
}
ACT.imfDownload = () => {
  const f = imfPrepare(); if (!f) return;
  const url = URL.createObjectURL(f.blob), a = document.createElement('a');
  a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  render(); App.toast(`${f.name} enregistré dans les Téléchargements`);
};
ACT.imfShare = async () => {
  const f = imfPrepare(); if (!f) return;
  render();
  try { await navigator.share({ files: [new File([f.blob], f.name, { type: XL_MIME })], title: 'Dossier Akiba pour ' + f.imf }); }
  catch (e) { if (e && e.name !== 'AbortError') App.toast('Partage impossible : utilisez « Télécharger »'); }
};

/* ---------- suivi d'un crédit extérieur : de la demande au remboursement ---------- */
const EXT_STEPS = [
  { t: 'Décider en assemblée générale', d: 'Le groupe vote : montant, prêteur, durée. La date et les votes sont notés au moment de recevoir l\'argent.' },
  { t: 'Préparer le dossier', d: 'Akiba écrit un fichier Excel à partir du cahier scellé : ancienneté, présence, épargne, remboursements.' },
  { t: 'Déposer la demande', d: 'Le bureau porte le dossier à l\'IMF et note ici la demande : prêteur, montant, durée.' },
  { t: 'Réponse de l\'IMF', d: 'Accordée ou refusée : marquez la réponse pour garder la trace de la démarche.' },
  { t: 'Recevoir l\'argent en réunion', d: 'Pendant une réunion, étape « Crédits » › « Recevoir un crédit » : l\'argent entre dans la caisse de crédit, devant tous.' },
  { t: 'Payer les frais', d: 'Adhésion, dossier, assurance : ils sortent de la caisse et sont comptés dans le coût du crédit.' },
  { t: 'Garantie retenue', d: 'Si le prêteur garde un pourcentage du crédit en garantie, notez-le : il n\'entre pas dans la caisse et vient éteindre la fin de la dette.' },
  { t: 'Rembourser chaque mois', d: 'Étape « Crédits » › « Rembourser le prêteur ». Akiba suit ce qui reste et prévient en cas de retard.' },
  { t: 'Solder avant le partage', d: 'Au partage de fin de cycle, le prêteur est remboursé en premier : les membres ne partagent que ce qui reste.' }
];
const extReqChip = r => r.status === 'accorde' ? '<span class="chip good">Accordée</span>' : r.status === 'refuse' ? '<span class="chip bad">Refusée</span>' : r.status === 'recu' ? '<span class="chip brand">Argent reçu</span>' : '<span class="chip warn">Déposée</span>';
const extReqs = avec => (avec.extReqs || []).slice().sort((a, b) => b.ts - a.ts);
function extStepDone(avec, st, i) {
  const reqs = extReqs(avec);
  if (i === 0 || i === 1) return !!(reqs.length || st.extList.length);
  if (i === 2) return !!reqs.length;
  if (i === 3) return reqs.some(r => r.status !== 'depose');
  if (i === 4) return !!st.extList.length;
  if (i === 5) return st.sum.EXT_FEE > 0;
  if (i === 6) return st.sum.EXT_GUAR > 0 || !!st.extList.length;   // rien à retenir : la question est réglée à la réception
  if (i === 7) return st.sum.EXT_REPAY > 0;
  return !!st.extList.length && !st.extDebt;
}
/* comment l'argent de l'IMF entre dans la caisse de crédit, et comment il en ressort */
function extFlowCard(avec, st) {
  const received = st.sum.EXT_IN, fees = st.sum.EXT_FEE, repaid = st.sum.EXT_REPAY, guar = st.sum.EXT_GUAR;
  const owed = st.extDebt, rate = avec.settings.rate;
  const extRate = st.extActive.length ? st.extActive[0].rate : (st.extList[0] || {}).rate;
  const nextDue = st.extActive.map(e => extInstallment(e)).reduce((a, b) => a + b, 0);
  const line = (l, v, color) => `<div class="row between small"><span>${l}</span><b class="num" ${color ? `style="color:var(--${color})"` : ''}>${v}</b></div>`;
  return `<section class="card stack"><h2>Comment l'argent circule</h2>
    <div class="stack" style="gap:6px">
      ${line('1. L\'IMF verse l\'argent, compté en réunion', (received ? '+ ' : '') + fc(received), received ? 'good' : '')}
      ${guar ? line('1 bis. Garantie gardée par le prêteur', '− ' + fc(guar), 'warn') : ''}
      ${line('2. Il entre dans la <b>caisse de crédit</b> du groupe', fc(st.loanFund) + ' aujourd\'hui')}
      ${line('3. Les frais sortent de cette même caisse', (fees ? '− ' : '') + fc(fees), fees ? 'bad' : '')}
      ${line('4. Le groupe prête aux membres à ' + rate + ' % par mois', fck(st.outstanding) + ' dehors')}
      ${line('5. Les membres remboursent : la caisse se remplit', fck(st.sum.REMB) + ' ce cycle', 'good')}
      ${line('6. Le groupe rembourse le prêteur en réunion', (repaid ? '− ' : '') + fc(repaid), repaid ? 'bad' : '')}
      ${guar ? line('7. La garantie éteint la fin de la dette', fc(guar), 'good') : ''}
      ${line((guar ? '8' : '7') + '. Reste à verser au prêteur', fc(owed), owed ? 'warn' : 'good')}
    </div>
    ${st.extActive.length ? `<div class="totals"><span>Prochaine échéance conseillée</span><b class="num">${fc(nextDue)}</b></div>` : ''}
    <p class="hint">L'argent emprunté <b>ne se partage pas</b> : il est retiré de la valeur des parts tant qu'il n'est pas rendu (valeur d'une part aujourd'hui : ${fc(st.shareValue)}). Au partage de fin de cycle, Akiba rembourse d'abord le prêteur avec la caisse de crédit, puis partage le reste entre les membres.</p>
    ${extRate != null ? `<div class="${rate > extRate ? 'tip' : 'alert warn'}">${icSpan(rate > extRate ? 'check' : 'alert')}<div><b>${rate > extRate ? 'Le groupe gagne sur la différence' : 'Attention au coût du crédit'}</b><span class="small">Le groupe prête à ${rate} % par mois et emprunte à ${String(extRate).replace('.', ',')} % par mois${rate > extRate ? ` : la différence (${(rate - extRate).toFixed(2).replace('.', ',')} points) reste au groupe, à condition que les membres remboursent à temps.` : ' : le crédit extérieur coûte presque autant que ce que le groupe gagne. Empruntez seulement ce que les membres demandent vraiment.'}</span></div></div>` : ''}
  </section>`;
}
SCREENS['a.ext'] = () => {
  const { avec, me, st } = cur();
  const bureau = isBureau(me), open = openMeeting(avec), reqs = extReqs(avec);
  const steps = EXT_STEPS.map((s, i) => {
    const done = extStepDone(avec, st, i);
    return `<div class="li"><span class="av" style="border-radius:12px;${done ? 'background:var(--brand);color:var(--brand-ink)' : ''}">${done ? '✓' : i + 1}</span>
      <span class="grow"><b>${s.t}</b><span class="small muted">${s.d}</span></span></div>`;
  }).join('');
  const reqRows = reqs.map(r => `<div class="li"><span class="grow"><b>${esc(r.lender)}</b><span class="small muted">${fc(r.amount)} · ${r.months} mois · déposée le ${fdate(r.ts)}${r.note ? ' · ' + esc(r.note) : ''}</span></span>${extReqChip(r)}</div>
    ${bureau && r.status === 'depose' ? `<div class="li" style="gap:8px"><button class="btn sm brand" data-act="extReqStatus" data-id="${r.id}" data-v="accorde">Accordée</button>
      <button class="btn sm ghost" data-act="extReqStatus" data-id="${r.id}" data-v="refuse">Refusée</button>
      <span class="grow"></span><button class="btn sm danger" data-act="extReqDrop" data-id="${r.id}">Retirer</button></div>` : ''}`).join('');
  return `<div class="shell">${topbar('Crédit extérieur (IMF)', esc(avec.name), backBtn('a.more'), syncPill(avec))}<main class="main">
    <div><h1>De la demande au remboursement</h1><p class="muted">Le groupe peut emprunter auprès d'une IMF, d'une banque ou d'une ONG pour renforcer sa caisse de crédit. C'est une dette du groupe : elle est retirée de la valeur des parts jusqu'au dernier franc remboursé.</p></div>
    ${st.extList.length ? `<div class="grid2"><div class="kpi"><span>Reste à rembourser</span><b class="num" style="color:${st.extDebt ? 'var(--warn)' : 'var(--good)'}">${fck(st.extDebt)}</b><span>${st.extActive.length} crédit(s) en cours</span></div>
      <div class="kpi"><span>Coût payé</span><b class="num">${fck(st.sum.EXT_FEE)}</b><span>frais d'adhésion, dossier…</span></div></div>` : ''}
    ${st.extList.length ? extFlowCard(avec, st) : ''}
    <section class="section"><h2>Le chemin</h2><div class="list">${steps}</div></section>
    <section class="section"><h2>Demandes</h2>
      <div class="list">${reqRows || '<div class="li muted">Aucune demande notée pour le moment</div>'}</div>
      <p class="hint">Les demandes sont des notes de suivi : elles ne déplacent pas d'argent. L'argent reçu, les frais, la garantie et les remboursements, eux, sont écrits dans le journal scellé.</p>
      ${bureau ? `<div class="grid2"><button class="btn ghost" data-act="extReqSheet">${ic('clip')} Noter une demande</button>
        <button class="btn ghost" data-act="go" data-to="a.imf">${ic('chart')} Préparer le dossier</button></div>` : ''}</section>
    ${extLoansSection(avec, st)}
    ${bureau ? (open ? `<section class="section"><h2>Pendant la réunion n°${open.n}</h2><div class="grid2">
        <button class="btn ghost" data-act="extSheet">${ic('building')} Recevoir un crédit</button>
        ${st.extActive.length ? `<button class="btn ghost" data-act="extRepaySheet">${ic('coins')} Rembourser</button>` : ''}
        ${st.extList.length ? `<button class="btn ghost" data-act="extFeeSheet">${ic('clip')} Payer des frais</button>` : ''}</div></section>`
      : `<div class="tip row" style="align-items:flex-start">${icSpan('calendar')}<div><b>L'argent se compte en réunion</b><span class="small">Recevoir le crédit, payer les frais et rembourser le prêteur se font pendant une réunion, à l'étape « Crédits », devant tout le groupe.</span></div></div>`) : ''}
  </main></div>`;
};
ACT.extReqSheet = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Seul le bureau peut noter une demande');
  App.openSheet(`<h2>Noter une demande</h2><p class="muted">Le dossier a été déposé à l'IMF : gardez-en la trace ici. L'argent, lui, s'enregistre en réunion quand il arrive.</p>
    <div class="field"><label for="erL">Prêteur (IMF, banque, ONG)</label><input id="erL" class="input" placeholder="Ex. COOPEC Imara"></div>
    <div class="grid2"><div class="field"><label for="erA">Montant demandé (FC)</label><input id="erA" class="input num" inputmode="numeric" placeholder="0"></div>
    <div class="field"><label for="erM">Durée (mois)</label><input id="erM" class="input num" inputmode="numeric" placeholder="6"></div></div>
    <div class="field"><label for="erN">Remarque</label><input id="erN" class="input" placeholder="Ex. dossier déposé le 12, réponse promise dans 15 jours"></div>
    <button class="btn primary block xl" data-act="saveExtReq">${ic('check')} Enregistrer la demande</button>`);
};
ACT.saveExtReq = () => {
  const { avec, me } = cur();
  const lender = document.getElementById('erL').value.trim();
  const amount = parseAmt(document.getElementById('erA').value);
  const months = Math.max(1, parseInt(document.getElementById('erM').value, 10) || 0);
  if (!lender) return App.toast('Écrivez le nom du prêteur');
  if (!amount) return App.toast('Écrivez le montant demandé');
  avec.extReqs.push({ id: uid(), lender, amount, months, note: document.getElementById('erN').value.trim(), status: 'depose', ts: Date.now(), by: me.id });
  DB.save(); App.closeSheet(); App.toast('Demande notée');
};
ACT.extReqStatus = d => {
  const { avec } = cur();
  const r = (avec.extReqs || []).find(x => x.id === d.id); if (!r) return;
  r.status = d.v; r.answerTs = Date.now();
  DB.save(); render(); App.toast(d.v === 'accorde' ? 'Demande accordée : recevez l\'argent pendant une réunion' : 'Demande refusée');
};
ACT.extReqDrop = d => {
  const { avec } = cur();
  avec.extReqs = (avec.extReqs || []).filter(x => x.id !== d.id);
  DB.save(); render(); App.toast('Demande retirée');
};
/* l'argent reçu ferme la demande correspondante */
function extReqReceived(avec, lender) {
  const r = (avec.extReqs || []).filter(x => x.status !== 'recu' && x.status !== 'refuse')
    .sort((a, b) => b.ts - a.ts).find(x => x.lender.toLowerCase() === String(lender || '').toLowerCase());
  if (r) { r.status = 'recu'; r.receivedTs = Date.now(); }
}
