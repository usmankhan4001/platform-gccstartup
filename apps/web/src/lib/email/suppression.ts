/**
 * Suppression and the unsubscribe token.
 *
 * Two gates, deliberately:
 *   - a contact we know about is gated on its own row (`email_consent`,
 *     `unsubscribed_at`, `deleted_at`) — the CRM has to see that state on the record;
 *   - an address with no contact record goes to `email_suppressions`, which exists so
 *     a forwarded email or a one-click unsubscribe from a non-contact still stops mail.
 *
 * `assertMarketable()` is the single gate. Every marketing enqueue path calls it, and
 * it consults both stores. Operational mail is transactional and deliberately does
 * not pass through here.
 *
 * The unsubscribe link carries an HMAC of the contact id keyed by
 * EMAIL_UNSUBSCRIBE_SECRET. There is no expiry: a link in a two-year-old email must
 * still work. The token authorises exactly one thing — unsubscribing that one
 * contact — so it carries no other authority worth time-boxing.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, email_suppressions } from '@gccstartup/db'

const TOKEN_VERSION = 'v1'
const MIN_SECRET_LENGTH = 32

export type SuppressionReason = 'hard_bounce' | 'complaint' | 'manual' | 'invalid'

/** Legacy subscription states that must never receive marketing mail. */
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

function sign(secret: string, contactId: string): string {
  return base64url(createHmac('sha256', secret).update(`${TOKEN_VERSION}:${contactId}`).digest())
}

/** Returns null when the secret is unset, so callers fail closed rather than mailing without a working opt-out. */
export function createUnsubscribeToken(contactId: string): string | null {
  const secret = unsubscribeSecret()
  if (!secret || !contactId) return null
  return `${TOKEN_VERSION}.${base64url(Buffer.from(contactId, 'utf8'))}.${sign(secret, contactId)}`
}

/** Returns the contact id the token authorises, or null for anything that does not verify. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  const secret = unsubscribeSecret()
  if (!secret || typeof token !== 'string' || token.length > 512) return null

  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return null

  let contactId: string
  try {
    contactId = fromBase64url(parts[1]).toString('utf8')
  } catch {
    return null
  }
  if (!contactId || contactId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(contactId)) return null

  const expected = Buffer.from(sign(secret, contactId))
  const supplied = Buffer.from(parts[2])
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
  return contactId
}

export function unsubscribeUrl(baseUrl: string, contactId: string): string | null {
  const token = createUnsubscribeToken(contactId)
  if (!token) return null
  return `${baseUrl.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(token)}`
}

/** The two headers Gmail and Outlook look for. Both are required for one-click to work. */
export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List=One-Click' }
}

/** Legacy shape kept for callers that still pass old lead items around. */
export function leadIsSuppressed(lead: { email_subscription_status?: unknown; email_suppressed_at?: unknown }): boolean {
  if (lead.email_suppressed_at) return true
  const status = lead.email_subscription_status
  return typeof status === 'string' && (SUPPRESSED_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
}

/** A contact row subset that every mail path is allowed to rely on. */
export type MarketableContact = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  company: string | null
  custom_fields: Record<string, unknown>
}

/** Legacy alias — the audience type is contact-based now. */
export type MarketableLead = MarketableContact

/** Consent is legal: marketing mail requires granted consent, an active record, and no unsubscribe. */
export function contactIsMarketable(contact: {
  email?: string | null
  email_consent?: unknown
  unsubscribed_at?: Date | null
  deleted_at?: Date | null
}): boolean {
  if (!contact.email) return false
  if (contact.deleted_at) return false
  if (contact.unsubscribed_at) return false
  return contact.email_consent === 'granted'
}

/** Addresses in `email_suppressions`, looked up in chunks so the IN list stays sane. */
export async function loadSuppressedAddresses(_client: unknown, emails: string[]): Promise<Set<string>> {
  const wanted = [...new Set(emails.map(normalizeEmail).filter((value): value is string => value !== null))]
  const found = new Set<string>()
  if (!wanted.length) return found
  for (let index = 0; index < wanted.length; index += 100) {
    const chunk = wanted.slice(index, index + 100)
    // Failing open would mail a suppressed address, so a lookup failure propagates and the caller aborts.
    const rows = await db
      .select({ email: email_suppressions.email })
      .from(email_suppressions)
      .where(inArray(email_suppressions.email, chunk))
    for (const row of rows) {
      const email = normalizeEmail(row.email)
      if (email) found.add(email)
    }
  }
  return found
}

/**
 * Splits an already-filtered contact list into those that may be mailed and those
 * that may not. The query filter catches contact-level state; this second pass
 * catches an address suppressed under a different (or no) contact record.
 */
