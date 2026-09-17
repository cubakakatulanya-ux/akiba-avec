/* Akiba AVEC — accès réservé aux partenaires agréés, protégé contre la fraude. Pour faire simple :
   1. Chaque téléphone affiche son code (ex. 7Q2M-9XKD) et l'envoie à Ubora.
   2. Ubora renvoie un CODE DE VALIDATION signé pour CE téléphone : impossible à inventer (clé secrète d'Ubora),
      refusé sur tout autre téléphone. Un code qui circule ne sert donc à rien.
   3. Liste de blocage signée, publiée avec l'application : dès qu'il a du réseau, le téléphone l'applique
      (partenaire ou téléphone bloqué). Les données restent dans le téléphone. */
'use strict';

const LICENCE_PUBLIC_KEY = { kty: 'EC', crv: 'P-256', x: '3x53S4li4nh6wZhtl-Cf9WJeKJ-3IDiADrwFHwwdl8U', y: 'QjitioTGummi3-bKZoiuG6sUG8uc-JSvn7iPpKrYUH0' };
const LIC_STORE = 'kitabu.licence', ACT_STORE = 'kitabu.activation', DEV_STORE = 'kitabu.device';
const LEGACY_STORE = 'kitabu.licLegacy', LIMITED_STORE = 'kitabu.licLimited', BLOCK_STORE = 'kitabu.blocage', MIGRATED_STORE = 'kitabu.licMigrated';
const LIC_KINDS = { org: 'Organisation partenaire', avec: 'AVEC autonome', demo: 'Démonstration' };
const licenceRequired = () => !!window.KITABU_PWA;          // la version officielle en ligne est toujours verrouillée
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* rien */ } };
const licGet = () => lsGet(LIC_STORE) || '';
const licSet = t => lsSet(LIC_STORE, t);
const licKind = () => (App.licence && App.licence.ok && App.licence.data && App.licence.data.kind) || 'org';
const licFull = () => !!(App.licence && App.licence.ok && !App.licence.limited && licKind() !== 'demo');
const fdateY = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const b64uDec = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const tokenFrom = (raw, name) => (String(raw || '').replace(/\s+/g, '').match(new RegExp('[#&?]?' + name + '=([\\w.-]+)')) || [])[1] || '';
// code collé : lien (#code=…, ancien #licence=…) ou code seul
const codeFrom = raw => tokenFrom(raw, 'code') || tokenFrom(raw, 'licence') || (String(raw || '').replace(/\s+/g, '').match(/[\w-]{20,}\.[\w-]{40,}/) || [])[0] || '';

/* code du téléphone : tiré au hasard une fois, gardé dans le téléphone (ex. 7Q2M-9XKD) */
function deviceId() {
  let d = lsGet(DEV_STORE);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(d || '')) {
    const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const b = window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(8)) : Array.from({ length: 8 }, () => Math.floor(Math.random() * 256));
    const s = Array.from(b, x => A[x % 32]).join('');
    d = s.slice(0, 4) + '-' + s.slice(4);
    lsSet(DEV_STORE, d);
  }
  return d;
}

async function verifySigned(token) {
  const t = String(token || '').trim();
  if (!t) return { ok: false, why: '' };
  if (!(window.crypto && crypto.subtle && window.TextEncoder)) return { ok: false, why: 'Ce navigateur est trop ancien pour vérifier le code. Mettez Chrome à jour.' };
  try {
    const [p, s] = t.split('.');
    if (!p || !s) return { ok: false, why: 'Code incomplet' };
    const key = await crypto.subtle.importKey('jwk', LICENCE_PUBLIC_KEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const good = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uDec(s), new TextEncoder().encode(p));
    if (!good) return { ok: false, why: 'Code de licence non valable' };
    return { ok: true, data: JSON.parse(new TextDecoder().decode(b64uDec(p))) };
  } catch (e) { return { ok: false, why: 'Code de licence non valable' }; }
}
/* licence ou code de validation : signature + date de fin */
async function verifyLicence(token) {
  const r = await verifySigned(token);
  if (!r.ok) return r.why === 'Code incomplet' ? { ok: false, why: 'Code de licence incomplet' } : r;
  const data = r.data;
  if (data.t || !data.id || !data.exp) return { ok: false, why: 'Code de licence non valable' };
  const exp = new Date(data.exp + 'T23:59:59').getTime();
  if (!(exp > Date.now())) return { ok: false, expired: true, data, exp, why: `Licence expirée le ${fdateY(exp)}` };
  return { ok: true, data, exp };
}
/* ancien format (lien de licence + lien d'activation) */
async function verifyActivation(token, licId) {
  const r = await verifySigned(token);
  if (!r.ok || r.data.t !== 'act') return { ok: false, why: 'Code d\'activation non valable' };
  if (r.data.lic !== licId) return { ok: false, why: 'Ce code est pour une autre licence' };
  if (r.data.dev !== deviceId()) return { ok: false, why: 'Ce code est pour un autre téléphone' };
  return { ok: true, data: r.data };
}

