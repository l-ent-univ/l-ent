import { useSyncExternalStore } from 'react'

// The app's screens behind the sidebar: the dashboard, "Mes notes",
// "Absences" and "Planning".
// No router library: one pathname per route, History API for back/forward.
// The server and the PWA service worker already answer every path with the
// app shell.

const ROUTE_PATHS = {
  dashboard: '/',
  grades: '/notes',
  absences: '/absences',
  planning: '/planning',
  mail: '/mail',
  moodle: '/moodle',
}

const ROUTE_CHANGE_EVENT = 'tafac:route-change'

export function getRouteFromPath(pathname) {
  const path = String(pathname ?? '/').replace(/\/+$/, '') || '/'
  if (path === '/messagerie') return 'mail'
  if (path === '/cours') return 'moodle'
  return Object.keys(ROUTE_PATHS).find((route) => ROUTE_PATHS[route] === path) ?? 'dashboard'
}

function readCurrentRoute() {
  return typeof window === 'undefined' ? 'dashboard' : getRouteFromPath(window.location.pathname)
}

function subscribe(onChange) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(ROUTE_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(ROUTE_CHANGE_EVENT, onChange)
  }
}

export function useAppRoute() {
  return useSyncExternalStore(subscribe, readCurrentRoute, () => 'dashboard')
}

// Below 1024px the page scrolls; above, the dashboard column scrolls itself.
export function scrollAppToTop({ smooth = false } = {}) {
  const behavior = smooth ? 'smooth' : 'instant'
  window.scrollTo({ top: 0, behavior })
  document.querySelector('[data-app-scroll-root]')?.scrollTo({ top: 0, behavior })
}

// `replace`: swap the current history entry (used to drop an unavailable
// /notes without leaving a dead entry behind).
export function navigateTo(route, { replace = false } = {}) {
  const path = ROUTE_PATHS[route] ?? ROUTE_PATHS.dashboard
  if (window.location.pathname === path) {
    return
  }

  const url = `${path}${window.location.search}`
  if (replace) {
    window.history.replaceState(window.history.state, '', url)
  } else {
    window.history.pushState(null, '', url)
  }
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
}
