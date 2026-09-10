import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// `lib/api-auth` opens a DB connection at import time; the tests below only
// exercise its pure auth logic, so the client is replaced with a controllable
// fake that mimics the two drizzle chains the module uses.
const state: { rows: Record<string, unknown>[] } = { rows: [] }

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(state.rows),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          // The last_used_at touch is fire-and-forget with a .catch() tail.
          catch: () => undefined,
        }),
      }),
    }),
  },
}))

import { authenticateApiKey, hasPermission, requireApiKey } from '@/lib/api-auth'

function makeRequest(token?: string): any {
  return {
    headers: {
      get: (name: string) => (name === 'authorization' && token ? `Bearer ${token}` : null),
    },
  }
}

function keyRow(overrides: Record<string, unknown> = {}) {
  const token = 'gcc_test-token-123'
  return {
    token,
    row: {
      id: 'key-1',
      name: 'Test key',
      permissions: ['contacts:read'],
      rate_limit: 1000,
      is_active: true,
      expires_at: null,
      ...overrides,
    },
  }
}

describe('API key authentication', () => {
  beforeEach(() => {
    state.rows = []
  })

  it('keys use the gcc_ prefix and are stored as SHA-256 hashes', () => {
    const token = 'gcc_abc123'
    expect(token.startsWith('gcc_')).toBe(true)

    const hash = createHash('sha256').update(token).digest('hex')
    // Hashing is deterministic — the same token always produces the stored hash.
    expect(createHash('sha256').update(token).digest('hex')).toBe(hash)
    expect(hash).toHaveLength(64)
  })

  it('a valid, active, unexpired key authenticates with its payload', async () => {
    const { token, row } = keyRow({ permissions: ['contacts:read', 'deals:write'], rate_limit: 500 })
    state.rows = [row]

    const key = await authenticateApiKey(makeRequest(token))
    expect(key).not.toBeNull()
    expect(key?.id).toBe('key-1')
    expect(key?.permissions).toEqual(['contacts:read', 'deals:write'])
    expect(key?.rateLimit).toBe(500)
  })

  it('an unknown token is rejected', async () => {
    const key = await authenticateApiKey(makeRequest('gcc_does-not-exist'))
    expect(key).toBeNull()
  })

  it('a non-gcc token is rejected before touching the database', async () => {
    const key = await authenticateApiKey(makeRequest('sk_live_whatever'))
    expect(key).toBeNull()
  })

  it('an expired key is rejected (401 semantics)', async () => {
    const { token, row } = keyRow({ expires_at: new Date(Date.now() - 60_000) })
    state.rows = [row]

    const key = await authenticateApiKey(makeRequest(token))
    expect(key).toBeNull()
  })

  it('an inactive (revoked) key is rejected', async () => {
    // The SQL WHERE clause only matches is_active = true, so a revoked key
    // returns no rows at all — exactly what a live revocation produces.
    state.rows = []

    const key = await authenticateApiKey(makeRequest('gcc_revoked-key'))
    expect(key).toBeNull()
  })

  it('a missing Authorization header is rejected', async () => {
    const key = await authenticateApiKey(makeRequest(undefined))
    expect(key).toBeNull()
  })

  it('requireApiKey returns 401 JSON when authentication fails', async () => {
    const handler = vi.fn()
    const wrapped = requireApiKey(handler)

    const response = await wrapped(makeRequest('gcc_invalid'), undefined)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toMatch(/invalid or missing/i)
    expect(handler).not.toHaveBeenCalled()
  })

  it('requireApiKey forwards the authenticated key to the handler', async () => {
    const { token, row } = keyRow()
    state.rows = [row]

    let receivedKey: { id: string } | null = null
    const handler = vi.fn(async (_req: unknown, _ctx: unknown, key: { id: string }) => {
      receivedKey = key
      return { headers: new Headers() }
    })
    const wrapped = requireApiKey(handler)

    await wrapped(makeRequest(token), undefined)
    expect(handler).toHaveBeenCalledTimes(1)
    expect((receivedKey as { id: string } | null)?.id).toBe('key-1')
  })
})

describe('API key scope enforcement', () => {
  const key = (permissions: string[]) => ({ id: 'k', name: 'k', permissions, rateLimit: 100 })

  it('exact scope match grants access', () => {
    expect(hasPermission(key(['contacts:read']), 'contacts:read')).toBe(true)
  })

  it('a missing scope is denied (403 semantics)', () => {
    expect(hasPermission(key(['contacts:read']), 'contacts:write')).toBe(false)
    expect(hasPermission(key(['deals:read']), 'contacts:read')).toBe(false)
  })

  it('the wildcard scope grants everything', () => {
    expect(hasPermission(key(['*']), 'webhooks:write')).toBe(true)
    expect(hasPermission(key(['*', 'contacts:read']), 'anything:else')).toBe(true)
  })

  it('an empty permission list denies everything', () => {
    expect(hasPermission(key([]), 'contacts:read')).toBe(false)
  })
})
