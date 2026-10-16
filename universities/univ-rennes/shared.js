// Université de Rennes — values shared by the client and server configs.
// Pure data only: this file is imported by Node at runtime, so it must not
// import assets (images, CSS) or browser-only modules.

export const id = 'univ-rennes'

export const university = {
  name: 'Université de Rennes',
  shortName: 'Rennes',
}

// Branding text (no assets here — the logo lives in client.js so this file
// stays importable by Node).
export const branding = {
  appName: 'Tafac',
  defaultTitle: "Tafac | Cours, notes et services de ton université",
  seoTitle: "Tafac - Cours, notes et services de ton université",
  seoDescription:
    "Tafac réunit ta vie universitaire avec tes cours, notes et messagerie dans une seule application rapide et agréable à utiliser.",
  pwaDescription:
    "Tafac réunit ta vie universitaire avec tes cours, notes et messagerie dans une seule application rapide et agréable à utiliser.",
  logoAlt: 'Université de Rennes',
  sidebarLogoAlt: "Tafac - Université de Rennes",
  loginFooterLine: "Client alternatif à l'ENT de l'Université de Rennes",
  about: {
    intro: "est un client alternatif aux services numériques de l'Université de Rennes.",
    disclaimer:
      "Tafac est un projet étudiant indépendant, non officiel et non affilié à l'Université de Rennes. Tes identifiants servent uniquement à te connecter et ne sont jamais stockés.",
    authorLine: "Fait avec amour par des étudiants de l'IUT de Lannion",
    authors: [
      {
        name: 'Elouan',
        handle: 'Klaynight',
        role: "Étudiant au BUT Informatique de Lannion",
        avatar: 'https://github.com/Klaynight-dev.png',
        url: 'https://klaynight.fr',
        github: 'https://github.com/Klaynight-dev',
      },
      {
        name: 'Tom',
        handle: 'tom-things',
        role: "Étudiant au BUT Informatique de Lannion",
        avatar: 'https://github.com/tom-things.png',
        url: 'https://tomthings.fr',
        github: 'https://github.com/tom-things',
      },
    ],
    authorUrl: 'https://tomthings.fr',
    repoUrl: 'https://github.com/l-ent-univ/tafac',
  },
}

// Public origin of the ENT portal — used by the frontend to normalize URLs
// before sending them through the local proxy, and by the server as the
// proxy target.
export const entOrigin = 'https://services-numeriques.univ-rennes.fr'

// CAS SSO origin. Public: browsers are redirected there during login; the
// frontend uses it to recognize CAS hops in launch chains.
export const casOrigin = 'https://sso-cas.univ-rennes.fr'

// uPortal landing page: login entry point, default Referer for proxied
// requests, and the URL whose response proves a CAS login landed back
// authenticated.
export const portalEntryPath = '/f/services/normal/render.uP'

// Feature switchboard. A missing/false feature hides its widgets, nav items
// and server endpoints.
export const features = {
  ade: true,
  planning: true,
  moodle: true,
  grades: true,
  mail: true,
  moodleDeadlines: true,
  // « Certificat de scolarité » in Réglages › Compte, from MonDossierWeb.
  schoolCertificate: true,
  weather: { enabled: true, defaultCity: 'Rennes' },
  serviceCategories: false,
  demo: true,
}

// Public launch URL of the planning service (opened through /__ent_auth/launch).
export const planningServiceUrl = 'https://planning.univ-rennes.fr/portal/planning/calendar'

export const gradesOrigin = 'https://notes9.iutlan.univ-rennes1.fr'
export const gradesServiceUrl = `${gradesOrigin}/services/doAuth.php?href=${encodeURIComponent(`${gradesOrigin}/`)}`

// Moodle (FOAD). Public: the sidebar and tab bar link to it, the server signs
// in there for the "Échéances Moodle" widget.
export const moodleOrigin = 'https://foad.univ-rennes.fr'

// Webmail ("Messagerie"): RENATER Partage (Zimbra), behind Shibboleth → CAS.
// Opened through /__ent_auth/launch by the "Mails récents" widget.
export const mailWebmailUrl = 'https://partage.univ-rennes.fr/'

// Fallback copy shown when the upstream grade service is unavailable.
export const gradesCopy = {
  unavailableTitle: 'Notes indisponibles',
  unavailableDetail: 'ScoDoc ne répond pas pour le moment',
  disabledPillLabel: 'Notes indisponibles',
  // Secrétariat qui reçoit les justificatifs d'absence, par acronyme de
  // département ScoDoc (« MMI », « INFO »…), `default` pour les autres. Le bouton
  // « Justifier » ouvre un mail pré-rempli (mailto:) : rien ne transite par
  // Tafac. Sans adresse, le bouton n'apparaît pas.
  // Exemple : { MMI: 'secretariat-mmi@univ-rennes.fr' }
  absenceSecretariats: {},
}
