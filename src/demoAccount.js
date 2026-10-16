export const DEMO_SESSION_MODE = 'demo'

export const DEMO_CREDENTIALS = Object.freeze({
  username: 'demo@tafac.fr',
  password: 'tafac-demo',
})

const DEMO_DEFAULT_FAVORITE_IDS = [
  'demo-mail',
  'demo-planning',
  'demo-moodle',
  'demo-directory',
]

const DEMO_SCHEDULE_TEMPLATES = [
  {
    key: 'ux-writing',
    dayOffset: 0,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 120,
    title: 'R5.07 UX Writing',
    teacher: 'M. Le Goff',
    teacherId: 'prof-legoff',
    location: 'B03 - Salle Atelier',
  },
  {
    key: 'sae-proto',
    dayOffset: 1,
    startHour: 13,
    startMinute: 30,
    durationMinutes: 180,
    title: 'SAE Prototype interactif',
    teacher: 'Mme Le Fur',
    teacherId: 'prof-lefur',
    location: 'C12 - FabLab',
  },
  {
    key: 'dev-front',
    dayOffset: 2,
    startHour: 10,
    startMinute: 15,
    durationMinutes: 105,
    title: 'R5.11 Développement Front',
    teacher: 'M. Lemoine',
    teacherId: 'prof-lemoine',
    location: 'A08 - Info 2',
  },
  {
    key: 'culture-num',
    dayOffset: 3,
    startHour: 15,
    startMinute: 15,
    durationMinutes: 90,
    title: 'R5.02 Culture numérique',
    teacher: 'Mme Martin',
    teacherId: 'prof-martin',
    location: 'Amphi 2',
  },
]

const DEMO_APPLICATIONS = Object.freeze([
  {
    id: 'demo-mail',
    fname: 'demo-messagerie',
    title: 'Messagerie',
    description: 'Consulter un webmail de démonstration.',
    href: 'https://outlook.office.com/mail/',
    target: '_blank',
  },
  {
    id: 'demo-planning',
    fname: 'demo-emploi-du-temps',
    title: 'Emplois du temps',
    description: 'Ouvrir un calendrier public.',
    href: 'https://calendar.google.com/',
    target: '_blank',
  },
  {
    id: 'demo-moodle',
    fname: 'demo-moodle',
    title: 'Moodle',
    description: 'Découvrir une plateforme de cours en ligne.',
    href: 'https://moodle.org/',
    target: '_blank',
  },
  {
    id: 'demo-directory',
    fname: 'demo-annuaire',
    title: 'Annuaire',
    description: 'Parcourir un annuaire public.',
    href: 'https://www.pagesjaunes.fr/',
    target: '_blank',
  },
  {
    id: 'demo-docs',
    fname: 'demo-documentation',
    title: 'Documentation services',
    description: 'Lire une documentation produit publique.',
    href: 'https://support.microsoft.com/',
    target: '_blank',
  },
  {
    id: 'demo-help',
    fname: 'demo-assistance',
    title: 'Assistance',
    description: 'Consulter une page d’aide.',
    href: 'https://support.google.com/',
    target: '_blank',
  },
  {
    id: 'demo-webconf',
    fname: 'demo-webconference',
    title: 'Webconference',
    description: 'Lancer une visioconférence publique.',
    href: 'https://meet.jit.si/',
    target: '_blank',
  },
  {
    id: 'demo-365',
    fname: 'demo-m365',
    title: 'Microsoft 365',
    description: 'Voir la suite bureautique en ligne.',
    href: 'https://www.microsoft.com/microsoft-365',
    target: '_blank',
  },
])

const DEMO_APPLICATIONS_BY_ID = new Map(DEMO_APPLICATIONS.map((application) => [application.id, application]))
const DEMO_APPLICATIONS_BY_FNAME = new Map(DEMO_APPLICATIONS.map((application) => [application.fname, application]))

