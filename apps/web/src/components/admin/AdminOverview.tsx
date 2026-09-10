'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Activity, Key, Users, Webhook, Mail, MessageCircle, Database, RefreshCw, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminFetch, formatDate } from './api'

type Stats = {
  cards: {
    usersTotal: number | null
    usersActive: number | null
    contactsTotal: number | null
    dealsOpen: number | null
    apiKeysActive: number | null
    webhooksActive: number | null
    deliveries24h: number | null
    deliveriesFailed24h: number | null
    outboxPending: number | null
    outboxFailed: number | null
    events24h: number | null
  }
  generatedAt: string
}

type Health = {
  status: 'ok' | 'down'
  services: Record<string, { status: string; detail: string; latencyMs?: number | null }>
  checkedAt: string
}

function StatCard({ label, value, hint, href }: { label: string; value: number | null; hint?: string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-border bg-bg p-4 transition-colors hover:border-primary/40">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value === null ? '—' : value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-xs text-text-tertiary">{hint}</p>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'ok') return 'success'
  if (status === 'degraded') return 'warning'
  if (status === 'down') return 'danger'
  return 'default'
}

function statusLabel(status: string): string {
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

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, healthData] = await Promise.all([
        adminFetch<Stats>('/api/admin/stats'),
        adminFetch<Health>('/api/admin/health'),
      ])
      setStats(statsData)
      setHealth(healthData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cards = stats?.cards

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">System Overview</h1>
          <p className="text-sm text-text-secondary">
            {stats ? `Live counts as of ${formatDate(stats.generatedAt)}` : 'Loading platform metrics…'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-lt px-4 py-3 text-sm text-danger">
          {error} — the numbers below may be unavailable.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={cards?.usersTotal ?? null} hint={cards?.usersActive != null ? `${cards.usersActive} active` : undefined} href="/admin/users" />
        <StatCard label="Contacts" value={cards?.contactsTotal ?? null} href="/crm" />
        <StatCard label="Open Deals" value={cards?.dealsOpen ?? null} href="/crm" />
        <StatCard
          label="Webhook Deliveries (24h)"
          value={cards?.deliveries24h ?? null}
          hint={cards?.deliveriesFailed24h ? `${cards.deliveriesFailed24h} failed` : undefined}
          href="/admin/webhooks"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active API Keys" value={cards?.apiKeysActive ?? null} href="/admin/api-keys" />
        <StatCard label="Active Webhook Endpoints" value={cards?.webhooksActive ?? null} href="/admin/webhooks" />
        <StatCard label="Outbox Pending" value={cards?.outboxPending ?? null} hint={cards?.outboxFailed ? `${cards.outboxFailed} failed` : 'Background jobs'} />
        <StatCard label="Platform Events (24h)" value={cards?.events24h ?? null} href="/admin/audit-log" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">System Health</h2>
            {health && (
              <Badge variant={health.status === 'ok' ? 'success' : 'danger'}>
                {health.status === 'ok' ? 'Operational' : 'Database unreachable'}
              </Badge>
            )}
          </div>
          {health ? (
            <div className="space-y-3">
              {Object.entries(health.services).map(([name, check]) => (
                <div key={name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-medium capitalize text-text">{name}</span>
                    <p className="truncate text-xs text-text-tertiary">{check.detail}</p>
                  </div>
                  <Badge variant={statusTone(check.status)} size="sm">
                    {statusLabel(check.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{loading ? 'Checking services…' : 'Health data unavailable.'}</p>
          )}
          <Link href="/admin/health" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Full diagnostics →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-bg p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/users', icon: Users, label: 'Manage users & roles' },
              { href: '/admin/api-keys', icon: Key, label: 'Create a scoped API key' },
              { href: '/admin/webhooks', icon: Webhook, label: 'Configure webhook endpoints' },
              { href: '/admin/integrations', icon: Mail, label: 'Review integrations' },
              { href: '/admin/database', icon: Database, label: 'Inspect the database' },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-md border border-border px-4 py-2 text-sm text-text transition-colors hover:bg-bg-secondary"
              >
                <Icon className="h-4 w-4 text-text-tertiary" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {!loading && !error && cards && cards.contactsTotal === 0 && cards.usersTotal === 0 && (
        <EmptyState
          icon={Inbox}
          title="The platform is empty"
          description="Invite your first user, then connect lead-gen tools to start capturing contacts."
          action={
            <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">
              Invite a user →
            </Link>
          }
        />
      )}
    </div>
  )
}
