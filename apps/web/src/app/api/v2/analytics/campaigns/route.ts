import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_sends } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson } from '../../_lib'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'analytics:read')) return errorJson('Missing permission: analytics:read', 403)
  return handle(async () => {
    try {
      const perCampaign = await db
        .select({
          id: email_campaigns.id,
          name: email_campaigns.name,
          status: email_campaigns.status,
          recipientCount: email_campaigns.recipient_count,
        })
        .from(email_campaigns)
        .orderBy(desc(email_campaigns.updated_at))
        .limit(100)

      const sendStats = await db
        .select({
          campaignId: email_sends.campaign_id,
          status: email_sends.status,
          count: sql<number>`count(*)::int`,
        })
        .from(email_sends)
        .groupBy(email_sends.campaign_id, email_sends.status)

      const opens = await db
        .select({ campaignId: email_sends.campaign_id, count: sql<number>`coalesce(sum(${email_sends.open_count}), 0)::int` })
        .from(email_sends)
        .groupBy(email_sends.campaign_id)
      const clicks = await db
        .select({ campaignId: email_sends.campaign_id, count: sql<number>`coalesce(sum(${email_sends.click_count}), 0)::int` })
        .from(email_sends)
        .groupBy(email_sends.campaign_id)

      const statMap = new Map<string, Record<string, number>>()
      for (const row of sendStats) {
        const entry = statMap.get(row.campaignId) ?? {}
        entry[row.status] = row.count
        statMap.set(row.campaignId, entry)
      }
      const openMap = new Map(opens.map((row) => [row.campaignId, row.count]))
      const clickMap = new Map(clicks.map((row) => [row.campaignId, row.count]))

      let totalSent = 0
      let totalDelivered = 0
      const campaigns = perCampaign.map((campaign) => {
        const stats = statMap.get(campaign.id) ?? {}
        const sent = (stats.sent ?? 0) + (stats.delivered ?? 0) + (stats.bounced ?? 0) + (stats.complained ?? 0)
        const delivered = (stats.delivered ?? 0) + (stats.complained ?? 0)
        totalSent += sent
        totalDelivered += delivered
        return {
          id: campaign.id,
          name: campaign.name,
          type: 'email',
          status: campaign.status,
          metrics: {
            sent,
            delivered,
            opened: openMap.get(campaign.id) ?? 0,
            clicked: clickMap.get(campaign.id) ?? 0,
            bounced: stats.bounced ?? 0,
            failed: stats.failed ?? 0,
            deliveryRate: sent > 0 ? delivered / sent : 0,
          },
        }
      })

      return json({
        campaigns,
        summary: {
          totalCampaigns: campaigns.length,
          totalMessagesSent: totalSent,
          averageDeliveryRate: totalSent > 0 ? totalDelivered / totalSent : 0,
        },
      })
    } catch (error) {
      // A failed analytics read degrades to empty with a logged error, never a 500.
      console.error('[api/v2/analytics/campaigns] query failed', error)
      return json({ campaigns: [], summary: { totalCampaigns: 0, totalMessagesSent: 0, averageDeliveryRate: 0 } })
    }
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
