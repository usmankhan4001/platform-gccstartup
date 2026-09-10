import type { LeadStatus } from './types'

export type PipelineStage = {
  id: LeadStatus
  label: string
  cue: string
  color: string
  bgLight: string
  /** Weighting applied to the deal value for the forecast KPI (0–100). */
  probability: number
  kind: 'open' | 'won' | 'lost'
}

/**
 * The eight canonical formation columns. `id` values are the `status` strings
 * already persisted in `contacts.custom_fields`, so the board, the 360 drawer
 * and the API all speak the same vocabulary.
 */
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'new', label: 'New Lead', cue: 'Inquiry received', color: '#3B82F6', bgLight: 'rgba(59, 130, 246, 0.08)', probability: 10, kind: 'open' },
  { id: 'paid_application', label: 'Paid App', cue: 'Retainer & docs captured', color: '#8B5CF6', bgLight: 'rgba(139, 92, 246, 0.08)', probability: 25, kind: 'open' },
  { id: 'kyc_processing', label: 'KYC Review', cue: 'Passport & UBO compliance', color: '#F59E0B', bgLight: 'rgba(245, 158, 11, 0.08)', probability: 40, kind: 'open' },
  { id: 'applied', label: 'Applied', cue: 'Submitted to E-Registry', color: '#0EA5E9', bgLight: 'rgba(14, 165, 233, 0.08)', probability: 55, kind: 'open' },
  { id: 'registered', label: 'Registered', cue: 'Trade license & MoA issued', color: '#10B981', bgLight: 'rgba(16, 185, 129, 0.08)', probability: 70, kind: 'open' },
  { id: 'banking_filed', label: 'Banking Filed', cue: 'Bank application lodged', color: '#059669', bgLight: 'rgba(5, 150, 105, 0.08)', probability: 85, kind: 'open' },
  { id: 'won', label: 'Closed Won', cue: 'Formation active & live', color: '#047857', bgLight: 'rgba(4, 120, 87, 0.08)', probability: 100, kind: 'won' },
  { id: 'lost', label: 'Closed Lost', cue: 'Disqualified / cancelled', color: '#6B7280', bgLight: 'rgba(107, 114, 128, 0.08)', probability: 0, kind: 'lost' },
]

/** Stage values seen in imported data folded onto the canonical columns. */
const STAGE_ALIASES: Record<string, LeadStatus> = {
  new: 'new',
  lead: 'new',
  inquiry: 'new',
  paid_application: 'paid_application',
  paid_app: 'paid_application',
  kyc_processing: 'kyc_processing',
  kyc_review: 'kyc_processing',
  kyc_received: 'kyc_processing',
  applied: 'applied',
  registered: 'registered',
  banking_filed: 'banking_filed',
  banking: 'banking_filed',
  won: 'won',
  closed: 'won',
  complete: 'won',
  lost: 'lost',
  disqualified: 'lost',
  cancelled: 'lost',
}

export function normalizeStage(value?: string | null): LeadStatus {
  if (!value) return 'new'
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return STAGE_ALIASES[key] ?? 'new'
}

export function stageMeta(id?: string | null): PipelineStage {
  const normalized = normalizeStage(id)
  return PIPELINE_STAGES.find((stage) => stage.id === normalized) ?? PIPELINE_STAGES[0]
}

export function isClosedStage(id?: string | null): boolean {
  return stageMeta(id).kind !== 'open'
}
