// Akiba : garde l'application dans le téléphone pour qu'elle s'ouvre sans réseau.
const CACHE = 'akiba-202609151903';
const FILES = ["./","index.html","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","ubora-logo.png","qrcode.min.js","core.js","avec.js","supervision.js","cycle.js","member-form.js","geo.js","create.js","access.js","setup.js","install.js","guide.js","audio.js","i18n.js","support.js","licence.js","transfer.js","admin.js","training.js","boot.js"];
// « reload » : on télécharge toujours la vraie nouvelle version, jamais une copie gardée par le navigateur.
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const url = e.request.url;
    if (res.ok && (url.startsWith(self.location.origin) || /fonts\.(googleapis|gstatic)\.com/.test(url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
