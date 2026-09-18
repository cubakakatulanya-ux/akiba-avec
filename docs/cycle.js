/* Akiba AVEC — cycle, partage, membres, bureau, codes secrets */
'use strict';

const cycleEnd = avec => avec.cycle.end || (avec.cycle.start + (avec.settings.cycleMonths || 12) * 30 * DAY);
const cycleTotalWeeks = avec => Math.max(1, Math.round((cycleEnd(avec) - avec.cycle.start) / (7 * DAY)));
const rowIc = n => `<span style="width:24px;flex:none;color:var(--brand)">${ic(n)}</span>`;
const WEAK_PINS = ['0000', '1111', '1234', '4321', '1212', '2580', '9999'];

function cycleCard(avec, st, link = true) {
  const tw = cycleTotalWeeks(avec), w = Math.min(cycleWeek(avec), tw);
  const left = Math.ceil((cycleEnd(avec) - Date.now()) / DAY);
  const pendingRules = avec.cycle.rulesPending;
  const tag = link ? `button data-act="go" data-to="${pendingRules ? 'a.newCycle' : 'a.share'}"` : 'div';
  const chip = pendingRules ? '<span class="chip warn">Règles à confirmer</span>' : left < 0 ? '<span class="chip bad">Partage à faire</span>' : `<span class="chip ${left <= 28 ? 'warn' : ''}">fin le ${fdate(cycleEnd(avec))}</span>`;
  return `<${tag} class="card stack" style="border:0;text-align:left;color:var(--ink);width:100%">
    <div class="row between"><span class="label">Cycle ${avec.cycle.n}</span>${chip}</div>
    <div class="row between"><b style="font-family:var(--f-display);font-size:1.15rem">Semaine ${w} sur ${tw}</b>${link ? `<span class="small muted">${pendingRules ? 'Confirmer ›' : 'Voir le partage ›'}</span>` : `<span class="small muted">début ${fdate(avec.cycle.start)}</span>`}</div>
    <div class="bar"><i style="width:${Math.min(100, w / tw * 100).toFixed(0)}%"></i></div></${link ? 'button' : 'div'}>`;
}
function cycleInfo(avec, st) {
  return `<section class="section"><h2>Cycle</h2>${cycleCard(avec, st, false)}
    ${avec.cycles.length ? `<div class="list">${avec.cycles.slice().reverse().map(c => `<div class="li"><span class="grow"><b>Cycle ${c.n}</b><span class="small muted">${fdate(c.start)} → ${fdate(c.end)} · ${c.members} membres</span></span>
      <span class="end"><span class="num">${fc(c.value)} / part</span><br><span class="small muted num">${fck(c.distributed)} partagés</span></span></div>`).join('')}</div>` : ''}</section>`;
}

/* ---------- partage ---------- */
function sharePlan(avec, st) {
  const rows = activeM(avec).map(x => {
    const d = st.mem[x.id];
    const loanRem = d.loans.filter(l => l.status !== 'solde').reduce((a, l) => a + l.remaining, 0);
    const debt = Math.max(0, d.fineDebt);
    return { x, d, loanRem, debt, ded: loanRem + debt };
  });
  const parts = rows.reduce((a, r) => a + r.d.parts, 0);
  const ded = rows.reduce((a, r) => a + r.ded, 0);
  const pool = st.loanFund + ded - (st.extDebt || 0);              // l'argent emprunté dehors n'appartient pas aux membres
  const value = parts ? pool / parts : 0;
  rows.forEach(r => {
    r.gross = r.d.parts * value;
    r.blocked = r.gross < r.ded;
    r.net = r.blocked ? 0 : Math.floor((r.gross - r.ded) / 50) * 50;   // arrondi à 50 FC (billets)
    r.grossR = r.blocked ? 0 : r.net + r.ded;                          // part inscrite = argent reçu + dettes retenues
  });
  const paid = rows.reduce((a, r) => a + r.net, 0);
  const extDebt = st.extDebt || 0;
  // le prêteur extérieur est remboursé en premier, avec la caisse de crédit
  return { rows: rows.sort((a, b) => b.d.parts - a.d.parts), parts, ded, pool, value, paid, extDebt, extShort: extDebt > st.loanFund, remainder: st.loanFund - extDebt - paid, blocked: rows.filter(r => r.blocked) };
}

