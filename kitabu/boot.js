/* Kitabu AVEC — démarrage */
'use strict';
DB.load();
DB.save();
window.addEventListener('online', () => { K.data.net.online = true; DB.save(); render(); });
window.addEventListener('offline', () => { K.data.net.online = false; DB.save(); render(); });
// Affichage en direct : quand un autre onglet (une AVEC, un animateur) enregistre, cet écran se met à jour tout seul.
window.addEventListener('storage', e => {
  if (e.key !== STORE || !e.newValue) return;
  try { K.data = JSON.parse(e.newValue); } catch (err) { return; }
  Object.keys(_chain).forEach(k => delete _chain[k]);
  App.liveAt = Date.now();
  const a = document.activeElement;
  if (App.sheet || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;   // ne pas effacer une saisie en cours
  render();
});
setInterval(() => { if (K.session && /^(o|n)\./.test(App.screen) && !App.sheet) render(); }, 30000);
// Version hébergée (dist/) : l'application reste dans le téléphone et s'ouvre sans réseau.
if (window.KITABU_PWA && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
(function start() {
  const s = K.session;
  if (s && s.kind === 'avec' && avecById(s.avecId) && memberOf(avecById(s.avecId), s.memberId)) App.screen = 'a.home';
  else if (s && s.kind === 'anim' && userById(s.userId)) App.screen = 'n.home';
  else if (s && s.kind === 'org' && userById(s.userId)) App.screen = 'o.home';
  else { K.session = null; App.screen = 'login'; }
  render();
})();
