/* Akiba AVEC — validation des AVEC par l'organisation et plan B pour les codes perdus.
   Tout marche sans internet : les codes se transmettent par un simple appel téléphonique. */
'use strict';

const fmtReq = c => String(c || '').replace(/^(.{3})(.{3})$/, '$1-$2');
const icSpan = n => `<span style="width:22px;flex:none">${ic(n)}</span>`;
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
function secLog(avec, type, memberId, via) { (avec.security = avec.security || []).push({ ts: Date.now(), type, memberId: memberId || null, via: via || '' }); }
function rescueCode() {
  const r = new Uint32Array(2);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else { r[0] = Math.random() * 1e9; r[1] = Math.random() * 1e9; }
  return String(r[0] % 1e4).padStart(4, '0') + '-' + String(r[1] % 1e4).padStart(4, '0');
}
const bigCode = txt => `<div class="num" style="font-family:var(--f-display);font-size:2.4rem;letter-spacing:.1em;line-height:1.1">${txt}</div>`;
const pinFields = p => `<div class="grid2"><div class="field"><label for="${p}N">Nouveau code</label><input id="${p}N" class="input num bignum" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div>
  <div class="field"><label for="${p}C">Encore une fois</label><input id="${p}C" class="input num bignum" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>`;
function readNewPin(p) {
  const n = fval(p + 'N') || '', c = fval(p + 'C') || '';
  if (!/^\d{4}$/.test(n)) { App.toast('Le nouveau code doit avoir 4 chiffres'); return null; }
  if (WEAK_PINS.includes(n)) { App.toast('Ce code est trop facile à deviner'); return null; }
  if (n !== c) { App.toast('Les deux nouveaux codes sont différents'); return null; }
  return n;
}
function rescueCardHtml(avec, codes) {
  return `<div class="receipt stack"><div class="row between"><span class="label">Carte de secours</span><span class="small muted">${esc(avec.name)}</span></div>
    <div class="grid2">${codes.map((c, i) => `<div class="mono" style="font-size:1.05rem">${i + 1}. ${c}</div>`).join('')}</div>
    <p class="small muted">Chaque code sert une seule fois. Recopiez la carte sur papier et gardez-la dans la caisse fermée à clé.</p></div>`;
}

