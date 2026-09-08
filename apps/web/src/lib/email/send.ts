/**
 * The two sending lanes, and the durable outbox that drives both.
 *
 * Sender's own documentation draws the line: `/v2/message/send` is transactional —
 * 1:1 mail triggered by something a specific person did. `/v2/campaigns` is bulk.
 * Pushing a broadcast down the transactional pipe (which is what
 * src/app/api/admin/email/campaigns/route.ts still does) costs campaign-grade
 * deliverability, Sender's own unsubscribe handling and list hygiene, and puts the
 * account's standing at risk. So:
 *
 *   BULK      resolve segment -> upsert each lead as a subscriber into a
 *             campaign-specific Sender group -> create a real campaign against that
 *             group -> send or schedule it. `sender_campaign_id` on the row is the
 *             evidence a real campaign was created rather than N transactional sends.
 *
 *   1:1       flow steps and lead confirmations go to `/v2/message/send` with a
 *             List-Unsubscribe header and BOTH an html and a text part. Multipart is
 *             not cosmetic: single-part HTML is a measurable spam signal.
 *
 * Nothing here calls Sender directly on the request path. Every outbound call is an
 * `email_sync_jobs` row first — that collection already carries idempotency keys,
 * optimistic-lock claiming, exponential backoff and ambiguity-aware retry
 * suppression, so it is extended with four new job types rather than replaced:
 *
 *   sync_group_member · create_campaign · send_campaign · flow_step
 *
 * Suppression is checked twice on every marketing path — once when the audience is
 * resolved and again immediately before the send — because a lead can unsubscribe in
 * between, and the second check is the one that keeps that promise.
 */
// TODO: Replace with Drizzle queries
const createItem = (...args: any[]) => ({} as any)
const readItems = (...args: any[]) => ([] as any)
const updateItem = (...args: any[]) => ({} as any)
const updateItems = (...args: any[]) => ([] as any)
import { getSiteSettings, type EmailSyncJobItem } from '@/lib/directus'
import { renderEmail, interpolate } from '@/lib/email/render'
import {
  type SenderResult,
  senderAdapter,
} from '@gccstartup/shared'
import { relationId, type EmailCampaignItem, type EmailClient, type EmailTemplateItem } from './client'
import { resolveAudience, resolveSegment } from './segments'
import {
  assertMarketable,
  createUnsubscribeToken,
  listUnsubscribeHeaders,
  normalizeEmail,
  unsubscribeConfigured,
} from './suppression'

/** The three original types plus the four the campaign and flow lanes add. */
export type EmailJobType =
  | 'upsert_subscriber'
  | 'send_transactional'
  | 'suppress_subscriber'
  | 'sync_group_member'
  | 'create_campaign'
  | 'send_campaign'
  | 'flow_step'

/**
 * `Schema['email_sync_jobs']` in src/lib/directus.ts still lists only the three
 * original job types, and that file is finished and owned elsewhere. The column is a
 * plain varchar with no database-level validation, so the new values store and read
 * correctly; this widening exists purely so TypeScript agrees. Delete it when the
 * shared Schema learns the four new types.
 */
export type OutboxJob = Omit<EmailSyncJobItem, 'job_type'> & { job_type: EmailJobType }

/**
 * A job result, plus one extra outcome the original drainer had no way to express:
 * "blocked on something that is not this job's fault". A create_campaign waiting for
 * its member syncs, or any send waiting for EMAIL_UNSUBSCRIBE_SECRET to be
 * configured, must not burn a retry attempt — five exponential backoffs later the
 * job would be dead for a reason that had nothing to do with it.
 */
export type EmailJobResult = SenderResult & { deferralSeconds?: number }

export const OUTBOX_JOB_FIELDS = ['id', 'lead_id', 'idempotency_key', 'event_id', 'job_type', 'status', 'attempts', 'payload'] as const

/**
 * Job types where losing the response means we cannot tell whether mail went out.
 * A stale claim on one of these is failed rather than re-queued: a duplicate
 * delivery is worse than a missed one, and the operator can retry it by hand.
 */
const AMBIGUOUS_JOB_TYPES: ReadonlySet<EmailJobType> = new Set(['send_transactional', 'send_campaign', 'flow_step'])

const DEFAULT_BASE_URL = 'https://gccstartup.com'
const CONTEXT_TTL_MS = 300_000

function integerEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringValue(value: unknown, max = 254): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined
}

function failure(operation: SenderResult['operation'], error: string, retryable = false): EmailJobResult {
  return { ok: false, status: 'failed', operation, error: error.slice(0, 500), retryable }
}

/** Not an error — the job did its job by declining to send. Recorded as `skipped`, never retried. */
function skipped(operation: SenderResult['operation'], reason: string): EmailJobResult {
  return { ok: false, status: 'skipped', operation, error: reason.slice(0, 500), retryable: false }
}

function deferral(operation: SenderResult['operation'], reason: string, seconds: number): EmailJobResult {
  return { ok: false, status: 'failed', operation, error: reason.slice(0, 500), retryable: true, deferralSeconds: seconds }
}

// ---------------------------------------------------------------------------
// Send context
// ---------------------------------------------------------------------------

export type EmailContext = {
  baseUrl: string
  brandName: string
  brandAddress?: string
  fromEmail: string
  fromName: string
}