SCREENS['a.share'] = () => {
  const { avec, me, st } = cur();
  const plan = sharePlan(avec, st);
  const open = openMeeting(avec);
  const left = Math.ceil((cycleEnd(avec) - Date.now()) / DAY);
  const pv = avec.settings.partValue;
  const line = (l, v, strong) => `<div class="row between ${strong ? '' : 'small'}" ${strong ? 'style="border-top:1px solid var(--line);padding-top:8px"' : ''}><span>${l}</span><b class="num">${v}</b></div>`;
  return `<div class="shell">${topbar('Partage de fin de cycle', `${esc(avec.name)} · cycle ${avec.cycle.n}`, backBtn('a.more'), syncPill(avec))}<main class="main">
    ${cycleCard(avec, st, false)}
    <div class="card stack">
      <h2>Valeur d'une part</h2>
      ${line('Argent de la caisse de crédit', fc(st.loanFund))}
      ${line('+ Crédits encore à rembourser', fc(st.outstanding))}
      ${line('+ Amendes encore dues', fc(st.fineDebt))}
      ${st.extDebt ? line('− Crédit extérieur à rembourser au prêteur', fc(st.extDebt)) : ''}
      ${line('= Total à partager', fc(plan.pool), true)}
      ${line('÷ Parts des membres', grp(plan.parts))}
      <div class="row between" style="border-top:1px solid var(--line);padding-top:10px"><span class="label">Une part vaut</span><b class="num" style="font-family:var(--f-display);font-size:1.6rem">${fc(plan.value)}</b></div>
      <p class="hint">Achetée ${fc(pv)}, une part vaut ${fc(plan.value)}, soit ${plan.value >= pv ? '+' : ''}${pct(plan.value / pv - 1)}. Ce qu'un membre doit encore (crédit, amendes) est retiré de sa part. La caisse sociale (${fc(st.socialFund)}) n'est pas partagée : elle reste au groupe pour le cycle suivant.</p>
    </div>
    ${st.extDebt ? (plan.extShort ? `<div class="alert bad"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>La caisse ne suffit pas pour rembourser le prêteur</b><span class="small">Il reste ${fc(st.extDebt)} à rendre, la caisse de crédit a ${fc(st.loanFund)}. Récupérez d'abord les crédits des membres.</span></div></div>`
      : `<div class="alert warn"><span style="width:22px;flex:none">${ic('building')}</span><div><b>Le prêteur est remboursé avant le partage</b><span class="small">${fc(st.extDebt)} sortent de la caisse de crédit pour solder le crédit extérieur, puis le reste est partagé.</span></div></div>`) : ''}
    ${plan.blocked.length ? `<div class="alert bad"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>${plan.blocked.length} membre${plan.blocked.length > 1 ? 's doivent plus que leur' : ' doit plus que sa'} part</b><span class="small">${plan.blocked.map(r => esc(r.x.name)).join(', ')} : rembourser la différence avant le partage.</span></div></div>` : ''}
    ${left > 28 ? `<div class="alert warn"><span style="width:22px;flex:none">${ic('calendar')}</span><div><b>Le cycle n'est pas fini</b><span class="small">Fin prévue le ${fdate(cycleEnd(avec))}. Ce tableau est une simulation ; faites le partage seulement si l'assemblée l'a décidé.</span></div></div>` : ''}
    <div class="tablewrap"><table><thead><tr><th>Membre</th><th class="r">Parts</th><th class="r">Valeur</th><th class="r">Retenu</th><th class="r">Reçoit</th></tr></thead><tbody>
      ${plan.rows.map(r => `<tr style="${r.blocked ? 'background:var(--bad-soft)' : ''}"><td>${esc(r.x.name)}</td><td class="r num">${r.d.parts}</td><td class="r num">${fc(r.gross)}</td><td class="r num">${r.ded ? '− ' + fc(r.ded) : '—'}</td><td class="r num"><b>${r.blocked ? 'doit ' + fc(r.ded - r.gross) : fc(r.net)}</b></td></tr>`).join('')}
    </tbody></table></div>
    <div class="receipt stack">
      ${plan.extDebt ? line('Remboursé d\'abord au prêteur', fc(plan.extDebt)) : ''}${line('Argent donné aux membres', fc(plan.paid))}${line('Reste des arrondis (cycle suivant)', fc(plan.remainder))}${line('Caisse sociale (cycle suivant)', fc(st.socialFund))}
    </div>
    ${isBureau(me) ? (open ? `<div class="alert warn"><div><b>Réunion n°${open.n} ouverte</b><span class="small">Fermez-la d'abord : le partage se fait dans une séance à part.</span></div></div>`
      : `<button class="btn primary block xl" data-act="go" data-to="a.shareRun" ${plan.blocked.length || !plan.parts || plan.extShort ? 'disabled' : ''}>${ic('split')} Faire le partage maintenant</button>`) : ''}
    ${avec.cycles.length ? '<button class="btn ghost block" data-act="go" data-to="a.cycles">Historique des cycles</button>' : ''}
  </main></div>`;
};

SCREENS['a.shareRun'] = () => {
  const { avec, me, st } = cur();
  if (!isBureau(me) || openMeeting(avec)) return SCREENS['a.share']();
  const plan = sharePlan(avec, st);
  const dr = draft(avec.id + ':share:' + avec.cycle.n, () => ({ locks: {} }));
  const holders = keyHolders(avec).slice(0, 3);
  const filled = (dr.closeCount || '').trim() !== '';
  return `<div class="shell">${topbar('Séance de partage', `${esc(avec.name)} · cycle ${avec.cycle.n}`, backBtn('a.share'))}<main class="main">
    <div><h2>Le jour du partage</h2><p class="muted">Tout le groupe est réuni. On ouvre la caisse et on compte tout l'argent. Ensuite chaque membre reçoit sa part devant tous, en commençant par ceux qui ont le plus de parts.</p></div>
    <div class="card stack">
      <div class="row between small"><span>Caisse de crédit</span><b class="num">${fc(st.loanFund)}</b></div>
      <div class="row between small"><span>Caisse sociale</span><b class="num">${fc(st.socialFund)}</b></div>
      <div class="row between"><span class="label">Doit être dans la caisse</span><b class="num" style="font-family:var(--f-display);font-size:1.5rem">${fc(st.cash)}</b></div>
      <div class="field"><label for="closeCount">Argent compté (FC)</label><input id="closeCount" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0" value="${esc(dr.closeCount || '')}" data-in="gap" data-exp="${st.cash}" data-out="closeGap"></div>
      <div id="closeGap">${gapHtml(parseAmt(dr.closeCount), st.cash, filled)}</div>
      <div class="field" id="closeGapNote" ${filled && parseAmt(dr.closeCount) !== st.cash ? '' : 'hidden'}><label for="closeNote">Expliquez l'écart (obligatoire)</label><textarea id="closeNote" class="input" rows="2" data-in="keep">${esc(dr.closeNote || '')}</textarea></div>
    </div>
    <div class="receipt stack">
      <div class="row between"><span>À donner aux ${plan.rows.filter(r => r.net > 0).length} membres</span><b class="num">${fc(plan.paid)}</b></div>
      <div class="row between small"><span>Crédits et amendes retenus</span><span class="num">${fc(plan.ded)}</span></div>
      ${plan.extDebt ? `<div class="row between small"><span>Remboursé au prêteur (crédit extérieur)</span><span class="num">${fc(plan.extDebt)}</span></div>` : ''}
      <div class="row between small"><span>Reste dans la caisse pour le cycle ${avec.cycle.n + 1}</span><span class="num">${fc(st.socialFund + plan.remainder)}</span></div>
    </div>
    <section class="section"><h3>Les trois clés</h3>
      <div class="locks3">${holders.map(h => `<button class="lock ${dr.locks[h.id] ? 'ok' : ''}" data-act="lockPin" data-id="${h.id}">${ic(dr.locks[h.id] ? 'lock' : 'key')}<b>${esc(h.name.split(' ')[0])}</b><span class="small muted">${dr.locks[h.id] ? 'confirmé' : 'toucher'}</span></button>`).join('')}</div></section>
    <div class="sticky-foot"><button id="closeBtn" class="btn primary block xl" data-act="runShare" ${closeReady(avec) ? '' : 'disabled'}>${ic('split')} Distribuer et fermer le cycle</button></div>
  </main></div>`;
};

ACT.runShare = () => {
  const { avec, me, st } = cur();
  if (openMeeting(avec)) return App.toast('Fermez d\'abord la réunion en cours');
  const plan = sharePlan(avec, st);
  const dr = App.draft;
  if (plan.blocked.length) return App.toast('Des membres doivent rembourser avant le partage');
  if (plan.extShort) return App.toast('La caisse de crédit ne suffit pas pour rembourser le prêteur');
  if (!closeReady(avec)) return App.toast('Il manque le comptage ou une clé');
  const v = parseAmt(dr.closeCount);
  if (v !== st.cash && !(dr.closeNote || '').trim()) return App.toast('Expliquez l\'écart : c\'est obligatoire');
  const old = avec.cycle, now = Date.now(), by = me.id, next = old.n + 1;
  const m = {
    id: avec.id + '-p' + old.n + '-' + uid(), n: avec.meetings.reduce((a, x) => Math.max(a, x.n), 0) + 1, cycle: old.n, kind: 'partage',
    date: now, status: 'open', presence: {}, openedBy: by, stepDone: 7, openExpected: st.cash, openCount: v, synced: false
  };
  activeM(avec).forEach(x => m.presence[x.id] = 'P');
  avec.meetings.push(m);
  // 1. le prêteur extérieur d'abord
  st.extActive.forEach(e => appendTx(avec, { meetingId: m.id, type: 'EXT_REPAY', ref: e.id, amount: e.remaining, note: `${e.lender} · soldé avant le partage`, by }));
  plan.rows.forEach(r => {
    r.d.loans.filter(l => l.status !== 'solde').forEach(l => appendTx(avec, { meetingId: m.id, type: 'REMB', memberId: r.x.id, ref: l.id, amount: l.remaining, note: 'Retenu sur le partage', by }));
    if (r.debt > 0) appendTx(avec, { meetingId: m.id, type: 'AMENDE', ref: 'DETTE', memberId: r.x.id, amount: r.debt, note: 'Amendes dues, retenues sur le partage', by });
    if (r.grossR > 0) appendTx(avec, { meetingId: m.id, type: 'PARTAGE', memberId: r.x.id, parts: r.d.parts, amount: r.grossR, note: `${r.d.parts} parts × ${fc(r.gross / r.d.parts)} · reçoit ${fc(r.net)}`, by });
  });
  const after = stats(avec);
  const kept = { social: after.socialFund, credit: after.loanFund };
  if (kept.social > 0) appendTx(avec, { meetingId: m.id, type: 'REPORT_OUT', ref: 'social', amount: kept.social, note: 'Caisse sociale gardée pour le cycle suivant', by });
  if (kept.credit > 0) appendTx(avec, { meetingId: m.id, type: 'REPORT_OUT', ref: 'credit', amount: kept.credit, note: 'Reste des arrondis du partage', by });
  if (kept.social > 0) appendTx(avec, { meetingId: m.id, cycle: next, type: 'REPORT_IN', ref: 'social', amount: kept.social, note: `Caisse sociale du cycle ${old.n}`, by });
  if (kept.credit > 0) appendTx(avec, { meetingId: m.id, cycle: next, type: 'REPORT_IN', ref: 'credit', amount: kept.credit, note: `Arrondis du partage du cycle ${old.n}`, by });
  Object.assign(m, {
    status: 'closed', closedAt: Date.now(), closeExpected: after.cash, closeCount: after.cash + (v - st.cash), note: v !== st.cash ? dr.closeNote.trim() : '',
    validators: Object.keys(dr.locks), sealSeq: avec.tx.length, seal: avec.tx[avec.tx.length - 1].hash
  });
  avec.cycles.push({ n: old.n, start: old.start, end: now, parts: plan.parts, value: Math.round(plan.value), partValue: avec.settings.partValue, distributed: plan.paid, socialKept: kept.social, members: plan.rows.length, meetings: st.meetings.length });
  avec.cycle = { n: next, start: now, end: now + (avec.settings.cycleMonths || 12) * 30 * DAY, rulesPending: true };
  DB.save();
  if (K.data.net.online) syncAvec(avec);
  App.go('a.newCycle');
};

/* ---------- nouveau cycle ---------- */
const pickSel = (id, label, opts, v) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input">${opts.map(([val, l]) => `<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
function rolesForm(avec, p) {
  const list = activeM(avec);
  const keys = list.filter(m => m.key);
  const sel = (id, label, selId) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input">${list.map(m => `<option value="${m.id}" ${m.id === selId ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>`;
  return `<div class="card stack">
    ${[['P', 'Président(e)', 'president'], ['S', 'Secrétaire', 'secretaire'], ['T', 'Trésorier(ère) — garde la caisse', 'tresorier']].map(([k, l, r]) => sel(p + k, l, (list.find(m => m.role === r) || {}).id)).join('')}
    ${[0, 1, 2].map(i => sel(p + 'K' + i, 'Porte-clé ' + (i + 1), (keys[i] || list[i + 3] || {}).id)).join('')}</div>`;
}
function readRoles(p) {
  const g = id => document.getElementById(id).value;
  const b = [g(p + 'P'), g(p + 'S'), g(p + 'T')], k = [0, 1, 2].map(i => g(p + 'K' + i));
  if (new Set(b).size < 3) { App.toast('Le bureau doit avoir 3 personnes différentes'); return null; }
  if (new Set(k).size < 3) { App.toast('Les 3 clés doivent aller à 3 personnes différentes'); return null; }
  if (k.includes(b[2])) { App.toast('Le trésorier garde la caisse : il ne peut pas garder une clé'); return null; }
  return { b, k };
}
function applyRoles(avec, r) {
  activeM(avec).forEach(m => {
    const i = r.b.indexOf(m.id);
    m.role = i >= 0 ? ['president', 'secretaire', 'tresorier'][i] : (m.role === 'compteur' ? 'compteur' : 'membre');
    m.key = r.k.includes(m.id);
  });
}
SCREENS['a.newCycle'] = () => {
  const { avec, me, st } = cur();
  const last = avec.cycles[avec.cycles.length - 1];
  const s = avec.settings;
  if (!isBureau(me)) return SCREENS['a.home']();
  return `<div class="shell">${topbar(`Cycle ${avec.cycle.n}`, esc(avec.name), backBtn('a.home'), syncPill(avec))}<main class="main">
    ${last ? `<div class="alert good"><span style="width:26px;flex:none">${ic('check')}</span><div><b>Cycle ${last.n} fermé</b><span class="small">${fck(last.distributed)} partagés entre ${last.members} membres · une part valait ${fc(last.value)}. Caisse de départ : ${fc(st.cash)}.</span></div></div>` : ''}
    <div><h2>Règles du nouveau cycle</h2><p class="muted">L'assemblée vote les règles et le bureau pour tout le cycle. Gardez-les ou changez-les ici.</p></div>
    <div class="card"><div class="grid2">
      ${pickSel('ncP', 'Valeur d\'une part', [[500, '500 FC'], [1000, '1 000 FC'], [2000, '2 000 FC'], [5000, '5 000 FC']], s.partValue)}
      ${pickSel('ncS', 'Caisse sociale', [[200, '200 FC'], [300, '300 FC'], [500, '500 FC'], [1000, '1 000 FC']], s.socialFee)}
      ${pickSel('ncR', 'Intérêt par mois', [[5, '5 %'], [10, '10 %']], s.rate)}
      ${pickSel('ncD', 'Durée max. du crédit', [[1, '1 mois'], [2, '2 mois'], [3, '3 mois'], [6, '6 mois']], s.maxMonths)}
      ${pickSel('ncC', 'Durée du cycle', [[6, '6 mois'], [9, '9 mois'], [12, '12 mois']], s.cycleMonths || 12)}
      ${pickSel('ncF', 'Amende d\'absence', [[200, '200 FC'], [500, '500 FC'], [1000, '1 000 FC']], s.fineAbsent)}
      ${pickSel('ncL', 'Amende de retard', [[100, '100 FC'], [200, '200 FC'], [500, '500 FC']], s.fineLate)}
      ${pickSel('ncX', 'Crédit maximum', [[2, '2 × l\'épargne'], [3, '3 × l\'épargne'], [4, '4 × l\'épargne']], s.maxMult)}
      ${pickSel('ncM', 'Parts par réunion', [[3, '1 à 3 parts'], [5, '1 à 5 parts'], [10, '1 à 10 parts']], s.maxParts)}
      ${pickSel('ncQ', 'Rythme des réunions', [[7, 'Chaque semaine'], [14, 'Toutes les 2 semaines']], s.frequency || 7)}
    </div></div>
    <h2>Bureau et porte-clés</h2>${rolesForm(avec, 'nr')}
    ${approverFields(avec, me, 'nc')}
    <button class="btn primary block xl" data-act="saveNewCycle">${ic('check')} Commencer le cycle ${avec.cycle.n}</button>
  </main></div>`;
};
ACT.saveNewCycle = () => {
  const { avec } = cur();
  const g = id => +document.getElementById(id).value;
  const r = readRoles('nr'); if (!r) return;
  const ap = checkApprover(avec, 'nc', null); if (!ap) return;
  Object.assign(avec.settings, { partValue: g('ncP'), socialFee: g('ncS'), rate: g('ncR'), maxMonths: g('ncD'), cycleMonths: g('ncC'), fineAbsent: g('ncF'), fineLate: g('ncL'), maxMult: g('ncX'), maxParts: g('ncM'), frequency: g('ncQ') });
  avec.cycle.end = avec.cycle.start + avec.settings.cycleMonths * 30 * DAY;
  avec.cycle.rulesPending = false;
  applyRoles(avec, r);
  DB.save(); App.go('a.home'); App.toast(`Cycle ${avec.cycle.n} commencé. Bonne épargne !`);
};
SCREENS['a.cycles'] = () => {
  const { avec, st } = cur();
  return `<div class="shell">${topbar('Historique des cycles', esc(avec.name), backBtn('a.more'), syncPill(avec))}<main class="main">
    <h2>En cours</h2>${cycleCard(avec, st, false)}
    <h2>Cycles terminés</h2>
    ${avec.cycles.slice().reverse().map(c => { const pv = c.partValue || avec.settings.partValue; return `<div class="card stack">
      <div class="row between"><h3>Cycle ${c.n}</h3><span class="small muted">${fdate(c.start)} → ${fdate(c.end)}</span></div>
      <div class="grid2">
        <div><span class="label">Une part valait</span><div class="num" style="font-family:var(--f-display);font-size:1.25rem">${fc(c.value)}</div><span class="small muted">achetée ${fc(pv)} · ${c.value >= pv ? '+' : ''}${pct(c.value / pv - 1)}</span></div>
        <div><span class="label">Partagé</span><div class="num" style="font-family:var(--f-display);font-size:1.25rem">${fck(c.distributed)}</div><span class="small muted">${c.members} membres · ${c.meetings} réunions</span></div>
      </div>
      <p class="small muted">Caisse sociale gardée pour la suite : ${fc(c.socialKept || 0)}</p></div>`; }).join('') || '<div class="card muted">Aucun cycle terminé pour le moment.</div>'}
  </main></div>`;
};
SCREENS['a.roles'] = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return SCREENS['a.home']();
  return `<div class="shell">${topbar('Bureau et porte-clés', esc(avec.name), backBtn('a.more'))}<main class="main">
    <p class="muted">À utiliser seulement quand l'assemblée l'a décidé : démission, départ ou décès d'un responsable. Le changement est validé par deux membres du bureau actuel.</p>
    ${openMeeting(avec) ? '<div class="alert warn"><div><b>Réunion ouverte</b><span class="small">Changez les rôles après la clôture : les clés servent à fermer la caisse.</span></div></div>' : `${rolesForm(avec, 'ro')}${approverFields(avec, me, 'ra')}
    <button class="btn primary block xl" data-act="saveRoles">${ic('check')} Enregistrer le nouveau bureau</button>`}
  </main></div>`;
};
ACT.saveRoles = () => {
  const { avec } = cur();
  const r = readRoles('ro'); if (!r) return;
  const ap = checkApprover(avec, 'ra', null); if (!ap) return;
  applyRoles(avec, r); DB.save(); App.go('a.more'); App.toast('Nouveau bureau enregistré');
};

