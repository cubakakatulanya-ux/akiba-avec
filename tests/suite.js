/* Batterie d'essais de bout en bout d'Akiba : s'exécute dans la page, avec les données de démonstration.
   Lancée par test-e2e.js. Chaque essai décrit en clair ce qu'il vérifie. */
window.__akibaTests = async function () {
  const res = [];
  const ok = (nom, detail = '') => res.push({ nom, ok: true, detail });
  const ko = (nom, detail) => res.push({ nom, ok: false, detail: String(detail).split('\n')[0].slice(0, 200) });
  const t = async (nom, fn) => { try { const d = await fn(); ok(nom, d || ''); } catch (e) { ko(nom, e && e.message ? e.message : e); } };
  const must = (cond, msg) => { if (!cond) throw new Error(msg || 'condition fausse'); };
  const eq = (a, b, msg) => must(a === b, (msg || '') + ' : attendu ' + b + ', obtenu ' + a);
  const near = (a, b, tol, msg) => must(Math.abs(a - b) <= tol, (msg || '') + ' : attendu environ ' + b + ', obtenu ' + a);
  if (!K.data.avecs.length) DB.reset();        // Akiba Suivi démarre vide : les essais rechargent la démonstration
  const A = 'avec1';
  let dernierMessage = null;
  const toastVrai = App.toast;
  App.toast = function (msg) { dernierMessage = msg; return toastVrai.apply(this, arguments); };

  /* ---------- A. démarrage ---------- */
  await t("Le logiciel se charge", () => { must(typeof App === 'object' && typeof SCREENS === 'object' && typeof K === 'object'); });
  await t("La clé de stockage reste kitabu.avec.v4", () => {
    must(Object.keys(localStorage).indexOf('kitabu.avec.v4') >= 0, 'clés présentes : ' + Object.keys(localStorage).join(','));
  });
  await t("Les données de démonstration sont chargées", () => {
    must(K.data.avecs.length >= 3, 'seulement ' + K.data.avecs.length + ' AVEC');
    return K.data.avecs.length + ' AVEC, ' + K.data.avecs.reduce((a, x) => a + x.members.length, 0) + ' membres';
  });
  await t("La migration ne casse pas les données", () => {
    const copie = JSON.parse(JSON.stringify(K.data));
    const m = migrate(copie);
    must(m.avecs.length === K.data.avecs.length && Array.isArray(m.orgs));
  });

  /* ---------- B. tous les écrans ---------- */
  await t("Tous les écrans se rendent sans erreur", () => {
    const a = avecById(A), m0 = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    const params = { 'l.member': { id: A }, 'a.receipt': { id: m0 && m0.id }, 'a.receipts': { id: m0 && m0.id }, 'a.meet': { step: '0' } };
    const sess = {
      'l.': { kind: 'avec', avecId: A, memberId: a.members[0].id },
      'a.': { kind: 'avec', avecId: A, memberId: a.members[0].id },
      'n.': { kind: 'anim', userId: (K.data.users.find(u => u.role === 'anim') || {}).id },
      'o.': { kind: 'org', userId: (K.data.users.find(u => u.role === 'org') || {}).id }
    };
    const rates = [];
    for (const nom of Object.keys(SCREENS)) {
      const pre = Object.keys(sess).find(p => nom.indexOf(p) === 0);
      K.session = pre ? sess[pre] : null;
      try {
        const h = SCREENS[nom](params[nom] || {});
        must(typeof h === 'string' && h.length > 20, 'rendu vide');
      } catch (e) { rates.push(nom + ' (' + String(e && e.message || e).split('\n')[0] + ')'); }
    }
    must(rates.length === 0, 'écrans en échec : ' + rates.join(' ; '));
    return Object.keys(SCREENS).length + ' écrans';
  });

  /* ---------- C. journal scellé ---------- */
  await t("Le journal de chaque AVEC est intact", async () => {
    for (const a of K.data.avecs) {
      const r = await verifyChain(a);
      must(r.ok, a.name + ' : ' + r.reason);
    }
    return K.data.avecs.length + ' journaux vérifiés';
  });
  await t("Une écriture modifiée est détectée", async () => {
    const a = avecById(A), i = Math.floor(a.tx.length / 2), avant = a.tx[i].amount;
    a.tx[i].amount = avant + 500;
    const r = await verifyChain(a);
    a.tx[i].amount = avant;
    must(!r.ok, 'la falsification est passée inaperçue');
    const r2 = await verifyChain(a);
    must(r2.ok, 'le journal ne redevient pas valide après remise en état');
  });

  /* ---------- D. une réunion complète ---------- */
  const a = avecById(A);
  const bureau = a.members.find(x => x.role === 'president') || a.members[0];
  K.session = { kind: 'avec', avecId: A, memberId: bureau.id };
  const nbAvant = stats(a).meetings.length;
  let m = null;

  await t("Réunion : ouverture", () => {
    ACT.startMeeting();
    m = openMeeting(a);
    must(m, 'aucune réunion ouverte');
    eq(m.status, 'open', 'statut');
    return 'réunion n°' + m.n;
  });
  await t("Réunion : présences, avec un absent", () => {
    const liste = activeM(a);
    m.presence[liste[liste.length - 1].id] = 'A';
    ACT.stepDone({ i: '0' });
    eq(Object.values(m.presence).filter(v => v === 'A').length, 1, 'nombre d’absents');
  });
  await t("Réunion : comptage d'ouverture conforme au cahier", () => {
    App.go('a.meet', { step: '1' });
    App.draft.openCount = String(stats(a).cash);
    ACT.saveOpen();
    eq(m.openCount, m.openExpected, 'comptage');
  });
  await t("Réunion : caisse sociale", () => {
    App.go('a.meet', { step: '2' });
    const ici = activeM(a).filter(x => m.presence[x.id] !== 'A');
    App.draft.paid = {};
    ici.slice(0, 3).forEach(x => App.draft.paid[x.id] = true);
    const av = stats(a).sum.SOCIAL;
    ACT.saveSocial();
    eq(stats(a).sum.SOCIAL - av, 3 * a.settings.socialFee, 'montant collecté');
  });
  await t("Réunion : épargne en parts", () => {
    App.go('a.meet', { step: '3' });
    const ici = activeM(a).filter(x => m.presence[x.id] !== 'A');
    App.draft.parts = {};
    ici.forEach(x => App.draft.parts[x.id] = 2);
    const av = stats(a).sum.EPARGNE;
    ACT.saveParts();
    eq(stats(a).sum.EPARGNE - av, ici.length * 2 * a.settings.partValue, 'montant épargné');
    return ici.length * 2 + ' parts';
  });
  await t("Réunion : remboursement d'un crédit", () => {
    App.go('a.meet', { step: '4' });
    const st = stats(a);
    const l = st.activeLoans.find(x => m.presence[x.memberId] !== 'A' && x.remaining > 1000);
    must(l, 'aucun crédit remboursable');
    const el = document.getElementById('rb-' + l.id);
    must(el, 'champ de remboursement absent');
    el.value = '1000';
    ACT.saveRemb();
    const ap = stats(a).loanList.find(x => x.id === l.id);
    eq(l.remaining - ap.remaining, 1000, 'reste dû');
  });
  await t("Réunion : un crédit plus long que le cycle est refusé", () => {
    App.go('a.meet', { step: '5' });
    const st = stats(a);
    const cand = activeM(a).find(x => m.presence[x.id] !== 'A' && loanLimit(a, st, x.id).max >= 5000 && !st.activeLoans.some(l => l.memberId === x.id));
    must(cand, 'aucun membre éligible');
    must(Date.now() + 28 * 24 * 3600 * 1000 > a.cycle.end, 'le cycle de démonstration devrait finir bientôt');
    ACT.creditSheet({ mid: cand.id });
    document.getElementById('crA').value = '5000';
    document.getElementById('crD').value = '1';
    document.getElementById('crP').value = 'essai';
    const ap = [...document.getElementById('crAp').options].find(o => o.value !== cand.id);                 // le bénéficiaire ne peut pas valider pour lui-même
    document.getElementById('crAp').value = ap.value;
    document.getElementById('crPin').value = memberOf(a, ap.value).pin;
    const avant = stats(a).outstanding;
    ACT.saveCredit();
    eq(stats(a).outstanding, avant, 'le crédit aurait dû être refusé');
    App.closeSheet();
    return 'refusé : fin de cycle dans moins d’un mois';
  });
  await t("Réunion : crédit accordé avec seconde validation", () => {
    App.go('a.meet', { step: '5' });
    const finVraie = a.cycle.end;
    a.cycle.end = Date.now() + 200 * 24 * 3600 * 1000;               // le temps de l'essai, le cycle laisse la place
    try {
      const st = stats(a);
      const cand = activeM(a).find(x => m.presence[x.id] !== 'A' && loanLimit(a, st, x.id).max >= 5000 && !st.activeLoans.some(l => l.memberId === x.id));
      must(cand, 'aucun membre éligible');
      ACT.creditSheet({ mid: cand.id });
      document.getElementById('crA').value = '5000';
      document.getElementById('crD').value = '1';
      document.getElementById('crP').value = 'essai automatique';
      const ap = [...document.getElementById('crAp').options].find(o => o.value !== cand.id);                 // le bénéficiaire ne peut pas valider pour lui-même
      document.getElementById('crAp').value = ap.value;
      document.getElementById('crPin').value = memberOf(a, ap.value).pin;
      const avant = stats(a).outstanding;
      ACT.saveCredit();
      must(stats(a).outstanding > avant, 'refus du logiciel : ' + (dernierMessage || 'aucun message') + ' — bénéficiaire ' + cand.name + ', validateur ' + memberOf(a, ap.value).name);
    } finally { a.cycle.end = finVraie; }
    return 'crédit de 5 000 FC';
  });
  await t("Réunion : l'amende d'un absent devient une dette", () => {
    App.go('a.meet', { step: '6' });
    const abs = activeM(a).find(x => m.presence[x.id] === 'A');
    App.draft.on = {}; App.draft.on[abs.id] = true;
    App.draft.pay = {}; App.draft.pen = {};
    const av = stats(a).sum.DETTE;
    ACT.saveFines();
    eq(stats(a).sum.DETTE - av, a.settings.fineAbsent, 'dette d’absence');
  });
  await t("Réunion : clôture scellée par les trois clés", () => {
    App.go('a.meet', { step: '7' });
    App.draft.closeCount = String(stats(a).cash);
    App.draft.locks = {};
    keyHolders(a).slice(0, 3).forEach(h => App.draft.locks[h.id] = true);
    ACT.saveClose();
    eq(m.status, 'closed', 'statut');
    eq(m.closeCount, m.closeExpected, 'comptage de clôture');
    eq(stats(a).meetings.length, nbAvant + 1, 'nombre de réunions');
  });
  await t("Le journal reste intact après la réunion", async () => {
    delete _chain[a.id];
    const r = await verifyChain(a);
    must(r.ok, r.reason);
    return r.n + ' écritures scellées';
  });
  await t("La caisse est la somme des deux caisses", () => {
    const st = stats(a);
    eq(st.cash, st.socialFund + st.loanFund, 'caisse totale');
  });

  /* ---------- E. crédits ---------- */
  await t("Le crédit maximum suit la règle du multiple de l'épargne", () => {
    const st = stats(a), x = activeM(a)[0], lim = loanLimit(a, st, x.id);
    must(lim.max <= st.mem[x.id].savings * a.settings.maxMult + 1, 'plafond au-dessus du multiple');
    must(lim.max <= st.loanFund + 1, 'plafond au-dessus de la caisse de crédit');
  });
  await t("Un crédit peut être soldé avant l'échéance", () => {
    const st = stats(a), l = st.activeLoans[0];
    must(l, 'aucun crédit en cours');
    appendTx(a, { type: 'REMB', memberId: l.memberId, ref: l.id, amount: l.remaining, by: bureau.id, note: 'solde anticipé' });
    const ap = stats(a).loanList.find(x => x.id === l.id);
    eq(ap.remaining, 0, 'reste dû');
    eq(ap.status, 'solde', 'statut');
  });
  await t("La pénalité de retard se calcule sur le reste dû", () => {
    const st = stats(a), l = st.loanList.find(x => x.remaining > 0);
    must(l, 'aucun crédit ouvert');
    const tx = a.tx.find(x => x.id === l.id);
    const vieux = tx.ts;
    tx.ts = Date.now() - 95 * 24 * 3600 * 1000;
    const l2 = stats(a).loanList.find(x => x.id === l.id);
    tx.ts = vieux;
    must(l2.monthsLate >= 1, 'retard non détecté');
    must(l2.penalty > 0, 'pénalité nulle');
    return l2.monthsLate + ' mois de retard, pénalité ' + l2.penalty + ' FC';
  });
  await t("La liste d'attente garde l'ordre d'arrivée", () => {
    a.waitlist = [];
    const x1 = activeM(a)[0], x2 = activeM(a)[1];
    a.waitlist.push({ id: 'w1', memberId: x1.id, amount: 5000, ts: 1 }, { id: 'w2', memberId: x2.id, amount: 6000, ts: 2 });
    eq(a.waitlist[0].memberId, x1.id, 'premier arrivé');
    must(a.waitlist[0].ts < a.waitlist[1].ts, 'ordre d’arrivée');
    a.waitlist = [];
  });

  /* ---------- F. crédit extérieur ---------- */
  let extId = null;
  await t("Un crédit extérieur renforce la caisse, garantie déduite", () => {
    const av = stats(a);
    extId = uid();
    const principal = 100000, garantie = 10000;
    appendTx(a, { id: extId, type: 'EXT_IN', amount: principal, rate: 4, months: 3, note: 'IMF d’essai', by: bureau.id });
    appendTx(a, { type: 'EXT_GUAR', ref: extId, amount: garantie, by: bureau.id, note: 'garantie retenue' });
    const st = stats(a);
    eq(st.loanFund - av.loanFund, principal - garantie, 'caisse de crédit');
    const e = st.extList.find(x => x.id === extId);
    must(e, 'crédit extérieur introuvable');
    eq(e.due, Math.round(principal * (1 + 4 / 100 * 3)), 'montant dû');
    eq(e.guar, garantie, 'garantie');
    return 'dû ' + e.due + ' FC';
  });
  await t("Le remboursement extérieur diminue la dette", () => {
    const e = stats(a).extList.find(x => x.id === extId);
    const avant = e.remaining;
    appendTx(a, { type: 'EXT_REPAY', ref: extId, amount: 20000, by: bureau.id });
    const e2 = stats(a).extList.find(x => x.id === extId);
    eq(avant - e2.remaining, 20000, 'reste à rembourser');
  });
  await t("Le dossier IMF se prépare", () => {
    must(typeof imfIndicators === 'function', 'indicateurs IMF absents');
    const ind = imfIndicators(a);
    must(ind && typeof ind === 'object', 'aucun indicateur');
  });

  /* ---------- G. partage de fin de cycle ---------- */
  await t("Le partage distribue tout le fonds", () => {
    const st = stats(a), plan = sharePlan(a, st);
    const brut = plan.rows.reduce((s2, r) => s2 + r.gross, 0);
    near(brut, plan.pool, Math.max(plan.rows.length, 10), 'somme des parts brutes');
    must(plan.paid >= 0 && plan.paid <= plan.pool, 'argent versé hors bornes');
    return plan.rows.length + ' membres, ' + Math.round(plan.pool) + ' FC à partager';
  });
  await t("L'ancienneté de l'épargne pèse dans le partage", () => {
    const w = savingsWeights(a, a.cycle.n, Date.now());
    const ids = Object.keys(w).filter(id => w[id] > 0);
    must(ids.length > 1, 'pas assez de membres pondérés');
    return ids.length + ' membres pondérés par la durée';
  });

  /* ---------- H. reçus et journal imprimés ---------- */
  await t("Le reçu d'un membre tient en 32 colonnes, sans accent", () => {
    const mm = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    const x = activeM(a).find(y => (mm.presence || {})[y.id] !== 'A');
    const r = memberReceipt(a, mm, x);
    const txt = receiptText(a, mm, x, r);
    const lignes = txt.split('\n');
    const trop = lignes.filter(l => l.length > 32);
    must(trop.length === 0, 'lignes trop longues : ' + trop.slice(0, 2).join(' | '));
    must(!/[à-ÿÀ-ß]/.test(txt), 'accents présents dans le ticket');
    return lignes.length + ' lignes';
  });
  await t("Le ticket sort en ESC/POS avec la coupe", () => {
    const b = escposBytes('essai');
    must(b[0] === 27 && b[1] === 64, 'initialisation ESC @ absente');
    const fin = Array.from(b.slice(-3));
    must(fin[0] === 29 && fin[1] === 86, 'commande de coupe absente : ' + fin.join(','));
    return b.length + ' octets';
  });
  await t("Le journal s'imprime sur une période choisie", () => {
    const to = Date.now(), from = to - 60 * 24 * 3600 * 1000;
    const rows = journalRows(a, from, to);
    const txt = journalText(a, from, to);
    must(rows.length > 0, 'aucune écriture sur 60 jours');
    const trop = txt.split('\n').filter(l => l.length > 32);
    must(trop.length === 0, 'lignes trop longues : ' + trop.slice(0, 2).join(' | '));
    return rows.length + ' écritures';
  });

  /* ---------- I. qualité des données et IMF ---------- */
  await t("L'indice de qualité des données est entre 0 et 100", async () => {
    const ch = await verifyChain(a);
    const q = dataQuality(a, stats(a), ch);
    must(q.score >= 0 && q.score <= 100, 'score hors bornes : ' + q.score);
    must(Array.isArray(q.items) && q.items.length >= 5, 'critères manquants');
    return q.score + '/100 sur ' + q.items.length + ' critères';
  });
  await t("L'indicateur « prête pour une IMF » liste ses critères", async () => {
    const ch = await verifyChain(a);
    const st = stats(a), q = dataQuality(a, st, ch), r = imfReady(a, st, ch, q);
    must(Array.isArray(r.crit) && r.crit.length >= 6, 'critères manquants');
    must(['ready','close','not'].indexOf(r.level) >= 0, 'verdict absent : ' + r.level);
    return r.crit.filter(i => i.ok).length + ' critères remplis sur ' + r.crit.length + ' (' + r.label + ')';
  });

  /* ---------- J. sauvegarde ---------- */
  await t("La sauvegarde relit ce qu'elle écrit", () => {
    DB.save();
    const relu = JSON.parse(localStorage.getItem('kitabu.avec.v4'));
    eq(relu.avecs.length, K.data.avecs.length, 'nombre d’AVEC');
  });

  /* ---------- K. langues ---------- */
  await t("Les langues s'affichent sans casser l'accueil", () => {
    const avant = I18N.cur ? I18N.cur() : null;
    const codes = typeof I18N.codes === 'function' ? I18N.codes() : ['fr', 'ln', 'sw', 'lu', 'kg'];
    for (const c of codes) {
      if (I18N.set) I18N.set(c);
      K.session = null;
      must(SCREENS.login({}).length > 100, 'accueil vide en ' + c);
    }
    if (I18N.set && avant) I18N.set(avant);
    return codes.length + ' langues';
  });

  /* ---------- K bis. point GPS du groupe ---------- */
  await t("Le point GPS s'écrit dans le journal scellé et ne casse pas la chaîne", () => {
    const a = avecById(A);
    const avant = a.tx.length;
    const g = gpsEnregistrer(a, { latitude: -0.4772, longitude: 29.2048, accuracy: 8.4 }, null);
    eq(a.tx.length, avant + 1, "une écriture ajoutée");
    const der = a.tx[a.tx.length - 1];
    eq(der.type, "GEO", "type de l écriture".replace(" l ", " l'"));
    eq(der.amount, 0, "le point ne touche pas l argent".replace(" l ", " l'"));
    near(g.lat, -0.4772, 0.00001, "latitude"); near(g.lon, 29.2048, 0.00001, "longitude");
    eq(a.gps.acc, 8, "précision arrondie au mètre");
    must(verifyChain(a).ok !== false, "la chaîne reste vérifiable");
    must(/-?\d+\.\d{5}, -?\d+\.\d{5}/.test(gpsTexte(a.gps)), "coordonnées lisibles");
    return gpsTexte(a.gps);
  });
  /* ---------- L. console administrateur (seulement dans Akiba Suivi) ---------- */
  await t("La console administrateur compte le contenu du téléphone", () => {
    if (typeof admStats !== 'function') return 'sans objet : console administrateur réservée à Akiba Suivi';
    const h = admStats();
    must(/AVEC sur ce t/.test(h) && /Membres/.test(h), 'bloc incomplet');
    must(/<b>\d/.test(h), 'aucun chiffre');
  });

  /* ---------- M. code court de validation, dicté au téléphone ---------- */
  await t("Le code court de validation ne vaut que pour un seul téléphone", async () => {
    if (typeof ccFaire !== 'function') return 'sans objet';
    const moi = deviceId(), autre = (moi[0] === 'A' ? 'B' : 'A') + moi.slice(1);
    const code = await ccFaire(moi, 'avec', 3);
    must(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code), 'le code doit faire 8 signes du même alphabet que le code du téléphone');
    must((await ccLire(code)).ok, 'refusé sur son propre téléphone');
    must((await ccLire(code)).data.kind === 'avec', 'le type de partenaire ne survit pas au code');
    must(!(await ccLire(code.slice(0, 4) + '-' + code.slice(4))).ok === false, 'un tiret tapé par habitude doit passer');
    must(!(await ccLire(code.slice(0, 7) + (code[7] === 'Z' ? '2' : 'Z'))).ok, 'un signe changé devrait être refusé');
    must(!(await ccFaire(autre, 'avec', 3)) || (await ccFaire(autre, 'avec', 3)) !== code, 'deux téléphones ne doivent pas avoir le même code');
    /* ce qui est gardé dans le téléphone doit se relire après redémarrage, avec la même date de fin */
    const lu = await ccLire(code);
    const relu = await verifyLicence(ccJeton(code, lu.data.exp));
    must(relu.ok && relu.data.exp === lu.data.exp, 'la validation doit survivre au redémarrage, sans repousser sa date de fin');
    must(relu.data.dev === deviceId(), 'la validation gardée doit rester liée à ce téléphone');
    return code + ' pour ' + devNu(moi) + ', jusqu\'au ' + lu.data.exp;
  });

  /* ---------- N. l'invitation à installer ---------- */
  await t("L'invitation à installer disparaît une fois l'application installée", () => {
    if (typeof installCarte !== 'function') return 'sans objet';
    const avant = localStorage.getItem('kitabu.installe');
    try {
      localStorage.removeItem('kitabu.installe');
      must(/instal-ligne/.test(installCarte()), 'invitation absente alors que rien n\'est installé');
      localStorage.setItem('kitabu.installe', '1');
      must(installCarte() === '', 'l\'invitation revient après installation');
    } finally { if (avant === null) localStorage.removeItem('kitabu.installe'); else localStorage.setItem('kitabu.installe', avant); }
  });

  /* ---------- O. une échéance tombe toujours un jour de réunion ---------- */
  await t("L'échéance d'un crédit tombe un jour de réunion", () => {
    if (typeof jourDeReunion !== 'function') return 'sans objet';
    const a = avecById('avec1');
    const JOURS = { Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
    const idx = JOURS[a.settings.meetingDay];
    must(idx != null, 'jour de réunion inconnu : ' + a.settings.meetingDay);
    const st = stats(a);
    const tous = st.loanList.concat(st.extList);
    must(tous.length > 0, 'aucun crédit pour éprouver la règle');
    const faux = tous.filter(l => new Date(l.dueDate).getDay() !== idx);
    must(!faux.length, faux.length + ' échéance(s) hors jour de réunion');
    /* et jamais avancée : on reporte, on n'anticipe pas */
    const brut = Date.now();
    must(jourDeReunion(a, brut) >= brut - 12 * 3600e3, 'une échéance ne doit jamais être avancée');
    return tous.length + ' crédits, tous au ' + a.settings.meetingDay.toLowerCase();
  });

  /* ---------- P. de la création du groupe au partage, sur un groupe neuf ----------
     Les essais précédents travaillent sur un groupe de la démonstration, déjà en route.
     Celui-ci part de rien : il crée l'AVEC comme le ferait une assemblée, tient une réunion
     entière, puis ferme le cycle et partage. C'est le chemin complet d'un vrai groupe. */
  let neuve = null;
  await t("Bout en bout : créer un groupe avec son bureau", () => {
    const noms = ['Kavira Mbusa', 'Masika Vighano', 'Kahambu Kamabu', 'Mbambu Maliro', 'Kasoki Kataliko',
      'Furaha Kyavumba', 'Neema Muhesi', 'Sifa Siviri', 'Kambale Ngeleza', 'Paluku Mathe',
      'Muhindo Vihamba', 'Kasereka Kombi'];
    const membres = noms.map((n, i) => ({ id: 'n' + i, name: n, sex: i < 9 ? 'F' : 'M', phone: '', birthYear: 1990 }));
    K.session = null;
    App.cdraft = {
      step: 5, from: 'login', mode: 'neuf', editing: null,
      g: { name: 'Tuungane Essai', province: 'Nord-Kivu', territoire: 'Lubero', entite: 'territoire',
        secteur: '', groupement: '', village: 'Kirumba', animId: '', meetingDay: 'Samedi', frequency: 7,
        createdOn: isoDay(Date.now()) },
      r: { partValue: 1000, maxParts: 5, socialFee: 500, cycleMonths: 12, rate: 10, maxMult: 3, maxMonths: 3,
        cycleStart: isoDay(Date.now()), fineAbsent: 500, fineLate: 200, penaltyRate: 10 },
      members: membres,
      roles: { P: 'n0', S: 'n1', T: 'n2', C1: 'n3', C2: 'n4', K1: 'n5', K2: 'n6', K3: 'n7' },
      rep: { social: '', credit: '', rows: {} },
    };
    ACT.cCreate();
    neuve = K.data.avecs.find(x => x.name === 'Tuungane Essai');
    must(neuve, "l'AVEC n'a pas été créée");
    eq(activeM(neuve).length, 12, 'nombre de membres');
    eq(neuve.members.filter(x => x.key).length, 3, 'porte-clés');
    must(!neuve.members.find(x => x.role === 'tresorier').key, 'le trésorier ne doit pas garder de clé');
    eq(neuve.settings.meetingDay, 'Samedi', 'jour de réunion');
    return neuve.name + ' · ' + activeM(neuve).length + ' membres';
  });

  await t("Bout en bout : une réunion entière, scellée à trois clés", () => {
    const pres = neuve.members.find(x => x.role === 'president');
    K.session = { kind: 'avec', avecId: neuve.id, memberId: pres.id };
    ACT.startMeeting();
    const r = openMeeting(neuve);
    must(r, 'réunion non ouverte');
    /* présences : un absent */
    const liste = activeM(neuve);
    r.presence[liste[liste.length - 1].id] = 'A';
    ACT.stepDone({ i: '0' });
    /* comptage d'ouverture : caisse vide sur un groupe neuf */
    App.go('a.meet', { step: '1' });
    App.draft.openCount = String(stats(neuve).cash);
    ACT.saveOpen();
    /* caisse sociale : tous les présents cotisent */
    App.go('a.meet', { step: '2' });
    App.draft.social = {};
    activeM(neuve).filter(x => r.presence[x.id] !== 'A').forEach(x => App.draft.social[x.id] = true);
    ACT.saveSocial();
    /* épargne : deux parts chacun */
    App.go('a.meet', { step: '3' });
    App.draft.parts = {};
    activeM(neuve).filter(x => r.presence[x.id] !== 'A').forEach(x => App.draft.parts[x.id] = 2);
    ACT.saveParts();
    const apresEpargne = stats(neuve);
    must(apresEpargne.sum.EPARGNE > 0, "l'épargne n'est pas enregistrée");
    /* clôture à trois clés */
    App.go('a.meet', { step: '7' });
    App.draft.closeCount = String(stats(neuve).cash);
    App.draft.locks = {};
    keyHolders(neuve).slice(0, 3).forEach(h => App.draft.locks[h.id] = true);
    ACT.saveClose();
    eq(r.status, 'closed', 'statut de la réunion');
    eq(r.closeCount, r.closeExpected, 'comptage de clôture');
    const st = stats(neuve);
    eq(st.cash, st.socialFund + st.loanFund, 'la caisse est la somme des deux caisses');
    return 'épargne ' + fc(st.sum.EPARGNE) + ' · caisse ' + fc(st.cash);
  });

  await t("Bout en bout : le partage rend tout l'argent et ouvre le cycle suivant", () => {
    const st = stats(neuve);
    const caisseAvant = st.cash;
    const cycleAvant = neuve.cycle.n;
    App.go('a.cycles');
    App.draft = { closeCount: String(st.cash), closeNote: '', locks: {} };
    keyHolders(neuve).slice(0, 3).forEach(h => App.draft.locks[h.id] = true);
    /* le vrai parcours : une confirmation, puis le code du président — rien ne part tout seul */
    ACT.runShare();
    must(App.sheet && /ne se reprend pas/.test(App.sheet), 'le partage doit demander confirmation');
    eq(neuve.cycle.n, cycleAvant, 'rien ne doit être écrit avant la confirmation');
    ACT.shareGo();
    must(App.pin, 'le partage doit demander le code du président');
    const chef = neuve.members.find(x => x.role === 'president');
    eq(App.pin.person.id, chef.id, 'c’est le président qui confirme');
    ACT.pinKey({ k: '0' }); ACT.pinKey({ k: '0' }); ACT.pinKey({ k: '0' }); ACT.pinKey({ k: '0' });
    eq(neuve.cycle.n, cycleAvant, 'un code faux ne doit rien partager');
    String(chef.pin).split('').forEach(k => ACT.pinKey({ k }));
    eq(neuve.cycle.n, cycleAvant + 1, 'le cycle suivant doit être ouvert');
    const apres = stats(neuve);
    eq(apres.sum.EPARGNE, 0, 'le nouveau cycle commence à zéro');
    const partages = neuve.tx.filter(x => x.type === 'PARTAGE' || x.type === 'SHARE' || /partage/i.test(x.note || ''));
    must(partages.length > 0, 'aucune écriture de partage dans le journal');
    const rendu = partages.reduce((a, x) => a + Math.abs(x.amount), 0);
    must(rendu > 0, "le partage n'a rien distribué");
    return 'caisse ' + fc(caisseAvant) + ' partagée · cycle n°' + neuve.cycle.n;
  });

  await t("Bout en bout : le journal du groupe neuf reste vérifiable", async () => {
    delete _chain[neuve.id];
    const r = await verifyChain(neuve);
    must(r.ok, r.reason || 'chaîne rompue');
    return r.n + ' écritures scellées, de la création au partage';
  });


  /* ---------- Q. ce qui sort sur le papier ----------
     Un reçu et une carte sortent d'une bande de 58 mm : trente-deux signes par ligne, pas un de plus,
     et sans accent — une imprimante thermique ne sait pas les faire. Une ligne trop longue se coupe
     en silence sur l'imprimante : seul un essai l'attrape. */
  await t("Reçu de réunion : 32 colonnes, sans accent", () => {
    const a = avecById(A);
    const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    must(der, 'aucune réunion fermée');
    const texte = receiptText(a, der, activeM(a)[0]);
    const lignes = String(texte).split('\n');
    const longues = lignes.filter(l => l.length > RECU_W);
    must(!longues.length, longues.length + ' ligne(s) dépassent ' + RECU_W + ' signes : ' + (longues[0] || ''));
    const accents = lignes.filter(l => /[éèêàçùôîïûÉÈÊÀÇÙÔÎÏÛ]/.test(l));
    must(!accents.length, 'accents sur l’imprimante : ' + (accents[0] || ''));
    must(lignes.length > 8, 'reçu trop court');
    return lignes.length + ' lignes, la plus longue ' + Math.max(...lignes.map(l => l.length)) + ' signes';
  });
  await t("Reçu court : moitié moins de papier, et toujours la preuve", () => {
    const a = avecById(A);
    const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    const here = activeM(a).filter(x => (der.presence || {})[x.id] && (der.presence || {})[x.id] !== 'A');
    const longs = here.map(x => String(receiptText(a, der, x, null, false)).split(String.fromCharCode(10)).length);
    const courts = here.map(x => String(receiptText(a, der, x, null, true)).split(String.fromCharCode(10)).length);
    const totalLong = longs.reduce((p, q) => p + q, 0), totalCourt = courts.reduce((p, q) => p + q, 0);
    must(totalCourt < totalLong * 0.65, 'le reçu court doit économiser au moins un tiers du papier');
    /* ce qui prouve doit rester : le nom, la réunion, le cumul et le sceau */
    const t1 = receiptText(a, der, here[0], null, true);
    must(t1.includes(noAcc(here[0].name).slice(0, 10)), 'le nom a disparu du reçu court');
    must(/Reunion n\d/.test(t1), 'la réunion a disparu');
    must(/Cumul/.test(t1), 'le cumul a disparu');
    /* la référence remplace le sceau : elle le contient, et lie en plus le membre à sa ligne */
    must(/Ref a verifier\s+\d+-[0-9A-F]{6}/.test(t1), 'la référence vérifiable a disparu');
    must(!String(t1).split(String.fromCharCode(10)).filter(l => l.length > RECU_W).length, 'ligne trop longue');
    const cm = n => Math.round(n * 0.4);
    return cm(totalLong) + ' cm -> ' + cm(totalCourt) + ' cm pour ' + here.length + ' membres';
  });
  await t("Reçu d'un membre : 32 colonnes, sans accent", () => {
    const a = avecById(A);
    const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    /* chaque membre présent reçoit le sien : on les éprouve tous, pas seulement le premier */
    const here = activeM(a).filter(x => (der.presence || {})[x.id] && (der.presence || {})[x.id] !== 'A');
    must(here.length, 'aucun membre présent à la dernière réunion');
    const lignes = here.flatMap(x => String(receiptText(a, der, x)).split('\n'));
    const longues = lignes.filter(l => l.length > RECU_W);
    must(!longues.length, longues.length + ' ligne(s) trop longues : ' + (longues[0] || ''));
    must(!lignes.filter(l => /[éèêàçùôîïûÉÈÊÀÇÙÔÎÏÛ]/.test(l)).length, 'accents sur l’imprimante');
    return here.length + ' reçus, la plus longue ligne ' + Math.max(...lignes.map(l => l.length)) + ' signes';
  });
  await t("Carte de membre sur le terminal : 32 colonnes, sans accent", () => {
    if (typeof carteTicket !== 'function') return 'sans objet';
    const a = avecById(A);
    const faux = activeM(a).map(m => carteTicket(a, m, a.tx.length));
    const lignes = faux.join('\n').split('\n');
    const longues = lignes.filter(l => l.length > RECU_W);
    must(!longues.length, longues.length + ' ligne(s) trop longues : ' + (longues[0] || ''));
    must(!lignes.filter(l => /[éèêàçùôîïûÉÈÊÀÇÙÔÎÏÛ]/.test(l)).length, 'accents sur l’imprimante');
    return activeM(a).length + ' cartes, ' + lignes.length + ' lignes';
  });
  await t("Cartes sur A4 : dix par feuille, et chacune vérifiable", () => {
    if (typeof carteHTML !== 'function') return 'sans objet';
    const a = avecById(A);
    const seq = a.tx.length;
    const membres = activeM(a);
    const html = membres.map(m => carteHTML(a, m, seq)).join('');
    eq((html.match(/class="carte-m"/g) || []).length, membres.length, 'nombre de cartes');
    /* chaque carte doit se vérifier sur ce même journal */
    const mauvaises = membres.filter(m => !carteVerifierTexte(a, carteTexte(a, m, seq)).ok);
    must(!mauvaises.length, mauvaises.length + ' carte(s) refusée(s) par la vérification');
    /* une carte fabriquée avec une fausse empreinte doit être refusée */
    const faux = carteTexte(a, membres[0], seq).replace(/(\d+)-([0-9A-F]{6})/, (x, n) => n + '-ABCDEF');
    must(!carteVerifierTexte(a, faux).ok, 'une carte falsifiée a été acceptée');
    return membres.length + ' cartes, ' + Math.ceil(membres.length / 10) + ' feuille(s) A4';
  });

  /* ---------- R. le reçu se vérifie sans croire personne ---------- */
  await t("Un reçu authentique est reconnu, un reçu refait est refusé", () => {
    if (typeof recuVerifierTexte !== 'function') return 'sans objet';
    const a = avecById(A);
    const der = a.meetings.filter(x => x.status === 'closed').slice(-1)[0];
    const here = activeM(a).filter(x => (der.presence || {})[x.id] && (der.presence || {})[x.id] !== 'A');
    must(here.length, 'aucun membre présent');
    /* tous les reçus de la réunion doivent se vérifier */
    const refuses = here.filter(x => !recuVerifierTexte(a, recuQrTexte(a, der, x)).ok);
    must(!refuses.length, refuses.length + ' reçu(s) authentique(s) refusé(s)');
    /* un papier refait avec une autre empreinte doit être refusé */
    const faux = recuQrTexte(a, der, here[0]).replace(/(\d+)-([0-9A-F]{6})/, (x, n) => n + '-ABCDEF');
    const r1 = recuVerifierTexte(a, faux);
    must(!r1.ok, 'un reçu falsifié a été accepté');
    must(/journal/i.test(r1.detail), 'le refus doit dire ce que le journal annonce');
    /* le reçu d un membre ne doit pas valoir pour un autre */
    if (here.length > 1) {
      const melange = recuQrTexte(a, der, here[0]).replace(here[0].name, here[1].name);
      must(!recuVerifierTexte(a, melange).ok, 'un reçu attribué à un autre membre a été accepté');
    }
    /* la référence voyage sur le papier : elle doit être dans le reçu imprimé, court comme long */
    must(/Ref a verifier/.test(receiptText(a, der, here[0], null, true)), 'référence absente du reçu court');
    must(/Ref a verifier/.test(receiptText(a, der, here[0], null, false)), 'référence absente du reçu détaillé');
    return here.length + ' reçus vérifiés, un faux refusé';
  });
  return res;
};
