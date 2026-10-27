/* Akiba — guide audio : le téléphone lit à voix haute, sans internet, avec la voix installée dessus.

   Trois soins particuliers, parce qu'ils décident si la lecture est utile ou pénible :

   1. Les voix arrivent en retard. Android et Chrome remplissent la liste des voix après coup :
      demandée trop tôt, elle est vide, et la lecture part sur la voix par défaut du système.
      On l'attend, une fois, puis on la garde.

   2. Une langue sans voix ne doit pas tomber sur le français. Aucun téléphone n'a de voix
      lingála, kikongo ou tshiluba. Mais ces langues ont les cinq voyelles pures — a, e, i, o, u —
      comme le kiswahili, l'espagnol et l'italien, et rien à voir avec les voyelles nasales et les
      lettres muettes du français. Une voix espagnole lit « mbongo ebombami » bien plus près du
      vrai qu'une voix française. On cherche donc, dans l'ordre : la langue elle-même, le
      kiswahili, l'espagnol, l'italien, et le français en dernier recours.

   3. Ce qui est écrit pour l'œil se lit mal à voix haute. « 256 100 FC » devient deux nombres et
      deux lettres ; « n°15 » devient « n degré 15 ». On réécrit le texte avant de le dire. */
'use strict';

ICONS.volume = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>';
const Voice = { playing: null, voix: null, garde: null };
const voiceOk = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

/* ---------- la liste des voix, attendue une seule fois ---------- */
function voixDisponibles() {
  if (Voice.voix && Voice.voix.length) return Promise.resolve(Voice.voix);
  return new Promise(ok => {
    const s = window.speechSynthesis;
    const prises = s.getVoices() || [];
    if (prises.length) { Voice.voix = prises; return ok(prises); }
    let fini = false;
    const rendre = () => { if (fini) return; fini = true; Voice.voix = s.getVoices() || []; ok(Voice.voix); };
    try { s.addEventListener('voiceschanged', rendre, { once: true }); } catch (e) { s.onvoiceschanged = rendre; }
    setTimeout(rendre, 1500);                      // un téléphone sans voix ne doit pas bloquer le bouton
  });
}

/* ---------- choisir la voix la plus juste pour la langue lue ---------- */
const VOIX_PREF = {
  fr: ['fr'],
  ln: ['ln', 'sw', 'es', 'it', 'pt', 'fr'],
  sw: ['sw', 'es', 'it', 'pt', 'fr'],
  kg: ['kg', 'sw', 'es', 'it', 'pt', 'fr'],
  lua: ['lua', 'sw', 'es', 'it', 'pt', 'fr'],
};
/* Une voix choisie à la main l'emporte sur tout : c'est l'oreille de l'utilisateur qui juge. */
const VOIX_STORE = l => 'kitabu.voix.' + l;
const voixChoisie = l => { try { return localStorage.getItem(VOIX_STORE(l)) || ''; } catch (e) { return ''; } };
const voixRetenir = (l, nom) => { try { nom ? localStorage.setItem(VOIX_STORE(l), nom) : localStorage.removeItem(VOIX_STORE(l)); } catch (e) { /* rien */ } };
/* « Naturelle » : les voix de synthèse récentes se reconnaissent à leur nom, et les voix
   distantes de Google sont nettement plus humaines que celles embarquées. On les préfère
   quand il y a du réseau — jamais au point d'en dépendre : sans réseau, seule une voix
   embarquée parle, et elle repasse devant. */
const NATUREL = /neural|natural|wavenet|studio|premium|enhanced|google/i;
/* Les voix mécaniques des téléphones bon marché se reconnaissent aussi à leur nom : eSpeak et
   Pico sont les moteurs d'origine d'Android, ceux qui donnent la voix de robot. Les repérer sert
   à prévenir l'utilisateur qu'une voix bien plus humaine s'installe gratuitement en deux minutes. */
const MECANIQUE = /espeak|pico|svox|robot/i;
const voixNaturelle = v => !!v && NATUREL.test(v.name || '') && !MECANIQUE.test(v.name || '');
function noteVoix(v, enLigne) {
  let n = 0;
  if (NATUREL.test(v.name || '')) n += 4;
  if (v.localService) n += enLigne ? 1 : 6;
  if (v.default) n += 1;
  return n;
}
function choisirVoix(voix, langue) {
  const prefere = voixChoisie(langue);
  if (prefere) { const v = voix.find(x => x.name === prefere); if (v) return v; }
  const enLigne = navigator.onLine !== false;
  const ordre = VOIX_PREF[langue] || VOIX_PREF.fr;
  for (const pref of ordre) {
    const candidates = voix.filter(v => v.lang && v.lang.toLowerCase().replace(/_/g, '-').startsWith(pref));
    const trouve = candidates.sort((a, b) => noteVoix(b, enLigne) - noteVoix(a, enLigne))[0];
    if (trouve) return trouve;
  }
  return voix.find(v => v.default) || voix[0] || null;
}

