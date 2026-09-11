import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The root domain is the public marketing site: everything is reachable without
// a session. Only the three internal workspaces are gated. Listing public routes
// was the bug — every new page silently bounced to /login until it was added here.
const PROTECTED_PREFIXES = ['/crm', '/cms', '/admin']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

// Must match the cookie the auth layer actually sets (see lib/auth/session.ts).
// These two drifting apart is what made login look broken: the API returned a
// user and set `gcc_session`, while the middleware kept looking for `session`
// and bounced every protected page straight back to /login.
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'gcc_session'

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes authenticate themselves (JWT / API key / HMAC). /api/lead/submit
  // and /api/health are unauthenticated by design.
  if (pathname.startsWith('/api/')) {
    return setSecurityHeaders(NextResponse.next())
  }

  // Everything outside the three internal workspaces is the public site.
  if (!isProtected(pathname)) {
    return setSecurityHeaders(NextResponse.next())
  }

  // Protected CRM/CMS/Admin routes — check session cookie
  const session = request.cookies.get(SESSION_COOKIE)?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return setSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  return setSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
