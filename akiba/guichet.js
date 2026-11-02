/* Akiba — le guichet : l'AVEC devient la petite banque de ses membres.

   Une AVEC classique ne touche l'argent qu'à la réunion, une fois par semaine, et tout ce qui
   est épargné part au partage de fin de cycle. C'est une caisse d'investissement, pas une
   banque : on ne peut pas y déposer la recette du marché un mardi, ni la reprendre le jeudi
   pour payer l'hôpital.

   Le guichet ajoute exactement cela, et rien d'autre :

   — Un COMPTE par membre, qui vit toute l'année. L'argent qu'on y dépose reste à celui qui l'a
     confié : il ne donne pas droit aux intérêts, il ne se partage pas, il se reprend.
   — Une SÉANCE DE GUICHET, un jour d'ouverture entre deux réunions. Le trésorier ouvre, compte
     la caisse devant témoin, sert les membres, recompte et ferme. La séance est une réunion
     d'un genre à part : même journal scellé, même comptage, même sceau.
   — Un REÇU par opération, imprimé tout de suite, qui porte le sceau de l'écriture elle-même.

   Deux règles tiennent la promesse, et il ne faut jamais les desserrer :

   1. LES DÉPÔTS NE SE PRÊTENT PAS. La caisse de crédit (`loanFund`) ne les compte pas, donc un
      crédit ne peut pas manger l'argent d'un déposant. C'est la seule façon de promettre
      « vous reprenez votre argent quand vous voulez » dans un village où il n'y a ni banque
      centrale ni assurance des dépôts.
   2. UN RETRAIT DEMANDE LE CODE DU MEMBRE. Pas celui du trésorier, pas celui du président :
      celui du titulaire du compte. Personne ne sort l'argent d'un autre, même pas le bureau.

   Ce que le guichet n'est pas : il ne reçoit pas l'argent de gens qui ne sont pas membres.
   En RDC, recevoir des dépôts du public fait tomber sous la loi sur les COOPEC et les IMF, avec
   agrément de la Banque Centrale. Tant que la caisse ne sert que ses membres, le groupe reste
   une AVEC autogérée — et Akiba n'ouvre pas une porte qui mettrait un groupe hors la loi. */
'use strict';

/* le guichet est tenu par le bureau ; le trésorier d'abord, mais une absence ne doit pas
   fermer la caisse un jour d'ouverture annoncé */
/* l'heure d'une opération : au guichet, deux passages du même membre le même jour doivent se
   distinguer sur le reçu comme dans la liste */
const hhmm = ts => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const guichetTenable = (avec, me) => isBureau(me) && !openMeeting(avec);

/* les opérations de la séance, dans l'ordre où elles ont été faites */
function guichetOps(avec, g) {
  const an = annulledSet(avec);
  return avec.tx.filter(t => t.meetingId === g.id && ['DEPOT', 'RETRAIT', 'REMB'].includes(t.type) && !an.has(t.id));
}

/* Le reçu du guichet : dix lignes. Il porte le sceau de l'écriture elle-même, pas celui de la
   séance — on le donne au membre tout de suite, et la séance n'est pas encore close. */
