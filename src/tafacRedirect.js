// First import of main.jsx: once a user moved to Tafac, this address only
// redirects there, and the app isn't rendered at all.
import { MOVED_TO_TAFAC_KEY, TAFAC_URL } from './settingsTransfer'

function hasMovedToTafac() {
  try {
    return localStorage.getItem(MOVED_TO_TAFAC_KEY) === '1'
  } catch {
    return false
  }
}

export const movedToTafac = hasMovedToTafac()

if (movedToTafac) window.location.replace(TAFAC_URL)
