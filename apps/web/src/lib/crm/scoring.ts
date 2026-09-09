export interface LeadInput {
  email?: string | null
  phone?: string | null
  country?: string | null
  jurisdiction?: string | null
  package_type?: string | null
  estimated_value?: number | null
  deal_value?: number | null
  payment_status?: string | null
  status?: string | null
  consent_status?: string | null
  custom_fields?: Record<string, unknown>
  [key: string]: any
}

export type LeadScoreResult = {
  score: number // 0 - 100
  tier: 'VIP' | 'High' | 'Medium' | 'Low'
  factors: Array<{ factor: string; points: number }>
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'mail.ru',
  'proton.me',
  'protonmail.com',
])

const PRIORITY_JURISDICTIONS = new Set([
  'uae',
  'dubai',
  'ifza',
  'meydan',
  'dmcc',
  'rak',
  'adgm',
  'difc',
  'saudi',
  'ksa',
  'riyadh',
  'misa',
  'hong-kong',
  'hong kong',
  'singapore',
  'uk',
  'united kingdom',
])

export function calculateLeadScore(lead: Partial<LeadInput>): LeadScoreResult {
  const factors: Array<{ factor: string; points: number }> = []
  let score = 0

  // 1. Corporate vs Free Email Domain (Up to 25 pts)
  if (lead.email && lead.email.includes('@')) {
    const domain = lead.email.split('@')[1]?.toLowerCase().trim()
    if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
      factors.push({ factor: 'Verified Corporate Work Email Domain', points: 25 })
      score += 25
    } else if (domain) {
      factors.push({ factor: 'Personal Email Domain', points: 10 })
      score += 10
    }
  }

  // 2. High Priority Formation Jurisdiction (Up to 20 pts)
  const jur = (
    lead.jurisdiction ||
    lead.country ||
    (typeof lead.custom_fields?.jurisdiction === 'string' ? lead.custom_fields.jurisdiction : '') ||
    ''
  ).toLowerCase()

  if (jur && Array.from(PRIORITY_JURISDICTIONS).some((p) => jur.includes(p))) {
    factors.push({ factor: 'Strategic GCC / APAC Target Jurisdiction', points: 20 })
    score += 20
  } else if (lead.country || jur) {
    factors.push({ factor: 'International Jurisdiction', points: 10 })
    score += 10
  }

  // 3. Service Package Value (Up to 25 pts)
  const val = Number(lead.deal_value || lead.estimated_value || lead.custom_fields?.deal_value || 0)
  if (
    lead.package_type === 'nominee_director' ||
    lead.package_type === 'need_ubo' ||
    lead.package_type === 'holding_enterprise'
  ) {
    factors.push({ factor: 'High-Tier Nominee / Fiduciary Package', points: 25 })
    score += 25
  } else if (val >= 10000 || val >= 36000) {
    factors.push({ factor: 'High Value Deal (≥ $10,000 / AED 36,000)', points: 25 })
    score += 25
  } else if (val >= 5000 || val >= 18500) {
    factors.push({ factor: 'Standard Deal Value (≥ $5,000 / AED 18,500)', points: 20 })
    score += 20
  } else if (lead.package_type === 'self_ubo') {
    factors.push({ factor: 'Standard Incorporation Package', points: 15 })
    score += 15
  }

  // 4. Contact Reachability / Phone Verification (Up to 15 pts)
  if (lead.phone && lead.phone.replace(/[^\d]/g, '').length >= 8) {
    factors.push({ factor: 'Direct Phone & WhatsApp Reachable', points: 15 })
    score += 15
  }

  // 5. Active Paid Engagement (Up to 15 pts)
  if (lead.payment_status === 'paid' || lead.status === 'paid_application') {
    factors.push({ factor: 'Committed Paid Application', points: 15 })
    score += 15
  } else if (lead.consent_status === 'granted') {
    factors.push({ factor: 'Explicit GDPR/PECR Marketing Consent', points: 5 })
    score += 5
  }

  // Normalize max 100
  const finalScore = Math.min(100, Math.max(0, score))
  let tier: LeadScoreResult['tier'] = 'Low'

  if (finalScore >= 80) tier = 'VIP'
  else if (finalScore >= 60) tier = 'High'
  else if (finalScore >= 40) tier = 'Medium'

  return {
    score: finalScore,
    tier,
    factors,
  }
}

export function resolveDeskTag(lead: Partial<LeadInput>): 'Dubai Desk' | 'Riyadh Desk' | 'APAC Desk' | 'Global Desk' {
  if (lead.custom_fields?.desk && typeof lead.custom_fields.desk === 'string') {
    return lead.custom_fields.desk as any
  }
  const text = `${lead.jurisdiction || ''} ${lead.country || ''} ${lead.company || ''}`.toLowerCase()
  if (text.includes('ksa') || text.includes('saudi') || text.includes('riyadh') || text.includes('misa')) {
    return 'Riyadh Desk'
  }
  if (
    text.includes('uae') ||
    text.includes('dubai') ||
    text.includes('ifza') ||
    text.includes('meydan') ||
    text.includes('dmcc') ||
    text.includes('ded') ||
    text.includes('abudhabi') ||
    text.includes('adgm')
  ) {
    return 'Dubai Desk'
  }
  if (text.includes('hong kong') || text.includes('hk') || text.includes('singapore') || text.includes('sg')) {
    return 'APAC Desk'
  }
  return 'Dubai Desk'
}

export function resolveEstimatedDealValue(lead: Partial<LeadInput>): { value: number; currency: string } {
  if (lead.deal_value && Number.isFinite(Number(lead.deal_value))) {
    return { value: Number(lead.deal_value), currency: lead.currency || 'USD' }
  }
  if (lead.estimated_value && Number.isFinite(Number(lead.estimated_value))) {
    return { value: Number(lead.estimated_value), currency: lead.currency || 'USD' }
  }
  if (lead.custom_fields?.deal_value && Number.isFinite(Number(lead.custom_fields.deal_value))) {
    return { value: Number(lead.custom_fields.deal_value), currency: (lead.custom_fields?.currency as string) || 'USD' }
  }
  // Default formation package value for GCC Startup
  const jur = `${lead.jurisdiction || ''} ${lead.country || ''}`.toLowerCase()
  if (jur.includes('ksa') || jur.includes('saudi') || jur.includes('misa')) {
    return { value: 12500, currency: 'USD' }
  }
  if (jur.includes('mainland')) {
    return { value: 8500, currency: 'USD' }
  }
  if (jur.includes('ifza') || jur.includes('meydan') || jur.includes('uae') || jur.includes('dubai')) {
    return { value: 5800, currency: 'USD' }
  }
  return { value: 5500, currency: 'USD' }
}
