# Deux applications, une seule source

Akiba se construit en deux applications distinctes à partir du même code.

| | **Akiba** | **Akiba Suivi** |
|---|---|---|
| pour qui | le bureau et les membres d'une AVEC | animateurs, organisations, administration d'Ubora |
| adresse | `akiba.uborardc.com` | `akibas.uborardc.com` |
| dossier construit | `docs/` | `docs-suivi/` |
| commande | `node build.js docs` | `node build.js docs-suivi suivi` |
| accueil | le grand bouton AVEC, Créer une AVEC, Guide, Recevoir une AVEC | Animateur, Organisation, Recevoir une AVEC, Espace administrateur, Guide, Formation |
| icône | fond vert | fond bleu |
| console administrateur | absente (`admin.js` n'est pas livré) | présente |

Les deux adresses étant deux origines différentes, **les données ne se mélangent jamais** : un téléphone
qui porte les deux applications garde deux réserves séparées.

## Comment la séparation est faite

`build.js` connaît deux profils (`PROFILS`) : nom, adresse, description, couleurs de l'icône et liste des
fichiers retirés. Il écrit dans la page `window.AKIBA_CIBLE`, que le code lit par `CIBLE` (core.js) :

- `estSuivi()` choisit l'accueil — `accueilSuivi()` dans supervision.js, ou l'accueil du village ;
- `APP_NOM()` donne « Akiba » ou « Akiba Suivi » dans les phrases d'installation ;
- `ecranDisponible()` garde la porte : dans l'application du village, les écrans `n.` (animateur),
  `o.` (organisation), `adm.` (administrateur) et `s.org` renvoient à l'accueil.

L'application Suivi garde les écrans d'une AVEC : un animateur doit pouvoir ouvrir le journal d'un groupe
qu'on lui a envoyé. C'est l'inverse qui est fermé.

Pourquoi un seul dépôt plutôt que deux : les règles de l'AVEC (intérêts, pénalités de retard, partage au
prorata du temps) vivent à un seul endroit. Deux copies finiraient par diverger, et un écart de calcul sur
l'argent d'un groupe ne se rattrape pas.

## Mettre en ligne la deuxième application

1. Créer un dépôt GitHub `akiba-suivi` (public, vide).
2. Y copier le contenu de `docs-suivi/` (qui contient déjà son `CNAME` : `akibas.uborardc.com`).
3. Dans *Settings › Pages* du nouveau dépôt : source « Deploy from a branch », branche `main`, dossier `/`
   (ou `/docs` si vous préférez garder la même disposition).
4. Chez le fournisseur du domaine `uborardc.com`, ajouter un enregistrement **CNAME** :
   `akibas` → `cubakakatulanya-ux.github.io`.
5. Attendre le certificat HTTPS (quelques minutes), puis cocher *Enforce HTTPS*.

Tant que l'étape 4 n'est pas faite, `akibas.uborardc.com` ne répond pas ; `docs/` et
`akiba.uborardc.com` continuent de fonctionner comme avant.

## Essais

    node test-e2e.js docs          # 36/36
    node test-e2e.js docs-suivi    # 36/36

L'essai de la console administrateur se déclare « sans objet » quand `admin.js` n'est pas livré.

## Fond clair ou fond sombre

Les deux applications offrent le choix, dans **Plus › Apparence** (côté AVEC) et par le bouton
**Apparence** de l'accueil et des tableaux de bord (côté Suivi) :

- **Fond clair** — toujours clair, même si le téléphone est réglé en sombre. Se lit mieux en plein soleil.
- **Fond sombre** — toujours sombre, même si le téléphone est réglé en clair.
- **Comme le téléphone** — suit le réglage d'Android ou d'iPhone (choix par défaut).

Le choix est gardé sur l'appareil (`kitabu.theme`) et n'accompagne pas les données du groupe : chaque
téléphone garde le sien. Techniquement, `appliquerTheme()` pose `data-theme` sur `<html>` ; la feuille de
style garde les règles sombres sous `:root:not([data-theme="light"])` pour le réglage du téléphone, et les
répète sous `:root[data-theme="dark"]` pour le mode sombre choisi à la main.

## Mise en page ordinateur

Elle existe pour les deux applications à partir de 1100 px : écran de bord à bord, accueil coupé en deux
(texte à gauche, actions à droite), et pour les écrans à onglets une colonne de navigation à gauche avec le
contenu sur deux colonnes. C'est surtout l'application Suivi qui en profite : animateurs et organisations
travaillent au bureau.

## Point GPS du groupe (hors connexion)

`gps.js` ajoute, dans **Plus › Lieu du groupe**, un bouton « Prendre le point GPS ». La puce du téléphone
lit les satellites : **aucun réseau n'est nécessaire**. Ce qui en demande — transformer des coordonnées en
nom de lieu, afficher une carte — n'est pas fait : on garde les chiffres, et le village reste celui que le
bureau a saisi.

- `gpsMesurer()` : une lecture, `enableHighAccuracy`, 90 s d'attente au plus, aucune valeur mise en cache.
- `gpsEnregistrer(avec, coords)` : écrit `avec.gps = {lat, lon, acc, ts}` et scelle une écriture `GEO`
  (montant nul) dans le journal. Le point se vérifie donc comme le reste, et il voyage avec les données.
- L'export Excel reçoit trois colonnes : Latitude, Longitude, Précision GPS (m).
- Le lien « Voir sur une carte » n'ouvre quelque chose qu'avec du réseau ; les coordonnées, elles, se lisent
  toujours.

Messages d'erreur distincts selon la cause : autorisation refusée, GPS éteint, ou pas de point après une
minute et demie (il faut alors sortir à ciel ouvert).
