/**
 * Audience resolution.
 *
 * A segment is a saved Directus filter over `leads`, shared between the CRM's list
 * filters and campaign audiences so the two can never drift apart. The filter is
 * author-supplied JSON, so every resolution path here:
 *
 *   1. rejects anything that is not a plain object, and caps its serialized size;
 *   2. AND-combines it with marketableLeadFilter(), so a segment cannot widen the
 *      audience past consent and suppression no matter what it contains;
 *   3. pages through results rather than trusting a single limit.
 *
 * Point 2 is the important one: suppression is enforced in the query, not by
 * remembering to filter the results afterwards.
 */
// TODO: Replace with Drizzle queries
const readItems = (...args: any[]) => ([] as any)
import type { LeadItem } from '@/lib/directus'
import { type EmailClient } from './client'
import { marketableLeadFilter, partitionMarketable, type MarketableLead } from './suppression'

/** A pathological saved filter should fail loudly here, not inside Postgres. */
const MAX_FILTER_BYTES = 20_000
const PAGE_SIZE = 200
/** Hard ceiling on one campaign's audience — Sender's free tier tops out at 2,500 subscribers. */
export const MAX_AUDIENCE = 5_000

export const AUDIENCE_FIELDS = [
  'id',
  'email',
  'name',
  'country',
  'interest',
  'status',
  'email_subscription_status',
  'email_suppressed_at',
  'consent_status',
  'sender_subscriber_id',
] as const

export function normalizeFilter(value: unknown): Record<string, unknown> | null {
  let candidate = value
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    if (!trimmed) return null
    try {
      candidate = JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  if (!Object.keys(candidate).length) return null

  let serialized: string
  try {
    serialized = JSON.stringify(candidate)
  } catch {
    return null
  }
  if (serialized.length > MAX_FILTER_BYTES) return null
  return candidate as Record<string, unknown>
}

export type SegmentSelector = {
  /** email_segments.id */
  segmentId?: string | null
  /** email_segments.slug */
  segmentSlug?: string | null
  /** Inline filter — takes precedence over the saved segment when both are given. */
  filter?: unknown
}

export type ResolvedSegment = {
  filter: Record<string, unknown> | null
  segmentId: string | null
  segmentName: string | null
}

export async function resolveSegment(client: EmailClient, selector: SegmentSelector): Promise<ResolvedSegment> {
  const inline = normalizeFilter(selector.filter)
  if (inline) return { filter: inline, segmentId: null, segmentName: null }

  const key = selector.segmentId?.trim() || selector.segmentSlug?.trim()
  if (!key) return { filter: null, segmentId: null, segmentName: null }

  const rows = await client.request(
    readItems('email_segments', {
      filter: selector.segmentId?.trim() ? { id: { _eq: selector.segmentId.trim() } } : { slug: { _eq: key } },
      fields: ['id', 'name', 'filter'],
      limit: 1,
    }),
  )
  const segment = rows[0]
  if (!segment) return { filter: null, segmentId: null, segmentName: null }
  return { filter: normalizeFilter(segment.filter), segmentId: segment.id, segmentName: segment.name ?? null }
}

/** The audience query actually sent to Directus: the segment AND the marketability gate. */
export function audienceFilter(segmentFilter: Record<string, unknown> | null): Record<string, unknown> {
  const marketable = marketableLeadFilter()
  return segmentFilter ? { _and: [marketable, segmentFilter] } : marketable
}

/**
 * Pages the audience out of Directus. Stops at MAX_AUDIENCE and reports the
 * truncation rather than silently mailing a partial list.
 */
export async function resolveAudience(
  client: EmailClient,
  segmentFilter: Record<string, unknown> | null,
  options: { max?: number } = {},
): Promise<{ leads: MarketableLead[]; blocked: Array<{ lead: LeadItem; reason: string }>; truncated: boolean }> {
  const max = Math.min(Math.max(Math.trunc(options.max ?? MAX_AUDIENCE), 1), MAX_AUDIENCE)
  const filter = audienceFilter(segmentFilter)
  const collected: LeadItem[] = []
  let truncated = false

  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const limit = Math.min(PAGE_SIZE, max - offset)
    const page = await client.request(readItems('leads', { filter, fields: [...AUDIENCE_FIELDS], sort: ['id'], limit, offset }))
    collected.push(...(page as LeadItem[]))
    if (page.length < limit) break
    if (collected.length >= max) {
      const probe = await client.request(readItems('leads', { filter, fields: ['id'], limit: 1, offset: max }))
      truncated = probe.length > 0
      break
    }
  }

  const { allowed, blocked } = await partitionMarketable(client, collected)
  return { leads: allowed, blocked, truncated }
}

/** Audience size without pulling the rows — used by the campaign composer's preview. */
export async function countAudience(client: EmailClient, segmentFilter: Record<string, unknown> | null): Promise<number> {
  const rows = await client.request(
    readItems('leads', { filter: audienceFilter(segmentFilter), fields: ['id'], limit: MAX_AUDIENCE }),
  )
  return rows.length
}
