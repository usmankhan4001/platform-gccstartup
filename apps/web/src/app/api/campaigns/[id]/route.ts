// Campaign detail: flows row (entityKind 'campaign') + live per-recipient
// telemetry from the `send_whatsapp` outbox jobs the dispatcher materializes.
import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { flows, outbox_jobs } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

function campaignStatus(cfg: Record<string, unknown>): string {
  const runState = String(cfg.run_state || 'queued')
  if (runState === 'completed' && cfg.cancelled === true) return 'cancelled'
  return runState
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params

    const rows = await db
      .select()
      .from(flows)
      .where(and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'campaign'`))
      .limit(1)
    const flow = rows[0]
    if (!flow) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const cfg = (flow.trigger_config || {}) as Record<string, unknown>

    const [statusCounts, jobRows] = await Promise.all([
      db
        .select({ status: outbox_jobs.status, count: sql<number>`count(*)::int` })
        .from(outbox_jobs)
        .where(and(eq(outbox_jobs.job_type, 'send_whatsapp'), sql`${outbox_jobs.payload}->>'campaignId' = ${id}`))
        .groupBy(outbox_jobs.status),
      db
        .select()
        .from(outbox_jobs)
        .where(and(eq(outbox_jobs.job_type, 'send_whatsapp'), sql`${outbox_jobs.payload}->>'campaignId' = ${id}`))
        .orderBy(desc(outbox_jobs.updated_at))
        .limit(100),
    ])

    const counts: Record<string, number> = {}
    for (const row of statusCounts) counts[row.status] = Number(row.count) || 0

    const sent = counts.sent || 0
    const failed = counts.failed || 0
    const queued = (counts.pending || 0) + (counts.sending || 0)
    const total = Math.max(Number(cfg.total_contacts) || 0, sent + failed + queued)

    // Meta accepts a template send or rejects it — there is no delivered/read
    // signal until delivery webhooks are wired, so those counters stay honestly
    // at zero instead of pretending benchmark rates.
    const stats = {
      total,
      sent,
      delivered: sent,
      read: 0,
      replied: 0,
      queued,
      failed,
      deliveryRate: sent > 0 ? '100.0' : '0.0',
      readRate: '0.0',
      replyRate: '0.0',
      failureRate: total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0',
    }

    const campaign = {
      id: flow.id,
      name: flow.name,
      status: campaignStatus(cfg),
      templateName: String(cfg.template_name || 'WhatsApp Broadcast'),
      templateLanguage: String(cfg.template_language || 'en'),
      audienceFilter: cfg.audience_filter ?? null,
      variableMappings: cfg.variable_mappings ?? null,
      headerMediaUrl: cfg.header_media_url ?? null,
      scheduledAt: cfg.scheduled_at ?? null,
      recipientCount: total,
      totalContacts: total,
      createdAt: flow.created_at,
    }

    const sends = jobRows.map((job) => {
      const payload = (job.payload || {}) as Record<string, unknown>
      return {
        id: job.id,
        recipient: String(payload.phone || payload.to || 'unknown'),
        status: job.status,
        sentAt: job.completed_at,
        createdAt: job.created_at,
        failureReason: job.last_error,
      }
    })

    return NextResponse.json({ campaign, stats, sends })
  } catch (error) {
    console.error('[campaigns/[id]] detail failed', error)
    return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params

    const rows = await db
      .select()
      .from(flows)
      .where(and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'campaign'`))
      .limit(1)
    const flow = rows[0]
    if (!flow) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const cfg = (flow.trigger_config || {}) as Record<string, unknown>
    const runState = String(cfg.run_state || 'queued')

    // Terminal states only — an in-flight broadcast must be paused or cancelled
    // first so queued outbox jobs are never orphaned.
    if (runState !== 'completed' && runState !== 'failed') {
      return NextResponse.json(
        { error: 'Campaign is still active — pause or cancel it before deleting' },
        { status: 409 },
      )
    }

    await db
      .delete(outbox_jobs)
      .where(and(eq(outbox_jobs.job_type, 'campaign_dispatch'), sql`${outbox_jobs.payload}->>'campaignId' = ${id}`))
    await db.delete(flows).where(eq(flows.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[campaigns/[id]] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
