/**
 * Suppression and the unsubscribe token.
 *
 * Two stores, deliberately:
 *   - a lead we know about is suppressed on its own row (`email_subscription_status`,
 *     `email_suppressed_at`), because the CRM has to see that state on the timeline;
 *   - an address with no lead record goes to `email_suppressions`, which exists so a
 *     forwarded email or a one-click unsubscribe from a non-lead recipient still
 *     stops mail.
 *
 * `assertMarketable()` is the single gate. Every marketing enqueue path calls it,
 * and it consults both stores. Operational mail — backup alerts, the dead-man's
 * switch — is transactional and deliberately does not pass through here.
 *
 * The unsubscribe link carries an HMAC of the lead id keyed by
 * EMAIL_UNSUBSCRIBE_SECRET. There is no expiry: a link in a two-year-old email must
 * still work, and an expired unsubscribe link is a compliance failure, not a
 * security feature. The token authorises exactly one thing — unsubscribing that one
 * lead — so it carries no other authority worth time-boxing.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
// TODO: Replace with Drizzle queries
const createItem = (...args: any[]) => ({} as any)
const readItems = (...args: any[]) => ([] as any)
const updateItem = (...args: any[]) => ({} as any)
import { emailDirectus, type EmailClient } from './client'
import type { LeadItem } from '@/lib/directus'

const TOKEN_VERSION = 'v1'
const MIN_SECRET_LENGTH = 32

export type SuppressionReason = 'unsubscribed' | 'bounced' | 'spam_reported' | 'manual' | 'invalid'

/** Lead subscription states that must never receive marketing mail. */
export const SUPPRESSED_SUBSCRIPTION_STATUSES = ['unsubscribed', 'bounced', 'spam_reported', 'suppressed'] as const

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function unsubscribeSecret(): string | null {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim()
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null
}

/** False when EMAIL_UNSUBSCRIBE_SECRET is missing or too short — no marketing mail may go out in that state. */
export function unsubscribeConfigured(): boolean {
  return unsubscribeSecret() !== null
}

function base64url(value: Buffer): string {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(secret: string, leadId: string): string {
  return base64url(createHmac('sha256', secret).update(`${TOKEN_VERSION}:${leadId}`).digest())
}

/** Returns null when the secret is unset, so callers fail closed rather than mailing without a working opt-out. */
export function createUnsubscribeToken(leadId: string): string | null {
  const secret = unsubscribeSecret()
  if (!secret || !leadId) return null
  return `${TOKEN_VERSION}.${base64url(Buffer.from(leadId, 'utf8'))}.${sign(secret, leadId)}`
}

/** Returns the lead id the token authorises, or null for anything that does not verify. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  const secret = unsubscribeSecret()
  if (!secret || typeof token !== 'string' || token.length > 512) return null

  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null

  let leadId: string
  try {
    leadId = fromBase64url(parts[1]).toString('utf8')
  } catch {
    return null
  }
  if (!leadId || leadId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(leadId)) return null

  const expected = Buffer.from(sign(secret, leadId))
  const supplied = Buffer.from(parts[2])
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
  return leadId
}

export function unsubscribeUrl(baseUrl: string, leadId: string): string | null {
  const token = createUnsubscribeToken(leadId)
  if (!token) return null
  return `${baseUrl.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(token)}`
}

/** The two headers Gmail and Outlook look for. Both are required for one-click to work. */
export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List=One-Click' }
}