let contextCache: { at: number; value: EmailContext } | null = null

/**
 * Where the unsubscribe link points and who the mail is from. Memoised because the
 * drainer would otherwise resolve it once per job, and site_settings is an uncached read.
 */
export async function resolveEmailContext(): Promise<EmailContext> {
  if (contextCache && Date.now() - contextCache.at < CONTEXT_TTL_MS) return contextCache.value

  const configured = process.env.EMAIL_PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  let baseUrl = configured || ''
  let brandName = process.env.SENDER_CAMPAIGN_FROM_NAME?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() || 'GCC Startup'

  if (!baseUrl) {
    const settings = await getSiteSettings().catch(() => null)
    baseUrl = settings?.site_url?.trim() || DEFAULT_BASE_URL
    if (settings?.site_name?.trim()) brandName = settings.site_name.trim()
  }

  const value: EmailContext = {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    brandName,
    ...(process.env.EMAIL_BRAND_ADDRESS?.trim() ? { brandAddress: process.env.EMAIL_BRAND_ADDRESS.trim() } : {}),
    fromEmail: process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim() || 'info@gccstartup.com',
    fromName: process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() || brandName,
  }
  contextCache = { at: Date.now(), value }
  return value
}

/** Test seam — the memo would otherwise outlive an env change inside one process. */
export function resetEmailContextCache() {
  contextCache = null
}

export type UnsubscribeLinks = {
  /** Human-facing confirmation page, used in the footer and the {{unsubscribe_url}} merge tag. */
  pageUrl: string
  /** RFC 8058 one-click endpoint. This is the URI the List-Unsubscribe header must carry. */
  oneClickUrl: string
}

/**
 * Null when EMAIL_UNSUBSCRIBE_SECRET is missing or too short. Callers must treat
 * that as "do not send": mail with no working opt-out is a compliance failure, and
 * failing closed is the only safe direction.
 */
export function unsubscribeLinks(context: EmailContext, leadId: string): UnsubscribeLinks | null {
  const token = createUnsubscribeToken(leadId)
  if (!token) return null
  const encoded = encodeURIComponent(token)
  return {
    pageUrl: `${context.baseUrl}/unsubscribe?token=${encoded}`,
    oneClickUrl: `${context.baseUrl}/api/unsubscribe?token=${encoded}`,
  }
}

function firstName(fullName?: string | null): string {
  const first = (fullName ?? '').trim().split(/\s+/)[0]
  return first || 'Founder'
}

export function mergeVariables(lead: { name?: string; email: string; country?: string; interest?: string }, unsubscribeHref: string) {
  const given = firstName(lead.name)
  return {
    name: lead.name?.trim() || 'Founder',
    firstname: given,
    first_name: given,
    country: lead.country?.trim() || 'International',
    interest: lead.interest?.trim() || 'Company Formation & Banking',
    email: lead.email,
    unsubscribe_url: unsubscribeHref,
  }
}

export type RenderedMessage = { subject: string; html: string; text: string }

/**
 * Turns a template into a finished message. A template authored in the block
 * designer renders from `blocks`; one that carries only hand-written `html` is used
 * as-is so an imported template still works. Merge tags are applied exactly once —
 * renderEmail already interpolates when it is handed `variables`.
 */
