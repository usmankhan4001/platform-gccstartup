'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Gift, X } from 'lucide-react'
import { Eyebrow, Input } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

/** Once-per-session flag so a visitor is never interrupted twice, whether they
 * closed it, submitted it, or it simply never fired. Same sessionStorage
 * approach used elsewhere in this codebase for one-shot UI (e.g. the WhatsApp
 * widget's tooltip). */
const SEEN_KEY = 'gcc_exit_modal_seen'

// Mobile has no mouse, so exit-intent (mouseleave toward the chrome) can't
// fire — instead we infer "about to bounce" from a scroll-depth + dwell-time
// heuristic once both thresholds are crossed.
const MOBILE_SCROLL_DEPTH = 0.5
const MOBILE_DWELL_MS = 20_000

function hasSeenModal() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markModalSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Non-blocking — private browsing etc. may block storage; worst case it can re-show.
  }
}

/** Site-wide exit-intent lead capture — offers the free 2026 Tax Optimization
 * Guide (same lead magnet as TaxGuideCta) to visitors who look like they're
 * about to leave without converting. Desktop trigger: mouseleave toward the
 * browser chrome (clientY <= 0). Mobile/touch trigger: scrolled past 50% of
 * the page and dwelled 20+ seconds, since exit-intent-by-mouse doesn't exist
 * on touch devices. Fires at most once per session either way. Mounted once
 * in the root layout, alongside WhatsAppWidget/MobileCtaBar. */
export function ExitIntentModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const firedRef = useRef(false)

  function trigger() {
    if (firedRef.current || hasSeenModal()) return
    firedRef.current = true
    markModalSeen()
    setOpen(true)
  }

  // Desktop: classic exit-intent via mouseleave toward the top of the viewport.
  useEffect(() => {
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) trigger()
    }
    document.addEventListener('mouseleave', onMouseLeave)
    return () => document.removeEventListener('mouseleave', onMouseLeave)
  }, [])

  // Mobile/touch: no mouse to leave the viewport, so infer intent from
  // engagement instead — scrolled past the halfway point AND stuck around
  // for a while, which reads as "browsing but not converting."
  useEffect(() => {
    const startedAt = Date.now()
    let scrolledPastHalf = false

    function checkScroll() {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const depth = scrollable > 0 ? doc.scrollTop / scrollable : 0
      if (depth >= MOBILE_SCROLL_DEPTH) scrolledPastHalf = true
      maybeTrigger()
    }

    function maybeTrigger() {
      if (scrolledPastHalf && Date.now() - startedAt >= MOBILE_DWELL_MS) trigger()
    }

    window.addEventListener('scroll', checkScroll, { passive: true })
    const t = setInterval(maybeTrigger, 2000)
    return () => {
      window.removeEventListener('scroll', checkScroll)
      clearInterval(t)
    }
  }, [])

  // Escape key dismisses, same as clicking the scrim/close button.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          interest: 'Tax Optimization Guide',
          source: 'Exit Intent Modal',
          page: window.location.href,
          eventId: `exit-intent-${Date.now()}`,
          ...data,
          ...getStoredAttribution(),
        }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div className="exit-modal-scrim" onClick={() => setOpen(false)}>
      <div className="exit-modal" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title" onClick={(e) => e.stopPropagation()}>
        <button className="exit-modal-close" onClick={() => setOpen(false)} aria-label="Close">
          <X size={18} aria-hidden />
        </button>

        {status === 'success' ? (
          <div className="exit-modal-success">
            <Gift size={40} strokeWidth={1.25} aria-hidden />
            <h3>Your guide is on its way!</h3>
            <p>We&apos;ll send the 2026 Tax Optimization Guide to {email} — a specialist will follow up if you have questions.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <Eyebrow>Before you go</Eyebrow>
            <h3 id="exit-modal-title">Get the free 2026 Tax Optimization Guide</h3>
            <p className="exit-modal-pitch">
              The exact playbook we use to help founders pay 0% legally — UAE, Bahrain, Hong Kong, Singapore &amp; Ireland compared,
              with step-by-step costs and timelines. Grab it before you go, no cost, no obligation.
            </p>
            <Input label="Full name *" name="name" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Email *"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <LeadFormMeta emailConsent />
            {status === 'error' && <p className="exit-modal-error">Something went wrong — please try again.</p>}
            <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
              {status === 'submitting' ? 'Sending…' : 'Send Me the Free Guide'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
