'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plug, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminFetch } from './api'

type Integration = {
  id: string
  name: string
  description: string
  configured: boolean
  detail: string
}

type IntegrationsData = {
  integrations: Integration[]
  usage: {
    contacts: number | null
    deals: number | null
    conversations: number | null
    pendingJobs: number | null
  }
  checkedAt: string
}

export function IntegrationsPanel() {
  const [data, setData] = useState<IntegrationsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminFetch<IntegrationsData>('/api/admin/integrations'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
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
          <h1 className="text-2xl font-bold text-text">Integrations</h1>
          <p className="text-sm text-text-secondary">Status is read from the live environment — nothing is marked active unless its credentials are present.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Re-check
        </Button>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.integrations.map((integration) => (
              <div key={integration.id} className="rounded-lg border border-border bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4 text-text-tertiary" />
                      <h3 className="font-medium text-text">{integration.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{integration.description}</p>
                    <p className="mt-2 text-xs text-text-tertiary">{integration.detail}</p>
                  </div>
                  <Badge variant={integration.configured ? 'success' : 'warning'} size="sm">
                    {integration.configured ? 'Active' : 'Setup required'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-bg p-4">
            <h2 className="mb-3 font-semibold text-text">Live usage</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Contacts', value: data.usage.contacts },
                { label: 'Deals', value: data.usage.deals },
                { label: 'Conversations', value: data.usage.conversations },
                { label: 'Pending jobs', value: data.usage.pendingJobs },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-text-tertiary">{label}</p>
                  <p className="text-lg font-bold text-text">{value === null ? '—' : value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : !loading ? (
        <EmptyState icon={Plug} title="Integrations unavailable" description={error || 'The integrations endpoint could not be reached.'} />
      ) : (
        <div className="p-8 text-center text-sm text-text-secondary">Checking environment…</div>
      )}
    </div>
  )
}
