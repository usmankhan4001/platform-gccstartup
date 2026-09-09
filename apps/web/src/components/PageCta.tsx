'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Input, Textarea, Eyebrow } from '@/components/ui'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

export type PageCtaProps = {
  eyebrow?: string
  headline: string
  description?: string
  /** Tags the lead so it's identifiable in the leads collection, e.g. "Country Page: UAE". */
  source: string
  /** Pre-fills the lead's `interest` field, e.g. the country/service/tier name. */
  interest?: string
}

/** Shared, working per-page CTA — country/service/pricing/blog templates aren't Puck-composed,
 * so they can't drop in the GlobalCta/LeadForm Puck blocks. This is a plain React equivalent:
 * a real inline lead-capture form (not just a button pointing at a dead #lead-form anchor),
 * with copy interpolated per page so it reads as relevant rather than generic/copy-pasted. */
export function PageCta({ eyebrow = 'Get started', headline, description, source, interest }: PageCtaProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const data = buildLeadPayload(e.currentTarget)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, interest, source, page: window.location.pathname, ...getStoredAttribution() }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="section" id="lead-form">
      <div className="wrap">
        <div className="cta-split">
          <div className="cta-split-panel">
            <span className="cta-blink-tag" style={{ borderColor: '#fff', color: '#fff', width: 'fit-content' }}>
              {eyebrow}
            </span>
            <h2 style={{ color: '#fff' }}>{headline}</h2>
            {description && <p style={{ color: 'rgba(255,255,255,.85)', marginTop: 'var(--space-3)' }}>{description}</p>}
          </div>

          <div className="cta-split-form">
            {status === 'success' ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={40} color="var(--success)" strokeWidth={1.75} aria-hidden style={{ margin: '0 auto' }} />
                <h3 style={{ marginTop: 'var(--space-4)' }}>Thank you!</h3>
                <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  We&apos;ve received your enquiry and will reply within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <Eyebrow>Free consultation</Eyebrow>
                <h3>Talk to a specialist</h3>
                <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                  No obligation, no sales script — just a clear answer.
                </p>
                <Input label="Full name *" name="name" required placeholder="Your name" />
                <Input label="Email *" name="email" type="email" required placeholder="you@email.com" />
                <Input label="WhatsApp / phone" name="phone" placeholder="+ country code" />
                <Textarea label="Message (optional)" name="message" placeholder="Tell us a bit about your situation…" rows={3} />
                <LeadFormMeta emailConsent />
                {status === 'error' && (
                  <p style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
                    Something went wrong — please try again or WhatsApp us directly.
                  </p>
                )}
                <button type="submit" className="btn btn-primary w-full flex-center" disabled={status === 'submitting'} style={{ marginTop: 'var(--space-2)' }}>
                  {status === 'submitting' ? 'Sending…' : 'Send my enquiry'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                  🔒 Confidential. No spam. We reply within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
