# Akiba

Le cahier des **Associations Villageoises d'Épargne et de Crédit (AVEC)** dans le téléphone, **même sans réseau**. Conçu pour la RDC.

*Développée par l'**Entreprise Sociale Ubora**.*

## Assistance
**Ubora**, entreprise sociale : appel ou WhatsApp **0998 275 144** · contact@uborahub.com

## Deux applications, deux publics

| | Pour qui | Adresse |
|---|---|---|
| **Akiba** | Le groupe : bureau et membres | **https://akiba.uborardc.com/** |
| **Akiba Suivi** | Animateurs, organisations, administration Ubora | **https://akibas.uborardc.com/** |

Un seul code source (`akiba/`), deux cibles de construction. Un groupe n'a jamais sous les yeux les écrans de supervision, et un animateur n'a pas le cahier du groupe dans les mains. Voir [DEUX-APPLICATIONS.md](DEUX-APPLICATIONS.md).

- **Libre à installer et à découvrir** : tout le monde peut ouvrir l'adresse, installer l'icône et essayer la démonstration.
- **Code de validation pour les vraies opérations** : un téléphone qui passe aux vraies données demande un code délivré par Ubora, signé et vérifié sur l'appareil, sans internet. Voir [LANCER.md](LANCER.md).

## Ce que fait Akiba (application du groupe)
- **Réunion guidée en 8 étapes** : présences, comptage, caisse sociale, épargne en parts, remboursements, crédits, amendes, clôture à trois clés.
- **Registre scellé contre la fraude** : chaque écriture porte l'empreinte de la précédente ; toute modification se voit.
- **Cycles** : partage de fin de cycle, nouveau cycle, historique.
- **Création complète** : 26 provinces, 145 territoires et villes ; fiches membres ; bureau et porte-clés ; reprise d'un cahier papier ; **point GPS** du lieu de réunion, pris à la création, sans réseau.
- **Cartes de membre en papier** : dix par feuille A4 ou sur le terminal thermique, avec un QR code qui se vérifie hors réseau. Ni code secret ni montant dessus.
- **Reçus** des membres, imprimés sur terminal ou partagés ; journal imprimable.
- **Transfert** d'une AVEC vers le téléphone du groupe ou un nouveau téléphone (fichier chiffré + code).
- **Plan B des codes perdus** : deux membres du bureau, carte de secours, ou appel à l'animateur.
- **Sauvegarde chiffrée**, mises à jour automatiques sans désinstaller, guide audio, langues de la RDC, fond clair ou sombre.

## Ce que fait Akiba Suivi
- **Tableau de bord de l'organisation** : épargne, crédits, portefeuille à risque, qualité des données, alertes, export Excel. Fiches sur téléphone, tableau complet sur ordinateur.
- **Espace de l'animateur** : ses AVEC, ses alertes, ses visites, réception des journaux des groupes.
- **Validation des AVEC** créées par un animateur, avec ou sans internet (code dicté au téléphone).
- **Écran Impact** : les quatre piliers du projet, chiffrés sur les journaux reçus.
- **Administration Ubora** : partenaires et codes de validation créés depuis le téléphone de l'administrateur, lecture d'une demande reçue par message ou par QR.

## Modifier l'application
Le code source est dans `akiba/` : HTML, CSS et JavaScript simples, **sans dépendance à installer**.

```
node build.js docs avec          # construit l'application du groupe  → docs/
node build.js docs-suivi suivi   # construit l'application de suivi   → docs-suivi/
node test-e2e.js docs            # 39 essais + les 40 écrans, téléphone et ordinateur
node test-e2e.js docs-suivi
node serve.js docs 5173          # aperçu local d'une construction
```

- `docs/` part sur **akiba-avec** (GitHub Pages), `docs-suivi/` sur **akiba-suivi**.
- Chaque construction publie un `version.txt` : c'est lui qui permet à un téléphone de dire s'il est à jour.
- **Ne jamais changer la clé de stockage** (`kitabu.avec.v4`) : les données des téléphones installés y sont rangées.
- **Jamais dans le dépôt** : clé privée de signature (`.pem`), registre des licences, fichiers `.akibakey`, exports `.xlsx`.

## Limites actuelles
Les données restent dans chaque téléphone et circulent par fichier. Une base de données centrale (par exemple Supabase) est la prochaine étape pour que l'organisation voie en direct les données de tous les téléphones.

## Licence
Tous droits réservés — Entreprise Sociale Ubora. Voir [LICENSE](LICENSE).
