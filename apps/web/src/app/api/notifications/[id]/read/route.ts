import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { outbox_jobs } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request)
    const { id } = await params

    // Scoped to the caller's own notifications — the payload userId must match.
    const updated = await db
      .update(outbox_jobs)
      .set({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
      .where(
        and(
          eq(outbox_jobs.id, id),
          eq(outbox_jobs.job_type, 'notification'),
          eq(outbox_jobs.status, 'pending'),
          sql`${outbox_jobs.payload}->>'userId' = ${user.id}`,
        ),
      )
      .returning({ id: outbox_jobs.id })

    if (!updated.length) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[notifications/[id]/read] failed', error)
    return NextResponse.json({ error: 'Failed to mark notification read' }, { status: 500 })
  }
}
