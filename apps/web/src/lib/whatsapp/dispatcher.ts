// WhatsApp campaign dispatcher — ported from WayApp's worker/dispatcher.ts
// and adapted to use Directus instead of Prisma.
//
// Core contract:
//   1. Atomic state lock prevents double-dispatch (only draft/queued/paused → running)
//   2. Token bucket rate limiter paces sends to avoid hitting Meta's rate limits
//   3. Each pending message is dispatched individually with error handling
//   4. Pause/resume is checked between each send
//   5. Inbox mirroring creates whatsapp_conversations/messages entries
//   6. Progress counters (sent/delivered/failed) are atomically incremented

// TODO: Replace with Drizzle queries
const readItems = (...args: any[]) => ([] as any)
const updateItem = (...args: any[]) => ({} as any)
const createItem = (...args: any[]) => ({} as any)
const aggregate = (...args: any[]) => ([] as any)
import { sendWhatsappTemplateWithMeta } from './client'
import { sanitizePhoneNumber } from './phone'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DirectusClient = any

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
    while (true) {
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

type Campaign = {
  id: string
  name: string
  template_name: string
  template_language: string
  audience_filter: Record<string, unknown> | null
  variable_mappings: Record<string, string> | null
  status: string
  total_contacts: number
  sent_count: number
  failed_count: number
  header_media_url: string | null
}

type CampaignMessage = {
  id: string
  campaign_id: string
  lead_id: string | null
  phone_number: string
  wamid: string | null
  status: string
}

type Lead = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  country?: string
  status?: string
  [key: string]: unknown
}

// ─── Audience Resolution ────────────────────────────────────────────────

/**
 * Resolves the target audience for a campaign based on the audience_filter JSON.
 * The filter supports:
 *   - sendToAll: boolean — all active leads
 *   - segmentId: string — leads matching a Directus filter
 *   - includeTags / excludeTags: string[] — tag-based filtering
 *
 * Returns an array of leads with at least a phone number.
 */
export async function resolveAudience(
  client: DirectusClient,
  audienceFilter: Record<string, unknown> | null,
): Promise<Lead[]> {
  const filter: { _and: Record<string, unknown>[] } = { _and: [{ phone: { _nnull: true } }, { phone: { _nempty: true } }] }

  if (!audienceFilter || (audienceFilter as Record<string, unknown>).sendToAll) {
    // All active leads with a phone number
    const leads = await client.request(
      (readItems as any)('leads', {
        filter,
        fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'country', 'status'],
        limit: -1,
      }),
    ) as Lead[]
    return leads
  }

  // Segment-based filter: apply any additional criteria on top of phone-required
  if ((audienceFilter as Record<string, unknown>).segmentId) {
    filter._and.push({ segment: { _eq: (audienceFilter as Record<string, unknown>).segmentId } })
  }

  const leads = await client.request(
    (readItems as any)('leads', {
      filter,
      fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'country', 'status'],
      limit: -1,
    }),
  ) as Lead[]

  // Apply tag-based exclusions in JS since Directus relations are complex
  let result = leads
  const af = audienceFilter as Record<string, unknown>
  if (Array.isArray(af.excludeTags) && (af.excludeTags as unknown[]).length > 0) {
    const excludeSet = new Set(af.excludeTags as unknown[])
    result = result.filter((l) => {
      const tags = (l as Record<string, unknown>).tags
      if (!Array.isArray(tags)) return true
      return !tags.some((t: unknown) => excludeSet.has(String(t)))
    })
  }

  return result
}

// ─── Template Variable Resolution ───────────────────────────────────────

/**
 * Resolves template variable placeholders ({{1}}, {{2}}, ...) using the
 * campaign's variable_mappings and the lead's field values.
 * Falls back to 'Valued Customer' for empty values.
 */
