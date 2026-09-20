/* Akiba AVEC — export Excel (.xlsx) pour l'organisation et l'animateur, sans réseau ni bibliothèque */
'use strict';

/* ---------- petit générateur XLSX (zip sans compression) ---------- */
const XL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], dir = [];
  const d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
    dir.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  });
  const dirLen = dir.reduce((a, x) => a + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, dirLen, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...dir, new Uint8Array(e.buffer)], { type: XL_MIME });
}
const xmlEsc = s => Array.from(String(s ?? '')).filter(ch => { const c = ch.charCodeAt(0); return c > 31 || c === 9 || c === 10 || c === 13; }).join('').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const xlDate = ts => (ts - new Date(ts).getTimezoneOffset() * 60000) / 864e5 + 25569;
// styles : 1 en-tête, 2 nombre, 3 pourcentage, 4 date, 5 texte en gras
const XL_STYLE = { s: 0, n: 2, p: 3, d: 4, b: 5 };
function sheetXml(cols, rows) {
  const cell = (v, t, r, c) => {
    const ref = colName(c) + r;
    if (v && typeof v === 'object') { t = v.t; v = v.v; }   // type propre à la cellule
    if (v === null || v === undefined || v === '') return '';
    if (t === 'n' || t === 'p' || t === 'd') {
      const num = t === 'd' ? xlDate(v) : +v;
      return isFinite(num) ? `<c r="${ref}" s="${XL_STYLE[t]}"><v>${Math.round(num * 10000) / 10000}</v></c>` : '';
    }
    return `<c r="${ref}" t="inlineStr"${t === 'b' ? ' s="5"' : ''}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
  };
  const head = `<row r="1">${cols.map((c, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${xmlEsc(c.h)}</t></is></c>`).join('')}</row>`;
  const body = rows.map((row, ri) => `<row r="${ri + 2}">${cols.map((c, ci) => cell(row[ci], c.t || 's', ri + 2, ci)).join('')}</row>`).join('');
  const last = colName(cols.length - 1) + (rows.length + 1);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    + `<cols>${cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.w || 14}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${head}${body}</sheetData>${rows.length ? `<autoFilter ref="A1:${last}"/>` : ''}</worksheet>`;
}
function buildXlsx(sheets) {
  const W = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>` },
    { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Akiba — export des AVEC</dc:title><dc:creator>Akiba · Entreprise Sociale Ubora</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${W}" xmlns:r="${R}"><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${R}/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${W}"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F4D3A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` }
  ];
  sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s.cols, s.rows) }));
  return zipStore(files);
}

