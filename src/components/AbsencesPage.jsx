import { Fragment, useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { buildAbsenceReport, buildJustificationMail, formatDuration, hoursToJustify, summarizeAbsencesBySubject } from '../gradesReport'
import { CARD_CLASSES, HELP_TOUR_BUTTON, SECONDARY_BUTTON, formatLongDate, getSecretariatEmail, parseIsoDate, revealStyle } from '../scodocPageUtils'
import { APP_NAME } from '../seo'
import { useScodocReleve } from '../useScodocReleve'
import PageGuidedTour from './PageGuidedTour'
import {
  DepartmentNotice,
  ScodocLoadState,
  ScodocPageHeader,
  SectionTitle,
  SegmentedControl,
  StatusMessage,
} from './ScodocUi'

// "Absences": the ScoDoc absence report as its own page. First what may
// cost something (unjustified absences, the time left to justify them),
// then where the hours were missed, then the full history.


const ABSENCES_TOUR_STEPS = [
  {
    id: 'intro',
    title: 'Bienvenue sur tes absences',
    body: 'Suis tes absences et retards enregistrés sur ScoDoc, vérifie tes délais de justification et contacte facilement ton secrétariat.',
    icon: 'carbon:event-schedule',
  },
  {
    id: 'summary',
    target: 'absences-summary',
    title: 'Bilan de ton semestre',
    body: 'Retrouve en un clin d’œil le total de tes heures injustifiées, justifiées et retards. Sois attentif au décompte des heures pour valider ton semestre sans pénalité.',
    icon: 'carbon:hourglass',
  },
  {
    id: 'breakdown',
    target: 'absences-breakdown',
    title: 'Répartition par matière',
    body: 'Vérifie dans quelles ressources ou SAÉ tu as manqué des cours pour éviter d’accumuler trop d’absences dans une même matière.',
    icon: 'carbon:chart-pie',
  },
  {
    id: 'history',
    target: 'absences-history',
    title: 'Historique & Justification rapide',
    body: 'Chaque absence affiche son état et le délai restant pour la justifier. Clique sur « Justifier » pour ouvrir un e-mail officiel pré-rempli prêt à envoyer au secrétariat.',
    icon: 'carbon:email',
  },
]

const ABSENCE_STATUS = {
  justified: { label: 'Justifiée', className: 'bg-success-bg text-success-text' },
  unjustified: { label: 'Injustifiée', className: 'bg-error-bg text-error' },
  late: { label: 'Retard', className: 'bg-bg-subtle text-text-secondary' },
}

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'unjustified', label: 'Injustifiées' },
  { value: 'justified', label: 'Justifiées' },
  { value: 'late', label: 'Retards' },
]

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function groupByMonth(entries) {
  const groups = []
  for (const entry of entries) {
    const date = parseIsoDate(entry.date)
    const key = date ? `${date.getFullYear()}-${date.getMonth()}` : 'unknown'
    let group = groups.at(-1)
    if (!group || group.key !== key) {
      group = {
        key,
        label: date ? capitalize(date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) : 'Date inconnue',
        entries: [],
      }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

// "2025-09-25" → "25/09/2025", for the pre-filled mail.
function formatNumericDate(value) {
  return String(value ?? '').split('-').reverse().join('/')
}

// Hours left to justify → "Reste 36 h", "Reste 3 h", "Délai dépassé".
function describeDeadline(hours) {
  if (hours == null) return ''
  if (hours <= 0) return 'Délai dépassé'
  if (hours < 1) return 'Reste moins d’1 h'
  return `Reste ${Math.floor(hours)} h`
}

// Copies the secretariat's address, for people whose mail is a webmail that
// the mailto: link doesn't open.
function CopyAddressButton({ address }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked: the address is on screen anyway.
    }
  }

  return (
    <button type="button" onClick={() => void copy()} className={`${SECONDARY_BUTTON} px-3! py-1.5! text-[13px]!`}>
      <Icon icon={copied ? 'carbon:checkmark' : 'carbon:copy'} className="size-3.5" aria-hidden="true" />
      {copied ? 'Adresse copiée' : 'Copier l’adresse'}
    </button>
  )
}

function SummaryCard({ absences, revealOrder, justification }) {
  const unjustified = absences.entries.filter((entry) => entry.status === 'unjustified')
  const unjustifiedCount = unjustified.length
  // The soonest deadline still open, to say how urgent it is.
  const openDeadlines = unjustified.map((entry) => hoursToJustify(entry)).filter((hours) => hours != null && hours > 0)
  const nextDeadline = openDeadlines.length ? Math.min(...openDeadlines) : null
  const figures = absences.totals
    ? [
        { label: 'Injustifiées', value: absences.totals.unjustified, tone: unjustifiedCount ? 'text-error' : 'text-text' },
        { label: 'Justifiées', value: absences.totals.justified, tone: 'text-text' },
        { label: 'Retards', value: absences.totals.late, tone: 'text-text' },
      ]
    : []

  return (
    <article style={revealStyle(revealOrder)} className={`${CARD_CLASSES} grades-reveal flex flex-col gap-4 p-5 max-md:p-4`}>
      {figures.length ? (
        <dl className="m-0 grid grid-cols-3 gap-4 max-xs:gap-2">
          {figures.map((figure) => (
            <div key={figure.label} className="flex flex-col gap-1 min-w-0">
              <dt className="font-body text-[13px] font-medium text-text-muted">{figure.label}</dt>
              <dd className={`m-0 font-display text-[34px] font-bold leading-none max-md:text-[28px] ${figure.tone}`}>{figure.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="m-0 font-body text-[14px] text-text-secondary">
          Certaines absences couvrent plusieurs jours : les totaux en heures ne s'appliquent pas, le détail est plus bas.
        </p>
      )}
      {unjustifiedCount ? (
        <div className="flex items-start gap-3 rounded-[16px] bg-error-bg px-4 py-3">
          <Icon icon="carbon:warning-alt" className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-3">
            <p className="m-0 font-body text-[14px] leading-snug text-text">
              <span className="font-semibold">
                {unjustifiedCount === 1 ? '1 absence n’est pas justifiée.' : `${unjustifiedCount} absences ne sont pas justifiées.`}
              </span>
              {nextDeadline != null ? ` Il te reste ${Math.floor(nextDeadline)} h pour la plus récente.` : ' Le délai pour les justifier est dépassé : contacte directement ton secrétariat.'}
              {absences.notice ? ` ${absences.notice}` : ''}
            </p>
            {justification ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildJustificationMail({ ...justification, entries: unjustified, formatDate: formatNumericDate }).href}
                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-brand px-3 py-1.5 font-body text-[13px] font-semibold text-bg no-underline hover:bg-brand-hover"
                >
                  <Icon icon="carbon:email" className="size-3.5" aria-hidden="true" />
                  {unjustifiedCount === 1 ? 'Justifier par mail' : 'Tout justifier par mail'}
                </a>
                <CopyAddressButton address={justification.to} />
                <span className="font-body text-[12px] text-text-secondary">{justification.to}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : absences.entries.length ? (
        <p className="m-0 flex items-center gap-2 font-body text-[14px] font-semibold text-success-text">
          <Icon icon="carbon:checkmark-outline" className="size-5" aria-hidden="true" />
          Toutes tes absences sont justifiées.
        </p>
      ) : null}
    </article>
  )
}

function SubjectBreakdown({ entries, revealOrder }) {
  const subjects = summarizeAbsencesBySubject(entries)
  if (!subjects.length) {
    return null
  }

  const maxHours = Math.max(...subjects.map((subject) => subject.hours), 1)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="absences-subjects-title">
      <SectionTitle id="absences-subjects-title">Heures manquées par matière</SectionTitle>
      <ul style={revealStyle(revealOrder)} className={`${CARD_CLASSES} grades-reveal m-0 flex flex-col gap-4 p-5 list-none max-md:p-4`}>
        {subjects.map((subject) => (
          <li key={subject.subject} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-body text-[15px] font-semibold leading-snug text-text">{subject.subject}</span>
              <span className="shrink-0 font-body text-[14px] font-semibold text-text">
                {formatDuration(subject.hours)}
                {subject.unjustifiedHours ? (
                  <span className="font-medium text-error"> · {formatDuration(subject.unjustifiedHours)} injustifiée{subject.unjustifiedHours > 1 ? 's' : ''}</span>
                ) : null}
              </span>
            </div>
            {/* Whole bar: hours missed; red part: the unjustified ones. */}
            <div className="relative h-[8px] overflow-hidden rounded-full bg-border" aria-hidden="true">
              <span className="absolute inset-y-0 left-0 rounded-full bg-text-30" style={{ width: `${(subject.hours / maxHours) * 100}%` }} />
              <span className="absolute inset-y-0 left-0 rounded-full bg-error" style={{ width: `${(subject.unjustifiedHours / maxHours) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AbsenceHistory({ entries, revealOrder, justification }) {
  const [filter, setFilter] = useState('all')
  const counts = useMemo(() => {
    const result = { all: entries.length, unjustified: 0, justified: 0, late: 0 }
    for (const entry of entries) result[entry.status] += 1
    return result
  }, [entries])
  const visible = filter === 'all' ? entries : entries.filter((entry) => entry.status === filter)
  const options = FILTERS
    .filter((option) => option.value === 'all' || counts[option.value] > 0)
    .map((option) => ({ ...option, count: counts[option.value] }))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="absences-history-title">
      <SectionTitle id="absences-history-title" count={entries.length}>Historique</SectionTitle>
      {options.length > 2 ? (
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <SegmentedControl label="Filtrer les absences" options={options} value={filter} onChange={setFilter} />
        </div>
      ) : null}
      <div style={revealStyle(revealOrder)} className={`${CARD_CLASSES} grades-reveal flex flex-col overflow-hidden`}>
        {groupByMonth(visible).map((group) => (
          <Fragment key={group.key}>
            <h3 className="m-0 border-b border-border bg-bg-subtle/60 px-4 py-2 font-body text-[13px] font-semibold text-text-secondary">{group.label}</h3>
            <ul className="m-0 flex flex-col p-0 list-none">
              {group.entries.map((entry) => {
                const status = ABSENCE_STATUS[entry.status]
                const date = parseIsoDate(entry.date)
                return (
                  <li key={entry.id} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                    <span className="flex w-[44px] shrink-0 flex-col items-center leading-none" aria-hidden="true">
                      <span className="font-display text-[22px] font-bold text-text">{date ? date.getDate() : '—'}</span>
                      <span className="mt-1 font-body text-[11px] font-semibold uppercase text-text-muted">
                        {date ? date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') : ''}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="sr-only">{formatLongDate(entry.date)}{entry.endDate ? ` au ${formatLongDate(entry.endDate)}` : ''}</span>
                      <span className="font-body text-[15px] font-semibold leading-snug text-text">
                        {entry.subject ?? 'Matière non précisée'}
                      </span>
                      <span className="font-body text-[13px] leading-snug text-text-muted">
                        {[
                          entry.endDate ? `jusqu'au ${formatLongDate(entry.endDate)}` : `${entry.start} – ${entry.end}`,
                          entry.teacher,
                        ].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2.5 py-1 font-body text-[12px] font-semibold ${status.className}`}>{status.label}</span>
                      {entry.status === 'unjustified' && justification ? (
                        <>
                          <span className="font-body text-[12px] font-medium text-text-muted">{describeDeadline(hoursToJustify(entry))}</span>
                          <a
                            href={buildJustificationMail({ ...justification, entries: entry, formatDate: formatNumericDate }).href}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 font-body text-[12px] font-semibold text-text no-underline transition-colors duration-150 hover:bg-bg-subtle"
                          >
                            <Icon icon="carbon:email" className="size-3.5" aria-hidden="true" />
                            Justifier
                          </a>
                        </>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

function AbsencesPage() {
  const [tourTrigger, setTourTrigger] = useState(0)
  const data = useScodocReleve()
  const { activeId, releve, config, entry, departmentMessage } = data

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Absences · ${APP_NAME}`
    return () => { document.title = previousTitle }
  }, [])

  const absences = useMemo(
    () => (entry.status === 'ok' ? buildAbsenceReport(entry.payload, releve, config) : null),
    [config, entry, releve],
  )
  // Only when the department has a secretariat address to write to.
  const secretariat = getSecretariatEmail(data.department, config)
  const justification = secretariat
    ? {
        to: secretariat,
        student: { firstName: releve?.etudiant?.prenom, lastName: releve?.etudiant?.nom },
        semesterLabel: [data.activeSemester?.number != null ? `S${data.activeSemester.number}` : null, data.activeSemester?.year].filter(Boolean).join(' '),
      }
    : null
  const subtitle = [
    releve?.formation?.acronyme ?? data.activeSemester?.title,
    data.activeSemester?.number != null ? `Semestre ${data.activeSemester.number}` : null,
    data.activeSemester?.year,
  ].filter(Boolean).join(' · ')

  let body
  if (data.base.status !== 'ok' || entry.status !== 'ok') {
    body = <ScodocLoadState data={data} unavailableTitle="Absences indisponibles" />
  } else if (!absences?.visible) {
    body = (
      <StatusMessage
        icon="carbon:view-off"
        title="Absences non publiées"
        detail="Ton département ne publie pas les absences dans ScoDoc. Rapproche-toi du secrétariat pour les connaître."
      />
    )
  } else if (!absences.entries.length) {
    body = (
      <StatusMessage
        icon="carbon:checkmark-outline"
        title="Aucune absence sur ce semestre"
        detail="Rien n'est enregistré dans ScoDoc pour l'instant."
      />
    )
  } else {
    // Keyed by semester: switching replays the arrival animation and resets
    // the history filter.
    body = (
      <Fragment key={activeId}>
        <div data-tour="absences-summary"><SummaryCard absences={absences} revealOrder={0} justification={justification} /></div>
        <div data-tour="absences-breakdown"><SubjectBreakdown entries={absences.entries} revealOrder={1} /></div>
        <div data-tour="absences-history"><AbsenceHistory entries={absences.entries} revealOrder={2} justification={justification} /></div>
        {absences.notice ? (
          <p className="m-0 font-body text-[12px] leading-relaxed text-text-muted whitespace-pre-line">{absences.notice}</p>
        ) : null}
      </Fragment>
    )
  }

  return (
    <section className="grades-page w-full pt-4 px-6 pb-10 4xl:pt-5 max-md:px-3 max-md:pt-3" aria-labelledby="absences-page-title">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-8 max-md:gap-6">
        <ScodocPageHeader
          titleId="absences-page-title"
          title="Absences"
          subtitle={subtitle}
          data={data}
          actions={(
            <button
              type="button"
              onClick={() => setTourTrigger((c) => c + 1)}
              className={HELP_TOUR_BUTTON}
              title="Aide & Visite guidée des absences"
              aria-label="Visite guidée"
            >
              <Icon icon="carbon:help" className="size-5 shrink-0" aria-hidden="true" />
            </button>
          )}
        />
        {entry.status === 'ok' ? <DepartmentNotice message={departmentMessage} /> : null}
        {body}
      </div>
      <PageGuidedTour
        storageKey="l-ent:tour:absences"
        steps={ABSENCES_TOUR_STEPS}
        manualTrigger={tourTrigger}
      />
    </section>
  )
}

export default AbsencesPage
