import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

function serialize(row: typeof contacts.$inferSelect) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    jobTitle: row.job_title,
    lifecycleStage: row.lifecycle_stage,
    source: row.source,
    tags: row.tags ?? [],
    customAttributes: row.custom_fields ?? {},
    emailConsent: row.email_consent,
    whatsappConsent: row.whatsapp_consent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:read')) return errorJson('Missing permission: contacts:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(contacts).where(and(eq(contacts.id, id), isNull(contacts.deleted_at))).limit(1)
    if (!rows[0]) return errorJson('Contact not found', 404)
    return json(serialize(rows[0]))
  })
})

const CONSENT_STATES = ['unknown', 'granted', 'denied'] as const
const LIFECYCLE_STAGES = ['lead', 'subscriber', 'prospect', 'client', 'churned'] as const

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:write')) return errorJson('Missing permission: contacts:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(contacts).where(and(eq(contacts.id, id), isNull(contacts.deleted_at))).limit(1)
    if (!existing[0]) return errorJson('Contact not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.firstName !== undefined) updates.first_name = body.firstName ? String(body.firstName).trim() : null
    if (body.lastName !== undefined) updates.last_name = body.lastName ? String(body.lastName).trim() : null
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const first = updates.first_name ?? existing[0].first_name
      const last = updates.last_name ?? existing[0].last_name
      updates.display_name = [first, last].filter(Boolean).join(' ').trim() || null
    }
    if (body.email !== undefined) updates.email = body.email ? String(body.email).trim().toLowerCase() : null
    if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null
    if (body.company !== undefined) updates.company = body.company ? String(body.company) : null
    if (body.jobTitle !== undefined) updates.job_title = body.jobTitle ? String(body.jobTitle) : null
    if ((LIFECYCLE_STAGES as readonly string[]).includes(body.lifecycleStage)) updates.lifecycle_stage = body.lifecycleStage
    if (body.source !== undefined) updates.source = body.source ? String(body.source).slice(0, 100) : null
    if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).slice(0, 50)
    if (body.customAttributes && typeof body.customAttributes === 'object') updates.custom_fields = body.customAttributes
    if ((CONSENT_STATES as readonly string[]).includes(body.emailConsent)) {
      updates.email_consent = body.emailConsent
      if (body.emailConsent === 'granted' && !existing[0].email_consent_at) updates.email_consent_at = new Date()
    }
    if (body.unsubscribed === true) updates.unsubscribed_at = new Date()
    if (body.unsubscribed === false) updates.unsubscribed_at = null

    const updated = await db.update(contacts).set(updates).where(eq(contacts.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'contacts:write')) return errorJson('Missing permission: contacts:write', 403)
  return handle(async () => {
    const { id } = await context.params
    // Soft delete: deals reference contacts with ON DELETE RESTRICT, and the audit
    // trail matters more than the storage.
    const updated = await db
      .update(contacts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })
    if (!updated.length) return errorJson('Contact not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
