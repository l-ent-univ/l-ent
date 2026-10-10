# Ajouter votre université

l'ent est conçu pour être forké : toute la configuration propre à une université vit dans un seul dossier, `universities/<id>/`. Le reste du code (frontend React, backend Express) est générique.

Trois exemples sont fournis :

- **`universities/univ-rennes/`** — l'implémentation de référence, complète (CAS + ADE + Planning GWT + Moodle + établissements + icônes de services).
- **`universities/example-minimal/`** — le strict minimum (ENT uPortal + CAS). Bon point de départ : copiez-le, renommez-le, remplissez vos valeurs.
- **`universities/univ-exemple/`** — université fictive de démonstration : origins factices, mais compte démo (`demo@l-ent.app` / `lent-demo`) et widgets activés. Sert à tester le flux d'ajout et le routage par sous-domaine de bout en bout.

## Démarrage rapide

```bash
cp -r universities/example-minimal universities/univ-exemple
# éditez universities/univ-exemple/{shared,client,server}.js (id, origins, branding)
UNIVERSITY=univ-exemple npm run dev      # développement
UNIVERSITY=univ-exemple npm run build    # build frontend
UNIVERSITY=univ-exemple npm start        # production
```

> **Important** : `UNIVERSITY` doit être identique au build et au run — le bundle frontend est généré pour une seule université. Sans variable, `univ-rennes` est utilisée. Copiez `.env.example` pour référence.

### Hébergement multi-université (sous-domaines)

Une même instance peut servir plusieurs universités (voir README, section « Multi-université par sous-domaine ») : `npm run build:all` puis `MULTI_TENANT=1 npm start`. Votre université est alors accessible sur le sous-domaine `<id-sans-tirets>.<domaine>` ; pour utiliser d'autres hostnames, exportez-les dans `shared.js` :

```js
export const hostnames = ['rennes.lent.example', 'ent-rennes.example.fr']
```

## Les trois fichiers d'une université

| Fichier | Chargé par | Contenu |
| --- | --- | --- |
| `shared.js` | Node **et** navigateur | Données pures partagées : id, origins publics, flags de features, textes de branding. **Aucun import d'asset** (le serveur Node doit pouvoir l'importer). |
| `client.js` | Navigateur uniquement (alias Vite `@university`) | Config complète côté client : branding + logo, liens d'aide, catégories/icônes de services, établissements. Peut importer des images. |
| `server.js` | Node uniquement | Origins internes (CAS, ADE, Moodle, Planning), paramètres du flux d'auth, clés ADE rétro-ingéniérées. **Jamais envoyé au navigateur.** |

## Champs de configuration

### Obligatoires

- `id` — identifiant du dossier (kebab-case).
- `origins.ent` — origine du portail ENT (uPortal). Le proxy local ne relaie que cet hôte.
- `origins.cas` (serveur + client) — origine du SSO CAS. Le flux de connexion implémenté est **CAS 2.0 avec formulaire** (scraping des champs `execution`/`_eventId`), le standard Jasig/Apereo utilisé par la plupart des universités françaises.
- `auth.portalEntryPath` — page d'atterrissage uPortal (souvent `/f/services/normal/render.uP`). Sert de point d'entrée de connexion, de `Referer` par défaut et de preuve d'authentification. Le serveur rejoue cette entrée avec le seul cookie CAS `TGC` (conservé chiffré dans le cookie de session) pour rétablir la session ENT en silence quand elle a expiré.
- `auth.casLogoutPath` (optionnel, défaut `/logout`) — chemin de déconnexion du CAS Apereo, appelé à la déconnexion pour clore la session SSO côté université.
- `branding` — `appName`, `defaultTitle`, `seoTitle`, `seoDescription`, `logo` (+ `logoAlt`, `loginFooterLine`, `about.*`). Utilisé par la page de connexion, la sidebar, le SEO, le manifest PWA et `index.html` (placeholders `%LENT_*%`).
  - `lockup` / `lockupDark` (optionnels, `client.js` uniquement) — visuel combiné « l'ent × université » affiché dans la sidebar et le header (comme Rennes). Sans eux, le logo l'ent et votre `logo` sont composés côte à côte automatiquement.
  - `heroImages` (optionnel, `client.js` uniquement) — photos affichées en fond du haut du tableau de bord, en fondu vers le fond uni : `[{ src, credit: { author, license, url }, position? }]`. Plusieurs photos tournent chaque jour. Chaque établissement peut définir ses propres `heroImages` dans `establishments.byId`. Sans photo, un placeholder générique est affiché. Le crédit apparaît dans le footer : utilisez des images libres de droits (ex. Wikimedia Commons) et renseignez auteur + licence.
