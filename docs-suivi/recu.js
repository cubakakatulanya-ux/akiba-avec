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
/* une phrase libre ne tient pas sur trente-deux signes : on la replie sur plusieurs lignes,
   en coupant entre les mots — jamais au milieu d'un montant ou d'un nom. */
/* Dernière garantie avant le papier : une ligne trop longue ne se voit pas à l'écran, elle se
   coupe en silence sur l'imprimante — et c'est un montant tronqué. Tout ticket passe donc par
   ici : accents retirés, lignes ramenées à la largeur de la bande. Aucune donnée, si longue
   soit-elle, ne peut déborder. */
const rTicket = lignes => lignes.map(l => noAcc(String(l)).slice(0, RECU_W)).join(String.fromCharCode(10));
function rWrap(texte, w = RECU_W) {
  const mots = noAcc(String(texte || '')).split(/s+/).filter(Boolean);
  const out = []; let ligne = '';
  for (const mot of mots) {
    const m2 = mot.length > w ? mot.slice(0, w) : mot;
    if (!ligne) ligne = m2;
    else if ((ligne + ' ' + m2).length <= w) ligne += ' ' + m2;
    else { out.push(ligne); ligne = m2; }
  }
  if (ligne) out.push(ligne);
  return out;
}

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

/* Le papier thermique coûte cher et se trouve mal : un reçu de vingt-six lignes, c'est dix
   centimètres de bande par membre, deux mètres par réunion, cent mètres dans un cycle.
   Le reçu court garde tout ce qui sert de preuve — qui, quelle réunion, ce qui a bougé
   aujourd'hui, le cumul, le sceau — et laisse tomber ce que le groupe sait déjà : son village,
   le rôle du membre, le nom de l'application, et les trois traits de séparation.
   Le reçu détaillé reste disponible d'un toucher quand un membre conteste. */
const RECU_COURT_STORE = 'kitabu.recuCourt';
const recuCourt = () => { try { return localStorage.getItem(RECU_COURT_STORE) !== '0'; } catch (e) { return true; } };
const recuCourtSet = v => { try { localStorage.setItem(RECU_COURT_STORE, v ? '1' : '0'); } catch (e) { /* rien */ } };
ACT.recuFormat = () => { recuCourtSet(!recuCourt()); render(); App.toast(recuCourt() ? 'Reçus courts : moins de papier' : 'Reçus détaillés'); };

