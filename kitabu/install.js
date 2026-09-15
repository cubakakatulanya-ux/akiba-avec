/* Kitabu AVEC — icône sur l'écran d'accueil, stockage protégé et sauvegarde chiffrée (contre la perte ou la désinstallation) */
'use strict';

const isInstalled = () => {
  try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; }
};
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '');

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); App.installEvt = e; if (!App.sheet) render(); });
window.addEventListener('appinstalled', () => { App.installEvt = null; protectStorage(); App.toast('Kitabu est sur l\'écran d\'accueil'); render(); });

/* Demande au navigateur de ne jamais effacer les données de Kitabu pour libérer de la place. */
function protectStorage() {
  if (!navigator.storage || !navigator.storage.persist) return Promise.resolve(false);
  return navigator.storage.persisted().then(p => p || navigator.storage.persist()).then(v => { App.persisted = !!v; return App.persisted; }).catch(() => false);
}
protectStorage();

function installBanner() {
  if (!window.KITABU_PWA || isInstalled()) return '';
  return `<button class="alert warn" style="border-top:0;border-right:0;border-bottom:0;width:100%;text-align:left" data-act="go" data-to="dev.backup">
    ${icSpan('home')}<span style="flex:1"><b>Installer Kitabu sur l'écran d'accueil</b><span class="small">Une icône, et l'application s'ouvre sans réseau.</span></span>${ic('chev')}</button>`;
}
ACT.install = () => {
  const ev = App.installEvt;
  if (!ev) return App.toast('Utilisez le menu du navigateur : « Ajouter à l\'écran d\'accueil »');
  ev.prompt();
  ev.userChoice.then(c => { if (c.outcome === 'accepted') { App.installEvt = null; protectStorage(); } render(); }).catch(() => {});
};

/* ---------- sauvegarde chiffrée ---------- */
const b64enc = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const b64dec = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
async function backupKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const canEncrypt = () => !!(window.crypto && crypto.subtle && window.TextEncoder);
const hasRealData = () => K.data.mode === 'prod' && K.data.avecs.length > 0;
const canBackup = () => {
  const s = K.session;
  if (!s) return false;
  if (s.kind === 'avec') { const a = avecById(s.avecId); return isBureau(memberOf(a, s.memberId)); }
  return true;
};

