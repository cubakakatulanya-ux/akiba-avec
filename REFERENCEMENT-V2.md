# Rendre les deux sous-domaines indexables — **fait dans la v2, reste à déployer**

Demande de Christian, transmise depuis la conversation du site uborardc.com.

## Ce qui n'allait pas

Sur les deux hôtes, `robots.txt`, `sitemap.xml` et le fichier de clé IndexNow renvoyaient tous
les trois **200 avec la page de l'application** (`Content-Type: text/html`). Ce n'était pas une
redirection mal réglée : les deux `wrangler.toml` de la v2 portent
`not_found_handling = "single-page-application"`, donc **tout chemin absent rend `index.html`**.
Ces fichiers n'existaient simplement pas dans la sortie de construction.

Conséquence : pas de plan du site pour Google, et **Bing refusait la clé IndexNow**, dont il
compare le contenu exact.

## Ce qui a été fait

Dans le dépôt **`akiba-v2`**, commit `0114804` :

- `apps/mobile/public/` et `apps/suivi/public/` reçoivent `robots.txt`, `sitemap.xml` et
  `8e0cedbc1d7e15296733ba91e7721568.txt`. Vite recopie `public/` tel quel dans `dist/`, et un
  fichier réellement présent est servi **avant** la règle attrape-tout.
- Le `robots.txt` du groupe écarte **`/ancien/`** : la v1 y est gardée comme filet de sécurité
  pour les téléphones déjà installés, et la référencer ferait un doublon de la même application
  dans deux versions.
- Le sitemap n'a **qu'une entrée par hôte**, la racine. Les écrans vivent derrière des routes
  `#/`, et un fragment n'est pas une adresse distincte pour un moteur.
- `apps/mobile/scripts/postbuild.mjs` n'inscrit plus ces trois fichiers dans la liste que le
  service garde hors ligne, au même titre que `_headers` : un robot ne passe pas par le service,
  et les mettre en cache ne ferait que du bruit.

## Ce qui reste

**Déployer.** Rien n'est en ligne avant, pour chaque application :

```bash
npm run build && node scripts/deploy-web.mjs && npx wrangler deploy
```

Puis vérifier — et regarder le **contenu**, pas le code de retour, puisque ici tout répond 200 :

```bash
for h in akiba.uborardc.com akibas.uborardc.com; do for f in robots.txt sitemap.xml 8e0cedbc1d7e15296733ba91e7721568.txt; do printf '%-22s %-40s ' "$h" "$f"; curl -s -m 25 -o /tmp/v -w '%{http_code} %{content_type}' "https://$h/$f"; printf ' | %s\n' "$(head -c 50 /tmp/v | tr -d '\r\n')"; done; done
```

Attendu : `text/plain` pour les deux `.txt`, `application/xml` pour le sitemap, et jamais
`<!doctype html>` dans la dernière colonne.

Ensuite, `tools/indexnow.js` du site uborardc.com enverra les adresses de lui-même : il compare
déjà le corps du fichier de clé, ce qui lui a fait classer les deux hôtes en « clé absente, non
envoyé » le 18/11 malgré la réponse 200.

## Une décision qui revient à Christian

Dans la v1, `docs-suivi/robots.txt` portait `Disallow: /` — c'était voulu : Akiba Suivi est
l'outil des animateurs et des organisations, pas une vitrine. Le `robots.txt` posé dans la v2
l'ouvre au référencement, comme demandé. C'est sans danger — rien n'est lisible sans compte, et
seule la page d'accueil sera référencée — mais c'est un **changement d'intention**, pas une
correction de bug.
