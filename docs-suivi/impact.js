/* Akiba AVEC — qualité des données, « prête pour une IMF » et écran Impact de l'organisation.
   Trois promesses : des opérations hors ligne fidèles aux pratiques des AVEC, des données fiables et vérifiables,
   une supervision moins coûteuse et une passerelle vers la finance formelle. Tout se calcule sur le téléphone, à partir du journal scellé. */
'use strict';

const QUALITY_LEVELS = [[80, 'good', 'Bonne'], [60, 'warn', 'Moyenne'], [0, 'bad', 'Faible']];
const qualityLevel = score => QUALITY_LEVELS.find(([min]) => score >= min);

/* indice de qualité des données, sur 100 : ce qu'un prêteur ou un bailleur regarde avant de faire confiance aux chiffres */
function dataQuality(avec, st, ch) {
  const items = [];
  const add = (label, max, ratio, detail) => items.push({ label, max, pts: Math.round(max * Math.max(0, Math.min(1, ratio))), detail });
  const n = st.meetings.length;
  const freq = avec.settings.frequency || 7;

  add('Journal scellé intact', 25, ch.ok ? 1 : 0, ch.ok ? `${avec.tx.length} écritures, aucune modification` : 'Le journal a été modifié');

  const since = st.last ? (Date.now() - st.last.date) / DAY : Infinity;
  add('Réunions régulières', 20, since <= freq * 1.5 ? 1 : since <= freq * 3 ? .5 : 0,
    st.last ? `Dernière réunion ${ago(st.last.date)}` : 'Aucune réunion ce cycle');

  add('Caisse juste à la clôture', 20, n ? 1 - st.ecarts.length / n : 0,
    n ? `${n - st.ecarts.length} réunions justes sur ${n}` : 'Pas encore de réunion');

  const sealed = st.meetings.filter(m => (m.validators || []).length >= 3).length;
  add('Caisse fermée avec les trois clés', 10, n ? sealed / n : 0, n ? `${sealed} réunions sur ${n}` : 'Pas encore de réunion');

  if (avec.orgId) {
    const late = daysAgo(avec.lastSync || 0);
    add('Données envoyées à l\'organisation', 15, !pending(avec) || late <= 7 ? 1 : late <= 14 ? .5 : 0,
      avec.lastSync ? `Dernier envoi ${ago(avec.lastSync)}` : 'Jamais envoyées');
  } else add('Données envoyées à l\'organisation', 15, 1, 'AVEC autonome : rien à envoyer');

  const act = avec.members.filter(m => !m.left);
  const full = act.filter(m => hasPhone(m) && m.activity).length;
  add('Fiches des membres complètes', 10, act.length ? full / act.length : 0, `${full} fiches sur ${act.length} avec téléphone et activité`);

  const score = items.reduce((a, i) => a + i.pts, 0);
  const [, lvl, label] = qualityLevel(score);
  return { score, lvl, label, items };
}

/* « prête pour une IMF » : chaque critère est affiché, pour que le groupe sache quoi améliorer */
function imfReady(avec, st, ch, q) {
  const done = st.loanList.filter(l => l.status === 'solde');
  const onTime = done.filter(l => !l.pays.length || l.pays[l.pays.length - 1].ts <= l.dueDate + 7 * DAY).length;
  const months = Math.max(0, Math.floor((Date.now() - (avec.createdAt || avec.cycle.start)) / (30 * DAY)));
  const rate = done.length ? onTime / done.length : null;
  q = q || dataQuality(avec, st, ch);
  const crit = [
    { label: 'Au moins 6 mois d\'activité', ok: months >= 6, value: `${months} mois` },
    { label: 'Au moins 90 % des crédits remboursés à temps', ok: done.length >= 3 && rate >= .9, value: done.length >= 3 ? `${pct(rate)} sur ${done.length} crédits soldés` : `${done.length} crédit(s) soldé(s), 3 au moins` },
    { label: 'Portefeuille à risque de 5 % au plus', ok: st.par <= .05, value: pct(st.par) },
    { label: 'Présence d\'au moins 80 %', ok: st.meetings.length > 0 && st.attendance >= .8, value: st.meetings.length ? pct(st.attendance) : '—' },
    { label: 'Au plus un écart de caisse ce cycle', ok: st.meetings.length > 0 && st.ecarts.length <= 1, value: `${st.ecarts.length} écart(s)` },
    { label: 'Qualité des données bonne (80 sur 100)', ok: q.score >= 80, value: `${q.score} / 100` },
    { label: 'Aucun crédit extérieur en retard', ok: !st.extList.some(e => e.status === 'retard'), value: st.extList.length ? `${st.extList.length} crédit(s) extérieur(s)` : 'aucun' }
  ];
  const missing = crit.filter(c => !c.ok).length;
  const level = !missing ? 'ready' : missing <= 2 ? 'close' : 'not';
  return { level, missing, crit, label: { ready: 'Prête pour une IMF', close: 'Presque prête', not: 'Pas encore prête' }[level], chip: { ready: 'good', close: 'warn', not: '' }[level] };
}

