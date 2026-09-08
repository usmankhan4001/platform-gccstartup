import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, deals, pipeline_stages, pipelines } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

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

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'deals:read')) return errorJson('Missing permission: deals:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'status' && (DEAL_STATUSES as readonly string[]).includes(rawValue)) {
        filters.push(eq(deals.status, rawValue as (typeof DEAL_STATUSES)[number]))
      } else if (filterKey === 'pipelineId' && rawValue) {
        filters.push(eq(deals.pipeline_id, rawValue))
      } else if (filterKey === 'stageId' && rawValue) {
        filters.push(eq(deals.stage_id, rawValue))
      } else if (filterKey === 'contactId' && rawValue) {
        filters.push(eq(deals.contact_id, rawValue))
      }
    }
    if (search) filters.push(ilike(deals.title, `%${search}%`))

    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(deals).where(where).orderBy(desc(deals.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(deals).where(where),
    ])

    return json(rows.map(serialize), 200, metaFor(page, limit, totals[0]?.count ?? 0))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'deals:write')) return errorJson('Missing permission: deals:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { title, value, currency = 'USD', contactId, pipelineId, stageId, ownerId, probability, expectedCloseDate, status } = body ?? {}

    if (!title?.trim()) return errorJson('Deal title is required', 400)
    if (!contactId) return errorJson('contactId is required', 400)
    if (!pipelineId) return errorJson('pipelineId is required', 400)
    if (!stageId) return errorJson('stageId is required', 400)

    const contact = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, String(contactId))).limit(1)
    if (!contact.length) return errorJson('Contact not found', 400)

    const stage = await db
      .select({ id: pipeline_stages.id, pipeline_id: pipeline_stages.pipeline_id, probability: pipeline_stages.probability })
      .from(pipeline_stages)
      .where(eq(pipeline_stages.id, String(stageId)))
      .limit(1)
    if (!stage.length) return errorJson('Pipeline stage not found', 400)
    if (stage[0].pipeline_id !== String(pipelineId)) return errorJson('Stage does not belong to the given pipeline', 400)

    const created = await db
      .insert(deals)
      .values({
        id: newId(),
        title: String(title).trim().slice(0, 200),
        contact_id: String(contactId),
        pipeline_id: String(pipelineId),
        stage_id: String(stageId),
        value: Number.isFinite(Number(value)) ? Number(value) : null,
        currency: String(currency).slice(0, 3).toUpperCase(),
        probability: Number.isInteger(probability) ? probability : stage[0].probability,
        owner_id: ownerId ? String(ownerId) : null,
        expected_close_date: expectedCloseDate ? String(expectedCloseDate) : null,
        status: (DEAL_STATUSES as readonly string[]).includes(status) ? status : 'open',
      })
      .returning()

    return json(serialize(created[0]), 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