const DEMO_TREE_ROOT = Object.freeze({
  id: '-100',
  name: 'Ressources',
  path: 'Ressources',
  children: [
    {
      id: '10',
      name: 'IUT Lannion',
      path: 'Université de Rennes / IUT Lannion',
      children: [
        {
          id: '110',
          name: 'BUT MMI',
          path: 'Université de Rennes / IUT Lannion / BUT MMI',
          children: [
            {
              id: '111',
              name: 'MMI 2',
              path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2',
              children: [
                {
                  id: '1111',
                  name: 'TD A',
                  path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2 / TD A',
                  children: [
                    {
                      id: '11111',
                      name: 'TP 1',
                      path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2 / TD A / TP 1',
                      children: [],
                    },
                    {
                      id: '11112',
                      name: 'TP 2',
                      path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2 / TD A / TP 2',
                      children: [],
                    },
                  ],
                },
                {
                  id: '1112',
                  name: 'TD B',
                  path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2 / TD B',
                  children: [
                    {
                      id: '11121',
                      name: 'TP 3',
                      path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 2 / TD B / TP 3',
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              id: '112',
              name: 'MMI 1',
              path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 1',
              children: [
                {
                  id: '1121',
                  name: 'TD A',
                  path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 1 / TD A',
                  children: [
                    {
                      id: '11211',
                      name: 'TP 1',
                      path: 'Université de Rennes / IUT Lannion / BUT MMI / MMI 1 / TD A / TP 1',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: '-2',
      name: 'Enseignants',
      path: 'Enseignants',
      family: 'instructor',
      children: [
        { id: 'prof-legoff', name: 'M. Le Goff', path: 'Enseignants / M. Le Goff', family: 'instructor', children: [] },
        { id: 'prof-lefur', name: 'Mme Le Fur', path: 'Enseignants / Mme Le Fur', family: 'instructor', children: [] },
        { id: 'prof-lemoine', name: 'M. Lemoine', path: 'Enseignants / M. Lemoine', family: 'instructor', children: [] },
        { id: 'prof-martin', name: 'Mme Martin', path: 'Enseignants / Mme Martin', family: 'instructor', children: [] },
      ],
    },
  ],
})

const DEMO_DEFAULT_TREE_PATH = Object.freeze(['-100', '10', '110', '111', '1111', '11111'])

function cloneDemoValue(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createDemoAvatarDataUri(initials = 'CM') {
  // Just the initials on a flat warm tone; the app crops it to a circle.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Avatar demo"><rect width="128" height="128" fill="#ebe4d6"/><text x="64" y="64" dy="0.35em" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="600" fill="#341200">${escapeHtml(initials)}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const DEMO_ACCOUNT = Object.freeze({
  preferred_username: DEMO_CREDENTIALS.username,
  given_name: 'Camille',
  family_name: 'Martin',
  email: DEMO_CREDENTIALS.username,
  mail: DEMO_CREDENTIALS.username,
  name: 'Camille Martin',
  picture: createDemoAvatarDataUri('CM'),
})

function normalizeDemoFavoriteIds(value) {
  if (!Array.isArray(value)) {
    return [...DEMO_DEFAULT_FAVORITE_IDS]
  }

  return value
    .map((id) => String(id ?? '').trim())
    .filter((id, index, ids) => id && ids.indexOf(id) === index && DEMO_APPLICATIONS_BY_ID.has(id))
}

export function isDemoCredentials(username, password) {
  return String(username ?? '').trim().toLowerCase() === DEMO_CREDENTIALS.username.toLowerCase()
    && String(password ?? '') === DEMO_CREDENTIALS.password
}

export function createInitialDemoState() {
  return {
    favoritePortletIds: [...DEMO_DEFAULT_FAVORITE_IDS],
  }
}

export function normalizeDemoState(value) {
  return {
    favoritePortletIds: normalizeDemoFavoriteIds(value?.favoritePortletIds),
  }
}

function getDemoApplicationPortlets(ids = []) {
  return ids
    .map((id) => DEMO_APPLICATIONS_BY_ID.get(id))
    .filter(Boolean)
    .map((application) => ({
      _objectType: 'portlet',
      ID: application.id,
      nodeId: application.id,
      chanID: application.id,
      fname: application.fname,
      title: application.title,
      name: application.title,
      description: application.description,
      portletName: 'app-launcher',
      typeID: '2',
      parameters: {
        launchUrl: application.href,
        description: application.description,
        target: application.target,
        stopImmediately: application.target === '_blank' ? 'true' : 'false',
      },
      widgetURL: application.href,
      url: application.href,
      target: application.target,
    }))
}

export function buildDemoLayoutData(demoStateInput) {
  const demoState = normalizeDemoState(demoStateInput)
  const favoritePortlets = getDemoApplicationPortlets(demoState.favoritePortletIds)
  const allPortlets = getDemoApplicationPortlets(DEMO_APPLICATIONS.map((application) => application.id))

  return {
    authenticated: 'true',
    user: DEMO_ACCOUNT.preferred_username,
    layout: {
      globals: {
        hasFavorites: 'true',
      },
      navigation: {
        tabs: [
          {
            ID: 'demo-tab-services',
            name: 'Services',
            content: [
              {
                _objectType: 'folder',
                ID: 'demo-folder-favorites',
                name: 'Favoris',
                content: favoritePortlets,
              },
              {
                _objectType: 'folder',
                ID: 'demo-folder-services',
                name: 'Toutes les applications',
                content: allPortlets,
              },
            ],
          },
        ],
        favorites: favoritePortlets,
      },
      favorites: favoritePortlets,
    },
  }
}

export function buildDemoLayoutDocData() {
  return DEMO_APPLICATIONS.map((application) => ({
    ID: application.id,
    nodeId: application.id,
    fname: application.fname,
    title: application.title,
    name: application.title,
    description: application.description,
    portletName: 'app-launcher',
    typeID: '2',
    parameters: {
      launchUrl: application.href,
      description: application.description,
      target: application.target,
      stopImmediately: application.target === '_blank' ? 'true' : 'false',
    },
    widgetURL: application.href,
    url: application.href,
    target: application.target,
  }))
}

export function buildDemoMarketplaceEntries() {
  return []
}

export function buildDemoPortletFragment(fname) {
  const application = DEMO_APPLICATIONS_BY_FNAME.get(String(fname ?? '').trim())
  if (!application) {
    return null
  }

  return `<div class="demo-portlet-fragment"><a href="${escapeHtml(application.href)}" target="${escapeHtml(application.target)}" rel="noreferrer">${escapeHtml(application.title)}</a></div>`
}

export function buildDemoPortletMetadata(fname) {
  const application = DEMO_APPLICATIONS_BY_FNAME.get(String(fname ?? '').trim())
  if (!application) {
    return null
  }

  return {
    ID: application.id,
    nodeId: application.id,
    fname: application.fname,
    title: application.title,
    name: application.title,
    description: application.description,
    portletName: 'app-launcher',
    typeID: '2',
    parameters: {
      launchUrl: application.href,
      description: application.description,
      target: application.target,
      stopImmediately: application.target === '_blank' ? 'true' : 'false',
    },
    widgetURL: application.href,
    url: application.href,
    target: application.target,
  }
}

function insertAfter(list, targetValue, nextValue) {
  const nextList = [...list]
  const targetIndex = nextList.indexOf(targetValue)

  if (targetIndex !== -1) {
    return nextList
  }

  if (nextValue && nextList.includes(nextValue)) {
    nextList.splice(nextList.indexOf(nextValue), 0, targetValue)
    return nextList
  }

  nextList.push(targetValue)
  return nextList
}

export function applyDemoLayoutMutation(requestPath, demoStateInput) {
  const demoState = normalizeDemoState(demoStateInput)
  const requestUrl = new URL(String(requestPath ?? '/api/layout'), 'https://demo.l-ent.local')

  if (requestUrl.pathname !== '/api/layout') {
    return {
      handled: false,
      demoState,
    }
  }

  const sourceId = String(
    requestUrl.searchParams.get('sourceId')
      || requestUrl.searchParams.get('sourceID')
      || '',
  ).trim()

  if (!DEMO_APPLICATIONS_BY_ID.has(sourceId)) {
    return {
      handled: true,
      demoState,
    }
  }

  const favoritePortletIds = demoState.favoritePortletIds.includes(sourceId)
    ? demoState.favoritePortletIds.filter((id) => id !== sourceId)
    : insertAfter(
      demoState.favoritePortletIds,
      sourceId,
      String(requestUrl.searchParams.get('nextNodeId') || '').trim(),
    )

  return {
    handled: true,
    demoState: normalizeDemoState({ favoritePortletIds }),
    payload: {
      ok: true,
      action: requestUrl.searchParams.get('action') || 'toggleFavorite',
      favoritePortletIds,
    },
  }
}

function findDemoTreeNodeById(node, targetId) {
  if (!node) {
    return null
  }

  if (String(node.id) === String(targetId)) {
    return node
  }

  for (const child of node.children ?? []) {
    const match = findDemoTreeNodeById(child, targetId)
    if (match) {
      return match
    }
  }

  return null
}

function findDemoTreePathIds(node, targetId, currentPath = []) {
  if (!node) {
    return null
  }

  const nextPath = [...currentPath, String(node.id)]
  if (String(node.id) === String(targetId)) {
    return nextPath
  }

  for (const child of node.children ?? []) {
    const match = findDemoTreePathIds(child, targetId, nextPath)
    if (match) {
      return match
    }
  }

  return null
}

function collectDemoTreeNodes(node, collector) {
  if (!node) {
    return
  }

  collector.push(node)

  for (const child of node.children ?? []) {
    collectDemoTreeNodes(child, collector)
  }
}

export function buildDemoAdeTreePayload(requestedResourceId = '') {
  const normalizedRequestedResourceId = String(requestedResourceId ?? '').trim()
  const hasRequestedResource = normalizedRequestedResourceId && findDemoTreeNodeById(DEMO_TREE_ROOT, normalizedRequestedResourceId)
  const focusResourceId = hasRequestedResource ? normalizedRequestedResourceId : DEMO_DEFAULT_TREE_PATH[DEMO_DEFAULT_TREE_PATH.length - 1]
  const currentPathIds = findDemoTreePathIds(DEMO_TREE_ROOT, focusResourceId) ?? [...DEMO_DEFAULT_TREE_PATH]

  return {
    source: 'demo',
    root: cloneDemoValue(DEMO_TREE_ROOT),
    currentResourceId: currentPathIds[currentPathIds.length - 1] ?? null,
    focusResourceId,
    currentPathIds,
  }
}

export function searchDemoAdeTree(query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const nodes = []
  collectDemoTreeNodes(DEMO_TREE_ROOT, nodes)

  return nodes
    .filter((node) => {
      const haystack = [node.name, node.path, node.id].join(' | ').toLowerCase()
      return haystack.includes(normalizedQuery) && String(node.id) !== '-100'
    })
    .map((node) => ({
      id: String(node.id),
      name: node.name,
      path: node.path,
      childrenCount: Array.isArray(node.children) ? node.children.length : 0,
    }))
}

function parseDateOnly(dateString) {
  const rawValue = String(dateString ?? '').trim()
  if (!rawValue) {
    return new Date()
  }

  const parts = rawValue.split('-').map((part) => Number.parseInt(part, 10))
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return new Date(rawValue)
  }

  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
}

function formatDateOnly(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  const currentDay = nextDate.getDay()
  const shift = currentDay === 0 ? -6 : 1 - currentDay
  nextDate.setDate(nextDate.getDate() + shift)
  return nextDate
}

function addDays(date, amount) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function makeLocalDateTime(date, hours, minutes) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  )
}

function getSelectionLabel(selection = null) {
  return selection?.tpLabel
    || selection?.tdLabel
    || selection?.yearLabel
    || 'TP 1'
}

export const DEMO_TEACHERS = Object.freeze([
  { id: 'prof-legoff', name: 'M. Le Goff' },
  { id: 'prof-lefur', name: 'Mme Le Fur' },
  { id: 'prof-lemoine', name: 'M. Lemoine' },
  { id: 'prof-martin', name: 'Mme Martin' },
])

const DEMO_TEACHER_SCHEDULES = {
  'prof-legoff': [
    { key: 'ux-writing-tp1', dayOffset: 0, startHour: 9, startMinute: 0, durationMinutes: 120, title: 'R5.07 UX Writing', groups: ['TP 1', 'TD A'], location: 'B03 - Salle Atelier' },
    { key: 'ux-writing-tp2', dayOffset: 1, startHour: 14, startMinute: 0, durationMinutes: 120, title: 'R5.07 UX Writing', groups: ['TP 2', 'TD A'], location: 'B03 - Salle Atelier' },
    { key: 'ergo-mmi1', dayOffset: 3, startHour: 10, startMinute: 0, durationMinutes: 120, title: 'R1.05 Ergonomie', groups: ['MMI 1'], location: 'B03 - Salle Atelier' },
  ],
  'prof-lefur': [
    { key: 'design-mmi1', dayOffset: 0, startHour: 14, startMinute: 0, durationMinutes: 180, title: 'R1.02 Design graphique', groups: ['MMI 1'], location: 'C12 - FabLab' },
    { key: 'sae-proto', dayOffset: 1, startHour: 13, startMinute: 30, durationMinutes: 180, title: 'SAE Prototype interactif', groups: ['TP 1'], location: 'C12 - FabLab' },
    { key: 'workshop-ux', dayOffset: 4, startHour: 9, startMinute: 0, durationMinutes: 180, title: 'Workshop Design Sprint', groups: ['TP 2'], location: 'C12 - FabLab' },
  ],
  'prof-lemoine': [
    { key: 'algo-tp2', dayOffset: 0, startHour: 14, startMinute: 0, durationMinutes: 120, title: 'Algorithmique & Web', groups: ['TP 2'], location: 'A08 - Info 2' },
    { key: 'dev-front', dayOffset: 2, startHour: 10, startMinute: 15, durationMinutes: 105, title: 'R5.11 Développement Front', groups: ['TP 1'], location: 'A08 - Info 2' },
    { key: 'frameworks-mmi3', dayOffset: 3, startHour: 14, startMinute: 0, durationMinutes: 120, title: 'Frameworks Web & API', groups: ['MMI 3'], location: 'A08 - Info 2' },
  ],
  'prof-martin': [
    { key: 'culture-mmi1', dayOffset: 1, startHour: 10, startMinute: 0, durationMinutes: 90, title: 'R1.01 Culture numérique', groups: ['MMI 1'], location: 'Amphi 2' },
    { key: 'culture-num', dayOffset: 3, startHour: 15, startMinute: 15, durationMinutes: 90, title: 'R5.02 Culture numérique', groups: ['TP 1', 'TP 2', 'TD A'], location: 'Amphi 2' },
    { key: 'veille-tp1', dayOffset: 4, startHour: 10, startMinute: 0, durationMinutes: 120, title: 'Veille & Éthique du web', groups: ['TP 1'], location: 'B01' },
  ],
}

function buildDemoEventsForWeek(anchorDate, selectionLabel, resourceId = null) {
  const weekStart = startOfWeek(anchorDate)

  if (resourceId && DEMO_TEACHER_SCHEDULES[resourceId]) {
    const teacherMeta = DEMO_TEACHERS.find((t) => t.id === resourceId)
    const teacherName = teacherMeta?.name ?? 'Enseignant'
    return DEMO_TEACHER_SCHEDULES[resourceId].map((template) => {
      const eventDate = addDays(weekStart, template.dayOffset)
      const start = makeLocalDateTime(eventDate, template.startHour, template.startMinute)
      const end = new Date(start.getTime() + template.durationMinutes * 60 * 1000)

      return {
        id: `${template.key}-${formatDateOnly(start)}`,
        title: template.title,
        teacher: teacherName,
        teachers: [{ id: resourceId, name: teacherName }],
        location: template.location,
        description: template.title,
        groups: template.groups,
        start: start.toISOString(),
        end: end.toISOString(),
      }
    })
  }

  return DEMO_SCHEDULE_TEMPLATES.map((template) => {
    const eventDate = addDays(weekStart, template.dayOffset)
    const start = makeLocalDateTime(eventDate, template.startHour, template.startMinute)
    const end = new Date(start.getTime() + template.durationMinutes * 60 * 1000)

    return {
      id: `${template.key}-${formatDateOnly(start)}`,
      title: template.title,
      teacher: template.teacher,
      teachers: [{ id: template.teacherId, name: template.teacher }],
      location: template.location,
      description: template.title,
      groups: [selectionLabel],
      start: start.toISOString(),
      end: end.toISOString(),
    }
  })
}

function normalizeSelectionFromResource(resourceId = '') {
  const normalizedResourceId = String(resourceId ?? '').trim()
  if (normalizedResourceId && DEMO_TEACHER_SCHEDULES[normalizedResourceId]) {
    const teacher = DEMO_TEACHERS.find((t) => t.id === normalizedResourceId)
    return {
      resourceId: normalizedResourceId,
      label: teacher?.name ?? 'Enseignant',
    }
  }

  const currentPathIds = findDemoTreePathIds(DEMO_TREE_ROOT, normalizedResourceId) ?? DEMO_DEFAULT_TREE_PATH
  const selectedNode = findDemoTreeNodeById(DEMO_TREE_ROOT, currentPathIds[currentPathIds.length - 1])

  return {
    resourceId: selectedNode ? String(selectedNode.id) : DEMO_DEFAULT_TREE_PATH[DEMO_DEFAULT_TREE_PATH.length - 1],
    label: selectedNode?.name ?? 'TP 1',
  }
}

function buildWeekLabel(weekStart) {
  const weekEnd = addDays(weekStart, 4)
  return `Semaine du ${formatDateOnly(weekStart)} au ${formatDateOnly(weekEnd)}`
}

export function buildDemoTimetablePayload({ date, resourceId } = {}) {
  const anchorDate = parseDateOnly(date || formatDateOnly(new Date()))
  const resolvedSelection = normalizeSelectionFromResource(resourceId)
  const weekStart = startOfWeek(anchorDate)
  const events = buildDemoEventsForWeek(anchorDate, resolvedSelection.label, resolvedSelection.resourceId)

  return {
    source: 'demo',
    date: formatDateOnly(anchorDate),
    resourceId: resolvedSelection.resourceId,
    weekLabel: buildWeekLabel(weekStart),
    resolvedWeek: {
      label: buildWeekLabel(weekStart),
      start: formatDateOnly(weekStart),
      end: formatDateOnly(addDays(weekStart, 6)),
      current: formatDateOnly(startOfWeek(new Date())) === formatDateOnly(weekStart),
    },
    outOfRange: false,
    dayLabels: Array.from({ length: 5 }, (_, index) => formatDateOnly(addDays(weekStart, index))),
    events,
  }
}

export function buildDemoPlanningPayload({ date, resourceId } = {}) {
  const timetable = buildDemoTimetablePayload({ date, resourceId })
  return {
    events: timetable.events,
    weekLabel: timetable.weekLabel,
    dayLabels: timetable.dayLabels,
    resolvedWeek: timetable.resolvedWeek,
    outOfRange: timetable.outOfRange,
  }
}

export function buildDemoCalendarPayload({ date, resourceId } = {}) {
  const anchorDate = parseDateOnly(date || formatDateOnly(new Date()))
  const weekStart = startOfWeek(anchorDate)
  const resolvedSelection = normalizeSelectionFromResource(resourceId)
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const currentWeekStart = addDays(weekStart, index * 7)
    const currentWeekEnd = addDays(currentWeekStart, 6)

    return {
      index,
      label: buildWeekLabel(currentWeekStart),
      start: formatDateOnly(currentWeekStart),
      end: formatDateOnly(currentWeekEnd),
      current: index === 0,
    }
  })

  return {
    source: 'demo',
    resourceId: resolvedSelection.resourceId,
    currentResourceId: resolvedSelection.resourceId,
    requestedResourceId: String(resourceId ?? '').trim() || resolvedSelection.resourceId,
    targetDate: formatDateOnly(anchorDate),
    targetDateMatched: true,
    outOfRange: false,
    matchedWeek: weeks[0],
    currentWeek: weeks[0],
    firstWeek: weeks[0],
    lastWeek: weeks[weeks.length - 1],
    weekCount: weeks.length,
    weeks,
  }
}

export function buildDemoUpcomingPayload({ date, lookaheadDays = 14, selection = null } = {}) {
  const requestedDate = parseDateOnly(date || formatDateOnly(new Date()))
  const selectionLabel = getSelectionLabel(selection)
  const upcomingEvents = [
    ...buildDemoEventsForWeek(requestedDate, selectionLabel),
    ...buildDemoEventsForWeek(addDays(requestedDate, 7), selectionLabel),
  ]
    .filter((event) => {
      const eventStart = new Date(event.start)
      const maxDate = addDays(requestedDate, lookaheadDays)
      return eventStart >= requestedDate && eventStart <= maxDate
    })
    .sort((left, right) => left.start.localeCompare(right.start))

  return {
    source: 'demo',
    date: formatDateOnly(requestedDate),
    lookaheadDays,
    complete: true,
    resourceIds: [
      selection?.tpResourceId,
      selection?.tdResourceId,
      selection?.yearResourceId,
      selection?.resourceId,
    ].filter(Boolean).map((value) => String(value)),
    selectionLabels: [selectionLabel],
    events: upcomingEvents,
    nextEvent: upcomingEvents[0] ?? null,
  }
}

export function buildDemoAlertsPayload() {
  return [
    {
      level: 'info',
      title: 'Mode démo',
      message: 'Certaines applications ouvrent des pages publiques pour illustrer le parcours.',
    },
  ]
}

// Demo ScoDoc data, shaped like the notes9 passerelle answers (ScoDoc 9 BUT
// bulletin): evaluation notes are on /20 and note.min/moy/max are promo
// stats; module averages are left empty, as ScoDoc does for BUT.
const DEMO_GRADES_SEMESTERS = Object.freeze([
  { formsemestre_id: 9104, titre: 'BUT MMI', annee_scolaire: '2025/2026', semestre_id: 4 },
  { formsemestre_id: 9105, titre: 'BUT MMI', annee_scolaire: '2026/2027', semestre_id: 5 },
])

export const DEMO_GRADES_DEPARTMENT_MESSAGE = '<p>Les jurys du semestre 5 auront lieu le <b>28 janvier</b>.<br>Pensez à vérifier vos notes et à signaler toute erreur à votre enseignant avant le 20 janvier.</p>'

function buildDemoEvaluation(id, { description, date, coef = '1.00', type = 0, weights, value, min, moy, max }) {
  return {
    id,
    description,
    date,
    date_debut: `${date}T08:15:00`,
    date_fin: `${date}T10:15:00`,
    coef: type === 0 ? coef : null,
    evaluation_type: type,
    poids: weights,
    note: { value, min, moy, max },
    url: '',
  }
}

function buildDemoStudent() {
  return {
    prenom: 'Camille',
    nom: 'MARTIN',
    civilite: 'X',
    dept_acronym: 'MMI',
    photo_url: '/ScoDoc/MMI/api/etudiant/photo',
  }
}

const DEMO_FORMATION = Object.freeze({
  acronyme: 'BUT MMI',
  titre: "BUT Métiers du Multimédia et de l'Internet",
  titre_officiel: "Bachelor Universitaire de Technologie Métiers du Multimédia et de l'Internet",
})

const DEMO_OPTIONS = Object.freeze({
  show_abs: true,
  show_ects: true,
  show_minmax: true,
  show_moypromo: true,
  show_rangs: true,
  show_ue_rangs: true,
})

function buildDemoS5Releve() {
  return {
    version: '0',
    type: 'BUT',
    date: '2026-10-14T08:00:00Z',
    publie: true,
    etat_inscription: 'I',
    etudiant: buildDemoStudent(),
    formation: DEMO_FORMATION,
    formsemestre_id: 9105,
    options: DEMO_OPTIONS,
    ressources: {
      'R5.07': {
        id: 51007,
        titre: 'UX Writing',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70101, { description: 'Atelier persona', date: '2026-09-17', weights: { 'UE5.1': 1, 'UE5.2': 0.5 }, value: '14.00', min: '6.50', moy: '12.60', max: '18.00' }),
          buildDemoEvaluation(70102, { description: 'Audit éditorial', date: '2026-10-06', coef: '2.00', weights: { 'UE5.1': 1, 'UE5.2': 1 }, value: '17.00', min: '8.00', moy: '13.90', max: '19.00' }),
        ],
      },
      'R5.11': {
        id: 51011,
        titre: 'Développement Front',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70111, { description: 'Composants React', date: '2026-09-24', coef: '2.00', weights: { 'UE5.3': 1 }, value: '16.00', min: '4.00', moy: '12.50', max: '19.50' }),
          buildDemoEvaluation(70112, { description: 'Accessibilité UI', date: '2026-10-09', weights: { 'UE5.3': 1 }, value: '18.00', min: '9.00', moy: '13.20', max: '18.50' }),
        ],
      },
      'R5.04': {
        id: 51004,
        titre: 'Gestion de projet',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70141, { description: 'Note de cadrage', date: '2026-09-22', weights: { 'UE5.1': 1 }, value: '11.50', min: '5.00', moy: '11.80', max: '16.00' }),
          buildDemoEvaluation(70142, { description: 'Soutenance de cadrage', date: '2026-10-13', weights: { 'UE5.1': 1 }, value: '~', min: '', moy: '', max: '' }),
        ],
      },
      'R5.02': {
        id: 51002,
        titre: 'Anglais',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70121, { description: 'Compréhension écrite', date: '2026-09-15', weights: { 'UE5.2': 1 }, value: 'ABS', min: '7.00', moy: '13.10', max: '18.00' }),
          buildDemoEvaluation(70122, { description: 'Oral : pitch produit', date: '2026-10-01', weights: { 'UE5.2': 1 }, value: '12.75', min: '8.25', moy: '12.40', max: '17.50' }),
          buildDemoEvaluation(70123, { description: 'Compréhension écrite (rattrapage)', date: '2026-10-08', type: 1, weights: { 'UE5.2': 1 }, value: '13.50', min: '9.00', moy: '11.00', max: '13.50' }),
        ],
      },
      'R5.09': {
        id: 51009,
        titre: 'Culture numérique',
        moyenne: {},
        evaluations: [],
      },
    },
    saes: {
      'SAÉ 5.01': {
        id: 52001,
        titre: 'Prototype interactif',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70201, { description: 'Sprint review', date: '2026-09-30', coef: '2.00', weights: { 'UE5.1': 0.5, 'UE5.3': 1 }, value: '15.50', min: '9.50', moy: '12.70', max: '17.00' }),
          buildDemoEvaluation(70202, { description: 'Démo client', date: '2026-10-10', weights: { 'UE5.1': 1, 'UE5.3': 1 }, value: '14.00', min: '7.00', moy: '12.10', max: '16.50' }),
        ],
      },
      'SAÉ 5.02': {
        id: 52002,
        titre: 'Portfolio',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(70211, { description: 'Revue de portfolio', date: '2026-10-02', weights: { 'UE5.2': 1 }, value: '9.50', min: '5.50', moy: '11.40', max: '16.00' }),
        ],
      },
    },
    ues: {
      'UE5.1': {
        id: 5001,
        titre: 'Concevoir une réponse stratégique',
        numero: 1,
        type: 0,
        color: '#b80004',
        competence: null,
        moyenne: { value: '14.62', min: '6.90', max: '17.80', moy: '12.40', rang: '12', total: 84 },
        bonus: null,
        malus: null,
        capitalise: null,
        ressources: {
          'R5.07': { id: 51007, coef: 3, moyenne: '15.33' },
          'R5.04': { id: 51004, coef: 2, moyenne: '11.50' },
        },
        saes: {
          'SAÉ 5.01': { id: 52001, coef: 4, moyenne: '14.60' },
        },
        ECTS: { acquis: 0, total: 10 },
      },
      'UE5.2': {
        id: 5002,
        titre: 'Exprimer un message',
        numero: 2,
        type: 0,
        color: '#f97b3d',
        competence: null,
        moyenne: { value: '12.48', min: '5.10', max: '16.90', moy: '12.05', rang: '38', total: 84 },
        bonus: null,
        malus: null,
        capitalise: null,
        ressources: {
          'R5.07': { id: 51007, coef: 2, moyenne: '15.80' },
          'R5.02': { id: 51002, coef: 2, moyenne: '13.13' },
          'R5.09': { id: 51009, coef: 1, moyenne: '' },
        },
        saes: {
          'SAÉ 5.02': { id: 52002, coef: 3, moyenne: '9.50' },
        },
        ECTS: { acquis: 0, total: 10 },
      },
      'UE5.3': {
        id: 5003,
        titre: 'Développer pour le web',
        numero: 3,
        type: 0,
        color: '#feb40b',
        competence: null,
        moyenne: { value: '15.96', min: '7.40', max: '18.20', moy: '12.88', rang: '6', total: 84 },
        bonus: '0.10',
        malus: null,
        capitalise: null,
        ressources: {
          'R5.11': { id: 51011, coef: 4, moyenne: '16.67' },
        },
        saes: {
          'SAÉ 5.01': { id: 52001, coef: 4, moyenne: '15.00' },
        },
        ECTS: { acquis: 0, total: 10 },
      },
    },
    semestre: {
      numero: 5,
      annee_universitaire: '2026/2027',
      date_debut: '2026-09-01',
      date_fin: '2027-01-24',
      inscription: '',
      groupes: [
        { group_name: 'TD B', partition: { partition_name: 'TD' } },
        { group_name: 'TP 3', partition: { partition_name: 'TP' } },
      ],
      notes: { value: '14.35', min: '7.84', moy: '12.44', max: '17.40' },
      rang: { value: '9', total: 84 },
      ECTS: { acquis: 0, total: 30 },
      absences: { injustifie: 2, total: 6, metrique: 'H.' },
    },
    appreciation: [],
  }
}

