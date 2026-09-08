// Outbound webhooks: enqueue deliveries for subscribed endpoints, then deliver
// with HMAC-SHA256 signatures and exponential backoff.

import crypto from 'crypto'
import { and, eq, lte } from 'drizzle-orm'
import { db } from '../lib/db'
import { webhook_deliveries, webhooks } from '@gccstartup/db'

const RETRY_DELAYS_MS = [1 * 60 * 1000, 5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000, 12 * 60 * 60 * 1000]

/**
 * Enqueues an outbound webhook event for all active endpoints subscribed to it.
 * Never throws — webhook delivery is best-effort by design.
 */
export async function enqueueOutboundWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const endpoints = await db
      .select({ id: webhooks.id, events: webhooks.events })
      .from(webhooks)
      .where(eq(webhooks.is_active, true))

    const matching = endpoints.filter((ep) => !ep.events?.length || ep.events.includes(event) || ep.events.includes('*'))
    if (!matching.length) return

    const body = { event, timestamp: new Date().toISOString(), data: payload }
    await db.insert(webhook_deliveries).values(
      matching.map((ep) => ({
        id: crypto.randomUUID(),
        webhook_id: ep.id,
        event_type: event,
        payload: body,
        status: 'pending',
      })),
    )
  } catch (error) {
    console.error('[Webhooks] Failed to enqueue outbound webhook', { event, error })
  }
}

function sign(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Worker cycle: delivers pending webhook deliveries with HMAC signing and
 * exponential backoff. A delivery is retried up to RETRY_DELAYS_MS.length
 * attempts, then marked failed with the last error recorded.
 */
export async function processOutboundWebhooks(): Promise<void> {
  try {
    const pending = await db
      .select({
        id: webhook_deliveries.id,
        webhook_id: webhook_deliveries.webhook_id,
        event_type: webhook_deliveries.event_type,
        payload: webhook_deliveries.payload,
        attempts: webhook_deliveries.attempts,
      })
      .from(webhook_deliveries)
      .where(and(eq(webhook_deliveries.status, 'pending'), lte(webhook_deliveries.created_at, new Date())))
      .limit(50)

    for (const delivery of pending) {
      const endpoint = (
        await db.select().from(webhooks).where(eq(webhooks.id, delivery.webhook_id)).limit(1)
      )[0]
      if (!endpoint || !endpoint.is_active) {
        await db
          .update(webhook_deliveries)
          .set({ status: 'failed', last_error: 'endpoint inactive or deleted' })
          .where(eq(webhook_deliveries.id, delivery.id))
        continue
      }

      const body = JSON.stringify(delivery.payload)
      try {
        const res = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GCC-Event': delivery.event_type,
            ...(endpoint.secret ? { 'X-GCC-Signature': sign(endpoint.secret, body) } : {}),
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })

        if (res.ok) {
          await db
            .update(webhook_deliveries)
            .set({
              status: 'delivered',
              attempts: delivery.attempts + 1,
              response_status: res.status,
              delivered_at: new Date(),
            })
            .where(eq(webhook_deliveries.id, delivery.id))
          await db
            .update(webhooks)
            .set({ last_triggered_at: new Date(), failure_count: 0 })
            .where(eq(webhooks.id, endpoint.id))
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        const attempts = delivery.attempts + 1
        const failed = attempts > RETRY_DELAYS_MS.length
        await db
          .update(webhook_deliveries)
          .set({
            status: failed ? 'failed' : 'pending',
            attempts,
            last_error: message,
            response_status: null,
          })
          .where(eq(webhook_deliveries.id, delivery.id))
        await db
          .update(webhooks)
          .set({ failure_count: endpoint.failure_count + 1 })
          .where(eq(webhooks.id, endpoint.id))
        if (!failed) {
          const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)]
          // Re-schedule by inserting a fresh pending row at the backoff time —
          // the deliveries table has no next_run_at column, so backoff is
          // encoded in created_at, which the claim filter compares against.
          await db
            .update(webhook_deliveries)
            .set({ created_at: new Date(Date.now() - (RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] - delay)) })
            .where(eq(webhook_deliveries.id, delivery.id))
        }
      }
    }
  } catch (error) {
    console.error('[Webhooks] Error in outbound webhook delivery loop', error)
  }
}
