import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

const CHANNELS = ['whatsapp', 'web_chat', 'email', 'ticket'] as const

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'conversations:read')) return errorJson('Missing permission: conversations:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const filters: Array<any> = []
    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'channel' && (CHANNELS as readonly string[]).includes(rawValue)) {
        filters.push(eq(conversations.channel, rawValue as (typeof CHANNELS)[number]))
      } else if (filterKey === 'state' && ['open', 'closed'].includes(rawValue)) {
        filters.push(eq(conversations.state, rawValue as 'open' | 'closed'))
      } else if (filterKey === 'contactId' && rawValue) {
        filters.push(eq(conversations.contact_id, rawValue))
      }
    }
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(conversations).where(where).orderBy(desc(conversations.last_message_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(conversations).where(where),
    ])

    const total = totals[0]?.count ?? 0
    return json(
      rows.map((row) => ({
        id: row.id,
        contactId: row.contact_id,
        channel: row.channel,
        state: row.state,
        unreadCount: row.unread_count,
        assignedTo: row.assigned_to,
        lastMessageAt: row.last_message_at,
        lastInboundAt: row.last_inbound_at,
        lastOutboundAt: row.last_outbound_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      200,
      metaFor(page, limit, total),
    )
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'conversations:write')) return errorJson('Missing permission: conversations:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { contactId, channel = 'whatsapp', assignedTo, customAttributes } = body ?? {}

    if (!contactId?.trim()) return errorJson('Contact ID is required', 400)
    if (!(CHANNELS as readonly string[]).includes(channel)) return errorJson(`channel must be one of: ${CHANNELS.join(', ')}`, 400)

    const contact = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, String(contactId))).limit(1)
    if (!contact.length) return errorJson('Contact not found', 400)

    // One conversation per (contact, channel) — the unique index is the authority, so
    // a duplicate create returns the existing conversation instead of erroring.
    const created = await db
      .insert(conversations)
      .values({
        id: newId(),
        contact_id: String(contactId),
        channel,
        assigned_to: assignedTo ? String(assignedTo) : null,
        metadata: customAttributes && typeof customAttributes === 'object' ? customAttributes : {},
      })
      .onConflictDoNothing()
      .returning()

    if (created[0]) {
      const row = created[0]
      return json({ id: row.id, contactId: row.contact_id, channel: row.channel, state: row.state, assignedTo: row.assigned_to, createdAt: row.created_at }, 201)
    }

    const existing = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.contact_id, String(contactId)), eq(conversations.channel, channel)))
      .limit(1)
    return json({ id: existing[0].id, contactId: existing[0].contact_id, channel: existing[0].channel, state: existing[0].state, assignedTo: existing[0].assigned_to, createdAt: existing[0].created_at }, 200)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