export function renderTemplate(
  template: Pick<EmailTemplateItem, 'blocks' | 'html' | 'text' | 'subject' | 'preheader'>,
  options: { subject?: string | null; variables: Record<string, string>; context: EmailContext; unsubscribeUrl: string },
): RenderedMessage {
  const subject = interpolate(String(options.subject || template.subject || '').trim(), options.variables)

  if (template.blocks) {
    const { html, text } = renderEmail(template.blocks, {
      variables: options.variables,
      unsubscribeUrl: options.unsubscribeUrl,
      ...(template.preheader ? { preheader: template.preheader } : {}),
      siteUrl: options.context.baseUrl,
      brandName: options.context.brandName,
      ...(options.context.brandAddress ? { brandAddress: options.context.brandAddress } : {}),
    })
    return { subject, html, text }
  }

  return {
    subject,
    html: interpolate(template.html ?? '', options.variables),
    text: interpolate(template.text ?? '', options.variables),
  }
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

/**
 * Idempotent enqueue. `idempotency_key` is indexed but NOT unique in the database
 * (verified against production — the is_unique flag on the field definition did not
 * take), so this reads first, creates second, and re-reads on the create error that
 * a race produces. Same shape as the enqueue in src/app/api/lead/route.ts.
 */
export async function enqueueEmailJob(
  client: EmailClient,
  input: {
    jobType: EmailJobType
    idempotencyKey: string
    payload: Record<string, unknown>
    leadId?: string | null
    eventId?: string | null
    runAt?: Date | null
  },
): Promise<{ id: string | null; created: boolean }> {
  const key = input.idempotencyKey.slice(0, 250)
  const existing = await client
    .request(readItems('email_sync_jobs', { filter: { idempotency_key: { _eq: key } }, fields: ['id'], limit: 1 }))
    .catch(() => [])
  if (existing[0]) return { id: existing[0].id, created: false }

  const row = {
    ...(input.leadId ? { lead_id: input.leadId } : {}),
    idempotency_key: key,
    ...(input.eventId ? { event_id: input.eventId.slice(0, 250) } : {}),
    job_type: input.jobType,
    status: 'pending',
    attempts: 0,
    ...(input.runAt ? { next_attempt_at: input.runAt.toISOString() } : {}),
    payload: input.payload,
  }

  try {
    // The cast carries the four new job_type values past the narrower shared Schema.
    const created = await client.request(createItem('email_sync_jobs', row as unknown as Partial<EmailSyncJobItem>))
    return { id: created.id as string, created: true }
  } catch (error) {
    const raced = await client
      .request(readItems('email_sync_jobs', { filter: { idempotency_key: { _eq: key } }, fields: ['id'], limit: 1 }))
      .catch(() => [])
    if (raced[0]) return { id: raced[0].id, created: false }
    console.error(`[email/send] failed to enqueue ${input.jobType}`, error)
    return { id: null, created: false }
  }
}

// ---------------------------------------------------------------------------
// Lane 1 — bulk broadcast
// ---------------------------------------------------------------------------

const CAMPAIGN_FIELDS = [
  'id',
  'name',
  'subject',
  'preheader',
  'template',
  'segment',
  'blocks',
  'segment_filter',
  'html_snapshot',
  'text_snapshot',
  'status',
  'scheduled_at',
  'sender_campaign_id',
  'sender_group_id',
  'recipient_count',
] as const

export type BroadcastResult = {
  ok: boolean
  campaignId: string
  recipientCount: number
  queuedMembers: number
  blocked: number
  truncated: boolean
  senderGroupId: string | null
  error?: string
}

async function markCampaignFailed(client: EmailClient, campaignId: string, error: string) {
  await client
    .request(updateItem('email_campaigns', campaignId, { status: 'failed', last_error: error.slice(0, 1000) }))
    .catch((cause: any) => console.error('[email/send] could not record campaign failure', cause))
}

/**
 * Puts one campaign on the wire. Everything after the claim is expressed as outbox
 * jobs, so a crash anywhere in here resumes on the next tick rather than losing the
 * send or repeating it.
 *
 * The claim is the important line: `draft|scheduled|queued -> sending` under an
 * optimistic lock. Two ticks racing on the same campaign means exactly one of them
 * matches a row, and the loser returns without touching Sender.
 */
export async function enqueueBroadcast(
  client: EmailClient,
  campaignId: string,
  options: { deliverAt?: Date | null } = {},
): Promise<BroadcastResult> {
  const empty: BroadcastResult = { ok: false, campaignId, recipientCount: 0, queuedMembers: 0, blocked: 0, truncated: false, senderGroupId: null }

  // No opt-out mechanism means no bulk send. This is the gate, not a warning.
  if (!unsubscribeConfigured()) {
    return { ...empty, error: 'EMAIL_UNSUBSCRIBE_SECRET is not configured; refusing to send bulk email without a working unsubscribe link' }
  }

  const claimed = await client.request(
    updateItems(
      'email_campaigns',
      { filter: { id: { _eq: campaignId }, status: { _in: ['draft', 'scheduled', 'queued'] } } },
      { status: 'sending', last_error: null },
      { fields: ['id'] },
    ),
  )
  if (!claimed.length) return { ...empty, error: 'Campaign is not in a dispatchable state, or another run already claimed it' }

  try {
    const rows = await client.request(readItems('email_campaigns', { filter: { id: { _eq: campaignId } }, fields: [...CAMPAIGN_FIELDS], limit: 1 }))
    const campaign = rows[0]
    if (!campaign) return { ...empty, error: 'Campaign disappeared after being claimed' }

    const context = await resolveEmailContext()
    const segment = await resolveSegment(client, { filter: campaign.segment_filter, segmentId: relationId(campaign.segment) })
    const audience = await resolveAudience(client, segment.filter)

    if (!audience.leads.length) {
      const error = 'No marketable recipients matched this campaign audience'
      await markCampaignFailed(client, campaignId, error)
      return { ...empty, blocked: audience.blocked.length, error }
    }

    // Frozen at dispatch so a later template edit cannot rewrite what was sent.
    const snapshot = await campaignSnapshot(client, campaign, context)
    if (!snapshot) {
      const error = 'Campaign has no renderable content'
      await markCampaignFailed(client, campaignId, error)
      return { ...empty, error }
    }

    /**
     * A campaign-specific group, never the shared newsletter group. The title embeds
     * the campaign UUID so a lost response and a duplicate-title rejection resolve to
     * the same existing group instead of creating a second one.
     */
    const existingGroupId = campaign.sender_group_id?.trim()
    let groupId = existingGroupId ?? ''
    if (!groupId) {
      const group = await senderAdapter.createGroup(`${campaign.name ?? 'Campaign'} · ${campaignId}`.slice(0, 191))
      if (!group.ok || !group.data?.id) {
        const error = group.error ?? 'Sender rejected the campaign group'
        await markCampaignFailed(client, campaignId, error)
        return { ...empty, error }
      }
      groupId = group.data.id
    }

    await client.request(
      updateItem('email_campaigns', campaignId, {
        sender_group_id: groupId,
        recipient_count: audience.leads.length,
        html_snapshot: snapshot.html,
        text_snapshot: snapshot.text,
        ...(snapshot.subject && !campaign.subject ? { subject: snapshot.subject } : {}),
      }),
    )

    let queuedMembers = 0
    for (const lead of audience.leads) {
      const job = await enqueueEmailJob(client, {
        jobType: 'sync_group_member',
        idempotencyKey: `campaign:${campaignId}:member:${lead.id}`,
        leadId: lead.id,
        payload: { campaignId, leadId: lead.id, email: lead.email, name: lead.name ?? null, groupId },
      })
      if (job.id) queuedMembers += 1
    }

    /**
     * The member syncs and the campaign creation are separate jobs on purpose: the
     * create_campaign job defers itself while any sibling member sync is still in
     * flight, so the group is populated before Sender is asked to send to it. The
     * deadline stops one permanently wedged member from holding the whole campaign —
     * after it passes the campaign goes out to whoever made it into the group.
     */
    const assemblyMinutes = integerEnv('EMAIL_CAMPAIGN_ASSEMBLY_TIMEOUT_MINUTES', 60, 1, 1_440)
    await enqueueEmailJob(client, {
      jobType: 'create_campaign',
      idempotencyKey: `campaign:${campaignId}:create`,
      payload: {
        campaignId,
        assemblyDeadline: new Date(Date.now() + assemblyMinutes * 60_000).toISOString(),
        ...(options.deliverAt ? { deliverAt: options.deliverAt.toISOString() } : {}),
      },
    })

    return {
      ok: true,
      campaignId,
      recipientCount: audience.leads.length,
      queuedMembers,
      blocked: audience.blocked.length,
      truncated: audience.truncated,
      senderGroupId: groupId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while dispatching campaign'
    await markCampaignFailed(client, campaignId, message)
    return { ...empty, error: message.slice(0, 500) }
  }
}

/**
 * Renders once, with the merge tags left standing. Per-lead substitution is Sender's
 * job on the bulk lane — rendering N documents locally would defeat the point of
 * using a campaign at all.
 */
async function campaignSnapshot(client: EmailClient, campaign: EmailCampaignItem, context: EmailContext): Promise<RenderedMessage | null> {
  if (campaign.html_snapshot?.trim()) {
    return { subject: campaign.subject ?? '', html: campaign.html_snapshot, text: campaign.text_snapshot ?? '' }
  }

  let blocks = campaign.blocks
  let html = ''
  let text = ''
  let subject = campaign.subject ?? ''
  let preheader = campaign.preheader ?? ''

  const templateId = relationId(campaign.template)
  if (!blocks && templateId) {
    const templates = await client.request(
      readItems('email_templates', { filter: { id: { _eq: templateId } }, fields: ['id', 'subject', 'preheader', 'blocks', 'html', 'text'], limit: 1 }),
    )
    const template = templates[0]
    if (template) {
      blocks = template.blocks
      html = template.html ?? ''
      text = template.text ?? ''
      subject = subject || (template.subject ?? '')
      preheader = preheader || (template.preheader ?? '')
    }
  }

  if (blocks) {
    const rendered = renderEmail(blocks, {
      unsubscribeUrl: '{{unsubscribe_url}}',
      ...(preheader ? { preheader } : {}),
      siteUrl: context.baseUrl,
      brandName: context.brandName,
      ...(context.brandAddress ? { brandAddress: context.brandAddress } : {}),
    })
    html = rendered.html
    text = rendered.text
  }

  if (!html.trim()) return null
  return { subject, html, text }
}

/**
 * Campaigns the tick should put on the wire: anything scheduled whose time has come,
 * plus anything the admin UI marked `queued` for immediate send. Scheduling is held
 * locally rather than handed to Sender by default, so the audience — and therefore
 * suppression — is resolved at send time rather than at compose time.
 */
export async function dispatchDueCampaigns(client: EmailClient, options: { limit?: number } = {}) {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 5), 1), 25)
  const now = new Date().toISOString()
  const due = await client.request(
    readItems('email_campaigns', {
      filter: {
        _or: [{ status: { _eq: 'scheduled' }, scheduled_at: { _lte: now } as never }, { status: { _eq: 'queued' } }],
      },
      fields: ['id'],
      sort: ['scheduled_at'],
      limit,
    }),
  )

  const results: BroadcastResult[] = []
  for (const campaign of due) results.push(await enqueueBroadcast(client, campaign.id))
  return { selected: due.length, dispatched: results.filter((result) => result.ok).length, results }
}

