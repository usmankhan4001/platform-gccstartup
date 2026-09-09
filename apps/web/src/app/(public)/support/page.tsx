'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Input, Textarea, Select } from '@/components/ui/Input'
import './support.css'

type Ticket = {
  id: string
  ticket_number?: string | null
  subject?: string | null
  status?: string | null
  priority?: string | null
  date_created?: string
  date_updated?: string
}

type Faq = { id: string; question?: string; answer?: string }

const PRIORITIES = ['low', 'normal', 'high', 'urgent']

function statusLabel(status?: string | null) {
  return status || 'open'
}

export default function SupportPage() {
  const [view, setView] = useState<'loading' | 'login' | 'dashboard'>('loading')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])

  // OTP flow
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpResponse, setOtpResponse] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Create ticket flow
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function loadTickets() {
    const res = await fetch('/api/portal/tickets')
    if (!res.ok) throw new Error('unauthorized')
    const data = (await res.json()) as { tickets: Ticket[] }
    setTickets(data.tickets)
  }

  useEffect(() => {
    fetch('/api/portal/faq')
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { faqs: Faq[] }
        setFaqs(data.faqs)
      })
      .catch(() => {})

    loadTickets()
      .then(() => setView('dashboard'))
      .catch(() => setView('login'))
  }, [])

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await fetch('/api/portal/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setOtpSent(true)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/portal/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error || 'That code did not work. Try again.')
        return
      }
      await loadTickets()
      setOtpSent(false)
      setCode('')
      setView('dashboard')
    } finally {
      setBusy(false)
    }
  }

  async function createTicket(event: React.FormEvent) {
    event.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, priority }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setCreateError(data?.error || 'Could not create your ticket.')
        return
      }
      setSubject('')
      setBody('')
      setPriority('normal')
      await loadTickets()
    } finally {
      setCreating(false)
    }
  }

  if (view === 'loading') {
    return (
      <main className="site-main">
        <section className="support-hero"><div className="wrap"><h1>Customer Support</h1></div></section>
        <div className="support-stack"><div className="support-panel" style={{ textAlign: 'center' }}>Loading…</div></div>
      </main>
    )
  }

  return (
    <main className="site-main">
      <section className="support-hero">
        <div className="wrap">
          <p className="eyebrow" style={{ color: 'var(--orange)' }}>Support portal</p>
          <h1>We&apos;re here when you need us.</h1>
          <p>Raise a ticket, follow its progress, and talk to a real GCC Startup specialist. Your conversation is kept in one place.</p>
        </div>
      </section>

      <div className="support-stack">
        {view === 'login' && (
          <section className="support-panel" aria-labelledby="signin-title">
            <h2 id="signin-title">Sign in to your support portal</h2>
            <p className="subtitle">Enter your email and we&apos;ll send you a one-time code.</p>
            <form onSubmit={requestOtp}>
              <Input label="Email address" id="support-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
            </form>
            {otpSent && (
              <>
                <div className="support-otp-note">If that email has an account, a code was sent. It expires in 10 minutes.</div>
                <form onSubmit={verifyOtp} style={{ marginTop: 'var(--space-5)' }}>
                  <Input label="One-time code" id="support-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required />
                  {error && <p className="support-error">{error}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify & sign in'}</button>
                    <button className="btn btn-outline" type="button" onClick={() => { setOtpSent(false); setEmail(''); setCode('') }}>Start over</button>
                  </div>
                </form>
              </>
            )}
          </section>
        )}

        {view === 'dashboard' && (
          <>
            <section className="support-panel" aria-labelledby="my-tickets-title">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <h2 id="my-tickets-title">My tickets</h2>
                <Link href="/support" className="support-back" style={{ marginBottom: 0 }}>Refresh</Link>
              </div>
              {tickets.length === 0 ? (
                <div className="support-ticket-empty">You have no open tickets yet. Create one below and we&apos;ll get back to you.</div>
              ) : (
                <div className="support-ticket-list">
                  {tickets.map((ticket) => (
                    <Link key={ticket.id} href={`/support/tickets/${ticket.id}`} className="support-ticket-link">
                      <span className="tn">{ticket.ticket_number || ticket.id}</span>
                      <span className="subject">{ticket.subject || 'Untitled'}</span>
                      <span className="meta">{statusLabel(ticket.status)} · {ticket.priority || 'normal'} · updated {(ticket.date_updated || ticket.date_created || '').slice(0, 10)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="support-panel" aria-labelledby="new-ticket-title">
              <h2 id="new-ticket-title">Open a new ticket</h2>
              <p className="subtitle">Tell us what you need and we&apos;ll respond by email and here in the portal.</p>
              <form onSubmit={createTicket}>
                <Input label="Subject" id="ticket-subject" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Question about my company renewal" />
                <Textarea label="Message" id="ticket-body" required rows={5} maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Describe the issue or question in as much detail as you can." />
                <Select label="Priority" id="ticket-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </Select>
                {createError && <p className="support-error">{createError}</p>}
                <button className="btn btn-primary" type="submit" disabled={creating}>{creating ? 'Submitting…' : 'Open ticket'}</button>
              </form>
            </section>
          </>
        )}

        {faqs.length > 0 && (
          <section className="support-panel" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
            <div className="support-faq">
              {faqs.map((item) => (
                <details key={item.id}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}