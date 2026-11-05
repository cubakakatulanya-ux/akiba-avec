/* Akiba — le livret du membre, et son relevé de compte.

   Une banque donne deux papiers : un livret, qu'on garde chez soi et qu'on fait compléter, et un
   relevé, qu'on demande quand on veut savoir où on en est. Akiba donne les deux, et c'est ce qui
   manquait pour qu'un membre cesse de dépendre de la mémoire du secrétaire.

   LE LIVRET se tire sur une feuille A4 ordinaire, une page par membre, chez l'animateur ou à la
   paroisse. Il porte tout le cycle : les dépôts et retraits avec le solde après chaque ligne, les
   parts achetées réunion par réunion, les crédits, et deux lignes de signature. C'est le papier
   qu'on montre à la maison, et celui qu'on oppose au cahier si un jour les deux divergent.

   LE RELEVÉ sort du rouleau de 58 mm, au guichet, en trente secondes. Mêmes chiffres, pliés en
   trente-deux colonnes.

   Ce que ces papiers prouvent, et ce qu'ils ne prouvent pas : chacun porte le numéro de la
   dernière écriture du journal au moment du tirage, et le début de son empreinte. Deux papiers
   tirés du même cahier au même moment portent la même ancre ; un papier fabriqué ailleurs ne la
   retrouve pas. Cela date le papier et le rattache à ce cahier-ci — cela ne remplace pas le reçu
   d'opération, qui, lui, se vérifie montant par montant. C'est écrit sur le papier. */
'use strict';

/* l'ancre : à quelle écriture du journal ce papier a été tiré */
function livretAncre(avec) {
  const seq = avec.tx.length;
  const h = seq ? avec.tx[seq - 1].hash : String(avec.id);
  return { seq, emp: sha256(h + '|' + avec.id).slice(0, 6).toUpperCase() };
}

/* les mouvements du compte, dans l'ordre, avec le solde après chaque ligne */
function compteMouvements(avec, x, cyc) {
  const an = annulledSet(avec);
  let s = 0;
  return avec.tx
    .filter(t => t.memberId === x.id && (t.cycle || 1) === cyc && (t.type === 'DEPOT' || t.type === 'RETRAIT') && !an.has(t.id))
    .map(t => { s += t.type === 'DEPOT' ? t.amount : -t.amount; return { ts: t.ts, type: t.type, amount: t.amount, solde: s, note: t.note || '' }; });
}

/* les parts achetées, réunion par réunion, avec le cumul */
function partsMouvements(avec, x, cyc) {
  const an = annulledSet(avec);
  const par = {};
  avec.tx.forEach(t => {
    if (t.type !== 'EPARGNE' || t.memberId !== x.id || (t.cycle || 1) !== cyc || an.has(t.id)) return;
    const m = avec.meetings.find(y => y.id === t.meetingId);
    const k = m ? m.n : 0;
    const o = par[k] = par[k] || { n: k, date: m ? m.date : t.ts, parts: 0, amount: 0 };
    o.parts += t.parts || 0; o.amount += t.amount;
  });
  let cum = 0;
  return Object.values(par).sort((a, b) => a.n - b.n).map(o => { cum += o.parts; return Object.assign({ cumul: cum }, o); });
}

