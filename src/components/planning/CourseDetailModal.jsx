import { Icon } from '@iconify/react'
import { getClassHue } from '../../upcomingClasses'
import { formatTime } from '../../planningUtils'

export default function CourseDetailModal({
  event,
  onClose,
  onCompareTeacher,
}) {
  if (!event) return null

  const hue = getClassHue(event.title)
  const teacherRef = event.teachers?.[0] || (event.teacher ? { id: null, name: event.teacher } : null)

  const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime()
  const durationMin = Math.round(durationMs / (60 * 1000))
  const durationLabel = durationMin > 0
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? `${durationMin % 60}`.padStart(2, '0') : ''}`
    : ''

  const startDate = new Date(event.start)
  const dateFormatted = startDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const accentColor = `hsl(${hue}, 60%, 45%)`
  const classGradient = `linear-gradient(180deg, hsla(${hue}, 60%, 72%, 0.25) 0%, transparent 60%)`
  const classGradientDark = `linear-gradient(180deg, hsla(${hue}, 40%, 20%, 0.4) 0%, transparent 60%)`

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="course-card-widget widget-card widget-card-visible relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-white dark:border-[rgba(255,255,255,0.08)] p-6 shadow-2xl animate-scaleIn text-text"
        style={{
          '--class-gradient': classGradient,
          '--class-gradient-dark': classGradientDark,
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Top row with date label and close */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[13px] font-semibold uppercase tracking-wider text-text-muted">
              {dateFormatted}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex size-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
            >
              <Icon icon="carbon:close" className="size-4" />
            </button>
          </div>

          {/* Title with vertical accent pill and time badge */}
          <div className="flex items-stretch gap-3">
            <div className="flex self-stretch items-center">
              <div
                className="w-[6px] h-full rounded-[25px] shrink-0 relative overflow-hidden min-h-[46px]"
                style={{ background: accentColor }}
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 rounded-[25px]"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 70%)' }}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="m-0 font-body text-[20px] font-bold leading-snug text-text">
                {event.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 dark:bg-brand/20 px-3 py-1 font-body text-[13px] font-bold text-brand tabular-nums">
                  <Icon icon="carbon:time" className="size-3.5 shrink-0" />
                  {formatTime(event.start)} – {formatTime(event.end)}
                </span>
                {durationLabel && (
                  <span className="text-[13px] font-medium text-text-muted">
                    ({durationLabel})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta details */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white/60 dark:bg-zinc-800/60 p-3.5 text-[14px]">
            {event.location && (
              <div className="flex items-center gap-2.5 text-text">
                <Icon icon="carbon:location" className="size-4 text-text-muted shrink-0" />
                <span className="font-semibold">{event.location}</span>
              </div>
            )}

            {event.teacher && (
              <div className="flex items-center gap-2.5 text-text">
                <Icon icon="carbon:user-avatar" className="size-4 text-text-muted shrink-0" />
                <span className="font-medium">{event.teacher}</span>
              </div>
            )}

            {event.groups && event.groups.length > 0 && (
              <div className="flex items-center gap-2.5 text-text-secondary text-[13px]">
                <Icon icon="carbon:user-multiple" className="size-4 text-text-muted shrink-0" />
                <span>{event.groups.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 py-2.5 font-body text-[14px] font-semibold text-white dark:text-zinc-900 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Fermer
            </button>

            {teacherRef && onCompareTeacher && (
              <button
                type="button"
                onClick={() => {
                  onCompareTeacher(teacherRef)
                  onClose()
                }}
                className="mt-1 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-text-muted hover:text-brand transition-colors"
              >
                <Icon icon="carbon:collaborate" className="size-3.5" />
                <span>Voir les disponibilités de l'enseignant</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
