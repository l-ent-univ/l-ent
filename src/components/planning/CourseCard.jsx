import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import { getClassHue } from '../../upcomingClasses'
import { formatTime } from '../../planningUtils'

function getSmartDayLabel(startStr) {
  if (!startStr) return ''
  const start = new Date(startStr)
  const now = new Date()

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const target = new Date(start)
  target.setHours(0, 0, 0, 0)

  if (target.getTime() === today.getTime()) {
    return 'Aujourd’hui'
  }
  if (target.getTime() === tomorrow.getTime()) {
    return 'Demain'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
  }).format(start).replace(/^\w/, (c) => c.toUpperCase())
}

export default function CourseCard({
  event,
  now = new Date(),
  onClick,
  topLabel = null,
  variant = 'full', // 'full' | 'compact' | 'timeline'
  isTeacher = false,
  className = '',
  style = {},
}) {
  if (!event) return null

  const hue = useMemo(() => {
    if (isTeacher) return 260
    return getClassHue(event.title)
  }, [event.title, isTeacher])

  const accentColor = `hsl(${hue}, 60%, 45%)`
  const classGradient = `linear-gradient(180deg, hsla(${hue}, 60%, 72%, 0.22) 0%, transparent 55%)`
  const classGradientDark = `linear-gradient(180deg, hsla(${hue}, 40%, 20%, 0.4) 0%, transparent 55%)`

  const startTime = new Date(event.start)
  const endTime = event.end ? new Date(event.end) : null
  const ongoing = startTime <= now && endTime && endTime > now
  const finished = endTime && endTime <= now

  const durationMinutes = useMemo(() => {
    if (!event.start || !event.end) return 60
    const diff = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000
    return Math.max(15, Math.round(diff))
  }, [event.start, event.end])

  const isShortClass = durationMinutes <= 75

  const displayTime = `${formatTime(event.start)}${event.end ? ` - ${formatTime(event.end)}` : ''}`
  const firstGroup = event.groups?.[0] || ''
  // For short classes in timeline, hide redundant "Aujourd'hui" unless explicitly passed or ongoing
  const resolvedTopLabel = topLabel ?? (ongoing ? 'En cours' : isShortClass ? null : getSmartDayLabel(event.start))

  // Compact variant for week grid columns
  if (variant === 'compact') {
    return (
      <article
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
        className={`course-card-widget widget-card widget-card-visible relative z-10 flex cursor-pointer flex-col justify-between overflow-hidden rounded-[14px] border border-white/60 dark:border-white/10 ${
          isShortClass ? 'p-1.5' : 'p-2'
        } text-text shadow-xs transition-all hover:z-30 hover:scale-[1.01] hover:shadow-md ${
          finished ? 'opacity-70 saturate-60' : ''
        } ${ongoing ? 'ring-2 ring-emerald-500 ring-offset-1' : ''} ${className}`}
        style={{
          '--class-gradient': classGradient,
          '--class-gradient-dark': classGradientDark,
          boxSizing: 'border-box',
          ...style,
        }}
        title={`${event.title}\n${displayTime}\n${event.location || ''}\n${event.teacher || ''}`}
      >
        <div className="flex items-start gap-1.5 min-w-0">
          <div
            className="w-[3.5px] self-stretch rounded-[25px] shrink-0 relative overflow-hidden min-h-[18px]"
            style={{ background: accentColor }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 rounded-[25px]"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 70%)' }}
            />
          </div>

          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <span className={`block min-w-0 font-body ${isShortClass ? 'text-[10px] line-clamp-1' : 'text-[11px] line-clamp-2'} font-bold leading-tight text-text`}>
              {event.title}
            </span>
            {event.location && (
              <span className={`flex items-center gap-0.5 ${isShortClass ? 'text-[9px]' : 'text-[10px]'} text-text-muted leading-none`}>
                <Icon icon="carbon:location" className="size-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>

        <div className={`mt-0.5 flex items-center justify-between gap-1 ${isShortClass ? 'text-[9px]' : 'text-[10px]'} font-semibold pt-0.5`}>
          <div className="flex items-center gap-1 min-w-0 text-text">
            <Icon icon="carbon:time" className="size-2.5 shrink-0" aria-hidden="true" />
            <span className="tabular-nums truncate">{displayTime}</span>
          </div>
          {firstGroup ? (
            <span className="text-[9px] text-text-muted truncate shrink-0 max-w-[35%] text-right font-medium">
              {firstGroup}
            </span>
          ) : isTeacher ? (
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 truncate shrink-0 font-medium">
              Prof
            </span>
          ) : null}
        </div>
      </article>
    )
  }

  // Full / Timeline variant (matches WidgetNextClass exactly)
  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={`course-card-widget widget-card widget-card-visible relative z-0 hover:z-10 shadow-md ${
        isShortClass ? 'p-2.5 rounded-[16px]' : 'p-4 rounded-[22px] max-md:p-3 max-md:rounded-[20px]'
      } border border-white dark:border-[rgba(255,255,255,0.08)] overflow-hidden text-base leading-6 flex flex-col justify-between text-text cursor-pointer transition-all hover:scale-[1.008] ${
        finished ? 'opacity-70 saturate-60' : ''
      } ${ongoing ? 'ring-2 ring-emerald-500/80 ring-offset-2' : ''} ${className}`}
      style={{
        '--class-gradient': classGradient,
        '--class-gradient-dark': classGradientDark,
        boxSizing: 'border-box',
        ...style,
      }}
      aria-label={`${event.title} - ${displayTime} à ${event.location || 'salle non précisée'}`}
    >
      <Icon
        icon="carbon:chevron-right"
        className="grade-corner-arrow absolute top-2.5 right-2.5 w-[14px] h-[14px] text-text opacity-0 transition-opacity duration-150 ease-in-out shrink-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top row with section label & ongoing pill (hidden on short cards unless ongoing/provided) */}
      {(resolvedTopLabel || ongoing) && (
        <div className="flex items-center justify-between gap-2 min-w-0 pr-4">
          {resolvedTopLabel ? (
            <span className="m-0 min-w-0 leading-[1.06] text-[13px] font-medium text-text-muted overflow-hidden text-ellipsis whitespace-nowrap">
              {resolvedTopLabel}
            </span>
          ) : <span />}
          {ongoing && (
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              En cours
            </span>
          )}
        </div>
      )}

      {/* Middle row: vertical accent pill + title & location/teacher */}
      <div className={`flex items-stretch gap-2 min-w-0 flex-1 ${isShortClass ? 'my-0.5' : 'my-2 max-md:my-1.5'}`}>
        <div className="flex self-stretch items-center">
          <div
            className={`${isShortClass ? 'w-[4px] min-h-[22px]' : 'w-[6px] min-h-[36px]'} h-full rounded-[25px] shrink-0 relative overflow-hidden`}
            style={{ background: accentColor }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 rounded-[25px]"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 70%)' }}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-[2px] min-w-0 flex-1">
          <span className={`block m-0 min-w-0 leading-tight ${isShortClass ? 'text-[13px] line-clamp-1' : 'text-[15px] max-md:text-[14px] line-clamp-2'} font-semibold text-text overflow-hidden text-ellipsis`}>
            {event.title}
          </span>
          <div className="flex flex-col gap-[1px] min-w-0">
            {event.location ? (
              <span className={`flex items-center gap-[3px] min-w-0 text-text-muted ${isShortClass ? 'text-[11px]' : 'text-[13px]'}`}>
                <Icon icon="carbon:location" className="w-[12px] h-[12px] shrink-0" aria-hidden="true" />
                <span className="block min-w-0 leading-none overflow-hidden text-ellipsis whitespace-nowrap">
                  {event.location}
                </span>
              </span>
            ) : null}
            {!isShortClass && event.teacher ? (
              <span className="flex items-center gap-[3px] min-w-0 text-text-muted text-[13px]">
                <Icon icon="carbon:user-avatar" className="w-[14px] h-[14px] shrink-0" aria-hidden="true" />
                <span className="block min-w-0 leading-[1.06] overflow-hidden text-ellipsis whitespace-nowrap">
                  {event.teacher}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom row: Time with clock icon, Group on the right */}
      <div className={`flex items-center justify-between gap-2 min-w-0 ${isShortClass ? 'pt-0.5' : 'pt-1'}`}>
        <div className="flex items-center gap-1 min-w-0">
          <Icon icon="carbon:time" className={`${isShortClass ? 'w-[12px] h-[12px]' : 'w-[14px] h-[14px]'} shrink-0 text-text`} aria-hidden="true" />
          <span className={`block min-w-0 leading-none ${isShortClass ? 'text-[11.5px]' : 'text-[14px] max-md:text-[13px]'} font-semibold tabular-nums text-text overflow-hidden text-ellipsis whitespace-nowrap`}>
            {displayTime}
          </span>
        </div>

        {firstGroup ? (
          <span className={`block leading-none ${isShortClass ? 'text-[10px]' : 'text-[12px]'} font-semibold text-text-muted shrink-0 max-w-[38%] overflow-hidden text-ellipsis whitespace-nowrap text-right`}>
            {firstGroup}
          </span>
        ) : isTeacher ? (
          <span className={`block leading-none ${isShortClass ? 'text-[10px]' : 'text-[12px]'} font-semibold text-indigo-600 dark:text-indigo-400 shrink-0`}>
            Enseignant
          </span>
        ) : null}
      </div>
    </article>
  )
}
