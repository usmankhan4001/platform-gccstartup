import { createHmac, randomBytes } from 'crypto'

// Outbound webhook delivery system
// Signs payloads with HMAC-SHA256, retries with exponential backoff

export type WebhookPayload = {
  id: string
  event: string
  timestamp: string
  data: any
}

export type WebhookDeliveryResult = {
  success: boolean
  statusCode?: number
  error?: string
  attempts: number
}

export async function dispatchWebhook(
  url: string,
  secret: string,
  event: string,
  data: any
): Promise<WebhookDeliveryResult> {
  const payload: WebhookPayload = {
    id: randomBytes(16).toString('hex'),
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  const maxAttempts = 3
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event,
          'X-Webhook-ID': payload.id,
          'User-Agent': 'GCCStartup-Webhook/2.0',
        },
        body,
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        return { success: true, statusCode: response.status, attempts: attempt }
      }

      lastError = `HTTP ${response.status}: ${await response.text().catch(() => 'Unknown')}`
      
      // Don't retry on 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { success: false, statusCode: response.status, error: lastError, attempts: attempt }
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Network error'
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
    }
  }

  return { success: false, error: lastError, attempts: maxAttempts }
}

// Event registry — maps event names to their payload creators
const eventHandlers = new Map<string, (data: any) => any>()

export function registerWebhookEvent(event: string, handler: (data: any) => any) {
  eventHandlers.set(event, handler)
}

export function getWebhookPayload(event: string, data: any): any {
  const handler = eventHandlers.get(event)
  return handler ? handler(data) : data
}
