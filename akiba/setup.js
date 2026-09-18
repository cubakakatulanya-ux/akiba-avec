/* Akiba AVEC — démarrage réel : quitter la démo, compte organisation, équipe d'animateurs, codes des comptes */
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

ACT.goLive = () => requireLicence(goLiveSheet);
const goLiveSheet = () => App.openSheet(`<h2>Commencer avec de vraies données</h2>
  <p class="muted">Les AVEC de démonstration seront effacées de ce téléphone. Les traductions sont gardées.</p>
  ${licKind() === 'avec' ? '' : `<button class="who" data-act="go" data-to="s.org"><span class="ic" style="background:var(--brand-soft);color:var(--brand)">${ic('building')}</span><span><b>Je suis une organisation</b><span class="small muted">Créer le compte, puis les animateurs. Les animateurs créent les AVEC.</span></span></button>`}
  <button class="who" data-act="liveAvec"><span class="ic" style="background:var(--good-soft);color:var(--good)">${ic('users')}</span><span><b>Je suis une AVEC autonome</b><span class="small muted">Créer directement notre groupe, sans organisation.</span></span></button>`);
ACT.liveAvec = () => { wipeTo(emptyData()); App.cdraft = null; App.go('c.avec', { from: 'login' }); };

SCREENS['s.org'] = () => licKind() !== 'org' ? SCREENS.login() : `<div class="shell">${topbar('Compte de l\'organisation', 'Démarrage réel', backBtn('login'))}<main class="main">
  <p class="muted">Ce compte voit toutes les AVEC que vous accompagnez, valide les nouveaux groupes et gère les animateurs.</p>
  <section class="card stack">
    <div class="field"><label for="soN">Nom de l'organisation</label><input id="soN" class="input" autocomplete="off"></div>
    ${geoZoneFields('so', {}, 'Précision sur la zone')}
    <div class="field"><label for="soP">Nom du responsable du compte</label><input id="soP" class="input" autocomplete="off"></div>
    ${pinFields('soc')}
  </section>
  ${K.data.mode !== 'prod' ? '<div class="alert warn"><div><b>Les données de démonstration seront effacées</b><span class="small">Sur ce téléphone seulement.</span></div></div>' : ''}
  <button class="btn primary block xl" data-act="saveOrg">${ic('check')} Créer le compte</button>
</main></div>`;
ACT.saveOrg = () => {
  const name = (fval('soN') || '').trim(), g = readGeoZone('so'), boss = (fval('soP') || '').trim();
  if (name.length < 3) return App.toast('Écrivez le nom de l\'organisation');
  if (boss.length < 3) return App.toast('Écrivez le nom du responsable');
  const pin = readNewPin('soc'); if (!pin) return;
  const data = emptyData();
  const codes = Array.from({ length: 6 }, rescueCode);
  const org = { id: 'org-' + uid(), name, zone: zoneLabel(g), province: g.province, territoire: g.territoire, entite: g.entite, secret: randCode(8) + randCode(8), createdAt: Date.now(), rescue: codes.map(c => ({ h: hashCode(c), used: false })) };
  const user = { id: 'u-' + uid(), role: 'org', orgId: org.id, name: boss, pin };
  data.orgs.push(org); data.users.push(user);
  wipeTo(data);
  K.session = { kind: 'org', userId: user.id }; DB.save();
  App.go('o.home');
  App.openSheet(`<h2>Carte de secours de l'organisation</h2>
    <p class="muted">Si vous oubliez votre code, un de ces codes vous laisse en choisir un nouveau. Recopiez-les maintenant : ils ne seront plus jamais affichés.</p>
    ${rescueCardHtml(org, codes)}
    <p class="hint">Gardez la carte dans un endroit sûr, connu de la direction seulement.</p>
    <button class="btn primary block xl" data-act="closeSheet">J'ai recopié la carte</button>`);
};

ACT.addAnimSheet = () => App.openSheet(`<h2>Ajouter un animateur</h2>
  <div class="field"><label for="anN">Nom complet</label><input id="anN" class="input" autocomplete="off"></div>
  ${geoZoneFields('an', {}, 'Précision sur la zone')}
  <div class="field"><label for="anT">Téléphone</label><input id="anT" class="input" inputmode="tel"></div>
  <button class="btn primary block xl" data-act="saveAnim">${ic('plus')} Ajouter</button>`);
