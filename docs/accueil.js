/* Akiba — l'accueil du groupe.

   L'ancien accueil était écrit pour une première visite : un grand titre, une promesse, et un
   bandeau qui défile en disant ce que fait l'application. Mais un groupe ouvre cet écran trois
   fois par semaine pendant un an. Au bout de la deuxième fois, la promesse ne sert plus à rien,
   et la place qu'elle prend manque à ce qui compte.

   L'accueil a donc deux visages, et c'est le téléphone qui décide :

   — Téléphone vierge : la promesse reste entière. Personne ne sait encore ce qu'est Akiba.
   — Téléphone d'un groupe : l'écran répond à une seule question, « qu'est-ce qui se passe
     maintenant ? » — une réunion est ouverte, c'est aujourd'hui, c'est dans trois jours.

   Une règle tient tout : AUCUN MONTANT sur cet écran. Il s'affiche avant qu'on ait tapé le
   moindre code, sur un téléphone qui traîne sur une natte. La date d'une réunion est connue de
   tout le village ; la caisse, non. */
'use strict';

/* la prochaine réunion, d'après le rythme réel du groupe */
function prochaineReunion(avec) {
  if (typeof jourDeReunion !== 'function') return null;
  const tenues = (avec.meetings || []).filter(m => m.date);
  const derniere = tenues.length ? tenues[tenues.length - 1].date : 0;
  const freq = (avec.settings || {}).frequency || 7;
  let base = derniere ? derniere + freq * DAY : Date.now();
  if (base < Date.now()) base = Date.now();
  const d = jourDeReunion(avec, base);
  return d === base && !(avec.settings || {}).meetingDay ? null : d;
}

/* ce qui se passe maintenant, en mots, sans un seul franc */
function etatAvec(avec) {
  const m = openMeeting(avec);
  if (m) return { ton: 'cur', icone: 'calendar', titre: `Réunion n°${m.n} en cours`, sous: `Étape ${Math.min((m.stepDone || 0) + 2, 8)} sur 8 · touchez pour continuer` };
  const p = prochaineReunion(avec);
  if (!p) return null;
  const jours = Math.round((p - Date.now()) / DAY);
  if (jours <= 0) return { ton: 'today', icone: 'calendar', titre: 'Réunion aujourd’hui', sous: fdate(p) };
  if (jours === 1) return { ton: '', icone: 'calendar', titre: 'Réunion demain', sous: fdate(p) };
  return { ton: '', icone: 'calendar', titre: `Prochaine réunion dans ${jours} jours`, sous: fdate(p) };
}

/* l'AVEC que l'accueil met en avant : la seule, ou la dernière ouverte */
function avecEnAvant() {
  const list = K.data.avecs;
  if (!list.length) return null;
  return list.length === 1 ? list[0] : list.find(a => a.id === lastAvecId()) || null;
}

function etatBloc(avec) {
  const e = etatAvec(avec);
  if (!e) return '';
  const ouverte = !!openMeeting(avec);
  return `<button class="etat ${e.ton}" ${ouverte ? `data-act="go" data-to="l.member" data-id="${avec.id}"` : 'disabled'}>
    ${ic(e.icone)}<span><b>${esc(e.titre)}</b><span class="small">${esc(e.sous)}</span></span>${ouverte ? ic('chev') : ''}</button>`;
}

function envoiBloc(avec) {
  const n = pending(avec);
  /* Un cahier reçu d'un autre téléphone n'est peut-être pas le dernier : on le dit tant que
     le bureau ne l'a pas vérifié auprès du porteur précédent. */
  const venu = avec.recuDe && !avec.recuDe.confirme ? avec.recuDe : null;
  /* Le bandeau de provenance passe avant tout le reste : un cahier reçu se présente comme
     complet, et c'est le seul endroit où l'application peut dire qu'il ne l'est peut-être pas. */
  const bandeau = venu ? `<button class="alert warn" style="width:100%;text-align:left;border-top:0;border-right:0;border-bottom:0" data-act="recuSheet">
    <span style="width:22px;flex:none">${ic('alert')}</span><span style="flex:1;min-width:0"><b>Cahier reçu d'un autre téléphone</b><span class="small">Copié le ${fdate(venu.quand)}, à la réunion n°${venu.reunions}. Des réunions tenues là-bas après cette date n'y sont pas. À vérifier avant de partager.</span></span>${ic('chev')}</button>` : '';
  if (!n) return bandeau;
  return bandeau + `<p class="aenvoyer">${ic('shield')} <span>${n} écriture${n > 1 ? 's' : ''} qui n'${n > 1 ? 'existent' : 'existe'} que sur ce téléphone</span></p>`;
}

