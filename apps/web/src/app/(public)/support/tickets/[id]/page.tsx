'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Textarea } from '@/components/ui/Input'
import '../../support.css'

type Ticket = {
  id: string
  ticket_number?: string | null
  subject?: string | null
  status?: string | null
  priority?: string | null
  date_created?: string
  date_updated?: string
}

type TicketMessage = {
  id: string
  author_type?: 'customer' | 'staff' | null
  body?: string | null
  date_created?: string
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [ticketId, setTicketId] = useState<string | null>(null)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])

  const [state, setState] = useState<'loading' | 'signedout' | 'notfound' | 'ready'>('loading')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then((value) => setTicketId(value.id))
  }, [params])

  useEffect(() => {
    if (!ticketId) return
    setState('loading')
    fetch(`/api/portal/tickets/${ticketId}/messages`)
      .then(async (res) => {
        if (res.status === 401) {
          setState('signedout')
          return
        }
        if (res.status === 404) {
          setState('notfound')
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        const data = (await res.json()) as { ticket: Ticket; messages: TicketMessage[] }
        setTicket(data.ticket)
        setMessages(data.messages)
        setState('ready')
      })
      .catch(() => setState('notfound'))
  }, [ticketId])

  function formatWhen(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  function sendReply(event: React.FormEvent) {
    event.preventDefault()
    const body = reply.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    fetch(`/api/portal/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          setError(data?.error || 'Could not send your message.')
          return
        }
        const data = (await res.json()) as { message: TicketMessage }
        setMessages((prev) => [...prev, data.message])
        setReply('')
      })
      .catch(() => setError('Could not send your message. Please try again.'))
      .finally(() => setSending(false))
  }

  return (
    <main className="site-main">
      <section className="support-hero">
        <div className="wrap">
          <p className="eyebrow" style={{ color: 'var(--orange)' }}>Support portal</p>
          <h1>{ticket?.subject || 'Ticket details'}</h1>
          {ticket && <p>{ticket.ticket_number} · {ticket.status || 'open'} · {ticket.priority || 'normal'}</p>}
        </div>
      </section>

      <div className="support-stack">
        <Link href="/support" className="support-back"><ArrowLeft size={16} />Back to my tickets</Link>

        {state === 'loading' && <div className="support-panel" style={{ textAlign: 'center' }}>Loading…</div>}
        {state === 'signedout' && (
          <div className="support-panel">
            <h2>Sign in to view this ticket</h2>
            <p className="subtitle">You need to verify your email to read and reply to your tickets.</p>
            <Link className="btn btn-primary" href="/support">Sign in</Link>
          </div>
        )}
        {state === 'notfound' && (
          <div className="support-panel">
            <h2>Ticket not found</h2>
            <p className="subtitle">This ticket does not exist or does not belong to your account.</p>
            <Link className="btn btn-outline" href="/support">Back to my tickets</Link>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="support-thread">
              {messages.length === 0 && <div className="support-ticket-empty">No messages yet.</div>}
              {messages.map((message) => (
                <article key={message.id} className={`support-msg ${message.author_type === 'staff' ? 'staff' : ''}`}>
                  <div className="head">
                    <strong>{message.author_type === 'staff' ? 'GCC Startup' : 'You'}</strong>
                    <span>{formatWhen(message.date_created)}</span>
                  </div>
                  <p>{message.body}</p>
                </article>
              ))}
            </div>

            <section className="support-panel">
              <h2>Add a reply</h2>
              <form onSubmit={sendReply}>
                <Textarea label="Your message" id="ticket-reply" rows={4} maxLength={5000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Add any more detail or ask a follow-up." />
                {error && <p className="support-error">{error}</p>}
                <button className="btn btn-primary" type="submit" disabled={sending || !reply.trim()}>{sending ? 'Sending…' : 'Send reply'}</button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  )
}