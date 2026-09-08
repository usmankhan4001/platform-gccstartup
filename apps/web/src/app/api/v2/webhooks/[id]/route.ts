import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhooks } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

function serialize(row: typeof webhooks.$inferSelect, includeSecret = false) {
  return {
    id: row.id,
    url: row.url,
    events: row.events ?? [],
    status: row.is_active ? 'active' : 'inactive',
    ...(includeSecret ? { secret: row.secret } : {}),
    lastTriggeredAt: row.last_triggered_at,
    failureCount: row.failure_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'webhooks:read')) return errorJson('Missing permission: webhooks:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
    if (!rows[0]) return errorJson('Webhook not found', 404)
    // The secret is only revealed with ?revealSecret=1 — a caller that lost it can
    // re-fetch it explicitly rather than it leaking into every list response.
    const reveal = new URL(request.url).searchParams.get('revealSecret') === '1'
    return json(serialize(rows[0], reveal))
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'webhooks:write')) return errorJson('Missing permission: webhooks:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
    if (!existing[0]) return errorJson('Webhook not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.url === 'string' && body.url.trim()) {
      try {
        new URL(body.url.trim())
      } catch {
        return errorJson('Invalid URL format', 400)
      }
      updates.url = body.url.trim()
    }
    if (Array.isArray(body.events) && body.events.length) updates.events = body.events.map(String).slice(0, 100)
    if (typeof body.isActive === 'boolean') updates.is_active = body.isActive
    if (typeof body.secret === 'string' && body.secret.trim()) updates.secret = body.secret.trim().slice(0, 255)

    const updated = await db.update(webhooks).set(updates).where(eq(webhooks.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'webhooks:write')) return errorJson('Missing permission: webhooks:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const deleted = await db.delete(webhooks).where(eq(webhooks.id, id)).returning({ id: webhooks.id })
    if (!deleted.length) return errorJson('Webhook not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
