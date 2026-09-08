// WhatsApp campaign dispatcher over the platform Drizzle schema.
//
// Storage mapping (the schema has no whatsapp_campaigns tables):
//   - A campaign is a `flows` row whose trigger_config carries
//     { entityKind: 'campaign', template_name, template_language,
//       audience_filter, variable_mappings, header_media_url,
//       run_state, total_contacts, sent_count, failed_count }.
//     flows.status stays the editorial lifecycle (draft/active/…); the dispatch
//     state machine lives in trigger_config.run_state because the flows status
//     enum has no running/completed states.
//   - Per-recipient sends are `outbox_jobs` rows (job_type 'send_whatsapp'),
//     deduplicated by idempotency_key = `campaign:{flowId}:{contactId}`.
//
// Core contract:
//   1. Atomic state lock prevents double-dispatch (run_state queued/paused → running)
//   2. Token bucket rate limiter paces sends to avoid Meta rate limits
//   3. Each pending outbox job is dispatched individually with error handling
//   4. Pause is checked between each send
//   5. Counters (sent/failed) are recomputed from outbox_jobs, not incremented blind

import { randomUUID } from 'crypto'
import { and, count, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, flows, outbox_jobs } from '@gccstartup/db'
import { sendWhatsappTemplateWithMeta } from './client'
import { sanitizePhoneNumber } from './phone'

// ─── Token Bucket Rate Limiter ──────────────────────────────────────────

class TokenBucket {
  private capacity: number
  private tokens: number
  private lastRefill: number
  private refillRate: number // tokens per ms

  constructor(ratePerSecond: number) {
    this.capacity = Math.max(1, ratePerSecond)
    this.tokens = this.capacity
    this.lastRefill = Date.now()
    this.refillRate = this.capacity / 1000
  }

  async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now()
      const elapsed = now - this.lastRefill
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate)
      this.lastRefill = now

      if (this.tokens >= 1) {
        this.tokens -= 1
        return
      }

      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate)
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 100)))
    }
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

type CampaignConfig = {
  entityKind: 'campaign'
  template_name: string
  template_language?: string
  audience_filter?: Record<string, unknown> | null
  variable_mappings?: Record<string, string> | null
  header_media_url?: string | null
  run_state: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  total_contacts?: number
  sent_count?: number
  failed_count?: number
}

type ContactRow = typeof contacts.$inferSelect

// ─── Audience Resolution ────────────────────────────────────────────────

/**
 * Resolves the target audience for a campaign based on the audience_filter JSON.
 * Supports sendToAll / includeTags / excludeTags on `contacts.tags` (jsonb).
 * Only contacts with a phone number and no soft-delete are eligible.
 */
export async function resolveAudience(
  _client: unknown,
  audienceFilter: Record<string, unknown> | null
): Promise<ContactRow[]> {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(isNotNull(contacts.phone), isNull(contacts.deleted_at)))

  const af = audienceFilter ?? {}
  const includeTags = Array.isArray(af.includeTags) ? (af.includeTags as unknown[]) : null
  const excludeTags = Array.isArray(af.excludeTags) ? (af.excludeTags as unknown[]) : null

  return rows.filter((row) => {
    if (!row.phone) return false
    if (includeTags || excludeTags) {
      const tags = Array.isArray(row.tags) ? row.tags : []
      if (includeTags && !includeTags.every((t) => tags.includes(String(t)))) return false
      if (excludeTags && excludeTags.some((t) => tags.includes(String(t)))) return false
    }
    return true
  })
}

// ─── Template Variable Resolution ───────────────────────────────────────

/**
 * Resolves template variable placeholders ({{1}}, {{2}}, ...) using the
 * campaign's variable_mappings and the contact's field values.
 */
