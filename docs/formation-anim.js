/* Akiba Suivi — la formation de l'animateur lui-même.

   Les sept modules de training.js disent QUOI enseigner à un groupe. Ceux-ci disent COMMENT
   l'enseigner : préparer une séance, faire parler ceux qui se taisent, vérifier qu'on a compris,
   mener une visite de suivi, rattraper une erreur, tenir devant la pression.

   Ils se cochent par l'animateur lui-même, et l'organisation voit où en est chacun : c'est elle
   qui forme ses animateurs, et elle doit savoir qui est prêt à partir seul sur le terrain. */
'use strict';

const MODULES_ANIM = [
  { id: 'a1', n: 1, t: 'Préparer une séance', dur: 'une demi-journée',
    obj: ['Arriver avec tout ce qu\'il faut, et au bon moment.', 'Savoir combien de temps dure chaque partie.', 'Prévenir le groupe assez tôt pour que tout le monde vienne.'],
    steps: ['Fixer la date avec le bureau, au moins une semaine avant, un jour où les femmes sont libres.',
      'Vérifier le lieu : à l\'ombre, assis en cercle, assez calme pour s\'entendre.',
      'Apporter : le téléphone chargé, la caisse du groupe, un cahier, de quoi écrire, et de la monnaie pour les exemples.',
      'Relire le module la veille, et préparer deux exemples chiffrés avec les montants du village.',
      'Prévoir deux heures, pas plus : au-delà, l\'assemblée décroche.'],
    akiba: ['Formation › le module du jour : <b>Écouter le module</b> pendant le trajet.', 'Vérifier la batterie et que l\'application s\'ouvre <b>sans réseau</b>.'],
    check: ['Le bureau connaît la date depuis au moins une semaine.', 'Le matériel est au complet la veille.', 'Deux exemples chiffrés sont prêts.'] },

  { id: 'a2', n: 2, t: 'Animer sans faire à la place du groupe', dur: 'une demi-journée',
    obj: ['Faire décider l\'assemblée, pas décider pour elle.', 'Laisser le bureau tenir sa réunion, même lentement.', 'Reconnaître le moment où l\'on en fait trop.'],
    steps: ['Poser la question, puis se taire et compter jusqu\'à dix avant de reprendre la parole.',
      'Renvoyer chaque question au groupe : « Qu\'en pensez-vous, vous autres ? »',
      'Ne jamais toucher le téléphone du groupe pendant la réunion : montrer, puis rendre.',
      'Ne jamais compter l\'argent soi-même : ce sont les compteurs qui comptent.',
      'Si le secrétaire se trompe, laisser le groupe le corriger avant d\'intervenir.'],
    akiba: ['La réunion se tient sur le téléphone <b>du groupe</b>, par le bureau.', 'L\'animateur ne peut rien modifier : son espace ne fait que recevoir et lire.'],
    check: ['Le bureau a mené la réunion du début à la fin.', 'L\'animateur n\'a pas touché le téléphone du groupe.', 'Les décisions ont été votées par l\'assemblée.'] },

  { id: 'a3', n: 3, t: 'Faire parler ceux qui se taisent', dur: 'une demi-journée',
    obj: ['Entendre les femmes, les jeunes et ceux qui ne lisent pas.', 'Repérer qui n\'a pas compris sans l\'humilier.', 'Empêcher qu\'une ou deux voix décident pour tous.'],
    steps: ['Faire le tour du cercle, une personne après l\'autre, plutôt que de demander « des questions ? ».',
      'Demander à une personne qui ne lit pas de redire la règle avec ses mots : si elle y arrive, tout le monde a compris.',
      'Couper poliment celui qui parle depuis trop longtemps : « Merci, écoutons maintenant les autres. »',
      'Utiliser des pièces et des billets pour montrer, jamais seulement des chiffres écrits.',
      'Parler la langue du village : si le français bloque, passer en lingála, kiswahili ou kikongo.'],
    akiba: ['Guide et modules : bouton <b>Écouter</b> pour les membres qui lisent peu.', 'Écran <b>Langues</b> : changer la langue de l\'application devant le groupe.', '<b>Voix de lecture</b> : choisir la voix la plus claire du téléphone.'],
    check: ['Chaque membre a parlé au moins une fois.', 'Une personne qui ne lit pas a redit la règle correctement.', 'Aucune décision n\'a été prise par deux personnes seulement.'] },

  { id: 'a4', n: 4, t: 'Vérifier qu\'on a vraiment compris', dur: 'une demi-journée',
    obj: ['Ne pas confondre « ils ont hoché la tête » et « ils ont compris ».', 'Mesurer la compréhension avec des questions concrètes.', 'Savoir quoi refaire quand ce n\'est pas acquis.'],
    steps: ['Poser une question de cas : « Mama Kavira achète 3 parts à 1 000 francs. Combien met-elle dans la caisse ? »',
      'Faire calculer un crédit à voix haute par un membre, pas par le bureau.',
      'Demander à trois personnes différentes, dont une qui n\'a pas parlé.',
      'Si deux sur trois se trompent, reprendre le point tout de suite, avec de l\'argent sur la natte.',
      'Ne cocher le module comme fait que si les points de contrôle sont tous passés.'],
    akiba: ['Chaque module a ses <b>Points de contrôle</b> : ce sont eux qui décident, pas le temps passé.', 'Cocher le module dans <b>Formation › le module › mes AVEC</b>.'],
    check: ['Trois membres ont répondu juste à une question de cas.', 'Un membre a calculé un crédit à voix haute.', 'Les points de contrôle du module sont tous passés.'] },

  { id: 'a5', n: 5, t: 'La visite de suivi : quoi regarder, quoi noter', dur: 'une journée sur le terrain',
    obj: ['Savoir ce qu\'on vient vérifier avant d\'arriver.', 'Repérer un problème avant qu\'il devienne grave.', 'Laisser une trace utile de la visite.'],
    steps: ['Avant de partir : lire les alertes du groupe dans son espace, et la date de la dernière réunion reçue.',
      'Sur place : assister à une réunion entière sans intervenir.',
      'Regarder la caisse fermée à trois clés, le comptage dit à haute voix, et les reçus remis aux membres.',
      'Vérifier que les montants du téléphone correspondent à ce que disent les membres.',
      'Noter la visite le jour même : ce qui va, ce qui ne va pas, ce qui a été décidé.'],
    akiba: ['Espace animateur › fiche de l\'AVEC › <b>Noter une visite</b>.', 'Les <b>alertes</b> disent où aller en premier : écart de caisse, retards, réunion manquée.', 'Recevoir le journal du groupe avant de repartir : <b>Recevoir une AVEC</b>.'],
    check: ['La visite est notée le jour même.', 'Les alertes du groupe ont été regardées avant la visite.', 'Le journal du groupe a été reçu.'] },

  { id: 'a6', n: 6, t: 'Les erreurs fréquentes, et comment les rattraper', dur: 'une demi-journée',
    obj: ['Reconnaître les erreurs qui reviennent dans presque tous les groupes.', 'Les corriger devant l\'assemblée, sans accuser personne.', 'Savoir ce qui ne se rattrape pas et demande l\'organisation.'],
    steps: ['Écart de caisse : recompter devant tous, chercher l\'écriture oubliée, et noter l\'explication — jamais effacer.',
      'Réunion sautée : la tenir dès que possible, ne pas cumuler deux réunions en une.',
      'Code secret partagé : le changer tout de suite, rappeler qu\'un code se garde pour soi.',
      'Trésorier qui garde une clé : refaire la répartition devant l\'assemblée.',
      'Crédit accordé hors règlement : le signaler au groupe et à l\'organisation, ne pas le cacher.'],
    akiba: ['Un journal scellé ne s\'efface pas : une erreur se corrige par une <b>écriture d\'annulation</b>, qui reste visible.', 'Code perdu : <b>Débloquer un membre</b> dans l\'espace animateur.', 'Les écarts apparaissent seuls dans les <b>alertes</b>.'],
    check: ['L\'animateur sait expliquer pourquoi on n\'efface jamais une écriture.', 'Les cinq erreurs ci-dessus ont été jouées en exercice.', 'Il sait ce qu\'il doit remonter à l\'organisation.'] },

  { id: 'a7', n: 7, t: 'Protéger le groupe : fraude, pression, conflits', dur: 'une demi-journée',
    obj: ['Reconnaître les signes d\'une main-mise sur la caisse.', 'Tenir devant la pression d\'un notable ou d\'un parent.', 'Savoir à qui passer le relais.'],
    steps: ['Signes à connaître : une seule personne tient la caisse, le comptage n\'est plus dit à haute voix, des membres ne reçoivent plus de reçu.',
      'Rappeler publiquement les trois clés et le comptage devant tous : ce sont les deux protections du groupe.',
      'Refuser poliment toute demande de crédit hors réunion, même d\'un responsable.',
      'Conflit entre membres : laisser l\'assemblée trancher selon le règlement, ne pas arbitrer seul.',
      'Si la pression vient de l\'extérieur du groupe, prévenir l\'organisation le jour même.'],
    akiba: ['Le journal scellé rend toute modification visible : c\'est l\'argument à montrer.', 'Les <b>cartes de membre</b> se vérifient hors réseau : une carte fabriquée est refusée.', 'L\'organisation voit les alertes du groupe même sans visite.'],
    check: ['L\'animateur cite les signes d\'alerte sans les lire.', 'Il a refusé une demande hors réunion en exercice.', 'Il sait qui prévenir, et dans quel délai.'] },
];