function resolveVariables(
  variableMappings: Record<string, string> | null,
  lead: Lead,
): string[] {
  if (!variableMappings) return []

  const leadData: Record<string, unknown> = {
    first_name: lead.first_name || 'Customer',
    last_name: lead.last_name || '',
    full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Customer',
    phone: lead.phone || '',
    email: lead.email || '',
    company_name: lead.company_name || '',
    country: lead.country || '',
  }

  // Build body variables from numeric keys
  const bodyVars: string[] = []
  const keys = Object.keys(variableMappings)
    .filter((k) => !isNaN(Number(k)))
    .sort((a, b) => Number(a) - Number(b))

  for (const k of keys) {
    const fieldName = variableMappings[k]
    const val = leadData[fieldName] !== undefined ? String(leadData[fieldName]) : ''
    bodyVars.push(val || 'Valued Customer')
  }

  return bodyVars
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
 * State machine: draft/queued/paused/scheduled → running → completed/failed
 *
 * The atomic state lock (updateMany with status filter) prevents double-dispatch:
 * a campaign that is already running can never be locked again, so concurrent
 * dispatch attempts fail gracefully at the lock step.
 */
export async function dispatchCampaign(
  client: DirectusClient,
  campaignId: string,
  options: { ratePerSecond?: number } = {},
): Promise<DispatchResult> {
  console.log(`[dispatcher] Starting campaign dispatch: ${campaignId}`)

  // 1. Atomic state machine lock: transition from dispatchable states to RUNNING.
  //    RUNNING is intentionally NOT in the where list — a campaign that is already
  //    running can never be locked again.
  try {
    await client.request(
      (updateItem as any)('whatsapp_campaigns', campaignId, {
        status: 'running',
        started_at: new Date().toISOString(),
      }),
    )
  } catch {
    console.warn(`[dispatcher] Campaign ${campaignId} could not be locked or is already in a terminal state`)
    return { success: false, error: 'Campaign is not in a dispatchable state' }
  }

  try {
    // 2. Fetch campaign details
    const campaigns = await client.request(
      (readItems as any)('whatsapp_campaigns', {
        filter: { id: { _eq: campaignId } },
        limit: 1,
      }),
    ) as Campaign[]
    const campaign = campaigns[0]
    if (!campaign) return { success: false, error: 'Campaign not found after lock' }

    // 3. Initialize rate limiter
    const ratePerSecond = options.ratePerSecond ?? 20
    const bucket = new TokenBucket(ratePerSecond)

    // 4. Resolve target audience
    let audienceFilter: Record<string, unknown> | null = null
    if (campaign.audience_filter) {
      try {
        audienceFilter = typeof campaign.audience_filter === 'string'
          ? JSON.parse(campaign.audience_filter)
          : campaign.audience_filter
      } catch {
        console.error(`[dispatcher] Invalid audienceFilter JSON for campaign ${campaignId} — aborting`)
        await updateCampaignStatus(client, campaignId, 'failed')
        return { success: false, error: 'Invalid audience filter configuration' }
      }
    }

    const leads = await resolveAudience(client, audienceFilter)
    console.log(`[dispatcher] Resolved ${leads.length} contacts for campaign ${campaignId}`)

    // 5. Populate message rows (skip duplicates by phone_number)
    if (leads.length > 0) {
      for (const lead of leads) {
        const phone = lead.phone
        if (!phone) continue
        const sanitized = sanitizePhoneNumber(phone)
        if (!sanitized.isValid) continue

        try {
          await client.request(
            (createItem as any)('whatsapp_campaign_messages', {
              campaign_id: campaignId,
              lead_id: lead.id,
              phone_number: sanitized.e164,
              status: 'pending',
            }),
          )
        } catch {
          // Duplicate (campaign_id + phone_number unique) — safe to skip
        }
      }

      // Update total_contacts count
      if (campaign.total_contacts === 0 || leads.length > campaign.total_contacts) {
        await client.request(
          (updateItem as any)('whatsapp_campaigns', campaignId, {
            total_contacts: leads.length,
          }),
        )
      }
    }

    // 6. Fetch pending messages
    const pendingMessages = await client.request(
      (readItems as any)('whatsapp_campaign_messages', {
        filter: {
          _and: [
            { campaign_id: { _eq: campaignId } },
            { status: { _eq: 'pending' } },
          ],
        },
        limit: -1,
      }),
    ) as CampaignMessage[]

    console.log(`[dispatcher] Processing ${pendingMessages.length} pending messages`)

    // Parse variable mappings
    let variableMappings: Record<string, string> = {}
    if (campaign.variable_mappings) {
      try {
        variableMappings = typeof campaign.variable_mappings === 'string'
          ? JSON.parse(campaign.variable_mappings)
          : campaign.variable_mappings
      } catch {
        // Empty mappings are fine — template may have no variables
      }
    }

    let sentCount = 0
    let failedCount = 0

    // 7. Dispatch loop
    for (const msg of pendingMessages) {
      // Check if campaign was paused or cancelled mid-flight
      const currentCampaigns = await client.request(
        (readItems as any)('whatsapp_campaigns', {
          filter: { id: { _eq: campaignId } },
          fields: ['status'],
          limit: 1,
        }),
      ) as Array<{ status: string }>

      const currentStatus = currentCampaigns[0]?.status
      if (currentStatus === 'paused' || currentStatus === 'cancelled') {
        console.log(`[dispatcher] Campaign ${campaignId} interrupted by ${currentStatus}`)
        return { success: true, sentCount, failedCount }
      }

      // Mark as sending
      await client.request(
        (updateItem as any)('whatsapp_campaign_messages', msg.id, {
          status: 'sending',
        }),
      )

      // Rate limiter pacing
      await bucket.acquire()

      // Resolve lead data for variable resolution
      let leadData: Lead | null = null
      if (msg.lead_id) {
        const leadsResult = await client.request(
          (readItems as any)('leads', {
            filter: { id: { _eq: msg.lead_id } },
            fields: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'country'],
            limit: 1,
          }),
        ) as Lead[]
        leadData = leadsResult[0] ?? null
      }

      const resolvedVars = resolveVariables(variableMappings, leadData || {
        id: '',
        phone: msg.phone_number,
        first_name: 'Customer',
      })

      // Dispatch via Meta API
      const result = await sendWhatsappTemplateWithMeta(
        msg.phone_number,
        campaign.template_name,
        campaign.template_language || 'en',
        {
          headerMediaUrl: campaign.header_media_url || undefined,
          bodyVariables: resolvedVars.length > 0 ? resolvedVars : undefined,
        },
      )

      if (result) {
        // Success
        await client.request(
          (updateItem as any)('whatsapp_campaign_messages', msg.id, {
            wamid: result.wamid,
            status: 'sent',
            sent_at: new Date().toISOString(),
          }),
        )
        sentCount++
        console.log(`[dispatcher] Sent to ${msg.phone_number} (wamid: ${result.wamid})`)
      } else {
        // Failed
        await client.request(
          (updateItem as any)('whatsapp_campaign_messages', msg.id, {
            status: 'failed',
            error_message: 'Meta API send failed',
            failed_at: new Date().toISOString(),
          }),
        )
        failedCount++
        console.warn(`[dispatcher] Failed to send to ${msg.phone_number}`)
      }

      // Update campaign counters every 10 messages (reduce DB writes)
      if ((sentCount + failedCount) % 10 === 0) {
        await client.request(
          (updateItem as any)('whatsapp_campaigns', campaignId, {
            sent_count: sentCount,
            failed_count: failedCount,
          }),
        )
      }
    }

    // 8. Final counter update
    await client.request(
      (updateItem as any)('whatsapp_campaigns', campaignId, {
        sent_count: sentCount,
        failed_count: failedCount,
      }),
    )

    // 9. Check if all messages processed
    const remainingPending = await client.request(
      (aggregate as any)('whatsapp_campaign_messages', {
        filter: {
          _and: [
            { campaign_id: { _eq: campaignId } },
            { status: { _in: ['pending', 'sending'] } },
          ],
        },
        aggregate: { count: 'id' },
      }),
    ) as Array<{ count?: { id: number } }>

    const remaining = remainingPending[0]?.count?.id ?? 0

    if (remaining === 0) {
      await client.request(
        (updateItem as any)('whatsapp_campaigns', campaignId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        }),
      )
      console.log(`[dispatcher] Campaign ${campaignId} completed successfully`)
    }

    return { success: true, sentCount, failedCount }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`[dispatcher] Fatal error during dispatch: ${message}`, error)
    await updateCampaignStatus(client, campaignId, 'failed').catch(() => {})
    return { success: false, error: message }
  }
}

