import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import universityConfig from '@university'
import favicon from './assets/favicon.png'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import Sidebar from './components/Sidebar'
import AccountModal from './components/AccountModal'
import ChangelogPill from './components/ChangelogPill'
import ChangelogSheet from './components/ChangelogSheet'
import GuidedTour from './components/GuidedTour'
import LentButton from './components/LentButton'
import LoginPage from './components/LoginPage'
import OnboardingCompletionPage from './components/OnboardingCompletionPage'
import PwaInstallPrompt from './components/PwaInstallPrompt'
import OnboardingPage from './components/OnboardingPage'
import PwaUpdateManager from './components/PwaUpdateManager'
import UpdateNotice from './components/UpdateNotice'
import WelcomeFromLent from './components/WelcomeFromLent'
import { settingsTransfer } from './settingsTransferBoot'
import { DEMO_CREDENTIALS, DEMO_SESSION_MODE } from './demoAccount'
import { storeBrowserPasswordCredential } from './browserCredentials'
import { syncRuntimeSeo } from './seo'
import {
  ESTABLISHMENT_KEY,
  STUDENT_TP_KEY,
  ADE_LOOKAHEAD_DAY_OPTIONS,
  clearStoredTpSelection,
  getStoredAdeLookaheadDays,
  getStoredAnonymousAnalytics,
  getStoredEstablishment,
  getStoredHiddenWidgets,
  getStoredShowAppDescriptions,
  getStoredShowWallpaper,
  getStoredTpSelection,
  persistAdeLookaheadDays,
  persistAnonymousAnalytics,
  persistEstablishment,
  persistHiddenWidgets,
  persistShowAppDescriptions,
  persistShowWallpaper,
  persistTpSelection,
} from './profileStorage'
import WidgetContainer from './components/WidgetContainer'
import { listHeroImages, resolveHeroImage } from './heroImage'
import { getStoredTheme, persistTheme, watchTheme } from './theme'
import MobileTabBar from './components/MobileTabBar'
import { getMobileTabItems, isGradesPageAvailable, isMailPageAvailable, isMoodlePageAvailable, isPlanningPageAvailable } from './navItems'
import { navigateTo, scrollAppToTop, useAppRoute } from './appRoute'
import GradesPage from './components/GradesPage'
import AbsencesPage from './components/AbsencesPage'
import PlanningPage from './components/PlanningPage'
import MailPage from './components/MailPage'
import MoodlePage from './components/MoodlePage'
import PageErrorBoundary from './components/PageErrorBoundary'
import { getAvailableWidgets } from './dashboardWidgets'
import { clearStoredCustomBackground, getStoredCustomBackground, saveCustomBackground } from './customBackground'
import {
  flushAnalytics,
  setAnalyticsAvailable,
  setAnalyticsEstablishment,
  setAnalyticsFormation,
  setAnalyticsUserEnabled,
  track,
  useAnalyticsAvailable,
} from './analytics'
import {
  ENT_ORIGIN,
  buildEntProxyHref,
  clearAdeTimetableCache,
  clearGradesCache,
  detectScodocGroupSelection,
  getAccountInfo,
  getAdeAlerts,
  getAdeCalendarMetadata,
  getAdeStatus,
  getAdeTimetable,
  getAdeTree,
  getAdeUpcoming,
  getAuthSession,
  getAverageGrade,
  getGrades,
  getLatestGrade,
  getLayout,
  getMarketplaceEntries,
  getPlanning,
  getStudentProfilePictureMeta,
  loginToEnt,
  logoutFromEnt,
  requestEnt,
  searchAde,
} from './entApi'

// How far the hero photo extends below the widget row before fully fading.
const HERO_FADE_OVERHANG_PX = 80

const DEFAULT_REQUEST_PATH = '/api/v4-3/dlm/layout.json'
const DEBUG_MENU_ENABLED = import.meta.env.DEV
const ACCOUNT_MODAL_PROFILE_PHOTO_TIMEOUT_MS = 3000
const ONBOARDING_COMPLETION_SCREEN_MS = 1000
const LEGACY_SESSION_CACHE_KEY = 'l-ent:session-cache'
const LOCAL_STORAGE_ACCOUNT_KEYS = [ESTABLISHMENT_KEY, STUDENT_TP_KEY]
const LOCAL_STORAGE_SETTINGS_KEYS = [
  'l-ent:favorites-order',
  'l-ent:local-pins',
  'l-ent:weather-city',
  'l-ent:grade-colors',
  'l-ent:visit-count',
  'l-ent:pwa-prompt-dismissed',
]
const LOCAL_STORAGE_CACHE_KEYS = [
  'l-ent:ade-timetable-cache',
]

// `keepSessionGrades`: at boot, keep this tab's grades copy (it makes a reload
// instant); it still goes on logout and whenever the session is gone.
function clearLegacySensitiveClientCaches({ keepSessionGrades = false } = {}) {
  try {
    localStorage.removeItem(LEGACY_SESSION_CACHE_KEY)
  } catch {
    // Ignore storage failures
  }

  clearGradesCache({ keepSessionCache: keepSessionGrades })
  clearAdeTimetableCache()
}

async function clearClientRuntimeState() {
  try {
    localStorage.clear()
  } catch {
    // Ignore storage failures
  }

  try {
    sessionStorage.clear()
  } catch {
    // Ignore storage failures
  }

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheKeys = await window.caches.keys()
      await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)))
    } catch {
      // Ignore cache storage failures
    }
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    } catch {
      // Ignore service worker failures
    }
  }
}

function prettyPrint(value) {
  if (typeof value === 'string') {
    return value
  }

  if (value === undefined) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function parseStoredDebugValue(rawValue) {
  if (rawValue == null) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return rawValue
  }
}

function collectLocalStorageEntries(keys) {
  return Object.fromEntries(keys.map((key) => [key, parseStoredDebugValue(localStorage.getItem(key))]))
}

function buildLocalStorageDebugSnapshot(userId = null) {
  try {
    const allKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right))
    const lentKeys = allKeys.filter((key) => key.startsWith('l-ent:'))
    const knownKeys = new Set([
      ...LOCAL_STORAGE_ACCOUNT_KEYS,
      ...LOCAL_STORAGE_SETTINGS_KEYS,
      ...LOCAL_STORAGE_CACHE_KEYS,
    ])
    const extraLentKeys = lentKeys.filter((key) => !knownKeys.has(key))

    return {
      currentUser: userId ?? null,
      summary: {
        totalLocalStorageKeys: allKeys.length,
        lentKeys: lentKeys.length,
        extraLentKeys: extraLentKeys.length,
      },
      account: collectLocalStorageEntries(LOCAL_STORAGE_ACCOUNT_KEYS),
      settings: collectLocalStorageEntries(LOCAL_STORAGE_SETTINGS_KEYS),
      caches: collectLocalStorageEntries(LOCAL_STORAGE_CACHE_KEYS),
      otherLentEntries: Object.fromEntries(extraLentKeys.map((key) => [key, parseStoredDebugValue(localStorage.getItem(key))])),
      allLentKeys: lentKeys,
    }
  } catch (error) {
    return {
      error: getErrorMessage(error),
    }
  }
}

