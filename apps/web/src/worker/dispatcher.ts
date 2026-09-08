// WhatsApp campaign dispatch + outbox draining for WhatsApp job types.
// Email campaigns are dispatched by lib/email/send; WhatsApp campaigns live as
// `flows` rows with trigger_config.entityKind = 'campaign' (see the bots/
// knowledge-bases API routes for the mapping) and are dispatched here.

import { and, eq, lte, inArray } from 'drizzle-orm'
import { db } from '../lib/db'
import { flows, outbox_jobs } from '@gccstartup/db'
import { dispatchCampaign as dispatchWhatsappCampaign, resolveAudience } from '../lib/whatsapp/dispatcher'
import { sendWhatsappText } from '../lib/whatsapp/client'

/**
 * Resolves target contacts for a campaign based on inclusion/exclusion tags.
 * Delegates to the shared audience resolver in lib/whatsapp/dispatcher.
 */
export async function getTargetContacts(audienceFilterJson: string) {
  let filter: Record<string, unknown> = {}
  try {
    filter = JSON.parse(audienceFilterJson || '{}')
  } catch {
    filter = { sendToAll: true }
  }
  return resolveAudience(null, filter)
}

/**
 * Executes or resumes a WhatsApp campaign dispatch. Delegates to the shared
 * dispatcher in lib/whatsapp — API routes enqueue `campaign_dispatch` outbox
 * jobs that land here via drainWhatsappJobs.
 */
export async function dispatchCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dispatchWhatsappCampaign(null, campaignId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`[Dispatcher] campaign ${campaignId} failed:`, error)
    return { success: false, error: message }
  }
}

const WHATSAPP_JOB_TYPES = ['send_whatsapp', 'campaign_dispatch']

export type WhatsappDrainSummary = { selected: number; succeeded: number; failed: number; requeued: number }

/**
 * Claims and runs due WhatsApp outbox jobs. Mirrors the email drainer's
 * compare-and-swap claim and exponential backoff so both lanes behave the same.
 */
export async function drainWhatsappJobs(options: { limit?: number } = {}): Promise<WhatsappDrainSummary> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 25), 1), 200)
  const summary: WhatsappDrainSummary = { selected: 0, succeeded: 0, failed: 0, requeued: 0 }

  const due = await db
    .select()
    .from(outbox_jobs)
    .where(
      and(
        eq(outbox_jobs.status, 'pending'),
        lte(outbox_jobs.next_run_at, new Date()),
        inArray(outbox_jobs.job_type, WHATSAPP_JOB_TYPES),
      ),
    )
    .orderBy(outbox_jobs.next_run_at)
    .limit(limit)
  summary.selected = due.length

  for (const row of due) {
    const claimed = await db
      .update(outbox_jobs)
      .set({ status: 'processing', started_at: new Date(), updated_at: new Date(), attempts: row.attempts + 1 })
      .where(and(eq(outbox_jobs.id, row.id), eq(outbox_jobs.status, 'pending')))
      .returning({ id: outbox_jobs.id })
    if (!claimed.length) continue

    const attempts = row.attempts + 1
    try {
      if (row.job_type === 'campaign_dispatch') {
        const payload = row.payload as { campaignId?: string; flowId?: string }
        const campaignId = payload.campaignId || payload.flowId
        if (!campaignId) throw new Error('campaign_dispatch payload missing campaignId/flowId')
        await dispatchWhatsappCampaign(null, campaignId)
      } else {
        const payload = row.payload as { to?: string; phone?: string; body?: string; text?: string }
        const to = payload.to || payload.phone
        const body = payload.body || payload.text
        if (!to || !body) throw new Error('send_whatsapp payload missing to/phone or body/text')
        const sent = await sendWhatsappText(to, body)
        if (!sent) throw new Error('WhatsApp send returned false (provider unset or rejected)')
      }

      summary.succeeded += 1
      await db
        .update(outbox_jobs)
        .set({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
        .where(eq(outbox_jobs.id, row.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      if (attempts < row.max_attempts) {
        summary.requeued += 1
        const backoffMinutes = Math.min(2 ** attempts, 60)
        await db
          .update(outbox_jobs)
          .set({ status: 'pending', last_error: message, next_run_at: new Date(Date.now() + backoffMinutes * 60_000), updated_at: new Date() })
          .where(eq(outbox_jobs.id, row.id))
      } else {
        summary.failed += 1
        await db
          .update(outbox_jobs)
          .set({ status: 'failed', last_error: message, completed_at: new Date(), updated_at: new Date() })
          .where(eq(outbox_jobs.id, row.id))
      }
    }
  }

  return summary
}

/**
 * Finds WhatsApp campaigns (flows rows) whose scheduled time is due and kicks
 * off their dispatch. run_state jsonb carries { status, scheduledAt }.
 */
export async function dispatchDueWhatsappCampaigns(): Promise<number> {
  const candidates = await db
    .select({ id: flows.id, trigger_config: flows.trigger_config })
    .from(flows)
    .where(eq(flows.status, 'active'))

  let started = 0
  for (const flow of candidates) {
    const config = (flow.trigger_config || {}) as Record<string, unknown>
    if (config.entityKind !== 'campaign') continue
    const runState = (config.run_state || {}) as { status?: string; scheduledAt?: string }
    if (runState.status !== 'scheduled') continue
    if (!runState.scheduledAt || new Date(runState.scheduledAt) > new Date()) continue

    await dispatchWhatsappCampaign(null, flow.id)
    started += 1
  }
  return started
}
