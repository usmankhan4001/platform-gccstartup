import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { outbox_jobs } from '@gccstartup/db'

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request)

    const updated = await db
      .update(outbox_jobs)
      .set({ status: 'completed', completed_at: new Date(), updated_at: new Date() })
      .where(
        and(
          eq(outbox_jobs.job_type, 'notification'),
          eq(outbox_jobs.status, 'pending'),
          sql`${outbox_jobs.payload}->>'userId' = ${user.id}`,
        ),
      )
      .returning({ id: outbox_jobs.id })

    return NextResponse.json({ success: true, marked: updated.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[notifications/read-all] failed', error)
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 })
  }
}
