import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_sends } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { loadEngagementRows, aggregateEvents } from '@/lib/email/analytics'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])

    const [byStatus, totals, campaigns, engagement] = await Promise.allSettled([
      db
        .select({ status: email_sends.status, count: sql<number>`count(*)::int` })
        .from(email_sends)
        .groupBy(email_sends.status),
      db.select({ count: sql<number>`count(*)::int` }).from(email_campaigns),
      db
        .select({
          id: email_campaigns.id,
          name: email_campaigns.name,
          status: email_campaigns.status,
          recipient_count: email_campaigns.recipient_count,
          updated_at: email_campaigns.updated_at,
        })
        .from(email_campaigns)
        .limit(100),
      loadEngagementRows({ limit: 5_000 }),
    ])

    if (byStatus.status === 'rejected') console.error('[api/email/analytics] send status query failed', byStatus.reason)
    if (totals.status === 'rejected') console.error('[api/email/analytics] campaign totals query failed', totals.reason)
    if (campaigns.status === 'rejected') console.error('[api/email/analytics] campaigns query failed', campaigns.reason)
    if (engagement.status === 'rejected') console.error('[api/email/analytics] engagement query failed', engagement.reason)

    const statusCounts = byStatus.status === 'fulfilled' ? byStatus.value : []
    const totalsCount = totals.status === 'fulfilled' ? (totals.value[0]?.count ?? 0) : 0
    const campaignList = campaigns.status === 'fulfilled' ? campaigns.value : []
    const overview = engagement.status === 'fulfilled' ? aggregateEvents(engagement.value) : { totals: null, byCampaign: [], byFlow: [] }

    const sent = statusCounts.find((row) => row.status === 'sent')?.count ?? 0
    const delivered = statusCounts.find((row) => row.status === 'delivered')?.count ?? 0
    const bounced = statusCounts.find((row) => row.status === 'bounced')?.count ?? 0

    return NextResponse.json({
      data: {
        sends: {
          byStatus: Object.fromEntries(statusCounts.map((row) => [row.status, row.count])),
          total: statusCounts.reduce((sum, row) => sum + row.count, 0),
          deliveryRate: sent > 0 ? delivered / sent : 0,
          bounceRate: sent > 0 ? bounced / sent : 0,
        },
        campaigns: { total: totalsCount, list: campaignList },
        engagement: overview,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/analytics] failed', error)
    return NextResponse.json({ error: 'Failed to load email analytics' }, { status: 500 })
  }
}
