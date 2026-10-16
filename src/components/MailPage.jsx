import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { getMailMessage, getMailMessages, markMailAsRead } from '../entApi'
import { MAIL_HREF } from '../navItems'
import { CARD_CLASSES, HELP_TOUR_BUTTON, SECONDARY_BUTTON } from '../scodocPageUtils'
import { APP_NAME } from '../seo'
import PageGuidedTour from './PageGuidedTour'
import { LoadingDots, SegmentedControl, StatusMessage } from './ScodocUi'
import MailComposeModal from './mail/MailComposeModal'
import MailDirectoryModal from './mail/MailDirectoryModal'
import MailPreferencesModal from './mail/MailPreferencesModal'
import {
  SHIMMER_CLASSES,
  calendarDayDiff,
  formatClockTime,
  parseDate,
} from './widgetListUtils'

const MAIL_TOUR_STEPS = [
  {
    id: 'intro',
    title: 'Bienvenue sur ta messagerie',
    body: 'Consulte tes e-mails universitaires en direct, lis tes messages récents et accède directement à Partage.',
    icon: 'carbon:email',
  },
  {
    id: 'compose',
    target: 'mail-compose-button',
    title: 'Nouveau message',
    body: 'Rédige des e-mails soignés avec un éditeur de texte complet, des styles personnalisés et des modèles prêts à l’emploi.',
    icon: 'carbon:edit',
  },
  {
    id: 'directory',
    target: 'mail-directory-button',
    title: 'Annuaire universitaire',
    body: 'Recherche facilement les adresses de tes enseignants, de la scolarité et des services universitaires.',
    icon: 'carbon:user-multiple',
  },
  {
    id: 'search',
    target: 'mail-search',
    title: 'Recherche et filtres',
    body: 'Recherche par mot-clé, enseignant ou objet, et bascule entre tous les messages et les non lus.',
    icon: 'carbon:search',
  },
  {
    id: 'list',
    target: 'mail-list',
    title: 'Boîte de réception',
    body: 'Parcours tes e-mails avec aperçu du contenu, statut de lecture et date de réception.',
    icon: 'carbon:list-boxes',
  },
  {
    id: 'detail',
    target: 'mail-preview',
    title: 'Panneau de lecture',
    body: 'Lis le corps du message complet, réponds directement, marque-le comme lu/non lu ou ouvre-le dans Partage.',
    icon: 'carbon:view',
  },
]

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
const dayMonthFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const fullDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
})

function formatReceivedAt(date, now = new Date()) {
  if (!date) return ''
  const dayDiff = -calendarDayDiff(date, now)
  if (dayDiff <= 0) return formatClockTime(date)
  if (dayDiff === 1) return 'hier'
  if (dayDiff < 7) return weekdayFormatter.format(date)
  return dayMonthFormatter.format(date)
}

function getSenderLabel(from) {
  return from?.name?.trim() || from?.email?.trim() || 'Expéditeur inconnu'
}

function getInitials(name) {
  if (!name) return '?'
  const clean = name.replace(/[^\p{L}\s]/gu, '').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hues = [210, 260, 290, 330, 160, 190, 25, 45]
  const hue = hues[Math.abs(hash) % hues.length]
  return `hsl(${hue}, 65%, 45%)`
}

