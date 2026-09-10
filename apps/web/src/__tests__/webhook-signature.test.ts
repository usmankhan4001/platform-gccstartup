import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHmac } from 'crypto'
import { dispatchWebhook, getWebhookPayload, registerWebhookEvent } from '@/lib/webhooks/dispatcher'

const secret = 'whsec_test_secret'

/** Same verification an external consumer performs on receipt. */
function verifySignature(rawBody: string, secret: string, header: string | undefined): boolean {
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return header === `sha256=${expected}`
}

describe('Webhook HMAC signatures', () => {
  const payload = JSON.stringify({ id: 'abc', event: 'lead.captured', timestamp: '2026-01-01T00:00:00Z', data: { email: 'a@b.co' } })

  it('a correctly signed payload verifies', () => {
    const signature = createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifySignature(payload, secret, `sha256=${signature}`)).toBe(true)
  })

  it('a tampered payload fails verification', () => {
    const signature = createHmac('sha256', secret).update(payload).digest('hex')
    const tampered = payload.replace('a@b.co', 'attacker@evil.io')
    expect(verifySignature(tampered, secret, `sha256=${signature}`)).toBe(false)
  })

  it('a payload signed with the wrong secret fails verification', () => {
    const signature = createHmac('sha256', 'whsec_wrong').update(payload).digest('hex')
    expect(verifySignature(payload, secret, `sha256=${signature}`)).toBe(false)
  })

  it('a missing or malformed signature header fails verification', () => {
    expect(verifySignature(payload, secret, undefined)).toBe(false)
    expect(verifySignature(payload, secret, 'sha256=deadbeef')).toBe(false)
    expect(verifySignature(payload, secret, 'md5=abc')).toBe(false)
  })

  it('signatures are deterministic for identical bodies', () => {
    const a = createHmac('sha256', secret).update(payload).digest('hex')
    const b = createHmac('sha256', secret).update(payload).digest('hex')
    expect(a).toBe(b)
  })
})

describe('dispatchWebhook delivery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a POST signed with HMAC-SHA256 over the exact body', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => ({ ok: true, status: 200, text: async () => '' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await dispatchWebhook('https://example.com/hook', secret, 'lead.captured', { email: 'a@b.co' })

    expect(result.success).toBe(true)
    expect(result.attempts).toBe(1)

    const [url, requestInit] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.com/hook')
    expect(requestInit?.method).toBe('POST')

    const body = requestInit?.body as string
    const headers = requestInit?.headers as Record<string, string>
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    expect(headers['X-Webhook-Signature']).toBe(`sha256=${expected}`)
    expect(headers['X-Webhook-Event']).toBe('lead.captured')

    // The signed body is exactly what was sent — no post-signature mutation.
    const sent = JSON.parse(body)
    expect(sent.event).toBe('lead.captured')
    expect(sent.data).toEqual({ email: 'a@b.co' })
  })

  it('does not retry on 4xx responses (except 429)', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 400, text: async () => 'bad request' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await dispatchWebhook('https://example.com/hook', secret, 'lead.captured', {})

    expect(result.success).toBe(false)
    expect(result.statusCode).toBe(400)
    expect(result.attempts).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports network failures as unsuccessful deliveries', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('getaddrinfo ENOTFOUND')
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await dispatchWebhook('https://unreachable.invalid/hook', secret, 'lead.captured', {})

    expect(result.success).toBe(false)
    expect(result.error).toContain('ENOTFOUND')
  })
})

describe('Webhook event registry', () => {
  it('registered events transform payloads into their documented shape', async () => {
    await import('@/lib/webhooks/events')

    const dealWon = getWebhookPayload('deal.won', { id: 'd1', title: 'Formation', value: 5000, currency: 'USD', contactId: 'c1' })
    expect(dealWon.deal).toEqual({ id: 'd1', title: 'Formation', value: 5000, currency: 'USD' })
    expect(dealWon.contact).toEqual({ id: 'c1' })

    const emailSent = getWebhookPayload('email.sent', { id: 'e1', toEmail: 'a@b.co', subject: 'Hi' })
    expect(emailSent.email).toEqual({ id: 'e1', to: 'a@b.co', subject: 'Hi' })
    expect(emailSent.campaign).toBeNull()
  })

  it('unregistered events pass data through untouched', () => {
    const raw = { some: 'blob' }
    expect(getWebhookPayload('not.registered', raw)).toBe(raw)
  })

  it('custom handlers can be registered and override the default', () => {
    registerWebhookEvent('custom.event', (data) => ({ wrapped: data }))
    expect(getWebhookPayload('custom.event', 42)).toEqual({ wrapped: 42 })
  })
})
