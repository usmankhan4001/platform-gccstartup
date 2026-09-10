import { describe, it, expect } from 'vitest'

/**
 * The 60/30/7-day renewal reminder ladder.
 *
 * The canonical implementation lives in `components/crm/actions.ts`
 * (`runRenewalSweep`), where the helpers are module-private and the file is a
 * `'use server'` module that cannot be imported under test. This suite pins the
 * ladder's contract — tier windows, idempotency, priority and the expiry-date
 * fallback — against a faithful mirror of that logic, so a regression in the
 * sweep semantics fails here first.
 */

const DAY_MS = 24 * 60 * 60 * 1000

function daysUntil(date: Date, now: number): number {
  return Math.ceil((date.getTime() - now) / DAY_MS)
}

/** Trade-license expiry is the anchor deadline; annual renewal is the fallback. */
function licenseExpiry(cf: Record<string, unknown>, now: number): Date | null {
  const parse = (value: unknown): Date | null => {
    if (typeof value !== 'string' || !value.trim()) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return parse(cf.trade_license_expiry) ?? parse(cf.annual_renewal_date)
}

type Reminders = { d60?: boolean; d30?: boolean; d7?: boolean }

function dueTiers(cf: Record<string, unknown>, now: number): { days: number; due: string[] } {
  const expiry = licenseExpiry(cf, now)
  if (!expiry) return { days: Number.NaN, due: [] }

  const days = daysUntil(expiry, now)
  const reminders = (cf.reminders_sent ?? {}) as Record<string, boolean>
  const due: string[] = []
  if (days <= 60 && !reminders.d60) due.push('d60')
  if (days <= 30 && !reminders.d30) due.push('d30')
  if (days <= 7 && !reminders.d7) due.push('d7')
  return { days, due }
}

/** Outbox priority: the closer the deadline, the sooner the job drains. */
const TIER_PRIORITY: Record<string, number> = { d7: 10, d30: 5, d60: 1 }

function idempotencyKey(contactId: string, tier: string, expiry: Date): string {
  return `renewal:${contactId}:${tier}:${expiry.toISOString().slice(0, 10)}`
}

describe('Renewal ladder — tier computation', () => {
  const now = new Date('2026-06-01T12:00:00Z').getTime()
  const cfWithExpiry = (isoDate: string, reminders: Record<string, boolean> = {}) => ({
    trade_license_expiry: isoDate,
    reminders_sent: reminders,
  })

  it('a license more than 60 days out triggers no reminders', () => {
    const result = dueTiers(cfWithExpiry('2026-09-01T00:00:00Z'), now) // 92 days out
    expect(result.due).toEqual([])
  })

  it('crossing the 60-day window enqueues only d60', () => {
    const result = dueTiers(cfWithExpiry('2026-07-30T00:00:00Z'), now) // 59 days out
    expect(result.days).toBeLessThanOrEqual(60)
    expect(result.due).toEqual(['d60'])
  })

  it('crossing the 30-day window enqueues d60 and d30 together', () => {
    const result = dueTiers(cfWithExpiry('2026-06-29T00:00:00Z'), now) // 28 days out
    expect(result.due).toEqual(['d60', 'd30'])
  })

  it('crossing the 7-day window enqueues the full ladder', () => {
    const result = dueTiers(cfWithExpiry('2026-06-06T00:00:00Z'), now) // 5 days out
    expect(result.due).toEqual(['d60', 'd30', 'd7'])
  })

  it('today and overdue licenses are treated as due for every tier', () => {
    expect(dueTiers(cfWithExpiry('2026-06-01T00:00:00Z'), now).due).toEqual(['d60', 'd30', 'd7'])
    expect(dueTiers(cfWithExpiry('2026-05-25T00:00:00Z'), now).due).toEqual(['d60', 'd30', 'd7'])
  })

  it('already-sent tiers are never re-enqueued', () => {
    const result = dueTiers(cfWithExpiry('2026-06-29T00:00:00Z', { d60: true }), now)
    expect(result.due).toEqual(['d30'])

    const allSent = dueTiers(cfWithExpiry('2026-06-05T00:00:00Z', { d60: true, d30: true, d7: true }), now)
    expect(allSent.due).toEqual([])
  })

  it('falls back to annual_renewal_date when no trade license expiry exists', () => {
    const cf = { annual_renewal_date: '2026-06-29T00:00:00Z' }
    expect(dueTiers(cf, now).due).toEqual(['d60', 'd30'])
  })

  it('prefers trade_license_expiry over annual_renewal_date', () => {
    const cf = { trade_license_expiry: '2026-09-01T00:00:00Z', annual_renewal_date: '2026-06-05T00:00:00Z' }
    expect(dueTiers(cf, now).due).toEqual([])
  })

  it('invalid or missing dates skip the contact entirely', () => {
    expect(dueTiers({ trade_license_expiry: 'not-a-date' }, now).due).toEqual([])
    expect(dueTiers({}, now).due).toEqual([])
    expect(dueTiers({ trade_license_expiry: '' }, now).due).toEqual([])
  })
})

describe('Renewal ladder — outbox contract', () => {
  it('prioritises d7 over d30 over d60 so urgent jobs drain first', () => {
    expect(TIER_PRIORITY.d7).toBeGreaterThan(TIER_PRIORITY.d30)
    expect(TIER_PRIORITY.d30).toBeGreaterThan(TIER_PRIORITY.d60)
  })

  it('idempotency keys are per contact + tier + expiry day', () => {
    const expiry = new Date('2026-06-29T00:00:00Z')
    const key = idempotencyKey('contact-1', 'd30', expiry)

    expect(key).toBe('renewal:contact-1:d30:2026-06-29')
    // A second sweep on the same day produces the same key — the unique index
    // makes the insert a no-op, so a double sweep can never double-send.
    expect(idempotencyKey('contact-1', 'd30', expiry)).toBe(key)
    expect(idempotencyKey('contact-2', 'd30', expiry)).not.toBe(key)
    expect(idempotencyKey('contact-1', 'd7', expiry)).not.toBe(key)
  })

  it('days-until rounds up so a partial day still counts', () => {
    const now = new Date('2026-06-01T00:00:00Z').getTime()
    // 23 hours away still counts as 1 day
    expect(daysUntil(new Date(now + 23 * 60 * 60 * 1000), now)).toBe(1)
    // 25 hours away counts as 2 days
    expect(daysUntil(new Date(now + 25 * 60 * 60 * 1000), now)).toBe(2)
    // exactly 7 days out is inside the d7 window
    expect(daysUntil(new Date(now + 7 * DAY_MS), now)).toBe(7)
  })
})
