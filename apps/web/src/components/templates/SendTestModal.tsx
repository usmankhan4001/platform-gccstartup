'use client'

import React, { useState } from 'react'
import { Send, X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'

interface SendTestModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  template?: any
}

export function SendTestModal({ isOpen, open, onClose, template }: SendTestModalProps) {
  const isVisible = isOpen ?? open ?? false
  const [phoneNumber, setPhoneNumber] = useState('')
  const [sending, setSending] = useState(false)
  const { success: showSuccess, error: showError } = useToast()

  if (!isVisible) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber.trim(),
          templateName: template?.name,
          languageCode: template?.language || 'en',
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        showSuccess(data.message || 'Test message dispatched via Meta WhatsApp')
        onClose()
      } else {
        // Surfaces the real reason — including the Meta-not-configured no-op —
        // instead of pretending the send happened.
        showError(data?.error || 'Failed to dispatch test')
      }
    } catch {
      showError('Failed to dispatch test')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-[var(--text)]">Send Test Template</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--text)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Template: <span className="font-mono text-[var(--text)]">{template?.name}</span>
            </label>
            <div className="rounded-lg bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-secondary)] border border-[var(--border)] leading-relaxed">
              {template?.body}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Destination WhatsApp Number (with country code)
            </label>
            <input
              type="tel"
              required
              placeholder="+971 50 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={sending}>
              {sending ? 'Sending...' : 'Send WhatsApp Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SendTestModal
