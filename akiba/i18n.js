/* Akiba AVEC — langues de la RDC : sélecteur, traduction de l'interface, éditeur de traductions */
'use strict';

ICONS.globe = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>';

/* Langues proposées. « base » : traduction fournie (à faire relire par des locuteurs).
   Les langues sans base se traduisent dans l'application (écran « Traduire »). */
const LANGS = [
  { id: 'fr', name: 'Français', where: 'Langue officielle' },
  { id: 'ln', name: 'Lingála', where: 'Kinshasa, Équateur, Sud-Ubangi, Nord-Ubangi, Mongala, Tshuapa' },
  { id: 'sw', name: 'Kiswahili', where: 'Nord-Kivu, Sud-Kivu, Maniema, Ituri, Tanganyika, Haut-Katanga' },
  { id: 'kg', name: 'Kikongo ya leta', where: 'Kongo-Central, Kwango, Kwilu, Mai-Ndombe' },
  { id: 'lua', name: 'Tshiluba', where: 'Kasaï, Kasaï-Central, Kasaï-Oriental, Lomami' },
  { id: 'nga', name: 'Ngbaka', where: 'Sud-Ubangi (Gemena, Budjala, Kungu)' },
  { id: 'ngb', name: 'Ngbandi', where: 'Nord-Ubangi et Sud-Ubangi' },
  { id: 'mbn', name: 'Mbanza', where: 'Sud-Ubangi (Budjala, Libenge)' },
  { id: 'lse', name: 'Lomongo', where: 'Équateur, Tshuapa' },
  { id: 'zne', name: 'Zande', where: 'Bas-Uele, Haut-Uele' }
];