// ---------------------------------------------------------------------------
// Lane 2 — one message to one lead
// ---------------------------------------------------------------------------

export type MarketingMessageInput = {
  leadId: string
  templateId: string
  subjectOverride?: string | null
  /** Idempotent key for the email_events row this send writes. */
  eventKey: string
  activityTitle?: string
  activityDescription?: string
}

/**
 * One marketing message to one lead. Suppression is re-checked here rather than
 * trusted from whenever the audience was resolved, because the gap between the two
 * is exactly where an unsubscribe lands.
 */
export async function sendMarketingMessage(client: EmailClient, input: MarketingMessageInput): Promise<EmailJobResult> {
  const gate = await assertMarketable(client, input.leadId)
  if (!gate.ok) return skipped('send_transactional', `recipient not marketable: ${gate.reason}`)

  const context = await resolveEmailContext()
  const links = unsubscribeLinks(context, input.leadId)
  if (!links) {
    return deferral('send_transactional', 'EMAIL_UNSUBSCRIBE_SECRET is not configured; not sending marketing mail without a working unsubscribe link', 900)
  }

  const templates = await client.request(
    readItems('email_templates', {
      filter: { id: { _eq: input.templateId } },
      fields: ['id', 'name', 'subject', 'preheader', 'blocks', 'html', 'text', 'is_active'],
      limit: 1,
    }),
  )
  const template = templates[0]
  if (!template) return failure('send_transactional', `Template ${input.templateId} no longer exists`)
  if (template.is_active === false) return skipped('send_transactional', 'template is inactive')

  const variables = mergeVariables(gate.lead, links.pageUrl)
  const message = renderTemplate(template, { subject: input.subjectOverride, variables, context, unsubscribeUrl: links.pageUrl })
  if (!message.subject) return failure('send_transactional', 'Template has no subject line')
  if (!message.html.trim() && !message.text.trim()) return failure('send_transactional', 'Template rendered no content')

  const result = await senderAdapter.sendTransactional({
    from: { email: context.fromEmail, name: context.fromName },
    to: { email: gate.lead.email, ...(gate.lead.name ? { name: gate.lead.name.slice(0, 200) } : {}) },
    subject: message.subject,
    // Both parts, always. Sender accepts html and text together and multipart mail is
    // materially better treated by receiving filters than html alone.
    ...(message.html.trim() ? { html: message.html } : {}),
    ...(message.text.trim() ? { text: message.text } : {}),
    headers: listUnsubscribeHeaders(links.oneClickUrl),
  })

  if (result.ok) {
    await recordSend(client, { leadId: gate.lead.id, email: gate.lead.email, subject: message.subject, input, result })
  }
  return result
}

