/* Akiba — les petits sons de l'application.

   Pourquoi des sons : une réunion se tient dehors, à vingt personnes, le téléphone passe de main
   en main. La trésorière qui saisit une épargne ne regarde pas toujours l'écran au bon moment, et
   le message qui s'affiche trois secondes disparaît sans qu'on l'ait lu. Un son court dit la même
   chose à tout le monde autour, y compris à qui ne sait pas lire : c'est entré, ou c'est refusé.

   Pourquoi synthétisés et non enregistrés : pas un octet à télécharger, rien à mettre en cache,
   rien à garder à jour. Quatre oscillateurs et une enveloppe donnent des sons nets même sur le
   petit haut-parleur d'un téléphone à cinquante dollars, là où un fichier compressé bave.

   Les règles qu'on se donne :
   — jamais plus de 300 ms, jamais fort : on accompagne, on ne sursaute pas ;
   — le son d'erreur descend, celui de réussite monte : la direction se comprend sans apprendre ;
   — le réglage est rangé à côté de la langue, et il se coupe entièrement ;
   — un téléphone muet ou qui refuse l'audio ne doit jamais faire échouer une écriture. */
'use strict';

ICONS.bell = '<path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 18h15z"/><path d="M10 21h4"/>';
ICONS.bellOff = '<path d="M18 15.5V10a6 6 0 0 0-8.4-5.5M6 8.6V10v5.5L4.5 18h12"/><path d="M10 21h4"/><path d="M3.5 3.5l17 17"/>';

const SON_STORE = 'kitabu.son';
const sonActif = () => { try { return localStorage.getItem(SON_STORE) !== '0'; } catch (e) { return true; } };
const sonActifSet = v => { try { localStorage.setItem(SON_STORE, v ? '1' : '0'); } catch (e) { /* le choix vaut pour cette session */ } };

/* Les timbres. [fréquence Hz, départ s, durée s, volume] — lus comme une petite partition. */
const SONS = {
  ok: [[880, 0, .07, .16], [1318.5, .06, .11, .14]],                 /* deux notes qui montent : c'est entré */
  erreur: [[400, 0, .1, .17], [260, .09, .17, .15]],                 /* deux notes qui descendent : refusé */
  alerte: [[760, 0, .1, .16], [760, .16, .1, .16]],                  /* deux coups égaux : regarde l'écran */
  touche: [[1100, 0, .035, .07]],                                    /* une pointe sèche : le chiffre est pris */
  scelle: [[523.3, 0, .08, .13], [659.3, .07, .08, .13], [784, .14, .16, .15]], /* trois notes : l'écriture est scellée */
};

let _ctx = null;
function sonContexte() {
  if (_ctx) return _ctx;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  try { _ctx = new C(); } catch (e) { return null; }
  return _ctx;
}
/* Android ne laisse pas un site faire du bruit avant le premier toucher : on réveille le son
   au premier geste de l'utilisateur, une seule fois, et sans rien jouer. */
let _touche = false;   /* le navigateur refuse le son ET la vibration avant le premier toucher */
function sonReveiller() {
  _touche = true;
  const c = sonContexte();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}
document.addEventListener('pointerdown', sonReveiller, { once: true, passive: true });
document.addEventListener('keydown', sonReveiller, { once: true });

function jouerSon(nom) {
  if (!sonActif()) return;
  const notes = SONS[nom];
  if (!notes) return;
  const c = sonContexte();
  if (!c) return;
  try {
    if (c.state === 'suspended') c.resume().catch(() => {});
    const t0 = c.currentTime;
    notes.forEach(([f, d, duree, vol]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, t0 + d);
      /* une enveloppe douce : sans elle, le début et la fin claquent sur un petit haut-parleur */
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(vol, t0 + d + .012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + duree);
      o.connect(g); g.connect(c.destination);
      o.start(t0 + d); o.stop(t0 + d + duree + .02);
    });
  } catch (e) { /* le son n'est jamais indispensable : on continue sans */ }
}
/* le téléphone vibre aussi quand il sait le faire : dehors, en plein marché, on sent mieux qu'on n'entend */
function vibrer(motif) {
  if (!_touche || !sonActif() || !navigator.vibrate) return;
  try { navigator.vibrate(motif); } catch (e) { /* refusé par le téléphone */ }
}

/* Ce que l'application appelle. Un message qui annonce un refus doit sonner comme un refus :
   on le reconnaît à ses mots, pour ne pas avoir à reprendre un par un les deux cents appels
   à App.toast déjà écrits. */
const MOTS_ERREUR = /(impossible|incorrect|refus|erreur|pas de |ne peut|doit |réservé|déjà|manque|trop |vide|pleine|échou|introuvable|écrivez|choisissez)/i;
const MOTS_ALERTE = /(attention|vérifi|écart|retard|alerte|expir)/i;
function sonDuMessage(msg) {
  const m = String(msg || '');
  if (MOTS_ERREUR.test(m)) return 'erreur';
  if (MOTS_ALERTE.test(m)) return 'alerte';
  return 'ok';
}

/* ---------- le réglage, rangé à côté de la langue ---------- */
ACT.sonSheet = () => {
  const on = sonActif();
  const ligne = (v, titre, sous) => `<button class="li" data-act="sonRegler" data-v="${v ? '1' : '0'}"><span class="xl-ic">${ic(v ? 'bell' : 'bellOff')}</span>
    <span class="grow"><b>${titre}</b><span class="small muted">${sous}</span></span>${on === v ? '<span class="chip brand">Choisi</span>' : ic('chev')}</button>`;
  App.openSheet(`<h2>Sons</h2>
    <p class="muted">Un son court accompagne chaque écriture : une note qui monte quand c'est enregistré,
      une note qui descend quand c'est refusé. Tout le monde autour l'entend, même sans lire l'écran.</p>
    <div class="list">
      ${ligne(true, 'Sons activés', 'Avec une courte vibration quand le téléphone sait le faire')}
      ${ligne(false, 'Sans aucun son', 'L’écran continue d’afficher les messages')}
    </div>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      ${[['ok', 'Enregistré'], ['erreur', 'Refusé'], ['alerte', 'À vérifier'], ['scelle', 'Écriture scellée']]
      .map(([k, n]) => `<button class="btn sm ghost" data-act="sonEssai" data-n="${k}">${esc(n)}</button>`).join('')}
    </div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.sonRegler = d => {
  sonActifSet(d.v === '1');
  if (d.v === '1') { jouerSon('ok'); vibrer(18); }
  App.sheet = null; render();
  App.toast(d.v === '1' ? 'Sons activés' : 'Sons coupés');
};
ACT.sonEssai = d => { const avant = sonActif(); sonActifSet(true); jouerSon(d.n); sonActifSet(avant); };
