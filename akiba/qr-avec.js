/* Akiba — ouvrir une AVEC neuve en montrant un QR code.

   Le transfert ordinaire déplace le cahier entier : un fichier de douze mille signes, qu'il faut
   envoyer par WhatsApp, par Bluetooth ou sur une carte mémoire. C'est la seule façon de bouger
   un cahier qui a déjà vécu — un journal scellé ne se résume pas.

   Mais le jour de la création, il n'y a pas encore de journal : il n'y a qu'un acte de
   naissance. Le nom du groupe, son lieu, son signe, le règlement voté, les membres avec leurs
   rôles et leurs codes, la carte de secours. Huit cents signes. Cela tient dans une image que
   l'animatrice montre à l'écran de son téléphone et que le secrétaire photographie avec le sien.

   Rien ne passe par le réseau : le QR ne porte pas une adresse, il porte le groupe. L'image se
   fabrique dans le téléphone, se lit dans le téléphone, et deux appareils éteints du monde
   posés sur la même natte suffisent.

   CE QUE CE CHEMIN N'EST PAS : il ne transporte pas un journal. Dès la première réunion scellée,
   le cahier dépasse ce qu'une image peut porter, et il faut revenir au fichier. L'application le
   vérifie et refuse d'elle-même — elle ne laissera jamais croire qu'un QR a déplacé des mois
   d'épargne.

   LE CODE RESTE. Le QR s'affiche sur un écran, et un écran se photographie de loin. Les huit
   signes se disent de vive voix, comme pour le fichier : sans eux, l'image ne s'ouvre pas. */
'use strict';

const QR_KIND = 'kitabu-qr';
/* Le mode « octets » d'un QR porte 2 953 caractères au plus. On s'arrête bien avant : au-delà,
   la trame devient si fine qu'un écran rayé ou un appareil photo bon marché ne la lit plus. */
const QR_MAX = 2200;

/* Un groupe qui n'a rien vécu : aucune réunion, et pas une écriture d'argent. */
function qrPossible(avec) {
  if (!avec) return { ok: false, pourquoi: 'AVEC inconnue' };
  if ((avec.meetings || []).length) return { ok: false, pourquoi: 'Ce groupe a déjà tenu une réunion : son journal ne tient pas dans une image. Envoyez le fichier.' };
  const argent = (avec.tx || []).some(t => TX[t.type] && TX[t.type].in !== null);
  if (argent) return { ok: false, pourquoi: 'Ce cahier porte déjà des écritures d\'argent : envoyez le fichier.' };
  return { ok: true };
}

/* l'acte de naissance, écrit court : chaque membre sur une ligne, séparée par des barres */
function qrCharge(avec) {
  const sep = '|';
  return {
    k: QR_KIND, f: 1, id: avec.id, n: avec.name, vi: avec.village, pr: avec.province,
    te: avec.territoire || '', se: avec.secteur || '', gr: avec.groupement || '', en: avec.entite || '',
    em: [avec.embleme.signe, avec.embleme.teinte].join(sep),
    re: avec.settings, cy: { n: avec.cycle.n, d: avec.cycle.start, f: avec.cycle.end },
    st: avec.status || 'active', or: avec.orgId || '', an: avec.animId || '', cr: avec.createdAt || Date.now(),
    me: avec.members.map(m => [m.id, m.name, m.sex || '', m.role || 'membre', m.key ? 1 : 0, m.pin,
      m.birthDate || '', m.phone && m.phone !== '—' ? m.phone : '', m.activity || ''].join(sep)),
    sc: (avec.rescue || []).map(r => r.h + (r.used ? '*' : '')),
  };
}

/* ---------- serrer le texte avant de le chiffrer ----------
   Un acte de naissance écrit en JSON répète sans cesse les mêmes mots : « role », « membre »,
   des identifiants qui commencent tous pareil. Compressé, il perd les deux tiers de sa taille —
   et c'est la différence entre une image que n'importe quel appareil lit et une trame si fine
   qu'un écran rayé la rend illisible. Le navigateur sait le faire tout seul ; s'il ne sait pas,
   on envoie en clair et l'image est simplement plus dense. */