/* ---------- AVEC en attente (téléphone du groupe) ---------- */
SCREENS['a.pending'] = () => {
  const { avec } = cur();
  const org = orgOf(avec.orgId) || { name: 'l\'organisation' };
  const anim = avec.animId ? userById(avec.animId) : null;
  const refused = avec.status === 'refused';
  return `<div class="shell">${aTop(avec, esc(avec.village) + ' · pas encore active')}<main class="main">
    ${refused ? `<div class="alert bad">${icSpan('alert')}<div><b>L'organisation n'a pas validé ce groupe</b><span class="small">${esc(avec.refusedReason || 'Aucune raison donnée')}. Voyez avec ${esc(anim ? anim.name : 'l\'animateur')} ce qu'il faut corriger.</span></div></div>`
      : `<div class="alert warn">${icSpan('clip')}<div><b>En attente de validation</b><span class="small">${esc(org.name)} doit valider le groupe avant la première réunion. En attendant, distribuez les codes secrets et relisez le règlement.</span></div></div>`}
    <section class="card stack" style="text-align:center"><span class="label">Code de demande</span>${bigCode(fmtReq(avec.requestCode))}<p class="small muted">À dire à l'organisation</p></section>
    <h2>Deux façons de valider</h2>
    <div class="card stack">
      <div class="row" style="align-items:flex-start">${rowIc('cloud')}<div><b>Avec réseau</b><p class="small muted">Touchez « Envoyer maintenant ». L'organisation voit le groupe dans son tableau de bord et le valide. Le groupe devient actif au prochain envoi.</p></div></div>
      <button class="btn ghost block" data-act="syncSheet">${ic('sync')} Envoyer maintenant</button>
    </div>
    <div class="card stack">
      <div class="row" style="align-items:flex-start">${rowIc('key')}<div><b>Sans réseau : un simple appel</b><p class="small muted">Appelez l'organisation et donnez le nom du groupe et le code de demande. Elle vous dicte un code d'activation de 8 chiffres.</p></div></div>
      <div class="field"><label for="actC">Code d'activation</label><input id="actC" class="input bignum num" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="0000 0000"></div>
      <button class="btn primary block xl" data-act="activate">${ic('check')} Activer l'AVEC</button>
    </div>
  </main>${tabbar(A_TABS, 'a.home')}</div>`;
};
ACT.activate = () => {
  const { avec } = cur();
  if ((avec.actLockUntil || 0) > Date.now()) return App.toast('Trop d\'essais. Réessayez dans 10 minutes.');
  const code = (fval('actC') || '').replace(/\D/g, '');
  if (code.length !== 8) return App.toast('Le code d\'activation a 8 chiffres');
  if (code !== signCode('ACT', avec.orgId, avec.requestCode)) {
    avec.actFails = (avec.actFails || 0) + 1;
    if (avec.actFails >= 5) { avec.actLockUntil = Date.now() + 10 * 60e3; avec.actFails = 0; }
    DB.save();
    return App.toast('Code d\'activation faux. Vérifiez chaque chiffre avec l\'organisation.');
  }
  Object.assign(avec, { status: 'active', validatedAt: Date.now(), validatedBy: 'code', actFails: 0 });
  secLog(avec, 'AVEC activée', null, 'code d\'activation par téléphone');
  DB.save(); App.go('a.home'); App.toast('AVEC activée. Vous pouvez ouvrir la première réunion.');
};

/* ---------- organisation : valider ---------- */
const pendingOf = u => K.data.avecs.filter(a => a.orgId === u.orgId && a.status === 'pending');
function pendingBlock(u) {
  const list = pendingOf(u);
  return `<h2>AVEC à valider</h2>
    ${list.length ? `<div class="list">${list.map(a => `<button class="li" data-act="go" data-to="o.review" data-id="${a.id}">${rowIc('clip')}<span class="grow"><b>${esc(a.name)}</b><span class="small muted">${esc(a.village)} · ${a.members.length} membres · ${esc(userById(a.animId)?.name || '—')} · ${ago(a.submittedAt || a.createdAt)}</span></span><span class="chip warn">À valider</span></button>`).join('')}</div>`
      : '<div class="card small muted">Aucune AVEC en attente.</div>'}
    <div class="grid2"><button class="btn ghost" data-act="phoneActSheet">${ic('key')} Valider par téléphone</button><button class="btn ghost" data-act="unlockSheet">${ic('lock')} Débloquer un membre</button></div>`;
}
function statusBanner(avec, u) {
  if (isActive(avec)) return '';
  if (avec.status === 'pending') return `<div class="alert warn">${icSpan('clip')}<div><b>En attente de validation par l'organisation</b><span class="small">Code de demande ${fmtReq(avec.requestCode)}. Le groupe ne peut pas encore tenir de réunion.</span>
    ${u.role === 'org' ? `<button class="btn sm brand" style="margin-top:8px" data-act="go" data-to="o.review" data-id="${avec.id}">Examiner et valider</button>` : ''}</div></div>`;
  return `<div class="alert bad">${icSpan('alert')}<div><b>Refusée par l'organisation</b><span class="small">${esc(avec.refusedReason || '')}</span>
    ${u.role === 'anim' ? `<button class="btn sm brand" style="margin-top:8px" data-act="resubmit" data-id="${avec.id}">C'est corrigé : renvoyer</button>` : ''}</div></div>`;
}
function reviewChecks(avec) {
  const s = avec.settings, m = avec.members.filter(x => !x.left), c = [];
  const add = (good, text) => c.push({ good, text });
  const women = m.filter(x => x.sex === 'F').length;
  const t = m.find(x => x.role === 'tresorier');
  const phones = m.filter(x => x.phone && x.phone !== '—').length;
  add(m.length >= 10 && m.length <= 30, `${m.length} membres (conseillé : 10 à 30)`);
  add(women * 2 >= m.length, `${women} femmes sur ${m.length}`);
  add(['president', 'secretaire', 'tresorier'].every(r => m.some(x => x.role === r)), 'Bureau complet : président, secrétaire, trésorier');
  add(m.filter(x => x.key).length === 3 && t && !t.key, '3 porte-clés, et le trésorier ne garde pas de clé');
  add(s.rate <= 10, `Intérêt de ${s.rate} % par mois`);
  add(s.maxMult <= 3, `Crédit jusqu'à ${s.maxMult} × l'épargne`);
  add(phones >= 3, `${phones} membres ont un téléphone`);
  return c;
}
SCREENS['o.review'] = p => {
  const u = me_user();
  const avec = avecById(p.id);
  if (!avec || u.role !== 'org' || avec.orgId !== u.orgId) return SCREENS[homeScreen()]({});
  const s = avec.settings, st = stats(avec);
  const names = list => list.map(x => esc(x.name)).join(', ') || '—';
  const by = r => names(avec.members.filter(x => x.role === r));
  const line = (k, v) => `<div class="li"><span class="grow muted">${k}</span><b style="text-align:right">${v}</b></div>`;
  return `<div class="shell">${topbar('Valider une AVEC', esc(avec.name), backBtn('o.home'))}<main class="main">
    ${avec.status === 'active' ? '<div class="alert good"><div><b>Cette AVEC est déjà validée</b></div></div>' : avec.status === 'refused' ? `<div class="alert bad"><div><b>Refusée</b><span class="small">${esc(avec.refusedReason || '')}</span></div></div>` : ''}
    <div><h1>${esc(avec.name)}</h1><p class="muted">${placeShort(avec)}${avec.groupement ? ' · groupement ' + esc(avec.groupement) : ''}${avec.secteur ? ' · ' + esc(avec.secteur) : ''} · créée par ${esc(userById(avec.animId)?.name || '—')} ${ago(avec.submittedAt || avec.createdAt)} · code de demande ${fmtReq(avec.requestCode)}</p></div>
    <section class="section"><h2>Contrôles automatiques</h2><div class="list">${reviewChecks(avec).map(c => `<div class="li"><span style="width:22px;flex:none;color:${c.good ? 'var(--good)' : 'var(--warn)'}">${ic(c.good ? 'check' : 'alert')}</span><span class="grow">${c.text}</span>${c.good ? '' : '<span class="chip warn">à vérifier</span>'}</div>`).join('')}</div></section>
    <section class="section"><h2>Règlement</h2><div class="list">
      ${line('Réunions', `${esc(s.meetingDay || '—')}, ${(s.frequency || 7) === 14 ? 'toutes les 2 semaines' : 'chaque semaine'}`)}
      ${line('Part', `${fc(s.partValue)} · 1 à ${s.maxParts} par réunion`)}
      ${line('Caisse sociale', s.socialFee ? fc(s.socialFee) : 'aucune')}
      ${line('Crédit', `${s.rate} %/mois · ${s.maxMult} × l'épargne · ${s.maxMonths} mois max`)}
      ${line('Amendes', `absence ${fc(s.fineAbsent)} · retard ${fc(s.fineLate)}`)}
      ${line('Cycle 1', `${fdate(avec.cycle.start)} → ${fdate(avec.cycle.end)}`)}
    </div></section>
    <section class="section"><h2>Bureau</h2><div class="list">
      ${line('Président(e)', by('president'))}${line('Secrétaire', by('secretaire'))}${line('Trésorier(ère)', by('tresorier'))}${line('Compteurs', by('compteur'))}${line('Porte-clés', names(avec.members.filter(x => x.key)))}
    </div></section>
    ${avec.meetings.length ? `<div class="alert ${st.ecarts.length ? 'bad' : 'warn'}">${icSpan('book')}<div><b>Cahier repris</b><span class="small">Épargne ${fc(st.sum.EPARGNE)} · crédits ${fc(st.outstanding)} · caisse ${fc(st.cash)}${st.ecarts.length ? ` · il manquait ${fc(st.ecarts[0].closeExpected - st.ecarts[0].closeCount)} à la reprise` : ''}</span></div></div>` : ''}
    ${profileHtml(avec)}
    <section class="section"><h2>Membres</h2><div class="list">${avec.members.map(x => `<div class="li">${avatar(x)}<span class="grow"><b>${esc(x.name)}</b><span class="small muted">${roleLabel(x)} · ${memberBrief(x)}</span></span></div>`).join('')}</div></section>
    ${avec.status === 'pending' ? `<div class="sticky-foot" style="bottom:16px"><button class="btn danger" data-act="refuseSheet" data-id="${avec.id}">Refuser</button><button class="btn primary xl" style="flex:1" data-act="approve" data-id="${avec.id}">${ic('check')} Valider l'AVEC</button></div>` : ''}
  </main></div>`;
};
ACT.approve = d => {
  const u = me_user(), avec = avecById(d.id);
  askPin(u, 'Valider ' + avec.name, () => {
    Object.assign(avec, { status: 'active', validatedAt: Date.now(), validatedBy: u.id });
    secLog(avec, 'AVEC validée', null, u.name);
    DB.save(); App.go('o.home'); App.toast(`${avec.name} est validée. Elle deviendra active sur le téléphone du groupe au prochain envoi, ou avec le code d'activation.`);
  });
};
ACT.refuseSheet = d => App.openSheet(`<h2>Refuser l'AVEC</h2><p class="muted">L'animateur verra la raison et pourra corriger puis renvoyer.</p>
  <div class="field"><label for="rfN">Ce qu'il faut corriger</label><textarea id="rfN" class="input" rows="3" placeholder="Ex. le trésorier est aussi porte-clé, il manque des numéros de téléphone"></textarea></div>
  <button class="btn danger block xl" data-act="refuse" data-id="${d.id}">Refuser et prévenir l'animateur</button>`);
