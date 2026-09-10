'use client'

import { useEffect, useState, useCallback } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { adminFetch, formatDate } from './api'

type EventRow = {
  id: string
  eventType: string
  source: string | null
  payload: unknown
  processedAt: string | null
  createdAt: string
}

export function AuditLogTable() {
  const [rows, setRows] = useState<EventRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminFetch<EventRow[]>(`/api/admin/audit-log?page=${page}&limit=25${query ? `&search=${encodeURIComponent(query)}` : ''}`)
      setRows(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Audit Log</h1>
        <p className="text-sm text-text-secondary">
          System activity from the append-only <code className="font-mono text-xs">events</code> table — lead captures, renewals, user changes and automation triggers. A dedicated
          audit_log table is not provisioned yet.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(query)
        }}
      >
        <div className="w-72">
          <Input id="audit-search" placeholder="Filter by event type…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Search className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </form>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="rounded-lg border border-border bg-bg">
        {rows === null ? (
          <div className="p-8 text-center text-sm text-text-secondary">{loading ? 'Loading activity…' : ''}</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={search ? `No events match “${search}”` : 'No system activity yet'}
            description={
              search
                ? 'Try a broader filter, or clear it to see the latest events.'
                : 'Events appear here as leads are captured, renewals sweep, users change and webhooks fire.'
            }
            action={
              search ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setSearch('')
                    setPage(1)
                  }}
                >
                  Clear filter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="px-4 py-3">
                <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-text">{row.eventType}</span>
                      {row.source && (
                        <Badge variant="default" size="sm">
                          {row.source}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-tertiary">{formatDate(row.createdAt)}</p>
                  </div>
                  <Badge variant={row.processedAt ? 'success' : 'warning'} size="sm">
                    {row.processedAt ? 'processed' : 'recorded'}
                  </Badge>
                </button>
                {expanded === row.id && (
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-bg-secondary p-3 font-mono text-xs text-text-secondary">
                    {JSON.stringify(row.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {rows && rows.length === 25 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span>Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
