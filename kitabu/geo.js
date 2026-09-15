/* Kitabu AVEC — découpage administratif de la RDC : 26 provinces, 145 territoires, villes et communes de Kinshasa.
   Secteurs, groupements et villages : saisie libre, avec les noms déjà utilisés proposés automatiquement. */
'use strict';

const RDC = [
  { p: 'Kinshasa', v: [], c: ['Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu', 'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba', 'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao'], t: [] },
  { p: 'Kongo-Central', v: ['Matadi', 'Boma'], t: ['Kasangulu', 'Kimvula', 'Lukula', 'Luozi', 'Madimba', 'Mbanza-Ngungu', 'Moanda', 'Seke-Banza', 'Songololo', 'Tshela'] },
  { p: 'Kwango', v: ['Kenge'], t: ['Feshi', 'Kahemba', 'Kasongo-Lunda', 'Kenge', 'Popokabaka'] },
  { p: 'Kwilu', v: ['Bandundu', 'Kikwit'], t: ['Bagata', 'Bulungu', 'Gungu', 'Idiofa', 'Masi-Manimba'] },
  { p: 'Mai-Ndombe', v: ['Inongo'], t: ['Bolobo', 'Inongo', 'Kiri', 'Kutu', 'Kwamouth', 'Mushie', 'Oshwe', 'Yumbi'] },
  { p: 'Équateur', v: ['Mbandaka'], t: ['Basankusu', 'Bikoro', 'Bolomba', 'Bomongo', 'Ingende', 'Lukolela', 'Makanza'] },
  { p: 'Sud-Ubangi', v: ['Gemena', 'Zongo'], t: ['Budjala', 'Gemena', 'Kungu', 'Libenge'] },
  { p: 'Nord-Ubangi', v: ['Gbadolite'], t: ['Bosobolo', 'Businga', 'Mobayi-Mbongo', 'Yakoma'] },
  { p: 'Mongala', v: ['Lisala'], t: ['Bongandanga', 'Bumba', 'Lisala'] },
  { p: 'Tshuapa', v: ['Boende'], t: ['Befale', 'Boende', 'Bokungu', 'Djolu', 'Ikela', 'Monkoto'] },
  { p: 'Tshopo', v: ['Kisangani'], t: ['Bafwasende', 'Banalia', 'Basoko', 'Isangi', 'Opala', 'Ubundu', 'Yahuma'] },
  { p: 'Bas-Uele', v: ['Buta'], t: ['Aketi', 'Ango', 'Bambesa', 'Bondo', 'Buta', 'Poko'] },
  { p: 'Haut-Uele', v: ['Isiro'], t: ['Dungu', 'Faradje', 'Niangara', 'Rungu', 'Wamba', 'Watsa'] },
  { p: 'Ituri', v: ['Bunia'], t: ['Aru', 'Djugu', 'Irumu', 'Mahagi', 'Mambasa'] },
  { p: 'Nord-Kivu', v: ['Goma', 'Beni', 'Butembo'], t: ['Beni', 'Lubero', 'Masisi', 'Nyiragongo', 'Rutshuru', 'Walikale'] },
  { p: 'Sud-Kivu', v: ['Bukavu', 'Uvira', 'Baraka', 'Kamituga'], t: ['Fizi', 'Idjwi', 'Kabare', 'Kalehe', 'Mwenga', 'Shabunda', 'Uvira', 'Walungu'] },
  { p: 'Maniema', v: ['Kindu'], t: ['Kabambare', 'Kailo', 'Kasongo', 'Kibombo', 'Lubutu', 'Pangi', 'Punia'] },
  { p: 'Haut-Katanga', v: ['Lubumbashi', 'Likasi'], t: ['Kambove', 'Kasenga', 'Kipushi', 'Mitwaba', 'Pweto', 'Sakania'] },
  { p: 'Lualaba', v: ['Kolwezi'], t: ['Dilolo', 'Kapanga', 'Lubudi', 'Mutshatsha', 'Sandoa'] },
  { p: 'Haut-Lomami', v: ['Kamina'], t: ['Bukama', 'Kabongo', 'Kamina', 'Kaniama', 'Malemba-Nkulu'] },
  { p: 'Tanganyika', v: ['Kalemie'], t: ['Kabalo', 'Kalemie', 'Kongolo', 'Manono', 'Moba', 'Nyunzu'] },
  { p: 'Lomami', v: ['Kabinda', 'Mwene-Ditu'], t: ['Kabinda', 'Kamiji', 'Lubao', 'Luilu', 'Ngandajika'] },
  { p: 'Sankuru', v: ['Lusambo'], t: ['Katako-Kombe', 'Kole', 'Lodja', 'Lomela', 'Lubefu', 'Lusambo'] },
  { p: 'Kasaï', v: ['Tshikapa'], t: ['Dekese', 'Ilebo', 'Kamonia', 'Luebo', 'Mweka'] },
  { p: 'Kasaï-Central', v: ['Kananga'], t: ['Demba', 'Dibaya', 'Dimbelenge', 'Kazumba', 'Luiza'] },
  { p: 'Kasaï-Oriental', v: ['Mbuji-Mayi'], t: ['Kabeya-Kamwanga', 'Katanda', 'Lupatapata', 'Miabi', 'Tshilenge'] }
];
const ENTITE = { T: 'territoire', V: 'ville', C: 'commune' };
const entiteLabel = a => a.territoire ? `${a.entite === 'ville' ? 'Ville de ' : a.entite === 'commune' ? 'Commune de ' : 'Territoire de '}${a.territoire}` : '';
const placeShort = a => [a.village, a.territoire ? (a.entite === 'territoire' || !a.entite ? a.territoire : entiteLabel(a)) : '', a.province].filter(Boolean).map(esc).join(', ');