function buildDemoS4Releve() {
  return {
    version: '0',
    type: 'BUT',
    date: '2026-06-30T08:00:00Z',
    publie: true,
    etat_inscription: 'I',
    etudiant: buildDemoStudent(),
    formation: DEMO_FORMATION,
    formsemestre_id: 9104,
    options: DEMO_OPTIONS,
    ressources: {
      'R4.01': {
        id: 41001,
        titre: 'Stratégie de communication',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(60101, { description: 'Recommandation stratégique', date: '2026-02-12', coef: '2.00', weights: { 'UE4.1': 1 }, value: '13.00', min: '6.00', moy: '11.90', max: '17.00' }),
          buildDemoEvaluation(60102, { description: 'QCM', date: '2026-03-19', weights: { 'UE4.1': 1 }, value: '15.25', min: '5.50', moy: '12.30', max: '19.00' }),
        ],
      },
      'R4.08': {
        id: 41008,
        titre: 'Développement back',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(60181, { description: 'API REST', date: '2026-03-05', coef: '2.00', weights: { 'UE4.2': 1 }, value: '16.50', min: '3.00', moy: '11.60', max: '19.00' }),
        ],
      },
    },
    saes: {
      'SAÉ 4.01': {
        id: 42001,
        titre: 'Site e-commerce',
        moyenne: {},
        evaluations: [
          buildDemoEvaluation(60201, { description: 'Soutenance finale', date: '2026-05-28', coef: '3.00', weights: { 'UE4.1': 1, 'UE4.2': 1 }, value: '15.00', min: '8.00', moy: '12.80', max: '18.00' }),
        ],
      },
    },
    ues: {
      'UE4.1': {
        id: 4001,
        titre: 'Concevoir une réponse stratégique',
        numero: 1,
        type: 0,
        color: '#b80004',
        moyenne: { value: '14.55', min: '7.20', max: '17.60', moy: '12.30', rang: '15', total: 86 },
        ressources: { 'R4.01': { id: 41001, coef: 3, moyenne: '13.75' } },
        saes: { 'SAÉ 4.01': { id: 42001, coef: 4, moyenne: '15.00' } },
        ECTS: { acquis: 15, total: 15 },
      },
      'UE4.2': {
        id: 4002,
        titre: 'Développer pour le web',
        numero: 2,
        type: 0,
        color: '#feb40b',
        moyenne: { value: '15.64', min: '6.10', max: '18.40', moy: '12.20', rang: '8', total: 86 },
        ressources: { 'R4.08': { id: 41008, coef: 4, moyenne: '16.50' } },
        saes: { 'SAÉ 4.01': { id: 42001, coef: 4, moyenne: '15.00' } },
        ECTS: { acquis: 15, total: 15 },
      },
    },
    semestre: {
      numero: 4,
      annee_universitaire: '2025/2026',
      date_debut: '2026-01-19',
      date_fin: '2026-06-30',
      groupes: [{ group_name: 'TD B', partition: { partition_name: 'TD' } }],
      notes: { value: '15.08', min: '7.60', moy: '12.25', max: '17.90' },
      rang: { value: '11', total: 86 },
      ECTS: { acquis: 30, total: 30 },
      absences: { injustifie: 0, total: 2, metrique: 'H.' },
    },
    appreciation: [{ comment: 'Très bon semestre, travail régulier et sérieux.' }],
  }
}

