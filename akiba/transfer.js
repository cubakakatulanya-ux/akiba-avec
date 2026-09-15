/* Akiba AVEC — mettre une AVEC sur le téléphone du groupe (ou sur un nouveau téléphone), sans internet.
   Un fichier chiffré + un code de 8 signes donné de vive voix. Le fichier apporte aussi la licence du partenaire. */
'use strict';

const TRANSFER_KIND = 'kitabu-transfert';
const fmtXfer = c => String(c || '').replace(/^(.{4})(.{4})$/, '$1-$2');
const cleanXfer = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const whoName = () => { const s = K.session; if (!s) return ''; if (s.kind === 'avec') { const a = avecById(s.avecId); return (memberOf(a, s.memberId) || {}).name || ''; } return (userById(s.userId) || {}).name || ''; };
const readFileText = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsText(file); });
const canMove = avec => {
  const s = K.session;
  if (!s) return false;
  if (s.kind === 'avec') return s.avecId === avec.id && isBureau(memberOf(avec, s.memberId));
  const u = userById(s.userId);
  return !!u && (u.role === 'org' ? avec.orgId === u.orgId : avec.animId === u.id);
};

async function buildTransfer(avec, code) {
  const org = avec.orgId ? K.data.orgs.find(o => o.id === avec.orgId) || null : null;
  const ids = new Set([avec.animId].concat(avec.visits.map(v => v.by)).filter(Boolean));
  const users = K.data.users.filter(u => ids.has(u.id)).map(u => ({ id: u.id, role: u.role, orgId: u.orgId, name: u.name, zone: u.zone || '', phone: u.phone || '', pin: null, remote: true }));
  const copy = JSON.parse(JSON.stringify(avec)); copy.movedOut = null;
  const body = { kind: TRANSFER_KIND, v: 1, created: Date.now(), avec: copy, org, users, licence: licGet(), i18n: K.data.i18n || {}, langs: K.data.langs || [] };
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await backupKey(cleanXfer(code), salt), new TextEncoder().encode(JSON.stringify(body)));
  return JSON.stringify({ app: TRANSFER_KIND, format: 1, name: avec.name, created: body.created, salt: b64enc(salt), iv: b64enc(iv), data: b64enc(cipher) });
}

async function importTransfer(text, code) {
  let box;
  try { box = JSON.parse(text); } catch (e) { return { error: 'Ce fichier n\'est pas un fichier Akiba' }; }
  if (!box || box.app !== TRANSFER_KIND) return { error: box && box.app === 'kitabu-avec' ? 'C\'est une sauvegarde : utilisez « Restaurer sur ce téléphone »' : 'Ce fichier n\'est pas un transfert d\'AVEC' };
  let body;
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(box.iv) }, await backupKey(cleanXfer(code), b64dec(box.salt)), b64dec(box.data));
    body = JSON.parse(new TextDecoder().decode(plain));
  } catch (e) { return { error: 'Code de transfert faux, ou fichier abîmé' }; }
  const a = body.avec;
  if (!a || !Array.isArray(a.tx) || !verifyChain(a).ok) return { error: 'Le journal de cette AVEC est altéré : transfert refusé' };
  const existing = avecById(a.id);
  if (existing && !existing.movedOut && K.data.mode === 'prod') return { error: 'Cette AVEC est déjà active sur ce téléphone' };
  if (licenceRequired() && !(App.licence && App.licence.ok)) {
    const res = await verifyLicence(body.licence);
    if (!res.ok) return { error: 'Ce téléphone n\'a pas de licence, et le fichier n\'en apporte pas de valable. Demandez un lien d\'activation.' };
    licSet(body.licence); App.licence = res;
  }
  if (K.data.mode !== 'prod') wipeTo(emptyData());                    // on quitte la démonstration
  const old = avecById(a.id);
  if (old) K.data.avecs.splice(K.data.avecs.indexOf(old), 1);          // l'AVEC revient sur ce téléphone
  a.movedOut = null;
  secLog(a, 'AVEC reçue sur ce téléphone', null, 'fichier de transfert');
  K.data.avecs.push(a);
  if (body.org && !K.data.orgs.some(o => o.id === body.org.id)) K.data.orgs.push(body.org);
  (body.users || []).forEach(u => { if (!userById(u.id)) K.data.users.push(u); });
  K.data.i18n = Object.assign({}, body.i18n || {}, K.data.i18n || {});
  (body.langs || []).forEach(l => { K.data.langs = K.data.langs || []; if (!K.data.langs.some(x => x.id === l.id)) K.data.langs.push(l); });
  K.data.i18nV = (K.data.i18nV || 0) + 1;
  migrate(K.data);
  Object.keys(_chain).forEach(k => delete _chain[k]);
  DB.save();
  return { id: a.id, name: a.name };
}