function geoOptions(prov, cur) {
  const e = RDC.find(x => x.p === prov);
  if (!e) return '<option value="">Choisir d\'abord la province</option>';
  const grp = (label, key, list) => list.length ? `<optgroup label="${label}">${list.map(n => `<option value="${key}:${esc(n)}" ${cur === key + ':' + n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</optgroup>` : '';
  return '<option value="">Choisir…</option>' + grp('Territoires', 'T', e.t) + grp('Villes', 'V', e.v) + grp('Communes', 'C', e.c || []);
}
function knownPlaces(field, g) {
  const set = new Set();
  K.data.avecs.forEach(a => { if (a[field] && (!g.province || a.province === g.province) && (field === 'secteur' || !g.territoire || a.territoire === g.territoire)) set.add(a[field]); });
  return [...set].sort((x, y) => x.localeCompare(y, 'fr'));
}
function geoFields(p, g = {}) {
  const curT = g.territoire ? `${Object.keys(ENTITE).find(k => ENTITE[k] === (g.entite || 'territoire')) || 'T'}:${g.territoire}` : '';
  const opt = '<span class="opt">facultatif</span>';
  const dl = (id, field) => `<datalist id="${id}">${knownPlaces(field, g).map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist>`;
  return `<div class="grid2">
      <div class="field"><label for="${p}Prov">Province</label><select id="${p}Prov" class="input" data-in="geoProv" data-p="${p}"><option value="">Choisir…</option>${RDC.map(e => `<option ${e.p === g.province ? 'selected' : ''}>${e.p}</option>`).join('')}</select></div>
      <div class="field"><label for="${p}Terr">Territoire ou ville</label><select id="${p}Terr" class="input">${geoOptions(g.province, curT)}</select></div>
    </div>
    <div class="grid2">
      <div class="field"><label for="${p}Sect">Secteur ou chefferie ${opt}</label><input id="${p}Sect" class="input" list="${p}SectL" value="${esc(g.secteur || '')}" autocomplete="off">${dl(p + 'SectL', 'secteur')}</div>
      <div class="field"><label for="${p}Grp">Groupement ${opt}</label><input id="${p}Grp" class="input" list="${p}GrpL" value="${esc(g.groupement || '')}" autocomplete="off">${dl(p + 'GrpL', 'groupement')}</div>
    </div>
    <div class="field"><label for="${p}V">Village ou quartier</label><input id="${p}V" class="input" list="${p}VL" value="${esc(g.village || '')}" autocomplete="off" placeholder="Ex. Kirumba">${dl(p + 'VL', 'village')}</div>`;
}
INP.geoProv = el => { const t = document.getElementById(el.dataset.p + 'Terr'); if (t) t.innerHTML = geoOptions(el.value, ''); };
function readGeo(p) {
  const raw = fval(p + 'Terr') || '';
  const [k, ...rest] = raw.split(':');
  return {
    province: fval(p + 'Prov') || '', territoire: rest.join(':'), entite: ENTITE[k] || '',
    secteur: (fval(p + 'Sect') || '').trim(), groupement: (fval(p + 'Grp') || '').trim(), village: (fval(p + 'V') || '').trim().replace(/\s+/g, ' ')
  };
}
