import { NextRequest, NextResponse } from 'next/server'
import { eq, desc, ilike, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_suppressions } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'agent', 'manager'])
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const reason = searchParams.get('reason')?.trim()

    let query = db.select().from(email_suppressions).$dynamic()

    if (q) {
      query = query.where(
        or(
          ilike(email_suppressions.email, `%${q}%`),
          ilike(email_suppressions.source, `%${q}%`),
          ilike(email_suppressions.detail, `%${q}%`),
        ),
      )
    }

    if (reason && ['hard_bounce', 'complaint', 'manual', 'invalid'].includes(reason)) {
      query = query.where(eq(email_suppressions.reason, reason as 'hard_bounce' | 'complaint' | 'manual' | 'invalid'))
    }

    const rows = await query.orderBy(desc(email_suppressions.created_at)).limit(100)

    return NextResponse.json({
      data: rows,
      total: rows.length,
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/suppressions GET] failed', error)
    return NextResponse.json({ error: 'Failed to load email suppressions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager'])
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const reason = typeof body.reason === 'string' ? body.reason : 'manual'
    const detail = typeof body.detail === 'string' ? body.detail : null
    const source = typeof body.source === 'string' ? body.source : 'admin_manual'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }

    const existing = await db
      .select({ id: email_suppressions.id })
      .from(email_suppressions)
      .where(eq(email_suppressions.email, email))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ ok: true, message: 'Email already in suppression list' })
    }

    const newId = crypto.randomUUID()
    await db.insert(email_suppressions).values({
      id: newId,
      email,
      reason: reason as 'hard_bounce' | 'complaint' | 'manual' | 'invalid',
      source,
      detail,
    })

    return NextResponse.json({ ok: true, id: newId, message: 'Email suppressed successfully' }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/suppressions POST] failed', error)
    return NextResponse.json({ error: 'Failed to create email suppression' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const email = searchParams.get('email')

    if (!id && !email) {
      return NextResponse.json({ error: 'ID or email required for deletion' }, { status: 400 })
    }

    if (id) {
      await db.delete(email_suppressions).where(eq(email_suppressions.id, id))
    } else if (email) {
      await db.delete(email_suppressions).where(eq(email_suppressions.email, email.toLowerCase().trim()))
    }

    return NextResponse.json({ ok: true, message: 'Suppression removed' })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/suppressions DELETE] failed', error)
    return NextResponse.json({ error: 'Failed to delete suppression' }, { status: 500 })
  }
}
