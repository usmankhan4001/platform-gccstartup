'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Lock, Send, X } from 'lucide-react'
import { getStoredAttribution } from '@/lib/attribution'

export interface LeadCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  toolSlug: string
  toolTitle: string
  calculatorData?: Record<string, unknown>
  estimatedValue?: number
  defaultCountry?: string
  /** Target jurisdiction, when the tool knows it. Drives desk routing and deal value
   * server-side, so passing it through is what puts a KSA lead on the Riyadh desk. */
  jurisdiction?: string
}

/** Normalises a typed phone number to E.164 before submission.
 *
 * The API normalises server-side too, but doing it here means we can reject an
 * unusable number while the user is still looking at the field rather than accepting
 * the lead and discovering later that nobody can call them back. Mirrors the server
 * rules in api/lead/submit so the two never disagree about what is valid. */
export function toE164(raw: string): string | null {
  const cleaned = raw.trim().replace(/[^\d+]/g, '')
  if (!cleaned) return null

  let normalized = cleaned.replace(/^00/, '+')

  // UAE local mobile formats: 0501234567 and 501234567 both mean +971501234567.
  if (/^05\d{8}$/.test(normalized)) return `+971${normalized.slice(1)}`
  if (/^5\d{8}$/.test(normalized)) return `+971${normalized}`

  if (!normalized.startsWith('+')) normalized = `+${normalized}`

  // A '+' plus at least 7 digits is the shortest real E.164 number.
  return /^\+\d{7,15}$/.test(normalized) ? normalized : null
}

/** Maps the camelCase attribution kept in sessionStorage onto the snake_case keys the
 * lead endpoint reads. Without this the UTM values are captured on landing and then
 * silently dropped at submission. */
function attributionPayload(): Record<string, string | number> {
  const stored = getStoredAttribution()
  const mapped: Record<string, string | number> = {}
  if (stored.utmSource) mapped.utm_source = stored.utmSource
  if (stored.utmMedium) mapped.utm_medium = stored.utmMedium
  if (stored.utmCampaign) mapped.utm_campaign = stored.utmCampaign
  if (stored.utmTerm) mapped.utm_term = stored.utmTerm
  if (stored.utmContent) mapped.utm_content = stored.utmContent
  return mapped
}

export function LeadCaptureModal({
  isOpen,
  onClose,
  toolSlug,
  toolTitle,
  calculatorData,
  estimatedValue = 4800,
  defaultCountry = 'UAE',
  jurisdiction,
}: LeadCaptureModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalizedPhone = toE164(phone)
    if (!normalizedPhone) {
      setError('Enter a valid phone number including your country code, for example +971 50 123 4567.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: normalizedPhone,
          company,
          source: `tool_${toolSlug}`,
          tool_slug: toolSlug,
          country: jurisdiction || defaultCountry,
          jurisdiction: jurisdiction || defaultCountry,
          estimated_value: estimatedValue,
          ...attributionPayload(),
          calculator_data: {
            ...calculatorData,
            tool_title: toolTitle,
          },
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        return
      }

      // Surface a failure instead of silently re-enabling the button, which read as a
      // dead form and lost the lead entirely.
      const detail = await res.json().catch(() => null)
      console.error('[LeadCaptureModal] submission rejected', res.status, detail)
      setError(
        typeof detail?.error === 'string'
          ? detail.error
          : 'We could not send that just now. Please try again, or message us on WhatsApp.'
      )
    } catch (err) {
      console.error('[LeadCaptureModal] submission error', err)
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A142F]/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Download ${toolTitle} Summary`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-black text-[#0A142F]">Report &amp; Advisory Dispatched</h3>
            <p className="text-xs text-[#334155] mt-2 leading-relaxed">
              Your personalized calculation dossier has been routed to our senior Dubai structuring desk. We will reach out on WhatsApp within 15 minutes.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-[#0A142F] text-white font-bold text-xs uppercase tracking-wider"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-2.5 py-0.5 rounded">
                Official Dossier &amp; Consultation
              </span>
              <h3 className="text-xl font-black text-[#0A142F] mt-2">
                Download {toolTitle} Summary
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Receive the complete itemized breakdown and speak with a licensed UAE corporate advisor.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-700"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:border-[#F26522] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] uppercase mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:border-[#F26522] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] uppercase mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+971 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-describedby="lead-phone-hint"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:border-[#F26522] focus:bg-white"
                />
                <p id="lead-phone-hint" className="mt-1 text-[10px] text-[#64748B]">
                  Include your country code. UAE mobiles may be entered as 0501234567.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] uppercase mb-1">
                  Proposed Company / Industry (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SaaS / Trading / Consulting"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:outline-none focus:border-[#F26522] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-4"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Sending Request...' : 'Send Calculation Report →'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#64748B] pt-1">
                <Lock className="h-3 w-3 text-emerald-600" />
                <span>Strictly confidential. No spam or marketing sharing.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
