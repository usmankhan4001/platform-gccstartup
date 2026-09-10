'use client'

// The automation canvas node catalog.
//
// One entry per node the builder can place. The catalog is the single source of
// truth for three things that must never drift apart: the palette the user drags
// from, the config form the side panel renders, and the defaults a brand-new node
// is created with. Adding a node is additive — nothing else needs to change.

import {
  Zap,
  GitBranch,
  Send,
  MessageSquare,
  Building2,
  CheckSquare,
  Timer,
  Calculator,
  ArrowRightLeft,
  ShieldAlert,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { NodeKind } from './types'

export type ConfigField =
  | { key: string; label: string; type: 'text'; placeholder?: string; help?: string }
  | { key: string; label: string; type: 'textarea'; rows?: number; placeholder?: string; help?: string }
  | { key: string; label: string; type: 'number'; min?: number; max?: number; step?: number; help?: string }
  | { key: string; label: string; type: 'select'; options: ReadonlyArray<{ label: string; value: string }>; help?: string }
  | { key: string; label: string; type: 'switch'; help?: string }

export type NodeAccent = 'orange' | 'blue' | 'violet' | 'emerald' | 'amber'

export type NodeDefinition = {
  /** Stable catalog key persisted in `flows.nodes[].data.nodeType`. */
  type: string
  kind: NodeKind
  label: string
  description: string
  icon: LucideIcon
  accent: NodeAccent
  defaults: Record<string, unknown>
  fields: ConfigField[]
  /** One-line human summary shown on the node body. Must never throw. */
  summary: (config: Record<string, unknown>) => string
}

/* ------------------------------------------------------------- shared vocab */

export const JURISDICTIONS = [
  { label: 'UAE Freezone', value: 'uae_freezone' },
  { label: 'UAE Mainland', value: 'uae_mainland' },
  { label: 'Saudi MISA', value: 'saudi_misa' },
  { label: 'Qatar QFC', value: 'qatar_qfc' },
  { label: 'Bahrain Sijilat', value: 'bahrain' },
  { label: 'Oman Invest', value: 'oman' },
  { label: 'Kuwait KDIPA', value: 'kuwait' },
] as const

export const DEAL_STAGES = [
  { label: 'New Lead', value: 'new' },
  { label: 'Paid Application', value: 'paid_application' },
  { label: 'KYC Review', value: 'kyc_processing' },
  { label: 'Applied', value: 'applied' },
  { label: 'Registered', value: 'registered' },
  { label: 'Banking Filed', value: 'banking_filed' },
  { label: 'Closed Won', value: 'won' },
  { label: 'Closed Lost', value: 'lost' },
] as const

export const DESKS = [
  { label: 'Dubai Desk', value: 'dubai' },
  { label: 'Riyadh Desk', value: 'riyadh' },
  { label: 'Doha Desk', value: 'doha' },
  { label: 'Manama Desk', value: 'manama' },
] as const

export const WHATSAPP_HSMS = [
  { label: 'kyc_documents_v3 (en)', value: 'kyc_documents_v3' },
  { label: 'license_issued_v2 (en)', value: 'license_issued_v2' },
  { label: 'renewal_reminder_v2 (en)', value: 'renewal_reminder_v2' },
  { label: 'banking_intro_v1 (en)', value: 'banking_intro_v1' },
  { label: 'consult_booking_v1 (en)', value: 'consult_booking_v1' },
] as const

/* ------------------------------------------------------------ read helpers */

export function str(config: Record<string, unknown>, key: string, fallback = ''): string {
  const value = config?.[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

export function num(config: Record<string, unknown>, key: string, fallback: number): number {
  const value = config?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function bool(config: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = config?.[key]
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function labelFor(options: ReadonlyArray<{ label: string; value: string }>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

/* ------------------------------------------------------------------ catalog */

export const NODE_DEFINITIONS: NodeDefinition[] = [
  /* ------------------------------------------------------------- triggers */
  {
    type: 'trigger.lead_created_calculator',
    kind: 'trigger',
    label: 'Lead created via calculator',
    description: 'Fires the moment a lead is captured by a lead-gen tool or form.',
    icon: Calculator,
    accent: 'orange',
    defaults: { source: 'any', minScore: 0 },
    fields: [
      {
        key: 'source',
        label: 'Capture source',
        type: 'select',
        options: [
          { label: 'Any source', value: 'any' },
          { label: 'Tax savings calculator', value: 'tax_calculator' },
          { label: 'Banking eligibility quiz', value: 'banking_quiz' },
          { label: 'Jurisdiction quiz', value: 'jurisdiction_quiz' },
          { label: 'Contact form', value: 'contact_form' },
        ],
      },
      { key: 'minScore', label: 'Minimum lead score', type: 'number', min: 0, max: 100, step: 1, help: '0 enrolls every lead.' },
    ],
    summary: (config) => {
      const source = labelFor(
        [
          { label: 'any source', value: 'any' },
          { label: 'tax calculator', value: 'tax_calculator' },
          { label: 'banking quiz', value: 'banking_quiz' },
          { label: 'jurisdiction quiz', value: 'jurisdiction_quiz' },
          { label: 'contact form', value: 'contact_form' },
        ],
        str(config, 'source', 'any'),
      )
      const min = num(config, 'minScore', 0)
      return min > 0 ? `${source} · score ≥ ${min}` : source
    },
  },
  {
    type: 'trigger.deal_stage_moved',
    kind: 'trigger',
    label: 'Deal stage moved',
    description: 'Fires when a deal enters a pipeline stage.',
    icon: ArrowRightLeft,
    accent: 'orange',
    defaults: { toStage: 'kyc_processing' },
    fields: [
      { key: 'toStage', label: 'Moved to stage', type: 'select', options: DEAL_STAGES },
      { key: 'fromStage', label: 'Only when leaving (optional)', type: 'select', options: [{ label: 'Any stage', value: 'any' }, ...DEAL_STAGES] },
    ],
    summary: (config) => {
      const from = str(config, 'fromStage', 'any')
      const to = labelFor(DEAL_STAGES, str(config, 'toStage', 'new'))
      return from && from !== 'any' ? `${labelFor(DEAL_STAGES, from)} → ${to}` : `enters ${to}`
    },
  },
  {
    type: 'trigger.license_expiring',
    kind: 'trigger',
    label: 'License expiring',
    description: 'Fires on a rolling window before a trade license lapses.',
    icon: ShieldAlert,
    accent: 'orange',
    defaults: { daysAhead: 30, jurisdiction: 'any' },
    fields: [
      { key: 'daysAhead', label: 'Days before expiry', type: 'number', min: 1, max: 365, step: 1 },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: [{ label: 'Any jurisdiction', value: 'any' }, ...JURISDICTIONS] },
    ],
    summary: (config) => {
      const days = num(config, 'daysAhead', 30)
      const jurisdiction = str(config, 'jurisdiction', 'any')
      const scope = jurisdiction === 'any' ? 'any jurisdiction' : labelFor(JURISDICTIONS, jurisdiction)
      return `${days} days ahead · ${scope}`
    },
  },
  {
    type: 'trigger.lead_score_above',
    kind: 'trigger',
    label: 'Lead score threshold',
    description: 'Fires when the computed lead score crosses a threshold.',
    icon: TrendingUp,
    accent: 'orange',
    defaults: { threshold: 85 },
    fields: [{ key: 'threshold', label: 'Score greater than', type: 'number', min: 0, max: 100, step: 1 }],
    summary: (config) => `score > ${num(config, 'threshold', 85)}`,
  },

  /* ----------------------------------------------------------- conditions */
  {
    type: 'condition.jurisdiction',
    kind: 'condition',
    label: 'Jurisdiction check',
    description: 'Branch on the jurisdiction the lead is forming in.',
    icon: GitBranch,
    accent: 'violet',
    defaults: { operator: 'equals', value: 'uae_freezone' },
    fields: [
      {
        key: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { label: 'is', value: 'equals' },
          { label: 'is not', value: 'not_equals' },
        ],
      },
      { key: 'value', label: 'Jurisdiction', type: 'select', options: JURISDICTIONS },
    ],
    summary: (config) =>
      `${str(config, 'operator', 'equals') === 'not_equals' ? 'is not' : 'is'} ${labelFor(JURISDICTIONS, str(config, 'value', 'uae_freezone'))}`,
  },
  {
    type: 'condition.deal_value',
    kind: 'condition',
    label: 'Deal value check',
    description: 'Branch on the estimated value of the deal, in USD.',
    icon: GitBranch,
    accent: 'violet',
    defaults: { operator: 'greater_than', amount: 5000 },
    fields: [
      {
        key: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { label: 'greater than', value: 'greater_than' },
          { label: 'less than', value: 'less_than' },
          { label: 'equals', value: 'equals' },
        ],
      },
      { key: 'amount', label: 'Amount (USD)', type: 'number', min: 0, step: 100 },
    ],
    summary: (config) => {
      const operator = str(config, 'operator', 'greater_than')
      const word = operator === 'less_than' ? '<' : operator === 'equals' ? '=' : '>'
      return `value ${word} $${num(config, 'amount', 5000).toLocaleString('en-US')}`
    },
  },
  {
    type: 'condition.consent',
    kind: 'condition',
    label: 'Email consent check',
    description: 'Guards a marketing branch behind explicit consent.',
    icon: GitBranch,
    accent: 'violet',
    defaults: { channel: 'email', required: 'granted' },
    fields: [
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'WhatsApp', value: 'whatsapp' },
        ],
      },
      {
        key: 'required',
        label: 'Consent must be',
        type: 'select',
        options: [
          { label: 'Granted', value: 'granted' },
          { label: 'Not denied', value: 'not_denied' },
        ],
      },
    ],
    summary: (config) =>
      `${str(config, 'channel', 'email')} consent ${str(config, 'required', 'granted') === 'not_denied' ? 'not denied' : 'granted'}`,
  },

  /* -------------------------------------------------------------- actions */
  {
    type: 'action.send_whatsapp_hsm',
    kind: 'action',
    label: 'Send WhatsApp HSM',
    description: 'Sends an approved Meta WhatsApp template (HSM).',
    icon: MessageSquare,
    accent: 'emerald',
    defaults: { template: 'kyc_documents_v3', language: 'en', fallbackText: '' },
    fields: [
      { key: 'template', label: 'Approved template', type: 'select', options: WHATSAPP_HSMS },
      {
        key: 'language',
        label: 'Language',
        type: 'select',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Arabic', value: 'ar' },
        ],
      },
      { key: 'fallbackText', label: 'Free-text fallback', type: 'textarea', rows: 2, help: 'Used only when no template is approved.' },
    ],
    summary: (config) => `${str(config, 'template', 'kyc_documents_v3')} · ${str(config, 'language', 'en')}`,
  },
  {
    type: 'action.send_ses_email',
    kind: 'action',
    label: 'Send SES email',
    description: 'Sends a rendered email template through Amazon SES.',
    icon: Send,
    accent: 'blue',
    defaults: { subject: 'Your GCC formation update', templateName: '', preheader: '' },
    fields: [
      { key: 'subject', label: 'Subject line', type: 'text', placeholder: '{{first_name}}, your freezone quote is ready' },
      { key: 'templateName', label: 'Template', type: 'text', placeholder: 'welcome-nurture-01' },
      { key: 'preheader', label: 'Preheader', type: 'text', placeholder: 'Preview text shown in the inbox' },
    ],
    summary: (config) => str(config, 'subject', 'Your GCC formation update'),
  },
  {
    type: 'action.assign_desk',
    kind: 'action',
    label: 'Assign to desk',
    description: 'Routes the record to a regional desk and notifies the owner.',
    icon: Building2,
    accent: 'amber',
    defaults: { desk: 'dubai', notifyOwner: true },
    fields: [
      { key: 'desk', label: 'Desk', type: 'select', options: DESKS },
      { key: 'notifyOwner', label: 'Notify the new owner', type: 'switch' },
    ],
    summary: (config) => `${labelFor(DESKS, str(config, 'desk', 'dubai'))}${bool(config, 'notifyOwner', true) ? ' · notify' : ''}`,
  },
  {
    type: 'action.create_task',
    kind: 'action',
    label: 'Create follow-up task',
    description: 'Opens a CRM task for a human to pick up.',
    icon: CheckSquare,
    accent: 'amber',
    defaults: { title: 'Call lead about KYC documents', dueInDays: 1, priority: 'normal' },
    fields: [
      { key: 'title', label: 'Task title', type: 'text' },
      { key: 'dueInDays', label: 'Due in (days)', type: 'number', min: 0, max: 90, step: 1 },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
        ],
      },
    ],
    summary: (config) => `${str(config, 'title', 'Follow-up task')} · ${str(config, 'priority', 'normal')}`,
  },
  {
    type: 'action.wait',
    kind: 'delay',
    label: 'Wait',
    description: 'Pauses the run before continuing to the next step.',
    icon: Timer,
    accent: 'blue',
    defaults: { duration: 1, unit: 'days' },
    fields: [
      { key: 'duration', label: 'Duration', type: 'number', min: 1, step: 1 },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: [
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' },
        ],
      },
    ],
    summary: (config) => `${num(config, 'duration', 1)} ${str(config, 'unit', 'days')}`,
  },
]

