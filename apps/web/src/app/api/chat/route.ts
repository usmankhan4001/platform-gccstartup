// Chat inbox: list or create conversations over `conversations` + `contacts`.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const CHANNELS = ['whatsapp', 'web_chat', 'email', 'ticket']

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const assignedTo = searchParams.get('assignedTo')
    const channel = searchParams.get('channel')

    const conditions = []
    if (state === 'open' || state === 'closed') conditions.push(eq(conversations.state, state))
    if (assignedTo) conditions.push(eq(conversations.assigned_to, assignedTo))
    if (channel && CHANNELS.includes(channel)) conditions.push(eq(conversations.channel, channel as 'whatsapp' | 'web_chat' | 'email' | 'ticket'))

    const rows = await db
      .select({
        id: conversations.id,
        channel: conversations.channel,
        state: conversations.state,
        unread_count: conversations.unread_count,
        assigned_to: conversations.assigned_to,
        last_message_at: conversations.last_message_at,
        last_inbound_at: conversations.last_inbound_at,
        last_outbound_at: conversations.last_outbound_at,
        created_at: conversations.created_at,
        contact_id: contacts.id,
        contact_name: contacts.display_name,
        contact_first_name: contacts.first_name,
        contact_last_name: contacts.last_name,
        contact_phone: contacts.phone,
        contact_email: contacts.email,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contact_id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(conversations.last_message_at), desc(conversations.created_at))
      .limit(200)

    return NextResponse.json({ conversations: rows })
  } catch (error) {
    console.error('Error listing conversations', error)
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { contactId, channel = 'whatsapp' } = body

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }
    if (!CHANNELS.includes(String(channel))) {
      return NextResponse.json({ error: `channel must be one of: ${CHANNELS.join(', ')}` }, { status: 400 })
    }

    const contactRows = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1)
    if (!contactRows[0]) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const inserted = await db
      .insert(conversations)
      .values({
        id: randomUUID(),
        contact_id: contactId,
        channel: channel as 'whatsapp' | 'web_chat' | 'email' | 'ticket',
        state: 'open',
      })
      .onConflictDoNothing({ target: [conversations.contact_id, conversations.channel] })
      .returning()

    // Unique (contact_id, channel) already satisfied — return the existing row
    if (!inserted[0]) {
      const existing = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.contact_id, contactId), eq(conversations.channel, channel)))
        .limit(1)
      return NextResponse.json({ conversation: existing[0], existing: true })
    }

    return NextResponse.json({ conversation: inserted[0], existing: false })
  } catch (error) {
    console.error('Error creating conversation', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
