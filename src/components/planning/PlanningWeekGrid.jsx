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
  groupByDay,
} from '../../planningUtils'

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i)

export default function PlanningWeekGrid({
  events = [],
  teacherEvents = [],
  selectedTeacher = null,
  commonSlots = [],
  monday,
  now = new Date(),
  onSelectSlot,
  onEventClick,
}) {
  const todayStr = formatDateOnly(now)
  const isCurrentWeek = formatDateOnly(monday) === formatDateOnly(new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)))

  // Compare layout mode: 'split' (side-by-side) | 'student' | 'teacher'
  const [compareDisplay, setCompareDisplay] = useState('split')

  // Check if Saturday has any classes
  const hasWeekend = useMemo(() => {
    return [...events, ...teacherEvents].some((ev) => {
      const d = new Date(ev.start).getDay()
      return d === 6 || d === 0
    })
  }, [events, teacherEvents])

  const days = useMemo(() => groupByDay(events, monday, hasWeekend), [events, monday, hasWeekend])
  const teacherDays = useMemo(() => groupByDay(teacherEvents, monday, hasWeekend), [teacherEvents, monday, hasWeekend])

  const currentTimeTop = useMemo(() => getCurrentTimePosition(now), [now])

  const isSplit = selectedTeacher && compareDisplay === 'split'
  const showStudent = !selectedTeacher || compareDisplay !== 'teacher'
  const showTeacher = selectedTeacher && compareDisplay !== 'student'

  return (
    <div className="flex flex-col gap-2">
      {/* Compare display mode toggle if teacher is selected */}
      {selectedTeacher && (
        <div className="flex items-center justify-between gap-2 px-1 text-[13px]">
          <span className="font-body text-text-secondary">
            Affichage de la comparaison :
          </span>
          <div className="flex items-center gap-1 rounded-full border border-border bg-widget-bg p-0.5 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setCompareDisplay('split')}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                compareDisplay === 'split'
                  ? 'bg-brand text-bg shadow-2xs'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Côte à côte (Moi & Prof)
            </button>
            <button
              type="button"
              onClick={() => setCompareDisplay('student')}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                compareDisplay === 'student'
                  ? 'bg-brand text-bg shadow-2xs'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Mon planning seul
            </button>
            <button
              type="button"
              onClick={() => setCompareDisplay('teacher')}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                compareDisplay === 'teacher'
                  ? 'bg-brand text-bg shadow-2xs'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Planning {selectedTeacher.name} seul
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Container */}
      <div className="w-full overflow-x-auto rounded-[22px] border border-border bg-widget-bg p-3 shadow-xs [scrollbar-width:thin] max-md:p-2 max-md:max-h-none md:max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain">
        <div className={`${isSplit ? 'min-w-[980px]' : 'min-w-[720px]'} select-none`}>
          {/* Header row with day columns */}
          <div className="sticky top-0 z-20 grid grid-cols-[56px_repeat(auto-fit,minmax(0,1fr))] border-b border-border pb-3 bg-widget-bg/95 backdrop-blur-md pt-1">
            <div className="flex items-center justify-center text-[12px] font-semibold text-text-muted">
              <Icon icon="carbon:time" className="size-4" />
            </div>

            {days.map((day) => {
              const isToday = formatDateOnly(day.date) === todayStr
              return (
                <div
                  key={day.date.toDateString()}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-center transition-colors ${
                    isToday ? 'rounded-xl bg-brand/10 font-bold text-brand' : 'text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-body text-[12px] uppercase tracking-wider">
                      {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </span>
                    <span className={`flex size-6 items-center justify-center rounded-full font-body text-[13px] ${
                      isToday ? 'bg-brand text-bg font-bold shadow-xs' : 'font-semibold text-text'
                    }`}>
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Sub-column labels when in side-by-side mode */}
                  {isSplit && (
                    <div className="grid w-full grid-cols-2 gap-1 border-t border-border/40 pt-1 text-[10px] font-bold">
                      <span className="truncate rounded bg-brand/10 px-1 text-brand">
                        Mon groupe
                      </span>
                      <span className="truncate rounded bg-indigo-500/15 px-1 text-indigo-700 dark:text-indigo-300">
                        {selectedTeacher.name}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grid body */}
          <div className="relative grid grid-cols-[56px_repeat(auto-fit,minmax(0,1fr))] pt-2">
            {/* Time markers column */}
            <div className="relative" style={{ height: `${(HOURS.length - 1) * 64}px` }}>
              {HOURS.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute right-3 -translate-y-1/2 font-body text-[12px] font-medium tabular-nums text-text-muted"
                  style={{ top: `${(index / (HOURS.length - 1)) * 100}%` }}
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => {
              const isToday = formatDateOnly(day.date) === todayStr
              const teacherDayEvents = teacherDays[dayIndex]?.events || []
              const daySlotMatches = commonSlots.filter((s) => s.date === formatDateOnly(day.date))

              // Layout calculations: NO OVERLAPPING TEXT!
              // In split mode:
              // Student events get left: 0% to 49%
              // Teacher events get left: 51% to 100%
              // In single mode: events use full 100% width
              const studentBaseLeft = isSplit ? 0 : 0
              const studentBaseWidth = isSplit ? 49 : 100

              const teacherBaseLeft = isSplit ? 51 : 0
              const teacherBaseWidth = isSplit ? 49 : 100

              const studentLayouts = showStudent
                ? computeEventLayout(day.events, DAY_START_HOUR, DAY_END_HOUR, studentBaseLeft, studentBaseWidth)
                : []

              const teacherLayouts = showTeacher
                ? computeEventLayout(teacherDayEvents, DAY_START_HOUR, DAY_END_HOUR, teacherBaseLeft, teacherBaseWidth)
                : []

              return (
                <div
                  key={day.date.toDateString()}
                  className="relative border-l border-border/40 transition-colors"
                  style={{ height: `${(HOURS.length - 1) * 64}px` }}
                >
                  {/* Horizontal hour lines */}
                  {HOURS.map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-t border-border/30 pointer-events-none"
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

                  {/* Current time red line if today */}
                  {isCurrentWeek && isToday && currentTimeTop != null && (
                    <div
                      className="absolute inset-x-0 z-30 flex items-center pointer-events-none"
                      style={{ top: currentTimeTop }}
                    >
                      <div className="size-2 -ml-1 rounded-full bg-red-500 shadow-xs" />
                      <div className="h-[2px] flex-1 bg-red-500/80 shadow-xs" />
                    </div>
                  )}

                  {/* Common free slots highlight */}
                  {selectedTeacher && daySlotMatches.map((slot) => {
                    const pos = getGridPosition(slot.startMs, slot.endMs)
                    return (
                      <button
                        key={`${slot.startMs}-${slot.endMs}`}
                        type="button"
                        onClick={() => onSelectSlot && onSelectSlot(slot)}
                        className="group absolute inset-x-1 z-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/60 bg-emerald-500/10 p-1 text-center text-emerald-700 transition-all hover:bg-emerald-500/25 dark:text-emerald-300"
                        style={{ top: pos.top, height: pos.height }}
                        title={`Créneau libre commun : ${slot.startTime} – ${slot.endTime} (${Math.round(slot.durationMinutes / 60)}h)\nClique pour préparer un déplacement de cours`}
                      >
                        <span className="flex items-center gap-1 font-body text-[11px] font-bold">
                          <Icon icon="carbon:checkmark-filled" className="size-3 text-emerald-500" />
                          Créneau libre ({slot.startTime}–{slot.endTime})
                        </span>
                      </button>
                    )
                  })}

                  {/* Teacher's courses (completely separated in their own sub-column) */}
                  {teacherLayouts.map(({ event: tEvent, pos }) => (
                    <CourseCard
                      key={`teacher-${tEvent.uid || tEvent.start}-${tEvent.title}-${pos.left}`}
                      event={tEvent}
                      now={now}
                      variant="compact"
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

                  {/* Student's courses (in their own sub-column, NO overlap!) */}
                  {studentLayouts.map(({ event, pos }) => (
                    <CourseCard
                      key={`${event.uid || event.start}-${event.title}-${pos.left}`}
                      event={event}
                      now={now}
                      variant="compact"
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
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
