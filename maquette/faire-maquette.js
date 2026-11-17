/* La maquette de la refonte : ce qui est, et ce qui est proposé, côte à côte.

   Deux règles, pour que la comparaison ne mente pas :

   1. La colonne « aujourd'hui » n'est pas redessinée à la main — elle est CAPTURÉE dans
      l'application qui tourne, balise pour balise, avec ses hauteurs réelles. Une maquette
      dessinée à part flatte toujours la proposition et dessert l'existant, parce qu'elle
      n'a ni les mêmes blocs ni les mêmes espacements.
   2. Les deux colonnes partagent la VRAIE feuille de style de l'application. Seule la
      structure change, et c'est précisément ce qu'on veut juger.

   La maquette ne va pas dans docs/ : ce n'est pas une page du site, c'est un objet de décision.

   Usage :  node maquette/faire-maquette.js                                                 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const RACINE = path.join(__dirname, '..');
/* Les deux applications passent par le même moule : « node maquette/faire-maquette.js suivi ».
   Akiba Suivi a les mêmes maux - un accueil qui répète les onglets, un tiroir fourre-tout - et
   il serait étrange de refondre l'une en laissant l'autre. */
const CIBLE = process.argv.find(a => a === 'suivi') ? 'suivi' : 'avec';
const DOSSIER = CIBLE === 'suivi' ? 'docs-suivi' : 'docs';
const DOCS = path.join(RACINE, DOSSIER);
const NOM = CIBLE === 'suivi' ? 'Akiba Suivi' : 'Akiba';
const SORTIE = CIBLE === 'suivi' ? 'suivi.html' : 'index.html';
/* l'accueil et le tiroir, nommés différemment selon l'application */
const ECRANS = CIBLE === 'suivi' ? { accueil: 'o.home', tiroir: 'o.imf' } : { accueil: 'a.home', tiroir: 'a.more' };
const PORT = CIBLE === 'suivi' ? 5254 : 5253, DEBUG = CIBLE === 'suivi' ? 9350 : 9349;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dors = ms => new Promise(r => setTimeout(r, ms));

