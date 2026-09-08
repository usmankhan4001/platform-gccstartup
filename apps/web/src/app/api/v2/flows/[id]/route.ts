import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

const TRIGGERS = ['manual', 'lead_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'date_based', 'event_based'] as const
const PATCHABLE_STATUSES = ['draft', 'paused', 'archived'] as const

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'flows:read')) return errorJson('Missing permission: flows:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!rows[0]) return errorJson('Flow not found', 404)
    const row = rows[0]
    return json({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      trigger: { type: row.trigger_type, config: row.trigger_config ?? {} },
      nodes: row.nodes ?? [],
      edges: row.edges ?? [],
      nodeCount: Array.isArray(row.nodes) ? row.nodes.length : 0,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'flows:write')) return errorJson('Missing permission: flows:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!existing[0]) return errorJson('Flow not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (typeof body.description === 'string' || body.description === null) updates.description = body.description ?? null
    if ((PATCHABLE_STATUSES as readonly string[]).includes(body.status)) updates.status = body.status
    if ((TRIGGERS as readonly string[]).includes(body.trigger?.type)) updates.trigger_type = body.trigger.type
    if (body.trigger?.config && typeof body.trigger.config === 'object') updates.trigger_config = body.trigger.config
    if (Array.isArray(body.nodes)) {
      updates.nodes = body.nodes
      updates.version = existing[0].version + 1
    }
    if (Array.isArray(body.edges)) updates.edges = body.edges

    const updated = await db.update(flows).set(updates).where(eq(flows.id, id)).returning()
    const row = updated[0]
    return json({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      trigger: { type: row.trigger_type, config: row.trigger_config ?? {} },
      nodes: row.nodes ?? [],
      edges: row.edges ?? [],
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'flows:write')) return errorJson('Missing permission: flows:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const existing = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!existing[0]) return errorJson('Flow not found', 404)
    if (existing[0].status === 'active') return errorJson('Pause or archive the flow before deleting it', 409)

    await db.delete(flows).where(eq(flows.id, id))
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
