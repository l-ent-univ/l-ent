import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getClassHue } from '../../upcomingClasses'
import { capitalize, formatDateOnly, formatTime } from '../../planningUtils'
import { CARD_CLASSES, SECONDARY_BUTTON } from '../../scodocPageUtils'

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function PlanningMonthView({
  events = [],
  currentMonth,
  onSelectMonth,
  onSelectDate,
  now = new Date(),
}) {
  const todayStr = formatDateOnly(now)

  // Compute first day of month and days grid
  const { days, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Monday-based day of week for the 1st: 0=Mon, ..., 6=Sun
    const startOffset = (firstDay.getDay() + 6) % 7

    const grid = []

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      grid.push({
        date: prevDate,
        dateStr: formatDateOnly(prevDate),
        isCurrentMonth: false,
        events: [],
      })
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      grid.push({
        date: d,
        dateStr: formatDateOnly(d),
        isCurrentMonth: true,
        events: [],
      })
    }

    // Next month padding to complete 35 or 42 cells (5 or 6 weeks)
    const remainder = (7 - (grid.length % 7)) % 7
    for (let day = 1; day <= remainder; day++) {
      const nextDate = new Date(year, month + 1, day)
      grid.push({
        date: nextDate,
        dateStr: formatDateOnly(nextDate),
        isCurrentMonth: false,
        events: [],
      })
    }

    // Populate events
    for (const ev of events) {
      if (!ev?.start) continue
      const evDateStr = formatDateOnly(new Date(ev.start))
      const match = grid.find((cell) => cell.dateStr === evDateStr)
      if (match) {
        match.events.push(ev)
      }
    }

    // Sort events in each cell
    for (const cell of grid) {
      cell.events.sort((a, b) => a.start.localeCompare(b.start))
    }

    return {
      days: grid,
      monthLabel: capitalize(firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })),
    }
  }, [currentMonth, events])

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-body text-[20px] font-bold text-text">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => {
              const prev = new Date(currentMonth)
              prev.setMonth(prev.getMonth() - 1)
              onSelectMonth(prev)
            }}
            className={SECONDARY_BUTTON}
          >
            <Icon icon="carbon:chevron-left" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectMonth(new Date())}
            className={`${SECONDARY_BUTTON} text-[13px]`}
          >
            Ce mois-ci
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => {
              const next = new Date(currentMonth)
              next.setMonth(next.getMonth() + 1)
              onSelectMonth(next)
            }}
            className={SECONDARY_BUTTON}
          >
            <Icon icon="carbon:chevron-right" className="size-4" />
          </button>
        </div>
      </div>

      {/* Month calendar grid */}
      <div className={`${CARD_CLASSES} relative max-md:max-h-none md:max-h-[calc(100dvh-220px)] overflow-y-auto overflow-x-hidden p-3 max-md:p-2 [scrollbar-width:thin] overscroll-contain`}>
        {/* Day name column headers */}
        <div className="sticky top-0 z-10 -mt-3 -mx-3 max-md:-mt-2 max-md:-mx-2 grid grid-cols-7 border-b border-border/60 px-3 pt-3 pb-2 max-md:px-2 max-md:pt-2 text-center bg-widget-bg/95 backdrop-blur-md rounded-t-[22px] max-md:rounded-t-[20px]">
          {WEEKDAY_NAMES.map((name, index) => (
            <div
              key={name}
              className={`font-body text-[12px] font-bold uppercase tracking-wider ${
                index >= 5 ? 'text-text-muted' : 'text-text-secondary'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 pt-2">
          {days.map((cell) => {
            const isToday = cell.dateStr === todayStr
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6
            const hasCourses = cell.events.length > 0

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate && onSelectDate(cell.date)}
                className={`group flex min-h-[96px] flex-col items-start justify-start rounded-xl p-1.5 text-left transition-all hover:bg-bg-subtle max-md:min-h-[72px] max-md:p-1 ${
                  !cell.isCurrentMonth
                    ? 'opacity-35'
                    : isWeekend
                      ? 'bg-bg-subtle/30'
                      : 'hover:shadow-xs'
                } ${isToday ? 'ring-2 ring-brand ring-offset-1' : ''}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full font-body text-[13px] font-semibold ${
                      isToday
                        ? 'bg-brand text-bg'
                        : cell.isCurrentMonth
                          ? 'text-text'
                          : 'text-text-muted'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {hasCourses && (
                    <span className="text-[10px] font-semibold text-text-muted">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event preview pills */}
                <div className="mt-1 flex w-full flex-col gap-1 overflow-hidden">
                  {cell.events.slice(0, 3).map((event) => {
                    const hue = getClassHue(event.title)
                    const accentColor = `hsl(${hue}, 65%, 48%)`
                    return (
                      <div
                        key={`${event.uid || event.start}-${event.title}`}
                        className="group/pill flex w-full items-center gap-1.5 overflow-hidden rounded-md border border-white/60 dark:border-white/5 bg-white/70 dark:bg-zinc-800/70 px-1.5 py-1 text-[11px] font-semibold leading-tight text-text shadow-2xs backdrop-blur-xs transition-colors hover:bg-white dark:hover:bg-zinc-800"
                        title={`${formatTime(event.start)}${event.end ? ` - ${formatTime(event.end)}` : ''} · ${event.title}${event.location ? ` (${event.location})` : ''}`}
                      >
                        <div
                          className="h-3 w-[3px] shrink-0 rounded-full relative overflow-hidden"
                          style={{ background: accentColor }}
                          aria-hidden="true"
                        >
                          <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 80%)' }}
                          />
                        </div>
                        <span className="truncate font-body">{event.title}</span>
                      </div>
                    )
                  })}
                  {cell.events.length > 3 && (
                    <span className="text-[10px] font-semibold text-text-muted pl-1">
                      +{cell.events.length - 3} autre{cell.events.length - 3 > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
