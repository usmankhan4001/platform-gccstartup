'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Send } from 'lucide-react'
import { Input } from './Input'
import { GateForm } from './GateForm'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

type Props = {
  /** When true the result is withheld until an email is given. When false the result
   * shows immediately and the email becomes an optional offer underneath it. */
  gated: boolean
  /** Which tool this is, e.g. "tax-leakage-calculator". Written to `leads.source`. */
  toolSlug: string
  /** Raw answers + computed result, stored on the lead's `answers` JSON field. */
  answers: Record<string, unknown>
  /** The tool's own <ResultCard>. */
  children: ReactNode
}

/**
 * Decides whether a lead-magnet tool withholds its result.
 *
 * Every tool used to hard-gate: "Enter your email to see your personalized result."
 * Fifteen of them shipped that way, twelve on a single landing page, which meant a
 * visitor could be asked for their email a dozen times before being shown anything
 * useful. Gating is now a per-placement editor choice, and the default is ungated —
 * the tool proves its worth first and *offers* to email the result, rather than
 * holding it hostage.
 *
 * Keeping the decision here rather than in each tool means the fifteen tools stay
 * identical in shape and the policy can change in one place.
 */
export function ResultGate({ gated, toolSlug, answers, children }: Props) {
  const [revealed, setRevealed] = useState(!gated)

  if (!revealed) {
    return <GateForm toolSlug={toolSlug} answers={answers} onSuccess={() => setRevealed(true)} />
  }

  return (
    <>
      {children}
      {!gated && <ResultEmailOffer toolSlug={toolSlug} answers={answers} />}
    </>
  )
}

/** The ungated ask: understated by design, so it reads as a convenience rather than
 * a toll gate on a result the visitor can already see. */
function ResultEmailOffer({ toolSlug, answers }: { toolSlug: string; answers: Record<string, unknown> }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: `lead-magnet:${toolSlug}`,
          page: window.location.pathname,
          toolSlug,
          answers,
          ...getStoredAttribution(),
        }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="result-offer-done">
        <Check size={16} aria-hidden /> Sent — check your inbox.
      </p>
    )
  }

  return (
    <form className="result-offer" onSubmit={onSubmit}>
      <p className="result-offer-prompt">Want this emailed to you?</p>
      <div className="result-offer-row">
        <Input name="email" type="email" required aria-label="Email address" placeholder="you@email.com" />
        <button type="submit" className="btn btn-outline" disabled={status === 'submitting'}>
          <Send size={15} aria-hidden />
          {status === 'submitting' ? 'Sending…' : 'Email it'}
        </button>
      </div>
      <LeadFormMeta emailConsent />
      {status === 'error' && <p className="result-offer-error">Something went wrong — please try again.</p>}
    </form>
  )
}
