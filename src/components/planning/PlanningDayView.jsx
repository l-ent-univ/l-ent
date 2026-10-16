import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import CourseCard from './CourseCard'
import { getClassHue } from '../../upcomingClasses'
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  computeEventLayout,
  formatDateOnly,
  formatTime,
  getCurrentTimePosition,
  getGridPosition,
} from '../../planningUtils'
import { CARD_CLASSES } from '../../scodocPageUtils'

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i)

export default function PlanningDayView({
  events = [],
  teacherEvents = [],
  selectedTeacher = null,
  commonSlots = [],
  currentDate,
  monday,
  onSelectDate,
  onSelectSlot,
  onEventClick,
  now = new Date(),
}) {
  const currentDateStr = formatDateOnly(currentDate)
  const todayStr = formatDateOnly(now)
  const isToday = currentDateStr === todayStr

  // Compare layout mode: 'split' | 'student' | 'teacher'
  const [compareDisplay, setCompareDisplay] = useState('split')

  // Days of current week (Monday to Friday, or Saturday if events exist)
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [monday])

  // Events filtered for the active date
  const dayEvents = useMemo(() => {
    return events
      .filter((ev) => ev?.start && formatDateOnly(new Date(ev.start)) === currentDateStr)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [events, currentDateStr])

  const teacherDayEvents = useMemo(() => {
    return teacherEvents
      .filter((ev) => ev?.start && formatDateOnly(new Date(ev.start)) === currentDateStr)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [teacherEvents, currentDateStr])

  const dayCommonSlots = useMemo(() => {
    return commonSlots.filter((slot) => slot.date === currentDateStr)
  }, [commonSlots, currentDateStr])

  const currentTimeTop = useMemo(() => {
    if (!isToday) return null
    return getCurrentTimePosition(now)
  }, [isToday, now])

  const isSplit = selectedTeacher && compareDisplay === 'split'
  const showStudent = !selectedTeacher || compareDisplay !== 'teacher'
  const showTeacher = selectedTeacher && compareDisplay !== 'student'

  const studentLayouts = showStudent
    ? computeEventLayout(dayEvents, DAY_START_HOUR, DAY_END_HOUR, isSplit ? 0 : 0, isSplit ? 49 : 100)
    : []

  const teacherLayouts = showTeacher
    ? computeEventLayout(teacherDayEvents, DAY_START_HOUR, DAY_END_HOUR, isSplit ? 51 : 0, isSplit ? 49 : 100)
    : []

  return (
    <div className="flex flex-col gap-4">
      {/* Day selector tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-[20px] border border-border bg-widget-bg p-1.5 [scrollbar-width:none]">
        {weekDays.map((day) => {
          const dayStr = formatDateOnly(day)
          const isSelected = dayStr === currentDateStr
          const dayIsToday = dayStr === todayStr
          const count = events.filter((ev) => ev?.start && formatDateOnly(new Date(ev.start)) === dayStr).length

          return (
            <button
              key={day.toDateString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`flex flex-1 min-w-[70px] flex-col items-center justify-center gap-0.5 rounded-2xl py-2 px-1 transition-all ${
                isSelected
                  ? 'bg-brand text-bg shadow-sm font-semibold'
                  : 'text-text-secondary hover:bg-bg-subtle hover:text-text'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider opacity-85">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </span>
              <span className="flex items-center gap-1 font-body text-[15px] font-bold">
                {day.getDate()}
                {dayIsToday && (
                  <span className={`size-1.5 rounded-full ${isSelected ? 'bg-bg' : 'bg-brand'}`} />
                )}
              </span>
              <span className="text-[10px] font-medium opacity-75">
                {count > 0 ? `${count} cours` : 'Libre'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Common slots notification if comparing with a teacher */}
      {selectedTeacher && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-indigo-950 dark:text-indigo-100 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              <Icon icon="carbon:collaborate" className="size-4" />
            </div>
            <div>
              <p className="m-0 font-body text-[13px] font-semibold">
                Comparaison avec {selectedTeacher.name}
              </p>
              <p className="m-0 font-body text-[12px] opacity-80">
                {dayCommonSlots.length > 0
                  ? `${dayCommonSlots.length} créneau(x) libre(s) en commun aujourd'hui`
                  : 'Aucun créneau libre en commun identifié sur cette journée'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border bg-widget-bg p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setCompareDisplay('split')}
                className={`rounded-full px-2 py-0.5 ${compareDisplay === 'split' ? 'bg-brand text-bg' : 'text-text-secondary'}`}
              >
                Côte à côte
              </button>
              <button
                type="button"
                onClick={() => setCompareDisplay('student')}
                className={`rounded-full px-2 py-0.5 ${compareDisplay === 'student' ? 'bg-brand text-bg' : 'text-text-secondary'}`}
              >
                Moi seul
              </button>
              <button
                type="button"
                onClick={() => setCompareDisplay('teacher')}
                className={`rounded-full px-2 py-0.5 ${compareDisplay === 'teacher' ? 'bg-brand text-bg' : 'text-text-secondary'}`}
              >
                Prof seul
              </button>
            </div>

            {dayCommonSlots.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectSlot && onSelectSlot(dayCommonSlots[0])}
                className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-xs transition-transform hover:scale-105"
              >
                Créneaux libres ({dayCommonSlots.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main timeline schedule */}
      <div className={`${CARD_CLASSES} relative max-md:max-h-none md:max-h-[calc(100dvh-220px)] overflow-y-auto overflow-x-hidden p-4 [scrollbar-width:thin] overscroll-contain`}>
        {/* Header if split mode */}
        {isSplit && (
          <div className="sticky top-0 z-20 grid grid-cols-[56px_1fr] gap-3 pb-3 border-b border-border mb-2 text-[12px] font-bold bg-widget-bg/95 backdrop-blur-md pt-1">
            <span />
            <div className="grid grid-cols-2 gap-3 text-center">
              <span className="rounded-lg bg-brand/10 py-1 text-brand">Mon groupe</span>
              <span className="rounded-lg bg-indigo-500/15 py-1 text-indigo-700 dark:text-indigo-300">
                {selectedTeacher.name}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[56px_1fr] gap-3">
          {/* Time markers column */}
          <div className="relative select-none" style={{ height: `${(HOURS.length - 1) * 80}px` }}>
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 font-body text-[12px] font-semibold tabular-nums text-text-muted"
                style={{ top: `${(index / (HOURS.length - 1)) * 100}%` }}
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Timeline canvas */}
          <div className="relative" style={{ height: `${(HOURS.length - 1) * 80}px` }}>
            {/* Horizontal hour lines */}
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
                style={{ top: `${(index / (HOURS.length - 1)) * 100}%` }}
              />
            ))}

            {/* Vertical separator in split mode */}
            {isSplit && (
              <div
                className="absolute inset-y-0 border-r border-dashed border-border/60 pointer-events-none"
                style={{ left: '50%' }}
              />
            )}

            {/* Current time indicator */}
            {currentTimeTop != null && (
              <div
                className="absolute inset-x-0 z-30 flex items-center pointer-events-none"
                style={{ top: currentTimeTop }}
              >
                <div className="size-2.5 -ml-1.5 rounded-full bg-red-500 shadow-md ring-2 ring-white" />
                <div className="h-[2px] flex-1 bg-red-500 shadow-xs" />
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                  Maintenant
                </span>
              </div>
            )}

            {/* Common free slots highlight */}
            {selectedTeacher && dayCommonSlots.map((slot) => {
              const pos = getGridPosition(slot.startMs, slot.endMs)
              return (
                <button
                  key={`day-slot-${slot.startMs}`}
                  type="button"
                  onClick={() => onSelectSlot && onSelectSlot(slot)}
                  className="group absolute inset-x-2 z-10 flex items-center justify-between rounded-2xl border border-dashed border-emerald-500/70 bg-emerald-500/10 px-4 text-emerald-700 transition-all hover:bg-emerald-500/20 dark:text-emerald-300"
                  style={{ top: pos.top, height: pos.height }}
                  title="Clique pour générer le message de déplacement"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="carbon:checkmark-filled" className="size-4 text-emerald-500" />
                    <span className="font-body text-[13px] font-bold">
                      Créneau libre commun : {slot.startTime} – {slot.endTime} ({Math.round(slot.durationMinutes / 60)}h)
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Proposer ce créneau
                  </span>
                </button>
              )
            })}

            {/* Teacher's courses (in dedicated right sub-column) */}
            {teacherLayouts.map(({ event: tEvent, pos }) => (
              <CourseCard
                key={`teacher-day-${tEvent.uid || tEvent.start}-${pos.left}`}
                event={tEvent}
                now={now}
                isTeacher
                topLabel={`Prof. ${selectedTeacher.name}`}
                onClick={() => onEventClick && onEventClick(tEvent)}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  height: pos.height,
                  left: typeof pos.left === 'string' && pos.left.endsWith('%') ? pos.left : `${pos.left}%`,
                  width: typeof pos.width === 'string' && pos.width.endsWith('%') ? pos.width : `${pos.width}%`,
                }}
              />
            ))}

            {/* Student courses (in left sub-column or full width) */}
            {studentLayouts.map(({ event, pos }) => (
              <CourseCard
                key={`${event.uid || event.start}-${event.title}-${pos.left}`}
                event={event}
                now={now}
                onClick={() => onEventClick && onEventClick(event)}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  height: pos.height,
                  left: typeof pos.left === 'string' && pos.left.endsWith('%') ? pos.left : `${pos.left}%`,
                  width: typeof pos.width === 'string' && pos.width.endsWith('%') ? pos.width : `${pos.width}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
