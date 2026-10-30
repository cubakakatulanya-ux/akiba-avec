package com.ubora.akiba;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
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

  /* ── Le verrou contre la suppression par erreur ──────────────────────────────────────────
     Android ne laisse aucune application refuser sa propre désinstallation. La seule prise
     réelle est le statut d'« application d'administration » : tant qu'Akiba l'a, le
     téléphone refuse de le supprimer, et il faut d'abord retirer ce statut. Le bureau
     l'active et le retire lui-même, depuis l'écran « Installer et protéger ».
     Akiba ne réclame aucun pouvoir avec ce statut : voir res/xml/garde_suppression.xml. */

  private ComponentName garde() { return new ComponentName(activite, GardeSuppression.class); }

  private DevicePolicyManager police() {
    return (DevicePolicyManager) activite.getSystemService(Context.DEVICE_POLICY_SERVICE);
  }

  /** Akiba est-il protégé en ce moment, et jusqu'où ? */
  @JavascriptInterface
  public String protection() {
    try {
      DevicePolicyManager p = police();
      boolean actif = p != null && p.isAdminActive(garde());
      boolean proprietaire = p != null && p.isDeviceOwnerApp(activite.getPackageName());
      return "{\"actif\":" + actif + ",\"proprietaire\":" + proprietaire + "}";
    } catch (Exception e) {
      return "{\"actif\":false,\"proprietaire\":false}";
    }
  }

  /**
   * Demander la protection. C'est le téléphone qui pose la question et qui décide : Akiba ne
   * fait qu'ouvrir l'écran. Rend "demande" si l'écran s'est ouvert, "deja" s'il n'y avait
   * rien à faire, et une chaîne vide si le terminal ne sait pas le faire.
   */
  @JavascriptInterface
  public String protegerSuppression() {
    try {
      DevicePolicyManager p = police();
      if (p == null) return "";
      if (p.isAdminActive(garde())) return "deja";
      /* Propriétaire de l'appareil (parc de terminaux préparé par l'organisation) : le blocage
         est direct et ne peut pas être défait depuis les réglages. */
      if (p.isDeviceOwnerApp(activite.getPackageName())) {
        p.setUninstallBlocked(garde(), activite.getPackageName(), true);
        return "deja";
      }
      Intent i = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
      i.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, garde());
      i.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, activite.getString(R.string.garde_explication));
      activite.startActivity(i);
      return "demande";
    } catch (Exception e) {
      return "";
    }
  }

  /** Retirer la protection, quand le groupe veut vraiment désinstaller Akiba. */
  @JavascriptInterface
  public String retirerProtection() {
    try {
      DevicePolicyManager p = police();
      if (p == null) return "";
      if (p.isDeviceOwnerApp(activite.getPackageName())) {
        p.setUninstallBlocked(garde(), activite.getPackageName(), false);
      }
      if (p.isAdminActive(garde())) p.removeActiveAdmin(garde());
      return "retiree";
    } catch (Exception e) {
      return "";
    }
  }

  /**
   * Ce que ce terminal sait faire, en clair. Sans câble ni outil de développeur, c'est la seule
   * façon de savoir à quoi on a affaire : le bureau ouvre l'écran « Imprimante du terminal »,
   * lit ce qui s'affiche, et le dit.
   */
  @JavascriptInterface
  public String diagnostic() {
    return Imprimante.diagnostic(activite);
  }

  /**
   * Imprimer par la fenêtre d'Android. Rien à installer : y apparaissent l'imprimante du
   * terminal si le fabricant en a déclaré une, et toujours l'enregistrement en PDF.
   */
  @JavascriptInterface
  public String imprimerSysteme(String demandeJson) {
    try {
      JSONObject d = new JSONObject(demandeJson);
      String texte = d.optString("text", "");
      int signes = d.optInt("signs", 32);
      return Imprimante.imprimerParLeSysteme(activite, texte, signes) ? "systeme" : "";
    } catch (Exception e) {
      return "";
    }
  }
}
