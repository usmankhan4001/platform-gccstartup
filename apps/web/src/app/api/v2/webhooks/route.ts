import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhooks } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'webhooks:read')) return errorJson('Missing permission: webhooks:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []
    if (search) filters.push(ilike(webhooks.url, `%${search}%`))
    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (rawKey === 'filter[isActive]' && ['true', 'false'].includes(rawValue)) {
        filters.push(eq(webhooks.is_active, rawValue === 'true'))
      }
    }
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(webhooks).where(where).orderBy(desc(webhooks.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(webhooks).where(where),
    ])

    const total = totals[0]?.count ?? 0
    return json(rows.map((row) => ({
      id: row.id,
      url: row.url,
      events: row.events ?? [],
      status: row.is_active ? 'active' : 'inactive',
      lastTriggeredAt: row.last_triggered_at,
      failureCount: row.failure_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })), 200, metaFor(page, limit, total))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'webhooks:write')) return errorJson('Missing permission: webhooks:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { url, events, secret, isActive = true } = body ?? {}

    if (!url?.trim()) return errorJson('url is required', 400)
    if (!events || !Array.isArray(events) || events.length === 0) return errorJson('events must be a non-empty array', 400)
    try {
      new URL(String(url))
    } catch {
      return errorJson('Invalid URL format', 400)
    }

    // The signing secret is generated server-side and shown once; it is never
    // returned again by any listing endpoint.
    const created = await db
      .insert(webhooks)
      .values({
        id: newId(),
        url: String(url).trim(),
        events: events.map(String).slice(0, 100),
        secret: secret ? String(secret).slice(0, 255) : `whsec_${randomBytes(24).toString('hex')}`,
        is_active: Boolean(isActive),
        created_by: key.id,
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      url: row.url,
      events: row.events,
      status: row.is_active ? 'active' : 'inactive',
      // Returned once, on create only, so the consumer can store it.
      secret: row.secret,
      createdAt: row.created_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