- `features` — l'interrupteur général (voir ci-dessous).

### Features (dégradation gracieuse)

```js
export const features = {
  ade: false,        // API mobile ADE Campus (widget "prochain cours", arbres, emplois du temps)
  planning: false,   // Planning GWT (adesoft) — lien "Planning" + résolution du prochain cours
  moodle: false,     // relais de connexion Moodle via Shibboleth WAYF
  grades: false,     // notes ScoDoc — true | false | 'disabled' (pastille visible, données démo)
  mail: false,       // widget « Mails récents » (lecture de la boîte de réception via le webmail)
  moodleDeadlines: false, // widget « Échéances Moodle » (devoirs/tests à rendre) — distinct de `moodle`
  weather: { enabled: true, defaultCity: 'Paris' },
  serviceCategories: false, // filtres par catégorie au-dessus de la grille d'applications (voir services.categories)
  demo: true,        // compte de démonstration (demo@l-ent.app)
}
```

Un feature à `false` : le serveur répond `{ disabled: true }` sur les endpoints concernés et le frontend masque les widgets/liens. Mettez aussi l'origin correspondant à `null` dans `server.js`.

### Optionnels

- `links` — `forgotPassword`, `activateAccount`, `manageAccount`. Absent → lien masqué.
- `establishments` — détection de la composante (IUT, UFR…) depuis l'arbre ADE et gating par composante :
  ```js
  establishments: {
    detectFromAdeTree: [{ includes: ['iut lannion'], id: 'iutlan' }],
    fallbackId: 'other',
    byId: {
      iutlan: {
        label: 'IUT de Lannion',
        gradeWidgets: true,       // widgets de notes
        nextClassWidget: true,    // widget prochain cours
        extraServices: [{ id: '…', title: '…', href: '…', target: '_blank' }],
      },
    },
  }
  ```
  Omettez le bloc entier si votre université n'a qu'un seul « établissement ».
- `services.getAppIcon(title)` — retourne l'icône d'une application ENT à partir de son titre (voir `universities/univ-rennes/app-icons/`). Retournez `null` pour l'icône générique.
- `services.categories` — mots-clés → catégories de la grille d'applications.
- `services.titleOverrides` — (optionnel) renomme des applications ENT : `{ 'titre ent en minuscules': 'Titre affiché' }`.
- `services.isUnavailableApplication(app)` — masque complètement certaines applications.
- `grades.serviceUrl` (client) — URL publique du service de notes (ScoDoc), ouverte via `/__ent_auth/launch` depuis les widgets et le lien « Mes notes » quand `features.grades === true`.
- `mailWebmailUrl` (shared) — URL publique du webmail (« Messagerie »), réutilisée par `mail.webmailUrl` côté serveur ; le widget l'ouvre via `/__ent_auth/launch`.
- `grades` (copy) — `unavailableTitle`, `unavailableDetail`, `disabledPillLabel` quand `features.grades === 'disabled'` ; `unavailableTitle`/`unavailableDetail` servent aussi de message d'erreur serveur quand ScoDoc ne répond pas.

### Serveur uniquement (`server.js`)

