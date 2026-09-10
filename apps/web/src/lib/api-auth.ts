import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { api_keys } from '@gccstartup/db'
import { checkRateLimit } from '@gccstartup/shared'

export type ApiKeyPayload = {
  id: string
  name: string
  permissions: string[]
  rateLimit: number
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyPayload | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token.startsWith('gcc_')) return null

  const keyHash = createHash('sha256').update(token).digest('hex')

  const rows = await db
    .select({
      id: api_keys.id,
      name: api_keys.name,
      permissions: api_keys.permissions,
      rate_limit: api_keys.rate_limit,
      is_active: api_keys.is_active,
      expires_at: api_keys.expires_at,
    })
    .from(api_keys)
    .where(and(eq(api_keys.key_hash, keyHash), eq(api_keys.is_active, true)))
    .limit(1)

  const key = rows[0]
  if (!key) return null
  if (key.expires_at && key.expires_at < new Date()) return null

  // Touch last_used_at without blocking the request on failure.
  db.update(api_keys)
    .set({ last_used_at: new Date() })
    .where(eq(api_keys.id, key.id))
    .catch(() => {})

  return {
    id: key.id,
    name: key.name,
    permissions: key.permissions || [],
    rateLimit: key.rate_limit,
  }
}

export function requireApiKey(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const key = await authenticateApiKey(request)
    if (!key) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    // Each key carries its own requests-per-minute budget; the sliding window
    // is in-process, which is correct for the single-container deployment.
    const limit = checkRateLimit(`apikey:${key.id}`, key.rateLimit, 60_000)
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Retry later.' },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfter))
      response.headers.set('X-RateLimit-Limit', String(key.rateLimit))
      response.headers.set('X-RateLimit-Remaining', '0')
      return response
    }

    const response = await handler(request, context, key)
    response.headers.set('X-RateLimit-Limit', String(key.rateLimit))
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit.remaining)))
    return response
  }
}

export function hasPermission(key: ApiKeyPayload, permission: string): boolean {
  if (key.permissions.includes('*')) return true
  return key.permissions.includes(permission)
}

export function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  return { page, limit, offset: (page - 1) * limit }
}

export function parseFilters(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url)
  const filters: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterKey = key.slice(7, -1)
      filters[filterKey] = value
    }
  }
  return filters
}

export function parseSearch(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url)
  return searchParams.get('search') || null
}

export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}
