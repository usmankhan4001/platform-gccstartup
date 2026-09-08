// Inbound WhatsApp flow engine. Delegates to the shared inbound router in
// lib/whatsapp, which interprets keyword automations stored as `flows` rows.

import { processInboundWhatsAppMessage } from '../lib/whatsapp/inbound-router'
import { db } from '../lib/db'
import { conversations } from '@gccstartup/db'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Initiates or advances an active flow run for an incoming message.
 * Returns true when a flow handled the message.
 */
export async function processInboundFlow(params: {
  contactId: string
  phoneNumber: string
  bodyText: string
}): Promise<boolean> {
  try {
    const convo = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.contact_id, params.contactId), eq(conversations.state, 'open')))
      .orderBy(desc(conversations.created_at))
      .limit(1)

    return await processInboundWhatsAppMessage({
      conversationId: convo[0]?.id || '',
      leadId: params.contactId,
      phoneNumber: params.phoneNumber,
      body: params.bodyText,
      messageType: 'text',
    })
  } catch (error) {
    console.error('[FlowEngine] Error matching flow', error)
    return false
  }
}

/**
 * Advances a flow run step-by-step. The shared router owns the node graph
 * interpreter; run advancement happens inside it, so this is a thin wrapper
 * kept for backwards compatibility with the inbound event chain.
 */
export async function advanceFlowRun(runId: string, userInput?: string): Promise<boolean> {
  void runId
  void userInput
  // Run-state advancement is handled inside processInboundWhatsAppMessage —
  // there is no separate flow_run table in the platform schema.
  return false
}