/** CRM timeline entry plus a delivery event, so a flow send is visible in both places. */
async function recordSend(
  client: EmailClient,
  args: { leadId: string; email: string; subject: string; input: MarketingMessageInput; result: SenderResult },
) {
  const occurredAt = new Date().toISOString()
  const providerMessageId =
    args.result.data && !Array.isArray(args.result.data) && typeof (args.result.data as Record<string, unknown>).emailId === 'string' ? (args.result.data as Record<string, unknown>).emailId : null

  await client
    .request(
      createItem('lead_activities', {
        lead_id: args.leadId,
        type: 'email',
        title: (args.input.activityTitle ?? `Email sent: ${args.subject}`).slice(0, 255),
        description: args.input.activityDescription ?? null,
        occurred_at: occurredAt,
        metadata: { event_key: args.input.eventKey, template: args.input.templateId, provider_message_id: providerMessageId },
      }),
    )
    .catch((error: any) => console.error('[email/send] could not write lead activity', error))

  const existing = await client
    .request(readItems('email_events', { filter: { event_key: { _eq: args.input.eventKey } }, fields: ['id'], limit: 1 }))
    .catch(() => [])
  if (existing.length) return

  await client
    .request(
      createItem('email_events', {
        lead_id: args.leadId,
        event_key: args.input.eventKey.slice(0, 250),
        provider_message_id: providerMessageId,
        event_type: 'sent',
        email: args.email,
        subject: args.subject.slice(0, 255),
        occurred_at: occurredAt,
        metadata: { template: args.input.templateId },
      }),
    )
    .catch((error: any) => console.error('[email/send] could not write email event', error))
}

// ---------------------------------------------------------------------------
// Job executors
// ---------------------------------------------------------------------------

async function executeSyncGroupMember(client: EmailClient, job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const groupId = stringValue(payload.groupId, 128)
  const leadId = stringValue(payload.leadId, 128)
  if (!groupId || !leadId) return failure('upsert_subscriber', 'Group member job is missing groupId or leadId')

  // Second suppression check. The first ran when the audience was resolved, which may
  // have been minutes or hours ago on a scheduled campaign.
  const gate = await assertMarketable(client, leadId)
  if (!gate.ok) return skipped('upsert_subscriber', `recipient not marketable: ${gate.reason}`)

  return senderAdapter.upsertSubscriber({
    email: gate.lead.email,
    ...(gate.lead.name ? { name: gate.lead.name } : {}),
    groups: [groupId],
    // Exactly this campaign's group, and no Sender-side automation: the campaign is
    // the message, and an automation firing on top of it would double-mail the lead.
    exactGroups: true,
    triggerAutomation: false,
    fields: {
      ...(gate.lead.country ? { country: gate.lead.country.slice(0, 200) } : {}),
      ...(gate.lead.interest ? { interest: gate.lead.interest.slice(0, 200) } : {}),
    },
  })
}