/* ---------- réécrire le texte pour l'oreille ---------- */
const MOIS_VOIX = { '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril', '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août', '09': 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre' };
function texteALire(brut, langue) {
  let t = String(brut || '');
  t = t.replace(/[›»«⌫✓→←⋮·—–|]/g, ', ');                       // signes qui ne se disent pas
  t = t.replace(/(\d)[  \s](?=\d{3}\b)/g, '$1');        // 256 100 → 256100, lu comme un seul nombre
  t = t.replace(/(\d{4})-(\d{2})-(\d{2})/g, (m, a, mo, j) => +j + ' ' + (MOIS_VOIX[mo] || '') + ' ' + a);
  t = t.replace(/\bn°\s*/gi, 'numéro ');
  t = t.replace(/(\d)\s*%/g, '$1 pour cent');
  if (langue === 'fr') {
    t = t.replace(/\bFC\b/g, 'francs congolais');
    t = t.replace(/\bPAR\b/g, 'portefeuille à risque');
    t = t.replace(/\bIMF\b/g, 'institution de microfinance');
    t = t.replace(/\bQR\b/g, 'qu-ère');
  } else {
    t = t.replace(/\bFC\b/g, 'franc');                            // une voix non française épelle mal le reste
  }
  /* On garde les retours à la ligne : pour l'oreille ils marquent une fin de phrase, et morceaux()
     en fait un silence. Les écraser ici, comme on le faisait, collait un titre ou une ligne de liste
     au texte suivant — et c'est cela, bien plus que le timbre, qui s'entend comme une voix de robot. */
  t = t.replace(/\.{2,}/g, '.').replace(/,\s*,+/g, ',').replace(/[^\S\r\n]+/g, ' ').replace(/ ?[\r\n]+ ?/g, '\n').trim();
  return t;
}
/* Un morceau qui ne finit pas par un point s'enchaîne au suivant sans respirer : les titres et
   les lignes de liste sortaient collés, d'une seule traite, et c'est surtout cela qui faisait
   « robot ». Un point final suffit : tous les moteurs marquent le silence dessus. */
const ponctue = p => (/[.!?;:,]$/.test(p) ? p : p + '.');

/* phrases courtes : Chrome coupe les longues, et une virgule laisse respirer */
function morceaux(t) {
  const sorties = [];
  /* Un retour à la ligne est une fin de phrase : un titre, une ligne de liste, une étape de la
     réunion. Sans cela, trois lignes sortaient collées d'une seule traite, sans reprendre son
     souffle — c'est ce qui s'entend comme une voix de robot, bien avant le timbre lui-même. */
  const phrases = [];
  String(t).split(/[\r\n]+/).forEach(ligne => {
    (ligne.match(/[^.!?;:]+[.!?;:]*/g) || [ligne]).forEach(x => phrases.push(x));
  });
  for (const phrase of phrases) {
    const p = phrase.trim();
    if (!p) continue;
    if (p.length <= 180) { sorties.push(ponctue(p)); continue; }
    let reste = p;
    while (reste.length > 180) {
      let coupe = reste.lastIndexOf(',', 180);
      if (coupe < 60) coupe = reste.lastIndexOf(' ', 180);
      if (coupe < 60) coupe = 180;
      sorties.push(ponctue(reste.slice(0, coupe + 1).trim()));
      reste = reste.slice(coupe + 1);
    }
    if (reste.trim()) sorties.push(ponctue(reste.trim()));
  }
  return sorties;
}

function paintSpeak() {
  document.querySelectorAll('[data-act="speak"]').forEach(b => {
    const on = Voice.playing === b.dataset.id;
    b.classList.toggle('on', on);
    const l = b.querySelector('.lbl');
    if (l) l.textContent = on ? 'Arrêter' : (b.dataset.label || 'Écouter');
  });
}
function arreterVoix() {
  if (voiceOk()) window.speechSynthesis.cancel();
  clearInterval(Voice.garde); Voice.garde = null;
  Voice.playing = null;
}

function debitVoix(v, lang) {
  const naturelle = voixNaturelle(v);
  if (lang === 'fr') return naturelle ? 1 : 0.92;
  return naturelle ? 0.92 : 0.84;
}

async function speakText(text, id, langue) {
  if (!voiceOk()) return App.toast('La lecture à voix haute n\'est pas disponible. Installez « Services vocaux Google » depuis le Play Store.');
  const synth = window.speechSynthesis;
  synth.cancel();
  const lang = langue || (typeof I18N !== 'undefined' && I18N.cur ? I18N.cur() : 'fr');
  const parts = morceaux(texteALire(text, lang));
  if (!parts.length) return;
  Voice.playing = id; paintSpeak();
  const voix = await voixDisponibles();
  if (Voice.playing !== id) return;                               // arrêté pendant l'attente
  const v = choisirVoix(voix, lang);
  if (!voix.length) App.toast('Aucune voix installée sur ce téléphone : ajoutez « Services vocaux Google ».');
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'fr-FR';
    /* Une voix moderne garde son naturel au débit normal ; une voix mécanique devient pénible
       et il faut la ralentir pour qu'elle reste compréhensible. Et une langue lue par une voix
       d'emprunt — le lingála dit par une voix kiswahili — gagne encore à être ralentie. */
    u.rate = debitVoix(v, lang);
    u.pitch = voixNaturelle(v) ? 1 : 1.02;                          // un rien plus haut casse le bourdon des voix mécaniques
    if (i === parts.length - 1) u.onend = () => { if (Voice.playing === id) { arreterVoix(); paintSpeak(); } };
    synth.speak(u);
  });
  /* Chrome s'arrête tout seul au bout d'une quinzaine de secondes : on le relance discrètement */
  clearInterval(Voice.garde);
  Voice.garde = setInterval(() => {
    if (!Voice.playing) { clearInterval(Voice.garde); Voice.garde = null; return; }
    if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); }
  }, 9000);
}