/* Phrases de l'interface du groupe. {n} = partie variable (nom, numéro…). */
const TR = {
  'Accueil': { ln: 'Ebandeli', sw: 'Mwanzo', kg: 'Nzo', lua: 'Ku nzubu' },
  'Membres': { ln: 'Bato ya lisanga', sw: 'Wanachama', kg: 'Bantu ya kimvuka', lua: 'Bena kasumbu' },
  'Crédits': { ln: 'Banyongo', sw: 'Mikopo', kg: 'Mbongo ya kudefa' },
  'Journal': { ln: 'Buku', sw: 'Daftari', kg: 'Buku', lua: 'Mukanda' },
  'Plus': { ln: 'Mosusu', sw: 'Zaidi', kg: 'Yankaka', lua: 'Bikuabu' },
  'Argent dans la caisse': { ln: 'Mbongo na sanduku', sw: 'Pesa ndani ya sanduku', kg: 'Mbongo na kesi', lua: 'Makuta mu tshisanduku' },
  'Caisse de crédit': { ln: 'Sanduku ya banyongo', sw: 'Mfuko wa mikopo', kg: 'Kesi ya bandefa' },
  'Caisse sociale': { ln: 'Sanduku ya lisalisi', sw: 'Mfuko wa kusaidiana', kg: 'Kesi ya lusadisu' },
  'Ouvrir la réunion n°{n}': { ln: 'Fungola likita ya {n}', sw: 'Fungua mkutano wa {n}', kg: 'Zibula lukutakanu ya {n}' },
  'Continuer la réunion n°{n}': { ln: 'Kokoba likita ya {n}', sw: 'Endelea na mkutano wa {n}', kg: 'Landa lukutakanu ya {n}' },
  'Épargne du cycle': { ln: 'Mbongo ebombami', sw: 'Akiba ya mzunguko', kg: 'Mbongo ya kubumba' },
  'Crédits à rembourser': { ln: 'Banyongo ya kozongisa', sw: 'Mikopo ya kulipa', kg: 'Bandefa ya kufuta' },
  'Présence': { ln: 'Koya na likita', sw: 'Mahudhurio' },
  'Valeur d\'une part': { ln: 'Motuya ya eteni moko', sw: 'Thamani ya hisa moja', kg: 'Ntalu ya kiteni mosi' },
  'À surveiller': { ln: 'Makambo ya kotala', sw: 'Mambo ya kuangalia' },
  'Dernières réunions': { ln: 'Makita ya nsuka', sw: 'Mikutano ya mwisho', kg: 'Bakutakanu ya nsuka' },
  'Journal protégé': { ln: 'Buku ebatelami', sw: 'Daftari limelindwa' },
  'Qui êtes-vous ?': { ln: 'Ozali nani?', sw: 'Wewe ni nani?', kg: 'Nge kele nani?', lua: 'Wewe udi nganyi?' },
  'Membre d\'une AVEC': { ln: 'Moto ya lisanga AVEC', sw: 'Mwanachama wa AVEC', kg: 'Muntu ya kimvuka AVEC' },
  'Créer une AVEC': { ln: 'Kosala lisanga', sw: 'Kuunda AVEC' },
  'Tenir la réunion': { ln: 'Kosala likita', sw: 'Kufanya mkutano' },
  'Voir mon carnet': { ln: 'Tala kaye na ngai', sw: 'Ona kitabu changu' },
  'Tous les membres': { ln: 'Bato nyonso ya lisanga', sw: 'Wanachama wote' },
  'Choisir mon AVEC': { ln: 'Pona lisanga na ngai', sw: 'Chagua AVEC yangu' },
  'Autres accès': { ln: 'Bisika mosusu', sw: 'Njia nyingine' },
  'Recevoir une AVEC': { ln: 'Kozwa lisanga', sw: 'Kupokea AVEC' },
  'Guide d\'utilisation': { ln: 'Ndenge ya kosalela', sw: 'Mwongozo wa matumizi' },
  'Choisir mon AVEC': { ln: 'Pona lisanga na ngai', sw: 'Chagua AVEC yangu', kg: 'Pona kimvuka na mono' },
  'Touchez votre nom': { ln: 'Simba nkombo na yo', sw: 'Gusa jina lako', kg: 'Simba nkombo na nge', lua: 'Lenga dîna diebe' },
  'Connexion': { ln: 'Kokota', sw: 'Kuingia', kg: 'Kukota', lua: 'Kubuela' },
  '{n}, tapez votre code secret': { ln: '{n}, koma nimero na yo ya sekele', sw: '{n}, andika namba yako ya siri', kg: '{n}, sonika nimero na nge ya nsweki' },
  'Annuler': { ln: 'Tika', sw: 'Acha' },
  'Confirmer le comptage': { ln: 'Ndima motango', sw: 'Thibitisha hesabu' },
  'Code incorrect': { ln: 'Nimero ya sekele ezali mabe', sw: 'Namba ya siri si sahihi', kg: 'Nimero ya nsweki kele mbi' },
  'Présences': { ln: 'Bato bazali', sw: 'Mahudhurio', kg: 'Bantu kele' },
  'Comptage': { ln: 'Kotanga mbongo', sw: 'Kuhesabu', kg: 'Kutanga mbongo', lua: 'Kubala makuta' },
  'Sociale': { ln: 'Lisalisi', sw: 'Msaada', kg: 'Lusadisu' },
  'Épargne': { ln: 'Kobomba', sw: 'Akiba', kg: 'Kubumba' },
  'Rembours.': { ln: 'Kozongisa', sw: 'Kulipa', kg: 'Kufuta' },
  'Amendes': { ln: 'Bafute', sw: 'Faini' },
  'Clôture': { ln: 'Kokanga', sw: 'Kufunga', kg: 'Kukanga' },
  'Qui est là ?': { ln: 'Nani azali awa?', sw: 'Nani yupo?', kg: 'Nani kele awa?', lua: 'Nganyi udiku?' },
  'Là': { ln: 'Azali', sw: 'Yupo', kg: 'Kele', lua: 'Udiku' },
  'Retard': { ln: 'Nsima', sw: 'Amechelewa' },
  'Absent': { ln: 'Azangi', sw: 'Hayupo', kg: 'Kele ve', lua: 'Kêna' },
  'Valider les présences': { ln: 'Ndima bato bazali', sw: 'Thibitisha mahudhurio' },
  'Suivant': { ln: 'Oyo elandi', sw: 'Endelea', kg: 'Yina ke landa', lua: 'Tshilonda' },
  'Ouvrir la caisse': { ln: 'Fungola sanduku', sw: 'Fungua sanduku', kg: 'Zibula kesi' },
  'Selon le cahier': { ln: 'Kolanda buku', sw: 'Kulingana na daftari' },
  'Argent compté (FC)': { ln: 'Mbongo etangami (FC)', sw: 'Pesa iliyohesabiwa (FC)', kg: 'Mbongo ya kutanga (FC)' },
  'Caisse comptée': { ln: 'Sanduku etangami', sw: 'Sanduku limehesabiwa' },
  'Enregistrer la caisse sociale': { ln: 'Koma sanduku ya lisalisi', sw: 'Andika mfuko wa kusaidiana' },
  'Donner une aide sociale': { ln: 'Kopesa lisalisi', sw: 'Toa msaada' },
  'Achat de parts': { ln: 'Kosomba biteni', sw: 'Kununua hisa', kg: 'Kusumba biteni' },
  'Mettre 1 part à tout le monde': { ln: 'Eteni moko na moto nyonso', sw: 'Hisa moja kwa kila mtu' },
  'Enregistrer l\'épargne': { ln: 'Koma mbongo ebombami', sw: 'Andika akiba' },
  'Remboursements': { ln: 'Kozongisa nyongo', sw: 'Malipo ya mikopo', kg: 'Kufuta bandefa' },
  'Échéance': { ln: 'Oyo esengeli', sw: 'Kiasi cha mwezi' },
  'Total reçu': { ln: 'Mbongo nyonso ekoti', sw: 'Jumla iliyopokelewa' },
  'Enregistrer les remboursements': { ln: 'Koma nyongo ezongisami', sw: 'Andika malipo' },
  'Nouveaux crédits': { ln: 'Banyongo ya sika', sw: 'Mikopo mipya' },
  'Accorder un crédit': { ln: 'Kopesa nyongo', sw: 'Toa mkopo', kg: 'Kudefa mbongo' },
  'Terminer les crédits': { ln: 'Kosilisa banyongo', sw: 'Maliza mikopo' },
  'Enregistrer les amendes': { ln: 'Koma bafute', sw: 'Andika faini' },
  'Fermer la caisse': { ln: 'Kanga sanduku', sw: 'Funga sanduku', kg: 'Kanga kesi' },
  'Doit être dans la caisse': { ln: 'Esengeli kozala na sanduku', sw: 'Inapaswa kuwa sandukuni' },
  'Les trois clés': { ln: 'Bafungola misato', sw: 'Funguo tatu' },
  'confirmé': { ln: 'endimami', sw: 'imethibitishwa' },
  'toucher': { ln: 'simba', sw: 'gusa', kg: 'simba' },
  'Fermer et sceller la réunion': { ln: 'Kanga likita', sw: 'Funga mkutano' },
  'La caisse est juste': { ln: 'Sanduku ezali malamu', sw: 'Sanduku liko sawa', kg: 'Kesi kele mbote' },
  'Étape enregistrée': { ln: 'Eteni ekomami', sw: 'Hatua imeandikwa' },
  'Retour à l\'accueil': { ln: 'Zonga na ebandeli', sw: 'Rudi mwanzo' },
  'Mon carnet': { ln: 'Kaye na ngai', sw: 'Akiba changu', kg: 'Buku na mono', lua: 'Mukanda wanyi' },
  'Mon épargne': { ln: 'Mbongo na ngai ebombami', sw: 'Akiba yangu' },
  'Parts achetées': { ln: 'Biteni nasombi', sw: 'Hisa zilizonunuliwa' },
  'Valeur si partage': { ln: 'Motuya soki bakaboli', sw: 'Thamani wakati wa kugawa' },
  'Timbres d\'épargne': { ln: 'Bilembo ya kobomba', sw: 'Alama za akiba' },
  'Historique': { ln: 'Makambo eleki', sw: 'Kumbukumbu' },
  'Aucun crédit': { ln: 'Nyongo ezali te', sw: 'Hakuna mkopo' },
  'Changer mon code secret': { ln: 'Bongola nimero na ngai ya sekele', sw: 'Badilisha namba yangu ya siri' },
  'Partage de fin de cycle': { ln: 'Kokabola na nsuka ya mbula', sw: 'Kugawa mwisho wa mzunguko' },
  'Faire le partage maintenant': { ln: 'Kabola sikoyo', sw: 'Gawa sasa' },
  'Une part vaut': { ln: 'Eteni moko ezali na motuya', sw: 'Hisa moja ina thamani' },
  'Membre': { ln: 'Moto', sw: 'Mwanachama' },
  'Parts': { ln: 'Biteni', sw: 'Hisa', kg: 'Biteni', lua: 'Bitupa' },
  'Reçoit': { ln: 'Azwi', sw: 'Anapokea' },
  'Synchronisation': { ln: 'Kotinda makambo', sw: 'Kutuma data' },
  'Envoyer maintenant': { ln: 'Tinda sikoyo', sw: 'Tuma sasa', kg: 'Tinda ntangu yai' },
  'À jour': { ln: 'Etindami', sw: 'Imetumwa' },
  'Hors ligne': { ln: 'Rezo ezali te', sw: 'Hakuna mtandao', kg: 'Rezo kele ve', lua: 'Kakuena rezo' },
  'Pas de réseau. Tout reste enregistré sur ce téléphone.': { ln: 'Rezo ezali te. Nyonso etikali na telefone oyo.', sw: 'Hakuna mtandao. Kila kitu kimehifadhiwa kwenye simu hii.' },
  'Écrivez le montant compté': { ln: 'Koma mbongo etangami', sw: 'Andika pesa iliyohesabiwa' },
  'Seul le bureau peut ouvrir une réunion': { ln: 'Kaka bakambi bakoki kofungola likita', sw: 'Viongozi pekee wanaweza kufungua mkutano' },
  'Ajouter un membre': { ln: 'Bakisa moto', sw: 'Ongeza mwanachama' },
  'Changer d\'utilisateur': { ln: 'Bongola moto', sw: 'Badilisha mtumiaji' },
  'Nom complet': { ln: 'Nkombo mobimba', sw: 'Jina kamili' },
  'Sexe': { ln: 'Mwasi to mobali', sw: 'Jinsia' },
  'Femme': { ln: 'Mwasi', sw: 'Mwanamke', kg: 'Nkento', lua: 'Mukaji' },
  'Homme': { ln: 'Mobali', sw: 'Mwanaume', kg: 'Bakala', lua: 'Mulume' },
  'Âge': { ln: 'Mbula', sw: 'Umri' },
  'Téléphone': { ln: 'Telefone', sw: 'Simu' },
  'Activité': { ln: 'Mosala', sw: 'Kazi', kg: 'Kisalu', lua: 'Mudimu' },
  'Adresse': { ln: 'Esika ya kofanda', sw: 'Anwani' },
  'facultatif': { ln: 'soki olingi', sw: 'si lazima' },
  'Informations': { ln: 'Makambo na ye', sw: 'Taarifa' },
  'Langue': { ln: 'Monoko', sw: 'Lugha', kg: 'Ndinga', lua: 'Muakulu' }
};
const TR_KEYS = Object.keys(TR);

