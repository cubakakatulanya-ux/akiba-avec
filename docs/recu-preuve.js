/* Akiba — le reçu qui se vérifie tout seul.

   Un membre repart avec un papier. Trois mois plus tard il conteste : « on m'a écrit deux parts,
   j'en avais payé trois ». Jusqu'ici, seul le téléphone du groupe pouvait trancher — et c'est
   justement ce téléphone que l'on soupçonne. La parole du secrétaire contre celle du membre.

   Chaque reçu porte désormais une référence courte, du genre « 14-AF76CE » : le numéro de la
   réunion, puis l'empreinte du sceau de cette réunion mêlé à l'identifiant du membre et aux
   montants de sa ligne. N'importe quel téléphone du groupe — celui de l'animateur, celui d'un
   membre qui doute — refait le calcul sans réseau et répond : ce papier dit-il la même chose que
   le journal scellé, oui ou non.

   La référence coûte UNE ligne de papier. Le QR, qui dit la même chose en se scannant, coûte
   deux centimètres : il n'apparaît donc que sur le reçu détaillé et sur le reçu partagé, jamais
   sur le reçu court qu'on imprime vingt fois par réunion. */
'use strict';

/* l'empreinte lie le papier à une ligne précise du journal : la réunion, le membre, les montants */
function recuEmpreinte(avec, m, x, r) {
  r = r || memberReceipt(avec, m, x);
  const corps = [m.seal || m.id, x.id, r.parts, r.epargne, r.social, r.remb, r.credit, r.amende, r.dette, r.aide, r.partage, r.depart].join('|');
  return sha256(corps).slice(0, 6).toUpperCase();
}
const recuRef = (avec, m, x, r) => m.n + '-' + recuEmpreinte(avec, m, x, r);

/* le texte que porte le QR : lisible à l'œil, et suffisant pour refaire le calcul */
function recuQrTexte(avec, m, x, r) {
  r = r || memberReceipt(avec, m, x);
  return ['AKIBA-RECU', avec.name, x.name, 'reunion ' + m.n, fdate(m.date),
    'ref ' + recuRef(avec, m, x, r)].join(' · ');
}

/* retrouve la réunion et le membre, puis refait le calcul sur le journal de ce téléphone */
function recuVerifierTexte(avec, texte) {
  const t = String(texte || '').replace(/\s+/g, ' ').trim();
  const ref = t.match(/(\d+)-([0-9A-F]{6})/i);
  if (!/AKIBA/i.test(t) || !ref) return { ok: false, titre: 'Ce n’est pas un reçu Akiba', detail: 'Le texte scanné ne contient pas de référence de reçu.' };
  const n = +ref[1], emp = ref[2].toUpperCase();
  const m = avec.meetings.find(y => y.n === n);
  if (!m) return { ok: false, titre: 'Réunion inconnue sur ce téléphone', detail: `La réunion n°${n} n’est pas dans ce journal. Si le reçu vient d’un autre groupe, c’est normal ; sinon, synchronisez.` };
  const parts = t.split('·').map(s => s.trim());
  const nom = parts[2] || '';
  const x = avec.members.find(y => noAcc(y.name).toLowerCase() === noAcc(nom).toLowerCase());
  if (!x) return { ok: false, titre: 'Membre inconnu dans ce groupe', detail: esc(nom || '(nom illisible)') + ' ne figure pas dans ' + esc(avec.name) + '.' };
  const r = memberReceipt(avec, m, x);
  if (recuEmpreinte(avec, m, x, r) !== emp) {
    return { ok: false, titre: 'Ce reçu ne correspond pas au journal',
      detail: `Le journal dit, pour ${esc(x.name)} à la réunion n°${n} : ${r.parts} part(s), ${fc(r.epargne)} d’épargne${r.remb ? ', ' + fc(r.remb) + ' remboursés' : ''}${r.credit ? ', ' + fc(r.credit) + ' de crédit' : ''}. Le papier annonce autre chose, ou il a été refait.` };
  }
  const dit = [r.parts ? `${r.parts} part(s) · ${fc(r.epargne)}` : '', r.social ? `caisse sociale ${fc(r.social)}` : '',
    r.remb ? `remboursé ${fc(r.remb)}` : '', r.credit ? `crédit ${fc(r.credit)}` : '',
    r.amende ? `amende ${fc(r.amende)}` : '', r.partage ? `partage ${fc(r.partage)}` : ''].filter(Boolean).join(' · ');
  return { ok: true, titre: 'Reçu authentique', detail: `${esc(x.name)} · réunion n°${n} du ${fdate(m.date)}${dit ? ' · ' + dit : ''}`, x, m };
}