function formatBytes(bytes) {
  if (!bytes || !Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return (
      document.documentElement.dataset.theme === 'dark' ||
      document.documentElement.classList.contains('dark') ||
      (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })

  useEffect(() => {
    const update = () => {
      setIsDark(
        document.documentElement.dataset.theme === 'dark' ||
        document.documentElement.classList.contains('dark') ||
        (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      )
    }
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    media?.addEventListener?.('change', update)
    return () => {
      observer.disconnect()
      media?.removeEventListener?.('change', update)
    }
  }, [])

  return isDark
}

function EmailBodyViewer({ html, text }) {
  const iframeRef = useRef(null)
  const [iframeHeight, setIframeHeight] = useState(250)
  const isDark = useIsDark()

  const srcDoc = useMemo(() => {
    if (!html) return ''

    const textColor = isDark ? '#f4f4f5' : '#18181b'
    const linkColor = '#f97316'
    const bgColor = isDark ? '#1c1c1c' : '#ffffff'
    const mutedColor = isDark ? '#a1a1aa' : '#52525b'
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'

    const injectedCss = `
      *, *::before, *::after {
        box-sizing: border-box;
      }
      :root {
        color-scheme: ${isDark ? 'dark' : 'light'};
      }
      html, body {
        margin: 0;
        padding: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14.5px;
        line-height: 1.6;
        color: ${textColor} !important;
        background-color: ${bgColor} !important;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      /* Force 100% visibility for all text regardless of inline styles (signatures, headers, fonts) */
      body, body *:not(a):not(a *):not(code):not(pre) {
        color: ${textColor} !important;
        text-shadow: none !important;
        opacity: 1 !important;
      }

      /* Neutralize any element backgrounds that would obscure text or create blinding blocks */
      body *:not(a):not(button):not(pre):not(code) {
        background-color: transparent !important;
        background: transparent !important;
      }

      /* Clean link styling */
      a, a * {
        color: ${linkColor} !important;
        text-decoration: underline !important;
      }

      /* Buttons (Teams invites, action links) */
      a[style*="background"], a.button, a[class*="btn"], a[class*="button"] {
        display: inline-block !important;
        padding: 6px 14px !important;
        border-radius: 8px !important;
        background-color: ${isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)'} !important;
        border: 1px solid rgba(249, 115, 22, 0.35) !important;
        color: #f97316 !important;
        text-decoration: none !important;
        font-weight: 600 !important;
      }

      /* Images: keep responsive and clean */
      img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 6px;
      }

      /* Tables: ensure structured, readable borders */
      table {
        max-width: 100% !important;
        border-collapse: collapse !important;
        margin: 8px 0 !important;
      }
      th, td {
        border: 1px solid ${borderColor} !important;
        padding: 6px 10px !important;
      }

      /* Quotes & replies */
      blockquote {
        margin: 12px 0 !important;
        padding-left: 12px !important;
        border-left: 3px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)'} !important;
      }
      blockquote, blockquote *:not(a):not(a *) {
        color: ${mutedColor} !important;
      }

      /* Horizontal dividers */
      hr {
        border: 0 !important;
        border-top: 1px solid ${borderColor} !important;
        margin: 16px 0 !important;
      }

      /* Code snippets */
      pre, code {
        white-space: pre-wrap !important;
        word-break: break-all !important;
        background-color: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'} !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      }
    `

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="${isDark ? 'dark' : 'light'}">
  <base target="_blank">
  <style>${injectedCss}</style>
</head>
<body>
  ${html}
</body>
</html>`
  }, [html, isDark])

  const adjustHeight = () => {
    if (!iframeRef.current) return
    try {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (doc) {
        const images = doc.querySelectorAll('img')
        images.forEach((img) => {
          img.onerror = () => { img.style.display = 'none'; }
        })
        // Strip legacy presentational attributes that could clash
        doc.querySelectorAll('font[color]').forEach((font) => font.removeAttribute('color'))
        doc.querySelectorAll('[bgcolor]').forEach((el) => el.removeAttribute('bgcolor'))

        const newHeight = Math.max(doc.body?.scrollHeight || 0, doc.documentElement?.scrollHeight || 0)
        if (newHeight > 0) {
          setIframeHeight(newHeight + 24)
        }
      }
    } catch {
      // Ignored cross-origin iframe security restrictions
    }
  }

  useEffect(() => {
    adjustHeight()
    const timer = setTimeout(adjustHeight, 350)
    return () => clearTimeout(timer)
  }, [srcDoc])

  if (!html) {
    return (
      <div className="whitespace-pre-wrap break-words font-body text-[14.5px] leading-relaxed text-text">
        {text || '(Aucun contenu texte)'}
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      onLoad={adjustHeight}
      title="Contenu de l'e-mail"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      className="w-full border-0 transition-[height] duration-150 rounded-xl"
      style={{
        height: `${iframeHeight}px`,
        minHeight: '120px',
        backgroundColor: isDark ? '#1c1c1c' : '#ffffff',
        colorScheme: isDark ? 'dark' : 'light',
      }}
    />
  )
}

export default function MailPage() {
  const [tourTrigger, setTourTrigger] = useState(0)
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [webmailHref, setWebmailHref] = useState(MAIL_HREF)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'unread'
  const [selectedId, setSelectedId] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const searchTimeoutRef = useRef(null)

  // Document title
  useEffect(() => {
    const prev = document.title
    document.title = `Messagerie · ${APP_NAME}`
    return () => {
      document.title = prev
    }
  }, [])

  // Load message list - DOES NOT depend on selectedId to avoid full-page reloads on click!
  const loadMessages = useCallback(async (query = '', isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const result = await getMailMessages({ limit: 40, query })
      if (result.status === 'ok') {
        const list = result.messages || []
        setMessages(list)
        setUnreadCount(result.unreadCount ?? list.filter((m) => m.unread).length)
        if (result.webmailHref) setWebmailHref(result.webmailHref)
        setNow(new Date())

        // Auto-select first message on desktop only if none selected yet
        setSelectedId((current) => {
          if (!current && list.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
            return list[0].id
          }
          return current
        })
      } else if (result.status === 'disabled') {
        setError('La messagerie n’est pas configurée pour cet établissement.')
      } else if (result.status === 'unauthenticated') {
        setError('Session expirée. Veuillez vous reconnecter.')
      } else {
        setError(result.error || 'Erreur lors du chargement des e-mails.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      void loadMessages(val)
    }, 350)
  }

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Load message detail when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setSelectedMessage(null)
      return
    }

    let isMounted = true
    setLoadingDetail(true)

    const listItem = messagesRef.current.find((m) => String(m.id) === String(selectedId))
    if (listItem) {
      // Pre-populate with list data immediately so title/sender don't flicker or show unknown
      setSelectedMessage((prev) => {
        if (prev && String(prev.id) === String(selectedId)) return prev
        return {
          ...listItem,
          bodyText: listItem.snippet || '',
        }
      })
    }

    getMailMessage(selectedId)
      .then((msg) => {
        if (!isMounted) return
        const currentListItem = messagesRef.current.find((m) => String(m.id) === String(selectedId)) || listItem
        const merged = {
          ...currentListItem,
          ...msg,
          from: msg?.from?.name || msg?.from?.email ? msg.from : currentListItem?.from || { name: 'Expéditeur inconnu', email: null },
          subject: msg?.subject || currentListItem?.subject || '(Sans objet)',
          receivedAt: msg?.receivedAt || currentListItem?.receivedAt || null,
          bodyText: msg?.bodyText || msg?.bodyHtml || currentListItem?.snippet || '(Aucun contenu texte)',
        }
        setSelectedMessage(merged)

        // Mark as read in state & server
        if (msg?.unread) {
          void markMailAsRead(selectedId, true)
          setMessages((current) =>
            current.map((m) => (String(m.id) === String(selectedId) ? { ...m, unread: false } : m))
          )
          setUnreadCount((count) => Math.max(0, count - 1))
        }
      })
      .catch(() => {
        if (!isMounted) return
        // Fallback to list message info if full detail call fails
        if (listItem) {
          setSelectedMessage({
            ...listItem,
            bodyText: listItem.snippet || '(Contenu indisponible)',
          })
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedId])

  // Filter messages
  const filteredMessages = useMemo(() => {
    let list = messages
    if (filterMode === 'unread') {
      list = list.filter((m) => m.unread)
    }
    return list
  }, [messages, filterMode])

  const handleToggleRead = async (e) => {
    e?.stopPropagation()
    if (!selectedMessage) return
    const nextRead = selectedMessage.unread // if unread now, mark read; else mark unread
    const targetState = !nextRead // we want to invert

    setSelectedMessage((cur) => (cur ? { ...cur, unread: targetState } : null))
    setMessages((cur) =>
      cur.map((m) => (m.id === selectedMessage.id ? { ...m, unread: targetState } : m))
    )
    setUnreadCount((count) => (targetState ? count + 1 : Math.max(0, count - 1)))
    await markMailAsRead(selectedMessage.id, !targetState)
  }

  const handleCopySender = () => {
    const email = selectedMessage?.from?.email
    if (!email) return
    navigator.clipboard.writeText(email).then(() => {
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }).catch(() => {})
  }

  // Compose / Send modal state
  const [composeState, setComposeState] = useState({
    isOpen: false,
    to: '',
    cc: '',
    subject: '',
    body: '',
    origId: null,
    replyType: null,
  })

  const handleNewMessage = () => {
    setComposeState({
      isOpen: true,
      to: '',
      cc: '',
      subject: '',
      body: '',
      origId: null,
      replyType: null,
    })
  }

  const handleReplyMessage = () => {
    if (!selectedMessage) return
    const senderEmail = selectedMessage.from?.email || ''
    const senderName = selectedMessage.from?.name || senderEmail || ''
    const rawSubject = selectedMessage.subject || ''
    const replySubject = /^re\s*:/i.test(rawSubject) ? rawSubject : `Re: ${rawSubject}`
    const dateFormatted = selectedMessage.receivedAt
      ? fullDateFormatter.format(new Date(selectedMessage.receivedAt))
      : ''

    const quotedBody = `
      <p><br/></p>
      <hr/>
      <p><strong>De :</strong> ${senderName} &lt;${senderEmail}&gt;<br/>
      <strong>Date :</strong> ${dateFormatted}<br/>
      <strong>Objet :</strong> ${rawSubject}</p>
      <blockquote>${selectedMessage.bodyHtml || selectedMessage.bodyText || ''}</blockquote>
    `

    setComposeState({
      isOpen: true,
      to: senderEmail,
      cc: '',
      subject: replySubject,
      body: quotedBody,
      origId: selectedMessage.id,
      replyType: 'r',
    })
  }

  const [directoryOpen, setDirectoryOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const handleSelectDirectoryContact = (contact) => {
    setComposeState({
      isOpen: true,
      to: contact.email,
      cc: '',
      subject: '',
      body: '',
      origId: null,
      replyType: null,
    })
  }

  const effectiveWebmailHref = webmailHref || MAIL_HREF || 'https://partage.univ-rennes.fr/'

  return (
    <section className="grades-page w-full pt-4 px-6 pb-12 4xl:pt-5 max-md:px-3 max-md:pt-3 max-md:pb-24" aria-labelledby="mail-page-title">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 max-md:gap-4">
        {/* Page Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <h1 id="mail-page-title" className="m-0 text-[36px] leading-none tracking-[-0.02em] max-md:text-[28px] font-bold text-text">
              Messagerie
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[12px] font-bold tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void loadMessages(searchQuery, true)}
              disabled={refreshing || loading}
              aria-label="Rafraîchir les e-mails"
              className={SECONDARY_BUTTON}
              title="Rafraîchir"
            >
              <Icon
                icon="carbon:renew"
                className={`size-4 ${refreshing ? 'animate-spin text-brand' : ''}`}
                aria-hidden="true"
              />
              <span className="max-xs:hidden">Rafraîchir</span>
            </button>

            <button
              type="button"
              onClick={() => setTourTrigger((c) => c + 1)}
              className={HELP_TOUR_BUTTON}
              title="Aide & Visite guidée de la messagerie"
              aria-label="Visite guidée"
            >
              <Icon icon="carbon:help" className="size-5 shrink-0" aria-hidden="true" />
            </button>

            {effectiveWebmailHref && (
              <a
                href={effectiveWebmailHref}
                target="_blank"
                rel="noopener noreferrer"
                className={SECONDARY_BUTTON}
                title="Ouvrir le webmail Zimbra / Partage dans un nouvel onglet"
              >
                <span>Ouvrir dans Partage</span>
                <Icon icon="carbon:arrow-up-right" className="size-3.5 opacity-70" aria-hidden="true" />
              </a>
            )}
          </div>
        </header>

        {/* Search & Filter Bar with Nouveau Message */}
        <div data-tour="mail-search" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Icon
                icon="carbon:search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-muted pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Rechercher par expéditeur, sujet…"
                className="w-full h-10 pl-9 pr-9 rounded-full border border-white/60 dark:border-white/10 bg-widget-bg text-[14px] text-text placeholder:text-text-muted transition-colors focus:border-brand focus:outline-none"
                style={{
                  WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
                  backdropFilter: 'blur(20px) saturate(1.5)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    void loadMessages('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text rounded-full"
                  aria-label="Effacer la recherche"
                >
                  <Icon icon="carbon:close" className="size-4" />
                </button>
              )}
            </div>

            <button
              data-tour="mail-compose-button"
              type="button"
              onClick={handleNewMessage}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-brand text-bg text-[14px] font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Rédiger un nouvel e-mail"
            >
              <Icon icon="carbon:edit" className="size-4 shrink-0" aria-hidden="true" />
              <span>Nouveau message</span>
            </button>

            <button
              data-tour="mail-directory-button"
              type="button"
              onClick={() => setDirectoryOpen(true)}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-border bg-widget-bg hover:bg-bg-subtle text-text text-[13px] font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Consulter l'annuaire universitaire"
            >
              <Icon icon="carbon:user-multiple" className="size-4 text-brand shrink-0" aria-hidden="true" />
              <span className="max-sm:hidden">Annuaire</span>
            </button>

            <button
              data-tour="mail-preferences-button"
              type="button"
              onClick={() => setPreferencesOpen(true)}
              className="inline-flex items-center justify-center size-10 rounded-full border border-border bg-widget-bg hover:bg-bg-subtle text-text shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Préférences d'envoi & Signature"
            >
              <Icon icon="carbon:settings-adjust" className="size-4.5" aria-hidden="true" />
            </button>
          </div>

          <SegmentedControl
            label="Filtrer les messages"
            value={filterMode}
            onChange={setFilterMode}
            className="self-start sm:self-auto shrink-0 border-white/60 dark:border-white/10"
            style={{
              WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
              backdropFilter: 'blur(20px) saturate(1.5)',
            }}
            options={[
              { value: 'all', label: 'Tous', count: `(${messages.length})` },
              { value: 'unread', label: 'Non lus', count: `(${messages.filter((m) => m.unread).length})` },
            ]}
          />
        </div>

        {/* Error message */}
        {error && (
          <StatusMessage
            icon="carbon:warning"
            title="Impossible de charger les e-mails"
            detail={error}
            action={
              <button
                type="button"
                onClick={() => void loadMessages(searchQuery, true)}
                className="rounded-full bg-brand px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 transition-opacity"
              >
                Réessayer
              </button>
            }
          />
        )}

        {/* Loading state */}
        {loading && !refreshing && (
          <div className="flex justify-center py-16">
            <LoadingDots label="Chargement de tes e-mails…" />
          </div>
        )}

        {/* Main Content Layout (Two-pane desktop, drill-down mobile) */}
        {!loading && !error && (
          <div className="flex gap-5 min-h-[560px] relative items-start">
            {/* Left Pane: Message List */}
            <div
              data-tour="mail-list"
              className={`w-full md:w-[380px] lg:w-[420px] shrink-0 flex flex-col gap-2 max-md:max-h-none md:max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] ${
                selectedId ? 'max-md:hidden' : 'block'
              }`}
            >
              {filteredMessages.length === 0 ? (
                <div className={`${CARD_CLASSES} p-8 text-center flex flex-col items-center justify-center gap-3 text-text-muted`}>
                  <Icon icon="carbon:email" className="size-10 opacity-30" />
                  <p className="m-0 font-body text-[15px] font-medium text-text">
                    {searchQuery ? 'Aucun e-mail ne correspond à ta recherche' : 'Aucun e-mail dans cette boîte'}
                  </p>
                  <p className="m-0 font-body text-[13px]">
                    {searchQuery ? 'Essaie avec d’autres mots-clés.' : 'Tous tes messages ont été traités.'}
                  </p>
                </div>
              ) : (
                <ul className="m-0 p-0 list-none flex flex-col gap-2" aria-label="Liste des e-mails">
                  {filteredMessages.map((message) => {
                    const isSelected = String(message.id) === String(selectedId)
                    const sender = getSenderLabel(message.from)
                    const receivedDate = parseDate(message.receivedAt)
                    const timeLabel = formatReceivedAt(receivedDate, now)

                    return (
                      <li key={message.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(message.id)}
                          className={`w-full text-left p-3.5 rounded-[18px] border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer relative ${
                            isSelected
                              ? 'border-brand bg-brand-subtle/80 dark:bg-zinc-900/70 shadow-md ring-2 ring-brand/50'
                              : 'border-white/60 dark:border-white/10 bg-widget-bg hover:border-border-hover hover:bg-bg-subtle'
                          }`}
                          style={{
                            WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
                            backdropFilter: 'blur(20px) saturate(1.5)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`size-2 rounded-full shrink-0 ${
                                  message.unread ? 'bg-blue-500' : 'opacity-0'
                                }`}
                                aria-label={message.unread ? 'Non lu' : undefined}
                              />
                              <span
                                className={`truncate text-[14px] leading-tight font-body ${
                                  message.unread ? 'font-bold text-text' : 'font-semibold text-text-secondary'
                                }`}
                              >
                                {sender}
                              </span>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 text-[12px] text-text-muted tabular-nums">
                              {isSelected && loadingDetail && (
                                <Icon icon="carbon:renew" className="size-3.5 animate-spin text-brand" aria-label="Chargement du message" />
                              )}
                              <span>{timeLabel}</span>
                            </div>
                          </div>

                          <div
                            className={`truncate text-[13.5px] leading-snug font-body ${
                              message.unread ? 'font-semibold text-text' : 'text-text-secondary'
                            }`}
                          >
                            {message.subject || '(Sans objet)'}
                          </div>

                          {message.snippet && (
                            <div className="line-clamp-2 text-[12px] leading-relaxed text-text-muted font-body">
                              {message.snippet}
                            </div>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Right Pane: Reading Pane */}
            <div
              data-tour="mail-preview"
              className={`flex-1 min-w-0 max-md:max-h-none md:max-h-[calc(100dvh-200px)] overflow-y-auto overscroll-contain [scrollbar-width:thin] ${
                selectedId ? 'block' : 'max-md:hidden'
              }`}
            >
              {selectedId ? (
                <article
                  className={`${CARD_CLASSES} p-6 max-md:p-4 flex flex-col gap-6 shadow-sm min-h-[500px] relative overflow-hidden`}
                  aria-label="Contenu de l'e-mail"
                >
                  {/* Top sleek loading bar when fetching detail */}
                  {loadingDetail && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand/10 overflow-hidden z-10">
                      <div className={`h-full w-full ${SHIMMER_CLASSES}`} />
                    </div>
                  )}
                  {/* Mobile Back Button */}
                  <div className="md:hidden pb-3 border-b border-border">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline"
                    >
                      <Icon icon="carbon:chevron-left" className="size-4" />
                      <span>Retour aux messages</span>
                    </button>
                  </div>

                  {selectedMessage ? (
                    <>
                      {/* Message Header */}
                      <header className="flex flex-col gap-4 pb-5 border-b border-border">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="m-0 text-[22px] leading-snug max-md:text-[18px] font-bold text-text break-words">
                            {selectedMessage.subject || '(Sans objet)'}
                          </h2>

                          {/* Top actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleReplyMessage}
                              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand text-[12px] font-semibold transition-colors shadow-2xs"
                              title="Répondre à cet e-mail"
                            >
                              <Icon icon="carbon:reply" className="size-3.5" />
                              <span className="max-xs:hidden">Répondre</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleToggleRead}
                              className="size-8 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
                              title={selectedMessage.unread ? 'Marquer comme lu' : 'Marquer comme non lu'}
                            >
                              <Icon
                                icon={selectedMessage.unread ? 'carbon:email' : 'carbon:email-new'}
                                className="size-4"
                              />
                            </button>
                            {effectiveWebmailHref && (
                              <a
                                href={effectiveWebmailHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="size-8 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
                                title="Ouvrir dans Partage / Zimbra"
                              >
                                <Icon icon="carbon:launch" className="size-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Sender & Recipient Bar */}
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 shadow-2xs"
                            style={{ backgroundColor: getAvatarColor(getSenderLabel(selectedMessage.from)) }}
                          >
                            {getInitials(getSenderLabel(selectedMessage.from))}
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-body text-[14px] font-bold text-text truncate">
                                {getSenderLabel(selectedMessage.from)}
                              </span>
                              {selectedMessage.from?.email && (
                                <button
                                  type="button"
                                  onClick={handleCopySender}
                                  className="font-body text-[12px] text-text-muted hover:text-text transition-colors flex items-center gap-1 group truncate"
                                  title="Copier l'adresse e-mail"
                                >
                                  <span>&lt;{selectedMessage.from.email}&gt;</span>
                                  <Icon
                                    icon={copiedAddress ? 'carbon:checkmark' : 'carbon:copy'}
                                    className="size-3 opacity-60 group-hover:opacity-100"
                                  />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[12px] text-text-muted font-body">
                              <span>À : moi</span>
                              <span>·</span>
                              <span>
                                {selectedMessage.receivedAt
                                  ? fullDateFormatter.format(new Date(selectedMessage.receivedAt))
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </header>

                      {/* Attachments (if any) - exclude signature images and inline graphics */}
                      {(() => {
                        const rawAtts = Array.isArray(selectedMessage.attachments) ? selectedMessage.attachments : []
                        const bodyContent = selectedMessage.bodyHtml || ''
                        const realAtts = rawAtts.filter((att) => {
                          if (!att || !att.filename) return false
                          const fn = att.filename.toLowerCase()
                          const ct = (att.contentType || '').toLowerCase()
                          if (/signature/i.test(fn)) return false
                          if (fn === 'téléchargement.png' || fn === 'logo.png') return false
                          if (/^image00\d\.(jpe?g|png|gif)$/i.test(fn) && (att.size || 0) < 60000) return false
                          if (ct.startsWith('image/') && att.contentId) return false
                          if (att.contentId && bodyContent.includes(att.contentId)) return false
                          return true
                        })

                        if (realAtts.length === 0) return null

                        return (
                          <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-bg-subtle/50">
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
                              <Icon icon="carbon:attachment" className="size-3.5" />
                              <span>{realAtts.length} pièce{realAtts.length > 1 ? 's' : ''} jointe{realAtts.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {realAtts.map((att, idx) => (
                                <a
                                  key={att.part || idx}
                                  href={att.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.filename}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-widget-bg hover:bg-bg-subtle text-[12px] font-medium text-text transition-colors no-underline shadow-2xs hover:border-brand/40"
                                  title={`Télécharger ${att.filename}`}
                                >
                                  <Icon icon="carbon:document" className="size-4 text-brand shrink-0" />
                                  <span className="truncate max-w-[200px]">{att.filename}</span>
                                  {att.size && <span className="text-text-muted tabular-nums">({formatBytes(att.size)})</span>}
                                  <Icon icon="carbon:download" className="size-3.5 text-text-muted ml-0.5 opacity-60 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Message Body */}
                      <div className="flex-1 min-h-[160px]">
                        {loadingDetail ? (
                          <div className="flex flex-col gap-5 py-4">
                            <div className="flex items-center gap-3 text-text-muted">
                              <LoadingDots label="Chargement du contenu complet…" />
                            </div>
                            <div className="flex flex-col gap-3 max-w-xl opacity-70">
                              <div className={`h-3.5 w-full rounded-md ${SHIMMER_CLASSES}`} />
                              <div className={`h-3.5 w-11/12 rounded-md ${SHIMMER_CLASSES}`} />
                              <div className={`h-3.5 w-4/5 rounded-md ${SHIMMER_CLASSES}`} />
                              <div className={`h-3.5 w-3/5 rounded-md ${SHIMMER_CLASSES}`} />
                              <div className={`h-3.5 w-2/3 rounded-md ${SHIMMER_CLASSES}`} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <EmailBodyViewer html={selectedMessage.bodyHtml} text={selectedMessage.bodyText} />

                            {/* Quick reply action bar at the bottom */}
                            <div className="pt-6 mt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleReplyMessage}
                                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-bg shadow-xs hover:opacity-90 transition-all cursor-pointer"
                              >
                                <Icon icon="carbon:reply" className="size-4" />
                                <span>Répondre à ce message</span>
                              </button>

                              {effectiveWebmailHref && (
                                <a
                                  href={effectiveWebmailHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-brand transition-colors"
                                >
                                  <span>Ouvrir dans Partage</span>
                                  <Icon icon="carbon:launch" className="size-3.5" />
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : loadingDetail ? (
                    <div className="flex flex-col gap-6 py-6 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-bg-muted" />
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="h-4 w-44 rounded bg-bg-muted" />
                          <div className="h-3 w-28 rounded bg-bg-subtle" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                        <LoadingDots label="Ouverture du message…" />
                      </div>
                    </div>
                  ) : null}
                </article>
              ) : (
                /* Desktop Placeholder when no message is selected */
                <div className={`${CARD_CLASSES} p-12 text-center flex flex-col items-center justify-center gap-3 text-text-muted min-h-[460px]`}>
                  <div className="size-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-1">
                    <Icon icon="carbon:email" className="size-8" />
                  </div>
                  <h3 className="m-0 font-body text-[17px] font-semibold text-text">
                    Sélectionne un e-mail
                  </h3>
                  <p className="m-0 font-body text-[13.5px] max-w-sm leading-relaxed">
                    Clique sur un message dans la liste à gauche pour afficher son contenu complet et ses pièces jointes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mail Composer Modal */}
      <MailComposeModal
        isOpen={composeState.isOpen}
        onClose={() => setComposeState((prev) => ({ ...prev, isOpen: false }))}
        initialTo={composeState.to}
        initialCc={composeState.cc}
        initialSubject={composeState.subject}
        initialBody={composeState.body}
        origId={composeState.origId}
        replyType={composeState.replyType}
        onSent={() => void loadMessages(searchQuery, true)}
      />

      {/* University Directory Modal */}
      <MailDirectoryModal
        isOpen={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        onSelectContact={handleSelectDirectoryContact}
      />

      {/* Email Preferences Modal */}
      <MailPreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />

      <PageGuidedTour
        storageKey="l-ent:tour:mail"
        steps={MAIL_TOUR_STEPS}
        manualTrigger={tourTrigger}
      />
    </section>
  )
}
