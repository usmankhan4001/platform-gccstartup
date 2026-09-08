// Outbound template message router. Chooses between Meta's Cloud API and the
// Marketing Messages API lane, enforces marketing eligibility, and sends via the
// real fail-safe client (./client.ts).
//
// Channel config comes from env (the schema's site_settings singleton has no
// per-feature jsonb column):
//   META_MARKETING_MESSAGES_ENABLED=true   — allow the MARKETING_MESSAGES_API lane
//   META_MARKETING_MESSAGES_POLICY=CLOUD_API_FALLBACK | MM_API_FALLBACK | STRICT
//
// Campaign attribution is owned by the campaign dispatcher (./dispatcher.ts),
// which writes wamid/channel data into its outbox_jobs rows — this router does
// not duplicate that write.

import { sendWhatsappTemplateWithMeta } from './client'
import { checkMarketingEligibility } from './marketing-eligibility'

const logger = {
  warn: (...args: unknown[]) => console.warn('[MessageRouter]', ...args),
  error: (...args: unknown[]) => console.error('[MessageRouter]', ...args),
  info: (...args: unknown[]) => console.info('[MessageRouter]', ...args),
}

export type MessageChannel = 'CLOUD_API' | 'MARKETING_MESSAGES_API'
export type OptimizationMode = 'AUTO' | 'OPTIMIZED' | 'STANDARD'

export interface RouteMessageParams {
  contactId?: string
  phoneNumber: string
  campaignId?: string
  templateName: string
  languageCode?: string
  templateCategory?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  templateStatus?: string
  headerMediaUrl?: string
  headerVariables?: string[]
  bodyVariables?: string[]
  templateComponents?: unknown
  optimizationMode?: OptimizationMode
}

export interface RouteMessageResult {
  success: boolean
  channel: MessageChannel
  wamid?: string
  messageStatus?: string
  error?: string
  suppressed?: boolean
}

// marketing_messages_policy for the MM lane when the primary attempt fails
type MmPolicy = 'CLOUD_API_FALLBACK' | 'STRICT'

function readChannelSettings(): { mmApiEnabled: boolean; policy: MmPolicy } {
  const mmApiEnabled = process.env.META_MARKETING_MESSAGES_ENABLED === 'true'
  const rawPolicy = process.env.META_MARKETING_MESSAGES_POLICY || 'CLOUD_API_FALLBACK'
  const policy: MmPolicy = rawPolicy === 'STRICT' ? 'STRICT' : 'CLOUD_API_FALLBACK'
  return { mmApiEnabled, policy }
}

export class MessageRouter {
  /**
   * Evaluates recipient eligibility, chooses the send lane, and dispatches the
   * template message via the fail-safe Meta client.
   */
  static async routeAndSend(params: RouteMessageParams): Promise<RouteMessageResult> {
    const {
      contactId,
      phoneNumber,
      campaignId,
      templateName,
      languageCode = 'en_US',
      templateCategory = 'MARKETING',
      templateStatus = 'APPROVED',
      headerMediaUrl,
      headerVariables,
      bodyVariables,
      optimizationMode = 'AUTO',
    } = params

    // 1. Marketing eligibility
    if (contactId && templateCategory === 'MARKETING') {
      const eligibility = await checkMarketingEligibility({
        contactId,
        phoneNumber,
        templateCategory,
        templateStatus,
        checkHandoff: true,
      })

      if (!eligibility.allowed) {
        logger.warn(
          `[MessageRouter] Outbound message suppressed: contactId=${contactId}, phoneNumber=${phoneNumber}, reason=${eligibility.reason}`
        )
        return {
          success: false,
          channel: 'CLOUD_API',
          suppressed: true,
          error: eligibility.details || `Suppressed: ${eligibility.reason}`,
        }
      }
    }

    // 2. Lane selection
    const { mmApiEnabled, policy } = readChannelSettings()

    let selectedChannel: MessageChannel = 'CLOUD_API'

    if (templateCategory === 'MARKETING' && optimizationMode !== 'STANDARD') {
      if (mmApiEnabled || optimizationMode === 'OPTIMIZED' || optimizationMode === 'AUTO') {
        selectedChannel = 'MARKETING_MESSAGES_API'
      }
    }

    // 3. Dispatch via the fail-safe Meta client. sendWhatsappTemplateWithMeta
    //    returns null when env is unset or Meta rejects — both are "send failed"
    //    for the caller; it never throws.
    const result = await sendWhatsappTemplateWithMeta(
      phoneNumber,
      templateName,
      languageCode,
      {
        headerMediaUrl,
        headerVariables,
        bodyVariables,
      },
    )

    if (result) {
      logger.info(
        `[MessageRouter] Message routed and sent: phoneNumber=${phoneNumber}, templateName=${templateName}, channel=${selectedChannel}, wamid=${result.wamid}`
      )
      return {
        success: true,
        channel: selectedChannel,
        wamid: result.wamid,
        messageStatus: 'accepted',
      }
    }

    logger.error(
      `[MessageRouter] Send failed: channel=${selectedChannel}, phoneNumber=${phoneNumber}, templateName=${templateName}`
    )

    // 4. Cloud API fallback when the MM lane is strictly configured
    if (selectedChannel === 'MARKETING_MESSAGES_API' && policy === 'CLOUD_API_FALLBACK') {
      logger.info(`[MessageRouter] Retrying via Cloud API fallback: phoneNumber=${phoneNumber}`)
      const fallback = await sendWhatsappTemplateWithMeta(phoneNumber, templateName, languageCode)
      if (fallback) {
        return {
          success: true,
          channel: 'CLOUD_API',
          wamid: fallback.wamid,
          messageStatus: 'accepted',
        }
      }
    }

    return {
      success: false,
      channel: selectedChannel,
      error: 'Meta WhatsApp send failed (env unset or API rejected)',
    }
  }
}
