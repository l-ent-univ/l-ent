import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import test from 'node:test'
import { createAnalytics, createDailyHasher, readAnalyticsConfig } from '../server/analytics.js'
import { ANALYTICS_MAX_EVENTS_PER_BATCH, sanitizeAnalyticsBatch, sanitizeAnalyticsEvent } from '../server/analyticsSchema.js'

const DAY_1 = Date.parse('2026-10-08T10:00:00Z')
const DAY_1_LATE = Date.parse('2026-10-08T23:59:59Z')
const DAY_2 = Date.parse('2026-10-09T00:00:01Z')

function createFakeClient() {
  const captured = []
  return {
    captured,
    capture: (message) => captured.push(message),
    on: () => {},
    shutdown: async () => {},
  }
}

test('daily hash is stable within a UTC day and changes the next day', () => {
  let now = DAY_1
  let saltCount = 0
  const hasher = createDailyHasher({
    now: () => now,
    generateSalt: () => Buffer.from(`salt-${++saltCount}`),
  })

  const morning = hasher('session-a')
  now = DAY_1_LATE
  assert.equal(hasher('session-a'), morning)
  assert.notEqual(hasher('session-b'), morning)
  assert.equal(saltCount, 1)

  now = DAY_2
  const nextDay = hasher('session-a')
  assert.notEqual(nextDay, morning)
  assert.equal(saltCount, 2)

  assert.match(morning, /^[0-9a-f]{32}$/)
  assert.ok(!morning.includes('session-a'))
})

test('daily hash uses a random salt by default (not reproducible across instances)', () => {
  const now = () => DAY_1
  assert.notEqual(createDailyHasher({ now })('session-a'), createDailyHasher({ now })('session-a'))
})

test('allowlist drops unknown events, unknown properties and free text', () => {
  assert.equal(sanitizeAnalyticsEvent({ event: '$pageview', properties: {} }, { hasSession: true }), null)
  assert.equal(sanitizeAnalyticsEvent({ event: 'constructor' }, { hasSession: true }), null)

  const event = sanitizeAnalyticsEvent({
    event: 'widget_loaded',
    properties: {
      widget: 'mail',
      status: 'ok',
      duration_bucket: '<1s',
      error_kind: 'network',
      subject: 'Convocation examen',
      email: 'demo@l-ent.app',
      device: 'desktop',
      browser: 'Mozilla/5.0',
      lang: 'fr-FR',
      establishment: 'Camille Martin',
      university: 'evil',
      demo: true,
      $ip: '1.2.3.4',
    },
  }, { hasSession: true })

  assert.deepEqual(event, {
    event: 'widget_loaded',
    properties: { device: 'desktop', widget: 'mail', status: 'ok', duration_bucket: '<1s' },
  })
})

test('required and cross-property rules', () => {
  const opts = { hasSession: true }
  assert.equal(sanitizeAnalyticsEvent({ event: 'widget_loaded', properties: { widget: 'mail' } }, opts), null)
  assert.equal(sanitizeAnalyticsEvent({ event: 'app_opened', properties: { app: 'Moodle UR', source: 'grid' } }, opts), null)
  assert.deepEqual(
    sanitizeAnalyticsEvent({ event: 'app_opened', properties: { app: 'moodle-ur', source: 'grid' } }, opts)?.properties,
    { app: 'moodle-ur', source: 'grid' },
  )
  assert.equal(sanitizeAnalyticsEvent({ event: 'setting_changed', properties: { setting: 'analytics', value: 'off' } }, opts), null)
  assert.equal(sanitizeAnalyticsEvent({ event: 'setting_changed', properties: { setting: 'widget_visibility', value: 'off' } }, opts), null)
  assert.deepEqual(
    sanitizeAnalyticsEvent({ event: 'setting_changed', properties: { setting: 'app_descriptions', value: 'on', widget: 'mail' } }, opts)?.properties,
    { setting: 'app_descriptions', value: 'on' },
  )
  assert.deepEqual(
    sanitizeAnalyticsEvent({ event: 'widget_loaded', properties: { widget: 'mail', status: 'error', error_kind: 'http_5xx' } }, opts)?.properties,
    { widget: 'mail', status: 'error', error_kind: 'http_5xx' },
  )
})

test('events without a session are limited to the anonymous-safe ones', () => {
  assert.equal(sanitizeAnalyticsEvent({ event: 'dashboard_viewed' }, { hasSession: false }), null)
  assert.ok(sanitizeAnalyticsEvent({ event: 'login_result', properties: { result: 'failure' } }, { hasSession: false }))
})

test('batch parsing accepts sendBeacon text bodies and caps the batch size', () => {
  const events = Array.from({ length: 50 }, () => ({ event: 'dashboard_viewed' }))
  assert.equal(sanitizeAnalyticsBatch(JSON.stringify({ events }), { hasSession: true }).length, ANALYTICS_MAX_EVENTS_PER_BATCH)
  assert.deepEqual(sanitizeAnalyticsBatch('not json', { hasSession: true }), [])
  assert.deepEqual(sanitizeAnalyticsBatch({ events: 'nope' }, { hasSession: true }), [])
})

test('disabled without a project key', () => {
  assert.deepEqual(readAnalyticsConfig({}), { projectKey: null, host: 'https://eu.i.posthog.com' })
  const analytics = createAnalytics({ projectKey: null })
  assert.equal(analytics.enabled, false)
  assert.equal(analytics.ingest({ events: [{ event: 'dashboard_viewed' }] }, { id: 's' }), 0)
})

test('ingest hashes the session id and sets privacy flags', () => {
  const client = createFakeClient()
  const analytics = createAnalytics({
    projectKey: 'test',
    universityId: 'univ-rennes',
    client,
    hasher: createDailyHasher({ now: () => DAY_1, generateSalt: () => Buffer.from('fixed') }),
  })

  analytics.ingest(JSON.stringify({ events: [{ event: 'dashboard_viewed', properties: { device: 'mobile' } }] }), { id: 'session-123', demo: true })
  analytics.ingest({ events: [{ event: 'login_result', properties: { result: 'failure', demo: false } }] }, null)

  assert.equal(client.captured.length, 2)
  const [withSession, withoutSession] = client.captured
  assert.match(withSession.distinctId, /^[0-9a-f]{32}$/)
  assert.notEqual(withSession.distinctId, 'session-123')
  assert.equal(withSession.disableGeoip, true)
  assert.deepEqual(withSession.properties, {
    device: 'mobile',
    demo: true,
    university: 'univ-rennes',
    $process_person_profile: false,
  })
  assert.match(withoutSession.distinctId, /^[0-9a-f-]{36}$/)
  assert.equal(withoutSession.properties.demo, false)
})
