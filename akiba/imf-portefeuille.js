/* Akiba Suivi — dossier IMF d'un portefeuille d'AVEC.

   Une AVEC seule prépare déjà son dossier (externe.js). Une organisation, elle, ne présente pas
   un groupe : elle présente un portefeuille. Une IMF qui reçoit quarante groupes d'un coup veut
   d'abord une ligne par groupe pour choisir, puis le détail des crédits derrière.

   Deux garde-fous, les mêmes que pour un groupe seul :
   — rien ne part sans que l'organisation confirme l'accord des assemblées générales ;
   — les noms des membres restent dehors par défaut, et aucun téléphone ni adresse n'y entre jamais.

   Chaque envoi laisse une trace dans le journal de suivi de chaque groupe retenu : on sait
   toujours quelles données sont parties, à qui, et quel jour. */
'use strict';

const imfPortefeuilleAvecs = u => myAvecs(u).filter(isActive);

/* une ligne par groupe : ce qu'une IMF regarde avant de dire oui */
function imfLigne(avec, nom) {
  const i = imfIndicators(avec), st = i.st;
  const q = dataQuality(avec, st, chainOf(avec));
  const r = imfReady(avec, st, chainOf(avec), q);
  return [nom, avec.village || '', placeShort(avec).replace(/^[^·]*·\s*/, ''), i.months,
    st.activeCount, st.activeCount ? st.women / st.activeCount : null, st.attendance,
    avec.cycles.length, st.sum.EPARGNE, st.shareValue, st.loanList.length, st.sum.CREDIT,
    i.onTime === null ? null : i.onTime, st.outstanding, st.par, st.socialFund,
    st.extList.length, st.extDebt, st.ecarts.length, i.chainOk ? 'intact' : 'ALTÉRÉ',
    q.score, r.label];
}
const IMF_COLS = [
  { h: 'AVEC', w: 22 }, { h: 'Village', w: 16 }, { h: 'Territoire', w: 16 }, { h: 'Ancienneté (mois)', w: 10, t: 'n' },
  { h: 'Membres', w: 9, t: 'n' }, { h: 'Part de femmes', w: 10, t: 'p' }, { h: 'Présence', w: 9, t: 'p' },
  { h: 'Cycles terminés', w: 10, t: 'n' }, { h: 'Épargne du cycle (FC)', w: 14, t: 'n' }, { h: 'Valeur de la part (FC)', w: 13, t: 'n' },
  { h: 'Crédits accordés', w: 10, t: 'n' }, { h: 'Montant prêté (FC)', w: 14, t: 'n' }, { h: 'Remboursés à temps', w: 11, t: 'p' },
  { h: 'Encours (FC)', w: 13, t: 'n' }, { h: 'Portefeuille à risque', w: 11, t: 'p' }, { h: 'Caisse sociale (FC)', w: 13, t: 'n' },
  { h: 'Crédits extérieurs', w: 10, t: 'n' }, { h: 'Dette extérieure (FC)', w: 13, t: 'n' },
  { h: 'Écarts de caisse', w: 10, t: 'n' }, { h: 'Journal', w: 10 },
  { h: 'Qualité des données /100', w: 12, t: 'n' }, { h: 'Prête pour une IMF', w: 16 },
];

