'use client'

import Link from 'next/link'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_OPEN_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  createCookieConsentChoice,
  parseCookieConsent,
  type CookieConsentChoice,
} from '@/lib/cookie-consent'

type ConsentCategories = Pick<CookieConsentChoice, 'analytics' | 'advertising'>

type CookieConsentContextValue = {
  choice: CookieConsentChoice | null
  ready: boolean
  openPreferences: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    return {
      choice: { version: 1, necessary: true, analytics: true, advertising: true, savedAt: Date.now() } as CookieConsentChoice,
      ready: true,
      openPreferences: () => {},
    }
  }
  return context
}

export function CookieConsent({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null)
  const [ready, setReady] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [draft, setDraft] = useState<ConsentCategories>({ analytics: false, advertising: false })
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let storedChoice: CookieConsentChoice | null = null
    try {
      storedChoice = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))
    } catch {
      // Storage can be unavailable in restricted browser modes; session state still works.
    }
    setChoice(storedChoice)
    setReady(true)
  }, [])

  function openPreferences() {
    setDraft({
      analytics: choice?.analytics ?? false,
      advertising: choice?.advertising ?? false,
    })
    setPreferencesOpen(true)
  }

  useEffect(() => {
    function handleOpenPreferences() {
      openPreferences()
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
        setChoice(parseCookieConsent(event.newValue))
      }
    }

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenPreferences)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenPreferences)
      window.removeEventListener('storage', handleStorage)
    }
  }, [choice])

  useEffect(() => {
    if (!preferencesOpen) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('button, input, a[href]')?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPreferencesOpen(false)
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [preferencesOpen])

  function save(categories: ConsentCategories) {
    const nextChoice = createCookieConsentChoice(categories)
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextChoice))
    } catch {
      // Keep the selection for this page session if persistence is blocked.
    }
    setChoice(nextChoice)
    setPreferencesOpen(false)
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: nextChoice }))
  }

  return (
    <CookieConsentContext.Provider value={{ choice, ready, openPreferences }}>
      {children}

      {ready && !choice && !preferencesOpen && (
        <section className="cookie-banner" role="region" aria-labelledby="cookie-banner-title" aria-live="polite">
          <div className="cookie-banner-copy">
            <h2 id="cookie-banner-title">Your privacy choices</h2>
            <p>
              We use necessary storage to run this site. With your permission, we also use analytics to understand site use and advertising tools to measure campaigns.{' '}
              <Link href="/cookies">Learn about cookies</Link>
            </p>
          </div>
          <div className="cookie-banner-actions">
            <button type="button" className="cookie-button cookie-button-secondary" onClick={() => save({ analytics: false, advertising: false })}>
              Reject optional
            </button>
            <button type="button" className="cookie-button cookie-button-secondary" onClick={openPreferences}>
              Preferences
            </button>
            <button type="button" className="cookie-button cookie-button-primary" onClick={() => save({ analytics: true, advertising: true })}>
              Accept all
            </button>
          </div>
        </section>
      )}

      {ready && choice && !preferencesOpen && (
        <button type="button" className="cookie-settings-control" onClick={openPreferences} aria-label="Open cookie preferences">
          Cookie settings
        </button>
      )}

      {ready && preferencesOpen && (
        <div className="cookie-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPreferencesOpen(false)}>
          <div ref={dialogRef} className="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title" aria-describedby="cookie-dialog-description">
            <div className="cookie-dialog-heading">
              <div>
                <h2 id="cookie-dialog-title">Cookie preferences</h2>
                <p id="cookie-dialog-description">Choose which optional technologies this site may use. You can change these choices at any time.</p>
              </div>
              <button type="button" className="cookie-dialog-close" onClick={() => setPreferencesOpen(false)} aria-label="Close cookie preferences">
                Close
              </button>
            </div>

            <div className="cookie-category-list">
              <label className="cookie-category">
                <span className="cookie-category-copy">
                  <strong>Necessary</strong>
                  <span>Required for core site functions and storing your privacy choice. These cannot be switched off.</span>
                </span>
                <input type="checkbox" checked disabled readOnly aria-label="Necessary cookies are always enabled" />
              </label>

              <label className="cookie-category">
                <span className="cookie-category-copy">
                  <strong>Analytics</strong>
                  <span>Allows Google Analytics and Google Tag Manager to measure anonymous site usage and performance.</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))}
                />
              </label>

              <label className="cookie-category">
                <span className="cookie-category-copy">
                  <strong>Advertising</strong>
                  <span>Allows Meta Pixel to measure advertising campaigns and attribution.</span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.advertising}
                  onChange={(event) => setDraft((current) => ({ ...current, advertising: event.target.checked }))}
                />
              </label>
            </div>

            <div className="cookie-dialog-links">
              <Link href="/cookies">Cookie policy</Link>
              <Link href="/privacy">Privacy policy</Link>
            </div>

            <div className="cookie-dialog-actions">
              <button type="button" className="cookie-button cookie-button-secondary" onClick={() => save({ analytics: false, advertising: false })}>
                Reject optional
              </button>
              <button type="button" className="cookie-button cookie-button-primary" onClick={() => save(draft)}>
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </CookieConsentContext.Provider>
  )
}
