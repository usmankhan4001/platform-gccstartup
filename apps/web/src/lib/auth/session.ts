import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessions, users } from '@gccstartup/db'
import {
  verifySession,
  createSession as signJwt,
  type SessionPayload,
} from '@gccstartup/shared'

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'gcc_session'
const MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '604800', 10)

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters')
  }
  return s
}

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: string
}

export type AuthResult = { user: AuthUser } | { error: string; status: number }

/**
 * Authenticate a request via the session cookie (JWT) and validate the session
 * row in the database. Returns a discriminated result so route handlers can
 * turn it straight into a 401.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace(/^Bearer /i, '') ||
    null

  if (!token) return { error: 'Authentication required', status: 401 }

  let payload: SessionPayload | null
  try {
    payload = await verifySession(token, secret())
  } catch {
    return { error: 'Invalid session', status: 401 }
  }
  if (!payload?.userId) return { error: 'Invalid session', status: 401 }

  // The JWT alone is not enough — the session row must still exist and be
  // unexpired, so that logout / deactivation revokes live tokens.
  const rows = await db
    .select({
      user_id: sessions.user_id,
      email: users.email,
      name: users.name,
      role: users.role_id,
      is_active: users.is_active,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.user_id))
    .where(and(eq(sessions.token, token), gt(sessions.expires_at, new Date())))
    .limit(1)

  const row = rows[0]
  if (!row || !row.is_active) {
    return { error: 'Session expired or user inactive', status: 401 }
  }

  return {
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role || 'viewer',
    },
  }
}

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 3,
  admin: 2,
  staff: 1,
  viewer: 0,
}

/** requireAuth + role gate. Roles are hierarchical: super_admin > admin > staff > viewer. */
export async function requireRole(
  request: NextRequest,
  roles: string[],
): Promise<AuthResult> {
  const result = await requireAuth(request)
  if ('error' in result) return result

  const level = ROLE_LEVEL[result.user.role] ?? 0
  const allowed = Math.max(...roles.map((r) => ROLE_LEVEL[r] ?? 0))
  if (level < allowed) {
    return { error: 'Insufficient permissions', status: 403 }
  }
  return result
}

/** Helper for route handlers: returns the user or throws a ready-made 401/403. */
export async function authGuard(
  request: NextRequest,
  roles?: string[],
): Promise<AuthUser> {
  const result = roles ? await requireRole(request, roles) : await requireAuth(request)
  if ('error' in result) {
    throw new AuthError(result.error, result.status)
  }
  return result.user
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Create a session: JWT signed + row in `sessions`, returned as a Set-Cookie header value. */
export async function startSession(
  user: { id: string; email: string; role: string },
  request: NextRequest,
): Promise<{ token: string; cookie: string }> {
  const token = await signJwt(
    { userId: user.id, email: user.email, role: user.role },
    secret(),
    MAX_AGE,
  )

  const expiresAt = new Date(Date.now() + MAX_AGE * 1000)
  await db.insert(sessions).values({
    id: randomUUID(),
    user_id: user.id,
    token,
    expires_at: expiresAt,
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: request.headers.get('user-agent') || null,
  })

  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`
  return { token, cookie }
}

/** Delete the session row and clear the cookie. */
export async function endSession(request: NextRequest): Promise<string> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token))
  }
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export { COOKIE_NAME }
