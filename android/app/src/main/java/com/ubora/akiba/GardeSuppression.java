package com.ubora.akiba;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

/**
 * Le verrou contre la suppression par erreur.
 *
 * Android ne laisse aucune application s'opposer à sa propre désinstallation — sauf une :
 * celle que le téléphone reconnaît comme « application d'administration ». Tant qu'elle l'est,
 * la désinstallation est refusée, et il faut d'abord retirer ce statut dans les réglages. Un
 * geste de trop pour une suppression par erreur, ce qui est exactement le but.
 *
 * Ce récepteur ne réclame aucun pouvoir : pas de mot de passe imposé, pas d'effacement à
 * distance, pas de caméra bloquée. La liste des pouvoirs, dans res/xml/garde_suppression.xml,
 * est volontairement vide. Il ne sert qu'à une chose : rendre la désinstallation délibérée.
 *
 * Le bureau l'active lui-même depuis l'écran « Installer et protéger », et peut le retirer au
 * même endroit le jour où le groupe veut vraiment désinstaller Akiba.
 */
public class GardeSuppression extends DeviceAdminReceiver {

  @Override public void onEnabled(Context c, Intent i) {
    Toast.makeText(c, R.string.garde_active, Toast.LENGTH_LONG).show();
  }

  @Override public void onDisabled(Context c, Intent i) {
    Toast.makeText(c, R.string.garde_retiree, Toast.LENGTH_LONG).show();
  }

  /** Ce qu'Android affiche au bureau au moment où il décide de retirer la protection. */
  @Override public CharSequence onDisableRequested(Context c, Intent i) {
    return c.getString(R.string.garde_avertissement);
  }
}