async function executeCreateCampaign(client: EmailClient, job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const campaignId = stringValue(payload.campaignId, 128)
  if (!campaignId) return failure('create_campaign', 'Campaign job is missing campaignId')

  const deadline = typeof payload.assemblyDeadline === 'string' ? Date.parse(payload.assemblyDeadline) : NaN
  const pastDeadline = Number.isFinite(deadline) && Date.now() > deadline
  if (!pastDeadline) {
    const outstanding = await client.request(
      readItems('email_sync_jobs', {
        filter: {
          job_type: { _eq: 'sync_group_member' as never },
          status: { _in: ['pending', 'processing'] },
          idempotency_key: { _starts_with: `campaign:${campaignId}:member:` },
        },
        fields: ['id'],
        limit: 1,
      }),
    )
    if (outstanding.length) return deferral('create_campaign', 'waiting for audience sync to finish', 60)
  }

  const rows = await client.request(readItems('email_campaigns', { filter: { id: { _eq: campaignId } }, fields: [...CAMPAIGN_FIELDS], limit: 1 }))
  const campaign = rows[0]
  if (!campaign) return failure('create_campaign', `Campaign ${campaignId} no longer exists`)
  if (campaign.status === 'cancelled') return skipped('create_campaign', 'campaign was cancelled')

  let senderCampaignId = campaign.sender_campaign_id?.trim() ?? ''
  if (!senderCampaignId) {
    if (!campaign.sender_group_id) return failure('create_campaign', 'Campaign has no Sender group')
    if (!campaign.html_snapshot?.trim()) return failure('create_campaign', 'Campaign has no HTML snapshot')

    const created = await senderAdapter.createCampaign({
      title: `${campaign.name ?? 'Campaign'} · ${campaignId}`.slice(0, 191),
      subject: campaign.subject ?? campaign.name ?? 'GCC Startup',
      html: campaign.html_snapshot,
      ...(campaign.preheader ? { preheader: campaign.preheader } : {}),
      groupIds: [campaign.sender_group_id],
    })
    if (!created.ok || !created.data?.id) {
      const error = created.error ?? 'Sender rejected the campaign'
      if (created.retryable !== true) await markCampaignFailed(client, campaignId, error)
      return { ...created, error }
    }
    senderCampaignId = created.data.id
    await client.request(updateItem('email_campaigns', campaignId, { sender_campaign_id: senderCampaignId }))
  }

  await enqueueEmailJob(client, {
    jobType: 'send_campaign',
    idempotencyKey: `campaign:${campaignId}:send`,
    payload: { campaignId, ...(typeof payload.deliverAt === 'string' ? { deliverAt: payload.deliverAt } : {}) },
  })

  return { ok: true, status: 'success', operation: 'create_campaign', data: { id: senderCampaignId }, retryable: false }
}

async function executeSendCampaign(client: EmailClient, job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const campaignId = stringValue(payload.campaignId, 128)
  if (!campaignId) return failure('send_campaign', 'Send job is missing campaignId')

  const rows = await client.request(
    readItems('email_campaigns', { filter: { id: { _eq: campaignId } }, fields: ['id', 'status', 'sender_campaign_id', 'recipient_count'], limit: 1 }),
  )
  const campaign = rows[0]
  if (!campaign) return failure('send_campaign', `Campaign ${campaignId} no longer exists`)
  if (campaign.status === 'cancelled') return skipped('send_campaign', 'campaign was cancelled')
  if (campaign.status === 'sent') return skipped('send_campaign', 'campaign was already sent')
  if (!campaign.sender_campaign_id) return failure('send_campaign', 'Campaign has no sender_campaign_id')

  const deliverAt = typeof payload.deliverAt === 'string' ? new Date(payload.deliverAt) : null
  const useSenderSchedule = deliverAt !== null && !Number.isNaN(deliverAt.getTime()) && deliverAt.getTime() > Date.now()

  const result = useSenderSchedule ? await senderAdapter.scheduleCampaign(campaign.sender_campaign_id, deliverAt) : await senderAdapter.sendCampaign(campaign.sender_campaign_id)

  if (result.ok) {
    const dispatchedAt = new Date().toISOString()
    await client.request(
      updateItem('email_campaigns', campaignId, {
        status: useSenderSchedule ? 'scheduled' : 'sent',
        ...(useSenderSchedule ? {} : { sent_at: dispatchedAt }),
        last_error: null,
        stats: { recipient_count: campaign.recipient_count ?? 0, dispatched_at: dispatchedAt, scheduled_at_sender: useSenderSchedule },
      }),
    )
  } else if (result.retryable !== true || result.ambiguous) {
    await markCampaignFailed(client, campaignId, result.error ?? 'Sender refused to send the campaign')
  }
  return result
}

async function executeFlowStep(client: EmailClient, job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const leadId = stringValue(payload.leadId, 128)
  const templateId = stringValue(payload.templateId, 128)
  if (!leadId || !templateId) return failure('send_transactional', 'Flow step job is missing leadId or templateId')

  const flowName = stringValue(payload.flowName, 200)
  return sendMarketingMessage(client, {
    leadId,
    templateId,
    subjectOverride: stringValue(payload.subjectOverride, 300) ?? null,
    eventKey: `flowstep:${job.idempotency_key}`,
    ...(stringValue(payload.activityTitle, 255) ? { activityTitle: stringValue(payload.activityTitle, 255) as string } : {}),
    ...(flowName ? { activityDescription: `Sent by the "${flowName}" email flow` } : {}),
  })
}

