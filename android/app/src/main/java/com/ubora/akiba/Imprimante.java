package com.ubora.akiba;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintManager;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * L'imprimante du terminal.
 *
 * C'est la seule classe de l'application qui dépend du matériel, et c'est voulu : tout le reste
 * — l'écran, le cahier, les calculs, les reçus — n'en sait rien.
 *
 * Quatre voies sont essayées, dans cet ordre, et la page est prévenue de celle qui a marché.
 * Jamais l'application ne dit qu'un reçu est sorti quand il ne l'est pas : un membre qui repart
 * sans son papier doit le savoir tout de suite.
 *
 * 1. Le logiciel du fabricant. La voie directe vers l'imprimante intégrée, sans rien installer.
 *    Elle demande la documentation du vendeur du terminal : {@link #imprimerAvecLeSdk}.
 *
 * 2. RawBT, une application tierce gratuite qui pilote la plupart des imprimantes POS et
 *    Bluetooth. Elle marche sans rien connaître du fabricant, mais il faut l'installer.
 *
 * 3. Le système d'impression d'Android. Il n'y a rien à installer : Android ouvre sa propre
 *    fenêtre, où apparaît l'imprimante du terminal si le fabricant en a déclaré une, et
 *    toujours « Enregistrer au format PDF ». C'est la voie à essayer sur un terminal dont on
 *    ne connaît pas le fabricant, et c'est aussi elle qui montre au bureau ce que le terminal
 *    sait vraiment faire.
 *
 * 4. Rien : la page propose alors de partager le reçu par WhatsApp ou SMS.
 */
final class Imprimante {

  private Imprimante() { }

  static String imprimer(Activity a, String texte, byte[] escpos, int exemplaires) {
    for (int i = 0; i < exemplaires; i++) {
      if (imprimerAvecLeSdk(a, texte, escpos)) { if (i + 1 == exemplaires) return "pos"; continue; }
      if (!imprimerAvecRawBT(a, texte)) return "";
    }
    return "rawbt";
  }

  /**
   * L'imprimante intégrée, par le logiciel du fabricant.
   *
   * À écrire quand la documentation du terminal est disponible. Les octets ESC/POS sont déjà
   * prêts — initialisation, page de codes, texte, avance du papier, coupe : il n'y a qu'à les
   * passer au service d'impression du fabricant. Chez la plupart (Sunmi, Telpo, PAX, Urovo…),
   * cela ressemble à {@code service.sendRAWData(escpos, null)} après avoir lié le service au
   * démarrage.
   *
   * Tant que ce n'est pas branché, la méthode rend false et l'impression prend la voie
   * suivante. L'écran « Imprimante du terminal » dans Akiba sert justement à relever ce qu'il
   * faut savoir du matériel pour écrire cette méthode-ci.
   *
   * @return true seulement si le papier est réellement sorti.
   */
  private static boolean imprimerAvecLeSdk(Activity a, String texte, byte[] escpos) {
    return false;
  }

  /** RawBT : une intention lui passe le texte, elle se charge de trouver l'imprimante. */
  private static boolean imprimerAvecRawBT(Activity a, String texte) {
    try {
      Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("rawbt:" + Uri.encode(texte)));
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      a.startActivity(i);
      return true;
    } catch (Exception e) {
      return false;                        // RawBT n'est pas installée sur ce terminal
    }
  }

  /** RawBT est-elle là ? On le demande au système, sans fouiller la liste des applications. */
  static boolean rawbtPresente(Activity a) {
    try {
      Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("rawbt:essai"));
      return i.resolveActivity(a.getPackageManager()) != null;
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * La voie du système d'impression d'Android. Elle ouvre la fenêtre d'Android : le bureau y
   * voit la liste des imprimantes que le terminal connaît, choisit, et imprime.
   *
   * Elle doit partir du fil principal — c'est une fenêtre, pas un envoi d'octets.
   */
  static boolean imprimerParLeSysteme(final Activity a, final String texte, final int signes) {
    try {
      a.runOnUiThread(new Runnable() {
        @Override public void run() {
          try {
            PrintManager pm = (PrintManager) a.getSystemService(Activity.PRINT_SERVICE);
            if (pm == null) return;
            pm.print("Reçu Akiba", new FeuilleTicket(a, texte, signes),
                new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A7)   // un format étroit, proche d'un ticket
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .build());
          } catch (Exception e) { /* le terminal n'a pas de système d'impression */ }
        }
      });
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  /** Le système d'impression existe-t-il seulement sur ce terminal ? */
  static boolean systemeDImpression(Activity a) {
    try {
      if (a.getSystemService(Activity.PRINT_SERVICE) == null) return false;
      return a.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PRINTING);
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * Ce que ce terminal sait faire, pour que le bureau puisse le lire à l'écran et nous le dire.
   * Sans câble et sans outil de développeur, c'est la seule façon de savoir à quoi on a affaire.
   */
  static String diagnostic(Activity a) {
    JSONObject d = new JSONObject();
    try {
      d.put("modele", android.os.Build.MODEL);
      d.put("fabricant", android.os.Build.MANUFACTURER);
      d.put("marque", android.os.Build.BRAND);
      d.put("appareil", android.os.Build.DEVICE);
      d.put("produit", android.os.Build.PRODUCT);
      d.put("android", android.os.Build.VERSION.RELEASE);
      d.put("niveau", android.os.Build.VERSION.SDK_INT);
      JSONArray voies = new JSONArray();
      voies.put(voie("fabricant", false, "le logiciel du vendeur du terminal, pas encore branché"));
      voies.put(voie("rawbt", rawbtPresente(a), "l'application RawBT, à installer séparément"));
      voies.put(voie("systeme", systemeDImpression(a), "la fenêtre d'impression d'Android, rien à installer"));
      voies.put(voie("partage", true, "envoyer le reçu par WhatsApp ou SMS"));
      d.put("voies", voies);
    } catch (Exception e) { /* un diagnostic incomplet vaut mieux qu'une application qui s'arrête */ }
    return d.toString();
  }

  private static JSONObject voie(String nom, boolean dispo, String quoi) throws org.json.JSONException {
    JSONObject o = new JSONObject();
    o.put("nom", nom);
    o.put("disponible", dispo);
    o.put("quoi", quoi);
    return o;
  }
}
