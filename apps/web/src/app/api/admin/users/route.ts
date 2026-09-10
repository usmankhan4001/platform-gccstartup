import { NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, events } from '@gccstartup/db'
import { hashPassword } from '@gccstartup/shared'
import { handleAdmin, json, errorJson, newId } from '../_lib'

const ROLES = ['super_admin', 'admin', 'staff', 'viewer'] as const

export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role_id,
        isActive: users.is_active,
        emailVerified: users.email_verified,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(500)

    return json(rows)
  })

/**
 * Invite a user by creating the account with a generated temporary password.
 * The password is returned exactly once — it is never stored in plaintext and
 * cannot be retrieved later.
 */
export const POST = (request: NextRequest) =>
  handleAdmin(request, async (admin) => {
    const body = await request.json().catch(() => null)
    const { email, name, role } = body ?? {}

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return errorJson('A valid email address is required', 400)
    }
    if (role && !(ROLES as readonly string[]).includes(role)) {
      return errorJson(`Role must be one of: ${ROLES.join(', ')}`, 400)
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1)
    if (existing[0]) return errorJson('A user with this email already exists', 409)

    const tempPassword = `gcc-${randomBytes(9).toString('base64url')}`
    const passwordHash = await hashPassword(tempPassword)
    const userId = newId()
    const assignedRole = role || 'viewer'

    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      name: name ? String(name).trim().slice(0, 255) : null,
      role_id: assignedRole,
      password_hash: passwordHash,
      is_active: true,
    })

    db.insert(events)
      .values({
        id: newId(),
        event_type: 'user.created',
        source: 'admin',
        payload: { userId, email: normalizedEmail, role: assignedRole, createdBy: admin.id },
      })
      .catch((error) => console.error('[api/admin/users] event insert failed', error))

    return json(
      {
        id: userId,
        email: normalizedEmail,
        name: name ? String(name).trim() : null,
        role: assignedRole,
        // Shown once, on create only.
        tempPassword,
      },
      201,
    )
  })
