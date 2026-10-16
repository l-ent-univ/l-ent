import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getGrades,
  getGradesDepartmentMessage,
  getSemesterGrades,
  peekGrades,
  peekSemesterGrades,
  prefetchSemesterGrades,
} from './entApi'
import { getReleveDepartment, htmlToPlainText, listGradesSemesters } from './gradesReport'
import { describeLoadError } from './scodocPageUtils'

// The semester picked on one ScoDoc page stays picked on the other.
let sharedSelectedSemesterId = null
// Department notices, fetched once per tab.
const departmentMessages = new Map()

// Everything the ScoDoc pages load: the first-connection answer (newest
// semester), the other semesters on demand and in the background, the
// department notice. Starts from the cached answer when there is one and
// refreshes it behind the scenes (`refreshing`).
export function useScodocReleve() {
  const [base, setBase] = useState(() => {
    const cached = peekGrades()
    return cached
      ? { status: 'ok', payload: cached.grades, error: null, fromCache: true }
      : { status: 'loading', payload: null, error: null, fromCache: false }
  })
  const [reloadNonce, setReloadNonce] = useState(0)
  const [selectedId, setSelectedId] = useState(() => sharedSelectedSemesterId)
  const [semesterPayloads, setSemesterPayloads] = useState({})
  const [departmentMessage, setDepartmentMessage] = useState(null)

  useEffect(() => {
    let cancelled = false

    getGrades({ force: reloadNonce > 0 })
      .then((data) => {
        if (cancelled) return
        if (!data?.authenticated || data.error || !data.grades) {
          // A cached copy beats an error screen while ScoDoc hiccups.
          setBase((current) => (current.status === 'ok'
            ? { ...current, fromCache: false }
            : { status: 'error', payload: null, error: describeLoadError(data, null), fromCache: false }))
          return
        }
        setBase({ status: 'ok', payload: data.grades, error: null, fromCache: false })
      })
      .catch((error) => {
        if (cancelled) return
        setBase((current) => (current.status === 'ok'
          ? { ...current, fromCache: false }
          : { status: 'error', payload: null, error: describeLoadError(null, error), fromCache: false }))
      })

    return () => { cancelled = true }
  }, [reloadNonce])

  const basePayload = base.payload
  const semesters = useMemo(() => listGradesSemesters(basePayload?.semestres), [basePayload])
  // The first-connection answer already holds the newest semester's relevé.
  const newestId = semesters[0]?.id ?? 'current'
  const activeId = selectedId && semesters.some((semester) => semester.id === selectedId) ? selectedId : newestId
  const cachedSemester = activeId === newestId ? null : peekSemesterGrades(activeId)
  const entry = activeId === newestId && basePayload
    ? { status: 'ok', payload: basePayload }
    : semesterPayloads[activeId] ?? (cachedSemester ? { status: 'ok', payload: cachedSemester.grades } : { status: 'loading' })

  // The other semesters load in the background once the page has settled, so
  // switching to them is instant.
  useEffect(() => {
    if (!basePayload || semesters.length < 2) {
      return undefined
    }

    const otherIds = semesters.slice(1).map((semester) => semester.id)
    const start = () => { void prefetchSemesterGrades(otherIds) }
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(start, { timeout: 2000 })
      return () => window.cancelIdleCallback(idleId)
    }
    const timeoutId = window.setTimeout(start, 800)
    return () => window.clearTimeout(timeoutId)
  }, [basePayload, semesters])

  useEffect(() => {
    if (!basePayload || activeId === newestId || semesterPayloads[activeId] || cachedSemester) {
      return
    }

    setSemesterPayloads((current) => ({ ...current, [activeId]: { status: 'loading' } }))
    getSemesterGrades(activeId)
      .then((data) => {
        const ok = data?.authenticated && data.grades && !data.error
        setSemesterPayloads((current) => ({
          ...current,
          [activeId]: ok ? { status: 'ok', payload: data.grades } : { status: 'error', error: describeLoadError(data, null) },
        }))
      })
      .catch((error) => {
        setSemesterPayloads((current) => ({ ...current, [activeId]: { status: 'error', error: describeLoadError(null, error) } }))
      })
  }, [activeId, basePayload, cachedSemester, newestId, semesterPayloads])

  const config = entry.payload?.config ?? basePayload?.config ?? null
  const releve = entry.payload?.['relevé'] ?? null
  const department = releve ? getReleveDepartment(releve) : null

  useEffect(() => {
    if (!department) {
      return undefined
    }

    if (departmentMessages.has(department)) {
      setDepartmentMessage(departmentMessages.get(department))
      return undefined
    }

    let cancelled = false
    departmentMessages.set(department, null)
    getGradesDepartmentMessage(department)
      .then((data) => {
        const text = htmlToPlainText(data?.message) || null
        departmentMessages.set(department, text)
        if (!cancelled) setDepartmentMessage(text)
      })
      .catch(() => departmentMessages.delete(department))
    return () => { cancelled = true }
  }, [department])

  const selectSemester = useCallback((id) => {
    sharedSelectedSemesterId = id
    setSelectedId(id)
  }, [])

  const retry = useCallback(() => {
    if (base.status === 'error') {
      setBase({ status: 'loading', payload: null, error: null, fromCache: false })
      setReloadNonce((current) => current + 1)
      return
    }

    setSemesterPayloads((current) => {
      const next = { ...current }
      delete next[activeId]
      return next
    })
  }, [activeId, base.status])

  return {
    base,
    refreshing: base.status === 'ok' && base.fromCache,
    semesters,
    activeId,
    activeSemester: semesters.find((semester) => semester.id === activeId) ?? null,
    selectSemester,
    entry,
    releve,
    config,
    department,
    departmentMessage,
    retry,
  }
}
