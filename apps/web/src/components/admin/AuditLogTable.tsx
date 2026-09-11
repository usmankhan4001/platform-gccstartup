'use client'

import { useEffect, useState, useCallback } from 'react'
import { ScrollText, Search, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet'
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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Audit Log</h1>
          <p className="mt-1 text-sm text-text-secondary">
            System activity from the append-only <code className="font-mono text-xs">events</code> table.
          </p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(query)
          }}
        >
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-tertiary" />
            <Input
              id="audit-search"
              placeholder="Filter by event type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="rounded-xl border border-border bg-bg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-secondary text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-text">
              {rows === null ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-text-secondary">
                    {loading ? 'Loading activity…' : ''}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
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
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedEvent(row)}
                    className="cursor-pointer hover:bg-bg-secondary transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-text group-hover:text-primary transition-colors">
                        {row.eventType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.source ? (
                        <Badge variant="default" size="sm">
                          {row.source}
                        </Badge>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={row.processedAt ? 'success' : 'warning'} size="sm">
                        {row.processedAt ? 'Processed' : 'Recorded'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                        View
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Details Sheet */}
      <Sheet open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
            <SheetDescription>
              Raw JSON payload for <code className="font-mono text-[10px]">{selectedEvent?.eventType}</code>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Timestamp</p>
              <p className="text-sm text-text">{selectedEvent ? formatDate(selectedEvent.createdAt) : ''}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Source</p>
              <p className="text-sm text-text">{selectedEvent?.source || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Payload</p>
              <pre className="rounded-lg bg-bg-secondary p-4 font-mono text-xs text-text-secondary overflow-x-auto border border-border">
                {selectedEvent ? JSON.stringify(selectedEvent.payload, null, 2) : ''}
              </pre>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
