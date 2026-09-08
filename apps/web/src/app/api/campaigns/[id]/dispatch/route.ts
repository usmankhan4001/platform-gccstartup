import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, eq, isNotNull, isNull, notExists, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, email_campaigns, email_suppressions, outbox_jobs } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

type AudienceFilter = {
  sendToAll?: boolean
  includeGroups?: string[]
  includeTags?: string[]
  excludeGroups?: string[]
  excludeTags?: string[]
}

function parseAudienceFilter(value: unknown): AudienceFilter {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const raw = value as Record<string, unknown>
  const toStringArray = (input: unknown): string[] | undefined =>
    Array.isArray(input) ? input.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : undefined
  return {
    sendToAll: raw.sendToAll === true,
    includeGroups: toStringArray(raw.includeGroups),
    includeTags: toStringArray(raw.includeTags),
    excludeGroups: toStringArray(raw.excludeGroups),
    excludeTags: toStringArray(raw.excludeTags),
  }
}

function audienceConditions(filter: AudienceFilter) {
  const include = [...new Set([...(filter.includeGroups || []), ...(filter.includeTags || [])])]
  const exclude = [...new Set([...(filter.excludeGroups || []), ...(filter.excludeTags || [])])]

  const conditions = [
    isNull(contacts.deleted_at),
    isNotNull(contacts.email),
    eq(contacts.email_consent, 'granted'),
    isNull(contacts.unsubscribed_at),
    notExists(
      db
        .select({ one: sql`1` })
        .from(email_suppressions)
        .where(eq(email_suppressions.email, contacts.email)),
    ),
  ]
  if (include.length) {
    const includeExpr = or(...include.map((tag) => sql`${contacts.tags} @> ${JSON.stringify(tag)}::jsonb`))
    if (includeExpr) conditions.push(includeExpr)
  }
  for (const tag of exclude) {
    conditions.push(sql`NOT (${contacts.tags} @> ${JSON.stringify(tag)}::jsonb)`)
  }
  return and(...conditions)
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['admin'])
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = typeof body.action === 'string' ? body.action.toUpperCase() : ''

    const campaignRows = await db.select().from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
    const campaign = campaignRows[0]
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    if (action === 'START' || action === 'RESUME') {
      if (campaign.status === 'sending') {
        return NextResponse.json({ error: 'Campaign is already sending' }, { status: 409 })
      }
      if (campaign.status === 'sent' || campaign.status === 'cancelled') {
        return NextResponse.json({ error: `Campaign is ${campaign.status} and cannot be restarted` }, { status: 409 })
      }

      // Audience is resolved fresh at dispatch time with consent and suppression
      // enforced in the query — a stale saved count is never trusted.
      const filter = parseAudienceFilter(campaign.audience_filter)
      const audience = await db
        .select({ id: contacts.id, email: contacts.email })
        .from(contacts)
        .where(audienceConditions(filter))

      await db
        .update(email_campaigns)
        .set({
          status: 'sending',
          started_at: campaign.started_at || new Date(),
          recipient_count: audience.length,
          error: null,
          updated_by: user.id,
          updated_at: new Date(),
        })
        .where(eq(email_campaigns.id, id))

      // One durable outbox job per recipient, deduped by idempotency key so a
      // retried dispatch never double-sends to a contact.
      const chunkSize = 500
      let queued = 0
      for (let i = 0; i < audience.length; i += chunkSize) {
        const chunk = audience.slice(i, i + chunkSize)
        const inserted = await db
          .insert(outbox_jobs)
          .values(
            chunk.map((recipient) => ({
              id: randomUUID(),
              job_type: 'send_email',
              payload: { campaignId: id, contactId: recipient.id, to: recipient.email },
              status: 'pending',
              next_run_at: new Date(),
              idempotency_key: `campaign:${id}:contact:${recipient.id}`,
            })),
          )
          .onConflictDoNothing({ target: outbox_jobs.idempotency_key })
          .returning({ id: outbox_jobs.id })
        queued += inserted.length
      }

      return NextResponse.json({ success: true, status: 'sending', recipients: audience.length, queued })
    }

    if (action === 'PAUSE') {
      const paused = await db
        .update(email_campaigns)
        .set({ status: 'paused', updated_by: user.id, updated_at: new Date() })
        .where(sql`${email_campaigns.id} = ${id} AND ${email_campaigns.status} IN ('draft', 'scheduled', 'sending')`)
        .returning({ id: email_campaigns.id })
      if (!paused.length) {
        return NextResponse.json({ error: 'Campaign is not in a pausable state' }, { status: 409 })
      }
      return NextResponse.json({ success: true, status: 'paused' })
    }

    if (action === 'CANCEL') {
      const cancelled = await db
        .update(email_campaigns)
        .set({ status: 'cancelled', completed_at: new Date(), updated_by: user.id, updated_at: new Date() })
        .where(
          sql`${email_campaigns.id} = ${id} AND ${email_campaigns.status} IN ('draft', 'scheduled', 'sending', 'paused')`,
        )
        .returning({ id: email_campaigns.id })
      if (!cancelled.length) {
        return NextResponse.json({ error: 'Campaign is already terminal' }, { status: 409 })
      }
      return NextResponse.json({ success: true, status: 'cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns/[id]/dispatch] failed', error)
    return NextResponse.json({ error: 'Failed to process campaign action' }, { status: 500 })
  }
}