SCREENS['dev.backup'] = () => {
  const installed = isInstalled();
  const last = K.data.lastBackup;
  const back = K.session ? trBack() : 'login';
  const step = (n, t) => `<li>${t}</li>`;
  return `<div class="shell">${topbar('Installer et protéger', 'Kitabu sur ce téléphone', backBtn(back))}<main class="main">
    <section class="card stack"><h2>Icône sur l'écran d'accueil</h2>
      ${installed ? `<div class="alert good">${icSpan('check')}<div><b>Kitabu est installé</b><span class="small">Ouvrez-le toujours depuis l'icône verte, même sans réseau.</span></div></div>`
        : !window.KITABU_PWA ? `<p class="small muted">Cette page est une version de démonstration. Pour installer Kitabu, ouvrez l'adresse officielle de l'application dans Chrome.</p>`
        : App.installEvt ? `<button class="btn primary block xl" data-act="install">${ic('home')} Installer Kitabu</button><p class="hint">Une icône verte apparaît sur l'écran d'accueil.</p>`
        : isIOS() ? `<ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px">${step(1, 'Ouvrez Kitabu dans Safari.')}${step(2, 'Touchez le bouton Partager (carré avec une flèche).')}${step(3, 'Choisissez « Sur l\'écran d\'accueil », puis « Ajouter ».')}</ol>`
        : `<ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px">${step(1, 'Ouvrez Kitabu dans Chrome.')}${step(2, 'Touchez le menu ⋮ en haut à droite.')}${step(3, 'Choisissez « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».')}</ol>`}
    </section>

    <section class="card stack"><h2>Éviter une désinstallation par erreur</h2>
      <p class="small muted">Aucune application ne peut interdire totalement sa désinstallation : c'est le téléphone qui décide. Voici comment protéger Kitabu et surtout ses données.</p>
      <div class="row between small"><span>Données protégées contre l'effacement automatique</span>${App.persisted ? '<span class="chip good">Oui</span>' : '<span class="chip warn">Pas encore</span>'}</div>
      <ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:7px">
        <li><b>Mettez l'icône dans un dossier « AVEC »</b>, loin des applications que l'on supprime souvent.</li>
        <li><b>Verrouillez le téléphone du groupe</b> par un schéma ou un code connu du bureau seulement.</li>
        <li><b>Android : « Épinglage d'application »</b> (Paramètres › Sécurité › Épingler l'application). Kitabu reste à l'écran et on ne peut pas quitter ni désinstaller sans le code du téléphone.</li>
        <li><b>Téléphones de l'organisation</b> : un outil de gestion des appareils (Google Family Link ou Android Enterprise) peut bloquer la désinstallation.</li>
        <li><b>Ne jamais</b> utiliser « Effacer les données » de Chrome ou un nettoyeur de mémoire sur ce téléphone.</li>
        <li><b>Faites une sauvegarde chaque semaine</b> (ci-dessous) et envoyez les données dès qu'il y a du réseau.</li>
      </ol>
    </section>

    <section class="card stack"><h2>Sauvegarde</h2>
      <p class="small muted">Un fichier chiffré avec un mot de passe. Gardez-le sur une carte mémoire, sur l'ordinateur de l'organisation ou dans Google Drive. Si le téléphone est perdu ou si Kitabu est effacé, on restaure tout sur un autre téléphone.</p>
      <div class="row between small"><span>Dernière sauvegarde</span><b>${last ? ago(last) : 'jamais'}</b></div>
      ${last && daysAgo(last) > 7 && hasRealData() ? `<div class="alert warn">${icSpan('alert')}<div><b>Sauvegarde trop ancienne</b><span class="small">Faites-en une nouvelle aujourd'hui.</span></div></div>` : ''}
      ${canBackup() ? `<button class="btn brand block" data-act="backupSheet">${ic('shield')} Créer une sauvegarde</button>` : '<p class="hint">Connectez-vous (bureau, animateur ou organisation) pour créer une sauvegarde.</p>'}
      <button class="btn ghost block" data-act="restoreSheet">${ic('sync')} Restaurer sur ce téléphone</button>
    </section>
  </main></div>`;
};

ACT.backupSheet = () => {
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le chiffrement. Mettez Chrome à jour.');
  App.openSheet(`<h2>Créer une sauvegarde</h2>
    <p class="muted">Choisissez un mot de passe d'au moins 8 signes. Sans lui, personne ne peut lire ni restaurer le fichier : notez-le et gardez-le au bureau de l'organisation ou chez la présidente.</p>
    <div class="field"><label for="bkP">Mot de passe de sauvegarde</label><input id="bkP" class="input" type="password" autocomplete="new-password"></div>
    <div class="field"><label for="bkC">Encore une fois</label><input id="bkC" class="input" type="password" autocomplete="new-password"></div>
    <button class="btn primary block xl" data-act="backupRun">${ic('shield')} Enregistrer le fichier</button>`);
};
ACT.backupRun = async () => {
  const p = fval('bkP') || '', c = fval('bkC') || '';
  if (p.length < 8) return App.toast('Le mot de passe doit avoir au moins 8 signes');
  if (p !== c) return App.toast('Les deux mots de passe sont différents');
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await backupKey(p, salt);
    const copy = Object.assign({}, K.data, { tamper: null });
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(copy)));
    const file = JSON.stringify({ app: 'kitabu-avec', format: 1, created: Date.now(), avecs: K.data.avecs.length, salt: b64enc(salt), iv: b64enc(iv), data: b64enc(cipher) });
    const url = URL.createObjectURL(new Blob([file], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `kitabu-sauvegarde-${isoDay(Date.now())}.kitabu`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    K.data.lastBackup = Date.now(); DB.save();
    App.closeSheet(); App.toast('Sauvegarde enregistrée dans « Téléchargements »');
  } catch (e) { App.toast('La sauvegarde n\'a pas pu être créée : ' + e.message); }
};
ACT.restoreSheet = () => {
  if (hasRealData()) return App.openSheet(`<h2>Restauration bloquée</h2>
    <p class="muted">Ce téléphone contient déjà de vraies données AVEC. Pour éviter qu'une ancienne sauvegarde efface des opérations récentes, on ne restaure que sur un téléphone neuf ou encore en mode démonstration.</p>
    <button class="btn primary block xl" data-act="closeSheet">Compris</button>`);
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le déchiffrement. Mettez Chrome à jour.');
  App.openSheet(`<h2>Restaurer une sauvegarde</h2>
    <p class="muted">Pour remplacer un téléphone perdu, cassé ou effacé. Les données de démonstration de ce téléphone seront remplacées.</p>
    <div class="field"><label for="rsF">Fichier de sauvegarde (.kitabu)</label><input id="rsF" class="input" type="file" accept=".kitabu,.json,application/json"></div>
    <div class="field"><label for="rsP">Mot de passe de sauvegarde</label><input id="rsP" class="input" type="password" autocomplete="off"></div>
    <button class="btn primary block xl" data-act="restoreRun">${ic('sync')} Restaurer</button>`);
};
ACT.restoreRun = async () => {
  if (hasRealData()) return App.toast('Restauration impossible : ce téléphone contient déjà des données');
  const f = document.getElementById('rsF'), p = fval('rsP') || '';
  if (!f || !f.files || !f.files[0]) return App.toast('Choisissez le fichier de sauvegarde');
  try {
    const box = JSON.parse(await f.files[0].text());
    if (box.app !== 'kitabu-avec') return App.toast('Ce fichier n\'est pas une sauvegarde Kitabu');
    let plain;
    try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(box.iv) }, await backupKey(p, b64dec(box.salt)), b64dec(box.data)); }
    catch (e) { return App.toast('Mot de passe faux, ou fichier abîmé'); }
    const data = JSON.parse(new TextDecoder().decode(plain));
    if (!data || !Array.isArray(data.avecs)) return App.toast('Sauvegarde incomplète');
    const broken = data.avecs.find(a => !verifyChain(a).ok);
    if (broken) return App.toast(`Le journal de « ${broken.name} » est altéré : restauration refusée`);
    K.data = data; K.session = null;
    Object.keys(_chain).forEach(k => delete _chain[k]);
    DB.save(); App.go('login'); App.toast(`${data.avecs.length} AVEC restaurée${data.avecs.length > 1 ? 's' : ''}. Connectez-vous.`);
  } catch (e) { App.toast('Restauration impossible : ' + e.message); }
};
