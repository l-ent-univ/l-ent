import { useCallback, useEffect, useState } from 'react'

const SEEN_THIS_SESSION_KEY = 'l-ent:tafac-move-seen'

function hasSeenThisSession() {
  try {
    return sessionStorage.getItem(SEEN_THIS_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markSeenThisSession() {
  try {
    sessionStorage.setItem(SEEN_THIS_SESSION_KEY, '1')
  } catch {
    // Storage unavailable: the sheet opens again on next load
  }
}

// Open state of the Tafac move sheet (components/TafacMoveNotice.jsx). It
// opens by itself once per browser session, and again from the login pill or
// the dashboard notice.
export function useTafacMoveNotice() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hasSeenThisSession()) return undefined
    const timer = setTimeout(() => {
      markSeenThisSession()
      setOpen(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return {
    open,
    onOpen: useCallback(() => setOpen(true), []),
    onClose: useCallback(() => setOpen(false), []),
  }
}
