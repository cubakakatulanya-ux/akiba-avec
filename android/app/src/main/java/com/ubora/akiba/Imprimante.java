package com.ubora.akiba;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

/**
 * L'imprimante du terminal.
 *
 * C'est la seule classe de l'application qui dépend du modèle de terminal, et c'est voulu : tout
 * le reste — l'écran, le cahier, les calculs, les reçus — ne sait rien du matériel. Pour brancher
 * un nouveau terminal, il n'y a que {@link #imprimerAvecLeSdk} à écrire.
 *
 * Deux voies sont essayées, dans cet ordre.
 *
 * 1. Le logiciel du fabricant, s'il est branché. C'est la voie directe : l'imprimante intégrée,
 *    sans rien installer d'autre. Elle demande la documentation du vendeur du terminal.
 *
 * 2. RawBT, une application tierce gratuite qui pilote la plupart des imprimantes POS et
 *    Bluetooth. Elle marche sans rien connaître du fabricant, et c'est ce qui est livré.
 *
 * Si aucune des deux ne marche, on rend une chaîne vide : la page propose alors de partager le
 * reçu par WhatsApp ou SMS. Jamais l'application ne dit qu'un reçu est sorti quand il ne l'est
 * pas — un membre qui repart sans son papier doit le savoir tout de suite.
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
   * passer au service d'impression du fabricant.
   *
   * Chez la plupart des fabricants (Sunmi, Telpo, PAX, Urovo…), cela ressemble à :
   *
   *   service.sendRAWData(escpos, null);
   *
   * après avoir lié le service par AIDL au démarrage. Tant que ce n'est pas branché, la méthode
   * rend false et l'impression passe par RawBT — ce qui marche, simplement avec une application
   * de plus à installer sur le terminal.
   *
   * @return true seulement si le papier est réellement sorti.
   */
  private static boolean imprimerAvecLeSdk(Activity a, String texte, byte[] escpos) {
    return false;
  }

  /**
   * RawBT : on lui passe le texte par une intention. Elle se charge de trouver l'imprimante,
   * intégrée ou Bluetooth, et de la piloter.
   */
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
}