function recuGuichet(avec, g, x, t, solde) {
  const L = [];
  L.push(rCenter('AKIBA - RECU DE GUICHET'));
  L.push(rCenter(avec.name));
  L.push(rCenter(`Guichet n${g.n} - ${fdate(t.ts)}`));
  L.push(rRule('='));
  L.push(rLine('Membre', x.name.slice(0, 20)));
  L.push(rLine('Operation', { DEPOT: 'DEPOT', RETRAIT: 'RETRAIT', REMB: 'REMBOURSEMENT' }[t.type] || t.type));
  L.push(rLine('Montant', fc(t.amount)));
  L.push(rRule());
  if (t.type !== 'REMB') L.push(rLine('Nouveau solde', fc(solde)));
  else L.push(rLine('Reste a rembourser', fc(solde)));
  L.push(rRule());
  L.push('Sceau de l ecriture :');
  L.push(noAcc((t.hash || '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()));
  L.push(rCenter('Akiba - Entreprise Sociale'));
  L.push(rCenter('Ubora - ' + UBORA.telShow));
  return L.join('\n');
}

/* ---------- l'écran ---------- */
SCREENS['a.guichet'] = () => {
  const { avec, me, st } = cur();
  const g = openGuichet(avec);
  const comptes = activeM(avec).map(x => ({ x, solde: st.mem[x.id].libre })).filter(c => c.solde > 0).sort((a, b) => b.solde - a.solde);
  const tete = `<div class="shell">${topbar('Guichet', g ? `Séance n°${g.n} · ouverte ${hhmm(g.date)}` : 'Le compte de chaque membre', backBtn('a.home'), syncPill(avec))}<main class="main">`;

  /* ---- guichet fermé : ce qu'il est, et le bouton pour l'ouvrir ---- */
  if (!g) {
    const ouvrable = guichetTenable(avec, me);
    return `${tete}
      <div class="grille-avec">
        ${chiffre('Déposé par les membres', fck(st.libreTot), `${comptes.length} compte${comptes.length > 1 ? 's' : ''} ouvert${comptes.length > 1 ? 's' : ''}`)}
        ${chiffre('Dans la caisse', fck(st.cash), 'dépôts compris')}
      </div>
      <section class="card stack">
        <div class="row" style="align-items:flex-start;gap:10px">${icSpan('shield')}<div style="flex:1;min-width:0">
          <b>L'argent déposé n'est jamais prêté</b>
          <span class="small muted" style="display:block">Il dort dans la caisse et se reprend n'importe quel jour d'ouverture. Les crédits se font avec l'épargne en parts, pas avec les dépôts.</span></div></div>
        ${ouvrable ? `<button class="btn primary block xl" data-act="guichetOuvrirSheet">${ic('unlock')} Ouvrir le guichet</button>`
          : `<p class="hint" style="margin:0">${openMeeting(avec) ? 'Une réunion est ouverte : le guichet attend qu’elle soit close.' : 'Seul le bureau ouvre le guichet.'}</p>`}
      </section>
      ${comptes.length ? `<section class="section"><h2>Les comptes</h2><div class="list">${comptes.map(c => `<button class="li" data-act="go" data-to="a.member" data-id="${c.x.id}">${avatar(c.x)}<span class="grow"><b>${esc(c.x.name)}</b><span class="small muted">${roleLabel(c.x)}</span></span>
        <span class="end"><span class="num">${fc(c.solde)}</span><span class="small muted">sur son compte</span></span></button>`).join('')}</div></section>`
        : '<p class="hint">Aucun compte n’a encore reçu de dépôt. Le premier s’ouvre en déposant, au guichet.</p>'}
      ${guichetPasses(avec)}
    </main>${tabbar(A_TABS, '')}</div>`;
  }

  /* ---- guichet ouvert : servir, puis fermer ---- */
  const ops = guichetOps(avec, g);
  const entre = ops.filter(t => t.type !== 'RETRAIT').reduce((a, t) => a + t.amount, 0);
  const sorti = ops.filter(t => t.type === 'RETRAIT').reduce((a, t) => a + t.amount, 0);
  return `${tete}
    <div class="grille-avec">
      ${chiffre('Compté à l’ouverture', fck(g.openCount), g.openCount === g.openExpected ? 'conforme au cahier' : 'écart ' + fc(g.openCount - g.openExpected))}
      ${chiffre('Dans la caisse', fck(st.cash), `${ops.length} opération${ops.length > 1 ? 's' : ''} · +${fck(entre)} −${fck(sorti)}`)}
    </div>
    <section class="section"><h2>Servir un membre</h2><div class="grille-avec">
      ${tuile('plus', 'Dépôt', 'Le membre confie de l’argent', 'data-act="guichetDepotSheet"')}
      ${tuile('hand', 'Retrait', 'Il reprend son argent, avec son code', 'data-act="guichetRetraitSheet"', 'or')}
      ${tuile('coins', 'Remboursement', 'Il paie une partie de son crédit', 'data-act="guichetRembSheet"')}
    </div></section>
    <section class="section"><h2>Opérations de la séance</h2><div class="list">${ops.length ? ops.slice().reverse().map(t => {
      const x = memberOf(avec, t.memberId);
      const signe = t.type === 'RETRAIT' ? '−' : '+';
      return `<div class="li">${avatar(x)}<span class="grow"><b>${esc(x ? x.name : '—')}</b><span class="small muted">${TX[t.type].l} · ${hhmm(t.ts)}</span></span>
        <span class="end"><span class="num">${signe}${fc(t.amount)}</span><button class="linkbtn" data-act="guichetRecu" data-id="${t.id}">Reçu</button></span></div>`;
    }).join('') : '<div class="li muted">Personne n’est encore passé</div>'}</div></section>
    <section class="section"><h2>Fermer le guichet</h2>
      <div class="card stack">
        <div class="row between"><span class="label">Selon le cahier</span><b class="num" style="font-family:var(--f-display);font-size:1.4rem">${fc(st.cash)}</b></div>
        <p class="small muted" style="margin:0">Recomptez l’argent devant le deuxième membre du bureau, puis fermez : la séance est scellée et plus rien ne peut y être ajouté.</p>
        <button class="btn primary block xl" data-act="guichetFermerSheet">${ic('lock')} Recompter et fermer</button>
      </div></section>
  </main></div>`;
};

/* les dernières séances closes, pour retrouver un reçu */
function guichetPasses(avec) {
  const list = avec.meetings.filter(m => m.kind === 'guichet' && m.status === 'closed').slice(-5).reverse();
  if (!list.length) return '';
  return `<section class="section"><h2>Dernières séances</h2><div class="list">${list.map(m => {
    const n = guichetOps(avec, m).length;
    const gap = (m.closeCount || 0) - (m.closeExpected || 0);
    return `<div class="li"><span class="av" style="border-radius:12px;font-family:var(--f-display)">${m.n}</span>
      <div class="grow"><b>${fdate(m.date)}</b><span class="small muted">${n} opération${n > 1 ? 's' : ''}</span></div>
      ${gap ? `<span class="chip bad">Écart ${fc(gap)}</span>` : '<span class="chip good">Caisse juste</span>'}</div>`;
  }).join('')}</div></section>`;
}

/* ---------- ouvrir ---------- */
ACT.guichetOuvrirSheet = () => {
  const { avec, st } = cur();
  App.openSheet(`<h2>Ouvrir le guichet</h2>
    <p class="muted">Comptez l’argent de la caisse devant un deuxième membre du bureau, comme au début d’une réunion.</p>
    <div class="card stack"><div class="row between"><span class="label">Selon le cahier</span><b class="num">${fc(st.cash)}</b></div>
      <div class="field"><label for="guA">Argent compté (FC)</label><input id="guA" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0"></div></div>
    <div class="field"><label for="guN">Écart, s’il y en a un</label><input id="guN" class="input" placeholder="Laissez vide si le compte est juste"></div>
    <button class="btn primary block xl" data-act="guichetOuvrir">Ouvrir le guichet</button>`);
};
ACT.guichetOuvrir = () => {
  const { avec, me, st } = cur();
  if (!guichetTenable(avec, me)) return App.toast('Le guichet ne peut pas s’ouvrir maintenant');
  const v = parseAmt(document.getElementById('guA').value);
  const note = document.getElementById('guN').value.trim();
  if (!v && v !== 0) return App.toast('Écrivez l’argent compté');
  if (v !== st.cash && !note) return App.toast('Expliquez l’écart avant d’ouvrir');
  const n = avec.meetings.reduce((a, x) => Math.max(a, x.n), 0) + 1;
  avec.meetings.push({
    id: avec.id + '-g' + n + '-' + uid(), n, cycle: avec.cycle.n, kind: 'guichet', date: Date.now(),
    status: 'open', presence: {}, openedBy: me.id, stepDone: 7, openExpected: st.cash, openCount: v,
    openNote: v !== st.cash ? note : '', synced: false
  });
  DB.save(); App.closeSheet(); App.go('a.guichet'); App.toast('Guichet ouvert');
};

/* ---------- déposer ---------- */
ACT.guichetDepotSheet = () => {
  const { avec } = cur();
  App.openSheet(`<h2>Dépôt</h2><p class="muted">L’argent entre dans la caisse et reste au membre. Il n’est pas prêté et ne se partage pas.</p>
    <div class="field"><label for="dpM">Membre</label><select id="dpM" class="input">${memberOptions(activeM(avec))}</select></div>
    <div class="field"><label for="dpA">Montant</label><input id="dpA" class="input bignum num" inputmode="numeric" placeholder="0"></div>
    <button class="btn primary block xl" data-act="saveDepot">Enregistrer le dépôt</button>`);
};
ACT.saveDepot = () => {
  const { avec, me } = cur(); const g = openGuichet(avec);
  if (!g) return App.toast('Le guichet est fermé');
  const x = memberOf(avec, document.getElementById('dpM').value);
  const amount = parseAmt(document.getElementById('dpA').value);
  if (!x) return App.toast('Choisissez le membre');
  if (!amount) return App.toast('Écrivez le montant');
  const t = appendTx(avec, { meetingId: g.id, type: 'DEPOT', memberId: x.id, amount, note: 'Dépôt au guichet', by: me.id });
  DB.save(); App.closeSheet();
  if (typeof jouerSon === 'function') jouerSon('ok');
  App.go('a.guichet'); App.toast(`${fc(amount)} déposés`);
  ACT.guichetRecu({ id: t.id });
};

/* ---------- retirer : le code du membre, et rien d'autre ---------- */
ACT.guichetRetraitSheet = () => {
  const { avec, st } = cur();
  const list = activeM(avec).filter(x => st.mem[x.id].libre > 0);
  if (!list.length) return App.toast('Aucun compte n’a d’argent à reprendre');
  App.openSheet(`<h2>Retrait</h2><p class="muted">Le membre tape son propre code : personne ne sort l’argent d’un autre, même pas le bureau.</p>
    <div class="field"><label for="rtM">Membre</label><select id="rtM" class="input">${memberOptions(list, x => ` — ${fc(st.mem[x.id].libre)}`)}</select></div>
    <div class="field"><label for="rtA">Montant</label><input id="rtA" class="input bignum num" inputmode="numeric" placeholder="0"></div>
    <button class="btn primary block xl" data-act="saveRetrait">Continuer</button>`);
};
ACT.saveRetrait = () => {
  const { avec, me, st } = cur(); const g = openGuichet(avec);
  if (!g) return App.toast('Le guichet est fermé');
  const x = memberOf(avec, document.getElementById('rtM').value);
  const amount = parseAmt(document.getElementById('rtA').value);
  if (!x) return App.toast('Choisissez le membre');
  if (!amount) return App.toast('Écrivez le montant');
  const solde = st.mem[x.id].libre;
  if (amount > solde) return App.toast(`Son compte n’a que ${fc(solde)}`);
  /* Les dépôts ne sont jamais prêtés : la caisse contient donc toujours de quoi servir un
     retrait. On le vérifie quand même — c'est une promesse, elle se contrôle. */
  if (amount > st.cash) return App.toast('La caisse n’a pas cet argent : comptez-la avant de servir');
  askPin(x, 'Retrait : votre code', () => {
    const t = appendTx(avec, { meetingId: g.id, type: 'RETRAIT', memberId: x.id, amount, note: 'Retrait au guichet', by: me.id });
    DB.save(); App.closeSheet();
    if (typeof jouerSon === 'function') jouerSon('ok');
    App.go('a.guichet'); App.toast(`${fc(amount)} rendus à ${x.name.split(' ')[0]}`);
    ACT.guichetRecu({ id: t.id });
  });
};

/* ---------- rembourser un crédit au guichet ---------- */
ACT.guichetRembSheet = () => {
  const { avec, st } = cur();
  const list = st.activeLoans.map(l => ({ l, x: memberOf(avec, l.memberId) })).filter(o => o.x);
  if (!list.length) return App.toast('Aucun crédit en cours');
  App.openSheet(`<h2>Remboursement</h2><p class="muted">L’argent entre dans la caisse de crédit, comme à la réunion.</p>
    <div class="field"><label for="rgL">Crédit</label><select id="rgL" class="input">${list.map(o => `<option value="${o.l.id}">${esc(o.x.name)} — reste ${fc(o.l.remaining)}</option>`).join('')}</select></div>
    <div class="field"><label for="rgA">Montant</label><input id="rgA" class="input bignum num" inputmode="numeric" placeholder="0"></div>
    <button class="btn primary block xl" data-act="saveRembGuichet">Enregistrer</button>`);
};
ACT.saveRembGuichet = () => {
  const { avec, me, st } = cur(); const g = openGuichet(avec);
  if (!g) return App.toast('Le guichet est fermé');
  const id = document.getElementById('rgL').value;
  const l = st.activeLoans.find(y => y.id === id);
  const amount = parseAmt(document.getElementById('rgA').value);
  if (!l) return App.toast('Choisissez le crédit');
  if (!amount) return App.toast('Écrivez le montant');
  if (amount > l.remaining) return App.toast(`Il ne reste que ${fc(l.remaining)} à rembourser`);
  const t = appendTx(avec, { meetingId: g.id, type: 'REMB', memberId: l.memberId, ref: l.id, amount, note: 'Remboursement au guichet', by: me.id });
  DB.save(); App.closeSheet();
  if (typeof jouerSon === 'function') jouerSon('ok');
  App.go('a.guichet'); App.toast(`${fc(amount)} remboursés`);
  ACT.guichetRecu({ id: t.id });
};

/* ---------- le reçu d'une opération ---------- */
ACT.guichetRecu = d => {
  const { avec } = cur();
  const t = avec.tx.find(y => y.id === d.id);
  if (!t) return;
  const g = avec.meetings.find(m => m.id === t.meetingId);
  const x = memberOf(avec, t.memberId);
  const st = stats(avec);
  const solde = t.type === 'REMB' ? (st.loanList.find(l => l.id === t.ref) || { remaining: 0 }).remaining : st.mem[x.id].libre;
  const texte = recuGuichet(avec, g, x, t, solde);
  App.openSheet(`<h2>Reçu de ${esc(x.name.split(' ')[0])}</h2>
    <pre class="ticket">${esc(texte)}</pre>
    <button class="btn primary block xl" data-act="guichetImprimer" data-id="${t.id}">${ic('clip')} Imprimer</button>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.guichetImprimer = async d => {
  const { avec } = cur();
  const t = avec.tx.find(y => y.id === d.id);
  const g = avec.meetings.find(m => m.id === t.meetingId);
  const x = memberOf(avec, t.memberId);
  const st = stats(avec);
  const solde = t.type === 'REMB' ? (st.loanList.find(l => l.id === t.ref) || { remaining: 0 }).remaining : st.mem[x.id].libre;
  const voie = await printReceipt(recuGuichet(avec, g, x, t, solde), 1);
  App.toast(voie ? 'Reçu envoyé à l’imprimante' : 'Reçu prêt');
};

/* ---------- fermer ---------- */
ACT.guichetFermerSheet = () => {
  const { avec, me, st } = cur();
  App.openSheet(`<h2>Fermer le guichet</h2>
    <div class="card stack"><div class="row between"><span class="label">Selon le cahier</span><b class="num">${fc(st.cash)}</b></div>
      <div class="field"><label for="gfA">Argent recompté (FC)</label><input id="gfA" class="input bignum num" inputmode="numeric" autocomplete="off" placeholder="0"></div></div>
    <div class="field"><label for="gfN">Écart, s’il y en a un</label><input id="gfN" class="input" placeholder="Laissez vide si le compte est juste"></div>
    ${approverFields(avec, me, 'gf')}
    <button class="btn primary block xl" data-act="guichetFermer">Fermer et sceller</button>`);
};
ACT.guichetFermer = () => {
  const { avec, me, st } = cur(); const g = openGuichet(avec);
  if (!g) return App.toast('Le guichet est déjà fermé');
  const v = parseAmt(document.getElementById('gfA').value);
  const note = document.getElementById('gfN').value.trim();
  if (!v && v !== 0) return App.toast('Écrivez l’argent recompté');
  if (v !== st.cash && !note) return App.toast('Expliquez l’écart : c’est obligatoire');
  const ap = checkApprover(avec, 'gf'); if (!ap) return;
  Object.assign(g, {
    status: 'closed', closedAt: Date.now(), closeExpected: st.cash, closeCount: v, note: v !== st.cash ? note : '',
    validators: [me.id, ap.id],
    sealSeq: avec.tx.length, seal: avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id
  });
  chainOf(avec, true);                                               // fermer engage : on revérifie tout le journal
  DB.save();
  if (typeof jouerSon === 'function') { jouerSon('scelle'); vibrer([25, 60, 25, 60, 40]); }
  App.go('a.guichet'); App.toast('Guichet fermé et scellé');
};
