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
    /* le code de demande voyage avec le groupe : sans lui, un groupe qui arrive « en attente »
       ne peut plus être activé — ni par appel, ni par envoi — et ne tiendra jamais sa première
       réunion. Douze signes de plus dans l'image, contre un groupe bloqué. */
    rq: avec.requestCode || '',
    /* L'organisation voyage elle aussi, réduite à ce dont le téléphone du groupe a besoin :
       son nom, et le secret partagé qui permet de vérifier le code d'activation dicté au
       téléphone. Sans lui, le groupe entend bien les huit chiffres, mais ne peut pas les
       reconnaître : il reste « en attente » pour toujours. Le fichier emporte déjà l'organisation
       entière ; l'image n'en garde que trois champs, pour tenir dans la trame. */
    og: (() => { const o = avec.orgId ? (K.data.orgs || []).find(x => x.id === avec.orgId) : null;
      return o ? [o.id, o.name, o.secret || ''].join(sep) : ''; })(),
    /* l'animateur, en lecture seule : c'est lui que le cahier nomme comme créateur */
    us: (() => { const u = avec.animId ? userById(avec.animId) : null;
      return u ? [u.id, u.role, u.orgId || '', u.name, u.zone || ''].join(sep) : ''; })(),
    /* La dernière valeur de chaque ligne est l'instant de l'écriture fondatrice de ce membre,
       compté depuis la création du groupe. Il ne sert qu'à une chose, mais elle est décisive :
       le téléphone du groupe réécrit lui-même les écritures fondatrices, et l'heure entre dans
       le sceau. Sans elle, les deux cahiers partent sur des empreintes différentes dès la
       première ligne — et la réunion renvoyée par image ne s'accroche plus à la copie de
       l'animateur, qui doit alors redemander le fichier. */
    me: avec.members.map(m => { const f = avec.tx.find(t => t.type === 'MEMBRE' && t.memberId === m.id);
      return [m.id, m.name, m.sex || '', m.role || 'membre', m.key ? 1 : 0, m.pin,
        m.birthDate || '', m.phone && m.phone !== '—' ? m.phone : '', m.activity || '',
        f ? f.ts - (avec.createdAt || 0) : ''].join(sep); }),
    sc: (avec.rescue || []).map(r => r.h + (r.used ? '*' : '')),
    /* La licence voyage avec le groupe, comme dans le fichier de transfert. Sans elle, le
       téléphone neuf qu'on vient de remettre à une AVEC refusait l'image le jour même de la
       création — « demandez un lien d'activation » — alors que le MÊME groupe, envoyé par
       fichier, s'ouvrait sans rien demander. Deux chemins pour le même geste ne doivent pas
       donner deux réponses. */
    li: licGet(),
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
/* Mesuré, pas estimé : à 950 signes la trame fait 93 carrés, soit 4,1 pixels par carré sur un
   écran de téléphone en plein écran ; à 1 200 elle fait 105 carrés et 3,6 pixels ; à 1 530 elle
   passe à 117 carrés et 3,2 pixels, et c'est là que les appareils bon marché commencent à
   décrocher. Le renvoi d'une réunion tient en une seule image jusqu'à une quinzaine de membres
   avec cette limite-ci ; au-delà il en faut deux, qui défilent toutes seules. */
