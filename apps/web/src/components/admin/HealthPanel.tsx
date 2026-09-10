'use client'

import { useEffect, useState, useCallback } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminFetch, formatDate } from './api'

type ServiceCheck = { status: string; detail: string; latencyMs?: number | null }

type Health = {
  status: 'ok' | 'down'
  services: Record<string, ServiceCheck>
  checkedAt: string
}

function tone(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'ok') return 'success'
  if (status === 'degraded') return 'warning'
  if (status === 'down') return 'danger'
  return 'default'
}

function label(status: string): string {
  switch (status) {
    case 'ok':
      return 'Healthy'
    case 'degraded':
      return 'Degraded'
    case 'down':
      return 'Down'
    case 'not_configured':
      return 'Not configured'
    default:
      return status
  }
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  database: 'PostgreSQL — every module reads and writes here',
  worker: 'Background worker draining the durable outbox',
  email: 'Amazon SES transactional + campaign sending',
  whatsapp: 'Meta WhatsApp Cloud API messaging',
  storage: 'Cloudflare R2 media + document storage',
  ai: 'AI copilot provider',
  redis: 'Cache layer',
}

export function HealthPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setHealth(await adminFetch<Health>('/api/admin/health'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run diagnostics')
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
          <h1 className="text-2xl font-bold text-text">System Health</h1>
          <p className="text-sm text-text-secondary">
            {health ? `Checked ${formatDate(health.checkedAt)}` : 'Running diagnostics…'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Re-run checks
        </Button>
      </div>

      {error && <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">{error}</div>}

      {health ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(health.services).map(([name, check]) => (
            <div key={name} className="rounded-lg border border-border bg-bg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium capitalize text-text">{name}</h3>
                <Badge variant={tone(check.status)} size="sm">
                  {label(check.status)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">{SERVICE_DESCRIPTIONS[name]}</p>
              <p className="mt-2 text-sm text-text-secondary">{check.detail}</p>
              {check.latencyMs != null && <p className="mt-1 text-xs text-text-tertiary">Response time: {check.latencyMs}ms</p>}
            </div>
          ))}
        </div>
      ) : !loading ? (
        <EmptyState
          icon={Activity}
          title="Diagnostics unavailable"
          description={error || 'The health endpoint could not be reached. Check that the app can connect to PostgreSQL.'}
          action={
            <Button size="sm" variant="outline" onClick={load}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="p-8 text-center text-sm text-text-secondary">Checking services…</div>
      )}

      {health && (
        <p className="text-xs text-text-tertiary">
          Provider checks report configuration state only — a health probe never sends a paid message. Overall status:{' '}
          <span className={health.status === 'ok' ? 'font-semibold text-green-dk' : 'font-semibold text-danger'}>
            {health.status === 'ok' ? 'operational' : 'database unreachable'}
          </span>
          .
        </p>
      )}
    </div>
  )
}
