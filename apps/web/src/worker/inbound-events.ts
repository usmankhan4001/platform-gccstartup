// Inbound event chain: webhook → flow engine → bot engine.
// Each handler is fail-safe — a failure in one must not stop the next.

import { processInboundFlow } from './flows'
import { processInboundBot } from './bots'
import { enqueueOutboundWebhook } from './outbound-webhooks'

export async function processInboundEvent(event: {
  contactId: string
  conversationId?: string
  phoneNumber: string
  bodyText: string
  messageType?: string
}): Promise<void> {
  const { contactId, conversationId, phoneNumber, bodyText, messageType } = event

  // 1. Emit outbound webhook for external subscribers
  await enqueueOutboundWebhook('message.received', {
    contactId,
    conversationId,
    phoneNumber,
    messageType: messageType || 'text',
    body: bodyText,
  })

  // 2. Visual flow builder engine
  try {
    const handledByFlow = await processInboundFlow({ contactId, phoneNumber, bodyText })
    if (handledByFlow) return
  } catch (error) {
    console.error('[InboundEvents] flow engine failed', error)
  }

  // 3. Bot engine (keyword bots)
  try {
    const handledByBot = await processInboundBot({ contactId, conversationId, phoneNumber, bodyText })
    if (handledByBot) return
  } catch (error) {
    console.error('[InboundEvents] bot engine failed', error)
  }

  console.log(`[InboundEvents] no automation handled message from ${phoneNumber}`)
}