/* ---------- membres : arrivée, départ, codes ---------- */
function memberActions(avec, me, x, d) {
  const b = isBureau(me), self = me.id === x.id, open = openMeeting(avec);
  const items = [];
  if ((b || self) && !x.left) items.push(`<button class="li" data-act="editMemberSheet" data-id="${x.id}">${rowIc('user')}<span class="grow"><b>Modifier les informations</b><span class="small muted">Téléphone, activité, adresse, âge</span></span>${ic('chev')}</button>`);
  if (self) items.push(`<button class="li" data-act="pinChangeSheet">${rowIc('key')}<span class="grow"><b>Changer mon code secret</b><span class="small muted">4 chiffres, à ne donner à personne</span></span>${ic('chev')}</button>`);
  if (b && !self && !x.left) items.push(`<button class="li" data-act="pinResetSheet" data-id="${x.id}">${rowIc('lock')}<span class="grow"><b>Code oublié</b><span class="small muted">Donner un nouveau code à ce membre</span></span>${ic('chev')}</button>`);
  if (b && !x.left) items.push(`<button class="li" data-act="departSheet" data-id="${x.id}">${rowIc('logout')}<span class="grow"><b>Départ du groupe</b><span class="small muted">${open ? 'Rendre son épargne et fermer son carnet' : 'Se fait pendant une réunion ouverte'}</span></span>${ic('chev')}</button>`);
  if (self && !b) items.push(`<button class="li" data-act="langSheet">${rowIc('globe')}<span class="grow"><b>Langue</b><span class="small muted">${esc(I18N.name())}</span></span>${ic('chev')}</button>`);
  if (self && !b) items.push(`<button class="li" data-act="go" data-to="guide">${rowIc('book')}<span class="grow"><b>Guide d'utilisation</b><span class="small muted">Comment marche l'AVEC et l'application</span></span>${ic('chev')}</button>`);
  return `${d.fineDebt > 0 ? `<div class="alert warn"><span style="width:22px;flex:none">${ic('gavel')}</span><div><b>Amendes dues : ${fc(d.fineDebt)}</b><span class="small">À payer à la prochaine réunion. Sinon, retenues au partage.</span></div></div>` : ''}
    ${x.left ? `<div class="alert warn"><div><b>A quitté le groupe le ${fdate(x.left)}</b><span class="small">Son histoire reste dans le journal.</span></div></div>` : ''}
    ${items.length ? `<div class="list">${items.join('')}</div>` : ''}`;
}
const codeSheet = (title, pin) => `<h2>${esc(title)}</h2>
  <div class="receipt" style="text-align:center"><span class="label">Code secret provisoire</span><div class="num" style="font-family:var(--f-display);font-size:2.6rem;letter-spacing:.25em">${pin}</div></div>
  <p class="hint">Donnez ce code en main propre, jamais par message. Le membre le changera dans « Mon carnet ».</p>
  <button class="btn primary block xl" data-act="closeSheet">C'est noté</button>`;
