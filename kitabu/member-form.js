/* Kitabu AVEC — fiche membre : nom et sexe obligatoires ; âge, téléphone, activité, adresse facultatifs */
'use strict';

const ACTIVITIES = ['Agriculture', 'Petit commerce', 'Élevage', 'Pêche', 'Artisanat', 'Couture', 'Transport (moto, vélo)', 'Enseignement', 'Santé', 'Travaux ménagers', 'Élève ou étudiant', 'Salarié', 'Sans activité'];
const FIELD_LABEL = { name: 'nom', sex: 'sexe', birthYear: 'âge', phone: 'téléphone', activity: 'activité', address: 'adresse' };
const ageOf = m => (m && m.birthYear ? new Date().getFullYear() - m.birthYear : null);
const hasPhone = m => !!(m && m.phone && m.phone !== '—');

/* Numéro congolais : 9 chiffres commençant par 8 ou 9, avec ou sans 0 ou +243. '' si vide, null si faux. */
function normPhone(raw) {
  const s = String(raw || '').trim();
  if (!s || s === '—') return '';
  let d = s.replace(/\D/g, '');
  if (d.startsWith('00243')) d = d.slice(5); else if (d.startsWith('243')) d = d.slice(3); else if (d.startsWith('0')) d = d.slice(1);
  if (!/^[89]\d{8}$/.test(d)) return null;
  return '+243 ' + d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5);
}

