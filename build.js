// Construit dist/ : la version d\'Akiba prête à héberger (installable, marche hors ligne).
// Usage : node build.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'akiba'), out = path.join(__dirname, process.argv[2] || 'dist');

/* Deux applications depuis la même source :
     node build.js docs           → Akiba, pour les groupes          (akiba.uborardc.com)
     node build.js docs-suivi suivi → Akiba Suivi, pour les animateurs, les ONG et Ubora (akibas.uborardc.com) */
const CIBLE = process.argv[3] || 'avec';
const PROFILS = {
  avec: { nom: 'Akiba AVEC', court: 'Akiba', titre: 'Akiba AVEC', domaine: 'akiba.uborardc.com', prefixe: 'akiba',
    description: "Le cahier de l'AVEC dans le téléphone, même sans réseau. Développée par l'Entreprise Sociale Ubora.",
    titreSeo: "AKIBA : l'application des groupes d'épargne (AVEC) en RDC · Ubora",
    descSeo: "AKIBA remplace le cahier des associations villageoises d'épargne et de crédit (AVEC) : cotisations, prêts, remboursements, reçus et partage de fin de cycle, même sans réseau. Une application de l'Entreprise Sociale Ubora.",
    nomSeo: 'AKIBA · Ubora', autresNoms: ['Akiba AVEC', 'AKIBA Ubora'], robots: 'index, follow, max-image-preview:large',
    teinte: { fond: '#0F4D3A', fondClair: '#1B6E52', gens: '#7CC49A' }, sansFichiers: ['admin.js'] },
  suivi: { nom: 'Akiba Suivi', court: 'Akiba Suivi', titre: 'Akiba Suivi', domaine: 'akibas.uborardc.com', prefixe: 'akiba-suivi',
    description: "Suivi des AVEC pour les animateurs, les organisations et Ubora : tableau de bord, qualité des données, export Excel.",
    titreSeo: 'Akiba Suivi : suivi des AVEC pour les animateurs et les organisations · Ubora',
    descSeo: "Akiba Suivi réunit les journaux scellés des AVEC : tableau de bord des animateurs et des organisations, qualité des données, dossier pour une institution de microfinance, export Excel. Une application de l'Entreprise Sociale Ubora.",
    nomSeo: 'Akiba Suivi · Ubora', autresNoms: ['Akiba Suivi Ubora'], robots: 'noindex, follow',   // outil de travail : pas d'indexation
    teinte: { fond: '#0B3A52', fondClair: '#14566F', gens: '#8FC6DF' }, sansFichiers: [] }
};
const P = PROFILS[CIBLE];
if (!P) throw new Error('cible inconnue : ' + CIBLE + " (avec ou suivi)");
/* Le dossier est refait à neuf à chaque construction. L'application Android, elle, n'est pas
   fabriquée ici : c'est GitHub qui la compile et la dépose dans ce même dossier. On la met donc
   de côté le temps du ménage, sinon chaque construction la ferait disparaître du site. */
const APK = ['akiba.apk', 'akiba-apk.txt'];
const gardes = {};
APK.forEach(f => { const c = path.join(out, f); if (fs.existsSync(c)) gardes[f] = fs.readFileSync(c); });
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
Object.keys(gardes).forEach(f => fs.writeFileSync(path.join(out, f), gardes[f]));

const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(f => !P.sansFichiers.includes(f));
scripts.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
const assets = ['ubora-logo.png', 'ubora-hub.png', 'qrcode.min.js', 'blocage.txt'];                                   // images de l'application (gardées hors ligne)
assets.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
fs.writeFileSync(path.join(out, 'CNAME'), P.domaine + '\n');
const cut = html.indexOf('</style>') + '</style>'.length;
const head = html.slice(0, cut).replace(/<title>[^<]*<\/title>/, '');   // le titre du profil remplace celui de la source
/* les fichiers retirés de cette cible disparaissent aussi de la page */
const body = P.sansFichiers.reduce((h, f) => h.split(`<script src="${f}"></script>\n`).join('').split(`<script src="${f}"></script>`).join(''), html.slice(cut));
const version = 'akiba-' + new Date().toISOString().slice(0, 16).replace(/\D/g, '');

fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${P.titreSeo}</title>
<meta name="description" content="${P.descSeo}">
<link rel="canonical" href="https://${P.domaine}/"><meta name="robots" content="${P.robots}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${P.nomSeo}"><meta property="og:locale" content="fr_CD"><meta property="og:url" content="https://${P.domaine}/">
<meta property="og:title" content="${P.titreSeo}"><meta property="og:description" content="${P.descSeo}"><meta property="og:image" content="https://${P.domaine}/icon-512.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"${P.nom}","alternateName":${JSON.stringify(P.autresNoms)},"applicationCategory":"FinanceApplication","operatingSystem":"Android, iOS, Windows (navigateur)","inLanguage":"fr","url":"https://${P.domaine}/","description":"${P.descSeo}","publisher":{"@type":"Organization","name":"Entreprise Sociale Ubora","url":"https://uborardc.com/"}}</script><meta name="author" content="Entreprise Sociale Ubora">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icon-192.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="${P.court}">
${head}
<style>html,body{margin:0}</style>
</head><body>
<script>window.KITABU_PWA = true; window.KITABU_VERSION = '${version}'; window.AKIBA_CIBLE = '${CIBLE}';</script>
${body}
</body></html>
`);

const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
// Icône Akiba : le groupe (trois membres), la pièce d'épargne qui entre dans la caisse, et la caisse aux trois cadenas.
const ICON = {
  bg: hex(P.teinte.fond), bgLight: hex(P.teinte.fondClair), people: hex(P.teinte.gens), box: [255, 255, 255], lid: [226, 236, 229],
  gold: [242, 183, 5], goldDark: [201, 146, 0], ink: [15, 77, 58],
  heads: [[176, 150, 34], [256, 126, 38], [336, 150, 34]], shoulders: [[176, 238, 64, 56], [256, 226, 72, 62], [336, 238, 64, 56]],
  box0: [128, 262, 384, 408], lidY: 296, slot: [222, 274, 290, 284], coin: [256, 246, 32], locks: [176, 256, 336], lockY: 332
};
const svgLock = x => `<path d="M${x - 16} ${ICON.lockY}v-10a16 16 0 0 1 32 0v10" fill="none" stroke="#F2B705" stroke-width="7"/><rect x="${x - 22}" y="${ICON.lockY}" width="44" height="38" rx="7" fill="#F2B705"/><circle cx="${x}" cy="${ICON.lockY + 16}" r="5" fill="#0F4D3A"/><rect x="${x - 2.5}" y="${ICON.lockY + 17}" width="5" height="12" fill="#0F4D3A"/>`;
fs.writeFileSync(path.join(out, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="${P.teinte.fondClair}"/><stop offset="1" stop-color="${P.teinte.fond}"/></radialGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/>${ICON.shoulders.map(([x, y, rx, ry]) => `<path d="M${x - rx} ${y + 30}v-${30}a${rx} ${ry} 0 0 1 ${rx * 2} 0v30z" fill="${P.teinte.gens}"/>`).join('')}${ICON.heads.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.teinte.gens}"/>`).join('')}<circle cx="256" cy="246" r="32" fill="#F2B705"/><circle cx="256" cy="246" r="21" fill="none" stroke="#C99200" stroke-width="5"/><rect x="128" y="262" width="256" height="146" rx="20" fill="#fff"/><rect x="128" y="262" width="256" height="34" rx="16" fill="#E2ECE5"/><rect x="222" y="274" width="68" height="10" rx="5" fill="#0F4D3A"/>${ICON.locks.map(svgLock).join('')}</svg>`);

// Icônes PNG (obligatoires pour l'installation sur Android et iPhone), dessinées sans bibliothèque.
const zlib = require('zlib');
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function iconColor(u, v) {
  const inRect = (x0, y0, x1, y1) => u >= x0 && u <= x1 && v >= y0 && v <= y1;
  const inRound = (x0, y0, x1, y1, r) => {
    if (!inRect(x0, y0, x1, y1)) return false;
    const cx = Math.min(Math.max(u, x0 + r), x1 - r), cy = Math.min(Math.max(v, y0 + r), y1 - r);
    return Math.hypot(u - cx, v - cy) <= r;
  };
  const d = Math.min(1, Math.hypot(u - 256, v - 205) / 360);                     // fond : léger dégradé vers le centre
  let col = ICON.bgLight.map((c, i) => Math.round(c + (ICON.bg[i] - c) * d));
  for (const [x, y, rx, ry] of ICON.shoulders) if (v <= y + 30 && (v >= y || ((u - x) / rx) ** 2 + ((v - y) / ry) ** 2 <= 1) && Math.abs(u - x) <= rx) col = ICON.people;
  for (const [x, y, r] of ICON.heads) if (Math.hypot(u - x, v - y) <= r) col = ICON.people;
  const [cx, cy, cr] = ICON.coin, dc = Math.hypot(u - cx, v - cy);
  if (dc <= cr) col = (dc >= 18.5 && dc <= 23.5) ? ICON.goldDark : ICON.gold;
  const [bx0, by0, bx1, by1] = ICON.box0;
  if (inRound(bx0, by0, bx1, by1, 20)) {
    col = v <= ICON.lidY ? ICON.lid : ICON.box;
    if (inRound(...ICON.slot, 5)) col = ICON.ink;
    for (const x of ICON.locks) {
      const y = ICON.lockY, ds = Math.hypot(u - x, v - (y - 2));
      if (v < y && ds >= 12.5 && ds <= 19.5 && v <= y - 2) col = ICON.gold;          // anse du cadenas
      if (v < y && v > y - 2 && Math.abs(u - x) >= 12.5 && Math.abs(u - x) <= 19.5) col = ICON.gold;
      if (inRound(x - 22, y, x + 22, y + 38, 7)) {
        col = ICON.gold;
        if (Math.hypot(u - x, v - (y + 16)) <= 5 || inRect(x - 2.5, y + 17, x + 2.5, y + 29)) col = ICON.ink;
      }
    }
  }
  return col;
}
function iconPng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const SS = 4;                                                                     // lissage des bords (4 × 4 échantillons)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = iconColor((x + (sx + .5) / SS) * 512 / size, (y + (sy + .5) / SS) * 512 / size);
        r += c[0]; g += c[1]; b += c[2];
      }
      const i = y * (size * 4 + 1) + 1 + x * 4, n = SS * SS;
      raw[i] = Math.round(r / n); raw[i + 1] = Math.round(g / n); raw[i + 2] = Math.round(b / n); raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(path.join(out, 'icon-192.png'), iconPng(192));
fs.writeFileSync(path.join(out, 'icon-512.png'), iconPng(512));

fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  id: './', name: P.nom, short_name: P.court, lang: 'fr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: P.teinte.fond, theme_color: P.teinte.fond, categories: ['finance', 'productivity'],
  description: P.description,
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
  ]
}, null, 2));

const files = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', ...assets.filter(f => f !== 'blocage.txt'), ...scripts];
fs.writeFileSync(path.join(out, 'sw.js'), `// Akiba : garde l'application dans le téléphone pour qu'elle s'ouvre sans réseau.
const CACHE = '${version}';
const FILES = ${JSON.stringify(files)};
// « reload » : on télécharge toujours la vraie nouvelle version, jamais une copie gardée par le navigateur.
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('blocage.txt')) return;             // liste de blocage : toujours la version du réseau
  if (e.request.url.includes('version.txt')) return;             // numéro de la version en ligne : jamais une copie
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const url = e.request.url;
    if (res.ok && (url.startsWith(self.location.origin) || /fonts\\.(googleapis|gstatic)\\.com/.test(url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
`);

fs.copyFileSync(path.join(__dirname, 'LANCER.md'), path.join(out, 'LANCER.md'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
/* Le numéro de la version en ligne, dans un fichier minuscule jamais mis en cache par
   le service worker : c'est lui qui permet à un téléphone de dire « je suis à jour »
   ou « il existe plus récent », au lieu de le deviner. */
fs.writeFileSync(path.join(out, 'version.txt'), version + '\n');

/* La page qui explique comment installer l'application Android.
   Akiba marche déjà dans le navigateur, et pour la plupart des téléphones cela suffit. Mais sur
   les terminaux de caisse, « Ajouter à l'écran d'accueil » ne pose souvent aucune icône : le
   secrétaire ne retrouve plus le cahier. L'application résout cela, et ouvre l'imprimante du
   terminal. Elle lit exactement les mêmes données : même adresse, même cahier. */
const apkPresent = fs.existsSync(path.join(out, 'akiba.apk'));
const apkNote = apkPresent && fs.existsSync(path.join(out, 'akiba-apk.txt'))
  ? fs.readFileSync(path.join(out, 'akiba-apk.txt'), 'utf8').trim().split('\n') : [];
const jourFr = d => { const [a, m, j] = d.split('-'); return j + '/' + m + '/' + a; };
/* seul Akiba AVEC a une application Android : c'est elle qui tourne sur les terminaux */
if (CIBLE === 'avec') fs.writeFileSync(path.join(out, 'android.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Installer ${P.nom} sur un téléphone Android · Ubora</title>
<meta name="description" content="Comment installer l'application ${P.nom} sur un téléphone ou un terminal Android, pas à pas.">
<meta name="robots" content="${P.robots}">
<link rel="icon" href="icon.svg">
<style>
  :root { color-scheme: light }
  body { margin: 0; padding: 24px 18px 56px; font: 17px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
         color: #16221c; background: #f6f8f7; max-width: 640px; margin-inline: auto }
  h1 { font-size: 25px; line-height: 1.25; margin: 18px 0 6px }
  h2 { font-size: 19px; margin: 32px 0 8px }
  .chapeau { color: #4a5a52 }
  a.bouton { display: block; text-align: center; background: ${P.teinte.fond}; color: #fff; text-decoration: none;
             padding: 18px; border-radius: 14px; font-weight: 600; font-size: 19px; margin: 24px 0 8px }
  .sous { text-align: center; color: #4a5a52; font-size: 15px }
  ol { padding-left: 22px } li { margin: 12px 0 }
  .avis { background: #fff; border: 1px solid #dde6e1; border-radius: 14px; padding: 14px 16px; margin: 20px 0 }
  .avis b { display: block; margin-bottom: 4px }
  footer { margin-top: 40px; color: #6b7a73; font-size: 15px }
  img.logo { width: 72px; height: 72px; display: block }
</style>
</head><body>
<img class="logo" src="icon.svg" alt="">
<h1>Installer ${P.nom} sur un téléphone Android</h1>
<p class="chapeau">${P.nom} marche déjà dans le navigateur, sans rien installer. Cette application sert surtout aux terminaux de caisse, où l'icône n'apparaît pas toujours sur l'écran d'accueil, et où l'on veut imprimer les reçus.</p>

${apkPresent ? `<a class="bouton" href="akiba.apk" download>Télécharger l'application</a>
<p class="sous">${apkNote[1] ? apkNote[1] + ' · ' : ''}${apkNote[0] ? 'version du ' + jourFr(apkNote[0]) : ''}</p>`
  : '<div class="avis"><b>L\'application n\'est pas encore prête</b>Elle est en cours de fabrication. En attendant, ouvrez <a href="./">' + P.domaine + '</a> dans le navigateur du téléphone : le cahier y fonctionne entièrement, y compris sans réseau.</div>'}

<h2>Pas à pas</h2>
<ol>
  <li>Appuyez sur <b>Télécharger l'application</b>. Le téléphone enregistre un fichier nommé <b>akiba.apk</b>.</li>
  <li>Ouvrez ce fichier, depuis la barre des notifications ou depuis le dossier <b>Téléchargements</b>.</li>
  <li>Le téléphone demande l'autorisation d'installer depuis cette source. Appuyez sur <b>Paramètres</b>, puis activez <b>Autoriser cette source</b>, puis revenez en arrière.</li>
  <li>Appuyez sur <b>Installer</b>, puis sur <b>Ouvrir</b>.</li>
  <li>L'icône ${P.court} reste sur l'écran d'accueil. C'est elle qu'on ouvre aux réunions.</li>
</ol>

<div class="avis"><b>Vos données sont conservées</b>Si le cahier était déjà ouvert dans le navigateur de ce téléphone, l'application retrouve les mêmes groupes, les mêmes membres et les mêmes réunions : c'est la même adresse, donc le même cahier.</div>

<div class="avis"><b>L'application ne demande aucune autorisation</b>Ni réseau, ni position, ni contacts, ni photos. Tout reste dans le téléphone, et rien n'en sort sans un geste du bureau.</div>

<div class="avis"><b>Pour imprimer les reçus</b>Sur un terminal avec imprimante, installez aussi <b>RawBT</b> depuis le Play Store : ${P.court} lui passe les tickets. Sans elle, les reçus se partagent par WhatsApp ou par SMS, comme avant.</div>

<h2>Si l'installation est refusée</h2>
<p>Certains terminaux demandent d'activer l'autorisation à l'avance : <b>Paramètres</b> › <b>Applications</b> › <b>Accès spécial</b> › <b>Installer des applications inconnues</b>, puis choisissez le navigateur et autorisez-le.</p>

<footer><a href="./">Retour à ${P.nom}</a> · Entreprise Sociale Ubora</footer>
</body></html>
`);

// Référencement : les moteurs de recherche lisent ces deux fichiers à la racine du site.
const indexable = P.robots.startsWith('index');   // Akiba Suivi est un outil de travail : il ne s'indexe pas
fs.writeFileSync(path.join(out, 'robots.txt'), indexable
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://' + P.domaine + '/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n');
if (indexable) fs.writeFileSync(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://' + P.domaine + '/</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod></url>\n' +
  '  <url><loc>https://' + P.domaine + '/android.html</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod></url>\n</urlset>\n');
console.log('dist/ prêt :', fs.readdirSync(out).join(', '), '· cache', version);