/* le ticket, en texte simple : c'est lui qu'on imprime ou qu'on partage */
function receiptText(avec, m, x, r, court) {
  r = r || memberReceipt(avec, m, x);
  if (court === undefined) court = recuCourt();
  if (court) return receiptCourt(avec, m, x, r);
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
  if (typeof recuRef === 'function') {
    L.push(rLine('Ref a verifier', recuRef(avec, m, x, r)));
    L.push('A verifier dans Akiba :');
    L.push('Recus > Verifier un recu');
  }
  L.push('Sceau de la reunion :');
  L.push(noAcc((m.seal || '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()));
  if ((m.validators || []).length) L.push('Cles : ' + noAcc(m.validators.map(id => (memberOf(avec, id) || {}).name || '').filter(Boolean).map(n => n.split(' ')[0]).join(', ')).slice(0, RECU_W - 7));
  L.push(rRule());
  L.push(rCenter('Akiba - Entreprise Sociale'));
  L.push(rCenter('Ubora - ' + UBORA.telShow));
  return L.join('\n');
}

/* Le reçu court : douze lignes au lieu de vingt-six. Rien de ce qui prouve n'a disparu —
   le nom, la réunion, ce qui a bougé aujourd'hui, le cumul du cycle et le sceau y sont tous.
   Ce qui part, c'est ce que le groupe sait déjà par cœur. */
function receiptCourt(avec, m, x, r) {
  const L = [];
  L.push(rCenter(noAcc(avec.name)));
  L.push(rCenter(`Reunion n${m.n} - ${fdate(m.date)}`));
  L.push(rRule());
  L.push(noAcc(x.name).slice(0, RECU_W));
  const mouvements = [];
  if (r.parts) mouvements.push(rLine(`Epargne ${r.parts} part(s)`, fc(r.epargne)));
  if (r.social) mouvements.push(rLine('Caisse sociale', fc(r.social)));
  if (r.remb) mouvements.push(rLine('Rembourse', fc(r.remb)));
  if (r.credit) mouvements.push(rLine('Credit recu', fc(r.credit)));
  if (r.amende) mouvements.push(rLine('Amende payee', fc(r.amende)));
  if (r.dette) mouvements.push(rLine('Amende notee', fc(r.dette)));
  if (r.aide) mouvements.push(rLine('Aide sociale', fc(r.aide)));
  if (r.partage) mouvements.push(rLine('Part du partage', fc(r.partage)));
  if (r.depart) mouvements.push(rLine('Epargne rendue', fc(r.depart)));
  if (!mouvements.length) mouvements.push(rLine('Presence', { P: 'Present', R: 'En retard', A: 'Absent' }[r.presence] || '-'));
  mouvements.forEach(l => L.push(l));
  L.push(rRule());
  L.push(rLine(`Cumul ${r.cumulParts} parts`, fc(r.cumulEpargne)));
  if (r.loan) L.push(rLine(r.loan.status === 'retard' ? `RETARD ${r.loan.daysLate} j, reste` : 'Credit reste', fc(r.loan.remaining)));
  if (r.resteAmende) L.push(rLine('Amendes dues', fc(r.resteAmende)));
  /* une seule ligne, et elle remplace le sceau : elle le contient, et lie en plus ce membre
     à sa propre ligne du journal. C'est elle qui tranche quand un reçu est contesté. */
  L.push(rLine('Ref a verifier', typeof recuRef === 'function' ? recuRef(avec, m, x, r) : noAcc((m.seal || '').slice(0, 8))));
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
  push(0x0a, 0x0a);                                                  // deux lignes : le couteau est au-dessus de la tête d'impression, pas davantage
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
    ${rows.length ? `<button class="btn primary block xl" data-act="recuPrintAll" data-m="${m.id}">${ic('clip')} Imprimer les ${rows.length} reçus</button>
      <!-- le papier thermique se trouve mal et coûte cher : le format est un vrai choix, pas un réglage caché -->
      <button class="li" data-act="recuFormat" style="border:1px solid var(--line);border-radius:var(--r)">
        ${rowIc('clip')}<span class="grow"><b>${recuCourt() ? 'Reçus courts' : 'Reçus détaillés'}</b>
          <span class="small muted">${recuCourt()
            ? 'Le nécessaire et le sceau, sur ' + Math.round(receiptText(avec, m, rows[0].x, rows[0].r, true).split(String.fromCharCode(10)).length * 0.4) + ' cm environ. Touchez pour le détail complet.'
            : 'Tout le détail, sur ' + Math.round(receiptText(avec, m, rows[0].x, rows[0].r, false).split(String.fromCharCode(10)).length * 0.4) + ' cm environ. Touchez pour économiser le papier.'}</span></span>
        <span class="chip ${recuCourt() ? 'good' : 'warn'}">${recuCourt() ? 'économe' : 'complet'}</span></button>
      <button class="btn ghost block" data-act="recuVerifier">${ic('shield')} Vérifier un reçu contesté</button>` : ''}
  </main></div>`;
};

ACT.recuSheet = d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m), x = memberOf(avec, d.id);
  if (!m || !x) return;
  const text = receiptText(avec, m, x);
  App.openSheet(`<h2>Reçu de ${esc(x.name.split(' ')[0])}</h2>
    <pre class="ticket">${esc(text)}</pre>
    <!-- le QR dit la même chose que la référence, en se scannant : il coûte du papier, donc il reste ici -->
    <div style="text-align:center"><img id="recuQrImg" data-qr="${esc(recuQrTexte(avec, m, x))}" alt="QR du reçu" hidden style="width:190px;max-width:100%;border-radius:12px;background:#fff;padding:8px"></div>
    <div class="grid2"><button class="btn brand" data-act="recuPrint" data-m="${m.id}" data-id="${x.id}">${ic('clip')} Imprimer</button>
      <button class="btn ghost" data-act="recuShare" data-m="${m.id}" data-id="${x.id}">${ic('chat')} Partager</button></div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
  setTimeout(recuQrDessiner, 60);
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

/* ---------- journal d'une période, imprimé sur le même papier ---------- */
const jDay = ts => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
const J_SHORT = { EPARGNE: 'Epargne', SOCIAL: 'Sociale', REMB: 'Rembours.', AMENDE: 'Amende', DETTE: 'Amende due', CREDIT: 'Credit', AIDE: 'Aide', PARTAGE: 'Partage', DEPART: 'Depart', ANNUL: 'Annulation', REPORT_IN: 'Report entree', REPORT_OUT: 'Report sortie', EXT_IN: 'Credit exterieur', EXT_FEE: 'Frais exterieur', EXT_GUAR: 'Garantie', EXT_REPAY: 'Remb. preteur' };
function journalRows(avec, from, to) {
  const an = annulledSet(avec);
  return avec.tx.filter(t => t.ts >= from && t.ts <= to).map(t => Object.assign({ annulled: an.has(t.id) }, t));
}
function journalText(avec, from, to) {
  const rows = journalRows(avec, from, to), ch = chainOf(avec);
  const L = [];
  L.push(rCenter('AKIBA - JOURNAL'));
  L.push(rCenter(avec.name));
  L.push(rCenter(`Du ${jDay(from)} au ${jDay(to)}`));
  L.push(rRule('='));
  if (!rows.length) L.push('Aucune ecriture sur cette periode.');
  let day = '';
  rows.forEach(t => {
    const d = jDay(t.ts);
    if (d !== day) { if (day) L.push(rRule()); day = d; L.push(noAcc(new Date(t.ts).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })).toUpperCase().slice(0, RECU_W)); }
    const inFlow = TX[t.type] && TX[t.type].in;
    const money = (t.type === 'ANNUL' || t.type === 'DETTE' ? '  ' : inFlow ? '+ ' : '- ') + grp(t.amount);
    L.push(rLine(`#${t.seq} ${J_SHORT[t.type] || t.type}`, money));
    const who = t.memberId ? (memberOf(avec, t.memberId) || {}).name : (t.note || '');
    if (who) L.push('   ' + noAcc(who).slice(0, RECU_W - 3));
    if (t.annulled) L.push('   (annulee)');
  });
  const sum = k => rows.filter(t => t.type === k && !t.annulled).reduce((a, t) => a + t.amount, 0);
  const kinds = [...new Set(rows.filter(t => !t.annulled && t.type !== 'ANNUL').map(t => t.type))];
  L.push(rRule('='));
  L.push('TOTAUX DE LA PERIODE');
  kinds.forEach(k => L.push(rLine(' ' + (J_SHORT[k] || k), fc(sum(k)))));
  const entre = kinds.filter(k => TX[k] && TX[k].in).reduce((a, k) => a + sum(k), 0);
  const sorti = kinds.filter(k => TX[k] && !TX[k].in).reduce((a, k) => a + sum(k), 0);
  L.push(rRule());
  L.push(rLine('Entre dans la caisse', fc(entre)));
  L.push(rLine('Sorti de la caisse', fc(sorti)));
  L.push(rLine('Mouvement net', fc(entre - sorti)));
  const st = stats(avec);
  L.push(rLine('Caisse aujourd hui', fc(st.cash)));
  L.push(rRule());
  L.push(rLine('Ecritures', String(rows.length)));
  L.push('Journal : ' + (ch.ok ? 'intact (' + ch.n + ' ecritures)' : 'ALTERE'));
  const last = rows[rows.length - 1];
  if (last && last.hash) { L.push('Derniere empreinte :'); L.push(noAcc(last.hash.slice(0, 16).replace(/(.{4})/g, '$1 ').trim())); }
  L.push(rRule());
  L.push(rCenter('Akiba - Ubora - ' + UBORA.telShow));
  return L.join('\n');
}
/* Le journal d'une seule réunion : toutes les écritures de ce jour-là, dans l'ordre où elles
   ont été faites, avec les totaux, les trois clés et le sceau. C'est la pièce que le bureau
   garde dans la caisse et que l'animateur relit à sa visite — le procès-verbal de la séance,
   écrit par le logiciel plutôt qu'à la main. */
function journalReunionText(avec, m) {
  const an = annulledSet(avec);
  const rows = avec.tx.filter(t => t.meetingId === m.id).map(t => Object.assign({ annulled: an.has(t.id) }, t));
  const L = [];
  L.push(rCenter('AKIBA - JOURNAL DE SEANCE'));
  L.push(rCenter(noAcc(avec.name)));
  L.push(rCenter(`Cycle ${m.cycle || avec.cycle.n} - seance n${m.n}`));
  L.push(rCenter(noAcc(fdate(m.date))));
  L.push(rRule('='));
  const presents = activeM(avec).filter(x => (m.presence || {})[x.id] && (m.presence || {})[x.id] !== 'A').length;
  const absents = activeM(avec).filter(x => (m.presence || {})[x.id] === 'A').length;
  const retards = activeM(avec).filter(x => (m.presence || {})[x.id] === 'R').length;
  L.push(rLine('Presents', String(presents)));
  if (retards) L.push(rLine(' dont en retard', String(retards)));
  L.push(rLine('Absents', String(absents)));
  L.push(rRule());
  if (!rows.length) L.push('Aucune ecriture pour cette seance.');
  rows.forEach(t => {
    const inFlow = TX[t.type] && TX[t.type].in;
    const money = (t.type === 'ANNUL' || t.type === 'DETTE' ? '  ' : inFlow ? '+ ' : '- ') + grp(t.amount);
    L.push(rLine(`#${t.seq} ${J_SHORT[t.type] || t.type}`, money));
    const who = t.memberId ? (memberOf(avec, t.memberId) || {}).name : (t.note || '');
    if (who) L.push('   ' + noAcc(who).slice(0, RECU_W - 3));
    if (t.annulled) L.push('   (annulee)');
  });
  const sum = k => rows.filter(t => t.type === k && !t.annulled).reduce((a, t) => a + t.amount, 0);
  const kinds = [...new Set(rows.filter(t => !t.annulled && t.type !== 'ANNUL').map(t => t.type))];
  L.push(rRule('='));
  L.push('TOTAUX DE LA SEANCE');
  kinds.forEach(k => L.push(rLine(' ' + (J_SHORT[k] || k), fc(sum(k)))));
  const entre = kinds.filter(k => TX[k] && TX[k].in).reduce((a, k) => a + sum(k), 0);
  const sorti = kinds.filter(k => TX[k] && !TX[k].in).reduce((a, k) => a + sum(k), 0);
  L.push(rRule());
  L.push(rLine('Entre dans la caisse', fc(entre)));
  L.push(rLine('Sorti de la caisse', fc(sorti)));
  if (m.openCount != null) L.push(rLine('Ouverture', fc(m.openCount)));
  if (m.closeCount != null) {
    L.push(rLine('Compte a la cloture', fc(m.closeCount)));
    const ecart = (m.closeCount || 0) - (m.closeExpected || 0);
    L.push(rLine(ecart === 0 ? 'Caisse' : 'ECART', ecart === 0 ? 'juste' : fc(ecart)));
    if (ecart !== 0 && m.note) { L.push('Explication :'); rWrap(m.note).forEach(l => L.push(l)); }
  }
  L.push(rRule());
  if ((m.validators || []).length) {
    L.push('Cles : ' + noAcc(m.validators.map(id => (memberOf(avec, id) || {}).name || '').filter(Boolean).map(n => n.split(' ')[0]).join(', ')).slice(0, RECU_W - 7));
  }
  (m.keySubs || []).forEach(k => {
    const a0 = memberOf(avec, k.absent), s0 = memberOf(avec, k.par);
    if (a0 && s0) L.push(noAcc(`${s0.name.split(' ')[0]} a remplace ${a0.name.split(' ')[0]}, absent`).slice(0, RECU_W));
  });
  L.push(rLine('Ecritures', String(rows.length)));
  if (m.seal) { L.push('Sceau de la seance :'); L.push(noAcc(m.seal.slice(0, 16).replace(/(.{4})/g, '$1 ').trim())); }
  /* l'etiquette de classement : elle se lit sans deplier le ticket, une fois dans la boite */
  L.push(rRule('='));
  L.push(rCenter(noAcc(`A CLASSER : C${m.cycle || avec.cycle.n} - S${String(m.n).padStart(2, '0')}`)));
  L.push(rCenter(noAcc(avec.name).slice(0, RECU_W)));
  return rTicket(L);
}
ACT.journalReunion = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m) || recuMeeting(d);
  if (!m) return App.toast('Réunion introuvable');
  const how = await printReceipt(journalReunionText(avec, m));
  App.toast(how === 'pos' ? 'Journal de la séance envoyé à l\x27imprimante' : how === 'rawbt' ? 'Journal envoyé à l\x27application d\x27impression' : 'Aucune imprimante trouvée');
};
ACT.journalReunionVoir = d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m) || recuMeeting(d);
  if (!m) return;
  const t = journalReunionText(avec, m);
  App.openSheet(`<h2>Journal de la réunion n°${m.n}</h2>
    <p class="muted">Toutes les écritures de la séance, dans l'ordre, avec les totaux, les clés et le sceau. Environ ${Math.round(t.split(String.fromCharCode(10)).length * 0.4)} cm de papier.</p>
    <div class="alert">${icSpan('shield')}<div><b>Comment le classer</b>
      <span class="small">Le bas du ticket porte une étiquette lisible sans le déplier : <b class="mono">C${m.cycle || avec.cycle.n} - S${String(m.n).padStart(2, '0')}</b>.
        Rangez-les <b>dans l'ordre des numéros</b>, dans une pochette gardée <b>à l'intérieur de la caisse</b>, avec les trois clés.
        Une pochette par cycle. Si le téléphone disparaît, ces papiers remis bout à bout redonnent tout le cahier.</span></div></div>
    <pre class="ticket">${esc(t)}</pre>
    <div class="grid2"><button class="btn brand" data-act="journalReunion" data-m="${m.id}">${ic('clip')} Imprimer</button>
      <button class="btn ghost" data-act="journalReunionPartager" data-m="${m.id}">${ic('chat')} Partager</button></div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.journalReunionPartager = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m);
  if (!m) return;
  const t = journalReunionText(avec, m);
  try { if (navigator.share) { await navigator.share({ title: `Journal réunion n°${m.n} · ${avec.name}`, text: t }); return; } } catch (e) { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
};

/* choisir la période, voir la longueur de papier, imprimer ou partager */
const jFrom = () => { const v = fval('jrA'); return v ? new Date(v + 'T00:00:00').getTime() : 0; };
const jTo = () => { const v = fval('jrB'); return v ? new Date(v + 'T23:59:59').getTime() : Date.now(); };
ACT.journalSheet = () => {
  const { avec } = cur();
  const d0 = isoDay(avec.cycle.start), d1 = isoDay(Date.now());
  App.openSheet(`<h2>Imprimer le journal</h2><p class="muted">Choisissez la période. Le ticket reprend chaque écriture, les totaux et l'empreinte de la dernière écriture.</p>
    <div class="grid2"><div class="field"><label for="jrA">Du</label><input id="jrA" class="input" type="date" value="${d0}" data-in="jrCalc"></div>
      <div class="field"><label for="jrB">Au</label><input id="jrB" class="input" type="date" value="${d1}" data-in="jrCalc"></div></div>
    <div class="row" style="flex-wrap:wrap;gap:6px">
      <button class="btn sm ghost" data-act="jrPeriod" data-v="7">7 jours</button>
      <button class="btn sm ghost" data-act="jrPeriod" data-v="30">30 jours</button>
      <button class="btn sm ghost" data-act="jrPeriod" data-v="cycle">Ce cycle</button>
      <button class="btn sm ghost" data-act="jrPeriod" data-v="tout">Tout</button></div>
    <div id="jrOut" class="receipt" aria-live="polite"></div>
    <div class="grid2"><button class="btn brand" data-act="journalPrint">${ic('clip')} Imprimer</button>
      <button class="btn ghost" data-act="journalShare">${ic('chat')} Partager</button></div>
    <button class="btn ghost block" data-act="journalPreview">Voir le ticket</button>`);
  INP.jrCalc();
};
INP.jrCalc = () => {
  const o = document.getElementById('jrOut'); if (!o) return;
  const { avec } = cur();
  const rows = journalRows(avec, jFrom(), jTo());
  const lines = journalText(avec, jFrom(), jTo()).split('\n').length;
  o.innerHTML = `<div class="row between small"><span>Écritures</span><b class="num">${rows.length}</b></div>
    <div class="row between small"><span>Longueur de papier</span><b class="num">environ ${Math.max(1, Math.round(lines * 0.4))} cm</b></div>
    ${lines > 250 ? '<div class="chip warn">Période longue : beaucoup de papier</div>' : ''}`;
};
ACT.jrPeriod = d => {
  const { avec } = cur();
  const a = document.getElementById('jrA'), b = document.getElementById('jrB');
  if (!a || !b) return;
  b.value = isoDay(Date.now());
  a.value = d.v === 'tout' ? isoDay(avec.createdAt || avec.tx[0] && avec.tx[0].ts || Date.now())
    : d.v === 'cycle' ? isoDay(avec.cycle.start) : isoDay(Date.now() - (+d.v) * DAY);
  INP.jrCalc();
};
let jSel = [0, 0];
const jRange = () => { if (document.getElementById('jrA')) jSel = [jFrom(), jTo()]; return jSel; };
ACT.journalPreview = () => {
  const { avec } = cur(); const [a, b] = jRange();
  const text = journalText(avec, a, b);
  App.openSheet(`<h2>Journal</h2><pre class="ticket">${esc(text)}</pre>
    <div class="grid2"><button class="btn brand" data-act="journalPrint" data-a="${fval('jrA') || ''}" data-b="${fval('jrB') || ''}">${ic('clip')} Imprimer</button>
      <button class="btn ghost" data-act="journalShare">${ic('chat')} Partager</button></div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.journalPrint = async () => {
  const { avec } = cur(); const [a, b] = jRange();
  const how = await printReceipt(journalText(avec, a, b));
  App.toast(how === 'pos' ? 'Journal envoyé à l\'imprimante' : how === 'rawbt' ? 'Journal envoyé à l\'application d\'impression' : 'Aucune imprimante trouvée');
};
ACT.journalShare = async () => {
  const { avec } = cur(); const [a, b] = jRange();
  const text = journalText(avec, a, b);
  try {
    if (navigator.share) await navigator.share({ title: `Journal ${avec.name}`, text });
    else { await navigator.clipboard.writeText(text); App.toast('Journal copié : collez-le où vous voulez'); }
  } catch (e) { /* partage annulé */ }
};
