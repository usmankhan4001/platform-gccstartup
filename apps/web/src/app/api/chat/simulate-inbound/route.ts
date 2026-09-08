// Simulates an inbound message for testing the inbox and automation routing:
// upserts contact + open conversation (or uses the given conversationId),
// inserts the inbound message row, and runs the real inbound automation router.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, messages } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { processInboundWhatsAppMessage } from '@/lib/whatsapp/inbound-router'

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
    const { conversationId, contactId, phone, text, senderName } = body as {
      conversationId?: string
      contactId?: string
      phone?: string
      text?: string
      senderName?: string
    }

    const messageBody = typeof text === 'string' ? text.trim() : ''
    if (!messageBody) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    let convId = conversationId ?? null
    let resolvedContactId = contactId ?? null
    let resolvedPhone = phone ?? null

    if (convId) {
      const rows = await db
        .select({ id: conversations.id, contact_id: conversations.contact_id })
        .from(conversations)
        .where(eq(conversations.id, convId))
        .limit(1)
      if (!rows[0]) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      resolvedContactId = rows[0].contact_id
      const contactRow = await db
        .select({ phone: contacts.phone })
        .from(contacts)
        .where(eq(contacts.id, resolvedContactId as string))
        .limit(1)
      resolvedPhone = contactRow[0]?.phone ?? resolvedPhone
    } else {
      if (!resolvedPhone) {
        return NextResponse.json({ error: 'phone is required when conversationId is not provided' }, { status: 400 })
      }
      resolvedPhone = resolvedPhone.startsWith('+') ? resolvedPhone : `+${resolvedPhone.replace(/\D/g, '')}`

      // Contact upsert
      let contactRows = await db
        .select()
        .from(contacts)
        .where(eq(contacts.phone, resolvedPhone))
        .limit(1)
      if (!contactRows[0]) {
        await db
          .insert(contacts)
          .values({
            id: randomUUID(),
            phone: resolvedPhone,
            display_name: senderName || resolvedPhone,
            source: 'whatsapp-simulator',
          })
          .onConflictDoNothing()
        contactRows = await db
          .select()
          .from(contacts)
          .where(eq(contacts.phone, resolvedPhone))
          .limit(1)
      }
      if (!contactRows[0]) {
        return NextResponse.json({ error: 'Failed to upsert contact' }, { status: 500 })
      }
      resolvedContactId = contactRows[0].id

      // Conversation upsert
      let convRows = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.contact_id, resolvedContactId), eq(conversations.channel, 'whatsapp')))
        .limit(1)
      if (!convRows[0]) {
        await db
          .insert(conversations)
          .values({ id: randomUUID(), contact_id: resolvedContactId, channel: 'whatsapp', state: 'open' })
          .onConflictDoNothing()
        convRows = await db
          .select()
          .from(conversations)
          .where(and(eq(conversations.contact_id, resolvedContactId), eq(conversations.channel, 'whatsapp')))
          .limit(1)
      }
      if (!convRows[0]) {
        return NextResponse.json({ error: 'Failed to upsert conversation' }, { status: 500 })
      }
      convId = convRows[0].id
    }

    // Inbound message row
    const now = new Date()
    await db.insert(messages).values({
      id: randomUUID(),
      conversation_id: convId as string,
      direction: 'inbound',
      body: messageBody,
      message_ref: `sim_${randomUUID()}`,
      status: 'delivered',
      occurred_at: now,
      metadata: { simulated: true },
    })

    await db
      .update(conversations)
      .set({
        last_inbound_at: now,
        last_message_at: now,
        unread_count: sql`${conversations.unread_count} + 1`,
        state: 'open',
        closed_at: null,
        updated_at: now,
      })
      .where(eq(conversations.id, convId as string))

    // Real automation routing
    let handled = false
    try {
      handled = await processInboundWhatsAppMessage({
        conversationId: convId as string,
        leadId: resolvedContactId,
        phoneNumber: resolvedPhone ?? '',
        body: messageBody,
        messageType: 'text',
      })
    } catch (error) {
      console.error('[simulate-inbound] automation routing failed', error)
    }

    return NextResponse.json({
      conversationId: convId,
      contactId: resolvedContactId,
      handled,
    })
  } catch (error) {
    console.error('Error simulating inbound message', error)
    return NextResponse.json({ error: 'Failed to simulate inbound message' }, { status: 500 })
  }
}
