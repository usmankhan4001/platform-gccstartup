import { NextRequest } from 'next/server'
import { and, desc, eq, ilike, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { events } from '@gccstartup/db'
import { handleAdmin, json, paginationFrom, metaFor } from '../_lib'

/**
 * System activity ledger. There is no dedicated `audit_log` table in the schema
 * yet, so this serves the append-only `events` table — the same rows the
 * webhook pipeline and the renewal sweep write to. The UI labels it honestly.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const source = searchParams.get('source')

    const filters: SQL[] = []
    if (search) filters.push(ilike(events.event_type, `%${search}%`))
    if (source) filters.push(eq(events.source, source))
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db
        .select({
          id: events.id,
          eventType: events.event_type,
          source: events.source,
          payload: events.payload,
          processedAt: events.processed_at,
          createdAt: events.created_at,
        })
        .from(events)
        .where(where)
        .orderBy(desc(events.created_at))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(events).where(where),
    ])

    return json(rows, 200, metaFor(page, limit, totals[0]?.count ?? 0))
  })
