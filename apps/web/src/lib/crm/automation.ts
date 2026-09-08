import { randomUUID } from 'crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { deals, events, flows, outbox_jobs } from '@gccstartup/db'

/**
 * Stage-transition automations for the CRM pipeline.
 *
 * Records a durable `lead_stage_changed` event (so the AutomationsView feed and any
 * future replay have the full history), then returns the ids of every active flow
 * triggered on deal_stage_changed. Callers only need the ids — the automation
 * engine owns execution, and this function must never throw past a logged error.
 */
export async function dispatchStageAutomations(leadId: string, oldStage: string, newStage: string) {
  try {
    await db.insert(events).values({
      id: randomUUID(),
      event_type: 'lead_stage_changed',
      payload: { leadId, oldStage, newStage, summary: `Stage moved from ${oldStage} to ${newStage}` },
      source: 'crm',
    })

    const matching = await db
      .select({ id: flows.id })
      .from(flows)
      .where(and(eq(flows.status, 'active'), eq(flows.trigger_type, 'deal_stage_changed')))

    return matching.map((flow) => flow.id)
  } catch (error) {
    console.error('[crm/automation] dispatchStageAutomations failed', error)
    return []
  }
}

/**
 * Renewal sweep: open deals with an expected close date inside the next 30 days
 * get one durable compliance_reminder outbox job each. The idempotency key is
 * per-deal per-day, so running the sweep repeatedly never duplicates reminders.
 */
export async function evaluateUpcomingRenewals() {
  try {
    const upcoming = await db
      .select({
        id: deals.id,
        title: deals.title,
        expected_close_date: deals.expected_close_date,
      })
      .from(deals)
      .where(
        and(
          eq(deals.status, 'open'),
          sql`${deals.expected_close_date} IS NOT NULL AND ${deals.expected_close_date} <= (CURRENT_DATE + INTERVAL '30 days')`,
        ),
      )
      .limit(1000)

    if (!upcoming.length) return { renewed: 0 }

    const today = new Date().toISOString().slice(0, 10)
    const inserted = await db
      .insert(outbox_jobs)
      .values(
        upcoming.map((deal) => ({
          id: randomUUID(),
          job_type: 'compliance_reminder',
          payload: {
            dealId: deal.id,
            title: deal.title,
            expectedCloseDate: deal.expected_close_date,
          },
          status: 'pending',
          next_run_at: new Date(),
          idempotency_key: `compliance_reminder:${deal.id}:${today}`,
        })),
      )
      .onConflictDoNothing({ target: outbox_jobs.idempotency_key })
      .returning({ id: outbox_jobs.id })

    return { renewed: inserted.length }
  } catch (error) {
    console.error('[crm/automation] evaluateUpcomingRenewals failed', error)
    return { renewed: 0 }
  }
}