const newPin = () => { let p; do { p = String(1000 + Math.floor(Math.random() * 9000)); } while (WEAK_PINS.includes(p)); return p; };

ACT.addMemberSheet = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Seul le bureau peut ajouter un membre');
  App.openSheet(`<h2>Ajouter un membre</h2><p class="muted">L'assemblée doit être d'accord. Le nouveau membre achète ses parts à partir de maintenant.</p>
    ${memberFormHtml('nm')}
    ${approverFields(avec, me, 'nm')}
    <button class="btn primary block xl" data-act="saveMember">${ic('plus')} Ajouter au groupe</button>`);
};
ACT.saveMember = () => {
  const { avec } = cur();
  const r = readMemberForm('nm'); if (r.error) return App.toast(r.error);
  const name = r.data.name;
  if (avec.members.some(m => !m.left && m.name.toLowerCase() === name.toLowerCase())) return App.toast('Ce nom existe déjà dans le groupe');
  const ap = checkApprover(avec, 'nm', null); if (!ap) return;
  const pin = newPin();
  const x = Object.assign({ id: avec.id + '-' + uid() }, r.data, { pin, role: 'membre', key: false, joined: Date.now() });
  avec.members.push(x);
  const m = openMeeting(avec);
  if (m && m.stepDone < 3) m.presence[x.id] = 'P';
  DB.save();
  App.openSheet(codeSheet(`${name} est membre`, pin));
};
ACT.pinChangeSheet = () => App.openSheet(`<h2>Changer mon code</h2>
  <div class="field"><label for="pcO">Code actuel</label><input id="pcO" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
  <div class="grid2"><div class="field"><label for="pcN">Nouveau code</label><input id="pcN" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
  <div class="field"><label for="pcC">Encore une fois</label><input id="pcC" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>
  <p class="hint">Évitez 1234, 0000 ou votre année de naissance.</p>
  <button class="btn primary block xl" data-act="savePin">Enregistrer mon code</button>`);
