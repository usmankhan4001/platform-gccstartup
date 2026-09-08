// Inbound bot engine. Bots are `flows` rows with trigger_config.entityKind =
// 'bot' (see the bots API routes for the mapping). Keyword matching is
// deterministic; replies go through the fail-safe WhatsApp client.

import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { flows } from '@gccstartup/db'
import { sendWhatsappText } from '../lib/whatsapp/client'

type BotConfig = {
  keywords?: string[]
  matchType?: 'EXACT' | 'STARTS_WITH' | 'CONTAINS' | 'ANY_INBOUND'
  greeting?: string
  fallbackReply?: string
  cooldownSeconds?: number
}

// In-memory cooldown tracker (per container — good enough for pacing)
const botCooldowns = new Map<string, number>()

export async function processInboundBot(params: {
  contactId: string
  conversationId?: string
  phoneNumber: string
  bodyText: string
}): Promise<boolean> {
  const { contactId, phoneNumber, bodyText } = params
  if (!bodyText || !bodyText.trim()) return false

  const normalizedInput = bodyText.trim().toLowerCase()

  try {
    const rows = await db
      .select({ id: flows.id, trigger_config: flows.trigger_config })
      .from(flows)
      .where(eq(flows.status, 'active'))

    for (const row of rows) {
      const config = (row.trigger_config || {}) as Record<string, unknown>
      if (config.entityKind !== 'bot') continue
      const bot = config as unknown as BotConfig

      const keywords = Array.isArray(bot.keywords)
        ? bot.keywords.map((k) => String(k).toLowerCase().trim())
        : []
      const matchType = bot.matchType || 'CONTAINS'

      let triggerMatched: boolean
      if (matchType === 'ANY_INBOUND' || keywords.length === 0) triggerMatched = true
      else if (matchType === 'EXACT') triggerMatched = keywords.some((k) => k === normalizedInput)
      else if (matchType === 'STARTS_WITH') triggerMatched = keywords.some((k) => normalizedInput.startsWith(k))
      else triggerMatched = keywords.some((k) => normalizedInput.includes(k))

      if (!triggerMatched) continue

      const cooldownKey = `${row.id}:${contactId}`
      const lastTriggered = botCooldowns.get(cooldownKey) || 0
      const cooldownMs = (bot.cooldownSeconds || 60) * 1000
      if (Date.now() - lastTriggered < cooldownMs) continue
      botCooldowns.set(cooldownKey, Date.now())

      const reply = bot.greeting || bot.fallbackReply
      if (reply) {
        // Fail-safe: a WhatsApp send failure must not break the inbound chain.
        await sendWhatsappText(phoneNumber, reply).catch((err) =>
          console.error(`[BotEngine] reply send failed for bot ${row.id}`, err),
        )
      }
      return true
    }
  } catch (error) {
    console.error('[BotEngine] Error processing inbound bot', error)
  }

  return false
}
