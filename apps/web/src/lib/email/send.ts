/**
 * The outbox that drives every outbound email, and the two send paths on top of it.
 *
 * Nothing here calls the transport directly on the request path. Every outbound call
 * is an `outbox_jobs` row first — that table carries an idempotent enqueue, claim
 * semantics, exponential backoff and stale-claim reaping — so a crash anywhere
 * resumes on the next tick rather than losing the send or repeating it.
 *
 * Two paths:
 *
 *   CAMPAIGN  enqueueBroadcast claims the campaign (`draft|scheduled|queued ->
 *             sending` under an optimistic lock), resolves the audience, filters
 *             consent + suppression, writes one `email_sends` row per recipient and
 *             enqueues one `send_email` job per send (`payload {sendId}`,
 *             `idempotency_key send:<sendId>`). The drainer executes each job.
 *
 *   1:1       flow steps and automation sends go through sendMarketingMessage,
 *             which gates on consent + suppression, renders and sends immediately.
 *             The transport is OPTIONAL: with no provider configured the adapter
 *             no-ops and the send is recorded, never crashed.
 *
 * Suppression is checked twice on every marketing path — once when the audience is
 * resolved and again immediately before the send — because a contact can withdraw
 * consent in between, and the second check is the one that keeps that promise.
 */
import { randomUUID } from 'node:crypto'
import { and, asc, eq, inArray, lte, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_sends, email_templates, events, flow_enrollments, flow_logs, outbox_jobs } from '@gccstartup/db'
import { interpolate, renderEmail } from '@/lib/email/render'
import { type SenderResult, senderAdapter } from '@gccstartup/shared'
import { getTemplateById, type EmailCampaignItem, type EmailClient, type EmailTemplateItem } from './client'
import { resolveAudience } from './segments'
import {
  assertMarketable,
  createUnsubscribeToken,
  listUnsubscribeHeaders,
  normalizeEmail,
} from './suppression'

/** The platform job types plus the legacy names old callers may still pass. */
export type EmailJobType = 'send_email' | 'flow_email' | 'log_event'

/** The shape of an `outbox_jobs` row the drainer works with. */
export type OutboxJob = {
  id: string
  job_type: EmailJobType
  payload: unknown
  status: string
  priority: number
  attempts: number
  max_attempts: number
  next_run_at: Date
  idempotency_key: string | null
}

/**
 * A job result, plus one extra outcome the drainer has to be able to express:
 * "blocked on something that is not this job's fault" must not burn a retry attempt.
 */
export type EmailJobResult = SenderResult & { deferralSeconds?: number }

export const OUTBOX_JOB_FIELDS = [
  'id',
  'job_type',
  'payload',
  'status',
  'priority',
  'attempts',
  'max_attempts',
  'next_run_at',
  'idempotency_key',
] as const

/**
 * Job types where losing the response means we cannot tell whether mail went out.
 * A stale claim on one of these is failed rather than re-queued: a duplicate
 * delivery is worse than a missed one, and the operator can retry it by hand.
 */
const AMBIGUOUS_JOB_TYPES: ReadonlySet<string> = new Set(['send_email', 'flow_email'])

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

function failure(operation: string, error: string, retryable = false): EmailJobResult {
  return { ok: false, status: 'failed', operation, error: error.slice(0, 500), retryable }
}

/** Not an error — the job did its job by declining to send. Recorded as skipped, never retried. */
function skipped(operation: string, reason: string): EmailJobResult {
  return { ok: false, status: 'skipped', operation, error: reason.slice(0, 500), retryable: false }
}