const BY_TYPE = new Map(NODE_DEFINITIONS.map((definition) => [definition.type, definition]))

/** Unknown types survive a round-trip through jsonb: the canvas renders a
 * placeholder rather than dropping the node the user placed. */
export function getNodeDefinition(type: unknown): NodeDefinition | null {
  return typeof type === 'string' ? BY_TYPE.get(type) ?? null : null
}

export function nodeAccentClass(accent: NodeAccent): string {
  switch (accent) {
    case 'blue':
      return 'bg-blue-50 text-blue-600 border-blue-200'
    case 'violet':
      return 'bg-violet-50 text-violet-600 border-violet-200'
    case 'emerald':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    case 'amber':
      return 'bg-amber-50 text-amber-600 border-amber-200'
    default:
      return 'bg-orange-50 text-[var(--orange)] border-orange-200'
  }
}

export function nodeAccentBar(accent: NodeAccent): string {
  switch (accent) {
    case 'blue':
      return 'bg-blue-500'
    case 'violet':
      return 'bg-violet-500'
    case 'emerald':
      return 'bg-emerald-500'
    case 'amber':
      return 'bg-amber-500'
    default:
      return 'bg-[var(--orange)]'
  }
}

export const KIND_LABEL: Record<NodeKind, string> = {
  trigger: 'TRIGGER',
  condition: 'CONDITION',
  action: 'ACTION',
  delay: 'DELAY',
}

export const KIND_ICON: Record<NodeKind, LucideIcon> = {
  trigger: Zap,
  condition: GitBranch,
  action: Send,
  delay: Timer,
}
