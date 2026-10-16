import { Icon } from '@iconify/react'
import { GRADES_LAUNCH_HREF, openGradesService } from '../entApi'
import { CARD_CLASSES, SECONDARY_BUTTON } from '../scodocPageUtils'
import { useSlidingIndicator } from '../useSlidingIndicator'
import { SlidingIndicator } from './SlidingIndicator'

// Building blocks shared by the ScoDoc pages ("Mes notes", "Absences").

export function SectionTitle({ id, children, count = null, aside = null }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 id={id} className="m-0 text-[22px] leading-[1.1] max-md:text-[20px]">
        {children}
        {count != null ? <span className="ml-2 font-body text-[15px] font-medium text-text-muted">{count}</span> : null}
      </h2>
      {aside}
    </div>
  )
}

// Segmented control whose selection slides from one option to the next.
export function SegmentedControl({ label, options, value, onChange, size = 'md', className = '', style = undefined }) {
  const [groupRef, box] = useSlidingIndicator(`${value}:${options.map((option) => `${option.value}${option.count ?? ''}`).join(',')}`)

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      className={`relative inline-flex max-w-full gap-1 rounded-full border border-border bg-widget-bg p-1 ${className}`}
      style={style}
    >
      <SlidingIndicator box={box} className="rounded-full bg-brand" />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected ? 'true' : undefined}
            onClick={() => onChange(option.value)}
            className={`relative flex shrink-0 flex-col items-center justify-center rounded-full border-0 bg-transparent font-body font-semibold leading-none transition-colors duration-200 ${
              size === 'lg' ? 'gap-1 px-4 py-2' : 'px-3.5 py-1.5 text-[14px]'
            } ${selected ? 'text-bg' : 'text-text-secondary hover:text-text'}`}
          >
            <span className={size === 'lg' ? 'text-[15px]' : ''}>
              {option.label}
              {option.count != null ? <span className="ml-1.5 opacity-60">{option.count}</span> : null}
            </span>
            {option.detail ? <span className="text-[11px] font-medium opacity-65">{option.detail}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export function StatusMessage({ icon, title, detail = null, action = null }) {
  return (
    <div className={`${CARD_CLASSES} grades-reveal flex flex-col items-start gap-3 p-5`}>
      <Icon icon={icon} className="size-6 text-text-muted" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="m-0 font-body text-[16px] font-semibold text-text">{title}</p>
        {detail ? <p className="m-0 font-body text-[14px] leading-snug text-text-secondary whitespace-pre-line">{detail}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function LoadingDots({ label }) {
  return (
    <div className="flex items-center gap-3 py-10 text-text-muted" role="status" aria-live="polite">
      <span className="inline-flex gap-[6px]" aria-hidden="true">
        {[0, 140, 280].map((delay) => (
          <span key={delay} className="lent-button-dot h-[5px] w-[5px] rounded-full bg-current" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      <span className="font-body text-[14px]">{label}</span>
    </div>
  )
}

export function OpenScodocButton() {
  if (!GRADES_LAUNCH_HREF) {
    return null
  }

  return (
    <button type="button" onClick={openGradesService} className={SECONDARY_BUTTON}>
      ScoDoc
      <Icon icon="carbon:arrow-up-right" className="size-3.5" aria-hidden="true" />
    </button>
  )
}

// Loading and failure states common to both pages; null once the semester's
// data is there.
export function ScodocLoadState({ data, unavailableTitle }) {
  const { base, entry, activeSemester, retry } = data
  const retryButton = (
    <button type="button" onClick={retry} className="rounded-full border-0 bg-brand px-4 py-2 font-body text-[14px] font-semibold text-bg hover:bg-brand-hover">
      Réessayer
    </button>
  )

  if (base.status === 'loading') {
    return <LoadingDots label="Récupération de tes données ScoDoc…" />
  }

  if (base.status === 'error') {
    return (
      <StatusMessage
        icon="carbon:cloud-offline"
        title={unavailableTitle}
        detail={base.error}
        action={<div className="flex flex-wrap gap-2">{retryButton}<OpenScodocButton /></div>}
      />
    )
  }

  if (entry.status === 'loading') {
    return <LoadingDots label={`Chargement du ${activeSemester?.number != null ? `semestre ${activeSemester.number}` : 'semestre'}…`} />
  }

  if (entry.status === 'error') {
    return (
      <StatusMessage
        icon="carbon:cloud-offline"
        title="Ce semestre n'a pas pu être chargé"
        detail={entry.error}
        action={<div className="flex flex-wrap gap-2">{retryButton}<OpenScodocButton /></div>}
      />
    )
  }

  return null
}

// Title, subtitle, actions and semester picker of a ScoDoc page. While a
// cached copy is on screen and the fresh one is on its way, a quiet
// "Actualisation…" says so.
export function ScodocPageHeader({ titleId, title, subtitle, actions = null, data }) {
  const { semesters, activeId, selectSemester, refreshing } = data
  const semesterOptions = semesters.map((semester) => ({
    value: semester.id,
    label: semester.number != null ? `S${semester.number}` : semester.title ?? 'Semestre',
    detail: semester.year,
  }))

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 id={titleId} className="m-0 text-[36px] leading-none tracking-[-0.02em] max-md:text-[30px]">{title}</h1>
          <p className="m-0 flex flex-wrap items-center gap-x-2 font-body text-[15px] font-medium text-text-secondary">
            {subtitle ? <span>{subtitle}</span> : null}
            {refreshing ? (
              <span className="scodoc-refreshing inline-flex items-center gap-1 text-[13px] text-text-muted" role="status">
                <Icon icon="carbon:renew" className="size-3.5 animate-spin" aria-hidden="true" />
                Actualisation…
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions}
          {data.base.status === 'ok' ? <OpenScodocButton /> : null}
        </div>
      </div>
      {semesterOptions.length > 1 ? (
        <div className="-mx-6 overflow-x-auto px-6 py-1 [scrollbar-width:none] max-md:-mx-3 max-md:px-3">
          <SegmentedControl label="Semestre" options={semesterOptions} value={activeId} onChange={selectSemester} size="lg" />
        </div>
      ) : null}
    </header>
  )
}

export function DepartmentNotice({ message }) {
  if (!message) {
    return null
  }

  return (
    <aside className={`${CARD_CLASSES} grades-reveal flex gap-3 p-4`} aria-label="Message du département">
      <Icon icon="carbon:information" className="mt-0.5 size-5 shrink-0 text-text-secondary" aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="m-0 font-body text-[14px] font-semibold text-text">Message de ton département</p>
        <p className="m-0 font-body text-[14px] leading-relaxed text-text-secondary whitespace-pre-line">{message}</p>
      </div>
    </aside>
  )
}