ACT.savePin = () => {
  const { me } = cur();
  const o = document.getElementById('pcO').value, n = document.getElementById('pcN').value, c = document.getElementById('pcC').value;
  if (o !== me.pin) return App.toast('Le code actuel est faux');
  if (!/^\d{4}$/.test(n)) return App.toast('Le code doit avoir 4 chiffres');
  if (WEAK_PINS.includes(n)) return App.toast('Ce code est trop facile à deviner');
  if (n !== c) return App.toast('Les deux nouveaux codes sont différents');
  me.pin = n; DB.save(); App.closeSheet(); App.toast('Code changé');
};
ACT.pinResetSheet = d => {
  const { avec, me } = cur(); const x = memberOf(avec, d.id);
  App.openSheet(`<h2>Code oublié</h2><p class="muted">Un nouveau code sera créé pour <b>${esc(x.name)}</b>. L'ancien ne marchera plus.</p>
    ${approverFields(avec, me, 'pr')}<button class="btn primary block xl" data-act="savePinReset" data-id="${x.id}">Créer un nouveau code</button>`);
};
ACT.savePinReset = d => {
  const { avec } = cur(); const x = memberOf(avec, d.id);
  const ap = checkApprover(avec, 'pr', x.id); if (!ap) return;
  x.pin = newPin(); secLog(avec, 'nouveau code secret', x.id, 'bureau : ' + ap.name); DB.save();
  App.openSheet(codeSheet(`Nouveau code de ${x.name.split(' ')[0]}`, x.pin));
};
function departCalc(avec, st, x) {
  const d = st.mem[x.id];
  const rem = d.loans.filter(l => l.status !== 'solde').reduce((a, l) => a + l.remaining, 0);
  const debt = Math.max(0, d.fineDebt);
  return { d, rem, debt, refund: d.savings - rem - debt };
}
ACT.departSheet = d => {
  const { avec, me, st } = cur(); const x = memberOf(avec, d.id);
  if (!openMeeting(avec)) return App.toast('Le départ se fait pendant une réunion, devant tous');
  const c = departCalc(avec, st, x);
  const role = isBureau(x) || x.key;
  App.openSheet(`<h2>Départ de ${esc(x.name)}</h2>
    <div class="receipt stack">
      <div class="row between small"><span>Épargne (${c.d.parts} parts)</span><b class="num">${fc(c.d.savings)}</b></div>
      <div class="row between small"><span>− Crédit à rembourser</span><b class="num">${fc(c.rem)}</b></div>
      <div class="row between small"><span>− Amendes dues</span><b class="num">${fc(c.debt)}</b></div>
      <div class="row between" style="border-top:1px dashed var(--line);padding-top:8px"><span>Argent rendu</span><b class="num" style="font-family:var(--f-display);font-size:1.3rem">${fc(Math.max(0, c.refund))}</b></div>
    </div>
    <p class="hint">Un membre qui part avant la fin du cycle récupère son épargne, sans les bénéfices : ceux-ci restent au groupe. Son carnet est fermé, son histoire reste dans le journal.</p>
    ${role ? `<div class="alert warn"><div><b>${esc(x.name.split(' ')[0])} a un rôle (${roleLabel(x)})</b><span class="small">Après la réunion, élisez un remplaçant dans « Plus › Bureau et porte-clés ».</span></div></div>` : ''}
    ${c.refund < 0 ? `<div class="alert bad"><div><b>Départ impossible pour le moment</b><span class="small">Le membre doit d'abord rembourser ${fc(-c.refund)}.</span></div></div>`
      : c.refund > st.loanFund ? `<div class="alert bad"><div><b>Pas assez d'argent dans la caisse de crédit</b><span class="small">Disponible : ${fc(st.loanFund)}. Attendez les prochains remboursements.</span></div></div>`
      : `${approverFields(avec, me, 'dp')}<button class="btn danger block xl" data-act="saveDepart" data-id="${x.id}">Rendre ${fc(c.refund)} et fermer le carnet</button>`}`);
};
ACT.saveDepart = d => {
  const { avec, me, st } = cur(); const x = memberOf(avec, d.id); const m = openMeeting(avec);
  if (!m) return App.toast('Aucune réunion ouverte');
  const c = departCalc(avec, st, x);
  if (c.refund < 0 || c.refund > st.loanFund) return App.toast('Départ impossible pour le moment');
  const ap = checkApprover(avec, 'dp', x.id); if (!ap) return;
  c.d.loans.filter(l => l.status !== 'solde').forEach(l => appendTx(avec, { meetingId: m.id, type: 'REMB', memberId: x.id, ref: l.id, amount: l.remaining, note: 'Retenu sur l\'épargne au départ', by: me.id }));
  if (c.debt > 0) appendTx(avec, { meetingId: m.id, type: 'AMENDE', ref: 'DETTE', memberId: x.id, amount: c.debt, note: 'Amendes retenues au départ', by: me.id });
  appendTx(avec, { meetingId: m.id, type: 'DEPART', memberId: x.id, amount: c.d.savings, note: `Épargne rendue ${fc(c.refund)} · validé par ${ap.name}`, by: me.id });
  x.left = Date.now();
  if (isBureau(x) || x.key) x.key = false;
  DB.save(); App.closeSheet(); App.toast(`${x.name} a quitté le groupe`);
};

/* ---------- lieu du groupe (liste officielle des provinces et territoires) ---------- */
ACT.placeSheet = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  App.openSheet(`<h2>Lieu du groupe</h2>
    <p class="muted">Province et territoire ou ville : liste officielle de la RDC. Le reste s'écrit ; les noms déjà utilisés sont proposés.</p>
    ${geoFields('pl', avec)}
    <button class="btn primary block xl" data-act="savePlace">${ic('check')} Enregistrer le lieu</button>`);
};
ACT.savePlace = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  const g = readGeo('pl');
  if (!g.province) return App.toast('Choisissez la province');
  if (!g.territoire) return App.toast('Choisissez le territoire ou la ville');
  if (!g.village) return App.toast('Écrivez le village ou le quartier');
  Object.assign(avec, g);
  DB.save(); App.closeSheet(); App.toast('Lieu enregistré : ' + placeShort(avec).replace(/<[^>]+>/g, ''));
};

/* ---------- plus ---------- */
SCREENS['a.more'] = () => {
  const { avec, me } = cur();
  const s = avec.settings;
  const org = avec.orgId ? K.data.orgs.find(o => o.id === avec.orgId) : null;
  const anim = avec.animId ? userById(avec.animId) : null;
  const li = (to, icon, title, sub, act = 'go') => `<button class="li" data-act="${act}" ${act === 'go' ? `data-to="${to}"` : ''}>${rowIc(icon)}<span class="grow"><b>${title}</b><span class="small muted">${sub}</span></span>${ic('chev')}</button>`;
  return `<div class="shell">${aTop(avec)}<main class="main">
    <h1>Plus</h1>
    <div class="list">
      ${li('a.share', 'split', 'Partage de fin de cycle', `Cycle ${avec.cycle.n} · fin le ${fdate(cycleEnd(avec))}`)}
      ${li('a.imf', 'chart', 'Dossier pour une IMF', 'Partager les chiffres du groupe pour un crédit extérieur')}
      ${li('a.cycles', 'calendar', 'Historique des cycles', `${avec.cycles.length} cycle${avec.cycles.length > 1 ? 's' : ''} terminé${avec.cycles.length > 1 ? 's' : ''}`)}
      ${li('a.roles', 'users', 'Bureau et porte-clés', 'Changer un responsable')}
      ${li('', 'map', 'Lieu du groupe', placeShort(avec) || 'À compléter', 'placeSheet')}
      ${li('a.security', 'shield', 'Sécurité et carte de secours', `${(avec.rescue || []).filter(r => !r.used).length} codes de secours valables`)}
      ${li('a.member', 'user', 'Mon carnet et mon code', esc(me.name)).replace('data-to="a.member"', `data-to="a.member" data-id="${me.id}"`)}
      ${li('', 'sync', 'Changer de téléphone', 'Mettre l\'AVEC sur un nouveau téléphone', 'transferSheet').replace('data-act="transferSheet"', `data-act="transferSheet" data-id="${avec.id}"`)}
      ${li('dev.backup', 'home', 'Installer et sauvegarder', K.data.lastBackup ? 'Dernière sauvegarde ' + ago(K.data.lastBackup) : 'Aucune sauvegarde pour le moment')}
      ${li('guide', 'book', 'Guide d\'utilisation', 'Tout sur l\'AVEC et l\'application')}
      ${li('', 'globe', 'Langue', I18N.name(), 'langSheet')}
      ${li('', 'cloud', 'Synchronisation', `${pending(avec)} écriture(s) à envoyer`, 'syncSheet')}
    </div>
    <section class="section"><h2>Règlement intérieur · cycle ${avec.cycle.n}</h2><div class="list">
      ${[['Valeur d\'une part', fc(s.partValue)], ['Parts par réunion', '1 à ' + s.maxParts], ['Caisse sociale', fc(s.socialFee) + ' par réunion'], ['Intérêt du crédit', s.rate + ' % par mois'], ['Crédit maximum', s.maxMult + ' × l\'épargne'], ['Durée maximum du crédit', s.maxMonths + ' mois'], ['Amende absence / retard', fc(s.fineAbsent) + ' / ' + fc(s.fineLate)], ['Durée du cycle', (s.cycleMonths || 12) + ' mois'], ['Réunions', (s.meetingDay ? s.meetingDay + ', ' : '') + ((s.frequency || 7) === 14 ? 'toutes les 2 semaines' : 'chaque semaine')]]
        .map(([k, v]) => `<div class="li"><span class="grow">${k}</span><b class="num">${v}</b></div>`).join('')}
    </div><p class="hint">Les règles sont votées par l'assemblée au début de chaque cycle et ne changent pas en cours de cycle.</p></section>
    <section class="section"><h2>Accompagnement</h2>
      ${org ? `<div class="card stack"><div class="row">${rowIc('building')}<div><b>${esc(org.name)}</b><p class="small muted">Animateur : ${esc(anim ? anim.name : '—')}</p></div></div>
        ${avec.visits.map(v => `<div class="receipt"><div class="row between small"><b>Visite du ${fdate(v.ts)}</b><span class="muted">${esc(userById(v.by)?.name || '')}</span></div><p class="small">${esc(v.note)}</p></div>`).join('')}</div>`
        : '<div class="card"><b>AVEC autonome</b><p class="small muted">Votre groupe n\'est suivi par aucune organisation. Vos données ne sont visibles que par vous.</p></div>'}
    </section>
    <div class="list">${li('', 'logout', 'Changer d\'utilisateur', 'Connecté : ' + esc(me.name), 'logout')}</div>
  </main>${tabbar(A_TABS, 'a.more')}</div>`;
};