function buildDemoS5Absences() {
  return {
    '2026-09-25': [
      { debut: 8.25, fin: 10.25, statut: 'absent', justifie: false, enseignant: 'thomas.lemoine@univ-rennes.fr', matiereComplet: 51011 },
    ],
    '2026-09-29': [
      { debut: 13.5, fin: 15.5, statut: 'absent', justifie: true, enseignant: 'anne.lefur@univ-rennes.fr', matiereComplet: 52001 },
    ],
    '2026-10-06': [
      { debut: 10.25, fin: 10.5, statut: 'retard', justifie: false, enseignant: 'julie.morvan@univ-rennes.fr', matiereComplet: 'R5.02 - Anglais' },
      { debut: 14, fin: 16, statut: 'absent', justifie: true, enseignant: 'thomas.lemoine@univ-rennes.fr', matiereComplet: 51011 },
    ],
  }
}

const DEMO_GRADES_CONFIG = Object.freeze({
  releve_PDF: false,
  afficher_absences: true,
  liste_dep_publi_absences: '',
  metrique_absences: 'heure',
  message_rapport_absences: "Les causes de l’absence doivent être notifiées par écrit à l'aide d'un justificatif dans les 48 heures à compter du début de l’absence au secrétariat du département.",
  liste_dep_affichage_appreciations: 'MMI',
  autoriser_justificatifs: false,
  // Fictive: lets the "Justifier" button show in the demo.
  absence_secretariat: 'secretariat@exemple.fr',
})

