/* Akiba AVEC — connexion, animateur, organisation, création d'AVEC */
'use strict';

const me_user = () => userById(K.session.userId);
const orgOf = id => K.data.orgs.find(o => o.id === id);
function sup(avec) {
  const st = stats(avec, { syncedOnly: true });
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
  const inner = (name, sub) => `<span class="ic">${ic('users')}</span><span class="t"><b>AVEC</b><span class="nm">${name}</span><span class="sub">${sub}</span></span>${ic('chev')}`;
  if (!list.length) return `<div class="avec-main empty"><span class="ic">${ic('users')}</span><span class="t"><b>AVEC</b><span class="sub">Aucune AVEC sur ce téléphone. Touchez « Recevoir une AVEC » (envoyée par l'animateur) ou « Créer une AVEC ».</span></span></div>`;
  const pick = list.length === 1 ? list[0] : list.find(a => a.id === lastAvecId());
  if (pick) return `<button class="avec-main" data-act="go" data-to="l.member" data-id="${pick.id}">${inner(esc(pick.name), esc(pick.village) + ' · touchez pour entrer')}</button>
    ${list.length > 1 ? `<button class="linkbtn" data-act="go" data-to="l.avec">Autre AVEC sur ce téléphone (${list.length})</button>` : ''}`;
  return `<button class="avec-main" data-act="go" data-to="l.avec">${inner('Choisir mon AVEC', list.length + ' AVEC sur ce téléphone')}</button>`;
}
INP.findName = el => {
  const q = el.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  document.querySelectorAll('.li[data-name]').forEach(li => { li.hidden = !!q && !li.dataset.name.includes(q); });
};
SCREENS.login = () => {
  const hasAnim = K.data.users.some(u => u.role === 'anim' && !u.remote);
  const hasOrg = K.data.users.some(u => u.role === 'org' && !u.remote);
  const canCreate = !(K.data.mode === 'prod' && K.data.orgs.length);
  const who = (to, role, icon, tint, title, sub) => `<button class="who" data-act="go" data-to="${to}" ${role ? `data-role="${role}"` : ''}><span class="ic" style="${tint}">${ic(icon)}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  const quick = (act, to, icon, label, extra = '') => `<button class="quick" data-act="${act}" ${to ? `data-to="${to}"` : ''} ${extra}>${ic(icon)}<span>${label}</span></button>`;
  const demo = K.data.mode === 'prod'
    ? (K.data.orgs.length ? '' : `<button class="btn ghost block" data-act="go" data-to="s.org">${ic('building')} Créer le compte de mon organisation</button>`)
    : `<div class="demo">
        <p class="small"><b>Démonstration</b> · codes secrets <b class="mono">1234</b> · carte de secours <b class="mono">2468-1357</b></p>
        ${licKind() === 'demo' ? '<p class="hint">Licence de démonstration : les vraies données ne sont pas disponibles.</p>' : `<button class="btn primary block" data-act="goLive">${ic('check')} Commencer avec mes vraies données</button>`}
        <button class="linkbtn" data-act="resetDemo">Remettre la démo à zéro</button>
      </div>`;
  return `<div class="shell">
  <header class="hero">
    <button class="langbtn" data-act="langSheet" aria-label="Choisir la langue">${ic('globe')}<span class="no-tr">${esc(I18N.name())}</span></button>
    <svg class="ledger" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><rect x="30" y="20" width="140" height="170" rx="10"/>${[55, 80, 105, 130, 155].map(y => `<path d="M50 ${y}h100"/>`).join('')}<path d="M80 20v170"/></svg>
    <div class="label" style="color:inherit;opacity:.8">Épargne et crédit villageois</div>
    <h1>Akiba</h1>
    <p>Le cahier de l'AVEC dans le téléphone, même sans réseau.</p>
  </header>
  <main class="main">
    ${licenceBanner()}${installBanner()}
    <h2>Qui êtes-vous ?</h2>
    ${avecCard()}
    ${hasAnim || hasOrg ? `<div class="stack" style="gap:8px"><span class="label">Autres accès</span>
      ${hasAnim ? who('l.users', 'anim', 'map', 'background:var(--brand-soft);color:var(--brand)', 'Animateur de terrain', 'Je suis plusieurs AVEC') : ''}
      ${hasOrg ? who('l.users', 'org', 'building', 'background:var(--surface-2);color:var(--ink)', 'Organisation', 'Tableau de bord de nos AVEC') : ''}
    </div>` : ''}
    <div class="quicks">
      ${quick('receiveSheet', '', 'sync', 'Recevoir une AVEC')}
      ${canCreate ? quick('createAvec', '', 'plus', 'Créer une AVEC') : ''}
      ${quick('go', 'guide', 'book', 'Guide')}
    </div>
    ${demo}
    <button class="linkbtn" data-act="go" data-to="adm.home">Espace administrateur Ubora</button>
  </main></div>`;
};
ACT.resetDemo = () => App.openSheet(`<h2>Remettre la démo à zéro ?</h2><p class="muted">Toutes les réunions ajoutées sur ce téléphone seront effacées et les données fictives rechargées.</p>
  <button class="btn danger block xl" data-act="resetDemoOk">Effacer et recharger</button><button class="btn ghost block" data-act="closeSheet">Garder mes données</button>`);
ACT.resetDemoOk = () => { DB.reset(); Object.keys(_chain).forEach(k => delete _chain[k]); App.go('login'); App.toast('Démo rechargée'); };

SCREENS['l.avec'] = () => `<div class="shell">${topbar('Choisir mon AVEC', 'Sur ce téléphone', backBtn('login'))}<main class="main">
  <div class="list">${K.data.avecs.map(a => `<button class="li" data-act="go" data-to="l.member" data-id="${a.id}"><span class="av" style="border-radius:12px">${ic('users')}</span>
    <span class="grow"><b>${esc(a.name)}</b><span class="small muted">${esc(a.village)} · ${a.members.length} membres</span></span>
    ${a.status === 'pending' ? '<span class="chip warn">À valider</span>' : a.status === 'refused' ? '<span class="chip bad">Refusée</span>' : `<span class="chip ${a.orgId ? 'brand' : ''}">${a.orgId ? 'Suivie' : 'Autonome'}</span>`}</button>`).join('') || '<div class="li muted">Aucune AVEC sur ce téléphone. Créez-en une depuis l\'accueil.</div>'}</div></main></div>`;
SCREENS['l.member'] = p => {
  const a = avecById(p.id);
  const sorted = a.members.filter(m => !m.left).sort((x, y) => (isBureau(y) - isBureau(x)) || (y.key - x.key));
  return `<div class="shell">${topbar(a.name, 'Touchez votre nom', backBtn('l.avec'))}<main class="main">
    <div><h1 style="font-size:1.45rem">Touchez votre nom</h1><p class="muted">Pour tenir la réunion, un membre du <b>bureau</b> se connecte (président, secrétaire ou trésorier). Les autres membres voient leur carnet.</p></div>
    ${sorted.length > 12 ? `<input id="lmS" class="input" type="search" placeholder="Chercher mon nom…" aria-label="Chercher mon nom" autocomplete="off" data-in="findName">` : ''}
    <div class="list">${sorted.map(m => `<button class="li" data-act="loginMember" data-avec="${a.id}" data-id="${m.id}" data-name="${esc(m.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}">${avatar(m)}<span class="grow"><b>${esc(m.name)}</b><span class="small muted">${roleLabel(m)}</span></span>${ic('chev')}</button>`).join('')}</div>
    <button class="btn ghost block" data-act="go" data-to="l.lost" data-avec="${a.id}">${ic('key')} J'ai oublié mon code secret</button></main></div>`;
};
ACT.loginMember = d => {
  const a = avecById(d.avec), m = memberOf(a, d.id);
  askPin(m, 'Connexion', () => { K.session = { kind: 'avec', avecId: a.id, memberId: m.id }; rememberAvec(a.id); DB.save(); App.go('a.home'); });
};
SCREENS['l.users'] = p => {
  const list = K.data.users.filter(u => u.role === p.role && !u.remote);
  return `<div class="shell">${topbar(p.role === 'org' ? 'Organisation' : 'Animateurs', 'Choisissez votre compte', backBtn('login'))}<main class="main">
    <div class="list">${list.map(u => `<button class="li" data-act="loginUser" data-id="${u.id}"><span class="av">${esc(initials(u.name))}</span><span class="grow"><b>${esc(u.name)}</b><span class="small muted">${esc(orgOf(u.orgId).name)}${u.zone ? ' · ' + esc(u.zone) : ''}</span></span>${ic('chev')}</button>`).join('')}</div></main></div>`;
};
ACT.loginUser = d => {
  const u = userById(d.id);
  askPin(u, 'Connexion', () => { K.session = { kind: u.role, userId: u.id }; DB.save(); App.go(u.role === 'org' ? 'o.home' : 'n.home'); });
};