function appendDebugPreviewToken(url, token) {
  if (!url) {
    return null
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}ts=${encodeURIComponent(token)}`
}

const PROFILE_PHOTO_KEY_PATTERN = /(?:^|[_-])(picture|photo|avatar|portrait|image)(?:$|[_-])/i

function normalizeProfilePhotoSource(value) {
  const source = String(value ?? '').trim()

  if (!source) {
    return null
  }

  if (/^data:image\//i.test(source)) {
    return {
      src: source,
      kind: 'data-uri',
    }
  }

  if (/^https?:\/\//i.test(source)) {
    if (source.startsWith(ENT_ORIGIN)) {
      return {
        src: buildEntProxyHref(source),
        kind: 'ent-url',
      }
    }

    return {
      src: source,
      kind: 'url',
    }
  }

  if (source.startsWith('/')) {
    return {
      src: buildEntProxyHref(source),
      kind: 'relative-url',
    }
  }

  if (source.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(source)) {
    return {
      src: `data:image/jpeg;base64,${source.replace(/\s+/g, '')}`,
      kind: 'base64',
    }
  }

  return null
}

function findProfilePhotoCandidate(node, currentPath = 'account', visited = new WeakSet(), depth = 0) {
  if (!node || depth > 6) {
    return null
  }

  if (typeof node !== 'object') {
    return null
  }

  if (visited.has(node)) {
    return null
  }

  visited.add(node)

  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index += 1) {
      const match = findProfilePhotoCandidate(node[index], `${currentPath}[${index}]`, visited, depth + 1)
      if (match) {
        return match
      }
    }
    return null
  }

  for (const [key, value] of Object.entries(node)) {
    const nextPath = `${currentPath}.${key}`

    if (typeof value === 'string' && PROFILE_PHOTO_KEY_PATTERN.test(key)) {
      const normalized = normalizeProfilePhotoSource(value)

      if (normalized) {
        return {
          ...normalized,
          fieldPath: nextPath,
          rawValue: value,
        }
      }
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object') {
      const match = findProfilePhotoCandidate(value, `${currentPath}.${key}`, visited, depth + 1)
      if (match) {
        return match
      }
    }
  }

  return null
}

function getTrimmedString(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue || null
}

function getFirstAvailableString(...values) {
  for (const value of values) {
    const normalizedValue = getTrimmedString(value)

    if (normalizedValue) {
      return normalizedValue
    }
  }

  return null
}

function getAccountDisplayInfo(account, fallbackUser = null, fallbackGivenName = null) {
  const fullName = getFirstAvailableString(account?.name, account?.display_name, account?.preferred_username)
  const fullNameParts = fullName ? fullName.split(/\s+/).filter(Boolean) : []
  const derivedFirstName = fullNameParts[0] ?? null
  const derivedLastName = fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : null

  return {
    firstName: getFirstAvailableString(account?.given_name, account?.givenName, fallbackGivenName, derivedFirstName) ?? '',
    lastName: getFirstAvailableString(account?.family_name, account?.familyName, account?.last_name, account?.surname, derivedLastName) ?? '',
    email: getFirstAvailableString(account?.email, account?.mail, account?.email_address, fallbackUser?.includes('@') ? fallbackUser : null) ?? '',
  }
}

function buildStoredSelectionOption(resourceId, label, parentResourceId = null, parentLabel = null, contextLabel = null) {
  const normalizedResourceId = String(resourceId ?? '').trim()
  const normalizedLabel = getTrimmedString(label)

  if (!normalizedResourceId || !normalizedLabel) {
    return null
  }

  return {
    resourceId: normalizedResourceId,
    label: normalizedLabel,
    parentResourceId: parentResourceId == null ? null : String(parentResourceId),
    parentLabel: getTrimmedString(parentLabel),
    contextLabel: getTrimmedString(contextLabel),
  }
}

function findTpOptionByResourceId(options, resourceId) {
  const normalizedResourceId = String(resourceId ?? '').trim()

  if (!normalizedResourceId) {
    return null
  }

  return (options ?? []).find((option) => option?.resourceId === normalizedResourceId) ?? null
}

function normalizeSelectionLabel(label) {
  return String(label ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeSelectionCompactLabel(label) {
  return normalizeSelectionLabel(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function selectionLabelsMatch(left, right) {
  const normalizedLeft = normalizeSelectionLabel(left)
  const normalizedRight = normalizeSelectionLabel(right)

  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  const compactLeft = normalizeSelectionCompactLabel(left)
  const compactRight = normalizeSelectionCompactLabel(right)
  const canUseCompactSuffixMatch = compactLeft.length >= 3 && compactRight.length >= 3

  return normalizedLeft === normalizedRight
    || normalizedLeft.startsWith(`${normalizedRight} `)
    || normalizedRight.startsWith(`${normalizedLeft} `)
    || normalizedLeft.endsWith(` ${normalizedRight}`)
    || normalizedRight.endsWith(` ${normalizedLeft}`)
    || (
      compactLeft.length >= 2
      && compactRight.length >= 2
      && (
        compactLeft === compactRight
        || (
          canUseCompactSuffixMatch
          && (compactLeft.endsWith(compactRight) || compactRight.endsWith(compactLeft))
        )
      )
    )
}

function findTpOptionByLabel(options, labelOrLabels) {
  const labels = Array.isArray(labelOrLabels) ? labelOrLabels : [labelOrLabels]
  const normalizedLabels = labels.filter((label) => normalizeSelectionLabel(label))

  if (normalizedLabels.length === 0) {
    return null
  }

  for (const label of normalizedLabels) {
    const match = (options ?? []).find((option) => selectionLabelsMatch(option?.label, label))
    if (match) {
      return match
    }
  }

  return null
}

// Sidebar order of the pages, for the direction of the page slide.
const PAGE_ORDER = ['dashboard', 'grades', 'absences', 'planning']

// What a page transition fades: each frosted card on its own (its blur keeps
// working, unlike under a fading ancestor) and every block without one.
// Cards with their own arrival animation (.grades-reveal) are left to it.
function collectFadeBlocks(root, blocks = []) {
  for (const child of root.children) {
    if (child.classList.contains('widget-card')) {
      if (!child.classList.contains('grades-reveal')) blocks.push(child)
    } else if (child.querySelector('.widget-card')) {
      collectFadeBlocks(child, blocks)
    } else {
      blocks.push(child)
    }
  }
  return blocks
}

async function loadTdOptionsForAccountModal(yearOption) {
  const treeResponse = await getAdeTree(yearOption.resourceId)
  return buildNextTpStepFromTree(treeResponse?.tree)
}

async function loadTpOptionsForAccountModal(tdOption) {
  const treeResponse = await getAdeTree(tdOption.resourceId)
  return buildNextTpStepFromTree(treeResponse?.tree)
}

function createEmptyAccountModalPlanningState(overrides = {}) {
  return {
    loading: false,
    applying: false,
    loadingMessage: '',
    errorMessage: '',
    contextLabel: '',
    program: null,
    yearOptions: [],
    tdOptions: [],
    tpOptions: [],
    draftYear: null,
    draftTd: null,
    draftTp: null,
    ...overrides,
  }
}

function createStoredPlanningDraftState(selection, overrides = {}) {
  return createEmptyAccountModalPlanningState({
    contextLabel: getTrimmedString(selection?.contextLabel) ?? '',
    draftYear: buildStoredSelectionOption(
      selection?.yearResourceId,
      selection?.yearLabel,
      selection?.programResourceId,
      selection?.programLabel,
      selection?.contextLabel,
    ),
    draftTd: buildStoredSelectionOption(
      selection?.tdResourceId,
      selection?.tdLabel,
      selection?.yearResourceId,
      selection?.yearLabel,
      selection?.contextLabel,
    ),
    draftTp: buildStoredSelectionOption(
      selection?.tpResourceId,
      selection?.tpLabel,
      selection?.tdResourceId,
      selection?.tdLabel,
      selection?.contextLabel,
    ),
    ...overrides,
  })
}

async function buildAccountModalPlanningState(selection) {
  let treeResponse = await getAdeTree()
  let planningState = buildInitialTpOnboardingState(treeResponse?.tree)

  if (planningState.program?.resourceId && planningState.yearOptions.length === 0) {
    treeResponse = await getAdeTree(planningState.program.resourceId)
    planningState = buildInitialTpOnboardingState(treeResponse?.tree)
  }

  const storedYear = buildStoredSelectionOption(
    selection?.yearResourceId,
    selection?.yearLabel,
    selection?.programResourceId,
    selection?.programLabel,
    selection?.contextLabel,
  )
  const storedTd = buildStoredSelectionOption(
    selection?.tdResourceId,
    selection?.tdLabel,
    selection?.yearResourceId,
    selection?.yearLabel,
    selection?.contextLabel,
  )
  const storedTp = buildStoredSelectionOption(
    selection?.tpResourceId,
    selection?.tpLabel,
    selection?.tdResourceId,
    selection?.tdLabel,
    selection?.contextLabel,
  )

  let contextLabel = getFirstAvailableString(selection?.contextLabel, planningState.contextLabel) ?? ''
  const draftYear = storedYear
    ? findTpOptionByResourceId(planningState.yearOptions, storedYear.resourceId) ?? storedYear
    : planningState.detectedSelections.year
  let draftTd = null
  let draftTp = null
  let tdOptions = []
  let tpOptions = []

  if (draftYear?.resourceId) {
    const yearStep = await loadTdOptionsForAccountModal(draftYear)
    contextLabel = getFirstAvailableString(yearStep.contextLabel, contextLabel) ?? ''
    tdOptions = yearStep.options
    draftTd = storedTd
      ? findTpOptionByResourceId(tdOptions, storedTd.resourceId) ?? storedTd
      : planningState.detectedSelections.td

    if (draftTd?.resourceId) {
      const tdStep = await loadTpOptionsForAccountModal(draftTd)
      contextLabel = getFirstAvailableString(tdStep.contextLabel, contextLabel) ?? ''
      tpOptions = tdStep.options
      draftTp = storedTp
        ? findTpOptionByResourceId(tpOptions, storedTp.resourceId) ?? storedTp
        : planningState.detectedSelections.tp
    }
  }

  return createEmptyAccountModalPlanningState({
    contextLabel,
    program: planningState.program,
    yearOptions: planningState.yearOptions,
    tdOptions,
    tpOptions,
    draftYear,
    draftTd,
    draftTp,
  })
}

async function resolveAccountProfilePhoto(account, { timeoutMs = ACCOUNT_MODAL_PROFILE_PHOTO_TIMEOUT_MS } = {}) {
  const fallbackPhotoSrc = findProfilePhotoCandidate(account)?.src ?? null
  let timeoutId = null

  try {
    const profilePictureResult = await Promise.race([
      getStudentProfilePictureMeta()
        .then((profilePictureInfo) => ({ status: 'resolved', profilePictureInfo }))
        .catch((error) => ({ status: 'unreachable', error })),
      new Promise((resolve) => {
        timeoutId = window.setTimeout(() => {
          resolve({ status: 'timeout' })
        }, timeoutMs)
      }),
    ])

    if (profilePictureResult.status === 'resolved') {
      const { profilePictureInfo } = profilePictureResult

      if (profilePictureInfo?.available && profilePictureInfo.previewUrl) {
        return appendDebugPreviewToken(profilePictureInfo.previewUrl, String(Date.now()))
      }
    }
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
    }
  }

  return fallbackPhotoSrc
}

function resolveDebugImagePreviewFromSnapshot(snapshot) {
  const data = snapshot?.data
  const token = snapshot?.capturedAt ?? String(Date.now())

  if (data?.available && data?.previewUrl) {
    return {
      src: appendDebugPreviewToken(data.previewUrl, token),
      fieldPath: 'student-pic',
      kind: data.source ?? 'profile-photo',
    }
  }

  if (data?.photo?.available && data?.photo?.previewUrl) {
    return {
      src: appendDebugPreviewToken(data.photo.previewUrl, token),
      fieldPath: data.photo.fieldPath ?? 'account',
      kind: data.photo.sourceKind ?? 'account',
    }
  }

  return null
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function getFrenchAuthErrorMessage(error, context = 'login') {
  const rawMessage = getErrorMessage(error).trim()
  const normalizedMessage = rawMessage.toLowerCase()
  const mentionsUsername = normalizedMessage.includes('username') || normalizedMessage.includes('identifiant')
  const mentionsPassword = normalizedMessage.includes('password') || normalizedMessage.includes('mot de passe')
  const mentionsRequired = (
    normalizedMessage.includes('required')
    || normalizedMessage.includes('requis')
    || normalizedMessage.includes('missing')
  )

  if (
    (mentionsUsername && mentionsPassword && mentionsRequired)
    || normalizedMessage.includes('missing username')
    || normalizedMessage.includes('missing password')
    || normalizedMessage.includes('mot de passe requis')
  ) {
    return 'Remplis ton identifiant et ton mot de passe'
  }

  if (
    normalizedMessage.includes('cas login failed')
    || normalizedMessage.includes('check your username and password')
    || normalizedMessage.includes('invalid credentials')
    || normalizedMessage.includes('bad credentials')
    || normalizedMessage.includes('invalid username')
    || normalizedMessage.includes('invalid password')
    || normalizedMessage.includes('incorrect password')
    || normalizedMessage.includes('portal session was not established')
    || normalizedMessage.includes('unauthorized')
    || normalizedMessage.includes('status 401')
    || normalizedMessage.includes('status 403')
    || normalizedMessage.includes('forbidden')
  ) {
    return 'Identifiant ou mot de passe incorrect'
  }

  if (normalizedMessage.includes('status 429') || normalizedMessage.includes('too many requests')) {
    return 'Trop de tentatives de connexion. Réessaie dans quelques instants'
  }

  if (
    normalizedMessage.includes('networkerror')
    || normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('load failed')
    || normalizedMessage.includes('network request failed')
    || normalizedMessage.includes('fetch')
  ) {
    return context === 'session'
      ? 'Impossible de vérifier la session, réessaie dans quelques instants'
      : 'Impossible de joindre le service de connexion, vérifie ta connexion puis réessaie'
  }

  if (normalizedMessage.includes('status 5') || normalizedMessage.includes('internal server error')) {
    return context === 'session'
      ? 'Le service de session est indisponible pour le moment'
      : 'Le service de connexion est indisponible pour le moment'
  }

  return context === 'session'
    ? 'Impossible de vérifier la session pour le moment'
    : 'La connexion a échoué, vérifie tes identifiants puis réessaie'
}

function getSessionWarningMessage(session) {
  if (!session?.authenticated || !session?.degraded) {
    return ''
  }

  if (session.degradedReason === 'missing-cas-tgc') {
    return session.sessionSource === 'cookie'
      ? "Certains services sont indisponibles, reconnecte-toi pour les afficher."
      : "Certains services sont indisponibles, reconnecte-toi pour les afficher."
  }

  return "Certains services sont indisponibles, reconnecte-toi pour les afficher."
}

function buildDebugSnapshot(label, data, error = '') {
  return {
    label,
    capturedAt: new Date().toISOString(),
    error,
    data,
  }
}

function createEmptyTpOnboardingState(overrides = {}) {
  return {
    contextLabel: '',
    program: null,
    yearOptions: [],
    tdOptions: [],
    tpOptions: [],
    selectedYear: null,
    selectedTd: null,
    detectedSelections: {
      year: null,
      td: null,
      tp: null,
    },
    errorMessage: '',
    loadingStep: null,
    loadingMessage: '',
    ...overrides,
  }
}

function findAdeTreeNodeById(rootNode, targetId) {
  if (!rootNode) {
    return null
  }

  if (String(rootNode.id) === String(targetId)) {
    return rootNode
  }

  for (const child of rootNode.children ?? []) {
    const match = findAdeTreeNodeById(child, targetId)
    if (match) {
      return match
    }
  }

  return null
}

function detectEstablishmentFromAdeTree(treePayload) {
  if (!treePayload) {
    return null
  }

  const establishments = universityConfig.establishments
  if (!establishments) {
    return null
  }

  const root = treePayload?.root
  const currentPathIds = Array.isArray(treePayload?.currentPathIds) ? treePayload.currentPathIds : []
  const currentNodes = currentPathIds
    .map((nodeId) => findAdeTreeNodeById(root, nodeId))
    .filter(Boolean)

  const searchHaystack = [
    ...currentNodes.flatMap((node) => [String(node.name ?? ''), String(node.path ?? '')]),
    String(treePayload?.defaultSelection?.contextLabel ?? ''),
    String(treePayload?.defaultSelection?.programLabel ?? ''),
    String(treePayload?.defaultSelection?.name ?? ''),
  ].join(' | ').toLowerCase()

  if (!searchHaystack.trim()) {
    return establishments.fallbackId ?? 'iutlan'
  }

  for (const rule of establishments.detectFromAdeTree ?? []) {
    if ((rule.includes ?? []).some((needle) => searchHaystack.includes(needle))) {
      return rule.id
    }
  }

  return establishments.fallbackId ?? 'iutlan'
}

function detectEstablishmentFromSelection(selection) {
  if (!selection) return null
  const searchHaystack = [
    selection.contextLabel,
    selection.programLabel,
    selection.parentLabel,
    selection.label,
  ].filter(Boolean).join(' | ').toLowerCase()

  if (!searchHaystack.trim()) return null

  for (const rule of universityConfig.establishments?.detectFromAdeTree ?? []) {
    if ((rule.includes ?? []).some((needle) => searchHaystack.includes(needle))) {
      return rule.id
    }
  }

  if (searchHaystack.includes('enssat') || searchHaystack.includes('ingenieur') || searchHaystack.includes('photonique')) {
    return 'enssat'
  }

  if (searchHaystack.includes('but') || searchHaystack.includes('iut') || searchHaystack.includes('iutlan')) {
    return 'iutlan'
  }

  return null
}

function detectEstablishment({ treePayload = null, account = null, user = null, selection = null } = {}) {
  const establishments = universityConfig.establishments
  if (!establishments) {
    return null
  }

  // 1. Check account attributes if available
  const accountHaystack = [
    account?.mail,
    account?.email,
    account?.department,
    account?.ou,
    account?.eduPersonPrimaryAffiliation,
    user,
  ].filter(Boolean).join(' | ').toLowerCase()

  if (accountHaystack.includes('enssat')) {
    return 'enssat'
  }
  if (accountHaystack.includes('iutlan') || accountHaystack.includes('iut-lannion') || accountHaystack.includes('iut lannion') || accountHaystack.includes('iut de lannion')) {
    return 'iutlan'
  }

  // 2. Check TP selection
  const fromSelection = detectEstablishmentFromSelection(selection)
  if (fromSelection) {
    return fromSelection
  }

  // 3. Check ADE tree
  if (treePayload) {
    return detectEstablishmentFromAdeTree(treePayload)
  }

  return null
}

function hasGradeWidgetsForEstablishment(est) {
  if (!universityConfig.features?.grades) {
    return false
  }
  if (!universityConfig.establishments) {
    return true
  }
  return Boolean(universityConfig.establishments.byId?.[est]?.gradeWidgets)
}

function normalizeAdePathLabels(nodes) {
  return nodes
    .map((node) => String(node?.name ?? '').trim())
    .filter((label) => label && label.toLowerCase() !== 'ressources' && label.toLowerCase() !== 'etudiants')
}

function getAdeTreePathNodes(treePayload) {
  const root = treePayload?.root
  const currentPathIds = Array.isArray(treePayload?.selectionPathIds)
    ? treePayload.selectionPathIds
    : Array.isArray(treePayload?.currentPathIds)
      ? treePayload.currentPathIds
      : []

  return currentPathIds
    .map((nodeId) => findAdeTreeNodeById(root, nodeId))
    .filter(Boolean)
    .filter((node) => !['-100', '-1'].includes(String(node.id)))
}

function buildTpSelectionOption(node, parentNode, contextLabel, extraFields = {}) {
  if (!node) {
    return null
  }

  const resourceId = String(node.id ?? '').trim()
  const label = String(node.name ?? node.path ?? '').trim()

  if (!resourceId || !label) {
    return null
  }

  return {
    resourceId,
    label,
    parentResourceId: parentNode?.id == null ? null : String(parentNode.id),
    parentLabel: parentNode?.name ? String(parentNode.name) : null,
    contextLabel: contextLabel || null,
    ...extraFields,
  }
}

function buildTpSelectionOptions(nodes, parentNode, contextLabel, extraFields = {}) {
  return (nodes ?? [])
    .map((node) => buildTpSelectionOption(node, parentNode, contextLabel, extraFields))
    .filter(Boolean)
}

function buildInitialTpOnboardingState(treePayload) {
  let pathNodes = getAdeTreePathNodes(treePayload)

  // If the user's ADE portal account had no pre-assigned resource, pathNodes is empty.
  // Instead of showing a dead-end error, look for the establishment branch or list top student formations.
  if (pathNodes.length === 0 && treePayload?.root) {
    const root = treePayload.root
    const etudiantsNode = String(root.id) === '-1'
      ? root
      : (root.children ?? []).find((c) => String(c.id) === '-1' || /etudiant/i.test(c.name)) ?? root
    const topBranches = etudiantsNode.children ?? []

    const enssatBranch = topBranches.find((b) => /enssat/i.test(b.name))
    if (enssatBranch) {
      pathNodes = [etudiantsNode, enssatBranch].filter((n) => !['-100', '-1'].includes(String(n.id)))
    } else if (topBranches.length > 0) {
      return createEmptyTpOnboardingState({
        contextLabel: 'Formations',
        program: null,
        yearOptions: buildTpSelectionOptions(topBranches, etudiantsNode, 'Formations'),
        detectedSelections: { year: null, td: null, tp: null },
        errorMessage: '',
      })
    }
  }

  const pathLabels = normalizeAdePathLabels(pathNodes)
  const programNode = pathNodes.length >= 2 ? pathNodes[1] : pathNodes[0] ?? null
  const programIndex = programNode
    ? pathNodes.findIndex((node) => String(node.id) === String(programNode.id))
    : -1
  const contextLabel = programIndex >= 0
    ? pathLabels.slice(0, programIndex + 1).join(' / ')
    : pathLabels.join(' / ')
  const yearNodes = programNode?.children ?? []
  const detectedYearNode = programIndex >= 0 ? pathNodes[programIndex + 1] ?? null : null
  const detectedTdNode = programIndex >= 0 ? pathNodes[programIndex + 2] ?? null : null
  const detectedTpNode = programIndex >= 0 ? pathNodes[programIndex + 3] ?? null : null

  return createEmptyTpOnboardingState({
    contextLabel,
    program: buildTpSelectionOption(programNode, pathNodes[programIndex - 1] ?? null, contextLabel),
    yearOptions: buildTpSelectionOptions(yearNodes, programNode, contextLabel),
    detectedSelections: {
      year: buildTpSelectionOption(detectedYearNode, programNode, contextLabel),
      td: buildTpSelectionOption(detectedTdNode, detectedYearNode, contextLabel),
      tp: buildTpSelectionOption(detectedTpNode, detectedTdNode, contextLabel),
    },
    errorMessage: yearNodes.length > 0 ? '' : "Aucun groupe d'année n'a été trouvé pour le moment",
  })
}

function buildNextTpStepFromTree(treePayload) {
  const root = treePayload?.root
  const pathNodes = getAdeTreePathNodes(treePayload)
  const pathLabels = normalizeAdePathLabels(pathNodes)
  const focusNodeId = treePayload?.focusResourceId ?? treePayload?.currentResourceId ?? null
  const focusNode = findAdeTreeNodeById(root, focusNodeId)

  return {
    contextLabel: pathLabels.join(' / '),
    parentOption: buildTpSelectionOption(focusNode, pathNodes[pathNodes.length - 2] ?? null, pathLabels.join(' / ')),
    options: buildTpSelectionOptions(focusNode?.children ?? [], focusNode, pathLabels.join(' / ')),
  }
}

function buildStoredTpSelection(program, year, td, tp, contextLabel) {
  const finalSelection = tp ?? td ?? year
  const parentSelection = tp ? (td ?? year ?? program) : td ? (year ?? program) : program

  if (!finalSelection) {
    return null
  }

  return {
    resourceId: finalSelection.resourceId,
    label: finalSelection.label,
    parentResourceId: parentSelection?.resourceId ?? null,
    parentLabel: parentSelection?.label ?? null,
    contextLabel,
    programResourceId: program?.resourceId ?? null,
    programLabel: program?.label ?? null,
    yearResourceId: year?.resourceId ?? null,
    yearLabel: year?.label ?? null,
    tdResourceId: td?.resourceId ?? null,
    tdLabel: td?.label ?? null,
    tpResourceId: tp?.resourceId ?? null,
    tpLabel: tp?.label ?? null,
  }
}

function getCurrentTpOnboardingStep(tpOnboardingState) {
  if (!tpOnboardingState.selectedYear) {
    return 'year'
  }

  if (!tpOnboardingState.selectedTd) {
    return 'td'
  }

  return 'tp'
}

function getCurrentTpStepOptions(tpOnboardingState) {
  const currentStep = getCurrentTpOnboardingStep(tpOnboardingState)

  if (currentStep === 'year') {
    return tpOnboardingState.yearOptions
  }

  if (currentStep === 'td') {
    return tpOnboardingState.tdOptions
  }

  return tpOnboardingState.tpOptions
}

function getDetectedSelectionForStep(tpOnboardingState, stepKey) {
  return tpOnboardingState.detectedSelections?.[stepKey] ?? null
}

function getFrenchTpLoadErrorMessage(error) {
  const normalizedMessage = getErrorMessage(error).trim().toLowerCase()

  if (
    normalizedMessage.includes('networkerror')
    || normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('load failed')
    || normalizedMessage.includes('network request failed')
  ) {
    return "Impossible de récupérer les groupes TP pour le moment, vérifie ta connexion puis réessaie"
  }

  return 'ADE est indisponible pour le moment'
}

let settingsTransferReported = false

// One event per arrival from the old l'ent address. Called right after the
// session says whether analytics is on: track() drops anything sent earlier.
function reportSettingsTransfer() {
  if (!settingsTransfer.arrived || settingsTransferReported) return
  settingsTransferReported = true
  track('settings_imported', { has_settings: settingsTransfer.importedKeys.length > 0 })
}

function App() {
  const debugCopyTimeoutRef = useRef(null)
  const [debugOpen, setDebugOpen] = useState(false)
  // Debug menu: shifts the daily hero photo pick to preview the others.
  const [heroOffset, setHeroOffset] = useState(0)
  const [debugOutputTab, setDebugOutputTab] = useState('api')
  const [debugCopyState, setDebugCopyState] = useState('idle')
  const [debugImagePreview, setDebugImagePreview] = useState(null)
  const [forceInstallPrompt, setForceInstallPrompt] = useState(false)
  const [forceIosPrompt, setForceIosPrompt] = useState(false)
  const [forceUpdatePrompt, setForceUpdatePrompt] = useState(false)
  const [welcomeFromLentOpen, setWelcomeFromLentOpen] = useState(false)
  const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false)

  useEffect(() => {
    if (!settingsTransfer.arrived) return undefined
    const timer = setTimeout(() => setWelcomeFromLentOpen(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const showInstallPrompt = useCallback(() => {
    setForceInstallPrompt(true)
    setTimeout(() => setForceInstallPrompt(false), 100)
  }, [])
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false)
  // The « Nouveautés » pill waits for the "Nouvelle version" notice (same
  // slot; the update reload brings the new entries anyway) and for any sheet
  // that opened by itself.
  const showChangelogPill = !hasPendingUpdate && !welcomeFromLentOpen && !isInstallPromptVisible
  const applyUpdateRef = useRef(null)
  const handleApplyUpdate = useCallback(async () => {
    if (applyUpdateRef.current) {
      await applyUpdateRef.current()
    } else {
      window.location.reload()
    }
  }, [])
  const [debugNextClass, setDebugNextClass] = useState(false)
  const usernameInputRef = useRef(null)
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })
  const [requestPath, setRequestPath] = useState(DEFAULT_REQUEST_PATH)
  const [adeSearchQuery, setAdeSearchQuery] = useState('')
  const [establishment, setEstablishment] = useState(() => getStoredEstablishment())
  const [selectedTp, setSelectedTp] = useState(() => getStoredTpSelection())
  const [nextClassLookaheadDays, setNextClassLookaheadDays] = useState(() => getStoredAdeLookaheadDays())
  const [hiddenWidgets, setHiddenWidgets] = useState(() => getStoredHiddenWidgets())
  const [customBackground, setCustomBackground] = useState(() => getStoredCustomBackground())
  const [showWallpaper, setShowWallpaper] = useState(() => getStoredShowWallpaper())
  const [theme, setTheme] = useState(() => getStoredTheme())
  const [showAppDescriptions, setShowAppDescriptions] = useState(() => getStoredShowAppDescriptions())
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(() => getStoredAnonymousAnalytics())
  const isAnalyticsAvailable = useAnalyticsAvailable()
  // Lookahead actually fed to the next-class widget. Re-synced only while the
  // account modal is closed, so moving the slider doesn't refetch the widget
  // on every step.
  const [appliedLookaheadDays, setAppliedLookaheadDays] = useState(nextClassLookaheadDays)
  const [profileUser, setProfileUser] = useState(null)
  const [isHydratingProfile, setIsHydratingProfile] = useState(false)
  const [hasHydratedProfile, setHasHydratedProfile] = useState(false)
  const [profileReloadNonce, setProfileReloadNonce] = useState(0)
  const [tpOnboardingState, setTpOnboardingState] = useState(createEmptyTpOnboardingState)
  const [tpTransitionDirection, setTpTransitionDirection] = useState('initial')
  const [completionScreenState, setCompletionScreenState] = useState({
    visible: false,
    leaving: false,
    userName: '',
  })
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountModalPhoto, setAccountModalPhoto] = useState(null)
  const [accountModalPlanningState, setAccountModalPlanningState] = useState(createEmptyAccountModalPlanningState)
  // 'idle' | 'loading' | 'done' — once the ADE tree has loaded (or failed),
  // reopening the account modal reuses the in-memory state instead of
  // reloading everything.
  const accountModalAdeLoadRef = useRef('idle')
  const [dashboardRevealNonce, setDashboardRevealNonce] = useState(0)
  const [isSidebarViewport, setIsSidebarViewport] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  ))
  const [favoritesSlotEl, setFavoritesSlotEl] = useState(null)
  const [sessionState, setSessionState] = useState({
    checking: true,
    authenticated: false,
    user: null,
    givenName: null,
    account: null,
    degraded: false,
    degradedReason: null,
    sessionSource: null,
    canUseServerLaunch: false,
    warning: '',
    error: '',
  })
  const [hasCheckedInitialSession, setHasCheckedInitialSession] = useState(false)
  const [debugState, setDebugState] = useState({
    loading: false,
    label: 'Session',
    error: '',
    payload: buildDebugSnapshot('Session', { status: 'initializing' }),
  })

  const commitDebugState = useCallback((label, data, error = '') => {
    setDebugState({
      loading: false,
      label,
      error,
      payload: buildDebugSnapshot(label, data, error),
    })
  }, [])

  const refreshSession = useCallback(async (options = {}) => {
    const { exposeOutput = false } = options

    setSessionState((current) => ({
      ...current,
      checking: true,
      error: '',
    }))

    if (exposeOutput) {
      setDebugOutputTab('api')
      setDebugState((current) => ({
        ...current,
        loading: true,
        label: 'Session',
        error: '',
      }))
    }

    try {
      const session = await getAuthSession()
      setAnalyticsAvailable(session?.analyticsEnabled)
      reportSettingsTransfer()
      let givenName = null
      let account = null

      if (session.authenticated) {
        try {
          const accountResponse = await getAccountInfo()
          account = accountResponse.account ?? null
          givenName = account?.given_name ?? null
        } catch {
          // Account info is best-effort
        }
      }

      const authenticated = Boolean(session.authenticated)
      const user = session.user ?? null
      const warning = getSessionWarningMessage(session)

      setSessionState({
        checking: false,
        authenticated,
        user,
        givenName,
        account,
        degraded: Boolean(session.degraded),
        degradedReason: session.degradedReason ?? null,
        sessionSource: session.sessionSource ?? null,
        canUseServerLaunch: Boolean(session.canUseServerLaunch),
        warning,
        error: '',
      })

      if (!authenticated) {
        clearLegacySensitiveClientCaches()
      }

      if (exposeOutput) {
        commitDebugState('Session', session)
      }

      return session
    } catch (error) {
      const message = getFrenchAuthErrorMessage(error, 'session')

      setSessionState({
        checking: false,
        authenticated: false,
        user: null,
        givenName: null,
        account: null,
        degraded: false,
        degradedReason: null,
        sessionSource: null,
        canUseServerLaunch: false,
        warning: '',
        error: message,
      })
      clearLegacySensitiveClientCaches()

      if (exposeOutput) {
        commitDebugState('Session', null, message)
      }

      return null
    } finally {
      setHasCheckedInitialSession(true)
    }
  }, [commitDebugState])

  useEffect(() => {
    clearLegacySensitiveClientCaches({ keepSessionGrades: true })
  }, [])

  const runDebugAction = useCallback(async (label, action) => {
    setDebugOutputTab('api')
    setDebugImagePreview(null)
    setDebugState((current) => ({
      ...current,
      loading: true,
      label,
      error: '',
    }))

    try {
      const result = await action()
      commitDebugState(label, result)
      return result
    } catch (error) {
      commitDebugState(label, null, getErrorMessage(error))
      return null
    }
  }, [commitDebugState])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshSession({ exposeOutput: DEBUG_MENU_ENABLED })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refreshSession])

  useEffect(() => {
    if (!DEBUG_MENU_ENABLED) {
      return undefined
    }

    function handleWindowKeydown(event) {
      const key = String(event.key ?? '').toLowerCase()
      if (!key) return

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'd') {
        event.preventDefault()
        setDebugOpen((current) => !current)
      }

      if (key === 'escape') {
        setDebugOpen(false)
      }
    }

    window.addEventListener('keydown', handleWindowKeydown)
    return () => window.removeEventListener('keydown', handleWindowKeydown)
  }, [])

  useEffect(() => {
    return () => {
      if (debugCopyTimeoutRef.current !== null) {
        window.clearTimeout(debugCopyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let faviconLink = document.querySelector("link[rel='icon']")

    if (!faviconLink) {
      faviconLink = document.createElement('link')
      faviconLink.setAttribute('rel', 'icon')
      document.head.appendChild(faviconLink)
    }

    faviconLink.setAttribute('type', 'image/png')
    faviconLink.setAttribute('href', favicon)
  }, [])

  useEffect(() => {
    syncRuntimeSeo({ authenticated: sessionState.authenticated })
  }, [sessionState.authenticated])

  useEffect(() => {
    if (!DEBUG_MENU_ENABLED || !debugOpen || sessionState.authenticated) {
      return undefined
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      usernameInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [debugOpen, sessionState.authenticated])

  useEffect(() => {
    if (!completionScreenState.visible) {
      return undefined
    }

    const leaveTimeoutId = window.setTimeout(() => {
      setCompletionScreenState((current) => ({
        ...current,
        leaving: true,
      }))
    }, ONBOARDING_COMPLETION_SCREEN_MS - 280)

    const dismissTimeoutId = window.setTimeout(() => {
      setCompletionScreenState((current) => ({
        ...current,
        visible: false,
        leaving: false,
      }))
      setDashboardRevealNonce((current) => current + 1)
    }, ONBOARDING_COMPLETION_SCREEN_MS)

    return () => {
      window.clearTimeout(leaveTimeoutId)
      window.clearTimeout(dismissTimeoutId)
    }
  }, [completionScreenState.visible])

  useEffect(() => {
    if (sessionState.authenticated && profileUser === sessionState.user) {
      return undefined
    }

    setCompletionScreenState({
      visible: false,
      userName: '',
    })

    return undefined
  }, [profileUser, sessionState.authenticated, sessionState.user])

  useEffect(() => {
    if (sessionState.checking) {
      return undefined
    }

    if (!sessionState.authenticated || !sessionState.user) {
      setProfileUser(null)
      setEstablishment(null)
      setSelectedTp(null)
      setHasHydratedProfile(false)
      setTpOnboardingState(createEmptyTpOnboardingState())
      setIsHydratingProfile(false)
      return undefined
    }

    if (profileUser === sessionState.user) {
      return undefined
    }

    setProfileUser(sessionState.user)
    const storedSel = getStoredTpSelection(sessionState.user)
    const existingEst = getStoredEstablishment(sessionState.user)
    const detected = detectEstablishment({
      account: sessionState.account,
      user: sessionState.user,
      selection: storedSel,
    })
    let nextEstablishment = existingEst
    if (!nextEstablishment || nextEstablishment === 'other') {
      nextEstablishment = detected || universityConfig.establishments?.fallbackId || 'iutlan'
    } else if (detected && detected !== existingEst) {
      nextEstablishment = detected
    }
    if (nextEstablishment !== existingEst) {
      persistEstablishment(nextEstablishment, sessionState.user)
    }
    setEstablishment(nextEstablishment)
    setSelectedTp(getStoredTpSelection(sessionState.user))
    setNextClassLookaheadDays(getStoredAdeLookaheadDays(sessionState.user))
    setHiddenWidgets(getStoredHiddenWidgets(sessionState.user))
    setCustomBackground(getStoredCustomBackground(sessionState.user))
    setShowWallpaper(getStoredShowWallpaper(sessionState.user))
    setShowAppDescriptions(getStoredShowAppDescriptions(sessionState.user))
    // Applied to the analytics module right away (not in an effect) so the
    // first dashboard events already honour this user's choice.
    const storedAnonymousAnalytics = getStoredAnonymousAnalytics(sessionState.user)
    setAnalyticsUserEnabled(storedAnonymousAnalytics)
    setAnonymousAnalytics(storedAnonymousAnalytics)
    setHasHydratedProfile(false)
    setTpOnboardingState(createEmptyTpOnboardingState())

    return undefined
  }, [profileUser, sessionState.authenticated, sessionState.checking, sessionState.user])

  useEffect(() => {
    if (!sessionState.authenticated || sessionState.checking || !sessionState.user) {
      return undefined
    }

    if (profileUser !== sessionState.user || hasHydratedProfile) {
      return undefined
    }

    let cancelled = false
    setIsHydratingProfile(true)
    setTpOnboardingState((current) => createEmptyTpOnboardingState({
      ...current,
      loadingStep: 'year',
      loadingMessage: "Récupération de ton groupe...",
      errorMessage: '',
    }))

    async function hydrateProfile() {
      try {
        const storedSelection = getStoredTpSelection(sessionState.user)

        if (storedSelection) {
          if (cancelled) {
            return
          }

          const currentEst = getStoredEstablishment(sessionState.user)
          const resolvedEst = (!currentEst || currentEst === 'other')
            ? (detectEstablishment({
                account: sessionState.account,
                user: sessionState.user,
                selection: storedSelection,
              }) || universityConfig.establishments?.fallbackId || 'iutlan')
            : currentEst

          if (resolvedEst !== currentEst) {
            persistEstablishment(resolvedEst, sessionState.user)
          }
          setEstablishment(resolvedEst)

          setSelectedTp(storedSelection)
          setTpOnboardingState(createEmptyTpOnboardingState({
            contextLabel: storedSelection.contextLabel ?? '',
            program: storedSelection.programResourceId
              ? {
                  resourceId: storedSelection.programResourceId,
                  label: storedSelection.programLabel ?? '',
                }
              : null,
          }))
          return
        }

        let treeResponse = await getAdeTree()
        let treePayload = treeResponse?.tree
        const detectedEstablishment = detectEstablishment({
          treePayload,
          account: sessionState.account,
          user: sessionState.user,
        }) || universityConfig.establishments?.fallbackId || 'iutlan'

        persistEstablishment(detectedEstablishment, sessionState.user)
        setEstablishment(detectedEstablishment)

        let scodocGroupSelection = null
        if (hasGradeWidgetsForEstablishment(detectedEstablishment)) {
          try {
            const gradesResponse = await getGrades()
            if (gradesResponse?.unavailable && detectedEstablishment === 'iutlan') {
              const revised = 'enssat'
              persistEstablishment(revised, sessionState.user)
              setEstablishment(revised)
            } else if (gradesResponse?.authenticated && !gradesResponse?.disabled) {
              scodocGroupSelection = detectScodocGroupSelection(gradesResponse.grades)
            }
          } catch {
            // Grades are best-effort for onboarding auto-selection.
          }
        }
        const defaultSelection = treePayload?.defaultSelection?.resourceId
          ? treePayload.defaultSelection
          : null

        if (defaultSelection) {
          if (cancelled) {
            return
          }

          persistEstablishment(detectedEstablishment, sessionState.user)
          setEstablishment(detectedEstablishment)
          persistTpSelection(defaultSelection, sessionState.user)
          clearAdeTimetableCache()
          setSelectedTp(defaultSelection)
          setTpOnboardingState(createEmptyTpOnboardingState({
            contextLabel: defaultSelection.contextLabel ?? '',
            program: defaultSelection.programResourceId
              ? {
                  resourceId: defaultSelection.programResourceId,
                  label: defaultSelection.programLabel ?? '',
                }
              : null,
          }))
          return
        }

        let nextTpOnboardingState = buildInitialTpOnboardingState(treePayload)

        if (nextTpOnboardingState.program?.resourceId && nextTpOnboardingState.yearOptions.length === 0) {
          treeResponse = await getAdeTree(nextTpOnboardingState.program.resourceId)
          treePayload = treeResponse?.tree
          nextTpOnboardingState = buildInitialTpOnboardingState(treePayload)
        }

        if (cancelled) {
          return
        }

        persistEstablishment(detectedEstablishment, sessionState.user)
        setEstablishment(detectedEstablishment)

        const detectedYear = nextTpOnboardingState.detectedSelections.year

        if (detectedYear?.resourceId) {
          const detectedYearTreeResponse = await getAdeTree(detectedYear.resourceId)
          const detectedYearStep = buildNextTpStepFromTree(detectedYearTreeResponse?.tree)

          if (cancelled) {
            return
          }

          nextTpOnboardingState = {
            ...nextTpOnboardingState,
            contextLabel: nextTpOnboardingState.contextLabel || detectedYearStep.contextLabel,
            selectedYear: detectedYear,
            tdOptions: detectedYearStep.options,
            errorMessage: detectedYearStep.options.length > 0
              ? ''
              : "Aucun groupe TD n'a été trouvé pour le moment",
          }

          const autoDetectedTd = findTpOptionByLabel(
            detectedYearStep.options,
            scodocGroupSelection?.tdAliases?.length
              ? scodocGroupSelection.tdAliases
              : scodocGroupSelection?.tdLabel,
          )

          if (autoDetectedTd?.resourceId) {
            const detectedTdTreeResponse = await getAdeTree(autoDetectedTd.resourceId)
            const detectedTdStep = buildNextTpStepFromTree(detectedTdTreeResponse?.tree)

            if (cancelled) {
              return
            }

            const autoDetectedTp = findTpOptionByLabel(
              detectedTdStep.options,
              scodocGroupSelection?.tpAliases?.length
                ? scodocGroupSelection.tpAliases
                : scodocGroupSelection?.tpLabel,
            )
            const autoStoredSelection = buildStoredTpSelection(
              nextTpOnboardingState.program,
              detectedYear,
              autoDetectedTd,
              autoDetectedTp,
              nextTpOnboardingState.contextLabel || detectedTdStep.contextLabel,
            )

            if (autoStoredSelection && (autoDetectedTp?.resourceId || detectedTdStep.options.length === 0)) {
              persistTpSelection(autoStoredSelection, sessionState.user)
              clearAdeTimetableCache()
              setSelectedTp(autoStoredSelection)
              setTpOnboardingState(createEmptyTpOnboardingState({
                contextLabel: autoStoredSelection.contextLabel ?? '',
                program: nextTpOnboardingState.program,
                selectedYear: detectedYear,
                selectedTd: autoDetectedTd,
              }))
              return
            }

            nextTpOnboardingState = {
              ...nextTpOnboardingState,
              contextLabel: nextTpOnboardingState.contextLabel || detectedTdStep.contextLabel,
              selectedTd: autoDetectedTd,
              tpOptions: detectedTdStep.options,
              detectedSelections: {
                ...nextTpOnboardingState.detectedSelections,
                td: autoDetectedTd,
                tp: autoDetectedTp,
              },
            }
          }
        }

        setSelectedTp(null)
        setTpOnboardingState(nextTpOnboardingState)
      } catch {
        if (cancelled) {
          return
        }

        if (!establishment) {
          persistEstablishment('other', sessionState.user)
          setEstablishment('other')
        }

        setSelectedTp({ resourceId: null, skipped: true })
        setTpOnboardingState(createEmptyTpOnboardingState())
      } finally {
        if (!cancelled) {
          setIsHydratingProfile(false)
          setHasHydratedProfile(true)
        }
      }
    }

    void hydrateProfile()

    return () => {
      cancelled = true
    }
  }, [
    establishment,
    hasHydratedProfile,
    profileReloadNonce,
    profileUser,
    sessionState.authenticated,
    sessionState.checking,
    sessionState.user,
  ])

  const commitTpSelection = useCallback((program, contextLabel, year, td, tp) => {
    const storedSelection = buildStoredTpSelection(program, year, td, tp, contextLabel)
    if (!storedSelection) {
      return
    }

    persistTpSelection(storedSelection, sessionState.user)
    clearAdeTimetableCache()
    setSelectedTp(storedSelection)
    setTpOnboardingState(createEmptyTpOnboardingState({
      contextLabel,
      program,
      selectedYear: year,
      selectedTd: td,
    }))
    setCompletionScreenState({
      visible: true,
      leaving: false,
      userName: sessionState.givenName ?? sessionState.user ?? '',
    })
  }, [sessionState.givenName, sessionState.user])

  const loadTdOptions = useCallback(async (yearOption) => {
    setTpOnboardingState((current) => ({
      ...current,
      selectedYear: yearOption,
      selectedTd: null,
      tdOptions: [],
      tpOptions: [],
      errorMessage: '',
      loadingStep: 'td',
      loadingMessage: 'Récupération des TD...',
    }))

    try {
      const treeResponse = await getAdeTree(yearOption.resourceId)
      const nextStep = buildNextTpStepFromTree(treeResponse?.tree)

      if (nextStep.options.length === 0) {
        commitTpSelection(
          tpOnboardingState.program,
          tpOnboardingState.contextLabel || nextStep.contextLabel,
          yearOption,
          null,
          null,
        )
        return
      }

      setTpOnboardingState((current) => ({
        ...current,
        contextLabel: current.contextLabel || nextStep.contextLabel,
        selectedYear: yearOption,
        selectedTd: null,
        tdOptions: nextStep.options,
        tpOptions: [],
        errorMessage: '',
        loadingStep: null,
        loadingMessage: '',
      }))
    } catch (error) {
      setTpOnboardingState((current) => ({
        ...current,
        selectedYear: yearOption,
        selectedTd: null,
        tdOptions: [],
        tpOptions: [],
        errorMessage: getFrenchTpLoadErrorMessage(error),
        loadingStep: null,
        loadingMessage: '',
      }))
    }
  }, [commitTpSelection, tpOnboardingState.contextLabel, tpOnboardingState.program])

  const loadTpOptions = useCallback(async (tdOption) => {
    setTpOnboardingState((current) => ({
      ...current,
      selectedTd: tdOption,
      tpOptions: [],
      errorMessage: '',
      loadingStep: 'tp',
      loadingMessage: 'Récupération des TP...',
    }))

    try {
      const treeResponse = await getAdeTree(tdOption.resourceId)
      const nextStep = buildNextTpStepFromTree(treeResponse?.tree)

      if (nextStep.options.length === 0) {
        commitTpSelection(
          tpOnboardingState.program,
          tpOnboardingState.contextLabel || nextStep.contextLabel,
          tpOnboardingState.selectedYear,
          tdOption,
          null,
        )
        return
      }

      setTpOnboardingState((current) => ({
        ...current,
        contextLabel: current.contextLabel || nextStep.contextLabel,
        selectedTd: tdOption,
        tpOptions: nextStep.options,
        errorMessage: '',
        loadingStep: null,
        loadingMessage: '',
      }))
    } catch (error) {
      setTpOnboardingState((current) => ({
        ...current,
        selectedTd: tdOption,
        tpOptions: [],
        errorMessage: getFrenchTpLoadErrorMessage(error),
        loadingStep: null,
        loadingMessage: '',
      }))
    }
  }, [commitTpSelection, tpOnboardingState.contextLabel, tpOnboardingState.program, tpOnboardingState.selectedYear])

  useEffect(() => {
    if (sessionState.authenticated) {
      return
    }

    setIsAccountModalOpen(false)
    setAccountModalPhoto(null)
    setAccountModalPlanningState(createEmptyAccountModalPlanningState())
    accountModalAdeLoadRef.current = 'idle'
  }, [sessionState.authenticated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event) => setIsSidebarViewport(event.matches)
    setIsSidebarViewport(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!sessionState.authenticated) {
      return undefined
    }

    let cancelled = false

    void resolveAccountProfilePhoto(sessionState.account).then((photoSrc) => {
      if (!cancelled) {
        setAccountModalPhoto(photoSrc)
      }
    })

    return () => {
      cancelled = true
    }
  }, [sessionState.authenticated, sessionState.account])

  useEffect(() => {
    if (!isAccountModalOpen || !sessionState.authenticated) {
      return undefined
    }

    // ADE already loaded (or failed) — keep the current planning state
    // instead of reloading the whole thing on every open.
    if (accountModalAdeLoadRef.current !== 'idle') {
      return undefined
    }

    let cancelled = false
    accountModalAdeLoadRef.current = 'loading'

    setAccountModalPlanningState(createStoredPlanningDraftState(selectedTp, {
      loading: true,
      loadingMessage: 'Chargement...',
    }))

    void buildAccountModalPlanningState(selectedTp)
      .then((nextPlanningState) => {
        if (!cancelled) {
          accountModalAdeLoadRef.current = 'done'
          setAccountModalPlanningState(nextPlanningState)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          accountModalAdeLoadRef.current = 'done'
          setAccountModalPlanningState(createStoredPlanningDraftState(selectedTp, {
            loading: false,
            loadingMessage: '',
            errorMessage: getFrenchTpLoadErrorMessage(error),
          }))
        }
      })

    return () => {
      cancelled = true
      if (accountModalAdeLoadRef.current === 'loading') {
        accountModalAdeLoadRef.current = 'idle'
      }
    }
  }, [isAccountModalOpen, selectedTp, sessionState.authenticated])

  const handleOpenAccountModal = useCallback(() => {
    if (!sessionState.authenticated || sessionState.checking) {
      return
    }

    setIsAccountModalOpen(true)
  }, [sessionState.authenticated, sessionState.checking])

  // Closing the modal (X, backdrop, Escape) applies the draft planning
  // selection — there is no separate "Appliquer" step. No-ops when the
  // selection is incomplete or unchanged.
  const handleCloseAccountModal = useCallback(() => {
    setIsAccountModalOpen(false)

    if (!sessionState.user) {
      return
    }

    const nextSelection = buildStoredTpSelection(
      accountModalPlanningState.program,
      accountModalPlanningState.draftYear,
      accountModalPlanningState.draftTd,
      accountModalPlanningState.draftTp,
      accountModalPlanningState.contextLabel,
    )

    if (!nextSelection) {
      return
    }

    const isSameSelection = Boolean(selectedTp)
      && selectedTp.resourceId === nextSelection.resourceId
      && (selectedTp.yearResourceId ?? null) === (nextSelection.yearResourceId ?? null)
      && (selectedTp.tdResourceId ?? null) === (nextSelection.tdResourceId ?? null)
      && (selectedTp.tpResourceId ?? null) === (nextSelection.tpResourceId ?? null)

    if (isSameSelection) {
      return
    }

    persistTpSelection(nextSelection, sessionState.user)
    clearAdeTimetableCache()
    setSelectedTp(nextSelection)
    setTpOnboardingState(createEmptyTpOnboardingState({
      contextLabel: accountModalPlanningState.contextLabel,
      program: accountModalPlanningState.program,
      selectedYear: accountModalPlanningState.draftYear,
      selectedTd: accountModalPlanningState.draftTd,
    }))
  }, [accountModalPlanningState, selectedTp, sessionState.user])

  const handleNextClassLookaheadChange = useCallback((days) => {
    persistAdeLookaheadDays(days, sessionState.user)
    setNextClassLookaheadDays(days)
  }, [sessionState.user])

  const heroImage = useMemo(() => (
    customBackground
      ? { src: customBackground, position: null, credit: null }
      : resolveHeroImage(establishment, new Date(), heroOffset)
  ), [customBackground, establishment, heroOffset])
  const heroImageCount = useMemo(() => listHeroImages(establishment).length, [establishment])
  const hasMobileTabBar = useMemo(() => getMobileTabItems(establishment).length > 0, [establishment])
  const route = useAppRoute()
  // The sidebar and tab bar follow `route` right away (their highlight slides
  // over); the page content renders from the deferred value, in the
  // background, so mounting it doesn't freeze that animation.
  const deferredRoute = useDeferredValue(route)
  const gradesPageAvailable = isGradesPageAvailable(establishment)
  const planningPageAvailable = isPlanningPageAvailable()
  const mailPageAvailable = isMailPageAvailable()
  const moodlePageAvailable = isMoodlePageAvailable()
  const isScodocRoute = deferredRoute === 'grades' || deferredRoute === 'absences'
  const activeRoute = (isScodocRoute && gradesPageAvailable)
    || (deferredRoute === 'planning' && planningPageAvailable)
    || (deferredRoute === 'mail' && mailPageAvailable)
    || (deferredRoute === 'moodle' && moodlePageAvailable)
    ? deferredRoute
    : 'dashboard'

  // Rejects with a user-facing message (shown in Mon compte) on failure.
  const handleCustomBackgroundChange = useCallback(async (file) => {
    const dataUrl = await saveCustomBackground(file, sessionState.user)
    setCustomBackground(dataUrl)
    track('setting_changed', { setting: 'custom_background', value: 'on' })
  }, [sessionState.user])

  const handleCustomBackgroundReset = useCallback(() => {
    clearStoredCustomBackground()
    setCustomBackground(null)
    track('setting_changed', { setting: 'custom_background', value: 'off' })
  }, [])

  useEffect(() => watchTheme(theme), [theme])

  const handleThemeChange = useCallback((nextTheme) => {
    persistTheme(nextTheme)
    setTheme(nextTheme)
    track('setting_changed', { setting: 'theme', value: nextTheme })
  }, [])

  const handleShowWallpaperChange = useCallback((show) => {
    persistShowWallpaper(show, sessionState.user)
    setShowWallpaper(show)
    track('setting_changed', { setting: 'wallpaper', value: show ? 'on' : 'off' })
  }, [sessionState.user])
  const [heroHeight, setHeroHeight] = useState(null)
  const heroObserverRef = useRef(null)

  // The hero photo runs behind the header and the whole widget row (one or
  // two lines, fewer when widgets are hidden), then fades just below it.
  // Callback ref: the dashboard column mounts after auth/onboarding settle.
  const dashboardColumnRef = useCallback((column) => {
    heroObserverRef.current?.disconnect()
    heroObserverRef.current = null

    const widgetRow = column?.querySelector('.widget-row')
    if (!column || !widgetRow || typeof ResizeObserver === 'undefined') {
      return
    }

    const measure = () => {
      const columnTop = column.getBoundingClientRect().top - column.scrollTop
      setHeroHeight(Math.round(widgetRow.getBoundingClientRect().bottom - columnTop + HERO_FADE_OVERHANG_PX))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(widgetRow)
    observer.observe(column)
    heroObserverRef.current = observer
  }, [])

  const handleWidgetVisibilityChange = useCallback((widgetId, visible) => {
    track('setting_changed', { setting: 'widget_visibility', value: visible ? 'on' : 'off', widget: widgetId })
    setHiddenWidgets((current) => {
      const next = visible
        ? current.filter((id) => id !== widgetId)
        : [...current.filter((id) => id !== widgetId), widgetId]
      persistHiddenWidgets(next, sessionState.user)
      return next
    })
  }, [sessionState.user])

  const handleEstablishmentChange = useCallback((newEstablishment) => {
    track('setting_changed', { setting: 'establishment', value: newEstablishment })
    persistEstablishment(newEstablishment, sessionState.user)
    setEstablishment(newEstablishment)
  }, [sessionState.user])

  const widgetToggles = useMemo(() => getAvailableWidgets(establishment).map((widget) => ({
    id: widget.id,
    label: widget.label,
    icon: widget.icon,
    visible: !hiddenWidgets.includes(widget.id),
  })), [establishment, hiddenWidgets])

  const handleShowAppDescriptionsChange = useCallback((show) => {
    persistShowAppDescriptions(show, sessionState.user)
    setShowAppDescriptions(show)
    track('setting_changed', { setting: 'app_descriptions', value: show ? 'on' : 'off' })
  }, [sessionState.user])

  // "Statistiques anonymes": switching it off stops tracking before anything
  // else happens, so the change itself is never reported.
  const handleAnonymousAnalyticsChange = useCallback((enabled) => {
    setAnalyticsUserEnabled(enabled)
    persistAnonymousAnalytics(enabled, sessionState.user)
    setAnonymousAnalytics(enabled)
    if (enabled) {
      track('setting_changed', { setting: 'analytics', value: 'on' })
    }
  }, [sessionState.user])

  useEffect(() => {
    setAnalyticsEstablishment(establishment)
  }, [establishment])

  useEffect(() => {
    setAnalyticsFormation(selectedTp?.programLabel ?? null)
  }, [selectedTp?.programLabel])

  useEffect(() => {
    if (!isAccountModalOpen) {
      setAppliedLookaheadDays(nextClassLookaheadDays)
    }
  }, [isAccountModalOpen, nextClassLookaheadDays])

  const handleAccountModalYearChange = useCallback(async (yearResourceId) => {
    const nextYear = findTpOptionByResourceId(accountModalPlanningState.yearOptions, yearResourceId)

    if (!nextYear) {
      return
    }

    setAccountModalPlanningState((current) => ({
      ...current,
      loading: true,
      loadingMessage: 'Chargement des TD...',
      errorMessage: '',
      draftYear: nextYear,
      draftTd: null,
      draftTp: null,
      tdOptions: [],
      tpOptions: [],
    }))

    try {
      const nextStep = await loadTdOptionsForAccountModal(nextYear)

      setAccountModalPlanningState((current) => ({
        ...current,
        loading: false,
        loadingMessage: '',
        contextLabel: getFirstAvailableString(nextStep.contextLabel, current.contextLabel) ?? '',
        draftYear: nextYear,
        draftTd: null,
        draftTp: null,
        tdOptions: nextStep.options,
        tpOptions: [],
        errorMessage: '',
      }))
    } catch (error) {
      setAccountModalPlanningState((current) => ({
        ...current,
        loading: false,
        loadingMessage: '',
        draftYear: nextYear,
        draftTd: null,
        draftTp: null,
        tdOptions: [],
        tpOptions: [],
        errorMessage: getFrenchTpLoadErrorMessage(error),
      }))
    }
  }, [accountModalPlanningState.yearOptions])

  const handleAccountModalTdChange = useCallback(async (tdResourceId) => {
    const nextTd = findTpOptionByResourceId(accountModalPlanningState.tdOptions, tdResourceId)

    if (!nextTd) {
      return
    }

    setAccountModalPlanningState((current) => ({
      ...current,
      loading: true,
      loadingMessage: 'Chargement des TP...',
      errorMessage: '',
      draftTd: nextTd,
      draftTp: null,
      tpOptions: [],
    }))

    try {
      const nextStep = await loadTpOptionsForAccountModal(nextTd)

      setAccountModalPlanningState((current) => ({
        ...current,
        loading: false,
        loadingMessage: '',
        contextLabel: getFirstAvailableString(nextStep.contextLabel, current.contextLabel) ?? '',
        draftTd: nextTd,
        draftTp: null,
        tpOptions: nextStep.options,
        errorMessage: '',
      }))
    } catch (error) {
      setAccountModalPlanningState((current) => ({
        ...current,
        loading: false,
        loadingMessage: '',
        draftTd: nextTd,
        draftTp: null,
        tpOptions: [],
        errorMessage: getFrenchTpLoadErrorMessage(error),
      }))
    }
  }, [accountModalPlanningState.tdOptions])

  const handleAccountModalTpChange = useCallback((tpResourceId) => {
    const nextTp = findTpOptionByResourceId(accountModalPlanningState.tpOptions, tpResourceId)

    setAccountModalPlanningState((current) => ({
      ...current,
      draftTp: nextTp,
      errorMessage: '',
    }))
  }, [accountModalPlanningState.tpOptions])

  const manageAccountUrl = universityConfig.links?.manageAccount ?? null
  const handleManageAccount = useCallback(() => {
    if (!manageAccountUrl) {
      return
    }

    window.location.assign(manageAccountUrl)
  }, [manageAccountUrl])

  function handleOnboardingBack() {
    setTpTransitionDirection('back')
    const currentStep = getCurrentTpOnboardingStep(tpOnboardingState)

    if (currentStep === 'td') {
      setTpOnboardingState((current) => ({
        ...current,
        selectedYear: null,
        selectedTd: null,
        tdOptions: [],
        tpOptions: [],
        errorMessage: '',
        loadingStep: null,
        loadingMessage: '',
      }))
      return
    }

    if (currentStep === 'tp') {
      setTpOnboardingState((current) => ({
        ...current,
        selectedTd: null,
        tpOptions: [],
        errorMessage: '',
        loadingStep: null,
        loadingMessage: '',
      }))
    }
  }

  function handleOnboardingRetry() {
    const currentStep = getCurrentTpOnboardingStep(tpOnboardingState)

    if (currentStep === 'year') {
      setHasHydratedProfile(false)
      setTpOnboardingState(createEmptyTpOnboardingState())
      setProfileReloadNonce((current) => current + 1)
      return
    }

    if (currentStep === 'td' && tpOnboardingState.selectedYear) {
      void loadTdOptions(tpOnboardingState.selectedYear)
      return
    }

    if (currentStep === 'tp' && tpOnboardingState.selectedTd) {
      void loadTpOptions(tpOnboardingState.selectedTd)
    }
  }

  function handleOnboardingSelect(nextOption) {
    setTpTransitionDirection('forward')
    const currentStep = getCurrentTpOnboardingStep(tpOnboardingState)

    if (currentStep === 'year') {
      void loadTdOptions(nextOption)
      return
    }

    if (currentStep === 'td') {
      void loadTpOptions(nextOption)
      return
    }

    commitTpSelection(
      tpOnboardingState.program,
      tpOnboardingState.contextLabel,
      tpOnboardingState.selectedYear,
      tpOnboardingState.selectedTd,
      nextOption,
    )
  }

  function handleOnboardingIgnore() {
    setTpTransitionDirection('forward')
    const currentStep = getCurrentTpOnboardingStep(tpOnboardingState)

    if (currentStep === 'td') {
      commitTpSelection(
        tpOnboardingState.program,
        tpOnboardingState.contextLabel,
        tpOnboardingState.selectedYear,
        null,
        null,
      )
      return
    }

    if (currentStep !== 'tp') {
      return
    }

    commitTpSelection(
      tpOnboardingState.program,
      tpOnboardingState.contextLabel,
      tpOnboardingState.selectedYear,
      tpOnboardingState.selectedTd,
      null,
    )
  }

  async function handleLogin(event) {
    event.preventDefault()

    setSessionState((current) => ({
      ...current,
      checking: true,
      error: '',
    }))
    setDebugState((current) => ({
      ...current,
      loading: true,
      label: 'Connexion',
      error: '',
    }))

    try {
      const result = await loginToEnt(credentials)
      const isDemo = result?.sessionMode === DEMO_SESSION_MODE
      track('login_result', { result: 'success', demo: isDemo })
      flushAnalytics()
      // Offer the accepted login to the browser's password manager (Chrome's
      // Credential Management API; others rely on the form submission).
      if (!isDemo) {
        storeBrowserPasswordCredential(credentials)
      }
      setCredentials((current) => ({
        ...current,
        password: '',
      }))
      commitDebugState('Connexion', result)
      await refreshSession()
    } catch (error) {
      const message = getFrenchAuthErrorMessage(error, 'login')
      clearLegacySensitiveClientCaches()
      setSessionState({
        checking: false,
        authenticated: false,
        user: null,
        givenName: null,
        account: null,
        degraded: false,
        degradedReason: null,
        sessionSource: null,
        canUseServerLaunch: false,
        warning: '',
        error: message,
      })
      track('login_result', { result: 'failure', demo: false })
      flushAnalytics()
      commitDebugState('Connexion', null, message)
    }
  }

  async function handleDemoLogin() {
    setCredentials({
      username: DEMO_CREDENTIALS.username,
      password: DEMO_CREDENTIALS.password,
    })

    setSessionState((current) => ({
      ...current,
      checking: true,
      error: '',
    }))
    setDebugState((current) => ({
      ...current,
      loading: true,
      label: 'Connexion demo',
      error: '',
    }))

    try {
      const result = await loginToEnt(DEMO_CREDENTIALS)
      track('login_result', { result: 'success', demo: true })
      flushAnalytics()
      setCredentials((current) => ({
        ...current,
        password: '',
      }))
      commitDebugState('Connexion demo', result)
      await refreshSession()
    } catch (error) {
      const message = getFrenchAuthErrorMessage(error, 'login')
      clearLegacySensitiveClientCaches()
      setSessionState({
        checking: false,
        authenticated: false,
        user: null,
        givenName: null,
        account: null,
        degraded: false,
        degradedReason: null,
        sessionSource: null,
        canUseServerLaunch: false,
        warning: '',
        error: message,
      })
      track('login_result', { result: 'failure', demo: true })
      flushAnalytics()
      commitDebugState('Connexion demo', null, message)
    }
  }

  async function handleLogout() {
    setSessionState((current) => ({
      ...current,
      checking: true,
      error: '',
    }))
    setDebugState((current) => ({
      ...current,
      loading: true,
      label: 'Deconnexion',
      error: '',
    }))

    try {
      const result = await logoutFromEnt()
      clearLegacySensitiveClientCaches()
      setSessionState({
        checking: false,
        authenticated: false,
        user: null,
        givenName: null,
        account: null,
        degraded: false,
        degradedReason: null,
        sessionSource: null,
        canUseServerLaunch: false,
        warning: '',
        error: '',
      })
      commitDebugState('Deconnexion', result)
    } catch (error) {
      const message = getErrorMessage(error)
      setSessionState((current) => ({
        ...current,
        checking: false,
        error: message,
      }))
      commitDebugState('Deconnexion', null, message)
    }
  }

  function handleCustomRequest(event) {
    event.preventDefault()

    const path = requestPath.trim()
    if (!path) {
      return
    }

    void runDebugAction(`GET ${path}`, () => requestEnt(path))
  }

  function handleHeaderAction() {
    if (sessionState.checking) {
      return
    }

    if (sessionState.authenticated) {
      void handleLogout()
      return
    }

    setDebugOpen(true)
  }

  const handleDebugRestartOnboarding = useCallback(() => {
    if (!sessionState.authenticated || !sessionState.user) {
      return
    }

    clearStoredTpSelection()
    clearAdeTimetableCache()
    setSelectedTp(null)
    setHasHydratedProfile(false)
    setTpTransitionDirection('initial')
    setCompletionScreenState({
      visible: false,
      leaving: false,
      userName: '',
    })
    setTpOnboardingState(createEmptyTpOnboardingState())
    setProfileReloadNonce((current) => current + 1)
    setDebugOpen(false)
  }, [sessionState.authenticated, sessionState.user])

  const handleDebugFullReset = useCallback(async () => {
    setDebugState((current) => ({
      ...current,
      loading: true,
      label: 'Reset complet',
      error: '',
    }))

    try {
      if (sessionState.authenticated) {
        try {
          await logoutFromEnt()
        } catch {
          // Continue with the client reset even if server logout fails.
        }
      }

      await clearClientRuntimeState()
      window.location.reload()
    } catch (error) {
      const message = getErrorMessage(error)
      commitDebugState('Reset complet', null, message)
    }
  }, [commitDebugState, sessionState.authenticated])

  const handleDebugProfilePhoto = useCallback(async () => {
    setDebugOutputTab('api')
    setDebugImagePreview(null)
    setDebugState((current) => ({
      ...current,
      loading: true,
      label: 'Photo profil',
      error: '',
    }))

    try {
      let profilePictureInfo = null

      try {
        profilePictureInfo = await getStudentProfilePictureMeta()
      } catch (profilePhotoError) {
        profilePictureInfo = {
          available: false,
          source: 'profile-photo',
          error: getErrorMessage(profilePhotoError),
        }
      }

      const profilePreviewUrl = profilePictureInfo?.available && profilePictureInfo?.previewUrl
        ? `${profilePictureInfo.previewUrl}${profilePictureInfo.previewUrl.includes('?') ? '&' : '?'}ts=${Date.now()}`
        : null

      if (profilePreviewUrl) {
        setDebugImagePreview({
          src: profilePreviewUrl,
          fieldPath: 'student-pic',
          kind: profilePictureInfo.source ?? 'profile-photo',
        })

        commitDebugState('Photo profil', profilePictureInfo)
        return
      }

      const accountResponse = await getAccountInfo()
      const accountPayload = accountResponse?.account ?? null
      const photoCandidate = findProfilePhotoCandidate(accountPayload)

      setDebugImagePreview(photoCandidate ? {
        src: photoCandidate.src,
        fieldPath: photoCandidate.fieldPath,
        kind: photoCandidate.kind,
      } : null)

      commitDebugState('Photo profil', {
        profilePicture: profilePictureInfo,
        authenticated: accountResponse?.authenticated ?? false,
        photo: photoCandidate ? {
          available: true,
          fieldPath: photoCandidate.fieldPath,
          sourceKind: photoCandidate.kind,
          previewUrl: photoCandidate.src,
        } : {
          available: false,
          reason: "Aucun champ d'image courant n'a été trouvé dans les données du compte.",
        },
        account: accountPayload,
      })
    } catch (error) {
      setDebugImagePreview(null)
      commitDebugState('Photo profil', null, getErrorMessage(error))
    }
  }, [commitDebugState])

  const sessionLabel = sessionState.checking
    ? 'Vérification de session...'
    : sessionState.authenticated
      ? sessionState.user
        ? `Connecté : ${sessionState.user}`
        : 'Connecté'
      : 'Déconnecté'

  const output = prettyPrint(
    debugState.payload
      ?? buildDebugSnapshot('Debug', { message: 'Aucune sortie disponible.' }),
  )
  const localStorageOutput = prettyPrint(buildLocalStorageDebugSnapshot(sessionState.user))
  const debugPanelTitle = debugOutputTab === 'storage' ? 'Stockage local' : (debugState.label || 'Sortie JSON')
  const debugPanelDescription = debugOutputTab === 'storage'
    ? 'Clés locales liées au compte, aux réglages et aux caches de l’app.'
    : 'Sortie JSON brute des appels locaux et proxifiés.'
  const debugPanelOutput = debugOutputTab === 'storage' ? localStorageOutput : output
  const resolvedDebugImagePreview = resolveDebugImagePreviewFromSnapshot(debugState.payload) ?? debugImagePreview
  const handleCopyDebugOutput = useCallback(async () => {
    if (!debugPanelOutput) {
      return
    }

    try {
      await copyTextToClipboard(debugPanelOutput)
      setDebugCopyState('copied')
    } catch {
      setDebugCopyState('error')
    }

    if (debugCopyTimeoutRef.current !== null) {
      window.clearTimeout(debugCopyTimeoutRef.current)
    }

    debugCopyTimeoutRef.current = window.setTimeout(() => {
      setDebugCopyState('idle')
      debugCopyTimeoutRef.current = null
    }, 1600)
  }, [debugPanelOutput])
  const shouldHoldInitialRender = !hasCheckedInitialSession && sessionState.checking
  const isProfileSwitching = sessionState.authenticated && profileUser !== sessionState.user
  const shouldShowTpSetup = sessionState.authenticated && !selectedTp
  const shouldShowCompletionScreen = sessionState.authenticated && completionScreenState.visible && Boolean(selectedTp)
  const currentTpOnboardingStep = getCurrentTpOnboardingStep(tpOnboardingState)
  const currentTpStepOptions = getCurrentTpStepOptions(tpOnboardingState)
  const currentDetectedSelection = getDetectedSelectionForStep(tpOnboardingState, currentTpOnboardingStep)
  const selectedAdeResourceId = selectedTp?.resourceId ?? undefined
  const accountDisplayInfo = getAccountDisplayInfo(
    sessionState.account,
    sessionState.user,
    sessionState.givenName,
  )
  const isDashboardShellVisible = sessionState.authenticated && !shouldHoldInitialRender && !isProfileSwitching
    && !shouldShowTpSetup && !shouldShowCompletionScreen

  // /notes or /absences for someone without ScoDoc pages (feature off,
  // establishment without grades): show the dashboard and drop the dead URL.
  useEffect(() => {
    const unavailable = ((route === 'grades' || route === 'absences') && !gradesPageAvailable)
      || (route === 'planning' && !planningPageAvailable)
      || (route === 'mail' && !mailPageAvailable)
    if (isDashboardShellVisible && unavailable) {
      navigateTo('dashboard', { replace: true })
    }
  }, [gradesPageAvailable, isDashboardShellVisible, mailPageAvailable, planningPageAvailable, route])

  const scodocPageRef = useRef(null)
  const dashboardPageRef = useRef(null)
  const previousRouteRef = useRef(activeRoute)

  // Each page starts at the top and slides in from the side it comes from,
  // in sidebar order: from the right going down the list, from the left
  // going back up.
  useEffect(() => {
    const previousRoute = previousRouteRef.current
    if (previousRoute === activeRoute) {
      return
    }

    previousRouteRef.current = activeRoute
    scrollAppToTop()

    const page = activeRoute === 'dashboard' ? dashboardPageRef.current : scodocPageRef.current
    if (!page?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const offset = PAGE_ORDER.indexOf(activeRoute) < PAGE_ORDER.indexOf(previousRoute) ? -28 : 28
    const timing = { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    // The page itself only slides: opacity on an ancestor would cut the
    // cards' backdrop blur off from the photo until the end of the fade.
    page.animate([{ transform: `translateX(${offset}px)` }, { transform: 'none' }], timing)
    for (const block of collectFadeBlocks(page)) {
      block.animate([{ opacity: 0 }, { opacity: 1 }], timing)
    }
  }, [activeRoute])

  const simpleLoadingDots = (
    <span className="inline-flex items-center justify-center gap-[6px] text-text-muted" role="status" aria-live="polite" aria-label="Chargement">
      <span className="lent-button-dot h-[5px] w-[5px] rounded-full bg-current" style={{ animationDelay: '0ms' }} />
      <span className="lent-button-dot h-[5px] w-[5px] rounded-full bg-current" style={{ animationDelay: '140ms' }} />
      <span className="lent-button-dot h-[5px] w-[5px] rounded-full bg-current" style={{ animationDelay: '280ms' }} />
    </span>
  )

  return (
    <main className="relative min-h-screen flex flex-col bg-bg overflow-x-hidden">
      {shouldHoldInitialRender ? (
        <div className="flex-1 min-h-0 bg-bg" aria-hidden="true" />
      ) : isProfileSwitching ? (
        <div className="flex-1 min-h-0 bg-bg flex items-center justify-center p-8">
          {simpleLoadingDots}
        </div>
      ) : shouldShowTpSetup && isHydratingProfile && tpOnboardingState.yearOptions.length === 0 ? (
        <div className="flex-1 min-h-0 bg-bg flex items-center justify-center p-8">
          {simpleLoadingDots}
        </div>
      ) : shouldShowTpSetup ? (
        <OnboardingPage
          userName={sessionState.givenName ?? sessionState.user}
          contextLabel={tpOnboardingState.contextLabel}
          currentStep={currentTpOnboardingStep}
          stepOptions={currentTpStepOptions}
          selectedYear={tpOnboardingState.selectedYear}
          selectedTd={tpOnboardingState.selectedTd}
          detectedResourceId={currentDetectedSelection?.resourceId ?? null}
          errorMessage={tpOnboardingState.errorMessage}
          isLoading={isHydratingProfile || tpOnboardingState.loadingStep !== null}
          loadingMessage={tpOnboardingState.loadingMessage}
          onRetry={handleOnboardingRetry}
          onBack={handleOnboardingBack}
          onIgnore={handleOnboardingIgnore}
          onSelect={handleOnboardingSelect}
          transitionDirection={tpTransitionDirection}
        />
      ) : shouldShowCompletionScreen ? (
        <OnboardingCompletionPage userName={completionScreenState.userName} isLeaving={completionScreenState.leaving} />
      ) : sessionState.authenticated ? (
        <div key={`dashboard-${dashboardRevealNonce}`} className={`${dashboardRevealNonce > 0 ? 'dashboard-reveal-shell ' : ''}${showWallpaper ? '' : 'dashboard-no-wallpaper '}flex flex-col min-h-screen 4xl:h-screen 4xl:min-h-0 4xl:overflow-hidden`}>
          <Sidebar
            authenticated={sessionState.authenticated}
            checking={sessionState.checking}
            userName={[
              sessionState.account?.given_name,
              sessionState.account?.family_name,
            ].filter(Boolean).join(' ') || sessionState.account?.name || sessionState.givenName || sessionState.user}
            userSubtitle={selectedTp?.label ?? selectedTp?.tpLabel ?? selectedTp?.tdLabel ?? selectedTp?.yearLabel ?? null}
            profilePhotoSrc={accountModalPhoto}
            onLogout={handleHeaderAction}
            onAccountClick={handleOpenAccountModal}
            favoritesSlotRef={setFavoritesSlotEl}
            hasPendingUpdate={hasPendingUpdate}
            onUpdateClick={handleApplyUpdate}
            showChangelogPill={showChangelogPill}
            establishment={establishment}
          />
          <div ref={dashboardColumnRef} data-app-scroll-root className={`relative isolate flex flex-col flex-1 min-w-0 4xl:h-screen 4xl:overflow-y-auto 4xl:pl-[calc(var(--sidebar-width,280px)+12px)] ${hasMobileTabBar ? 'max-4xl:pb-[calc(env(safe-area-inset-bottom)+84px)]' : ''}`}>
            {/* Hero image behind the header and widget cards, fading into the solid background. */}
            {showWallpaper ? (
              <div
                aria-hidden="true"
                // Behind the ScoDoc pages the photo runs past the title down to the
                // first cards, as it does behind the dashboard widgets.
                className={`dashboard-hero pointer-events-none absolute inset-x-0 top-0 -z-10 bg-cover bg-[center_40%] transition-[height] duration-500 ease-out dark:opacity-60 ${
                  activeRoute === 'dashboard' ? 'h-[230px] max-md:h-[260px]' : 'h-[420px] max-md:h-[440px]'
                }`}
                style={{
                  // The measured height follows the widget row, hidden on other pages.
                  ...(heroHeight && activeRoute === 'dashboard' ? { height: heroHeight } : null),
                  backgroundImage: `url("${heroImage.src}")`,
                  ...(heroImage.position ? { backgroundPosition: heroImage.position } : null),
                }}
              />
            ) : null}
            <div className="4xl:hidden">
              <AppHeader
                authenticated={sessionState.authenticated}
                checking={sessionState.checking}
                onPrimaryAction={handleHeaderAction}
                onAccountAction={handleOpenAccountModal}
              />
            </div>
            {hasPendingUpdate ? (
              <div className="4xl:hidden px-6 pt-3 max-md:px-3">
                <UpdateNotice onUpdateClick={handleApplyUpdate} />
              </div>
            ) : null}
            {showChangelogPill ? (
              // Right under the header buttons, eating into the space above
              // the cards rather than pushing them down a full row.
              <ChangelogPill className="4xl:hidden flex justify-end px-6 pt-2 -mb-2 max-md:px-3 max-md:pt-1.5" />
            ) : null}
            {sessionState.warning ? (
              <div className="px-6 pt-3 max-md:px-3 4xl:pt-5">
                <div className="flex items-start gap-3 rounded-[20px] border border-[#f2cf8f] bg-[#fff7e8] px-4 py-3 text-text shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-[#6a4d15] dark:bg-[#2f2410]">
                  <Icon icon="carbon:warning-filled" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#b76e00]" aria-hidden="true" />
                  <p className="m-0 text-sm font-medium leading-[1.5] font-body">{sessionState.warning}</p>
                </div>
              </div>
            ) : null}
            {activeRoute === 'dashboard' ? null : (
              <div key={activeRoute} ref={scodocPageRef} className="flex-1 min-h-0 4xl:flex-none 4xl:min-h-0">
                <PageErrorBoundary>
                  {activeRoute === 'grades' ? <GradesPage storageScope={sessionState.user} /> : null}
                  {activeRoute === 'absences' ? <AbsencesPage /> : null}
                  {activeRoute === 'planning' ? (
                    <PlanningPage selection={selectedTp} sessionUser={sessionState.user} onOpenAccount={handleOpenAccountModal} />
                  ) : null}
                  {activeRoute === 'mail' ? (
                    <MailPage />
                  ) : null}
                  {activeRoute === 'moodle' ? (
                    <MoodlePage />
                  ) : null}
                </PageErrorBoundary>
              </div>
            )}
            {/* Kept mounted on other pages: coming back is instant and the
                widgets don't refetch or report a second dashboard view. */}
            <div ref={dashboardPageRef} className="flex-1 min-h-0 4xl:flex-none 4xl:min-h-0" hidden={activeRoute !== 'dashboard'}>
              <WidgetContainer
                userName={sessionState.givenName ?? sessionState.user}
                isSessionReady={!sessionState.checking}
                establishment={establishment}
                sessionUser={sessionState.user}
                selectedPlanningSelection={selectedTp}
                nextClassLookaheadDays={appliedLookaheadDays}
                debugNextClass={debugNextClass}
                canUseServerLaunch={sessionState.canUseServerLaunch}
                favoritesPortalTarget={isSidebarViewport ? favoritesSlotEl : null}
                hiddenWidgets={hiddenWidgets}
                onDismissGreeting={() => handleWidgetVisibilityChange('greeting', false)}
                showAppDescriptions={showAppDescriptions}
              />
            </div>
            <div className="4xl:mt-auto">
              <AppFooter heroCredit={showWallpaper ? heroImage.credit : null} />
            </div>
          </div>
          <MobileTabBar establishment={establishment} />
        </div>
      ) : (
        <LoginPage
          credentials={credentials}
          checking={sessionState.checking}
          errorMessage={sessionState.error}
          onCredentialsChange={(field, value) => setCredentials((current) => ({ ...current, [field]: value }))}
          onDemoLogin={() => void handleDemoLogin()}
          onSubmit={handleLogin}
        />
      )}
      <AccountModal
        open={isAccountModalOpen}
        onClose={handleCloseAccountModal}
        onManageAccount={sessionState.user === DEMO_CREDENTIALS.username || !manageAccountUrl ? null : handleManageAccount}
        onYearChange={handleAccountModalYearChange}
        onTdChange={handleAccountModalTdChange}
        onTpChange={handleAccountModalTpChange}
        displayInfo={accountDisplayInfo}
        profilePhotoSrc={accountModalPhoto}
        planningState={accountModalPlanningState}
        planningFieldLabels={universityConfig.planning?.selectionLabels}
        lookaheadDays={nextClassLookaheadDays}
        lookaheadOptions={ADE_LOOKAHEAD_DAY_OPTIONS}
        onLookaheadChange={handleNextClassLookaheadChange}
        widgetToggles={widgetToggles}
        onWidgetVisibilityChange={handleWidgetVisibilityChange}
        backgroundPreviewSrc={heroImage.src}
        showWallpaper={showWallpaper}
        onShowWallpaperChange={handleShowWallpaperChange}
        theme={theme}
        onThemeChange={handleThemeChange}
        hasCustomBackground={Boolean(customBackground)}
        onCustomBackgroundChange={handleCustomBackgroundChange}
        onCustomBackgroundReset={handleCustomBackgroundReset}
        showAppDescriptions={showAppDescriptions}
        onShowAppDescriptionsChange={handleShowAppDescriptionsChange}
        anonymousAnalytics={anonymousAnalytics}
        onAnonymousAnalyticsChange={isAnalyticsAvailable ? handleAnonymousAnalyticsChange : null}
        establishment={establishment}
        onEstablishmentChange={handleEstablishmentChange}
      />
      <WelcomeFromLent
        visible={welcomeFromLentOpen}
        importedKeys={settingsTransfer.importedKeys}
        signedIn={sessionState.authenticated}
        onInstall={showInstallPrompt}
        onDismiss={() => setWelcomeFromLentOpen(false)}
      />
      <PwaInstallPrompt
        forceShow={forceInstallPrompt || forceIosPrompt}
        forceIos={forceIosPrompt}
        autoOpen={!settingsTransfer.arrived}
        onVisibleChange={setIsInstallPromptVisible}
      />
      <GuidedTour
        enabled={sessionState.authenticated && !shouldShowCompletionScreen}
        blocked={welcomeFromLentOpen || isInstallPromptVisible || isAccountModalOpen || hasPendingUpdate}
      />
      <ChangelogSheet />
      <PwaUpdateManager
        forceOpen={forceUpdatePrompt}
        onForceOpenChange={setForceUpdatePrompt}
        onUpdateAvailable={() => setHasPendingUpdate(true)}
        onApplyHandlerChange={(fn) => { applyUpdateRef.current = fn }}
      />

      {DEBUG_MENU_ENABLED && debugOpen ? (
        <aside className="fixed top-4 right-4 bottom-4 w-[min(720px,calc(100vw-2rem))] flex flex-col gap-3 p-4 bg-context-bg text-text border border-border rounded-[20px] shadow-[0_24px_80px_var(--color-shadow)] backdrop-blur-[10px] overflow-y-auto overflow-x-hidden overscroll-contain z-30 max-lg:top-3 max-lg:right-3 max-lg:left-3 max-lg:bottom-3 max-lg:w-auto" role="dialog" aria-modal="false" aria-label="Menu debug">
          <header className="flex gap-4 justify-between items-center max-lg:flex-col max-lg:items-stretch">
            <div>
              <p className="m-0 mb-1 text-xs font-bold tracking-[0.08em] uppercase text-text-muted font-body">Mode debug</p>
              <h1 className="m-0 text-xl font-bold">ENT minimal</h1>
              <p className="m-0 text-[0.9rem] text-text-muted font-body">Cmd/Ctrl + Shift + D pour afficher ou masquer.</p>
            </div>
            <button
              type="button"
              className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
              onClick={() => setDebugOpen(false)}
            >
              Fermer
            </button>
          </header>

          <section className="grid gap-3 p-4 border border-border rounded-2xl bg-bg-surface">
            <div className="flex gap-3 justify-between items-center max-lg:flex-col max-lg:items-stretch">
              <div className="min-w-0">
                <p className="m-0 text-[0.85rem] font-semibold text-text-secondary font-body">Photo du bandeau</p>
                <p className="m-0 text-[0.9rem] text-text-muted font-body">
                  {customBackground
                    ? 'Fond personnalisé actif : la rotation est ignorée.'
                    : heroImageCount > 1
                      ? `${listHeroImages(establishment).findIndex((image) => image.src === heroImage.src) + 1} / ${heroImageCount}${heroImage.credit?.author ? ` · ${heroImage.credit.author}` : ''}`
                      : heroImageCount === 1 ? 'Une seule photo configurée.' : 'Aucune photo : image générique.'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45"
                  onClick={() => setHeroOffset((current) => current - 1)}
                  disabled={Boolean(customBackground) || heroImageCount < 2}
                >
                  Précédente
                </button>
                <button
                  type="button"
                  className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45"
                  onClick={() => setHeroOffset((current) => current + 1)}
                  disabled={Boolean(customBackground) || heroImageCount < 2}
                >
                  Suivante
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 p-4 border border-border rounded-2xl bg-bg-surface">
            <div className="flex gap-3 justify-between items-center max-lg:flex-col max-lg:items-stretch">
              <span className={`inline-flex items-center min-h-8 py-[0.35rem] px-3 rounded-full text-[0.92rem] font-semibold ${sessionState.authenticated ? 'bg-success-bg text-success-text' : 'bg-bg-subtle text-text-secondary'}`}>
                {sessionLabel}
              </span>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                onClick={() => void refreshSession({ exposeOutput: true })}
                disabled={sessionState.checking}
              >
                Session
              </button>
            </div>

            {!sessionState.authenticated ? (
              <form className="grid gap-3" onSubmit={handleLogin}>
                <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
                  <label className="grid gap-[0.35rem] min-w-0">
                    <span className="text-[0.85rem] font-semibold text-text-secondary font-body">Identifiant</span>
                    <input
                      ref={usernameInputRef}
                      autoComplete="username"
                      type="text"
                      className="w-full min-w-0 py-3 px-[0.85rem] border border-border rounded-[12px] bg-bg text-text"
                      value={credentials.username}
                      onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                    />
                  </label>

                  <label className="grid gap-[0.35rem] min-w-0">
                    <span className="text-[0.85rem] font-semibold text-text-secondary font-body">Mot de passe</span>
                    <input
                      autoComplete="current-password"
                      type="password"
                      className="w-full min-w-0 py-3 px-[0.85rem] border border-border rounded-[12px] bg-bg text-text"
                      value={credentials.password}
                      onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="flex gap-3 flex-wrap max-lg:flex-col max-lg:items-stretch">
                  <LentButton type="submit" loading={sessionState.checking}>
                    Se connecter
                  </LentButton>
                </div>
              </form>
            ) : (
              <div className="flex gap-3 justify-between items-center max-lg:flex-col max-lg:items-stretch">
                <p className="m-0 text-[0.9rem] text-text-muted font-body">Session active pour {sessionState.user ?? 'un utilisateur connecte'}.</p>
                <button
                  type="button"
                  className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                  onClick={() => void handleLogout()}
                  disabled={sessionState.checking}
                >
                  Se deconnecter
                </button>
              </div>
            )}

            {sessionState.error ? <p className="m-0 text-error font-body">{sessionState.error}</p> : null}
          </section>

          <section className="grid gap-3 p-4 border border-border rounded-2xl bg-bg-surface">
            <div className="flex gap-3 flex-wrap max-lg:flex-col max-lg:items-stretch">
                <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1]"
                onClick={showInstallPrompt}
              >
                PWA Prompt
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1]"
                onClick={() => { setForceIosPrompt(true); setTimeout(() => setForceIosPrompt(false), 100) }}
              >
                PWA Prompt iOS
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1]"
                onClick={() => setForceUpdatePrompt(true)}
              >
                PWA Update Prompt
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1]"
                onClick={() => setWelcomeFromLentOpen(true)}
              >
                Arrivée depuis l'ent
              </button>
              <button
                type="button"
                className={`appearance-none border border-border rounded-[12px] text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] ${hasPendingUpdate ? 'bg-brand text-bg' : 'bg-bg'}`}
                onClick={() => setHasPendingUpdate((current) => !current)}
              >
                Sidebar update {hasPendingUpdate ? '✓' : ''}
              </button>
              <button
                type="button"
                className={`appearance-none border border-border rounded-[12px] text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] ${debugNextClass ? 'bg-brand text-bg' : 'bg-bg'}`}
                onClick={() => setDebugNextClass((c) => !c)}
              >
                Prochain cours {debugNextClass ? '✓' : ''}
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={handleDebugRestartOnboarding}
                disabled={!sessionState.authenticated || sessionState.checking}
              >
                Refaire onboarding
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-[#5b1f1f] text-white py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                onClick={() => void handleDebugFullReset()}
                disabled={debugState.loading || sessionState.checking}
              >
                Reset complet
              </button>
              <button
                type="button"
                className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                onClick={() => void handleDebugProfilePhoto()}
                disabled={debugState.loading || !sessionState.authenticated}
              >
                Photo profil
              </button>
            {['Account', 'Layout', 'Planning', 'Marketplace', 'Grades', 'Latest Grade', 'Average Grade'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                  onClick={() => void runDebugAction(label, () => {
                    const actions = { Account: getAccountInfo, Layout: getLayout, Planning: getPlanning, Marketplace: getMarketplaceEntries, Grades: getGrades, 'Latest Grade': getLatestGrade, 'Average Grade': getAverageGrade }
                    return actions[label]()
                  })}
                  disabled={debugState.loading}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-1">
              <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] uppercase text-text-muted font-body">ADE Schedule API</p>
              <div className="flex gap-3 flex-wrap max-lg:flex-col max-lg:items-stretch">
                {['ADE Status', 'ADE Calendar', 'ADE Tree', 'ADE Timetable', 'ADE Upcoming', 'ADE Alerts'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.7rem] px-[0.9rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-wait"
                    onClick={() => void runDebugAction(label, () => {
                      const actions = {
                        'ADE Status': () => getAdeStatus(),
                        'ADE Calendar': () => getAdeCalendarMetadata({ resourceId: selectedAdeResourceId }),
                        'ADE Tree': () => getAdeTree(),
                        'ADE Timetable': () => getAdeTimetable({ force: true, resourceId: selectedAdeResourceId }),
                        'ADE Upcoming': () => getAdeUpcoming({
                          date: new Date().toISOString().slice(0, 10),
                          lookaheadDays: nextClassLookaheadDays,
                          selection: selectedTp,
                        }),
                        'ADE Alerts': () => getAdeAlerts(),
                      }
                      return actions[label]()
                    })}
                    disabled={debugState.loading}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form className="flex gap-3 items-end mt-3 max-lg:flex-col max-lg:items-stretch" onSubmit={(event) => { event.preventDefault(); void runDebugAction(`ADE Search: ${adeSearchQuery}`, () => searchAde(adeSearchQuery)) }}>
                <label className="grid gap-[0.35rem] min-w-0 flex-1">
                  <span className="text-[0.85rem] font-semibold text-text-secondary font-body">ADE Search</span>
                  <input
                    type="text"
                    className="w-full min-w-0 py-3 px-[0.85rem] border border-border rounded-[12px] bg-bg text-text"
                    value={adeSearchQuery}
                    onChange={(event) => setAdeSearchQuery(event.target.value)}
                    placeholder="Cours, prof, groupe..."
                  />
                </label>
                <LentButton type="submit" className="shrink-0" disabled={debugState.loading || !adeSearchQuery.trim()}>
                  Search
                </LentButton>
              </form>
            </div>

            <form className="flex gap-3 items-end max-lg:flex-col max-lg:items-stretch" onSubmit={handleCustomRequest}>
              <label className="grid gap-[0.35rem] min-w-0 flex-1">
                <span className="text-[0.85rem] font-semibold text-text-secondary font-body">Endpoint ENT</span>
                <input
                  type="text"
                  className="w-full min-w-0 py-3 px-[0.85rem] border border-border rounded-[12px] bg-bg text-text"
                  value={requestPath}
                  onChange={(event) => setRequestPath(event.target.value)}
                  placeholder="/api/v4-3/dlm/layout.json"
                />
              </label>
              <LentButton type="submit" className="shrink-0" disabled={debugState.loading || !requestPath.trim()}>
                GET
              </LentButton>
            </form>
          </section>

          <section className="flex-1 min-h-[320px] grid gap-3 p-4 border border-border rounded-2xl bg-bg-surface grid-rows-[auto_auto_minmax(0,1fr)] shrink-0">
            <div className="flex gap-3 justify-between items-center max-lg:flex-col max-lg:items-stretch">
              <div>
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-bg p-1 mb-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[0.82rem] font-semibold transition-colors ${debugOutputTab === 'api' ? 'bg-text text-bg' : 'bg-transparent text-text-muted hover:text-text'}`}
                    onClick={() => setDebugOutputTab('api')}
                  >
                    Appels
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[0.82rem] font-semibold transition-colors ${debugOutputTab === 'storage' ? 'bg-text text-bg' : 'bg-transparent text-text-muted hover:text-text'}`}
                    onClick={() => setDebugOutputTab('storage')}
                  >
                    Stockage local
                  </button>
                </div>
                <strong>{debugPanelTitle}</strong>
                <p className="m-0 text-[0.9rem] text-text-muted font-body">{debugPanelDescription}</p>
              </div>
              <div className="flex items-center gap-2 max-lg:w-full max-lg:justify-between">
                {debugOutputTab === 'api' && debugState.loading ? <span className="m-0 text-[0.9rem] text-text-muted font-body">Chargement...</span> : null}
                <button
                  type="button"
                  className="appearance-none border border-border rounded-[12px] bg-bg text-text py-[0.65rem] px-[0.85rem] font-inherit font-semibold leading-[1.1] disabled:opacity-45 disabled:cursor-not-allowed"
                  onClick={() => void handleCopyDebugOutput()}
                  disabled={!debugPanelOutput}
                >
                  {debugCopyState === 'copied' ? 'Copié' : debugCopyState === 'error' ? 'Réessayer' : 'Copier'}
                </button>
              </div>
            </div>

            {debugOutputTab === 'api' && debugState.error ? <p className="m-0 text-error font-body">{debugState.error}</p> : null}
            {debugOutputTab === 'api' && resolvedDebugImagePreview ? (
              <div className="rounded-[14px] border border-border bg-bg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <img
                    src={resolvedDebugImagePreview.src}
                    alt="Photo de profil"
                    className="h-20 w-20 rounded-full object-cover border border-border bg-bg-subtle"
                  />
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-text">Photo détectée</p>
                    <p className="m-0 mt-1 text-[0.82rem] text-text-muted font-body break-all">
                      {resolvedDebugImagePreview.fieldPath}
                    </p>
                    <p className="m-0 mt-1 text-[0.82rem] text-text-muted font-body">
                      Source: {resolvedDebugImagePreview.kind}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <pre className="m-0 min-h-0 h-full overflow-auto p-4 rounded-[14px] border border-border bg-bg text-text text-[0.85rem] leading-[1.45] whitespace-pre-wrap break-words">{debugPanelOutput}</pre>
          </section>
        </aside>
      ) : null}
    </main>
  )
}

export default App
