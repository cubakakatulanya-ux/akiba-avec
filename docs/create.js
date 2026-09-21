/* Akiba AVEC — création d'une AVEC en 5 étapes : tout est prévu dès le départ */
'use strict';

const C_STEPS = ['Groupe', 'Règlement', 'Membres', 'Bureau', 'Démarrage'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const isoDay = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fromIso = v => { const t = new Date((v || '') + 'T09:00').getTime(); return isNaN(t) ? Date.now() : t; };
const fval = id => { const e = document.getElementById(id); return e ? e.value : null; };

function cDraft(p) {
  const from = p.from || (K.session ? (K.session.kind === 'org' ? 'org' : 'anim') : 'login');
  if (!App.cdraft || App.cdraft.done || (p.from && App.cdraft.from !== p.from)) {
    App.cdraft = {
      from, step: 1, mode: 'new', names: '', members: [], roles: {}, nextId: 0, editing: null,
      g: { name: '', province: '', territoire: '', entite: '', secteur: '', groupement: '', village: '', animId: '', meetingDay: 'Samedi', frequency: 7, createdOn: isoDay(Date.now()) },
      r: { partValue: 1000, maxParts: 5, socialFee: 500, rate: 10, maxMult: 3, maxMonths: 3, fineAbsent: 500, fineLate: 200, penaltyRate: 10, cycleMonths: 12, cycleStart: isoDay(Date.now()) },
      rep: { social: '', credit: '', rows: {} }
    };
  }
  return App.cdraft;
}

function parseMembers(raw) {
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => {
    const bits = line.split(',').map(s => s.trim()).filter(Boolean);
    let name = bits.shift() || '', sex = 'F', phone = '—';
    if (/\((h|m)\)/i.test(name)) { sex = 'M'; name = name.replace(/\((h|m)\)/ig, ''); }
    bits.forEach(t => {
      if (/^(h|m|homme)$/i.test(t)) sex = 'M';
      else if (/^(f|femme)$/i.test(t)) sex = 'F';
      else if (t.replace(/\D/g, '').length >= 6) phone = t;
    });
    return { id: 'n' + i, name: name.replace(/\s+/g, ' ').trim(), sex, phone };
  });
}

function exampleHtml(r) {
  const saved = 3 * r.partValue * 10, max = saved * r.maxMult, interest = Math.round(max * r.rate / 100 * r.maxMonths);
  return `<b>Exemple :</b> Kavira achète 3 parts à chaque réunion. Après 10 réunions, elle a épargné ${fc(saved)}. Elle peut emprunter jusqu'à ${fc(max)} sur ${r.maxMonths} mois et paiera ${fc(interest)} d'intérêt.`;
}
INP.crEx = () => {
  const r = { partValue: +fval('crP'), maxMult: +fval('crM'), rate: +fval('crR'), maxMonths: +fval('crD') };
  document.getElementById('crEx').innerHTML = exampleHtml(r);
};
const exSel = (id, label, opts, v) => pickSel(id, label, opts, v).replace('<select ', '<select data-in="crEx" ');

