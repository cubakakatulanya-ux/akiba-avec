/* Akiba AVEC — connexion, animateur, organisation, création d'AVEC */
'use strict';

const me_user = () => userById(K.session.userId);
const orgOf = id => K.data.orgs.find(o => o.id === id);
function sup(avec) {
  /* Le tableau de bord de l animateur montre le cahier tel qu il est, pas la part des ecritures
     marquees transmises : sinon un groupe tres actif mais jamais transmis apparait a zero franc,
     et l animateur ne voit pas qu il doit aller le chercher. Le retard de transmission est dit
     par ailleurs, par le compteur « en attente » et par l alerte de synchronisation. */
  const st = stats(avec);
  const ch = chainOf(avec);
  return { avec, st, ch, h: health(avec, st, ch) };
}
const LVL = { bad: 0, warn: 1, good: 2 };
const logoutBtn = `<button class="iconbtn" data-act="logout" aria-label="Se déconnecter">${ic('logout')}</button>`;
const alertHtml = (a, to) => `<button class="alert ${a.lvl}" style="border-top:0;border-right:0;border-bottom:0;width:100%;text-align:left" data-act="go" data-to="n.avec" data-id="${a.avec.id}" ${to ? `data-from="${to}"` : ''}>
  <span style="width:22px;flex:none">${ic('alert')}</span><span style="flex:1;min-width:0"><b>${esc(a.title)}</b><span class="small">${esc(a.avec.name)} · ${esc(a.detail)}</span></span></button>`;

