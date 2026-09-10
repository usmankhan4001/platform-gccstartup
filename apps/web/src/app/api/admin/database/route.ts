import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { handleAdmin, json } from '../_lib'

type TableStat = { name: string; rows: number | null; sizeBytes: number | null }

/**
 * Live database facts: server version, on-disk size, and per-table row/size
 * estimates from the planner statistics. Nothing here is hardcoded — if a
 * query fails the section degrades to null and the UI says so.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    let version: string | null = null
    let databaseSize: number | null = null
    let tables: TableStat[] | null = null
    let migrationCount: number | null = null

    try {
      const rows = (await db.execute(
        sql`select version() as version, pg_database_size(current_database()) as size`,
      )) as Array<{ version?: string; size?: string | number }>
      version = rows[0]?.version?.split(' ').slice(0, 2).join(' ') ?? null
      databaseSize = rows[0]?.size != null ? Number(rows[0].size) : null
    } catch (error) {
      console.error('[api/admin/database] version query failed', error)
    }

    try {
      const stats = (await db.execute(sql`
        select
          c.relname as table_name,
          coalesce(s.n_live_tup, 0)::bigint as live_rows,
          pg_total_relation_size(c.oid) as total_bytes
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        left join pg_stat_user_tables s on s.relid = c.oid
        where n.nspname = 'public' and c.relkind = 'r'
        order by pg_total_relation_size(c.oid) desc
      `)) as Array<{ table_name: string; live_rows: string | number; total_bytes: string | number }>

      tables = stats.map((row) => ({
        name: row.table_name,
        rows: Number(row.live_rows ?? 0),
        sizeBytes: Number(row.total_bytes ?? 0),
      }))
    } catch (error) {
      console.error('[api/admin/database] table stats failed', error)
    }

    try {
      const rows = (await db.execute(
        sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
      )) as Array<{ count?: number }>
      migrationCount = Number(rows[0]?.count ?? 0)
    } catch {
      // The drizzle bookkeeping schema may not exist yet — leave the count null.
    }

    return json({
      version,
      databaseSize,
      migrations: migrationCount,
      tables,
      checkedAt: new Date().toISOString(),
    })
  })
