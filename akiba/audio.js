/* Akiba AVEC — guide audio : le téléphone lit à voix haute (sans internet, avec la voix installée sur le téléphone) */
'use strict';

ICONS.volume = '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>';
const Voice = { playing: null };
const voiceOk = () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

function paintSpeak() {
  document.querySelectorAll('[data-act="speak"]').forEach(b => {
    const on = Voice.playing === b.dataset.id;
    b.classList.toggle('on', on);
    const l = b.querySelector('.lbl');
    if (l) l.textContent = on ? 'Arrêter' : (b.dataset.label || 'Écouter');
  });
}
function speakText(text, id, lang) {
  if (!voiceOk()) { App.toast('La lecture à voix haute n\'est pas disponible. Installez « Services vocaux Google » depuis le Play Store.'); return; }
  const synth = window.speechSynthesis;
  synth.cancel();
  const clean = text.replace(/[›»«⌫✓→]/g, ', ').replace(/\s+/g, ' ').trim();
  const parts = (clean.match(/[^.!?;:]+[.!?;:]*/g) || [clean]).map(s => s.trim()).filter(Boolean);   // phrases courtes : évite les coupures de Chrome
  const voices = synth.getVoices ? synth.getVoices() : [];
  const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith(lang || 'fr')) || voices.find(x => x.lang && x.lang.toLowerCase().startsWith('fr'));
  Voice.playing = id;
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = v ? v.lang : 'fr-FR';
    if (v) u.voice = v;
    u.rate = 0.9;
    if (i === parts.length - 1) u.onend = () => { if (Voice.playing === id) { Voice.playing = null; paintSpeak(); } };
    synth.speak(u);
  });
  paintSpeak();
}
ACT.speak = d => {
  if (Voice.playing === d.id) { if (voiceOk()) window.speechSynthesis.cancel(); Voice.playing = null; return paintSpeak(); }
  const text = [...document.querySelectorAll(d.src)].map(n => n.textContent.trim()).filter(Boolean).join('. ');
  if (!text) return App.toast('Rien à lire sur cet écran');
  speakText(text, d.id, d.lang);
};
const speakBtn = (id, src, label = 'Écouter', lang = '') =>
  `<button class="btn sm ghost speak no-tr" data-act="speak" data-id="${id}" data-src="${src}" data-label="${label}" ${lang ? `data-lang="${lang}"` : ''} aria-label="${label} à voix haute">${ic('volume')}<span class="lbl">${label}</span></button>`;

/* la voix s'arrête quand on change d'écran */
const _goVoice = App.go.bind(App);
App.go = function (...args) { if (Voice.playing && voiceOk()) window.speechSynthesis.cancel(); Voice.playing = null; return _goVoice(...args); };
