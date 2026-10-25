/* La liste des écrans à passer en revue, et comment y arriver.
   Chaque entrée dit : l'identifiant, la cible qui le possède, et le geste qui l'ouvre.
   Le geste est exécuté dans la page ; s'il lève une erreur, l'écran est compté en échec —
   c'est ainsi qu'on attrape une régression qui ne casse pas les essais fonctionnels mais
   empêche un écran de s'afficher. */
'use strict';
module.exports = `(() => {
  const A = () => avecById('avec1');
  const unMembre = () => A().members.find(m => !m.left).id;
  const unAnim = () => K.data.users.find(u => u.role === 'anim').id;
  const unOrg = () => K.data.users.find(u => u.role === 'org').id;
  const sAvec = () => { K.session = { kind: 'avec', avecId: 'avec1', memberId: unMembre() }; };
  const sAnim = () => { K.session = { kind: 'anim', userId: unAnim() }; };
  const sOrg = () => { K.session = { kind: 'org', userId: unOrg() }; };
  const sNon = () => { K.session = null; };
  /* cible : 'avec', 'suivi', ou '' pour les deux */
  return [
    ['login', '', sNon, {}],
    ['guide', '', sNon, {}],
    ['t.home', '', sNon, {}],
    ['t.mod', '', sNon, () => ({ id: (typeof TRAINING !== 'undefined' && TRAINING[0] ? TRAINING[0].id : 1) })],
    ['dev.backup', '', sAvec, {}],
    ['tr.edit', '', sNon, { lang: 'ln' }],
    ['lic.gate', '', sNon, {}],
    ['c.avec', '', sNon, { from: 'login' }],

    ['l.avec', 'avec', sNon, {}],
    ['l.member', 'avec', sNon, { id: 'avec1' }],
    ['l.lost', 'avec', sNon, { id: 'avec1' }],
    ['a.home', 'avec', sAvec, {}],
    ['a.members', 'avec', sAvec, {}],
    ['a.member', 'avec', sAvec, () => ({ id: unMembre() })],
    ['a.cards', 'avec', sAvec, {}],
    ['a.loans', 'avec', sAvec, {}],
    ['a.journal', 'avec', sAvec, {}],
    ['a.receipts', 'avec', sAvec, {}],
    ['a.receipt', 'avec', sAvec, () => ({ id: (A().meetings.filter(m => m.status === 'closed').slice(-1)[0] || {}).id })],
    ['a.cycles', 'avec', sAvec, {}],
    ['a.ext', 'avec', sAvec, {}],
    ['a.imf', 'avec', sAvec, {}],
    ['a.roles', 'avec', sAvec, {}],
    ['a.security', 'avec', sAvec, {}],
    ['a.share', 'avec', sAvec, {}],
    ['a.more', 'avec', sAvec, {}],
    ['a.meet', 'avec', sAvec, {}],

    ['l.users', 'suivi', sNon, {}],
    ['s.org', 'suivi', sNon, {}],
    ['adm.home', 'suivi', sNon, {}],
    ['n.home', 'suivi', sAnim, {}],
    ['n.alerts', 'suivi', sAnim, {}],
    ['n.avec', 'suivi', sAnim, { id: 'avec1' }],
    ['o.home', 'suivi', sOrg, {}],
    ['o.impact', 'suivi', sOrg, {}],
    ['o.imf', 'suivi', sOrg, {}],
    ['f.anim', 'suivi', sAnim, {}],
    ['f.mod', 'suivi', sAnim, { m: 'a3' }],
    ['o.review', 'suivi', sOrg, { id: 'avec1' }],
  ];
})()`;
