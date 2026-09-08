import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { deals, pipeline_stages } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

const DEAL_STATUSES = ['open', 'won', 'lost'] as const

function serialize(row: typeof deals.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    value: row.value,
    currency: row.currency,
    stageId: row.stage_id,
    pipelineId: row.pipeline_id,
    contactId: row.contact_id,
    ownerId: row.owner_id,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    status: row.status,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'deals:read')) return errorJson('Missing permission: deals:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(deals).where(eq(deals.id, id)).limit(1)
    if (!rows[0]) return errorJson('Deal not found', 404)
    return json(serialize(rows[0]))
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'deals:write')) return errorJson('Missing permission: deals:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(deals).where(eq(deals.id, id)).limit(1)
    if (!existing[0]) return errorJson('Deal not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim().slice(0, 200)
    if (body.value !== undefined) updates.value = Number.isFinite(Number(body.value)) ? Number(body.value) : null
    if (typeof body.currency === 'string') updates.currency = body.currency.slice(0, 3).toUpperCase()
    if (Number.isInteger(body.probability)) updates.probability = body.probability
    if (body.ownerId !== undefined) updates.owner_id = body.ownerId ? String(body.ownerId) : null
    if (body.expectedCloseDate !== undefined) updates.expected_close_date = body.expectedCloseDate ? String(body.expectedCloseDate) : null

    if (body.stageId) {
      const stage = await db
        .select({ id: pipeline_stages.id, pipeline_id: pipeline_stages.pipeline_id, probability: pipeline_stages.probability })
        .from(pipeline_stages)
        .where(eq(pipeline_stages.id, String(body.stageId)))
        .limit(1)
      if (!stage.length) return errorJson('Pipeline stage not found', 400)
      if (stage[0].pipeline_id !== existing[0].pipeline_id) return errorJson('Stage does not belong to the deal pipeline', 400)
      updates.stage_id = stage[0].id
      if (!Number.isInteger(body.probability)) updates.probability = stage[0].probability
    }

    if ((DEAL_STATUSES as readonly string[]).includes(body.status)) {
      updates.status = body.status
      if (body.status === 'won' || body.status === 'lost') {
        if (!existing[0].closed_at) updates.closed_at = new Date()
      } else {
        updates.closed_at = null
      }
    }

    const updated = await db.update(deals).set(updates).where(eq(deals.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'deals:write')) return errorJson('Missing permission: deals:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const deleted = await db.delete(deals).where(eq(deals.id, id)).returning({ id: deals.id })
    if (!deleted.length) return errorJson('Deal not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
