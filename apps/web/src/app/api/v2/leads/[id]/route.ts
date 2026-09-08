import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

type ContactRow = typeof contacts.$inferSelect

function serialize(row: ContactRow) {
  const custom = (row.custom_fields as Record<string, unknown> | null) ?? {}
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    source: row.source,
    stage: custom.lead_stage ?? 'new',
    score: custom.lead_score ?? 0,
    ownerId: row.owner_id,
    emailConsent: row.email_consent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:read')) return errorJson('Missing permission: contacts:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.lifecycle_stage, 'lead'), isNull(contacts.deleted_at)))
      .limit(1)
    if (!rows[0]) return errorJson('Lead not found', 404)
    return json(serialize(rows[0]))
  })
})


export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:write')) return errorJson('Missing permission: contacts:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(contacts).where(and(eq(contacts.id, id), isNull(contacts.deleted_at))).limit(1)
    if (!existing[0] || existing[0].lifecycle_stage !== 'lead') return errorJson('Lead not found', 404)

    const custom = { ...((existing[0].custom_fields as Record<string, unknown> | null) ?? {}) }
    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.firstName !== undefined) updates.first_name = body.firstName ? String(body.firstName).trim() : null
    if (body.lastName !== undefined) updates.last_name = body.lastName ? String(body.lastName).trim() : null
    if (body.email !== undefined) updates.email = body.email ? String(body.email).trim().toLowerCase() : null
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
    if (body.company !== undefined) updates.company = body.company ? String(body.company) : null
    if (body.source !== undefined) updates.source = body.source ? String(body.source).slice(0, 100) : null
    if (body.ownerId !== undefined) updates.owner_id = body.ownerId ? String(body.ownerId) : null
    if (body.stage !== undefined) custom.lead_stage = String(body.stage).slice(0, 50)
    if (body.score !== undefined) custom.lead_score = Number.isFinite(Number(body.score)) ? Number(body.score) : 0
    if (body.customAttributes && typeof body.customAttributes === 'object') Object.assign(custom, body.customAttributes)
    updates.custom_fields = custom

    const updated = await db.update(contacts).set(updates).where(eq(contacts.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:write')) return errorJson('Missing permission: contacts:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const updated = await db
      .update(contacts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })
    if (!updated.length) return errorJson('Lead not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
