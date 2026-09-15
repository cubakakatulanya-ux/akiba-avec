# Akiba AVEC

Le cahier des **Associations Villageoises d'Épargne et de Crédit (AVEC)** dans le téléphone, **même sans réseau**. Conçu pour la RDC.

*Application développée par l'**Entreprise Sociale Ubora**.*

## Assistance
**Ubora**, entreprise sociale : appel ou WhatsApp **0998 275 144** · contact@uborahub.com

## Ouvrir et installer
**https://cubakakatulanya-ux.github.io/akiba-avec/**

- **Libre à installer et à découvrir** : tout le monde peut ouvrir le lien, installer l'icône et essayer la démonstration.
- **Code de validation pour les vraies opérations** : pour créer le compte d'une organisation ou une AVEC réelle, Akiba demande un code délivré par l'Entreprise Sociale Ubora. Le code est signé numériquement et vérifié sur le téléphone, même sans internet.
- Voir [LANCER.md](LANCER.md) pour l'installation sur les téléphones.

## Fonctions
- **Réunion guidée en 8 étapes** : présences, comptage, caisse sociale, épargne en parts, remboursements, crédits, amendes, clôture à trois clés.
- **Registre scellé contre la fraude** : chaque écriture porte l'empreinte de la précédente ; toute modification est détectée.
- **Cycles** : partage de fin de cycle, nouveau cycle, historique.
- **Trois espaces** : AVEC (bureau et membres), animateur, organisation. Les AVEC autonomes n'ont besoin ni d'animateur ni d'organisation.
- **Création complète** : 26 provinces, 145 territoires et villes de la RDC ; fiches membres (âge, téléphone, activité, adresse facultatifs) ; bureau et porte-clés ; reprise d'un cahier papier.
- **Validation des AVEC** par l'organisation, même sans internet (code dicté par téléphone).
- **Transfert d'une AVEC** vers le téléphone du groupe ou un nouveau téléphone (fichier chiffré + code).
- **Plan B des codes perdus** : deux membres du bureau, carte de secours, ou appel à l'animateur.
- **Sauvegarde chiffrée**, mises à jour automatiques sans désinstaller, guide audio, langues de la RDC.
- **Espace administrateur** : création des codes de validation depuis le téléphone de l'administrateur.

## Modifier l'application
- Le code source est dans `akiba/` (HTML, CSS et JavaScript simples, sans dépendance à installer).
- Après une modification : `node build.js docs`, puis envoyer sur GitHub. Les téléphones reçoivent la nouvelle version à la prochaine ouverture avec réseau.
- Ne jamais changer la clé de stockage des données (`kitabu.avec.v4`) : les données des téléphones installés y sont rangées.

## Limites actuelles
Les données restent dans chaque téléphone. Une base de données centrale (par exemple Supabase) est la prochaine étape pour que l'organisation voie en direct les données de tous les téléphones.

## Licence
Tous droits réservés — Entreprise Sociale Ubora. Voir [LICENSE](LICENSE).
