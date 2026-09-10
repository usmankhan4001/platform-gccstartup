import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimit } from '@gccstartup/shared'

describe('API key rate limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests under the limit and reports the remaining budget', () => {
    const first = checkRateLimit('key-a', 3, 60_000)
    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(2)

    const second = checkRateLimit('key-a', 3, 60_000)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(1)
  })

  it('blocks requests once the per-minute budget is exhausted', () => {
    checkRateLimit('key-b', 2, 60_000)
    checkRateLimit('key-b', 2, 60_000)
    const blocked = checkRateLimit('key-b', 2, 60_000)

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets the window after it elapses', () => {
    checkRateLimit('key-c', 1, 60_000)
    expect(checkRateLimit('key-c', 1, 60_000).allowed).toBe(false)

    vi.advanceTimersByTime(61_000)
    const after = checkRateLimit('key-c', 1, 60_000)
    expect(after.allowed).toBe(true)
  })

  it('tracks each API key independently', () => {
    checkRateLimit('key-d', 1, 60_000)
    expect(checkRateLimit('key-c-other', 1, 60_000).allowed).toBe(true)
    expect(checkRateLimit('key-b-other', 1, 60_000).allowed).toBe(true)
    expect(checkRateLimit('key-c', 1, 60_000).allowed).toBe(false)
  })

  it('exposes the reset time so 429 responses can set Retry-After', () => {
    const result = checkRateLimit('key-d', 1, 60_000)
    expect(result.resetAt).toBeGreaterThan(Date.now())
    expect(result.resetAt - Date.now()).toBeLessThanOrEqual(60_000)
  })
})
