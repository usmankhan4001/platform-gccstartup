/**
 * Read-only analytics aggregation over `email_events`.
 *
 * The webhook (`src/app/api/webhooks/sender/route.ts`) writes one row per Sender
 * event with an `event_type` taken from Sender's topic vocabulary. This module is the
 * pure, Directus-free layer that turns those rows into per-campaign and per-flow
 * counts and rates, so the analytics page and its tests share one implementation.
 *
 * The classifier is deliberately tolerant: it recognises the Sender topics the
 * webhook currently writes (`bounces/new`, `subscribers/unsubscribed`, ...) and any
 * future `opened`/`clicked`/`delivered` type, so the page keeps working as the
 * webhook's topic coverage grows. Unknown types are ignored rather than counted.
 */
export type EmailEventRow = {
  id?: string
  event_type?: string | null
  lead_id?: string | null
  campaign?: string | null
  flow?: string | null
  sync_job?: string | null
  occurred_at?: string | null
  email?: string | null
  metadata?: Record<string, unknown> | null
}

export type EngagementBucket = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'

export const ENGAGEMENT_BUCKETS: readonly EngagementBucket[] = [
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'unsubscribed',
]

/** Maps an `event_type` string to a canonical engagement bucket, or null if unknown. */
export function bucketForEventType(eventType: string | null | undefined): EngagementBucket | null {
  const type = (eventType ?? '').toLowerCase()
  if (!type) return null
  if (type.includes('bounce')) return 'bounced'
  if (type.includes('unsubscrib')) return 'unsubscribed'
  if (type.includes('open')) return 'opened'
  if (type.includes('click')) return 'clicked'
  if (type.includes('deliver')) return 'delivered'
  // Sender's "new" topics are the closest thing it emits for a send/sync.
  if (type.includes('subscribers/new') || type.includes('campaigns/new') || type.includes('groups/new') || type.includes('sent')) return 'sent'
  return null
}

export type EngagementStats = {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
}

export function emptyStats(): EngagementStats {
  return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, openRate: 0, clickRate: 0, bounceRate: 0, unsubscribeRate: 0 }
}

function rate(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

export function statsFromCounts(counts: Pick<EngagementStats, 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'>): EngagementStats {
  return {
    ...counts,
    openRate: rate(counts.opened, counts.delivered > 0 ? counts.delivered : counts.sent),
    clickRate: rate(counts.clicked, counts.opened > 0 ? counts.opened : counts.sent),
    bounceRate: rate(counts.bounced, counts.sent),
    unsubscribeRate: rate(counts.unsubscribed, counts.delivered > 0 ? counts.delivered : counts.sent),
  }
}

export type EngagementPoint = { date: string; opened: number; clicked: number }

export type CampaignAnalytics = EngagementStats & {
  campaignId: string
  engagement: EngagementPoint[]
}

export type FlowAnalytics = EngagementStats & {
  flowId: string
  engagement: EngagementPoint[]
}

function dayKey(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function engagementFrom(rows: EmailEventRow[]): EngagementPoint[] {
  const byDay: Record<string, { opened: number; clicked: number }> = {}
  for (const row of rows) {
    const day = dayKey(row.occurred_at)
    if (!day) continue
    const bucket = bucketForEventType(row.event_type)
    // Only opens and clicks move the engagement line; other buckets are counted in
    // the totals but do not add a point to the over-time series.
    if (bucket !== 'opened' && bucket !== 'clicked') continue
    const point = byDay[day] ?? { opened: 0, clicked: 0 }
    if (bucket === 'opened') point.opened += 1
    if (bucket === 'clicked') point.clicked += 1
    byDay[day] = point
  }
  return Object.entries(byDay)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([date, point]) => ({ date, ...point }))
}

function countRows(rows: EmailEventRow[]): Pick<EngagementStats, 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'> {
  const counts = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 }
  for (const row of rows) {
    const bucket = bucketForEventType(row.event_type)
    if (bucket && bucket in counts) counts[bucket] += 1
  }
  return counts
}

