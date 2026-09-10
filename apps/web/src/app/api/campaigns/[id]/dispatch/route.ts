// Campaign dispatch control. START/RESUME enqueue a durable `campaign_dispatch`
// outbox job that the worker drains into lib/whatsapp/dispatcher (rate-limited
// Meta sends, pause-aware loop, per-recipient jobs). PAUSE delegates to the
// dispatcher's pause lock; CANCEL stops the loop, fails pending jobs and marks
// the campaign cancelled. Nothing here sends inline — a 10k-recipient broadcast
// must never hold an HTTP request open.
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { flows, outbox_jobs } from '@gccstartup/db'
import { pauseCampaign } from '@/lib/whatsapp/dispatcher'

type Params = { params: Promise<{ id: string }> }

async function loadCampaign(id: string) {
  const rows = await db
    .select()
    .from(flows)
    .where(and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'campaign'`))
    .limit(1)
  return rows[0] ?? null
}

async function patchConfig(id: string, cfg: Record<string, unknown>, patch: Record<string, unknown>) {
  await db
    .update(flows)
    .set({ trigger_config: { ...cfg, ...patch }, updated_at: new Date() })
    .where(eq(flows.id, id))
}

// Fails every pending job for this campaign so an interrupted or cancelled
// broadcast never leaves phantom recipients queued behind a terminal state.
async function failPendingJobs(id: string, reason: string): Promise<number> {
  const failed = await db
    .update(outbox_jobs)
    .set({ status: 'failed', last_error: reason, completed_at: new Date(), updated_at: new Date() })
    .where(
      and(
        sql`${outbox_jobs.payload}->>'campaignId' = ${id}`,
        eq(outbox_jobs.status, 'pending'),
        sql`${outbox_jobs.job_type} IN ('campaign_dispatch', 'send_whatsapp')`,
      ),
    )
    .returning({ id: outbox_jobs.id })
  return failed.length
}

export async function POST(request: NextRequest, { params }: Params) {
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
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = typeof body.action === 'string' ? body.action.toUpperCase() : ''

    const flow = await loadCampaign(id)
    if (!flow) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    const cfg = (flow.trigger_config || {}) as Record<string, unknown>
    const runState = String(cfg.run_state || 'queued')

    if (action === 'START' || action === 'RESUME') {
      if (runState === 'running') {
        return NextResponse.json({ error: 'Campaign is already sending' }, { status: 409 })
      }
      if (runState === 'completed' || runState === 'failed') {
        return NextResponse.json({ error: `Campaign is ${runState} and cannot be restarted` }, { status: 409 })
      }
      if (action === 'RESUME' && runState !== 'paused') {
        return NextResponse.json({ error: 'Only paused campaigns can be resumed' }, { status: 409 })
      }

      // Re-use a pending dispatch job when one exists (e.g. launching a scheduled
      // broadcast early) instead of queueing a duplicate; otherwise create one.
      // The unique-per-attempt key keeps retries and resumes conflict-free.
      const existingJobs = await db
        .select({ id: outbox_jobs.id })
        .from(outbox_jobs)
        .where(
          and(
            eq(outbox_jobs.job_type, 'campaign_dispatch'),
            sql`${outbox_jobs.payload}->>'campaignId' = ${id}`,
            eq(outbox_jobs.status, 'pending'),
          ),
        )
        .limit(1)

      let queued: number
      if (existingJobs[0]) {
        await db
          .update(outbox_jobs)
          .set({ next_run_at: new Date(), updated_at: new Date() })
          .where(eq(outbox_jobs.id, existingJobs[0].id))
        queued = 1
      } else {
        const inserted = await db
          .insert(outbox_jobs)
          .values({
            id: crypto.randomUUID(),
            job_type: 'campaign_dispatch',
            payload: { campaignId: id },
            status: 'pending',
            next_run_at: new Date(),
            idempotency_key: `campaign_dispatch:${id}:${Date.now()}`,
          })
          .onConflictDoNothing({ target: outbox_jobs.idempotency_key })
          .returning({ id: outbox_jobs.id })
        queued = inserted.length
      }

      await patchConfig(id, cfg, { run_state: 'queued', cancelled: false, updated_by: user.id })

      return NextResponse.json({
        success: true,
        status: 'queued',
        queued,
        message: queued
          ? 'Dispatch queued — the worker will start sending within a minute'
          : 'Dispatch is already queued',
      })
    }

    if (action === 'PAUSE') {
      if (runState === 'running') {
        const result = await pauseCampaign(null, id)
        if (!result.success) {
          return NextResponse.json({ error: result.error || 'Could not pause campaign' }, { status: 409 })
        }
        return NextResponse.json({ success: true, status: 'paused' })
      }
      if (runState === 'queued') {
        // Not started yet: stop the pending dispatch job before the worker picks it up.
        await failPendingJobs(id, 'Paused before dispatch')
        await patchConfig(id, cfg, { run_state: 'paused', updated_by: user.id })
        return NextResponse.json({ success: true, status: 'paused' })
      }
      return NextResponse.json({ error: 'Campaign is not in a pausable state' }, { status: 409 })
    }

    if (action === 'CANCEL') {
      if (runState === 'completed' || runState === 'failed') {
        return NextResponse.json({ error: 'Campaign is already terminal' }, { status: 409 })
      }

      // Pause first so an in-flight dispatch loop stops between sends, then
      // fail the remaining jobs and close the campaign out.
      if (runState === 'running') {
        await pauseCampaign(null, id).catch((error) => {
          console.error('[campaigns/[id]/dispatch] pause during cancel failed', error)
        })
      }
      const cancelledJobs = await failPendingJobs(id, 'Cancelled by user')
      await patchConfig(id, cfg, {
        run_state: 'completed',
        cancelled: true,
        failed_count: (Number(cfg.failed_count) || 0) + cancelledJobs,
        updated_by: user.id,
      })

      return NextResponse.json({ success: true, status: 'cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
  } catch (error) {
    console.error('[campaigns/[id]/dispatch] failed', error)
    return NextResponse.json({ error: 'Failed to process campaign action' }, { status: 500 })
  }
}
