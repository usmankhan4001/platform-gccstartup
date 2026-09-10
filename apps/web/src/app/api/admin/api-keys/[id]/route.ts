import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { api_keys } from '@gccstartup/db'
import { handleAdmin, json, errorJson, type RouteContext } from '../../_lib'

/**
 * Revocation is soft: `is_active` flips to false so the row keeps its audit
 * trail and `authenticateApiKey` immediately rejects the token.
 */
export const DELETE = async (request: NextRequest, context: RouteContext) =>
  handleAdmin(request, async () => {
    const { id } = await context.params

    const updated = await db
      .update(api_keys)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(api_keys.id, id))
      .returning({ id: api_keys.id, name: api_keys.name, isActive: api_keys.is_active })

    if (!updated[0]) return errorJson('API key not found', 404)
    return json(updated[0])
  })

export const PATCH = async (request: NextRequest, context: RouteContext) =>
  handleAdmin(request, async () => {
    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const { isActive, name } = body ?? {}

    if (isActive === undefined && name === undefined) {
      return errorJson('Nothing to update: provide isActive or name', 400)
    }

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (isActive !== undefined) updates.is_active = Boolean(isActive)
    if (name !== undefined) {
      if (!String(name).trim()) return errorJson('Name cannot be empty', 400)
      updates.name = String(name).trim().slice(0, 200)
    }

    const updated = await db
      .update(api_keys)
      .set(updates)
      .where(eq(api_keys.id, id))
      .returning({
        id: api_keys.id,
        name: api_keys.name,
        keyPrefix: api_keys.key_prefix,
        permissions: api_keys.permissions,
        rateLimit: api_keys.rate_limit,
        isActive: api_keys.is_active,
        expiresAt: api_keys.expires_at,
      })

    if (!updated[0]) return errorJson('API key not found', 404)
    return json(updated[0])
  })
