# Auto-héberger l'ent avec Docker

Chaque merge sur `main` publie une release GitHub et une image Docker multi-architecture (amd64 et arm64) :

```
ghcr.io/l-ent-univ/l-ent:latest     # dernière version
ghcr.io/l-ent-univ/l-ent:0.4.1      # version précise
ghcr.io/l-ent-univ/l-ent:0.4        # dernière 0.4.x
```

L'image contient le serveur Express et le frontend de chaque université (mode multi-tenant, `MULTI_TENANT=1`). Elle écoute sur le port 3000, tourne avec un utilisateur non root et n'écrit rien sur le disque.

## Prérequis

- Un serveur avec Docker et Docker Compose.
- Un nom de domaine dont l'enregistrement A/AAAA pointe vers ce serveur.
- Les ports 80 et 443 ouverts : **HTTPS est obligatoire** (cookie de session `Secure`, PWA, service worker).

## Installation

1. Copier le dossier [`deploy/`](../deploy) sur le serveur.
2. Créer `.env` à partir de `deploy/example.env` et y mettre un secret de session :
   ```sh
   cp example.env .env
   echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
   ```
   Le serveur refuse de démarrer sans ce secret. Gardez-le : le changer déconnecte tout le monde.
3. Remplacer `lent.example.fr` par votre domaine dans `Caddyfile`. Caddy obtient et renouvelle le certificat TLS tout seul.
4. Lancer :
   ```sh
   docker compose up -d
   docker compose logs -f lent
   ```

Derrière un autre reverse proxy (nginx, Traefik…), il suffit de transmettre `X-Forwarded-Proto` et `X-Forwarded-Host` au conteneur.

## Mettre à jour

```sh
docker compose pull && docker compose up -d
```

Pour figer une version, remplacer `latest` par un numéro (`ghcr.io/l-ent-univ/l-ent:0.4.1`) dans `docker-compose.yml`. Les notes de chaque version sont sur la page [Releases](https://github.com/l-ent-univ/l-ent/releases).

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `SESSION_SECRET` | Secret de session (au moins 32 octets) | **obligatoire** |
| `UNIVERSITY` | Université servie quand le nom d'hôte ne correspond à aucune | `univ-rennes` |
| `TENANTS` | Universités servies (ids séparés par des virgules) | toutes |
| `POSTHOG_PROJECT_KEY` | Mesure d'audience anonyme ([ANALYTICS.md](ANALYTICS.md)) | désactivée |
| `PORT` | Port interne du conteneur | `3000` |

## Changer de domaine

Une PWA installée est liée à son domaine : déménager l'ent vers un nouveau domaine oblige les utilisateurs à réinstaller l'app et leur fait perdre leurs réglages locaux. Prévoir une période de transition où l'ancien domaine reste en ligne.

## Publication (mainteneurs)

Le workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) :

- sur chaque pull request : lint, tests, build de toutes les universités et build Docker (sans publication) ;
- sur chaque push sur `main` : la même vérification, puis une release `vX.Y.Z` avec des notes générées depuis les PR, puis l'image Docker.

Le numéro de version suit les messages de commit depuis la dernière release : `feat` incrémente la mineure, `type!:` ou `BREAKING CHANGE` la majeure (la mineure tant qu'on est en 0.x), le reste le correctif. Mettre `[skip release]` dans le message du commit de tête pour ne rien publier.

Après la toute première publication, rendre le paquet public : organisation GitHub → **Packages** → `l-ent` → **Package settings** → **Change visibility** → Public. Sinon il faut un `docker login ghcr.io` pour le télécharger.
