import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import renameNoticeImage from '../assets/login/rename-notice.webp'
import { moveToTafac } from '../settingsTransfer'
import { flushAnalytics, isPostHogAvailable, track } from '../analytics'

// track() drops events sent before the session says whether analytics is on,
// and the sheet can open before that: wait for it a few seconds.
function trackMoveNotice(action, attempt = 0) {
  if (isPostHogAvailable() || attempt >= 10) {
    track('tafac_move', { action })
    return
  }
  setTimeout(() => trackMoveNotice(action, attempt + 1), 500)
}

// Sent right away: the move leaves the page.
function handleMove() {
  track('tafac_move', { action: 'move' })
  flushAnalytics()
  moveToTafac()
}

// Same look as UpdateNotice, shown where it is on the dashboard.
export function TafacMoveBanner({ onOpen, className = '' }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border border-border/70 bg-widget-bg/60 text-[13px] font-body leading-[1.3] ${className}`}>
      <Icon icon="carbon:star" className="w-[14px] h-[14px] shrink-0 text-text-muted" aria-hidden="true" />
      <span
        className="bg-[linear-gradient(90deg,var(--color-text-muted)_0%,var(--color-text)_50%,var(--color-text-muted)_100%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer"
        style={{ animationDuration: '3s' }}
      >
        l'ent devient Tafac !
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="ml-auto bg-transparent border-0 p-0 text-text font-medium underline underline-offset-2 decoration-text-muted/40 hover:decoration-text cursor-pointer transition-colors"
      >
        Découvrir
      </button>
    </div>
  )
}

// Bottom sheet sending users of the old l'ent address to Tafac with their
// settings, once and for all (see settingsTransfer.js).
export default function TafacMoveNotice({ open, onClose }) {
  const [animatingOut, setAnimatingOut] = useState(false)

  useEffect(() => {
    if (open) trackMoveNotice('shown')
  }, [open])

  const dismiss = useCallback(() => {
    trackMoveNotice('later')
    setAnimatingOut(true)
    setTimeout(() => {
      setAnimatingOut(false)
      onClose?.()
    }, 280)
  }, [onClose])

  if (!open) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-backdrop ${animatingOut ? 'animate-[pwa-backdrop-out_280ms_ease-in_forwards]' : 'animate-[pwa-backdrop-in_280ms_ease-out]'}`}
        onClick={dismiss}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${animatingOut ? 'animate-[pwa-slide-out_280ms_ease-in_forwards]' : 'animate-[pwa-slide-in_350ms_cubic-bezier(0.16,1,0.3,1)]'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tafac-move-title"
      >
        <div className="max-w-[420px] mx-auto rounded-[20px] bg-widget-bg border border-border overflow-hidden shadow-[0_-8px_40px_var(--color-shadow)]">
          <img
            src={renameNoticeImage}
            alt="Le logo l'ent devient le logo Tafac"
            className="block aspect-[1146/642] w-full"
            width="1146"
            height="642"
          />
          <div className="px-5 pt-4 pb-4 flex flex-col gap-2">
            <h2 id="tafac-move-title" className="m-0 text-[1.15rem] font-bold text-text leading-tight">
              l'ent devient Tafac !
            </h2>
            <p className="m-0 text-[0.9rem] text-text-muted font-body leading-snug">
              C'est la même appli, avec un nouveau nom. Appuie sur « Passer à Tafac » : tes réglages sont transférés une bonne fois pour toutes, et la prochaine fois tu arriveras directement sur tafac.fr. Tes identifiants ne changent pas
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-border">
            <button
              type="button"
              onClick={dismiss}
              className="py-3.5 border-0 border-r border-border bg-transparent text-text-muted font-body font-medium text-[0.95rem] active:bg-bg-subtle transition-colors"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={handleMove}
              className="inline-flex items-center justify-center gap-2 py-3.5 border-0 bg-bg-subtle text-text font-body font-semibold text-[0.95rem] active:bg-bg transition-colors"
            >
              Passer à Tafac
              <Icon icon="carbon:arrow-right" className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
