/* ------------------------------------------------------------------------------------------
   CONTRÔLE DU TERMINAL

   Trois choses ne se vérifient que sur l'appareil lui-même : l'appareil photo qui lit un code,
   le fichier touché dans WhatsApp qui ouvre Akiba, et l'imprimante. Aucun banc ne peut en
   répondre, et le R330S ne laisse pas entrer adb — il n'y a donc aucun moyen d'interroger ce
   terminal à distance. Cet écran retourne le problème : c'est l'application qui se contrôle
   elle-même, sur place, et qui rend un compte rendu que le bureau recopie ou envoie.

   Il ne remplace pas les bancs. Il couvre ce qu'ils ne peuvent pas atteindre.
   ------------------------------------------------------------------------------------------ */

/* Ce que l'on a appris de cet appareil, gardé entre deux ouvertures : un contrôle commencé
   le matin peut se finir l'après-midi, et le bureau ne doit pas tout refaire. */
const CT_CLE = 'kitabu.controle.terminal';
function ctLire() {
  try { return JSON.parse(localStorage.getItem(CT_CLE) || '{}') || {}; } catch (e) { return {}; }
}
function ctEcrire(cle, valeur) {
  try {
    const t = ctLire();
    t[cle] = Object.assign({ quand: Date.now() }, valeur);
    localStorage.setItem(CT_CLE, JSON.stringify(t));
  } catch (e) { /* un terminal qui refuse d'écrire ici ne doit pas empêcher le contrôle */ }
}

/* Les épreuves qui se font sans rien demander au bureau : on les passe au dessin de l'écran. */
function ctAutomatiques() {
  const dans = !!window.AkibaPOS;
  const appareilPhoto = typeof qrScanDispo === 'function' ? qrScanDispo() : false;
  const chiffrement = typeof canEncrypt === 'function' ? canEncrypt() : false;
  const serrage = typeof CompressionStream === 'function';
  const pont = dans && typeof window.AkibaPOS.diagnostic === 'function';
  const impression = dans && typeof window.AkibaPOS.print === 'function';
  return [
    { id: 'android', nom: 'Akiba tourne dans l\'application Android', ok: dans,
      sinon: 'Ouvert dans un navigateur. Ce contrôle n\'a de sens que depuis l\'application installée.' },
    { id: 'pont', nom: 'Le pont avec le terminal répond', ok: pont,
      sinon: 'L\'application ne parle pas au terminal : ni imprimante, ni fichiers, ni verrou.' },
    { id: 'photo', nom: 'L\'appareil photo sait lire un code', ok: appareilPhoto,
      sinon: 'Ce terminal ne sait pas décoder une image. Les cahiers passeront par le fichier.' },
    { id: 'chiffre', nom: 'Le chiffrement est disponible', ok: chiffrement,
      sinon: 'Sans chiffrement, aucun cahier ne peut sortir ni entrer. Mettez Chrome à jour.' },
    { id: 'serre', nom: 'Les fichiers se serrent avant d\'être chiffrés', ok: serrage,
      sinon: 'Les fichiers partiront cinq fois plus gros. Rien n\'est cassé, l\'envoi sera plus long.' },
    { id: 'impr', nom: 'Une voie d\'impression existe', ok: impression,
      sinon: 'Aucune imprimante atteignable. Les reçus se partagent par WhatsApp.' },
  ];
}

