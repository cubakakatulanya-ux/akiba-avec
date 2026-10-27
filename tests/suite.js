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

  /* ---------- S. un porte-clé absent ne bloque pas le groupe ---------- */
  await t("Un porte-clé absent : l’assemblée désigne un remplaçant, et c’est écrit", () => {
    if (typeof ACT.lockSub !== 'function') return 'sans objet';
    const a = avecById(A);
    const pres = a.members.find(x => x.role === 'president');
    K.session = { kind: 'avec', avecId: a.id, memberId: pres.id };
    if (!openMeeting(a)) ACT.startMeeting();
    const r = openMeeting(a);
    const trois = keyHolders(a).slice(0, 3);
    const absent = trois[2];
    r.presence[absent.id] = 'A';
    /* on amène la réunion à la clôture */
    for (const i of ['0', '1', '2', '3', '4', '5', '6']) ACT.stepDone({ i });
    App.go('a.meet', { step: '7' });
    const st = stats(a);
    App.draft.closeCount = String(st.cash);
    App.draft.locks = {}; App.draft.subs = {};
    trois.slice(0, 2).forEach(h => App.draft.locks[h.id] = true);
    must(!closeReady(a), 'la clôture ne doit pas être possible sans la troisième clé');
    /* le remplaçant : présent, ni trésorier ni porte-clé */
    const tres = a.members.find(x => x.role === 'tresorier');
    const sub = activeM(a).find(x => r.presence[x.id] && r.presence[x.id] !== 'A' && !trois.some(h => h.id === x.id) && (!tres || x.id !== tres.id));
    must(sub, 'aucun remplaçant possible dans ce groupe');
    App.draft.subs[absent.id] = sub.id;
    App.draft.locks[absent.id] = true;
    must(closeReady(a), 'la clôture doit redevenir possible avec le remplaçant');
    ACT.saveClose();
    eq(r.status, 'closed', 'la réunion doit se fermer');
    /* la trace : dans la réunion et dans le registre de sécurité */
    must((r.keySubs || []).some(k => k.absent === absent.id && k.par === sub.id), 'le remplacement n’est pas gardé dans la réunion');
    must((r.validators || []).includes(sub.id), 'le remplaçant doit figurer parmi ceux qui ont confirmé');
    must((a.security || []).some(e => e.type === 'Clé remplacée' && e.memberId === absent.id), 'rien dans le registre de sécurité');
    return sub.name.split(' ')[0] + ' a remplacé ' + absent.name.split(' ')[0];
  });

  /* ---------- T. changer de trésorier ou de porte-clé en cours de cycle ---------- */
  await t("Changer le bureau en cours de cycle laisse une trace qui ne s’efface pas", () => {
    if (typeof applyRoles !== 'function') return 'sans objet';
    const a = avecById(A);
    const avantTres = a.members.find(x => x.role === 'tresorier' && !x.left);
    const libres = activeM(a).filter(x => x.role === 'membre' && !x.key);
    must(avantTres && libres.length, 'il faut un trésorier et un membre disponible');
    const nouveau = libres[0];
    const n0 = (a.security || []).length;
    const pres = a.members.find(x => x.role === 'president' && !x.left);
    const secr = a.members.find(x => x.role === 'secretaire' && !x.left);
    /* l'assemblée élit un nouveau trésorier, et confie une clé à l'ancien */
    const clesActuelles = activeM(a).filter(x => x.key).map(x => x.id);
    const nouvellesCles = clesActuelles.slice(0, 2).concat([avantTres.id]);
    applyRoles(a, { b: [pres.id, secr.id, nouveau.id], k: nouvellesCles }, pres.name);
    eq(memberOf(a, nouveau.id).role, 'tresorier', 'le nouveau trésorier');
    must(memberOf(a, avantTres.id).role !== 'tresorier', 'l’ancien trésorier garde son rôle');
    const neuves = (a.security || []).slice(n0);
    must(neuves.some(e => e.type === 'Rôle changé' && e.memberId === nouveau.id), 'la prise de rôle n’est pas écrite');
    must(neuves.some(e => e.type === 'Rôle changé' && e.memberId === avantTres.id), 'la perte de rôle n’est pas écrite');
    must(neuves.some(e => e.type === 'Clé confiée' && e.memberId === avantTres.id), 'la clé confiée n’est pas écrite');
    must(neuves.every(e => /valid/.test(e.via || '')), 'le validateur n’est pas noté');
    return neuves.length + ' changement(s) écrits dans le registre';
  });

  /* ---------- U. le journal de séance, sauvegarde en papier ---------- */
  await t("Le journal d’une séance s’imprime, se classe, et redonne les écritures", () => {
    if (typeof journalReunionText !== 'function') return 'sans objet';
    const a = avecById(A);
    /* une séance qui a vraiment servi : c'est celle-là qu'on imprime */
    const m = a.meetings.filter(x => x.status === 'closed' && a.tx.some(y => y.meetingId === x.id)).slice(-1)[0];
    must(m, 'aucune réunion fermée avec des écritures');
    const t0 = journalReunionText(a, m);
    const lignes = t0.split(String.fromCharCode(10));
    must(!lignes.filter(l => l.length > RECU_W).length, 'ligne trop longue pour la bande de 58 mm');
    must(!lignes.filter(l => /[éèêàçùôîïûÉÈÊÀÇÙÔÎÏÛ]/.test(l)).length, 'accents sur l’imprimante');
    /* toutes les écritures de la séance doivent y être */
    const ecritures = a.tx.filter(x => x.meetingId === m.id);
    must(ecritures.length, 'la séance n’a aucune écriture');
    const manquantes = ecritures.filter(x => !t0.includes('#' + x.seq + ' '));
    must(!manquantes.length, manquantes.length + ' écriture(s) absente(s) du journal');
    /* et de quoi le classer sans le déplier */
    must(/A CLASSER : C\d+ - S\d+/.test(t0), 'étiquette de classement absente');
    must(/Sceau de la seance/.test(t0), 'sceau absent');
    return ecritures.length + ' écritures sur ≈ ' + Math.round(lignes.length * 0.4) + ' cm';
  });

  /* ---------- V. un code se retape comme on peut ---------- */
  await t("Le code de transfert s’accepte avec tiret, espaces, minuscules, ou collé en entier", () => {
    if (typeof cleanXfer !== 'function') return 'sans objet';
    const vrai = 'AB3DEF7H';
    const formes = [vrai, 'ab3def7h', 'AB3D-EF7H', 'AB3D EF7H', ' ab3d-ef7h ',
      'Bonjour, le code de l AVEC est AB3DEF7H, bonne reception'];
    const mauvaises = formes.filter(f => cleanXfer(f) !== vrai);
    must(!mauvaises.length, mauvaises.length + ' forme(s) refusée(s) : ' + JSON.stringify(mauvaises[0] || ''));
    /* on ne devine pas : deux suites de huit signes, on ne choisit pas à la place de l utilisateur */
    must(cleanXfer('AB3DEF7H et aussi ZZ9YXW8V') !== vrai, 'Akiba ne doit pas deviner entre deux codes');
    return formes.length + ' façons d’écrire le même code';
  });

  /* ---------- W. le rêve d’un membre, et la projection ---------- */
  await t("Le rêve se calcule sur le rythme réel, et ne ment pas", () => {
    if (typeof reveAvance !== 'function') return 'sans objet';
    const a = avecById(A);
    const st = stats(a);
    const x = activeM(a).find(m => st.mem[m.id] && st.mem[m.id].parts > 0);
    must(x, 'aucun membre avec des parts');
    const d = st.mem[x.id];
    const valeur = Math.round(d.parts * st.shareValue);
    /* un rêve déjà atteint doit le dire */
    x.reve = { titre: 'Chevre', montant: Math.max(1, Math.round(valeur / 2)), cree: Date.now() };
    let r = reveAvance(a, st, x);
    eq(r.quand, 'fait', 'un rêve déjà couvert doit être annoncé atteint');
    eq(r.reste, 0, 'il ne reste rien à épargner');
    /* un rêve lointain : une date, et jamais dans le passé */
    x.reve = { titre: 'Toit en toles', montant: valeur * 4, cree: Date.now() };
    r = reveAvance(a, st, x);
    must(r.reste > 0, 'il doit rester à épargner');
    must(r.pct > 0 && r.pct < 1, 'l’avancement doit être entre 0 et 100 %');
    must(typeof r.quand === 'number' && r.quand > Date.now(), 'la date estimée doit être dans le futur');
    /* la projection s’appuie sur le rythme réel */
    const p = projectionCycle(a, st, x);
    must(p.rythme > 0, 'le rythme doit être calculé');
    must(p.partsFin >= d.parts, 'la projection ne peut pas faire perdre des parts');
    must(p.valeurFin >= p.valeurAujourdhui, 'la valeur projetée ne peut pas baisser');
    /* un membre qui n'achète rien : aucune date inventée */
    const st0 = JSON.parse(JSON.stringify({ parts: 0 }));
    const faux = { id: x.id, reve: { titre: 'Moto', montant: 100000 } };
    const stVide = Object.assign({}, st, { mem: Object.assign({}, st.mem, { [x.id]: Object.assign({}, d, { parts: 0 }) }) });
    const r0 = reveAvance(a, stVide, faux);
    must(r0.quand === null, 'sans parts achetées, aucune date ne doit être annoncée');
    /* la ligne du reçu tient dans la bande */
    x.reve = { titre: 'Toit en toles', montant: valeur * 4, cree: Date.now() };
    const ligne = reveLigneRecu(a, st, x);
    must(ligne && ligne.length <= RECU_W, 'la ligne du reçu dépasse la largeur du papier');
    delete x.reve;
    return 'rêve, projection et ligne de reçu vérifiés';
  });

  /* ---- le signe du groupe : reconnaissable, et il suit le groupe partout ---- */
  t('Le signe du groupe se choisit, se garde et s’imprime', () => {
    const a = avecById('avec1');
    /* un groupe sans signe n’affiche pas une case vide : il reçoit le signe par défaut */
    const sans = Object.assign({}, a); delete sans.embleme;
    const d = emblemeDe(sans);
    must(EMBLEMES[d.signe] && TEINTES[d.teinte], 'un groupe sans signe doit retomber sur le signe par défaut');
    /* un signe inventé ne casse pas l’affichage */
    const faux = emblemeDe({ embleme: { signe: 'licorne', teinte: 'rose' } });
    eq(faux.signe, EMB_DEFAUT.signe, 'un signe inconnu doit retomber sur le défaut');
    eq(faux.teinte, EMB_DEFAUT.teinte, 'une couleur inconnue doit retomber sur le défaut');
    /* chaque signe est un dessin valable, et chaque couleur a son trait lisible */
    Object.entries(EMBLEMES).forEach(([id, sg]) => {
      must(sg.nom && sg.d.indexOf('<') === 0, 'le signe ' + id + ' doit être un dessin');
    });
    Object.entries(TEINTES).forEach(([id, c]) => {
      must(/^#[0-9A-Fa-f]{6}$/.test(c.fond) && /^#[0-9A-Fa-f]{6}$/.test(c.trait), 'la couleur ' + id + ' doit être complète');
    });
    /* le badge se dessine sans image à charger : aucune requête réseau sur un téléphone hors réseau */
    const h = emblemeHtml(a, 40);
    must(h.indexOf('<svg') > 0 && h.indexOf('<img') < 0, 'le signe ne doit charger aucune image');
    must(emblemeImprime(a, 22).indexOf('#000') > 0, 'la carte papier doit imprimer le signe en noir');
    /* la grille de choix propose tous les signes et toutes les couleurs */
    const g = emblemeChoix('cEmbleme', EMB_DEFAUT);
    Object.keys(EMBLEMES).forEach(id => must(g.indexOf('data-signe="' + id + '"') > 0, 'le signe ' + id + ' manque dans la grille'));
    Object.keys(TEINTES).forEach(id => must(g.indexOf('data-teinte="' + id + '"') > 0, 'la couleur ' + id + ' manque dans la grille'));
    /* le changement par le bureau est tracé dans le journal de sécurité */
    const avant = (a.security || []).length, garde = a.embleme;
    K.session = { kind: 'avec', avecId: a.id, memberId: a.members.find(m => m.role === 'president').id };
    App.embleme = { signe: 'epi', teinte: 'jaune' };
    ACT.emblemeSave();
    eq(a.embleme.signe, 'epi', 'le signe choisi doit être gardé');
    must((a.security || []).length === avant + 1, 'le changement de signe doit être tracé');
    a.embleme = garde; DB.save();
    return 'signe par défaut, grille complète, impression noire et trace vérifiés';
  });

  /* ---- la date de naissance, et l’âge qui reste juste d’une année sur l’autre ---- */
  t('L’âge se déduit de la date de naissance, et refuse l’impossible', () => {
    const an = new Date().getFullYear();
    /* un anniversaire déjà passé cette année, et un autre encore à venir */
    eq(ageAu('2000-01-01', new Date(an, 11, 31).getTime()), an - 2000, 'anniversaire passé : l’âge est complet');
    eq(ageAu(an - 30 + '-12-31', new Date(an, 0, 1).getTime()), 29, 'anniversaire à venir : une année de moins');
    /* la date l’emporte sur l’année seule, et une date absente ne casse rien */
    eq(ageOf({ birthDate: (an - 40) + '-06-15', birthYear: 1900 }), ageAu((an - 40) + '-06-15', Date.now()), 'la date doit l’emporter sur l’année');
    eq(ageOf({ birthYear: an - 25 }), 25, 'sans date, l’âge se calcule sur l’année');
    eq(ageOf({}), null, 'sans rien, aucun âge inventé');
    eq(ageOf({ birthDate: '15 juin' }), null, 'une date mal écrite ne doit pas produire d’âge');
    return 'date de naissance, âge dérivé et cas limites vérifiés';
  });

  /* ---- la photo : facultative, légère, et elle ne tient pas la mémoire en otage ---- */
  t('La photo d’un membre reste facultative et légère', () => {
    const a = avecById('avec1'), x = a.members.find(m => !m.left);
    /* aucun membre de la graine n’a de photo : les initiales suffisent */
    eq(photoDe(x), null, 'un membre sans photo ne doit pas en inventer une');
    must(avatar(x).indexOf('<img') < 0, 'sans photo, l’avatar garde les initiales');
    /* une valeur douteuse n’est jamais affichée comme une image */
    eq(photoDe({ photo: 'javascript:alert(1)' }), null, 'seule une image enregistrée peut s’afficher');
    eq(photoDe({ photo: '' }), null, 'une photo retirée ne doit plus s’afficher');
    /* une photo présente apparaît dans l’avatar et sur la carte imprimée */
    const faux = 'data:image/jpeg;base64,' + 'A'.repeat(64);
    x.photo = faux;
    must(avatar(x).indexOf('<img') > 0, 'avec photo, l’avatar doit la montrer');
    must(carteHTML(a, x, a.tx.length).indexOf('class="photo"') > 0, 'la carte papier doit porter la photo');
    /* le poids reste sous le plafond : trente-cinq membres doivent tenir dans la mémoire */
    must(PHOTO_MAX * 35 < 1024 * 1024, 'trente-cinq photos doivent tenir dans un méga-octet');
    delete x.photo;
    must(carteHTML(a, x, a.tx.length).indexOf('class="photo"') < 0, 'sans photo, la carte n’en montre aucune');
    DB.save();
    return 'photo facultative, avatar, carte et plafond de poids vérifiés';
  });

  t('Un enregistrement impossible ne passe plus en silence', () => {
    /* le cas qui faisait tout perdre : mémoire pleine, et l’application continuait comme si de rien n’était */
    const vrai = localStorage.setItem.bind(localStorage);
    let dit = '';
    const toast = App.toast; App.toast = m => { dit = m; };
    localStorage.setItem = () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; };
    DB.enPanne = false;
    const r = DB.save();
    localStorage.setItem = vrai; App.toast = toast; DB.enPanne = false;
    eq(r, false, 'un enregistrement qui échoue doit le dire');
    must(dit.indexOf('mémoire') > 0 || dit.indexOf('garder') > 0, 'l’utilisateur doit être prévenu');
    eq(DB.save(), true, 'un enregistrement qui réussit doit rendre true');
    return 'échec d’enregistrement signalé au lieu d’être avalé';
  });

  /* ---- les sons : courts, reconnaissables, et jamais indispensables ---- */
  t('Chaque message sonne ce qu’il veut dire', () => {
    /* un refus descend, une réussite monte : on comprend sans lire */
    eq(sonDuMessage('Enregistré'), 'ok', 'un message neutre sonne la réussite');
    eq(sonDuMessage('Montant incorrect'), 'erreur', 'un refus doit sonner comme un refus');
    eq(sonDuMessage('Réservé au bureau'), 'erreur', 'un accès refusé doit sonner comme un refus');
    eq(sonDuMessage('Pas de réseau. Tout reste enregistré sur ce téléphone.'), 'erreur', 'un empêchement doit sonner comme tel');
    eq(sonDuMessage('Écart de caisse : vérifiez le comptage'), 'alerte', 'une vérification à faire a son propre son');
    /* aucun son ne dure plus d’un tiers de seconde : on accompagne, on ne sursaute pas */
    Object.entries(SONS).forEach(([n, notes]) => {
      const fin = Math.max.apply(null, notes.map(x => x[1] + x[2]));
      must(fin <= 0.32, 'le son ' + n + ' est trop long (' + fin + 's)');
      notes.forEach(x => must(x[3] <= 0.2, 'le son ' + n + ' est trop fort'));
    });
    /* un téléphone sans audio ne doit jamais faire échouer une écriture */
    jouerSon('inconnu'); jouerSon('ok'); vibrer(10);   /* ne doit jamais lever */
    eq(typeof jouerSon('ok'), 'undefined', 'jouer un son ne rend rien et ne bloque rien');
    /* le réglage se coupe et se retrouve */
    const av = sonActif();
    sonActifSet(false); eq(sonActif(), false, 'les sons doivent pouvoir se couper');
    sonActifSet(true); eq(sonActif(), true, 'les sons doivent pouvoir revenir');
    sonActifSet(av);
    return 'direction du son, durée, volume et absence d’audio vérifiés';
  });

  /* ---- la langue : une seule traduction doit couvrir toutes les lignes de même forme ---- */
  t('Le motif réduit mille phrases presque identiques à une seule', () => {
    const a = avecById('avec1'), x = a.members.find(m => !m.left);
    /* un montant, une date, un nom : trois données, un seul motif */
    eq(motifDe('Épargne 3 000 FC'), 'Épargne {n}', 'un montant doit devenir {n}');
    eq(motifDe('Épargne 500 FC'), 'Épargne {n}', 'deux montants donnent le même motif');
    eq(motifDe('Épargne (parts) · 5 parts'), 'Épargne (parts) · {n} parts', 'le mot qui suit le nombre doit rester');
    eq(motifDe('Semaine 14 sur 17'), 'Semaine {n} sur {n}', 'deux nombres restent deux places');
    eq(motifDe('e4b2ea7ca3 · non envoyé'), '{n} · non envoyé', 'une empreinte de journal n’est pas un mot');
    /* les vrais mots ne doivent pas être pris pour des données */
    eq(motifDe('Caisse sociale'), 'Caisse sociale', 'une phrase sans chiffre ne doit pas changer');
    eq(motifDe('Bénéfice'), 'Bénéfice', 'un mot qui ressemble à de l’hexadécimal doit survivre');
    /* et le motif se remplit à nouveau à l’affichage, nombre à sa place */
    I18N.set('ln');
    const dit = I18N.t('Épargne 7 500 FC');
    must(dit.indexOf('7 500') > 0, 'le montant doit revenir dans la phrase traduite');
    must(dit.indexOf('Épargne') < 0, 'la phrase doit bien être traduite');
    I18N.set('fr');
    return 'motif, empreintes, mots protégés et remise en place du nombre vérifiés';
  });

  t('La couverture annoncée est celle que l’utilisateur voit', () => {
    /* Le défaut corrigé : la feuille de langue annonçait « Complète » pour le lingála en comptant
       un dictionnaire de référence, alors que la plupart des écrans restaient en français. */
    K.data.i18nVu = {}; K.data.i18nManque = {};
    eq(I18N.reelle('ln'), null, 'sans rien avoir affiché, on n’annonce aucun pourcentage');
    eq(I18N.reelle('fr'), 1, 'le français est toujours complet');
    I18N.noter('ln', 100, 40, { 'Caisse sociale': 3, 'Bénéfice': 1 });
    eq(I18N.reelle('ln'), 0.4, 'la couverture réelle est traduit / total');
    const liste = I18N.aTraduire('ln');
    eq(liste[0].k, 'Caisse sociale', 'la phrase la plus vue vient en premier');
    eq(liste.length, 2, 'toutes les phrases manquantes sont proposées');
    /* une phrase qui n’en est pas une ne doit jamais arriver jusqu’au traducteur */
    must(!estPhrase('3 500 FC'), 'un montant n’est pas une phrase');
    must(!estPhrase('KV'), 'des initiales ne sont pas une phrase');
    must(!estPhrase(avecById('avec1').members[0].name), 'un nom de membre ne se traduit pas');
    must(estPhrase('Caisse sociale'), 'une vraie phrase doit être proposée');
    K.data.i18nVu = {}; K.data.i18nManque = {}; DB.save();
    return 'couverture réelle, liste par fréquence et tri des non-phrases vérifiés';
  });

  t('Les dates se disent dans la langue choisie', () => {
    const d = new Date(2026, 10, 1).getTime();   /* un dimanche */
    must(/dim/.test(fdateL(d, 'fr')), 'en français, la date reste française');
    eq(fdateL(d, 'sw'), 'jumapili 1 nov.', 'en kiswahili, le jour et le mois changent');
    must(fdateL(d, 'ln').indexOf('eyenga') === 0, 'en lingála, dimanche se dit eyenga');
    /* une langue sans calendrier garde le français plutôt qu’un mot inventé */
    must(/dim/.test(fdateL(d, 'lua')), 'sans calendrier connu, la date reste en français');
    /* et une date traduite ne doit pas revenir dans la liste à traduire */
    I18N.set('sw');
    eq(motifDe('jumapili 1 nov.'), '{n}', 'une date déjà traduite reste une date');
    I18N.set('fr');
    return 'dates en kiswahili et en lingála, repli honnête ailleurs';
  });

  /* ---- le guide traduit section par section, et qui dit où il en est ---- */
  t('Le guide se traduit par sections entières, sans mentir sur le reste', () => {
    /* chaque section traduite doit avoir un titre ET un corps : un titre seul tromperait */
    Object.entries(GUIDE_TR).forEach(([lang, d]) => {
      Object.entries(d).forEach(([id, x]) => {
        must(GUIDE.some(g => g.id === id), 'la section traduite ' + id + ' (' + lang + ') n’existe plus dans le guide');
        must(x.t && x.t.length > 2, 'la section ' + id + ' (' + lang + ') n’a pas de titre');
        must(x.b && x.b.length > 80, 'la section ' + id + ' (' + lang + ') n’a pas de corps');
        must(x.b.indexOf('<') >= 0, 'le corps de ' + id + ' (' + lang + ') doit être de la prose mise en forme');
        /* une balise ouverte et jamais refermée casserait la page entière */
        ['p', 'ul', 'ol', 'li', 'b', 'h4', 'div'].forEach(b => {
          const o = (x.b.match(new RegExp('<' + b + '[ >]', 'g')) || []).length;
          const f = (x.b.match(new RegExp('</' + b + '>', 'g')) || []).length;
          eq(o, f, 'balise <' + b + '> mal fermée dans ' + id + ' (' + lang + ')');
        });
      });
    });
    /* en français, le guide est toujours le guide */
    I18N.set('fr');
    const fr = guideSection(GUIDE[0]);
    eq(fr.traduit, false, 'le français n’est pas une traduction');
    eq(fr.t, GUIDE[0].t, 'en français, le titre d’origine est gardé');
    eq(guideCouverture('fr', GUIDE), 1, 'le guide est complet en français');
    /* en kiswahili, les sections écrites sont servies, les autres restent en français */
    I18N.set('sw');
    const sw = guideSection(GUIDE.find(g => g.id === 'reunion'));
    eq(sw.traduit, true, 'la section réunion doit être traduite en kiswahili');
    must(sw.b.indexOf('mkutano') > 0, 'le corps kiswahili doit être du kiswahili');
    const staff = guideSection(GUIDE.find(g => g.id === 'organisation'));
    eq(staff.traduit, false, 'une section de métier reste en français');
    eq(staff.lang, 'sw', 'et la section sait dans quelle langue elle aurait dû être');
    /* la couverture annoncée est comptée, pas devinée */
    const c = guideCouverture('sw', GUIDE);
    must(c > 0 && c < 1, 'le guide kiswahili doit être partiel, et le dire');
    eq(Math.round(c * GUIDE.length), Object.keys(GUIDE_TR.sw).length, 'la couverture doit compter les sections écrites');
    /* une langue sans guide ne doit pas afficher une page vide */
    I18N.set('lua');
    const lua = guideSection(GUIDE[0]);
    eq(lua.traduit, false, 'sans traduction, on sert le français');
    eq(lua.b, GUIDE[0].b, 'et le texte français est intact');
    eq(guideCouverture('lua', GUIDE), 0, 'une langue sans guide annonce zéro');
    I18N.set('fr');
    return Object.keys(GUIDE_TR.sw).length + ' sections en kiswahili, ' + Object.keys(GUIDE_TR.ln).length + ' en lingála, balises et couverture vérifiées';
  });

  /* ---- la voix : respirer entre les phrases, et ralentir quand elle est mécanique ---- */
  t('La lecture respire, et son débit suit la qualité de la voix', () => {
    /* Le défaut qui faisait « robot » : un titre ou une ligne de liste sans point final
       s'enchaînait au morceau suivant d'une seule traite, sans aucun silence. */
    morceaux('Argent dans la caisse\nOuvrir la réunion').forEach(m => {
      must(/[.!?;:,]$/.test(m), 'chaque morceau doit finir par une ponctuation : ' + JSON.stringify(m));
    });
    /* une ponctuation déjà là n'est pas doublée */
    must(morceaux('Caisse juste.').every(m => !/\.\.$/.test(m)), 'le point ne doit pas être doublé');
    /* les longues phrases restent coupées pour Chrome, et chaque bout respire */
    const longue = morceaux('mot '.repeat(80));
    must(longue.length > 1, 'une phrase trop longue doit être coupée');
    longue.forEach(m => must(m.length <= 190, 'un morceau reste court : ' + m.length));
    /* le débit : une voix naturelle garde le ton normal, une voix mécanique ralentit */
    const bonne = { name: 'Google français Neural', lang: 'fr-FR' };
    const robot = { name: 'eSpeak French', lang: 'fr-FR' };
    eq(voixNaturelle(bonne), true, 'une voix neural doit être reconnue comme naturelle');
    eq(voixNaturelle(robot), false, 'eSpeak n’est pas une voix naturelle');
    eq(voixNaturelle({ name: 'Google espeak', lang: 'fr' }), false, 'le mot Google ne rachète pas eSpeak');
    must(debitVoix(bonne, 'fr') > debitVoix(robot, 'fr'), 'une voix mécanique doit être lue plus lentement');
    must(debitVoix(bonne, 'ln') < debitVoix(bonne, 'fr'), 'une langue lue par une voix d’emprunt ralentit encore');
    must(debitVoix(robot, 'ln') >= 0.8, 'mais jamais au point de traîner');
    eq(voixNaturelle(null), false, 'aucune voix n’est pas une voix naturelle');
    return 'silences, découpe et débit selon la qualité de la voix vérifiés';
  });

  /* ---- un retard ou une absence qui a une raison ---- */
  t('Un motif justifié enlève l’amende, et reste écrit', () => {
    const a = avecById('avec1');
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
    /* on ouvre une réunion pour travailler dessus */
    let m = openMeeting(a);
    const ouverte = !!m;
    if (!m) { ACT.startMeeting(); m = openMeeting(a); }
    must(!!m, 'il faut une réunion ouverte pour cet essai');
    const x = a.members.find(y => !y.left && y.id !== chef.id);
    const presAvant = m.presence[x.id], excAvant = JSON.parse(JSON.stringify(m.excuses || {}));

    /* sans motif, l’absence est proposée à l’amende */
    m.presence[x.id] = 'A';
    delete (m.excuses || {})[x.id];
    eq(estJustifie(m, x.id), false, 'sans motif, rien n’est justifié');
    App.draftKey = null;
    SCREENS['a.meet']({});
    App.draftKey = null;

    /* avec un motif, l’amende n’est plus proposée */
    excuseEcrire(a, m, x, 'Deuil dans la famille', chef);
    eq(estJustifie(m, x.id), true, 'le motif doit être enregistré');
    eq(excuseDe(m, x.id).motif, 'Deuil dans la famille', 'le motif doit être celui choisi');
    eq(excuseDe(m, x.id).par, chef.id, 'on doit savoir qui a justifié');
    must((a.security || []).some(e => /justifi/i.test(e.type || '')), 'la justification doit laisser une trace');

    /* le brouillon des amendes, reconstruit, ne propose plus celle-là */
    App.draftKey = null;
    const st = stats(a);
    const late = activeM(a).filter(y => m.presence[y.id] && m.presence[y.id] !== 'P');
    const dr = draft(m.id + ':fine', () => { const o = {}; late.forEach(y => { if (!estJustifie(m, y.id)) o[y.id] = true; }); return { on: o, pay: {}, pen: {} }; });
    eq(!!dr.on[x.id], false, 'une absence justifiée ne doit pas être proposée à l’amende');
    must(late.length <= 1 || Object.keys(dr.on).length === late.length - 1, 'les autres restent proposés à l’amende');

    /* le motif part sur le journal de papier, dans la largeur de la bande */
    const lignes = journalExcuses(a, m);
    must(lignes.length >= 3, 'le journal doit porter le motif');
    lignes.forEach(l => must(l.length <= RECU_W, 'ligne trop large pour le papier : ' + l));
    must(lignes.join(' ').indexOf('Deuil') > 0, 'le motif doit être lisible sur le papier');
    must(lignes.join(' ').indexOf(noAcc(x.name)) > 0, 'le nom doit accompagner le motif');

    /* revenu présent, le motif disparaît : il n’a plus d’objet */
    ACT.pres({ id: x.id, v: 'P' });
    eq(estJustifie(m, x.id), false, 'présent, le motif ne doit plus traîner');

    /* remise en état */
    m.presence[x.id] = presAvant; m.excuses = excAvant;
    if (!ouverte && openMeeting(a)) a.meetings = a.meetings.filter(y => y.id !== m.id);
    App.draftKey = null; DB.save();
    return 'motif gardé, amende non proposée, trace et journal de papier vérifiés';
  });

  t('Une phrase libre se replie sans perdre de lettres sur le papier', () => {
    /* Le défaut corrigé : la découpe se faisait sur la lettre « s » au lieu des espaces, et tout
       mot qui en contenait sortait amputé — « dans » devenait « dan » sur le journal imprimé. */
    eq(rWrap('Deuil dans la famille').join('|'), 'Deuil dans la famille', 'une phrase courte ne doit pas être touchée');
    eq(rWrap('sans cesse les mois passes').join(' '), 'sans cesse les mois passes', 'aucune lettre ne doit disparaître');
    /* une phrase longue se coupe aux espaces, et chaque ligne tient dans la bande */
    const long = rWrap('La tresoriere dit avoir laisse un billet a la maison ce matin la');
    must(long.length > 1, 'une phrase longue doit être repliée');
    long.forEach(l => must(l.length <= RECU_W, 'ligne trop large : ' + l.length));
    eq(long.join(' ').replace(/ +/g, ' '), 'La tresoriere dit avoir laisse un billet a la maison ce matin la', 'le texte replié doit rester entier');
    /* un mot plus long que la bande est coupé, pas perdu */
    const enorme = rWrap('a'.repeat(50));
    eq(enorme.length, 1, 'un mot trop long tient sur une ligne');
    eq(enorme[0].length, RECU_W, 'et il est coupé à la largeur du papier');
    eq(rWrap('').length, 0, 'une phrase vide ne produit rien');
    return 'repli aux espaces, largeur et intégrité du texte vérifiés';
  });

  t('Le motif entre dans le journal scellé, et ne s’imprime pas comme une somme', () => {
    const a = avecById('avec1');
    const chef = a.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: a.id, memberId: chef.id };
    let m = openMeeting(a);
    const ouverte = !!m;
    if (!m) { ACT.startMeeting(); m = openMeeting(a); }
    const x = a.members.find(y => !y.left && y.id !== chef.id);
    const presAvant = m.presence[x.id], excAvant = JSON.parse(JSON.stringify(m.excuses || {}));
    m.presence[x.id] = 'A';

    /* le motif décide si de l’argent est dû : il doit être aussi infalsifiable que l’amende */
    const n = a.tx.length;
    excuseEcrire(a, m, x, 'Deuil dans la famille', chef);
    eq(a.tx.length, n + 1, 'le motif doit créer une écriture du journal');
    const t = a.tx[a.tx.length - 1];
    eq(t.type, 'EXCUSE', 'l’écriture doit être du bon type');
    eq(t.amount, 0, 'un motif ne déplace aucun argent');
    eq(t.memberId, x.id, 'on doit savoir de qui il s’agit');
    must(/Deuil/.test(t.note || ''), 'la raison doit être dans l’écriture');
    eq(verifyChain(a).ok, true, 'la chaîne du journal doit rester intacte');

    /* une écriture sans argent ne doit pas s’imprimer dans la colonne des francs :
       un zéro sur un journal de caisse se lit comme une erreur de saisie */
    const lignes = journalReunionText(a, m).split(String.fromCharCode(10));
    const ligne = lignes.find(l => /Motif justifie/.test(l));
    must(ligne, 'le motif doit figurer sur le journal de papier');
    must(!/\d/.test(ligne.replace(/^#\d+ /, '')), 'aucun montant ne doit suivre un motif : ' + JSON.stringify(ligne));
    const iTot = lignes.findIndex(l => /TOTAUX/.test(l));
    const totaux = lignes.slice(iTot, iTot + 10).join(' ');
    must(!/Motif justifie/.test(totaux), 'un motif ne doit pas figurer dans les totaux');
    must(!/Point GPS/.test(totaux), 'un point GPS non plus');

    /* retirer le motif n’efface pas l’écriture : le journal ne s’efface jamais */
    const n2 = a.tx.length;
    ACT.excuseEffacer({ id: x.id });
    eq(a.tx.length, n2 + 1, 'le retrait doit ajouter une écriture, pas en enlever une');
    eq(verifyChain(a).ok, true, 'la chaîne doit encore tenir après le retrait');

    m.presence[x.id] = presAvant; m.excuses = excAvant;
    if (!ouverte && openMeeting(a)) a.meetings = a.meetings.filter(y => y.id !== m.id);
    App.draftKey = null; DB.save();
    return 'écriture scellée, chaîne intacte, impression sans faux zéro';
  });

  t('La photo reste légère pour tout un groupe, pas seulement une par une', () => {
    const a = avecById('avec1');
    /* Le calcul qui compte n’est pas celui d’une photo mais celui de trente-cinq : elles
       voyagent toutes dans le fichier de transfert envoyé par WhatsApp depuis un village. */
    must(PHOTO_MAX * 35 < 450 * 1024, 'trente-cinq photos doivent tenir sous 450 Ko, trouvé ' + Math.round(PHOTO_MAX * 35 / 1024) + ' Ko');
    eq(photosPoids(a).n, 0, 'la démonstration ne porte aucune photo');
    const faux = 'data:image/jpeg;base64,' + 'A'.repeat(4000);
    const x = a.members.find(y => !y.left);
    x.photo = faux;
    eq(photosPoids(a).n, 1, 'le compte des photos doit suivre');
    must(photosPoids(a).ko >= 3, 'le poids doit être annoncé en Ko');
    delete x.photo;
    /* et la photo se prend avec la caméra arrière : on photographie la personne en face */
    must(photoChamp('t', {}).indexOf('capture="environment"') > 0, 'la caméra arrière doit être demandée');
    return 'plafond du groupe, compte du poids et caméra arrière vérifiés';
  });

  t('Chaque groupe de la démonstration porte son propre signe', () => {
    /* le signe ne sert à rien si tous les groupes se ressemblent */
    const signes = new Set(K.data.avecs.map(a => emblemeDe(a).signe + '/' + emblemeDe(a).teinte));
    must(signes.size > 1, 'la démonstration doit montrer des signes différents');
    K.data.avecs.forEach(a => { const e = emblemeDe(a); must(EMBLEMES[e.signe] && TEINTES[e.teinte], 'signe inconnu sur ' + a.name); });
    return signes.size + ' signes différents dans la démonstration';
  });

  /* ---------- T. le fichier qui passe d'une application à l'autre ---------- */
  await t('Une AVEC envoyée par l’animateur arrive entière chez le groupe', async () => {
    /* Recevoir une AVEC ajoute aussi son organisation et ses animateurs : cet essai touche donc
       tout le cahier, pas une seule AVEC. On en garde une copie entière et on la remet à la fin,
       sinon les écrans d'organisation vérifiés ensuite travaillent sur des données mélangées. */
    const toutAvant = JSON.stringify(K.data);
    const avec = avecById(A);
    /* on charge l'AVEC de tout ce qui a été ajouté récemment : si l'un de ces champs
       ne monte pas dans le fichier, le groupe perd le signe, les photos ou les motifs. */
    const m = avec.members.filter(x => !x.left);
    const r = avec.meetings[avec.meetings.length - 1];
    avec.embleme = { signe: 'poisson', teinte: 'grenat' };
    m[0].photo = 'data:image/jpeg;base64,' + 'A'.repeat(3000);
    m[0].ne = '1979-04-12';
    r.excuses = Object.assign({}, r.excuses, { [m[1].id]: { motif: 'Deuil dans la famille', par: m[0].id, ts: Date.now() } });
    const avant = { tx: avec.tx.length, membres: avec.members.length, cash: stats(avec).cash,
      signe: avec.embleme.signe, photo: m[0].photo.length, ne: m[0].ne, motif: r.excuses[m[1].id].motif };

    const fichier = await buildTransfer(avec, 'ESSAI1234');
    must(fichier.length > 1000, 'le fichier doit contenir quelque chose');
    must(fichier.indexOf(avec.members[0].name) < 0, 'le fichier ne doit pas laisser lire les noms en clair');

    /* le gardien de licence a ses propres essais : ici on vérifie le fichier, pas la porte */
    const lic = App.licence;
    App.licence = { ok: true, data: { id: 'ESSAI', name: 'Essai', kind: 'org' } };
    const mode = K.data.mode;
    try {
      let e = await importTransfer(fichier, 'MAUVAIS999');
      must(e && e.error && /code/i.test(e.error), 'un code faux doit être refusé : ' + JSON.stringify(e));

      /* le téléphone du groupe n'a pas encore cette AVEC : sinon l'essai relirait sa propre copie */
      K.data.avecs.splice(K.data.avecs.findIndex(x => x.id === avec.id), 1);
      e = await importTransfer(fichier, 'essai 1234');          // code lu sans tenir compte des espaces
      must(e && e.id === avec.id, 'l’AVEC doit arriver : ' + JSON.stringify(e));

      const b = avecById(avec.id), bm = b.members.filter(x => !x.left);
      const br = b.meetings[b.meetings.length - 1];
      eq(verifyChain(b).ok, true, 'le journal doit arriver scellé');
      eq(b.tx.length, avant.tx, 'toutes les écritures doivent arriver');
      eq(b.members.length, avant.membres, 'tous les membres doivent arriver');
      eq(stats(b).cash, avant.cash, 'la caisse doit afficher le même solde des deux côtés');
      eq((b.embleme || {}).signe, avant.signe, 'le signe du groupe doit faire le voyage');
      eq((bm[0].photo || '').length, avant.photo, 'la photo doit faire le voyage');
      eq(bm[0].ne, avant.ne, 'la date de naissance doit faire le voyage');
      eq(((br.excuses || {})[bm[1].id] || {}).motif, avant.motif, 'le motif justifié doit faire le voyage');

      /* quelqu'un gonfle une épargne pendant que le fichier voyage */
      const faux = JSON.parse(JSON.stringify(b));
      const j = faux.tx.findIndex(x => x.amount > 0);
      faux.tx[j].amount += 5000;
      e = await importTransfer(await buildTransfer(faux, 'ESSAI1234'), 'ESSAI1234');
      must(e && e.error && /alt/i.test(e.error), 'un journal trafiqué doit être refusé : ' + JSON.stringify(e));

      /* et la même AVEC ne se reçoit pas deux fois : deux téléphones tiendraient le même cahier */
      K.data.mode = 'prod';
      e = await importTransfer(fichier, 'ESSAI1234');
      must(e && e.error && /déjà/i.test(e.error), 'une AVEC déjà active doit être refusée : ' + JSON.stringify(e));

    } finally {
      /* recevoir une AVEC efface la démonstration en cours : le cahier revient comme il était,
         même si un essai ci-dessus a échoué, sinon les écrans vérifiés ensuite partent faussés */
      App.licence = lic;
      K.data = JSON.parse(toutAvant); K.data.mode = mode;
      Object.keys(_chain).forEach(k => delete _chain[k]);
      DB.save();
    }
    eq(verifyChain(avecById(A)).ok, true, 'le cahier doit être revenu comme avant l’essai');
    return avant.tx + ' écritures, signe, photo, naissance et motif arrivés entiers';
  });

  /* ---------- U. une règle votée doit pouvoir être reconduite ---------- */
  await t('Toute règle votée à la création peut être reconduite au cycle suivant', () => {
    /* Un groupe vote son règlement une fois, puis le reconduit à chaque cycle. Si l'écran du
       nouveau cycle ne propose pas une valeur que celui de la création proposait, le navigateur
       retombe sur le premier choix de la liste : la part passe de 200 à 500 FC et l'intérêt de
       2 à 5 % sans que l'assemblée l'ait décidé, ni que personne le voie. C'est arrivé. */
    const avec = avecById(A);
    const sauve = JSON.parse(JSON.stringify(avec.settings));
    const sessionAvant = K.session;
    const chef = avec.members.find(x => x.role === 'president' && !x.left);
    K.session = { kind: 'avec', avecId: avec.id, memberId: chef.id };   /* l'écran est réservé au bureau */
    const champs = { partValue: 'ncP', socialFee: 'ncS', rate: 'ncR', maxMonths: 'ncD',
      cycleMonths: 'ncC', fineAbsent: 'ncF', fineLate: 'ncL', maxMult: 'ncX', maxParts: 'ncM', frequency: 'ncQ' };
    const manquants = [];
    try {
      Object.keys(champs).forEach(cle => {
        REGLES_CHOIX[cle].forEach(([valeur]) => {
          avec.settings[cle] = valeur;
          const html = SCREENS['a.newCycle']();
          const sel = html.split('id="' + champs[cle] + '"')[1];
          must(sel, 'le choix ' + champs[cle] + ' doit être sur l’écran du nouveau cycle');
          const bloc = sel.split('</select>')[0];
          if (bloc.indexOf('value="' + valeur + '" selected') < 0) manquants.push(cle + ' = ' + valeur);
        });
        avec.settings[cle] = sauve[cle];
      });
    } finally { avec.settings = sauve; K.session = sessionAvant; DB.save(); }
    eq(manquants.length, 0, 'règles impossibles à reconduire : ' + manquants.join(', '));
    return Object.keys(champs).length + ' règles, toutes reconductibles';
  });

  await t('Un choix n’efface jamais la valeur en cours du groupe', () => {
    /* Filet pour les règlements venus d'une version plus ancienne, ou d'un cahier repris :
       une valeur absente de la liste doit y être ajoutée, jamais remplacée en silence. */
    const html = pickSel('essai', 'Essai', [[500, '500 FC'], [1000, '1 000 FC']], 777);
    must(html.indexOf('value="777" selected') > 0, 'la valeur en cours doit rester sélectionnée : ' + html);
    must(html.indexOf('value="500"') > 0 && html.indexOf('value="1000"') > 0, 'les autres choix restent proposés');
    /* et une valeur connue ne doit pas être ajoutée deux fois */
    const h2 = pickSel('essai', 'Essai', [[500, '500 FC'], [1000, '1 000 FC']], 500);
    eq(h2.split('value="500"').length - 1, 1, 'une valeur connue ne doit apparaître qu’une fois');
    return 'valeur hors liste gardée, valeur connue non dupliquée';
  });
  return res;
};