/* ---------- animateur ---------- */
const N_TABS = [{ id: 'n.home', icon: 'users', label: 'Mes AVEC' }, { id: 'n.alerts', icon: 'alert', label: 'Alertes' }, { id: 'c.avec', icon: 'plus', label: 'Nouvelle AVEC' }, { id: 'guide', icon: 'book', label: 'Guide' }];
const myAvecs = u => K.data.avecs.filter(a => u.role === 'org' ? a.orgId === u.orgId : a.animId === u.id);
SCREENS['n.home'] = () => {
  const u = me_user();
  const rows = myAvecs(u).map(sup).sort((a, b) => LVL[a.h.level] - LVL[b.h.level]);
  const members = rows.reduce((s, r) => s + r.avec.members.length, 0);
  const savings = rows.reduce((s, r) => s + r.st.sum.EPARGNE, 0);
  const nAlerts = rows.reduce((s, r) => s + r.h.alerts.length, 0);
  return `<div class="shell">${topbar(u.name, `${liveTag()} · ${esc(u.zone || '')}`, '', logoutBtn)}<main class="main">
    <div class="grid2">
      <div class="kpi"><span>AVEC suivies</span><b class="num">${rows.length}</b><span>${members} membres</span></div>
      <div class="kpi"><span>Épargne cumulée</span><b class="num">${fck(savings)}</b><span>données reçues</span></div>
    </div>
    ${nAlerts ? `<button class="alert bad" style="border-top:0;border-right:0;border-bottom:0;width:100%;text-align:left" data-act="go" data-to="n.alerts"><span style="width:22px;flex:none">${ic('alert')}</span><span style="flex:1"><b>${nAlerts} point${nAlerts > 1 ? 's' : ''} à vérifier</b><span class="small">Écarts de caisse, retards, réunions manquées</span></span>${ic('chev')}</button>` : ''}
    <h2>Mes AVEC</h2>
    <div class="list">${rows.map(r => `<button class="li" data-act="go" data-to="n.avec" data-id="${r.avec.id}"><span class="health ${r.h.level}" aria-label="${r.h.level}"></span>
      <span class="grow"><b>${esc(r.avec.name)}</b><span class="small muted">${esc(r.avec.village)} · ${r.avec.members.length} membres · réunion ${r.st.last ? ago(r.st.last.date) : '—'}</span></span>
      <span class="end"><span class="num">${fck(r.st.sum.EPARGNE)}</span><br>${r.avec.status === 'pending' ? '<span class="chip warn">À valider</span>' : r.avec.status === 'refused' ? '<span class="chip bad">Refusée</span>' : r.h.alerts.length ? `<span class="chip ${r.h.level}">${r.h.alerts.length} alerte${r.h.alerts.length > 1 ? 's' : ''}</span>` : '<span class="chip good">RAS</span>'}</span></button>`).join('')}</div>
    <button class="btn ghost block" data-act="unlockSheet">${ic('lock')} Débloquer un membre (code perdu)</button>
    <button class="btn ghost block" data-act="go" data-to="dev.backup">${ic('shield')} Installer et sauvegarder</button>
    <div class="grid2"><button class="btn ghost" data-act="go" data-to="tr.edit" data-lang="ln">${ic('globe')} Langues</button><button class="btn ghost" data-act="userPinSheet">${ic('key')} Mon code</button></div>
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
    <section class="section"><h2>Réunions reçues</h2><div class="list">${st.meetings.slice(-6).reverse().map(m => meetingLi(avec, m)).join('') || '<div class="li muted">Aucune</div>'}</div></section>
    ${late.length ? `<section class="section"><h2>Crédits en retard</h2><div class="list">${late.map(l => loanLi(avec, l)).join('')}</div></section>` : ''}
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

/* ---------- organisation ---------- */
SCREENS['o.home'] = p => {
  const u = K.session && K.session.userId ? me_user() : null;
  if (!u || u.role !== 'org') return SCREENS[homeScreen()]({});   // tableau de bord réservé à l'organisation
  const org = orgOf(u.orgId);
  const anims = K.data.users.filter(x => x.role === 'anim' && x.orgId === org.id);
  const all = myAvecs(u).filter(isActive).map(sup);
  const rows = p.anim ? all.filter(r => r.avec.animId === p.anim) : all;
  const tot = k => rows.reduce((s, r) => s + k(r), 0);
  const members = tot(r => r.st.activeCount), women = tot(r => r.st.women);
  const outstanding = tot(r => r.st.outstanding), late = tot(r => r.st.lateAmt);
  const alerts = rows.flatMap(r => r.h.alerts).sort((a, b) => LVL[a.lvl] - LVL[b.lvl]);
  const maxSav = Math.max(1, ...rows.map(r => r.st.sum.EPARGNE));
  return `<div class="shell wide">${topbar(org.name, liveTag(), '', logoutBtn)}<main class="main">
    <div class="row between" style="flex-wrap:wrap">
      <h1>Vue d'ensemble</h1>
      <div class="row" style="flex-wrap:wrap;gap:6px">
        <button class="btn sm ${p.anim ? 'ghost' : 'brand'}" data-act="go" data-to="o.home">Toutes</button>
        ${anims.map(a => `<button class="btn sm ${p.anim === a.id ? 'brand' : 'ghost'}" data-act="go" data-to="o.home" data-anim="${a.id}">${esc(a.name)}</button>`).join('')}
        <button class="btn sm ghost" data-act="go" data-to="guide">${ic('book')} Guide</button>
        <button class="btn sm ghost" data-act="go" data-to="tr.edit" data-lang="ln">${ic('globe')} Langues</button>
        <button class="btn sm ghost" data-act="userPinSheet">${ic('key')} Mon code</button>
        <button class="btn sm ghost" data-act="go" data-to="dev.backup">${ic('shield')} Sauvegarde</button>
        <button class="btn sm primary" data-act="go" data-to="c.avec" data-from="org">${ic('plus')} Nouvelle AVEC</button>
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><span>AVEC suivies</span><b class="num">${rows.length}</b><span>${rows.filter(r => r.h.level === 'good').length} sans alerte</span></div>
      <div class="kpi"><span>Membres</span><b class="num">${members}</b><span>${members ? pct(women / members) : '—'} de femmes</span></div>
      <div class="kpi"><span>Épargne cumulée</span><b class="num">${fck(tot(r => r.st.sum.EPARGNE))}</b><span>cycle en cours</span></div>
      <div class="kpi"><span>Crédits en cours</span><b class="num">${fck(outstanding)}</b><span>${tot(r => r.st.activeLoans.length)} crédits</span></div>
      <div class="kpi"><span>Portefeuille à risque</span><b class="num" style="color:${late / (outstanding || 1) > .1 ? 'var(--bad)' : 'inherit'}">${pct(outstanding ? late / outstanding : 0)}</b><span>${fck(late)} en retard</span></div>
      <div class="kpi"><span>Caisses sociales</span><b class="num">${fck(tot(r => r.st.socialFund))}</b><span>${fck(tot(r => r.st.sum.AIDE))} d'aides versées</span></div>
    </div>
    <div class="dash">
      <div class="stack">
        <h2>AVEC</h2>
        <div class="tablewrap"><table>
          <thead><tr><th></th><th>AVEC</th><th>Animateur</th><th class="r">Membres</th><th class="r">Épargne</th><th class="r">Crédits</th><th class="r">PAR</th><th>Cycle</th><th>Dernière réunion</th><th>Reçu</th></tr></thead>
          <tbody>${rows.sort((a, b) => LVL[a.h.level] - LVL[b.h.level]).map(r => `<tr class="click" data-act="go" data-to="n.avec" data-id="${r.avec.id}">
            <td><span class="health ${r.h.level}"></span></td>
            <td><b>${esc(r.avec.name)}</b><br><span class="small muted">${placeShort(r.avec)}</span></td>
            <td>${esc(userById(r.avec.animId)?.name || '—')}</td>
            <td class="r num">${r.avec.members.length}</td>
            <td class="r num">${fc(r.st.sum.EPARGNE)}</td>
            <td class="r num">${fc(r.st.outstanding)}</td>
            <td class="r num" style="color:${r.st.par > .1 ? 'var(--bad)' : 'inherit'}">${pct(r.st.par)}</td>
            <td>n°${r.avec.cycle.n} · fin ${fdate(cycleEnd(r.avec))}</td>
            <td>${r.st.last ? ago(r.st.last.date) : '—'}</td>
            <td>${pending(r.avec) ? `<span class="chip warn">${ago(r.avec.lastSync)}</span>` : '<span class="chip good">à jour</span>'}</td></tr>`).join('')}</tbody>
        </table></div>
        <h2>Épargne et crédits par AVEC</h2>
        <div class="card stack">
          <div class="row small muted" style="gap:14px"><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--brand);display:inline-block"></i>Épargne</span><span class="row" style="gap:6px"><i style="width:12px;height:12px;border-radius:3px;background:var(--maize);display:inline-block"></i>Crédits dehors</span></div>
          ${rows.map(r => `<div class="stack" style="gap:4px"><div class="row between small"><b>${esc(r.avec.name)}</b><span class="num muted">${fc(r.st.sum.EPARGNE)} · ${fc(r.st.outstanding)}</span></div>
            <div class="bar" style="height:10px"><i style="width:${(r.st.sum.EPARGNE / maxSav * 100).toFixed(1)}%"></i></div>
            <div class="bar" style="height:10px"><i style="width:${(r.st.outstanding / maxSav * 100).toFixed(1)}%;background:var(--maize)"></i></div></div>`).join('')}
        </div>
      </div>
      <div class="stack">
        ${pendingBlock(u)}
        <h2>Alertes</h2>
        ${alerts.map(a => alertHtml(a, 'o')).join('') || '<div class="alert good"><div><b>Aucune alerte</b></div></div>'}
        <h2>Animateurs</h2>
        <div class="list">${anims.map(a => { const mine = all.filter(r => r.avec.animId === a.id); const al = mine.reduce((s, r) => s + r.h.alerts.length, 0);
          return `<button class="li" data-act="go" data-to="o.home" data-anim="${a.id}"><span class="av">${esc(initials(a.name))}</span><span class="grow"><b>${esc(a.name)}</b><span class="small muted">${mine.length} AVEC · ${mine.reduce((s, r) => s + r.avec.members.length, 0)} membres</span></span>${al ? `<span class="chip warn">${al} alertes</span>` : '<span class="chip good">RAS</span>'}</button>`; }).join('')}</div>
        <button class="btn ghost block" data-act="addAnimSheet">${ic('plus')} Ajouter un animateur</button>
        ${anims.length ? `<button class="btn ghost block" data-act="animCodesSheet">${ic('key')} Code oublié d'un animateur</button>` : ''}
        <p class="hint">Les AVEC autonomes n'apparaissent jamais ici : leurs données restent à elles.</p>
      </div>
    </div>
  </main></div>`;
};

/* ---------- création d'une AVEC : voir create.js ---------- */
