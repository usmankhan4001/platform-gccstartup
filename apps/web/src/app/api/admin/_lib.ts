import { NextRequest, NextResponse } from 'next/server'
import { authGuard, AuthError } from '@/lib/auth'

export type RouteContext = { params: Promise<{ id: string }> }

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: string
}

export function json(data: unknown, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status })
}

export function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Session-authenticated, admin-or-above wrapper for /api/admin/* routes.
 * Auth errors keep their status; anything else is logged and returns a 500.
 */
export async function handleAdmin(
  request: NextRequest,
  fn: (user: AdminUser) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const user = await authGuard(request, ['admin'])
    return await fn(user)
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status)
    console.error('[api/admin] handler failed', error)
    return errorJson('Internal server error', 500)
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

/** Permission scopes enforced by the /api/v2 routes, plus the wildcard. */
export const KNOWN_PERMISSIONS = [
  'contacts:read',
  'contacts:write',
  'deals:read',
  'deals:write',
  'conversations:read',
  'conversations:write',
  'campaigns:read',
  'campaigns:write',
  'templates:read',
  'templates:write',
  'flows:read',
  'flows:write',
  'documents:read',
  'documents:write',
  'analytics:read',
  'webhooks:read',
  'webhooks:write',
  '*',
] as const

/** Events the outbound webhook pipeline can emit (mirrors lib/webhooks/events.ts). */
export const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'contact.stage_changed',
  'deal.created',
  'deal.won',
  'deal.lost',
  'lead.captured',
  'lead.converted',
  'message.received',
  'conversation.assigned',
  'campaign.dispatched',
  'campaign.completed',
  'email.sent',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'ticket.created',
  'ticket.resolved',
  'flow.enrollment_created',
  'flow.completed',
  'order.paid',
  'order.payment_failed',
  'user.created',
  'user.role_changed',
] as const

export function paginationFrom(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25))
  return { page, limit, offset: (page - 1) * limit }
}

export function metaFor(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

/** Run a count query, degrading to null instead of failing the whole payload. */
export async function safeCount(query: Promise<Array<{ count: number }>>): Promise<number | null> {
  try {
    const rows = await query
    return rows[0]?.count ?? 0
  } catch (error) {
    console.error('[api/admin] count query failed', error)
    return null
  }
}
