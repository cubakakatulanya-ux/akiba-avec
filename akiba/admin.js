/* Akiba AVEC — espace administrateur Ubora : partenaires et codes de validation, depuis le téléphone, sans réseau.
   Un code de validation est signé pour UN téléphone (son code) : il ne marche sur aucun autre.
   La clé secrète n'est jamais en clair dans le téléphone : elle reste chiffrée par le mot de passe de l'administrateur,
   n'est déchiffrée qu'en mémoire, et elle est oubliée dès qu'on quitte l'espace (ou après 10 minutes). */
'use strict';

const ADM_KEY_STORE = 'kitabu.adminkey', ADM_REG_STORE = 'kitabu.adminreg', ADM_ACT_STORE = 'kitabu.adminacts';
const APP_URL = 'https://akiba.uborardc.com/';
const b64uEnc = bytes => b64enc(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const admGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const admSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* rien */ } };
const admReg = () => { try { return JSON.parse(admGet(ADM_REG_STORE) || '[]'); } catch (e) { return []; } };
const admActs = () => { try { return JSON.parse(admGet(ADM_ACT_STORE) || '[]'); } catch (e) { return []; } };
// « 7Q2M-9XKD », « 7q2m9xkd », ou le message complet reçu du partenaire
// (un message collé dans un champ perd ses retours à la ligne : on cherche d'abord après « téléphone : »)
const devFrom = t => {
  const s = String(t || '').toUpperCase();
  const m = s.match(/T[ÉE]L[ÉE]PHONE\s*:\s*([A-Z0-9]{4}-?[A-Z0-9]{4})/)        // le message reçu du partenaire
    || s.match(/(?:^|[^A-Z0-9])([A-Z0-9]{4}-[A-Z0-9]{4})(?![A-Z0-9])/)          // avec tiret, n'importe où
    || s.match(/(?:^|[^A-Z0-9])([A-Z0-9]{8})(?![A-Z0-9])/)                      // sans tiret, comme il s'affiche
    || s.replace(/[\s-]+/g, '').match(/^([A-Z0-9]{8})$/);
  return m ? m[1].replace(/-/g, '').replace(/^(.{4})/, '$1-') : '';
};

/* ---------- la demande d'un partenaire, lue dans l'espace admin ----------
   Akiba n'a pas de serveur : une demande voyage par WhatsApp, par SMS ou par QR code.
   Plutôt que de laisser l'administrateur recopier six lignes à la main — et se tromper
   sur le code du téléphone —, il colle le message reçu et Akiba en tire la fiche.
   Les demandes lues restent sur l'appareil : on ne perd pas une demande traitée plus tard. */
const ADM_DEM_STORE = 'kitabu.admindemandes';
const admDems = () => { try { return JSON.parse(admGet(ADM_DEM_STORE) || '[]'); } catch (e) { return []; } };
function demandeLire(texte) {
  const t = String(texte || '').replace(/\r/g, '\n').trim();
  if (!t) return null;
  const apres = (motif, interdit) => {
    const re = new RegExp((interdit ? '(?<!' + interdit + ')' : '') + motif + '\\s*:\\s*([^\\n]*)', 'i');
    let m = null;
    try { m = t.match(re); } catch (e) { m = t.match(new RegExp(motif + '\\s*:\\s*([^\\n]*)', 'i')); }
    if (!m) return '';
    /* un message collé dans un champ d'une seule ligne perd ses retours : on s'arrête à l'étiquette suivante */
    return m[1].split(/\s(?=(?:Organisation|Zone|Responsable|T[ée]l[ée]phone|Courriel|Code du t[ée]l[ée]phone)\s*:)/i)[0].trim().replace(/[·;,]+$/, '').trim();
  };
  const d = {
    name: apres('Organisation'),
    zoneTexte: apres('Zone'),
    boss: apres('Responsable'),
    phone: apres('T[ée]l[ée]phone', 'Code du '),
    mail: apres('Courriel'),
    dev: devFrom(t),
    lu: Date.now(),
  };
  return (d.name || d.dev) ? d : null;
}

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

