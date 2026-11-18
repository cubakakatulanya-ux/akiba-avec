# Rendre les deux sous-domaines indexables — à appliquer dans la v2

> **Ce dépôt-ci ne peut pas le faire.** Il est la v1, gelée : son `docs/` n'est plus servi
> (voir l'avertissement du [README](README.md)). Les deux adresses servent la v2, dont la source
> n'est pas sur cette machine. Ce fichier est une consigne de passage, pas une modification de la v1.

## Ce qui se passe aujourd'hui, vérifié le 18/11/2026

Sur les deux hôtes, `robots.txt`, `sitemap.xml` et le fichier de clé IndexNow renvoient
tous **200 avec la page de l'application** (`Content-Type: text/html`) :

```
akiba.uborardc.com   robots.txt   200 text/html   <!doctype html><html lang="fr">…
akiba.uborardc.com   sitemap.xml  200 text/html   <!doctype html><html lang="fr">…
akibas.uborardc.com  robots.txt   200 text/html   <!doctype html><html lang="fr">…
```

C'est le comportement normal d'une SPA : **tout chemin inconnu rend `index.html`**. Ces trois
fichiers ne sont donc pas absents du serveur — ils n'existent pas dans ce qui est publié.

Un robot qui lit cela ne trouve ni directive ni plan du site. Google tolère un `robots.txt`
en HTML (il le considère comme vide, donc tout permis), mais le `sitemap.xml` est rejeté, et
**Bing refuse la clé IndexNow** parce qu'il compare le contenu exact du fichier.

## La correction

Les fichiers doivent être **dans la sortie de construction**, pas inventés par une règle de
réécriture. Avec Vite, cela veut dire le dossier `public/` de chaque cible : son contenu est
recopié tel quel dans `dist/`, et un fichier réellement présent est servi avant la règle
attrape-tout. Si c'est un Worker qui sert la page, il faut en plus que ces trois chemins
passent avant son `/*`.

Trois fichiers, **à la racine de chacun des deux hôtes**.

### 1. `8e0cedbc1d7e15296733ba91e7721568.txt` — identique sur les deux

Une seule ligne, sans rien d'autre :

```
8e0cedbc1d7e15296733ba91e7721568
```

C'est la clé déjà employée par `uborardc.com` ; une même clé vaut pour plusieurs hôtes.

### 2. `robots.txt`

Pour `akiba.uborardc.com` :

```
User-agent: *
Allow: /

Sitemap: https://akiba.uborardc.com/sitemap.xml
```

Pour `akibas.uborardc.com` :

```
User-agent: *
Allow: /

Sitemap: https://akibas.uborardc.com/sitemap.xml
```

> **Un changement d'intention à confirmer.** Dans la v1, `docs-suivi/robots.txt` portait
> `Disallow: /` — c'était voulu : Akiba Suivi est l'outil des animateurs et des organisations,
> pas une vitrine. Christian veut désormais ce sous-domaine indexé. C'est son choix ; il est
> sans danger, puisque rien n'est lisible sans compte et que les écrans vivent derrière des
> routes `#/` qu'aucun robot ne parcourt. Seule la page d'accueil sera référencée.

### 3. `sitemap.xml`

Les deux applications sont des SPA à routes `#/` : un fragment n'est **pas** une adresse
distincte pour un moteur. Le plan du site ne contient donc qu'une entrée par hôte — en
annoncer d'autres ne ferait que produire des doublons.

Pour `akiba.uborardc.com` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://akiba.uborardc.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Pour `akibas.uborardc.com`, la même chose avec `https://akibas.uborardc.com/`.

## Vérifier, et ne pas se faire avoir

Le piège est que **tout répond 200**. Un script qui ne regarde que le code de retour conclura
que la clé est en place alors qu'il a reçu du HTML. Il faut comparer le **contenu** :

```bash
for h in akiba.uborardc.com akibas.uborardc.com; do for f in robots.txt sitemap.xml 8e0cedbc1d7e15296733ba91e7721568.txt; do printf '%-22s %-40s ' "$h" "$f"; curl -s -m 25 -o /tmp/v -w '%{http_code} %{content_type}' "https://$h/$f"; printf ' | %s\n' "$(head -c 50 /tmp/v | tr -d '\r\n')"; done; done
```

Attendu : `text/plain` pour les deux `.txt`, `application/xml` (ou `text/xml`) pour le sitemap,
et jamais `<!doctype html>` dans la dernière colonne.

**`tools/indexnow.js` fait déjà ce contrôle** : il compare le corps du fichier de clé, une fois
nettoyé, à la clé elle-même. C'est pourquoi il a classé les deux hôtes en « clé absente, non
envoyé » le 18/11 malgré la réponse 200. Rien à changer de ce côté : dès que les trois fichiers
sont réellement publiés, il enverra les adresses de lui-même.
