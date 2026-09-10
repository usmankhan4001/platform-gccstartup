'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Megaphone,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatShortDate } from '@/components/crm/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Campaign = Record<string, any>

const FILTERS = [
  { value: 'ALL', label: 'All Campaigns' },
  { value: 'running', label: 'Running' },
  { value: 'queued', label: 'Queued' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const fetchCampaigns = () => {
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : data?.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCampaigns()
    const interval = setInterval(fetchCampaigns, 6000)
    return () => clearInterval(interval)
  }, [])

  const filtered = campaigns.filter((c) => filter === 'ALL' || c.status === filter)

  // Live totals from per-recipient outbox job counts
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)
  const totalQueued = campaigns.reduce((acc, c) => acc + (c.queuedCount || 0), 0)
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0)
  const totalRecipients = campaigns.reduce((acc, c) => acc + (c.totalContacts || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Broadcast Campaigns</h1>
            <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)]">
              {campaigns.length} total
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Schedule and dispatch multi-channel WhatsApp templates &amp; automated email sequences with real-time rate limiting.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/crm/campaigns/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Broadcast
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Broadcasts Sent</span>
            <Send className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--navy)]">{totalSent}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Dispatched across all contacts</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Delivered (Accepted)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{totalSent}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Accepted by Meta Cloud API</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Queued</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{totalQueued}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Awaiting rate-limited dispatch</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Failed</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">{totalFailed}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Of {totalRecipients} targeted recipients</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-[var(--navy)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              <th className="py-3 px-4">Campaign Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Recipients</th>
              <th className="py-3 px-4">Delivered</th>
              <th className="py-3 px-4">Failed</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                  Loading campaigns...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
                  <p className="text-sm font-semibold text-[var(--text)]">No campaigns yet</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Create an automated WhatsApp or Email campaign to engage your leads.
                  </p>
                  <Link href="/crm/campaigns/new">
                    <Button size="sm" className="mt-4">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create First Broadcast
                    </Button>
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[var(--text)] block truncate">{c.name}</span>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      {c.template?.name || c.templateName || 'Direct Message'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'running'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : c.status === 'paused'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : c.status === 'failed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status || 'queued'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">{c.totalContacts || c.total || 0}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">
                    {c.sentCount || 0}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-600 font-semibold">
                    {c.failedCount || 0}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-[var(--text-tertiary)]">
                    {formatShortDate(c.createdAt || c.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/crm/campaigns/${c.id}`}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
