'use client'

import { useEffect, useState } from 'react'
import { getStoredAttribution } from '@/lib/attribution'
import { buildLeadPayload, LeadFormMeta } from '@/components/LeadFormMeta'

/** Floating site-wide WhatsApp widget — ported from the original
 * embeds/4-whatsapp-chat-bubble.html WordPress widget (tooltip → auto-open →
 * simulated typing → name/phone capture → real wa.me handoff), restyled onto
 * the design-system tokens and wired to this site's own /api/lead instead of
 * the old CMS endpoint. Mounted once in the root layout. */
export function WhatsAppWidget({ phoneDigits }: { phoneDigits: string }) {
  const [open, setOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [typing, setTyping] = useState(true)
  const [msg1, setMsg1] = useState(false)
  const [msg2, setMsg2] = useState(false)
  const [showFields, setShowFields] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    setTyping(true)
    setMsg1(false)
    setMsg2(false)
    const t1 = setTimeout(() => {
      setTyping(false)
      setMsg1(true)
    }, 900)
    const t2 = setTimeout(() => setMsg2(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [open])

  function toggle() {
    setShowTooltip(false)
    setOpen((o) => !o)
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setSending(true)
    setSaveFailed(false)
    const eventId = `wa-widget-${Date.now()}`
    const body = JSON.stringify({
      name,
      phone,
      interest: 'WhatsApp Chat',
      source: 'WhatsApp Widget',
      page: window.location.href,
      eventId,
      ...buildLeadPayload(e.currentTarget),
      ...getStoredAttribution(),
    })

    // Hand off to WhatsApp first, while we are still inside the click's user-gesture
    // window. Awaiting the lead write before this pushed window.open() outside that
    // window, where popup blockers silently drop it — the visitor filled in the form
    // and simply never arrived at WhatsApp.
    const text = `Hi GCC Startup! I'd like to know the best jurisdiction for my business. My name is ${name}.`
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setSending(false)
    setSent(true)

    // keepalive lets the write finish even though the tab just lost focus. The
    // failure state is still surfaced, it just no longer gates the handoff.
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      .then((res) => {
        if (!res.ok) setSaveFailed(true)
      })
      .catch(() => setSaveFailed(true))
  }

  return (
    <>
      <div className="wa-bubble">
        {showTooltip && !open && (
          <div className="wa-tooltip" onClick={toggle} role="button" tabIndex={0}>
            👋 Chat with a GCC expert
          </div>
        )}
        <button className="wa-bubble-btn" onClick={toggle} aria-label="Chat on WhatsApp">
          <span className="wa-bubble-pulse" aria-hidden />
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="wa-panel">
          <div className="wa-panel-head">
            <div className="wa-panel-avatar">
              🧑💼
              <span className="wa-panel-online" aria-hidden />
            </div>
            <div style={{ flex: 1 }}>
              <div className="wa-panel-name">GCC Startup</div>
              <div className="wa-panel-status">● Online now</div>
            </div>
            <button className="wa-panel-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="wa-panel-body">
            {typing && (
              <div className="wa-typing" aria-hidden>
                <span /> <span /> <span />
              </div>
            )}
            {msg1 && <div className="wa-msg">Hey! 👋 Thinking about setting up in the UAE or GCC?</div>}
            {msg2 && <div className="wa-msg">I can help you pick the right jurisdiction in under 10 minutes. What's your name?</div>}
          </div>
          {!sent ? (
            !showFields ? (
              <div className="wa-panel-form">
                <button className="wa-panel-send" onClick={() => setShowFields(true)} type="button">
                  Reply…
                </button>
              </div>
            ) : (
              <form className="wa-panel-form" onSubmit={submit}>
                <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input placeholder="WhatsApp number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <LeadFormMeta />
                <button className="wa-panel-send" type="submit" disabled={sending}>
                  {sending ? 'Connecting…' : 'Start chatting →'}
                </button>
              </form>
            )
          ) : (
            <div className="wa-panel-form">
              <div className="wa-msg">Perfect {name.split(' ')[0]}! 🎉 Opening WhatsApp now.</div>
              {saveFailed && <div className="wa-msg">WhatsApp opened, but we could not save your details. Please send the message there so we can help.</div>}
            </div>
          )}
        </div>
      )}
    </>
  )
}