/* ---------- données exportées ---------- */
const STATUS_TXT = { active: 'Active', pending: 'À valider', refused: 'Refusée' };
function exportScope(p) {
  const u = me_user();
  let avecs = myAvecs(u);
  if (p && p.anim) avecs = avecs.filter(a => a.animId === p.anim);
  return { u, avecs };
}
function exportSheets(avecs) {
  const animName = a => a.animId ? ((userById(a.animId) || {}).name || '—') : 'AVEC autonome';
  const rows = avecs.map(a => ({ a, st: stats(a, { syncedOnly: true }) }));
  // la synthèse suit le tableau de bord : seulement les AVEC actives
  const act = rows.filter(r => isActive(r.a));
  const T = f => act.reduce((s, r) => s + f(r), 0);
  const members = T(r => r.st.activeCount), women = T(r => r.st.women), outstanding = T(r => r.st.outstanding), late = T(r => r.st.lateAmt);
  const org = orgOf(me_user().orgId);
  const synth = {
    name: 'Synthèse', cols: [{ h: 'Indicateur', w: 34 }, { h: 'Valeur', w: 22 }],
    rows: [
      ['Organisation', org ? org.name : '—'], ['Exporté par', me_user().name], ['Date de l\'export', Date.now()],
      ['AVEC actives', act.length], ['AVEC à valider ou refusées', rows.length - act.length], ['Membres actifs', members], ['Dont femmes', members ? women / members : 0],
      ['Épargne du cycle en cours (FC)', T(r => r.st.sum.EPARGNE)], ['Crédits en cours (FC)', outstanding], ['Crédits en retard (FC)', late],
      ['Portefeuille à risque (PAR)', outstanding ? late / outstanding : 0], ['Caisses sociales (FC)', T(r => r.st.socialFund)], ['Argent en caisse (FC)', T(r => r.st.cash)],
      ['Modules de formation réalisés', act.length ? T(r => trainingCount(r.a)) / (act.length * 7) : 0],
      ['Source', 'Réunions reçues par l\'organisation (données envoyées par les AVEC)']
    ]
  };
  // types de la colonne Valeur, ligne par ligne
  const synthTypes = ['s', 's', 'd', 'n', 'n', 'n', 'p', 'n', 'n', 'n', 'p', 'n', 'n', 'p', 's'];
  synth.rows = synth.rows.map((r, i) => [r[0], { v: r[1], t: synthTypes[i] }]);

  const avecSheet = {
    name: 'AVEC', cols: [
      { h: 'AVEC', w: 26 }, { h: 'Statut', w: 11 }, { h: 'Animateur', w: 22 }, { h: 'Province', w: 14 }, { h: 'Territoire / ville', w: 18 }, { h: 'Village / quartier', w: 18 },
      { h: 'Jour de réunion', w: 14 }, { h: 'Cycle n°', w: 9, t: 'n' }, { h: 'Début du cycle', w: 13, t: 'd' }, { h: 'Fin prévue', w: 13, t: 'd' },
      { h: 'Membres actifs', w: 10, t: 'n' }, { h: 'Femmes', w: 9, t: 'n' }, { h: 'Réunions reçues', w: 10, t: 'n' }, { h: 'Dernière réunion', w: 13, t: 'd' }, { h: 'Présence', w: 10, t: 'p' },
      { h: 'Valeur de la part achetée (FC)', w: 14, t: 'n' }, { h: 'Parts', w: 9, t: 'n' }, { h: 'Épargne (FC)', w: 13, t: 'n' }, { h: 'Valeur actuelle d\'une part (FC)', w: 14, t: 'n' },
      { h: 'Crédits en cours (nombre)', w: 10, t: 'n' }, { h: 'Crédits en cours (FC)', w: 13, t: 'n' }, { h: 'En retard (FC)', w: 12, t: 'n' }, { h: 'PAR', w: 8, t: 'p' },
      { h: 'Intérêts reçus (FC)', w: 12, t: 'n' }, { h: 'Amendes payées (FC)', w: 12, t: 'n' }, { h: 'Caisse sociale (FC)', w: 12, t: 'n' }, { h: 'Aides versées (FC)', w: 12, t: 'n' },
      { h: 'Argent en caisse (FC)', w: 13, t: 'n' }, { h: 'Écarts de caisse', w: 10, t: 'n' }, { h: 'Formation (modules sur 7)', w: 11, t: 'n' }, { h: 'Visites de l\'animateur', w: 10, t: 'n' },
      { h: 'Crédit extérieur restant (FC)', w: 13, t: 'n' }, { h: 'Frais du crédit extérieur (FC)', w: 13, t: 'n' }
    ],
    rows: rows.map(({ a, st }) => [a.name, STATUS_TXT[a.status || 'active'] || a.status, animName(a), a.province, a.territoire, a.village,
      a.settings.meetingDay, a.cycle.n, a.cycle.start, cycleEnd(a), st.activeCount, st.women, st.meetings.length, st.last ? st.last.date : null, st.attendance,
      a.settings.partValue, st.parts, st.sum.EPARGNE, Math.round(st.shareValue), st.activeLoans.length, st.outstanding, st.lateAmt, st.par,
      st.interest, st.sum.AMENDE, st.socialFund, st.sum.AIDE, st.cash, st.ecarts.length, trainingCount(a), (a.visits || []).length, st.extDebt, st.sum.EXT_FEE])
  };
  const extSheet = {
    name: 'Crédits extérieurs', cols: [{ h: 'AVEC', w: 24 }, { h: 'Prêteur', w: 24 }, { h: 'Décision de l\'AG', w: 40 }, { h: 'Date', w: 12, t: 'd' }, { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Intérêt par mois', w: 9, t: 'p' }, { h: 'Durée (mois)', w: 9, t: 'n' },
      { h: 'Frais (FC)', w: 11, t: 'n' }, { h: 'Garantie retenue (FC)', w: 13, t: 'n' }, { h: 'Total dû (FC)', w: 12, t: 'n' }, { h: 'Remboursé (FC)', w: 12, t: 'n' }, { h: 'Reste (FC)', w: 11, t: 'n' }, { h: 'Échéance', w: 12, t: 'd' }, { h: 'Situation', w: 11 }],
    rows: rows.flatMap(({ a, st }) => st.extList.map(e => [a.name, e.lender, e.ag, e.ts, e.principal, e.rate / 100, e.months, e.fees, e.guar, e.due, e.paid, e.remaining, e.dueDate, e.status === 'solde' ? 'Remboursé' : e.status === 'retard' ? 'En retard' : 'En cours']))
  };

  const memberSheet = {
    name: 'Membres', cols: [
      { h: 'AVEC', w: 24 }, { h: 'Nom', w: 26 }, { h: 'Sexe', w: 7 }, { h: 'Âge', w: 7, t: 'n' }, { h: 'Téléphone', w: 16 }, { h: 'Activité', w: 18 }, { h: 'Adresse', w: 22 },
      { h: 'Rôle', w: 20 }, { h: 'Situation', w: 10 }, { h: 'Parts', w: 8, t: 'n' }, { h: 'Épargne (FC)', w: 12, t: 'n' }, { h: 'Valeur si partage (FC)', w: 13, t: 'n' },
      { h: 'Caisse sociale versée (FC)', w: 13, t: 'n' }, { h: 'Amendes payées (FC)', w: 12, t: 'n' }, { h: 'Amendes dues (FC)', w: 12, t: 'n' },
      { h: 'Crédit en cours (FC)', w: 13, t: 'n' }, { h: 'Jours de retard', w: 9, t: 'n' }
    ],
    rows: rows.flatMap(({ a, st }) => a.members.map(m => {
      const d = st.mem[m.id] || { parts: 0, savings: 0, social: 0, fines: 0, fineDebt: 0, loans: [] };
      const open = d.loans.filter(l => l.status !== 'solde');
      return [a.name, m.name, m.sex === 'M' ? 'H' : 'F', ageOf(m), hasPhone(m) ? m.phone : '', m.activity || '', m.address || '', roleLabel(m), m.left ? 'Parti' : 'Actif',
        d.parts, d.savings, Math.round(d.parts * st.shareValue), d.social, d.fines, Math.max(0, d.fineDebt),
        open.reduce((s, l) => s + l.remaining, 0), open.reduce((s, l) => Math.max(s, l.daysLate), 0)];
    }))
  };

  const meetSheet = {
    name: 'Réunions', cols: [
      { h: 'AVEC', w: 24 }, { h: 'Réunion n°', w: 9, t: 'n' }, { h: 'Date', w: 12, t: 'd' }, { h: 'Type', w: 16 }, { h: 'Présents', w: 9, t: 'n' }, { h: 'Retards', w: 8, t: 'n' }, { h: 'Absents', w: 8, t: 'n' },
      { h: 'Épargne (FC)', w: 12, t: 'n' }, { h: 'Caisse sociale (FC)', w: 12, t: 'n' }, { h: 'Remboursements (FC)', w: 13, t: 'n' }, { h: 'Amendes (FC)', w: 11, t: 'n' },
      { h: 'Crédits accordés (FC)', w: 13, t: 'n' }, { h: 'Aides (FC)', w: 10, t: 'n' },
      { h: 'Caisse attendue (FC)', w: 13, t: 'n' }, { h: 'Caisse comptée (FC)', w: 13, t: 'n' }, { h: 'Écart (FC)', w: 10, t: 'n' }, { h: 'Explication', w: 36 }
    ],
    rows: rows.flatMap(({ a, st }) => {
      const an = new Set(a.tx.filter(t => t.type === 'ANNUL').map(t => t.ref));
      const byMeet = {};
      a.tx.forEach(t => { if (t.type === 'ANNUL' || an.has(t.id) || !t.meetingId) return; const b = byMeet[t.meetingId] = byMeet[t.meetingId] || {}; b[t.type] = (b[t.type] || 0) + t.amount; });
      return st.meetings.map(m => {
        const pr = Object.values(m.presence || {}), b = byMeet[m.id] || {};
        return [a.name, m.n, m.date, m.kind === 'partage' ? 'Partage' : m.kind === 'reprise' ? 'Reprise du cahier' : 'Réunion',
          pr.filter(x => x === 'P').length, pr.filter(x => x === 'R').length, pr.filter(x => x === 'A').length,
          b.EPARGNE || 0, b.SOCIAL || 0, b.REMB || 0, b.AMENDE || 0, b.CREDIT || 0, b.AIDE || 0,
          m.closeExpected, m.closeCount, (m.closeCount || 0) - (m.closeExpected || 0), m.note || ''];
      });
    })
  };

  const loanSheet = {
    name: 'Crédits', cols: [
      { h: 'AVEC', w: 24 }, { h: 'Membre', w: 24 }, { h: 'Date du crédit', w: 13, t: 'd' }, { h: 'Montant (FC)', w: 12, t: 'n' }, { h: 'Intérêt par mois', w: 10, t: 'p' }, { h: 'Durée (mois)', w: 9, t: 'n' },
      { h: 'Total à rembourser (FC)', w: 14, t: 'n' }, { h: 'Remboursé (FC)', w: 13, t: 'n' }, { h: 'Reste (FC)', w: 12, t: 'n' }, { h: 'Échéance finale', w: 13, t: 'd' },
      { h: 'Situation', w: 11 }, { h: 'Jours de retard', w: 9, t: 'n' }
    ],
    rows: rows.flatMap(({ a, st }) => st.loanList.map(l => [a.name, (memberOf(a, l.memberId) || {}).name || '—', l.ts, l.principal, (l.rate || 0) / 100, l.months,
      l.due, l.paid, l.remaining, l.dueDate, l.status === 'solde' ? 'Soldé' : l.status === 'retard' ? 'En retard' : 'En cours', l.daysLate]))
  };

  const trainSheet = {
    name: 'Formation', cols: [{ h: 'AVEC', w: 24 }, { h: 'Animateur', w: 22 }, { h: 'Modules réalisés', w: 10, t: 'n' },
      ...MODULES.map(m => ({ h: `M${m.n} · ${m.t}`, w: 16, t: 'd' }))],
    rows: rows.map(({ a }) => [a.name, animName(a), trainingCount(a), ...MODULES.map(m => ((a.trainings || {})[m.id] || {}).ts || null)])
  };

  const alertSheet = {
    name: 'Alertes', cols: [{ h: 'AVEC', w: 24 }, { h: 'Niveau', w: 10 }, { h: 'Alerte', w: 34 }, { h: 'Détail', w: 60 }],
    rows: rows.flatMap(({ a, st }) => health(a, st, chainOf(a)).alerts.sort((x, y) => LVL[x.lvl] - LVL[y.lvl]).map(al => [a.name, al.lvl === 'bad' ? 'Urgent' : 'À surveiller', al.title, al.detail]))
  };
  return [synth, avecSheet, memberSheet, meetSheet, loanSheet, extSheet, trainSheet, alertSheet];
}
function exportFile(p) {
  const { u, avecs } = exportScope(p);
  const sheets = exportSheets(avecs);
  const org = orgOf(u.orgId);
  const slug = String((org && org.name) || u.name).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { blob: buildXlsx(sheets), sheets, name: `Akiba-${slug}-${isoDay(Date.now())}.xlsx` };
}

/* ---------- écran ---------- */
ACT.exportSheet = d => {
  const u = me_user();
  if (!u || (u.role !== 'org' && u.role !== 'anim')) return App.toast('Réservé à l\'organisation et aux animateurs');
  const { avecs } = exportScope(d);
  const who = d.anim ? ((userById(d.anim) || {}).name || '') : '';
  const canShare = !!(navigator.canShare && window.File && (() => { try { return navigator.canShare({ files: [new File(['x'], 'a.xlsx', { type: XL_MIME })] }); } catch (e) { return false; } })());
  App.exportArg = d.anim ? { anim: d.anim } : {};
  App.openSheet(`<h2>Exporter vers Excel</h2>
    <p class="muted">${avecs.length} AVEC${who ? ' de ' + esc(who) : ''} · fichier .xlsx qui s'ouvre dans Excel, Google Sheets ou WPS, même sans réseau.</p>
    <div class="list">${[['chart', 'Synthèse', 'Les chiffres clés de l\'organisation'], ['building', 'AVEC', 'Épargne, crédits, PAR, caisse, formation'], ['users', 'Membres', 'Fiches, parts, épargne, crédit de chacun'],
      ['calendar', 'Réunions', 'Présences, montants, écarts de caisse'], ['coins', 'Crédits', 'Montant, remboursé, reste, retards'], ['building', 'Crédits extérieurs', 'IMF, décision de l\'AG, frais, reste dû'], ['clip', 'Formation', 'Date de chaque module'], ['alert', 'Alertes', 'Ce qui demande une action']]
      .map(([i, t, s]) => `<div class="li"><span class="xl-ic">${ic(i)}</span><span class="grow"><b>${t}</b><span class="small muted">${s}</span></span></div>`).join('')}</div>
    <p class="hint">Chiffres des réunions reçues par l'organisation. Les données personnelles des membres sont sensibles : partagez ce fichier seulement avec les personnes autorisées.</p>
    <button class="btn primary block xl" data-act="exportDownload">${ic('chart')} Télécharger le fichier Excel</button>
    ${canShare ? `<button class="btn ghost block" data-act="exportShare">${ic('sync')} Partager (WhatsApp, e-mail…)</button>` : ''}`);
};
ACT.exportDownload = () => {
  const f = exportFile(App.exportArg);
  const url = URL.createObjectURL(f.blob), a = document.createElement('a');
  a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  App.sheet = null; render();
  App.toast(`${f.name} enregistré dans les Téléchargements`);
};
ACT.exportShare = async () => {
  const f = exportFile(App.exportArg);
  try {
    await navigator.share({ files: [new File([f.blob], f.name, { type: XL_MIME })], title: 'Akiba — export des AVEC', text: 'Données Akiba (fichier Excel)' });
    App.sheet = null; render();
  } catch (e) { if (e && e.name !== 'AbortError') App.toast('Partage impossible : utilisez « Télécharger »'); }
};
