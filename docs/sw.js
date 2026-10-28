// Akiba : garde l'application dans le téléphone pour qu'elle s'ouvre sans réseau.
const CACHE = 'akiba-202610282149';
const FILES = ["./","index.html","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","ubora-logo.png","ubora-hub.png","qrcode.min.js","core.js","embleme.js","avec.js","accueil.js","supervision.js","cycle.js","son.js","photo.js","member-form.js","geo.js","gps.js","create.js","access.js","setup.js","install.js","guide-tr.js","guide.js","audio.js","i18n.js","support.js","licence.js","transfer.js","training.js","formation-anim.js","export.js","externe.js","impact.js","imf-portefeuille.js","recu.js","recu-preuve.js","reve.js","cartes.js","boot.js"];
// « reload » : on télécharge toujours la vraie nouvelle version, jamais une copie gardée par le navigateur.
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('blocage.txt')) return;             // liste de blocage : toujours la version du réseau
  if (e.request.url.includes('version.txt')) return;             // numéro de la version en ligne : jamais une copie
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    const url = e.request.url;
    if (res.ok && (url.startsWith(self.location.origin) || /fonts\.(googleapis|gstatic)\.com/.test(url))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