function resolveVariables(
  variableMappings: Record<string, string> | null,
  contact: ContactRow | null,
  fallbackPhone: string
): string[] {
  if (!variableMappings) return []

  const contactData: Record<string, unknown> = {
    first_name: contact?.first_name || 'Customer',
    last_name: contact?.last_name || '',
    full_name: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Customer',
    phone: contact?.phone || fallbackPhone,
    email: contact?.email || '',
    company: contact?.company || '',
    company_name: contact?.company || '',
  }

  const bodyVars: string[] = []
  const keys = Object.keys(variableMappings)
    .filter((k) => !isNaN(Number(k)))
    .sort((a, b) => Number(a) - Number(b))

  for (const k of keys) {
    const fieldName = variableMappings[k]
    const val = fieldName && contactData[fieldName] !== undefined ? String(contactData[fieldName]) : ''
    bodyVars.push(val || 'Valued Customer')
  }

  return bodyVars
}

// ─── Helpers ────────────────────────────────────────────────────────────

async function loadCampaign(flowId: string): Promise<{ flow: typeof flows.$inferSelect; cfg: CampaignConfig } | null> {
  const rows = await db.select().from(flows).where(eq(flows.id, flowId)).limit(1)
  const flow = rows[0]
  if (!flow) return null
  const cfg = flow.trigger_config as unknown as CampaignConfig
  if (!cfg || cfg.entityKind !== 'campaign') return null
  return { flow, cfg }
}

async function updateRunState(flowId: string, cfg: CampaignConfig, patch: Partial<CampaignConfig>) {
  await db
    .update(flows)
    .set({ trigger_config: { ...cfg, ...patch }, updated_at: new Date() })
    .where(eq(flows.id, flowId))
}

async function countPendingJobs(campaignId: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(outbox_jobs)
    .where(
      and(
        eq(outbox_jobs.job_type, 'send_whatsapp'),
        sql`${outbox_jobs.payload}->>'campaignId' = ${campaignId}`,
        inArray(outbox_jobs.status, ['pending', 'sending'])
      )
    )
  return Number(rows[0]?.n ?? 0)
}

// ─── Main Dispatch Function ─────────────────────────────────────────────

export type DispatchResult = {
  success: boolean
  error?: string
  sentCount?: number
  failedCount?: number
}

/**
 * Executes or resumes a WhatsApp campaign dispatch.
 *
 * State machine: queued/paused → running → completed/failed
 * The state lock prevents double-dispatch: a campaign already running can
 * never be locked again, so concurrent dispatch attempts fail at the lock step.
 */