- `origins.ade` / `origins.moodle` / `origins.planning` — `null` si absent.
- `moodle.shibbolethLoginPath` + `moodle.wayfEntityId` — l'entityID Shibboleth de votre université sur la page WAYF de la fédération (visible dans l'URL `user_idp=` lors d'une connexion Moodle manuelle).
- `moodle.signInDomains` — requis quand `features.moodleDeadlines === true` (endpoint `GET /__ent_auth/moodle/deadlines`, contrat dans `src/entApi.js#getMoodleDeadlines`) : domaines que la connexion SSO Moodle côté serveur peut visiter (HTTPS uniquement) en plus de `origins.moodle` et du CAS, typiquement le WAYF et l'IdP Shibboleth (Rennes : `['wayf.univ-rennes.fr', 'ident-shib.univ-rennes1.fr']`). Le serveur rejoue la chaîne du relais Moodle (Shibboleth → WAYF → IdP → CAS → POST SAML) avec une copie du cookie jar de session, récupère le `sesskey` sur `/my/`, puis appelle `lib/ajax/service.php` : `core_calendar_get_action_events_by_timesort` (à faire, retards ≤ 7 jours inclus) et `core_calendar_get_calendar_upcoming_view` (devoirs/tests déjà rendus, et liste de repli). 6 échéances max sur 30 jours, cache 5 min par session ; les liens passent par `/__ent_auth/launch`. Requiert aussi `features.moodle` (relais) pour les liens. Le compte démo renvoie des échéances fictives.
- `ade.etab`, `ade.passwordKey`, `ade.passwordIv`, `ade.appHeaders` — identité de l'app mobile « Campus » de votre université. **Ces valeurs se rétro-ingénient par campus** (interception du trafic de l'app mobile officielle) ; voir `API_GUIDE.md` et `src/knownEndpoints.js` pour la méthodologie utilisée à Rennes.
- `planning.gwtClientId` — identifiant client GWT du Planning adesoft (visible dans les requêtes RPC de `myplanning.jsp`).
- `grades.origin` — origine du ScoDoc (ex. `https://notes9.iutlan.univ-rennes1.fr`). Le serveur y rejoue la session CAS (`/services/doAuth.php`) puis lit `data.php?q=dataPremièreConnexion` et la photo étudiante. Requis quand `features.grades === true`.
- `mail` — requis quand `features.mail === true` (endpoint `GET /__ent_auth/mail/recent`, contrat dans `src/entApi.js#getRecentMail`) :
  ```js
  mail: {
    provider: 'zimbra',                         // seul fournisseur implémenté (Zimbra / RENATER Partage)
    origin: 'https://partage.univ-rennes.fr',   // origine du webmail
    webmailUrl: mailWebmailUrl,                 // page d'entrée du webmail (défaut : origin)
    maxMessages: 5,                             // 1–20
    signInDomains: ['partage.renater.fr'],        // domaines autorisés pendant la connexion SSO (HTTPS uniquement), en plus du webmail et du CAS
  }
  ```
  Le serveur parcourt la chaîne SSO du webmail (Shibboleth → CAS) avec une copie du cookie jar de session, puis lit la boîte via l'API Zimbra (SOAP `SearchRequest`/`GetFolderRequest`, repli REST `/service/home/~/inbox?fmt=json`). Résultat mis en cache 2 min par session. Le compte démo renvoie des mails fictifs. Pour un autre webmail (SOGo, Roundcube, Exchange…), ajoutez une fonction dans `MAIL_PROVIDERS` (`server/entAuthApp.js`) qui renvoie `{ unreadCount, webmailHref, messages }` ; un `provider` inconnu répond `500 { error: 'Mail provider not configured' }`.

## Checklist de validation

1. `npm run lint && UNIVERSITY=<id> npm run build` — le build doit passer.
2. `UNIVERSITY=<id> npm run dev` — page de connexion : logo, textes, liens d'aide corrects.
3. Connexion démo (`demo@l-ent.app` / `lent-demo`) si `features.demo` — dashboard, grille d'applications.
4. **Connexion réelle** avec un compte étudiant — c'est le seul test qui exerce CAS, le proxy ENT et les services activés.
5. `grep -ri '<votre-univ>' src/ server/` ne doit rien retourner : tout doit vivre dans `universities/<id>/`.

## Ce qui n'est pas couvert

Le backend suppose un ENT **uPortal** derrière un **CAS Apereo**. Si votre université utilise un autre portail (ex : Esup-Pod seul, ENT non-uPortal) ou un autre SSO (OIDC, SAML direct), il faudra adapter `server/entAuthApp.js` (fonction `performEntLogin` et endpoints `/__ent_auth/*`). Les contributions généralisant ces points sont bienvenues.