/* ce que contient ce téléphone : réservé à l'administrateur */
function admStats() {
  const avecs = K.data.avecs.filter(x => x.status !== 'refused');
  let membres = 0, epargne = 0, reunions = 0, credits = 0;
  for (const x of avecs) {
    try {
      const st = stats(x);
      membres += st.activeCount; epargne += st.sum.EPARGNE; reunions += st.meetings.length; credits += st.outstanding;
    } catch (e) { /* une AVEC illisible ne doit pas vider l'écran */ }
  }
  const k = (v, l) => `<div class="kpi"><span>${l}</span><b>${v}</b></div>`;
  return `<div class="kpis">${k(avecs.length, 'AVEC sur ce téléphone')}${k(membres, 'Membres')}${k(fck(epargne), 'Épargne du cycle')}${k(fck(credits), 'Crédits à rembourser')}${k(reunions, 'Réunions tenues')}</div>`;
}
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
    <!-- le circuit complet, qui n'était écrit nulle part : sans lui, on ne devine pas d'où vient le code du téléphone -->
    <details class="g cartepas"${last ? '' : ' open'}><summary><b>Donner une licence à une AVEC autonome ou à une organisation</b></summary>
      <ol class="pas3">
        <li><b>Le groupe fait sa demande.</b> Sur son téléphone, Akiba affiche l'écran de validation avec le <b>code du téléphone</b> (quatre lettres, un tiret, quatre lettres). Le bouton <b>Demander par WhatsApp</b> vous envoie ce code tout prêt.</li>
        <li><b>Vous créez le code ici.</b> Collez le message reçu dans « Code du téléphone » ci-dessous — le code s'y retrouve tout seul. Choisissez le partenaire, ou ajoutez-en un nouveau : type <b>AVEC autonome</b> pour un groupe qui se gère seul, <b>Organisation partenaire</b> pour une ONG qui suit plusieurs groupes.</li>
        <li><b>Vous renvoyez le code.</b> « Envoyer » ouvre WhatsApp avec le lien ; « Copier le code » sert si vous préférez le SMS. En face à face, faites plutôt scanner le QR code. Le groupe touche le lien et l'application se valide.</li>
      </ol>
      <p class="hint">Un code ne vaut que pour le téléphone qui l'a demandé : recopié ailleurs, il est refusé. Pour un deuxième téléphone du même groupe, refaites l'opération avec son code à lui.</p>
    </details>
    <!-- ces chiffres sont ceux des AVEC présentes sur l'appareil : en démonstration, ce sont des groupes fictifs -->
    <section class="card stack">
      <div class="row between"><h2 class="surtitre" style="margin:0">Ce que contient ce téléphone</h2>
        ${K.data.mode === 'prod' ? '<span class="chip good">Vraies données</span>' : '<span class="chip warn">Démonstration</span>'}</div>
      ${K.data.mode === 'prod' ? '' : '<p class="hint" style="margin:0">Groupes, membres et montants fictifs, livrés pour la formation. Les licences et les codes que vous créez ici, eux, sont bien réels.</p>'}
      ${admStats()}
    </section>
    ${last ? `<section class="card stack"><h2>Code de validation prêt</h2>
      ${row('Partenaire', esc(last.name))}${row('Type', LIC_KINDS[last.kind])}${row('Téléphone', `<span class="mono">${esc(devNu(last.dev))}</span>`)}${row('Valable jusqu\'au', fdateY(new Date(last.exp + 'T12:00').getTime()))}
      ${last.court ? `<!-- le code à dicter : huit signes, comme le code du téléphone -->
      <div style="text-align:center;padding-top:4px"><span class="label">À dicter au téléphone</span>${bigCode(esc(last.court))}
        <p class="hint" style="margin:6px 0 0">Huit signes, pour le téléphone <b class="mono">${esc(devNu(last.dev))}</b> seulement, valable ${last.courtAns} an${last.courtAns > 1 ? 's' : ''}.
          Le partenaire le tape dans « Code de validation reçu ».</p>
        <div class="grid2" style="margin-top:8px"><button class="btn brand" data-act="admCourtCopier">${ic('clip')} Copier</button><button class="btn ghost" data-act="admCourtDire">${ic('chat')} Envoyer par SMS</button></div></div>
      <details class="g"><summary>Code long signé (QR, WhatsApp, collage)</summary>
        <p class="small muted" style="margin:0">Plus sûr que le code court : il porte une signature qu'on ne peut pas imiter. À préférer dès qu'on peut envoyer un message ou montrer un QR.</p>` : ''}
      <div class="formula mono" style="word-break:break-all;max-height:88px;overflow:auto">${esc(last.code)}</div>
      <div style="text-align:center"><img id="admQr" alt="QR code de validation" hidden style="width:220px;max-width:100%;border-radius:12px;background:#fff;padding:6px"><p id="admQrNote" class="hint" hidden>QR code indisponible : partagez le code.</p></div>
      <div class="grid2"><button class="btn brand" data-act="admShare">${ic('chat')} Envoyer</button><button class="btn ghost" data-act="admCopy">Copier le code</button></div>
      ${last.court ? '</details>' : ''}
      <p class="hint">Les deux codes ne fonctionnent que sur le téléphone <b class="mono">${esc(devNu(last.dev))}</b>. Sur un autre téléphone, ils sont refusés.</p>
    </section>` : ''}
    <!-- la demande arrive par WhatsApp, par SMS ou en QR : on la colle, Akiba en fait une fiche -->
    <section class="card stack"><h2>Demande d'un partenaire</h2>
      <p class="small muted">Collez le message reçu du partenaire. Akiba en tire le nom, la zone, le responsable et le code du téléphone, et remplit les formulaires ci-dessous.</p>
      <div class="field"><label for="admD">Message reçu</label><textarea id="admD" class="input" rows="3" autocomplete="off" spellcheck="false" placeholder="Collez ici le message WhatsApp du partenaire"></textarea></div>
      <div class="${carteScanDispo() ? 'grid2' : ''}"><button class="btn brand block" data-act="admDemLire">${ic('clip')} Lire la demande</button>
        ${carteScanDispo() ? `<button class="btn ghost block" data-act="admDemScan">${ic('eye')} Scanner le QR</button>` : ''}</div>
      ${App.admDem ? (d => `<div class="receipt stack" style="gap:4px">
        <div class="row between"><span class="label">Demande lue</span><span class="small muted">${fdt(d.lu)}</span></div>
        ${row('Organisation', esc(d.name) || '<span class="muted">—</span>')}
        ${d.zoneTexte ? row('Zone', esc(d.zoneTexte)) : ''}
        ${d.boss ? row('Responsable', esc(d.boss)) : ''}
        ${d.phone ? row('Téléphone', `<a href="tel:${esc(d.phone.replace(/\s/g, ''))}">${esc(d.phone)}</a>`) : ''}
        ${d.mail ? row('Courriel', esc(d.mail)) : ''}
        ${row('Code du téléphone', d.dev ? `<span class="mono">${esc(d.dev)}</span>` : '<span class="chip bad">introuvable</span>')}
      </div>
      ${d.dev ? '' : `<div class="alert warn">${icSpan('alert')}<div><b>Pas de code de téléphone dans ce message</b><span class="small">Demandez-le au partenaire : il le lit en haut de l'écran « Ouvrir le compte de mon organisation ».</span></div></div>`}
      <button class="btn primary block xl" data-act="admDemRemplir">${ic('check')} Remplir avec cette demande</button>`)(App.admDem) : ''}
      ${admDems().length ? `<details class="g"><summary>Demandes déjà lues sur cet appareil (${admDems().length})</summary>
        <div class="list">${admDems().slice(0, 12).map((d, i) => `<button class="li" data-act="admDemReprendre" data-i="${i}"><span class="grow"><b>${esc(d.name || '(sans nom)')}</b><span class="small muted">${esc(d.boss || '')}${d.dev ? ' · ' : ''}<span class="mono">${esc(d.dev || '')}</span> · ${ago(d.lu)}</span></span>${ic('chev')}</button>`).join('')}</div>
      </details>` : ''}
    </section>
    <section class="card stack"><h2>Créer un code de validation</h2>
      ${reg.length ? `
      <div class="field"><label for="admT">Code du téléphone</label><input id="admT" class="input mono" autocomplete="off" autocapitalize="characters" placeholder="Ex. 7Q2M9XKD, ou collez le message reçu" value="${esc(f ? f.dev : '')}"></div>
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
/* lire une demande : à la main, ou avec l'appareil photo si le partenaire montre son QR */
ACT.admDemLire = () => {
  const d = demandeLire(fval('admD'));
  if (!d) return App.toast('Ce message ne ressemble pas à une demande Akiba');
  admDemGarder(d);
};
function admDemGarder(d) {
  App.admDem = d;
  const liste = admDems().filter(x => !(x.dev && x.dev === d.dev) && !(x.name && x.name === d.name));
  admSet(ADM_DEM_STORE, JSON.stringify([d].concat(liste).slice(0, 30)));
  render();
  App.toast('Demande lue : ' + (d.name || d.dev));
}
ACT.admDemReprendre = x => { App.admDem = admDems()[+x.i]; render(); };
ACT.admDemScan = async () => {
  if (!carteScanDispo()) return App.toast('Cet appareil ne lit pas les QR codes');
  App.openSheet(`<h2>Scanner la demande</h2>
    <p class="muted">Le partenaire montre le QR de sa demande, à l'écran de son téléphone. Tout se lit ici, sans réseau.</p>
    <div class="scanbox"><video id="demVid" playsinline muted></video></div>
    <button class="btn ghost block" data-act="admDemScanStop">Fermer</button>`);
  setTimeout(async () => {
    const v = document.getElementById('demVid');
    if (!v) return;
    try {
      App.demFlux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      v.srcObject = App.demFlux; await v.play();
      const det = new window.BarcodeDetector({ formats: ['qr_code'] });
      App.demBoucle = setInterval(async () => {
        try {
          const codes = await det.detect(v);
          if (!codes || !codes.length) return;
          const d = demandeLire(codes[0].rawValue);
          ACT.admDemScanStop();
          if (!d) return App.toast('Ce QR ne contient pas une demande Akiba');
          admDemGarder(d);
        } catch (e) { /* une image illisible n'arrête pas la lecture */ }
      }, 350);
    } catch (e) {
      const b = document.querySelector('.scanbox');
      if (b) b.innerHTML = '<p class="hint" style="padding:12px">Appareil photo indisponible : collez le message à la place.</p>';
    }
  }, 60);
};
ACT.admDemScanStop = () => {
  clearInterval(App.demBoucle); App.demBoucle = null;
  if (App.demFlux) { App.demFlux.getTracks().forEach(t => t.stop()); App.demFlux = null; }
  App.closeSheet();
};
/* la fiche remplit les deux formulaires : le nom pour le partenaire, le code pour la validation */
ACT.admDemRemplir = () => {
  const d = App.admDem;
  if (!d) return;
  const met = (id, v) => { const e = document.getElementById(id); if (e && v) e.value = v; };
  met('admN', d.name);
  met('admT', d.dev);
  const k = document.getElementById('admK'); if (k) k.value = 'org';
  const cible = document.getElementById(admReg().length ? 'admT' : 'admN');
  if (cible) { cible.scrollIntoView({ behavior: 'smooth', block: 'center' }); cible.focus({ preventScroll: true }); }
  App.toast(admReg().length ? 'Formulaires remplis : vérifiez, puis créez' : 'Nom rempli : ajoutez le partenaire, puis créez son code');
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
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(dev)) return App.toast('Tapez le code du téléphone (8 signes, ex. 7Q2M9XKD)');
  if (!p) return App.toast('Choisissez le partenaire');
  if (new Date(p.exp + 'T23:59:59') <= new Date()) return App.toast('La validité de ce partenaire est finie : créez-le de nouveau avec une nouvelle date');
  const devs = admActs().filter(a => a.lic === p.id), already = devs.some(a => a.dev === dev);
  const f = App.admForce;
  if (!already && p.seats && devs.length >= p.seats && !(f && f.id === p.id && f.dev === dev)) {
    App.admForce = { id: p.id, dev, name: p.name, count: devs.length, seats: p.seats }; render(); return;
  }
  const c = await admSignCode(App.adminKey, p, dev);
  /* le code court, à dicter : il vaut jusqu'à la fin de validité du partenaire, arrondie en années */
  const ans = Math.max(1, Math.min(8, Math.ceil((new Date(p.exp + 'T23:59:59') - Date.now()) / (365.25 * 24 * 3600e3))));
  c.court = await ccFaire(dev, p.kind, ans);
  c.courtAns = ans;
  if (!already) admSet(ADM_ACT_STORE, JSON.stringify([{ lic: p.id, name: p.name, dev, date: c.date }].concat(admActs())));
  admKeep(App.adminKey);
  App.admForce = null; App.admPick = p.id; App.admLast = c; render(); paintQr(c.link);
  App.toast(`Code créé pour le téléphone ${devNu(dev)}`);
};
ACT.admCourtCopier = async () => {
  const l = App.admLast; if (!l || !l.court) return;
  try { await navigator.clipboard.writeText(l.court); App.toast('Code court copié : ' + l.court); }
  catch (e) { App.toast('Copie impossible : dictez le code ' + l.court); }
};
ACT.admCourtDire = () => {
  const l = App.admLast; if (!l || !l.court) return;
  const t = `Akiba — code de validation pour « ${l.name} » : ${l.court}\nIl ne vaut que pour le téléphone ${devNu(l.dev)}.\nTapez-le dans Akiba, à « Code de validation reçu ».\nUbora ${UBORA.telShow}`;
  window.open('sms:?body=' + encodeURIComponent(t), '_blank', 'noopener');
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
