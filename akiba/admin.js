/* Akiba AVEC — espace administrateur Ubora : partenaires et codes de validation, depuis le téléphone, sans réseau.
   Un code de validation est signé pour UN téléphone (son code) : il ne marche sur aucun autre.
   La clé secrète n'est jamais en clair dans le téléphone : elle reste chiffrée par le mot de passe de l'administrateur,
   n'est déchiffrée qu'en mémoire, et elle est oubliée dès qu'on quitte l'espace (ou après 10 minutes). */
'use strict';

const ADM_KEY_STORE = 'kitabu.adminkey', ADM_REG_STORE = 'kitabu.adminreg', ADM_ACT_STORE = 'kitabu.adminacts';
const APP_URL = 'https://cubakakatulanya-ux.github.io/akiba-avec/';
const b64uEnc = bytes => b64enc(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const admGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const admSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* rien */ } };
const admReg = () => { try { return JSON.parse(admGet(ADM_REG_STORE) || '[]'); } catch (e) { return []; } };
const admActs = () => { try { return JSON.parse(admGet(ADM_ACT_STORE) || '[]'); } catch (e) { return []; } };
// « 7Q2M-9XKD », « 7q2m9xkd », ou le message complet reçu du partenaire
// (un message collé dans un champ perd ses retours à la ligne : on cherche d'abord après « téléphone : »)
const devFrom = t => {
  const s = String(t || '').toUpperCase();
  const m = s.match(/T[ÉE]L[ÉE]PHONE\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/) || s.match(/(?:^|[^A-Z0-9])([A-Z0-9]{4}-[A-Z0-9]{4})(?![A-Z0-9])/) || s.replace(/[\s-]+/g, '').match(/^([A-Z0-9]{8})$/);
  return m ? m[1].replace(/^(.{4})-?/, '$1-') : '';
};

