'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, MailX, Loader2 } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'invalid_token' | 'manual_entry'>('loading')
  const [leadEmail, setLeadEmail] = useState<string | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('manual_entry')
      return
    }

    let active = true
    async function executeUnsubscribe() {
      try {
        const res = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token!)}`)
        const data = await res.json()
        if (!active) return

        if (res.ok && data.ok) {
          setStatus('success')
          setLeadEmail(data.email)
        } else {
          setStatus('invalid_token')
          setErrorMsg(data.error || 'Invalid or expired unsubscribe link.')
        }
      } catch {
        if (active) {
          setStatus('invalid_token')
          setErrorMsg('Network error while processing your request.')
        }
      }
    }

    void executeUnsubscribe()
    return () => {
      active = false
    }
  }, [token])

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualEmail.trim()) return

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setStatus('success')
        setLeadEmail(manualEmail.trim())
      } else {
        setErrorMsg(data.error || 'Failed to unsubscribe email address.')
      }
    } catch {
      setErrorMsg('Network error while submitting.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-[var(--border)] p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-6 text-[var(--brand-orange)]">
          {status === 'loading' ? (
            <Loader2 size={32} className="animate-spin text-[var(--brand-orange)]" />
          ) : status === 'success' ? (
            <CheckCircle2 size={32} className="text-green-600" />
          ) : status === 'invalid_token' ? (
            <AlertCircle size={32} className="text-amber-600" />
          ) : (
            <MailX size={32} />
          )}
        </div>

        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Processing Unsubscribe...
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Updating your email communication preferences.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Unsubscribed Successfully
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              {leadEmail ? (
                <>
                  <strong className="text-[var(--text-primary)]">{leadEmail}</strong> has been removed from all marketing and broadcast email communications.
                </>
              ) : (
                'You have been unsubscribed from our marketing mailing lists.'
              )}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mb-8">
              Please note: You may still receive critical transactional emails regarding active customer engagements.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] font-semibold text-sm transition-colors"
            >
              Return to Homepage
            </Link>
          </>
        )}

        {status === 'invalid_token' && (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Link Expired or Invalid
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              {errorMsg || 'The unsubscribe link provided is invalid or expired. You can enter your email below to opt out.'}
            </p>
            <button
              type="button"
              onClick={() => setStatus('manual_entry')}
              className="w-full py-2.5 rounded-full bg-[var(--brand-orange)] text-white text-sm font-semibold hover:bg-opacity-90 transition-colors cursor-pointer mb-3"
            >
              Enter Email Manually
            </button>
            <Link
              href="/"
              className="inline-block text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Return to Homepage
            </Link>
          </>
        )}

        {status === 'manual_entry' && (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Email Unsubscribe
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              Enter your email address below to opt out of GCC Startup marketing announcements and updates.
            </p>
            {errorMsg && <p className="text-xs text-red-600 mb-3">{errorMsg}</p>}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--brand-orange)]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-full bg-[var(--brand-navy)] text-white text-sm font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Unsubscribe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-[var(--border)] p-8 shadow-sm text-center">
          <Loader2 size={32} className="animate-spin text-[var(--brand-orange)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Loading...</h1>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
