import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { logger } from '../utils/logger'

export interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  role: string
}

const ALGORITHM = 'HS256'

/**
 * Create a signed JWT session token.
 * @param payload - Session data (userId, email, role)
 * @param secret - HMAC signing secret
 * @param maxAge - Token lifetime in seconds (default 7 days)
 * @returns Signed JWT string
 */
export async function createSession(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  secret: string,
  maxAge: number = 7 * 24 * 60 * 60,
): Promise<string> {
  const encoder = new TextEncoder()
  const key = encoder.encode(secret)

  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(key)

  return token
}

/**
 * Verify and decode a JWT session token.
 * @param token - The JWT string to verify
 * @param secret - HMAC signing secret
 * @returns Decoded SessionPayload or null if invalid/expired
 */
export async function verifySession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const encoder = new TextEncoder()
    const key = encoder.encode(secret)

    const { payload } = await jwtVerify(token, key, {
      algorithms: [ALGORITHM],
    })

    return payload as unknown as SessionPayload
  } catch (error) {
    logger.debug('JWT verification failed', { error: (error as Error).message })
    return null
  }
}

/**
 * Refresh a JWT session by verifying the old token and issuing a new one.
 * @param token - Existing JWT to refresh
 * @param secret - HMAC signing secret
 * @param maxAge - New token lifetime in seconds (default 7 days)
 * @returns New JWT string or null if the old token is invalid
 */
export async function refreshSession(
  token: string,
  secret: string,
  maxAge: number = 7 * 24 * 60 * 60,
): Promise<string | null> {
  const payload = await verifySession(token, secret)
  if (!payload) return null

  return createSession(
    { userId: payload.userId, email: payload.email, role: payload.role },
    secret,
    maxAge,
  )
}

/**
 * Extract and verify a session from a raw Cookie header string.
 * @param cookieHeader - The full Cookie header value
 * @param cookieName - Name of the session cookie (default "session")
 * @param secret - HMAC signing secret
 * @returns Decoded SessionPayload or null
 */
export async function getSessionFromCookie(
  cookieHeader: string | null,
  cookieName: string,
  secret: string,
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const sessionCookie = cookies.find((c) => c.startsWith(`${cookieName}=`))

  if (!sessionCookie) return null

  const token = sessionCookie.split('=').slice(1).join('=')
  return verifySession(token, secret)
}
