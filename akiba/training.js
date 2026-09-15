/* Akiba AVEC — les 7 modules de formation des AVEC (méthode AVEC), adaptés à Akiba.
   Pour les animateurs (animer et cocher par AVEC) et l'organisation (suivre l'avancement). */
'use strict';

const MODULES = [
  { id: 'm1', n: 1, t: 'Groupes, rôles et élections', when: 'Semaine 1, avant toute épargne', dur: 'environ 2 h',
    obj: ['Comprendre ce qu\'est une AVEC : épargner ensemble, prêter entre membres, partager à la fin du cycle.', 'Vérifier la composition du groupe : 15 à 25 personnes qui se connaissent et se font confiance.', 'Connaître les rôles : président, secrétaire, trésorier, deux compteurs, trois porte-clés.', 'Élire le bureau de façon libre et transparente.'],
    steps: ['Présenter l\'AVEC avec des exemples simples (parts, crédit, partage).', 'Vérifier que chacun vient librement et habite près des autres.', 'Expliquer chaque rôle et les qualités attendues (honnêteté, disponibilité, savoir compter).', 'Organiser l\'élection : candidats, vote de l\'assemblée, annonce des résultats.', 'Rappeler que le trésorier garde la caisse et ne garde aucune clé.'],
    akiba: ['Nouvelle AVEC › étape <b>Groupe</b> : nom, province, territoire, village, jour des réunions.', 'Étape <b>Membres</b> : une fiche par personne (nom et sexe obligatoires).', 'Étape <b>Bureau</b> : président, secrétaire, trésorier, compteurs, trois porte-clés.', 'À la fin : distribuer les <b>codes secrets</b> et ranger la <b>carte de secours</b> dans la caisse.'],
    check: ['Le groupe compte 15 à 25 membres.', 'Le bureau est élu et connu de tous.', 'Les trois porte-clés sont différents du trésorier.', 'Chaque membre a reçu son code secret en main propre.'] },
  { id: 'm2', n: 2, t: 'Épargne, caisse sociale et crédit : les règles', when: 'Semaine 2', dur: 'environ 2 h',
    obj: ['Fixer la valeur d\'une part et le nombre de parts par réunion.', 'Décider la cotisation à la caisse sociale et les cas d\'aide.', 'Décider les règles de crédit : montant maximum, durée, intérêt.', 'Fixer les amendes (absence, retard, autres).'],
    steps: ['Montrer avec des exemples ce que donne une part de 500, 1 000 ou 2 000 FC.', 'Laisser l\'assemblée débattre puis voter la valeur de la part.', 'Caisse sociale : montant par réunion et situations d\'aide (maladie, deuil…).', 'Crédit : jusqu\'à 3 fois l\'épargne, durée maximum, intérêt par mois ; faire un calcul ensemble.', 'Amendes : montants votés par l\'assemblée.'],
    akiba: ['Nouvelle AVEC › étape <b>Règlement</b> : chaque règle se choisit dans une liste.', 'L\'<b>exemple chiffré</b> affiché montre au groupe ce que donnent ses règles.', 'Guide › <b>Les crédits</b> : exemple de calcul à lire ou à écouter.'],
    check: ['Chaque membre peut dire la valeur d\'une part.', 'Les règles de crédit sont comprises (maximum, durée, intérêt).', 'Les cas d\'aide sociale sont clairs.'] },
  { id: 'm3', n: 3, t: 'Règlement intérieur', when: 'Semaine 3', dur: 'environ 2 h',
    obj: ['Rassembler toutes les décisions dans un règlement intérieur.', 'Compléter : jour et rythme des réunions, durée des mandats, départ d\'un membre, sanctions, fin de cycle.', 'Faire adopter le règlement par l\'assemblée.'],
    steps: ['Relire les décisions des modules 1 et 2.', 'Décider les points qui manquent, un par un.', 'Lire tout le règlement à haute voix.', 'Faire voter l\'adoption du règlement.', 'Vérifier que chacun connaît les règles importantes.'],
    akiba: ['Nouvelle AVEC › étape <b>Démarrage</b> : relire le récapitulatif avant de créer l\'AVEC.', 'Dans l\'AVEC : <b>Plus › Règlement intérieur</b> reste toujours consultable.', 'Guide audio : <b>Écouter</b> pour les membres qui lisent peu.'],
    check: ['Le règlement est adopté par vote.', 'Les règles saisies dans Akiba correspondent aux décisions.', 'L\'AVEC est créée (et validée par l\'organisation si elle est accompagnée).'] },
  { id: 'm4', n: 4, t: 'Première réunion d\'épargne', when: 'Semaine 4', dur: 'environ 2 h',
    obj: ['Tenir la première réunion dans le bon ordre.', 'Ouvrir la caisse et compter l\'argent devant tous.', 'Enregistrer la caisse sociale, l\'achat de parts et les amendes.', 'Fermer la caisse avec les trois clés.'],
    steps: ['Installer les membres en cercle, la caisse au milieu.', 'Le secrétaire tient Akiba ; le président dirige.', 'Suivre les étapes affichées : présences, comptage, caisse sociale, épargne, amendes.', 'Les compteurs comptent à haute voix.', 'Clôture : recompter, les trois porte-clés tapent leur code, lire le reçu.'],
    akiba: ['Accueil › <b>AVEC › Tenir la réunion</b> › le responsable touche son nom et tape son code.', '<b>Ouvrir la réunion</b>, puis suivre les 8 étapes ; <b>Écouter cette étape</b> si besoin.', 'À la fin : <b>Fermer et sceller la réunion</b> ; le <b>Journal</b> garde toutes les écritures.'],
    check: ['La caisse est juste à la clôture.', 'Les trois clés ont été confirmées.', 'Chaque membre voit ses parts dans son carnet.'] },
  { id: 'm5', n: 5, t: 'Premier crédit', when: 'Vers la semaine 8', dur: 'environ 2 h',
    obj: ['Demander, examiner et accorder un crédit selon les règles.', 'Comprendre le calcul de l\'intérêt et le total à rembourser.', 'Appliquer la double validation par le bureau.'],
    steps: ['Rappeler les règles de crédit.', 'Chaque demandeur dit à haute voix le montant et l\'utilisation.', 'Vérifier le maximum permis (épargne × règle, argent disponible).', 'L\'assemblée accepte ou refuse.', 'Accorder le crédit, expliquer les échéances au membre.'],
    akiba: ['Réunion › étape <b>Crédits › Accorder un crédit</b> : Akiba affiche le maximum, l\'intérêt et le total.', 'Un <b>2ᵉ membre du bureau</b> confirme avec son code.', 'Le membre voit son crédit dans <b>son carnet</b>.'],
    check: ['Aucun crédit au-dessus du maximum.', 'L\'emprunteur connaît le total et les dates de remboursement.', 'La caisse est juste à la clôture.'] },
  { id: 'm6', n: 6, t: 'Premier remboursement', when: 'Environ un mois après le premier crédit', dur: 'environ 2 h',
    obj: ['Enregistrer correctement les remboursements.', 'Suivre les retards et les amendes dues.', 'Comprendre le portefeuille à risque (PAR) et les alertes.'],
    steps: ['Au début, lire le résumé de la réunion précédente (échéances du jour).', 'Vérifier les montants pré-remplis et corriger si un membre paie autrement.', 'Discuter des retards : causes et solutions décidées par le groupe.', 'Rappeler les amendes dues des absents.'],
    akiba: ['Réunion › <b>résumé du début</b> : échéances du jour, amendes dues.', 'Étape <b>Remboursements</b> : échéances déjà écrites, total calculé.', 'Onglet <b>Crédits</b> : crédits en cours et en retard ; l\'animateur voit les <b>Alertes</b>.'],
    check: ['Les remboursements du jour sont enregistrés.', 'Les membres en retard sont connus et suivis.', 'Le PAR est expliqué au bureau.'] },
  { id: 'm7', n: 7, t: 'Partage et nouveau cycle', when: 'Fin du cycle', dur: 'environ 3 h',
    obj: ['Préparer le partage : tous les crédits et amendes remboursés.', 'Comprendre le calcul de la valeur d\'une part.', 'Tenir la séance de partage en toute transparence.', 'Décider le nouveau cycle : règles et élections.'],
    steps: ['Quatre semaines avant : rappeler la date et les crédits restants.', 'Le jour du partage : compter tout l\'argent devant tous.', 'Montrer le calcul : total ÷ nombre de parts = valeur d\'une part.', 'Remettre à chacun sa part ; les trois porte-clés confirment.', 'Voter les règles du nouveau cycle et réélire le bureau si besoin.'],
    akiba: ['<b>Plus › Partage de fin de cycle</b> : tableau de ce que chacun reçoit.', '<b>Faire le partage maintenant</b> : comptage, trois clés, distribution.', 'Après le partage : <b>Règles du nouveau cycle</b> et bureau ; <b>Historique des cycles</b> pour comparer.'],
    check: ['Tous les crédits sont soldés ou retenus sur les parts.', 'Chaque membre a reçu le montant affiché.', 'Le nouveau cycle est lancé avec ses règles.'] }
];
const trainingCount = avec => MODULES.filter(m => avec.trainings && avec.trainings[m.id]).length;
const nextModule = avec => MODULES.find(m => !(avec.trainings || {})[m.id]);
const canTrain = () => !!K.session && (K.session.kind === 'anim' || K.session.kind === 'org');
function trainingChip(avec) {
  const n = trainingCount(avec);
  return `<span class="chip ${n === 7 ? 'good' : n >= 4 ? 'brand' : 'warn'}">${n} / 7</span>`;
}
function trainingBlock(avec) {
  const n = trainingCount(avec), next = nextModule(avec);
  return `<section class="section"><div class="row between"><h2>Formation</h2><span class="chip ${n === 7 ? 'good' : 'brand'}">${n} / 7 modules</span></div>
    <div class="card stack">
      <div class="trainrow">${MODULES.map(m => `<button class="tstep ${(avec.trainings || {})[m.id] ? 'done' : ''}" data-act="go" data-to="t.mod" data-m="${m.id}" aria-label="Module ${m.n} : ${esc(m.t)}">${m.n}</button>`).join('')}</div>
      ${next ? `<p class="small">Prochain : <b>Module ${next.n} — ${esc(next.t)}</b> · ${next.when}</p>` : '<p class="small"><b>Les 7 modules sont réalisés.</b></p>'}
    </div></section>`;
}

