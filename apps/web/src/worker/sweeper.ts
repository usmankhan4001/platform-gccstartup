// Recovers work abandoned mid-flight and reconciles campaign counters.

import { eq, and, inArray, lt, sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { outbox_jobs, email_campaigns, email_sends } from '@gccstartup/db'
import { reapStaleJobs } from '../lib/email/send'

/**
 * Jobs/campaigns stuck in an active state without progress are reaped back to
 * pending (jobs) or finalized (campaigns) so they can never wedge the pipeline.
 */
export async function sweepStuckCampaigns(): Promise<void> {
  try {
    await reapStaleJobs(null)

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const stuck = await db
      .select({ id: email_campaigns.id })
      .from(email_campaigns)
      .where(and(inArray(email_campaigns.status, ['sending']), lt(email_campaigns.updated_at, fiveMinutesAgo)))

    for (const campaign of stuck) {
      // A campaign with no pending outbox work left is done; otherwise it will
      // be picked back up by the next dispatch pass.
      const pending = await db
        .select({ id: outbox_jobs.id })
        .from(outbox_jobs)
        .where(and(eq(outbox_jobs.status, 'pending'), lt(outbox_jobs.next_run_at, new Date())))
        .limit(1)
      if (!pending.length) {
        await db
          .update(email_campaigns)
          .set({ status: 'sent', updated_at: new Date() })
          .where(eq(email_campaigns.id, campaign.id))
        console.log(`[Sweeper] finalized stalled campaign ${campaign.id}`)
      }
    }
  } catch (error) {
    console.error('[Sweeper] Error sweeping stuck campaigns', error)
  }
}

/**
 * Read-repair for campaign counters: logs the true per-status send counts so
 * drift between the campaign row and email_sends is visible in the logs. The
 * campaign detail endpoint computes its aggregates live from email_sends, so
 * there is nothing to write back until a denormalised counter column exists.
 */
export async function reconcileCampaignCounters(): Promise<void> {
  try {
    const active = await db
      .select({ id: email_campaigns.id })
      .from(email_campaigns)
      .where(inArray(email_campaigns.status, ['sending', 'sent']))

    for (const campaign of active) {
      const counts = await db
        .select({ status: email_sends.status, total: sql<number>`count(*)::int` })
        .from(email_sends)
        .where(eq(email_sends.campaign_id, campaign.id))
        .groupBy(email_sends.status)
      console.log(`[Sweeper] campaign ${campaign.id} counters`, counts)
    }
  } catch (error) {
    console.error('[Sweeper] Error reconciling counters', error)
  }
}
