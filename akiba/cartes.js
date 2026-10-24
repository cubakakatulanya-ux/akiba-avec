/* Akiba AVEC — cartes de membre en papier.
   Dix cartes au format carte bancaire (85 × 54 mm) sur une feuille A4 ordinaire : on imprime, on découpe.
   Chaque carte porte un QR code que n'importe quel téléphone lit : nom du groupe, nom du membre, rôle,
   numéro, date d'entrée et une empreinte courte tirée du journal scellé. L'animateur compare l'empreinte
   avec celle de l'application : une carte recopiée à la main ne passe pas.
   Aucun code secret, aucun montant : une carte se perd, se prête, se photographie. */
'use strict';

const CARTE_W = 85, CARTE_H = 54;                                   // millimètres, format carte bancaire

/* l'empreinte : les six premiers caractères de l'empreinte de la dernière écriture du groupe,
   mêlés à l'identifiant du membre. Elle change à chaque réunion, ce qui date la carte. */
function carteEmpreinte(avec, m) {
  const dernier = avec.tx.length ? avec.tx[avec.tx.length - 1].hash : avec.id;
  return sha256(dernier + '|' + m.id).slice(0, 6).toUpperCase();
}
const carteNum = (avec, m) => String(activeM(avec).findIndex(x => x.id === m.id) + 1).padStart(2, '0');
function carteTexte(avec, m) {
  return ['AKIBA', avec.name, (avec.village || ''), m.name, roleLabel(m), 'n°' + carteNum(avec, m),
    'depuis ' + fdate(m.joined || avec.cycle.start), 'empreinte ' + carteEmpreinte(avec, m)].filter(Boolean).join(' · ');
}

/* le dessin d'une carte : sobre, lisible à bout de bras, imprimable en noir et blanc */
function carteHTML(avec, m) {
  return `<article class="carte-m">
    <header><b>${esc(avec.name)}</b><span>${esc([avec.village, avec.territoire].filter(Boolean).join(' · '))}</span></header>
    <div class="qui">
      <div><span class="num">n°${carteNum(avec, m)}</span><b class="nom">${esc(m.name)}</b><span class="role">${esc(roleLabel(m))}</span></div>
      <img class="qr" data-qr="${esc(carteTexte(avec, m))}" alt="" width="104" height="104">
    </div>
    <footer><span>Membre depuis ${fdate(m.joined || avec.cycle.start)}</span><span class="emp">${carteEmpreinte(avec, m)}</span></footer>
  </article>`;
}

/* les QR sont dessinés après coup : un par carte, en noir sur blanc */
function carteDessinerQr() {
  const imgs = [...document.querySelectorAll('.carte-m .qr[data-qr]')];
  if (!imgs.length) return;
  const charger = window.QRCode ? Promise.resolve(window.QRCode) : new Promise((ok, non) => {
    const s = document.createElement('script'); s.src = 'qrcode.min.js';
    s.onload = () => (window.QRCode ? ok(window.QRCode) : non(new Error('QR'))); s.onerror = non;
    document.head.appendChild(s);
  });
  charger.then(Q => Promise.all(imgs.map(img =>
    Q.toDataURL(img.dataset.qr, { width: 220, margin: 0, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(url => { img.src = url; }).catch(() => { img.remove(); })
  ))).catch(() => imgs.forEach(i => i.remove()));
}

SCREENS['a.cards'] = () => {
  const { avec, me } = cur();
  const membres = activeM(avec);
  if (!isBureau(me)) return SCREENS['a.members']();
  setTimeout(carteDessinerQr, 0);
  return `<div class="shell">${topbar('Cartes des membres', esc(avec.name), backBtn('a.members'))}<main class="main">
    <div class="alert">${icSpan('clip')}<div><b>${membres.length} carte${membres.length > 1 ? 's' : ''} à imprimer</b>
      <span class="small">Feuille A4 ordinaire, dix cartes par page. Imprimez, puis découpez en suivant les traits.</span></div></div>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn primary" data-act="cartesPrint">${ic('clip')} Imprimer les cartes</button>
      <button class="btn ghost" data-act="go" data-to="a.members">Fermer</button>
    </div>
    <p class="hint">Le QR code reprend le nom du groupe, celui du membre, son rôle, son numéro, sa date d'entrée
      et une empreinte tirée du journal scellé. Aucun code secret, aucun montant : une carte peut se perdre sans risque.
      Pour vérifier une carte, scannez-la avec l'appareil photo et comparez l'empreinte avec celle de l'application.</p>
    <div class="cartes">${membres.map(m => carteHTML(avec, m)).join('')}</div>
  </main></div>`;
};
ACT.cartesPrint = () => { carteDessinerQr(); setTimeout(() => window.print(), 350); };
