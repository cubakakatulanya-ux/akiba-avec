/* Akiba AVEC — reçus individuels imprimés après chaque réunion.
   Un ticket de 32 signes (papier 58 mm) : épargne du jour et cumul, caisse sociale, amendes,
   crédit accordé, remboursé et restant, plus le sceau de la réunion pour vérification.
   Trois chemins d'impression, essayés dans cet ordre :
     1. window.AkibaPOS.print({ text, escpos, copies })  → terminal POS Android (imprimante intégrée) ;
     2. rawbt:  → application RawBT, pour une imprimante Bluetooth ou un POS compatible ;
     3. partage du texte (WhatsApp, SMS) ou impression papier, quand il n'y a pas d'imprimante.
   Tout fonctionne hors réseau. */
'use strict';

const RECU_W = 32;                                                   // signes par ligne (papier 58 mm)
/* les imprimantes thermiques bon marché ne connaissent pas les accents : on les enlève du ticket */
const noAcc = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[«»]/g, '"').replace(/[’‘]/g, "'").replace(/[—–]/g, '-').replace(/[·•]/g, '-').replace(/ | /g, ' ');
const rLine = (l, v, w = RECU_W) => { const b = noAcc(v); const a = noAcc(l).slice(0, Math.max(0, w - b.length - 1)); return a + ' '.repeat(Math.max(1, w - a.length - b.length)) + b; };
const rCenter = (s, w = RECU_W) => { const t = noAcc(s).slice(0, w); return ' '.repeat(Math.max(0, Math.floor((w - t.length) / 2))) + t; };
const rRule = (c = '-', w = RECU_W) => c.repeat(w);

/* ce que le membre a fait à cette réunion, et où il en est */
function memberReceipt(avec, m, x) {
  const an = annulledSet(avec);
  const tx = avec.tx.filter(t => t.meetingId === m.id && t.memberId === x.id && t.type !== 'ANNUL' && !an.has(t.id));
  const s = k => tx.filter(t => t.type === k).reduce((a, t) => a + t.amount, 0);
  const parts = tx.filter(t => t.type === 'EPARGNE').reduce((a, t) => a + (t.parts || 0), 0);
  const st = stats(avec, { cycle: m.cycle || 1 });
  const d = st.mem[x.id] || { parts: 0, savings: 0, fineDebt: 0, loans: [] };
  const loan = d.loans.filter(l => l.status !== 'solde').sort((a, b) => b.ts - a.ts)[0] || null;
  return {
    parts, epargne: s('EPARGNE'), social: s('SOCIAL'), amende: s('AMENDE'), dette: s('DETTE'),
    credit: s('CREDIT'), remb: s('REMB'), aide: s('AIDE'), depart: s('DEPART'), partage: s('PARTAGE'),
    cumulParts: d.parts, cumulEpargne: d.savings, resteAmende: Math.max(0, d.fineDebt),
    loan, presence: (m.presence || {})[x.id] || '—', valeur: Math.round(d.parts * st.shareValue)
  };
}

