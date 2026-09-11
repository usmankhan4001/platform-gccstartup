import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@gccstartup/db'
import { verifyPassword, checkRateLimit } from '@gccstartup/shared'
import { startSession } from '@/lib/auth/session'

// Pre-computed valid scrypt hash used as a dummy during timing-safe authentication
const DUMMY_HASH = '00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip'
    const limit = checkRateLimit(`login:${ip}`, 10, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    const { email, password } = await request.json().catch(() => ({}))
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).toLowerCase().trim()))
      .limit(1)

    const user = rows[0]
    const targetHash = user?.password_hash || DUMMY_HASH
    const valid = await verifyPassword(String(password), targetHash)

    // Same generic message for unknown email, wrong password, or inactive user — do not leak which accounts exist.
    if (!user || !user.password_hash || !user.is_active || !valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const { cookie } = await startSession(
      { id: user.id, email: user.email, role: user.role_id || 'viewer' },
      request,
    )

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role_id },
      },
      { headers: { 'Set-Cookie': cookie } },
    )
  } catch (error: any) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
