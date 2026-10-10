# Mesure d'audience anonyme

l'ent peut mesurer son audience de façon anonyme, pour savoir quels widgets marchent, quelles applications sont ouvertes et si les connexions réussissent. Le dispositif est conçu pour rester dans le cadre de l'**exemption de consentement de la CNIL** (« mesure d'audience exemptée ») : aucun cookie, aucun identifiant persistant, aucune donnée personnelle, finalité strictement statistique, et un interrupteur pour la désactiver.

Deux outils, tous deux **sans cookie et hébergés dans l'UE**, tous deux coupés par l'interrupteur *Statistiques anonymes* :

- **PostHog**, appelé uniquement par le serveur, pour les événements détaillés ci-dessous. **Désactivé par défaut** : sans la variable `POSTHOG_PROJECT_KEY`, rien n'est créé, mis en file ni envoyé.
- **Simple Analytics**, pour le simple comptage des pages vues (voir plus bas). Actif dans les builds de production.

Une fenêtre « Tes données restent à toi » (`src/components/PrivacyModal.jsx`) explique tout cela aux étudiants ; elle s'ouvre depuis *Mon compte* et depuis « À propos ».

## Fonctionnement

```
navigateur ──(événements filtrés)──▶ /__ent_auth/analytics (serveur l'ent) ──posthog-node──▶ PostHog (UE)
```

- **Le navigateur ne parle jamais à PostHog** et ne charge aucun script PostHog. `src/analytics.js` met les événements en lot et les envoie à notre propre serveur, via `navigator.sendBeacon` (ou `fetch` avec `keepalive` en secours).
- **Le serveur filtre tout** avec une liste blanche stricte (`server/analyticsSchema.js`, seul fichier qui définit ce qui peut partir). Les événements et propriétés inconnus sont supprimés sans erreur. Chaque valeur conservée doit être un enum, un booléen ou un court identifiant `[a-z0-9-]`. Aucun texte libre n'est accepté.
- **Envoi depuis le serveur** (`server/analytics.js`, `posthog-node`) : PostHog ne voit que l'IP du serveur, jamais celle de l'étudiant. Aucun en-tête `X-Forwarded-For` ni propriété `$ip` n'est transmis, et la GeoIP est désactivée (`disableGeoip`).
- **Pas de profils** : chaque événement porte `$process_person_profile: false`. Il n'y a ni `identify()`, ni autocapture, ni session replay, ni heatmaps.
- L'endpoint répond toujours `204` (`413` si le corps dépasse 8 Ko), accepte au plus 20 événements par requête et ignore les requêtes cross-site. Les erreurs sont avalées : la mesure d'audience ne peut pas casser l'application.

### Identifiant anonyme quotidien

`distinct_id = HMAC-SHA256(sel_du_jour, id_de_session)`, tronqué à 32 caractères hexadécimaux.

- Le **sel** est tiré au hasard (32 octets) pour chaque jour UTC. Il est gardé **en mémoire uniquement** : jamais écrit sur disque, jamais journalisé. Il est remplacé au changement de jour et l'ancien est oublié. Un redémarrage du serveur en tire aussi un nouveau.
- Conséquence : on peut compter des **visiteurs uniques par jour**, mais deux jours différents ne peuvent pas être reliés, et l'identifiant ne permet de retrouver ni la session ni l'étudiant.
- L'id de session est lui-même un UUID aléatoire, recréé à chaque connexion. On compte donc des sessions uniques par jour plutôt que des personnes.
- **Sans session** (page de connexion), seuls `login_result` et `pwa_update_applied` sont acceptés. Ils reçoivent un UUID aléatoire **par requête**, qui n'est relié à rien. Les autres événements sans session sont rejetés. Pour ces deux événements, comptez les occurrences et non les « utilisateurs uniques ».

## Événements et propriétés

Contexte ajouté automatiquement à chaque événement :

| Propriété | Valeurs | Source |
| --- | --- | --- |
| `device` | `mobile` (< 768 px), `tablet` (< 1024 px), `desktop` | largeur de la fenêtre |
| `browser` | `chromium`, `firefox`, `safari`, `other` | famille déduite du user-agent (le UA lui-même n'est pas envoyé) |
| `standalone` | booléen | PWA installée (`display-mode: standalone`) |
| `lang` | 2 lettres (`fr`, `en`…) | langue du navigateur |
| `establishment` | id d'établissement de la config (`iutlan`, `ufrs`…) | établissement mémorisé (grands groupes) |
| `formation` | identifiant court de la formation (`but-mmi`, `but-info`…, 32 caractères max) | niveau « formation » de la sélection ADE de l'étudiant, converti en slug. Jamais l'année, le TD ni le TP (groupes trop petits) |
| `university` | id de l'université (`univ-rennes`) | **ajouté par le serveur**, depuis sa config |
| `demo` | booléen | **ajouté par le serveur** depuis la session (compte démo ou non) |

| Événement | Quand | Propriétés propres |
| --- | --- | --- |
| `dashboard_viewed` | une fois par affichage du tableau de bord | — |
| `widget_loaded` | une fois par widget et par affichage, quand le premier chargement aboutit (cache ou réseau). Les rafraîchissements en arrière-plan ne sont pas envoyés. | `widget` : `greeting`, `nextClass`, `latestGrade`, `mail`, `deadlines` · `status` : `ok`, `empty`, `error` · `duration_bucket` : `<500ms`, `<1s`, `<3s`, `<10s`, `10s+` · `error_kind` (si `error`) : `http_4xx`, `http_5xx`, `network`, `timeout`, `other` |
| `app_opened` | ouverture d'une application | `app` : identifiant technique de l'application (fname du portail ou id de service local, normalisé `[a-z0-9-]{1,64}`, ex. `lent-iutlan-notes9`) · `source` : `grid`, `favorites`, `sidebar` |
| `setting_changed` | changement d'un réglage dans Mon compte | `setting` : `widget_visibility`, `app_descriptions`, `custom_background`, `analytics` · `value` : `on`, `off` · `widget` (pour `widget_visibility`) : mêmes valeurs que ci-dessus. La désactivation des statistiques n'est **jamais** envoyée. |
| `login_result` | après la réponse du serveur de connexion | `result` : `success`, `failure` · `demo` : booléen |
| `pwa_update_applied` | application d'une mise à jour de la PWA | — |

PostHog ajoute aussi `$lib`, `$lib_version`, `$is_server` et `$geoip_disable` (métadonnées du SDK serveur), ainsi qu'un `timestamp` et un `uuid` d'événement.

### Simple Analytics (pages vues)

[Simple Analytics](https://www.simpleanalytics.com/) est un outil de mesure d'audience européen, sans cookie et sans identifiant, qui ne compte que les pages vues (page, référent, pays, type d'appareil). Son script est chargé par le navigateur depuis `scripts.simpleanalyticscdn.com`, mais :

- il n'est **plus inclus dans `index.html`** : `src/analytics.js` l'injecte seulement si *Statistiques anonymes* est activé, et seulement dans les builds de production ;
- il est chargé avec `data-auto-collect="false"` : il n'enregistre rien de lui-même. l'ent envoie **une seule page vue par chargement** (`sa_pageview(location.pathname)`, sans paramètres d'URL), et seulement tant que l'interrupteur est activé — le couper arrête donc aussi Simple Analytics, même si le script est déjà chargé.

## Ce qui n'est jamais collecté

Identifiant ENT, e-mail, nom, prénom, numéro étudiant, id ou cookie de session, cookies CAS/ENT, notes ou moyennes, contenu ou objet des mails, expéditeurs, échéances Moodle, titres de cours ou de devoirs, groupe TP/TD, texte de recherche, ville météo, URL (avec ou sans paramètres), titre des applications, fond d'écran personnalisé, user-agent complet, adresse IP, géolocalisation. Les messages d'erreur ne sont pas transmis non plus, seulement leur catégorie (`error_kind`).

## Désactivation par l'utilisateur

*Mon compte → Statistiques anonymes* (activé par défaut, visible dès qu'un des deux outils est actif). Il coupe PostHog **et** Simple Analytics. Le choix est mémorisé par utilisateur dans le `localStorage` (`l-ent:anonymous-analytics`). Quand l'interrupteur est coupé, `track()` ne fait plus rien, la file en attente est vidée immédiatement et l'endpoint ne reçoit plus aucune requête. Le texte « À propos » mentionne la mesure d'audience uniquement quand elle est active.

## Configuration

| Variable | Description | Défaut |
| --- | --- | --- |
| `POSTHOG_PROJECT_KEY` | Clé de projet PostHog (`phc_…`). **Absente = mesure désactivée.** | — |
| `POSTHOG_HOST` | Hôte d'ingestion PostHog | `https://eu.i.posthog.com` (UE) |

En production (`node server.js`), elles sont lues dans l'environnement. En dev (`npm run dev`), elles peuvent aussi venir de `.env` / `.env.local`. Au `SIGTERM`/`SIGINT`, le serveur vide la file PostHog avant de quitter.

### Réglages à faire dans le projet PostHog

L'exemption repose aussi sur la configuration du projet. L'opérateur de l'instance doit :

1. **Créer le projet sur le cloud UE** (`eu.posthog.com`) et garder `POSTHOG_HOST` sur `https://eu.i.posthog.com`.
2. *Project settings → IP data capture* : activer **« Discard client IP data »**.
3. **Profils de personnes** : laisser désactivé le traitement des profils. Les événements portent déjà `$process_person_profile: false` ; ne jamais appeler `identify()` ni `$set`.
4. **Rétention des données** : **25 mois maximum** (recommandation CNIL : 13 mois pour les traceurs, 25 mois pour les données collectées).
5. **Désactiver** session replay, autocapture, heatmaps, surveys et web vitals. Aucun SDK navigateur n'est chargé, mais cela évite qu'un ajout futur les active par défaut.
6. Ne pas joindre ces données à d'autres sources et ne pas les partager avec des tiers.

## Ajouter un événement

À n'ajouter que pour un vrai besoin produit. Déclarez l'événement et ses propriétés (enums de préférence) dans `server/analyticsSchema.js`, appelez `track('nom', { … })` côté client, puis documentez-le ici. Tout ce qui n'est pas déclaré dans le schéma est supprimé par le serveur.
