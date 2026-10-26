/* Akiba — la photo d'un membre : facultative, légère, et jamais imposée.

   Pourquoi : dans un groupe de trente-cinq personnes, deux homonymes ne sont pas rares, et
   la carte de membre sert à prouver qui l'on est devant le bureau. Une photo tranche la
   question tout de suite, y compris pour quelqu'un qui lit mal.

   Pourquoi facultative, vraiment : une photo est une donnée personnelle. On la prend avec
   l'accord de la personne, et elle s'efface en un geste. Un membre qui refuse garde ses
   initiales — rien d'autre ne change pour lui.

   Pourquoi si petite : le téléphone du groupe garde tout dans sa mémoire locale, qui tient
   dans quelques méga-octets, et les données voyagent dans un fichier envoyé à l'animateur.
   On réduit donc chaque photo à un carré de 160 points, en noir sur blanc de qualité moyenne :
   une dizaine de kilo-octets, assez pour reconnaître un visage, assez léger pour trente-cinq
   membres. Au-delà de PHOTO_MAX, on refuse plutôt que de remplir la mémoire en silence. */
'use strict';

const PHOTO_PX = 160;          /* le côté du carré gardé */
const PHOTO_MAX = 24 * 1024;   /* le poids qu'une photo ne doit pas dépasser */

const photoDe = m => (m && typeof m.photo === 'string' && m.photo.indexOf('data:image') === 0 ? m.photo : null);

/* réduire au carré : on recadre au centre, puis on compresse jusqu'à tenir dans PHOTO_MAX */
function photoReduire(fichier) {
  return new Promise((ok, non) => {
    if (!fichier || fichier.size > 12 * 1024 * 1024) return non(new Error('trop lourd'));
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const cote = Math.min(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = c.height = PHOTO_PX;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, PHOTO_PX, PHOTO_PX);
      g.drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, PHOTO_PX, PHOTO_PX);
      let q = 0.7, url2 = c.toDataURL('image/jpeg', q);
      while (url2.length > PHOTO_MAX && q > 0.3) { q -= 0.1; url2 = c.toDataURL('image/jpeg', q); }
      url2.length > PHOTO_MAX ? non(new Error('trop lourd')) : ok(url2);
    };
    img.onerror = () => { URL.revokeObjectURL(url); non(new Error('illisible')); };
    img.src = url;
  });
}

/* ---------- dans la fiche membre : un carré, un bouton, rien de plus ---------- */
/* La photo en cours de saisie vit à part : la fiche ne se redessine pas pendant qu'on y tape,
   sinon le nom déjà écrit disparaîtrait. undefined = on n'y touche pas, null = on efface. */
App.photoTmp = App.photoTmp || {};

function photoChamp(p, m) {
  const vue = photoDe(m);
  return `<div class="field"><span class="flabel">Photo <span class="opt">facultatif</span></span>
    <div class="photoline">
      <span class="photovue" id="${p}PhV">${vue ? `<img src="${vue}" alt="">` : `<b>${esc(initials(m.name || '?'))}</b>`}</span>
      <div class="stack" style="gap:6px;flex:1;min-width:0">
        <button type="button" class="btn ghost" data-act="photoPrendre" data-p="${p}">${ic('user')} ${vue ? 'Changer la photo' : 'Prendre la photo'}</button>
        <button type="button" class="linkbtn" data-act="photoEffacer" data-p="${p}" id="${p}PhX" ${vue ? '' : 'hidden'}>Retirer la photo</button>
        <span class="hint" style="margin:0">Demandez son accord. Elle sert à reconnaître la personne sur sa carte.</span>
      </div>
    </div>
    <input type="file" id="${p}PhF" accept="image/*" capture="user" hidden data-in="photoFichier" data-p="${p}"></div>`;
}
ACT.photoPrendre = d => { const el = document.getElementById(d.p + 'PhF'); if (el) { el.value = ''; el.click(); } };
ACT.photoEffacer = d => {
  App.photoTmp[d.p] = null;
  const v = document.getElementById(d.p + 'PhV'), x = document.getElementById(d.p + 'PhX');
  if (v) v.innerHTML = '<b>?</b>';
  if (x) x.hidden = true;
  App.toast('Photo retirée');
};
INP.photoFichier = el => {
  const p = el.dataset.p, f = el.files && el.files[0];
  if (!f) return;
  App.toast('Photo en cours…');
  photoReduire(f).then(url => {
    App.photoTmp[p] = url;
    const v = document.getElementById(p + 'PhV'), x = document.getElementById(p + 'PhX');
    if (v) v.innerHTML = '<img src="' + url + '" alt="">';
    if (x) x.hidden = false;
    App.toast('Photo prise');
  }).catch(() => App.toast('Photo impossible à lire. Reprenez-la de plus près.'));
};
/* ce que la fiche doit enregistrer : rien, une photo, ou son effacement */
function photoLue(p) { return App.photoTmp[p]; }
function photoOublier(p) { delete App.photoTmp[p]; }