const animFaits = u => MODULES_ANIM.filter(m => (u.trainings || {})[m.id]).length;
const animProchain = u => MODULES_ANIM.find(m => !(u.trainings || {})[m.id]);
const animPastille = u => { const n = animFaits(u); return `<span class="chip ${n === MODULES_ANIM.length ? 'good' : n >= 4 ? 'brand' : 'warn'}">${n} / ${MODULES_ANIM.length}</span>`; };

SCREENS['f.anim'] = () => {
  if (!canTrain()) return SCREENS[homeScreen()]();
  const u = me_user(), isAnim = u.role === 'anim';
  const anims = isAnim ? [u] : K.data.users.filter(x => x.role === 'anim' && x.orgId === u.orgId);
  const moi = isAnim ? u : null;
  return `<div class="shell">${topbar('Formation des animateurs', MODULES_ANIM.length + ' modules', backBtn(isAnim ? 't.home' : 'o.home'))}<main class="main">
    <div><h1>Comment animer</h1>
      <p class="muted">Les sept modules des AVEC disent <b>quoi</b> enseigner à un groupe. Ceux-ci disent <b>comment</b> :
        préparer une séance, faire parler ceux qui se taisent, vérifier qu'on a compris, mener une visite, rattraper une erreur.</p></div>
    ${moi ? `<div class="card stack"><div class="row between"><b>Mon avancement</b>${animPastille(moi)}</div>
      <div class="trainrow">${MODULES_ANIM.map(m => `<button class="tstep ${(moi.trainings || {})[m.id] ? 'done' : ''}" data-act="go" data-to="f.mod" data-m="${m.id}" aria-label="Module ${m.n}">${m.n}</button>`).join('')}</div>
      ${animProchain(moi) ? `<p class="small">Prochain : <b>Module ${animProchain(moi).n} — ${esc(animProchain(moi).t)}</b></p>` : '<p class="small"><b>Les sept modules sont faits.</b></p>'}</div>` : ''}
    <h2>Les modules</h2>
    <div class="list">${MODULES_ANIM.map(m => {
      const faits = anims.filter(a => (a.trainings || {})[m.id]).length;
      return `<button class="li" data-act="go" data-to="f.mod" data-m="${m.id}">
        <span class="av" style="border-radius:12px;font-family:var(--f-display)">${m.n}</span>
        <span class="grow"><b>${esc(m.t)}</b><span class="small muted">${m.dur}</span></span>
        <span class="chip ${anims.length && faits === anims.length ? 'good' : ''}">${faits} / ${anims.length}</span></button>`;
    }).join('')}</div>
    ${!isAnim ? `<h2>Mes animateurs</h2>
      <div class="list">${anims.map(a => `<div class="li"><span class="av">${esc(initials(a.name))}</span>
        <span class="grow"><b>${esc(a.name)}</b><span class="small muted">${[a.sex ? (a.sex === 'M' ? 'Homme' : 'Femme') : '', esc(a.zone || '')].filter(Boolean).join(' · ')}${animProchain(a) ? ' · prochain : module ' + animProchain(a).n : ' · formation complète'}</span></span>
        ${animPastille(a)}</div>`).join('') || '<div class="li muted">Aucun animateur. Ajoutez-en depuis le tableau de bord.</div>'}</div>
      <p class="hint">C'est l'animateur qui coche ses modules, depuis son propre espace. Vous voyez l'avancement, vous ne le remplissez pas à sa place.</p>` : ''}
  </main></div>`;
};

SCREENS['f.mod'] = p => {
  if (!canTrain()) return SCREENS[homeScreen()]();
  const m = MODULES_ANIM.find(x => x.id === p.m) || MODULES_ANIM[0];
  const u = me_user(), isAnim = u.role === 'anim';
  const fait = (u.trainings || {})[m.id];
  const sec = (titre, items, ordre) => `<section class="card stack tmod"><h3>${titre}</h3><${ordre ? 'ol' : 'ul'} class="tlist">${items.map(i => `<li>${i}</li>`).join('')}</${ordre ? 'ol' : 'ul'}></section>`;
  const prec = MODULES_ANIM[m.n - 2], suiv = MODULES_ANIM[m.n];
  return `<div class="shell">${topbar('Module ' + m.n + ' sur ' + MODULES_ANIM.length, esc(m.t), backBtn('f.anim'))}<main class="main" id="fmod">
    <div><span class="label">Formation de l'animateur · ${m.dur}</span><h1>${esc(m.t)}</h1></div>
    <div class="row">${speakBtn('fmod-' + m.id, '#fmod h1, #fmod .tmod h3, #fmod .tmod li', 'Écouter le module')}</div>
    ${sec('Objectifs', m.obj)}${sec('Comment faire', m.steps, true)}${sec('Dans Akiba', m.akiba)}${sec('Points de contrôle', m.check)}
    ${isAnim ? `<section class="card stack"><div class="row between"><div><b>J'ai fait ce module</b>
        <p class="hint" style="margin:2px 0 0">${fait ? 'Coché le ' + fdate(fait.ts) : 'À cocher quand les points de contrôle sont passés.'}</p></div>
      <button class="toggle ${fait ? 'on' : ''}" data-act="animTrainDone" data-m="${m.id}" aria-label="Module ${m.n} fait" aria-pressed="${!!fait}"></button></div></section>`
      : `<div class="card small muted" style="padding:14px">C'est l'animateur qui coche ce module depuis son espace.</div>`}
    <div class="grid2">${prec ? `<button class="btn ghost" data-act="go" data-to="f.mod" data-m="${prec.id}">${ic('back')} Module ${prec.n}</button>` : '<span></span>'}${suiv ? `<button class="btn ghost" data-act="go" data-to="f.mod" data-m="${suiv.id}">Module ${suiv.n} ${ic('chev')}</button>` : ''}</div>
  </main></div>`;
};

ACT.animTrainDone = d => {
  const u = me_user(), m = MODULES_ANIM.find(x => x.id === d.m);
  if (!u || u.role !== 'anim' || !m) return App.toast('Réservé à l\'animateur');
  u.trainings = u.trainings || {};
  if (u.trainings[m.id]) { delete u.trainings[m.id]; App.toast(`Module ${m.n} décoché`); }
  else { u.trainings[m.id] = { ts: Date.now() }; App.toast(`Module ${m.n} fait`); }
  DB.save(); render();
};