const I18N = {
  cur() { try { return localStorage.getItem('kitabu.lang') || 'fr'; } catch (e) { return 'fr'; } },
  set(l) { try { localStorage.setItem('kitabu.lang', l); } catch (e) { /* choix gardé pour la session */ } this._mem = l; this._c = null; },
  langs() { return LANGS.concat((K.data.langs || []).filter(x => !LANGS.some(l => l.id === x.id))); },
  name(id = this.cur()) { return (this.langs().find(l => l.id === id) || LANGS[0]).name; },
  words(l) {
    const out = {};
    TR_KEYS.forEach(k => { if (TR[k][l]) out[k] = TR[k][l]; });
    Object.entries((K.data.i18n || {})[l] || {}).forEach(([k, v]) => { if (v) out[k] = v; });
    return out;
  },
  coverage(l) { if (l === 'fr') return 1; const w = this.words(l); return TR_KEYS.filter(k => w[k]).length / TR_KEYS.length; },
  dict() {
    const l = this._mem || this.cur();
    if (l === 'fr') return null;
    const v = K.data.i18nV || 0;
    if (this._c && this._c.l === l && this._c.v === v) return this._c;
    const d = this.words(l), pats = [];
    Object.keys(d).forEach(k => {
      if (!k.includes('{')) return;
      const names = [];
      const src = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (_, n) => { names.push(n); return '(.+?)'; });
      pats.push({ re: new RegExp('^' + src + '$'), names, v: d[k] });
    });
    this._c = { l, v, d, pats };
    return this._c;
  },
  t(s) {
    const c = this.dict();
    if (!c || typeof s !== 'string') return s;
    const k = s.trim();
    if (!k) return s;
    let out = c.d[k];
    if (!out) for (const p of c.pats) { const m = k.match(p.re); if (m) { out = p.v.replace(/\{(\w+)\}/g, (_, n) => m[p.names.indexOf(n) + 1] || ''); break; } }
    return out ? s.replace(k, out) : s;
  },
  apply(root) {
    const l = this._mem || this.cur();
    document.documentElement.lang = l;
    if (l === 'fr') return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => {
      const p = n.parentElement;
      if (!p || p.closest('textarea,script,style,.no-tr')) return;
      const t = this.t(n.nodeValue);
      if (t !== n.nodeValue) n.nodeValue = t;
    });
  }
};