const C_RENDER = {
  1: (d, u) => {
    const g = d.g;
    const anims = u ? K.data.users.filter(x => x.role === 'anim' && x.orgId === u.orgId) : [];
    return `<section class="card stack"><h2>Le groupe</h2>
      <div class="field"><label for="cgN">Nom du groupe</label><input id="cgN" class="input" value="${esc(g.name)}" placeholder="Ex. Tuungane" autocomplete="off"></div>
      ${geoFields('cg', g)}
      ${d.from === 'org' ? pickSel('cgA', 'Animateur qui accompagne le groupe', anims.map(a => [a.id, esc(a.name)]), g.animId) : ''}
      <div class="grid2">${pickSel('cgJ', 'Jour de réunion', DAYS.map(x => [x, x]), g.meetingDay)}${pickSel('cgQ', 'Rythme', [[7, 'Chaque semaine'], [14, 'Toutes les 2 semaines']], g.frequency)}</div>
      <div class="field"><label for="cgO">Date de création du groupe</label><input id="cgO" type="date" class="input" value="${g.createdOn}"></div>
    </section>
    <p class="hint">Un groupe AVEC réunit en général 15 à 25 personnes du même village qui se font confiance et habitent près les unes des autres.</p>`;
  },
  2: d => {
    const r = d.r;
    return `<section class="card stack"><h2>Règlement intérieur</h2><p class="muted small">Voté par l'assemblée. Il reste le même pendant tout le cycle.</p>
      <div class="grid2">
        ${exSel('crP', 'Valeur d\'une part', [[200, '200 FC'], [500, '500 FC'], [1000, '1 000 FC'], [2000, '2 000 FC'], [5000, '5 000 FC']], r.partValue)}
        ${pickSel('crX', 'Parts par réunion', [[3, '1 à 3 parts'], [5, '1 à 5 parts'], [10, '1 à 10 parts']], r.maxParts)}
        ${pickSel('crS', 'Caisse sociale par réunion', [[0, 'Aucune'], [200, '200 FC'], [300, '300 FC'], [500, '500 FC'], [1000, '1 000 FC']], r.socialFee)}
        ${pickSel('crC', 'Durée du cycle', [[6, '6 mois'], [9, '9 mois'], [12, '12 mois']], r.cycleMonths)}
        ${exSel('crR', 'Intérêt du crédit', [[2, '2 % par mois'], [5, '5 % par mois'], [10, '10 % par mois']], r.rate)}
        ${exSel('crM', 'Crédit maximum', [[2, '2 × l\'épargne'], [3, '3 × l\'épargne'], [4, '4 × l\'épargne']], r.maxMult)}
        ${exSel('crD', 'Durée max. d\'un crédit', [[1, '1 mois'], [2, '2 mois'], [3, '3 mois'], [6, '6 mois']], r.maxMonths)}
        <div class="field"><label for="crB">Début du cycle</label><input id="crB" type="date" class="input" value="${r.cycleStart}"></div>
        ${pickSel('crF', 'Amende d\'absence', [[200, '200 FC'], [500, '500 FC'], [1000, '1 000 FC']], r.fineAbsent)}
        ${pickSel('crL', 'Amende de retard', [[100, '100 FC'], [200, '200 FC'], [500, '500 FC']], r.fineLate)}
        ${pickSel('crPn', 'Pénalité si un crédit est en retard', [[0, 'Aucune pénalité'], [2, '2 % par mois'], [5, '5 % par mois'], [10, '10 % par mois']], r.penaltyRate != null ? r.penaltyRate : r.rate)}
      </div>
      <div class="tip" id="crEx">${exampleHtml(r)}</div>
    </section>`;
  },
  3: d => {
    const ed = d.editing ? d.members.find(m => m.id === d.editing) : null;
    return `<section class="card stack"><h2>${ed ? 'Modifier la fiche' : 'Ajouter un membre'}</h2>
        <p class="small muted">Seuls le nom et le sexe sont obligatoires. Le reste peut être complété plus tard.</p>
        ${memberFormHtml('mf', ed || {})}
        <div class="row" style="gap:8px">${ed ? '<button class="btn ghost" data-act="cCancelEdit">Annuler</button>' : ''}<button class="btn brand" style="flex:1" data-act="cAddMember">${ic(ed ? 'check' : 'plus')} ${ed ? 'Enregistrer la fiche' : 'Ajouter ce membre'}</button></div>
      </section>
      <section class="section"><div class="row between"><h2>Membres inscrits</h2><span class="chip ${d.members.length >= 6 ? 'good' : 'warn'}">${d.members.length} · ${d.members.filter(m => m.sex === 'F').length} femmes</span></div>
        ${d.members.length ? `<div class="list">${d.members.map((m, i) => `<div class="li"><span class="av ${m.sex === 'F' ? 'f' : ''}">${i + 1}</span><span class="grow"><b>${esc(m.name)}</b><span class="small muted">${memberBrief(m)}</span></span>
          <button class="iconbtn" style="color:var(--brand)" data-act="cEditMember" data-id="${m.id}" aria-label="Modifier ${esc(m.name)}">${ic('clip')}</button>
          <button class="iconbtn" style="color:var(--bad)" data-act="cDelMember" data-id="${m.id}" aria-label="Retirer ${esc(m.name)}">${ic('x')}</button></div>`).join('')}</div>`
          : '<div class="card small muted">Aucun membre pour le moment. Une AVEC compte en général 15 à 25 membres (au moins 6).</div>'}
      </section>
      <details class="g"><summary><span class="gi">${ic('book')}</span>Aller plus vite : coller une liste</summary><div class="gb">
        <p class="small muted">Un membre par ligne, par exemple « Paluku Maliro, H, 0812345678 ». Complétez ensuite les fiches avec le bouton de modification.</p>
        <textarea id="cmL" class="input" rows="6" aria-label="Liste des membres"></textarea>
        <button class="btn ghost block" data-act="cImport">Ajouter la liste</button></div></details>`;
  },
  4: d => {
    const L = d.members, R = d.roles;
    const def = i => (L[i % L.length] || {}).id;
    const sel = (id, label, hint, v) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input">${L.map(m => `<option value="${m.id}" ${m.id === v ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
    return `<section class="card stack"><h2>Le bureau</h2>
        ${sel('cbP', 'Président(e)', 'Dirige la réunion et fait respecter le règlement.', R.P || def(0))}
        ${sel('cbS', 'Secrétaire', 'Tient Akiba pendant la réunion.', R.S || def(1))}
        ${sel('cbT', 'Trésorier(ère)', 'Garde la caisse fermée à la maison. Ne garde aucune clé.', R.T || def(2))}
      </section>
      <section class="card stack"><h2>Les compteurs</h2><p class="hint">Ils comptent l'argent à haute voix à chaque réunion.</p>
        <div class="grid2">${sel('cbC1', 'Compteur 1', '', R.C1 || def(3))}${sel('cbC2', 'Compteur 2', '', R.C2 || def(4))}</div></section>
      <section class="card stack"><h2>Les trois porte-clés</h2><p class="hint">Chacun garde une clé de la caisse. Il faut les trois pour l'ouvrir. Ils confirment chaque clôture avec leur code.</p>
        ${sel('cbK1', 'Clé 1', '', R.K1 || def(5))}${sel('cbK2', 'Clé 2', '', R.K2 || def(6))}${sel('cbK3', 'Clé 3', '', R.K3 || def(7))}</section>`;
  },
  5: d => {
    const opt = (v, title, sub, icon) => { const on = d.mode === v; return `<button class="who" data-act="cMode" data-v="${v}" aria-pressed="${on}" style="${on ? 'border-color:var(--brand)' : ''}"><span class="ic" style="background:${on ? 'var(--brand)' : 'var(--surface-2)'};color:${on ? 'var(--brand-ink)' : 'var(--ink)'}">${ic(icon)}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`; };
    return `<h2>Comment démarre le groupe ?</h2>
      ${opt('new', 'Nouveau groupe', 'La caisse est vide. La première réunion commence à zéro.', 'plus')}
      ${opt('reprise', 'Groupe déjà en cours', 'Recopier le cahier : parts achetées, crédits, caisse sociale, argent en caisse.', 'book')}
      ${d.mode === 'reprise' ? repriseForm(d) : summaryNew(d)}`;
  }
};

