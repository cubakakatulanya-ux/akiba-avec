/* Akiba — l'emblème du groupe : un signe et une couleur, choisis à la création.

   Ce n'est pas une décoration. Dans un groupe où plusieurs membres lisent mal, un nom écrit sur
   un écran ne dit rien ; un arbre jaune, si. L'emblème permet de reconnaître « notre groupe »
   d'un coup d'œil — sur l'accueil du téléphone, sur sa carte de membre, en haut de son carnet.

   Pourquoi un signe et pas une photo : une photo pèse des centaines de kilo-octets dans un
   téléphone qui n'a pas de place, voyage mal dans un fichier de transfert, et s'imprime en gris
   sale sur une bande thermique. Un signe dessiné ne pèse rien, se transmet en deux mots, et
   s'imprime net. */
'use strict';

/* des signes du village, pas des symboles de banque */
const EMBLEMES = {
  arbre: { nom: 'Arbre', d: '<path d="M12 21v-7"/><path d="M12 18l-3.2-2.4M12 16.6l3-2.2"/><path d="M12 14.4c-3.7 0-6-2.3-6-5.2S8.3 3.5 12 3.5s6 2.8 6 5.7-2.3 5.2-6 5.2z"/>' },
  epi: { nom: 'Épi', d: '<path d="M12 21V8"/><path d="M12 8c0-2.5 1.6-4.5 4-5 .4 2.6-1.1 4.6-4 5z"/><path d="M12 8c0-2.5-1.6-4.5-4-5-.4 2.6 1.1 4.6 4 5z"/><path d="M12 14c0-2.3 1.5-4 3.6-4.4.4 2.4-1 4.2-3.6 4.4z"/><path d="M12 14c0-2.3-1.5-4-3.6-4.4-.4 2.4 1 4.2 3.6 4.4z"/>' },
  soleil: { nom: 'Soleil', d: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>' },
  main: { nom: 'Main', d: '<path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V12"/><path d="M15 12V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.7 7-6.5 7S5 18.5 5 14.5V11a1.5 1.5 0 0 1 3 0v2"/>' },
  maison: { nom: 'Maison', d: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
  chevre: { nom: 'Chèvre', d: '<path d="M7 8c-1.5-1-2.5-3-2-5 2 .3 3.4 1.7 4 3.5"/><path d="M17 8c1.5-1 2.5-3 2-5-2 .3-3.4 1.7-4 3.5"/><path d="M6 9.5C6 7.6 8.7 6 12 6s6 1.6 6 3.5c0 3-1.6 5.5-2.5 7.5-.6 1.3-1.5 2-3.5 2s-2.9-.7-3.5-2C7.6 15 6 12.5 6 9.5z"/><circle cx="10" cy="11" r=".7"/><circle cx="14" cy="11" r=".7"/>' },
  eau: { nom: 'Eau', d: '<path d="M12 3c3.5 4.2 6 7.3 6 10.2A6 6 0 0 1 6 13.2C6 10.3 8.5 7.2 12 3z"/>' },
  panier: { nom: 'Panier', d: '<path d="M4 9h16l-1.6 10.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M8 9l2-5M16 9l-2-5"/>' },
  poisson: { nom: 'Poisson', d: '<path d="M3 12c3-4 6.5-6 10-6s6.5 2 8 6c-1.5 4-4.5 6-8 6s-7-2-10-6z"/><circle cx="8.5" cy="12" r=".9"/><path d="M21 12c-1 1.3-1.5 2.6-1.5 4"/>' },
  etoile: { nom: 'Étoile', d: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 20l1.1-6L3.4 9.8l6-.8z"/>' },
  houe: { nom: 'Houe', d: '<path d="M6 21L16 7"/><path d="M14 4.5c2.5-1.3 5 .3 5.5 3 .4 2.3-1 4.3-3.3 4.8"/>' },
  colline: { nom: 'Colline', d: '<path d="M2 19l6-8 4 5 3-3.5 7 6.5z"/><circle cx="17" cy="6.5" r="2.5"/>' },
};
const TEINTES = {
  vert: { nom: 'Vert', fond: '#1F6E53', trait: '#EAF4EE' },
  jaune: { nom: 'Jaune', fond: '#D9A313', trait: '#231A00' },
  terre: { nom: 'Terre', fond: '#9A5B2E', trait: '#FBEFE4' },
  ciel: { nom: 'Ciel', fond: '#2A6E96', trait: '#EAF3F8' },
  grenat: { nom: 'Grenat', fond: '#8E3B44', trait: '#FBECED' },
  nuit: { nom: 'Nuit', fond: '#2D3A52', trait: '#E9EEF7' },
};
const EMB_DEFAUT = { signe: 'arbre', teinte: 'vert' };
const emblemeDe = avec => {
  const e = (avec && avec.embleme) || {};
  return { signe: EMBLEMES[e.signe] ? e.signe : EMB_DEFAUT.signe, teinte: TEINTES[e.teinte] ? e.teinte : EMB_DEFAUT.teinte };
};

/* le badge, dessiné : taille libre, aucune image à charger */
function emblemeHtml(avec, taille = 40) {
  const e = emblemeDe(avec), t = TEINTES[e.teinte];
  return `<span class="embleme" style="width:${taille}px;height:${taille}px;background:${t.fond};color:${t.trait}" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${Math.round(taille * 0.58)}px;height:${Math.round(taille * 0.58)}px">${EMBLEMES[e.signe].d}</svg></span>`;
}
/* la même chose en noir et blanc, pour la carte de membre imprimée */
function emblemeImprime(avec, taille = 26) {
  const e = emblemeDe(avec);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${taille}px;height:${taille}px;flex:none">${EMBLEMES[e.signe].d}</svg>`;
}

/* ---------- le choix, à la création et après ---------- */
function emblemeChoix(cible, sel) {
  const e = sel || EMB_DEFAUT;
  const t = TEINTES[e.teinte] || TEINTES.vert;
  return `<div class="stack">
    <div class="embgrille">${Object.entries(EMBLEMES).map(([id, s]) => `<button type="button" class="embcase${e.signe === id ? ' on' : ''}" data-act="${cible}" data-signe="${id}" aria-label="${esc(s.nom)}" style="${e.signe === id ? `background:${t.fond};color:${t.trait}` : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${s.d}</svg></button>`).join('')}</div>
    <div class="embteintes">${Object.entries(TEINTES).map(([id, c]) => `<button type="button" class="embteinte${e.teinte === id ? ' on' : ''}" data-act="${cible}" data-teinte="${id}" aria-label="${esc(c.nom)}" style="background:${c.fond}"></button>`).join('')}</div>
  </div>`;
}
/* à la création : le choix vit dans le brouillon */
ACT.cEmbleme = d => {
  const b = App.cdraft;
  b.g.embleme = Object.assign({}, EMB_DEFAUT, b.g.embleme || {});
  if (d.signe) b.g.embleme.signe = d.signe;
  if (d.teinte) b.g.embleme.teinte = d.teinte;
  render();
};
/* après coup : dans « Plus », le bureau peut le changer */
function emblemeSheetHtml(e) {
  return `<h2>Le signe du groupe</h2>
    <p class="muted">Il marque l'accueil du téléphone, le haut des écrans du groupe et les cartes de membre.
      Choisissez un signe que tout le monde reconnaît, même sans savoir lire.</p>
    <div class="row" style="justify-content:center">${emblemeHtml({ embleme: e }, 64)}</div>
    ${emblemeChoix('emblemeChoisir', e)}
    <button class="btn primary block xl" data-act="emblemeSave">${ic('check')} Garder ce signe</button>
    <button class="btn ghost block" data-act="closeSheet">Annuler</button>`;
}
ACT.emblemeSheet = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  App.embleme = emblemeDe(avec);
  App.openSheet(emblemeSheetHtml(App.embleme));
};
ACT.emblemeChoisir = d => {
  App.embleme = App.embleme || Object.assign({}, EMB_DEFAUT);
  if (d.signe) App.embleme.signe = d.signe;
  if (d.teinte) App.embleme.teinte = d.teinte;
  App.sheet = emblemeSheetHtml(App.embleme);
  render();
};
ACT.emblemeSave = () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  avec.embleme = Object.assign({}, App.embleme || EMB_DEFAUT);
  secLog(avec, 'Signe du groupe changé', null, EMBLEMES[avec.embleme.signe].nom + ' · ' + TEINTES[avec.embleme.teinte].nom + ' · par ' + me.name);
  DB.save(); App.closeSheet(); render();
  App.toast('Signe gardé : ' + EMBLEMES[avec.embleme.signe].nom);
};
