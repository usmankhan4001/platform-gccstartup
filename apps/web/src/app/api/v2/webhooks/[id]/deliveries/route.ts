import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhook_deliveries, webhooks } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, type RouteContext } from '../../../_lib'

type Ctx = { params: Promise<{ id: string }> }

export const GET = requireApiKey(async (request: NextRequest, context: Ctx, key: any) => {
  if (!hasPermission(key, 'webhooks:read')) return errorJson('Missing permission: webhooks:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const event = searchParams.get('event')
    const status = searchParams.get('status')

    const webhook = await db.select({ id: webhooks.id }).from(webhooks).where(eq(webhooks.id, id)).limit(1)
    if (!webhook.length) return errorJson('Webhook not found', 404)

    const filters: Array<any> = [eq(webhook_deliveries.webhook_id, id)]
    if (event) filters.push(eq(webhook_deliveries.event_type, event))
    if (status === 'success') filters.push(eq(webhook_deliveries.status, 'delivered'))
    else if (status === 'failed') filters.push(eq(webhook_deliveries.status, 'failed'))
    const where = and(...filters)

    const [rows, totals] = await Promise.all([
      db.select().from(webhook_deliveries).where(where).orderBy(desc(webhook_deliveries.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(webhook_deliveries).where(where),
    ])

    return json(rows.map((row) => ({
      id: row.id,
      webhookId: row.webhook_id,
      event: row.event_type,
      payload: row.payload,
      status: row.status,
      attempts: row.attempts,
      responseStatus: row.response_status,
      error: row.last_error,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
    })), 200, metaFor(page, limit, totals[0]?.count ?? 0))
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
