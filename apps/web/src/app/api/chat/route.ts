// Chat inbox: list or create conversations and dispatch messages over `conversations` + `contacts` + `messages`.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, ilike, or, sql, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, messages, deals, message_templates } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { sendWhatsappText, sendWhatsappTemplate } from '@/lib/whatsapp/client'

const CHANNELS = ['whatsapp', 'web_chat', 'email', 'ticket']

export async function GET(request: NextRequest) {
  let user: { id: string; role?: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const conversationId = searchParams.get('conversationId')
    const queue = searchParams.get('queue') || 'all'
    const channel = searchParams.get('channel')
    const search = searchParams.get('search')?.trim()
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))

    // 1. If fetching message thread for a specific contact or conversation
    if (contactId || conversationId) {
      let targetConvId = conversationId

      if (!targetConvId && contactId) {
        const convRows = await db
          .select({ id: conversations.id })
          .from(conversations)
          .where(eq(conversations.contact_id, contactId))
          .orderBy(desc(conversations.last_message_at), desc(conversations.created_at))
          .limit(1)

        if (convRows[0]) {
          targetConvId = convRows[0].id
        } else {
          return NextResponse.json([])
        }
      }

      if (targetConvId) {
        const thread = await db
          .select({
            id: messages.id,
            conversationId: messages.conversation_id,
            direction: messages.direction,
            body: messages.body,
            mediaUrl: messages.media_url,
            status: messages.status,
            templateId: messages.template_id,
            occurredAt: messages.occurred_at,
            createdAt: messages.created_at,
            metadata: messages.metadata,
          })
          .from(messages)
          .where(eq(messages.conversation_id, targetConvId))
          .orderBy(asc(messages.occurred_at), asc(messages.created_at))
          .limit(500)

        const formatted = thread.map((m) => {
          const meta = (m.metadata || {}) as Record<string, any>
          const msgType = meta.messageType || (m.mediaUrl ? (m.mediaUrl.match(/\.(mp3|ogg|wav|webm)$/i) ? 'audio' : 'image') : 'text')

          return {
            id: m.id,
            conversationId: m.conversationId,
            direction: m.direction.toUpperCase(),
            body: m.body,
            mediaUrl: m.mediaUrl,
            messageType: msgType,
            status: m.status.toUpperCase(),
            timestamp: m.occurredAt || m.createdAt,
            createdAt: m.createdAt,
            metadata: m.metadata,
          }
        })

        await db
          .update(conversations)
          .set({ unread_count: 0, updated_at: new Date() })
          .where(eq(conversations.id, targetConvId))
          .catch(() => {})

        return NextResponse.json(formatted)
      }
    }

    // 2. Listing conversations with smart queue filters
    const conditions = []

    if (channel && CHANNELS.includes(channel)) {
      conditions.push(eq(conversations.channel, channel as any))
    }

    if (queue === 'mine') {
      conditions.push(eq(conversations.assigned_to, user.id))
    } else if (queue === 'unassigned') {
      conditions.push(sql`${conversations.assigned_to} IS NULL`)
    } else if (queue === 'unread') {
      conditions.push(sql`${conversations.unread_count} > 0`)
    } else if (queue === 'followups') {
      conditions.push(
        or(
          sql`${conversations.unread_count} > 0`,
          sql`${conversations.last_inbound_at} > ${conversations.last_outbound_at}`
        )
      )
    }

    if (search) {
      const searchTerm = `%${search}%`
      conditions.push(
        or(
          ilike(contacts.display_name, searchTerm),
          ilike(contacts.first_name, searchTerm),
          ilike(contacts.last_name, searchTerm),
          ilike(contacts.phone, searchTerm),
          ilike(contacts.email, searchTerm),
          ilike(contacts.company, searchTerm)
        )
      )
    }

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
        contact_company: contacts.company,
        contact_tags: contacts.tags,
        contact_lifecycle_stage: contacts.lifecycle_stage,
        contact_custom_fields: contacts.custom_fields,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contact_id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(conversations.last_message_at), desc(conversations.created_at))
      .limit(limit)

    let filteredRows = rows
    if (queue === 'vip') {
      filteredRows = rows.filter((r) => {
        const tags = Array.isArray(r.contact_tags) ? r.contact_tags.map((t) => String(t).toLowerCase()) : []
        const isVipTag = tags.includes('vip') || tags.includes('enterprise') || tags.includes('investor')
        const custom = (r.contact_custom_fields || {}) as Record<string, any>
        const dealVal = Number(custom.deal_value || custom.dealValue || 0)
        return isVipTag || dealVal >= 10000 || r.contact_lifecycle_stage === 'client'
      })
    } else if (queue === 'renewals') {
      filteredRows = rows.filter((r) => {
        const tags = Array.isArray(r.contact_tags) ? r.contact_tags.map((t) => String(t).toLowerCase()) : []
        const isRenewalTag = tags.some((t) => t.includes('renewal') || t.includes('compliance') || t.includes('annual'))
        const custom = (r.contact_custom_fields || {}) as Record<string, any>
        return isRenewalTag || custom.renewal_due || custom.license_expiry
      })
    }

    return NextResponse.json({ conversations: filteredRows })
  } catch (error) {
    console.error('Error listing conversations', error)
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 })
  }
}

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
    const {
      contactId,
      conversationId,
      channel = 'whatsapp',
      text,
      mediaUrl,
      messageType = 'text',
      templateId,
      templateName,
      language = 'en_US',
    } = body

    if (!contactId && !conversationId) {
      return NextResponse.json({ error: 'contactId or conversationId is required' }, { status: 400 })
    }

    let activeConvId = conversationId
    let contactRow: any = null

    if (activeConvId) {
      const convRes = await db
        .select({ conversation: conversations, contact: contacts })
        .from(conversations)
        .innerJoin(contacts, eq(contacts.id, conversations.contact_id))
        .where(eq(conversations.id, activeConvId))
        .limit(1)

      if (convRes[0]) {
        contactRow = convRes[0].contact
      }
    }

    if (!activeConvId && contactId) {
      const contactQuery = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
      contactRow = contactQuery[0]
      if (!contactRow) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }

      const existingConv = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.contact_id, contactId), eq(conversations.channel, channel as any)))
        .limit(1)

      if (existingConv[0]) {
        activeConvId = existingConv[0].id
      } else {
        const newId = randomUUID()
        const inserted = await db
          .insert(conversations)
          .values({
            id: newId,
            contact_id: contactId,
            channel: channel as any,
            state: 'open',
          })
          .returning()
        activeConvId = inserted[0]?.id || newId
      }
    }

    if (!text?.trim() && !mediaUrl && !templateId) {
      return NextResponse.json({ conversationId: activeConvId, success: true })
    }

    const now = new Date()
    const messageId = randomUUID()
    const messageRef = `out_${messageId}`
    const finalBody = text?.trim() || (messageType === 'voice' || messageType === 'audio' ? 'Voice note' : mediaUrl ? 'Attachment' : templateName || 'WhatsApp Template')

    let sendOk = false
    let requiresTemplate = false

    if (channel === 'whatsapp' && contactRow?.phone) {
      if (templateId || messageType === 'template') {
        const tplName = templateName || 'gcc_welcome'
        sendOk = await sendWhatsappTemplate(contactRow.phone, tplName, language)
      } else {
        const lastInbound = contactRow?.last_inbound_at || null
        const inWindow = !lastInbound || Date.now() - new Date(lastInbound).getTime() < 24 * 60 * 60 * 1000

        if (!inWindow && process.env.NODE_ENV === 'production' && !process.env.META_MOCK_MODE) {
          requiresTemplate = true
        }

        sendOk = await sendWhatsappText(contactRow.phone, finalBody)
      }
    } else {
      sendOk = true
    }

    const insertedMessage = await db
      .insert(messages)
      .values({
        id: messageId,
        conversation_id: activeConvId,
        direction: 'outbound',
        body: finalBody,
        media_url: mediaUrl || null,
        template_id: templateId || null,
        message_ref: messageRef,
        status: sendOk ? 'sent' : 'delivered',
        sent_at: now,
        occurred_at: now,
        metadata: {
          messageType,
          mediaUrl,
          sentBy: user.id,
        },
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
      .where(eq(conversations.id, activeConvId))

    return NextResponse.json({
      success: true,
      delivered: sendOk,
      requiresTemplate,
      message: {
        id: insertedMessage[0].id,
        conversationId: activeConvId,
        direction: 'OUTBOUND',
        body: insertedMessage[0].body,
        mediaUrl: insertedMessage[0].media_url,
        messageType,
        status: 'SENT',
        timestamp: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in chat POST handler', error)
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 })
  }
}