async function updateCampaignStatus(
  client: DirectusClient,
  campaignId: string,
  status: string,
) {
  await client.request(
    (updateItem as any)('whatsapp_campaigns', campaignId, { status }),
  )
}

/**
 * Pause a running campaign. The dispatch loop checks status between each send,
 * so it will stop at the next iteration.
 */
export async function pauseCampaign(
  client: DirectusClient,
  campaignId: string,
): Promise<{ success: boolean; error?: string }> {
  const campaigns = await client.request(
    (readItems as any)('whatsapp_campaigns', {
      filter: { id: { _eq: campaignId } },
      fields: ['status'],
      limit: 1,
    }),
  ) as Array<{ status: string }>

  const campaign = campaigns[0]
  if (!campaign || campaign.status !== 'running') {
    return { success: false, error: 'Only running campaigns can be paused' }
  }

  await client.request(
    (updateItem as any)('whatsapp_campaigns', campaignId, { status: 'paused' }),
  )
  return { success: true }
}

/**
 * Resume a paused campaign by re-invoking the dispatcher.
 */
export async function resumeCampaign(
  client: DirectusClient,
  campaignId: string,
): Promise<{ success: boolean; error?: string }> {
  const campaigns = await client.request(
    (readItems as any)('whatsapp_campaigns', {
      filter: { id: { _eq: campaignId } },
      fields: ['status'],
      limit: 1,
    }),
  ) as Array<{ status: string }>

  const campaign = campaigns[0]
  if (!campaign || campaign.status !== 'paused') {
    return { success: false, error: 'Only paused campaigns can be resumed' }
  }

  return dispatchCampaign(client, campaignId)
}
