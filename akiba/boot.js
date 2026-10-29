/* Akiba AVEC — démarrage */
'use strict';
/* Le démarrage attend d'avoir lu le cahier avant que l'écran existe : avec IndexedDB la
   lecture n'est plus instantanée, et mieux vaut un instant d'attente qu'un écran faux. */
const demarre = DB.pret().then(() => { DB.save(); });
window.addEventListener('online', () => { K.data.net.online = true; DB.save(); render(); });
window.addEventListener('offline', () => { K.data.net.online = false; DB.save(); render(); });
// Affichage en direct : quand un autre onglet (une AVEC, un animateur) enregistre, cet écran se met à jour tout seul.
window.addEventListener('storage', async e => {
  /* Deux chemins : l'ancien, où le cahier lui-même passait par localStorage, et le nouveau,
     où seul un témoin horodaté y passe et où le cahier se relit dans la base. */
  if (e.key === STORE + '.t') {
    const brut = await IDB.lire(STORE);
    if (!brut) return;
    try { K.data = typeof brut === 'string' ? JSON.parse(brut) : brut; } catch (err) { return; }
    Object.keys(_chain).forEach(k => delete _chain[k]);
    App.liveAt = Date.now();
    render();
    return;
  }
  if (e.key !== STORE || !e.newValue) return;
  try { K.data = JSON.parse(e.newValue); } catch (err) { return; }
  Object.keys(_chain).forEach(k => delete _chain[k]);
  App.liveAt = Date.now();
  const a = document.activeElement;
  if (App.sheet || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;   // ne pas effacer une saisie en cours
  render();
});
setInterval(() => { if (K.session && /^(o|n)\./.test(App.screen) && !App.sheet) render(); }, 30000);
/* Une écriture dans IndexedDB est confirmée un instant après avoir été demandée. Si le téléphone
   se verrouille ou si l'application passe en arrière-plan juste à ce moment-là, on laisse la
   dernière écriture finir plutôt que de la perdre en silence. */
document.addEventListener('visibilitychange', () => { if (document.hidden) DB.vide(); });
window.addEventListener('pagehide', () => DB.vide());
// Version hébergée (dist/) : l'application reste dans le téléphone et s'ouvre sans réseau.
// Mises à jour : le téléphone vérifie la nouvelle version à chaque ouverture avec réseau, puis toutes les 30 minutes.
// La nouvelle version s'installe par-dessus l'ancienne ; les données restent dans le téléphone.
if (window.KITABU_PWA && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg => {
      const check = () => { if (navigator.onLine !== false) reg.update().catch(() => {}); };
      check();                                                        // tout de suite : ouvrir l'application suffit à la mettre à jour
      setInterval(check, 30 * 60e3);
      window.addEventListener('online', check);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });   // au retour sur l'application
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; }            // toute première installation : rien à recharger
      App.updateReady = true;
      const calm = ['login', 'a.home', 'n.home', 'o.home', 'guide', 'l.avec'].includes(App.screen) && !App.sheet && !(document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
      if (calm) { DB.save(); location.reload(); } else render();       // pendant une saisie : bandeau « Mettre à jour »
    });
  });
}
if (K.recovered) setTimeout(() => App.toast('Vos données ont été retrouvées après la mise à jour'), 800);
/* Le premier écran attend la lecture du cahier. Avant, DB.load() rendait la main tout de suite
   et start() pouvait décider de l écran sur des données déjà là ; maintenant la lecture passe
   par IndexedDB, donc on attend — quelques dizaines de millisecondes, et aucun écran faux. */
demarre.then(function start() {
  const s = K.session;
  if (s && s.kind === 'avec' && avecById(s.avecId) && memberOf(avecById(s.avecId), s.memberId)) App.screen = 'a.home';
  else if (s && s.kind === 'anim' && userById(s.userId)) App.screen = 'n.home';
  else if (s && s.kind === 'org' && userById(s.userId)) App.screen = 'o.home';
  else { K.session = null; App.screen = 'login'; }
  if (!licenceRequired()) { App.licence = { ok: true, data: { name: 'Démonstration', kind: 'demo' } }; render(); return; }
  // licence : lien (#licence=… et/ou &activation=…) ou licence déjà enregistrée sur ce téléphone
  const hash = location.hash, fromLink = codeFrom(hash);
  (async () => {
    await migrateLegacyLicence();
    let msg = '';
    if (fromLink) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* rien */ }
      if (fromLink !== licGet()) { const r = await applyValidationCode(hash); if (!r.ok) msg = r.why || 'Code de validation non valable'; }
    }
    App.licence = await resolveLicence();
    render();
    if (msg) App.toast(msg);
    else if (fromLink && App.licence.ok) App.toast(`Téléphone validé : ${App.licence.data.name}`);
    // liste de blocage : à l'ouverture, au retour du réseau, puis toutes les 6 heures
    refreshBlocklist();
    window.addEventListener('online', refreshBlocklist);
    setInterval(refreshBlocklist, 6 * 3600e3);
  })();
});
