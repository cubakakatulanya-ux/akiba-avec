/* Akiba — l'accueil du groupe : la couverture du cahier.

   L'accueil n'est pas une page d'application, c'est la couverture du cahier qu'Akiba remplace.
   Un bureau qui ouvre ce téléphone trois fois par semaine doit reconnaître SON cahier avant de
   lire quoi que ce soit : l'emblème du groupe en grand, le nom dessous, et une seule barre dorée
   pour entrer. Recevoir, commencer, le guide — tout le reste descend en liens discrets.

   Pourquoi une couverture plutôt qu'une grille de tuiles : la grille se remplissait au tiers de
   l'écran et laissait un trou sous elle, ce qui faisait « pas fini ». Une couverture est pleine
   par construction. Et l'emblème dit « notre groupe » à qui lit mal, ce qu'un nom écrit ne fait
   pas — c'est pour cela qu'il existe.

   L'écran a donc trois visages, et c'est le téléphone qui décide :

   — Téléphone vierge : la couverture porte la marque d'Ubora et la promesse. Personne ne sait
     encore ce qu'est Akiba.
   — Démonstration : la couverture du groupe inventé, marquée comme telle, avec ses codes.
   — Téléphone d'un groupe : la couverture du groupe, et sous le nom, la seule chose qu'on vient
     y chercher — une réunion est ouverte, c'est aujourd'hui, c'est dans trois jours.

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

/* ---------- la couverture ---------- */

const URGENCE = { cur: 0, today: 1 };

/* Le groupe que la couverture porte : celui où il se passe quelque chose, d'abord — une réunion
   ouverte passe avant une réunion du jour, qui passe avant une date lointaine. À égalité, le
   dernier ouvert. Un téléphone qui porte plusieurs groupes n'en montre donc jamais un au hasard. */
function avecDeLaCouverture() {
  const list = K.data.avecs || [];
  if (!list.length) return null;
  let choisi = null;
  for (const a of list) {
    const e = etatAvec(a);
    const rang = e ? (URGENCE[e.ton] !== undefined ? URGENCE[e.ton] : 2) : 3;
    if (!choisi || rang < choisi.rang) choisi = { a, e, rang };
  }
  const prefere = avecEnAvant();
  /* aucun groupe ne réclame la une : on reprend celui qu'on avait ouvert la dernière fois */
  if (choisi.rang === 3 && prefere) return { a: prefere, e: etatAvec(prefere) };
  return choisi;
}

/* l'état en une pastille, sous le nom du groupe : c'est la seule information que l'écran doit
   donner avant le code secret */
function pastilleEtat(e) {
  if (!e) return '';
  const ton = e.ton === 'cur' ? 'cur' : e.ton === 'today' ? 'today' : '';
  return `<span class="couv-etat ${ton}">${ic(e.icone)}${esc(e.titre)}</span>`;
}

/* les autres groupes du téléphone : leurs emblèmes en petit, sous la barre dorée. Une rangée de
   signes se lit plus vite qu'une liste de noms, et c'est le même geste que sur la couverture. */
function autresGroupes(sauf) {
  const list = (K.data.avecs || []).filter(a => a.id !== sauf.id);
  if (!list.length) return '';
  return `<div class="couv-autres"><span class="couv-autres-t">Autres groupes de ce téléphone</span>
    <div class="couv-rang">${list.map(a => {
      const e = etatAvec(a);
      const ton = e && e.ton === 'cur' ? ' cur' : e && e.ton === 'today' ? ' today' : '';
      return `<button class="couv-petit${ton}" data-act="go" data-to="l.member" data-id="${a.id}" title="${esc(a.name)}">
        ${emblemeHtml(a, 46)}<span>${esc(a.name)}</span></button>`;
    }).join('')}</div></div>`;
}

/* ce que fait Akiba, pour un téléphone encore vierge : trois phrases, pas un bandeau qui défile */
function promesses() {
  const l = (icone, t) => `<div>${ic(icone)}<span>${t}</span></div>`;
  return `<div class="couv-promesses">
    ${l('shield', '<b>Journal scellé</b> — impossible à modifier')}
    ${l('sync', '<b>Tout marche sans réseau</b>')}
    ${l('globe', 'Français, lingala, swahili, tshiluba, kikongo')}</div>`;
}

/* La couverture complète. Elle remplace l'ancien accueil en entier : plus de bandeau vert au-
   dessus d'une page à moitié vide, un seul écran qui va d'un bord à l'autre. */