/** The two original job types, moved here verbatim so both routes share one implementation. */
async function executeLegacy(job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const operation = job.job_type === 'send_transactional' ? 'send_transactional' : 'upsert_subscriber'
  const email = stringValue(payload.email)
  if (!email) return failure(operation, 'Job email is missing')

  if (job.job_type === 'send_transactional') {
    const customSubject = stringValue(payload.subject, 300)
    const customHtml = typeof payload.html === 'string' && payload.html.trim() ? payload.html.trim() : undefined
    const customText = typeof payload.text === 'string' && payload.text.trim() ? payload.text.trim() : undefined

    if (customSubject && (customHtml || customText)) {
      const fromEmail = process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim() || 'info@gccstartup.com'
      const fromName = process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() || 'GCC Startup'
      const unsubscribeHref = stringValue(payload.unsubscribeUrl, 500)
      return senderAdapter.sendTransactional({
        from: { email: fromEmail, name: fromName },
        to: { email, ...(payload.name ? { name: stringValue(payload.name, 200) } : {}) },
        subject: customSubject,
        ...(customHtml ? { html: customHtml } : {}),
        ...(customText ? { text: customText } : {}),
        ...(unsubscribeHref ? { headers: listUnsubscribeHeaders(unsubscribeHref) } : {}),
      })
    }

    return senderAdapter.sendConfiguredTransactional({
      email,
      name: stringValue(payload.name, 200),
      eventId: stringValue(payload.eventId, 128),
      variables: objectValue(payload.variables),
    })
  }

  if (job.job_type === 'upsert_subscriber') {
    if (payload.marketingConsent !== true) return failure('upsert_subscriber', 'Explicit marketing consent is absent from job')
    const groupKeys = Array.isArray(payload.groupKeys) ? payload.groupKeys.filter((value): value is string => typeof value === 'string') : []
    return senderAdapter.upsertSubscriber({
      email,
      name: stringValue(payload.name, 200),
      phone: stringValue(payload.phone, 50),
      groupKeys,
      triggerAutomation: true,
    })
  }

  /**
   * `suppress_subscriber` has a slot in the job_type list but nothing has ever
   * enqueued one, and Sender publishes no endpoint we have verified for forcing a
   * subscriber to unsubscribed. Suppression is enforced on our side instead, and it
   * holds: every campaign builds a fresh, campaign-specific group from a
   * suppression-filtered audience at send time, so a suppressed lead is simply never
   * added to the group the campaign targets. Recorded as skipped rather than failed
   * so an operator who enqueues one by hand does not get a stuck job.
   */
  if (job.job_type === 'suppress_subscriber') {
    return skipped('upsert_subscriber', 'suppression is enforced locally; campaign groups are rebuilt per send from a suppression-filtered audience')
  }

  return failure(operation, `Unsupported job type: ${job.job_type}`)
}

export async function executeEmailJob(client: EmailClient, job: OutboxJob): Promise<EmailJobResult> {
  switch (job.job_type) {
    case 'sync_group_member':
      return executeSyncGroupMember(client, job)
    case 'create_campaign':
      return executeCreateCampaign(client, job)
    case 'send_campaign':
      return executeSendCampaign(client, job)
    case 'flow_step':
      return executeFlowStep(client, job)
    default:
      return executeLegacy(job)
  }
}

// ---------------------------------------------------------------------------
// The drainer
// ---------------------------------------------------------------------------

export type DrainSummary = {
  selected: number
  succeeded: number
  failed: number
  skipped: number
  deferred: number
  ambiguous: number
  /** True when Sender told us to stop; the remainder of the batch is left for the next run. */
  throttled: boolean
  throttleMs: number
}

export type DrainOptions = {
  batchSize?: number
  maxAttempts?: number
  baseBackoffSeconds?: number
  /** Epoch ms after which no further job is claimed, so a one-minute tick does not overrun. */
  deadlineAt?: number
}

/**
 * Claims and runs pending jobs. Safe to run concurrently with itself: the claim is an
 * optimistic-lock UPDATE filtered on the status the row was read with, so of two runs
 * seeing the same job exactly one matches a row and the other moves on.
 *
 * Rate limiting is read off the live response — `X-RateLimit-Remaining`, and a 429's
 * `Retry-After` — never guessed. When Sender says stop, the batch stops and the rest
 * waits for the next run instead of sleeping inside a request handler.
 */
