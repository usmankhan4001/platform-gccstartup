// Meta WhatsApp webhook. GET handles the verification handshake against the
// META_WHATSAPP_VERIFY_TOKEN env var; POST verifies the X-Hub-Signature-256
// HMAC (fail-closed against META_WHATSAPP_WEBHOOK_SECRET) and then:
//   - delivery receipts  → update messages by provider_message_id
//   - template status    → update message_templates by provider id / name
//   - inbound messages   → upsert contact by phone, upsert open conversation,
//                          insert the message row, then route it through the
//                          inbound automation router
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, message_templates, messages } from '@gccstartup/db'
import { verifyMetaSignature } from '@/lib/whatsapp/signature'
import { MetaWebhookPayload } from '@/lib/whatsapp/types'
import { processInboundWhatsAppMessage } from '@/lib/whatsapp/inbound-router'

const logger = {
  error: (...args: unknown[]) => console.error('[Webhook]', ...args),
  warn: (...args: unknown[]) => console.warn('[Webhook]', ...args),
  info: (...args: unknown[]) => console.info('[Webhook]', ...args),
}

// Map Meta delivery statuses onto the message_status enum. FAILED never lowers
// an already-terminal row handled separately below.
const DELIVERY_STATUS: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
}

const TEMPLATE_STATUS: Record<string, 'draft' | 'pending' | 'approved' | 'rejected' | 'disabled'> = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  PAUSED: 'disabled',
  DISABLED: 'disabled',
}

