'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { and, eq, isNull } from 'drizzle-orm'
import { contacts, crm_activities, crm_notes, events, outbox_jobs, users } from '@gccstartup/db'
import { verifySession } from '@gccstartup/shared'

/**
 * Mutations the CRM screens own. They live next to the components because the
 * renewal sweep and the 360-degree composer have no REST route of their own, and
 * every write goes through the durable outbox so delivery stays retryable.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_TIERS = ['d60', 'd30', 'd7'] as const
type ReminderTier = (typeof REMINDER_TIERS)[number]

type ActionResult = {
  ok: boolean
  message: string
}

type SweepResult = ActionResult & {
  enqueued: number
  skipped: number
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS)
}

/** Trade-license expiry is the anchor deadline for the 60/30/7 alert ladder. */
function licenseExpiry(cf: Record<string, any>): Date | null {
  return parseDate(cf.trade_license_expiry) ?? parseDate(cf.annual_renewal_date)
}

async function currentUserId(): Promise<string | null> {
  try {
    const store = await cookies()
    const token = store.get(process.env.SESSION_COOKIE_NAME || 'gcc_session')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const payload = await verifySession(token, secret)
    return payload?.userId ?? null
  } catch (error) {
    console.error('[crm/actions] session check failed', error)
    return null
  }
}

/**
 * Enqueue the 60/30/7-day renewal reminders that are due but not yet sent.
 * Idempotency keys are per contact + tier, so a second sweep can never double
 * send even if the first run only partially completed.
 */
export async function runRenewalSweep(): Promise<SweepResult> {
  const userId = await currentUserId()
  if (!userId) {
    return { ok: false, message: 'Your session has expired - sign in again to dispatch alerts.', enqueued: 0, skipped: 0 }
  }

  try {
    const { db } = await import('@/lib/db')
    const rows = await db
      .select({
        id: contacts.id,
        company: contacts.company,
        email: contacts.email,
        phone: contacts.phone,
        custom_fields: contacts.custom_fields,
      })
      .from(contacts)
      .where(isNull(contacts.deleted_at))
      .limit(500)

    let enqueued = 0
    let skipped = 0
    const now = new Date()

    for (const row of rows) {
      const cf = asRecord(row.custom_fields)
      const expiry = licenseExpiry(cf)
      if (!expiry) {
        skipped += 1
        continue
      }

      const days = daysUntil(expiry)
      const reminders = asRecord(cf.reminders_sent)
      const due: ReminderTier[] = []
      if (days <= 60 && !reminders.d60) due.push('d60')
      if (days <= 30 && !reminders.d30) due.push('d30')
      if (days <= 7 && !reminders.d7) due.push('d7')

      if (due.length === 0) {
        skipped += 1
        continue
      }

      for (const tier of due) {
        await db
          .insert(outbox_jobs)
          .values({
            id: randomUUID(),
            job_type: 'renewal_reminder',
            payload: {
              contactId: row.id,
              tier,
              daysRemaining: days,
              expiry: expiry.toISOString().slice(0, 10),
              company: row.company ?? null,
              email: row.email ?? null,
              phone: row.phone ?? null,
              requestedBy: userId,
            },
            status: 'pending',
            priority: tier === 'd7' ? 10 : tier === 'd30' ? 5 : 1,
            next_run_at: now,
            idempotency_key: `renewal:${row.id}:${tier}:${expiry.toISOString().slice(0, 10)}`,
          })
          .onConflictDoNothing()
      }

      const nextReminders = { ...reminders }
      for (const tier of due) nextReminders[tier] = true

      await db
        .update(contacts)
        .set({
          custom_fields: { ...cf, reminders_sent: nextReminders, last_reminded_at: now.toISOString() },
          updated_at: now,
        })
        .where(eq(contacts.id, row.id))

      enqueued += due.length
    }

    if (enqueued > 0) {
      await db.insert(events).values({
        id: randomUUID(),
        event_type: 'renewal.reminder_sweep',
        source: 'crm_renewals',
        payload: { enqueued, skipped, triggeredBy: userId, executedAt: now.toISOString() },
      })
    }

    revalidatePath('/crm/renewals')
    revalidatePath('/crm')

    return {
      ok: true,
      message:
        enqueued > 0
          ? `Queued ${enqueued} renewal reminder${enqueued === 1 ? '' : 's'} for dispatch.`
          : 'Every 60/30/7-day reminder is already up to date.',
      enqueued,
      skipped,
    }
  } catch (error) {
    console.error('[crm/actions] renewal sweep failed', error)
    return { ok: false, message: 'The renewal sweep could not reach the database.', enqueued: 0, skipped: 0 }
  }
}

