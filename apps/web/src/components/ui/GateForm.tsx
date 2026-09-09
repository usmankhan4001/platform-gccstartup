'use client'

import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type GateFormProps = {
  /** Identifies which of the 15 lead-magnet tools this submission came from, e.g. "tax-leakage-calculator". */
  toolSlug: string
  /** Raw Q&A + computed result, stored on the lead's `answers` JSON field. */
  answers: Record<string, unknown>
  submitLabel?: string
  requirePhone?: boolean
  onSuccess: () => void
}

/** Shared email-gate step: every lead-magnet tool collects answers, computes a result, then
 * requires this form before revealing it — the actual lead capture, tied to the computed
 * result, that none of the pre-existing interactive tools (InteractiveTools/JurisdictionQuiz/
 * ComparisonTool) do today. */
export function GateForm({ toolSlug, answers, submitLabel = 'Show my result', requirePhone, onSuccess }: GateFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')

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
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          toolSlug,
          answers,
          ...getStoredAttribution(),
        }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Enter your email to see your personalized result</div>
      <Input label="Full name" name="name" placeholder="Your name" />
      <Input label="Email *" name="email" type="email" required placeholder="you@email.com" />
      {requirePhone && <Input label="WhatsApp / phone" name="phone" placeholder="+ country code" />}
      <LeadFormMeta emailConsent />
      {status === 'error' && (
        <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>Something went wrong — please try again.</p>
      )}
      <Button type="submit" disabled={status === 'submitting'} className="w-full flex-center">
        {status === 'submitting' ? 'Submitting…' : submitLabel}
      </Button>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
        🔒 Confidential. No spam.
      </p>
    </form>
  )
}