export async function drainOutbox(client: EmailClient, options: DrainOptions = {}): Promise<DrainSummary> {
  const maxAttempts = options.maxAttempts ?? integerEnv('SENDER_JOB_MAX_ATTEMPTS', 5, 1, 20)
  const batchSize = options.batchSize ?? integerEnv('SENDER_JOB_BATCH_SIZE', 20, 1, 100)
  const baseBackoffSeconds = options.baseBackoffSeconds ?? integerEnv('SENDER_JOB_BACKOFF_SECONDS', 300, 10, 86_400)
  const now = new Date().toISOString()

  const jobs = (await client.request(
    readItems('email_sync_jobs', {
      filter: {
        attempts: { _lt: maxAttempts },
        _or: [
          { status: { _eq: 'pending' }, _or: [{ next_attempt_at: { _null: true } }, { next_attempt_at: { _lte: now } as never }] },
          { status: { _eq: 'failed' }, next_attempt_at: { _lte: now } as never },
        ],
      },
      fields: [...OUTBOX_JOB_FIELDS],
      sort: ['id'],
      limit: batchSize,
    }),
  )) as OutboxJob[]

  const summary: DrainSummary = { selected: jobs.length, succeeded: 0, failed: 0, skipped: 0, deferred: 0, ambiguous: 0, throttled: false, throttleMs: 0 }

  for (const job of jobs) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break

    const priorAttempts = job.attempts ?? 0
    const attempts = priorAttempts + 1
    const claimed = await client.request(
      updateItems(
        'email_sync_jobs',
        { filter: { id: { _eq: job.id }, status: { _eq: job.status } } },
        { status: 'processing', attempts, next_attempt_at: null },
        { fields: ['id'] },
      ),
    )
    if (!claimed.length) continue

    let result: EmailJobResult
    try {
      result = await executeEmailJob(client, job)
    } catch (error) {
      const ambiguous = AMBIGUOUS_JOB_TYPES.has(job.job_type)
      result = {
        ok: false,
        status: 'failed',
        operation: job.job_type === 'send_transactional' || job.job_type === 'flow_step' ? 'send_transactional' : 'upsert_subscriber',
        error: error instanceof Error ? error.message.slice(0, 500) : 'Unexpected Sender processor error',
        retryable: !ambiguous,
        ambiguous,
      }
    }

    const finishedAt = new Date().toISOString()

    // A deferral is not an attempt. Roll the counter back and let the job sit.
    if (result.deferralSeconds !== undefined) {
      await client.request(
        updateItem('email_sync_jobs', job.id, {
          status: 'pending',
          attempts: priorAttempts,
          last_error: result.error ?? null,
          next_attempt_at: new Date(Date.now() + result.deferralSeconds * 1_000).toISOString(),
        }),
      )
      summary.deferred += 1
      continue
    }

    const subscriberId = result.data && !Array.isArray(result.data) && typeof (result.data as Record<string, unknown>).id === 'string' ? (result.data as Record<string, unknown>).id : null
    const canRetry = result.retryable === true && !result.ambiguous && attempts < maxAttempts
    // Sender's own Retry-After wins over our backoff curve whenever it sent one.
    const retryAfterMs = result.rateLimit?.retryAfterMs as number | undefined
    const delayMs = retryAfterMs !== undefined ? retryAfterMs : Math.min(baseBackoffSeconds * 2 ** Math.max(0, attempts - 1), 86_400) * 1_000
    const nextAttemptAt = canRetry ? new Date(Date.now() + delayMs).toISOString() : null

    await client.request(
      updateItem('email_sync_jobs', job.id, {
        status: result.status === 'skipped' ? 'skipped' : result.ok ? 'succeeded' : 'failed',
        provider_response: result as unknown as Record<string, unknown>,
        sender_subscriber_id: subscriberId,
        last_error: result.error ?? null,
        processed_at: finishedAt,
        next_attempt_at: nextAttemptAt,
      }),
    )

    if (result.status === 'skipped') {
      summary.skipped += 1
    } else if (result.ok) {
      summary.succeeded += 1
      const leadId = typeof job.lead_id === 'string' ? job.lead_id : job.lead_id?.id
      if ((job.job_type === 'upsert_subscriber' || job.job_type === 'sync_group_member') && leadId) {
        await client
          .request(
            updateItem('leads', leadId, {
              ...(subscriberId ? { sender_subscriber_id: subscriberId } : {}),
              sender_status: 'active',
              sender_last_synced_at: finishedAt,
            }),
          )
          .catch((error: any) => console.error('[email/send] failed to update lead sync state', error))
      }
    } else {
      summary.failed += 1
      if (result.ambiguous) summary.ambiguous += 1
    }

    const throttleMs = senderAdapter.throttleMs(result.rateLimit)
    if (throttleMs > 0) {
      summary.throttled = true
      summary.throttleMs = throttleMs
      break
    }
  }

  return summary
}

/**
 * Jobs left `processing` by a container that died mid-flight. Without this they are
 * invisible to the drainer forever, because the claim filter only ever looks at
 * `pending` and `failed`.
 *
 * Idempotent work goes back to `pending`. Anything that may already have put mail on
 * the wire is failed with the reason recorded and no automatic retry — a duplicate
 * delivery is worse than a missed one, and an operator can requeue it deliberately.
 */
export async function reapStaleJobs(client: EmailClient, options: { staleMinutes?: number; limit?: number } = {}) {
  const staleMinutes = options.staleMinutes ?? integerEnv('SENDER_JOB_STALE_MINUTES', 15, 2, 1_440)
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 50), 1), 200)
  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString()

  const stuck = (await client.request(
    readItems('email_sync_jobs', {
      filter: { status: { _eq: 'processing' }, date_updated: { _lte: cutoff } as never },
      fields: ['id', 'job_type', 'attempts'],
      sort: ['id'],
      limit,
    }),
  )) as OutboxJob[]

  let requeued = 0
  let abandoned = 0
  for (const job of stuck) {
    const ambiguous = AMBIGUOUS_JOB_TYPES.has(job.job_type)
    const claimed = await client.request(
      updateItems(
        'email_sync_jobs',
        { filter: { id: { _eq: job.id }, status: { _eq: 'processing' } } },
        ambiguous
          ? { status: 'failed', last_error: `Claim expired after ${staleMinutes} minutes; not retried automatically because delivery is ambiguous`, next_attempt_at: null }
          : { status: 'pending', last_error: `Claim expired after ${staleMinutes} minutes; requeued`, next_attempt_at: null },
        { fields: ['id'] },
      ),
    )
    if (!claimed.length) continue
    if (ambiguous) abandoned += 1
    else requeued += 1
  }

  return { selected: stuck.length, requeued, abandoned }
}

/** Re-exported so callers outside this module do not need to reach into suppression.ts. */
export function normalizeRecipient(value: unknown): string | null {
  return normalizeEmail(value)
}
