import { NextRequest } from 'next/server'
import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, events } from '@gccstartup/db'
import { handleAdmin, json, errorJson, newId, type RouteContext } from '../../_lib'

const ROLES = ['super_admin', 'admin', 'staff', 'viewer'] as const

type Ctx = RouteContext

/**
 * Guard rail: never let the platform lose its last active super_admin through
 * a role change or deactivation performed from the admin UI.
 */
async function isLastActiveSuperAdmin(userId: string): Promise<boolean> {
  const target = await db
    .select({ role: users.role_id, isActive: users.is_active })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const row = target[0]
  if (!row || row.role !== 'super_admin' || !row.isActive) return false

  const others = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role_id, 'super_admin'), eq(users.is_active, true), ne(users.id, userId)))

  return (others[0]?.count ?? 0) === 0
}

export const PATCH = async (request: NextRequest, context: Ctx) =>
  handleAdmin(request, async (admin) => {
    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const { isActive, role, name } = body ?? {}

    if (isActive === undefined && role === undefined && name === undefined) {
      return errorJson('Nothing to update: provide isActive, role, or name', 400)
    }
    if (role !== undefined && !(ROLES as readonly string[]).includes(role)) {
      return errorJson(`Role must be one of: ${ROLES.join(', ')}`, 400)
    }

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (isActive !== undefined) updates.is_active = Boolean(isActive)
    if (role !== undefined) updates.role_id = role
    if (name !== undefined) updates.name = name ? String(name).trim().slice(0, 255) : null

    if ((isActive === false || (role !== undefined && role !== 'super_admin')) && (await isLastActiveSuperAdmin(id))) {
      return errorJson('Cannot demote or deactivate the last active super admin', 409)
    }

    const updated = await db.update(users).set(updates).where(eq(users.id, id)).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role_id,
      isActive: users.is_active,
    })

    if (!updated[0]) return errorJson('User not found', 404)

    db.insert(events)
      .values({
        id: newId(),
        event_type: 'user.role_changed',
        source: 'admin',
        payload: { userId: id, changes: { isActive, role, name }, changedBy: admin.id },
      })
      .catch((error) => console.error('[api/admin/users] event insert failed', error))

    return json(updated[0])
  })

/** Deactivation is a soft delete — the row stays for audit and can be reactivated. */
export const DELETE = async (request: NextRequest, context: Ctx) => {
  return handleAdmin(request, async () => {
    const { id } = await context.params

    if (await isLastActiveSuperAdmin(id)) {
      return errorJson('Cannot deactivate the last active super admin', 409)
    }

    const updated = await db
      .update(users)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email, isActive: users.is_active })

    if (!updated[0]) return errorJson('User not found', 404)
    return json(updated[0])
  })
}
