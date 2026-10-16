import { capitalize, groupByDay } from '../../planningUtils'
import { SectionTitle, StatusMessage } from '../ScodocUi'
import CourseCard from './CourseCard'

export default function PlanningListView({
  events = [],
  monday,
  now = new Date(),
  onSelectTeacher,
  onEventClick,
}) {
  const days = groupByDay(events, monday, true).filter((d) => d.events.length > 0)

  if (!days.length) {
    return (
      <StatusMessage
        icon="carbon:calendar"
        title="Aucun cours cette semaine"
        detail="Rien de prévu dans ton emploi du temps sur cette période."
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((day, index) => (
        <section key={day.date.toDateString()} className="flex flex-col gap-3.5">
          <SectionTitle id={`planning-list-day-${index}`}>
            {capitalize(day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}
            <span className="ml-2 text-[14px] font-normal text-text-muted">
              ({day.events.length} cours)
            </span>
          </SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
            {day.events.map((event) => (
              <CourseCard
                key={`${event.start}|${event.end}|${event.title}|${event.location}`}
                event={event}
                now={now}
                onClick={() => onEventClick && onEventClick(event)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