ACT.refuse = d => {
  const u = me_user(), avec = avecById(d.id), why = (fval('rfN') || '').trim();
  if (why.length < 5) return App.toast('Expliquez ce qu\'il faut corriger');
  Object.assign(avec, { status: 'refused', refusedReason: why, refusedBy: u.id, refusedAt: Date.now() });
  secLog(avec, 'AVEC refusée', null, u.name);
  DB.save(); App.go('o.home'); App.toast('Refus enregistré');
};
ACT.resubmit = d => {
  const avec = avecById(d.id);
  Object.assign(avec, { status: 'pending', submittedAt: Date.now() });
  secLog(avec, 'AVEC renvoyée pour validation', null, me_user().name);
  DB.save(); render(); App.toast('Renvoyée à l\'organisation');
};
ACT.phoneActSheet = () => App.openSheet(`<h2>Valider par téléphone</h2>
  <p class="muted">L'animateur ou le président vous appelle. Vérifiez le nom du groupe, le village et le bureau, puis entrez le code de demande qu'il lit sur son téléphone.</p>
  <div class="field"><label for="paR">Code de demande (6 signes)</label><input id="paR" class="input bignum" maxlength="7" autocomplete="off" style="text-transform:uppercase" placeholder="ABC-123"></div>
  <button class="btn primary block xl" data-act="phoneAct">Obtenir le code d'activation</button><div id="paOut" aria-live="polite"></div>`);
