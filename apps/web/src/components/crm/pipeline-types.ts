import type { LeadStatus, RenewalUrgency } from './types'

export type OwnerOption = {
  id: string
  name: string
  email?: string | null
}

/** One row of the pipeline: a contact plus the formation deal attached to it. */
export type DealCard = {
  id: string
  /** Company when known, otherwise the contact name - the card headline. */
  title: string
  company: string | null
  contactName: string
  email: string | null
  phone: string | null
  stage: LeadStatus
  value: number
  currency: string
  jurisdiction: string | null
  desk: string | null
  score: number
  scoreTier: 'VIP' | 'High' | 'Medium' | 'Low'
  ownerId: string | null
  ownerName: string | null
  kycStatus: string | null
  tradeLicenseNumber: string | null
  nextTask: { id: string; title: string; dueAt: string | null } | null
  openTaskCount: number
  expectedCloseDate: string | null
  createdAt: string
  updatedAt: string | null
  lifecycleStage: string
  source: string | null
  tags: string[]
}

export type PipelineKpis = {
  /** Sum of open-stage deal values, in AED. */
  activePipelineValue: number
  /** Open-stage value weighted by each stage close probability, in AED. */
  weightedForecast: number
  /** Mean days from creation to close across closed deals. 0 when unknown. */
  averageDealCycleDays: number
  /** Won / (won + lost) as a percentage. 0 when nothing has closed. */
  winRate: number
  openDeals: number
  wonDeals: number
  lostDeals: number
  currency: string
}

export type ComplianceKind = 'trade_license' | 'visa_eid' | 'corporate_tax' | 'ubo_declaration'

export const COMPLIANCE_LABELS: Record<ComplianceKind, string> = {
  trade_license: 'Trade License',
  visa_eid: 'Visa / Emirates ID',
  corporate_tax: 'Corporate Tax',
  ubo_declaration: 'UBO Declaration',
}

export const COMPLIANCE_KINDS: ComplianceKind[] = [
  'trade_license',
  'visa_eid',
  'corporate_tax',
  'ubo_declaration',
]

export type RenewalRow = {
  id: string
  contactId: string
  companyName: string
  licenseNumber: string | null
  jurisdiction: string | null
  desk: string | null
  contactName: string
  email: string | null
  phone: string | null
  deadlines: Record<ComplianceKind, string | null>
  daysRemaining: Record<ComplianceKind, number | null>
  /** Worst-case urgency across every tracked deadline. */
  urgency: RenewalUrgency | 'unknown'
  annualFee: number
  currency: string
  remindersSent: { d60: boolean; d30: boolean; d7: boolean }
  lastRemindedAt: string | null
  status: 'active' | 'renewing' | 'grace_period' | 'action_required' | 'no_dates'
}

export type RenewalStats = {
  total: number
  critical: number
  warning: number
  upcoming: number
  healthy: number
  expired: number
  noDates: number
  totalARR: number
  /** Records whose 60/30/7-day reminder has not been dispatched yet. */
  dueAlerts: { d60: number; d30: number; d7: number }
  currency: string
}

export type RenewalForecast = {
  quarter: string
  count: number
  value: number
}
