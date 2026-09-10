'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  RefreshCw,
  Users,
  Search,
  CheckCheck,
  ShieldCheck,
  FileText,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CampaignDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const campaignId = resolvedParams.id

  const [campaign, setCampaign] = useState<AnyRecord | null>(null)
  const [stats, setStats] = useState<AnyRecord | null>(null)
  const [sends, setSends] = useState<AnyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logSearch, setLogSearch] = useState('')
  const [logStatusFilter, setLogStatusFilter] = useState('ALL')

  const fetchCampaignDetail = () => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Campaign not found')
        return res.json()
      })
      .then((data) => {
        setCampaign(data.campaign)
        setStats(data.stats)
        setSends(data.sends || [])
      })
      .catch((err) => {
        setError(err.message || 'Failed to load campaign telemetry')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCampaignDetail()
    const interval = setInterval(fetchCampaignDetail, 3500)
    return () => clearInterval(interval)
  }, [campaignId])

  const handleAction = async (action: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Action failed')
      }
      fetchCampaignDetail()
    } catch (err: any) {
      alert(err.message || 'Failed to execute action')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      router.push('/crm/campaigns')
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[var(--accent)]" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Connecting to Campaign Telemetry Engine...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text)]">Telemetry Not Available</h2>
        <p className="text-xs text-[var(--text-secondary)]">{error || 'Campaign could not be found.'}</p>
        <Link href="/crm/campaigns">
          <Button size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Broadcasts
          </Button>
        </Link>
      </div>
    )
  }

  const isRunning = campaign.status === 'running' || campaign.status === 'queued'
  const isPaused = campaign.status === 'paused'
  const isCompleted = campaign.status === 'completed' || campaign.status === 'cancelled'
  const isFailed = campaign.status === 'failed'
  const total = campaign.recipientCount || stats?.total || 0
  const sent = stats?.sent ?? 0
  const delivered = stats?.delivered ?? 0
  const read = stats?.read ?? 0
  const failed = stats?.failed ?? 0

  const progressPct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 100

  const filteredSends = sends.filter((s) => {
    if (logStatusFilter !== 'ALL' && s.status?.toUpperCase() !== logStatusFilter) return false
    if (!logSearch.trim()) return true
    const term = logSearch.toLowerCase()
    return s.recipient?.toLowerCase().includes(term) || s.failureReason?.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Link href="/crm/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Broadcasts
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[var(--navy)]">{campaign.name}</h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isCompleted
                    ? campaign.status === 'cancelled'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isFailed
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isPaused
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                }`}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Template: <span className="font-mono font-semibold text-[var(--navy)]">{campaign.templateName || 'WhatsApp Broadcast'}</span> &bull; Launched {formatDateTime(campaign.createdAt)}
              {campaign.scheduledAt && !isCompleted && (
                <> &bull; Scheduled for {formatDateTime(campaign.scheduledAt)}</>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {campaign.status === 'queued' && (
            <Button size="sm" onClick={() => handleAction('START')} disabled={actionLoading}>
              <Play className="h-3.5 w-3.5 mr-1" />
              {campaign.scheduledAt ? 'Send Now' : 'Start Dispatch'}
            </Button>
          )}
          {campaign.status === 'running' && (
            <Button variant="outline" size="sm" onClick={() => handleAction('PAUSE')} disabled={actionLoading}>
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button size="sm" onClick={() => handleAction('RESUME')} disabled={actionLoading}>
              <Play className="h-3.5 w-3.5 mr-1" />
              Resume
            </Button>
          )}
          {!isCompleted && !isFailed && (
            <Button variant="outline" size="sm" onClick={() => handleAction('CANCEL')} disabled={actionLoading} className="text-rose-600 hover:bg-rose-50">
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}
          {(isCompleted || isFailed) && (
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={actionLoading} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Dispatch Progress Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--navy)]">Live Dispatch Engine Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {sent} of {total} contacts dispatched
            </span>
            <span className="font-mono font-bold text-sm text-[var(--navy)]">{progressPct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full rounded-full bg-[var(--surface-alt)] overflow-hidden border border-[var(--border)]">
          <div
            className="h-full rounded-full bg-linear-to-r from-[var(--orange)] to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 5 KPI Metric Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 pt-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Sent</span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--navy)]">{sent}</p>
            <span className="text-[10px] text-[var(--text-secondary)]">Dispatched</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">Delivered</span>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-700">{delivered}</p>
            <span className="text-[10px] font-bold text-emerald-800">{stats?.deliveryRate || '0.0'}% accepted</span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">Queued</span>
            <p className="mt-1 font-mono text-xl font-bold text-blue-700">{stats?.queued ?? 0}</p>
            <span className="text-[10px] font-bold text-blue-800">awaiting dispatch</span>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-800">Read</span>
            <p className="mt-1 font-mono text-xl font-bold text-purple-700">{read}</p>
            <span className="text-[10px] font-bold text-purple-800">{stats?.readRate || '0.0'}% tracked</span>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">Failed</span>
            <p className="mt-1 font-mono text-xl font-bold text-rose-700">{failed}</p>
            <span className="text-[10px] font-bold text-rose-800">{stats?.failureRate || '0.0'}% failure</span>
          </div>
        </div>
      </div>

      {/* Recipient Logs & Template Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recipient Telemetry Log Table */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-alt)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)]">Live Recipient Dispatch Logs</h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Real-time status updates delivered via Meta WhatsApp Webhooks</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <input
                  placeholder="Filter recipient..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-40 sm:w-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] focus:outline-none"
                />
              </div>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">Queued</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Recipient</th>
                  <th className="py-2.5 px-4">Delivery Status</th>
                  <th className="py-2.5 px-4">Dispatched At</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredSends.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[var(--text-secondary)]">
                      <FileText className="h-6 w-6 mx-auto mb-2 opacity-40 text-[var(--text-tertiary)]" />
                      <p className="text-xs font-semibold">No logs matching criteria</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Dispatched messages will stream in real-time.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSends.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[var(--text)]">
                        {s.recipient}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            s.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <CheckCheck className="h-3 w-3" />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-[var(--text-tertiary)] font-mono">
                        {s.sentAt || s.createdAt ? formatTimeAgo(new Date(s.sentAt || s.createdAt)) : 'Queued'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[11px] text-[var(--text-secondary)]">
                        {s.failureReason || (s.status === 'sent' ? 'Meta Cloud API 200 OK' : '—')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp HSM Mockup & Compliance Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Meta WhatsApp Compliance</span>
            </h3>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="text-[11px]">Provider:</span>
                <span className="font-semibold text-[var(--navy)]">Meta Cloud API v20.0</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="text-[11px]">Throttling Rate:</span>
                <span className="font-semibold text-[var(--navy)]">20 msgs / second</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="text-[11px]">Quality Rating:</span>
                <span className="font-semibold text-emerald-600">HIGH (Green)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px]">Meta Official Surcharge:</span>
                <span className="font-semibold text-emerald-600">0% Platform Markup</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)] flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[var(--accent)]" />
              <span>Target Audience Rules</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Recipients are matched dynamically via inclusion filters with mandatory WhatsApp consent enforcement and instant suppression subtraction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}