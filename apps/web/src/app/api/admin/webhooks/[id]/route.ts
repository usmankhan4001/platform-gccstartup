import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhooks } from '@gccstartup/db'
import { handleAdmin, json, errorJson, WEBHOOK_EVENTS, type RouteContext } from '../../_lib'

export const PATCH = async (request: NextRequest, context: RouteContext) =>
  handleAdmin(request, async () => {
    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const { url, events, isActive } = body ?? {}

    if (url === undefined && events === undefined && isActive === undefined) {
      return errorJson('Nothing to update: provide url, events, or isActive', 400)
    }

    const updates: Record<string, unknown> = { updated_at: new Date() }

    if (url !== undefined) {
      try {
        const parsed = new URL(String(url))
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
      } catch {
        return errorJson('The webhook URL must be a valid http(s) URL', 400)
      }
      updates.url = String(url).trim().slice(0, 500)
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return errorJson('events must be a non-empty array', 400)
      }
      const requested = events.map(String)
      const unknown = requested.filter((e) => !(WEBHOOK_EVENTS as readonly string[]).includes(e))
      if (unknown.length > 0) return errorJson(`Unknown events: ${unknown.join(', ')}`, 400)
      updates.events = requested.slice(0, 100)
    }

    if (isActive !== undefined) updates.is_active = Boolean(isActive)

    const updated = await db
      .update(webhooks)
      .set(updates)
      .where(eq(webhooks.id, id))
      .returning({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.is_active,
        failureCount: webhooks.failure_count,
      })

    if (!updated[0]) return errorJson('Webhook not found', 404)
    return json({ ...updated[0], events: updated[0].events ?? [] })
  })

export const DELETE = async (request: NextRequest, context: RouteContext) =>
  handleAdmin(request, async () => {
    const { id } = await context.params

    // Deliveries cascade with the webhook row.
    const deleted = await db.delete(webhooks).where(eq(webhooks.id, id)).returning({ id: webhooks.id })

    if (!deleted[0]) return errorJson('Webhook not found', 404)
    return json({ id: deleted[0].id, deleted: true })
  })
