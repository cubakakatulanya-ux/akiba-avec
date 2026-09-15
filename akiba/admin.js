/* Akiba AVEC — espace administrateur Ubora : créer et partager les licences depuis le téléphone.
   La clé secrète n'est jamais en clair dans le téléphone : elle reste chiffrée par le mot de passe de l'administrateur,
   n'est déchiffrée qu'en mémoire, et elle est oubliée dès qu'on quitte l'espace (ou après 10 minutes). */
'use strict';

const ADM_KEY_STORE = 'kitabu.adminkey', ADM_REG_STORE = 'kitabu.adminreg';
const APP_URL = 'https://cubakakatulanya-ux.github.io/akiba-avec/';
const b64uEnc = bytes => b64enc(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const admGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const admSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* rien */ } };
const admReg = () => { try { return JSON.parse(admGet(ADM_REG_STORE) || '[]'); } catch (e) { return []; } };

async function admUnwrap(boxText, password) {
  let box;
  try { box = JSON.parse(boxText); } catch (e) { throw new Error('Ce fichier n\'est pas une clé administrateur Akiba'); }
  if (!box || box.app !== 'akiba-cle-admin') throw new Error('Ce fichier n\'est pas une clé administrateur Akiba');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64dec(box.salt), iterations: box.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let jwk;
  try { jwk = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(box.iv) }, aes, b64dec(box.data)))); }
  catch (e) { throw new Error('Mot de passe faux'); }
  if (jwk.x !== LICENCE_PUBLIC_KEY.x || jwk.y !== LICENCE_PUBLIC_KEY.y) throw new Error('Cette clé ne correspond pas à l\'application Akiba');
  return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, d: jwk.d }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
function admKeep(key) {
  App.adminKey = key;
  clearTimeout(App.adminTimer);
  App.adminTimer = setTimeout(() => { App.adminKey = null; if (/^adm\./.test(App.screen)) render(); }, 10 * 60e3);
}
async function admInstallKey(boxText, password) {
  const key = await admUnwrap(boxText, password);
  admSet(ADM_KEY_STORE, boxText);                                   // gardée chiffrée
  admKeep(key);
}
async function admSignLicence(key, name, kind, exp) {
  const id = 'L-' + Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const payload = b64uEnc(new TextEncoder().encode(JSON.stringify({ v: 1, id, name, kind, exp, iat: isoDay(Date.now()) })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(payload)));
  const code = payload + '.' + b64uEnc(sig);
  return { id, name, kind, exp, date: isoDay(Date.now()), code, link: APP_URL + '#licence=' + code };
}
function loadQr() {
  if (window.QRCode) return Promise.resolve(window.QRCode);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'qrcode.min.js'; s.onload = () => (window.QRCode ? res(window.QRCode) : rej(new Error('QR'))); s.onerror = rej;
    document.head.appendChild(s);
    setTimeout(() => rej(new Error('QR')), 8000);
  });
}
function paintQr(link) {
  const img = document.getElementById('admQr');
  if (!img) return;
  loadQr().then(Q => Q.toDataURL(link, { width: 520, margin: 2, errorCorrectionLevel: 'M' })).then(url => { img.src = url; img.hidden = false; }).catch(() => { const n = document.getElementById('admQrNote'); if (n) n.hidden = false; });
}

/* la clé est oubliée dès qu'on quitte l'espace administrateur */
const _goAdmin = App.go.bind(App);
App.go = function (screen, ...rest) { if (!/^adm\./.test(screen)) { App.adminKey = null; App.admLast = null; } return _goAdmin(screen, ...rest); };