const qrCompresseur = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function qrSerrer(texte) {
  const flux = new Blob([texte]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flux).arrayBuffer());
}
async function qrDesserrer(octets) {
  const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(flux).text();
}

/* le texte du QR : la même boîte chiffrée que le fichier, serrée et en plus court */
async function qrTexte(avec, code) {
  const corps = JSON.stringify(qrCharge(avec));
  const serre = qrCompresseur();
  const brut = serre ? await qrSerrer(corps) : new TextEncoder().encode(corps);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await backupKey(cleanXfer(code), salt), brut);
  return JSON.stringify(Object.assign({ a: QR_KIND, s: b64enc(salt), i: b64enc(iv), d: b64enc(cipher) }, serre ? { z: 1 } : {}));
}

/* ---------- couper en deux images quand une seule devient trop fine ----------
   Un QR de 133 carrés de côté sur l'écran d'un téléphone, c'est moins de trois pixels par
   carré : un appareil photo bon marché, un écran rayé, et plus rien ne se lit. Coupé en deux,
   chaque image retombe à une centaine de carrés et se lit du premier coup. Le secrétaire vise
   la première, touche « suivante », vise la seconde. */
const QR_PAR_IMAGE = 950;
function qrMorceaux(texte) {
  if (texte.length <= QR_PAR_IMAGE) return [texte];
  const n = Math.ceil(texte.length / QR_PAR_IMAGE), lot = Math.ceil(texte.length / n), id = randCode(4);
  return Array.from({ length: n }, (_, i) => JSON.stringify({ a: 'kitabu-qr-p', c: id, i: i + 1, n, d: texte.slice(i * lot, (i + 1) * lot) }));
}

/* ---------- montrer ---------- */
ACT.qrEnvoyer = async d => {
  const avec = avecById(d.id);
  if (!avec || !canMove(avec)) return App.toast('Réservé au bureau, à l\'animateur ou à l\'organisation');
  const peut = qrPossible(avec);
  if (!peut.ok) return App.toast(peut.pourquoi);
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le chiffrement. Mettez Chrome à jour.');
  const code = randCode(8);
  const texte = await qrTexte(avec, code);
  if (texte.length > QR_MAX) return App.toast('Ce groupe est trop grand pour une image : envoyez le fichier.');
  App.qrLot = qrMorceaux(texte); App.qrIndex = 0;
  App.openSheet(`<h2>Montrer l'AVEC</h2>
    <p class="muted">Sur le téléphone du groupe : « Recevoir par photo », puis viser ${App.qrLot.length > 1 ? 'les images l\'une après l\'autre' : 'cette image'}. Touchez-la pour l'agrandir.</p>
    <button class="qr-grand" data-act="qrPlein" aria-label="Agrandir l'image"><img id="qrImg" alt="Code à photographier"></button>
    ${App.qrLot.length > 1 ? `<div class="row between"><button class="btn ghost sm" data-act="qrImage" data-d="-1">‹ Précédente</button>
      <span id="qrRang" class="small muted">Image 1 sur ${App.qrLot.length}</span>
      <button class="btn brand sm" data-act="qrImage" data-d="1">Suivante ›</button></div>` : ''}
    <div class="receipt" style="text-align:center"><span class="label">Code à dire à voix haute</span>${bigCode(fmtXfer(code))}
      <p class="hint" style="margin:6px 0 0">Jamais dans le même message que l'image.</p></div>
    <div class="grid2"><button class="btn primary" data-act="qrEnvoye" data-id="${avec.id}">Le groupe l'a reçue</button>
      <button class="btn ghost" data-act="qrPartager">${ic('chat')} Envoyer l'image</button></div>`);
  qrDessiner();
};
/* Correction « L » : la trame la moins fine pour la même quantité de texte. Un QR lu de près,
   sur un écran propre, n'a pas besoin de la robustesse d'une étiquette imprimée — et chaque
   niveau de correction en plus serre les carrés jusqu'à l'illisible. */
