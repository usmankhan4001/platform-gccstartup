import { NextRequest, NextResponse } from 'next/server'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, deals, email_campaigns, email_sends } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson } from '../_lib'

async function countOf(query: Promise<Array<{ count: number }>>): Promise<number> {
  const rows = await query
  return rows[0]?.count ?? 0
}

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'analytics:read')) return errorJson('Missing permission: analytics:read', 403)
  return handle(async () => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Every aggregate is independent, so one failing query degrades to zero rather
    // than blanking the whole overview.
    const [contactsTotal, contactsNew, conversationsTotal, conversationsOpen, dealsTotal, dealsOpen, dealsWon, dealsLost, dealValue, campaignsTotal, sends, sendStatuses] =
      await Promise.allSettled([
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(isNull(contacts.deleted_at))),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(and(isNull(contacts.deleted_at), gte(contacts.created_at, monthStart)))),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(conversations)),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(conversations).where(eq(conversations.state, 'open'))),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(deals)),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(deals).where(eq(deals.status, 'open'))),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(deals).where(eq(deals.status, 'won'))),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(deals).where(eq(deals.status, 'lost'))),
        db
          .select({ total: sql<number>`coalesce(sum(${deals.value}), 0)::bigint`, currency: sql<string>`min(${deals.currency})` })
          .from(deals)
          .where(eq(deals.status, 'open')),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(email_campaigns)),
        countOf(db.select({ count: sql<number>`count(*)::int` }).from(email_sends)),
        db.select({ status: email_sends.status, count: sql<number>`count(*)::int` }).from(email_sends).groupBy(email_sends.status),
      ])

    const rejected = [contactsTotal, contactsNew, conversationsTotal, conversationsOpen, dealsTotal, dealsOpen, dealsWon, dealsLost, dealValue, campaignsTotal, sends, sendStatuses].filter(
      (r) => r.status === 'rejected',
    )
    for (const failure of rejected) console.error('[api/v2/analytics] aggregate failed', (failure as PromiseRejectedResult).reason)

    const v = (r: PromiseSettledResult<unknown>, fallback: unknown) => (r.status === 'fulfilled' ? r.value : fallback)
    const openValue = v(dealValue, [{ total: 0, currency: null }]) as Array<{ total: number | string; currency: string | null }>
    const statuses = v(sendStatuses, []) as Array<{ status: string; count: number }>
    const sent = statuses.find((s) => s.status === 'sent')?.count ?? 0
    const delivered = statuses.find((s) => s.status === 'delivered')?.count ?? 0
    const totalSends = statuses.reduce((sum, s) => sum + s.count, 0)

    return json({
      contacts: { total: v(contactsTotal, 0), newThisMonth: v(contactsNew, 0) },
      conversations: { total: v(conversationsTotal, 0), active: v(conversationsOpen, 0) },
      deals: {
        total: v(dealsTotal, 0),
        open: v(dealsOpen, 0),
        won: v(dealsWon, 0),
        lost: v(dealsLost, 0),
        totalValue: Number(openValue[0]?.total ?? 0),
        currency: openValue[0]?.currency ?? 'USD',
      },
      campaigns: { total: v(campaignsTotal, 0), totalSent: v(sends, 0), deliveryRate: sent > 0 ? delivered / sent : 0, totalSends },
    })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