/* ---------- vérifier un reçu : au QR, ou en recopiant la référence ---------- */
ACT.recuVerifier = () => {
  const { avec } = cur();
  App.openSheet(`<h2>Vérifier un reçu</h2>
    <p class="muted">Un membre conteste son reçu ? Akiba refait le calcul sur le journal scellé, sans réseau, et dit si le papier et le journal se contredisent.</p>
    ${carteScanDispo()
      ? `<p class="small muted">Visez le QR du reçu, ou recopiez la référence imprimée en bas.</p>
         <div class="scanbox"><video id="recuVid" playsinline muted></video></div>`
      : '<p class="small muted">Recopiez la référence imprimée en bas du reçu, et le nom du membre.</p>'}
    <div class="field"><label for="rvRef">Référence du reçu</label>
      <input id="rvRef" class="input mono" autocomplete="off" autocapitalize="characters" placeholder="Ex. 14-AF76CE"></div>
    <div class="field"><label for="rvNom">Nom du membre</label>
      <input id="rvNom" class="input" autocomplete="off" placeholder="Ex. Kavira Mbusa"></div>
    <button class="btn primary block xl" data-act="recuVerifSaisie">${ic('check')} Vérifier</button>
    <div id="rvRes"></div>
    <button class="btn ghost block" data-act="recuScanStop">Fermer</button>`);
  if (carteScanDispo()) setTimeout(recuScanDemarrer, 60);
};
let recuFlux = null, recuBoucle = null;
async function recuScanDemarrer() {
  const v = document.getElementById('recuVid');
  if (!v) return;
  try {
    recuFlux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.srcObject = recuFlux; await v.play();
    const det = new window.BarcodeDetector({ formats: ['qr_code'] });
    recuBoucle = setInterval(async () => {
      try {
        const codes = await det.detect(v);
        if (codes && codes.length) { recuScanArreter(); recuMontrer(recuVerifierTexte(cur().avec, codes[0].rawValue)); }
      } catch (e) { /* une image illisible n'arrête pas la lecture */ }
    }, 350);
  } catch (e) {
    const b = document.querySelector('.scanbox');
    if (b) b.innerHTML = '<p class="hint" style="padding:12px">Appareil photo indisponible : recopiez la référence ci-dessous.</p>';
  }
}
function recuScanArreter() {
  clearInterval(recuBoucle); recuBoucle = null;
  if (recuFlux) { recuFlux.getTracks().forEach(t => t.stop()); recuFlux = null; }
}
ACT.recuScanStop = () => { recuScanArreter(); App.closeSheet(); };
function recuMontrer(r) {
  const z = document.getElementById('rvRes');
  if (!z) return App.toast(r.titre);
  z.innerHTML = `<div class="alert ${r.ok ? 'good' : 'bad'}">${icSpan(r.ok ? 'check' : 'alert')}<div><b>${r.titre}</b><span class="small">${r.detail}</span></div></div>`;
}
ACT.recuVerifSaisie = () => {
  const { avec } = cur();
  const ref = (fval('rvRef') || '').trim(), nom = (fval('rvNom') || '').trim();
  if (!ref || !nom) return App.toast('Recopiez la référence et le nom');
  recuMontrer(recuVerifierTexte(avec, 'AKIBA-RECU · ' + avec.name + ' · ' + nom + ' · · · ref ' + ref));
};

/* le QR du reçu, dessiné après coup — jamais sur le reçu court, qui doit rester économe */
function recuQrDessiner() {
  const img = document.getElementById('recuQrImg');
  if (!img || !img.dataset.qr || typeof carteChargerQr !== 'function') return;
  carteChargerQr()
    .then(Q => Q.toDataURL(img.dataset.qr, { width: 240, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }))
    .then(u => { img.src = u; img.hidden = false; })
    .catch(() => { /* sans QR, la référence en chiffres suffit */ });
}