ACT.speak = d => {
  if (Voice.playing === d.id) { arreterVoix(); return paintSpeak(); }
  const text = [...document.querySelectorAll(d.src)].map(n => n.textContent.trim()).filter(Boolean).join('. ');
  if (!text) return App.toast('Rien à lire sur cet écran');
  speakText(text, d.id, d.lang);
};
const speakBtn = (id, src, label = 'Écouter', lang = '') =>
  `<button class="btn sm ghost speak no-tr" data-act="speak" data-id="${id}" data-src="${src}" data-label="${label}" ${lang ? `data-lang="${lang}"` : ''} aria-label="${label} à voix haute">${ic('volume')}<span class="lbl">${label}</span></button>`;

/* la voix s'arrête quand on change d'écran, et quand on quitte l'application */
const _goVoice = App.go.bind(App);
App.go = function (...args) { if (Voice.playing) arreterVoix(); return _goVoice(...args); };
document.addEventListener('visibilitychange', () => { if (document.hidden && Voice.playing) { arreterVoix(); paintSpeak(); } });

/* ---------- choisir sa voix, et l'entendre avant de la garder ----------
   Aucun téléphone n'a de voix lingála, kikongo ni tshiluba : elles n'existent nulle part.
   Mais ces langues ont les cinq voyelles pures du kiswahili, de l'espagnol et de l'italien.
   Une voix kiswahili lit du lingála bien plus près du vrai qu'une voix française — et elle
   s'installe gratuitement depuis les réglages du téléphone. L'écran ci-dessous laisse écouter
   chaque voix installée sur CE téléphone et garder celle qui sonne le mieux. */
const VOIX_ESSAI = {
  fr: 'Argent dans la caisse : 256 100 FC. Ouvrir la réunion numéro 15.',
  ln: 'Mbongo na sanduku : 256 100 FC. Fungola likita ya 15.',
  sw: 'Pesa ndani ya sanduku : 256 100 FC. Fungua mkutano wa 15.',
  kg: 'Mbongo na kesi : 256 100 FC. Zibula lukutakanu ya 15.',
  lua: 'Makuta mu tshisanduku : 256 100 FC.',
};
const LANG_NOM = { fr: 'français', ln: 'lingála', sw: 'kiswahili', kg: 'kikongo', lua: 'tshiluba' };

