/* Akiba AVEC — le point GPS du groupe, pris sans réseau.
   La puce GPS du téléphone lit les satellites : elle n'a besoin d'aucune connexion. Ce qui demande du réseau,
   c'est de transformer des coordonnées en nom de lieu et d'afficher une carte ; on n'en fait ni l'un ni l'autre.
   Le point est écrit dans le journal scellé : il se vérifie comme le reste, et il part avec les données. */
'use strict';

const GPS_DELAI = 90000;                                            // 90 s : un premier point sans réseau est long à venir
const gpsDispo = () => typeof navigator !== 'undefined' && !!navigator.geolocation;
const gpsCoord = n => (n >= 0 ? '' : '-') + Math.abs(n).toFixed(5);
const gpsTexte = g => g ? gpsCoord(g.lat) + ', ' + gpsCoord(g.lon) : '';
const gpsPrecision = g => g && g.acc ? 'à ' + Math.round(g.acc) + ' m près' : '';
/* lien vers une carte : il ne s'ouvre qu'avec du réseau, mais les coordonnées restent lisibles sans */
const gpsLien = g => 'https://www.openstreetmap.org/?mlat=' + g.lat + '&mlon=' + g.lon + '#map=17/' + g.lat + '/' + g.lon;

/* enregistre un point et le scelle dans le journal ; séparé de la prise de mesure pour pouvoir l'essayer */
function gpsEnregistrer(avec, c, by) {
  const g = { lat: +(+c.latitude).toFixed(6), lon: +(+c.longitude).toFixed(6), acc: c.accuracy == null ? null : Math.round(c.accuracy), ts: Date.now() };
  avec.gps = g;
  appendTx(avec, { type: 'GEO', amount: 0, lat: g.lat, lon: g.lon, acc: g.acc, by: by || null, note: 'Point GPS ' + gpsTexte(g) + (g.acc ? ' (' + gpsPrecision(g) + ')' : '') });
  DB.save();
  return g;
}

/* la mesure elle-même : une seule lecture, la meilleure précision possible */
function gpsMesurer() {
  return new Promise((ok, non) => {
    if (!gpsDispo()) return non(new Error("Ce téléphone ne donne pas sa position à l'application."));
    navigator.geolocation.getCurrentPosition(
      p => ok(p.coords),
      e => {
        const m = e && e.code === 1 ? "Autorisation refusée. Dans les réglages du téléphone, autorisez la position pour Akiba."
          : e && e.code === 3 ? "Pas de point après une minute et demie. Sortez à ciel ouvert, loin des murs et des grands arbres, et réessayez."
            : "Position indisponible. Vérifiez que le GPS du téléphone est allumé.";
        non(new Error(m));
      },
      { enableHighAccuracy: true, timeout: GPS_DELAI, maximumAge: 0 });
  });
}

/* le bloc affiché dans la fiche « Lieu du groupe » */
function gpsBloc(avec) {
  const g = avec.gps;
  const bouton = `<button class="btn ${g ? 'ghost' : 'primary'} block" data-act="gpsTake">${ic('map')} ${g ? 'Reprendre le point' : 'Prendre le point GPS'}</button>`;
  if (!g) return `<div class="card"><div class="row between"><div><b>Point GPS</b><p class="hint" style="margin:2px 0 0">Pas encore pris. Fonctionne sans réseau, dehors, en une minute.</p></div></div>${bouton}</div>`;
  return `<div class="card"><div class="row between"><div><b>Point GPS</b>
      <p class="hint" style="margin:2px 0 0">Pris le ${fdate(g.ts)}${g.acc ? ' · ' + gpsPrecision(g) : ''}</p></div>
      <span class="chip good">${ic('check')} Enregistré</span></div>
    <p class="mono" style="font-size:1.05rem;margin:10px 0 4px">${gpsTexte(g)}</p>
    <a class="linkbtn" href="${gpsLien(g)}" target="_blank" rel="noopener">Voir sur une carte (demande du réseau)</a>
    ${bouton}</div>`;
}

ACT.gpsTake = async () => {
  const { avec, me } = cur();
  if (!isBureau(me)) return App.toast('Réservé au bureau');
  if (!gpsDispo()) return App.toast("Ce téléphone ne donne pas sa position");
  App.toast('Recherche des satellites… restez dehors');
  const btn = document.querySelector('[data-act="gpsTake"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Recherche en cours…'; }
  try {
    const c = await gpsMesurer();
    const g = gpsEnregistrer(avec, c, me.id);
    App.toast('Point enregistré · ' + gpsTexte(g));
  } catch (e) {
    App.toast(e.message);
  }
  if (App.sheet) ACT.placeSheet(); else render();
};