ACT.phoneAct = () => {
  const u = me_user();
  const req = (fval('paR') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (req.length !== 6) return App.toast('Le code de demande a 6 lettres ou chiffres');
  const a = K.data.avecs.find(x => x.requestCode === req);
  if (a && a.orgId !== u.orgId) return App.toast('Ce code ne concerne pas votre organisation');
  if (a) { secLog(a, 'code d\'activation donné', null, u.name); if (a.status === 'pending') Object.assign(a, { validatedBy: u.id }); DB.save(); }
  document.getElementById('paOut').innerHTML = `<div class="receipt stack" style="text-align:center"><span class="label">${a ? esc(a.name) + ' · ' + esc(a.village) : 'Groupe pas encore reçu : vérifiez bien le nom'}</span>
    ${bigCode(fmtCode(signCode('ACT', u.orgId, req)))}<p class="small muted">Dictez ce code chiffre par chiffre. Il ne marche que pour ce groupe.</p></div>`;
};
ACT.unlockSheet = () => App.openSheet(`<h2>Débloquer un membre</h2>
  <p class="muted">Un membre a perdu son code et vous appelle. Vérifiez que c'est bien lui : nom, groupe, une question sur son épargne. Puis entrez le code de déblocage affiché sur son téléphone.</p>
  <div class="field"><label for="ubR">Code affiché sur son téléphone (6 signes)</label><input id="ubR" class="input bignum" maxlength="7" autocomplete="off" style="text-transform:uppercase" placeholder="ABC-123"></div>
  <button class="btn primary block xl" data-act="unlockCalc">Obtenir le code de déblocage</button><div id="ubOut" aria-live="polite"></div>`);
ACT.unlockCalc = () => {
  const u = me_user();
  const req = (fval('ubR') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (req.length !== 6) return App.toast('Le code a 6 lettres ou chiffres');
  const a = K.data.avecs.find(x => x.unlockReq && x.unlockReq.code === req);
  if (a && a.orgId !== u.orgId) return App.toast('Ce code ne concerne pas votre organisation');
  const who = a ? memberOf(a, a.unlockReq.memberId) : null;
  if (a) { secLog(a, 'code de déblocage donné', a.unlockReq.memberId, u.name); DB.save(); }
  document.getElementById('ubOut').innerHTML = `<div class="receipt stack" style="text-align:center"><span class="label">${who ? esc(who.name) + ' · ' + esc(a.name) : 'Demande pas encore reçue : vérifiez l\'identité par téléphone'}</span>
    ${bigCode(fmtCode(signCode('UNLOCK', u.orgId, req)))}<p class="small muted">Dictez ce code. Il sert une seule fois, pendant 48 heures.</p></div>`;
};

/* ---------- plan B : code secret perdu (écran de connexion, sans internet) ---------- */
function lostLocked(a) { if ((a.lostLockUntil || 0) > Date.now()) { App.toast('Trop d\'essais. Réessayez dans 10 minutes.'); return true; } return false; }
function lostFail(a, msg) { a.lostFails = (a.lostFails || 0) + 1; if (a.lostFails >= 5) { a.lostLockUntil = Date.now() + 10 * 60e3; a.lostFails = 0; } DB.save(); App.toast(msg); }
function finishReset(a, m, pin, via) {
  m.pin = pin; a.lostFails = 0;
  if (a.unlockReq && a.unlockReq.memberId === m.id) a.unlockReq = null;
  secLog(a, 'nouveau code secret', m.id, via);
  DB.save(); App.go('l.member', { id: a.id });
  App.toast(`Nouveau code enregistré pour ${m.name.split(' ')[0]}. Connectez-vous.`);
}
SCREENS['l.lost'] = p => {
  const a = avecById(p.avec);
  if (!a) return SCREENS['l.avec']();
  const m = p.mid ? memberOf(a, p.mid) : null;
  if (!m) return `<div class="shell">${topbar('Code perdu', esc(a.name), backBtn('l.member', `data-id="${a.id}"`))}<main class="main">
    <div><h2>Qui a perdu son code ?</h2><p class="muted">Touchez votre nom.</p></div>
    <div class="list">${activeM(a).map(x => `<button class="li" data-act="go" data-to="l.lost" data-avec="${a.id}" data-mid="${x.id}">${avatar(x)}<span class="grow"><b>${esc(x.name)}</b><span class="small muted">${roleLabel(x)}</span></span>${ic('chev')}</button>`).join('')}</div></main></div>`;
  const others = activeM(a).filter(x => isBureau(x) && x.id !== m.id).length;
  const left = (a.rescue || []).filter(r => !r.used).length;
  const opt = (act, icon, title, sub, off) => `<button class="who" data-act="${act}" data-avec="${a.id}" data-mid="${m.id}" ${off ? 'disabled style="opacity:.5"' : ''}><span class="ic" style="background:var(--brand-soft);color:var(--brand)">${ic(icon)}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  return `<div class="shell">${topbar('Code perdu', esc(m.name), backBtn('l.lost', `data-avec="${a.id}"`))}<main class="main">
    <div><h2>Choisissez une solution</h2><p class="muted">Pas besoin d'internet. Chaque déblocage est noté dans le journal de sécurité du groupe.</p></div>
    ${opt('lostBureau', 'users', 'Deux membres du bureau', others >= 2 ? 'Deux responsables présents tapent leur code, puis vous choisissez un nouveau code.' : 'Il faut deux autres membres du bureau.', others < 2)}
    ${opt('lostRescue', 'shield', 'La carte de secours du groupe', left ? `Un code de la carte gardée dans la caisse. ${left} code${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}.` : 'Tous les codes de la carte sont utilisés.', !left)}
    ${a.orgId ? opt('lostCall', 'key', 'Appeler l\'animateur ou l\'organisation', 'Un simple appel téléphonique suffit.') : ''}
  </main></div>`;
};
ACT.lostBureau = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  const others = activeM(a).filter(x => isBureau(x) && x.id !== m.id);
  App.openSheet(`<h2>Deux membres du bureau</h2><p class="muted">Ils confirment devant le groupe que vous êtes bien ${esc(m.name)}.</p>
    ${[1, 2].map(i => `<div class="grid2"><div class="field"><label for="lb${i}">Responsable ${i}</label><select id="lb${i}" class="input">${others.map((x, j) => `<option value="${x.id}" ${j === i - 1 ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="lb${i}P">Son code</label><input id="lb${i}P" class="input num" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>`).join('')}
    ${pinFields('lbn')}
    <button class="btn primary block xl" data-act="lostBureauOk" data-avec="${a.id}" data-mid="${m.id}">Enregistrer mon nouveau code</button>`);
};
ACT.lostBureauOk = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  if (lostLocked(a)) return;
  const x1 = memberOf(a, fval('lb1')), x2 = memberOf(a, fval('lb2'));
  if (!x1 || !x2 || x1.id === x2.id) return App.toast('Choisissez deux responsables différents');
  if (x1.id === m.id || x2.id === m.id || !isBureau(x1) || !isBureau(x2)) return App.toast('Il faut deux autres membres du bureau');
  if (fval('lb1P') !== x1.pin || fval('lb2P') !== x2.pin) return lostFail(a, 'Un des deux codes est faux');
  const pin = readNewPin('lbn'); if (!pin) return;
  finishReset(a, m, pin, `confirmé par ${x1.name} et ${x2.name}`);
};
ACT.lostRescue = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  App.openSheet(`<h2>Carte de secours</h2><p class="muted">Les porte-clés ouvrent la caisse et sortent la carte. Tapez un code pas encore barré, puis barrez-le sur la carte.</p>
    <div class="field"><label for="lrC">Code de la carte</label><input id="lrC" class="input bignum num" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="0000-0000"></div>
    ${pinFields('lrn')}
    <button class="btn primary block xl" data-act="lostRescueOk" data-avec="${a.id}" data-mid="${m.id}">Enregistrer mon nouveau code</button>`);
};
ACT.lostRescueOk = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  if (lostLocked(a)) return;
  const c = (fval('lrC') || '').replace(/\D/g, '');
  if (c.length !== 8) return App.toast('Le code de la carte a 8 chiffres');
  const r = (a.rescue || []).find(x => !x.used && x.h === hashCode(c));
  if (!r) return lostFail(a, 'Code de secours faux ou déjà utilisé');
  const pin = readNewPin('lrn'); if (!pin) return;
  r.used = Date.now(); r.by = m.id;
  finishReset(a, m, pin, 'carte de secours');
};
ACT.lostCall = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  if (!a.unlockReq || a.unlockReq.memberId !== m.id || Date.now() - a.unlockReq.ts > 48 * 3600e3) { a.unlockReq = { memberId: m.id, code: randCode(6), ts: Date.now() }; DB.save(); }
  const anim = a.animId ? userById(a.animId) : null, org = orgOf(a.orgId);
  App.openSheet(`<h2>Appeler pour débloquer</h2>
    <ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px"><li>Appelez ${esc(anim ? anim.name : 'votre animateur')} ou ${esc(org ? org.name : 'l\'organisation')}.</li><li>Dites votre nom, votre groupe et ce code :</li></ol>
    <div class="receipt" style="text-align:center">${bigCode(fmtReq(a.unlockReq.code))}</div>
    <div class="field"><label for="lcC">Code de déblocage dicté (8 chiffres)</label><input id="lcC" class="input bignum num" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="0000 0000"></div>
    ${pinFields('lcn')}
    <button class="btn primary block xl" data-act="lostCallOk" data-avec="${a.id}" data-mid="${m.id}">Enregistrer mon nouveau code</button>`);
};
ACT.lostCallOk = d => {
  const a = avecById(d.avec), m = memberOf(a, d.mid);
  if (lostLocked(a)) return;
  const req = a.unlockReq;
  if (!req || req.memberId !== m.id || Date.now() - req.ts > 48 * 3600e3) return App.toast('La demande a expiré. Recommencez.');
  const c = (fval('lcC') || '').replace(/\D/g, '');
  if (c !== signCode('UNLOCK', a.orgId, req.code)) return lostFail(a, 'Code de déblocage faux');
  const pin = readNewPin('lcn'); if (!pin) return;
  finishReset(a, m, pin, 'appel à l\'accompagnement');
};

