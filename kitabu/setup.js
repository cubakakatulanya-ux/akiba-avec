/* Kitabu AVEC — démarrage réel : quitter la démo, compte organisation, équipe d'animateurs, codes des comptes */
'use strict';

const emptyData = () => ({
  v: 1, mode: 'prod', net: { online: navigator.onLine !== false }, orgs: [], users: [], avecs: [],
  i18n: (K.data && K.data.i18n) || {}, i18nV: (K.data && K.data.i18nV) || 0, langs: (K.data && K.data.langs) || []
});
function wipeTo(data) {
  K.data = data; K.session = null; K.data.tamper = null;
  Object.keys(_chain).forEach(k => delete _chain[k]);
  DB.save();
}

ACT.goLive = () => App.openSheet(`<h2>Commencer avec de vraies données</h2>
  <p class="muted">Les AVEC de démonstration seront effacées de ce téléphone. Les traductions sont gardées.</p>
  <button class="who" data-act="go" data-to="s.org"><span class="ic" style="background:var(--brand-soft);color:var(--brand)">${ic('building')}</span><span><b>Je suis une organisation</b><span class="small muted">Créer le compte, puis les animateurs. Les animateurs créent les AVEC.</span></span></button>
  <button class="who" data-act="liveAvec"><span class="ic" style="background:var(--good-soft);color:var(--good)">${ic('users')}</span><span><b>Je suis une AVEC autonome</b><span class="small muted">Créer directement notre groupe, sans organisation.</span></span></button>`);
ACT.liveAvec = () => { wipeTo(emptyData()); App.cdraft = null; App.go('c.avec', { from: 'login' }); };

SCREENS['s.org'] = () => `<div class="shell">${topbar('Compte de l\'organisation', 'Démarrage réel', backBtn('login'))}<main class="main">
  <p class="muted">Ce compte voit toutes les AVEC que vous accompagnez, valide les nouveaux groupes et gère les animateurs.</p>
  <section class="card stack">
    <div class="field"><label for="soN">Nom de l'organisation</label><input id="soN" class="input" autocomplete="off"></div>
    <div class="field"><label for="soZ">Zone d'intervention</label><input id="soZ" class="input" placeholder="Ex. Sud-Ubangi, Gemena et Budjala"></div>
    <div class="field"><label for="soP">Nom du responsable du compte</label><input id="soP" class="input" autocomplete="off"></div>
    ${pinFields('soc')}
  </section>
  ${K.data.mode !== 'prod' ? '<div class="alert warn"><div><b>Les données de démonstration seront effacées</b><span class="small">Sur ce téléphone seulement.</span></div></div>' : ''}
  <button class="btn primary block xl" data-act="saveOrg">${ic('check')} Créer le compte</button>
</main></div>`;
ACT.saveOrg = () => {
  const name = (fval('soN') || '').trim(), zone = (fval('soZ') || '').trim(), boss = (fval('soP') || '').trim();
  if (name.length < 3) return App.toast('Écrivez le nom de l\'organisation');
  if (boss.length < 3) return App.toast('Écrivez le nom du responsable');
  const pin = readNewPin('soc'); if (!pin) return;
  const data = emptyData();
  const org = { id: 'org-' + uid(), name, zone, secret: randCode(8) + randCode(8), createdAt: Date.now() };
  const user = { id: 'u-' + uid(), role: 'org', orgId: org.id, name: boss, pin };
  data.orgs.push(org); data.users.push(user);
  wipeTo(data);
  K.session = { kind: 'org', userId: user.id }; DB.save();
  App.go('o.home'); App.toast(`${name} est prête. Ajoutez maintenant vos animateurs.`);
};

ACT.addAnimSheet = () => App.openSheet(`<h2>Ajouter un animateur</h2>
  <div class="field"><label for="anN">Nom complet</label><input id="anN" class="input" autocomplete="off"></div>
  <div class="grid2"><div class="field"><label for="anZ">Zone</label><input id="anZ" class="input" placeholder="Territoire, secteur"></div>
  <div class="field"><label for="anT">Téléphone</label><input id="anT" class="input" inputmode="tel"></div></div>
  <button class="btn primary block xl" data-act="saveAnim">${ic('plus')} Ajouter</button>`);
ACT.saveAnim = () => {
  const u = me_user();
  const name = (fval('anN') || '').trim();
  if (name.length < 3) return App.toast('Écrivez le nom complet');
  if (K.data.users.some(x => x.orgId === u.orgId && x.name.toLowerCase() === name.toLowerCase())) return App.toast('Ce nom existe déjà');
  const pin = newPin();
  K.data.users.push({ id: 'u-' + uid(), role: 'anim', orgId: u.orgId, name, zone: (fval('anZ') || '').trim(), phone: (fval('anT') || '').trim(), pin });
  DB.save();
  App.openSheet(`<h2>${esc(name)} peut se connecter</h2>
    <div class="receipt" style="text-align:center"><span class="label">Code secret provisoire</span>${bigCode(pin)}</div>
    <p class="hint">Donnez ce code en main propre. L'animateur le change dans son espace avec « Mon code ».</p>
    <button class="btn primary block xl" data-act="closeSheet">C'est noté</button>`);
};
ACT.resetUserPin = d => {
  const boss = me_user(), x = userById(d.id);
  askPin(boss, 'Nouveau code pour ' + x.name, () => {
    x.pin = newPin(); DB.save();
    App.openSheet(`<h2>Nouveau code de ${esc(x.name)}</h2><div class="receipt" style="text-align:center">${bigCode(x.pin)}</div><p class="hint">L'ancien code ne marche plus.</p><button class="btn primary block xl" data-act="closeSheet">C'est noté</button>`);
  });
};
ACT.userPinSheet = () => App.openSheet(`<h2>Changer mon code</h2>
  <div class="field"><label for="upO">Code actuel</label><input id="upO" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
  ${pinFields('upn')}<button class="btn primary block xl" data-act="saveUserPin">Enregistrer mon code</button>`);
ACT.saveUserPin = () => {
  const u = me_user();
  if (fval('upO') !== u.pin) return App.toast('Le code actuel est faux');
  const pin = readNewPin('upn'); if (!pin) return;
  u.pin = pin; DB.save(); App.closeSheet(); App.toast('Code changé');
};