/* liste de blocage */
const blockData = () => { try { return JSON.parse(lsGet(BLOCK_STORE) || 'null'); } catch (e) { return null; } };
function blockedWhy(licId) {
  const b = blockData();
  if (!b) return '';
  const l = (b.licences || []).find(x => x.id === licId);
  if (l) return `L'accès « ${licId} » a été bloqué par l'administrateur${l.why ? ' : ' + l.why : ''}`;
  const d = (b.devices || []).find(x => x.id === deviceId());
  if (d) return `Ce téléphone (${deviceId()}) a été bloqué par l'administrateur${d.why ? ' : ' + d.why : ''}`;
  return '';
}
async function applyBlocklist(text) {
  const r = await verifySigned(String(text || '').trim());
  if (!r.ok || r.data.t !== 'blocage') return false;
  const old = blockData();
  if (old && +old.iat > +r.data.iat) return false;                  // jamais revenir à une liste plus ancienne
  lsSet(BLOCK_STORE, JSON.stringify(r.data));
  return true;
}
async function refreshBlocklist() {
  if (!licenceRequired() || navigator.onLine === false || typeof fetch !== 'function') return false;
  try {
    const res = await fetch('blocage.txt?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok || !(await applyBlocklist(await res.text()))) return false;
    const before = JSON.stringify([App.licence && App.licence.ok, App.licence && App.licence.blocked]);
    App.licence = await resolveLicence();
    if (JSON.stringify([App.licence.ok, App.licence.blocked]) !== before) render();
    return true;
  } catch (e) { return false; }
}

/* état de ce téléphone */
async function resolveLicence() {
  if (!licenceRequired()) return { ok: true, data: { name: 'Démonstration', kind: 'demo' } };
  const tok = licGet();
  if (!tok) return { ok: false, why: '' };
  const res = await verifyLicence(tok);
  if (!res.ok) return res;
  const id = res.data.id, blocked = blockedWhy(id);
  if (blocked) return Object.assign({}, res, { ok: false, blocked: true, why: blocked });
  if (res.data.kind === 'demo') return Object.assign(res, { how: 'demo' });
  if (res.data.dev) {
    if (res.data.dev === deviceId()) return Object.assign(res, { how: 'device' });
    if (lsGet(LIMITED_STORE) === id) return Object.assign(res, { how: 'avec', limited: true });
    return Object.assign({}, res, { ok: false, needsActivation: true, why: 'Ce téléphone n\'est pas encore validé' });
  }
  if (lsGet(LEGACY_STORE) === id) return Object.assign(res, { how: 'legacy' });
  if ((await verifyActivation(lsGet(ACT_STORE), id)).ok) return Object.assign(res, { how: 'device' });
  if (lsGet(LIMITED_STORE) === id) return Object.assign(res, { how: 'avec', limited: true });
  return Object.assign({}, res, { ok: false, needsActivation: true, why: 'Ce téléphone n\'est pas encore validé' });
}
/* téléphones déjà activés avant cette version : ils continuent sans nouvelle démarche */
async function migrateLegacyLicence() {
  if (lsGet(MIGRATED_STORE)) return;
  const tok = licGet();
  if (tok) { const r = await verifyLicence(tok); if (r.ok && !r.data.dev) lsSet(LEGACY_STORE, r.data.id); }
  lsSet(MIGRATED_STORE, '1');
}
/* enregistre un code de validation collé ou reçu par lien */
async function applyValidationCode(raw, allowDemo = true) {
  const code = codeFrom(raw);
  if (!code) return { ok: false, why: 'Collez le code de validation reçu d\'Ubora' };
  const res = await verifyLicence(code);
  if (!res.ok) return res;
  if (!allowDemo && res.data.kind === 'demo') return { ok: false, why: 'Ce code sert seulement à la démonstration' };
  if (blockedWhy(res.data.id)) return { ok: false, why: blockedWhy(res.data.id) };
  if (res.data.dev && res.data.dev !== deviceId()) return { ok: false, why: `Ce code est pour le téléphone ${res.data.dev}, pas pour celui-ci (${deviceId()})` };
  licSet(code);
  const act = tokenFrom(raw, 'activation');                        // ancien format : licence + activation
  if (act && (await verifyActivation(act, res.data.id)).ok) lsSet(ACT_STORE, act);
  App.licence = await resolveLicence();
  return { ok: true };
}

/* écran de validation, le même partout */
const demandText = () => `Bonjour Ubora, je demande un code de validation Akiba.\nCode du téléphone : ${deviceId()}\nOrganisation ou AVEC : `;
function validationPanel(opts = {}) {
  const r = App.licence || {};
  return `<section class="card stack">
    ${r.blocked ? `<div class="alert bad">${icSpan('lock')}<div><b>Accès bloqué</b><span class="small">${esc(r.why)}. Les données restent sur ce téléphone. Contactez Ubora si c'est une erreur.</span></div></div>` : ''}
    ${r.expired ? `<div class="alert bad">${icSpan('alert')}<div><b>${esc(r.why)}</b><span class="small">Les données restent sur ce téléphone. Demandez un nouveau code à Ubora.</span></div></div>` : ''}
    ${r.limited ? `<div class="alert warn">${icSpan('key')}<div><b>Téléphone d'AVEC</b><span class="small">Ce téléphone tient les réunions de l'AVEC reçue. Pour le reste, il faut un code de validation.</span></div></div>` : ''}
    ${opts.intro === false ? '' : `<p class="muted">Akiba est libre à installer et à découvrir. Pour les vraies opérations, Ubora donne un <b>code de validation</b> pour ce téléphone, une seule fois.</p>`}
    <div class="devcode"><span class="label">Code de ce téléphone</span><b class="mono">${deviceId()}</b></div>
    <a class="btn wa block xl" href="https://wa.me/${UBORA.wa}?text=${encodeURIComponent(demandText())}" target="_blank" rel="noopener">${ic('chat')} Demander le code sur WhatsApp</a>
    <p class="small muted" style="text-align:center;margin-top:-4px">ou appelez Ubora au <a href="tel:${UBORA.tel}" style="color:var(--brand);font-weight:700">${UBORA.telShow}</a> et donnez le code de ce téléphone</p>
    <div class="field"><label for="licS">Code de validation reçu</label><textarea id="licS" class="input mono" rows="3" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="Collez ici le code reçu"></textarea></div>
    <button class="btn primary block xl" data-act="licSheetOk">${ic('key')} Valider ce téléphone</button>
  </section>`;
}

SCREENS['lic.gate'] = () => `<div class="shell">
    <header class="hero">
      <div class="label" style="color:inherit;opacity:.8">Épargne et crédit villageois</div>
      <h1>Akiba</h1>
      <p>Ce téléphone contient de vraies données : il doit être validé par l'administrateur d'Akiba pour continuer.</p>
      <p class="small" style="opacity:.85">Développée par l'Entreprise Sociale Ubora</p>
    </header>
    <main class="main">
      ${validationPanel({ intro: false })}
      ${(App.licence || {}).blocked ? '' : `<section class="card stack"><h2>Téléphone d'une AVEC</h2>
        <p class="small muted">Vous avez reçu un fichier <b>.akiba</b> et un code (de votre animateur, ou de l'ancien téléphone de votre groupe) : recevez votre AVEC directement.</p>
        <button class="btn ghost block" data-act="receiveSheet">${ic('sync')} Recevoir une AVEC</button>
      </section>`}
      ${supportCard()}
      <button class="btn ghost block" data-act="go" data-to="adm.home">${ic('key')} Espace administrateur Ubora</button>
    </main></div>`;

function requireLicence(then) {
  if (!licenceRequired() || licFull()) return then();
  App.licThen = then;
  App.openSheet(`<h2>Code de validation</h2>${validationPanel()}`);
}
ACT.licSheetOk = async () => {
  const res = await applyValidationCode(fval('licS'), false);
  if (!res.ok) return App.toast(res.why || 'Code de validation non valable');
  if (!App.licence.ok) { render(); return App.toast(App.licence.why || 'Code refusé'); }
  const then = App.licThen; App.licThen = null;
  if (App.sheet) App.closeSheet(); else App.go('login');
  App.toast(`Téléphone validé : ${App.licence.data.name}`);
  if (then && licFull()) then();
};
ACT.createAvec = () => requireLicence(() => App.go('c.avec', { from: 'login' }));

function licenceBanner() {
  const r = App.licence;
  if (!licenceRequired() || !r || !r.ok || !r.exp) return '';
  const left = Math.ceil((r.exp - Date.now()) / DAY);
  if (left > 30) return '';
  return `<div class="alert warn">${icSpan('key')}<div><b>La validation finit dans ${left} jour${left > 1 ? 's' : ''}</b><span class="small">${esc(r.data.name)} : demandez un nouveau code avant le ${fdateY(r.exp)}.</span></div></div>`;
}
function licenceCard() {
  const r = App.licence;
  if (!licenceRequired() || !r || !r.data) return `<section class="card stack"><h2>Validation</h2><div class="row between small"><span class="muted">Code du téléphone</span><b class="mono">${deviceId()}</b></div></section>`;
  const line = (k, v) => `<div class="row between small"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
  const how = { device: 'Validé pour ce téléphone', legacy: 'Activé avant la validation par téléphone', avec: 'AVEC reçue d\'un animateur', demo: 'Démonstration' }[r.how] || (r.needsActivation ? 'En attente de validation' : r.blocked ? 'Bloqué' : '—');
  return `<section class="card stack"><h2>Validation</h2>
    ${line('Partenaire', esc(r.data.name))}${line('Type', LIC_KINDS[r.data.kind] || '—')}${r.exp ? line('Valable jusqu\'au', fdateY(r.exp)) : ''}${line('N° de partenaire', `<span class="mono">${esc(r.data.id || '')}</span>`)}
    ${line('Code du téléphone', `<span class="mono">${deviceId()}</span>`)}${line('État', how)}</section>`;
}
