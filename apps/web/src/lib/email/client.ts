/**
 * Typed access to the email-platform tables.
 *
 * The email platform reads and writes through the shared Drizzle instance
 * (`@/lib/db`, backed by `@gccstartup/db`). The item types below are the wire shape
 * the rest of the email modules and the admin API speak; the `to*Item` mappers turn
 * database rows into them so the rest of the layer never touches raw column names.
 */
import { db } from '@/lib/db'
import {
  email_campaigns,
  email_suppressions,
  email_templates,
  flow_enrollments,
  flow_steps,
  flows,
} from '@gccstartup/db'
import { eq } from 'drizzle-orm'

export type EmailTemplateItem = {
  id: string
  name: string
  subject: string
  preheader?: string | null
  blocks?: unknown
  html: string
  text?: string | null
  category?: 'marketing' | 'transactional' | 'flow' | 'notification' | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type EmailCampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'sent'
  | 'cancelled'
  | 'failed'

export type EmailCampaignItem = {
  id: string
  name: string
  template_id: string
  audience_filter?: unknown
  status: EmailCampaignStatus
  scheduled_at: Date | null
  started_at: Date | null
  completed_at: Date | null
  recipient_count: number | null
  variant_b_subject: string | null
  variant_b_template_id: string | null
  test_split_percent: number | null
  winner_criteria: string | null
  winner_variant: string | null
  error: string | null
  created_at: Date
  updated_at: Date
}

export type EmailFlowTriggerType =
  | 'manual'
  | 'lead_created'
  | 'form_submitted'
  | 'tag_added'
  | 'deal_stage_changed'
  | 'date_based'
  | 'event_based'

export type EmailFlowItem = {
  id: string
  name: string
  description: string | null
  trigger_type: EmailFlowTriggerType
  trigger_config: Record<string, unknown>
  status: 'draft' | 'active' | 'paused' | 'archived'
  created_at: Date
  updated_at: Date
}

export type EmailFlowStepItem = {
  id: string
  flow_id: string
  step_index: number
  step_type: string
  config: Record<string, unknown>
}

export type EmailFlowEnrollmentItem = {
  id: string
  flow_id: string
  contact_id: string
  enrollment_key: string
  status: 'active' | 'completed' | 'cancelled' | 'paused'
  current_step: number
  next_run_at: Date | null
  started_at: Date
  completed_at: Date | null
}

export type EmailSuppressionItem = {
  id: string
  email: string
  reason: 'hard_bounce' | 'complaint' | 'manual' | 'invalid'
  source: string | null
  detail: string | null
  contact_id: string | null
  created_at: Date
}

/**
 * Legacy compatibility type. The email modules used to take a Directus client as
 * their first argument; they are Drizzle-backed now and the parameter is accepted
 * but ignored, so existing call sites keep compiling.
 */
export type EmailClient = { readonly __emailClient: true }

/** Compatibility shim for old call sites — the client parameter is no longer used. */
export function emailDirectus(): EmailClient {
  return { __emailClient: true }
}

export async function getTemplateById(id: string): Promise<EmailTemplateItem | null> {
  const rows = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    preheader: null,
    blocks: row.blocks ?? null,
    html: row.html_body,
    text: row.text_body,
    category: row.category,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getCampaignById(id: string): Promise<EmailCampaignItem | null> {
  const rows = await db.select().from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
  return (rows[0] as EmailCampaignItem | undefined) ?? null
}

export async function getFlowById(id: string): Promise<EmailFlowItem | null> {
  const rows = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    trigger_type: row.trigger_type,
    trigger_config: row.trigger_config ?? {},
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function loadFlowStepsById(flowId: string): Promise<EmailFlowStepItem[]> {
  const rows = await db.select().from(flow_steps).where(eq(flow_steps.flow_id, flowId))
  return rows
    .map((row) => ({
      id: row.id,
      flow_id: row.flow_id,
      step_index: row.step_index,
      step_type: row.step_type,
      config: row.config ?? {},
    }))
    .sort((left, right) => left.step_index - right.step_index)
}

export async function getEnrollmentById(id: string): Promise<EmailFlowEnrollmentItem | null> {
  const rows = await db.select().from(flow_enrollments).where(eq(flow_enrollments.id, id)).limit(1)
  return (rows[0] as EmailFlowEnrollmentItem | undefined) ?? null
}

export async function getSuppressionByEmail(email: string): Promise<EmailSuppressionItem | null> {
  const rows = await db.select().from(email_suppressions).where(eq(email_suppressions.email, email)).limit(1)
  return (rows[0] as EmailSuppressionItem | undefined) ?? null
}

/** Relations used to come back either as a bare id or as an expanded object. */
export function relationId(value: unknown): string | null {
  if (typeof value === 'string') return value || null
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return null
}
