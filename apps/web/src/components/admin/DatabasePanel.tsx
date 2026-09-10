'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database as DatabaseIcon, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminFetch, formatBytes } from './api'

type TableStat = { name: string; rows: number | null; sizeBytes: number | null }

type DatabaseInfo = {
  version: string | null
  databaseSize: number | null
  migrations: number | null
  tables: TableStat[] | null
  checkedAt: string
}

export function DatabasePanel() {
  const [info, setInfo] = useState<DatabaseInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setInfo(await adminFetch<DatabaseInfo>('/api/admin/database'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Database</h1>
          <p className="text-sm text-text-secondary">Live PostgreSQL statistics via Drizzle ORM — row estimates come from the planner.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Server</p>
          <p className="mt-1 text-lg font-bold text-text">{info?.version ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Database size</p>
          <p className="mt-1 text-lg font-bold text-text">{info ? formatBytes(info.databaseSize) : '—'}</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Migrations applied</p>
          <p className="mt-1 text-lg font-bold text-text">{info?.migrations ?? '—'}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold text-text">Tables</h2>
        </div>
        {info?.tables && info.tables.length > 0 ? (
          <div className="divide-y divide-border">
            {info.tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-text">{table.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary">{table.rows === null ? '—' : table.rows.toLocaleString()} rows</span>
                  <Badge variant="default" size="sm">
                    {formatBytes(table.sizeBytes)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : info ? (
          <EmptyState
            icon={DatabaseIcon}
            size="sm"
            title="Table statistics unavailable"
            description="The planner statistics could not be read. The database may be unreachable or the role lacks catalog permissions."
          />
        ) : (
          <div className="p-8 text-center text-sm text-text-secondary">{loading ? 'Reading catalog…' : 'No data.'}</div>
        )}
      </div>
    </div>
  )
}
