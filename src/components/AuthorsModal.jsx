import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import universityConfig from '@university'

const DEFAULT_AUTHORS = [
  {
    name: 'Elouan',
    handle: 'Klaynight',
    role: "Étudiant au BUT Informatique de Lannion",
    avatar: 'https://github.com/Klaynight-dev.png',
    url: 'https://klaynight.fr',
    github: 'https://github.com/Klaynight-dev',
  },
  {
    name: 'Tom',
    handle: 'tom-things',
    role: "Étudiant au BUT Informatique de Lannion",
    avatar: 'https://github.com/tom-things.png',
    url: 'https://tomthings.fr',
    github: 'https://github.com/tom-things',
  },
]

function AuthorAvatar({ src, name }) {
  const [hasError, setHasError] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (hasError || !src) {
    return (
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-brand-subtle text-[17px] font-bold text-brand select-none"
        aria-hidden="true"
      >
        {initial}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className="h-12 w-12 shrink-0 rounded-full border border-border object-cover shadow-xs"
      loading="lazy"
    />
  )
}

export default function AuthorsModal({ open, onClose, authors = null }) {
  const modalRef = useRef(null)
  const list = authors && authors.length > 0 ? authors : DEFAULT_AUTHORS
  const repoUrl = universityConfig.branding?.about?.repoUrl ?? 'https://github.com/l-ent-univ/tafac'

  useEffect(() => {
    if (!open) return undefined

    // Capture phase so Escape does not propagate to parent modals (AboutModal or AccountModal)
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="weather-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-5 animate-modal-backdrop-in max-sm:p-[14px]"
      onClick={onClose}
      role="presentation"
    >
      <section
        ref={modalRef}
        className="w-[min(460px,100%)] rounded-[24px] border border-border bg-bg text-text shadow-2xl animate-modal-card-in overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authors-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-400/15 dark:text-rose-400">
                <Icon icon="carbon:favorite-filled" className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 id="authors-modal-title" className="m-0 text-[20px] font-bold leading-tight text-text font-display">
                  Créateurs
                </h2>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(27,27,27,0.16)] bg-[#f3f1eb] p-0 text-text transition-colors duration-[120ms] hover:bg-[#edebe5] dark:border-border dark:bg-bg-muted dark:hover:bg-bg-subtle cursor-pointer"
              onClick={onClose}
              aria-label="Fermer"
            >
              <Icon icon="carbon:close" className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="m-0 text-[14px] leading-relaxed text-text-secondary font-body">
            Tafac a été imaginé et développé avec passion par deux étudiants du BUT Informatique de l'IUT de Lannion :
          </p>

          {/* Authors List */}
          <div className="flex flex-col gap-3">
            {list.map((author) => {
              const displayUrl = author.url ? author.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null

              return (
                <div
                  key={author.name}
                  className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-widget-bg p-3.5 sm:p-4 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <AuthorAvatar src={author.avatar} name={author.name} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold text-text leading-snug">
                          {author.name}
                        </span>
                        {author.handle ? (
                          <span className="text-[12px] font-mono text-text-muted">
                            @{author.handle}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[13px] text-text-secondary leading-snug">
                        {author.role}
                      </span>
                    </div>
                  </div>

                  {/* Links / badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {author.url ? (
                      <a
                        href={author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-subtle px-3 py-1.5 text-[12.5px] font-medium text-text no-underline transition-colors duration-120 hover:bg-brand-subtle hover:text-brand"
                      >
                        <Icon icon="carbon:earth" className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                        <span>{displayUrl}</span>
                      </a>
                    ) : null}

                    {author.github ? (
                      <a
                        href={author.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-subtle px-3 py-1.5 text-[12.5px] font-medium text-text no-underline transition-colors duration-120 hover:bg-brand-subtle hover:text-brand"
                      >
                        <Icon icon="carbon:logo-github" className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                        <span>GitHub</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          {repoUrl ? (
            <div className="pt-1 text-center">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted no-underline transition-colors hover:text-text"
              >
                <Icon icon="carbon:logo-github" className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Contribuer ou voir le code source sur GitHub</span>
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
