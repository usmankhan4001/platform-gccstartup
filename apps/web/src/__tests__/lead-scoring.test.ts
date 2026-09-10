import { describe, it, expect } from 'vitest'
import { calculateLeadScore, resolveDeskTag, resolveEstimatedDealValue } from '@/lib/crm/scoring'

describe('Lead scoring', () => {
  it('rewards corporate email domains over free ones', () => {
    const corporate = calculateLeadScore({ email: 'founder@acme-corp.com' })
    expect(corporate.score).toBe(25)
    expect(corporate.factors[0].factor).toContain('Corporate')

    const free = calculateLeadScore({ email: 'someone@gmail.com' })
    expect(free.score).toBe(10)
  })

  it('scores priority jurisdictions higher than generic ones', () => {
    expect(calculateLeadScore({ jurisdiction: 'IFZA, Dubai' }).score).toBe(20)
    expect(calculateLeadScore({ jurisdiction: 'KSA' }).score).toBe(20)
    expect(calculateLeadScore({ country: 'Brazil' }).score).toBe(10)
  })

  it('adds phone reachability points for valid numbers', () => {
    expect(calculateLeadScore({ phone: '+971501234567' }).score).toBe(15)
    expect(calculateLeadScore({ phone: '123' }).score).toBe(0)
  })

  it('grants consent points only when consent is explicit', () => {
    expect(calculateLeadScore({ consent_status: 'granted' }).score).toBe(5)
    expect(calculateLeadScore({ consent_status: 'unknown' }).score).toBe(0)
  })

  it('a fully qualified inbound lead lands in the High tier', () => {
    const result = calculateLeadScore({
      email: 'ceo@enterprise.com',
      jurisdiction: 'dubai',
      package_type: 'self_ubo',
      phone: '+971501234567',
      consent_status: 'granted',
    })
    // 25 (corporate) + 20 (jurisdiction) + 15 (package) + 15 (phone) + 5 (consent)
    expect(result.score).toBe(80)
    expect(result.tier).toBe('VIP')
  })

  it('an empty lead scores zero in the Low tier', () => {
    const result = calculateLeadScore({})
    expect(result.score).toBe(0)
    expect(result.tier).toBe('Low')
  })

  it('respects the tier boundaries (VIP ≥ 80, High ≥ 60, Medium ≥ 40)', () => {
    // 25 corporate + 20 jurisdiction + 15 package + 15 phone + 5 consent = 80
    expect(calculateLeadScore({ email: 'x@corp.com', jurisdiction: 'uae', phone: '+971501234567', consent_status: 'granted', package_type: 'self_ubo' }).tier).toBe('VIP')
    // 25 + 20 + 15 + 5 = 65
    expect(calculateLeadScore({ email: 'x@corp.com', jurisdiction: 'uae', phone: '+971501234567', consent_status: 'granted' }).tier).toBe('High')
    // 25 + 20 = 45
    expect(calculateLeadScore({ email: 'x@corp.com', jurisdiction: 'uae' }).tier).toBe('Medium')
    // 10
    expect(calculateLeadScore({ email: 'x@gmail.com' }).tier).toBe('Low')
  })

  it('high deal values push the score up', () => {
    expect(calculateLeadScore({ estimated_value: 15000 }).score).toBe(25)
    expect(calculateLeadScore({ estimated_value: 6000 }).score).toBe(20)
  })

  it('paid applications outweigh plain consent', () => {
    const paid = calculateLeadScore({ payment_status: 'paid', consent_status: 'granted' })
    expect(paid.score).toBe(15)
    expect(paid.factors[0].factor).toContain('Paid')
  })
})

describe('Desk routing', () => {
  it('routes Saudi Arabia to the Riyadh Desk', () => {
    expect(resolveDeskTag({ jurisdiction: 'Riyadh', country: 'KSA' })).toBe('Riyadh Desk')
    expect(resolveDeskTag({ jurisdiction: 'MISA' })).toBe('Riyadh Desk')
  })

  it('routes UAE free zones to the Dubai Desk', () => {
    expect(resolveDeskTag({ jurisdiction: 'IFZA' })).toBe('Dubai Desk')
    expect(resolveDeskTag({ country: 'UAE' })).toBe('Dubai Desk')
  })

  it('routes APAC targets to the APAC Desk', () => {
    expect(resolveDeskTag({ country: 'Hong Kong' })).toBe('APAC Desk')
    expect(resolveDeskTag({ country: 'Singapore' })).toBe('APAC Desk')
  })

  it('an explicit desk in custom_fields wins over the inferred one', () => {
    expect(resolveDeskTag({ country: 'KSA', custom_fields: { desk: 'Dubai Desk' } })).toBe('Dubai Desk')
  })
})

describe('Estimated deal value', () => {
  it('prefers an explicit deal value', () => {
    expect(resolveEstimatedDealValue({ deal_value: 12345 })).toEqual({ value: 12345, currency: 'USD' })
    expect(resolveEstimatedDealValue({ estimated_value: 9000 })).toEqual({ value: 9000, currency: 'USD' })
  })

  it('falls back to jurisdiction-specific defaults', () => {
    expect(resolveEstimatedDealValue({ jurisdiction: 'KSA' }).value).toBe(12500)
    expect(resolveEstimatedDealValue({ jurisdiction: 'IFZA' }).value).toBe(5800)
    expect(resolveEstimatedDealValue({ jurisdiction: 'Mainland' }).value).toBe(8500)
  })

  it('uses the global default when nothing matches', () => {
    expect(resolveEstimatedDealValue({}).value).toBe(5500)
  })
})
