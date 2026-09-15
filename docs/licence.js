/* Kitabu AVEC — accès réservé aux partenaires agréés.
   Chaque licence est signée par l'administrateur de Kitabu (clé secrète gardée hors de l'application).
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
      <h1>Kitabu</h1>
      <p>Application réservée aux organisations et aux groupes partenaires agréés.</p>
    </header>
    <main class="main">
      ${r.expired ? `<div class="alert bad">${icSpan('alert')}<div><b>${esc(r.why)}</b><span class="small">Les données restent sur ce téléphone. Demandez le renouvellement de la licence de « ${esc(r.data.name)} ».</span></div></div>` : ''}
      <section class="card stack"><h2>Activer Kitabu</h2>
        <p class="small muted">Ouvrez le lien d'activation reçu de l'administrateur de Kitabu, scannez son QR code d'activation, ou collez le code ci-dessous.</p>
        <div class="field"><label for="licC">Code de licence</label><textarea id="licC" class="input mono" rows="4" autocomplete="off" spellcheck="false" autocapitalize="off"></textarea></div>
        <button class="btn primary block xl" data-act="licActivate">${ic('key')} Activer</button>
      </section>
      <div class="card small muted">Pas de licence ? Adressez-vous à votre organisation partenaire ou à l'administrateur de Kitabu. Chaque licence porte le nom du partenaire et une date de fin.</div>
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