/* ---------- l'accueil refondu ----------

   Deux questions, dans cet ordre : qu'est-ce qui se passe maintenant, et dans quel groupe
   est-ce que j'entre ? Le reste descend.

   Toujours aucun montant ici : l'écran s'affiche avant qu'on ait tapé le moindre code, sur un
   téléphone qui traîne sur une natte. La date d'une réunion est connue de tout le village ;
   la caisse, non. */

const URGENCE = { cur: 0, today: 1 };

/* Le seul bandeau qui compte, pris sur l'ensemble des groupes du téléphone : une réunion
   ouverte passe avant une réunion du jour, qui passe avant une date lointaine. Avant, cette
   ligne n'apparaissait que si un groupe était « mis en avant » — donc jamais sur un téléphone
   qui en porte plusieurs sans en avoir ouvert un récemment. */
function blocMaintenant() {
  const list = K.data.avecs || [];
  let choisi = null;
  for (const a of list) {
    const e = etatAvec(a);
    if (!e) continue;
    const rang = URGENCE[e.ton] !== undefined ? URGENCE[e.ton] : 2;
    if (!choisi || rang < choisi.rang) choisi = { a, e, rang };
  }
  if (!choisi) return '';
  const ouverte = !!openMeeting(choisi.a);
  /* on ne nomme le groupe que s'il y en a plusieurs : sinon la ligne se répète avec la vignette */
  const qui = list.length > 1 ? esc(choisi.a.name) + ' · ' : '';
  return `<button class="etat ${choisi.e.ton}" ${ouverte ? `data-act="go" data-to="l.member" data-id="${choisi.a.id}"` : 'disabled'}>
    ${ic(choisi.e.icone)}<span><b>${esc(choisi.e.titre)}</b><span class="small">${qui}${esc(choisi.e.sous)}</span></span>${ouverte ? ic('chev') : ''}</button>`;
}

/* Les groupes du téléphone, en vignettes. On touche son emblème : un bureau reconnaît son
   AVEC à son image avant d'en lire le nom, et tout le monde au bureau ne lit pas couramment.
   La vignette porte la couleur de ce qui s'y passe, pour que l'écran dise quoi faire. */
function grilleAvecs() {
  const list = K.data.avecs || [];
  if (!list.length) return avecCard();                  // téléphone vierge : la grande porte
  const canCreate = !(K.data.mode === 'prod' && K.data.orgs.length);
  const vignette = a => {
    const e = etatAvec(a);
    const ton = e && e.ton === 'cur' ? 'ouverte' : e && e.ton === 'today' ? 'aujourdhui' : '';
    const chip = e && e.ton === 'cur' ? '<span class="chip brand">en cours</span>'
      : e && e.ton === 'today' ? '<span class="chip warn">aujourd’hui</span>' : '';
    return `<button class="vignette ${ton}" data-act="go" data-to="l.member" data-id="${a.id}">
      ${chip}${emblemeHtml(a, 56)}<span class="nm">${esc(a.name)}</span><span class="vl">${esc(a.village)}</span></button>`;
  };
  /* une vignette de plus, en pointillé : ajouter un groupe est un geste rare, mais il doit
     se trouver là où on cherche les groupes, pas dans un menu */
  const ajout = canCreate
    ? `<button class="vignette neuve" data-act="createAvec">${ic('plus')}<span class="nm">Commencer notre AVEC</span></button>`
    : `<button class="vignette neuve" data-act="receiveSheet">${ic('sync')}<span class="nm">Recevoir une AVEC</span></button>`;
  return `<div class="grille-avec">${list.map(vignette).join('')}${ajout}</div>`;
}
