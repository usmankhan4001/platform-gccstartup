import { NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhooks, webhook_deliveries } from '@gccstartup/db'
import { handleAdmin, json, errorJson, newId, WEBHOOK_EVENTS } from '../_lib'

export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    // The signing secret is never returned after creation — not even to admins.
    const rows = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.is_active,
        lastTriggeredAt: webhooks.last_triggered_at,
        failureCount: webhooks.failure_count,
        createdAt: webhooks.created_at,
        updatedAt: webhooks.updated_at,
      })
      .from(webhooks)
      .orderBy(desc(webhooks.created_at))
      .limit(200)

    const stats = await db
      .select({
        webhookId: webhook_deliveries.webhook_id,
        total: sql<number>`count(*)::int`,
        delivered: sql<number>`count(*) filter (where ${webhook_deliveries.status} = 'delivered')::int`,
        failed: sql<number>`count(*) filter (where ${webhook_deliveries.status} = 'failed')::int`,
      })
      .from(webhook_deliveries)
      .groupBy(webhook_deliveries.webhook_id)

    const statsById = new Map(stats.map((s) => [s.webhookId, s]))

    return json(
      rows.map((row) => ({
        ...row,
        events: row.events ?? [],
        deliveries: statsById.get(row.id) ?? { total: 0, delivered: 0, failed: 0 },
      })),
    )
  })

/**
 * Register an endpoint. A signing secret is generated server-side and returned
 * exactly once so the consumer can verify HMAC-SHA256 signatures.
 */
export const POST = (request: NextRequest) =>
  handleAdmin(request, async (admin) => {
    const body = await request.json().catch(() => null)
    const { url, events, secret, isActive = true } = body ?? {}

    if (!url?.trim()) return errorJson('A webhook URL is required', 400)
    try {
      const parsed = new URL(String(url))
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
    } catch {
      return errorJson('The webhook URL must be a valid http(s) URL', 400)
    }
    if (!Array.isArray(events) || events.length === 0) {
      return errorJson('Select at least one event to subscribe to', 400)
    }

    const requested = events.map(String)
    const unknown = requested.filter((e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e))
    if (unknown.length > 0) return errorJson(`Unknown events: ${unknown.join(', ')}`, 400)

    const signingSecret = secret ? String(secret).slice(0, 255) : `whsec_${randomBytes(24).toString('hex')}`

    const created = await db
      .insert(webhooks)
      .values({
        id: newId(),
        url: String(url).trim().slice(0, 500),
        events: requested.slice(0, 100),
        secret: signingSecret,
        is_active: Boolean(isActive),
        created_by: admin.id,
      })
      .returning({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.is_active,
        createdAt: webhooks.created_at,
      })

    const row = created[0]
    return json(
      {
        id: row.id,
        url: row.url,
        events: row.events ?? [],
        isActive: row.isActive,
        createdAt: row.createdAt,
        // Shown once, on create only. Store it now — it cannot be recovered.
        secret: signingSecret,
      },
      201,
    )
  })