function couverture() {
  const canCreate = !(K.data.mode === 'prod' && K.data.orgs.length);
  const demo = K.data.mode !== 'prod';
  const choix = avecDeLaCouverture();
  const haut = `<div class="couv-haut">
    <button class="langbtn" data-act="themeSheet" aria-label="Choisir l’apparence">${ic('eye')}</button>
    <button class="langbtn" data-act="langSheet" aria-label="Choisir la langue">${ic('globe')}<span class="no-tr">${esc(I18N.name())}</span></button></div>`;
  const lien = (act, to, icone, mot) => `<button data-act="${act}"${to ? ` data-to="${to}"` : ''}>${ic(icone)}<span>${mot}</span></button>`;

  /* ---- téléphone encore vierge : la marque, la promesse, et la grande porte ---- */
  if (!choix) {
    return `<main class="couv vierge">${haut}
      <div class="couv-centre">
        <img class="couv-marque no-tr" src="ubora-hub.png" width="512" height="512" alt="" decoding="async">
        <h1 class="couv-nom">Akiba</h1>
        <p class="couv-lieu">Le cahier de l’AVEC dans le téléphone, même sans réseau.</p>
        ${promesses()}
      </div>
      <div class="couv-bas">
        ${licenceBanner()}
        <button class="barre-or" data-act="${canCreate ? 'createAvec' : 'receiveSheet'}">
          ${ic(canCreate ? 'plus' : 'sync')}<span>${canCreate ? 'Commencer notre AVEC' : 'Recevoir notre AVEC'}</span></button>
        <nav class="liens" aria-label="Autres gestes">
          ${canCreate ? lien('receiveSheet', '', 'sync', 'Recevoir notre AVEC') : ''}
          ${lien('go', 'guide', 'book', 'Guide')}</nav>
      </div></main>`;
  }

  const avec = choix.a;
  const ouverte = openMeeting(avec);
  /* La barre dorée dit le geste, pas l'écran : « continuer » quand une réunion attend. */
  const motDeLaBarre = ouverte ? `Continuer la réunion n°${ouverte.n}` : 'Ouvrir le cahier';

  /* ---- la salle d'essai : la même couverture, marquée, avec ses codes et sa sortie ---- */
  if (demo) {
    return `<main class="couv demo">${haut}
      <div class="couv-centre">
        ${emblemeHtml(avec, 128)}
        <h1 class="couv-nom">${esc(avec.name)}</h1>
        <p class="couv-lieu">${esc(avec.village)} · ${activeM(avec).length} membres</p>
        <span class="couv-marquage">${ic('alert')}Démonstration</span>
        <p class="couv-codes">Codes secrets <b class="mono">1234</b> · carte de secours <b class="mono">2468-1357</b></p>
      </div>
      <div class="couv-bas">
        ${licenceBanner()}
        <button class="barre-or" data-act="go" data-to="l.member" data-id="${avec.id}">${ic('book')}<span>${motDeLaBarre}</span></button>
        <nav class="liens" aria-label="Autres gestes">
          ${licKind() === 'demo' ? '' : lien('goLive', '', 'check', 'Notre vrai cahier')}
          ${lien('receiveSheet', '', 'sync', 'Recevoir')}
          ${lien('go', 'guide', 'book', 'Guide')}</nav>
        <button class="linkbtn couv-discret" data-act="resetDemo">Remettre la démonstration à zéro</button>
      </div></main>`;
  }

  /* ---- le vrai cahier ---- */
  return `<main class="couv">${haut}
    <div class="couv-centre">
      ${emblemeHtml(avec, 128)}
      <h1 class="couv-nom">${esc(avec.name)}</h1>
      <p class="couv-lieu">${esc(avec.village)} · cycle ${avec.cycle.n}, semaine ${cycleWeek(avec)}</p>
      ${pastilleEtat(choix.e)}
      ${envoiBloc(avec)}
    </div>
    <div class="couv-bas">
      ${licenceBanner()}
      ${autresGroupes(avec)}
      <button class="barre-or" data-act="go" data-to="l.member" data-id="${avec.id}">${ic('book')}<span>${motDeLaBarre}</span></button>
      <nav class="liens" aria-label="Autres gestes">
        ${canCreate ? lien('createAvec', '', 'plus', 'Commencer une AVEC') : ''}
        ${lien('receiveSheet', '', 'sync', 'Recevoir une AVEC')}
        ${lien('go', 'guide', 'book', 'Guide')}</nav>
    </div></main>`;
}
