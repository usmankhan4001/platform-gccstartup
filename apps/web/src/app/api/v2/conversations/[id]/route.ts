import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

function serialize(row: typeof conversations.$inferSelect) {
  return {
    id: row.id,
    contactId: row.contact_id,
    channel: row.channel,
    state: row.state,
    unreadCount: row.unread_count,
    assignedTo: row.assigned_to,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'conversations:read')) return errorJson('Missing permission: conversations:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
    if (!rows[0]) return errorJson('Conversation not found', 404)
    return json(serialize(rows[0]))
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'conversations:write')) return errorJson('Missing permission: conversations:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
    if (!existing[0]) return errorJson('Conversation not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (['open', 'closed'].includes(body.state)) {
      updates.state = body.state
      updates.closed_at = body.state === 'closed' ? new Date() : null
    }
    if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo ? String(body.assignedTo) : null
    if (Number.isInteger(body.unreadCount)) updates.unread_count = body.unreadCount
    if (body.metadata && typeof body.metadata === 'object') updates.metadata = body.metadata

    const updated = await db.update(conversations).set(updates).where(eq(conversations.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'conversations:write')) return errorJson('Missing permission: conversations:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const deleted = await db.delete(conversations).where(eq(conversations.id, id)).returning({ id: conversations.id })
    if (!deleted.length) return errorJson('Conversation not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
