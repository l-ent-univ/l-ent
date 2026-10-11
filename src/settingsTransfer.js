// Sends this browser's settings to Tafac. Local storage is separate for every
// address, so we link to `https://tafac.fr/#import=…` with the settings in
// the fragment, which browsers never send to a server. Tafac's
// src/settingsTransfer.js reads it; keep the key list and format in sync.

export const TAFAC_URL = 'https://tafac.fr'

const TRANSFER_PREFIX = '#import='
const MAX_VALUE_LENGTH = 20_000

// Settings only: caches rebuild themselves, the session cookie can't move,
// and the custom background is a whole image, too big for a link.
export const TRANSFERABLE_KEYS = [
  'l-ent:establishment',
  'l-ent:student-tp',
  'l-ent:ade-lookahead-days',
  'l-ent:greeting-hidden',
  'l-ent:hidden-widgets',
  'l-ent:show-app-descriptions',
  'l-ent:anonymous-analytics',
  'l-ent:favorites-order',
  'l-ent:local-pins',
  'l-ent:weather-city',
  'l-ent:grade-colors',
  'l-ent:class-colors',
]

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Link to `targetOrigin` carrying this browser's settings.
export function buildSettingsTransferUrl(targetOrigin = TAFAC_URL, storage = localStorage) {
  const settings = {}
  try {
    for (const key of TRANSFERABLE_KEYS) {
      const value = storage.getItem(key)
      if (typeof value === 'string' && value.length <= MAX_VALUE_LENGTH) settings[key] = value
    }
  } catch {
    // Storage unavailable: send the user over without settings
  }
  return `${targetOrigin.replace(/\/$/, '')}/${TRANSFER_PREFIX}${toBase64Url(JSON.stringify(settings))}`
}