/* le ticket, en texte simple : c'est lui qu'on imprime ou qu'on partage */
function receiptText(avec, m, x, r) {
  r = r || memberReceipt(avec, m, x);
  const L = [];
  L.push(rCenter('AKIBA - RECU DE REUNION'));
  L.push(rCenter(avec.name));
  if (avec.village) L.push(rCenter(avec.village));
  L.push(rCenter(`Reunion n${m.n} - ${fdate(m.date)}`));
  L.push(rRule('='));
  L.push(rLine('Membre', x.name.slice(0, 22)));
  L.push(rLine('Role', roleLabel(x)));
  L.push(rLine('Presence', { P: 'Present', R: 'En retard', A: 'Absent' }[r.presence] || '-'));
  L.push(rRule());
  L.push('EPARGNE');
  L.push(rLine(` ${r.parts} part(s) x ${grp(avec.settings.partValue)}`, fc(r.epargne)));
  L.push(rLine(' Cumul du cycle', fc(r.cumulEpargne)));
  L.push(rLine(` Parts du cycle`, String(r.cumulParts)));
  if (r.social) L.push(rLine('CAISSE SOCIALE', fc(r.social)));
  if (r.amende || r.dette || r.resteAmende) {
    L.push('AMENDES');
    if (r.amende) L.push(rLine(' Payee ce jour', fc(r.amende)));
    if (r.dette) L.push(rLine(' Notee comme dette', fc(r.dette)));
    L.push(rLine(' Reste du', fc(r.resteAmende)));
  }
  if (r.credit || r.remb || r.loan) {
    L.push('CREDIT');
    if (r.credit) L.push(rLine(' Accorde ce jour', fc(r.credit)));
    if (r.remb) L.push(rLine(' Rembourse ce jour', fc(r.remb)));
    if (r.loan) {
      L.push(rLine(' Reste a rembourser', fc(r.loan.remaining)));
      L.push(rLine(' Echeance', fdate(r.loan.dueDate)));
      if (r.loan.status === 'retard') L.push(rLine(' EN RETARD', `${r.loan.daysLate} j`));
    } else L.push(' Aucun credit en cours');
  }
  if (r.aide) L.push(rLine('AIDE SOCIALE RECUE', fc(r.aide)));
  if (r.partage) L.push(rLine('PART DU PARTAGE', fc(r.partage)));
  if (r.depart) L.push(rLine('EPARGNE RENDUE (DEPART)', fc(r.depart)));
  L.push(rRule());
  L.push(rLine('Valeur des parts', fc(r.valeur)));
  L.push(rRule());
  L.push('Sceau de la reunion :');
  L.push(noAcc((m.seal || '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()));
  if ((m.validators || []).length) L.push('Cles : ' + noAcc(m.validators.map(id => (memberOf(avec, id) || {}).name || '').filter(Boolean).map(n => n.split(' ')[0]).join(', ')).slice(0, RECU_W - 7));
  L.push(rRule());
  L.push(rCenter('Akiba - Entreprise Sociale'));
  L.push(rCenter('Ubora - ' + UBORA.telShow));
  return L.join('\n');
}

/* commandes ESC/POS : init, titre en gras, texte, avance papier, coupe */
function escposBytes(text) {
  const out = [];
  const push = (...b) => b.forEach(v => out.push(v));
  push(0x1b, 0x40);                                                  // ESC @ : initialiser
  push(0x1b, 0x74, 0x00);                                            // page de codes 437
  push(0x1b, 0x61, 0x00);                                            // aligner a gauche
  noAcc(text).split('\n').forEach(l => { for (const c of l) out.push(c.charCodeAt(0) & 0xff); out.push(0x0a); });
  push(0x0a, 0x0a, 0x0a);
  push(0x1d, 0x56, 0x00);                                            // GS V 0 : couper le papier
  return new Uint8Array(out);
}
const b64Bytes = u8 => { let s = ''; u8.forEach(b => s += String.fromCharCode(b)); return btoa(s); };

/* envoi à l'imprimante : terminal POS d'abord, puis RawBT */
function posAvailable() { return !!(window.AkibaPOS && typeof window.AkibaPOS.print === 'function'); }
async function printReceipt(text, copies = 1) {
  if (posAvailable()) {                                              // application Android : imprimante integree du terminal
    try { await window.AkibaPOS.print({ text: noAcc(text), escpos: b64Bytes(escposBytes(text)), copies }); return 'pos'; }
    catch (e) { /* on essaie la voie suivante */ }
  }
  try { window.location.href = 'rawbt:' + encodeURIComponent(noAcc(text)); return 'rawbt'; } catch (e) { return ''; }
}

/* ---------- écrans ---------- */
const recuMeeting = p => { const { avec } = cur(); return avec.meetings.find(x => x.id === p.id) || avec.meetings.filter(m => m.status === 'closed').slice(-1)[0]; };

SCREENS['a.receipts'] = p => {
  const { avec, st } = cur();
  const m = recuMeeting(p);
  if (!m) return SCREENS['a.home']();
  const here = activeM(avec).filter(x => (m.presence || {})[x.id] && (m.presence || {})[x.id] !== 'A');
  const rows = here.map(x => ({ x, r: memberReceipt(avec, m, x) }));
  return `<div class="shell">${topbar('Reçus des membres', `Réunion n°${m.n} · ${fdate(m.date)}`, backBtn('a.receipt', `data-id="${m.id}"`), syncPill(avec))}<main class="main">
    <p class="muted">Un reçu par membre présent : épargne du jour, crédit, amendes, et le sceau de la réunion. Imprimez sur le terminal, ou partagez le texte par WhatsApp.</p>
    ${posAvailable() ? '' : '<div class="tip row" style="align-items:flex-start">' + icSpan('alert') + '<div><b>Aucune imprimante détectée</b><span class="small">Sur un terminal POS, ouvrez Akiba depuis l\'application Android. Sinon, installez RawBT pour une imprimante Bluetooth, ou partagez le reçu.</span></div></div>'}
    <div class="list">${rows.map(({ x, r }) => `<button class="li" data-act="recuSheet" data-m="${m.id}" data-id="${x.id}">${avatar(x)}
      <span class="grow"><b>${esc(x.name)}</b><span class="small muted">Épargne ${fc(r.epargne)}${r.remb ? ' · remb. ' + fc(r.remb) : ''}${r.credit ? ' · crédit ' + fc(r.credit) : ''}</span></span>${ic('chev')}</button>`).join('') || '<div class="li muted">Aucun membre présent à cette réunion</div>'}</div>
    ${rows.length ? `<button class="btn primary block xl" data-act="recuPrintAll" data-m="${m.id}">${ic('clip')} Imprimer les ${rows.length} reçus</button>` : ''}
  </main></div>`;
};

ACT.recuSheet = d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m), x = memberOf(avec, d.id);
  if (!m || !x) return;
  const text = receiptText(avec, m, x);
  App.openSheet(`<h2>Reçu de ${esc(x.name.split(' ')[0])}</h2>
    <pre class="ticket">${esc(text)}</pre>
    <div class="grid2"><button class="btn brand" data-act="recuPrint" data-m="${m.id}" data-id="${x.id}">${ic('clip')} Imprimer</button>
      <button class="btn ghost" data-act="recuShare" data-m="${m.id}" data-id="${x.id}">${ic('chat')} Partager</button></div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.recuPrint = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m), x = memberOf(avec, d.id);
  if (!m || !x) return;
  const how = await printReceipt(receiptText(avec, m, x));
  App.toast(how === 'pos' ? 'Reçu envoyé à l\'imprimante' : how === 'rawbt' ? 'Reçu envoyé à l\'application d\'impression' : 'Aucune imprimante trouvée');
};
ACT.recuPrintAll = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m);
  if (!m) return;
  const here = activeM(avec).filter(x => (m.presence || {})[x.id] && (m.presence || {})[x.id] !== 'A');
  if (!posAvailable()) return App.toast('Imprimez un reçu à la fois : l\'application d\'impression ne prend qu\'un ticket');
  for (const x of here) { await printReceipt(receiptText(avec, m, x)); await new Promise(r => setTimeout(r, 400)); }
  App.toast(`${here.length} reçus envoyés à l'imprimante`);
};
ACT.recuShare = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m), x = memberOf(avec, d.id);
  if (!m || !x) return;
  const text = receiptText(avec, m, x);
  try {
    if (navigator.share) await navigator.share({ title: `Reçu ${avec.name} n°${m.n}`, text });
    else { await navigator.clipboard.writeText(text); App.toast('Reçu copié : collez-le dans WhatsApp'); }
  } catch (e) { /* partage annulé */ }
};