/** Aggregates one campaign's events into counts, rates and an engagement-over-time series. */
export function aggregateCampaignEvents(rows: EmailEventRow[], campaignId: string): CampaignAnalytics {
  const counts = countRows(rows)
  return { campaignId, ...statsFromCounts(counts), engagement: engagementFrom(rows) }
}

/** Aggregates one flow's events into counts, rates and an engagement-over-time series. */
export function aggregateFlowEvents(rows: EmailEventRow[], flowId: string): FlowAnalytics {
  const counts = countRows(rows)
  return { flowId, ...statsFromCounts(counts), engagement: engagementFrom(rows) }
}

export type AnalyticsOverview = {
  totals: EngagementStats
  byCampaign: CampaignAnalytics[]
  byFlow: FlowAnalytics[]
}

/**
 * Groups a flat event list by its `campaign` / `flow` relation and aggregates each
 * group, plus a grand total. Rows with no campaign or flow relation are counted in
 * the totals but not attributed to a specific campaign/flow.
 */
export function aggregateEvents(rows: EmailEventRow[]): AnalyticsOverview {
  const byCampaign: Record<string, EmailEventRow[]> = {}
  const byFlow: Record<string, EmailEventRow[]> = {}
  for (const row of rows) {
    const campaignId = typeof row.campaign === 'string' ? row.campaign : (row.campaign as { id?: string } | null)?.id
    const flowId = typeof row.flow === 'string' ? row.flow : (row.flow as { id?: string } | null)?.id
    if (campaignId) (byCampaign[campaignId] ??= []).push(row)
    if (flowId) (byFlow[flowId] ??= []).push(row)
  }
  return {
    totals: statsFromCounts(countRows(rows)),
    byCampaign: Object.entries(byCampaign).map(([id, group]) => aggregateCampaignEvents(group, id)),
    byFlow: Object.entries(byFlow).map(([id, group]) => aggregateFlowEvents(group, id)),
  }
}

/* ------------------------------------------------------------ lead-wise ----
   The campaign/flow views above answer "how did this broadcast do?". The lead
   view answers the CRM question instead: "what has this one person engaged
   with?". It is the same event stream, re-cut by `lead_id` — per-lead totals and
   an over-time series, plus a breakdown of which campaigns and flows the lead
   touched. The route that feeds it (src/app/api/admin/email/analytics/lead)
   filters `email_events` by lead before calling in, so the rows here are already
   one person's. */

export type LeadEngagementEntityKind = 'campaign' | 'flow'

export type LeadEngagementEntity = {
  /** The campaign id or flow label the events were attributed to. */
  ref: string
  kind: LeadEngagementEntityKind
  stats: EngagementStats
}

export type LeadAnalytics = EngagementStats & {
  leadId: string
  /** Opens and clicks per day — the same series the campaign view uses. */
  timeline: EngagementPoint[]
  /** Which campaigns and flows the lead engaged with, with per-entity counts. */
  entities: LeadEngagementEntity[]
}

/** Extracts the campaign id or flow label from a row, mirroring aggregateEvents. */
function entityRef(row: EmailEventRow): { kind: LeadEngagementEntityKind; ref: string } | null {
  const campaignId = typeof row.campaign === 'string' ? row.campaign : (row.campaign as { id?: string } | null)?.id
  if (campaignId) return { kind: 'campaign', ref: campaignId }
  const flowId = typeof row.flow === 'string' ? row.flow : (row.flow as { id?: string } | null)?.id
  if (flowId) return { kind: 'flow', ref: flowId }
  return null
}

/**
 * Aggregates one lead's events into totals, an engagement-over-time series and a
 * per-campaign/flow breakdown. Rows with no resolvable attribution still count
 * toward the totals but are not listed under an entity.
 */