/* ---------- connexion ---------- */
const LAST_AVEC = 'kitabu.lastAvec';
const lastAvecId = () => { try { return localStorage.getItem(LAST_AVEC) || ''; } catch (e) { return ''; } };
const rememberAvec = id => { try { localStorage.setItem(LAST_AVEC, id); } catch (e) { /* rien */ } };
/* le grand bouton « AVEC » : une seule AVEC (ou la dernière utilisée) = un toucher jusqu'à la liste des noms */
function avecCard() {
  const list = K.data.avecs;
  const inner = (name, sub, avec) => `<span class="ic">${avec ? emblemeHtml(avec, 44) : ic('users')}</span><span class="t"><b>AVEC</b><span class="nm">${name}</span><span class="sub">${sub}</span></span>${ic('chev')}`;
  if (!list.length) return `<button class="avec-main" data-act="avecStart">${inner('Entrer mon AVEC', 'Touchez pour recevoir ou créer votre AVEC')}</button>`;
  const pick = list.length === 1 ? list[0] : list.find(a => a.id === lastAvecId());
  if (pick) return `<button class="avec-main" data-act="go" data-to="l.member" data-id="${pick.id}">${inner(esc(pick.name), esc(pick.village) + ' · touchez pour entrer', pick)}</button>
    ${list.length > 1 ? `<button class="linkbtn" data-act="go" data-to="l.avec">Autre AVEC sur ce téléphone (${list.length})</button>` : ''}`;
  return `<button class="avec-main" data-act="go" data-to="l.avec">${inner('Choisir mon AVEC', list.length + ' AVEC sur ce téléphone')}</button>`;
}
/* téléphone encore vide : le bouton AVEC propose de recevoir l'AVEC (fichier de l'animateur) ou de la créer */
ACT.avecStart = () => {
  const canCreate = !(K.data.mode === 'prod' && K.data.orgs.length);
  const row = (act, icon, title, sub) => `<button class="li" data-act="${act}"><span class="xl-ic">${ic(icon)}</span><span class="grow"><b>${title}</b><span class="small muted">${sub}</span></span>${ic('chev')}</button>`;
  App.openSheet(`<h2>Mon AVEC</h2><p class="muted">Ce téléphone ne contient encore aucune AVEC.</p>
    <div class="list">
      ${row('receiveSheet', 'sync', 'Recevoir mon AVEC', 'L\'animateur ou l\'ancien téléphone du groupe vous a envoyé un fichier et un code')}
      ${canCreate ? row('createAvec', 'plus', 'Commencer notre AVEC', 'Avec l\'assemblée réunie : groupe, règlement, membres, bureau') : ''}
    </div>
    ${canCreate ? '' : '<p class="hint">Votre organisation crée les AVEC : demandez à l\'animateur de vous envoyer le fichier.</p>'}
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
INP.findName = el => {
  const q = el.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  document.querySelectorAll('.li[data-name]').forEach(li => { li.hidden = !!q && !li.dataset.name.includes(q); });
};
/* Akiba Suivi : l'accueil de l'application des animateurs, des organisations et d'Ubora.
   Le grand bouton AVEC n'y figure pas : un groupe entre par l'application Akiba. */
/* Les outils du quotidien, rangés derrière un bouton : la barre du haut ne garde que
   les filtres et les trois gestes fréquents. */
ACT.outilsSheet = () => {
  const row = (act, to, icon, titre, sous, extra = '') => `<button class="li" data-act="${act}" ${to ? `data-to="${to}"` : ''} ${extra}><span class="xl-ic">${ic(icon)}</span><span class="grow"><b>${titre}</b><span class="small muted">${sous}</span></span>${ic('chev')}</button>`;
  App.openSheet(`<h2>Outils</h2>
    <div class="list">
      ${K.session && K.session.kind === 'org' ? row('go', 'o.impact', 'chart', 'Impact', 'Les quatre piliers, chiffrés sur les journaux reçus')
        + row('go', 'o.imf', 'building', 'Dossier pour une IMF', 'Présenter un portefeuille d’AVEC à une institution')
        + row('exportSheet', '', 'chart', 'Export Excel', 'Toutes les AVEC suivies, pour le bailleur') : ''}
      ${estSuivi() ? row('receiveSheet', '', 'sync', 'Recevoir une AVEC', 'Le groupe vous a envoyé son fichier et son code') : ''}
      ${row('go', 't.home', 'clip', 'Formation', 'Les modules de la méthode AVEC')}
      ${row('go', 'guide', 'book', 'Guide d’utilisation', 'Tout sur l’AVEC et l’application')}
      ${row('go', 'tr.edit', 'globe', 'Langues', 'Relire et corriger les traductions', 'data-lang="ln"')}
      ${row('themeSheet', '', 'eye', 'Apparence', THEMES[themeChoisi()])}
      ${row('voixSheet', '', 'volume', 'Voix de lecture', 'Choisir la voix qui lit à haute voix')}
      ${row('userPinSheet', '', 'key', 'Mon code', 'Changer mon code secret')}
      ${row('go', 'dev.backup', 'shield', 'Installer et sauvegarder', 'Icône sur l’écran d’accueil, sauvegarde chiffrée')}
    </div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
function accueilSuivi() {
  const hasAnim = K.data.users.some(u => u.role === 'anim' && !u.remote);
  const hasOrg = K.data.users.some(u => u.role === 'org' && !u.remote);
  const row = (act, to, role, icon, title, sub) => `<button class="li" data-act="${act}" ${to ? `data-to="${to}"` : ''} ${role ? `data-role="${role}"` : ''}><span class="xl-ic">${ic(icon)}</span><span class="grow"><b>${title}</b><span class="small muted">${sub}</span></span>${ic('chev')}</button>`;
  const org = !K.data.orgs.length
    ? `<button class="btn primary block xl" data-act="orgStart">${ic('building')} Ouvrir le compte de mon organisation</button>
       <p class="hint" style="text-align:center;margin-top:-4px">Ubora valide la demande — une fois, avec du réseau.</p>`
    : '';
  return `<div class="shell home">
  <header class="hero tight">
    <button class="langbtn pastille2" data-act="themeSheet" aria-label="Choisir l’apparence">${ic("eye")}</button><button class="langbtn" data-act="langSheet" aria-label="Choisir la langue">${ic('globe')}<span class="no-tr">${esc(I18N.name())}</span></button>
    <svg class="ledger" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><rect x="30" y="20" width="140" height="170" rx="10"/>${[55, 80, 105, 130, 155].map(y => `<path d="M50 ${y}h100"/>`).join('')}<path d="M80 20v170"/></svg>
    <img class="hubmark no-tr" src="ubora-hub.png" width="512" height="512" alt="Logo Ubora" decoding="async">
    <div class="label" style="color:inherit;opacity:.85">Suivi des AVEC</div>
    <h1>Akiba <em>Suivi</em></h1>
    <p>Pour les animateurs, les organisations et Ubora. Les groupes, eux, travaillent sur Akiba.</p>
    <ul class="preuves">
      <li>${ic('shield')}<span>Les journaux arrivent <b>scellés</b> et se vérifient à la réception</span></li>
      <li>${ic('map')}<span>Tous vos groupes suivis, <b>même ceux que vous n'avez pas visités</b></span></li>
      <li>${ic('chart')}<span>Qualité des données notée, <b>export Excel</b> pour le bailleur</span></li>
    </ul>
  </header>
  <main class="main login">
    ${licenceBanner()}
    <!-- une seule porte : animateurs et organisation prennent leur nom dans la même liste -->
    <section class="entree">
      <h2 class="surtitre">Entrer</h2>
      <div class="list">
        ${hasAnim || hasOrg
          ? row('go', 'l.users', '', 'users', 'Entrer dans mon espace', 'Animateur ou organisation : choisissez votre nom')
          : '<div class="li muted">Aucun compte sur ce téléphone.</div>'}
      </div>
      ${org}
    </section>
    <!-- les gestes secondaires : des liens sobres, pas des tuiles. L'écran garde une seule porte visible. -->
    <!-- recevoir une AVEC et suivre la formation sont des gestes de métier : ils se font dans
         l'espace de l'animateur ou de l'organisation, pas sur la page d'accueil.
         Seul le guide reste ici : il explique l'application à qui ne l'a pas encore ouverte. -->
    <nav class="liens" aria-label="Autres gestes">
      <button data-act="go" data-to="guide">${ic('book')}<span>Guide d’utilisation</span></button>
    </nav>
    ${K.data.mode === 'prod' || !K.data.avecs.length ? '' : `<div class="demo"><p class="small"><b>Démonstration</b> · codes secrets <b class="mono">1234</b></p>
      ${licKind() === 'demo' ? '<p class="hint">Licence de démonstration : les vraies données ne sont pas disponibles.</p>' : `<button class="btn ghost block" data-act="goLive">${ic('check')} Commencer avec mes vraies données</button>`}</div>`}
    <!-- l'administration ne concerne qu'Ubora : un lien effacé, en bas, plutôt qu'une porte dans la liste -->
    <p class="discret"><button class="linkbtn" data-act="go" data-to="adm.home">Administration Ubora</button></p>
  </main></div>`;
}

SCREENS.login = () => {
  if (estSuivi()) return accueilSuivi();
  const canCreate = !(K.data.mode === 'prod' && K.data.orgs.length);
  /* l'AVEC mise en avant : c'est elle qui décide si l'accueil explique ou s'il informe */
  const enAvant = typeof avecEnAvant === 'function' ? avecEnAvant() : null;
  /* La démonstration n'est qu'une salle d'essai : des groupes, des membres et des montants
     inventés, pour apprendre sans rien risquer. Elle doit donc dire clairement qu'elle n'est
     pas le vrai cahier, et montrer la sortie — pas se replier derrière un petit triangle où
     un bureau qui a fini d'apprendre ne la retrouve plus.

     Le passage au réel efface les groupes inventés : c'est écrit avant, pas après. */
  /* La salle d’essai : un seul groupe inventé, une seule porte pour y entrer, et la sortie
     vers le vrai cahier. Elle disait trois fois qu’elle était une démonstration et répétait
     ce que la fenêtre de sortie explique déjà ; elle le dit une fois. */
  const demoAvec = K.data.mode === 'prod' ? null : (K.data.avecs || [])[0];
  const demo = K.data.mode === 'prod' ? ''
    : `<section class="card stack demo-bloc">
        <div class="row" style="align-items:flex-start;gap:10px">${icSpan('alert')}<div style="flex:1;min-width:0">
          <b>Démonstration</b>
          <span class="small muted" style="display:block">Un groupe, des membres et des montants inventés. Rien n’est en jeu : essayez tout.</span></div></div>
        ${demoAvec ? `<button class="vignette neuve" data-act="go" data-to="l.member" data-id="${demoAvec.id}">${ic('users')}<span class="nm">Ouvrir la démonstration</span></button>
          <div class="row between small"><span>Codes secrets</span><b class="mono">1234</b></div>
          <div class="row between small"><span>Carte de secours</span><b class="mono">2468-1357</b></div>` : ''}
        ${licKind() === 'demo'
          ? '<p class="hint" style="margin:0">Le passage aux vraies données demande une licence délivrée par l\x27Entreprise Sociale Ubora.</p>'
          : `<button class="btn ghost block" data-act="goLive">${ic('check')} Passer au vrai cahier de notre AVEC</button>`}
        <button class="linkbtn" data-act="resetDemo">Remettre la démonstration à zéro</button>
      </section>`;
  return `<div class="shell home">
  <header class="hero tight${K.data.avecs.length ? ' connu' : ''}">
    <button class="langbtn pastille2" data-act="themeSheet" aria-label="Choisir l’apparence">${ic("eye")}</button><button class="langbtn" data-act="langSheet" aria-label="Choisir la langue">${ic('globe')}<span class="no-tr">${esc(I18N.name())}</span></button>
    <svg class="ledger" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><rect x="30" y="20" width="140" height="170" rx="10"/>${[55, 80, 105, 130, 155].map(y => `<path d="M50 ${y}h100"/>`).join('')}<path d="M80 20v170"/></svg>
    <img class="hubmark no-tr" src="ubora-hub.png" width="512" height="512" alt="Logo Ubora" decoding="async">
    <div class="label" style="color:inherit;opacity:.85">Épargne et crédit villageois</div>
    <h1>Akiba</h1>
    ${K.data.avecs.length ? '' : '<p>Le cahier de l\'AVEC dans le téléphone, même sans réseau.</p>'}
  </header>
  <main class="main login">
    ${licenceBanner()}
    <!-- Un groupe qui ouvre Akiba trois fois par semaine n'a pas besoin qu'on lui redise ce que
         fait l'application : il veut savoir ce qui se passe maintenant, et entrer. L'écran
         répond dans cet ordre, et la promesse ne reste que sur un téléphone encore vierge.
         Aucun montant ici : il s'affiche avant qu'on ait tapé le moindre code. -->
    <!-- En démonstration, les vignettes laisseraient croire à un vrai cahier et feraient
         double emploi avec la porte de la salle d’essai, plus bas. -->
    ${K.data.mode === 'prod' ? blocMaintenant() + grilleAvecs() + (enAvant ? envoiBloc(enAvant) : '') : ''}
    ${K.data.avecs.length ? ''
      : ticker([{ icon: 'shield', label: "Journal scellé, impossible à modifier" }, { icon: 'sync', label: "Tout fonctionne sans réseau" }, { icon: 'calendar', label: "La réunion guidée en 8 étapes" }, { icon: 'coins', label: "Épargne, crédits, amendes, partage" }, { icon: 'users', label: "Le carnet de chaque membre" }, { icon: 'globe', label: "Français, lingala, swahili, tshiluba, kikongo" }, { icon: 'chart', label: "Export Excel pour l'organisation" }], { aria: "Ce que fait Akiba" })}
    <!-- les gestes secondaires. Commencer et recevoir une AVEC sont désormais des vignettes,
         parce qu'on les cherche là où sont les groupes : il ne reste ici que le guide. -->
    <nav class="liens" aria-label="Autres gestes">
      ${K.data.mode === 'prod' && !K.data.avecs.length && canCreate ? `<button data-act="createAvec">${ic('plus')}<span>Commencer notre AVEC</span></button>` : ''}
      <button data-act="receiveSheet">${ic('sync')}<span>Recevoir ${K.data.mode === 'prod' && K.data.avecs.length ? 'une autre' : 'notre'} AVEC</span></button>
      <button data-act="go" data-to="guide">${ic('book')}<span>Guide</span></button>
    </nav>
    ${demo}
  </main></div>`;
};
ACT.resetDemo = () => App.openSheet(`<h2>Remettre la démo à zéro ?</h2><p class="muted">Toutes les réunions ajoutées sur ce téléphone seront effacées et les données fictives rechargées.</p>
  <button class="btn danger block xl" data-act="resetDemoOk">Effacer et recharger</button><button class="btn ghost block" data-act="closeSheet">Garder mes données</button>`);
ACT.resetDemoOk = () => { DB.reset(); Object.keys(_chain).forEach(k => delete _chain[k]); App.go('login'); App.toast('Démo rechargée'); };

/* Choisir son AVEC : les mêmes vignettes que sur l’accueil. Un bureau reconnaît son groupe
   à son emblème avant d’en lire le nom, et l’écran reste le même d’un bout à l’autre. */
SCREENS['l.avec'] = () => `<div class="shell">${topbar('Choisir mon AVEC', 'Sur ce téléphone', backBtn('login'))}<main class="main">
  ${K.data.avecs.length ? `<div class="grille-avec">${K.data.avecs.map(a => {
    const etat = a.status === 'pending' ? '<span class="chip warn">À valider</span>'
      : a.status === 'refused' ? '<span class="chip bad">Refusée</span>'
      : a.orgId ? '<span class="chip brand">Suivie</span>' : '';
    return `<button class="vignette" data-act="go" data-to="l.member" data-id="${a.id}">
      ${etat}${emblemeHtml(a, 56)}<span class="nm">${esc(a.name)}</span>
      <span class="vl">${esc(a.village)} · ${a.members.length} membres</span></button>`;
  }).join('')}</div>` : '<div class="li muted">Aucune AVEC sur ce téléphone. Commencez la vôtre depuis l\x27accueil.</div>'}
  <button class="linkbtn" data-act="receiveSheet">Recevoir une autre AVEC (fichier envoyé par l'animateur)</button></main></div>`;
SCREENS['l.member'] = p => {
  const a = avecById(p.id);
  const sorted = a.members.filter(m => !m.left).sort((x, y) => (isBureau(y) - isBureau(x)) || (y.key - x.key));
  const bureau = sorted.filter(isBureau), open = openMeeting(a);
  // d'abord la réunion (bureau seulement, en grand) ; la liste complète sert à consulter son carnet
  if (!p.list) return `<div class="shell">${topbar(a.name, esc(a.village), backBtn('l.avec'))}<main class="main">
    <section class="section"><h2>${open ? `Continuer la réunion n°${open.n}` : 'Tenir la réunion'}</h2>
      <p class="muted">Le responsable présent touche son nom et tape son code.</p>
      <!-- les mêmes vignettes que pour les groupes : on touche un visage, pas une ligne de texte -->
      <div class="grille-avec">${bureau.map(m => `<button class="vignette perso" data-act="loginMember" data-avec="${a.id}" data-id="${m.id}">${avatar(m)}<span class="nm">${esc(m.name)}</span><span class="vl">${roleLabel(m)}</span></button>`).join('') || '<div class="card muted">Aucun membre du bureau dans ce groupe.</div>'}</div>
    </section>
    <section class="section"><h2>Voir mon carnet</h2>
      <button class="who" data-act="go" data-to="l.member" data-id="${a.id}" data-list="1"><span class="ic" style="background:var(--maize-soft);color:var(--warn)">${ic('book')}</span><span><b>Tous les membres</b><span class="small muted">Touchez votre nom : épargne, crédits, amendes</span></span></button>
    </section>
    <button class="btn ghost block" data-act="go" data-to="l.lost" data-avec="${a.id}">${ic('key')} J'ai oublié mon code secret</button></main></div>`;
  return `<div class="shell">${topbar(a.name, 'Tous les membres', backBtn('l.member', `data-id="${a.id}"`))}<main class="main">
    <div><h1 style="font-size:1.45rem">Touchez votre nom</h1><p class="muted">Pour voir votre carnet : épargne, crédits et amendes. Le <b>bureau</b> peut aussi se connecter ici.</p></div>
    ${sorted.length > 12 ? `<input id="lmS" class="input" type="search" placeholder="Chercher mon nom…" aria-label="Chercher mon nom" autocomplete="off" data-in="findName">` : ''}
    <div class="list">${sorted.map(m => `<button class="li" data-act="loginMember" data-avec="${a.id}" data-id="${m.id}" data-name="${esc(m.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}">${avatar(m)}<span class="grow"><b>${esc(m.name)}</b><span class="small muted">${roleLabel(m)}</span></span>${ic('chev')}</button>`).join('')}</div>
    <button class="btn ghost block" data-act="go" data-to="l.lost" data-avec="${a.id}">${ic('key')} J'ai oublié mon code secret</button></main></div>`;
};
ACT.loginMember = d => {
  const a = avecById(d.avec), m = memberOf(a, d.id);
  askPin(m, 'Connexion', () => { K.session = { kind: 'avec', avecId: a.id, memberId: m.id }; rememberAvec(a.id); DB.save(); App.go('a.home'); });
};
/* Sans rôle demandé, la liste réunit animateurs et organisation : une seule porte, chacun prend son nom. */
SCREENS['l.users'] = p => {
  const list = K.data.users.filter(u => (!p.role || u.role === p.role) && !u.remote && (u.role === 'anim' || u.role === 'org'));
  const titre = p.role === 'org' ? 'Organisation' : p.role === 'anim' ? 'Animateurs' : 'Entrer dans mon espace';
  return `<div class="shell">${topbar(titre, 'Choisissez votre nom', backBtn('login'))}<main class="main">
    <div class="list">${list.map(u => `<button class="li" data-act="loginUser" data-id="${u.id}"><span class="av">${esc(initials(u.name))}</span><span class="grow"><b>${esc(u.name)}</b><span class="small muted">${u.role === 'org' ? 'Organisation' : 'Animateur'} · ${esc(orgOf(u.orgId).name)}${u.zone ? ' · ' + esc(u.zone) : ''}</span></span>${ic('chev')}</button>`).join('') || '<div class="li muted">Aucun compte sur ce téléphone. L\'organisation en crée un depuis son tableau de bord.</div>'}</div>
    ${list.some(u => u.role === 'org') ? `<button class="btn ghost block" data-act="orgLostSheet">${ic('key')} J'ai oublié mon code (organisation)</button>` : ''}
    ${list.some(u => u.role === 'anim') ? '<div class="card small muted">Animateur, code oublié ? Votre organisation vous en donne un nouveau : tableau de bord › « Code oublié d\'un animateur ».</div>' : ''}
  </main></div>`;
};
ACT.loginUser = d => {
  const u = userById(d.id);
  askPin(u, 'Connexion', () => { K.session = { kind: u.role, userId: u.id }; DB.save(); App.go(u.role === 'org' ? 'o.home' : 'n.home'); });
};

/* ---------- animateur ---------- */
const N_TABS = [{ id: 'n.home', icon: 'users', label: 'Mes AVEC' }, { id: 'n.alerts', icon: 'alert', label: 'Alertes' }, { id: 't.home', icon: 'clip', label: 'Formation' }, { id: 'c.avec', icon: 'plus', label: 'Nouvelle AVEC' }, { id: 'guide', icon: 'book', label: 'Guide' }];
const myAvecs = u => K.data.avecs.filter(a => u.role === 'org' ? a.orgId === u.orgId : a.animId === u.id);
/* bande défilante de suivi : les alertes passent en premier, sinon les grands repères */
function supBand(rows, extra) {
  const al = rows.flatMap(r => r.h.alerts.map(a => Object.assign({ av: r.avec.name }, a))).sort((a, b) => LVL[a.lvl] - LVL[b.lvl]);
  /* La bande sert à alerter, pas à tout dire : les trois plus graves, puis le compte des autres.
     La liste complète est juste en dessous, dans « Alertes ». */
  if (al.length) {
    const vues = al.slice(0, 3).map(a => ({ icon: 'alert', label: `${a.av} : ${a.title}`, value: a.detail }));
    if (al.length > 3) vues.push({ icon: 'chev', label: `et ${al.length - 3} autre${al.length - 3 > 1 ? 's' : ''} plus bas` });
    return ticker(vues, { cls: 'alerts', aria: 'Points à vérifier' });
  }
  return ticker([{ icon: 'check', label: 'Aucune alerte sur les AVEC suivies' }].concat(extra || []), { aria: 'Repères du suivi' });
}
SCREENS['n.home'] = () => {
  const u = me_user();
  const rows = myAvecs(u).map(sup).sort((a, b) => LVL[a.h.level] - LVL[b.h.level]);
  const members = rows.reduce((s, r) => s + r.avec.members.length, 0);
  const savings = rows.reduce((s, r) => s + r.st.sum.EPARGNE, 0);
  const nAlerts = rows.reduce((s, r) => s + r.h.alerts.length, 0);
  return `<div class="shell">${topbar(u.name, `${liveTag()} · ${esc(u.zone || '')}${demoTag()}`, '', logoutBtn)}<main class="main">
    ${supBand(rows, [{ icon: 'users', label: 'Membres suivis', value: String(members) }, { icon: 'coins', label: 'Épargne cumulée', value: fck(savings) }])}
    <div class="grid2">
      <div class="kpi"><span>AVEC suivies</span><b class="num">${rows.length}</b><span>${members} membres</span></div>
      <div class="kpi"><span>Épargne cumulée</span><b class="num">${fck(savings)}</b><span>données reçues</span></div>
    </div>
    ${nAlerts ? `<button class="alert bad" style="border-top:0;border-right:0;border-bottom:0;width:100%;text-align:left" data-act="go" data-to="n.alerts"><span style="width:22px;flex:none">${ic('alert')}</span><span style="flex:1"><b>${nAlerts} point${nAlerts > 1 ? 's' : ''} à vérifier</b><span class="small">Écarts de caisse, retards, réunions manquées</span></span>${ic('chev')}</button>` : ''}
    <h2>Mes AVEC</h2>
    <div class="list">${rows.map(r => `<button class="li" data-act="go" data-to="n.avec" data-id="${r.avec.id}"><span class="health ${r.h.level}" aria-label="${r.h.level}"></span>
      <span class="grow"><b>${esc(r.avec.name)}</b><span class="small muted">${esc(r.avec.village)} · ${r.avec.members.length} membres · réunion ${r.st.last ? ago(r.st.last.date) : '—'}</span></span>
      <span class="end"><span class="num">${fck(r.st.sum.EPARGNE)}</span><br>${r.avec.status === 'pending' ? '<span class="chip warn">À valider</span>' : r.avec.status === 'refused' ? '<span class="chip bad">Refusée</span>' : r.h.alerts.length ? `<span class="chip ${r.h.level}">${r.h.alerts.length} alerte${r.h.alerts.length > 1 ? 's' : ''}</span>` : '<span class="chip good">RAS</span>'}</span></button>`).join('')}</div>
    <button class="btn brand block" data-act="receiveSheet">${ic('sync')} Recevoir une AVEC</button>
    <button class="btn ghost block" data-act="unlockSheet">${ic('lock')} Débloquer un membre (code perdu)</button>
    <button class="btn ghost block" data-act="exportSheet">${ic('chart')} Exporter mes AVEC vers Excel</button>
    <button class="btn ghost block" data-act="go" data-to="dev.backup">${ic('shield')} Installer et sauvegarder</button>
    <div class="grid2"><button class="btn ghost" data-act="go" data-to="tr.edit" data-lang="ln">${ic('globe')} Langues</button><button class="btn ghost" data-act="themeSheet">${ic('eye')} Apparence</button><button class="btn ghost" data-act="userPinSheet">${ic('key')} Mon code</button></div>
  </main>${tabbar(N_TABS, 'n.home')}</div>`;
};
SCREENS['n.alerts'] = () => {
  const u = me_user();
  const all = myAvecs(u).map(sup).flatMap(r => r.h.alerts).sort((a, b) => LVL[a.lvl] - LVL[b.lvl]);
  return `<div class="shell">${topbar('Alertes', esc(u.name), '', logoutBtn)}<main class="main">
    <h1>À vérifier sur le terrain</h1>
    ${all.map(a => alertHtml(a)).join('') || '<div class="alert good"><div><b>Tout va bien</b><span class="small">Aucune alerte dans vos AVEC.</span></div></div>'}
  </main>${tabbar(N_TABS, 'n.alerts')}</div>`;
};
SCREENS['n.avec'] = p => {
  const u = me_user();
  const avec = avecById(p.id);
  if (!avec || !myAvecs(u).includes(avec)) return SCREENS[u.role === 'org' ? 'o.home' : 'n.home']();
  const { st, ch, h } = sup(avec);
  const isOrg = u.role === 'org';
  const anim = avec.animId ? userById(avec.animId) : null;
  const late = st.activeLoans.filter(l => l.status === 'retard');
  return `<div class="shell ${isOrg ? '' : ''}">${topbar(avec.name, `${esc(avec.village)}, ${esc(avec.territoire)} · ${esc(anim ? anim.name : '')}`, backBtn(isOrg ? 'o.home' : 'n.home'))}<main class="main">
    ${statusBanner(avec, u)}
    ${transferBlock(avec)}
    <div class="row small muted" style="flex-wrap:wrap;gap:8px">${ic('cloud')}<span>Données reçues ${avec.lastSync ? ago(avec.lastSync) : 'jamais'}. Lecture seule : seul le bureau du groupe écrit dans le cahier.</span></div>
    ${h.alerts.map(a => `<div class="alert ${a.lvl}"><span style="width:22px;flex:none">${ic('alert')}</span><div><b>${esc(a.title)}</b><span class="small">${esc(a.detail)}</span></div></div>`).join('') || '<div class="alert good"><span style="width:22px;flex:none">' + ic('check') + '</span><div><b>Rien à signaler</b><span class="small">Caisse juste, crédits à jour, réunions régulières.</span></div></div>'}
    <div class="kpis">
      <div class="kpi"><span>Caisse</span><b class="num">${fck(st.cash)}</b></div>
      <div class="kpi"><span>Épargne</span><b class="num">${fck(st.sum.EPARGNE)}</b></div>
      <div class="kpi"><span>Crédits dehors</span><b class="num">${fck(st.outstanding)}</b></div>
      <div class="kpi"><span>PAR</span><b class="num" style="color:${st.par > .1 ? 'var(--bad)' : 'inherit'}">${pct(st.par)}</b></div>
      <div class="kpi"><span>Présence</span><b class="num">${pct(st.attendance)}</b></div>
      <div class="kpi"><span>Membres</span><b class="num">${st.activeCount}</b><span>${st.women} femmes</span></div>
    </div>
    <div class="alert ${ch.ok ? 'good' : 'bad'}"><span style="width:22px;flex:none">${ic('shield')}</span><div><b>${ch.ok ? 'Journal intact' : 'Journal altéré'}</b><span class="small">${ch.ok ? `${avec.tx.length} écritures vérifiées par empreinte` : esc(ch.reason)}</span></div></div>
    ${(q => readyCard(imfReady(avec, st, ch, q)) + qualityCard(q))(dataQuality(avec, st, ch))}
    <section class="section"><h2>Réunions reçues</h2><div class="list">${st.meetings.slice(-6).reverse().map(m => meetingLi(avec, m)).join('') || '<div class="li muted">Aucune</div>'}</div></section>
    ${late.length ? `<section class="section"><h2>Crédits en retard</h2><div class="list">${late.map(l => loanLi(avec, l)).join('')}</div></section>` : ''}
    ${trainingBlock(avec)}
    ${profileHtml(avec)}
    ${cycleInfo(avec, st)}
    <section class="section"><div class="row between"><h2>Visites</h2>${isOrg ? '' : `<button class="btn sm brand" data-act="visitSheet" data-id="${avec.id}">${ic('clip')} Noter une visite</button>`}</div>
      ${avec.visits.slice().reverse().map(v => `<div class="receipt"><div class="row between small"><b>${fdate(v.ts)} · ${['', 'À renforcer', 'Correct', 'Très bien'][v.score]}</b><span class="muted">${esc(userById(v.by)?.name || '')}</span></div><p class="small">${esc(v.note)}</p></div>`).join('') || '<div class="card muted">Aucune visite notée</div>'}
    </section>
  </main></div>`;
};
ACT.visitSheet = d => App.openSheet(`<h2>Visite de suivi</h2>
  <div class="field"><label for="viS">Comment s'est passée la réunion ?</label><select id="viS" class="input"><option value="3">Très bien</option><option value="2" selected>Correct</option><option value="1">À renforcer</option></select></div>
  <div class="field"><label for="viN">Observations</label><textarea id="viN" class="input" rows="4" placeholder="Comptage public, tenue des carnets, respect du règlement…"></textarea></div>
  <button class="btn primary block xl" data-act="saveVisit" data-id="${d.id}">Enregistrer la visite</button>`);
ACT.saveVisit = d => {
  const note = document.getElementById('viN').value.trim();
  if (!note) return App.toast('Écrivez vos observations');
  avecById(d.id).visits.push({ id: uid(), by: K.session.userId, ts: Date.now(), note, score: +document.getElementById('viS').value });
  DB.save(); App.closeSheet(); App.toast('Visite enregistrée');
};

/* ---------- organisation ----------
   Le tableau de bord d'une ONG. Sur ordinateur : le tableau de toutes les AVEC, large.
   Sur téléphone : les mêmes AVEC en fiches, lisibles d'un pouce — un tableau de treize
   colonnes ne se lit pas sur un téléphone, même en le faisant glisser.
   Tant qu'aucun groupe n'est rattaché, l'écran n'affiche pas des colonnes de zéros :
   il dit quoi faire en premier. */
const oPar = r => `<span class="chip ${r.st.par > .1 ? 'bad' : r.st.par > 0 ? 'warn' : 'good'}">PAR ${pct(r.st.par)}</span>`;
const oNom = a => esc(noAcc(a.name + ' ' + (a.village || '') + ' ' + (a.territoire || '')).toLowerCase());
/* la même AVEC, en fiche : ce qu'un responsable regarde d'abord */
const oCarte = r => `<button class="li ocarte" data-act="go" data-to="n.avec" data-id="${r.avec.id}" data-name="${oNom(r.avec)}">
  <span class="health ${r.h.level}" aria-label="${r.h.level}"></span>
  <span class="grow"><b>${esc(r.avec.name)}</b>
    <span class="small muted">${placeShort(r.avec)} · ${esc(userById(r.avec.animId)?.name || 'sans animateur')}</span>
    <span class="small muted">${r.st.activeCount} membres · ${r.st.last ? 'réunion ' + ago(r.st.last.date) : 'aucune réunion'}${pending(r.avec) ? ' · <b style=\"color:var(--warn)\">à recevoir</b>' : ''}</span>
    <span class="small sous">épargne <b class="num">${fck(r.st.sum.EPARGNE)}</b> · crédits <b class="num">${fck(r.st.outstanding)}</b></span></span>
  ${oPar(r)}</button>`;
/* chercher un groupe par son nom, son village ou son territoire : tableau et fiches à la fois */
INP.findAvec = el => {
  const q = noAcc(el.value.trim().toLowerCase());
  document.querySelectorAll('.li[data-name],tr[data-name]').forEach(x => { x.hidden = !!q && !x.dataset.name.includes(q); });
};
INP.oAnim = el => App.go('o.home', el.value ? { anim: el.value } : {});
const oAnimListe = (anims, all) => `<div class="list">${anims.map(a => {
  const mine = all.filter(r => r.avec.animId === a.id);
  const al = mine.reduce((s, r) => s + r.h.alerts.length, 0);
  const sous = [a.sex ? (a.sex === 'M' ? 'Homme' : 'Femme') : '', esc(a.zone || ''), mine.length ? mine.length + ' AVEC · ' + mine.reduce((s, r) => s + r.st.activeCount, 0) + ' membres' : 'aucune AVEC'].filter(Boolean).join(' · ');
  return `<button class="li" data-act="go" data-to="o.home" data-anim="${a.id}"><span class="av">${esc(initials(a.name))}</span><span class="grow"><b>${esc(a.name)}</b><span class="small muted">${sous}</span></span>${al ? `<span class="chip warn">${al} alerte${al > 1 ? 's' : ''}</span>` : mine.length ? '<span class="chip good">RAS</span>' : ''}</button>`;
}).join('')}</div>`;
const oAnimBoutons = anims => `<button class="btn ghost block" data-act="addAnimSheet">${ic('plus')} Ajouter un animateur</button>
  ${anims.length ? `<button class="btn ghost block" data-act="animCodesSheet">${ic('key')} Code oublié d'un animateur</button>` : ''}`;

/* première ouverture : rien à mesurer encore, tout à mettre en route */
function oDemarrage(org, anims) {
  const row = (act, to, icon, titre, sous, extra = '') => `<button class="li" data-act="${act}" ${to ? `data-to="${to}"` : ''} ${extra}><span class="xl-ic">${ic(icon)}</span><span class="grow"><b>${titre}</b><span class="small muted">${sous}</span></span>${ic('chev')}</button>`;
  let n = 0;
  const num = () => ++n + '. ';
  return `<div class="shell">${topbar(esc(org.name), 'Mise en route' + demoTag(), '', logoutBtn)}<main class="main">
    <div class="alert good">${icSpan('check')}<div><b>Le compte de votre organisation est en place</b>
      <span class="small">Il reste à lui rattacher des animateurs et des AVEC. Le tableau de bord — épargne, crédits, alertes, qualité des données — s'affichera dès le premier groupe suivi.</span></div></div>
    <h2>Pour commencer</h2>
    <div class="list">
      ${anims.length ? '' : row('addAnimSheet', '', 'plus', num() + 'Ajouter un animateur', 'Il reçoit son nom et son code, puis crée les AVEC de sa zone')}
      ${row('go', 'c.avec', 'plus', num() + 'Créer une première AVEC', 'Avec l’assemblée réunie : règlement, membres, bureau', 'data-from="org"')}
      ${row('receiveSheet', '', 'sync', num() + 'Recevoir une AVEC déjà suivie', 'Un animateur ou un groupe vous envoie son fichier et son code')}
    </div>
    ${anims.length ? `<h2>Animateurs</h2>${oAnimListe(anims, [])}` : ''}
    ${oAnimBoutons(anims)}
    <div class="grid2"><button class="btn ghost" data-act="go" data-to="guide">${ic('book')} Guide</button><button class="btn ghost" data-act="outilsSheet">${ic('more')} Outils</button></div>
    <p class="hint">Les AVEC autonomes n'apparaissent jamais dans votre tableau de bord : leurs données restent à elles.</p>
  </main></div>`;
}

SCREENS['o.home'] = p => {
  const u = K.session && K.session.userId ? me_user() : null;
  if (!u || u.role !== 'org') return SCREENS[homeScreen()]({});   // tableau de bord réservé à l'organisation
  const org = orgOf(u.orgId) || { id: u.orgId, name: 'Mon organisation' };
  const anims = K.data.users.filter(x => x.role === 'anim' && x.orgId === org.id);
  if (!myAvecs(u).length) return oDemarrage(org, anims);
  const all = myAvecs(u).filter(isActive).map(sup);
  const rows = (p.anim ? all.filter(r => r.avec.animId === p.anim) : all).sort((a, b) => LVL[a.h.level] - LVL[b.h.level]);
  const tot = k => rows.reduce((s, r) => s + k(r), 0);
  const members = tot(r => r.st.activeCount), women = tot(r => r.st.women);
  const outstanding = tot(r => r.st.outstanding), late = tot(r => r.st.lateAmt);
  const alerts = rows.flatMap(r => r.h.alerts).sort((a, b) => LVL[a.lvl] - LVL[b.lvl]);
  const maxSav = Math.max(1, ...rows.map(r => r.st.sum.EPARGNE));
  const recus = rows.filter(r => !pending(r.avec)).length;
  /* jusqu'à trois animateurs : des boutons. Au-delà : une liste déroulante, sinon la barre déborde */
  const filtre = anims.length > 3
    ? `<select class="input sm" data-in="oAnim" aria-label="Filtrer par animateur" style="max-width:190px"><option value="">Tous les animateurs</option>${anims.map(a => `<option value="${a.id}"${p.anim === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`
    : `<button class="btn sm ${p.anim ? 'ghost' : 'brand'}" data-act="go" data-to="o.home">Toutes</button>
       ${anims.map(a => `<button class="btn sm ${p.anim === a.id ? 'brand' : 'ghost'}" data-act="go" data-to="o.home" data-anim="${a.id}">${esc(a.name)}</button>`).join('')}`;
  return `<div class="shell wide">${topbar(esc(org.name), liveTag() + demoTag(), '', logoutBtn)}<main class="main">
    <div class="row between" style="flex-wrap:wrap">
      <h1>Vue d'ensemble</h1>
      <div class="row" style="flex-wrap:wrap;gap:6px">
        ${filtre}
        <span class="sep" aria-hidden="true"></span>
        <!-- sur un téléphone ces trois-là passent dans « Outils » : une barre de quatre rangées
             mange l'écran, et on ne les touche pas à chaque visite -->
        <button class="btn sm brand surOrdi" data-act="go" data-to="o.impact">${ic('chart')} Impact</button>
        <button class="btn sm ghost surOrdi" data-act="go" data-to="o.imf">${ic('building')} IMF</button>
        <button class="btn sm ghost surOrdi" data-act="exportSheet" data-anim="${esc(p.anim || '')}">${ic('chart')} Excel</button>
        <button class="btn sm primary" data-act="go" data-to="c.avec" data-from="org">${ic('plus')} Nouvelle AVEC</button>
        <button class="btn sm ghost" data-act="outilsSheet" aria-label="Autres outils">${ic('more')}</button>
      </div>
    </div>
    ${supBand(rows, [{ icon: 'users', label: 'Membres', value: String(members) }, { icon: 'coins', label: 'Crédits en cours', value: fck(outstanding) }, { icon: 'chart', label: 'AVEC suivies', value: String(rows.length) }])}
    <div class="kpis">
      <div class="kpi"><span>AVEC suivies</span><b class="num">${rows.length}</b><span>${rows.filter(r => r.h.level === 'good').length} sans alerte</span></div>
      <div class="kpi"><span>Membres</span><b class="num">${members}</b><span>${members ? pct(women / members) + ' de femmes' : '—'}</span></div>
      <div class="kpi"><span>Épargne cumulée</span><b class="num">${fck(tot(r => r.st.sum.EPARGNE))}</b><span>cycle en cours</span></div>
      <div class="kpi"><span>Crédits en cours</span><b class="num">${fck(outstanding)}</b><span>${tot(r => r.st.activeLoans.length)} crédits</span></div>
      <div class="kpi"><span>Portefeuille à risque</span><b class="num" style="color:${late / (outstanding || 1) > .1 ? 'var(--bad)' : 'inherit'}">${pct(outstanding ? late / outstanding : 0)}</b><span>${fck(late)} en retard</span></div>
      <div class="kpi"><span>Données reçues</span><b class="num">${recus}/${rows.length}</b><span>${rows.length - recus ? (rows.length - recus) + ' envoi(s) en attente' : 'tout est à jour'}</span></div>
    </div>
    <div class="dash">
      <div class="stack">
        <div class="row between" style="flex-wrap:wrap;gap:8px"><h2 style="margin:0">AVEC suivies</h2>
          ${rows.length > 6 ? `<input class="input sm" data-in="findAvec" type="search" placeholder="Chercher un groupe, un village…" aria-label="Chercher une AVEC" style="max-width:260px">` : ''}</div>
        <!-- téléphone : des fiches. Ordinateur : le tableau complet. Un seul jeu de données, deux lectures. -->
        <div class="list ofiches">${rows.map(oCarte).join('')}</div>
        <div class="tablewrap otable"><table>
          <thead><tr><th></th><th>AVEC</th><th>Animateur</th><th class="r">Membres</th><th class="r">Épargne</th><th class="r">Crédits</th><th class="r" title="Portefeuille à risque : part des crédits en retard">PAR</th><th>Formation</th><th>Données</th><th>IMF</th><th>Cycle</th><th>Dernière réunion</th><th>Reçu</th></tr></thead>
          <tbody>${rows.map(r => `<tr class="click" data-act="go" data-to="n.avec" data-id="${r.avec.id}" data-name="${oNom(r.avec)}">
            <td><span class="health ${r.h.level}"></span></td>
            <td><b>${esc(r.avec.name)}</b><br><span class="small muted">${placeShort(r.avec)}</span></td>
            <td>${esc(userById(r.avec.animId)?.name || '—')}</td>
            <td class="r num">${r.st.activeCount}</td>
            <td class="r num">${fc(r.st.sum.EPARGNE)}</td>
            <td class="r num">${fc(r.st.outstanding)}</td>
            <td class="r num" style="color:${r.st.par > .1 ? 'var(--bad)' : 'inherit'}">${pct(r.st.par)}</td>
            <td>${trainingChip(r.avec)}</td>
            ${(q => `<td>${qualityChip(q)}</td><td>${readyChip(imfReady(r.avec, r.st, r.ch, q))}</td>`)(dataQuality(r.avec, r.st, r.ch))}
            <td>n°${r.avec.cycle.n} · fin ${fdate(cycleEnd(r.avec))}</td>
            <td>${r.st.last ? ago(r.st.last.date) : '—'}</td>
            <td>${pending(r.avec) ? `<span class="chip warn">${ago(r.avec.lastSync)}</span>` : '<span class="chip good">à jour</span>'}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="hint">PAR : portefeuille à risque, la part des crédits en retard. « Données » note ce qu'un prêteur
          regarde — journal intact, caisse fermée à trois clés, écritures complètes. Touchez une AVEC pour ouvrir sa fiche.</p>
        <h2>Épargne et crédits par AVEC</h2>
        <div class="card stack">
          <div class="row small muted" style="gap:14px"><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--brand);display:inline-block"></i>Épargne</span><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--maize);display:inline-block"></i>Crédits dehors</span></div>
          ${rows.slice().sort((a, b) => b.st.sum.EPARGNE - a.st.sum.EPARGNE).slice(0, 12).map(r => `<div class="stack" style="gap:4px"><div class="row between small"><b>${esc(r.avec.name)}</b><span class="num muted">${fc(r.st.sum.EPARGNE)} · ${fc(r.st.outstanding)}</span></div>
            <div class="bar" style="height:10px"><i style="width:${(r.st.sum.EPARGNE / maxSav * 100).toFixed(1)}%"></i></div>
            <div class="bar" style="height:10px"><i style="width:${(r.st.outstanding / maxSav * 100).toFixed(1)}%;background:var(--maize)"></i></div></div>`).join('')}
          ${rows.length > 12 ? '<p class="hint">Les douze premières AVEC par épargne. L’export Excel contient toutes les lignes.</p>' : ''}
        </div>
      </div>
      <div class="stack">
        ${pendingBlock(u)}
        <h2>Alertes</h2>
        ${alerts.map(a => alertHtml(a, 'o')).join('') || `<div class="alert good">${icSpan('check')}<div><b>Aucune alerte</b><span class="small">Aucun écart de caisse, aucun retard, aucune réunion manquée.</span></div></div>`}
        <h2>Animateurs</h2>
        ${anims.length ? oAnimListe(anims, all) : '<div class="card small muted" style="padding:14px">Aucun animateur : vous suivez les AVEC vous-même.</div>'}
        ${oAnimBoutons(anims)}
        <p class="hint">Les AVEC autonomes n'apparaissent jamais ici : leurs données restent à elles.</p>
      </div>
    </div>
  </main></div>`;
};

/* ---------- création d'une AVEC : voir create.js ---------- */