async function qrDessiner() {
  try {
    const Q = await carteChargerQr();
    const url = await Q.toDataURL(App.qrLot[App.qrIndex], { width: 900, margin: 2, errorCorrectionLevel: 'L', color: { dark: '#000000', light: '#ffffff' } });
    App.qrImage = url;
    const img = document.getElementById('qrImg'); if (img) img.src = url;
    const r = document.getElementById('qrRang'); if (r) r.textContent = `Image ${App.qrIndex + 1} sur ${App.qrLot.length}`;
  } catch (e) { App.toast('Image impossible à fabriquer sur cet appareil'); }
}
ACT.qrImage = d => {
  const n = App.qrLot.length;
  App.qrIndex = (App.qrIndex + (+d.d) + n) % n;
  qrDessiner();
};
/* L'image elle-même se partage : par WhatsApp, par Bluetooth, ou enregistrée dans Fichiers.
   Elle reste chiffrée — sans les huit signes dits de vive voix, elle ne s'ouvre pas — donc
   l'envoyer n'est pas plus risqué que d'envoyer le fichier. C'est ce qui permet d'ouvrir une
   AVEC quand l'animatrice et le secrétaire ne sont pas dans le même village. */
ACT.qrPartager = async () => {
  if (!App.qrImage) return;
  const n = App.qrLot.length, rang = n > 1 ? `-${App.qrIndex + 1}-sur-${n}` : '';
  const octets = Uint8Array.from(atob(App.qrImage.split(',')[1]), c => c.charCodeAt(0));
  const voie = await sortirFichier(`akiba-image${rang}.png`, new Blob([octets], { type: 'image/png' }), 'image/png');
  App.toast(voie ? ouEstLeFichier(voie, 'akiba-image' + rang + '.png') : 'L\'image n\'a pas pu sortir de ce téléphone');
};
/* En plein écran, sur fond blanc et à la plus grande taille que porte l'appareil : c'est ce qui
   fait la différence entre une image lue du premier coup et trois minutes à chercher l'angle. */
ACT.qrPlein = () => {
  if (!App.qrImage) return;
  const d = document.createElement('div');
  d.className = 'qr-plein';
  d.innerHTML = `<img src="${App.qrImage}" alt="Code à photographier"><p>Touchez pour refermer</p>`;
  d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
};
/* Un cahier ne vit que sur un téléphone à la fois : celui qui a montré le QR passe la main,
   exactement comme après l'envoi d'un fichier. On attend que l'animatrice confirme, parce
   qu'elle seule sait si le secrétaire a vraiment réussi à lire l'image. */
ACT.qrEnvoye = d => {
  const avec = avecById(d.id);
  if (!avec) return;
  avec.movedOut = Date.now();
  marquerSorti(avec, 'montré par image au téléphone du groupe');
  secLog(avec, 'AVEC montrée par QR au téléphone du groupe', null, whoName());
  DB.save(); App.closeSheet(); render();
  App.toast('C\'est le téléphone du groupe qui tient le cahier maintenant');
};

/* ---------- renvoyer une réunion à l'animateur ----------

   L'autre sens du chemin. Le groupe tient son cahier ; l'animatrice en a reçu une copie le jour
   de la création, et elle doit la tenir à jour sans attendre la prochaine visite avec un câble.

   On n'envoie pas le cahier : on envoie LA RÉUNION — ses écritures, dans l'ordre, avec son
   sceau. Et comme le journal est une chaîne, la copie de l'animatrice ne les accepte que si la
   première s'accroche exactement à la dernière écriture qu'elle connaît. C'est un prolongement,
   jamais une fusion : si une réunion manque entre les deux, l'application le dit et renvoie au
   fichier, au lieu de recoller deux histoires différentes.

   Une séance de vingt membres pèse une quinzaine de milliers de signes, trois mille une fois
   serrés : cinq images à viser l'une après l'autre. */
const QR_REUNION = 'kitabu-qr-r';