/* ---------- choix de la langue ---------- */
ACT.langSheet = () => {
  const cur = I18N.cur();
  App.openSheet(`<h2>Langue · Monoko · Lugha</h2>
    <div class="list no-tr">${I18N.langs().map(l => {
      const c = I18N.coverage(l.id);
      const chip = l.id === 'fr' ? '<span class="chip good">Complète</span>' : c >= .95 ? '<span class="chip good">Complète</span>' : c > 0 ? `<span class="chip warn">${pct(c)} · à relire</span>` : '<span class="chip">À traduire</span>';
      return `<button class="li" data-act="setLang" data-l="${l.id}" aria-pressed="${l.id === cur}" style="${l.id === cur ? 'background:var(--brand-soft)' : ''}">
        <span class="grow"><b>${esc(l.name)}${l.id === cur ? ' ✓' : ''}</b><span class="small muted">${esc(l.where || '')}</span></span>${chip}</button>`; }).join('')}</div>
    <p class="hint no-tr">Les mots qui ne sont pas encore traduits restent en français. Les traductions fournies sont des brouillons : faites-les relire par des locuteurs de la zone.</p>
    ${canTranslate() ? `<button class="btn ghost block no-tr" data-act="go" data-to="tr.edit" data-lang="${cur === 'fr' ? 'ln' : cur}">${ic('globe')} Traduire ou corriger une langue</button>` : ''}`);
};
ACT.setLang = d => { I18N.set(d.l); App.closeSheet(); App.toast('Langue : ' + I18N.name(d.l)); };