SCREENS['t.home'] = () => {
  if (!canTrain()) return SCREENS[homeScreen()]();
  const u = me_user(), avecs = myAvecs(u).filter(isActive), isAnim = u.role === 'anim';
  return `<div class="shell">${topbar('Formation des AVEC', '7 modules', isAnim ? '' : backBtn('o.home'), isAnim ? logoutBtn : '')}<main class="main">
    <div><h1>Les 7 modules</h1><p class="muted">À animer avec chaque groupe, dans l'ordre. Chaque module dit quoi faire avec l'assemblée et où le faire dans Akiba.${isAnim ? ' Cochez-les pour chacune de vos AVEC.' : ''}</p></div>
    <div class="list">${MODULES.map(m => { const done = avecs.filter(a => (a.trainings || {})[m.id]).length; return `<button class="li" data-act="go" data-to="t.mod" data-m="${m.id}"><span class="av" style="border-radius:12px;font-family:var(--f-display)">${m.n}</span><span class="grow"><b>${esc(m.t)}</b><span class="small muted">${m.when} · ${m.dur}</span></span><span class="chip ${avecs.length && done === avecs.length ? 'good' : ''}">${done} / ${avecs.length}</span></button>`; }).join('')}</div>
    <div class="tip">Après les 7 modules, l'animateur continue les visites de suivi : fiche de l'AVEC › <b>Noter une visite</b>.</div>
  </main>${isAnim ? tabbar(N_TABS, 't.home') : ''}</div>`;
};
SCREENS['t.mod'] = p => {
  if (!canTrain()) return SCREENS[homeScreen()]();
  const m = MODULES.find(x => x.id === p.m) || MODULES[0];
  const u = me_user(), avecs = myAvecs(u).filter(isActive), isAnim = u.role === 'anim';
  const sec = (title, items, ordered) => `<section class="card stack tmod"><h3>${title}</h3><${ordered ? 'ol' : 'ul'} class="tlist">${items.map(i => `<li>${i}</li>`).join('')}</${ordered ? 'ol' : 'ul'}></section>`;
  const prevM = MODULES[m.n - 2], nextM = MODULES[m.n];
  return `<div class="shell">${topbar('Module ' + m.n + ' sur 7', esc(m.t), backBtn('t.home'))}<main class="main" id="tmod">
    <div><span class="label">${m.when} · ${m.dur}</span><h1>${esc(m.t)}</h1></div>
    <div class="row">${speakBtn('mod-' + m.id, '#tmod h1, #tmod .tmod h3, #tmod .tmod li', 'Écouter le module')}</div>
    ${sec('Objectifs', m.obj)}${sec('Déroulé avec l\'assemblée', m.steps, true)}${sec('Dans Akiba', m.akiba)}${sec('Points de contrôle', m.check)}
    <section class="section"><h2>${isAnim ? 'Cocher pour mes AVEC' : 'Avancement dans les AVEC'}</h2>
      <div class="list">${avecs.map(a => { const d = (a.trainings || {})[m.id]; return `<div class="li"><span class="grow"><b>${esc(a.name)}</b><span class="small muted">${d ? 'Fait le ' + fdate(d.ts) : 'Pas encore fait'}</span></span>${isAnim ? `<button class="toggle ${d ? 'on' : ''}" data-act="trainDone" data-avec="${a.id}" data-m="${m.id}" aria-label="Module ${m.n} fait pour ${esc(a.name)}" aria-pressed="${!!d}"></button>` : `<span class="chip ${d ? 'good' : ''}">${d ? 'fait' : 'à faire'}</span>`}</div>`; }).join('') || '<div class="li muted">Aucune AVEC active.</div>'}</div>
    </section>
    <div class="grid2">${prevM ? `<button class="btn ghost" data-act="go" data-to="t.mod" data-m="${prevM.id}">${ic('back')} Module ${prevM.n}</button>` : '<span></span>'}${nextM ? `<button class="btn ghost" data-act="go" data-to="t.mod" data-m="${nextM.id}">Module ${nextM.n} ${ic('chev')}</button>` : ''}</div>
  </main></div>`;
};
ACT.trainDone = d => {
  const u = me_user(), a = avecById(d.avec), m = MODULES.find(x => x.id === d.m);
  if (!a || !m || u.role !== 'anim' || a.animId !== u.id) return App.toast('Réservé à l\'animateur de cette AVEC');
  a.trainings = a.trainings || {};
  if (a.trainings[m.id]) { delete a.trainings[m.id]; App.toast(`Module ${m.n} décoché pour ${a.name}`); }
  else { a.trainings[m.id] = { ts: Date.now(), by: u.id }; App.toast(`Module ${m.n} fait pour ${a.name}`); }
  DB.save(); render();
};
