import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_templates } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

const STATUSES = ['draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed'] as const

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'campaigns:read')) return errorJson('Missing permission: campaigns:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'status' && (STATUSES as readonly string[]).includes(rawValue)) {
        filters.push(eq(email_campaigns.status, rawValue as (typeof STATUSES)[number]))
      } else if (filterKey === 'templateId' && rawValue) {
        filters.push(eq(email_campaigns.template_id, rawValue))
      }
    }
    if (search) filters.push(ilike(email_campaigns.name, `%${search}%`))
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(email_campaigns).where(where).orderBy(desc(email_campaigns.updated_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(email_campaigns).where(where),
    ])

    return json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: 'email',
      templateId: row.template_id,
      status: row.status,
      audience: { filter: row.audience_filter, count: row.recipient_count ?? 0 },
      scheduledAt: row.scheduled_at,
      recipientCount: row.recipient_count,
      sent: row.status === 'sent' ? row.recipient_count ?? 0 : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })), 200, metaFor(page, limit, totals[0]?.count ?? 0))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'campaigns:write')) return errorJson('Missing permission: campaigns:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { name, templateId, audience, scheduledAt, customAttributes } = body ?? {}

    if (!name?.trim()) return errorJson('Campaign name is required', 400)
    if (!templateId) return errorJson('templateId is required', 400)

    const template = await db.select({ id: email_templates.id }).from(email_templates).where(eq(email_templates.id, String(templateId))).limit(1)
    if (!template.length) return errorJson('Template not found', 400)

    const created = await db
      .insert(email_campaigns)
      .values({
        id: newId(),
        name: String(name).trim().slice(0, 200),
        template_id: String(templateId),
        audience_filter: audience?.filter ?? audience ?? null,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      name: row.name,
      type: 'email',
      templateId: row.template_id,
      status: row.status,
      audience: { filter: row.audience_filter, count: 0 },
      scheduledAt: row.scheduled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