export async function partitionMarketable(
  _client: unknown,
  candidates: Array<MarketableContact>,
): Promise<{ allowed: MarketableContact[]; blocked: Array<{ lead: MarketableContact; reason: string }> }> {
  const allowed: MarketableContact[] = []
  const blocked: Array<{ lead: MarketableContact; reason: string }> = []

  const suppressed = await loadSuppressedAddresses(null, candidates.map((contact) => contact.email))
  for (const contact of candidates) {
    if (suppressed.has(normalizeEmail(contact.email) ?? '')) blocked.push({ lead: contact, reason: 'address_suppressed' })
    else allowed.push(contact)
  }
  return { allowed, blocked }
}

/**
 * Last gate before a single marketing send is enqueued. Re-reads the contact so a
 * suppression or consent withdrawal that landed between audience resolution and
 * dispatch still wins.
 */
export async function assertMarketable(
  _client: unknown,
  contactId: string,
): Promise<{ ok: true; lead: MarketableContact } | { ok: false; reason: string }> {
  const rows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
  const contact = rows[0]
  if (!contact) return { ok: false, reason: 'contact_not_found' }

  const email = normalizeEmail(contact.email)
  if (!email) return { ok: false, reason: 'invalid_email' }
  if (contact.deleted_at) return { ok: false, reason: 'contact_deleted' }
  if (contact.unsubscribed_at) return { ok: false, reason: 'contact_unsubscribed' }
  if (contact.email_consent !== 'granted') return { ok: false, reason: 'no_consent' }

  const suppressed = await loadSuppressedAddresses(null, [email])
  if (suppressed.has(email)) return { ok: false, reason: 'address_suppressed' }

  return {
    ok: true,
    lead: {
      id: contact.id,
      email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      display_name: contact.display_name,
      company: contact.company,
      custom_fields: contact.custom_fields ?? {},
    },
  }
}

/** Adds an address to the standalone do-not-mail list. Idempotent on email. */
export async function suppressAddress(
  _client: unknown,
  input: { email: string; reason: SuppressionReason; source: string; detail?: string },
): Promise<boolean> {
  const email = normalizeEmail(input.email)
  if (!email) return false

  const existing = await db
    .select({ id: email_suppressions.id })
    .from(email_suppressions)
    .where(eq(email_suppressions.email, email))
    .limit(1)
  if (existing.length) return true

  try {
    await db.insert(email_suppressions).values({
      id: crypto.randomUUID(),
      email,
      reason: input.reason,
      source: input.source.slice(0, 100),
      detail: input.detail ?? null,
    })
    return true
  } catch (error) {
    // The unique index on email means a concurrent write lands here; that is a success.
    const raced = await db
      .select({ id: email_suppressions.id })
      .from(email_suppressions)
      .where(eq(email_suppressions.email, email))
      .limit(1)
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
 * The full unsubscribe write: the contact's consent state and the standalone
 * suppression entry. The contact row is the audit evidence a regulator asks for, so
 * it is written even when the address was already suppressed by a different route.
 */
export async function suppressLead(
  _client: unknown,
  input: { leadId: string; reason: SuppressionReason; source: string; evidenceKey: string; detail?: string },
): Promise<SuppressLeadResult> {
  const rows = await db.select().from(contacts).where(eq(contacts.id, input.leadId)).limit(1)
  const contact = rows[0]
  const email = normalizeEmail(contact?.email)
  if (!contact || !email) return { ok: false, alreadySuppressed: false, leadId: contact?.id ?? null, email: null }

  const already = Boolean(contact.unsubscribed_at)
  try {
    await db
      .update(contacts)
      .set({
        email_consent: 'denied',
        unsubscribed_at: contact.unsubscribed_at ?? new Date(),
        email_consent_at: contact.email_consent_at ?? new Date(),
        updated_at: new Date(),
      })
      .where(eq(contacts.id, contact.id))
  } catch (error) {
    console.error('[email/suppression] failed to update contact consent state', error)
    return { ok: false, alreadySuppressed: already, leadId: contact.id, email }
  }

  await suppressAddress(null, {
    email,
    reason: input.reason,
    source: input.source,
    detail: input.detail ?? input.evidenceKey,
  })

  return { ok: true, alreadySuppressed: already, leadId: contact.id, email }
}

/** Contacts that may receive marketing mail, enforced in SQL rather than by memory. */
export function marketableContactWhere() {
  return and(
    isNull(contacts.deleted_at),
    isNull(contacts.unsubscribed_at),
    eq(contacts.email_consent, 'granted'),
  )
}