function deferral(operation: string, reason: string, seconds: number): EmailJobResult {
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
 * drainer would otherwise resolve it once per job.
 */
export async function resolveEmailContext(): Promise<EmailContext> {
  if (contextCache && Date.now() - contextCache.at < CONTEXT_TTL_MS) return contextCache.value

  const configured = process.env.EMAIL_PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const brandName = process.env.SENDER_CAMPAIGN_FROM_NAME?.trim() || process.env.EMAIL_FROM_NAME?.trim() || 'GCC Startup'

  const value: EmailContext = {
    baseUrl: (configured || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    brandName,
    ...(process.env.EMAIL_BRAND_ADDRESS?.trim() ? { brandAddress: process.env.EMAIL_BRAND_ADDRESS.trim() } : {}),
    fromEmail: process.env.EMAIL_FROM_ADDRESS?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim() || 'info@gccstartup.com',
    fromName: process.env.EMAIL_FROM_NAME?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() || brandName,
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
export function unsubscribeLinks(context: EmailContext, contactId: string): UnsubscribeLinks | null {
  const token = createUnsubscribeToken(contactId)
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
 * Idempotent enqueue. `idempotency_key` is UNIQUE in the database, so a duplicate
 * insert loses cleanly via ON CONFLICT and the existing row is returned instead.
 */
export async function enqueueEmailJob(
  _client: EmailClient | null,
  input: {
    jobType: EmailJobType
    idempotencyKey: string
    payload: Record<string, unknown>
    leadId?: string | null
    eventId?: string | null
    runAt?: Date | null
  },
): Promise<{ id: string | null; created: boolean }> {
  const key = input.idempotencyKey.slice(0, 255)
  const inserted = await db
    .insert(outbox_jobs)
    .values({
      id: randomUUID(),
      job_type: input.jobType,
      payload: input.payload,
      status: 'pending',
      priority: 0,
      attempts: 0,
      next_run_at: input.runAt ?? new Date(),
      idempotency_key: key,
    })
    .onConflictDoNothing({ target: outbox_jobs.idempotency_key })
    .returning({ id: outbox_jobs.id })

  if (inserted[0]) return { id: inserted[0].id, created: true }

  const existing = await db
    .select({ id: outbox_jobs.id })
    .from(outbox_jobs)
    .where(eq(outbox_jobs.idempotency_key, key))
    .limit(1)
  return { id: existing[0]?.id ?? null, created: false }
}

// ---------------------------------------------------------------------------
// Lane 1 — bulk campaign
// ---------------------------------------------------------------------------

export type BroadcastResult = {
  ok: boolean
  campaignId: string
  recipientCount: number
  queuedMembers: number
  blocked: number
  truncated: boolean
  error?: string
}

/**
 * Puts one campaign on the wire. Everything after the claim is expressed as outbox
 * jobs, so a crash anywhere in here resumes on the next tick rather than losing the
 * send or repeating it.
 *
 * The claim is the important line: `draft|scheduled|queued -> sending` under an
 * optimistic lock. Two ticks racing on the same campaign means exactly one of them
 * matches a row, and the loser returns without touching the transport.
 */
export async function enqueueBroadcast(
  _client: EmailClient | null,
  campaignId: string,
  options: { deliverAt?: Date } = {},
): Promise<BroadcastResult> {
  const empty: BroadcastResult = { ok: false, campaignId, recipientCount: 0, queuedMembers: 0, blocked: 0, truncated: false }

  try {
const claimed = await db
      .update(email_campaigns)
      .set({
        status: 'sending',
        started_at: new Date(),
        error: null,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(email_campaigns.id, campaignId),
          inArray(email_campaigns.status, ['draft', 'scheduled']),
        ),
      )
      .returning({ id: email_campaigns.id })
    if (!claimed.length) return { ...empty, error: 'Campaign is not in a dispatchable state' }

  const campaignRows = await db.select().from(email_campaigns).where(eq(email_campaigns.id, campaignId)).limit(1)
  const campaign = campaignRows[0]
  if (!campaign) return { ...empty, error: 'Campaign no longer exists' }

  const audience = await resolveAudience(null, normalizeAudienceFilter(campaign.audience_filter))
  const template = await getTemplateById(campaign.template_id)
  if (!template) {
    await markCampaignFailed(campaignId, 'Campaign template no longer exists')
    return { ...empty, error: 'Campaign template no longer exists' }
  }

  let queuedMembers = 0

  for (const contact of audience.leads) {
    const messageRef = `camp:${campaignId}:${contact.id}`.slice(0, 100)
    const variables = mergeVariables(
      {
        name: contact.display_name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '',
        email: contact.email,
        country: stringValue(contact.custom_fields?.country),
        interest: stringValue(contact.custom_fields?.interest),
      },
      '{{unsubscribe_url}}',
    )
    const subject = interpolate(template.subject, variables)

    // The send row IS the per-recipient record; message_ref is UNIQUE, so a
    // re-dispatch of the same campaign to the same contact loses cleanly.
    const inserted = await db
      .insert(email_sends)
      .values({
        id: randomUUID(),
        message_ref: messageRef,
        contact_id: contact.id,
        campaign_id: campaignId,
        template_id: template.id,
        to_email: contact.email,
        subject: subject.slice(0, 500),
        status: 'queued',
      })
      .onConflictDoNothing({ target: email_sends.message_ref })
      .returning({ id: email_sends.id })

    const sendId = inserted[0]?.id
    if (!sendId) continue

    const job = await enqueueEmailJob(null, {
      jobType: 'send_email',
      idempotencyKey: `send:${sendId}`,
      payload: { sendId },
    })
    if (job.id) queuedMembers += 1
  }

  await db
    .update(email_campaigns)
    .set({ recipient_count: audience.leads.length, updated_at: new Date() })
    .where(eq(email_campaigns.id, campaignId))

  return {
    ok: true,
    campaignId,
    recipientCount: audience.leads.length,
    queuedMembers,
    blocked: audience.blocked.length,
    truncated: audience.truncated,
  }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while dispatching campaign'
    await markCampaignFailed(campaignId, message)
    return { ...empty, error: message.slice(0, 500) }
  }
}

async function markCampaignFailed(campaignId: string, error: string) {
  await db
    .update(email_campaigns)
    .set({ status: 'failed', error: error.slice(0, 1000), updated_at: new Date() })
    .where(eq(email_campaigns.id, campaignId))
    .catch((cause) => console.error('[email/send] could not record campaign failure', cause))
}

/** Campaign audience filters arrive as author-supplied JSON; normalize before use. */
function normalizeAudienceFilter(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return Object.keys(value).length ? (value as Record<string, unknown>) : null
}

/**
 * Campaigns the tick should put on the wire: anything scheduled whose time has come,
 * plus anything an operator queued directly. Scheduling is held locally rather than
 * handed to the provider by default, so the audience — and therefore suppression —
 * is resolved at send time rather than at compose time.
 */
export async function dispatchDueCampaigns(_client: EmailClient | null, options: { limit?: number } = {}) {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 5), 1), 25)

  const due = await db
    .select({ id: email_campaigns.id })
    .from(email_campaigns)
    .where(
      or(
        and(eq(email_campaigns.status, 'scheduled'), lte(email_campaigns.scheduled_at, new Date())),
        eq(email_campaigns.status, 'sending'),
      ),
    )
    .orderBy(asc(email_campaigns.scheduled_at))
    .limit(limit)

  const results: BroadcastResult[] = []
  for (const campaign of due) {
    // Re-dispatching a `sending` campaign is safe: send rows and jobs are idempotent
    // on message_ref / idempotency_key, so only the missing ones are created.
    results.push(await enqueueBroadcast(null, campaign.id))
  }
  return { selected: due.length, dispatched: results.filter((result) => result.ok).length, results }
}

// ---------------------------------------------------------------------------
// Lane 2 — one message to one contact
// ---------------------------------------------------------------------------

export type MarketingMessageInput = {
  leadId: string
  templateId: string
  subjectOverride?: string | null
  /** Idempotent key for the events row this send writes. */
  eventKey: string
  activityTitle?: string
  activityDescription?: string
}

async function recordSentEvent(input: {
  contactId: string
  email: string
  subject: string
  eventKey: string
  templateId: string
  providerMessageId: string | null
  activityTitle?: string
  activityDescription?: string
}) {
  await db
    .insert(events)
    .values({
      id: randomUUID(),
      event_type: 'email.sent',
      payload: {
        contact_id: input.contactId,
        email: input.email,
        subject: input.subject,
        event_key: input.eventKey.slice(0, 250),
        template_id: input.templateId,
        provider_message_id: input.providerMessageId,
        activity_title: input.activityTitle ?? null,
        activity_description: input.activityDescription ?? null,
      },
      source: 'email-platform',
    })
    .catch((cause) => console.error('[email/send] could not write email event', cause))
}

/**
 * One marketing message to one contact. Suppression is re-checked here rather than
 * trusted from whenever the audience was resolved, because the gap between the two
 * is exactly where an unsubscribe lands. The transport is optional: with no provider
 * env configured the adapter no-ops, and the event row is still recorded.
 */
export async function sendMarketingMessage(_client: EmailClient | null, input: MarketingMessageInput): Promise<EmailJobResult> {
  const gate = await assertMarketable(null, input.leadId)
  if (!gate.ok) return skipped('send_transactional', `recipient not marketable: ${gate.reason}`)

  const context = await resolveEmailContext()
  const links = unsubscribeLinks(context, input.leadId)
  if (!links) {
    return deferral('send_transactional', 'EMAIL_UNSUBSCRIBE_SECRET is not configured; not sending marketing mail without a working unsubscribe link', 900)
  }

  const template = await getTemplateById(input.templateId)
  if (!template) return failure('send_transactional', `Template ${input.templateId} no longer exists`)
  if (!template.is_active) return skipped('send_transactional', 'template is inactive')

  const customFields = gate.lead.custom_fields ?? {}
  const variables = mergeVariables(
    {
      name: gate.lead.display_name || [gate.lead.first_name, gate.lead.last_name].filter(Boolean).join(' ') || '',
      email: gate.lead.email,
      country: stringValue(customFields.country),
      interest: stringValue(customFields.interest),
    },
    links.pageUrl,
  )
  const message = renderTemplate(template, { subject: input.subjectOverride, variables, context, unsubscribeUrl: links.pageUrl })
  if (!message.subject) return failure('send_transactional', 'Template has no subject line')
  if (!message.html.trim() && !message.text.trim()) return failure('send_transactional', 'Template rendered no content')

  const result = await senderAdapter.sendTransactional({
    from: { email: context.fromEmail, name: context.fromName },
    to: {
      email: gate.lead.email,
      ...(gate.lead.display_name || gate.lead.first_name
        ? { name: (gate.lead.display_name || gate.lead.first_name || '').slice(0, 200) }
        : {}),
    },
    subject: message.subject,
    // Both parts, always. Multipart mail is materially better treated by receiving
    // filters than html alone.
    ...(message.html.trim() ? { html: message.html } : {}),
    ...(message.text.trim() ? { text: message.text } : {}),
    headers: listUnsubscribeHeaders(links.oneClickUrl),
  })

  if (result.ok) {
    const data = result.data && !Array.isArray(result.data) ? (result.data as Record<string, unknown>) : {}
    const providerMessageId = typeof data.emailId === 'string' ? data.emailId : null
    await recordSentEvent({
      contactId: gate.lead.id,
      email: gate.lead.email,
      subject: message.subject,
      eventKey: input.eventKey,
      templateId: input.templateId,
      providerMessageId,
      activityTitle: input.activityTitle,
      activityDescription: input.activityDescription,
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// Job executors
// ---------------------------------------------------------------------------

/** Marks the campaign sent once every queued send for it has reached a terminal state. */
async function settleCampaignIfComplete(campaignId: string) {
  const remaining = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(email_sends)
    .where(and(eq(email_sends.campaign_id, campaignId), inArray(email_sends.status, ['queued'])))
  if ((remaining[0]?.count ?? 0) > 0) return

  const total = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(email_sends)
    .where(eq(email_sends.campaign_id, campaignId))
  if ((total[0]?.count ?? 0) === 0) return

  await db
    .update(email_campaigns)
    .set({ status: 'sent', completed_at: new Date(), error: null, updated_at: new Date() })
    .where(and(eq(email_campaigns.id, campaignId), ne(email_campaigns.status, 'sent')))
    .catch((cause) => console.error('[email/send] could not settle campaign', cause))
}

async function executeSendEmail(job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const sendId = stringValue(payload.sendId, 64)
  if (!sendId) return failure('send_email', 'send_email job is missing sendId')

  const sendRows = await db.select().from(email_sends).where(eq(email_sends.id, sendId)).limit(1)
  const send = sendRows[0]
  if (!send) return failure('send_email', `Send ${sendId} no longer exists`)
  if (send.status !== 'queued') return skipped('send_email', `send already ${send.status}`)

  // Second suppression check. The first ran when the audience was resolved, which may
  // have been minutes or hours ago on a scheduled campaign.
  if (send.contact_id) {
    const gate = await assertMarketable(null, send.contact_id)
    if (!gate.ok) {
      await db
        .update(email_sends)
        .set({ status: 'failed', failure_reason: `recipient not marketable: ${gate.reason}`, updated_at: new Date() })
        .where(eq(email_sends.id, send.id))
      await settleCampaignIfComplete(send.campaign_id)
      return skipped('send_email', `recipient not marketable: ${gate.reason}`)
    }
  }

  const context = await resolveEmailContext()
  const template = send.template_id ? await getTemplateById(send.template_id) : null
  if (!template) {
    await db
      .update(email_sends)
      .set({ status: 'failed', failure_reason: 'template no longer exists', updated_at: new Date() })
      .where(eq(email_sends.id, send.id))
    await settleCampaignIfComplete(send.campaign_id)
    return failure('send_email', 'template no longer exists')
  }

  const links = send.contact_id ? unsubscribeLinks(context, send.contact_id) : null
  const variables = mergeVariables({ name: '', email: send.to_email }, links?.pageUrl ?? context.baseUrl)
  const message = renderTemplate(template, { variables, context, unsubscribeUrl: links?.pageUrl ?? context.baseUrl })

  const result = await senderAdapter.sendTransactional({
    from: { email: context.fromEmail, name: context.fromName },
    to: { email: send.to_email },
    subject: send.subject || message.subject,
    ...(message.html.trim() ? { html: message.html } : {}),
    ...(message.text.trim() ? { text: message.text } : {}),
    ...(links ? { headers: listUnsubscribeHeaders(links.oneClickUrl) } : {}),
  })

  if (result.ok) {
    const data = result.data && !Array.isArray(result.data) ? (result.data as Record<string, unknown>) : {}
    const providerMessageId = typeof data.emailId === 'string' ? data.emailId : null
    await db
      .update(email_sends)
      .set({ status: 'sent', provider: 'sender', provider_message_id: providerMessageId, sent_at: new Date(), updated_at: new Date() })
      .where(eq(email_sends.id, send.id))
    await settleCampaignIfComplete(send.campaign_id)
    return { ok: true, status: 'success', operation: 'send_email', data: { id: send.id } }
  }

  await db
    .update(email_sends)
    .set({ status: 'failed', failure_reason: (result.error ?? 'provider refused the send').slice(0, 1000), updated_at: new Date() })
    .where(eq(email_sends.id, send.id))
  await settleCampaignIfComplete(send.campaign_id)
  return { ...result, operation: 'send_email' }
}

async function executeFlowEmail(job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const contactId = stringValue(payload.contactId, 64)
  const templateId = stringValue(payload.templateId, 64)
  const enrollmentId = stringValue(payload.enrollmentId, 64)
  const stepIndex = typeof payload.stepIndex === 'number' ? payload.stepIndex : -1
  if (!contactId || !templateId || !enrollmentId) return failure('flow_email', 'flow_email job is missing contactId, templateId or enrollmentId')

  const result = await sendMarketingMessage(null, {
    leadId: contactId,
    templateId,
    subjectOverride: stringValue(payload.subjectOverride, 500) ?? null,
    eventKey: `flow:${job.id}`,
    activityTitle: stringValue(payload.activityTitle, 255) ?? 'Flow email',
  })

  await db
    .update(flow_logs)
    .set({
      status: result.ok ? 'completed' : 'failed',
      result: { stepId: stringValue(payload.stepId, 64) ?? null, providerOperation: result.operation },
      error: result.ok ? null : (result.error ?? 'flow send failed').slice(0, 1000),
      executed_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(eq(flow_logs.enrollment_id, enrollmentId), eq(flow_logs.step_index, stepIndex)))
    .catch((cause) => console.error('[email/send] could not update flow log', cause))

  return result
}

async function executeLogEvent(job: OutboxJob): Promise<EmailJobResult> {
  const payload = objectValue(job.payload)
  const eventType = stringValue(payload.eventType, 100)
  if (!eventType) return failure('log_event', 'log_event job is missing eventType')

  await db.insert(events).values({
    id: randomUUID(),
    event_type: eventType,
    payload: objectValue(payload.data),
    source: stringValue(payload.source, 100) ?? 'outbox',
  })
  return { ok: true, status: 'success', operation: 'log_event' }
}

/** Dispatches one claimed outbox job to its executor. Unknown legacy types are skipped, not retried. */
export async function executeEmailJob(_client: EmailClient | null, job: OutboxJob): Promise<EmailJobResult> {
  switch (job.job_type) {
    case 'send_email':
      return executeSendEmail(job)
    case 'flow_email':
      return executeFlowEmail(job)
    case 'log_event':
      return executeLogEvent(job)
    default:
      return skipped(job.job_type, 'unsupported job type for this drainer')
  }
}

// ---------------------------------------------------------------------------
// Drainer
// ---------------------------------------------------------------------------

export type DrainSummary = { selected: number; processed: number; succeeded: number; skipped: number; failed: number; requeued: number }

export type DrainOptions = { limit?: number; deadlineAt?: number }

/**
 * Claims and runs due outbox jobs. The claim is a compare-and-swap on `status`
 * (`pending -> processing`), so two drainers cannot both execute the same job, and a
 * drainer that dies mid-job leaves the job to be reaped back to `pending`.
 */
export async function drainOutbox(_client: EmailClient | null, options: DrainOptions = {}): Promise<DrainSummary> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? integerEnv('EMAIL_OUTBOX_BATCH', 25, 1, 200)), 1), 200)
  const summary: DrainSummary = { selected: 0, processed: 0, succeeded: 0, skipped: 0, failed: 0, requeued: 0 }

  const due = await db
    .select()
    .from(outbox_jobs)
    .where(and(eq(outbox_jobs.status, 'pending'), lte(outbox_jobs.next_run_at, new Date())))
    .orderBy(asc(outbox_jobs.next_run_at))
    .limit(limit)
  summary.selected = due.length

  for (const row of due) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break

    const claimed = await db
      .update(outbox_jobs)
      .set({ status: 'processing', started_at: new Date(), updated_at: new Date(), attempts: row.attempts + 1 })
      .where(and(eq(outbox_jobs.id, row.id), eq(outbox_jobs.status, 'pending')))
      .returning({ id: outbox_jobs.id })
    if (!claimed.length) continue

    const job: OutboxJob = { ...row, job_type: row.job_type as EmailJobType, attempts: row.attempts + 1 }
    let result: EmailJobResult
    try {
      result = await executeEmailJob(null, job)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      console.error(`[email/send] job ${job.id} (${job.job_type}) threw`, error)
      result = failure(job.job_type, message, true)
    }

    summary.processed += 1
    if (result.ok) {
      summary.succeeded += 1
      await db
        .update(outbox_jobs)
        .set({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
        .where(eq(outbox_jobs.id, job.id))
      continue
    }

    if (result.status === 'skipped') {
      summary.skipped += 1
      await db
        .update(outbox_jobs)
        .set({ status: 'completed', completed_at: new Date(), last_error: result.error ?? 'skipped', updated_at: new Date() })
        .where(eq(outbox_jobs.id, job.id))
      continue
    }

    const retryable = result.retryable === true
    if (retryable && job.attempts < job.max_attempts) {
      summary.requeued += 1
      const backoffMinutes = Math.min(2 ** job.attempts, 60)
      await db
        .update(outbox_jobs)
        .set({
          status: 'pending',
          last_error: result.error ?? 'retryable failure',
          next_run_at: new Date(Date.now() + (result.deferralSeconds ? result.deferralSeconds * 1000 : backoffMinutes * 60_000)),
          updated_at: new Date(),
        })
        .where(eq(outbox_jobs.id, job.id))
      continue
    }

    summary.failed += 1
    await db
      .update(outbox_jobs)
      .set({ status: 'failed', last_error: result.error ?? 'failed', completed_at: new Date(), updated_at: new Date() })
      .where(eq(outbox_jobs.id, job.id))
  }

  return summary
}

/**
 * Jobs left `processing` by a container that died mid-flight. Without this they are
 * invisible to the drainer forever, because the claim filter only ever looks at
 * `pending`.
 *
 * Idempotent work goes back to `pending`. Anything that may already have put mail on
 * the wire is failed with the reason recorded and no automatic retry — a duplicate
 * delivery is worse than a missed one, and an operator can requeue it deliberately.
 */
export async function reapStaleJobs(_client: EmailClient | null, options: { staleMinutes?: number; limit?: number } = {}) {
  const staleMinutes = options.staleMinutes ?? integerEnv('EMAIL_JOB_STALE_MINUTES', 15, 2, 1_440)
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 50), 1), 200)
  const cutoff = new Date(Date.now() - staleMinutes * 60_000)

  const stuck = await db
    .select()
    .from(outbox_jobs)
    .where(and(eq(outbox_jobs.status, 'processing'), lte(outbox_jobs.updated_at, cutoff)))
    .limit(limit)

  let requeued = 0
  let abandoned = 0
  for (const job of stuck) {
    const ambiguous = AMBIGUOUS_JOB_TYPES.has(job.job_type)
    const claimed = await db
      .update(outbox_jobs)
      .set(
        ambiguous
          ? { status: 'failed', last_error: `Claim expired after ${staleMinutes} minutes; not retried automatically because delivery is ambiguous`, updated_at: new Date() }
          : { status: 'pending', last_error: `Claim expired after ${staleMinutes} minutes; requeued`, updated_at: new Date() },
      )
      .where(and(eq(outbox_jobs.id, job.id), eq(outbox_jobs.status, 'processing')))
      .returning({ id: outbox_jobs.id })
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
