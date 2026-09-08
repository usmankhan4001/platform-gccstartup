import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { randomUUID, randomBytes } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhook_deliveries, webhooks } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../../_lib'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Fires a real signed test POST to the endpoint. The delivery row is written FIRST
 * with its payload and signature material, so a crash or a 30-second endpoint hang
 * still leaves an auditable record; the outcome is then patched in. A network
 * failure is recorded as a failed delivery, never raised as a 500.
 */
export const POST = requireApiKey(async (request: NextRequest, context: Ctx, key: any) => {
  if (!hasPermission(key, 'webhooks:write')) return errorJson('Missing permission: webhooks:write', 403)
  return handle(async () => {
    const { id } = await context.params

    const rows = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
    const webhook = rows[0]
    if (!webhook) return errorJson('Webhook not found', 404)

    const eventType = 'webhook.test'
    const payload = {
      id: randomBytes(16).toString('hex'),
      event: eventType,
      timestamp: new Date().toISOString(),
      data: { webhookId: webhook.id, message: 'This is a test delivery from the GCC Startup Platform' },
    }
    const body = JSON.stringify(payload)
    const secret = webhook.secret ?? ''

    const delivery = await db
      .insert(webhook_deliveries)
      .values({
        id: randomUUID(),
        webhook_id: webhook.id,
        event_type: eventType,
        payload,
        status: 'pending',
        attempts: 1,
      })
      .returning({ id: webhook_deliveries.id })

    let status = 'failed'
    let responseStatus: number | null = null
    let lastError: string | null = null
    let responseBody: string | null = null

    try {
      const signature = createHmac('sha256', secret).update(body).digest('hex')
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': eventType,
          'X-Webhook-ID': payload.id,
          'User-Agent': 'GCCStartup-Webhook/2.0',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      })
      responseStatus = response.status
      responseBody = (await response.text().catch(() => '')).slice(0, 2_000)
      if (response.ok) {
        status = 'delivered'
      } else {
        lastError = `HTTP ${response.status}`
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'
    }

    await db
      .update(webhook_deliveries)
      .set({
        status,
        response_status: responseStatus,
        response_body: responseBody,
        last_error: lastError,
        delivered_at: status === 'delivered' ? new Date() : null,
      })
      .where(eq(webhook_deliveries.id, delivery[0].id))

    await db
      .update(webhooks)
      .set({
        last_triggered_at: new Date(),
        failure_count: status === 'delivered' ? sql`${webhooks.failure_count}` : sql`${webhooks.failure_count} + 1`,
        updated_at: new Date(),
      })
      .where(eq(webhooks.id, webhook.id))

    return json({
      deliveryId: delivery[0].id,
      event: eventType,
      status,
      responseStatus,
      error: lastError,
    }, status === 'delivered' ? 200 : 502)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