function summaryNew(d) {
  const r = d.r, g = d.g, R = d.roles;
  const nm = id => esc((d.members.find(m => m.id === id) || {}).name || '—');
  const start = fromIso(r.cycleStart);
  const line = (k, v) => `<div class="row between small"><span class="muted">${k}</span><b style="text-align:right">${v}</b></div>`;
  return `<div class="receipt stack"><span class="label">Récapitulatif</span>
    ${line('Groupe', esc(g.name))}
    ${line('Lieu', [g.village, g.groupement && 'groupement ' + g.groupement, g.secteur, entiteLabel(g), g.province].filter(Boolean).map(esc).join(', '))}
    ${line('Membres', `${d.members.length} (${d.members.filter(m => m.sex === 'F').length} femmes)`)}
    ${line('Réunions', `${g.meetingDay}, ${+g.frequency === 14 ? 'toutes les 2 semaines' : 'chaque semaine'}`)}
    ${line('Présidence', nm(R.P))}${line('Trésorerie', nm(R.T))}${line('Porte-clés', [R.K1, R.K2, R.K3].map(nm).join(', '))}
    ${line('Part', `${fc(r.partValue)} · 1 à ${r.maxParts} par réunion`)}
    ${line('Caisse sociale', r.socialFee ? fc(r.socialFee) : 'aucune')}
    ${line('Crédit', `${r.rate} %/mois · ${r.maxMult} × l'épargne · ${r.maxMonths} mois max`)}
    ${line('Amendes', `absence ${fc(r.fineAbsent)} · retard ${fc(r.fineLate)}`)}
    ${line('Cycle 1', `${fdate(start)} → ${fdate(start + r.cycleMonths * 30 * DAY)}`)}
  </div>`;
}
function repriseForm(d) {
  const rep = d.rep, r = d.r;
  const inp = (id, v, w, label) => `<input id="${id}" class="input num" style="width:${w}px;min-height:40px;padding:6px 8px;text-align:right" inputmode="numeric" value="${esc(v || '')}" placeholder="0" aria-label="${label}">`;
  return `<div class="card stack"><h3>Les caisses aujourd'hui</h3>
      <div class="grid2">
        <div class="field"><label for="rsS">Caisse sociale (FC)</label><input id="rsS" class="input num" inputmode="numeric" value="${esc(rep.social)}" placeholder="0"></div>
        <div class="field"><label for="rsC">Caisse de crédit comptée (FC)</label><input id="rsC" class="input num" inputmode="numeric" value="${esc(rep.credit)}" placeholder="0"></div>
      </div>
      <p class="hint">Ouvrez la caisse et comptez l'argent devant tous. Le cycle a commencé le ${fdate(fromIso(r.cycleStart))} (étape 2).</p></div>
    <div class="card stack"><h3>Chaque membre, selon le cahier</h3>
      <p class="hint">Parts achetées depuis le début du cycle. Pour un crédit en cours : ce qui reste à payer, intérêts compris, et le nombre de mois restants.</p>
      <div class="tablewrap" style="box-shadow:none"><table><thead><tr><th>Membre</th><th class="r">Parts</th><th class="r">Reste du crédit</th><th class="r">Mois</th></tr></thead><tbody>
      ${d.members.map(m => { const x = rep.rows[m.id] || {}; return `<tr><td>${esc(m.name)}</td>
        <td class="r">${inp('rp-' + m.id, x.parts, 70, 'Parts de ' + esc(m.name))}</td>
        <td class="r">${inp('rl-' + m.id, x.loan, 110, 'Reste du crédit de ' + esc(m.name))}</td>
        <td class="r"><select id="rm-${m.id}" class="input" style="width:70px;min-height:40px;padding:6px" aria-label="Mois restants">${[1, 2, 3, 4, 5, 6].filter(n => n <= Math.max(r.maxMonths, 1)).map(n => `<option value="${n}" ${String(x.months || 1) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`; }).join('')}
      </tbody></table></div></div>`;
}

function readStep(step, d) {
  if (step === 1 && fval('cgN') !== null) Object.assign(d.g, { name: fval('cgN').trim(), ...readGeo('cg'),animId: fval('cgA') || '', meetingDay: fval('cgJ'), frequency: +fval('cgQ'), createdOn: fval('cgO') || d.g.createdOn });
  if (step === 2 && fval('crP') !== null) Object.assign(d.r, { partValue: +fval('crP'), maxParts: +fval('crX'), socialFee: +fval('crS'), cycleMonths: +fval('crC'), rate: +fval('crR'), maxMult: +fval('crM'), maxMonths: +fval('crD'), cycleStart: fval('crB') || d.r.cycleStart, fineAbsent: +fval('crF'), fineLate: +fval('crL'), penaltyRate: +fval('crPn') });
  if (step === 4 && fval('cbP') !== null) d.roles = { P: fval('cbP'), S: fval('cbS'), T: fval('cbT'), C1: fval('cbC1'), C2: fval('cbC2'), K1: fval('cbK1'), K2: fval('cbK2'), K3: fval('cbK3') };
  if (step === 5 && fval('rsS') !== null) {
    d.rep.social = fval('rsS'); d.rep.credit = fval('rsC');
    d.members.forEach(m => { if (fval('rp-' + m.id) !== null) d.rep.rows[m.id] = { parts: fval('rp-' + m.id), loan: fval('rl-' + m.id), months: fval('rm-' + m.id) }; });
  }
}
function validateStep(step, d) {
  if (step === 1) {
    if (d.g.name.length < 2) return 'Écrivez le nom du groupe';
    if (!d.g.province) return 'Choisissez la province';
    if (!d.g.territoire) return 'Choisissez le territoire ou la ville';
    if (!d.g.village) return 'Écrivez le village ou le quartier';
    if (d.from === 'org' && !d.g.animId) return 'Choisissez l\'animateur';
    if (K.data.avecs.some(a => a.name.toLowerCase() === d.g.name.toLowerCase() && a.village.toLowerCase() === d.g.village.toLowerCase())) return 'Une AVEC porte déjà ce nom dans ce village';
  }
  if (step === 2) {
    const end = fromIso(d.r.cycleStart) + d.r.cycleMonths * 30 * DAY;
    if (end <= Date.now()) return 'Avec cette date de début, le cycle serait déjà fini. Vérifiez la date.';
    if (fromIso(d.r.cycleStart) > Date.now() + 60 * DAY) return 'Le début du cycle est trop loin dans le futur';
  }
  if (step === 3) {
    if (d.members.length < 6) return `Il faut au moins 6 membres (vous en avez ${d.members.length})`;
    if (d.members.length > 35) return 'Une AVEC ne dépasse pas 35 membres : créez deux groupes';
    if (d.members.some(m => m.name.length < 3)) return 'Un nom est trop court. Écrivez le nom complet.';
    const seen = new Set();
    for (const m of d.members) { const k = m.name.toLowerCase(); if (seen.has(k)) return `« ${m.name} » est écrit deux fois`; seen.add(k); }
    const ids = new Set(d.members.map(m => m.id));
    if (Object.values(d.roles).some(id => !ids.has(id))) d.roles = {};
  }
  if (step === 4) {
    const R = d.roles, b = [R.P, R.S, R.T], k = [R.K1, R.K2, R.K3];
    if (new Set(b).size < 3) return 'Président, secrétaire et trésorier doivent être 3 personnes différentes';
    if (R.C1 === R.C2) return 'Les deux compteurs doivent être différents';
    if (new Set(k).size < 3) return 'Les 3 clés doivent aller à 3 personnes différentes';
    if (k.includes(R.T)) return 'Le trésorier garde la caisse : il ne peut pas garder une clé';
  }
  return '';
}

SCREENS['c.avec'] = p => {
  const d = cDraft(p);
  const u = K.session && K.session.userId ? me_user() : null;
  const back = d.from === 'org' ? 'o.home' : d.from === 'anim' ? 'n.home' : 'login';
  const step = d.step;
  const left = step > 1 ? `<button class="iconbtn" data-act="cPrev" aria-label="Étape précédente">${ic('back')}</button>` : `<button class="iconbtn" data-act="cQuit" data-to="${back}" aria-label="Quitter">${ic('x')}</button>`;
  const bar = `<div class="steps">${C_STEPS.map((s, i) => `<span class="stp ${i + 1 === step ? 'cur' : i + 1 < step ? 'done' : ''}"><i>${i + 1 < step ? '✓' : i + 1}</i>${s}</span>`).join('')}</div>`;
  return `<div class="shell">${topbar('Nouvelle AVEC', `Étape ${step} sur 5 · ${d.from === 'login' ? 'groupe autonome' : esc(orgOf(u.orgId).name)}`, left)}<main class="main">${bar}${C_RENDER[step](d, u)}
    <div class="sticky-foot">${step < 5 ? `<button class="btn primary block xl" data-act="cNext">Suivant : ${C_STEPS[step]} ${ic('chev')}</button>` : `<button class="btn primary block xl" data-act="cCreate">${ic('check')} Créer l'AVEC</button>`}</div>
  </main>${d.from === 'anim' ? tabbar(N_TABS, 'c.avec') : ''}</div>`;
};
function cAddFromForm(d) {
  const r = readMemberForm('mf');
  if (r.error) { App.toast(r.error); return false; }
  if (d.members.some(m => m.id !== d.editing && m.name.toLowerCase() === r.data.name.toLowerCase())) { App.toast(`« ${r.data.name} » est déjà inscrit`); return false; }
  if (d.editing) Object.assign(d.members.find(m => m.id === d.editing), r.data);
  else {
    if (d.members.length >= 35) { App.toast('Une AVEC ne dépasse pas 35 membres : créez deux groupes'); return false; }
    d.members.push(Object.assign({ id: 'n' + (++d.nextId) }, r.data));
  }
  d.editing = null;
  return true;
}
ACT.cAddMember = () => {
  const d = App.cdraft, was = d.editing;
  if (!cAddFromForm(d)) return;
  render(); App.toast(was ? 'Fiche modifiée' : 'Membre ajouté');
  const f = document.getElementById('mfName'); if (f && !was) f.focus();
};
ACT.cEditMember = x => {
  App.cdraft.editing = x.id; render();
  const f = document.getElementById('mfName'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'center' });
};
ACT.cCancelEdit = () => { App.cdraft.editing = null; render(); };
ACT.cDelMember = x => {
  const d = App.cdraft;
  d.members = d.members.filter(m => m.id !== x.id);
  Object.keys(d.roles).forEach(k => { if (d.roles[k] === x.id) delete d.roles[k]; });
  if (d.rep.rows) delete d.rep.rows[x.id];
  if (d.editing === x.id) d.editing = null;
  render(); App.toast('Membre retiré de la liste');
};
ACT.cImport = () => {
  const d = App.cdraft;
  let n = 0, skip = 0;
  parseMembers(fval('cmL') || '').forEach(m => {
    if (m.name.length < 3 || d.members.length >= 35 || d.members.some(x => x.name.toLowerCase() === m.name.toLowerCase())) { skip++; return; }
    d.members.push({ id: 'n' + (++d.nextId), name: m.name, sex: m.sex, phone: normPhone(m.phone) || '—', birthYear: null, activity: '', address: '' });
    n++;
  });
  render();
  App.toast(`${n} membre${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}${skip ? ` · ${skip} ligne${skip > 1 ? 's' : ''} ignorée${skip > 1 ? 's' : ''} (doublon ou nom trop court)` : ''}`);
};
ACT.cNext = () => {
  const d = App.cdraft;
  if (d.step === 3 && (fval('mfName') || '').trim() && !cAddFromForm(d)) return;
  readStep(d.step, d);
  const err = validateStep(d.step, d);
  if (err) return App.toast(err);
  d.step++; App.go('c.avec');
};
ACT.cPrev = () => { const d = App.cdraft; readStep(d.step, d); d.step = Math.max(1, d.step - 1); App.go('c.avec'); };
ACT.cQuit = x => { App.cdraft = null; App.go(x.to); };
ACT.cMode = x => { const d = App.cdraft; readStep(5, d); d.mode = x.v; render(); };

function importCahier(avec, d) {
  const pv = avec.settings.partValue, rep = d.rep;
  const rows = avec.members.map((m, i) => { const x = rep.rows[d.members[i].id] || {}; return { m, parts: parseAmt(x.parts), loan: parseAmt(x.loan), months: Math.max(1, +x.months || 1) }; });
  const social = parseAmt(rep.social), credit = parseAmt(rep.credit);
  if (!rows.some(x => x.parts || x.loan) && !social && !credit) return;
  const pres = avec.members.find(m => m.role === 'president'), by = pres.id;
  const meet = { id: avec.id + '-reprise', n: 0, cycle: 1, kind: 'reprise', date: Date.now(), status: 'open', presence: {}, openedBy: by, stepDone: 7, openExpected: 0, openCount: 0, synced: false };
  avec.members.forEach(m => meet.presence[m.id] = 'P');
  avec.meetings.push(meet);
  rows.forEach(x => { if (x.parts) appendTx(avec, { meetingId: meet.id, type: 'EPARGNE', memberId: x.m.id, parts: x.parts, amount: x.parts * pv, note: 'Parts reprises du cahier', by }); });
  rows.forEach(x => { if (x.loan) appendTx(avec, { meetingId: meet.id, type: 'CREDIT', memberId: x.m.id, amount: x.loan, months: x.months, rate: 0, note: 'Crédit repris du cahier (reste à payer)', by }); });
  if (social) appendTx(avec, { meetingId: meet.id, type: 'REPORT_IN', ref: 'social', amount: social, note: 'Caisse sociale reprise du cahier', by });
  const st = stats(avec);
  const diff = credit - st.loanFund;   // > 0 : bénéfices déjà gagnés ; < 0 : argent manquant
  if (diff > 0) appendTx(avec, { meetingId: meet.id, type: 'REPORT_IN', ref: 'credit', amount: diff, note: 'Bénéfices déjà gagnés avant Akiba (intérêts, amendes)', by });
  if (diff < 0) appendTx(avec, { meetingId: meet.id, type: 'REPORT_OUT', ref: 'credit', amount: -diff, note: 'Argent manquant constaté à la reprise du cahier', by });
  const fin = stats(avec).cash;
  Object.assign(meet, {
    status: 'closed', closedAt: Date.now(), closeExpected: diff < 0 ? st.cash : fin, closeCount: fin,
    note: diff < 0 ? `Il manque ${fc(-diff)} par rapport au cahier` : '',
    validators: keyHolders(avec).slice(0, 3).map(m => m.id), sealSeq: avec.tx.length, seal: avec.tx[avec.tx.length - 1].hash
  });
}

ACT.cCreate = () => {
  const d = App.cdraft; readStep(5, d);
  if (d.mode === 'reprise' && String(d.rep.credit || '').trim() === '') return App.toast('Écrivez l\'argent compté dans la caisse de crédit (0 si vide)');
  const u = K.session && K.session.userId ? me_user() : null;
  const r = d.r, g = d.g, R = d.roles;
  const id = 'avec-' + uid();
  const start = fromIso(r.cycleStart);
  const members = d.members.map(m => ({
    id: id + '-' + m.id, name: m.name, sex: m.sex, phone: m.phone || '—', pin: newPin(), joined: Date.now(),
    birthYear: m.birthYear || null, activity: m.activity || '', address: m.address || '',
    role: m.id === R.P ? 'president' : m.id === R.S ? 'secretaire' : m.id === R.T ? 'tresorier' : (m.id === R.C1 || m.id === R.C2) ? 'compteur' : 'membre',
    key: [R.K1, R.K2, R.K3].includes(m.id)
  }));
  const avec = {
    id, name: g.name, village: g.village, territoire: g.territoire || '—',
    province: g.province, entite: g.entite, secteur: g.secteur, groupement: g.groupement,
    orgId: d.from === 'login' ? null : u.orgId, animId: d.from === 'org' ? g.animId : d.from === 'anim' ? u.id : null,
    createdAt: fromIso(g.createdOn), cycle: { n: 1, start, end: start + r.cycleMonths * 30 * DAY }, cycles: [],
    settings: { partValue: r.partValue, maxParts: r.maxParts, socialFee: r.socialFee, rate: r.rate, maxMult: r.maxMult, maxMonths: r.maxMonths, fineAbsent: r.fineAbsent, fineLate: r.fineLate, penaltyRate: r.penaltyRate != null ? r.penaltyRate : r.rate, cycleMonths: r.cycleMonths, meetingDay: g.meetingDay, frequency: g.frequency },
    members, meetings: [], tx: [], visits: [], lastSync: 0
  };
  const rescue = Array.from({ length: 6 }, rescueCode);
  Object.assign(avec, {
    status: d.from === 'anim' ? 'pending' : 'active', requestCode: randCode(6), submittedAt: Date.now(),
    rescue: rescue.map(c => ({ h: hashCode(c), used: false })), security: []
  });
  secLog(avec, 'AVEC créée', null, d.from === 'anim' ? 'par l\'animateur, à valider' : d.from === 'org' ? 'par l\'organisation' : 'groupe autonome');
  if (d.mode === 'reprise') importCahier(avec, d);
  K.data.avecs.push(avec);
  if (d.from === 'login') K.session = { kind: 'avec', avecId: id, memberId: members.find(m => m.role === 'president').id };
  DB.save();
  App.cdraft = { done: true, from: d.from, avecId: id, rescue, codes: members.map(m => ({ name: m.name, pin: m.pin, label: roleLabel(m) })) };
  App.go('c.codes');
};

SCREENS['c.codes'] = () => {
  const d = App.cdraft;
  if (!d || !d.done) return SCREENS.login();
  const avec = avecById(d.avecId);
  const next = d.from === 'login' ? 'a.home' : d.from === 'org' ? 'o.home' : 'n.home';
  return `<div class="shell">${topbar(avec.name, 'AVEC créée')}<main class="main">
    <div class="alert good"><span style="width:26px;flex:none">${ic('check')}</span><div><b>${esc(avec.name)} est prête</b><span class="small">${avec.members.length} membres · cycle 1 jusqu'au ${fdate(avec.cycle.end)}${avec.meetings.length ? ' · cahier repris et scellé' : ''}</span></div></div>
    <div><h2>Les codes secrets</h2><p class="muted">Recopiez chaque code sur un petit papier plié et donnez-le en main propre. Cette liste ne sera plus jamais affichée. Chacun pourra changer son code dans « Mon carnet ».</p></div>
    <div class="list">${d.codes.map(c => `<div class="li"><span class="grow"><b>${esc(c.name)}</b><span class="small muted">${c.label}</span></span><span class="num" style="font-family:var(--f-display);font-size:1.4rem;letter-spacing:.15em">${c.pin}</span></div>`).join('')}</div>
    <div><h2>La carte de secours</h2><p class="muted">Si quelqu'un perd son code secret, un de ces codes permet de le débloquer. Recopiez la carte sur papier et gardez-la dans la caisse fermée à clé.</p></div>
    ${rescueCardHtml(avec, d.rescue || [])}
    ${avec.status === 'pending' ? `<div class="alert warn">${icSpan('clip')}<div><b>À faire valider par l'organisation</b><span class="small">Le groupe pourra tenir sa première réunion après la validation. Envoyez les données dès que vous avez du réseau, ou appelez l'organisation avec le code de demande <b class="num">${fmtReq(avec.requestCode)}</b>.</span></div></div>` : ''}
    <button class="btn primary block xl" data-act="cDone" data-to="${next}">${ic('check')} J'ai distribué les codes</button>
  </main></div>`;
};
ACT.cDone = x => { App.cdraft = null; App.go(x.to); App.toast('Chaque membre peut maintenant se connecter avec son code'); };