ACT.voixSheet = async () => {
  const lang = (typeof I18N !== 'undefined' && I18N.cur ? I18N.cur() : 'fr');
  App.openSheet(`<h2>Voix de lecture</h2><p class="muted">Recherche des voix installées…</p>`);
  const voix = await voixDisponibles();
  const choisie = voixChoisie(lang);
  const auto = choisirVoix(voix, lang);
  const ordre = VOIX_PREF[lang] || VOIX_PREF.fr;
  const rang = v => { const l = (v.lang || '').toLowerCase().replace(/_/g, '-'); const i = ordre.findIndex(p => l.startsWith(p)); return i < 0 ? 99 : i; };
  const triees = voix.slice().sort((a, b) => rang(a) - rang(b) || noteVoix(b, navigator.onLine !== false) - noteVoix(a, navigator.onLine !== false));
  const utiles = triees.filter(v => rang(v) < 99);
  const autres = triees.filter(v => rang(v) === 99);
  const ligne = v => `<button class="li" data-act="voixPrendre" data-v="${esc(v.name)}">
    <span class="chk${choisie === v.name ? ' on' : ''}" aria-hidden="true">${choisie === v.name ? ic('check') : ''}</span>
    <span class="grow"><b>${esc(v.name)}</b><span class="small muted">${esc(v.lang)}${v.localService ? ' · sans réseau' : ' · demande du réseau'}${voixNaturelle(v) ? ' · voix naturelle' : MECANIQUE.test(v.name) ? ' · voix mécanique' : ''}${!choisie && auto && auto.name === v.name ? ' · choisie automatiquement' : ''}</span></span>
    <span class="btn sm ghost" data-act="voixEssai" data-v="${esc(v.name)}">${ic('volume')} Écouter</span></button>`;
  App.openSheet(`<h2>Voix de lecture</h2>
    <p class="muted">Langue affichée : <b>${LANG_NOM[lang] || lang}</b>. Touchez « Écouter » pour comparer, puis gardez celle qui sonne le mieux.</p>
    ${!voix.length ? `<div class="alert warn">${icSpan('alert')}<div><b>Aucune voix sur ce téléphone</b><span class="small">Installez « Services vocaux Google » depuis le Play Store, puis revenez.</span></div></div>` : ''}
    ${voix.length && !triees.some(voixNaturelle) ? `<div class="alert warn">${icSpan('alert')}<div><b>Ce téléphone n'a qu'une voix mécanique</b>
      <span class="small">Une voix bien plus humaine s'installe gratuitement, une seule fois, et parle ensuite <b>sans réseau</b> :
      <b>Paramètres › Langues et saisie › Synthèse vocale › Services vocaux Google</b>, puis l'engrenage, puis
      <b>Installer les données vocales</b>. Choisissez la langue, et prenez la voix marquée « haute qualité ».
      Revenez ensuite ici : Akiba la prendra toute seule.</span></div></div>` : ''}
    ${utiles.length ? `<h3 class="surtitre">Convient à cette langue</h3><div class="list">${utiles.map(ligne).join('')}</div>` : ''}
    ${lang !== 'fr' ? `<div class="alert">${icSpan('globe')}<div><b>Pourquoi une voix kiswahili ?</b><span class="small">Aucun téléphone n'a de voix ${LANG_NOM[lang] || lang}. Le kiswahili, l'espagnol et l'italien ont les mêmes cinq voyelles : ils lisent le ${LANG_NOM[lang] || lang} bien mieux que le français. Ajoutez-les dans <b>Paramètres › Langues › Synthèse vocale › Google</b>, c'est gratuit.</span></div></div>` : ''}
    ${autres.length ? `<details class="g"><summary>Les autres voix du téléphone (${autres.length})</summary><div class="list">${autres.map(ligne).join('')}</div></details>` : ''}
    ${choisie ? `<button class="btn ghost block" data-act="voixAuto">${ic('sync')} Laisser Akiba choisir</button>` : ''}
    <button class="btn primary block xl" data-act="closeSheet">C'est bon</button>`);
};
ACT.voixEssai = async (d, el, e) => {
  if (e) e.stopPropagation();
  const lang = (typeof I18N !== 'undefined' && I18N.cur ? I18N.cur() : 'fr');
  const voix = await voixDisponibles();
  const v = voix.find(x => x.name === d.v);
  if (!v || !voiceOk()) return App.toast('Voix indisponible');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texteALire(VOIX_ESSAI[lang] || VOIX_ESSAI.fr, lang));
  u.voice = v; u.lang = v.lang; u.rate = debitVoix(v, lang); u.pitch = voixNaturelle(v) ? 1 : 1.02;
  window.speechSynthesis.speak(u);
};
ACT.voixPrendre = d => {
  const lang = (typeof I18N !== 'undefined' && I18N.cur ? I18N.cur() : 'fr');
  voixRetenir(lang, voixChoisie(lang) === d.v ? '' : d.v);
  ACT.voixSheet();
  App.toast(voixChoisie(lang) ? 'Voix gardée pour le ' + (LANG_NOM[lang] || lang) : 'Akiba choisira la voix');
};
ACT.voixAuto = () => {
  const lang = (typeof I18N !== 'undefined' && I18N.cur ? I18N.cur() : 'fr');
  voixRetenir(lang, ''); ACT.voixSheet(); App.toast('Akiba choisira la voix');
};
