import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, asc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, conversations, messages } from '@gccstartup/db'
import { sendWhatsappText } from '@/lib/whatsapp/client'


function whatsappConfigured(): boolean {
  return Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID)
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    if (!leadId) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })

    const leadRows = await db
      .select({ id: contacts.id, phone: contacts.phone, whatsapp_consent: contacts.whatsapp_consent })
      .from(contacts)
      .where(eq(contacts.id, leadId))
      .limit(1)
    const lead = leadRows[0]

    if (!lead) return NextResponse.json({ conversation: null, messages: [], configured: whatsappConfigured() })

    const convRows = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.contact_id, lead.id), eq(conversations.channel, 'whatsapp')))
      .limit(1)
    const conversation = convRows[0] || null

    const messageRows = conversation
      ? await db
          .select()
          .from(messages)
          .where(eq(messages.conversation_id, conversation.id))
          .orderBy(asc(messages.occurred_at))
          .limit(200)
      : []

    return NextResponse.json({
      conversation: conversation
        ? {
            id: conversation.id,
            contact_wa_id: lead.phone,
            status: conversation.state,
            opted_out: lead.whatsapp_consent === 'denied',
          }
        : null,
      messages: messageRows.map((m) => ({
        id: m.id,
        direction: m.direction,
        wa_message_id: m.provider_message_id,
        status: m.status,
        body: m.body,
        date_created: m.occurred_at,
      })),
      configured: whatsappConfigured(),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/whatsapp] thread load failed', error)
    return NextResponse.json({ error: 'Failed to load WhatsApp thread' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const leadId = typeof body.lead_id === 'string' ? body.lead_id : null
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!leadId || !text) {
      return NextResponse.json({ error: 'lead_id and body are required' }, { status: 400 })
    }

    const leadRows = await db
      .select({ id: contacts.id, phone: contacts.phone, whatsapp_consent: contacts.whatsapp_consent })
      .from(contacts)
      .where(eq(contacts.id, leadId))
      .limit(1)
    const lead = leadRows[0]
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (!lead.phone) return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 })
    if (lead.whatsapp_consent === 'denied') {
      return NextResponse.json({ error: 'Lead has opted out of WhatsApp' }, { status: 403 })
    }

    // Find-or-create the one WhatsApp conversation per contact (unique index).
    await db
      .insert(conversations)
      .values({
        id: randomUUID(),
        contact_id: lead.id,
        channel: 'whatsapp',
      })
      .onConflictDoNothing({ target: [conversations.contact_id, conversations.channel] })
    const convRows = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.contact_id, lead.id), eq(conversations.channel, 'whatsapp')))
      .limit(1)
    const conversation = convRows[0]
    if (!conversation) return NextResponse.json({ error: 'Could not open conversation' }, { status: 500 })

    const now = new Date()
    const accepted = await sendWhatsappText(lead.phone, text)

    const inserted = await db
      .insert(messages)
      .values({
        id: randomUUID(),
        conversation_id: conversation.id,
        direction: 'outbound',
        body: text,
        message_ref: `wa-out-${randomUUID()}`,
        status: accepted ? 'sent' : 'failed',
        failure_reason: accepted ? null : 'Meta WhatsApp not configured or send rejected',
        occurred_at: now,
        sent_at: accepted ? now : null,
      })
      .returning()

    await db
      .update(conversations)
      .set({ last_outbound_at: now, last_message_at: now, updated_at: now })
      .where(eq(conversations.id, conversation.id))

    const message = inserted[0]
    return NextResponse.json({
      ok: accepted,
      message: {
        id: message.id,
        direction: message.direction,
        wa_message_id: message.provider_message_id,
        status: message.status,
        body: message.body,
        date_created: message.occurred_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/whatsapp] send failed', error)
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const conversationId = typeof body.conversation_id === 'string' ? body.conversation_id : null
    if (!conversationId) return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })

    const state = body.state === 'closed' ? 'closed' : body.state === 'open' ? 'open' : null
    if (!state) return NextResponse.json({ error: 'state must be open|closed' }, { status: 400 })

    const updated = await db
      .update(conversations)
      .set({
        state,
        closed_at: state === 'closed' ? new Date() : null,
        updated_at: new Date(),
      })
      .where(and(eq(conversations.id, conversationId), eq(conversations.channel, 'whatsapp')))
      .returning({ id: conversations.id })

    if (!updated.length) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    return NextResponse.json({ success: true, state })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/whatsapp] update failed', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
