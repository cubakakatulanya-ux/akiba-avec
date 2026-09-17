// Construit dist/ : la version d\'Akiba prête à héberger (installable, marche hors ligne).
// Usage : node build.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'akiba'), out = path.join(__dirname, process.argv[2] || 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
scripts.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
const assets = ['ubora-logo.png', 'qrcode.min.js', 'blocage.txt'];                                   // images de l'application (gardées hors ligne)
assets.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
const cut = html.indexOf('</style>') + '</style>'.length;
const head = html.slice(0, cut).replace('<title>Akiba AVEC</title>', '');
const body = html.slice(cut);
const version = 'akiba-' + new Date().toISOString().slice(0, 16).replace(/\D/g, '');

fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Akiba AVEC</title>
<meta name="description" content="Gestion des associations villageoises d'épargne et de crédit, même sans réseau. Développée par l'Entreprise Sociale Ubora."><meta name="author" content="Entreprise Sociale Ubora">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icon-192.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Akiba">
${head}
<style>html,body{margin:0}</style>
</head><body>
<script>window.KITABU_PWA = true; window.KITABU_VERSION = '${version}';</script>
${body}
</body></html>
`);

// Icône Akiba : le groupe (trois membres), la pièce d'épargne qui entre dans la caisse, et la caisse aux trois cadenas.
const ICON = {
  bg: [15, 77, 58], bgLight: [27, 110, 82], people: [124, 196, 154], box: [255, 255, 255], lid: [226, 236, 229],
  gold: [242, 183, 5], goldDark: [201, 146, 0], ink: [15, 77, 58],
  heads: [[176, 150, 34], [256, 126, 38], [336, 150, 34]], shoulders: [[176, 238, 64, 56], [256, 226, 72, 62], [336, 238, 64, 56]],
  box0: [128, 262, 384, 408], lidY: 296, slot: [222, 274, 290, 284], coin: [256, 246, 32], locks: [176, 256, 336], lockY: 332
};
const svgLock = x => `<path d="M${x - 16} ${ICON.lockY}v-10a16 16 0 0 1 32 0v10" fill="none" stroke="#F2B705" stroke-width="7"/><rect x="${x - 22}" y="${ICON.lockY}" width="44" height="38" rx="7" fill="#F2B705"/><circle cx="${x}" cy="${ICON.lockY + 16}" r="5" fill="#0F4D3A"/><rect x="${x - 2.5}" y="${ICON.lockY + 17}" width="5" height="12" fill="#0F4D3A"/>`;
fs.writeFileSync(path.join(out, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1B6E52"/><stop offset="1" stop-color="#0F4D3A"/></radialGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/>${ICON.shoulders.map(([x, y, rx, ry]) => `<path d="M${x - rx} ${y + 30}v-${30}a${rx} ${ry} 0 0 1 ${rx * 2} 0v30z" fill="#7CC49A"/>`).join('')}${ICON.heads.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7CC49A"/>`).join('')}<circle cx="256" cy="246" r="32" fill="#F2B705"/><circle cx="256" cy="246" r="21" fill="none" stroke="#C99200" stroke-width="5"/><rect x="128" y="262" width="256" height="146" rx="20" fill="#fff"/><rect x="128" y="262" width="256" height="34" rx="16" fill="#E2ECE5"/><rect x="222" y="274" width="68" height="10" rx="5" fill="#0F4D3A"/>${ICON.locks.map(svgLock).join('')}</svg>`);

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
  id: './', name: 'Akiba AVEC', short_name: 'Akiba', lang: 'fr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#0F4D3A', theme_color: '#0F4D3A', categories: ['finance', 'productivity'],
  description: "Le cahier de l'AVEC dans le téléphone, même sans réseau. Développée par l'Entreprise Sociale Ubora.",
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
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const url = e.request.url;
    if (res.ok && (url.startsWith(self.location.origin) || /fonts\\.(googleapis|gstatic)\\.com/.test(url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
`);

fs.copyFileSync(path.join(__dirname, 'LANCER.md'), path.join(out, 'LANCER.md'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('dist/ prêt :', fs.readdirSync(out).join(', '), '· cache', version);