function imfPortefeuilleFeuilles(rows, org, noms) {
  const nomDe = r => noms ? r.avec.name : 'AVEC ' + (rows.indexOf(r) + 1);
  const credits = [], exts = [], aides = [];
  rows.forEach(r => {
    const nom = nomDe(r), st = r.st;
    const etiquette = new Map(activeM(r.avec).map((m, i) => [m.id, noms ? m.name : 'Membre ' + (i + 1)]));
    st.loanList.forEach(l => {
      const m = memberOf(r.avec, l.memberId) || {};
      credits.push([nom, etiquette.get(l.memberId) || '—', m.sex === 'M' ? 'H' : 'F', l.ts, l.principal, l.months,
        l.due, l.paid, l.remaining, l.status === 'solde' ? 'Soldé' : l.status === 'retard' ? 'En retard' : 'En cours', l.daysLate, butDe(l.note)]);
    });
    /* La caisse sociale est ce qui distingue une AVEC d'un simple groupe d'épargne : elle paie
       la maladie, le deuil, la naissance. Un bailleur le demande toujours, et cela ne sortait
       dans aucun tableau. */
    r.avec.tx.filter(x => x.type === 'AIDE').forEach(x => {
      const mm = memberOf(r.avec, x.memberId);
      aides.push([nom, mm ? etiquette.get(mm.id) || (noms ? mm.name : 'Membre') : '—', mm && mm.sex === 'M' ? 'H' : 'F', x.ts, x.amount, butDe(x.note)]);
    });
    st.extList.forEach(e => exts.push([nom, e.lender, e.ts, e.principal, e.rate / 100, e.months, e.fees, e.guar, e.due, e.paid, e.remaining, e.dueDate,
      e.status === 'solde' ? 'Remboursé' : e.status === 'retard' ? 'En retard' : 'En cours']));
  });
  const total = k => rows.reduce((a, r) => a + k(r), 0);
  return [
    { name: 'Portefeuille', cols: IMF_COLS, rows: rows.map(r => imfLigne(r.avec, nomDe(r))) },
    { name: 'Résumé', cols: [{ h: 'Indicateur', w: 34 }, { h: 'Valeur', w: 18 }],
      rows: [
        ['Organisation', org.name],
        ['Date du dossier', isoDay(Date.now())],
        ['AVEC présentées', rows.length],
        ['Membres', total(r => r.st.activeCount)],
        ['Part de femmes', total(r => r.st.activeCount) ? total(r => r.st.women) / total(r => r.st.activeCount) : null],
        ['Épargne cumulée (FC)', total(r => r.st.sum.EPARGNE)],
        ['Encours de crédit (FC)', total(r => r.st.outstanding)],
        ['Portefeuille à risque', total(r => r.st.outstanding) ? total(r => r.st.lateAmt) / total(r => r.st.outstanding) : 0],
        ['Journaux intacts', rows.filter(r => chainOf(r.avec).ok).length + ' / ' + rows.length],
        ['Noms des membres', noms ? 'inclus, avec accord des assemblées' : 'remplacés par Membre 1, Membre 2…'],
      ] },
    { name: 'Crédits internes', cols: [{ h: 'AVEC', w: 22 }, { h: 'Membre', w: 20 }, { h: 'Sexe', w: 6 }, { h: 'Date', w: 12, t: 'd' },
      { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Durée (mois)', w: 9, t: 'n' }, { h: 'Total dû (FC)', w: 12, t: 'n' },
      { h: 'Remboursé (FC)', w: 12, t: 'n' }, { h: 'Reste (FC)', w: 11, t: 'n' }, { h: 'Situation', w: 11 }, { h: 'Jours de retard', w: 9, t: 'n' },
      { h: 'But du crédit', w: 26 }],
      rows: credits },
    { name: 'Aides sociales', cols: [{ h: 'AVEC', w: 22 }, { h: 'Membre', w: 20 }, { h: 'Sexe', w: 6 }, { h: 'Date', w: 12, t: 'd' },
      { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Motif', w: 30 }],
      rows: aides },
    { name: 'Crédits extérieurs', cols: [{ h: 'AVEC', w: 22 }, { h: 'Prêteur', w: 22 }, { h: 'Date', w: 12, t: 'd' },
      { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Intérêt par mois', w: 9, t: 'p' }, { h: 'Durée (mois)', w: 9, t: 'n' },
      { h: 'Frais (FC)', w: 11, t: 'n' }, { h: 'Garantie (FC)', w: 12, t: 'n' }, { h: 'Total dû (FC)', w: 12, t: 'n' },
      { h: 'Remboursé (FC)', w: 12, t: 'n' }, { h: 'Reste (FC)', w: 11, t: 'n' }, { h: 'Échéance', w: 12, t: 'd' }, { h: 'Situation', w: 11 }],
      rows: exts },
  ];
}

SCREENS['o.imf'] = () => {
  const u = K.session && K.session.userId ? me_user() : null;
  if (!estSuivi() || !u || u.role !== 'org') return SCREENS[homeScreen()]({});
  const org = orgOf(u.orgId) || { id: u.orgId, name: 'Mon organisation' };
  const rows = imfPortefeuilleAvecs(u).map(avec => {
    const s = sup(avec), q = dataQuality(avec, s.st, s.ch);
    return Object.assign(s, { q, r: imfReady(avec, s.st, s.ch, q) });
  }).sort((a, b) => b.q.score - a.q.score);
  const choisies = App.imfChoix || new Set(rows.filter(r => r.r.level === 'ready' || r.r.level === 'close').map(r => r.avec.id));
  App.imfChoix = choisies;
  const retenues = rows.filter(r => choisies.has(r.avec.id));
  const tot = k => retenues.reduce((a, r) => a + k(r), 0);
  if (!rows.length) return `<div class="shell">${topbar('Dossier pour une IMF', esc(org.name), backBtn('o.home'))}<main class="main">
    <div class="alert">${icSpan('building')}<div><b>Aucune AVEC à présenter</b><span class="small">Le dossier se construit sur les journaux reçus des groupes. Recevez-en un, puis revenez.</span></div></div>
  </main></div>`;
  return `<div class="shell wide">${topbar('Dossier pour une IMF', esc(org.name), backBtn('o.home'))}<main class="main">
    <div><h1>Présenter un portefeuille à une IMF</h1>
      <p class="muted">Une institution de microfinance regarde d'abord une ligne par groupe, puis le détail des crédits.
        Akiba écrit ce fichier Excel à partir des journaux scellés reçus — rien n'est saisi à la main.</p></div>
    <div class="kpis">
      <div class="kpi"><span>AVEC retenues</span><b class="num">${retenues.length}</b><span>sur ${rows.length} suivies</span></div>
      <div class="kpi"><span>Membres</span><b class="num">${tot(r => r.st.activeCount)}</b><span>${tot(r => r.st.activeCount) ? pct(tot(r => r.st.women) / tot(r => r.st.activeCount)) + ' de femmes' : '—'}</span></div>
      <div class="kpi"><span>Épargne cumulée</span><b class="num">${fck(tot(r => r.st.sum.EPARGNE))}</b><span>cycle en cours</span></div>
      <div class="kpi"><span>Portefeuille à risque</span><b class="num">${tot(r => r.st.outstanding) ? pct(tot(r => r.st.lateAmt) / tot(r => r.st.outstanding)) : '—'}</b><span>${fck(tot(r => r.st.outstanding))} d'encours</span></div>
    </div>
    <section class="section"><div class="row between" style="flex-wrap:wrap;gap:8px"><h2 style="margin:0">Quelles AVEC présenter ?</h2>
      <div class="row" style="gap:6px"><button class="btn sm ghost" data-act="imfPfTous">Toutes</button><button class="btn sm ghost" data-act="imfPfPretes">Les prêtes</button><button class="btn sm ghost" data-act="imfPfAucune">Aucune</button></div></div>
      <div class="list">${rows.map(r => `<button class="li" data-act="imfPfBascule" data-id="${r.avec.id}">
        <span class="chk${choisies.has(r.avec.id) ? ' on' : ''}" aria-hidden="true">${choisies.has(r.avec.id) ? ic('check') : ''}</span>
        <span class="grow"><b>${esc(r.avec.name)}</b><span class="small muted">${placeShort(r.avec)} · ${r.st.activeCount} membres · épargne ${fck(r.st.sum.EPARGNE)}</span></span>
        <span class="end">${readyChip(r.r)}<span class="small muted">qualité ${r.q.score}/100</span></span></button>`).join('')}</div>
    </section>
    <section class="card stack"><h2>Préparer le fichier</h2>
      <p class="small">Contenu : une ligne par AVEC, un résumé du portefeuille, le détail des crédits internes et extérieurs.
        <b>Jamais</b> de téléphone ni d'adresse.</p>
      <label class="row" style="gap:10px"><input id="ipN" type="checkbox" style="width:22px;height:22px;flex:none"><span>Mettre les noms des AVEC et des membres (sinon « AVEC 1 », « Membre 1 »…)</span></label>
      <label class="row" style="gap:10px;align-items:flex-start"><input id="ipA" type="checkbox" style="width:22px;height:22px;flex:none"><span>Les assemblées générales des AVEC retenues ont accepté de partager ces informations avec l'IMF.</span></label>
      <div class="field"><label for="ipI">Nom de l'IMF</label><input id="ipI" class="input" placeholder="Ex. IMF Tujenge Mikopo"></div>
      <button class="btn primary block xl" data-act="imfPfTelecharger">${ic('chart')} Télécharger le dossier Excel</button>
      ${navigator.share ? `<button class="btn ghost block" data-act="imfPfPartager">${ic('chat')} Partager (WhatsApp, e-mail…)</button>` : ''}
    </section>
    ${(() => { const envois = rows.flatMap(r => (r.avec.imfShares || []).map(s => Object.assign({ avec: r.avec.name }, s))).sort((a, b) => b.ts - a.ts).slice(0, 10);
      return envois.length ? `<section class="section"><h2>Dossiers déjà partagés</h2><div class="list">${envois.map(s => `<div class="li"><span class="grow"><b>${esc(s.imf)}</b><span class="small muted">${esc(s.avec)} · ${fdate(s.ts)}${s.names ? ' · avec les noms' : ''}</span></span></div>`).join('')}</div></section>` : ''; })()}
    <p class="hint">Une AVEC autonome ne figure jamais dans ce dossier : ses données ne sont pas les vôtres.</p>
  </main></div>`;
};

ACT.imfPfBascule = d => { const s = App.imfChoix; s.has(d.id) ? s.delete(d.id) : s.add(d.id); render(); };
ACT.imfPfTous = () => { const u = me_user(); App.imfChoix = new Set(imfPortefeuilleAvecs(u).map(a => a.id)); render(); };
ACT.imfPfAucune = () => { App.imfChoix = new Set(); render(); };
ACT.imfPfPretes = () => {
  const u = me_user();
  App.imfChoix = new Set(imfPortefeuilleAvecs(u).filter(a => {
    const s = sup(a), q = dataQuality(a, s.st, s.ch), r = imfReady(a, s.st, s.ch, q);
    return r.level === 'ready' || r.level === 'close';
  }).map(a => a.id));
  render();
};

function imfPortefeuillePreparer() {
  const u = me_user(), org = orgOf(u.orgId) || { name: 'Mon organisation' };
  const retenues = imfPortefeuilleAvecs(u).filter(a => App.imfChoix.has(a.id));
  if (!retenues.length) { App.toast('Choisissez au moins une AVEC'); return null; }
  if (!document.getElementById('ipA').checked) { App.toast('Confirmez l\'accord des assemblées générales'); return null; }
  const imf = (fval('ipI') || '').trim();
  if (imf.length < 2) { App.toast('Écrivez le nom de l\'IMF'); return null; }
  const noms = document.getElementById('ipN').checked;
  const rows = retenues.map(sup);
  retenues.forEach(a => { a.imfShares = (a.imfShares || []).concat([{ ts: Date.now(), by: u.id, imf, names: noms, portefeuille: true }]); });
  DB.save();
  const slug = org.name.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { blob: buildXlsx(imfPortefeuilleFeuilles(rows, org, noms)), name: `Akiba-portefeuille-IMF-${slug}-${isoDay(Date.now())}.xlsx`, imf, n: retenues.length };
}
ACT.imfPfTelecharger = () => {
  const f = imfPortefeuillePreparer(); if (!f) return;
  const url = URL.createObjectURL(f.blob), a = document.createElement('a');
  a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  render(); App.toast(`${f.n} AVEC dans ${f.name}`);
};
ACT.imfPfPartager = async () => {
  const f = imfPortefeuillePreparer(); if (!f) return;
  render();
  try { await navigator.share({ files: [new File([f.blob], f.name, { type: XL_MIME })], title: 'Portefeuille Akiba pour ' + f.imf }); }
  catch (e) { if (e && e.name !== 'AbortError') App.toast('Partage impossible : utilisez « Télécharger »'); }
};