const qualityChip = q => `<span class="chip ${q.lvl}">${q.score}/100</span>`;
const readyChip = r => `<span class="chip ${r.chip}">${r.label}</span>`;

/* fiche « qualité des données » (écran de l'AVEC, fiche de l'animateur) */
function qualityCard(q) {
  return `<section class="card stack"><div class="row between"><h2>Qualité des données</h2>${qualityChip(q)}</div>
    <div class="bar"><i style="width:${q.score}%;background:var(--${q.lvl})"></i></div>
    <div class="stack" style="gap:6px">${q.items.map(i => `<div class="row between small" style="align-items:flex-start;gap:10px"><span><b>${i.label}</b><br><span class="muted">${esc(i.detail)}</span></span><b class="num" style="white-space:nowrap">${i.pts}/${i.max}</b></div>`).join('')}</div>
    <p class="hint">Qualité ${q.label.toLowerCase()} : c'est ce que regardent une IMF ou un bailleur avant de faire confiance aux chiffres.</p></section>`;
}

/* fiche « prête pour une IMF » */
function readyCard(r) {
  return `<section class="card stack"><div class="row between"><h2>Prête pour une IMF ?</h2>${readyChip(r)}</div>
    <div class="list">${r.crit.map(c => `<div class="li"><span style="width:22px;flex:none;color:var(--${c.ok ? 'good' : 'bad'})">${ic(c.ok ? 'check' : 'x')}</span><span class="grow"><b>${c.label}</b><span class="small muted">${esc(c.value)}</span></span></div>`).join('')}</div>
    <p class="hint">${r.level === 'ready' ? 'Tous les critères sont remplis : le dossier peut être présenté à une IMF.' : `Encore ${r.missing} critère${r.missing > 1 ? 's' : ''} à remplir avant de présenter le dossier à une IMF.`} Indicateur au niveau du groupe : aucune donnée personnelle des membres n'est utilisée.</p></section>`;
}