const serveur = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  fs.readFile(path.join(DOCS, u), (e, b) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(u)] || 'application/octet-stream' }); r.end(b); });
}).listen(PORT);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--force-color-profile=srgb', '--remote-debugging-port=' + DEBUG,
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'akiba-mq-' + Date.now()), 'about:blank'], { stdio: 'ignore' });
let ws, n = 0; const att = {};
const cdp = (m, p = {}) => new Promise((ok, ko) => { const i = ++n; att[i] = { ok, ko }; ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async (e, a = true) => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: a, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
  return r.result.value; };

const fc = v => v.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ') + ' FC';

/* ---------- ce qu'on propose, écrit avec les mêmes classes que l'application ---------- */
/* Les alertes quittent le corps de l'accueil pour une cloche dans le bandeau : elles sont
   consultées quand on veut, pas imposées à chaque ouverture. La pastille dit combien, et sa
   couleur dit la plus grave — on sait donc s'il faut l'ouvrir sans l'ouvrir. */
const cloche = st => `<button class="iconbtn cloche" aria-label="${st.alertes.length} points à surveiller">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
  <span class="pastille ${st.alertes.some(a => a.lvl === 'bad') ? 'bad' : 'warn'}">${st.alertes.length}</span></button>`;

const panneauAlertes = st => `<div class="panneau">
  <div class="panneau-t"><b>À surveiller</b><span class="chip">${st.alertes.length}</span></div>
  <div class="veille">${st.alertes.map(a => `<div class="veille-l ${a.lvl}"><b>${a.title}</b><span>${a.detail}</span></div>`).join('')}</div>
</div>`;

/* Akiba Suivi : l'organisation vient voir SES GROUPES. Aujourd'hui, 678 px de préambule —
   filtres, alertes, six chiffres — passent avant la liste. La liste réelle est conservée telle
   quelle ; c'est ce qui la précède qui se replie : les alertes dans la cloche, les six chiffres
   en une ligne. */
const accueilProposeSuivi = (st, liste) => `
<div class="sommaire">
  <div><span>AVEC suivies</span><b class="num">${st.avecs}</b></div>
  <div><span>Membres</span><b class="num">${st.membres}</b></div>
  <div><span>Épargne</span><b class="num">${fc(st.epargne)}</b></div>
  <div><span>Sans alerte</span><b class="num">${st.sansAlerte}/${st.avecs}</b></div>
</div>
${liste}`;

const accueilPropose = st => `
<section class="caisse" aria-label="Caisse"><span class="label">Argent dans la caisse</span>
  <b class="num">${fc(st.caisse)}</b>
  <div class="row between small"><span>Crédit ${fc(st.credit)}</span><span>Social ${fc(st.social)}</span></div></section>
<button class="btn primary block xl">Ouvrir la réunion n°${st.prochaine}</button>
<div class="sommaire">
  <div><span>Épargne</span><b class="num">${fc(st.epargne)}</b></div>
  <div><span>Crédits</span><b class="num">${fc(st.encours)}</b></div>
  <div><span>Membres</span><b class="num">${st.membres}</b></div>
  <div><span>Semaine</span><b class="num">${st.semaine}/${st.semaines}</b></div>
</div>`;

const FAMILLES = [
  ['L\u2019argent du groupe', [['Partage de fin de cycle', 'Cycle 1 · fin le 11 déc.'], ['Cycles passés', '0 terminé'],
    ['Guichet', 'Dépôts et retraits hors réunion'], ['Crédit extérieur', 'IMF, banque, ONG'], ['Dossier IMF', 'Les chiffres à présenter']]],
  ['Le groupe', [['Bureau et porte-clés', 'Changer un responsable'], ['Mon carnet', 'Anuarite Kyavumba'],
    ['Lieu', 'Kanyabayonga'], ['Signe', 'Épi · Jaune']]],
  ['Le téléphone et les données', [['Sauvegarder', 'Jamais sauvegardé'], ['Nouveau téléphone', 'Déplacer le cahier'],
    ['Sortir les écritures', 'Tout est à jour'], ['Sécurité et codes', '6 codes valables']]],
  ['Réglages', [['Langue', 'Français'], ['Apparence', 'Fond clair'], ['Sons', 'Une note par écriture'],
    ['Guide', 'L\u2019AVEC et l\u2019application'], ['Changer d\u2019utilisateur', '']]],
];
const plusPropose = FAMILLES.map(([t, items]) => `<section class="section">
  <h2 class="gfam-t" style="margin:0 0 8px">${t}</h2>
  <div class="list">${items.map(([nom, d]) => `<div class="li"><span class="grow"><b>${nom}</b>${d ? `<span class="small muted">${d}</span>` : ''}</span></div>`).join('')}</div>
</section>`).join('');

(async () => {
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:' + DEBUG + '/json/version')).ok) break; } catch (e) {} await dors(250); }
  const c = await (await fetch('http://127.0.0.1:' + DEBUG + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(c.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && att[d.id]) { d.error ? att[d.id].ko(new Error(d.error.message)) : att[d.id].ok(d.result); delete att[d.id]; } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: 'http://localhost:' + PORT + '/?x=' + Math.random() });
  for (let i = 0; i < 120; i++) { await dors(250); try { if (await js("typeof App !== 'undefined' && !!(K.data && K.data.avecs)", false)) break; } catch (e) {} }
  await dors(700);
  await js("if (!K.data.avecs.length) DB.reset(); try{localStorage.setItem('kitabu.theme','light')}catch(e){} appliquerTheme('light'); 1", false);

  /* l'état réel du groupe de démonstration, pour que la colonne proposée dise les mêmes chiffres */
  const etat = await js(`(() => { const a = K.data.avecs[0]; const st = stats(a);
    /* La session décide de l'écran : une session d'AVEC renvoie toujours au cahier du groupe,
       même quand on demande l'accueil de l'organisation. Sans cette distinction, la maquette
       d'Akiba Suivi capturait l'accueil d'Akiba et annonçait les mêmes chiffres des deux
       côtés — une comparaison qui se trompe de sujet. */
    K.session = ${JSON.stringify(CIBLE)} === 'suivi'
      ? { kind:'org', userId: (K.data.users.find(u=>u.role==='org')||{}).id }
      : { kind:'avec', avecId:a.id, memberId:bureauOf(a)[0].id };
    const h = health(a, st, chainOf(a));
    return { caisse: st.cash, credit: st.loanFund, social: st.socialFund, epargne: st.sum.EPARGNE,
      encours: st.outstanding, membres: st.activeCount,
      semaine: cycleWeek(a), semaines: Math.round((cycleEnd(a) - a.cycle.start) / (7*24*3600e3)),
      prochaine: a.meetings.reduce((x,m)=>Math.max(x,m.n),0) + 1,
      alertes: (h.alerts||[]).map(x=>({lvl:x.lvl, title:x.title, detail:x.detail})),
      avecs: K.data.avecs.filter(x=>x.status!=='refused').length,
      sansAlerte: K.data.avecs.filter(x=>{ try{ const s2=stats(x); return !health(x,s2,chainOf(x)).alerts.length; }catch(e){ return false; } }).length }; })()`, false);

  /* la capture : le contenu réel de <main>, et sa hauteur */
  const capter = async (ecran) => await js(`(async () => {
    App.go('${ecran}'); await new Promise(r=>setTimeout(r,650));
    const m = document.querySelector('.shell main');
    const t = document.querySelector('.shell .topbar');
    const lst = document.querySelector('.shell main .dash');
    return { html: m.innerHTML, topbar: t ? t.outerHTML : '', liste: lst ? lst.outerHTML : '', hauteur: Math.round(m.scrollHeight), blocs: m.children.length };
  })()`);
  const accueil = await capter(ECRANS.accueil);
  const plus = CIBLE === 'suivi' ? { html:'', topbar:'', liste:'', hauteur:0, blocs:0 } : await capter(ECRANS.tiroir);
  const ecranHaut = await js('innerHeight', false);

  /* la hauteur de la proposition, mesurée dans la même page plutôt qu'estimée */
  const mesurerPropose = async (corps) => await js(`(() => {
    const d = document.createElement('div');
    d.className = 'shell';
    d.setAttribute('style','position:absolute;left:-9999px;top:0;width:390px');
    d.innerHTML = '<main class="main">' + ${JSON.stringify(corps)} + '</main>';
    document.body.appendChild(d);
    const h = Math.round(d.querySelector('main').scrollHeight);
    const b = d.querySelector('main').children.length;
    d.remove(); return { hauteur: h, blocs: b };
  })()`, false);
  const propAcc = await mesurerPropose(CIBLE === 'suivi' ? accueilProposeSuivi(etat, accueil.liste) : accueilPropose(etat));
  const propPlus = await mesurerPropose(plusPropose);

  ws.close(); chrome.kill(); serveur.close();

  /* ---------- la page ---------- */
  const src = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
  const style = src.slice(src.indexOf('<style>'), src.indexOf('</style>') + 8);
  const police = (src.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/) || [''])[0];

  const tel = (corps, barre, hauteur) => {
    const doc = '<!doctype html><html lang="fr" data-theme="light"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + police + style
      + '<style>body{margin:0;background:var(--ground)}</style></head><body>'
      + '<div class="shell">' + (barre || '') + '<main class="main">' + corps + '</main></div>'
      + '</body></html>';
    const h = Math.min(hauteur || 700, 760);
    return '<div class="tel"><iframe title="aperçu" style="width:390px;height:' + h + 'px;border:0;display:block" srcdoc="'
      + doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></iframe></div>';
  };
  /* le bandeau réel de l'application, avec la cloche glissée dedans pour la proposition */
  const barreReelle = accueil.topbar;
  const barreAvecCloche = accueil.topbar.replace(/<\/header>$/, cloche(etat) + '</header>');
  const mesure = (h, blocs, extra) => `<p class="mesure"><span>hauteur <b>${h} px</b></span>
    <span><b>${(h / ecranHaut).toFixed(1)}</b> écran${h / ecranHaut >= 2 ? 's' : ''} à faire défiler</span>
    <span><b>${blocs}</b> blocs</span>${extra || ''}</p>`;

  const page = `<!doctype html>
<html lang="fr" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${NOM} · maquette de la refonte</title>
${police}
${style}
<style>
  /* La page de comparaison elle-même, volontairement discrète : elle ne doit pas peser dans
     le jugement. Le « data-theme=light » sur <html> est indispensable — sans lui, la feuille
     de style de l'application suit le thème sombre du système et la maquette s'affiche en
     clair sur des jetons sombres. */
  body{background:#EDEBE9;margin:0;font-family:var(--f-body);color:#16221c}
  .cadre{max-width:1240px;margin:0 auto;padding:22px 16px 60px}
  .tete{text-align:center;margin:0 0 26px}
  .tete h1{margin:0 0 6px;font-weight:300;font-size:30px;font-family:var(--f-display);color:#16221c}
  .tete h1 b{font-weight:700}
  .tete p{margin:0 auto;color:#5e6c66;max-width:62ch}
  h2.part{font-family:var(--f-display);font-weight:300;font-size:24px;margin:0 0 14px;color:#16221c}
  h2.part b{font-weight:700}
  .duo{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));align-items:start}
  .col>h3{margin:0 0 4px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#5e6c66;font-family:var(--f-display)}
  .col.neuf>h3{color:#23590D}
  .col>p.quoi{margin:0 0 10px;color:#5e6c66;font-size:14px;min-height:62px}
  .tel{width:390px;max-width:100%;margin:0 auto;border-radius:16px;overflow:hidden;background:#fff;
    box-shadow:0 10px 30px -14px rgba(0,0,0,.45);border:1px solid rgba(0,0,0,.14)}
  .mesure{display:flex;gap:14px;justify-content:center;margin:10px 0 0;color:#5e6c66;font-size:13px;flex-wrap:wrap}
  .mesure b{color:#16221c}
  hr{border:0;border-top:1px solid rgba(0,0,0,.14);margin:38px 0 26px}
  .sommaire{display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface);
    border:1px solid var(--line);border-radius:var(--r)}
  .sommaire>div{padding:10px 6px;text-align:center;border-left:1px solid var(--line)}
  .sommaire>div:first-child{border-left:0}
  .sommaire span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
  .sommaire b{display:block;font-size:14px;margin-top:2px}
  .pied{text-align:center;color:#5e6c66;font-size:14px;margin:0}
  /* la cloche du bandeau, et ce qu'elle ouvre */
  .cloche{position:relative;margin-left:auto}
  .cloche svg{width:22px;height:22px}
  .cloche .pastille{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;
    display:grid;place-items:center;font-size:11px;font-weight:800;padding:0 4px;
    background:var(--maize);color:var(--maize-ink);box-shadow:0 0 0 2px var(--entete-2)}
  .cloche .pastille.bad{background:var(--bad);color:#fff}
  .apres{margin-top:14px;max-width:390px;margin-inline:auto}
  .fleche{display:block;text-align:center;color:#5e6c66;font-size:13px;margin-bottom:6px}
  .panneau{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
    box-shadow:0 10px 24px -16px rgba(0,0,0,.5)}
  .panneau-t{display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid var(--line);
    font-family:var(--f-display)}
  .panneau .veille{border:0;border-radius:0}
</style>
</head><body>
<div class="cadre">
  <header class="tete">
    <h1>${NOM} · <b>maquette de la refonte</b></h1>
    <p>À gauche, les écrans <b>capturés dans l'application qui tourne</b>, balise pour balise.
       À droite, ce qui est proposé. Même feuille de style, même police, mêmes couleurs, mêmes chiffres :
       seule la structure change.</p>
    <p style="margin-top:10px"><a href="${CIBLE === 'suivi' ? 'index.html' : 'suivi.html'}" style="color:#23590D">Voir la maquette de ${CIBLE === 'suivi' ? 'Akiba' : 'Akiba Suivi'} →</a></p>
  </header>

  <h2 class="part">L'<b>accueil</b></h2>
  <div class="duo">
    <div class="col"><h3>Aujourd'hui</h3>
      <p class="quoi">${CIBLE === 'suivi'
        ? "Filtres, alertes et six chiffres — 678 px — passent avant la liste des AVEC, qui est pourtant ce qu'on vient voir."
        : "La caisse, l'épargne, les crédits et les membres sont aussi dans les onglets ; les dernières réunions sont le Journal ; le guichet est dans Plus. L'accueil répète."}</p>
      ${tel(accueil.html, barreReelle, accueil.hauteur)}
      ${mesure(accueil.hauteur, accueil.blocs)}
    </div>
    <div class="col neuf"><h3>Proposé</h3>
      <p class="quoi">${CIBLE === 'suivi'
        ? "La liste des AVEC arrive tout de suite, inchangée. Les six chiffres tiennent en une ligne, et les alertes passent dans <b>la cloche</b> du bandeau."
        : "L'argent, le geste du jour, une ligne de repères qui mène aux onglets. Les alertes passent dans <b>la cloche</b> du bandeau."}
        On les consulte quand on veut, et la pastille dit déjà combien il y en a — et laquelle est
        la plus grave, par sa couleur.</p>
      ${tel(CIBLE === 'suivi' ? accueilProposeSuivi(etat, accueil.liste) : accueilPropose(etat), barreAvecCloche, propAcc.hauteur)}
      <div class="apres"><span class="fleche">↓ en touchant la cloche</span>${panneauAlertes(etat)}</div>
      ${mesure(propAcc.hauteur, propAcc.blocs, `<span style="color:#23590D"><b>−${Math.round((1 - propAcc.hauteur / accueil.hauteur) * 100)} %</b> de hauteur</span>`)}
    </div>
  </div>

${CIBLE === 'suivi' ? '' : `
  <hr>

  <h2 class="part">L'écran <b>Plus</b></h2>
  <div class="duo">
    <div class="col"><h3>Aujourd'hui</h3>
      <p class="quoi">Dix-huit tuiles dans un seul tas. Le partage de fin de cycle, qui déplace tout l'argent
        du groupe, est rangé à côté du réglage des sons.</p>
      ${tel(plus.html, plus.topbar, plus.hauteur)}
      ${mesure(plus.hauteur, plus.blocs, '<span><b>0</b> famille</span>')}
    </div>
    <div class="col neuf"><h3>Proposé</h3>
      <p class="quoi">Les mêmes dix-huit entrées, rangées en quatre familles nommées. On cherche
        « où est le partage ? » dans <i>L'argent du groupe</i>, pas dans dix-huit tuiles.</p>
      ${tel(plusPropose, plus.topbar, propPlus.hauteur)}
      ${mesure(propPlus.hauteur, propPlus.blocs, '<span style="color:#23590D"><b>4</b> familles</span>')}
    </div>
  </div>

`}
  ${CIBLE === 'suivi' ? `<hr><p class="pied">Akiba Suivi n'a pas de tiroir « Plus » : ses écrans sont o.home, n.home, n.avec et n.alerts. Leur refonte se regarde à part — la comparer aux familles d'Akiba serait comparer deux choses différentes.</p>` : ''}
  <hr>
  <p class="pied">Maquette — <b>aucune ligne de l'application n'a été modifiée</b>.
    Les chiffres sont ceux de la démonstration, lus dans le cahier au moment de la capture.</p>
</div>
</body></html>`;

  fs.writeFileSync(path.join(__dirname, SORTIE), page);
  console.log('maquette écrite · accueil ' + accueil.hauteur + ' → ' + propAcc.hauteur + ' px'
    + ' · Plus ' + plus.hauteur + ' → ' + propPlus.hauteur + ' px');
  process.exit(0);
})().catch(e => { console.error('ERREUR : ' + e.message); try { chrome.kill(); } catch (x) {} serveur.close(); process.exit(2); });
