package com.ubora.akiba;

import android.app.Activity;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;

/**
 * Le pont entre la page et le terminal : c'est ce que la page connaît sous le nom
 * {@code window.AkibaPOS}.
 *
 * Akiba l'appelle déjà depuis des mois, dans recu.js :
 *
 *   window.AkibaPOS.print({ text, escpos, copies })
 *
 * où {@code text} est le ticket en clair (sans accents, les imprimantes thermiques bon marché ne
 * les connaissent pas) et {@code escpos} les mêmes lignes en commandes d'imprimante, encodées en
 * base64 — initialisation, texte, avance du papier, coupe.
 *
 * Tout ce qui touche réellement l'imprimante est dans {@link Imprimante} : cette classe-ci ne
 * fait que recevoir l'appel, le traduire, et répondre honnêtement si rien n'a pu être imprimé.
 */
public class PontPOS {

  private final Activity activite;

  PontPOS(Activity a) { this.activite = a; }

  /**
   * Imprimer un ticket. Rend le nom de la voie utilisée, ou une chaîne vide si rien n'a pu être
   * imprimé — la page sait alors proposer le partage du texte, et ne prétend jamais qu'un reçu
   * est sorti quand il n'est pas sorti.
   */
  @JavascriptInterface
  public String print(String demandeJson) {
    try {
      JSONObject d = new JSONObject(demandeJson);
      String texte = d.optString("text", "");
      String escposB64 = d.optString("escpos", "");
      int exemplaires = Math.max(1, Math.min(5, d.optInt("copies", 1)));
      byte[] escpos = escposB64.isEmpty() ? null : Base64.decode(escposB64, Base64.DEFAULT);
      return Imprimante.imprimer(activite, texte, escpos, exemplaires);
    } catch (Exception e) {
      return "";
    }
  }

  /** Ce que le terminal sait faire. La page s'en sert pour ne proposer que ce qui existe. */
  @JavascriptInterface
  public String capacites() {
    return "{\"imprimante\":true,\"modele\":" + JSONObject.quote(android.os.Build.MODEL)
        + ",\"fabricant\":" + JSONObject.quote(android.os.Build.MANUFACTURER)
        + ",\"android\":" + android.os.Build.VERSION.SDK_INT + "}";
  }
}