async function admSignData(key, obj) {
  const payload = b64uEnc(new TextEncoder().encode(JSON.stringify(obj)));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(payload)));
  return payload + '.' + b64uEnc(sig);
}
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
function admNewPartner(name, kind, exp, seats) {
  const id = 'L-' + Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return { id, name, kind, exp, seats, date: isoDay(Date.now()) };
}
/* code de validation : le partenaire + le code du téléphone, signés ensemble */
async function admSignCode(key, p, dev) {
  const code = await admSignData(key, { v: 3, id: p.id, name: p.name, kind: p.kind, exp: p.exp, seats: p.seats || 0, dev, iat: isoDay(Date.now()) });
  return { type: 'code', id: p.id, name: p.name, kind: p.kind, exp: p.exp, dev, date: isoDay(Date.now()), code, link: APP_URL + '#code=' + code };
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
App.go = function (screen, ...rest) { if (!/^adm\./.test(screen)) { App.adminKey = null; App.admLast = null; App.admForce = null; } return _goAdmin(screen, ...rest); };

SCREENS['adm.home'] = () => {
  const hasKey = !!admGet(ADM_KEY_STORE);
  const head = topbar('Espace administrateur', 'Codes de validation · Entreprise Sociale Ubora', backBtn(K.session ? 'dev.backup' : 'login'));
  if (!canEncrypt()) return `<div class="shell">${head}<main class="main"><div class="alert bad"><div><b>Navigateur trop ancien</b><span class="small">Mettez Chrome à jour pour utiliser l'espace administrateur.</span></div></div></main></div>`;
  if (!hasKey) return `<div class="shell">${head}<main class="main">
    <div><h2>Installer la clé administrateur</h2><p class="muted">Réservé à l'administrateur d'Akiba. Une seule fois par téléphone.</p></div>
    <ol class="small card" style="margin:0;padding:14px 14px 14px 34px;display:flex;flex-direction:column;gap:6px">
      <li>Sur l'ordinateur, dossier <b>Documents › Akiba-admin</b>, double-cliquez sur <b>1-Exporter-la-cle-vers-mon-telephone.bat</b>.</li>
      <li>Envoyez le fichier <b>cle-admin-telephone.akibakey</b> sur ce téléphone (WhatsApp à vous-même, câble…).</li>
      <li>Choisissez-le ci-dessous et tapez le mot de passe choisi sur l'ordinateur.</li></ol>
    <section class="card stack">
      <div class="field"><label for="admF">Fichier de clé (.akibakey)</label><input id="admF" class="input" type="file" accept=".akibakey,application/json,application/octet-stream"></div>
      <div class="field"><label for="admP">Mot de passe administrateur</label><input id="admP" class="input" type="password" autocomplete="off"></div>
      <button class="btn primary block xl" data-act="admInstall">${ic('key')} Installer la clé</button>
    </section>
    <p class="hint">La clé reste chiffrée dans le téléphone. Sans le mot de passe, personne ne peut créer de code, même avec ce téléphone en main.</p>
  </main></div>`;
  if (!App.adminKey) return `<div class="shell">${head}<main class="main">
    <section class="card stack"><h2>Déverrouiller</h2>
      <div class="field"><label for="admU">Mot de passe administrateur</label><input id="admU" class="input" type="password" autocomplete="off"></div>
      <button class="btn primary block xl" data-act="admUnlock">${ic('unlock')} Ouvrir l'espace</button></section>
    <button class="btn ghost block" data-act="admRemoveSheet">Retirer la clé de ce téléphone</button>
  </main></div>`;
  const last = App.admLast, reg = admReg(), acts = admActs(), blk = blockData(), f = App.admForce;
  const nextYear = isoDay(Date.now() + 365 * DAY);
  const row = (k, v) => `<div class="row between small"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
  const used = id => acts.filter(a => a.lic === id).length;
  return `<div class="shell">${head}<main class="main">
    <div class="alert good">${icSpan('unlock')}<div><b>Espace ouvert</b><span class="small">Il se referme tout seul en quittant cet écran ou après 10 minutes. Fonctionne sans réseau.</span></div></div>
    ${last ? `<section class="card stack"><h2>Code de validation prêt</h2>
      ${row('Partenaire', esc(last.name))}${row('Type', LIC_KINDS[last.kind])}${row('Téléphone', `<span class="mono">${esc(last.dev)}</span>`)}${row('Valable jusqu\'au', fdateY(new Date(last.exp + 'T12:00').getTime()))}
      <div class="formula mono" style="word-break:break-all;max-height:88px;overflow:auto">${esc(last.code)}</div>
      <div style="text-align:center"><img id="admQr" alt="QR code de validation" hidden style="width:220px;max-width:100%;border-radius:12px;background:#fff;padding:6px"><p id="admQrNote" class="hint" hidden>QR code indisponible : partagez le code.</p></div>
      <div class="grid2"><button class="btn brand" data-act="admShare">${ic('chat')} Envoyer</button><button class="btn ghost" data-act="admCopy">Copier le code</button></div>
      <p class="hint">Ce code ne fonctionne que sur le téléphone ${esc(last.dev)}. Collé ou ouvert sur un autre téléphone, il est refusé.</p>
    </section>` : ''}
    <section class="card stack"><h2>Créer un code de validation</h2>
      ${reg.length ? `
      <div class="field"><label for="admT">Code du téléphone</label><input id="admT" class="input mono" autocomplete="off" autocapitalize="characters" placeholder="Ex. 7Q2M-9XKD, ou collez le message reçu" value="${esc(f ? f.dev : '')}"></div>
      <div class="field"><label for="admL">Partenaire</label><select id="admL" class="input">${reg.map(p => `<option value="${esc(p.id)}" ${(f ? f.id : App.admPick) === p.id ? 'selected' : ''}>${esc(p.name)} · ${esc(p.id)} (${used(p.id)}${p.seats ? '/' + p.seats : ''} tél.)</option>`).join('')}</select></div>
      ${f ? `<div class="alert bad">${icSpan('alert')}<div><b>Nombre de téléphones autorisés atteint</b><span class="small">« ${esc(f.name)} » a déjà ${f.count} téléphone${f.count > 1 ? 's' : ''} validé${f.count > 1 ? 's' : ''} sur ${f.seats}. Vérifiez auprès du partenaire : le code circule peut-être.</span></div></div>` : ''}
      <button class="btn primary block xl" data-act="admCode">${ic('key')} ${f ? 'Créer quand même' : 'Créer le code'}</button>`
    : '<p class="small muted">Créez d\'abord le partenaire ci-dessous.</p>'}
    </section>
    <section class="card stack"><h2>Nouveau partenaire</h2>
      <div class="field"><label for="admN">Nom (organisation ou AVEC autonome)</label><input id="admN" class="input" autocomplete="off" placeholder="Ex. Espoir Ubangi"></div>
      <div class="grid2">
        <div class="field"><label for="admK">Type</label><select id="admK" class="input"><option value="org">Organisation</option><option value="avec">AVEC autonome</option><option value="demo">Démonstration</option></select></div>
        <div class="field"><label for="admE">Fin de validité</label><input id="admE" class="input" type="date" value="${nextYear}"></div>
      </div>
      <div class="field"><label for="admS">Téléphones autorisés</label><input id="admS" class="input num" inputmode="numeric" value="5" autocomplete="off"><span class="hint">Organisation : le coordinateur et les animateurs. Les téléphones des groupes reçoivent leur AVEC de l'animateur et ne comptent pas.</span></div>
      <button class="btn ghost block" data-act="admCreate">${ic('plus')} Ajouter le partenaire</button>
    </section>
    <section class="card stack"><h2>Bloquer un partenaire ou un téléphone</h2>
      <p class="small muted">Liste de blocage en vigueur : <b>${blk ? (blk.licences || []).length : 0}</b> partenaire(s), <b>${blk ? (blk.devices || []).length : 0}</b> téléphone(s)${blk && blk.iat ? ', publiée le ' + fdateY(+blk.iat) : ''}.</p>
      <p class="small">Sur l'ordinateur, dossier <b>Documents › Akiba-admin</b>, double-cliquez sur <b>3-Bloquer-ou-debloquer.bat</b>. Chaque téléphone applique la liste dès qu'il capte le réseau ; sans réseau, il continue avec la dernière liste reçue.</p>
    </section>
    <section class="section"><div class="row between"><h2>Partenaires et téléphones</h2><span class="chip">${reg.length}</span></div>
      <div class="list">${reg.map(p => { const expired = new Date(p.exp + 'T23:59:59') < new Date(); const devs = acts.filter(a => a.lic === p.id); return `<div class="li"><span class="grow"><b>${esc(p.name)}</b><span class="small muted">${esc(p.id)} · ${LIC_KINDS[p.kind]} · ${devs.length}${p.seats ? '/' + p.seats : ''} téléphone${devs.length > 1 ? 's' : ''}${devs.length ? ' : <span class="mono">' + devs.map(d => esc(d.dev)).join(', ') + '</span>' : ''}</span></span><span class="chip ${expired ? 'bad' : 'good'}">${expired ? 'expiré' : 'fin ' + esc(p.exp)}</span></div>`; }).join('') || '<div class="li muted">Aucun partenaire sur ce téléphone</div>'}</div>
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
ACT.admCreate = () => {
  if (!App.adminKey) { render(); return App.toast('Espace refermé : déverrouillez de nouveau'); }
  const name = (fval('admN') || '').trim().replace(/\s+/g, ' '), kind = fval('admK'), exp = fval('admE');
  if (name.length < 3) return App.toast('Écrivez le nom du partenaire');
  if (!LIC_KINDS[kind]) return App.toast('Choisissez le type');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp || '') || new Date(exp + 'T23:59:59') <= new Date()) return App.toast('La date de fin doit être dans le futur');
  const seats = parseInt(String(fval('admS') || '').replace(/\D/g, ''), 10) || 0;
  if (kind !== 'demo' && (seats < 1 || seats > 500)) return App.toast('Téléphones autorisés : entre 1 et 500');
  const p = admNewPartner(name, kind, exp, kind === 'demo' ? 0 : seats);
  admSet(ADM_REG_STORE, JSON.stringify([p].concat(admReg())));
  admKeep(App.adminKey);
  App.admPick = p.id; App.admForce = null; render();
  App.toast(`Partenaire ajouté : ${name}. Créez maintenant son code de validation.`);
};
ACT.admCode = async () => {
  if (!App.adminKey) { render(); return App.toast('Espace refermé : déverrouillez de nouveau'); }
  const dev = devFrom(fval('admT')), p = admReg().find(x => x.id === fval('admL'));
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(dev)) return App.toast('Tapez le code du téléphone (8 signes, ex. 7Q2M-9XKD)');
  if (!p) return App.toast('Choisissez le partenaire');
  if (new Date(p.exp + 'T23:59:59') <= new Date()) return App.toast('La validité de ce partenaire est finie : créez-le de nouveau avec une nouvelle date');
  const devs = admActs().filter(a => a.lic === p.id), already = devs.some(a => a.dev === dev);
  const f = App.admForce;
  if (!already && p.seats && devs.length >= p.seats && !(f && f.id === p.id && f.dev === dev)) {
    App.admForce = { id: p.id, dev, name: p.name, count: devs.length, seats: p.seats }; render(); return;
  }
  const c = await admSignCode(App.adminKey, p, dev);
  if (!already) admSet(ADM_ACT_STORE, JSON.stringify([{ lic: p.id, name: p.name, dev, date: c.date }].concat(admActs())));
  admKeep(App.adminKey);
  App.admForce = null; App.admPick = p.id; App.admLast = c; render(); paintQr(c.link);
  App.toast(`Code créé pour le téléphone ${dev}`);
};
ACT.admShare = async () => {
  const l = App.admLast; if (!l) return;
  const text = `Akiba AVEC — code de validation pour « ${l.name} » (téléphone ${l.dev}), valable jusqu'au ${l.exp}.\n\nSur CE téléphone : ouvrez ce lien, ou copiez le code et collez-le dans Akiba (« Code de validation reçu »).\n${l.link}\n\nIl ne fonctionne sur aucun autre téléphone.\nAssistance Ubora : ${UBORA.telShow}`;
  try { if (navigator.share) { await navigator.share({ title: 'Code de validation Akiba', text }); return; } } catch (e) { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
};
ACT.admCopy = async () => {
  const l = App.admLast; if (!l) return;
  try { await navigator.clipboard.writeText(l.code); App.toast('Code copié'); } catch (e) { App.toast('Copie impossible : utilisez « Envoyer »'); }
};
ACT.admLock = () => { App.adminKey = null; App.admLast = null; App.admForce = null; clearTimeout(App.adminTimer); render(); App.toast('Espace fermé'); };
ACT.admRemoveSheet = () => App.openSheet(`<h2>Retirer la clé de ce téléphone ?</h2>
  <p class="muted">La clé chiffrée et le registre des partenaires de ce téléphone seront effacés. Les codes déjà envoyés restent valables. Vous pourrez réinstaller la clé depuis l'ordinateur.</p>
  <button class="btn danger block xl" data-act="admRemove">Retirer la clé</button><button class="btn ghost block" data-act="closeSheet">Garder</button>`);
ACT.admRemove = () => { admSet(ADM_KEY_STORE, null); admSet(ADM_REG_STORE, null); admSet(ADM_ACT_STORE, null); App.adminKey = null; App.admLast = null; App.closeSheet(); App.toast('Clé retirée de ce téléphone'); };
