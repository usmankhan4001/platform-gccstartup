import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { outbox_jobs } from '@gccstartup/db'

// There is no dedicated notifications table in the schema yet, so in-app
// notifications are durable outbox_jobs rows with job_type 'notification' and the
// recipient in payload.userId. Unread = status 'pending'; marking read completes
// the job, which keeps the worker contract intact.

const NOTIFICATION_JOB_TYPE = 'notification'

function userFilter(userId: string) {
  return and(eq(outbox_jobs.job_type, NOTIFICATION_JOB_TYPE), sql`${outbox_jobs.payload}->>'userId' = ${userId}`)
}

export async function GET(request: NextRequest) {
  try {
    const user = await authGuard(request)
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))

    const conditions = [userFilter(user.id)]
    if (unreadOnly) conditions.push(eq(outbox_jobs.status, 'pending'))

    const rows = await db
      .select()
      .from(outbox_jobs)
      .where(and(...conditions))
      .orderBy(desc(outbox_jobs.created_at))
      .limit(limit)

    const unreadRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outbox_jobs)
      .where(and(userFilter(user.id), eq(outbox_jobs.status, 'pending')))

    const data = rows.map((row) => {
      const payload = (row.payload || {}) as Record<string, unknown>
      return {
        id: row.id,
        type: typeof payload.type === 'string' ? payload.type : 'system',
        title: typeof payload.title === 'string' ? payload.title : 'Notification',
        message: typeof payload.message === 'string' ? payload.message : '',
        link: typeof payload.link === 'string' ? payload.link : null,
        isRead: row.status !== 'pending',
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({
      data,
      meta: { unreadCount: Number(unreadRows[0]?.count) || 0, total: data.length },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[notifications] list failed', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}
