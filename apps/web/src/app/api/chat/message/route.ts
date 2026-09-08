// Outbound agent message: persists to `messages`, attempts the (optional)
// fail-safe Meta Cloud API send, and updates the conversation timestamps.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, messages } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { sendWhatsappText } from '@/lib/whatsapp/client'

export async function POST(request: NextRequest) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { conversationId, text } = body as { conversationId?: string; text?: string }

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'conversationId and text are required' }, { status: 400 })
    }

    const rows = await db
      .select({ conversation: conversations, contact: contacts })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contact_id))
      .where(eq(conversations.id, conversationId))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const now = new Date()
    const messageId = randomUUID()
    const messageRef = `out_${messageId}`

    // Optional send. The client never throws: false means env unset or Meta
    // rejected. Free-form text is only legal inside Meta's 24h window — the
    // window is enforced by checking the last inbound message.
    let sendOk = false
    if (row.conversation.channel === 'whatsapp' && row.contact.phone) {
      const lastInbound = row.conversation.last_inbound_at
      const inWindow =
        lastInbound !== null && Date.now() - new Date(lastInbound).getTime() < 24 * 60 * 60 * 1000
      if (!inWindow) {
        console.warn(`[chat/message] blocked free-text outside 24h window on conversation ${conversationId}`)
      } else {
        sendOk = await sendWhatsappText(row.contact.phone, text.trim())
      }
    } else {
      // Non-WhatsApp channels have no external sender — persist as sent locally
      sendOk = true
    }

    const inserted = await db
      .insert(messages)
      .values({
        id: messageId,
        conversation_id: conversationId,
        direction: 'outbound',
        body: text.trim(),
        message_ref: messageRef,
        status: sendOk ? 'sent' : 'failed',
        sent_at: sendOk ? now : null,
        failure_reason: sendOk ? null : 'Meta WhatsApp send failed or is not configured',
        occurred_at: now,
        metadata: { sentBy: user.id },
      })
      .returning()

    await db
      .update(conversations)
      .set({
        last_outbound_at: now,
        last_message_at: now,
        state: 'open',
        closed_at: null,
        updated_at: now,
      })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({ message: inserted[0], delivered: sendOk })
  } catch (error) {
    console.error('Error sending chat message', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