function memberFormHtml(p, m = {}) {
  const opt = '<span class="opt">facultatif</span>';
  const act = m.activity && !ACTIVITIES.includes(m.activity) ? 'Autre' : (m.activity || '');
  return `<div class="stack">
    <div class="field"><label for="${p}Name">Nom complet</label><input id="${p}Name" class="input" value="${esc(m.name || '')}" autocomplete="off" placeholder="Ex. Kavira Mbusa"></div>
    <div class="field"><span class="flabel">Sexe</span><div class="choice" role="radiogroup" aria-label="Sexe">
      <label><input type="radio" name="${p}Sex" value="F" ${m.sex !== 'M' ? 'checked' : ''}><span>Femme</span></label>
      <label><input type="radio" name="${p}Sex" value="M" ${m.sex === 'M' ? 'checked' : ''}><span>Homme</span></label></div></div>
    <div class="grid2">
      <div class="field"><label for="${p}Age">Âge ${opt}</label><input id="${p}Age" class="input num" inputmode="numeric" maxlength="3" value="${ageOf(m) || ''}" placeholder="Ex. 34" autocomplete="off"></div>
      <div class="field"><label for="${p}Tel">Téléphone ${opt}</label><input id="${p}Tel" class="input" inputmode="tel" value="${esc(hasPhone(m) ? m.phone : '')}" placeholder="099 123 4567" autocomplete="off"></div>
    </div>
    <div class="field"><label for="${p}Act">Activité ${opt}</label><select id="${p}Act" class="input" data-in="actOther" data-p="${p}"><option value="">Choisir…</option>${ACTIVITIES.concat('Autre').map(a => `<option value="${a}" ${a === act ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
    <div class="field" id="${p}ActOW" ${act === 'Autre' ? '' : 'hidden'}><label for="${p}ActO">Quelle activité ?</label><input id="${p}ActO" class="input" value="${esc(act === 'Autre' ? m.activity : '')}" placeholder="Ex. vente de braise"></div>
    <div class="field"><label for="${p}Adr">Adresse ${opt}</label><input id="${p}Adr" class="input" value="${esc(m.address || '')}" placeholder="Avenue, quartier ou village" autocomplete="off"></div>
  </div>`;
}
INP.actOther = el => { const w = document.getElementById(el.dataset.p + 'ActOW'); if (w) w.hidden = el.value !== 'Autre'; };

function readMemberForm(p) {
  const name = (fval(p + 'Name') || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3) return { error: 'Écrivez le nom complet du membre' };
  const sexEl = document.querySelector(`input[name="${p}Sex"]:checked`);
  const ageTxt = (fval(p + 'Age') || '').trim();
  let birthYear = null;
  if (ageTxt) {
    const a = parseInt(ageTxt.replace(/\D/g, ''), 10);
    if (!(a >= 15 && a <= 100)) return { error: 'L\'âge doit être entre 15 et 100 ans' };
    birthYear = new Date().getFullYear() - a;
  }
  const phone = normPhone(fval(p + 'Tel'));
  if (phone === null) return { error: 'Numéro de téléphone incorrect. Exemple : 099 123 4567' };
  let activity = fval(p + 'Act') || '';
  if (activity === 'Autre') activity = (fval(p + 'ActO') || '').trim();
  return { data: { name, sex: sexEl ? sexEl.value : 'F', birthYear, phone: phone || '—', activity, address: (fval(p + 'Adr') || '').trim() } };
}

const memberBrief = m => [m.sex === 'M' ? 'Homme' : 'Femme', ageOf(m) ? ageOf(m) + ' ans' : '', m.activity || '', hasPhone(m) ? m.phone : ''].filter(Boolean).map(esc).join(' · ');

function memberInfo(m) {
  const none = '<span class="muted" style="font-weight:400">non renseigné</span>';
  const row = (k, v) => `<div class="row between small"><span class="muted">${k}</span><b style="text-align:right">${v || none}</b></div>`;
  return `<section class="card stack" style="gap:8px"><h3>Informations</h3>
    ${row('Sexe', m.sex === 'M' ? 'Homme' : 'Femme')}
    ${row('Âge', ageOf(m) ? ageOf(m) + ' ans' : '')}
    ${row('Téléphone', hasPhone(m) ? `<a href="tel:${esc(m.phone.replace(/\s/g, ''))}" style="color:var(--brand)">${esc(m.phone)}</a>` : '')}
    ${row('Activité', esc(m.activity || ''))}
    ${row('Adresse', esc(m.address || ''))}
    ${m.joined ? row('Membre depuis', fdate(m.joined)) : ''}</section>`;
}

ACT.editMemberSheet = d => {
  const { avec } = cur(); const x = memberOf(avec, d.id);
  App.openSheet(`<h2>Modifier les informations</h2><p class="small muted">Seuls le nom et le sexe sont obligatoires.</p>
    ${memberFormHtml('em', x)}
    <button class="btn primary block xl" data-act="saveMemberInfo" data-id="${x.id}">${ic('check')} Enregistrer</button>`);
};
ACT.saveMemberInfo = d => {
  const { avec, me } = cur(); const x = memberOf(avec, d.id);
  if (!isBureau(me) && me.id !== x.id) return App.toast('Seul le bureau ou le membre lui-même peut modifier cette fiche');
  const r = readMemberForm('em'); if (r.error) return App.toast(r.error);
  if (avec.members.some(m => m.id !== x.id && !m.left && m.name.toLowerCase() === r.data.name.toLowerCase())) return App.toast('Ce nom existe déjà dans le groupe');
  const changed = Object.keys(r.data).filter(k => String(x[k] == null ? '' : x[k]) !== String(r.data[k] == null ? '' : r.data[k]));
  Object.assign(x, r.data);
  if (changed.length) secLog(avec, 'fiche modifiée', x.id, `${me.name} : ${changed.map(k => FIELD_LABEL[k]).join(', ')}`);
  DB.save(); App.closeSheet(); App.toast('Informations enregistrées');
};

/* profil du groupe, pour l'animateur et l'organisation */
function profileHtml(avec) {
  const m = avec.members.filter(x => !x.left);
  if (!m.length) return '';
  const ages = m.map(ageOf).filter(Boolean);
  const avg = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
  const acts = {};
  m.forEach(x => { if (x.activity) acts[x.activity] = (acts[x.activity] || 0) + 1; });
  const top = Object.entries(acts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return `<section class="section"><h2>Profil des membres</h2>
    <div class="kpis">
      <div class="kpi"><span>Femmes</span><b class="num">${pct(m.filter(x => x.sex === 'F').length / m.length)}</b><span>${m.length} membres</span></div>
      <div class="kpi"><span>Âge moyen</span><b class="num">${avg ? avg + ' ans' : '—'}</b><span>${ages.length} âges connus</span></div>
      <div class="kpi"><span>Moins de 25 ans</span><b class="num">${ages.filter(a => a < 25).length}</b><span>jeunes</span></div>
      <div class="kpi"><span>Avec téléphone</span><b class="num">${m.filter(hasPhone).length}</b><span>sur ${m.length}</span></div>
    </div>
    ${top.length ? `<div class="card stack" style="gap:10px"><span class="label">Activités principales</span>${top.map(([a, n]) => `<div class="stack" style="gap:4px"><div class="row between small"><span>${esc(a)}</span><b class="num">${n}</b></div><div class="bar"><i style="width:${Math.round(n / m.length * 100)}%"></i></div></div>`).join('')}</div>` : ''}
  </section>`;
}
