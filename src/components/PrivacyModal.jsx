import { useEffect } from 'react'
import { Icon } from '@iconify/react'
import universityConfig from '@university'
import { isPostHogAvailable, isSimpleAnalyticsAvailable } from '../analytics'
import privacyHeader from '../assets/privacy-header.webp'

// "Tes données restent à toi": what the anonymous audience measurement does
// and doesn't do, in the illustrated style of the Figma presentation screens
// (toutatice, node 543:959). Opened from Mon compte and from À propos.

// Figma uses SF Pro Rounded; ui-rounded resolves to it on Apple devices.
const ROUNDED_FONT = "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
const ANALYTICS_DOC_URL = universityConfig.branding.about?.repoUrl
  ? `${universityConfig.branding.about.repoUrl.replace(/\/$/, '')}/blob/main/docs/ANALYTICS.md`
  : null

function getToolsSentence() {
  const tools = []
  if (isPostHogAvailable()) tools.push('PostHog, appelé par notre serveur et jamais par ton navigateur')
  if (isSimpleAnalyticsAvailable()) tools.push('Simple Analytics, pour compter les visites')
  if (tools.length === 0) return 'Les outils de mesure sont hébergés dans l’Union européenne.'
  return `${tools.length > 1 ? 'Deux outils, tous deux' : 'Un seul outil,'} dans l’Union européenne\u202f: ${tools.join(', et ')}.`
}

const SECTIONS = [
  {
    emoji: '🕶️',
    title: 'Anonyme',
    body: () => 'Aucun nom, identifiant, note, mail ou devoir. Juste des compteurs\u202f: combien de visites, quels widgets s’affichent, lesquels plantent.',
  },
  {
    emoji: '🍪',
    title: 'Sans cookie',
    body: () => 'Rien n’est déposé sur ton appareil pour te suivre\u202f: pas de suivi d’un jour à l’autre, ni d’un site à l’autre.',
  },
  {
    emoji: '🇪🇺',
    title: 'Hébergé en Europe',
    body: getToolsSentence,
  },
  {
    emoji: '🎚️',
    title: 'Tu gardes la main',
    body: () => 'Coupe «\u202fStatistiques anonymes\u202f» dans Mon compte\u202f: plus rien n’est envoyé.',
  },
]

function PrivacyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    // Capture phase so Escape closes only this modal, not the account modal below.
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="weather-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-5 animate-modal-backdrop-in max-sm:p-[14px]"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
      role="presentation"
    >
      <section
        className="privacy-modal relative w-[min(500px,100%)] max-h-[calc(100dvh-40px)] overflow-y-auto overflow-x-hidden rounded-[28px] border border-[var(--color-border)] bg-[#f5f3ed] text-[#341200] animate-modal-card-in dark:bg-[var(--color-bg)] dark:text-[var(--color-text)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{ fontFamily: ROUNDED_FONT }}
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-10 inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/70 bg-white/80 p-0 text-[#341200] backdrop-blur-md transition-colors duration-[120ms] hover:bg-white cursor-pointer"
          onClick={onClose}
          aria-label="Fermer"
        >
          <Icon icon="carbon:close" className="h-4 w-4" aria-hidden="true" />
        </button>

        <img
          src={privacyHeader}
          alt=""
          aria-hidden="true"
          width="402"
          height="293"
          className="privacy-modal-header block w-full h-auto select-none [mask-image:linear-gradient(to_bottom,#000_86%,transparent)]"
        />

        <div className="flex flex-col items-center gap-7 px-7 pt-1 pb-7 text-center max-sm:px-5">
          <div className="flex flex-col items-center gap-2">
            <p id="privacy-modal-title" role="heading" aria-level={2} className="m-0 text-[34px] font-bold leading-[0.95] tracking-[-0.01em] max-sm:text-[30px]">
              Tes données restent à toi
            </p>
            <p className="m-0 text-[16px] font-semibold leading-[1.15] tracking-[0.01em] opacity-90">
              l’ent compte ses visites pour savoir ce qui sert vraiment et réparer ce qui casse. Rien de plus.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-5 gap-y-6 max-sm:grid-cols-1">
            {SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col items-center gap-1.5">
                <span className="privacy-modal-emoji text-[44px] leading-none" aria-hidden="true">{section.emoji}</span>
                <p role="heading" aria-level={3} className="m-0 text-[21px] font-bold leading-[1]">
                  {section.title}
                </p>
                <p className="m-0 text-[14.5px] font-semibold leading-[1.2] opacity-80">
                  {section.body()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              className="lent-button inline-flex h-11 items-center justify-center rounded-full border-0 px-7 text-[15px] font-semibold text-white cursor-pointer"
              onClick={onClose}
            >
              Compris
            </button>
            {ANALYTICS_DOC_URL ? (
              <a
                href={ANALYTICS_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100"
              >
                Voir le détail de ce qui est collecté
              </a>
            ) : null}
            <p className="m-0 text-[15px] font-semibold">Pensé depuis Rennes 💚</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PrivacyModal
