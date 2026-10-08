// Anonymous audience measurement — client side (see docs/ANALYTICS.md).
//
// The browser never talks to PostHog and loads no analytics library: events
// are batched here and posted to our own server (/__ent_auth/analytics),
// which validates them against server/analyticsSchema.js and forwards them.
// Nothing is sent when the server has analytics disabled or when the user
// switched "Statistiques anonymes" off in Mon compte.
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { ENT_AUTH_PREFIX } from './entApi'
import { getStoredAnonymousAnalytics } from './profileStorage'

const ANALYTICS_ENDPOINT = `${ENT_AUTH_PREFIX}/analytics`
const FLUSH_DELAY_MS = 2000
const MAX_BATCH_SIZE = 20

let serverEnabled = false
let userEnabled = getStoredAnonymousAnalytics()
let establishment = null
let queue = []
let flushTimer = 0
const listeners = new Set()

function isActive() {
  return serverEnabled && userEnabled
}

function dropQueue() {
  queue = []
  window.clearTimeout(flushTimer)
  flushTimer = 0
}

// Server switch, from the `analyticsEnabled` flag of /__ent_auth/session.
export function setAnalyticsAvailable(enabled) {
  const next = Boolean(enabled)
  if (next === serverEnabled) return
  serverEnabled = next
  if (!next) dropQueue()
  listeners.forEach((listener) => listener())
}

// User switch ("Statistiques anonymes"). Turning it off drops anything queued.
export function setAnalyticsUserEnabled(enabled) {
  userEnabled = Boolean(enabled)
  if (!userEnabled) dropQueue()
}

export function setAnalyticsEstablishment(establishmentId) {
  establishment = typeof establishmentId === 'string' && establishmentId ? establishmentId : null
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// True when the server collects anonymous statistics (drives the About copy
// and the Mon compte switch).
export function useAnalyticsAvailable() {
  return useSyncExternalStore(subscribe, () => serverEnabled, () => false)
}

function getDevice() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function getBrowser() {
  const ua = navigator.userAgent || ''
  if (/firefox|fxios/i.test(ua)) return 'firefox'
  if (/chrome|chromium|crios|edg\//i.test(ua)) return 'chromium'
  if (/safari/i.test(ua)) return 'safari'
  return 'other'
}

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  } catch {
    return false
  }
}

// Coarse context only. `university` and `demo` are added by the server.
function getContext() {
  const lang = String(navigator.language || '').slice(0, 2).toLowerCase()

  return {
    device: getDevice(),
    browser: getBrowser(),
    standalone: isStandalone(),
    ...(/^[a-z]{2}$/.test(lang) ? { lang } : null),
    ...(establishment ? { establishment } : null),
  }
}

export function flushAnalytics() {
  window.clearTimeout(flushTimer)
  flushTimer = 0

  if (queue.length === 0) return
  if (!isActive()) {
    dropQueue()
    return
  }

  const context = getContext()
  const events = queue.splice(0, MAX_BATCH_SIZE).map(({ event, properties }) => ({
    event,
    properties: { ...context, ...properties },
  }))
  const body = JSON.stringify({ events })

  try {
    if (navigator.sendBeacon?.(ANALYTICS_ENDPOINT, body)) {
      if (queue.length > 0) flushAnalytics()
      return
    }
  } catch {
    // Fall back to fetch below.
  }

  fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  }).catch(() => {})

  if (queue.length > 0) flushAnalytics()
}

export function track(event, properties = {}) {
  if (!isActive()) return

  queue.push({ event, properties })
  if (queue.length >= MAX_BATCH_SIZE) {
    flushAnalytics()
  } else if (!flushTimer) {
    flushTimer = window.setTimeout(flushAnalytics, FLUSH_DELAY_MS)
  }
}

export function getDurationBucket(durationMs) {
  if (durationMs < 500) return '<500ms'
  if (durationMs < 1000) return '<1s'
  if (durationMs < 3000) return '<3s'
  if (durationMs < 10000) return '<10s'
  return '10s+'
}

// Widgets already reported for the current dashboard view: a widget that
// remounts (e.g. the layout changes when another widget is hidden) is not
// reported twice.
const reportedWidgets = new Set()

// Called once per dashboard mount (WidgetContainer).
export function trackDashboardView({ greetingShown = false } = {}) {
  reportedWidgets.clear()
  track('dashboard_viewed')
  if (greetingShown) {
    // Nothing to load: the greeting card is ready immediately.
    reportedWidgets.add('greeting')
    track('widget_loaded', { widget: 'greeting', status: 'ok', duration_bucket: '<500ms' })
  }
}

// Reports `widget_loaded` once per dashboard view, when `outcome` first
// becomes { status: 'ok' | 'empty' | 'error', errorKind? }. Pass null while
// loading (or when there is nothing to report). Background refreshes are
// never reported.
export function useWidgetLoadReport(widget, outcome) {
  const startedAtRef = useRef(null)
  const status = outcome?.status ?? null
  const errorKind = outcome?.errorKind ?? null

  useEffect(() => {
    if (startedAtRef.current === null) startedAtRef.current = performance.now()
    if (!status || reportedWidgets.has(widget)) return

    reportedWidgets.add(widget)
    track('widget_loaded', {
      widget,
      status,
      duration_bucket: getDurationBucket(performance.now() - startedAtRef.current),
      ...(status === 'error' ? { error_kind: errorKind ?? 'other' } : null),
    })
  }, [widget, status, errorKind])
}

// Application ids (portal fname or local service id) as a short slug.
export function toAppSlug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAnalytics)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAnalytics()
  })
}