function qrReunionPossible(avec, m) {
  if (!m || m.status !== 'closed') return { ok: false, pourquoi: 'La réunion doit être fermée et scellée' };
  if (!m.seal) return { ok: false, pourquoi: 'Cette réunion n\'a pas de sceau' };
  return { ok: true };
}
async function qrReunionTexte(avec, m, code) {
  const tx = avec.tx.filter(t => t.meetingId === m.id);
  const corps = JSON.stringify({ k: QR_REUNION, a: avec.id, n: avec.name, m, t: tx });
  const serre = qrCompresseur();
  const brut = serre ? await qrSerrer(corps) : new TextEncoder().encode(corps);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await backupKey(cleanXfer(code), salt), brut);
  return JSON.stringify(Object.assign({ a: QR_REUNION, s: b64enc(salt), i: b64enc(iv), d: b64enc(cipher) }, serre ? { z: 1 } : {}));
}
ACT.qrReunion = async d => {
  const { avec } = cur();
  const m = avec.meetings.find(x => x.id === d.m);
  const peut = qrReunionPossible(avec, m);
  if (!peut.ok) return App.toast(peut.pourquoi);
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le chiffrement');
  const code = randCode(8);
  const texte = await qrReunionTexte(avec, m, code);
  App.qrLot = qrMorceaux(texte); App.qrIndex = 0;
  const n = App.qrLot.length;
  App.openSheet(`<h2>Envoyer la réunion n°${m.n}</h2>
    <p class="muted">L'animateur vise ${n > 1 ? `les ${n} images, l'une après l'autre` : 'cette image'} : sa copie du cahier se prolonge de cette séance.</p>
    <button class="qr-grand" data-act="qrPlein" aria-label="Agrandir l'image"><img id="qrImg" alt="Code à photographier"></button>
    ${n > 1 ? `<div class="row between"><button class="btn ghost sm" data-act="qrImage" data-d="-1">‹ Précédente</button>
      <span id="qrRang" class="small muted">Image 1 sur ${n}</span>
      <button class="btn brand sm" data-act="qrImage" data-d="1">Suivante ›</button></div>` : ''}
    <div class="receipt" style="text-align:center"><span class="label">Code à dire à voix haute</span>${bigCode(fmtXfer(code))}</div>
    <div class="grid2"><button class="btn ghost" data-act="qrPartager">${ic('chat')} Envoyer l'image</button>
      <button class="btn ghost" data-act="closeSheet">Fermer</button></div>`);
  qrDessiner();
};

/* Prolonger la copie de l'animateur : on vérifie avant d'écrire, et on défait tout au moindre
   doute. Une copie qui refuse est réparable ; une copie qui accepte n'importe quoi ne l'est pas. */
async function qrReunionImporter(c) {
  const avec = avecById(c.a);
  if (!avec) return { error: 'Ce cahier n\'est pas sur ce téléphone : recevez-le d\'abord par fichier.' };
  if (!Array.isArray(c.t) || !c.t.length || !c.m) return { error: 'Cette image ne contient pas de réunion' };
  if (avec.meetings.some(x => x.id === c.m.id)) return { error: `La réunion n°${c.m.n} est déjà dans ce cahier` };
  const tete = avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id;
  if (c.t[0].prev !== tete) return { error: `Il manque une réunion avant la n°${c.m.n} : demandez le fichier au groupe.` };
  const nTx = avec.tx.length, nM = avec.meetings.length;
  avec.tx.push(...c.t.map(t => Object.assign({}, t, { synced: true })));
  avec.meetings.push(Object.assign({}, c.m, { synced: true }));
  const v = verifyDepuis(avec, nTx);
  if (!v.ok) { avec.tx.length = nTx; avec.meetings.length = nM; return { error: 'Ces écritures ne tiennent pas dans la chaîne : refusées (' + v.reason + ')' }; }
  if (typeof _chain === 'object') delete _chain[avec.id];
  DB.save();
  return { id: avec.id, name: avec.name, reunion: c.m.n, ecritures: c.t.length };
}

/* ---------- lire ----------
   Une image entière ouvre tout de suite ; une image en deux morceaux attend sa sœur. L'ordre
   n'a pas d'importance, et viser deux fois la même ne gêne pas. */