export function buildDemoGradesPayload() {
  return {
    auth: { session: 'demo', statut: 10 },
    config: DEMO_GRADES_CONFIG,
    semestres: DEMO_GRADES_SEMESTERS.map((semester) => ({ ...semester })),
    'relevé': buildDemoS5Releve(),
    absences: buildDemoS5Absences(),
  }
}

export function buildDemoSemesterGradesPayload(semesterId) {
  const releves = {
    9104: () => ({ 'relevé': buildDemoS4Releve(), absences: {} }),
    9105: () => ({ 'relevé': buildDemoS5Releve(), absences: buildDemoS5Absences() }),
  }
  const build = releves[String(semesterId)]

  return build ? { config: DEMO_GRADES_CONFIG, ...build() } : null
}

// Demo inbox for the "Mails récents" widget. `minutesAgo` is resolved against
// the request time so the widget always shows fresh-looking relative dates.
const DEMO_MAIL_MESSAGES = Object.freeze([
  {
    id: 'demo-mail-1',
    minutesAgo: 12,
    unread: true,
    from: { name: 'Thomas Lemoine', email: 'thomas.lemoine@univ-rennes.fr' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'R5.11 – Rendu du TP React décalé à vendredi',
    snippet: 'Bonjour à tous, suite aux soucis de serveur de mardi, le rendu du TP 4 (composants et état) est repoussé à vendredi 18h sur Moodle. Pensez à…',
    bodyText: `Bonjour à tous,

Suite aux soucis de serveur survenus mardi après-midi sur l'infrastructure de développement, le rendu du TP 4 (composants React et gestion de l'état local/global) est exceptionnellement repoussé à vendredi 18h00 sur la plateforme Moodle.

Rappels pour votre rendu :
- Veillez à bien modulariser vos composants dans des fichiers séparés.
- Assurez-vous que l'application se lance proprement sans erreur ni warning de linting.
- Pensez à tester sur mobile ou avec la vue responsive de l'inspecteur.

Bon courage à tous pour les finitions !

Bien cordialement,
Thomas Lemoine
Enseignant Département Informatique & Multimédia
IUT de Lannion — Université de Rennes`,
    bodyHtml: `<p>Bonjour à tous,</p>
<p>Suite aux soucis de serveur survenus mardi après-midi sur l'infrastructure de développement, le rendu du <strong>TP 4 (composants React et gestion de l'état local/global)</strong> est exceptionnellement repoussé à <strong>vendredi 18h00</strong> sur la plateforme Moodle.</p>
<p><strong>Rappels pour votre rendu :</strong></p>
<ul>
  <li>Veillez à bien modulariser vos composants dans des fichiers séparés.</li>
  <li>Assurez-vous que l'application se lance proprement sans erreur ni warning de linting.</li>
  <li>Pensez à tester sur mobile ou avec la vue responsive de l'inspecteur.</li>
</ul>
<p>Bon courage à tous pour les finitions !</p>
<p style="margin-top: 24px; color: #64748b; font-size: 13px;">
  Bien cordialement,<br>
  <strong>Thomas Lemoine</strong><br>
  Enseignant Département Informatique &amp; Multimédia<br>
  IUT de Lannion — Université de Rennes
</p>`,
    attachments: [
      { part: '1', filename: 'consignes-tp4-react-v2.pdf', contentType: 'application/pdf', size: 142000 },
    ],
  },
  {
    id: 'demo-mail-2',
    minutesAgo: 95,
    unread: true,
    from: { name: 'Scolarité IUT de Lannion', email: 'scolarite-iut-lannion@univ-rennes.fr' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'Inscriptions pédagogiques S6 : ouverture le 14 octobre',
    snippet: 'Madame, Monsieur, les inscriptions pédagogiques du semestre 6 seront ouvertes du 14 au 25 octobre via votre dossier étudiant. Le choix des parcours…',
    bodyText: `Madame, Monsieur,

Nous vous informons que la campagne des inscriptions pédagogiques pour le semestre 6 sera officiellement ouverte du lundi 14 octobre au vendredi 25 octobre inclus.

Les inscriptions s'effectuent directement en ligne depuis votre dossier étudiant sur le portail ENT. Le choix de vos options et parcours d'approfondissement conditionne la répartition des groupes de cours et travaux pratiques pour le semestre à venir.

Important :
- Aucun changement de groupe ou d'option ne pourra être accepté après la clôture de la campagne.
- Pour les étudiants en alternance ou en situation particulière (dispense, aménagement), merci de contacter votre secrétariat pédagogique avant le 20 octobre.

Pour toute question, n'hésitez pas à répondre à ce message ou à vous présenter au guichet de la scolarité.

Cordialement,
Le secrétariat de la scolarité générale
IUT de Lannion`,
    bodyHtml: `<p>Madame, Monsieur,</p>
<p>Nous vous informons que la campagne des <strong>inscriptions pédagogiques pour le semestre 6</strong> sera officiellement ouverte du <strong>lundi 14 octobre au vendredi 25 octobre inclus</strong>.</p>
<p>Les inscriptions s'effectuent directement en ligne depuis votre dossier étudiant sur le portail ENT. Le choix de vos options et parcours d'approfondissement conditionne la répartition des groupes de cours et travaux pratiques pour le semestre à venir.</p>
<p><strong>Important :</strong></p>
<ul>
  <li>Aucun changement de groupe ou d'option ne pourra être accepté après la clôture de la campagne.</li>
  <li>Pour les étudiants en alternance ou en situation particulière (dispense, aménagement), merci de contacter votre secrétariat pédagogique avant le 20 octobre.</li>
</ul>
<p>Pour toute question, n'hésitez pas à répondre à ce message ou à vous présenter au guichet de la scolarité.</p>
<p style="margin-top: 24px; color: #64748b; font-size: 13px;">
  Cordialement,<br>
  <strong>Le secrétariat de la scolarité générale</strong><br>
  IUT de Lannion
</p>`,
  },
  {
    id: 'demo-mail-3',
    minutesAgo: 60 * 5 + 20,
    unread: false,
    from: { name: 'Moodle UR', email: 'noreply-moodle@univ-rennes.fr' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'Nouveau devoir : SAE Prototype interactif – Livrable 2',
    snippet: 'Mme Le Fur a publié un nouveau devoir dans le cours « SAE Prototype interactif ». Date limite : lundi 23:59. Consultez les consignes détaillées…',
    bodyText: `Bonjour Camille Martin,

Mme Le Fur a publié une nouvelle activité dans le cours « SAE Prototype interactif ».

Activité : Rendu du livrable n°2 – Maquettes finalisées et design system
Date limite : Lundi à 23h59

Consignes de dépôt :
- Archive ZIP ou document PDF avec lien Figma / GitHub vérifié en accès public.
- Grille d'évaluation RGAA complétée.

Cet e-mail est une notification automatique de la plateforme d'apprentissage Moodle.`,
    bodyHtml: `<p>Bonjour Camille Martin,</p>
<p>Mme Le Fur a publié une nouvelle activité dans le cours <strong>« SAE Prototype interactif »</strong>.</p>
<div style="background: rgba(0,0,0,0.03); border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
  <p style="margin: 0 0 6px 0; font-weight: 600;">Activité : Rendu du livrable n°2 – Maquettes finalisées et design system</p>
  <p style="margin: 0; color: #ef4444; font-weight: 500;">Date limite : Lundi à 23h59</p>
</div>
<p><strong>Consignes de dépôt :</strong></p>
<ul>
  <li>Archive ZIP ou document PDF avec lien Figma / GitHub vérifié en accès public.</li>
  <li>Grille d'évaluation RGAA complétée.</li>
</ul>
<p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">Cet e-mail est une notification automatique de la plateforme d'apprentissage Moodle.</p>`,
  },
  {
    id: 'demo-mail-4',
    minutesAgo: 60 * 22,
    unread: true,
    from: { name: 'BU Lannion', email: 'bu-lannion@univ-rennes.fr' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'Rappel : 2 documents à rendre avant le 10/10',
    snippet: 'Bonjour Camille, nous vous rappelons que les documents suivants arrivent à échéance : « Design emotionnel » (D. Norman), « Refactoring UI »…',
    bodyText: `Bonjour Camille,

Nous vous rappelons que vos emprunts suivants auprès de la Bibliothèque Universitaire de Lannion arrivent bientôt à échéance :

1. « Design émotionnel » — Donald Norman (Cote: 004.019 NOR)
2. « Refactoring UI » — Adam Wathan & Steve Schoger (Cote: 005.13 WAT)

Date limite de retour : 10 octobre à 18h00.

Si vous souhaitez prolonger votre prêt de deux semaines supplémentaires, vous pouvez le faire en un clic depuis votre compte lecteur sur le portail documentaire des bibliothèques universitaires. En cas d'indisponibilité, la boîte de retours extérieure reste accessible 24h/24.

L'équipe de la BU Lannion`,
    bodyHtml: `<p>Bonjour Camille,</p>
<p>Nous vous rappelons que vos emprunts suivants auprès de la <strong>Bibliothèque Universitaire de Lannion</strong> arrivent bientôt à échéance :</p>
<ol>
  <li><strong>« Design émotionnel »</strong> — Donald Norman <em>(Cote: 004.019 NOR)</em></li>
  <li><strong>« Refactoring UI »</strong> — Adam Wathan &amp; Steve Schoger <em>(Cote: 005.13 WAT)</em></li>
</ol>
<p><strong>Date limite de retour :</strong> 10 octobre à 18h00.</p>
<p>Si vous souhaitez prolonger votre prêt de deux semaines supplémentaires, vous pouvez le faire en un clic depuis votre compte lecteur sur le portail documentaire. En cas d'indisponibilité, la boîte de retours extérieure reste accessible 24h/24.</p>
<p style="margin-top: 24px; color: #64748b; font-size: 13px;">L'équipe de la BU Lannion</p>`,
  },
  {
    id: 'demo-mail-5',
    minutesAgo: 60 * 28,
    unread: false,
    from: { name: 'BDE MMI Lannion', email: 'bde.mmi.lannion@gmail.com' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'Soirée d’intégration jeudi 🎉 dernières places',
    snippet: 'Salut les MMI ! Il reste une vingtaine de places pour la soirée de jeudi au Quai des Bulles. Inscription et paiement sur le HelloAsso avant mercredi…',
    bodyText: `Salut les MMI ! 🎉

Il ne reste plus qu'une vingtaine de places pour notre grande soirée d'intégration annuelle de jeudi au Quai des Bulles !

Au programme :
- 20h00 : Accueil des nouveaux arrivants et apéritif offert
- 21h30 : Tournoi de blind-test musical inter-promotions
- 23h00 - 02h00 : DJ set et animation photo souvenir

Tarifs préférentiels pour les adhérents BDE. Les inscriptions et paiements se clôturent mercredi soir à 23h59 sur notre billetterie HelloAsso.

Venez nombreux pour célébrer la rentrée ensemble !

L'équipe du Bureau Des Étudiants MMI`,
    bodyHtml: `<p>Salut les MMI ! 🎉</p>
<p>Il ne reste plus qu'une vingtaine de places pour notre grande <strong>soirée d'intégration annuelle</strong> de jeudi au Quai des Bulles !</p>
<p><strong>Au programme :</strong></p>
<ul>
  <li><strong>20h00 :</strong> Accueil des nouveaux arrivants et apéritif offert</li>
  <li><strong>21h30 :</strong> Tournoi de blind-test musical inter-promotions</li>
  <li><strong>23h00 - 02h00 :</strong> DJ set et animation photo souvenir</li>
</ul>
<p>Tarifs préférentiels pour les adhérents BDE. Les inscriptions et paiements se clôturent mercredi soir à 23h59 sur notre billetterie HelloAsso.</p>
<p>Venez nombreux pour célébrer la rentrée ensemble !</p>
<p style="margin-top: 24px; color: #64748b; font-size: 13px;">L'équipe du Bureau Des Étudiants MMI</p>`,
  },
  {
    id: 'demo-mail-6',
    minutesAgo: 60 * 48,
    unread: false,
    from: { name: 'Julien Bernard', email: 'julien.bernard@univ-rennes.fr' },
    to: [{ name: 'Camille Martin', email: 'camille.martin@etudiant.univ-rennes.fr' }],
    subject: 'Offres de stage S6 – Forum entreprises du 18 novembre',
    snippet: 'Chers étudiants, la préparation de vos stages de semestre 6 commence dès maintenant. Le forum annuel des entreprises partenaires aura lieu…',
    bodyText: `Chers étudiants de 3e année,

La préparation de vos stages de fin d'études (semestre 6) débute dès ce mois-ci.

Le Forum Annuel Entreprises & Recrutement se tiendra le mardi 18 novembre de 9h à 17h dans le hall central. Plus de 35 entreprises régionales et nationales (agences web, ESN, startups, éditeurs de logiciels) seront présentes pour vous rencontrer en direct.

Conseils de préparation :
1. Préparez et imprimez votre CV en plusieurs exemplaires.
2. Mettez en ligne votre portfolio à jour.
3. Deux ateliers de simulation d'entretien d'embauche sont programmés les jeudis 24 et 31 octobre (inscription requise).

Une liste exhaustive des offres déjà collectées est consultable sur l'espace Carrières de l'intranet.

Cordialement,
Julien Bernard
Responsable des relations entreprises & stages`,
    bodyHtml: `<p>Chers étudiants de 3e année,</p>
<p>La préparation de vos stages de fin d'études (semestre 6) débute dès ce mois-ci.</p>
<p>Le <strong>Forum Annuel Entreprises &amp; Recrutement</strong> se tiendra le <strong>mardi 18 novembre de 9h à 17h</strong> dans le hall central. Plus de 35 entreprises régionales et nationales seront présentes pour vous rencontrer en direct.</p>
<p><strong>Conseils de préparation :</strong></p>
<ol>
  <li>Préparez et imprimez votre CV en plusieurs exemplaires.</li>
  <li>Mettez en ligne votre portfolio à jour.</li>
  <li>Deux ateliers de simulation d'entretien d'embauche sont programmés les jeudis 24 et 31 octobre.</li>
</ol>
<p>Une liste exhaustive des offres déjà collectées est consultable sur l'espace Carrières de l'intranet.</p>
<p style="margin-top: 24px; color: #64748b; font-size: 13px;">
  Cordialement,<br>
  <strong>Julien Bernard</strong><br>
  Responsable des relations entreprises &amp; stages
</p>`,
  },
])

// Demo sessions open the same demo webmail as the "Messagerie" app tile,
// never the real university webmail.
const DEMO_WEBMAIL_HREF = DEMO_APPLICATIONS.find((application) => application.id === 'demo-mail')?.href ?? null

export function buildDemoMailPayload({ now = Date.now(), webmailHref = DEMO_WEBMAIL_HREF } = {}) {
  const messages = DEMO_MAIL_MESSAGES.map(({ minutesAgo, ...message }) => ({
    ...cloneDemoValue(message),
    receivedAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
    href: null,
  }))

  return {
    unreadCount: messages.filter((m) => m.unread).length,
    webmailHref,
    messages,
  }
}

export function buildDemoMailMessagePayload(id, { now = Date.now() } = {}) {
  const message = DEMO_MAIL_MESSAGES.find((m) => m.id === id) || DEMO_MAIL_MESSAGES[0]
  if (!message) return null
  return {
    ...cloneDemoValue(message),
    receivedAt: new Date(now - (message.minutesAgo || 10) * 60 * 1000).toISOString(),
    href: null,
  }
}

// Demo deadlines for the "Échéances Moodle" widget. `hoursFromNow` is resolved
// against the request time (negative = overdue) so dates always look current.
const DEMO_MOODLE_DEADLINES = Object.freeze([
  {
    id: 'demo-moodle-tp3-api',
    cmid: 2022,
    hoursFromNow: -2 * 24 - 3,
    title: 'TP 3 – API REST avec Express',
    courseName: 'R5.12 Développement back-end',
    type: 'assign',
    submitted: false,
  },
  {
    id: 'demo-moodle-sae501-livrable2',
    cmid: 2032,
    hoursFromNow: 4,
    title: 'Rendu SAE 501 – Livrable 2',
    courseName: 'SAE 5.01 Développement web',
    type: 'assign',
    submitted: false,
  },
  {
    id: 'demo-moodle-tp1-sql',
    cmid: 2008,
    hoursFromNow: 5 * 24,
    title: 'TP 1 : Remise du code source & rapport',
    courseName: 'R5.01 – Développement Web & Mobile avancé',
    type: 'assign',
    submitted: false,
  },
  {
    id: 'demo-moodle-qcm-rgaa',
    hoursFromNow: 24 + 2,
    title: 'QCM – Accessibilité et RGAA',
    courseName: 'R5.03 Accessibilité numérique',
    type: 'quiz',
    submitted: false,
  },
  {
    id: 'demo-moodle-forum-maquettes',
    hoursFromNow: 3 * 24 + 5,
    title: 'Forum : retours croisés sur les maquettes',
    courseName: 'R5.07 Design d’interaction',
    type: 'forum',
    submitted: null,
  },
  {
    id: 'demo-moodle-veille',
    cmid: 2042,
    hoursFromNow: 7 * 24,
    title: 'Dossier de veille technologique',
    courseName: 'R5.06 Culture numérique',
    type: 'assign',
    submitted: true,
  },
  {
    id: 'demo-moodle-sondage-s5',
    hoursFromNow: 10 * 24 + 6,
    title: 'Questionnaire de mi-semestre S5',
    courseName: 'BUT MMI 3 – Vie de promo',
    type: 'other',
    submitted: null,
  },
])

// Demo sessions open the demo "Moodle" app tile, never the real Moodle.
const DEMO_MOODLE_HREF = DEMO_APPLICATIONS.find((application) => application.id === 'demo-moodle')?.href ?? null

export function buildDemoMoodleDeadlinesPayload({ now = Date.now(), moodleHref = DEMO_MOODLE_HREF } = {}) {
  const quarterHourMs = 15 * 60 * 1000
  const items = DEMO_MOODLE_DEADLINES.map(({ hoursFromNow, ...deadline }) => {
    // Round to the next quarter hour so due times look like real deadlines.
    const dueAtMs = Math.ceil((now + hoursFromNow * 60 * 60 * 1000) / quarterHourMs) * quarterHourMs
    return {
      ...cloneDemoValue(deadline),
      dueAt: new Date(dueAtMs).toISOString(),
      overdue: dueAtMs < now,
      href: null,
    }
  }).sort((left, right) => left.dueAt.localeCompare(right.dueAt))

  return { moodleHref, items }
}

export const DEMO_MOODLE_COURSES = Object.freeze([
  {
    id: 101,
    fullname: 'R5.01 – Développement Web & Mobile avancé',
    shortname: 'R5.01 Dev Web',
    category: 'Informatique & Web',
    progress: 72,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=101',
    moodleHref: null,
  },
  {
    id: 102,
    fullname: 'R5.03 – Accessibilité numérique et RGAA',
    shortname: 'R5.03 Accessibilité',
    category: 'Design & Intégration',
    progress: 45,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=102',
    moodleHref: null,
  },
  {
    id: 103,
    fullname: 'R5.12 – Développement back-end & APIs REST',
    shortname: 'R5.12 Back-end',
    category: 'Informatique & Web',
    progress: 85,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=103',
    moodleHref: null,
  },
  {
    id: 104,
    fullname: 'SAE 5.01 – Développement d’un projet complet',
    shortname: 'SAE 5.01 Web',
    category: 'Projets & SAE',
    progress: 60,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=104',
    moodleHref: null,
  },
  {
    id: 105,
    fullname: 'R5.06 – Culture numérique & Veille technologique',
    shortname: 'R5.06 Culture Num',
    category: 'Communication & Culture',
    progress: 100,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=105',
    moodleHref: null,
  },
  {
    id: 106,
    fullname: 'R5.07 – Design d’interaction et UX research',
    shortname: 'R5.07 UX Design',
    category: 'Design & Intégration',
    progress: 30,
    hasprogress: true,
    courseimage: null,
    viewurl: 'https://foad.univ-rennes.fr/course/view.php?id=106',
    moodleHref: null,
  },
])

const DEMO_MOODLE_COURSE_CONTENTS = Object.freeze({
  101: [
    {
      id: 1001,
      name: 'Généralités & Organisation',
      summary: '<p>Plan de cours, modalités de contrôle des connaissances et liens utiles.</p>',
      modules: [
        {
          id: 2001,
          name: 'Syllabus du module R5.01',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2001',
          contents: [
            {
              filename: 'R501_Syllabus_2026.pdf',
              filesize: 420000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2001/mod_resource/content/1/R501_Syllabus_2026.pdf',
              mimetype: 'application/pdf',
              timemodified: 1726000000,
            },
          ],
        },
        {
          id: 2002,
          name: 'Forum d’échange et questions / réponses',
          modname: 'forum',
          modplural: 'Forums',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/forum-24',
          url: 'https://foad.univ-rennes.fr/mod/forum/view.php?id=2002',
          contents: [],
        },
      ],
    },
    {
      id: 1002,
      name: 'Chapitre 1 : Composants, Hooks et State Management',
      summary: '<p>Rappels React, hooks standards (useMemo, useCallback, useRef) et architecture moderne.</p>',
      modules: [
        {
          id: 2003,
          name: 'CM 1 – Architecture Frontend moderne & Hooks avancés',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2003',
          contents: [
            {
              filename: 'CM1_React_Hooks_Avances.pdf',
              filesize: 2840000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2003/mod_resource/content/1/CM1_React_Hooks_Avances.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727000000,
            },
          ],
        },
        {
          id: 2004,
          name: 'TD 1 – Patterns de composants et optimisations',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2004',
          contents: [
            {
              filename: 'TD1_Enonce_Optimisation.pdf',
              filesize: 950000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2004/mod_resource/content/1/TD1_Enonce_Optimisation.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727200000,
            },
          ],
        },
        {
          id: 2005,
          name: 'Starter kit TP 1 & Corrigé partiel',
          modname: 'folder',
          modplural: 'Dossiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/archive-24',
          url: 'https://foad.univ-rennes.fr/mod/folder/view.php?id=2005',
          contents: [
            {
              filename: 'tp1-starter-kit.zip',
              filesize: 1450000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2005/mod_folder/content/1/tp1-starter-kit.zip',
              mimetype: 'application/zip',
              timemodified: 1727300000,
            },
            {
              filename: 'Guide_Installation_TP1.pdf',
              filesize: 540000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2005/mod_folder/content/1/Guide_Installation_TP1.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727305000,
            },
            {
              filename: 'Correction_Exercice1_Hooks.tsx',
              filesize: 14200,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2005/mod_folder/content/1/Correction_Exercice1_Hooks.tsx',
              mimetype: 'application/typescript',
              timemodified: 1727310000,
            },
            {
              filename: 'mock-dataset-utilisateurs.json',
              filesize: 48600,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2005/mod_folder/content/1/mock-dataset-utilisateurs.json',
              mimetype: 'application/json',
              timemodified: 1727312000,
            },
          ],
        },
      ],
    },
    {
      id: 1003,
      name: 'Chapitre 2 : Performance, PWA & Offline-first',
      summary: '<p>Service Workers, stratégies de cache (Stale-While-Revalidate, Cache-First) et manifest.</p>',
      modules: [
        {
          id: 2006,
          name: 'CM 2 – Progressive Web Apps & Architecture Hors-ligne',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2006',
          contents: [
            {
              filename: 'CM2_PWA_Offline.pdf',
              filesize: 3200000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2006/mod_resource/content/1/CM2_PWA_Offline.pdf',
              mimetype: 'application/pdf',
              timemodified: 1728000000,
            },
          ],
        },
        {
          id: 2007,
          name: 'Documentation MDN – Service Worker API',
          modname: 'url',
          modplural: 'Liens',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/url-24',
          url: 'https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API',
          contents: [],
        },
        {
          id: 2008,
          name: 'TP 1 : Remise du code source & rapport',
          modname: 'assign',
          modplural: 'Devoirs',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/assign-24',
          url: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2008',
          contents: [],
        },
      ],
    },
  ],
  102: [
    {
      id: 1010,
      name: 'Cadre légal & Référentiel RGAA',
      summary: '<p>Introduction aux critères d’accessibilité numérique, normes WCAG et législation française.</p>',
      modules: [
        {
          id: 2011,
          name: 'Support de présentation RGAA 4.1',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2011',
          contents: [
            {
              filename: 'Support_RGAA_2026.pdf',
              filesize: 4100000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2011/mod_resource/content/1/Support_RGAA_2026.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727500000,
            },
          ],
        },
        {
          id: 2012,
          name: 'QCM – Accessibilité et RGAA',
          modname: 'quiz',
          modplural: 'Tests / Quizz',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/quiz-24',
          url: 'https://foad.univ-rennes.fr/mod/quiz/view.php?id=2012',
          contents: [],
        },
      ],
    },
  ],
  103: [
    {
      id: 1020,
      name: 'APIs REST et Architecture Serveur',
      summary: '<p>Conception d’APIs RESTful, middlewares Express, validation et authentification stateless.</p>',
      modules: [
        {
          id: 2021,
          name: 'CM 1 – Bonnes pratiques de design RESTful',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2021',
          contents: [
            {
              filename: 'CM1_REST_BestPractices.pdf',
              filesize: 1980000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2021/mod_resource/content/1/CM1_REST_BestPractices.pdf',
              mimetype: 'application/pdf',
              timemodified: 1726500000,
            },
          ],
        },
        {
          id: 2022,
          name: 'TP 3 – API REST avec Express',
          modname: 'assign',
          modplural: 'Devoirs',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/assign-24',
          url: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2022',
          contents: [
            {
              filename: 'Enonce_TP3_Express.pdf',
              filesize: 680000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2022/mod_resource/content/1/Enonce_TP3_Express.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727800000,
            },
          ],
        },
        {
          id: 2023,
          name: 'Boîte à outils & Exemples d’API REST',
          modname: 'folder',
          modplural: 'Dossiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/archive-24',
          url: 'https://foad.univ-rennes.fr/mod/folder/view.php?id=2023',
          contents: [
            {
              filename: 'Schema_Architecture_Hexagonale.pdf',
              filesize: 1850000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2023/mod_folder/content/1/Schema_Architecture_Hexagonale.pdf',
              mimetype: 'application/pdf',
              timemodified: 1727820000,
            },
            {
              filename: 'Collection_Postman_REST.json',
              filesize: 32000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2023/mod_folder/content/1/Collection_Postman_REST.json',
              mimetype: 'application/json',
              timemodified: 1727825000,
            },
            {
              filename: 'Boilerplate_Express_TypeScript.zip',
              filesize: 2900000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2023/mod_folder/content/1/Boilerplate_Express_TypeScript.zip',
              mimetype: 'application/zip',
              timemodified: 1727830000,
            },
          ],
        },
      ],
    },
  ],
  104: [
    {
      id: 1030,
      name: 'Sujet & Livrables SAE 5.01',
      summary: '<p>Cahier des charges, sprints agiles et dépôts des livrables intermédiaires.</p>',
      modules: [
        {
          id: 2031,
          name: 'Cahier des charges officiel SAE 5.01',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2031',
          contents: [
            {
              filename: 'Cahier_des_charges_SAE501.pdf',
              filesize: 1750000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2031/mod_resource/content/1/Cahier_des_charges_SAE501.pdf',
              mimetype: 'application/pdf',
              timemodified: 1726200000,
            },
          ],
        },
        {
          id: 2032,
          name: 'Rendu SAE 501 – Livrable 2',
          modname: 'assign',
          modplural: 'Devoirs',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/assign-24',
          url: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2032',
          contents: [],
        },
      ],
    },
  ],
  105: [
    {
      id: 1040,
      name: 'Méthodologie de Veille',
      summary: '<p>Outils de curation, flux RSS, newsletters et structuration du dossier d’analyse.</p>',
      modules: [
        {
          id: 2041,
          name: 'Guide méthodologique de la veille',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2041',
          contents: [
            {
              filename: 'Guide_Methodo_Veille.pdf',
              filesize: 1120000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2041/mod_resource/content/1/Guide_Methodo_Veille.pdf',
              mimetype: 'application/pdf',
              timemodified: 1726100000,
            },
          ],
        },
        {
          id: 2042,
          name: 'Dossier de veille technologique',
          modname: 'assign',
          modplural: 'Devoirs',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/assign-24',
          url: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2042',
          contents: [],
        },
      ],
    },
  ],
  106: [
    {
      id: 1050,
      name: 'Recherche Utilisateur & Prototypage',
      summary: '<p>Interviews, personas, parcours utilisateurs et ateliers de co-conception.</p>',
      modules: [
        {
          id: 2051,
          name: 'Fiches personas et canevas d’interview',
          modname: 'resource',
          modplural: 'Fichiers',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/pdf-24',
          url: 'https://foad.univ-rennes.fr/mod/resource/view.php?id=2051',
          contents: [
            {
              filename: 'Canevas_UX_Interview.pdf',
              filesize: 880000,
              fileurl: 'https://foad.univ-rennes.fr/webservice/pluginfile.php/2051/mod_resource/content/1/Canevas_UX_Interview.pdf',
              mimetype: 'application/pdf',
              timemodified: 1726900000,
            },
          ],
        },
        {
          id: 2052,
          name: 'Forum : retours croisés sur les maquettes',
          modname: 'forum',
          modplural: 'Forums',
          modicon: 'https://foad.univ-rennes.fr/theme/image.php/boost/core/1/f/forum-24',
          url: 'https://foad.univ-rennes.fr/mod/forum/view.php?id=2052',
          contents: [],
        },
      ],
    },
  ],
})

export function buildDemoMoodleCoursesPayload({ moodleHref = DEMO_MOODLE_HREF } = {}) {
  return {
    moodleHref,
    courses: DEMO_MOODLE_COURSES.map((course) => ({
      ...cloneDemoValue(course),
      moodleHref: null,
    })),
  }
}

export function buildDemoMoodleCourseContentsPayload(courseId) {
  const contents = DEMO_MOODLE_COURSE_CONTENTS[courseId] || [
    {
      id: 9999,
      name: 'Contenus du cours',
      summary: '<p>Ce cours ne contient aucun document déposé pour le moment.</p>',
      modules: [],
    },
  ]

  return {
    courseId: Number(courseId),
    sections: cloneDemoValue(contents),
  }
}

const demoAssignmentSubmissions = new Map([
  [
    2008,
    {
      cmid: 2008,
      name: 'TP 1 : Remise du code source & rapport',
      courseName: 'R5.01 – Développement Web & Mobile avancé',
      courseId: 101,
      introHtml: '<p>Veuillez déposer ici votre fichier de compte-rendu (ex: <code>rendu.md</code> ou archive <code>.zip</code> / <code>.sql</code>) contenant l’ensemble de vos requêtes, captures d’écran et explications.</p><p>Assurez-vous de bien respecter la structure des questions et d’inclure vos résultats d’exécution.</p>',
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      dueDateFormatted: 'Dimanche 25 octobre 2026, 23:59',
      timeRemaining: 'Il reste 10 jours',
      status: 'not_submitted',
      statusLabel: 'Aucun devoir remis',
      gradingStatus: 'not_graded',
      gradingStatusLabel: 'Non noté',
      canSubmit: true,
      canEdit: true,
      canRemove: false,
      maxFiles: 5,
      maxFileSize: 52428800,
      maxFileSizeFormatted: '50 Mo',
      acceptedTypes: ['.md', '.sql', '.pdf', '.zip', '.tar.gz', '.txt'],
      submittedFiles: [],
      lastModified: null,
      onlineText: '',
      launchHref: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2008',
    },
  ],
  [
    2022,
    {
      cmid: 2022,
      name: 'TP 3 – API REST avec Express',
      courseName: 'R5.12 Développement back-end',
      courseId: 103,
      introHtml: '<p>Déposez l’archive zip contenant vos routes Express, middlewares de validation et tests d’intégration.</p>',
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      dueDateFormatted: 'Mardi 13 octobre 2026, 23:59',
      timeRemaining: 'Devoir en retard de 2 jours',
      status: 'draft',
      statusLabel: 'Brouillon (non remis)',
      gradingStatus: 'not_graded',
      gradingStatusLabel: 'Non noté',
      canSubmit: true,
      canEdit: true,
      canRemove: true,
      maxFiles: 3,
      maxFileSize: 20971520,
      maxFileSizeFormatted: '20 Mo',
      acceptedTypes: ['.zip', '.tar.gz'],
      submittedFiles: [
        {
          filename: 'express_api_tp3_draft.zip',
          filesize: 1420000,
          timemodified: Math.floor(Date.now() / 1000) - 172800,
          proxyUrl: '/__ent_auth/moodle/file?name=express_api_tp3_draft.zip&download=1',
        },
      ],
      lastModified: '13 oct. 2026, 18:22',
      onlineText: '',
      launchHref: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2022',
    },
  ],
  [
    2032,
    {
      cmid: 2032,
      name: 'Rendu SAE 501 – Livrable 2',
      courseName: 'SAE 5.01 Développement web',
      courseId: 104,
      introHtml: '<p>Déposez le rapport intermédiaire du Livrable 2 (architecture, maquettes validées et backlog produit).</p>',
      dueDate: new Date(Date.now() + 4 * 3600000).toISOString(),
      dueDateFormatted: 'Aujourd\'hui à 15:30',
      timeRemaining: 'Il reste 4 heures',
      status: 'not_submitted',
      statusLabel: 'Aucun devoir remis',
      gradingStatus: 'not_graded',
      gradingStatusLabel: 'Non noté',
      canSubmit: true,
      canEdit: true,
      canRemove: false,
      maxFiles: 2,
      maxFileSize: 52428800,
      maxFileSizeFormatted: '50 Mo',
      acceptedTypes: ['.pdf', '.zip'],
      submittedFiles: [],
      lastModified: null,
      onlineText: '',
      launchHref: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2032',
    },
  ],
  [
    2042,
    {
      cmid: 2042,
      name: 'Dossier de veille technologique',
      courseName: 'R5.06 Culture numérique',
      courseId: 105,
      introHtml: '<p>Dépôt final du dossier de veille technologique au format PDF.</p>',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      dueDateFormatted: 'Jeudi 22 octobre 2026, 18:00',
      timeRemaining: 'Il reste 7 jours',
      status: 'submitted',
      statusLabel: 'Remis pour évaluation',
      gradingStatus: 'not_graded',
      gradingStatusLabel: 'Non noté',
      canSubmit: true,
      canEdit: true,
      canRemove: true,
      maxFiles: 1,
      maxFileSize: 31457280,
      maxFileSizeFormatted: '30 Mo',
      acceptedTypes: ['.pdf'],
      submittedFiles: [
        {
          filename: 'Dossier_Veille_Techno_Elouan.pdf',
          filesize: 2840000,
          timemodified: Math.floor(Date.now() / 1000) - 86400,
          proxyUrl: '/__ent_auth/moodle/file?name=Dossier_Veille_Techno_Elouan.pdf&download=1',
        },
      ],
      lastModified: 'Hier à 14:15',
      onlineText: '',
      launchHref: 'https://foad.univ-rennes.fr/mod/assign/view.php?id=2042',
    },
  ],
])

export function getDemoAssignmentDetails(cmid, courseId) {
  const numericCmid = Number(cmid)
  if (demoAssignmentSubmissions.has(numericCmid)) {
    return cloneDemoValue(demoAssignmentSubmissions.get(numericCmid))
  }

  const fallback = {
    cmid: numericCmid,
    name: `Devoir ${numericCmid}`,
    courseName: 'Moodle',
    courseId: Number(courseId) || 101,
    introHtml: '<p>Veuillez déposer vos fichiers de travaux pour ce devoir.</p>',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    dueDateFormatted: 'Dimanche 25 octobre 2026, 23:59',
    timeRemaining: 'Il reste 5 jours',
    status: 'not_submitted',
    statusLabel: 'Aucun devoir remis',
    gradingStatus: 'not_graded',
    gradingStatusLabel: 'Non noté',
    canSubmit: true,
    canEdit: true,
    canRemove: false,
    maxFiles: 5,
    maxFileSize: 52428800,
    maxFileSizeFormatted: '50 Mo',
    acceptedTypes: ['.pdf', '.zip', '.tar.gz', '.sql', '.md', '.txt'],
    submittedFiles: [],
    lastModified: null,
    onlineText: '',
    launchHref: `https://foad.univ-rennes.fr/mod/assign/view.php?id=${numericCmid}`,
  }
  return cloneDemoValue(fallback)
}

export function submitDemoAssignment({ cmid, files = [], onlineText = '', finalize = false }) {
  const existing = getDemoAssignmentDetails(cmid)
  const now = new Date()
  const newFiles = (files || []).map((f) => ({
    filename: f.name || f.filename || 'rendu.md',
    filesize: Number(f.size) || (f.base64 ? Math.round(f.base64.length * 0.75) : 1024),
    timemodified: Math.floor(Date.now() / 1000),
    proxyUrl: `/__ent_auth/moodle/file?name=${encodeURIComponent(f.name || f.filename || 'rendu.md')}&download=1`,
  }))

  const updatedFiles = [...(existing.submittedFiles || []), ...newFiles]
  const updated = {
    ...existing,
    status: finalize || updatedFiles.length > 0 ? 'submitted' : existing.status,
    statusLabel: finalize || updatedFiles.length > 0 ? 'Remis pour évaluation' : existing.statusLabel,
    submittedFiles: updatedFiles,
    onlineText: onlineText || existing.onlineText,
    lastModified: `${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    canRemove: true,
  }

  demoAssignmentSubmissions.set(Number(cmid), updated)
  return cloneDemoValue(updated)
}

export function removeDemoAssignmentFile({ cmid, filename }) {
  const existing = getDemoAssignmentDetails(cmid)
  const remainingFiles = (existing.submittedFiles || []).filter((f) => f.filename !== filename)
  const updated = {
    ...existing,
    submittedFiles: remainingFiles,
    status: remainingFiles.length === 0 ? 'not_submitted' : existing.status,
    statusLabel: remainingFiles.length === 0 ? 'Aucun devoir remis' : existing.statusLabel,
    canRemove: remainingFiles.length > 0,
  }
  demoAssignmentSubmissions.set(Number(cmid), updated)
  return cloneDemoValue(updated)
}