/* ---------- le livret, sur papier A4 ---------- */
function livretHTML(avec, x, st, ancre) {
  const cyc = avec.cycle.n;
  const d = st.mem[x.id];
  const mv = compteMouvements(avec, x, cyc);
  const pm = partsMouvements(avec, x, cyc);
  const jour = ts => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const ligneVide = n => Array.from({ length: n }, () => '<tr class="vide"><td></td><td></td><td></td><td></td></tr>').join('');
  return `<article class="livret">
    <header>
      <div class="lv-ou">${emblemeImprime(avec, 26)}<div><b>${esc(avec.name)}</b><span>${esc([avec.village, avec.territoire].filter(Boolean).join(' · '))}</span></div></div>
      <div class="lv-qui"><b>${esc(x.name)}</b><span>${esc(roleLabel(x))} · membre n°${carteNum(avec, x)} · cycle ${cyc}</span></div>
    </header>

    <!-- un groupe sans guichet n'a pas de compte de dépôt : huit lignes vides sur son livret ne
         diraient rien, et laisseraient croire qu'il manque quelque chose -->
    ${guichetActif(avec, st) ? `<h3>Mon compte <small>— l'argent que je confie au groupe, que je reprends quand je veux</small></h3>
    <table class="lv-t"><thead><tr><th>Date</th><th>Opération</th><th class="n">Montant</th><th class="n">Solde</th></tr></thead>
      <tbody>${mv.map(o => `<tr><td>${jour(o.ts)}</td><td>${o.type === 'DEPOT' ? 'Dépôt' : 'Retrait'}</td>
        <td class="n">${o.type === 'DEPOT' ? '+' : '−'} ${grp(o.amount)}</td><td class="n">${grp(o.solde)}</td></tr>`).join('')}
        ${ligneVide(Math.max(2, 8 - mv.length))}</tbody>
      <tfoot><tr><th colspan="3">Sur mon compte aujourd'hui</th><th class="n">${grp(d.libre)} FC</th></tr></tfoot></table>` : ''}

    <h3>Mes parts <small>— mon capital dans le groupe, partagé en fin de cycle</small></h3>
    <table class="lv-t"><thead><tr><th>Réunion</th><th>Date</th><th class="n">Parts</th><th class="n">Cumul</th></tr></thead>
      <tbody>${pm.map(o => `<tr><td>n°${o.n}</td><td>${jour(o.date)}</td><td class="n">${o.parts}</td><td class="n">${o.cumul}</td></tr>`).join('')}
        ${ligneVide(Math.max(2, 8 - pm.length))}</tbody>
      <tfoot><tr><th colspan="2">${d.parts} parts × ${grp(avec.settings.partValue)} FC</th><th class="n">${grp(d.savings)}</th><th class="n">vaut ${grp(Math.round(d.parts * st.shareValue))} FC</th></tr></tfoot></table>

    <h3>Mes crédits</h3>
    <table class="lv-t"><thead><tr><th>Pris le</th><th>À rendre le</th><th class="n">Emprunté</th><th class="n">Reste</th></tr></thead>
      <tbody>${d.loans.length ? d.loans.map(l => `<tr><td>${jour(l.ts)}</td><td>${jour(l.dueDate)}</td>
        <td class="n">${grp(l.principal)}</td><td class="n">${l.status === 'solde' ? 'soldé' : grp(l.remaining)}</td></tr>`).join('')
        : '<tr><td colspan="4">Aucun crédit pendant ce cycle</td></tr>'}${ligneVide(2)}</tbody></table>

    <div class="lv-sign">
      <div><span>Signature du membre</span></div>
      <div><span>Signature du trésorier</span></div>
    </div>
    <footer>
      <span>Tiré le ${fdate(Date.now())} · écriture n°${ancre.seq} du journal · réf <b>${ancre.seq}-${ancre.emp}</b></span>
      <span class="lv-note">Cette référence dit de quel cahier et de quel moment vient ce papier. Le détail d'une opération se vérifie avec son reçu.</span>
    </footer>
  </article>`;
}

SCREENS['a.livret'] = p => {
  const { avec, me, st } = cur();
  const seul = p.id ? memberOf(avec, p.id) : null;
  if (!seul && !isBureau(me)) return SCREENS['a.member']({ id: me.id });
  const liste = seul ? [seul] : activeM(avec);
  const ancre = livretAncre(avec);
  return `<div class="shell">${topbar(seul ? 'Livret de ' + esc(seul.name.split(' ')[0]) : 'Livrets des membres', esc(avec.name), backBtn(seul ? 'a.member' : 'a.members', seul ? `data-id="${seul.id}"` : ''))}<main class="main">
    <div class="alert">${icSpan('book')}<div><b>${liste.length} livret${liste.length > 1 ? 's' : ''} à imprimer</b>
      <span class="small">Une page A4 par membre : le compte, les parts, les crédits, et deux lignes de signature. Le membre le garde chez lui.</span></div></div>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn primary" data-act="livretPrint">${ic('clip')} Imprimer sur A4</button>
      ${seul ? `<button class="btn brand" data-act="releveSheet" data-id="${seul.id}">${ic('home')} Relevé sur le terminal</button>` : ''}
    </div>
    <div class="livrets">${liste.map(x => livretHTML(avec, x, st, ancre)).join('')}</div>
  </main></div>`;
};
ACT.livretPrint = () => setTimeout(() => window.print(), 120);

/* ---------- le relevé, sur le rouleau de 58 mm ---------- */
function releveTexte(avec, x, st) {
  const cyc = avec.cycle.n;
  const d = st.mem[x.id];
  const mv = compteMouvements(avec, x, cyc);
  const ancre = livretAncre(avec);
  const jj = ts => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  const L = [];
  L.push(rCenter('AKIBA - RELEVE DE COMPTE'));
  L.push(rCenter(avec.name));
  L.push(rCenter(`Cycle ${cyc} - ${fdate(Date.now())}`));
  L.push(rRule('='));
  L.push(rLine('Membre', x.name.slice(0, 20)));
  L.push(rRule());
  if (guichetActif(avec, st)) {
    L.push('MON COMPTE');
    if (!mv.length) L.push(' Aucun depot pour le moment');
    mv.slice(-12).forEach(o => L.push(rLine(` ${jj(o.ts)} ${o.type === 'DEPOT' ? 'depot' : 'retrait'}`,
      (o.type === 'DEPOT' ? '+' : '-') + grp(o.amount) + ' > ' + grp(o.solde))));
    if (mv.length > 12) L.push(` (${mv.length - 12} lignes plus anciennes)`);
    L.push(rLine(' SOLDE', fc(d.libre)));
    L.push(rRule());
  }
  L.push('MES PARTS');
  L.push(rLine(' Parts du cycle', String(d.parts)));
  L.push(rLine(' Epargne versee', fc(d.savings)));
  L.push(rLine(' Vaut aujourd hui', fc(Math.round(d.parts * st.shareValue))));
  const l = d.loans.filter(y => y.status !== 'solde')[0];
  if (l) {
    L.push(rRule());
    L.push('MON CREDIT');
    L.push(rLine(' Reste a rembourser', fc(l.remaining)));
    L.push(rLine(' A rendre le', fdate(l.dueDate)));
    if (l.status === 'retard') L.push(rLine(' EN RETARD', l.daysLate + ' j'));
  }
  if (d.fineDebt > 0) L.push(rLine('Amendes dues', fc(d.fineDebt)));
  L.push(rRule('='));
  L.push(rLine('Ref du cahier', ancre.seq + '-' + ancre.emp));
  L.push('Le detail d une operation se');
  L.push('verifie avec son recu.');
  L.push(rCenter('Akiba - Entreprise Sociale'));
  L.push(rCenter('Ubora - ' + UBORA.telShow));
  return L.join('\n');
}
ACT.releveSheet = d => {
  const { avec, st } = cur();
  const x = memberOf(avec, d.id);
  if (!x) return;
  App.openSheet(`<h2>Relevé de ${esc(x.name.split(' ')[0])}</h2>
    <pre class="ticket">${esc(releveTexte(avec, x, st))}</pre>
    <div class="grid2"><button class="btn primary block" data-act="relevePrint" data-id="${x.id}">${ic('clip')} Imprimer</button>
      <button class="btn ghost block" data-act="relevePartager" data-id="${x.id}">${ic('sync')} Partager</button></div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.relevePrint = async d => {
  const { avec, st } = cur();
  const x = memberOf(avec, d.id);
  const voie = await printReceipt(releveTexte(avec, x, st), 1);
  App.toast(voie ? 'Relevé envoyé à l’imprimante' : 'Relevé prêt');
};
ACT.relevePartager = async d => {
  const { avec, st } = cur();
  const x = memberOf(avec, d.id);
  const text = releveTexte(avec, x, st);
  try {
    if (navigator.share) await navigator.share({ title: `Relevé ${esc(x.name)} · ${avec.name}`, text });
    else { await navigator.clipboard.writeText(text); App.toast('Relevé copié : collez-le dans WhatsApp'); }
  } catch (e) { /* partage annulé */ }
};
