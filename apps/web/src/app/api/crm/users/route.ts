import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@gccstartup/db'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role_id,
        is_active: users.is_active,
      })
      .from(users)
      .where(eq(users.is_active, true))
      .orderBy(asc(users.name))

    return NextResponse.json({ data: rows })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/users] list failed', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}