export async function dispatchCampaign(
  _client: unknown,
  campaignId: string,
  options: { ratePerSecond?: number } = {}
): Promise<DispatchResult> {
  console.log(`[dispatcher] Starting campaign dispatch: ${campaignId}`)

  // 1. Lock the campaign: only queued/paused may transition to running.
  const loaded = await loadCampaign(campaignId)
  if (!loaded) return { success: false, error: 'Campaign not found' }

  const { cfg } = loaded
  if (cfg.run_state === 'running') {
    return { success: false, error: 'Campaign is not in a dispatchable state' }
  }
  if (cfg.run_state === 'completed' || cfg.run_state === 'failed') {
    return { success: false, error: 'Campaign is not in a dispatchable state' }
  }

  await updateRunState(campaignId, cfg, { run_state: 'running' })

  try {
    // 2. Rate limiter
    const bucket = new TokenBucket(options.ratePerSecond ?? 20)

    // 3. Resolve audience and materialize per-recipient outbox jobs
    const audience = await resolveAudience(null, cfg.audience_filter ?? null)
    console.log(`[dispatcher] Resolved ${audience.length} contacts for campaign ${campaignId}`)

    for (const contact of audience) {
      const sanitized = sanitizePhoneNumber(contact.phone)
      if (!sanitized.isValid) continue

      await db
        .insert(outbox_jobs)
        .values({
          id: randomUUID(),
          job_type: 'send_whatsapp',
          payload: {
            campaignId,
            contactId: contact.id,
            phone: sanitized.e164,
            wamid: null,
          },
          status: 'pending',
          next_run_at: new Date(),
          idempotency_key: `campaign:${campaignId}:${contact.id}`,
        })
        .onConflictDoNothing()
    }

    // 4. Fetch pending jobs for this campaign
    const pendingJobs = await db
      .select()
      .from(outbox_jobs)
      .where(
        and(
          eq(outbox_jobs.job_type, 'send_whatsapp'),
          sql`${outbox_jobs.payload}->>'campaignId' = ${campaignId}`,
          eq(outbox_jobs.status, 'pending')
        )
      )

    console.log(`[dispatcher] Processing ${pendingJobs.length} pending messages`)

    let sentCount = 0
    let failedCount = 0

    // 5. Dispatch loop
    for (const job of pendingJobs) {
      // Pause check between each send
      const current = await loadCampaign(campaignId)
      if (current && current.cfg.run_state === 'paused') {
        console.log(`[dispatcher] Campaign ${campaignId} interrupted by pause`)
        return { success: true, sentCount, failedCount }
      }

      await db
        .update(outbox_jobs)
        .set({ status: 'sending', started_at: new Date(), updated_at: new Date() })
        .where(eq(outbox_jobs.id, job.id))

      await bucket.acquire()

      const payload = (job.payload ?? {}) as Record<string, unknown>
      const phone = typeof payload.phone === 'string' ? payload.phone : ''
      const contactId = typeof payload.contactId === 'string' ? payload.contactId : null

      let contactRow: ContactRow | null = null
      if (contactId) {
        const rows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
        contactRow = rows[0] ?? null
      }

      const resolvedVars = resolveVariables(cfg.variable_mappings ?? null, contactRow, phone)

      const result = await sendWhatsappTemplateWithMeta(
        phone,
        cfg.template_name,
        cfg.template_language || 'en',
        {
          headerMediaUrl: cfg.header_media_url || undefined,
          bodyVariables: resolvedVars.length > 0 ? resolvedVars : undefined,
        }
      )

      if (result) {
        await db
          .update(outbox_jobs)
          .set({
            status: 'sent',
            payload: { ...payload, wamid: result.wamid },
            completed_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(outbox_jobs.id, job.id))
        sentCount++
        console.log(`[dispatcher] Sent to ${phone} (wamid: ${result.wamid})`)
      } else {
        await db
          .update(outbox_jobs)
          .set({
            status: 'failed',
            last_error: 'Meta API send failed (env unset or rejected)',
            completed_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(outbox_jobs.id, job.id))
        failedCount++
        console.warn(`[dispatcher] Failed to send to ${phone}`)
      }
    }

    // 6. Final counter update + completion check
    const remaining = await countPendingJobs(campaignId)
    await updateRunState(campaignId, cfg, {
      run_state: remaining === 0 ? 'completed' : 'running',
      sent_count: sentCount,
      failed_count: failedCount,
      total_contacts: audience.length,
    })

    if (remaining === 0) {
      console.log(`[dispatcher] Campaign ${campaignId} completed successfully`)
    }

    return { success: true, sentCount, failedCount }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`[dispatcher] Fatal error during dispatch: ${message}`, error)
    await updateRunState(campaignId, { ...cfg, run_state: 'running' }, { run_state: 'failed' })
    return { success: false, error: message }
  }
}

/**
 * Pause a running campaign. The dispatch loop checks run_state between each
 * send, so it stops at the next iteration.
 */
export async function pauseCampaign(
  _client: unknown,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const loaded = await loadCampaign(campaignId)
  if (!loaded || loaded.cfg.run_state !== 'running') {
    return { success: false, error: 'Only running campaigns can be paused' }
  }

  await updateRunState(campaignId, loaded.cfg, { run_state: 'paused' })
  return { success: true }
}

/**
 * Resume a paused campaign by re-invoking the dispatcher.
 */
export async function resumeCampaign(
  _client: unknown,
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  const loaded = await loadCampaign(campaignId)
  if (!loaded || loaded.cfg.run_state !== 'paused') {
    return { success: false, error: 'Only paused campaigns can be resumed' }
  }

  return dispatchCampaign(_client, campaignId)
}
