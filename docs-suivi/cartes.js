/* Akiba AVEC — cartes de membre en papier.
   Dix cartes au format carte bancaire (85 × 54 mm) sur une feuille A4 ordinaire : on imprime, on découpe.
   Là où il n'y a pas d'imprimante A4, le terminal Android sort la même carte sur sa bande de 58 mm.

   La référence « 642-AF76CE » est le cœur du dispositif : 642 est le numéro de l'écriture du journal au
   moment de l'impression, AF76CE l'empreinte de cette écriture mêlée à l'identifiant du membre. Elle ne
   change jamais après coup — le journal ne s'efface pas — et elle se vérifie hors réseau, sur n'importe
   quel téléphone du groupe : « Vérifier une carte » lit le QR et refait le calcul.

   Aucun code secret, aucun montant : une carte se perd, se prête, se photographie sans conséquence. */
'use strict';

/* l'empreinte est ancrée sur une écriture précise du journal : celle du jour de l'impression */
function carteEmpreinte(avec, m, seq) {
  const n = seq == null ? avec.tx.length : seq;
  const ancre = n > 0 && avec.tx[n - 1] ? avec.tx[n - 1].hash : avec.id;
  return sha256(ancre + '|' + m.id).slice(0, 6).toUpperCase();
}
const carteRef = (avec, m, seq) => (seq == null ? avec.tx.length : seq) + '-' + carteEmpreinte(avec, m, seq);
const carteNum = (avec, m) => String(activeM(avec).findIndex(x => x.id === m.id) + 1).padStart(2, '0');
function carteTexte(avec, m, seq) {
  return ['AKIBA', avec.name, (avec.village || ''), m.name, roleLabel(m), 'n°' + carteNum(avec, m),
    'depuis ' + fdate(m.joined || avec.cycle.start), 'réf ' + carteRef(avec, m, seq)].filter(Boolean).join(' · ');
}

/* le dessin d'une carte : sobre, lisible à bout de bras, imprimable en noir et blanc */
function carteHTML(avec, m, seq) {
  return `<article class="carte-m">
    <header>${emblemeImprime(avec, 22)}<span class="ou"><b>${esc(avec.name)}</b><span>${esc([avec.village, avec.territoire].filter(Boolean).join(' · '))}</span></span></header>
    <div class="qui">
      ${photoDe(m) ? `<img class="photo" src="${photoDe(m)}" alt="">` : ''}
      <div><span class="num">n°${carteNum(avec, m)}</span><b class="nom">${esc(m.name)}</b><span class="role">${esc(roleLabel(m))}</span></div>
      <img class="qr" data-qr="${esc(carteTexte(avec, m, seq))}" alt="" width="104" height="104">
    </div>
    <footer><span>Membre depuis ${fdate(m.joined || avec.cycle.start)}</span><span class="emp">${carteRef(avec, m, seq)}</span></footer>
  </article>`;
}

