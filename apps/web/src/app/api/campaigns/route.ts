import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, isNotNull, isNull, notExists, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, email_campaigns, email_suppressions, email_templates } from '@gccstartup/db'

// Campaigns are email campaigns (email_campaigns). Groups and tags are the same
// membership mechanism (contacts.tags jsonb), so includeGroups/includeTags and
// excludeGroups/excludeTags are unioned per side when resolving the audience.

type AudienceFilter = {
  sendToAll?: boolean
  includeGroups?: string[]
  includeTags?: string[]
  excludeGroups?: string[]
  excludeTags?: string[]
}

function parseAudienceFilter(value: unknown): AudienceFilter {
  let candidate = value
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate || '{}')
    } catch {
      candidate = {}
    }
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {}
  const raw = candidate as Record<string, unknown>
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
    // Marketing email requires explicit consent — enforced in the query, not after.
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
    const includeExpr = or(
      ...include.map((tag) => sql`${contacts.tags} @> ${JSON.stringify(tag)}::jsonb`),
    )
    if (includeExpr) conditions.push(includeExpr)
  }
  for (const tag of exclude) {
    conditions.push(sql`NOT (${contacts.tags} @> ${JSON.stringify(tag)}::jsonb)`)
  }
  return and(...conditions)
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)

    const rows = await db
      .select({
        id: email_campaigns.id,
        name: email_campaigns.name,
        templateId: email_campaigns.template_id,
        templateName: email_templates.name,
        audienceFilter: email_campaigns.audience_filter,
        status: email_campaigns.status,
        scheduledAt: email_campaigns.scheduled_at,
        startedAt: email_campaigns.started_at,
        completedAt: email_campaigns.completed_at,
        recipientCount: email_campaigns.recipient_count,
        error: email_campaigns.error,
        createdAt: email_campaigns.created_at,
      })
      .from(email_campaigns)
      .leftJoin(email_templates, eq(email_templates.id, email_campaigns.template_id))
      .orderBy(desc(email_campaigns.created_at))
      .limit(200)

    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns] list failed', error)
    return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['admin'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const templateId = typeof body.templateId === 'string' ? body.templateId : ''
    if (!name || !templateId) {
      return NextResponse.json({ error: 'Campaign name and template are required' }, { status: 400 })
    }

    const template = await db
      .select({ id: email_templates.id })
      .from(email_templates)
      .where(eq(email_templates.id, templateId))
      .limit(1)
    if (!template[0]) {
      return NextResponse.json({ error: 'Template not found' }, { status: 400 })
    }

    const audienceFilter = parseAudienceFilter(body.audienceFilter)
    const audience = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(audienceConditions(audienceFilter))

    const scheduledAt =
      typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))
        ? new Date(body.scheduledAt)
        : null

    const inserted = await db
      .insert(email_campaigns)
      .values({
        id: randomUUID(),
        name,
        template_id: templateId,
        audience_filter: audienceFilter as unknown as Record<string, unknown>,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt,
        recipient_count: audience.length,
        created_by: user.id,
      })
      .returning()

    const campaign = inserted[0]
    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        templateId: campaign.template_id,
        audienceFilter: campaign.audience_filter,
        status: campaign.status,
        scheduledAt: campaign.scheduled_at,
        recipientCount: campaign.recipient_count,
        totalContacts: campaign.recipient_count,
        createdAt: campaign.created_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns] create failed', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
