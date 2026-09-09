import type {
  DirectusUserSummary,
  EmailEventItem,
  LeadActivityItem,
  LeadConsentItem,
  LeadItem,
  LeadStageHistoryItem,
  LeadTaskItem,
} from '@/lib/directus'

export type LeadStatus =
  | 'new'
  | 'paid_application'
  | 'kyc_processing'
  | 'kyc_review'
  | 'kyc_received'
  | 'applied'
  | 'registered'
  | 'banking_filed'
  | 'won'
  | 'closed'
  | 'lost'

export type DeskTag = 'Dubai Desk' | 'Riyadh Desk' | 'APAC Desk' | 'London Desk' | 'Global Desk'

export type TaxRegime =
  | '0% QFZP Qualified'
  | '9% Standard UAE CT'
  | '15% Pillar Two'
  | '20% KSA Income Tax'
  | 'VAT Registered (5%/15%)'
  | 'Tax Exempt Holding'
  | 'Standard Corporate Tax'

export type KycStatus = 'pending' | 'sent' | 'received' | 'under_review' | 'approved' | 'rejected'

export type AssociatedDocument = {
  id: string
  name: string
  url: string
  category: 'passport_kyc' | 'trade_license' | 'moa' | 'bank_statement' | 'tax_cert' | 'other'
  uploaded_at: string
  size?: string
}

export type CRMLead = Omit<LeadItem, 'assigned_to'> & {
  id: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  job_title?: string | null
  status?: LeadStatus | string
  lifecycle_stage?: string
  source?: string | null
  tags?: string[]
  assigned_to?: DirectusUserSummary | string | null
  owner_id?: string | null
  owner_name?: string | null
  estimated_value?: number | null
  deal_value?: number | null
  currency?: string
  score?: number
  score_tier?: 'VIP' | 'High' | 'Medium' | 'Low'
  jurisdiction?: string | null
  entity_type?: string | null
  desk?: DeskTag | string | null
  tax_regime?: TaxRegime | string | null
  kyc_status?: KycStatus | string | null
  order_number?: string | null
  tracking_token?: string | null
  company_name_choice_1?: string | null
  company_name_choice_2?: string | null
  trade_license_number?: string | null
  incorporation_date?: string | null
  trade_license_expiry?: string | null
  annual_renewal_date?: string | null
  visa_eid_expiry?: string | null
  tax_filing_deadline?: string | null
  vat_deadline?: string | null
  annual_retainer_fee?: number | null
  reminders_sent?: { d60?: boolean; d30?: boolean; d7?: boolean }
  preliminary_documents?: Array<{ name: string; url: string }>
  official_documents?: Array<{ name: string; url: string; date_uploaded?: string }>
  documents?: AssociatedDocument[]
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
  amount_paid?: number | null
  package_type?: string | null
  next_follow_up_at?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  lost_reason?: string | null
  notes?: string | null
  message?: string | null
  custom_fields?: Record<string, unknown>
  created_at?: string
  date_created?: string
  updated_at?: string
}

export type CRMTask = Omit<LeadTaskItem, 'lead_id' | 'assigned_to'> & {
  id: string
  title: string
  details?: string | null
  due_at?: string | null
  completed_at?: string | null
  completed_by?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  lead_id?: Pick<CRMLead, 'id' | 'name' | 'email' | 'status'> | string | null
  contact_id?: string | null
  deal_id?: string | null
  assigned_to?: DirectusUserSummary | string | null
  assignee_id?: string | null
  assignee_name?: string | null
  contact_name?: string | null
  status?: 'active' | 'completed' | 'cancelled'
  created_at?: string
}

export type CRMNote = {
  id: string
  contact_id: string
  deal_id?: string | null
  body: string
  author_id?: string | null
  author_name?: string | null
  created_at: string
  updated_at?: string
}

export type CRMActivity = {
  id: string
  contact_id: string
  deal_id?: string | null
  type: 'call' | 'meeting' | 'note' | 'whatsapp' | 'email' | 'system'
  direction: 'inbound' | 'outbound'
  subject?: string | null
  notes?: string | null
  occurred_at: string
  duration_minutes?: number | null
  logged_by?: string | null
  created_at?: string
}

export type CRMDeal = {
  id: string
  title: string
  contact_id: string
  pipeline_id: string
  stage_id: string
  value?: number | null
  currency: string
  probability: number
  owner_id?: string | null
  expected_close_date?: string | null
  status: 'open' | 'won' | 'lost'
  closed_at?: string | null
  created_at: string
}

export type LeadDetailPayload = {
  lead: CRMLead
  activities: LeadActivityItem[]
  tasks: CRMTask[]
  notes?: CRMNote[]
  deals?: CRMDeal[]
  stageHistory: LeadStageHistoryItem[]
  consents: LeadConsentItem[]
  emailEvents: EmailEventItem[]
  messages?: Array<{
    id: string
    direction: 'inbound' | 'outbound'
    body: string
    media_url?: string | null
    status: string
    occurred_at: string
  }>
}

export type RenewalUrgency = 'critical' | 'warning' | 'upcoming' | 'healthy' | 'expired'

export type RenewalRecord = {
  id: string
  contact_id: string
  company_name: string
  license_number: string
  jurisdiction: string
  desk: DeskTag | string
  contact_name: string
  email: string
  phone: string
  trade_license_expiry: string
  visa_eid_expiry?: string | null
  corporate_tax_deadline?: string | null
  vat_deadline?: string | null
  annual_fee: number
  currency: string
  days_until_license_expiry: number
  urgency: RenewalUrgency
  reminders_sent: {
    d60: boolean
    d30: boolean
    d7: boolean
  }
  last_reminded_at?: string | null
  status: 'active' | 'renewing' | 'renewed' | 'grace_period' | 'action_required'
}

export function userLabel(user?: DirectusUserSummary | string | null) {
  if (!user) return 'Unassigned'
  if (typeof user === 'string') return user
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name || user.name || user.email || 'Unknown user'
}

export function userId(user?: DirectusUserSummary | string | null) {
  if (!user) return ''
  return typeof user === 'string' ? user : user.id
}

export function formatMoney(value?: number | string | null, currency = 'USD') {
  if (value === null || value === undefined) return null
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatShortDate(value?: string | null, withTime = false) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: withTime ? 'numeric' : undefined,
    minute: withTime ? '2-digit' : undefined,
  }).format(date)
}

export function isOverdue(value?: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now())
}

export function getDaysRemaining(targetDate?: string | null): number {
  if (!targetDate) return 999
  const target = new Date(targetDate).getTime()
  if (Number.isNaN(target)) return 999
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export function resolveUrgency(daysRemaining: number): RenewalUrgency {
  if (daysRemaining < 0) return 'expired'
  if (daysRemaining <= 7) return 'critical'
  if (daysRemaining <= 30) return 'warning'
  if (daysRemaining <= 60) return 'upcoming'
  return 'healthy'
}

export async function crmFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(data.error || 'CRM request failed')
  return data as T
}
