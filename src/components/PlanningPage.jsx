import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import universityConfig from '@university'
import { ENT_AUTH_PREFIX, getAdeTeachers } from '../entApi'
import { HELP_TOUR_BUTTON, SECONDARY_BUTTON } from '../scodocPageUtils'
import { APP_NAME } from '../seo'
import { buildResourceIdsFromSelection, fetchUpcomingEvents, formatDateOnly } from '../upcomingClasses'
import { LoadingDots, SegmentedControl, StatusMessage } from './ScodocUi'
import {
  addDays,
  capitalize,
  findCommonFreeSlots,
  formatWeekLabel,
  startOfWeek,
} from '../planningUtils'

import PlanningWeekGrid from './planning/PlanningWeekGrid'
import PlanningDayView from './planning/PlanningDayView'
import PlanningListView from './planning/PlanningListView'
import PlanningMonthView from './planning/PlanningMonthView'
import TeacherCompareModal from './planning/TeacherCompareModal'
import CourseDetailModal from './planning/CourseDetailModal'
import PageGuidedTour from './PageGuidedTour'

const PLANNING_SERVICE_URL = universityConfig.planning?.serviceUrl ?? null
const ADE_HREF = PLANNING_SERVICE_URL
  ? `${ENT_AUTH_PREFIX}/launch?url=${encodeURIComponent(PLANNING_SERVICE_URL)}`
  : null


const PLANNING_TOUR_STEPS = [
  {
    id: 'intro',
    title: 'Bienvenue sur ton planning',
    body: 'Retrouve tous tes cours du BUT, organise ta semaine et vérifie tes salles et horaires en un coup d’œil.',
    icon: 'carbon:calendar',
  },
  {
    id: 'views',
    target: 'planning-views',
    title: '4 vues sur-mesure',
    body: 'Semaine (grille classique), Jour (timeline par heure), Liste (toutes tes cartes) et Mois (vue d’ensemble). Sur mobile, swipe horizontalement pour naviguer entre les jours ou les semaines !',
    icon: 'carbon:grid',
  },
  {
    id: 'nav',
    target: 'planning-nav',
    title: 'Navigation temporelle',
    body: 'Avance ou recule d’une période avec les flèches, et clique sur « Aujourd’hui » pour revenir instantanément au moment présent.',
    icon: 'carbon:time',
  },
  {
    id: 'teacher',
    target: 'planning-teacher',
    title: 'Comparaison avec les professeurs',
    body: 'Recherche un enseignant pour afficher son emploi du temps à côté du tien, repérer automatiquement les créneaux libres en commun et préparer une demande de déplacement de cours.',
    icon: 'carbon:collaborate',
  },
  {
    id: 'content',
    target: 'planning-content',
    title: 'Fiche détaillée de chaque cours',
    body: 'Chaque carte reproduit fidèlement le style Tafac. Clique sur un cours pour ouvrir sa fiche complète (salle, enseignant, promo et durée).',
    icon: 'carbon:information',
  },
]

const VIEW_STORAGE_KEY = 'l-ent:planning-view-mode'

