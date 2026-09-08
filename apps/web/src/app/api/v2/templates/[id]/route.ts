import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_templates } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

function serialize(row: typeof email_templates.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    type: 'email',
    category: row.category,
    description: row.description,
    subject: row.subject,
    content: row.html_body,
    text: row.text_body,
    blocks: row.blocks ?? [],
    variables: row.variables ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'templates:read')) return errorJson('Missing permission: templates:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1)
    if (!rows[0]) return errorJson('Template not found', 404)
    return json(serialize(rows[0]))
  })
})

export const PATCH = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'templates:write')) return errorJson('Missing permission: templates:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json()

    const existing = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1)
    if (!existing[0]) return errorJson('Template not found', 404)

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (typeof body.subject === 'string' && body.subject.trim()) updates.subject = body.subject.trim().slice(0, 500)
    if (typeof body.content === 'string' && body.content.trim()) updates.html_body = body.content
    if (typeof body.text === 'string' || body.text === null) updates.text_body = body.text ?? null
    if (Array.isArray(body.blocks)) updates.blocks = body.blocks
    if (Array.isArray(body.variables)) updates.variables = body.variables.map(String)
    if (['marketing', 'transactional', 'flow', 'notification'].includes(body.category)) updates.category = body.category
    if (typeof body.isActive === 'boolean') updates.is_active = body.isActive
    if (body.description !== undefined) updates.description = body.description ? String(body.description) : null

    const updated = await db.update(email_templates).set(updates).where(eq(email_templates.id, id)).returning()
    return json(serialize(updated[0]))
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'templates:write')) return errorJson('Missing permission: templates:write', 403)
  return handle(async () => {
    const { id } = await context.params
    // email_campaigns.template_id references templates with ON DELETE RESTRICT, so a
    // template still attached to a campaign cannot be deleted — surface that clearly.
    const inUse = await db.select({ id: email_campaigns.id }).from(email_campaigns).where(eq(email_campaigns.template_id, id)).limit(1)
    if (inUse.length) return errorJson('Template is used by one or more campaigns', 409)

    const deleted = await db.delete(email_templates).where(eq(email_templates.id, id)).returning({ id: email_templates.id })
    if (!deleted.length) return errorJson('Template not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
