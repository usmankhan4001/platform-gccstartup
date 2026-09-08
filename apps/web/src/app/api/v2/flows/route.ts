import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flow_enrollments, flows } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

const TRIGGERS = ['manual', 'lead_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'date_based', 'event_based'] as const
const STATUSES = ['draft', 'active', 'paused', 'archived'] as const

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'flows:read')) return errorJson('Missing permission: flows:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'status' && (STATUSES as readonly string[]).includes(rawValue)) {
        filters.push(eq(flows.status, rawValue as (typeof STATUSES)[number]))
      } else if (filterKey === 'trigger' && (TRIGGERS as readonly string[]).includes(rawValue)) {
        filters.push(eq(flows.trigger_type, rawValue as (typeof TRIGGERS)[number]))
      }
    }
    if (search) filters.push(ilike(flows.name, `%${search}%`))
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals, enrollmentCounts] = await Promise.all([
      db.select().from(flows).where(where).orderBy(desc(flows.updated_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(flows).where(where),
      db.select({ flow_id: flow_enrollments.flow_id, count: sql<number>`count(*)::int` }).from(flow_enrollments).groupBy(flow_enrollments.flow_id),
    ])
    const enrollmentsByFlow = new Map(enrollmentCounts.map((row) => [row.flow_id, row.count]))

    const total = totals[0]?.count ?? 0
    return json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      trigger: { type: row.trigger_type, config: row.trigger_config ?? {} },
      nodes: row.nodes ?? [],
      nodeCount: Array.isArray(row.nodes) ? row.nodes.length : 0,
      executionCount: enrollmentsByFlow.get(row.id) ?? 0,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })), 200, metaFor(page, limit, total))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'flows:write')) return errorJson('Missing permission: flows:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { name, description, trigger, nodes = [], status, customAttributes } = body ?? {}

    if (!name?.trim()) return errorJson('Flow name is required', 400)

    const triggerType = (TRIGGERS as readonly string[]).includes(trigger?.type) ? trigger.type : 'manual'
    const created = await db
      .insert(flows)
      .values({
        id: newId(),
        name: String(name).trim().slice(0, 200),
        description: description ? String(description) : null,
        status: (STATUSES as readonly string[]).includes(status) && status !== 'active' ? status : 'draft',
        trigger_type: triggerType,
        trigger_config: trigger?.config && typeof trigger.config === 'object' ? trigger.config : {},
        nodes: Array.isArray(nodes) ? nodes : [],
        edges: Array.isArray(customAttributes?.edges) ? customAttributes.edges : [],
        ...(customAttributes && typeof customAttributes === 'object' && 'createdBy' in customAttributes
          ? { created_by: String((customAttributes as Record<string, unknown>).createdBy) }
          : {}),
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      trigger: { type: row.trigger_type, config: row.trigger_config ?? {} },
      nodes: row.nodes ?? [],
      nodeCount: Array.isArray(row.nodes) ? row.nodes.length : 0,
      executionCount: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