export default function PlanningPage({ selection = null, sessionUser = null, onOpenAccount }) {
  const resourceIds = useMemo(() => buildResourceIdsFromSelection(selection), [selection])
  const scope = `${sessionUser ?? ''}::${resourceIds.join('|')}`

  // View mode: 'week' (grid) | 'day' | 'list' | 'month'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY)
      if (['week', 'day', 'list', 'month'].includes(saved)) return saved
    } catch {}
    return 'week'
  })

  // Date states
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  // Student schedule state
  const [state, setState] = useState({ status: 'loading', events: [], complete: true })
  const [reloadToken, setReloadToken] = useState(0)

  // Teacher comparison state
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [teacherState, setTeacherState] = useState({ status: 'idle', events: [] })
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  // Course detail modal state
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null)
  const [tourTrigger, setTourTrigger] = useState(0)

  // Cache for fetched periods
  const eventsCache = useRef(new Map())
  const mondayKey = formatDateOnly(monday)
  const now = new Date()

  // Save view preference
  const handleChangeView = (newView) => {
    setViewMode(newView)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, newView)
    } catch {}
  }

  // Set document title
  useEffect(() => {
    const previousTitle = document.title
    document.title = `Planning · ${APP_NAME}`
    return () => { document.title = previousTitle }
  }, [])


  // Determine query parameters based on view mode
  const fetchParams = useMemo(() => {
    if (viewMode === 'month') {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const firstOfMonth = new Date(year, month, 1)
      const startDate = formatDateOnly(startOfWeek(firstOfMonth))
      return { startDate, lookaheadDays: 42 }
    }
    return { startDate: mondayKey, lookaheadDays: 7 }
  }, [viewMode, currentMonth, mondayKey])

  // Fetch student timetable
  useEffect(() => {
    if (!resourceIds.length) {
      return undefined
    }

    const cacheKey = `${scope}::${fetchParams.startDate}::${fetchParams.lookaheadDays}d`
    const cached = eventsCache.current.get(cacheKey)
    if (cached) {
      setState({ status: 'ok', ...cached })
      return undefined
    }

    const controller = new AbortController()
    setState((current) => ({ ...current, status: 'loading' }))

    fetchUpcomingEvents({
      selection,
      signal: controller.signal,
      startDate: fetchParams.startDate,
      lookaheadDays: fetchParams.lookaheadDays,
    })
      .then((result) => {
        eventsCache.current.set(cacheKey, result)
        setState({ status: 'ok', ...result })
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setState({ status: 'error', events: [], complete: true })
        }
      })

    return () => controller.abort()
  }, [fetchParams, reloadToken, resourceIds, scope, selection])

  // Fetch teacher timetable when a teacher is selected
  useEffect(() => {
    if (!selectedTeacher) {
      setTeacherState({ status: 'idle', events: [] })
      return undefined
    }

    const teacherResourceId = selectedTeacher.id
    if (!teacherResourceId) {
      setTeacherState({ status: 'ok', events: [] })
      return undefined
    }

    const cacheKey = `teacher::${teacherResourceId}::${fetchParams.startDate}::${fetchParams.lookaheadDays}d`
    const cached = eventsCache.current.get(cacheKey)
    if (cached) {
      setTeacherState({ status: 'ok', events: cached.events || [] })
      return undefined
    }

    const controller = new AbortController()
    setTeacherState({ status: 'loading', events: [] })

    fetchUpcomingEvents({
      selection: { resourceId: teacherResourceId },
      signal: controller.signal,
      startDate: fetchParams.startDate,
      lookaheadDays: fetchParams.lookaheadDays,
    })
      .then((result) => {
        eventsCache.current.set(cacheKey, result)
        setTeacherState({ status: 'ok', events: result.events || [] })
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setTeacherState({ status: 'error', events: [] })
        }
      })

    return () => controller.abort()
  }, [selectedTeacher, fetchParams])

  // Selection handler for teacher (resolves ID if needed)
  const handleSelectTeacher = useCallback(async (teacher) => {
    if (!teacher) {
      setSelectedTeacher(null)
      return
    }

    let resolved = { ...teacher }
    if (!resolved.id && resolved.name) {
      try {
        const res = await getAdeTeachers(resolved.name)
        const match = res?.teachers?.find((t) => t.name.toLowerCase() === resolved.name.toLowerCase())
        if (match?.id) {
          resolved = match
        }
      } catch {}
    }

    setSelectedTeacher(resolved)
  }, [])

  // Retry loading
  const retry = useCallback(() => {
    eventsCache.current.clear()
    setReloadToken((token) => token + 1)
  }, [])

  // Common free slots calculation
  const commonSlots = useMemo(() => {
    if (!selectedTeacher || !teacherState.events.length) return []
    return findCommonFreeSlots({
      studentEvents: state.events,
      teacherEvents: teacherState.events,
      monday,
    })
  }, [selectedTeacher, state.events, teacherState.events, monday])

  // Navigation handlers
  const isCurrentWeek = mondayKey === formatDateOnly(startOfWeek(new Date()))
  const isToday = formatDateOnly(currentDate) === formatDateOnly(new Date())
  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate((curr) => {
        const day = curr.getDay() // 0 = Dimanche, 1 = Lundi, 6 = Samedi
        let step = -1
        if (day === 1) step = -3 // Lundi -> Vendredi
        else if (day === 0) step = -2 // Dimanche -> Vendredi
        else if (day === 6) step = -1 // Samedi -> Vendredi
        const prev = addDays(curr, step)
        setMonday(startOfWeek(prev))
        return prev
      })
    } else if (viewMode === 'month') {
      setCurrentMonth((curr) => new Date(curr.getFullYear(), curr.getMonth() - 1, 1))
    } else {
      setMonday((curr) => {
        const prev = addDays(curr, -7)
        setCurrentDate(prev)
        return prev
      })
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate((curr) => {
        const day = curr.getDay() // 0 = Dimanche, 5 = Vendredi, 6 = Samedi
        let step = 1
        if (day === 5) step = 3 // Vendredi -> Lundi
        else if (day === 6) step = 2 // Samedi -> Lundi
        else if (day === 0) step = 1 // Dimanche -> Lundi
        const next = addDays(curr, step)
        setMonday(startOfWeek(next))
        return next
      })
    } else if (viewMode === 'month') {
      setCurrentMonth((curr) => new Date(curr.getFullYear(), curr.getMonth() + 1, 1))
    } else {
      setMonday((curr) => {
        const next = addDays(curr, 7)
        setCurrentDate(next)
        return next
      })
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setMonday(startOfWeek(today))
    setCurrentMonth(today)
  }

  const isAtCurrentPeriod = viewMode === 'day' ? isToday : viewMode === 'month' ? isCurrentMonth : isCurrentWeek

  const touchStartRef = useRef(null)

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
  }

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || !e.changedTouches || e.changedTouches.length !== 1) return
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const elapsed = Date.now() - touchStartRef.current.time
    touchStartRef.current = null

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && elapsed < 600) {
      if (deltaX < 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCompareModalOpen || selectedEventForDetail) return
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, isCompareModalOpen, selectedEventForDetail])

  // Subtitle label
  const subtitleLabel = useMemo(() => {
    if (viewMode === 'day') {
      return capitalize(currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    if (viewMode === 'month') {
      return capitalize(currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
    }
    return formatWeekLabel(monday)
  }, [viewMode, currentDate, currentMonth, monday])

  const adeButton = ADE_HREF ? (
    <button type="button" onClick={() => window.open(ADE_HREF, '_blank', 'noopener,noreferrer')} className={SECONDARY_BUTTON}>
      ADE
      <Icon icon="carbon:arrow-up-right" className="size-3.5" aria-hidden="true" />
    </button>
  ) : null

  // View switcher options
  const viewOptions = [
    { value: 'week', label: 'Semaine' },
    { value: 'day', label: 'Jour' },
    { value: 'list', label: 'Liste' },
    { value: 'month', label: 'Mois' },
  ]

  let mainBody
  if (!resourceIds.length) {
    mainBody = (
      <StatusMessage
        icon="carbon:user-multiple"
        title="Groupe manquant"
        detail="Choisis ton groupe TD ou TP dans « Mon compte » pour voir ton planning."
        action={onOpenAccount ? (
          <button type="button" onClick={onOpenAccount} className="rounded-full border-0 bg-brand px-4 py-2 font-body text-[14px] font-semibold text-bg hover:bg-brand-hover">
            Ouvrir Mon compte
          </button>
        ) : null}
      />
    )
  } else if (state.status === 'error') {
    mainBody = (
      <StatusMessage
        icon="carbon:cloud-offline"
        title="Planning indisponible"
        detail="ADE ne répond pas pour le moment. Réessaie dans quelques minutes, ou ouvre-le directement."
        action={(
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={retry} className="rounded-full border-0 bg-brand px-4 py-2 font-body text-[14px] font-semibold text-bg hover:bg-brand-hover">
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => setTourTrigger((c) => c + 1)}
              className={HELP_TOUR_BUTTON}
              title="Aide & Visite guidée du planning"
              aria-label="Visite guidée"
            >
              <Icon icon="carbon:help" className="size-5 shrink-0" aria-hidden="true" />
            </button>
            {adeButton}
          </div>
        )}
      />
    )
  } else if (state.status === 'loading' && !state.events.length) {
    mainBody = <LoadingDots label="Chargement de ton planning…" />
  } else if (viewMode === 'week') {
    mainBody = (
      <PlanningWeekGrid
        events={state.events}
        teacherEvents={teacherState.events}
        selectedTeacher={selectedTeacher}
        commonSlots={commonSlots}
        monday={monday}
        now={now}
        onSelectSlot={() => setIsCompareModalOpen(true)}
        onEventClick={(ev) => setSelectedEventForDetail(ev)}
      />
    )
  } else if (viewMode === 'day') {
    mainBody = (
      <PlanningDayView
        events={state.events}
        teacherEvents={teacherState.events}
        selectedTeacher={selectedTeacher}
        commonSlots={commonSlots}
        currentDate={currentDate}
        monday={monday}
        now={now}
        onSelectDate={(d) => {
          setCurrentDate(d)
          setMonday(startOfWeek(d))
        }}
        onSelectSlot={() => setIsCompareModalOpen(true)}
        onEventClick={(ev) => setSelectedEventForDetail(ev)}
      />
    )
  } else if (viewMode === 'month') {
    mainBody = (
      <PlanningMonthView
        events={state.events}
        currentMonth={currentMonth}
        now={now}
        onSelectMonth={setCurrentMonth}
        onSelectDate={(d) => {
          setCurrentDate(d)
          setMonday(startOfWeek(d))
          setViewMode('day')
        }}
      />
    )
  } else {
    mainBody = (
      <PlanningListView
        events={state.events}
        monday={monday}
        now={now}
        onSelectTeacher={(t) => {
          handleSelectTeacher(t)
          setIsCompareModalOpen(true)
        }}
        onEventClick={(ev) => setSelectedEventForDetail(ev)}
      />
    )
  }

  return (
    <section className="grades-page w-full pt-4 px-6 pb-12 4xl:pt-5 max-md:px-3 max-md:pt-3" aria-labelledby="planning-page-title">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 max-md:gap-5">
        {/* Top Header */}
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 id="planning-page-title" className="m-0 text-[36px] font-bold leading-none tracking-[-0.02em] max-md:text-[28px]">
              Planning
            </h1>
            <p className="m-0 font-body text-[15px] font-medium text-text-secondary" aria-live="polite">
              {subtitleLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Segmented Control */}
            <div data-tour="planning-views">
              <SegmentedControl
                label="Vue du planning"
                options={viewOptions}
                value={viewMode}
                onChange={handleChangeView}
              />
            </div>

            {/* Navigation buttons */}
            <div data-tour="planning-nav" className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                aria-label="Période précédente"
                onClick={handlePrev}
                className={SECONDARY_BUTTON}
              >
                <Icon icon="carbon:chevron-left" className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={isAtCurrentPeriod}
                onClick={handleToday}
                className={`${SECONDARY_BUTTON} disabled:opacity-50 text-[13px]`}
              >
                Aujourd’hui
              </button>
              <button
                type="button"
                aria-label="Période suivante"
                onClick={handleNext}
                className={SECONDARY_BUTTON}
              >
                <Icon icon="carbon:chevron-right" className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Compare / Move class button */}
            <button
              data-tour="planning-teacher"
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-body text-[14px] font-semibold transition-all ${
                selectedTeacher
                  ? 'bg-brand text-bg shadow-xs hover:bg-brand-hover'
                  : 'border border-border bg-widget-bg text-text hover:bg-bg-subtle'
              }`}
              title="Comparer avec l'emploi du temps d'un prof pour trouver des créneaux de déplacement"
            >
              <Icon icon="carbon:collaborate" className="size-4" />
              <span>{selectedTeacher ? `Prof : ${selectedTeacher.name}` : 'Déplacer / Profs'}</span>
              {commonSlots.length > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {commonSlots.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTourTrigger((c) => c + 1)}
              className={HELP_TOUR_BUTTON}
              title="Aide & Visite guidée du planning"
              aria-label="Visite guidée"
            >
              <Icon icon="carbon:help" className="size-5 shrink-0" aria-hidden="true" />
            </button>

            {adeButton}
          </div>
        </header>

        {/* Teacher comparison explanation banner if active */}
        {selectedTeacher && (
          <aside className="flex items-center justify-between gap-4 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 flex-wrap shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Icon icon="carbon:collaborate" className="size-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-[13px] font-bold">
                    Comparaison avec {selectedTeacher.name}
                  </span>
                  {commonSlots.length > 0 ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {commonSlots.length} créneau(x) libre(s) commun(s)
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      Aucun créneau évident détecté cette semaine
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-zinc-600 dark:text-zinc-400">
                  Affichage côte à côte : vos cours sont à gauche, ceux de l'enseignant à droite.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="rounded-full bg-indigo-600 dark:bg-indigo-500 px-3.5 py-1.5 font-body text-[12px] font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Créneaux & message →
              </button>
              <button
                type="button"
                onClick={() => handleSelectTeacher(null)}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 font-body text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Icon icon="carbon:close" className="size-3.5" />
                <span>Quitter</span>
              </button>
            </div>
          </aside>
        )}

        {/* View body with swipe navigation */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="w-full touch-pan-y">
          {mainBody}
        </div>
      </div>

      {/* Course detail modal (opened when clicking on a course) */}
      <CourseDetailModal
        event={selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onCompareTeacher={(teacher) => {
          handleSelectTeacher(teacher)
          setIsCompareModalOpen(true)
        }}
      />

      {/* Teacher compare & reschedule modal */}
      <TeacherCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        studentEvents={state.events}
        teacherEvents={teacherState.events}
        selectedTeacher={selectedTeacher}
        onSelectTeacher={handleSelectTeacher}
        monday={monday}
        loadingTeacher={teacherState.status === 'loading'}
        studentSelection={selection}
      />
      <PageGuidedTour
        storageKey="l-ent:tour:planning"
        steps={PLANNING_TOUR_STEPS}
        manualTrigger={tourTrigger}
      />
    </section>
  )
}