let qrFlux = null, qrBoucle = null, qrVu = null, qrSac = null;
function qrAssembler(brut) {
  let p = null;
  try { p = JSON.parse(brut); } catch (e) { /* pas du JSON : on rendra le texte tel quel */ }
  if (!p || p.a !== 'kitabu-qr-p') return { texte: brut };
  if (!qrSac || qrSac.c !== p.c) qrSac = { c: p.c, n: p.n, bouts: {} };
  qrSac.bouts[p.i] = p.d;
  const pris = Object.keys(qrSac.bouts).length;
  if (pris < qrSac.n) {
    const manque = [];
    for (let i = 1; i <= qrSac.n; i++) if (!qrSac.bouts[i]) manque.push(i);
    return { attente: `Image ${p.i} lue. Visez maintenant l'image ${manque[0]} sur ${qrSac.n}.` };
  }
  let t = '';
  for (let i = 1; i <= qrSac.n; i++) t += qrSac.bouts[i];
  qrSac = null;
  return { texte: t };
}
const qrScanDispo = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

ACT.qrRecevoir = () => {
  App.openSheet(`<h2>Recevoir par photo</h2>
    <p class="muted">Visez l'image montrée en face, puis tapez les huit signes qu'on vous dit.</p>
    ${qrScanDispo()
      ? '<div class="scanbox"><video id="qrVid" playsinline muted></video></div>'
      : '<div class="alert warn">' + icSpan('alert') + '<div><b>Cet appareil ne lit pas les images</b><span class="small">Demandez le fichier à l\'animatrice : « Recevoir notre AVEC ».</span></div></div>'}
    <div id="qrEtat" class="hint" aria-live="polite">Visez l'image.</div>
    <div class="field"><label for="qrC">Code de 8 signes</label><input id="qrC" class="input bignum" maxlength="40" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase" placeholder="ABCDEFGH"></div>
    <button class="btn primary block xl" data-act="qrOuvrir">${ic('check')} Ouvrir l'AVEC</button>
    <button class="btn ghost block" data-act="qrStop">Fermer</button>`);
  qrVu = null;
  if (qrScanDispo()) setTimeout(qrLire, 60);
};
async function qrLire() {
  const v = document.getElementById('qrVid');
  if (!v) return;
  const dire = t => { const e = document.getElementById('qrEtat'); if (e) e.textContent = t; };
  try {
    qrFlux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.srcObject = qrFlux; await v.play();
    const det = new window.BarcodeDetector({ formats: ['qr_code'] });
    qrBoucle = setInterval(async () => {
      try {
        const codes = await det.detect(v);
        if (codes && codes.length) {
          const lu = qrAssembler(codes[0].rawValue);
          if (lu.attente) { dire(lu.attente); if (typeof jouerSon === 'function') jouerSon('touche'); return; }
          qrVu = lu.texte;
          qrArreter();
          dire('Image lue. Tapez les huit signes.');
          if (typeof jouerSon === 'function') jouerSon('ok');
        }
      } catch (e) { /* une image floue n'arrête pas la lecture */ }
    }, 350);
  } catch (e) {
    dire('Appareil photo indisponible : autorisez-le, ou demandez le fichier à l\'animatrice.');
  }
}
function qrArreter() {
  clearInterval(qrBoucle); qrBoucle = null;
  if (qrFlux) { qrFlux.getTracks().forEach(t => t.stop()); qrFlux = null; }
  const b = document.querySelector('.scanbox'); if (b) b.style.display = 'none';
}
ACT.qrStop = () => { qrArreter(); App.closeSheet(); };

ACT.qrOuvrir = async () => {
  if (!qrVu) return App.toast('Visez d\'abord l\'image montrée par l\'animatrice');
  const code = fval('qrC');
  if (cleanXfer(code).length !== 8) return App.toast('Le code a 8 signes');
  const r = await qrImporter(qrVu, code);
  if (r.error) return App.toast(r.error);
  qrArreter(); App.closeSheet();
  /* une réunion reçue prolonge un cahier déjà là : on reste où l'on est, on ne change de
     téléphone ni d'écran — c'est l'animateur qui travaille, pas le groupe qui arrive */
  if (r.reunion) {
    render();
    return App.toast(`Réunion n°${r.reunion} ajoutée : ${r.ecritures} écritures vérifiées et scellées`);
  }
  rememberAvec(r.id);
  App.go('l.member', { id: r.id });
  App.toast(`« ${r.name} » est sur ce téléphone. Chaque membre touche son nom et tape son code.`);
};

