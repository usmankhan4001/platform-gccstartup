import { NextRequest, NextResponse } from 'next/server'
import { addCorsHeaders } from '@/lib/api-auth'
import { AuthError } from '@/lib/auth'

export type RouteContext = { params: Promise<{ id: string }> }

export function json(data: unknown, status = 200, meta?: Record<string, unknown>) {
  const response = NextResponse.json(meta ? { data, meta } : { data }, { status })
  return addCorsHeaders(response)
}

export function errorJson(message: string, status: number) {
  return addCorsHeaders(NextResponse.json({ error: message }, { status }))
}

/** Uniform handler wrapper: auth errors become their own status, everything else a logged 500. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status)
    console.error('[api/v2] handler failed', error)
    return errorJson('Internal server error', 500)
  }
}

export function paginationFrom(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
  return { page, limit, offset: (page - 1) * limit }
}

export function metaFor(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export function newId(): string {
  return crypto.randomUUID()
}

/** IS NULL-friendly iso conversion for json output. */
export function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}
