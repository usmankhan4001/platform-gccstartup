import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_sends } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

const PATCHABLE_STATUSES = ['draft', 'scheduled', 'paused', 'cancelled'] as const

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'campaigns:read')) return errorJson('Missing permission: campaigns:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
    if (!rows[0]) return errorJson('Campaign not found', 404)
    const campaign = rows[0]

    const sends = await db
      .select({ status: email_sends.status, count: sql<number>`count(*)::int` })
      .from(email_sends)
      .where(eq(email_sends.campaign_id, id))
      .groupBy(email_sends.status)
    const byStatus = Object.fromEntries(sends.map((row) => [row.status, row.count]))

    return json({
      id: campaign.id,
      name: campaign.name,
      type: 'email',
      templateId: campaign.template_id,
      status: campaign.status,
      audience: { filter: campaign.audience_filter, count: campaign.recipient_count ?? 0 },
      scheduledAt: campaign.scheduled_at,
      startedAt: campaign.started_at,
      completedAt: campaign.completed_at,
      recipientCount: campaign.recipient_count,
      metrics: byStatus,
      error: campaign.error,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
    })
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'campaigns:write')) return errorJson('Missing permission: campaigns:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
    if (!existing[0]) return errorJson('Campaign not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (body.audience !== undefined) updates.audience_filter = body.audience?.filter ?? body.audience ?? null
    if (body.scheduledAt !== undefined) {
      updates.scheduled_at = body.scheduledAt ? new Date(body.scheduledAt) : null
    }
    if ((PATCHABLE_STATUSES as readonly string[]).includes(body.status)) updates.status = body.status
    if (body.error !== undefined) updates.error = body.error ? String(body.error).slice(0, 1000) : null

    const updated = await db.update(email_campaigns).set(updates).where(eq(email_campaigns.id, id)).returning()
    const row = updated[0]
    return json({
      id: row.id,
      name: row.name,
      type: 'email',
      templateId: row.template_id,
      status: row.status,
      audience: { filter: row.audience_filter, count: row.recipient_count ?? 0 },
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'campaigns:write')) return errorJson('Missing permission: campaigns:write', 403)
  return handle(async () => {
    const { id } = await context.params
    // A campaign that already has queued or sent mail must not be destroyed —
    // email_sends rows cascade, which would erase the delivery record.
    const active = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(email_sends)
      .where(and(eq(email_sends.campaign_id, id), inArray(email_sends.status, ['queued', 'sent', 'delivered'])))
    if ((active[0]?.count ?? 0) > 0) return errorJson('Campaign already has sends and cannot be deleted via the API', 409)

    const deleted = await db.delete(email_campaigns).where(eq(email_campaigns.id, id)).returning({ id: email_campaigns.id })
    if (!deleted.length) return errorJson('Campaign not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
