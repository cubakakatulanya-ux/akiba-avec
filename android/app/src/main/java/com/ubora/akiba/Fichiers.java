package com.ubora.akiba;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;

/**
 * Faire sortir un fichier de l'application.
 *
 * C'est tout le chemin de la synchronisation : le cahier qu'un groupe envoie à son animateur, la
 * sauvegarde, l'export Excel. Dans un navigateur, la page s'en sort seule — un lien de
 * téléchargement, ou la feuille de partage du téléphone. Dans une WebView, ni l'un ni l'autre
 * n'existe : le lien ne fait rien et {@code navigator.share} n'y est pas. Sans cette classe,
 * l'application installée sur un terminal ne pouvait envoyer aucun cahier.
 *
 * Le fichier est écrit dans le cache de l'application, puis offert aux autres applications par
 * un FileProvider — WhatsApp, Bluetooth, Fichiers, Drive. Akiba ne demande donc toujours aucune
 * autorisation sur le téléphone : elle n'écrit que chez elle, et c'est l'utilisateur qui décide
 * où le fichier part.
 */
final class Fichiers {

  private Fichiers() { }

  /** Écrit le fichier et ouvre le choix « Envoyer avec… ». Rend false si rien n'a pu partir. */
  static boolean partager(Activity a, String nom, String base64, String type) {
    if (a == null || nom == null || base64 == null) return false;
    try {
      /* un nom de fichier, pas un chemin : on ne laisse pas la page écrire ailleurs */
      String propre = nom.replace('/', '-').replace('\\', '-').replace("..", "-");
      File dossier = new File(a.getCacheDir(), "partage");
      if (!dossier.exists() && !dossier.mkdirs()) return false;
      vider(dossier);                                   // un fichier par envoi : rien ne traîne
      File f = new File(dossier, propre);
      try (FileOutputStream sortie = new FileOutputStream(f)) {
        sortie.write(Base64.decode(base64, Base64.DEFAULT));
      }
      Uri u = FileProvider.getUriForFile(a, a.getPackageName() + ".fichiers", f);
      Intent envoi = new Intent(Intent.ACTION_SEND);
      envoi.setType(type == null || type.isEmpty() ? "application/octet-stream" : type);
      envoi.putExtra(Intent.EXTRA_STREAM, u);
      envoi.putExtra(Intent.EXTRA_SUBJECT, propre);
      envoi.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      Intent choix = Intent.createChooser(envoi, "Envoyer " + propre);
      choix.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      a.startActivity(choix);
      return true;
    } catch (Exception e) {
      return false;                                     // la page dira honnêtement que rien n'est sorti
    }
  }

  /** Les fichiers déjà partagés n'ont plus de raison d'être : ils contiennent le cahier. */
  private static void vider(File dossier) {
    File[] anciens = dossier.listFiles();
    if (anciens == null) return;
    for (File f : anciens) { try { f.delete(); } catch (Exception e) { /* tant pis */ } }
  }
}
