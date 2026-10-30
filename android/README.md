# Akiba en application Android

Ce dossier transforme Akiba en une vraie application Android (`.apk`), installable sur un
terminal POS ou un téléphone, **sans passer par le Play Store**.

## Pourquoi une application, puisque Akiba marche déjà dans le navigateur ?

Trois raisons, dans l'ordre où elles se présentent sur le terrain.

**L'icône.** Sur beaucoup de terminaux POS, le lanceur n'affiche que les applications
réellement installées et ignore les raccourcis créés par le navigateur. Le groupe installe
Akiba, et ne la retrouve pas sur l'écran. Une application installée apparaît toujours.

**L'imprimante.** L'imprimante intégrée d'un terminal POS n'est pas accessible depuis une page
web : elle se pilote par le logiciel du fabricant. L'application fait le pont — elle expose
`window.AkibaPOS.print(...)`, qu'Akiba appelle déjà depuis des mois.

**Le hors-ligne, garanti.** Les fichiers d'Akiba sont *dans* l'application. Il n'y a rien à
télécharger au premier lancement, rien à mettre en cache, rien qui dépende du réseau — ce qui
compte quand le premier démarrage se fait dans un village sans couverture.

## Ce qui ne change pas

**Les données déjà saisies sont retrouvées.** L'application sert les fichiers sous l'adresse
`https://akiba.uborardc.com`, la même que le site, grâce à `WebViewAssetLoader`. Pour le
navigateur, c'est la même origine : le cahier déjà enregistré sur ce terminal est là, avec ses
réunions, ses écritures et ses codes. Rien à transférer, rien à ressaisir.

C'est la raison pour laquelle le domaine est écrit en dur dans `MainActivity.java`. **Ne le
changez pas** sans comprendre que cela couperait l'application des données existantes.

## Ce que ce dossier contient

```
android/
  app/src/main/java/com/ubora/akiba/MainActivity.java   l'écran : une WebView plein écran
  app/src/main/java/com/ubora/akiba/PontPOS.java        le pont window.AkibaPOS
  app/src/main/java/com/ubora/akiba/Imprimante.java     l'imprimante — la seule classe à adapter
  app/src/main/res/                                     icônes, thème, textes
  app/build.gradle, build.gradle, settings.gradle       la construction
```

Les fichiers d'Akiba ne sont pas recopiés ici : la construction les prend dans `docs/`, qui est
la version déjà en ligne. Il n'y a donc jamais deux versions à tenir à jour.

## Construire l'application

### Sans rien installer, par GitHub

Le dépôt contient `.github/workflows/android.yml`. Il part tout seul dès que la page ou le dossier
`android/` changent, et se lance aussi à la main : onglet **Actions** du dépôt, *Application
Android*, bouton **Run workflow**.

GitHub compile, puis dépose le fichier dans `docs/akiba.apk` — c'est-à-dire sur le site lui-même.
L'animateur le prend donc depuis **akiba.uborardc.com/android.html**, avec le téléphone du groupe,
sans compte et sans boutique. Une copie est aussi gardée dans l'onglet Actions pendant trois mois,
pour pouvoir revenir en arrière si une version pose problème.

Le numéro de version suit le numéro de fabrication : chaque installation remplace la précédente sur
le terminal au lieu d'être refusée.

### Sur un ordinateur

Il faut Java 17 et le SDK Android (Android Studio les installe tous les deux).

```bash
cd android
gradle assembleRelease
```

Le fichier sort dans `android/app/build/outputs/apk/release/`.

## La suppression par erreur

Android ne laisse aucune application refuser sa propre désinstallation. La seule prise réelle est
le statut d'« application d'administration » : tant qu'Akiba l'a, le téléphone refuse de le
supprimer, et il faut d'abord venir retirer ce statut dans l'application. Une suppression reste
possible — mais plus d'un seul geste, et c'est tout ce qu'une application peut honnêtement
promettre.

Le bureau l'active lui-même, dans **Installer et protéger**. `GardeSuppression.java` ne réclame
aucun pouvoir en échange : la liste des pouvoirs, dans `res/xml/garde_suppression.xml`, est vide.
Akiba n'impose pas de mot de passe, n'efface rien à distance et ne surveille rien. C'est aussi
pourquoi le téléphone n'affiche aucune demande d'autorisation à l'installation : rien n'est réclamé
tant que le bureau ne le demande pas.

### Pour un parc de terminaux

Une organisation qui prépare ses terminaux peut aller plus loin : faire d'Akiba le *propriétaire de
l'appareil*. Le blocage devient alors impossible à défaire depuis les réglages du téléphone. Sur un
terminal remis à zéro et sans compte Google ajouté :

```bash
adb shell dpm set-device-owner com.ubora.akiba/.GardeSuppression
```

Akiba s'en aperçoit tout seul et bloque la désinstallation sans rien demander.

## L'imprimante

`Imprimante.java` essaie deux voies, dans cet ordre :

1. **RawBT**, une application tierce gratuite qui pilote la plupart des imprimantes POS et
   Bluetooth. Elle marche sans rien connaître du fabricant : c'est la voie livrée.
2. **Le logiciel du fabricant**, s'il est branché. C'est la seule partie du code qui dépend du
   modèle de terminal, et elle est isolée dans une seule méthode, `imprimerAvecLeSdk`.

Pour brancher le logiciel du fabricant, il faut sa documentation — demandez-la au vendeur du
terminal. La méthode reçoit les octets ESC/POS déjà prêts : il n'y a qu'à les passer au service
d'impression du fabricant, et rendre `true`.

Tant que ce n'est pas fait, installez RawBT sur le terminal et tout s'imprime.
