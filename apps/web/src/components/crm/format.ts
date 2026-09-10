import type { RenewalUrgency } from './types'

const AED = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
})


/** The dirham is pegged at 3.6725 per USD - used only to total mixed-currency columns. */
const USD_TO_AED = 3.6725

export function toAed(value: number, currency?: string | null): number {
  if (!Number.isFinite(value)) return 0
  if (!currency || currency.toUpperCase() === 'AED') return value
  if (currency.toUpperCase() === 'USD') return value * USD_TO_AED
  return value
}

/** Money is shown in AED across the CRM; other currencies fall back to plain grouping. */
export function formatCurrency(value?: number | null, currency = 'AED'): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'AED 0'
  if (currency.toUpperCase() === 'AED') return AED.format(Number(value))
  return `${currency.toUpperCase()} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`
}


export function initialsOf(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Countdown copy for a compliance deadline. `null` means no date on file. */
export function formatCountdown(days: number | null): string {
  if (days === null) return 'Not set'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}

export function urgencyTone(urgency: RenewalUrgency | 'unknown'): 'danger' | 'warning' | 'gold' | 'success' | 'default' {
  switch (urgency) {
    case 'expired':
    case 'critical':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'upcoming':
      return 'gold'
    case 'healthy':
      return 'success'
    default:
      return 'default'
  }
}

export function urgencyLabel(urgency: RenewalUrgency | 'unknown'): string {
  switch (urgency) {
    case 'expired':
      return 'Expired'
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Due soon'
    case 'upcoming':
      return 'Upcoming'
    case 'healthy':
      return 'Healthy'
    default:
      return 'No dates'
  }
}

export function scoreTone(tier: 'VIP' | 'High' | 'Medium' | 'Low'): 'accent' | 'info' | 'warning' | 'default' {
  switch (tier) {
    case 'VIP':
      return 'accent'
    case 'High':
      return 'info'
    case 'Medium':
      return 'warning'
    default:
      return 'default'
  }
}

export function formatRelative(value?: string | null): string {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  const diff = Date.now() - date.getTime()
  const days = Math.round(diff / (24 * 60 * 60 * 1000))
  if (Math.abs(days) < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 30) return `${days}d ago`
  if (days < -1 && days > -30) return `in ${Math.abs(days)}d`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