ACT.saveAnim = () => {
  const u = me_user();
  const name = (fval('anN') || '').trim();
  if (name.length < 3) return App.toast('Écrivez le nom complet');
  if (K.data.users.some(x => x.orgId === u.orgId && x.name.toLowerCase() === name.toLowerCase())) return App.toast('Ce nom existe déjà');
  const pin = newPin();
  const g = readGeoZone('an');
  K.data.users.push({ id: 'u-' + uid(), role: 'anim', orgId: u.orgId, name, zone: zoneLabel(g), province: g.province, territoire: g.territoire, entite: g.entite, phone: (fval('anT') || '').trim(), pin });
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
ACT.animCodesSheet = () => {
  const boss = me_user();
  const anims = K.data.users.filter(x => x.role === 'anim' && x.orgId === boss.orgId && !x.remote);
  App.openSheet(`<h2>Code oublié d'un animateur</h2>
    <p class="muted">Choisissez l'animateur. Vous confirmez avec votre propre code, puis Akiba affiche son nouveau code une seule fois.</p>
    <div class="list">${anims.map(a => `<button class="li" data-act="resetUserPin" data-id="${a.id}"><span class="av">${esc(initials(a.name))}</span><span class="grow"><b>${esc(a.name)}</b><span class="small muted">${esc(a.zone || '')}${a.phone ? ' · ' + esc(a.phone) : ''}</span></span>${ic('chev')}</button>`).join('')}</div>`);
};
ACT.userPinSheet = () => {
  const u = me_user(), org = orgOf(u.orgId) || {};
  const left = (org.rescue || []).filter(r => !r.used).length;
  App.openSheet(`<h2>Changer mon code</h2>
    <div class="field"><label for="upO">Code actuel</label><input id="upO" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
    ${pinFields('upn')}<button class="btn primary block xl" data-act="saveUserPin">Enregistrer mon code</button>
    ${u.role === 'org' ? `<section class="card stack"><h3>Carte de secours de l'organisation</h3>
      <p class="small muted">${left ? `${left} code${left > 1 ? 's' : ''} pas encore utilisé${left > 1 ? 's' : ''}. C'est elle qui vous dépanne si vous oubliez votre code.` : 'Aucune carte sur ce téléphone : créez-la maintenant et recopiez-la sur papier.'}</p>
      <button class="btn ghost block" data-act="orgCardNew">${ic('shield')} Créer une nouvelle carte</button></section>` : ''}`);
};
/* carte de secours de l'organisation : plan B si le responsable oublie son code */
ACT.orgCardNew = () => {
  const u = me_user(), org = orgOf(u.orgId);
  if (!org || u.role !== 'org') return App.toast('Réservé au compte de l\'organisation');
  askPin(u, 'Créer une nouvelle carte', () => {
    const codes = Array.from({ length: 6 }, rescueCode);
    org.rescue = codes.map(c => ({ h: hashCode(c), used: false }));
    DB.save();
    App.openSheet(`<h2>Recopiez la carte maintenant</h2>${rescueCardHtml(org, codes)}
      <p class="hint">Les codes de l'ancienne carte ne marchent plus. Ceux-ci ne seront plus jamais affichés.</p>
      <button class="btn primary block xl" data-act="closeSheet">J'ai recopié la carte</button>`);
  });
};
ACT.orgLostSheet = () => {
  const users = K.data.users.filter(u => u.role === 'org' && !u.remote);
  const org = users.length ? orgOf(users[0].orgId) : null;
  const left = ((org || {}).rescue || []).filter(r => !r.used).length;
  App.openSheet(`<h2>Code oublié</h2>
    ${left ? `<p class="muted">Sortez la carte de secours de l'organisation et tapez un code pas encore barré. Barrez-le ensuite : il ne sert qu'une fois.</p>
      ${users.length > 1 ? `<div class="field"><label for="olU">Compte</label><select id="olU" class="input">${users.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></div>` : `<input id="olU" type="hidden" value="${users[0].id}">`}
      <div class="field"><label for="olC">Code de la carte</label><input id="olC" class="input bignum num" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="0000-0000"></div>
      ${pinFields('oln')}
      <button class="btn primary block xl" data-act="orgLostOk">Enregistrer mon nouveau code</button>`
    : `<div class="alert warn">${icSpan('alert')}<div><b>Pas de carte de secours sur ce téléphone</b><span class="small">Sans carte, le compte de l'organisation ne peut pas être débloqué ici. Restaurez la sauvegarde chiffrée sur un autre téléphone, ou appelez Ubora.</span></div></div>
      <button class="btn ghost block" data-act="go" data-to="dev.backup">${ic('shield')} Sauvegarde et restauration</button>`}
    <p class="small muted" style="text-align:center">Ubora : <a href="tel:${UBORA.tel}" style="color:var(--brand);font-weight:700">${UBORA.telShow}</a></p>`);
};
ACT.orgLostOk = () => {
  const u = userById(fval('olU')), org = u ? orgOf(u.orgId) : null;
  if (!u || !org) return App.toast('Compte introuvable');
  if ((org.lostLock || 0) > Date.now()) return App.toast('Trop d\'essais. Attendez quelques minutes.');
  const c = (fval('olC') || '').replace(/\D/g, '');
  if (c.length !== 8) return App.toast('Le code de la carte a 8 chiffres');
  const r = (org.rescue || []).find(x => !x.used && x.h === hashCode(c));
  if (!r) {
    org.lostFails = (org.lostFails || 0) + 1;
    if (org.lostFails >= 5) { org.lostLock = Date.now() + 10 * 60e3; org.lostFails = 0; }
    DB.save();
    return App.toast('Code de secours faux ou déjà utilisé');
  }
  const pin = readNewPin('oln'); if (!pin) return;
  r.used = Date.now(); r.by = u.id; org.lostFails = 0;
  u.pin = pin;
  K.session = { kind: 'org', userId: u.id };
  DB.save(); App.closeSheet(); App.go('o.home');
  App.toast(`Nouveau code enregistré pour ${u.name}`);
};
ACT.saveUserPin = () => {
  const u = me_user();
  if (fval('upO') !== u.pin) return App.toast('Le code actuel est faux');
  const pin = readNewPin('upn'); if (!pin) return;
  u.pin = pin; DB.save(); App.closeSheet(); App.toast('Code changé');
};