SCREENS['dev.terminal'] = () => {
  const auto = ctAutomatiques();
  const fait = ctLire();
  const d = typeof posDiagnostic === 'function' ? posDiagnostic() : null;
  const manques = auto.filter(x => !x.ok).length;

  const ligneAuto = x => `<div class="li" style="align-items:flex-start">${rowIc(x.ok ? 'check' : 'alert')}
    <span class="grow"><b>${esc(x.nom)}</b>${x.ok ? '' : `<span class="small muted">${esc(x.sinon)}</span>`}</span>
    <span class="chip ${x.ok ? 'good' : 'warn'}">${x.ok ? 'oui' : 'non'}</span></div>`;

  /* Une épreuve que seule la main peut passer : on dit quoi faire, on garde la réponse. */
  const ligneMain = (id, titre, quoi, bouton, acte) => {
    const r = fait[id];
    return `<div class="card stack" style="margin-bottom:10px">
      <div class="row" style="align-items:flex-start">${rowIc(r ? (r.ok ? 'check' : 'alert') : 'clip')}
        <span class="grow"><b>${esc(titre)}</b><span class="small muted">${quoi}</span></span>
        ${r ? `<span class="chip ${r.ok ? 'good' : 'bad'}">${r.ok ? 'marche' : 'ne marche pas'}</span>` : ''}</div>
      ${r && r.detail ? `<p class="small" style="margin:0">${esc(r.detail)}</p>` : ''}
      ${bouton ? `<button class="btn ghost block" data-act="${acte}">${ic('eye')} ${esc(bouton)}</button>` : ''}
      <div class="row" style="gap:8px">
        <button class="btn ${r && r.ok ? 'brand' : 'ghost'} grow" data-act="ctDire" data-id="${id}" data-ok="1">Ça a marché</button>
        <button class="btn ${r && !r.ok ? 'bad' : 'ghost'} grow" data-act="ctDire" data-id="${id}" data-ok="">Ça n'a pas marché</button>
      </div></div>`;
  };

  return `<div class="shell">${topbar('Contrôle du terminal', d ? esc(d.marque + ' ' + d.modele) : 'Ce que seul l\'appareil peut dire', backBtn('dev.backup'))}<main class="main">
    <p class="muted">L'appareil photo, le fichier touché dans un message, l'imprimante.</p>
    ${pourquoi(`<p>Ces trois choses ne se vérifient que sur l'appareil lui-même : aucun banc d'essai ne peut les éprouver à votre place.</p>
      <p>Passez-les une à une, dites ce qui s'est passé, puis envoyez le compte rendu à Ubora. Un « non » n'empêche pas de tenir les réunions — il ferme seulement une voie.</p>`,
      'Pourquoi ce contrôle existe')}

    ${manques ? `<div class="alert warn">${icSpan('alert')}<div><b>${manques} point${manques > 1 ? 's' : ''} à regarder</b>
      <span class="small">Le détail est juste en dessous. Un « non » n'empêche pas de tenir les réunions : il ferme seulement une voie.</span></div></div>` : ''}

    <section class="card stack"><h2>Ce qu'Akiba voit toute seule</h2>
      <div class="list">${auto.map(ligneAuto).join('')}</div></section>

    <section class="section"><h2>Ce qu'il faut essayer à la main</h2>

    ${ligneMain('scan', 'Lire un code avec l\'appareil photo',
      'Sur un autre téléphone, ouvrez la démonstration et montrez une AVEC en image. Visez-la ici.',
      'Ouvrir « Recevoir par photo »', 'ctScan')}

    ${ligneMain('fichier', 'Toucher un fichier dans WhatsApp',
      'Akiba fabrique un fichier d\'essai. Envoyez-le-vous par WhatsApp, puis touchez-le dans le message : Akiba doit apparaître dans la liste. Essayez aussi un nom à plusieurs points, comme Cahier.du.14.akiba.',
      'Fabriquer le fichier d\'essai', 'ctFichier')}

    ${ligneMain('imprime', 'Sortir un ticket',
      'L\'écran de l\'imprimante propose les voies une à une. La première qui sort du papier est la bonne.',
      'Ouvrir l\'écran de l\'imprimante', 'ctImprimante')}

    ${ligneMain('verrou', 'Le verrou contre la suppression',
      'Activez-le, puis essayez de désinstaller Akiba : le téléphone doit refuser.',
      '', '')}
    </section>

    <section class="card stack"><h2>Le compte rendu</h2>
      <p class="small muted" style="margin:0">Tout ce qui précède, en clair, prêt à envoyer. Il ne contient aucun nom de membre et aucun chiffre du cahier.</p>
      <button class="btn primary block xl" data-act="ctCopier">${ic('clip')} Copier le compte rendu</button>
      <button class="btn ghost block" data-act="ctPartager">${ic('sync')} Envoyer à Ubora par WhatsApp</button>
      <button class="btn ghost block" data-act="ctEffacer">Recommencer le contrôle</button>
    </section>
  </main></div>`;
};

/* ---------- ce que font les boutons ---------- */

ACT.ctDire = (d, el) => {
  ctEcrire(d.id, { ok: !!d.ok });
  render();
  App.toast(d.ok ? 'Noté : cela marche sur ce terminal' : 'Noté : cela ne marche pas ici');
};

ACT.ctScan = () => {
  if (typeof ACT.qrRecevoir !== 'function') return App.toast('La lecture par photo n\'existe pas dans cette version');
  ACT.qrRecevoir({});
};

ACT.ctImprimante = () => App.go('a.imprimante');

/* Un vrai fichier .akiba, mais qui ne contient aucun cahier : il sert à voir si le téléphone
   propose Akiba quand on le touche dans un message. Le code est écrit dessus, puisqu'il n'y a
   rien à protéger — c'est le seul endroit de l'application où cela se fait, et c'est voulu. */
ACT.ctFichier = async () => {
  if (typeof canEncrypt !== 'function' || !canEncrypt()) return App.toast('Ce terminal ne permet pas le chiffrement');
  App.toast('Préparation du fichier d\'essai…');
  try {
    const faux = {
      id: 'avec-essai-terminal', name: 'Essai du terminal', village: '—', members: [], meetings: [], tx: [],
      settings: {}, cycle: { n: 1, start: Date.now(), end: Date.now() }, cycles: [], visits: [],
    };
    /* « essai » voyage en clair sur l'enveloppe, et c'est voulu : Akiba doit le reconnaître
       avant d'ouvrir quoi que ce soit, pour ne pas fabriquer un faux groupe dans le cahier.
       Le nom porte plusieurs points exprès — c'est exactement le cas que les anciennes
       versions d'Android ne reconnaissaient pas. */
    const texte = JSON.stringify(Object.assign(JSON.parse(await buildTransfer(faux, 'ESSAI123')), { essai: 1 }));
    const nom = 'Essai.du.terminal.akiba';
    if (typeof sortirFichier === 'function') await sortirFichier(nom, texte);
    else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([texte], { type: 'application/octet-stream' }));
      a.download = nom; a.click();
    }
    App.toast('Fichier « ' + nom + ' » créé · le code est ESSAI123');
  } catch (e) {
    App.toast('Le fichier d\'essai n\'a pas pu être créé');
  }
};

function ctCompteRendu() {
  const d = typeof posDiagnostic === 'function' ? posDiagnostic() : null;
  const fait = ctLire();
  const nom = { scan: 'Lire un code avec l\'appareil photo', fichier: 'Toucher un fichier dans WhatsApp',
    imprime: 'Sortir un ticket', verrou: 'Le verrou contre la suppression' };
  const l = ['CONTRÔLE DU TERMINAL — Akiba', ''];
  if (d) {
    l.push('Terminal : ' + d.marque + ' ' + d.modele, 'Fabricant : ' + d.fabricant,
      'Appareil : ' + d.appareil, 'Produit : ' + d.produit,
      'Android : ' + d.android + ' (niveau ' + d.niveau + ')');
  } else l.push('Terminal : inconnu (Akiba est ouvert dans un navigateur)');
  l.push('Version d\'Akiba : ' + (window.KITABU_VERSION || 'démonstration'), '');
  l.push('Ce qu\'Akiba voit toute seule :');
  ctAutomatiques().forEach(x => l.push('  ' + (x.ok ? '[oui]' : '[NON]') + ' ' + x.nom));
  l.push('', 'Ce qui a été essayé à la main :');
  Object.keys(nom).forEach(k => {
    const r = fait[k];
    l.push('  ' + (r ? (r.ok ? '[marche]' : '[NE MARCHE PAS]') : '[pas encore essayé]') + ' ' + nom[k]);
  });
  l.push('', 'Fait le ' + new Date().toLocaleString('fr-FR'));
  return l.join('\n');
}

ACT.ctCopier = async () => {
  const t = ctCompteRendu();
  try { await navigator.clipboard.writeText(t); App.toast('Compte rendu copié'); }
  catch (e) { App.toast('Copie impossible : passez par WhatsApp'); }
};

ACT.ctPartager = async () => {
  const t = ctCompteRendu();
  try {
    if (navigator.share) { await navigator.share({ text: t }); return; }
  } catch (e) { return; }                       /* le bureau a refermé la fenêtre : on se tait */
  try { window.location.href = 'https://wa.me/243998275144?text=' + encodeURIComponent(t); }
  catch (e) { App.toast('Copiez le compte rendu et collez-le dans WhatsApp'); }
};

ACT.ctEffacer = () => {
  try { localStorage.removeItem(CT_CLE); } catch (e) { }
  render();
  App.toast('Contrôle remis à zéro');
};