/* ---------- écran Impact de l'organisation ---------- */
SCREENS['o.impact'] = () => {
  const u = K.session && K.session.userId ? me_user() : null;
  if (!u || u.role !== 'org') return SCREENS[homeScreen()]({});
  const org = orgOf(u.orgId);
  const rows = myAvecs(u).filter(isActive).map(avec => {
    const s = sup(avec), q = dataQuality(avec, s.st, s.ch);
    return Object.assign(s, { q, r: imfReady(avec, s.st, s.ch, q) });
  });
  const n = rows.length, sum = f => rows.reduce((a, r) => a + f(r), 0);
  const kpi = (l, v, sub) => `<div class="kpi"><span>${l}</span><b class="num">${v}</b><span>${sub}</span></div>`;
  const members = sum(r => r.st.activeCount), women = sum(r => r.st.women);
  const meetings = sum(r => r.avec.meetings.filter(m => m.status === 'closed').length);
  const intact = rows.filter(r => r.ch.ok).length;
  const qAvg = n ? Math.round(sum(r => r.q.score) / n) : 0;
  const byLvl = l => rows.filter(r => r.q.lvl === l).length;
  const allM = sum(r => r.st.meetings.length), sealed3 = sum(r => r.st.meetings.filter(m => (m.validators || []).length >= 3).length);
  const fresh = rows.filter(r => !r.avec.orgId || !pending(r.avec) || daysAgo(r.avec.lastSync || 0) <= 7).length;
  const calm = rows.filter(r => !r.h.alerts.length).length;
  const since90 = Date.now() - 90 * DAY;
  const visits = sum(r => (r.avec.visits || []).filter(v => v.ts >= since90).length);
  const visited = rows.filter(r => (r.avec.visits || []).some(v => v.ts >= since90)).length;
  const done = rows.flatMap(r => r.st.loanList.filter(l => l.status === 'solde'));
  const onTime = done.filter(l => !l.pays.length || l.pays[l.pays.length - 1].ts <= l.dueDate + 7 * DAY).length;
  const ready = rows.filter(r => r.r.level === 'ready'), close = rows.filter(r => r.r.level === 'close');
  const bar = (part, total, color = 'brand') => `<div class="bar"><i style="width:${total ? Math.round(part / total * 100) : 0}%;background:var(--${color})"></i></div>`;
  const pillar = (n0, title, text, body) => `<section class="section"><h2>${n0}. ${title}</h2><p class="small muted">${text}</p>${body}</section>`;

  return `<div class="shell wide">${topbar('Impact', esc(org.name), backBtn('o.home'))}<main class="main">
    <div class="card stack" style="background:var(--brand-soft);border:0">
      <b style="font-family:var(--f-display);font-size:clamp(1rem,3.4vw,1.2rem);line-height:1.3;font-weight:700">Une infrastructure numérique hors ligne, conçue autour des pratiques réelles des AVEC rurales, transforme leurs opérations quotidiennes en données financières fiables et vérifiables, réduit le coût de leur supervision et crée une passerelle vers le système financier formel.</b>
      <span class="small muted">Chiffres calculés sur ${n} AVEC suivies, à partir des journaux scellés reçus par l'organisation.</span>
    </div>

    ${pillar(1, 'Hors ligne, au rythme des AVEC', 'Les réunions se tiennent sans réseau, dans l\'ordre du cahier, et chaque franc est écrit au moment où il bouge.',
      `<div class="kpis">${kpi('AVEC suivies', n, `${calm} sans alerte`)}${kpi('Membres', members, members ? `${pct(women / members)} de femmes` : '—')}${kpi('Réunions enregistrées', grp(meetings), 'depuis le début')}${kpi('Écritures scellées', grp(sum(r => r.avec.tx.length)), 'dans les journaux')}</div>`)}

    ${pillar(2, 'Des données fiables et vérifiables', 'Chaque écriture est enchaînée à la précédente : une modification se voit. L\'indice de qualité résume ce qu\'un prêteur regarde.',
      `<div class="kpis">${kpi('Journaux intacts', `${intact}/${n}`, intact === n ? 'aucune modification détectée' : `${n - intact} à vérifier`)}${kpi('Qualité moyenne', `${qAvg}/100`, `${byLvl('good')} bonne · ${byLvl('warn')} moyenne · ${byLvl('bad')} faible`)}${kpi('Caisse fermée à 3 clés', allM ? pct(sealed3 / allM) : '—', `${sealed3} réunions sur ${allM} ce cycle`)}${kpi('Écarts de caisse', sum(r => r.st.ecarts.length), 'ce cycle, tous expliqués')}</div>
       <div class="card stack"><div class="row between small"><span>AVEC à la qualité bonne</span><b class="num">${byLvl('good')}/${n}</b></div>${bar(byLvl('good'), n, 'good')}</div>`)}

    ${pillar(3, 'Une supervision allégée', 'L\'animateur suit les AVEC à distance et se déplace là où les alertes le demandent.',
      `<div class="kpis">${kpi('Données à jour', `${fresh}/${n}`, 'reçues depuis moins de 7 jours')}${kpi('AVEC sans alerte', `${calm}/${n}`, 'pas de visite urgente')}${kpi('Alertes à traiter', sum(r => r.h.alerts.length), 'écarts, retards, réunions manquées')}${kpi('Visites (90 jours)', visits, `${visited} AVEC visitées · ${n - visited} suivies à distance`)}</div>`)}

    ${pillar(4, 'Une passerelle vers la finance formelle', 'Un historique vérifiable et des critères clairs ouvrent la discussion avec une IMF, au niveau du groupe.',
      `<div class="kpis">${kpi('Prêtes pour une IMF', `${ready.length}/${n}`, `${close.length} presque prêtes`)}${kpi('Épargne cumulée', fck(sum(r => r.st.sum.EPARGNE)), 'cycle en cours')}${kpi('Crédits remboursés à temps', done.length ? pct(onTime / done.length) : '—', `${done.length} crédits soldés`)}${kpi('Crédits extérieurs', sum(r => r.st.extList.length), `${fck(sum(r => r.st.sum.EXT_IN))} obtenus · ${sum(r => (r.avec.imfShares || []).length)} dossiers IMF`)}</div>
       ${ready.length || close.length ? `<div class="list">${ready.concat(close).map(r => `<button class="li" data-act="go" data-to="n.avec" data-id="${r.avec.id}"><span class="grow"><b>${esc(r.avec.name)}</b><span class="small muted">${esc(r.avec.village)} · qualité ${r.q.score}/100${r.r.missing ? ` · ${r.r.missing} critère${r.r.missing > 1 ? 's' : ''} à remplir` : ''}</span></span>${readyChip(r.r)}${ic('chev')}</button>`).join('')}</div>` : '<div class="card small muted">Aucune AVEC n\'est encore prête : ouvrez une fiche pour voir les critères à remplir.</div>'}`)}

    <p class="hint">Les AVEC autonomes n'apparaissent pas ici. Aucune donnée personnelle des membres n'entre dans ces chiffres.</p>
  </main></div>`;
};
