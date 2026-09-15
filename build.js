// Construit dist/ : la version d\'Akiba prête à héberger (installable, marche hors ligne).
// Usage : node build.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'akiba'), out = path.join(__dirname, process.argv[2] || 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
scripts.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
const assets = ['ubora-logo.png'];                                   // images de l'application (gardées hors ligne)
assets.forEach(f => fs.copyFileSync(path.join(src, f), path.join(out, f)));
const cut = html.indexOf('</style>') + '</style>'.length;
const head = html.slice(0, cut).replace('<title>Akiba AVEC</title>', '');
const body = html.slice(cut);
const version = 'akiba-' + new Date().toISOString().slice(0, 16).replace(/\D/g, '');

fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Akiba AVEC</title>
<meta name="description" content="Gestion des associations villageoises d'épargne et de crédit, même sans réseau.">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icon-192.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Akiba">
${head}
<style>html,body{margin:0}</style>
</head><body>
<script>window.KITABU_PWA = true; window.KITABU_VERSION = '${version}';</script>
${body}
</body></html>
`);

fs.writeFileSync(path.join(out, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0F4D3A"/><rect x="138" y="96" width="236" height="320" rx="22" fill="none" stroke="#fff" stroke-width="22"/><path d="M190 96v320M222 170h110M222 230h110M222 290h70" stroke="#fff" stroke-width="18" stroke-linecap="round"/><circle cx="352" cy="360" r="62" fill="#F2B705"/><path d="M352 330v60M332 350h40" stroke="#2A1F00" stroke-width="14" stroke-linecap="round"/></svg>`);

// Icônes PNG (obligatoires pour l'installation sur Android et iPhone), dessinées sans bibliothèque.
const zlib = require('zlib');
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function iconPng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const inRect = (u, v, x0, y0, x1, y1) => u >= x0 && u <= x1 && v >= y0 && v <= y1;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const u = (x + .5) * 512 / size, v = (y + .5) * 512 / size;
      let col = [15, 77, 58];                                                        // fond vert forêt
      const book = inRect(u, v, 150, 110, 360, 400) && !inRect(u, v, 172, 132, 338, 378);
      const spine = inRect(u, v, 188, 110, 206, 400);
      const lines = [180, 240, 300].some(l => inRect(u, v, 230, l - 9, 318, l + 9));
      if (book || spine || lines) col = [255, 255, 255];
      const dc = Math.hypot(u - 332, v - 352);
      if (dc <= 58) col = [242, 183, 5];                                            // pièce jaune maïs
      if (dc <= 58 && (inRect(u, v, 325, 324, 339, 380) || inRect(u, v, 304, 345, 360, 359))) col = [42, 31, 0];
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = col[0]; raw[i + 1] = col[1]; raw[i + 2] = col[2]; raw[i + 3] = 255;
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
  description: "Le cahier de l'AVEC dans le téléphone, même sans réseau.",
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
  ]
}, null, 2));

const files = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', ...assets, ...scripts];
fs.writeFileSync(path.join(out, 'sw.js'), `// Akiba : garde l'application dans le téléphone pour qu'elle s'ouvre sans réseau.
const CACHE = '${version}';
const FILES = ${JSON.stringify(files)};
// « reload » : on télécharge toujours la vraie nouvelle version, jamais une copie gardée par le navigateur.
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
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
