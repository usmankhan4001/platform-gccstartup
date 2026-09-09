'use client'

import * as React from 'react'

/**
 * Registers the service worker and surfaces an "Add to Home Screen" prompt.
 *
 * Registration is best-effort: a failed SW must never break the app, and it is
 * skipped entirely in development where a cached shell causes confusing stale
 * renders during iteration.
 */
export function PwaProvider() {
  const [installEvent, setInstallEvent] = React.useState<any>(null)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is a progressive enhancement — never surface this.
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })

    return () => window.removeEventListener('load', register)
  }, [])

  React.useEffect(() => {
    const onBeforeInstall = (event: any) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!installEvent || dismissed) return null

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-xl border border-[var(--border)] bg-white p-3 shadow-lg lg:bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0A142F] text-[10px] font-bold text-white">
          GCC
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text)]">Install GCC Startup</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            Add to your home screen for full-screen access to deals and inbox.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          Not now
        </button>
        <button
          onClick={async () => {
            await installEvent.prompt()
            setInstallEvent(null)
          }}
          className="rounded-md bg-[#F26522] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
        >
          Install
        </button>
      </div>
    </div>
  )
}
