/**
 * Typed access to the email-platform collections.
 *
 * `src/lib/directus.ts` owns the `Schema` type that the service-token client is
 * generic over, and it does not yet list the seven collections added by
 * directus/scripts/add-email-platform-collections.ts. Rather than edit that file,
 * this module widens the schema locally and hands back the same underlying client.
 * When the shared Schema learns these collections, delete `EmailSchema` and this
 * cast — nothing else has to change.
 */
// TODO: Replace with Drizzle queries
type DirectusClient<T> = any
type RestClient<T> = any
import { directus, type LeadItem } from '@/lib/directus'

export type EmailTemplateItem = {
  id: string
  name: string
  slug: string
  subject?: string | null
  preheader?: string | null
  blocks?: unknown
  html?: string | null
  text?: string | null
  category?: 'marketing' | 'transactional' | 'flow' | 'notification' | null
  is_active?: boolean | null
  date_created?: string
  date_updated?: string
}

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled'

export type EmailCampaignItem = {
  id: string
  name: string
  subject?: string | null
  preheader?: string | null
  template?: string | EmailTemplateItem | null
  segment?: string | EmailSegmentItem | null
  blocks?: unknown
  segment_filter?: unknown
  html_snapshot?: string | null
  text_snapshot?: string | null
  status?: EmailCampaignStatus | null
  scheduled_at?: string | null
  sent_at?: string | null
  sender_campaign_id?: string | null
  sender_group_id?: string | null
  recipient_count?: number | null
  stats?: Record<string, unknown> | null
  last_error?: string | null
  date_created?: string
  date_updated?: string
}

export type EmailSegmentItem = {
  id: string
  name: string
  slug: string
  description?: string | null
  filter?: unknown
  date_created?: string
}

export type EmailFlowTriggerType = 'manual' | 'lead_created' | 'lead_status' | 'segment'

export type EmailFlowItem = {
  id: string
  name: string
  slug: string
  description?: string | null
  trigger_type?: EmailFlowTriggerType | null
  trigger_config?: unknown
  status?: 'draft' | 'active' | 'paused' | 'archived' | null
  date_created?: string
}

export type EmailFlowStepItem = {
  id: string
  flow: string | EmailFlowItem
  sort?: number | null
  delay_minutes?: number | null
  template?: string | EmailTemplateItem | null
  subject_override?: string | null
  condition?: unknown
}

export type EmailFlowEnrollmentItem = {
  id: string
  flow: string | EmailFlowItem
  lead: string | LeadItem
  enrollment_key: string
  current_step?: number | null
  status?: 'active' | 'completed' | 'cancelled' | 'failed' | null
  next_run_at?: string | null
  enrolled_at?: string | null
  last_step_at?: string | null
  completed_at?: string | null
  last_error?: string | null
}

export type EmailSuppressionItem = {
  id: string
  email: string
  reason?: 'unsubscribed' | 'bounced' | 'spam_reported' | 'manual' | 'invalid' | null
  source?: string | null
  suppressed_at?: string | null
  metadata?: Record<string, unknown> | null
}

export type EmailSchema = { [key: string]: any } & {
  email_templates: EmailTemplateItem[]
  email_campaigns: EmailCampaignItem[]
  email_segments: EmailSegmentItem[]
  email_flows: EmailFlowItem[]
  email_flow_steps: EmailFlowStepItem[]
  email_flow_enrollments: EmailFlowEnrollmentItem[]
  email_suppressions: EmailSuppressionItem[]
}

export type EmailClient = DirectusClient<EmailSchema> & RestClient<EmailSchema>

/** Service-token client, widened to the email collections. Server-only. */
export function emailDirectus(): EmailClient {
  return directus() as unknown as EmailClient
}

/** Relations come back either as a bare id or as an expanded object. */
export function relationId(value: unknown): string | null {
  if (typeof value === 'string') return value || null
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return null
}
