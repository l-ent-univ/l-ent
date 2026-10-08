// ============================================================================
// Anonymous, server-side-only audience measurement (PostHog, EU).
// See docs/ANALYTICS.md for what is collected and why it is consent-exempt.
//
// - Off unless POSTHOG_PROJECT_KEY is set: nothing is created, queued or sent.
// - The browser never talks to PostHog: it posts allowlisted events to
//   /__ent_auth/analytics and this module forwards them with posthog-node, so
//   PostHog only ever sees the server's IP (and GeoIP is disabled anyway).
// - distinct_id = HMAC-SHA256(daily salt, session id), truncated. The salt is
//   random, lives in memory only and is replaced at each UTC day change, so
//   ids cannot be linked across days nor reversed to a session/user.
// - No person profiles ($process_person_profile: false), no identify().
// ============================================================================
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { PostHog } from 'posthog-node'
import { sanitizeAnalyticsBatch } from './analyticsSchema.js'

export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com'

const DISTINCT_ID_HEX_LENGTH = 32

// Live PostHog clients, flushed by shutdownAllAnalytics() on process exit.
const liveClients = new Set()

export function readAnalyticsConfig(env = process.env) {
  const projectKey = String(env.POSTHOG_PROJECT_KEY ?? '').trim()
  const host = String(env.POSTHOG_HOST ?? '').trim() || DEFAULT_POSTHOG_HOST

  return { projectKey: projectKey || null, host }
}

function utcDay(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

// Daily-rotating anonymous hasher. `now` and `generateSalt` are injectable for
// tests. The previous day's salt is dropped as soon as the day changes.
export function createDailyHasher({ now = Date.now, generateSalt = () => randomBytes(32) } = {}) {
  let current = null

  return function hashForToday(value) {
    const day = utcDay(now())
    if (!current || current.day !== day) {
      current = { day, salt: generateSalt() }
    }

    return createHmac('sha256', current.salt)
      .update(String(value))
      .digest('hex')
      .slice(0, DISTINCT_ID_HEX_LENGTH)
  }
}

const DISABLED_ANALYTICS = Object.freeze({
  enabled: false,
  ingest: () => 0,
  shutdown: async () => {},
})

// universityId: set on every event from the server config (never from the
// client). `client` / `hasher` are injectable for tests.
export function createAnalytics({
  projectKey,
  host = DEFAULT_POSTHOG_HOST,
  universityId = null,
  client = null,
  hasher = createDailyHasher(),
} = {}) {
  if (!projectKey) {
    return DISABLED_ANALYTICS
  }

  const posthog = client ?? new PostHog(projectKey, {
    host,
    flushAt: 20,
    flushInterval: 10000,
    disableGeoip: true,
    // Plain event capture only: no feature flags, no remote config polling.
    disableRemoteFeatureFlags: true,
    featureFlagsPollingInterval: null,
    fetchRetryCount: 1,
    requestTimeout: 5000,
  })
  // Analytics must never break or spam the app: swallow SDK errors.
  posthog.on?.('error', () => {})
  liveClients.add(posthog)

  // session: { id, demo } or null. Returns the number of events queued.
  function ingest(body, session = null) {
    try {
      const hasSession = Boolean(session?.id)
      const events = sanitizeAnalyticsBatch(body, { hasSession })
      if (events.length === 0) return 0

      // Without a session (login page): one random id per request, linkable
      // to nothing. Only events flagged allowWithoutSession get here.
      const distinctId = hasSession ? hasher(session.id) : randomUUID()

      for (const { event, properties } of events) {
        posthog.capture({
          distinctId,
          event,
          disableGeoip: true,
          properties: {
            ...properties,
            ...(hasSession ? { demo: Boolean(session.demo) } : null),
            ...(universityId ? { university: universityId } : null),
            $process_person_profile: false,
          },
        })
      }

      return events.length
    } catch {
      return 0
    }
  }

  async function shutdown() {
    liveClients.delete(posthog)
    try {
      await posthog.shutdown(3000)
    } catch {
      // ignore
    }
  }

  return { enabled: true, ingest, shutdown }
}

export async function shutdownAllAnalytics() {
  await Promise.allSettled([...liveClients].map(async (client) => {
    liveClients.delete(client)
    await client.shutdown(3000)
  }))
}
