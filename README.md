# Kitabu AVEC

Le cahier des **Associations Villageoises d'Épargne et de Crédit (AVEC)** dans le téléphone, **même sans réseau**. Conçu pour la RDC.

- Réunion guidée en 8 étapes : présences, comptage, caisse sociale, épargne en parts, remboursements, crédits, amendes, clôture à trois clés.
- Registre scellé contre la fraude : chaque écriture porte l'empreinte de la précédente.
- Partage de fin de cycle, nouveau cycle, historique.
- Trois espaces : **AVEC** (bureau et membres), **animateur**, **organisation**. Les AVEC autonomes sont possibles.
- Validation des AVEC par l'organisation, même sans internet (code par téléphone).
- Plan B pour les codes secrets perdus : deux membres du bureau, carte de secours, ou appel à l'animateur.
- Langues : français, lingala, swahili, kikongo, tshiluba, et écran de traduction pour les autres langues (ngbaka, ngbandi, mbanza…).

## Utiliser l'application
L'application publiée se trouve dans le dossier `docs/` et est servie par **GitHub Pages**. Voir [LANCER.md](LANCER.md) pour l'installer sur les téléphones.

## Modifier l'application
- Le code source est dans `kitabu/` (HTML, CSS et JavaScript simples, sans dépendance).
- Après une modification : `node build.js docs`, puis envoyer les changements sur GitHub. Les téléphones reçoivent la nouvelle version à la prochaine ouverture avec réseau.

## Limites actuelles
Les données restent dans chaque téléphone. Un serveur de synchronisation est la prochaine étape pour que l'organisation voie en direct les données de tous les téléphones.
