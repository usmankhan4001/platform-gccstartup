'use client'

import React from 'react'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'

// WhatsApp-style delivery receipts: one grey tick once the provider accepted the
// message, two grey ticks on delivery, two blue ticks once the recipient read it.
export type DeliveryState = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

const LABELS: Record<DeliveryState, string> = {
  QUEUED: 'Queued',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read',
  FAILED: 'Failed',
}

export function normalizeDeliveryState(status?: string | null): DeliveryState {
  const value = String(status || '').toUpperCase()
  if (value === 'READ') return 'READ'
  if (value === 'DELIVERED') return 'DELIVERED'
  if (value === 'FAILED' || value === 'BOUNCED' || value === 'UNDELIVERED') return 'FAILED'
  if (value === 'QUEUED' || value === 'PENDING' || value === 'SENDING') return 'QUEUED'
  return 'SENT'
}

interface DeliveryTicksProps {
  status?: string | null
  className?: string
}

export function DeliveryTicks({ status, className = '' }: DeliveryTicksProps) {
  const state = normalizeDeliveryState(status)
  const title = LABELS[state]

  if (state === 'FAILED') {
    return (
      <span className={`inline-flex items-center ${className}`} title={title} aria-label={title}>
        <AlertCircle className="h-3.5 w-3.5 text-[var(--danger)]" />
      </span>
    )
  }

  if (state === 'QUEUED') {
    return (
      <span className={`inline-flex items-center ${className}`} title={title} aria-label={title}>
        <Clock className="h-3 w-3 text-[var(--text-tertiary)]" />
      </span>
    )
  }

  if (state === 'SENT') {
    return (
      <span className={`inline-flex items-center ${className}`} title={title} aria-label={title}>
        <Check className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      title={title}
      aria-label={title}
    >
      <CheckCheck
        className={`h-3.5 w-3.5 ${state === 'READ' ? 'text-[#53bdeb]' : 'text-[var(--text-tertiary)]'}`}
      />
    </span>
  )
}