/* les QR sont dessinés après coup : un par carte, en noir sur blanc */
function carteChargerQr() {
  if (window.QRCode) return Promise.resolve(window.QRCode);
  return new Promise((ok, non) => {
    const s = document.createElement('script'); s.src = 'qrcode.min.js';
    s.onload = () => (window.QRCode ? ok(window.QRCode) : non(new Error('QR'))); s.onerror = non;
    document.head.appendChild(s);
  });
}
function carteDessinerQr() {
  const imgs = [...document.querySelectorAll('.carte-m .qr[data-qr]')];
  if (!imgs.length) return Promise.resolve();
  return carteChargerQr().then(Q => Promise.all(imgs.map(img =>
    Q.toDataURL(img.dataset.qr, { width: 220, margin: 0, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(url => { img.src = url; }).catch(() => { img.remove(); })
  ))).catch(() => imgs.forEach(i => i.remove()));
}

/* ---------- la carte sur la bande de 58 mm du terminal ---------- */
function carteTicket(avec, m, seq) {
  const L = [];
  L.push(rCenter('AKIBA - CARTE MEMBRE'));
  L.push('-'.repeat(RECU_W));
  L.push(rCenter(noAcc(avec.name)));
  if (avec.village) L.push(rCenter(noAcc([avec.village, avec.territoire].filter(Boolean).join(' - '))));
  L.push('-'.repeat(RECU_W));
  L.push('n ' + carteNum(avec, m) + '  ' + noAcc(m.name).toUpperCase());
  L.push(noAcc(roleLabel(m)));
  L.push('Membre depuis ' + noAcc(fdate(m.joined || avec.cycle.start)));
  L.push('');
  L.push(rCenter('Ref ' + carteRef(avec, m, seq)));
  L.push(rCenter('a verifier dans Akiba'));
  L.push('-'.repeat(RECU_W));
  L.push(rCenter('Ni code secret ni montant'));
  return L.join('\n');
}
ACT.cartesPos = async () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  const membres = activeM(avec), seq = avec.tx.length;
  App.toast('Impression de ' + membres.length + ' cartes…');
  let faites = 0, comment = '';
  for (const m of membres) {
    try { comment = await printReceipt(carteTicket(avec, m, seq)); faites++; }
    catch (e) { break; }
  }
  App.toast(faites ? faites + ' carte(s) envoyées à l’imprimante' : 'Aucune imprimante trouvée sur cet appareil');
};

/* ---------- vérifier une carte en la scannant ---------- */
const carteScanDispo = () => typeof window !== 'undefined' && 'BarcodeDetector' in window;

/* retrouve le membre et refait le calcul : la carte vient-elle bien de ce journal ? */
function carteVerifierTexte(avec, texte) {
  const t = String(texte || '').replace(/\s+/g, ' ').trim();
  const ref = (t.match(/(\d+)-([0-9A-F]{6})/i) || []);
  if (!/AKIBA/i.test(t) || !ref[1]) return { ok: false, titre: 'Ce n’est pas une carte Akiba', detail: 'Le QR scanné ne contient pas de référence de carte.' };
  const seq = +ref[1], emp = ref[2].toUpperCase();
  const parts = t.split('·').map(s => s.trim());
  const nom = parts[3] || '';
  const m = avec.members.find(x => noAcc(x.name).toLowerCase() === noAcc(nom).toLowerCase());
  if (!m) return { ok: false, titre: 'Membre inconnu dans ce groupe', detail: esc(nom || '(nom illisible)') + ' ne figure pas dans ' + esc(avec.name) + '.' };
  if (seq > avec.tx.length) return { ok: false, titre: 'Carte plus récente que ce téléphone', detail: 'Elle a été imprimée après la dernière réunion reçue ici. Synchronisez, puis réessayez.' };
  const attendu = carteEmpreinte(avec, m, seq);
  if (attendu !== emp) return { ok: false, titre: 'Carte non conforme', detail: 'La référence ne correspond pas au journal de ce groupe. Carte recopiée, ou venue d’un autre groupe.' };
  return { ok: true, titre: 'Carte authentique', detail: esc(m.name) + ' · ' + esc(roleLabel(m)) + ' · n°' + carteNum(avec, m) + ' · imprimée à l’écriture n°' + seq, m };
}

ACT.carteVerifier = () => {
  const { avec } = cur();
  App.openSheet(`<h2>Vérifier une carte</h2>
    ${carteScanDispo()
      ? `<p class="muted">Visez le QR code de la carte avec l’appareil photo. Tout se passe sur le téléphone, sans réseau.</p>
         <div class="scanbox"><video id="carteVid" playsinline muted></video></div>`
      : `<p class="muted">Cet appareil ne sait pas lire les QR codes depuis l’application. Lisez la carte avec l’appareil photo du téléphone, puis recopiez ci-dessous la référence imprimée en bas à droite.</p>`}
    <div class="field"><label for="carteRef">Référence de la carte</label>
      <input id="carteRef" class="input mono" autocomplete="off" autocapitalize="characters" placeholder="Ex. 642-AF76CE"></div>
    <div class="field"><label for="carteNom">Nom inscrit sur la carte</label>
      <input id="carteNom" class="input" autocomplete="off" placeholder="Ex. Anuarite Kyavumba"></div>
    <button class="btn primary block xl" data-act="carteVerifSaisie">${ic('check')} Vérifier</button>
    <div id="carteRes"></div>
    <button class="btn ghost block" data-act="carteScanStop">Fermer</button>`);
  if (carteScanDispo()) setTimeout(carteScanDemarrer, 60);
};

let carteFlux = null, carteBoucle = null;
async function carteScanDemarrer() {
  const v = document.getElementById('carteVid');
  if (!v) return;
  try {
    carteFlux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.srcObject = carteFlux; await v.play();
    const det = new window.BarcodeDetector({ formats: ['qr_code'] });
    carteBoucle = setInterval(async () => {
      try {
        const codes = await det.detect(v);
        if (codes && codes.length) { carteScanArreter(); carteMontrer(carteVerifierTexte(cur().avec, codes[0].rawValue)); }
      } catch (e) { /* une image illisible n'arrête pas la lecture */ }
    }, 350);
  } catch (e) {
    const b = document.querySelector('.scanbox');
    if (b) b.innerHTML = '<p class="hint" style="padding:12px">Appareil photo indisponible : autorisez-le, ou recopiez la référence ci-dessous.</p>';
  }
}
function carteScanArreter() {
  clearInterval(carteBoucle); carteBoucle = null;
  if (carteFlux) { carteFlux.getTracks().forEach(t => t.stop()); carteFlux = null; }
}
ACT.carteScanStop = () => { carteScanArreter(); App.closeSheet(); };
function carteMontrer(r) {
  const z = document.getElementById('carteRes');
  if (!z) return App.toast(r.titre);
  z.innerHTML = `<div class="alert ${r.ok ? 'good' : 'bad'}">${icSpan(r.ok ? 'check' : 'alert')}<div><b>${r.titre}</b><span class="small">${r.detail}</span></div></div>`;
}
ACT.carteVerifSaisie = () => {
  const { avec } = cur();
  const ref = (fval('carteRef') || '').trim(), nom = (fval('carteNom') || '').trim();
  if (!ref || !nom) return App.toast('Recopiez la référence et le nom');
  carteMontrer(carteVerifierTexte(avec, 'AKIBA · ' + avec.name + ' · · ' + nom + ' · · · · réf ' + ref));
};

SCREENS['a.cards'] = () => {
  const { avec, me } = cur();
  const membres = activeM(avec), seq = avec.tx.length;
  if (!isBureau(me)) return SCREENS['a.members']();
  setTimeout(carteDessinerQr, 0);
  return `<div class="shell">${topbar('Cartes des membres', esc(avec.name), backBtn('a.members'))}<main class="main">
    <div class="alert">${icSpan('clip')}<div><b>${membres.length} carte${membres.length > 1 ? 's' : ''} à imprimer</b>
      <span class="small">Feuille A4 ordinaire, dix cartes par page. Imprimez, puis découpez en suivant les traits.</span></div></div>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn primary" data-act="cartesPrint">${ic('clip')} Imprimer sur A4</button>
      <button class="btn brand" data-act="cartesPos">${ic('home')} Imprimer sur le terminal</button>
      <button class="btn ghost" data-act="carteVerifier">${ic('shield')} Vérifier une carte</button>
    </div>
    <p class="hint">Le QR code porte le nom du groupe, celui du membre, son rôle, son numéro, sa date d'entrée
      et la référence <b class="mono">${seq}-…</b> : le numéro de l'écriture du journal au moment de l'impression,
      suivi de son empreinte. Aucun code secret, aucun montant. « Vérifier une carte » refait le calcul hors réseau :
      une carte recopiée ou venue d'un autre groupe est refusée.</p>
    <div class="cartes">${membres.map(m => carteHTML(avec, m, seq)).join('')}</div>
  </main></div>`;
};
ACT.cartesPrint = () => { carteDessinerQr().then(() => setTimeout(() => window.print(), 250)); };
