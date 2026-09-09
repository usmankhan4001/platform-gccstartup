'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Input, Select, Textarea } from '@/components/ui'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'
import { getStoredAttribution } from '@/lib/attribution'
import styles from './PublicHub.module.css'

type SubmitState = 'idle' | 'submitting' | 'received' | 'received-delayed' | 'error'

type LeadResponse = {
  error?: string
  persisted?: boolean
}

export function ConsultationRequestForm({
  source = 'Website Form',
  countries = [],
  interests = [],
  bookingContext = false,
  submitLabel,
}: {
  source?: string
  countries?: string[]
  interests?: string[]
  bookingContext?: boolean
  submitLabel?: string
}) {
  const [state, setState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')
  const feedbackRef = useRef<HTMLDivElement>(null)

  function announce(nextState: SubmitState, nextMessage: string) {
    setState(nextState)
    setMessage(nextMessage)
    window.setTimeout(() => feedbackRef.current?.focus(), 0)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    setMessage('')

    const payload = buildLeadPayload(event.currentTarget)
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, source, page: window.location.pathname, ...getStoredAttribution() }),
      })
      const result = (await response.json().catch(() => ({}))) as LeadResponse

      if (response.ok) {
        announce('received', bookingContext
          ? 'Your consultation request has been received. A specialist will contact you to agree a time; no appointment is confirmed yet.'
          : 'Your request has been received. A specialist will review it and reply with the next step.')
        return
      }

      if (result.persisted === true) {
        announce('received-delayed', 'Your request was saved, but our confirmation system is delayed. You do not need to submit it again; a specialist can still review it.')
        return
      }

      const retryMessage = response.status >= 500
        ? 'The request could not be saved because the service is temporarily unavailable. Please try again, or use the contact details on this page.'
        : 'The request could not be submitted. Check the required fields and verification, then try again.'
      announce('error', retryMessage)
    } catch {
      announce('error', 'The request could not reach our service and was not confirmed as saved. Check your connection and try again.')
    }
  }

  if (state === 'received' || state === 'received-delayed') {
    return (
      <div
        ref={feedbackRef}
        className={state === 'received' ? styles.successPanel : `${styles.successPanel} ${styles.formStatusDelayed}`}
        role="status"
        tabIndex={-1}
      >
        <span className="eyebrow">Request received</span>
        <h2>{state === 'received' ? 'We have your details.' : 'Saved, with a delivery delay.'}</h2>
        <p>{message}</p>
        <p><Link href="/resources" className={styles.textLink}>Review our formation resources while you wait</Link>.</p>
      </div>
    )
  }

  return (
    <div className={styles.leadFormCard}>
      <div className={styles.formIntro}>
        <span className="eyebrow">Consultation request</span>
        <h2>{bookingContext ? 'Tell us what you need to discuss' : 'Send your request'}</h2>
        <p>{bookingContext
          ? 'This form requests a consultation. Your time is only agreed after a specialist contacts you.'
          : 'Share enough context for us to route your enquiry to the right specialist.'}</p>
      </div>
      <form onSubmit={onSubmit} aria-describedby="lead-form-privacy">
        <div className={styles.formGrid}>
          <Input label="Full name *" name="name" autoComplete="name" required maxLength={160} placeholder="Your full name" />
          <Input label="Work email *" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={320} placeholder="you@company.com" />
          <Input label="Phone or WhatsApp" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={80} placeholder="Include country code" />
          <Select label="Jurisdiction of interest" name="country" defaultValue="">
            <option value="">Not sure yet</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </Select>
          <div className={styles.formWide}>
            <Select label="What do you need help with?" name="interest" defaultValue="Company formation">
              <option value="Company formation">Company formation</option>
              {interests.filter((item) => item !== 'Company formation').map((interest) => <option key={interest} value={interest}>{interest}</option>)}
              <option value="Not sure">Not sure, I need guidance</option>
            </Select>
          </div>
          <div className={styles.formWide}>
            <Textarea
              label="Business context *"
              name="message"
              required
              maxLength={5000}
              rows={6}
              placeholder="Tell us where you live, what the company will do, target markets, owners, timing, and any banking or residency needs."
            />
          </div>
        </div>
        <LeadFormMeta emailConsent />
        {state === 'error' && (
          <div ref={feedbackRef} className={styles.formStatus} role="alert" tabIndex={-1}>{message}</div>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Sending request...' : submitLabel || (bookingContext ? 'Request my consultation' : 'Send consultation request')}
        </button>
        <p id="lead-form-privacy" className={styles.formNote}>
          Submitting sends a consultation request, not a confirmed engagement or calendar booking. We use your details to respond to this enquiry. See our <Link href="/privacy" className={styles.textLink}>privacy notice</Link>.
        </p>
      </form>
    </div>
  )
}
