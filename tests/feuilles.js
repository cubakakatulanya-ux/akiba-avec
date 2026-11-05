/* La revue des feuilles.

   Un écran qui ne s'affiche plus se voit tout de suite : il est vide. Une FEUILLE qui ne
   s'ouvre plus ne se voit pas — le bureau touche un bouton, rien ne bouge, et personne ne sait
   pourquoi. Or c'est dans les feuilles que se fait presque tout ce qui touche à l'argent :
   accorder un crédit, donner une aide, annuler une écriture, déposer au guichet, envoyer le
   cahier. Elles n'étaient couvertes par aucun banc.

   Celui-ci les ouvre toutes, une par une, dans quatre situations différentes — bureau d'une
   AVEC, réunion ouverte, guichet ouvert, animateur, organisation — et vérifie deux choses :
   qu'aucune ne lève d'erreur, et que chacune s'ouvre dans au moins une situation. Une feuille
   qui refuse poliment (« Réservé au bureau ») n'est pas une erreur ; une feuille qui refuse
   partout l'est, parce que plus personne ne peut l'atteindre.

   Les feuilles qui ferment, qui détruisent ou qui demandent la caméra sont écartées : elles
   n'ouvrent rien, ou elles emporteraient les données de l'essai. */
'use strict';
module.exports = `(async () => {
  const sauve = JSON.stringify(K.data);
  const sessionSauve = K.session;
  const sauts = ['closeSheet', 'recuSheet'];          /* recuSheet est jugé par la revue des écrans */
  const noms = Object.keys(ACT).filter(k => /Sheet$/.test(k) && sauts.indexOf(k) < 0).sort();
  const res = {};
  noms.forEach(n => res[n] = { nom: n, ouvre: false, erreurs: [] });

  const avec = K.data.avecs[0];
  const dedans = () => (App.sheet || '').replace(/<[^>]+>/g, ' ').trim();

  /* de quoi nourrir n'importe quelle feuille : elle prend ce qui l'intéresse */
  function argument() {
    const a = K.data.avecs[0];
    if (!a) return {};
    const m = a.members.find(x => !x.left) || a.members[0];
    const r = a.meetings.filter(x => x.status === 'closed').slice(-1)[0] || a.meetings[0] || {};
    const t = a.tx[a.tx.length - 1] || {};
    const st = stats(a);
    const pret = (st.activeLoans[0] || {}).id;
    const u = K.data.users[0] || {};
    return { id: a.id, mid: m.id, m: r.id, tx: t.id, ref: pret, lic: (K.data.licences || [])[0],
      lang: 'ln', v: 'F', d: '1', i: '0', k: '1', to: 'a.home', role: 'anim', user: u.id, memberId: m.id };
  }

  async function passe(nom, prepare) {
    try { prepare(); } catch (e) { return; }
    for (const n of noms) {
      App.sheet = null;
      const arg = argument();
      /* certaines feuilles veulent l'identifiant du membre sous un autre nom */
      arg.id = (n === 'annulSheet') ? arg.tx : (n === 'editMemberSheet' || n === 'departSheet' || n === 'pinResetSheet' || n === 'reveSheet' || n === 'releveSheet' || n === 'excuseSheet' || n === 'visitSheet') ? arg.mid : arg.id;
      try {
        const sortie = ACT[n](arg);
        /* une feuille qui rend une promesse peut attendre un geste humain : on ne l'attend pas indéfiniment */
        if (sortie && typeof sortie.then === 'function') await Promise.race([sortie, new Promise(r => setTimeout(r, 1200))]);
        if ((App.sheet || '').length > 40) res[n].ouvre = true;
      } catch (e) {
        res[n].erreurs.push(nom + ' : ' + String(e && e.message || e).slice(0, 90));
      }
      App.sheet = null;
    }
  }

  const bureau = () => { const a = K.data.avecs[0]; K.session = { kind: 'avec', avecId: a.id, memberId: bureauOf(a)[0].id }; App.go('a.home'); };

  await passe('bureau', bureau);

  await passe('réunion ouverte', () => {
    bureau();
    const a = K.data.avecs[0];
    if (!openMeeting(a)) {
      const n = a.meetings.reduce((x, m) => Math.max(x, m.n), 0) + 1, presence = {};
      activeM(a).forEach(x => presence[x.id] = 'P');
      a.meetings.push({ id: a.id + '-essai' + n, n, cycle: a.cycle.n, date: Date.now(), status: 'open',
        presence, openedBy: K.session.memberId, stepDone: 7, openExpected: 0, openCount: 0, synced: false });
    }
  });

  await passe('guichet ouvert', () => {
    const a = K.data.avecs[0];
    a.meetings = a.meetings.filter(m => m.status !== 'open');
    bureau();
    const n = a.meetings.reduce((x, m) => Math.max(x, m.n), 0) + 1, st = stats(a);
    const g = { id: a.id + '-g' + n, n, cycle: a.cycle.n, kind: 'guichet', date: Date.now(), status: 'open',
      presence: {}, openedBy: K.session.memberId, stepDone: 7, openExpected: st.cash, openCount: st.cash, synced: false };
    a.meetings.push(g);
    /* un compte alimenté : sans lui, « retrait » et « transfert » refusent poliment et
       l'essai ne verrait jamais leur contenu */
    const x = activeM(a).find(m => !isBureau(m)) || activeM(a)[0];
    appendTx(a, { meetingId: g.id, type: 'DEPOT', memberId: x.id, amount: 5000, note: 'Essai', by: K.session.memberId });
  });

  const anim = K.data.users.find(u => u.role === 'anim');
  if (anim) await passe('animateur', () => { K.data.avecs[0].meetings = K.data.avecs[0].meetings.filter(m => m.status !== 'open'); K.session = { kind: 'anim', userId: anim.id }; App.go('n.home'); });
  const org = K.data.users.find(u => u.role === 'org');
  if (org) await passe('organisation', () => { K.session = { kind: 'org', userId: org.id }; App.go('o.home'); });

  K.data = JSON.parse(sauve); K.session = sessionSauve; App.sheet = null;
  if (typeof _chain === 'object') Object.keys(_chain).forEach(k => delete _chain[k]);
  DB.save();
  return Object.values(res);
})()`;
