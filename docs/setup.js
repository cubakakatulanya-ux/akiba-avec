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
  ${licKind() === 'avec' || !estSuivi() ? '' : `<button class="who" data-act="orgStart"><span class="ic" style="background:var(--brand-soft);color:var(--brand)">${ic('building')}</span><span><b>Je suis une organisation</b><span class="small muted">Créer le compte, puis les animateurs. Les animateurs créent les AVEC.</span></span></button>`}
  <button class="who" data-act="liveAvec"><span class="ic" style="background:var(--good-soft);color:var(--good)">${ic('users')}</span><span><b>Je suis une AVEC autonome</b><span class="small muted">Créer directement notre groupe, sans organisation.</span></span></button>`);
ACT.liveAvec = () => { wipeTo(emptyData()); App.cdraft = null; App.go('c.avec', { from: 'login' }); };

/* ---------- compte d'une organisation ----------
   Ubora ouvre le compte d'une organisation ; une ONG ne se déclare pas toute seule.
   L'ordre compte : l'organisation écrit d'abord qui elle est, ce qui part dans la demande,
   puis Ubora vérifie et renvoie un code de validation pour ce téléphone, puis seulement
   le responsable choisit son code secret et le compte existe. Seule la demande
   demande du réseau ; tout le reste travaille hors connexion.
   Les renseignements attendent dans le téléphone entre la demande et la réponse —
   jamais le code secret, qui n'est choisi qu'à la toute fin. */
const ORG_DRAFT = 'kitabu.orgDemande';
const orgDraftGet = () => { try { return JSON.parse(localStorage.getItem(ORG_DRAFT) || 'null') || null; } catch (e) { return null; } };
const orgDraftSet = d => { try { if (d) localStorage.setItem(ORG_DRAFT, JSON.stringify(d)); else localStorage.removeItem(ORG_DRAFT); } catch (e) { /* rien */ } };
const orgValide = () => licFull() && licKind() === 'org';
/* la barre des trois étapes, la même que partout ailleurs dans Akiba */
const orgSteps = n => `<div class="steps">${['Votre ONG', 'Validation', 'Votre code'].map((s, i) => `<span class="stp ${i + 1 === n ? 'cur' : i + 1 < n ? 'done' : ''}"><i>${i + 1 < n ? '✓' : i + 1}</i>${s}</span>`).join('')}</div>`;
ACT.orgStart = () => App.go('s.org');

SCREENS['s.org'] = () => {
  if (!estSuivi()) return SCREENS.login();
  const d = orgDraftGet() || {};
  const ok = orgValide();
  return `<div class="shell">${topbar("Compte de l'organisation", ok ? 'Téléphone validé' : 'Demande à Ubora', backBtn('login'))}<main class="main">
    <p class="muted">Ce compte voit toutes les AVEC que vous accompagnez, valide les nouveaux groupes et gère les animateurs.
      C'est Ubora qui l'ouvre, après vérification de la demande — une seule fois, avec du réseau.</p>
    ${ok ? `<div class="alert good">${icSpan('check')}<div><b>Ce téléphone est validé</b><span class="small">${esc((App.licence.data || {}).name || '')} · il ne reste qu'à confirmer les renseignements et à choisir votre code.</span></div></div>`
      : orgSteps(1)}
    <section class="card stack">
      <h2>Qui êtes-vous ?</h2>
      <div class="field"><label for="soN">Nom de l'organisation</label><input id="soN" class="input" value="${esc(d.name || '')}" autocomplete="off" placeholder="Ex. Mwangaza Développement"></div>
      ${geoZoneFields('so', d, 'Précision sur la zone')}
      <div class="field"><label for="soP">Nom du responsable du compte</label><input id="soP" class="input" value="${esc(d.boss || '')}" autocomplete="off" placeholder="Ex. Anuarite Kyavumba"></div>
      <div class="grid2">
        <div class="field"><label for="soT">Téléphone</label><input id="soT" class="input" inputmode="tel" value="${esc(d.phone || '')}" autocomplete="off" placeholder="Ex. 0998 275 144"></div>
        <div class="field"><label for="soM">Courriel <span class="opt">facultatif</span></label><input id="soM" class="input" inputmode="email" value="${esc(d.mail || '')}" autocomplete="off"></div>
      </div>
    </section>
    ${K.data.mode !== 'prod' ? `<div class="alert warn">${icSpan('alert')}<div><b>Les données de démonstration seront effacées</b><span class="small">Sur ce téléphone seulement, au moment où le compte est créé.</span></div></div>` : ''}
    <button class="btn primary block xl" data-act="${ok ? 'orgPinStep' : 'orgDemande'}">${ic(ok ? 'check' : 'chat')} ${ok ? 'Continuer : choisir mon code' : 'Préparer ma demande à Ubora'}</button>
    ${ok ? '' : `<p class="hint">Ubora renverra un code de validation pour ce téléphone (<b class="mono">${devNu(deviceId())}</b>). Vos renseignements restent ici en attendant la réponse.</p>`}
  </main></div>`;
};

/* lit et vérifie les renseignements — jamais de code secret à ce stade */
function orgLire() {
  const name = (fval('soN') || '').trim(), boss = (fval('soP') || '').trim(), phone = (fval('soT') || '').trim();
  if (name.length < 3) { App.toast("Écrivez le nom de l'organisation"); return null; }
  if (boss.length < 3) { App.toast('Écrivez le nom du responsable'); return null; }
  if (phone.replace(/\D/g, '').length < 9) { App.toast('Écrivez un numéro où Ubora peut vous joindre'); return null; }
  const g = readGeoZone('so');
  if (!g.province) { App.toast('Choisissez la province'); return null; }
  return { name, boss, phone, mail: (fval('soM') || '').trim(), province: g.province, territoire: g.territoire, entite: g.entite, zone: g.zone, zoneTexte: zoneLabel(g) };
}

ACT.orgDemande = () => {
  const d = orgLire(); if (!d) return;
  orgDraftSet(d);
  App.licThen = () => App.go('s.org');
  App.openSheet(`<h2>Demande à Ubora</h2>
    <p class="muted">Envoyez la demande ci-dessous : elle porte vos renseignements et le code de ce téléphone.
      Ubora vérifie, puis vous renvoie un code de validation. Collez-le ici dès que vous l'avez.</p>
    <div class="receipt stack" style="gap:4px">
      <div class="row between small"><span class="muted">Organisation</span><b style="text-align:right">${esc(d.name)}</b></div>
      ${d.zoneTexte ? `<div class="row between small"><span class="muted">Zone</span><b style="text-align:right">${esc(d.zoneTexte)}</b></div>` : ''}
      <div class="row between small"><span class="muted">Responsable</span><b style="text-align:right">${esc(d.boss)}</b></div>
      <div class="row between small"><span class="muted">Téléphone</span><b style="text-align:right">${esc(d.phone)}</b></div>
    </div>
    ${validationPanel({ intro: false, demande: d })}
    <!-- en face à face, Ubora scanne ce QR : la demande passe sans réseau et sans recopie -->
    <details class="g"><summary>Autres façons d'envoyer la demande</summary>
      <p class="small muted">Si vous êtes devant un responsable d'Ubora, montrez-lui ce QR code : il lit la demande directement dans son espace. Sinon, copiez le texte et envoyez-le par SMS.</p>
      <div style="text-align:center"><img id="demQrImg" data-qr="${esc(demandText(d))}" alt="QR code de la demande" hidden style="width:220px;max-width:100%;border-radius:12px;background:#fff;padding:8px"></div>
      <button class="btn ghost block" data-act="orgCopier">${ic('clip')} Copier le texte de la demande</button>
    </details>
    <button class="btn ghost block" data-act="closeSheet">Je reviendrai avec le code</button>`);
  setTimeout(demQrDessiner, 60);
};
/* le QR de la demande, dessiné après coup comme celui des cartes de membre */
function demQrDessiner() {
  const img = document.getElementById('demQrImg');
  if (!img || !img.dataset.qr || typeof carteChargerQr !== 'function') return;
  carteChargerQr()
    .then(Q => Q.toDataURL(img.dataset.qr, { width: 260, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }))
    .then(u => { img.src = u; img.hidden = false; })
    .catch(() => { /* sans QR, il reste WhatsApp et le texte */ });
}
ACT.orgCopier = async () => {
  const d = orgDraftGet();
  if (!d) return App.toast('Renseignements perdus : reprenez le formulaire');
  try { await navigator.clipboard.writeText(demandText(d)); App.toast('Demande copiée : collez-la dans un SMS'); }
  catch (e) { App.toast('Copie impossible sur ce téléphone : utilisez WhatsApp'); }
};

/* le téléphone est validé : dernière étape, le code du responsable */
ACT.orgPinStep = () => {
  const d = orgLire(); if (!d) return;
  orgDraftSet(d);
  App.openSheet(`<h2>Votre code de responsable</h2>
    <p class="muted">Ce code ouvre le compte de <b>${esc(d.name)}</b> sur ce téléphone. Quatre chiffres, connus de vous seul.</p>
    ${pinFields('soc')}
    <button class="btn primary block xl" data-act="saveOrg">${ic('check')} Créer le compte</button>`);
};

ACT.saveOrg = () => {
  const d = orgDraftGet();
  if (!d) return App.toast('Renseignements perdus : reprenez le formulaire');
  if (!orgValide()) return App.toast("Ce téléphone n'est pas encore validé par Ubora");
  const pin = readNewPin('soc'); if (!pin) return;
  const data = emptyData();
  const codes = Array.from({ length: 6 }, rescueCode);
  const org = { id: 'org-' + uid(), name: d.name, zone: d.zoneTexte, province: d.province, territoire: d.territoire, entite: d.entite, phone: d.phone, mail: d.mail, secret: randCode(8) + randCode(8), createdAt: Date.now(), rescue: codes.map(c => ({ h: hashCode(c), used: false })) };
  const user = { id: 'u-' + uid(), role: 'org', orgId: org.id, name: d.boss, phone: d.phone, pin };
  data.orgs.push(org); data.users.push(user);
  wipeTo(data);
  orgDraftSet(null);
  K.session = { kind: 'org', userId: user.id }; DB.save();
  App.go('o.home');
  App.openSheet(`<h2>Carte de secours de l'organisation</h2>
    <p class="muted">Si vous oubliez votre code, un de ces codes vous laisse en choisir un nouveau. Recopiez-les maintenant : ils ne seront plus jamais affichés.</p>
    ${rescueCardHtml(org, codes)}
    <p class="hint">Gardez la carte dans un endroit sûr, connu de la direction seulement. Ensuite, ajoutez vos animateurs depuis le tableau de bord.</p>
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