/* ---------- ouvrir le groupe reçu ----------
   On ne recopie pas un journal : on refait l'acte de création, ici, avec les mêmes membres et
   les mêmes codes. Le journal du groupe commence donc sur ce téléphone — c'est le sien, et il
   n'y en aura jamais deux, puisque celui qui a montré l'image a passé la main. */
async function qrImporter(texte, code) {
  let box;
  try { box = JSON.parse(texte); } catch (e) { return { error: 'Cette image n\'est pas une AVEC Akiba' }; }
  if (!box || (box.a !== QR_KIND && box.a !== QR_REUNION)) return { error: 'Cette image n\'est pas une AVEC Akiba' };
  let c;
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(box.i) }, await backupKey(cleanXfer(code), b64dec(box.s)), b64dec(box.d));
    const texte2 = box.z ? await qrDesserrer(new Uint8Array(plain)) : new TextDecoder().decode(plain);
    c = JSON.parse(texte2);
  } catch (e) { return { error: 'Code faux, ou image mal lue' }; }
  /* une réunion qui revient du groupe : on prolonge la copie au lieu d'ouvrir un groupe */
  if (c && c.k === QR_REUNION) return await qrReunionImporter(c);
  if (!c || c.k !== QR_KIND || !Array.isArray(c.me) || !c.me.length) return { error: 'Cette image ne contient pas d\'AVEC' };
  const deja = avecById(c.id);
  if (deja && !deja.movedOut) return { error: 'Cette AVEC est déjà sur ce téléphone' };
  if (licenceRequired() && !(App.licence && App.licence.ok)) return { error: 'Ce téléphone n\'a pas de licence. Demandez un lien d\'activation.' };
  /* On quitte la démonstration, comme le fait déjà la réception par fichier. Sans cela, le
     cahier arrive dans un téléphone encore plein de faux groupes : la couverture continue de
     montrer la démonstration, et le vrai cahier du groupe reste introuvable. */
  if (K.data.mode !== 'prod') wipeTo(emptyData());

  const sep = '|';
  const members = c.me.map(l => {
    const [id, name, sex, role, key, pin, ne, tel, act] = String(l).split(sep);
    return { id, name, sex: sex || 'F', phone: tel || '—', pin, joined: c.cr || Date.now(), birthYear: null,
      birthDate: ne || '', photo: '', activity: act || '', address: '', role: role || 'membre', key: key === '1' };
  });
  const [signe, teinte] = String(c.em || '').split(sep);
  const avec = {
    id: c.id, name: c.n, village: c.vi, territoire: c.te || '—', province: c.pr,
    entite: c.en || '', secteur: c.se || '', groupement: c.gr || '',
    orgId: c.or || null, animId: c.an || null,
    embleme: Object.assign({}, EMB_DEFAUT, { signe, teinte }),
    createdAt: c.cr || Date.now(), cycle: { n: c.cy.n, start: c.cy.d, end: c.cy.f }, cycles: [],
    settings: Object.assign({}, c.re), members, meetings: [], tx: [], visits: [], lastSync: 0,
    status: c.st || 'active', rescue: (c.sc || []).map(x => ({ h: String(x).replace(/\*$/, ''), used: /\*$/.test(String(x)) })), security: []
  };
  secLog(avec, 'AVEC reçue par image', null, 'montrée par ' + (c.an ? 'l\'animateur' : 'l\'organisation'));
  /* les fondateurs entrent dans le journal de CE téléphone : la liste du premier jour est
     couverte par le sceau, comme pour une AVEC créée ici */
  members.forEach(m => appendTx(avec, { type: 'MEMBRE', amount: 0, memberId: m.id, by: null,
    note: 'Membre fondateur · ' + m.name + (m.role !== 'membre' ? ' · ' + ROLES[m.role] : '') }));
  if (deja) K.data.avecs = K.data.avecs.filter(a => a.id !== deja.id);
  K.data.avecs.push(avec);
  DB.save();
  return { id: avec.id, name: avec.name };
}
