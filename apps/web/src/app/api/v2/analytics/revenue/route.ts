import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, deals } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson } from '../../_lib'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'analytics:read')) return errorJson('Missing permission: analytics:read', 403)
  return handle(async () => {
    try {
      // Revenue = closed-won deals, summed by month of close, in the deals' currency.
      const monthly = await db
        .select({
          month: sql<string>`to_char(date_trunc('month', ${deals.closed_at}), 'YYYY-MM')`,
          currency: deals.currency,
          value: sql<number>`coalesce(sum(${deals.value}), 0)::bigint`,
          count: sql<number>`count(*)::int`,
        })
        .from(deals)
        .where(eq(deals.status, 'won'))
        .groupBy(sql`date_trunc('month', ${deals.closed_at})`, deals.currency)
        .orderBy(sql`date_trunc('month', ${deals.closed_at})`)

      const bySource = await db
        .select({
          source: sql<string>`coalesce(${contacts.source}, 'unknown')`,
          value: sql<number>`coalesce(sum(${deals.value}), 0)::bigint`,
        })
        .from(deals)
        .leftJoin(contacts, eq(deals.contact_id, contacts.id))
        .where(eq(deals.status, 'won'))
        .groupBy(sql`coalesce(${contacts.source}, 'unknown')`)

      const total = monthly.reduce((sum, row) => sum + Number(row.value), 0)
      const sourceTotal = bySource.reduce((sum, row) => sum + Number(row.value), 0)

      return json({
        total,
        currency: monthly[0]?.currency ?? 'USD',
        monthly: monthly.map((row) => ({ month: row.month, value: Number(row.value), currency: row.currency, deals: row.count })),
        bySource: bySource.map((row) => ({
          source: row.source,
          value: Number(row.value),
          percentage: sourceTotal > 0 ? Number(row.value) / sourceTotal : 0,
        })),
      })
    } catch (error) {
      console.error('[api/v2/analytics/revenue] query failed', error)
      return json({ total: 0, currency: 'USD', monthly: [], bySource: [] })
    }
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