const QR_PAR_IMAGE_R = 1200;
function qrMorceaux(texte, max) {
  const par = max || QR_PAR_IMAGE;
  if (texte.length <= par) return [texte];
  const n = Math.ceil(texte.length / par), lot = Math.ceil(texte.length / n), id = randCode(4);
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
/* Envoyer les images, et toutes les images : une seule partie d'un lot ne sert à rien en face,
   et il ne faut pas que le bureau ait à toucher « suivante » puis « envoyer » autant de fois
   qu'il y a d'images — c'est là qu'on en oublie une, et que l'autre téléphone attend pour
   rien. La boucle s'arrête le temps de l'envoi, sinon l'image change sous la main. */
ACT.qrPartager = async () => {
  if (!App.qrLot || !App.qrLot.length) return;
  const tournait = !!App.qrBoucleImg;
  qrAutoArreter();
  const n = App.qrLot.length, depart = App.qrIndex;
  let voie = '', envoyees = 0;
  try {
    for (let i = 0; i < n; i++) {
      App.qrIndex = i;
      await qrDessiner();
      if (!App.qrImage) break;
      const rang = n > 1 ? `-${i + 1}-sur-${n}` : '';
      const octets = Uint8Array.from(atob(App.qrImage.split(',')[1]), c => c.charCodeAt(0));
      const v = await sortirFichier(`akiba-image${rang}.png`, new Blob([octets], { type: 'image/png' }), 'image/png');
      if (!v) break;                                   // partage refusé ou annulé : on n'insiste pas
      voie = v; envoyees++;
    }
  } finally {
    App.qrIndex = depart;
    await qrDessiner();
    if (tournait) qrAutoDemarrer();
  }
  if (!envoyees) return App.toast('Les images n\'ont pas pu sortir de ce téléphone');
  if (envoyees < n) return App.toast(`${envoyees} image sur ${n} envoyée : envoyez aussi les autres, sinon l'autre téléphone ne pourra rien ouvrir.`);
  App.toast((n > 1 ? `Les ${n} images sont parties. ` : '') + ouEstLeFichier(voie, 'akiba-image.png'));
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

/* ---------- le cahier entier, en images ----------

   Un cahier qui a vécu ne tient pas dans une image : quatorze réunions pèsent seize mille
   signes. Mais rien n'oblige à n'en faire qu'une. Le fichier de transfert — le même que
   celui qu'on envoie par WhatsApp, chiffré par les mêmes huit signes — se découpe en une
   vingtaine d'images que l'écran montre en boucle, et que le téléphone d'en face ramasse
   dans l'ordre qu'il peut. Celle qu'il rate revient vingt secondes plus tard.

   Ce que cela enlève : le gestionnaire de fichiers, WhatsApp, le câble, la carte mémoire.
   Deux téléphones face à face suffisent, et rien ne sort du village. */
const QR_IMAGES_MAX = 25;          // au-delà, la boucle dure trop longtemps : le fichier reste
/* Une estimation à bas prix, pour savoir s'il faut proposer le geste sans chiffrer tout le
   cahier à chaque dessin d'écran. Comptée large : mieux vaut ne pas proposer que proposer
   puis refuser. Soixante-cinq octets serrés par écriture, et trois mille pour le reste du
   cahier : mesuré sur la démonstration, de zéro à quatorze réunions. */
const qrImagesEstimees = avec => Math.ceil((((avec && avec.tx) || []).length * 65 + 3000) * 1.37 / QR_PAR_IMAGE);
const qrCahierPossible = avec => !!avec && qrImagesEstimees(avec) <= QR_IMAGES_MAX;
ACT.qrCahier = async d => {
  const avec = avecById(d.id);
  if (!avec || !canMove(avec)) return App.toast('Réservé au bureau, à l\'animateur ou à l\'organisation');
  if (!canEncrypt()) return App.toast('Ce navigateur ne permet pas le chiffrement. Mettez Chrome à jour.');
  if (openMeeting(avec)) return App.toast('Fermez d\'abord la réunion en cours');
  App.toast('Préparation des images…');
  const code = randCode(8);
  const fichier = await buildTransfer(avec, code);
  const lot = qrMorceaux(fichier);
  if (lot.length > QR_IMAGES_MAX) return App.toast(`Ce cahier demanderait ${lot.length} images : envoyez le fichier.`);
  App.qrLot = lot; App.qrIndex = 0; App.qrCode = code;
  App.openSheet(`<h2>Montrer le cahier</h2>
    <p class="muted">Sur l'autre téléphone : <b>Recevoir par photo</b>. Tenez l'appareil en face ; les images défilent toutes seules et recommencent. Celle qu'il rate reviendra.</p>
    <button class="qr-grand" data-act="qrPlein" aria-label="Agrandir l'image"><img id="qrImg" alt="Code à photographier"></button>
    <div class="row between"><button class="btn ghost sm" data-act="qrImage" data-d="-1">‹ Précédente</button>
      <span id="qrRang" class="small muted">Image 1 sur ${lot.length}</span>
      <button class="btn brand sm" data-act="qrImage" data-d="1">Suivante ›</button></div>
    <div class="row between card"><div><b>Défilement automatique</b><p class="hint">Une image toutes les deux secondes</p></div>
      <button class="toggle on" data-act="qrAuto" aria-label="Défilement automatique"></button></div>
    <div class="receipt" style="text-align:center"><span class="label">Code à dire à voix haute</span>${bigCode(fmtXfer(code))}
      <p class="hint" style="margin:6px 0 0">Jamais dans le même message que les images.</p></div>
    <button class="btn primary block xl" data-act="qrEnvoye" data-id="${avec.id}">Le groupe a tout reçu</button>`);
  qrDessiner();
  qrAutoDemarrer();
};
/* la boucle : elle s'arrête d'elle-même quand la feuille se ferme */
function qrAutoDemarrer() {
  qrAutoArreter();
  App.qrBoucleImg = setInterval(() => {
    if (!document.getElementById('qrImg')) return qrAutoArreter();
    App.qrIndex = (App.qrIndex + 1) % App.qrLot.length;
    qrDessiner();
  }, 2000);
}
function qrAutoArreter() { if (App.qrBoucleImg) { clearInterval(App.qrBoucleImg); App.qrBoucleImg = null; } }
ACT.qrAuto = (d, el) => {
  if (App.qrBoucleImg) { qrAutoArreter(); el.classList.remove('on'); App.toast('Défilement arrêté'); }
  else { qrAutoDemarrer(); el.classList.add('on'); App.toast('Les images défilent'); }
};

ACT.qrEnvoye = d => {
  qrAutoArreter();
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

   ---------- CE QU'ON N'ENVOIE PAS, ET POURQUOI ----------

   La première version envoyait les écritures telles quelles. Chacune portait son empreinte et
   celle de la précédente : cent vingt-huit signes hexadécimaux par ligne, quarante-quatre
   lignes. Or ces empreintes se RECALCULENT à l'arrivée — c'est tout le travail de
   verifyDepuis. Les envoyer, c'était remplir l'image de ce que le téléphone d'en face sait
   déjà refaire, et du hasard compresse mal : mesuré sur une séance de vingt membres, trois
   mille trois cent quatre-vingt-cinq octets serrés, cinq images.

   On n'envoie donc que ce qu'on ne peut pas deviner : la seule empreinte de raccord (celle de
   la dernière écriture connue), et le contenu de chaque écriture, en lignes séparées par des
   barres — l'écriture courte que qrCharge emploie déjà pour les membres. La chaîne est refaite
   ici, puis vérifiée : si un seul chiffre avait bougé en route, les empreintes recalculées ne
   tomberaient pas sur le sceau, et tout serait refusé. On ne perd donc aucune garantie — on
   arrête seulement de transporter ce qui se démontre.

   Mille cinquante-cinq octets serrés au lieu de trois mille trois cent quatre-vingt-cinq : une
   image jusqu'à une quinzaine de membres, deux au-delà, et elles défilent toutes seules. */
const QR_REUNION = 'kitabu-qr-r2';
/* une barre sépare les champs d'une ligne : dans un texte libre, elle se met de côté le temps
   du voyage, sinon la ligne se couperait au mauvais endroit et le sceau ne tomberait plus */
const QR_BARRE = '\u0001';
const qrEch = s => String(s == null ? '' : s).split('|').join(QR_BARRE);
const qrDesech = s => String(s == null ? '' : s).split(QR_BARRE).join('|');

function qrReunionPossible(avec, m) {
  if (!m || m.status !== 'closed') return { ok: false, pourquoi: 'La réunion doit être fermée et scellée' };
  if (!m.seal) return { ok: false, pourquoi: 'Cette réunion n\'a pas de sceau' };
  return { ok: true };
}
/* la séance en clair, écrite court : tout ce qui entre dans le sceau, et rien qui se recalcule */
function qrReunionCharge(avec, m) {
  const tx = avec.tx.filter(t => t.meetingId === m.id);
  const sfx = m.id.indexOf(avec.id) === 0 ? m.id.slice(avec.id.length) : '=' + m.id;
  return {
    k: QR_REUNION, f: 1, a: avec.id, n: avec.name,
    m: [sfx, m.n, m.cycle, m.date, m.openedBy || '', m.openCount, m.openExpected,
      m.closeExpected, m.closeCount, (m.closedAt || m.date) - m.date, m.sealSeq, m.seal,
      (m.validators || []).join('|'), qrEch(m.note)],
    pr: m.presence || {},
    /* l'empreinte de raccord et le rang de la première écriture : les deux seules choses qui
       disent où cette séance s'accroche dans le journal de l'animateur */
    p0: tx.length ? tx[0].prev : '', s0: tx.length ? tx[0].seq : 0,
    t: tx.map(t => [t.id, t.type, t.memberId || '', t.amount, t.parts || '', t.months || '',
      t.rate || '', qrEch(t.ref), qrEch(t.note), t.by || '', t.ts - m.date, t.cycle].join('|')),
  };
}
async function qrReunionTexte(avec, m, code) {
  const corps = JSON.stringify(qrReunionCharge(avec, m));
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
  App.qrLot = qrMorceaux(texte, QR_PAR_IMAGE_R); App.qrIndex = 0;
  const n = App.qrLot.length;
  /* Ce qui manquait le plus n'était pas la place dans l'image : c'était de dire où toucher.
     L'écran disait « l'animateur vise les images » sans nommer le geste qui ouvre l'appareil
     photo en face — et sans le nom, on ne le trouve pas. */
  App.openSheet(`<h2>Envoyer la réunion n°${m.n}</h2>
    <ol class="pas3">
      <li>Sur le téléphone de l'animateur : <b>Recevoir par photo</b>.</li>
      <li>Il tient l'appareil en face de cet écran.${n > 1 ? ' Les deux images défilent toutes seules ; celle qu\'il rate revient.' : ''}</li>
      <li>Vous lui dites les huit signes à voix haute. Sa copie du cahier se prolonge de cette séance.</li>
    </ol>
    <button class="qr-grand" data-act="qrPlein" aria-label="Agrandir l'image"><img id="qrImg" alt="Code à photographier"></button>
    ${n > 1 ? `<div class="row between"><button class="btn ghost sm" data-act="qrImage" data-d="-1">‹ Précédente</button>
      <span id="qrRang" class="small muted">Image 1 sur ${n}</span>
      <button class="btn brand sm" data-act="qrImage" data-d="1">Suivante ›</button></div>
    <div class="row between card"><div><b>Défilement automatique</b><p class="hint">Une image toutes les deux secondes</p></div>
      <button class="toggle on" data-act="qrAuto" aria-label="Défilement automatique"></button></div>` : ''}
    <div class="receipt" style="text-align:center"><span class="label">Code à dire à voix haute</span>${bigCode(fmtXfer(code))}
      <p class="hint" style="margin:6px 0 0">Jamais dans le même message que l'image.</p></div>
    <div class="grid2"><button class="btn ghost" data-act="qrPartager">${ic('chat')} Envoyer ${n > 1 ? 'les images' : 'l\'image'}</button>
      <button class="btn ghost" data-act="qrFermer">Fermer</button></div>`);
  qrDessiner();
  if (n > 1) qrAutoDemarrer();
};
/* fermer à la main arrête la boucle tout de suite, sans attendre qu'elle s'en aperçoive */
ACT.qrFermer = () => { qrAutoArreter(); App.closeSheet(); };

/* Prolonger la copie de l'animateur : on vérifie avant d'écrire, et on défait tout au moindre
   doute. Une copie qui refuse est réparable ; une copie qui accepte n'importe quoi ne l'est pas. */
async function qrReunionImporter(c) {
  const avec = avecById(c.a);
  if (!avec) return { error: 'Ce cahier n\'est pas sur ce téléphone : recevez-le d\'abord par fichier.' };
  if (!Array.isArray(c.t) || !c.t.length || !Array.isArray(c.m)) return { error: 'Cette image ne contient pas de réunion' };
  const [sfx, numero, cycle, date, ouvertePar, ouvCompte, ouvPrevu,
    fermPrevu, fermCompte, dClos, sealSeq, seal, valideurs, note] = c.m;
  const mid = String(sfx).charAt(0) === '=' ? String(sfx).slice(1) : c.a + sfx;
  if (avec.meetings.some(x => x.id === mid)) return { error: `La réunion n°${numero} est déjà dans ce cahier` };
  const tete = avec.tx.length ? avec.tx[avec.tx.length - 1].hash : 'GENESE:' + avec.id;
  if (c.p0 !== tete) return { error: `Il manque une réunion avant la n°${numero} : demandez le fichier au groupe.` };
  /* Le rang entre dans le sceau : si les deux cahiers ne comptent pas le même nombre
     d'écritures, les empreintes recalculées ne tomberaient pas et l'erreur serait illisible.
     Mieux vaut le dire ici, en clair. */
  if (Number(c.s0) !== avec.tx.length + 1) return { error: 'Ce cahier ne compte pas les mêmes écritures que celui du groupe : demandez le fichier.' };
  const nTx = avec.tx.length, nM = avec.meetings.length;
  /* On REFAIT la chaîne au lieu de la recopier : chaque empreinte est recalculée ici, puis
     verifyDepuis la revérifie et la compare au sceau. Un seul chiffre abîmé en route, et tout
     est refusé — c'est exactement la garantie qu'on avait en transportant les empreintes,
     sans transporter ce qui se démontre. */
  const nb = v => v === '' || v == null ? 0 : Number(v);
  const base = Number(date);
  let prev = tete;
  const ajout = [];
  for (let i = 0; i < c.t.length; i++) {
    const p = String(c.t[i]).split('|');
    if (p.length < 12) return { error: 'Cette image est abîmée : une écriture est incomplète' };
    const t = { id: p[0], avecId: avec.id, meetingId: mid, type: p[1], memberId: p[2] || null,
      amount: nb(p[3]), by: p[9] || null, ts: base + nb(p[10]), cycle: nb(p[11]) || 1,
      seq: nTx + i + 1, prev, synced: true };
    if (p[4] !== '') t.parts = nb(p[4]);
    if (p[5] !== '') t.months = nb(p[5]);
    if (p[6] !== '') t.rate = nb(p[6]);
    if (p[7] !== '') t.ref = qrDesech(p[7]);
    if (p[8] !== '') t.note = qrDesech(p[8]);
    t.hash = sha256(payload(t));
    prev = t.hash;
    ajout.push(t);
  }
  const reunion = { id: mid, n: Number(numero), cycle: nb(cycle), date: base, status: 'closed',
    presence: c.pr || {}, openedBy: ouvertePar || null,
    openCount: nb(ouvCompte), openExpected: nb(ouvPrevu),
    closeExpected: nb(fermPrevu), closeCount: nb(fermCompte), closedAt: base + nb(dClos),
    validators: String(valideurs || '').split('|').filter(Boolean),
    sealSeq: nb(sealSeq), seal, synced: true };
  if (note) reunion.note = qrDesech(note);
  avec.tx.push(...ajout);
  avec.meetings.push(reunion);
  const v = verifyDepuis(avec, nTx);
  if (!v.ok) { avec.tx.length = nTx; avec.meetings.length = nM; return { error: 'Ces écritures ne tiennent pas dans la chaîne : refusées (' + v.reason + ')' }; }
  if (typeof _chain === 'object') delete _chain[avec.id];
  /* Un groupe qui a tenu et scellé une réunion a forcément été validé : son téléphone ne le
     lui aurait pas permis sinon. La copie de l'animateur l'apprend ici, sinon elle continue
     d'afficher « À valider » et invite l'organisation à valider une deuxième fois. */
  if (avec.status === 'pending' && reunion.status === 'closed') { avec.status = 'active'; avec.validatedAt = avec.validatedAt || Date.now(); }
  DB.save();
  /* « reunion » est ce qui dit à l'écran d'appel qu'il s'agit d'un prolongement et non d'un
     groupe qui arrive : sans lui, l'animateur était envoyé sur l'écran des membres du groupe. */
  return { id: avec.id, name: avec.name, reunion: reunion.n, ecritures: ajout.length };
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
    /* Deux images se disent « visez la suivante ». Dix-sept images se comptent : le secrétaire
       doit savoir où il en est, et lesquelles lui manquent encore — l'écran d'en face tourne
       en boucle, celles qu'il a ratées reviendront. */
    if (qrSac.n <= 3) return { attente: `Image ${p.i} lue. Visez maintenant l'image ${manque[0]} sur ${qrSac.n}.`, pris, total: qrSac.n };
    const liste = manque.slice(0, 6).join(', ') + (manque.length > 6 ? '…' : '');
    return { attente: `${pris} image${pris > 1 ? 's' : ''} sur ${qrSac.n} · il manque ${manque.length > 1 ? 'les n°' : 'la n°'} ${liste}`, pris, total: qrSac.n };
  }
  let t = '';
  for (let i = 1; i <= qrSac.n; i++) t += qrSac.bouts[i];
  qrSac = null;
  return { texte: t };
}
const qrScanDispo = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

/* Cet écran reçoit trois choses : une AVEC neuve, un cahier entier, et une réunion renvoyée
   par un groupe. Les textes ne parlaient que de la première — « Ouvrir l'AVEC », « demandez le
   fichier à l'animatrice » —, et l'animateur qui venait chercher une séance croyait s'être
   trompé d'écran. On dit donc ce que l'écran fait, sans supposer qui est en face. */
ACT.qrRecevoir = () => {
  App.openSheet(`<h2>Recevoir par photo</h2>
    <p class="muted">Une AVEC neuve, un cahier entier, ou une réunion renvoyée par un groupe : visez l'image montrée en face, puis tapez les huit signes qu'on vous dit.</p>
    ${qrScanDispo()
      ? '<div class="scanbox"><video id="qrVid" playsinline muted></video></div>'
      : '<div class="alert warn">' + icSpan('alert') + '<div><b>Cet appareil ne lit pas les images</b><span class="small">Demandez le fichier à la place : « Recevoir une AVEC ».</span></div></div>'}
    <div id="qrEtat" class="hint" aria-live="polite">Visez l'image. S'il y en a plusieurs, restez en face : elles défilent.</div>
    <div class="field"><label for="qrC">Code de 8 signes</label><input id="qrC" class="input bignum" maxlength="40" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase" placeholder="ABCDEFGH"></div>
    <button class="btn primary block xl" data-act="qrOuvrir">${ic('check')} Ouvrir</button>
    <button class="btn ghost block" data-act="qrStop">Fermer</button>`);
  /* un lot resté à moitié lu d'une fois précédente ne doit pas se mélanger à celui-ci */
  qrVu = null; qrSac = null;
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
  if (!qrVu) return App.toast(qrSac ? `Il manque encore des images : ${Object.keys(qrSac.bouts).length} sur ${qrSac.n} lues` : 'Visez d\'abord l\'image montrée en face');
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
  /* Un cahier entier arrive par images comme il arriverait par fichier : c'est le MÊME
     contenu, découpé en morceaux. On le remet donc à la même fonction, celle qui vérifie la
     chaîne, la licence et la provenance — rien de nouveau n'est inventé sur le chemin de
     l'argent. */
  if (box && box.app === 'kitabu-transfert') {
    const r = await importTransfer(texte, code);
    if (!r.error) { rememberAvec(r.id); App.go('l.member', { id: r.id }); }
    return r;
  }
  /* L'ancienne version envoyait les réunions dans un format plus lourd. Un téléphone pas
     encore mis à jour montre donc des images que celui-ci ne sait plus lire : il faut le dire
     en nommant le remède, sinon le message « ce n'est pas une AVEC Akiba » envoie chercher
     une panne qui n'existe pas. */
  if (box && box.a === 'kitabu-qr-r') return { error: 'Ce téléphone envoie une ancienne version d\'Akiba : mettez-le à jour, ou demandez le fichier de la réunion.' };
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
  /* Exactement ce que fait importTransfer : l'image apporte la licence de celui qui montre, et
     le téléphone du groupe la garde en mode « AVEC reçue » — il tient les réunions de cette
     AVEC, sans pouvoir en créer d'autres. */
  if (licenceRequired() && !(App.licence && App.licence.ok)) {
    const res = await verifyLicence(c.li);
    if (!res.ok) return { error: 'Ce téléphone n\'a pas de licence, et l\'image n\'en apporte pas de valable. Demandez un code de validation à Ubora.' };
    if (blockedWhy(res.data.id)) return { error: blockedWhy(res.data.id) };
    licSet(c.li); lsSet(LIMITED_STORE, res.data.id);
    App.licence = await resolveLicence();
    if (!App.licence.ok) return { error: App.licence.why || 'Licence refusée' };
  }
  /* On quitte la démonstration, comme le fait déjà la réception par fichier. Sans cela, le
     cahier arrive dans un téléphone encore plein de faux groupes : la couverture continue de
     montrer la démonstration, et le vrai cahier du groupe reste introuvable. */
  if (K.data.mode !== 'prod') wipeTo(emptyData());

  const sep = '|';
  const members = c.me.map(l => {
    const [id, name, sex, role, key, pin, ne, tel, act, dts] = String(l).split(sep);
    return { id, name, sex: sex || 'F', phone: tel || '—', pin, joined: c.cr || Date.now(), birthYear: null,
      birthDate: ne || '', photo: '', activity: act || '', address: '', role: role || 'membre', key: key === '1',
      _ts: dts === undefined || dts === '' ? null : (c.cr || 0) + Number(dts) };
  });
  const [signe, teinte] = String(c.em || '').split(sep);
  const avec = {
    id: c.id, name: c.n, village: c.vi, territoire: c.te || '—', province: c.pr,
    entite: c.en || '', secteur: c.se || '', groupement: c.gr || '',
    orgId: c.or || null, animId: c.an || null,
    embleme: Object.assign({}, EMB_DEFAUT, { signe, teinte }),
    createdAt: c.cr || Date.now(), cycle: { n: c.cy.n, start: c.cy.d, end: c.cy.f }, cycles: [],
    settings: Object.assign({}, c.re), members, meetings: [], tx: [], visits: [], lastSync: 0,
    status: c.st || 'active', requestCode: c.rq || '', submittedAt: c.cr || Date.now(),
    rescue: (c.sc || []).map(x => ({ h: String(x).replace(/\*$/, ''), used: /\*$/.test(String(x)) })), security: []
  };
  secLog(avec, 'AVEC reçue par image', null, 'montrée par ' + (c.an ? 'l\'animateur' : 'l\'organisation'));
  /* les fondateurs entrent dans le journal de CE téléphone : la liste du premier jour est
     couverte par le sceau, comme pour une AVEC créée ici */
  members.forEach(m => appendTx(avec, { type: 'MEMBRE', amount: 0, memberId: m.id, by: null, ts: m._ts || Date.now(),
    note: 'Membre fondateur · ' + m.name + (m.role !== 'membre' ? ' · ' + ROLES[m.role] : '') }));
  members.forEach(m => { delete m._ts; });        // l'heure a servi au sceau : elle ne reste pas dans la fiche
  if (deja) K.data.avecs = K.data.avecs.filter(a => a.id !== deja.id);
  /* l'organisation et l'animateur arrivent avec le groupe, comme dans le fichier : c'est le
     secret de l'organisation qui permettra de reconnaître le code d'activation dicté au
     téléphone, et son nom qui s'affiche sur le cahier */
  if (c.og) {
    const [oid, onom, osec] = String(c.og).split(sep);
    if (oid && !(K.data.orgs || []).some(o => o.id === oid)) (K.data.orgs = K.data.orgs || []).push({ id: oid, name: onom, secret: osec, rescue: [] });
  }
  if (c.us) {
    const [uid, urole, uorg, unom, uzone] = String(c.us).split(sep);
    if (uid && !(K.data.users || []).some(u => u.id === uid)) (K.data.users = K.data.users || []).push({ id: uid, role: urole, orgId: uorg, name: unom, zone: uzone, pin: null, remote: true });
  }
  K.data.avecs.push(avec);
  DB.save();
  return { id: avec.id, name: avec.name };
}
