import { NextRequest } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { roles, permissions, role_permissions, users } from '@gccstartup/db'
import { handleAdmin, json } from '../_lib'

/**
 * Roles with their live user counts and granted permissions. The built-in RBAC
 * ladder (viewer/staff/admin/super_admin) is enforced in code regardless of
 * what rows exist here, so an empty table is reported honestly, not papered over.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const [roleRows, userCounts, grants] = await Promise.all([
      db.select().from(roles),
      db
        .select({ role: users.role_id, count: sql<number>`count(*)::int` })
        .from(users)
        .groupBy(users.role_id),
      db
        .select({
          roleId: role_permissions.role_id,
          name: permissions.name,
          description: permissions.description,
        })
        .from(role_permissions)
        .innerJoin(permissions, eq(permissions.id, role_permissions.permission_id)),
    ])

    const countByRole = new Map(userCounts.map((row) => [row.role ?? 'unassigned', row.count]))

    const data = roleRows.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: countByRole.get(role.name) ?? 0,
      permissions: grants.filter((grant) => grant.roleId === role.id),
      createdAt: role.created_at,
    }))

    return json(data)
  })
