/**
 * Audience resolution.
 *
 * There is no segments table in the platform database; a campaign carries its own
 * `audience_filter` jsonb, and an inline filter always takes precedence. Every
 * resolution path here:
 *
 *   1. rejects anything that is not a plain object, and caps its serialized size;
 *   2. AND-combines it with the marketability gate (granted consent, no unsubscribe,
 *      not deleted) in SQL, so a filter cannot widen the audience past consent no
 *      matter what it contains;
 *   3. pages through results rather than trusting a single limit.
 *
 * The filter itself supports a deliberately small grammar — equality on real contact
 * columns and a `tags` include — because author-supplied JSON is never translated
 * into arbitrary SQL.
 */
import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, email_suppressions } from '@gccstartup/db'
import { marketableContactWhere, normalizeEmail, partitionMarketable, type MarketableContact } from './suppression'

/** A pathological saved filter should fail loudly here, not inside Postgres. */
const MAX_FILTER_BYTES = 20_000
const PAGE_SIZE = 200
/** Hard ceiling on one campaign's audience. */
export const MAX_AUDIENCE = 5_000

/** Legacy field list kept for compatibility with old callers. */
export const AUDIENCE_FIELDS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'display_name',
  'company',
  'lifecycle_stage',
  'source',
  'tags',
  'custom_fields',
  'email_consent',
] as const

/** Contact columns an audience filter may constrain, and nothing else. */
const FILTERABLE_COLUMNS = new Set([
  'lifecycle_stage',
  'source',
  'company',
  'job_title',
  'owner_id',
])

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
  /** Reserved for a future saved-segments table; currently unresolved. */
  segmentId?: string | null
  segmentSlug?: string | null
  /** Inline filter — the only selector the platform database can resolve today. */
  filter?: unknown
}

export type ResolvedSegment = {
  filter: Record<string, unknown> | null
  segmentId: string | null
  segmentName: string | null
}

export async function resolveSegment(_client: unknown, selector: SegmentSelector): Promise<ResolvedSegment> {
  const inline = normalizeFilter(selector.filter)
  if (inline) return { filter: inline, segmentId: null, segmentName: null }
  // No saved-segments table exists yet: a segment-only selector resolves to nothing
  // rather than to "everyone", which is the only safe direction.
  return { filter: null, segmentId: null, segmentName: null }
}

/** The audience gate as a Drizzle `where` fragment: marketability AND the segment filter. */
export function audienceWhere(segmentFilter: Record<string, unknown> | null) {
  const clauses = [marketableContactWhere()]

  if (segmentFilter) {
    for (const [key, value] of Object.entries(segmentFilter)) {
      if (key === 'tags') {
        if (Array.isArray(value) && value.length) {
          clauses.push(sql`${contacts.tags} ?| ${sql.raw(`array[${value.map((tag) => `'${String(tag).replace(/'/g, "''")}'`).join(',')}]`)}`)
        }
        continue
      }
      if (!FILTERABLE_COLUMNS.has(key)) continue
      if (typeof value !== 'string' || !value) continue
      const column = contacts[key as keyof typeof contacts]
      if (column) clauses.push(eq(column as never, value))
    }
  }

  return and(...clauses)
}

/** Legacy filter-shaped API kept so old call sites compile; prefer `audienceWhere`. */
export function audienceFilter(segmentFilter: Record<string, unknown> | null): Record<string, unknown> | null {
  return segmentFilter
}

const AUDIENCE_SELECT = {
  id: contacts.id,
  email: contacts.email,
  first_name: contacts.first_name,
  last_name: contacts.last_name,
  display_name: contacts.display_name,
  company: contacts.company,
  custom_fields: contacts.custom_fields,
}

/**
 * Pages the audience out of the database. Stops at MAX_AUDIENCE and reports the
 * truncation rather than silently mailing a partial list. Suppression is enforced
 * twice: once in the query, once against `email_suppressions` afterwards, because an
 * address can be suppressed under a different (or no) contact record.
 */
export async function resolveAudience(
  _client: unknown,
  segmentFilter: Record<string, unknown> | null,
  options: { max?: number } = {},
): Promise<{ leads: MarketableContact[]; blocked: Array<{ lead: MarketableContact; reason: string }>; truncated: boolean }> {
  const max = Math.min(Math.max(Math.trunc(options.max ?? MAX_AUDIENCE), 1), MAX_AUDIENCE)
  const where = audienceWhere(segmentFilter)
  const collected: MarketableContact[] = []
  let truncated = false

  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const limit = Math.min(PAGE_SIZE, max - offset)
    const page = await db
      .select(AUDIENCE_SELECT)
      .from(contacts)
      .where(where)
      .orderBy(contacts.id)
      .limit(limit)
      .offset(offset)
    for (const row of page) {
      const email = normalizeEmail(row.email)
      if (row.id && email) collected.push({ ...row, custom_fields: row.custom_fields ?? {}, email })
    }
    if (page.length < limit) break
    if (collected.length >= max) {
      const probe = await db.select({ id: contacts.id }).from(contacts).where(where).limit(1).offset(max)
      truncated = probe.length > 0
      break
    }
  }

  const { allowed, blocked } = await partitionMarketable(null, collected)
  return { leads: allowed, blocked, truncated }
}

/** Audience size without pulling the rows — used by the campaign composer's preview. */
export async function countAudience(_client: unknown, segmentFilter: Record<string, unknown> | null): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(audienceWhere(segmentFilter))
  return rows[0]?.count ?? 0
}

/** Addresses on the standalone do-not-mail list that also match the audience gate (diagnostics helper). */
export async function countSuppressed(): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(email_suppressions).where(isNull(email_suppressions.contact_id))
  return rows[0]?.count ?? 0
}
