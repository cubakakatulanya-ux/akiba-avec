> ## ⚠ Ce dépôt est gelé — c'est la version 1
>
> **Depuis le 18 novembre 2026**, `akiba.uborardc.com` et `akibas.uborardc.com` servent **Akiba v2**,
> une application différente (SPA, routes `#/`, son propre `akiba-v2.apk`). Ce dépôt-ci est la v1 :
> un PWA en JavaScript simple, sans dépendance.
>
> **On n'y publie plus.** Les deux dépôts GitHub se construisent et se déploient toujours sans
> erreur, mais leurs `CNAME` pointent vers des adresses que la v2 occupe : `docs/` et
> `docs-suivi/` ne sont donc plus lus par personne. Rien n'est cassé — c'est simplement sans effet.
>
> **Dernier état publié**, tous les bancs au vert : `akiba-20261117124657` et
> `akiba-20261117124704` · 84/84 essais sur chaque application, 0 contraste faible,
> 0 cible trop petite · APK du 17/11/2026.
>
> ### Si un téléphone tourne encore en v1
>
> - **Il continue de fonctionner.** Une APK installée ne se met pas à jour toute seule : elle
>   restera telle quelle tant que personne ne la remplace.
> - **Son cahier vit dans `kitabu.avec.v4`**, dans le stockage privé de l'application
>   (IndexedDB, avec `localStorage` en secours). Seule une désinstallation le détruit.
> - **La v2 sait reprendre ce cahier**, mais seulement là où elle lit le même stockage : un
>   téléphone qui avait ouvert la v1 *à cette adresse* se voit proposer *Récupérer mon ancien
>   cahier* — membres, codes secrets, réunions, épargne, prêts, amendes — et l'ancien cahier
>   n'est ni modifié ni effacé.
> - **Depuis l'APK v1, cette reprise n'est pas possible** : une application Android a son stockage
>   à elle, que le site ne voit pas. Il faut alors passer par un **transfert** — fichier chiffré
>   de la v1, ou sauvegarde.
> - **Avant de toucher à un tel téléphone** : faire une sauvegarde, par *Installer et protéger ›
>   Sauvegarder*. C'est un fichier chiffré par un mot de passe ; sans lui, rien ne se restaure.
> - **Garder `akiba-signature.p12` et son mot de passe.** Sans cette clé, on ne peut plus installer
>   une v1 *par-dessus* une v1 : il faudrait désinstaller d'abord, et la désinstallation détruit
>   le cahier. Voir la note de sécurité plus bas.
>
> Tout ce qui suit décrit la v1 telle qu'elle a été laissée, et reste exact pour elle.

---

# Akiba

Le cahier des **Associations Villageoises d'Épargne et de Crédit (AVEC)** dans le téléphone, **même sans réseau**. Conçu pour la RDC.

*Développée par l'**Entreprise Sociale Ubora**.*

## Assistance
**Ubora**, entreprise sociale : appel ou WhatsApp **0998 275 144** · contact@uborahub.com

## Deux applications, deux publics

| | Pour qui | Adresse — *occupée par la v2 depuis le 18/11/2026* |
|---|---|---|
| **Akiba** | Le groupe : bureau et membres | ~~https://akiba.uborardc.com/~~ |
| **Akiba Suivi** | Animateurs, organisations, administration Ubora | ~~https://akibas.uborardc.com/~~ |

Ces deux adresses servent aujourd'hui la v2. Pour remettre la v1 en ligne, il faudrait retirer les
`CNAME` de `docs/` et `docs-suivi/` — elle reviendrait alors à ses adresses GitHub — ou lui donner
un sous-domaine à elle.

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
node test-e2e.js docs            # 84 essais + les 46 écrans, téléphone et ordinateur
node test-e2e.js docs-suivi
node serve.js docs 5173          # aperçu local d'une construction
```

- `docs/` part sur **akiba-avec** (GitHub Pages), `docs-suivi/` sur **akiba-suivi**. *Depuis le gel,
  ces deux publications n'atteignent plus personne : voir l'avertissement en tête.*
- Chaque construction publie un `version.txt` : c'est lui qui permet à un téléphone de dire s'il est à jour.
- **Ne jamais changer la clé de stockage** (`kitabu.avec.v4`) : les données des téléphones installés y sont rangées.
- **Jamais dans le dépôt** : clé privée de signature (`.pem`), registre des licences, fichiers `.akibakey`, exports `.xlsx`.

## Limites de la v1, telle qu'elle a été laissée
Les données restent dans chaque téléphone et circulent par fichier ou par image : il n'y a pas de
base centrale. C'était la principale limite, et c'est l'une des raisons d'être de la v2.

Trois choses ne se vérifient que sur l'appareil, et n'ont jamais été éprouvées sur le terminal
R330S : l'appareil photo qui scanne, le fichier `.akiba` touché dans un message, et l'impression
réelle. L'écran *Installer et protéger › Contrôler cet appareil* existe pour cela et rend un
compte rendu.

## Licence
Tous droits réservés — Entreprise Sociale Ubora. Voir [LICENSE](LICENSE).