/* ---------- bureau : carte de secours et journal de sécurité ---------- */
SCREENS['a.security'] = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return SCREENS['a.home']();
  const all = avec.rescue || [], left = all.filter(r => !r.used).length;
  return `<div class="shell">${topbar('Sécurité et codes', esc(avec.name), backBtn('a.more'))}<main class="main">
    <div class="card stack"><h2>Carte de secours</h2>
      <p class="small muted">Codes à usage unique pour débloquer un membre qui a perdu son code secret. La carte se garde sur papier, dans la caisse fermée à clé, jamais dans un téléphone.</p>
      <div class="row between"><span>Codes encore valables</span><b class="num" style="font-family:var(--f-display);font-size:1.4rem">${left} / ${all.length}</b></div>
      ${left <= 2 ? `<div class="alert warn">${icSpan('alert')}<div><b>Carte presque épuisée</b><span class="small">Créez une nouvelle carte.</span></div></div>` : ''}
      <button class="btn ghost block" data-act="rescueNewSheet">${ic('shield')} Créer une nouvelle carte</button></div>
    <div class="card stack"><h3>Si quelqu'un perd son code</h3>
      <ol class="small" style="margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px">
        <li>Sur l'accueil, touchez le bouton « AVEC », puis en bas « J'ai oublié mon code secret ».</li>
        <li>Choisissez : deux membres du bureau, la carte de secours${avec.orgId ? ', ou un appel à l\'animateur' : ''}.</li>
        <li>Le membre choisit un nouveau code, qui ne s'affiche jamais.</li></ol></div>
    <section class="section"><h2>Journal de sécurité</h2><div class="list">${(avec.security || []).slice().reverse().slice(0, 40).map(e => `<div class="li"><span class="grow"><b>${esc(cap(e.type))}${e.memberId ? ' · ' + esc(memberOf(avec, e.memberId)?.name || '') : ''}</b><span class="small muted">${fdt(e.ts)}${e.via ? ' · ' + esc(e.via) : ''}</span></span></div>`).join('') || '<div class="li muted">Aucun évènement pour le moment</div>'}</div></section>
  </main></div>`;
};
ACT.rescueNewSheet = () => {
  const { avec, me } = cur();
  App.openSheet(`<h2>Nouvelle carte de secours</h2><p class="muted">L'ancienne carte ne marchera plus. Détruisez-la devant le groupe.</p>
    ${approverFields(avec, me, 'rs')}<button class="btn primary block xl" data-act="rescueNew">Créer la carte</button>`);
};
ACT.rescueNew = () => {
  const { avec, me } = cur();
  const ap = checkApprover(avec, 'rs', null); if (!ap) return;
  const codes = Array.from({ length: 6 }, rescueCode);
  avec.rescue = codes.map(c => ({ h: hashCode(c), used: false }));
  secLog(avec, 'nouvelle carte de secours', null, `${me.name} et ${ap.name}`);
  DB.save();
  App.openSheet(`<h2>Recopiez la carte maintenant</h2>${rescueCardHtml(avec, codes)}<p class="hint">Ces codes ne seront plus jamais affichés.</p><button class="btn primary block xl" data-act="closeSheet">J'ai recopié la carte</button>`);
};
