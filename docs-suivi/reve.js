/* Akiba — le rêve d'un membre, et la projection qui le rend vrai.

   « 2 000 francs par semaine » ne veut rien dire pour personne. « Un toit en tôles dans huit
   mois » veut dire quelque chose. C'est la même somme — seul le calcul manque, et personne ne
   le fait de tête.

   Akiba a déjà tout ce qu'il faut : les parts achetées, le rythme réel des réunions, la valeur
   d'une part. Il reste à écrire l'objectif et à faire l'arithmétique.

   Deux règles de probité :
   — on projette sur le rythme RÉEL du membre, pas sur ce qu'il a promis ;
   — quand le rythme est nul, ou quand la date tombe après la fin du cycle, on le dit.
     Une projection qui ment est pire que pas de projection. */
'use strict';

/* ---------- le rythme réel : parts par réunion, sur le cycle en cours ---------- */
function rythmeParts(avec, st, x) {
  const tenues = st.meetings.filter(m => m.status === 'closed').length;
  const d = st.mem[x.id];
  if (!d || !tenues) return 0;
  return d.parts / tenues;
}

/* ---------- ce que le membre aura à la fin du cycle, à ce rythme ---------- */
function projectionCycle(avec, st, x) {
  const d = st.mem[x.id];
  if (!d) return null;
  const freq = (avec.settings || {}).frequency || 7;
  const restantes = Math.max(0, Math.floor((cycleEnd(avec) - Date.now()) / (freq * DAY)));
  const rythme = rythmeParts(avec, st, x);
  const partsFin = d.parts + rythme * restantes;
  return {
    rythme, restantes,
    partsFin: Math.round(partsFin),
    valeurFin: Math.round(partsFin * st.shareValue),
    valeurAujourdhui: Math.round(d.parts * st.shareValue),
  };
}

/* ---------- le rêve : où il en est, et quand il sera atteint ---------- */
function reveAvance(avec, st, x) {
  const r = x.reve;
  if (!r || !r.montant) return null;
  const p = projectionCycle(avec, st, x);
  const atteint = p.valeurAujourdhui;
  const reste = Math.max(0, r.montant - atteint);
  const pct = r.montant ? Math.min(1, atteint / r.montant) : 0;
  const parReunion = p.rythme * st.shareValue;
  const freq = (avec.settings || {}).frequency || 7;
  let quand = null, apresCycle = false;
  if (reste <= 0) quand = 'fait';
  else if (parReunion > 0) {
    const reunions = Math.ceil(reste / parReunion);
    quand = Date.now() + reunions * freq * DAY;
    apresCycle = quand > cycleEnd(avec);
  }
  return { titre: r.titre, montant: r.montant, atteint, reste, pct, quand, apresCycle, parReunion, p };
}

/* ---------- la carte du carnet ---------- */
const REVES_COURANTS = ['Toit en tôles', 'Frais scolaires', 'Machine à coudre', 'Chèvre', 'Petit commerce',
  'Moto', 'Champ à louer', 'Panneau solaire', 'Soins de santé', 'Semences'];

