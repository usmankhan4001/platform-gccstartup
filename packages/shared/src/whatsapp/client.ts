import { logger } from '../utils/logger'

function getConfig() {
  return {
    accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    graphVersion: process.env.META_WHATSAPP_GRAPH_VERSION ?? 'v21.0',
  }
}

interface WhatsAppSendResult {
  success: boolean
  messageId: string | null
}

interface MediaOptions {
  mediaUrl: string
  caption?: string
}

/**
 * Send a plain text WhatsApp message.
 * @param to - Recipient phone number in E.164 format
 * @param body - Message text
 * @returns Result with success flag and message ID
 */
export async function sendText(to: string, body: string): Promise<WhatsAppSendResult> {
  const config = getConfig()
  if (!config.accessToken || !config.phoneNumberId) {
    logger.warn('WhatsApp: missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID')
    return { success: false, messageId: null }
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    })

    const data = await response.json() as { messages?: { id: string }[]; error?: { message: string } }

    if (!response.ok) {
      logger.error('WhatsApp sendText failed', { status: response.status, error: data.error?.message })
      return { success: false, messageId: null }
    }

    return { success: true, messageId: data.messages?.[0]?.id ?? null }
  } catch (error) {
    logger.error('WhatsApp sendText error', { error: (error as Error).message })
    return { success: false, messageId: null }
  }
}

/**
 * Send a pre-approved WhatsApp template message.
 * @param to - Recipient phone number in E.164 format
 * @param name - Template name
 * @param language - Language code (e.g. "en", "ar")
 * @param params - Optional template parameters
 * @returns Result with success flag and message ID
 */
export async function sendTemplate(
  to: string,
  name: string,
  language: string,
  params?: { type: 'text'; text: string }[],
): Promise<WhatsAppSendResult> {
  const config = getConfig()
  if (!config.accessToken || !config.phoneNumberId) {
    logger.warn('WhatsApp: missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID')
    return { success: false, messageId: null }
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`

  const template: Record<string, unknown> = {
    name,
    language: { code: language },
  }

  if (params && params.length > 0) {
    template.components = [{ type: 'body', parameters: params }]
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template,
      }),
    })

    const data = await response.json() as { messages?: { id: string }[]; error?: { message: string } }

    if (!response.ok) {
      logger.error('WhatsApp sendTemplate failed', { status: response.status, error: data.error?.message })
      return { success: false, messageId: null }
    }

    return { success: true, messageId: data.messages?.[0]?.id ?? null }
  } catch (error) {
    logger.error('WhatsApp sendTemplate error', { error: (error as Error).message })
    return { success: false, messageId: null }
  }
}

/**
 * Send a WhatsApp template message with a media attachment.
 * @param to - Recipient phone number in E.164 format
 * @param name - Template name
 * @param language - Language code
 * @param mediaOptions - Media URL and optional caption
 * @returns Result with success flag and message ID
 */
export async function sendTemplateWithMedia(
  to: string,
  name: string,
  language: string,
  mediaOptions: MediaOptions,
): Promise<WhatsAppSendResult> {
  const config = getConfig()
  if (!config.accessToken || !config.phoneNumberId) {
    logger.warn('WhatsApp: missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID')
    return { success: false, messageId: null }
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`

  const components: Record<string, unknown>[] = [
    {
      type: 'header',
      parameters: [{ type: 'image', image: { link: mediaOptions.mediaUrl } }],
    },
  ]

  if (mediaOptions.caption) {
    components.push({
      type: 'body',
      parameters: [{ type: 'text', text: mediaOptions.caption }],
    })
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name, language: { code: language }, components },
      }),
    })

    const data = await response.json() as { messages?: { id: string }[]; error?: { message: string } }

    if (!response.ok) {
      logger.error('WhatsApp sendTemplateWithMedia failed', { status: response.status, error: data.error?.message })
      return { success: false, messageId: null }
    }

    return { success: true, messageId: data.messages?.[0]?.id ?? null }
  } catch (error) {
    logger.error('WhatsApp sendTemplateWithMedia error', { error: (error as Error).message })
    return { success: false, messageId: null }
  }
}
