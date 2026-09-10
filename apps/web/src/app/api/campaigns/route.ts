// WhatsApp broadcast campaigns.
//
// Storage mapping (the schema has no whatsapp_campaigns table): a campaign is a
// `flows` row whose trigger_config carries { entityKind: 'campaign',
// template_name, template_language, audience_filter, variable_mappings,
// header_media_url, run_state, scheduled_at, total_contacts, sent_count,
// failed_count } — the same mapping lib/whatsapp/dispatcher.ts and the worker
// already speak. Dispatch is a durable `campaign_dispatch` outbox job the worker
// drains into the dispatcher, so a deploy or crash mid-broadcast never loses a
// send and Meta rate limiting stays in one place.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { flows, message_templates, outbox_jobs } from '@gccstartup/db'
import { resolveAudience } from '@/lib/whatsapp/dispatcher'

// The wizard speaks "wizard vocabulary" (firstName, custom.company); the
// dispatcher resolves a fixed set of contact fields. Translate on the way in so
// mapped variables actually resolve instead of degrading to 'Valued Customer'.
const FIELD_ALIASES: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  fullName: 'full_name',
  phoneNumber: 'phone',
  'custom.company': 'company',
  company_name: 'company_name',
}

type AudienceFilter = { includeTags?: string[]; excludeTags?: string[] }

function normalizeAudienceFilter(value: unknown): AudienceFilter {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  const toStringArray = (input: unknown): string[] =>
    Array.isArray(input) ? input.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : []

  // Groups and tags are the same membership mechanism (contacts.tags jsonb),
  // so both sides are unioned. No include filters (or explicit sendToAll) means
  // the whole phoneable audience — matching resolveAudience's contract.
  const includeTags = [...new Set([...toStringArray(raw.includeGroups), ...toStringArray(raw.includeTags)])]
  const excludeTags = [...new Set([...toStringArray(raw.excludeGroups), ...toStringArray(raw.excludeTags)])]
  if (raw.sendToAll === true || includeTags.length === 0) {
    return excludeTags.length ? { excludeTags } : {}
  }
  return { includeTags, excludeTags }
}

function normalizeVariableMappings(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d+$/.test(key)) continue
    if (typeof raw !== 'string' || !raw.trim()) continue
    out[key] = FIELD_ALIASES[raw] || raw
  }
  return out
}

function campaignStatus(cfg: Record<string, unknown>): string {
  const runState = String(cfg.run_state || 'queued')
  if (runState === 'completed' && cfg.cancelled === true) return 'cancelled'
  return runState
}

async function enqueueDispatch(campaignId: string, runAt: Date): Promise<number> {
  const inserted = await db
    .insert(outbox_jobs)
    .values({
      id: randomUUID(),
      job_type: 'campaign_dispatch',
      payload: { campaignId },
      status: 'pending',
      next_run_at: runAt,
      idempotency_key: `campaign_dispatch:${campaignId}:${runAt.getTime()}`,
    })
    .onConflictDoNothing({ target: outbox_jobs.idempotency_key })
    .returning({ id: outbox_jobs.id })
  return inserted.length
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const rows = await db
      .select()
      .from(flows)
      .where(sql`${flows.trigger_config}->>'entityKind' = 'campaign'`)
      .orderBy(desc(flows.created_at))
      .limit(200)

    // Live per-campaign recipient counts in one aggregate — dispatch counters on
    // the flow row only settle when the whole batch finishes.
    const jobRows = await db
      .select({
        campaignId: sql<string>`${outbox_jobs.payload}->>'campaignId'`,
        status: outbox_jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(outbox_jobs)
      .where(eq(outbox_jobs.job_type, 'send_whatsapp'))
      .groupBy(sql`${outbox_jobs.payload}->>'campaignId'`, outbox_jobs.status)

    const countsByCampaign = new Map<string, Record<string, number>>()
    for (const row of jobRows) {
      const key = String(row.campaignId || '')
      if (!key) continue
      const entry = countsByCampaign.get(key) || {}
      entry[row.status] = Number(row.count) || 0
      countsByCampaign.set(key, entry)
    }

    const campaigns = rows.map((flow) => {
      const cfg = (flow.trigger_config || {}) as Record<string, unknown>
      const counts = countsByCampaign.get(flow.id) || {}
      const sent = counts.sent || 0
      const failed = counts.failed || 0
      const queued = (counts.pending || 0) + (counts.sending || 0)
      const total = Number(cfg.total_contacts) || sent + failed + queued
      return {
        id: flow.id,
        name: flow.name,
        templateName: String(cfg.template_name || 'WhatsApp Broadcast'),
        status: campaignStatus(cfg),
        totalContacts: total,
        recipientCount: total,
        sentCount: sent,
        deliveredCount: sent,
        readCount: 0,
        failedCount: failed,
        queuedCount: queued,
        scheduledAt: cfg.scheduled_at || null,
        createdAt: flow.created_at,
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('[campaigns] list failed', error)
    return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const templateId = typeof body.templateId === 'string' ? body.templateId : ''
    if (!name || !templateId) {
      return NextResponse.json({ error: 'Campaign name and template are required' }, { status: 400 })
    }

    const templateRows = await db
      .select()
      .from(message_templates)
      .where(eq(message_templates.id, templateId))
      .limit(1)
    const template = templateRows[0]
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found — pick an approved template in step 2' },
        { status: 400 },
      )
    }
    if (template.status !== 'approved') {
      return NextResponse.json(
        { error: `Template "${template.name}" is not Meta-approved yet (status: ${template.status})` },
        { status: 400 },
      )
    }

    const audienceFilter = normalizeAudienceFilter(body.audienceFilter)
    const audience = await resolveAudience(null, audienceFilter)
    if (audience.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients — contacts need a phone number and a matching tag' },
        { status: 400 },
      )
    }

    const variableMappings = normalizeVariableMappings(body.variableMappings)
    const headerMediaUrl =
      typeof body.headerMediaUrl === 'string' && body.headerMediaUrl.trim() ? body.headerMediaUrl.trim() : null
    const scheduledAt =
      typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))
        ? new Date(body.scheduledAt)
        : null

    const campaignId = randomUUID()
    await db.insert(flows).values({
      id: campaignId,
      name,
      trigger_type: 'manual',
      status: 'active',
      trigger_config: {
        entityKind: 'campaign',
        template_name: template.name,
        template_language: template.language || 'en',
        audience_filter: audienceFilter,
        variable_mappings: variableMappings,
        header_media_url: headerMediaUrl,
        run_state: 'queued',
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        total_contacts: audience.length,
        sent_count: 0,
        failed_count: 0,
      },
      created_by: user.id,
    })

    // Immediate or scheduled, dispatch rides the outbox: the job's next_run_at is
    // the scheduler, and the worker's drain is the executor.
    let jobsQueued = 0
    if (scheduledAt || body.startImmediately === true) {
      jobsQueued = await enqueueDispatch(campaignId, scheduledAt ?? new Date())
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        name,
        templateId: template.id,
        templateName: template.name,
        status: 'queued',
        recipientCount: audience.length,
        totalContacts: audience.length,
        scheduledAt: scheduledAt,
        jobsQueued,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[campaigns] create failed', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