function reveCarte(avec, st, x, peutModifier) {
  const a = reveAvance(avec, st, x);
  const p = projectionCycle(avec, st, x);
  if (!a) {
    return `<section class="card stack">
      <div class="row between"><b>Mon rêve</b>${peutModifier ? `<button class="btn sm brand" data-act="reveSheet" data-id="${x.id}">${ic('plus')} En écrire un</button>` : ''}</div>
      <p class="hint" style="margin:0">Pourquoi épargner ? Un toit, une année d'école, une chèvre, une machine.
        Écrivez-le ici : Akiba dira à chaque réunion où vous en êtes et quand vous y serez.</p>
      ${p && p.rythme > 0 ? `<p class="small" style="margin:0"><b>À ce rythme</b>, à la fin du cycle vous aurez environ
        <b class="num">${fc(p.valeurFin)}</b> — ${p.restantes} réunion${p.restantes > 1 ? 's' : ''} encore.</p>` : ''}
    </section>`;
  }
  const pct = Math.round(a.pct * 100);
  const quand = a.quand === 'fait' ? 'Atteint !'
    : a.quand ? (a.apresCycle ? 'Vers ' + fdate(a.quand) + ', après la fin du cycle' : 'Vers ' + fdate(a.quand))
      : 'Achetez des parts pour avancer';
  return `<section class="card stack">
    <div class="row between"><b>Mon rêve</b>${peutModifier ? `<button class="btn sm ghost" data-act="reveSheet" data-id="${x.id}">${ic('user')} Modifier</button>` : ''}</div>
    <div class="row between" style="align-items:flex-end">
      <div><div style="font-family:var(--f-display);font-size:var(--t-lg);font-weight:700">${esc(a.titre)}</div>
        <span class="small muted">${fc(a.atteint)} sur ${fc(a.montant)}</span></div>
      <b class="num" style="font-size:var(--t-xl)">${pct} %</b></div>
    <div class="bar" style="height:12px"><i style="width:${pct}%;background:${a.quand === 'fait' ? 'var(--good)' : 'var(--maize)'}"></i></div>
    <p class="small" style="margin:0">${a.quand === 'fait'
      ? `<b>Vous y êtes.</b> Votre épargne couvre votre rêve.`
      : `Il reste <b class="num">${fc(a.reste)}</b>. <b>${esc(quand)}</b>${a.parReunion > 0 ? ` — environ ${fc(Math.round(a.parReunion))} par réunion à votre rythme actuel.` : '.'}`}</p>
    ${a.apresCycle ? `<p class="hint" style="margin:0">La fin du cycle arrive avant : vous toucherez votre épargne au partage,
      et vous pourrez continuer au cycle suivant.</p>` : ''}
  </section>`;
}

/* une ligne pour le reçu : courte, sans accent, et seulement s'il y a un rêve */
function reveLigneRecu(avec, st, x) {
  const a = reveAvance(avec, st, x);
  if (!a) return '';
  return rLine('Reve ' + noAcc(a.titre).slice(0, 12), Math.round(a.pct * 100) + '% ' + grp(a.atteint) + '/' + grp(a.montant));
}

/* ---------- écrire ou changer son rêve ---------- */
ACT.reveSheet = d => {
  const { avec, me } = cur();
  const x = memberOf(avec, d.id) || me;
  if (!(isBureau(me) || me.id === x.id)) return App.toast('Chacun écrit son propre rêve');
  const r = x.reve || {};
  App.openSheet(`<h2>Le rêve de ${esc(x.name.split(' ')[0])}</h2>
    <p class="muted">Pourquoi met-elle de l'argent de côté ? Écrivez-le simplement, avec le prix que cela coûte.
      Akiba dira à chaque réunion où en est ce rêve.</p>
    <div class="field"><label for="rvT">Ce que je veux</label>
      <input id="rvT" class="input" list="rvL" value="${esc(r.titre || '')}" autocomplete="off" placeholder="Ex. Toit en tôles">
      <datalist id="rvL">${REVES_COURANTS.map(t => `<option value="${esc(t)}"></option>`).join('')}</datalist></div>
    <div class="field"><label for="rvM">Ce que cela coûte (FC)</label>
      <input id="rvM" class="input num bignum" inputmode="numeric" value="${r.montant || ''}" autocomplete="off" placeholder="Ex. 300000"></div>
    <button class="btn primary block xl" data-act="reveSave" data-id="${x.id}">${ic('check')} Garder ce rêve</button>
    ${r.titre ? `<button class="btn ghost block" data-act="reveEffacer" data-id="${x.id}">Effacer le rêve</button>` : ''}`);
};
ACT.reveSave = d => {
  const { avec, me } = cur();
  const x = memberOf(avec, d.id) || me;
  if (!(isBureau(me) || me.id === x.id)) return App.toast('Chacun écrit son propre rêve');
  const titre = (fval('rvT') || '').trim(), montant = parseAmt(fval('rvM'));
  if (titre.length < 2) return App.toast('Écrivez ce que vous voulez');
  if (!(montant > 0)) return App.toast('Écrivez ce que cela coûte');
  x.reve = { titre: titre.slice(0, 40), montant, cree: x.reve && x.reve.cree ? x.reve.cree : Date.now() };
  DB.save(); App.closeSheet(); render();
  App.toast('Rêve gardé : ' + x.reve.titre);
};
ACT.reveEffacer = d => {
  const { avec, me } = cur();
  const x = memberOf(avec, d.id) || me;
  if (!(isBureau(me) || me.id === x.id)) return;
  delete x.reve;
  DB.save(); App.closeSheet(); render(); App.toast('Rêve effacé');
};
