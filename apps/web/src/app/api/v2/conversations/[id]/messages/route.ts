import { NextRequest, NextResponse } from 'next/server'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations, messages } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId, type RouteContext } from '../../../_lib'

type Ctx = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: Ctx, key: any) => {
  if (!hasPermission(key, 'conversations:read')) return errorJson('Missing permission: conversations:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const { page, limit, offset } = paginationFrom(request)

    const conversation = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, id)).limit(1)
    if (!conversation.length) return errorJson('Conversation not found', 404)

    const [rows, totals] = await Promise.all([
      db.select().from(messages).where(eq(messages.conversation_id, id)).orderBy(asc(messages.occurred_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(messages).where(eq(messages.conversation_id, id)),
    ])

    return json(
      rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        direction: row.direction,
        body: row.body,
        mediaUrl: row.media_url,
        status: row.status,
        templateId: row.template_id,
        occurredAt: row.occurred_at,
        createdAt: row.created_at,
      })),
      200,
      metaFor(page, limit, totals[0]?.count ?? 0),
    )
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: Ctx, key: any) => {
  if (!hasPermission(key, 'conversations:write')) return errorJson('Missing permission: conversations:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()
    const { content, mediaUrl, templateId } = body ?? {}

    if (!content?.trim()) return errorJson('Message content is required', 400)

    const conversationRows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
    const conversation = conversationRows[0]
    if (!conversation) return errorJson('Conversation not found', 404)

    const now = new Date()
    const created = await db
      .insert(messages)
      .values({
        id: newId(),
        conversation_id: id,
        direction: 'outbound',
        body: String(content),
        media_url: mediaUrl ? String(mediaUrl) : null,
        message_ref: `msg:${id}:${now.getTime()}`.slice(0, 100),
        status: 'sent',
        sent_at: now,
        template_id: templateId ? String(templateId) : null,
        occurred_at: now,
      })
      .returning()

    await db
      .update(conversations)
      .set({ last_message_at: now, last_outbound_at: now, updated_at: now })
      .where(eq(conversations.id, id))

    const row = created[0]
    return json({
      id: row.id,
      conversationId: row.conversation_id,
      direction: row.direction,
      body: row.body,
      mediaUrl: row.media_url,
      status: row.status,
      occurredAt: row.occurred_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