/* ---------- éditeur de traductions (partagé avec toutes les AVEC via la synchronisation) ---------- */
function trBack() {
  const s = K.session;
  if (!s) return 'login';
  return s.kind === 'org' ? 'o.home' : s.kind === 'anim' ? 'n.home' : 'a.more';
}
/* traduire : organisation, animateur ou bureau d'une AVEC (pas les simples membres) */
function canTranslate() {
  const s = K.session;
  if (!s) return K.data.mode !== 'prod';
  if (s.kind === 'avec') { const a = avecById(s.avecId); return !!a && isBureau(memberOf(a, s.memberId)); }
  return true;
}
SCREENS['tr.edit'] = p => {
  if (!canTranslate()) return `<div class="shell">${topbar('Traduire Akiba', '', backBtn(K.session ? homeScreen() : 'login'))}<main class="main"><div class="alert warn"><div><b>Réservé au bureau, à l'animateur et à l'organisation</b></div></div></main></div>`;
  const langs = I18N.langs().filter(l => l.id !== 'fr');
  const lang = langs.some(l => l.id === p.lang) ? p.lang : 'ln';
  const w = I18N.words(lang);
  const missingOnly = p.missing === '1';
  const keys = TR_KEYS.filter(k => !missingOnly || !w[k]);
  return `<div class="shell no-tr">${topbar('Traduire Akiba', `${esc(I18N.name(lang))} · ${pct(I18N.coverage(lang))} traduit`, backBtn(trBack()))}<main class="main">
    <p class="muted">Écrivez chaque phrase dans la langue choisie, comme on la dit au village. Gardez <b>{n}</b> à sa place : c'est un nom ou un numéro. Une case vide reste en français.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${langs.map(l => `<button class="btn sm ${l.id === lang ? 'brand' : 'ghost'}" data-act="go" data-to="tr.edit" data-lang="${l.id}">${esc(l.name)}</button>`).join('')}
      <button class="btn sm ghost" data-act="addLangSheet">${ic('plus')} Autre langue</button></div>
    <div class="row between"><span class="small muted">${keys.length} phrase${keys.length > 1 ? 's' : ''}</span>
      <button class="btn sm ghost" data-act="go" data-to="tr.edit" data-lang="${lang}" data-missing="${missingOnly ? '0' : '1'}">${missingOnly ? 'Tout voir' : 'Seulement les manquantes'}</button></div>
    <div class="list">${keys.map(k => { const i = TR_KEYS.indexOf(k); return `<div class="li" style="flex-direction:column;align-items:stretch;gap:6px">
      <label for="tr-${i}" class="small"><b>${esc(k)}</b></label>
      <input id="tr-${i}" class="input" value="${esc(w[k] || '')}" placeholder="${esc(TR[k].ln || '')}" autocomplete="off" data-key="${esc(k)}"></div>`; }).join('') || '<div class="li muted">Tout est traduit.</div>'}</div>
    <div class="sticky-foot" style="bottom:16px"><button class="btn primary block xl" data-act="saveTr" data-lang="${lang}">${ic('check')} Enregistrer les traductions</button></div>
  </main></div>`;
};
ACT.saveTr = d => {
  K.data.i18n = K.data.i18n || {};
  const bag = K.data.i18n[d.lang] = K.data.i18n[d.lang] || {};
  let n = 0;
  document.querySelectorAll('input[data-key]').forEach(inp => {
    const k = inp.dataset.key, v = inp.value.trim();
    if (v && v !== (TR[k] && TR[k][d.lang])) { bag[k] = v; n++; }
    else if (!v) delete bag[k];
  });
  K.data.i18nV = (K.data.i18nV || 0) + 1;
  I18N._c = null;
  DB.save(); render();
  App.toast(`${n} traduction${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''} pour ${I18N.name(d.lang)}`);
};
ACT.addLangSheet = () => App.openSheet(`<div class="no-tr stack"><h2>Ajouter une langue</h2>
  <div class="field"><label for="alN">Nom de la langue</label><input id="alN" class="input" placeholder="Ex. Budja, Lingombe, Kiyombe"></div>
  <div class="field"><label for="alW">Où la parle-t-on ?</label><input id="alW" class="input" placeholder="Province, territoire"></div>
  <button class="btn primary block xl" data-act="saveLang">Ajouter</button></div>`);
ACT.saveLang = () => {
  const name = document.getElementById('alN').value.trim();
  if (name.length < 2) return App.toast('Écrivez le nom de la langue');
  const id = 'x-' + name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 12);
  K.data.langs = K.data.langs || [];
  if (I18N.langs().some(l => l.id === id)) return App.toast('Cette langue existe déjà');
  K.data.langs.push({ id, name, where: document.getElementById('alW').value.trim() });
  DB.save(); App.go('tr.edit', { lang: id });
};

/* ---------- affichage en direct ---------- */
const liveTag = () => `<span class="live"><i></i>En direct · ${new Date(App.liveAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>`;