/* ---------- envoyer ---------- */
function transferBlock(avec) {
  if (!canMove(avec)) return '';
  return avec.movedOut
    ? `<div class="alert good">${icSpan('sync')}<div><b>Sur le téléphone du groupe depuis le ${fdate(avec.movedOut)}</b><span class="small">Ce téléphone garde une copie. Les réunions se tiennent sur le téléphone du groupe.</span>
        <button class="btn sm ghost" style="margin-top:8px" data-act="transferSheet" data-id="${avec.id}">Renvoyer le fichier</button></div></div>`
    : `<div class="card stack"><div class="row" style="align-items:flex-start">${rowIc('sync')}<div><b>Mettre l'AVEC sur le téléphone du groupe</b><p class="small muted">Sans internet : un fichier à envoyer par WhatsApp, Bluetooth ou carte mémoire, et un code à dire de vive voix.</p></div></div>
        <button class="btn brand block" data-act="transferSheet" data-id="${avec.id}">${ic('sync')} Envoyer vers le téléphone du groupe</button></div>`;
}
ACT.transferSheet = d => {
  const avec = avecById(d.id);
  if (!avec || !canMove(avec)) return App.toast('Réservé au bureau, à l\'animateur ou à l\'organisation');
  App.openSheet(`<h2>Envoyer « ${esc(avec.name)} »</h2>
    <ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px">
      <li>Akiba crée un fichier protégé par un code.</li>
      <li>Envoyez le fichier au téléphone du groupe : WhatsApp, Bluetooth ou carte mémoire.</li>
      <li>Sur le téléphone du groupe : ouvrir Akiba › <b>Recevoir une AVEC</b>, choisir le fichier, taper le code.</li>
      <li>Les membres se connectent avec leur nom et leur code secret.</li></ol>
    <div class="alert warn">${icSpan('alert')}<div><b>Un seul téléphone tient le cahier</b><span class="small">Après l'envoi, ce téléphone ne peut plus ouvrir de réunion pour cette AVEC. Il garde une copie à consulter.</span></div></div>
    <button class="btn primary block xl" data-act="transferRun" data-id="${avec.id}">${ic('sync')} Créer le fichier</button>`);
};
ACT.transferRun = async d => {
  const avec = avecById(d.id);
  if (!avec || !canMove(avec)) return;
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le chiffrement. Mettez Chrome à jour.');
  if (openMeeting(avec)) return App.toast('Fermez d\'abord la réunion en cours');
  const code = randCode(8);
  const file = await buildTransfer(avec, code);
  avec.movedOut = Date.now();
  secLog(avec, 'AVEC envoyée vers un autre téléphone', null, whoName());
  DB.save();
  App.lastTransfer = { code, file };
  const fname = 'akiba-' + avec.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.akiba';
  let shared = false;
  try {
    const f = new File([file], fname, { type: 'application/octet-stream' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Akiba : ' + avec.name }); shared = true; }
  } catch (e) { /* partage annulé : on télécharge */ }
  if (!shared && window.URL && URL.createObjectURL) {
    const url = URL.createObjectURL(new Blob([file], { type: 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  App.openSheet(`<h2>Fichier prêt</h2>
    <p class="muted">${shared ? 'Choisissez le téléphone du groupe dans le partage.' : `Le fichier <b>${esc(fname)}</b> est dans « Téléchargements ». Envoyez-le au téléphone du groupe.`}</p>
    <div class="receipt" style="text-align:center"><span class="label">Code de transfert</span>${bigCode(fmtXfer(code))}</div>
    <p class="hint">Donnez ce code de vive voix ou par appel, jamais dans le même message que le fichier.</p>
    <button class="btn primary block xl" data-act="closeSheet">C'est noté</button>`);
};

/* ---------- recevoir ---------- */
ACT.receiveSheet = () => App.openSheet(`<h2>Recevoir une AVEC</h2>
  <p class="muted">Pour le téléphone du groupe. Vous avez reçu un fichier <b>.akiba</b> et un code de 8 signes (de l'animateur, de l'organisation ou de l'ancien téléphone).</p>
  <div class="field"><label for="rcF">Fichier reçu</label><input id="rcF" class="input" type="file" accept=".akiba,.kitabu,application/octet-stream,application/json"></div>
  <div class="field"><label for="rcC">Code de transfert</label><input id="rcC" class="input bignum" maxlength="9" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase" placeholder="ABCD-EFGH"></div>
  <button class="btn primary block xl" data-act="receiveRun">${ic('check')} Recevoir l'AVEC</button>`);
ACT.receiveRun = async () => {
  const f = document.getElementById('rcF');
  if (!f || !f.files || !f.files[0]) return App.toast('Choisissez le fichier reçu');
  if (cleanXfer(fval('rcC')).length !== 8) return App.toast('Le code de transfert a 8 signes');
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le déchiffrement. Mettez Chrome à jour.');
  let text;
  try { text = await readFileText(f.files[0]); } catch (e) { return App.toast('Impossible de lire ce fichier'); }
  const r = await importTransfer(text, fval('rcC'));
  if (r.error) return App.toast(r.error);
  rememberAvec(r.id);
  App.go('l.member', { id: r.id });
  App.toast(`« ${r.name} » est sur ce téléphone. Chaque membre touche son nom et tape son code.`);
};

/* ---------- ancien téléphone ---------- */
SCREENS['a.moved'] = () => {
  const { avec, me } = cur();
  return `<div class="shell">${aTop(avec, 'Copie à consulter')}<main class="main">
    <div class="alert warn">${icSpan('sync')}<div><b>Cette AVEC est sur un autre téléphone depuis le ${fdate(avec.movedOut)}</b><span class="small">Les réunions se tiennent sur le téléphone du groupe. Ici, vous pouvez consulter les membres, les crédits et le journal.</span></div></div>
    <div class="list">
      <button class="li" data-act="go" data-to="a.members">${rowIc('users')}<span class="grow"><b>Membres et carnets</b></span>${ic('chev')}</button>
      <button class="li" data-act="go" data-to="a.journal">${rowIc('book')}<span class="grow"><b>Journal</b></span>${ic('chev')}</button>
    </div>
    ${isBureau(me) ? `<div class="card stack"><b>Le téléphone du groupe est perdu ou cassé ?</b><p class="small muted">Recevez le dernier fichier de transfert ou une sauvegarde sur un nouveau téléphone. Pour reprendre l'AVEC sur celui-ci, deux membres du bureau doivent confirmer.</p>
      <button class="btn ghost block" data-act="moveBackSheet">Reprendre l'AVEC sur ce téléphone</button></div>` : ''}
  </main>${tabbar(A_TABS, 'a.home')}</div>`;
};
ACT.moveBackSheet = () => {
  const { avec, me } = cur();
  App.openSheet(`<h2>Reprendre l'AVEC ici</h2>
    <div class="alert bad">${icSpan('alert')}<div><b>Attention</b><span class="small">Les réunions tenues sur l'autre téléphone après le transfert ne seront pas ici. À faire seulement si l'autre téléphone ne sert plus.</span></div></div>
    ${approverFields(avec, me, 'mb')}
    <button class="btn danger block xl" data-act="moveBack">Reprendre l'AVEC sur ce téléphone</button>`);
};
ACT.moveBack = () => {
  const { avec, me } = cur();
  const ap = checkApprover(avec, 'mb', null); if (!ap) return;
  avec.movedOut = null;
  secLog(avec, 'AVEC reprise sur ce téléphone', null, `${me.name} et ${ap.name}`);
  DB.save(); App.go('a.home'); App.toast('L\'AVEC est de nouveau active sur ce téléphone');
};
