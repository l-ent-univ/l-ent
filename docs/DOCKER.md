# Déploiement Docker

Le service entier — les frontends Vite buildés **et** le serveur Express (auth CAS, proxy ENT, API) — tient dans une seule image. Une image publiée contient un bundle par université (`dist/<id>/`) en plus du bundle par défaut (`dist/`), donc la même image sert aussi bien une université qu'une instance multi-université routée par sous-domaine.

L'image est publiée sur **GitHub Container Registry** :

```
ghcr.io/tom-things/l-ent:latest
```

## Démarrage rapide

```bash
docker run -d --name lent -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e UNIVERSITY=univ-rennes \
  ghcr.io/tom-things/l-ent:latest
```

L'app écoute sur le port `3000` du conteneur, avec une sonde de vie sur `/healthz` (utilisée par le `HEALTHCHECK` de l'image).

> **HTTPS obligatoire en production.** Dès que `SESSION_SECRET` est défini, le cookie de session porte l'attribut `Secure` : la connexion ne fonctionnera pas si l'app est servie en HTTP nu. Placez un reverse proxy TLS devant (Caddy, Traefik, nginx…) et faites-lui transmettre `X-Forwarded-Proto` et `X-Forwarded-Host` — ils servent à calculer l'origine publique (canonical, sitemap) et le routage multi-tenant.

### Docker Compose

Un [`docker-compose.yml`](../docker-compose.yml) prêt à l'emploi est fourni à la racine :

```bash
SESSION_SECRET=$(openssl rand -hex 32) docker compose up -d
```

## Tags disponibles

| Tag           | Contenu                                    |
| ------------- | ------------------------------------------ |
| `latest`      | Dernier commit de `main`                   |
| `main`        | Idem, suit la branche                      |
| `sha-<court>` | Un commit précis (recommandé en prod)      |
| `1.2.3`, `1.2`, `1` | Releases (tags git `v1.2.3`)         |

Architectures publiées : `linux/amd64` et `linux/arm64`.

## Variables d'environnement

Identiques à un déploiement classique (voir README) :

| Variable         | Description                                                        | Requis           |
| ---------------- | ------------------------------------------------------------------ | ---------------- |
| `PORT`           | Port d'écoute dans le conteneur (défaut : 3000)                    | Non              |
| `SESSION_SECRET` | Clé de signature des sessions (active aussi le cookie `Secure`)    | Oui (production) |
| `UNIVERSITY`     | Université servie, ou tenant par défaut (défaut : `univ-rennes`)   | Non              |
| `MULTI_TENANT`   | `1` : sert plusieurs universités, routées par sous-domaine         | Non              |
| `TENANTS`        | Universités servies en multi-tenant (ids séparés par `,`)          | Non              |

`UNIVERSITY` doit désigner une université dont le bundle est présent dans l'image — c'est le cas de toutes les universités non `example-*` du dépôt au moment du build.

## Multi-université

L'image embarque déjà tous les bundles, il n'y a donc rien à rebuilder :

```bash
docker run -d -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e MULTI_TENANT=1 \
  -e UNIVERSITY=univ-rennes \
  ghcr.io/tom-things/l-ent:latest
```

Chaque université est alors servie sur `<id-sans-tirets>.<votre-domaine>` (ou sur les `hostnames` déclarés dans son `shared.js`), les hôtes inconnus retombant sur `UNIVERSITY`. Le reverse proxy doit envoyer le hostname d'origine (`Host` ou `X-Forwarded-Host`).

## Builder l'image soi-même

```bash
docker build -t lent .
```

Arguments de build (`--build-arg`) :

| Argument     | Défaut        | Rôle                                                              |
| ------------ | ------------- | ----------------------------------------------------------------- |
| `NODE_VERSION` | `22`        | Version de l'image de base Node                                    |
| `UNIVERSITY` | `univ-rennes` | Université du bundle par défaut (`dist/`)                          |
| `TENANTS`    | *(vide)*      | Universités buildées dans `dist/<id>/` (toutes les non-`example-*`) |
| `BUILD_HASH` | `docker`      | Identifiant de build affiché dans l'app (le SHA du commit en CI)   |

Exemple pour une instance dédiée à une seule université (image plus légère) :

```bash
docker build -t lent \
  --build-arg UNIVERSITY=univ-lavotre \
  --build-arg TENANTS=univ-lavotre .
```

## Publication sur GHCR

Le workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) build et pousse l'image automatiquement :

- push sur `main` → `latest`, `main`, `sha-<court>` ;
- tag git `v1.2.3` → `1.2.3`, `1.2`, `1` ;
- pull request touchant le build Docker → build de vérification, sans push.

Il s'authentifie avec le `GITHUB_TOKEN` du job (permission `packages: write`) : aucun secret à configurer. Sur un fork, il suffit que GitHub Actions soit activé ; l'image est poussée sous `ghcr.io/<votre-compte>/l-ent`.

Le package est privé à sa première publication : pour le rendre public, allez dans **Profil/Organisation → Packages → l-ent → Package settings → Change visibility**. Pour tirer une image privée :

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <votre-compte> --password-stdin
```

Publication manuelle, sans CI :

```bash
docker build -t ghcr.io/<compte>/l-ent:latest .
docker push ghcr.io/<compte>/l-ent:latest
```

## Notes

- Le conteneur tourne en utilisateur non root (`node`) et ne persiste rien : aucun volume n'est nécessaire (l'app n'a pas de base de données, voir « Sécurité & confidentialité » dans le README).
- `docker stop` est pris en compte immédiatement : le serveur écoute `SIGTERM`/`SIGINT` et ferme proprement ses connexions.
- Mettre à jour une instance : `docker compose pull && docker compose up -d` (ou `docker pull` + recréation du conteneur).
