import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup', '/demo', '/api/health']

// Must match the cookie the auth layer actually sets (see lib/auth/session.ts).
// These two drifting apart is what made login look broken: the API returned a
// user and set `gcc_session`, while the middleware kept looking for `session`
// and bounced every protected page straight back to /login.
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'gcc_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth required
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // API routes — handled by API auth (JWT), pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected CRM/CMS/Admin and other routes — check session cookie
  const session = request.cookies.get(SESSION_COOKIE)?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