export function leadIsSuppressed(lead: { email_subscription_status?: unknown; email_suppressed_at?: unknown }): boolean {
  if (lead.email_suppressed_at) return true
  const status = lead.email_subscription_status
  return typeof status === 'string' && (SUPPRESSED_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
}

/**
 * Directus filter fragment selecting leads that may receive marketing mail: a real
 * address, consent on record, and no suppression. AND this into every audience
 * query so suppression is enforced by the database rather than by remembering to
 * check afterwards.
 */
export function marketableLeadFilter(): Record<string, unknown> {
  return {
    _and: [
      { email: { _nnull: true } },
      { email_suppressed_at: { _null: true } },
      { _or: [{ email_subscription_status: { _null: true } }, { email_subscription_status: { _nin: [...SUPPRESSED_SUBSCRIPTION_STATUSES] } }] },
      { _or: [{ consent_status: { _eq: 'granted' } }, { email_subscription_status: { _eq: 'subscribed' } }] },
    ],
  }
}

/** Addresses in `email_suppressions`, looked up in chunks so the query string stays sane. */
export async function loadSuppressedAddresses(client: EmailClient, emails: string[]): Promise<Set<string>> {
  const wanted = [...new Set(emails.map(normalizeEmail).filter((value): value is string => value !== null))]
  const found = new Set<string>()
  for (let index = 0; index < wanted.length; index += 100) {
    const chunk = wanted.slice(index, index + 100)
    const rows = await client
      .request(readItems('email_suppressions', { filter: { email: { _in: chunk } }, fields: ['email'], limit: chunk.length }))
      .catch((error: any) => {
        console.error('[email/suppression] suppression lookup failed', error)
        // Failing open would mail a suppressed address. Rethrow so the caller aborts.
        throw error
      })
    for (const row of rows) {
      const email = normalizeEmail(row.email)
      if (email) found.add(email)
    }
  }
  return found
}

export type MarketableLead = LeadItem & { id: string; email: string }

/**
 * Splits an already-filtered lead list into those that may be mailed and those that
 * may not. The list filter catches lead-level suppression; this second pass catches
 * an address suppressed under a different (or no) lead record.
 */
export async function partitionMarketable(
  client: EmailClient,
  leads: LeadItem[],
): Promise<{ allowed: MarketableLead[]; blocked: Array<{ lead: LeadItem; reason: string }> }> {
  const allowed: MarketableLead[] = []
  const blocked: Array<{ lead: LeadItem; reason: string }> = []

  const candidates: MarketableLead[] = []
  for (const lead of leads) {
    const email = normalizeEmail(lead.email)
    if (!lead.id || !email) {
      blocked.push({ lead, reason: 'invalid_email' })
      continue
    }
    if (leadIsSuppressed(lead)) {
      blocked.push({ lead, reason: 'lead_suppressed' })
      continue
    }
    candidates.push({ ...lead, id: lead.id, email })
  }

  const suppressed = await loadSuppressedAddresses(client, candidates.map((lead) => lead.email))
  for (const lead of candidates) {
    if (suppressed.has(lead.email)) blocked.push({ lead, reason: 'address_suppressed' })
    else allowed.push(lead)
  }
  return { allowed, blocked }
}

/**
 * Last gate before a single marketing send is enqueued. Re-reads the lead so a
 * suppression that landed between audience resolution and dispatch still wins.
 */
export async function assertMarketable(client: EmailClient, leadId: string): Promise<{ ok: true; lead: MarketableLead } | { ok: false; reason: string }> {
  const rows = await client.request(
    readItems('leads', {
      filter: { id: { _eq: leadId } },
      fields: ['id', 'email', 'name', 'country', 'interest', 'email_subscription_status', 'email_suppressed_at', 'consent_status'],
      limit: 1,
    }),
  )
  const lead = rows[0]
  if (!lead) return { ok: false, reason: 'lead_not_found' }

  const email = normalizeEmail(lead.email)
  if (!email) return { ok: false, reason: 'invalid_email' }
  if (leadIsSuppressed(lead)) return { ok: false, reason: 'lead_suppressed' }
  if (lead.consent_status !== 'granted' && lead.email_subscription_status !== 'subscribed') return { ok: false, reason: 'no_consent' }

  const suppressed = await loadSuppressedAddresses(client, [email])
  if (suppressed.has(email)) return { ok: false, reason: 'address_suppressed' }
  return { ok: true, lead: { ...lead, id: lead.id, email } }
}

/** Adds an address to the standalone do-not-mail list. Idempotent on email. */
export async function suppressAddress(
  client: EmailClient,
  input: { email: string; reason: SuppressionReason; source: string; metadata?: Record<string, unknown> },
): Promise<boolean> {
  const email = normalizeEmail(input.email)
  if (!email) return false

  const existing = await client.request(readItems('email_suppressions', { filter: { email: { _eq: email } }, fields: ['id'], limit: 1 })).catch(() => [])
  if (existing.length) return true

  try {
    await client.request(
      createItem('email_suppressions', {
        email,
        reason: input.reason,
        source: input.source.slice(0, 100),
        suppressed_at: new Date().toISOString(),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      }),
    )
    return true
  } catch (error) {
    // The unique index on email means a concurrent write lands here; that is a success.
    const raced = await client.request(readItems('email_suppressions', { filter: { email: { _eq: email } }, fields: ['id'], limit: 1 })).catch(() => [])
    if (raced.length) return true
    console.error('[email/suppression] failed to record suppression', error)
    return false
  }
}

export type SuppressLeadResult = {
  ok: boolean
  alreadySuppressed: boolean
  leadId: string | null
  email: string | null
}

/**
 * The full unsubscribe write: lead state, an append-only `lead_consents` revocation
 * row, and the standalone suppression entry. The consent row is the audit evidence
 * a regulator asks for, so it is written even when the lead row was already
 * suppressed by a different route.
 */
export async function suppressLead(
  client: EmailClient,
  input: { leadId: string; reason: SuppressionReason; source: string; evidenceKey: string; metadata?: Record<string, unknown> },
): Promise<SuppressLeadResult> {
  const rows = await client.request(
    readItems('leads', {
      filter: { id: { _eq: input.leadId } },
      fields: ['id', 'email', 'email_subscription_status', 'email_suppressed_at'],
      limit: 1,
    }),
  )
  const lead = rows[0]
  if (!lead) return { ok: false, alreadySuppressed: false, leadId: null, email: null }

  const email = normalizeEmail(lead.email)
  const alreadySuppressed = leadIsSuppressed(lead)
  const suppressedAt = new Date().toISOString()
  const subscriptionStatus = input.reason === 'unsubscribed' ? 'unsubscribed' : input.reason

  if (!alreadySuppressed) {
    await client.request(
      updateItem('leads', lead.id, {
        email_subscription_status: subscriptionStatus,
        email_suppressed_at: suppressedAt,
        sender_status: subscriptionStatus,
        sender_last_synced_at: suppressedAt,
        ...(input.reason === 'unsubscribed' ? { consent_status: 'revoked' as const } : {}),
      }),
    )
  }

  const consentEventId = `${input.evidenceKey}:${lead.id}`.slice(0, 250)
  const existingConsent = await client
    .request(readItems('lead_consents', { filter: { event_id: { _eq: consentEventId } }, fields: ['id'], limit: 1 }))
    .catch(() => [])
  if (!existingConsent.length) {
    try {
      await client.request(
        createItem('lead_consents', {
          lead_id: lead.id,
          consent_type: 'email_marketing',
          granted: false,
          source: input.source.slice(0, 100),
          policy_version: process.env.LEAD_CONSENT_POLICY_VERSION,
          event_id: consentEventId,
          captured_at: suppressedAt,
          metadata: { reason: input.reason, ...(input.metadata ?? {}) },
        }),
      )
    } catch (error) {
      const raced = await client.request(readItems('lead_consents', { filter: { event_id: { _eq: consentEventId } }, fields: ['id'], limit: 1 })).catch(() => [])
      if (!raced.length) console.error('[email/suppression] failed to record consent revocation', error)
    }
  }

  if (email) await suppressAddress(client, { email, reason: input.reason, source: input.source, metadata: input.metadata })

  return { ok: true, alreadySuppressed, leadId: lead.id, email }
}

/** Convenience for callers that have no client to hand (the public unsubscribe route). */
export function suppressionClient(): EmailClient {
  return emailDirectus()
}