/**
 * GET handler: Meta Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const configuredToken = process.env.META_WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token && configuredToken && token === configuredToken) {
    logger.info('Meta Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 })
}

type DeliveryStatusUpdate = {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string; message: string }>
}

async function handleDeliveryStatus(statusObj: DeliveryStatusUpdate) {
  const status = DELIVERY_STATUS[statusObj.status]
  if (!status || !statusObj.id) return

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date(),
  }
  if (status === 'sent') patch.sent_at = new Date(Number(statusObj.timestamp) * 1000 || Date.now())
  if (status === 'delivered') patch.delivered_at = new Date(Number(statusObj.timestamp) * 1000 || Date.now())
  if (status === 'read') patch.read_at = new Date(Number(statusObj.timestamp) * 1000 || Date.now())
  if (status === 'failed') {
    const err = statusObj.errors?.[0]
    patch.failure_reason = err ? `${err.code}: ${err.message}` : 'Meta reported failure'
  }

  await db
    .update(messages)
    .set(patch)
    .where(eq(messages.provider_message_id, statusObj.id))
}

async function handleTemplateStatus(value: Record<string, unknown>) {
  const name = typeof value.message_template_name === 'string' ? value.message_template_name : null
  const providerId = typeof value.message_template_id === 'string' ? value.message_template_id : null
  const metaStatus = typeof value.event === 'string' ? value.event.toUpperCase() : null
  const status = metaStatus ? TEMPLATE_STATUS[metaStatus] : undefined
  if (!name && !providerId) return

  const patch: Record<string, unknown> = { updated_at: new Date() }
  if (status) {
    patch.status = status
    if (status === 'approved') patch.approved_at = new Date()
    if (status === 'rejected') patch.rejection_reason = String(value.reason ?? 'Rejected by Meta')
  }
  if (providerId) patch.provider_template_id = providerId

  await db
    .update(message_templates)
    .set(patch)
    .where(providerId ? eq(message_templates.provider_template_id, providerId) : eq(message_templates.name, name as string))
}

// Upsert the contact by phone, upsert the open whatsapp conversation, insert
// the inbound message row (idempotent on the Meta wamid), then run the
// automation router. Returns the conversation id, or null when skipped.
async function handleInboundMessage(
  incoming: NonNullable<MetaWebhookPayload['entry'][0]['changes'][0]['value']['messages']>[0],
  profileName?: string
): Promise<string | null> {
  const phone = incoming.from
  if (!phone) return null

  // 1. Contact upsert
  let contactRows = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1)
  if (!contactRows[0]) {
    await db
      .insert(contacts)
      .values({
        id: randomUUID(),
        phone,
        display_name: profileName || phone,
        source: 'whatsapp',
        whatsapp_consent: 'granted',
        whatsapp_consent_at: new Date(),
      })
      .onConflictDoNothing()
    contactRows = await db.select().from(contacts).where(eq(contacts.phone, phone)).limit(1)
  }
  const contact = contactRows[0]
  if (!contact) return null

  // 2. Conversation upsert (unique on contact_id + channel)
  let convRows = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.contact_id, contact.id), eq(conversations.channel, 'whatsapp')))
    .limit(1)
  if (!convRows[0]) {
    await db
      .insert(conversations)
      .values({
        id: randomUUID(),
        contact_id: contact.id,
        channel: 'whatsapp',
        state: 'open',
      })
      .onConflictDoNothing()
    convRows = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.contact_id, contact.id), eq(conversations.channel, 'whatsapp')))
      .limit(1)
  }
  const conversation = convRows[0]
  if (!conversation) return null

  // 3. Inbound message row — wamid is unique, so replayed webhooks no-op here
  const body =
    incoming.type === 'text' && incoming.text?.body
      ? incoming.text.body
      : incoming.type === 'button' && incoming.button
        ? incoming.button.text || incoming.button.payload
        : incoming.type === 'interactive' && incoming.interactive
          ? incoming.interactive.button_reply?.title ||
            incoming.interactive.list_reply?.title ||
            ''
          : `[${incoming.type}]`
  const occurredAt = incoming.timestamp
    ? new Date(Number(incoming.timestamp) * 1000)
    : new Date()

  await db
    .insert(messages)
    .values({
      id: randomUUID(),
      conversation_id: conversation.id,
      direction: 'inbound',
      body,
      message_ref: incoming.id,
      provider_message_id: incoming.id,
      status: 'delivered',
      occurred_at: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
      metadata: { wa_id: incoming.id, type: incoming.type },
    })
    .onConflictDoNothing({ target: messages.message_ref })

  // 4. Conversation counters
  await db
    .update(conversations)
    .set({
      last_inbound_at: occurredAt,
      last_message_at: occurredAt,
      unread_count: sql`${conversations.unread_count} + 1`,
      state: 'open',
      closed_at: null,
      updated_at: new Date(),
    })
    .where(eq(conversations.id, conversation.id))

  // 5. Automation routing (real DB logic; fail-safe)
  try {
    await processInboundWhatsAppMessage({
      conversationId: conversation.id,
      leadId: contact.id,
      phoneNumber: phone,
      body,
      messageType: incoming.type,
    })
  } catch (error) {
    logger.error('Inbound automation routing failed', error)
  }

  return conversation.id
}

/**
 * POST handler: Ingest delivery receipts, template status approvals & incoming messages from Meta
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    const appSecret = process.env.META_WHATSAPP_WEBHOOK_SECRET
    const isMock = process.env.META_WHATSAPP_MOCK_MODE === 'true'

    // Fail-closed: verify signature unless mock mode is explicitly on
    if (!isMock) {
      if (!appSecret || appSecret.trim() === '') {
        logger.warn('Meta Webhook rejected: no webhook secret configured and mock mode is off (fail-closed)')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 })
      }
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        logger.warn('Meta Webhook signature validation failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    let payload: MetaWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    if (payload.object !== 'whatsapp_business_account' && payload.object !== 'whatsapp') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const field = change.field
        const value = change.value
        if (!value) continue

        // 1. Template status updates
        if (field === 'message_template_status_update' || (value as Record<string, unknown>).event) {
          try {
            await handleTemplateStatus(value as unknown as Record<string, unknown>)
          } catch (error) {
            logger.error('Template status update failed', error)
          }
        }

        // 2. Delivery status updates (SENT, DELIVERED, READ, FAILED)
        if (Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            try {
              await handleDeliveryStatus(statusObj)
            } catch (error) {
              logger.error('Delivery status update failed', error)
            }
          }
        }

        // 3. Incoming customer messages & 2-way inbox
        if (Array.isArray(value.messages)) {
          for (const incoming of value.messages) {
            try {
              const profileName = value.contacts?.find((c) => c.wa_id === incoming.from)?.profile.name
              await handleInboundMessage(incoming, profileName)
            } catch (error) {
              logger.error('Inbound message processing failed', error)
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    logger.error('Error in webhook handler', error)
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 })
  }
}
