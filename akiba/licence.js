/* Akiba AVEC — accès réservé aux partenaires agréés.
   Chaque licence est signée par l'administrateur d\'Akiba (clé secrète gardée hors de l'application).
   Le téléphone vérifie la signature sans internet avec la clé publique ci-dessous : un code modifié ou inventé est refusé. */
'use strict';

const LICENCE_PUBLIC_KEY = { kty: 'EC', crv: 'P-256', x: '3x53S4li4nh6wZhtl-Cf9WJeKJ-3IDiADrwFHwwdl8U', y: 'QjitioTGummi3-bKZoiuG6sUG8uc-JSvn7iPpKrYUH0' };
const LIC_STORE = 'kitabu.licence';
const LIC_KINDS = { org: 'Organisation partenaire', avec: 'AVEC autonome', demo: 'Démonstration' };
const licenceRequired = () => !!window.KITABU_PWA;          // la version officielle en ligne est toujours verrouillée
const licGet = () => { try { return localStorage.getItem(LIC_STORE) || ''; } catch (e) { return ''; } };
const licSet = t => { try { localStorage.setItem(LIC_STORE, t); } catch (e) { /* rien */ } };
const licKind = () => (App.licence && App.licence.ok && App.licence.data && App.licence.data.kind) || 'org';
const fdateY = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const b64uDec = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

async function verifyLicence(token) {
  const t = String(token || '').trim();
  if (!t) return { ok: false, why: '' };
  if (!(window.crypto && crypto.subtle && window.TextEncoder)) return { ok: false, why: 'Ce navigateur est trop ancien pour vérifier la licence. Mettez Chrome à jour.' };
  try {
    const [p, s] = t.split('.');
    if (!p || !s) return { ok: false, why: 'Code de licence incomplet' };
    const key = await crypto.subtle.importKey('jwk', LICENCE_PUBLIC_KEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const good = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uDec(s), new TextEncoder().encode(p));
    if (!good) return { ok: false, why: 'Code de licence non valable' };
    const data = JSON.parse(new TextDecoder().decode(b64uDec(p)));
    const exp = new Date(data.exp + 'T23:59:59').getTime();
    if (!(exp > Date.now())) return { ok: false, expired: true, data, exp, why: `Licence expirée le ${fdateY(exp)}` };
    return { ok: true, data, exp };
  } catch (e) { return { ok: false, why: 'Code de licence non valable' }; }
}

SCREENS['lic.gate'] = () => {
  const r = App.licence || {};
  return `<div class="shell">
    <header class="hero">
      <div class="label" style="color:inherit;opacity:.8">Épargne et crédit villageois</div>
      <h1>Akiba</h1>
      <p>Ce téléphone contient de vraies données : il doit être validé par l'administrateur d'Akiba pour continuer.</p>
      <p class="small" style="opacity:.85">Développée par l'Entreprise Sociale Ubora</p>
    </header>
    <main class="main">
      ${r.expired ? `<div class="alert bad">${icSpan('alert')}<div><b>${esc(r.why)}</b><span class="small">Les données restent sur ce téléphone. Demandez le renouvellement de la licence de « ${esc(r.data.name)} ».</span></div></div>` : ''}
      <section class="card stack"><h2>Activer Akiba</h2>
        <p class="small muted">Ouvrez le lien d'activation reçu de l'administrateur d\'Akiba, scannez son QR code d'activation, ou collez le code ci-dessous.</p>
        <div class="field"><label for="licC">Code de licence</label><textarea id="licC" class="input mono" rows="4" autocomplete="off" spellcheck="false" autocapitalize="off"></textarea></div>
        <button class="btn primary block xl" data-act="licActivate">${ic('key')} Activer</button>
      </section>
      <section class="card stack"><h2>Téléphone d'une AVEC</h2>
        <p class="small muted">Vous avez reçu un fichier <b>.akiba</b> et un code (de votre animateur, ou de l'ancien téléphone de votre groupe) : recevez votre AVEC directement. La licence arrive avec le fichier.</p>
        <button class="btn ghost block" data-act="receiveSheet">${ic('sync')} Recevoir une AVEC</button>
      </section>
      ${supportCard()}
      <button class="btn ghost block" data-act="go" data-to="adm.home">${ic('key')} Espace administrateur Ubora</button>
      <div class="card small muted">Pas de licence ? Adressez-vous à votre organisation partenaire ou à l'administrateur d\'Akiba. Chaque licence porte le nom du partenaire et une date de fin.</div>
    </main></div>`;
};
ACT.licActivate = async () => {
  const raw = (fval('licC') || '').replace(/\s+/g, '');
  const token = (raw.match(/licence=([\w.-]+)/) || [])[1] || raw;
  if (!token) return App.toast('Collez le code de licence');
  const res = await verifyLicence(token);
  if (!res.ok) return App.toast(res.why || 'Code de licence non valable');
  licSet(token); App.licence = res;
  App.go('login'); App.toast(`Licence activée : ${res.data.name}`);
};
/* Akiba est libre à installer et à découvrir (démonstration).
   Pour commencer les vraies opérations, un code de validation de l'administrateur est demandé, une seule fois. */
