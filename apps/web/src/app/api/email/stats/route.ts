import { NextRequest, NextResponse } from 'next/server'
import { sql, gte, and, type AnyColumn } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_sends } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export type DeliverabilityStatsResponse = {
  total: number
  queued: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  /** All ratios are 0-1 fractions; the UI formats them. Zero denominators yield 0. */
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
  trend: Array<{ date: string; sent: number; delivered: number; opened: number }>
}

function rate(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0
}

/**
 * Live deliverability telemetry aggregated from `email_sends` — the same rows the
 * outbox drainer and the campaign engine write. Every counter is zero-safe so a
 * fresh workspace renders honest 0.0% figures rather than NaN.
 */
export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager'])

    const [totals] = await db
      .select({
        total: sql<number>`count(*)::int`,
        queued: sql<number>`count(*) filter (where ${email_sends.status} = 'queued')::int`,
        delivered: sql<number>`count(*) filter (where ${email_sends.status} = 'delivered')::int`,
        bounced: sql<number>`count(*) filter (where ${email_sends.bounced_at} is not null)::int`,
        complained: sql<number>`count(*) filter (where ${email_sends.complained_at} is not null)::int`,
        failed: sql<number>`count(*) filter (where ${email_sends.status} = 'failed')::int`,
        opened: sql<number>`count(*) filter (where ${email_sends.first_opened_at} is not null)::int`,
        clicked: sql<number>`count(*) filter (where ${email_sends.first_clicked_at} is not null)::int`,
      })
      .from(email_sends)

    const total = Number(totals?.total) || 0
    const queued = Number(totals?.queued) || 0
    const delivered = Number(totals?.delivered) || 0
    const opened = Number(totals?.opened) || 0
    const clicked = Number(totals?.clicked) || 0
    const bounced = Number(totals?.bounced) || 0
    const complained = Number(totals?.complained) || 0
    const failed = Number(totals?.failed) || 0
    // "Sent" is everything that left the queue — a delivery attempt happened.
    const sent = Math.max(0, total - queued)

    const payload: DeliverabilityStatsResponse = {
      total,
      queued,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      deliveryRate: rate(delivered, sent),
      openRate: rate(opened, delivered > 0 ? delivered : sent),
      clickRate: rate(clicked, opened > 0 ? opened : sent),
      bounceRate: rate(bounced, sent),
      complaintRate: rate(complained, sent),
      trend: [],
    }

    // 14-day send/delivered/open series. Each metric groups on its own timestamp
    // column; days with no activity simply do not appear.
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const dayExpr = (column: AnyColumn) => sql<string>`to_char(date_trunc('day', ${column}), 'YYYY-MM-DD')`

    const [sentByDay, deliveredByDay, openedByDay] = await Promise.all([
      db
        .select({ date: dayExpr(email_sends.created_at), count: sql<number>`count(*)::int` })
        .from(email_sends)
        .where(and(gte(email_sends.created_at, since), sql`${email_sends.status} <> 'queued'`))
        .groupBy(sql`1`),
      db
        .select({ date: dayExpr(email_sends.delivered_at), count: sql<number>`count(*)::int` })
        .from(email_sends)
        .where(and(gte(email_sends.delivered_at, since), sql`${email_sends.status} = 'delivered'`))
        .groupBy(sql`1`),
      db
        .select({ date: dayExpr(email_sends.first_opened_at), count: sql<number>`count(*)::int` })
        .from(email_sends)
        .where(gte(email_sends.first_opened_at, since))
        .groupBy(sql`1`),
    ])

    const days = new Set<string>([...sentByDay, ...deliveredByDay, ...openedByDay].map((row) => row.date))
    const lookup = (rows: Array<{ date: string; count: number }>) => new Map(rows.map((row) => [row.date, Number(row.count) || 0]))
    const sentMap = lookup(sentByDay)
    const deliveredMap = lookup(deliveredByDay)
    const openedMap = lookup(openedByDay)

    payload.trend = Array.from(days)
      .sort()
      .map((date) => ({ date, sent: sentMap.get(date) ?? 0, delivered: deliveredMap.get(date) ?? 0, opened: openedMap.get(date) ?? 0 }))

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/stats] failed', error)
    return NextResponse.json({ error: 'Failed to load email stats' }, { status: 500 })
  }
}