/** Dispatch a single reminder tier on demand, bypassing the ladder. */
export async function triggerRenewalReminder(contactId: string, tier: '60d' | '30d' | '7d'): Promise<ActionResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Your session has expired - sign in again.' }
  if (!contactId) return { ok: false, message: 'Missing contact.' }

  try {
    const { db } = await import('@/lib/db')
    const rows = await db
      .select({ id: contacts.id, company: contacts.company, email: contacts.email, phone: contacts.phone, custom_fields: contacts.custom_fields })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), isNull(contacts.deleted_at)))
      .limit(1)

    const row = rows[0]
    if (!row) return { ok: false, message: 'Contact not found.' }

    const cf = asRecord(row.custom_fields)
    const expiry = licenseExpiry(cf)
    const key: ReminderTier = tier === '7d' ? 'd7' : tier === '30d' ? 'd30' : 'd60'
    const now = new Date()

    await db
      .insert(outbox_jobs)
      .values({
        id: randomUUID(),
        job_type: 'renewal_reminder',
        payload: {
          contactId,
          tier: key,
          daysRemaining: expiry ? daysUntil(expiry) : null,
          expiry: expiry ? expiry.toISOString().slice(0, 10) : null,
          company: row.company ?? null,
          email: row.email ?? null,
          phone: row.phone ?? null,
          requestedBy: userId,
          manual: true,
        },
        status: 'pending',
        priority: tier === '7d' ? 10 : tier === '30d' ? 5 : 1,
        next_run_at: now,
        idempotency_key: `renewal:${contactId}:${key}:manual-${now.toISOString().slice(0, 10)}`,
      })
      .onConflictDoNothing()

    await db
      .update(contacts)
      .set({
        custom_fields: {
          ...cf,
          reminders_sent: { ...asRecord(cf.reminders_sent), [key]: true },
          last_reminded_at: now.toISOString(),
        },
        updated_at: now,
      })
      .where(eq(contacts.id, contactId))

    revalidatePath('/crm/renewals')
    return { ok: true, message: `${tier.toUpperCase()} renewal reminder queued for dispatch.` }
  } catch (error) {
    console.error('[crm/actions] reminder dispatch failed', error)
    return { ok: false, message: 'Could not queue the reminder.' }
  }
}

/** Extend a trade license by one year and reset the reminder ladder. */
export async function renewTradeLicense(contactId: string): Promise<ActionResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Your session has expired - sign in again.' }
  if (!contactId) return { ok: false, message: 'Missing contact.' }

  try {
    const { db } = await import('@/lib/db')
    const rows = await db
      .select({ id: contacts.id, custom_fields: contacts.custom_fields })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), isNull(contacts.deleted_at)))
      .limit(1)

    const row = rows[0]
    if (!row) return { ok: false, message: 'Contact not found.' }

    const cf = asRecord(row.custom_fields)
    const current = licenseExpiry(cf) ?? new Date()
    const next = new Date(current.getTime() + 365 * DAY_MS)
    const nextIso = next.toISOString().slice(0, 10)
    const now = new Date()

    await db
      .update(contacts)
      .set({
        custom_fields: {
          ...cf,
          trade_license_expiry: nextIso,
          annual_renewal_date: nextIso,
          reminders_sent: { d60: false, d30: false, d7: false },
          last_renewed_at: now.toISOString(),
        },
        updated_at: now,
      })
      .where(eq(contacts.id, contactId))

    await db.insert(crm_activities).values({
      id: randomUUID(),
      contact_id: contactId,
      type: 'call',
      direction: 'outbound',
      subject: `Trade license renewed to ${nextIso}`,
      notes: 'Annual renewal filed. Reminder ladder reset for the new term.',
      occurred_at: now,
      logged_by: userId,
    })

    revalidatePath('/crm/renewals')
    revalidatePath('/crm')
    return { ok: true, message: `Trade license renewed until ${nextIso}.` }
  } catch (error) {
    console.error('[crm/actions] license renewal failed', error)
    return { ok: false, message: 'Could not renew the trade license.' }
  }
}

/**
 * Merge arbitrary `custom_fields` onto a contact. The REST PATCH route only
 * whitelists a fixed set of keys, so the 360-degree drawer uses this for the
 * KYC checklist and the compliance dates it owns.
 */
export async function updateLeadFields(
  contactId: string,
  fields: Record<string, unknown>
): Promise<ActionResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Your session has expired - sign in again.' }
  if (!contactId) return { ok: false, message: 'Missing contact.' }
  if (!fields || typeof fields !== 'object') return { ok: false, message: 'Nothing to save.' }

  try {
    const { db } = await import('@/lib/db')
    const rows = await db
      .select({ id: contacts.id, custom_fields: contacts.custom_fields })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), isNull(contacts.deleted_at)))
      .limit(1)

    const row = rows[0]
    if (!row) return { ok: false, message: 'Contact not found.' }

    await db
      .update(contacts)
      .set({
        custom_fields: { ...asRecord(row.custom_fields), ...fields },
        updated_at: new Date(),
      })
      .where(eq(contacts.id, contactId))

    revalidatePath('/crm')
    revalidatePath('/crm/deals')
    revalidatePath('/crm/renewals')
    return { ok: true, message: 'Record updated.' }
  } catch (error) {
    console.error('[crm/actions] field update failed', error)
    return { ok: false, message: 'Could not save the record.' }
  }
}

/** Persist an internal note from the 360-degree drawer composer. */
export async function logLeadNote(contactId: string, body: string): Promise<ActionResult> {
  const userId = await currentUserId()
  if (!userId) return { ok: false, message: 'Your session has expired - sign in again.' }

  const text = (body || '').trim()
  if (!contactId || !text) return { ok: false, message: 'Write something before saving the note.' }

  try {
    const { db } = await import('@/lib/db')
    const contactRows = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, contactId), isNull(contacts.deleted_at)))
      .limit(1)
    if (!contactRows[0]) return { ok: false, message: 'Contact not found.' }

    const authorRows = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1)

    await db.insert(crm_notes).values({
      id: randomUUID(),
      contact_id: contactId,
      body: text,
      author_id: userId,
      author_name: authorRows[0]?.name ?? null,
    })

    return { ok: true, message: 'Note saved to the timeline.' }
  } catch (error) {
    console.error('[crm/actions] note save failed', error)
    return { ok: false, message: 'Could not save the note.' }
  }
}