function requireLicence(then) {
  if (!licenceRequired() || (App.licence && App.licence.ok && licKind() !== 'demo')) return then();
  App.licThen = then;
  const r = App.licence || {};
  App.openSheet(`<h2>Code de validation</h2>
    <p class="muted">Akiba est libre à installer et à découvrir. Pour commencer les vraies opérations, il faut un <b>code de validation</b> délivré par l'Entreprise Sociale Ubora. Il se demande une seule fois par téléphone.</p>
    ${r.expired ? `<div class="alert bad">${icSpan('alert')}<div><b>${esc(r.why)}</b><span class="small">Demandez un nouveau code.</span></div></div>` : ''}
    <div class="field"><label for="licS">Code ou lien de validation</label><textarea id="licS" class="input mono" rows="4" autocomplete="off" spellcheck="false" autocapitalize="off"></textarea></div>
    <button class="btn primary block xl" data-act="licSheetOk">${ic('key')} Valider</button>
    <p class="small muted" style="text-align:center">Pas de code ? Ubora : <a href="tel:${UBORA.tel}" style="color:var(--brand);font-weight:700">${UBORA.telShow}</a> · <a href="${waLink()}" target="_blank" rel="noopener" style="color:var(--brand);font-weight:700">WhatsApp</a></p>`);
}
ACT.licSheetOk = async () => {
  const raw = (fval('licS') || '').replace(/\s+/g, '');
  const token = (raw.match(/licence=([\w.-]+)/) || [])[1] || raw;
  if (!token) return App.toast('Collez le code de validation');
  const res = await verifyLicence(token);
  if (!res.ok) return App.toast(res.why || 'Code de licence non valable');
  if (res.data.kind === 'demo') return App.toast('Ce code sert seulement à la démonstration');
  licSet(token); App.licence = res;
  const then = App.licThen; App.licThen = null;
  App.closeSheet(); App.toast(`Téléphone validé : ${res.data.name}`);
  if (then) then();
};
ACT.createAvec = () => requireLicence(() => App.go('c.avec', { from: 'login' }));

function licenceBanner() {
  const r = App.licence;
  if (!licenceRequired() || !r || !r.ok || !r.exp) return '';
  const left = Math.ceil((r.exp - Date.now()) / DAY);
  if (left > 30) return '';
  return `<div class="alert warn">${icSpan('key')}<div><b>La licence finit dans ${left} jour${left > 1 ? 's' : ''}</b><span class="small">${esc(r.data.name)} : demandez le renouvellement avant le ${fdateY(r.exp)}.</span></div></div>`;
}
function licenceCard() {
  const r = App.licence;
  if (!licenceRequired() || !r || !r.ok) return '';
  const line = (k, v) => `<div class="row between small"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
  return `<section class="card stack"><h2>Licence</h2>
    ${line('Partenaire', esc(r.data.name))}${line('Type', LIC_KINDS[r.data.kind] || '—')}${line('Valable jusqu\'au', fdateY(r.exp))}${line('N° de licence', `<span class="mono">${esc(r.data.id || '')}</span>`)}</section>`;
}