SCREENS['adm.home'] = () => {
  const hasKey = !!admGet(ADM_KEY_STORE);
  const head = topbar('Espace administrateur', 'Licences Akiba · Entreprise Sociale Ubora', backBtn(K.session ? 'dev.backup' : 'login'));
  if (!canEncrypt()) return `<div class="shell">${head}<main class="main"><div class="alert bad"><div><b>Navigateur trop ancien</b><span class="small">Mettez Chrome à jour pour utiliser l'espace administrateur.</span></div></div></main></div>`;
  if (!hasKey) return `<div class="shell">${head}<main class="main">
    <div><h2>Installer la clé administrateur</h2><p class="muted">Réservé à l'administrateur d'Akiba. Une seule fois par téléphone.</p></div>
    <ol class="small card" style="margin:0;padding:14px 14px 14px 34px;display:flex;flex-direction:column;gap:6px">
      <li>Sur l'ordinateur, dossier <b>Documents › Akiba-admin</b>, lancez : <span class="mono">node exporter-cle-telephone.js</span></li>
      <li>Envoyez le fichier <b>cle-admin-telephone.akibakey</b> sur ce téléphone (WhatsApp à vous-même, câble…).</li>
      <li>Choisissez-le ci-dessous et tapez le mot de passe choisi sur l'ordinateur.</li></ol>
    <section class="card stack">
      <div class="field"><label for="admF">Fichier de clé (.akibakey)</label><input id="admF" class="input" type="file" accept=".akibakey,application/json,application/octet-stream"></div>
      <div class="field"><label for="admP">Mot de passe administrateur</label><input id="admP" class="input" type="password" autocomplete="off"></div>
      <button class="btn primary block xl" data-act="admInstall">${ic('key')} Installer la clé</button>
    </section>
    <p class="hint">La clé reste chiffrée dans le téléphone. Sans le mot de passe, personne ne peut créer de licence, même avec ce téléphone en main.</p>
  </main></div>`;
  if (!App.adminKey) return `<div class="shell">${head}<main class="main">
    <section class="card stack"><h2>Déverrouiller</h2>
      <div class="field"><label for="admU">Mot de passe administrateur</label><input id="admU" class="input" type="password" autocomplete="off"></div>
      <button class="btn primary block xl" data-act="admUnlock">${ic('unlock')} Ouvrir l'espace</button></section>
    <button class="btn ghost block" data-act="admRemoveSheet">Retirer la clé de ce téléphone</button>
  </main></div>`;
  const last = App.admLast, reg = admReg();
  const nextYear = isoDay(Date.now() + 365 * DAY);
  return `<div class="shell">${head}<main class="main">
    <div class="alert good">${icSpan('unlock')}<div><b>Espace ouvert</b><span class="small">Il se referme tout seul en quittant cet écran ou après 10 minutes.</span></div></div>
    ${last ? `<section class="card stack"><h2>Licence ${esc(last.id)}</h2>
      <div class="row between small"><span class="muted">Partenaire</span><b>${esc(last.name)}</b></div>
      <div class="row between small"><span class="muted">Type</span><b>${LIC_KINDS[last.kind]}</b></div>
      <div class="row between small"><span class="muted">Fin</span><b>${fdateY(new Date(last.exp + 'T12:00').getTime())}</b></div>
      <div style="text-align:center"><img id="admQr" alt="QR code d'activation" hidden style="width:220px;max-width:100%;border-radius:12px;background:#fff;padding:6px"><p id="admQrNote" class="hint" hidden>QR code indisponible : partagez le lien.</p></div>
      <div class="grid2"><button class="btn brand" data-act="admShare">${ic('chat')} Partager</button><button class="btn ghost" data-act="admCopy">Copier le lien</button></div>
      <p class="hint">Envoyez ce lien au partenaire seulement. Il l'ouvre dans Chrome ou scanne le QR code : Akiba s'active.</p>
    </section>` : ''}
    <section class="card stack"><h2>Nouvelle licence</h2>
      <div class="field"><label for="admN">Nom du partenaire</label><input id="admN" class="input" autocomplete="off" placeholder="Ex. Espoir Ubangi"></div>
      <div class="grid2">
        <div class="field"><label for="admK">Type</label><select id="admK" class="input"><option value="org">Organisation</option><option value="avec">AVEC autonome</option><option value="demo">Démonstration</option></select></div>
        <div class="field"><label for="admE">Fin de la licence</label><input id="admE" class="input" type="date" value="${nextYear}"></div>
      </div>
      <button class="btn primary block xl" data-act="admCreate">${ic('plus')} Créer la licence</button>
    </section>
    <section class="section"><div class="row between"><h2>Registre sur ce téléphone</h2><span class="chip">${reg.length}</span></div>
      <div class="list">${reg.map((r, i) => { const expired = new Date(r.exp + 'T23:59:59') < new Date(); return `<button class="li" data-act="admOpen" data-i="${i}"><span class="grow"><b>${esc(r.name)}</b><span class="small muted">${esc(r.id)} · ${LIC_KINDS[r.kind]} · créée le ${esc(r.date)}</span></span><span class="chip ${expired ? 'bad' : 'good'}">${expired ? 'expirée' : 'fin ' + esc(r.exp)}</span></button>`; }).join('') || '<div class="li muted">Aucune licence créée sur ce téléphone</div>'}</div>
    </section>
    <button class="btn ghost block" data-act="admLock">${ic('lock')} Fermer l'espace</button>
  </main></div>`;
};
ACT.admInstall = async () => {
  const f = document.getElementById('admF'), p = fval('admP') || '';
  if (!f || !f.files || !f.files[0]) return App.toast('Choisissez le fichier de clé');
  if (!p) return App.toast('Tapez le mot de passe administrateur');
  try { await admInstallKey(await readFileText(f.files[0]), p); render(); App.toast('Clé installée. Espace ouvert.'); }
  catch (e) { App.toast(e.message); }
};
ACT.admUnlock = async () => {
  const box = admGet(ADM_KEY_STORE), p = fval('admU') || '';
  if (!box || !p) return App.toast('Tapez le mot de passe administrateur');
  if ((App.admLockUntil || 0) > Date.now()) return App.toast('Trop d\'essais. Attendez quelques minutes.');
  try { admKeep(await admUnwrap(box, p)); App.admFails = 0; render(); }
  catch (e) { App.admFails = (App.admFails || 0) + 1; if (App.admFails >= 5) { App.admLockUntil = Date.now() + 10 * 60e3; App.admFails = 0; } App.toast(e.message); }
};
ACT.admCreate = async () => {
  if (!App.adminKey) { render(); return App.toast('Espace refermé : déverrouillez de nouveau'); }
  const name = (fval('admN') || '').trim().replace(/\s+/g, ' '), kind = fval('admK'), exp = fval('admE');
  if (name.length < 3) return App.toast('Écrivez le nom du partenaire');
  if (!LIC_KINDS[kind]) return App.toast('Choisissez le type de licence');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp || '') || new Date(exp + 'T23:59:59') <= new Date()) return App.toast('La date de fin doit être dans le futur');
  const lic = await admSignLicence(App.adminKey, name, kind, exp);
  admSet(ADM_REG_STORE, JSON.stringify([lic].concat(admReg())));
  admKeep(App.adminKey);
  App.admLast = lic; render(); paintQr(lic.link);
  App.toast(`Licence ${lic.id} créée pour ${name}`);
};
ACT.admOpen = d => { const r = admReg()[+d.i]; if (!r) return; App.admLast = r; render(); paintQr(r.link); };
ACT.admShare = async () => {
  const l = App.admLast; if (!l) return;
  const text = `Akiba AVEC — licence ${LIC_KINDS[l.kind]} pour « ${l.name} », valable jusqu'au ${l.exp}.\nOuvrez ce lien dans Chrome pour activer Akiba :\n${l.link}\n\nAssistance Ubora : ${UBORA.telShow}`;
  try { if (navigator.share) { await navigator.share({ title: 'Licence Akiba', text }); return; } } catch (e) { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
};
ACT.admCopy = async () => {
  const l = App.admLast; if (!l) return;
  try { await navigator.clipboard.writeText(l.link); App.toast('Lien copié'); } catch (e) { App.toast('Copie impossible : utilisez « Partager »'); }
};
ACT.admLock = () => { App.adminKey = null; App.admLast = null; clearTimeout(App.adminTimer); render(); App.toast('Espace fermé'); };
ACT.admRemoveSheet = () => App.openSheet(`<h2>Retirer la clé de ce téléphone ?</h2>
  <p class="muted">La clé chiffrée et le registre des licences de ce téléphone seront effacés. Les licences déjà envoyées restent valables. Vous pourrez réinstaller la clé depuis l'ordinateur.</p>
  <button class="btn danger block xl" data-act="admRemove">Retirer la clé</button><button class="btn ghost block" data-act="closeSheet">Garder</button>`);
ACT.admRemove = () => { admSet(ADM_KEY_STORE, null); admSet(ADM_REG_STORE, null); App.adminKey = null; App.admLast = null; App.closeSheet(); App.toast('Clé retirée de ce téléphone'); };
