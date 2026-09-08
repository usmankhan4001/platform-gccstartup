import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@gccstartup/db'
import { verifyPassword } from '@gccstartup/shared'
import { startSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).toLowerCase().trim()))
      .limit(1)

    const user = rows[0]
    // Same generic message for unknown email and wrong password — do not leak
    // which accounts exist.
    if (!user || !user.password_hash || !user.is_active) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(String(password), user.password_hash)
    if (!valid) {
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