export function aggregateLeadEvents(rows: EmailEventRow[], leadId: string): LeadAnalytics {
  // Defensive: the route already filters by lead_id, but the aggregator is the
  // single place that owns the "this is one person's events" contract, so it
  // re-filters here rather than trusting every caller to remember to.
  const mine = rows.filter((row) => {
    const id = typeof row.lead_id === 'string' ? row.lead_id : (row.lead_id as { id?: string } | null)?.id
    return id === leadId
  })
  const byEntity: Record<string, EmailEventRow[]> = {}
  for (const row of mine) {
    const ref = entityRef(row)
    if (ref) (byEntity[`${ref.kind}:${ref.ref}`] ??= []).push(row)
  }
  const entities = Object.entries(byEntity)
    .map(([key, group]) => {
      const separator = key.indexOf(':')
      const kind = key.slice(0, separator) as LeadEngagementEntityKind
      const ref = key.slice(separator + 1)
      return { kind, ref, stats: statsFromCounts(countRows(group)) }
    })
    .sort((left, right) => {
      // Most-engaged first, so the CRM view leads with what matters.
      const l = left.stats.opened + left.stats.clicked
      const r = right.stats.opened + right.stats.clicked
      return r - l
    })
  return {
    leadId,
    ...statsFromCounts(countRows(mine)),
    timeline: engagementFrom(mine),
    entities,
  }
}

/* --------------------------------------------------------- drizzle load ----
   The aggregation above is pure. These helpers are the Drizzle-backed readers
   that feed it: one campaign-scoped loader and one platform-wide loader, both
   tolerant of failure (they degrade to an empty stream with a logged error, per
   the house rule that a failed read must never blank a page). */

import { db } from '@/lib/db'
import { email_sends, events } from '@gccstartup/db'
import { desc, eq } from 'drizzle-orm'

/**
 * Loads the engagement stream for one campaign (or the whole platform) from the
 * database: per-send terminal states from `email_sends` plus fine-grained
 * engagement events (`email.opened`, `email.clicked`, ...) from `events`.
 */
export async function loadEngagementRows(options: { campaignId?: string; limit?: number } = {}): Promise<EmailEventRow[]> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 5_000), 1), 20_000)
  const rows: EmailEventRow[] = []

  try {
    const sendRows = options.campaignId
      ? await db.select().from(email_sends).where(eq(email_sends.campaign_id, options.campaignId)).limit(limit)
      : await db.select().from(email_sends).limit(limit)

    for (const send of sendRows) {
      const eventType =
        send.status === 'failed' || send.status === 'queued'
          ? 'sent'
          : send.status // 'sent' | 'delivered' | 'bounced' | 'complained' (complained ~ unsubscribed bucket)
      rows.push({
        id: send.id,
        event_type: eventType === 'complained' ? 'unsubscribed' : eventType,
        lead_id: send.contact_id,
        campaign: send.campaign_id,
        occurred_at: (send.delivered_at ?? send.sent_at ?? send.created_at)?.toISOString() ?? null,
        email: send.to_email,
        metadata: null,
      })
    }

    const eventRows = await db
      .select()
      .from(events)
      .orderBy(desc(events.created_at))
      .limit(limit)
    for (const event of eventRows) {
      if (!event.event_type.startsWith('email.')) continue
      if (event.event_type === 'email.sent') continue // already covered by the send rows
      const payload = event.payload ?? {}
      rows.push({
        id: event.id,
        event_type: event.event_type.replace('email.', ''),
        lead_id: typeof payload.contact_id === 'string' ? payload.contact_id : null,
        campaign: null,
        occurred_at: event.created_at.toISOString(),
        email: typeof payload.email === 'string' ? payload.email : null,
        metadata: payload,
      })
    }
  } catch (error) {
    console.error('[email/analytics] failed to load engagement rows', error)
    return rows
  }

  return rows
}
