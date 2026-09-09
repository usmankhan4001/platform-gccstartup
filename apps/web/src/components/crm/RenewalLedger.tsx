'use client'

import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Filter,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { LeadDrawer } from './LeadDrawer'
import { formatMoney, formatShortDate, type RenewalRecord, type RenewalUrgency } from './types'

export function RenewalLedger() {
  const toast = useToast()
  const [renewals, setRenewals] = useState<RenewalRecord[]>([])
  const [stats, setStats] = useState({
    totalLicenses: 0,
    criticalCount: 0,
    warningCount: 0,
    upcomingCount: 0,
    healthyCount: 0,
    totalARR: 0,
    retentionRate: 97.4,
  })
  const [quarterlyForecast, setQuarterlyForecast] = useState<
    Array<{ quarter: string; count: number; value: number; status: string }>
  >([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [deskFilter, setDeskFilter] = useState<string>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>('note')
  const [runningSweep, setRunningSweep] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  async function loadRenewals() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (urgencyFilter !== 'all') params.set('urgency', urgencyFilter)
      if (deskFilter !== 'all') params.set('desk', deskFilter)
      if (jurisdictionFilter !== 'all') params.set('jurisdiction', jurisdictionFilter)

      const res = await fetch(`/api/crm/renewals?${params.toString()}`)
      const data = await res.json()
      if (data.renewals) {
        setRenewals(data.renewals)
        if (data.stats) setStats(data.stats)
        if (data.quarterlyForecast) setQuarterlyForecast(data.quarterlyForecast)
      }
    } catch (err) {
      toast.error('Could not load renewal ledger records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRenewals()
  }, [urgencyFilter, deskFilter, jurisdictionFilter])

  // Trigger Individual Renewal Alert
  async function handleTriggerAlert(record: RenewalRecord, reminderType: '60d' | '30d' | '7d') {
    const key = `${record.id}-${reminderType}`
    setActionInProgress(key)
    try {
      const res = await fetch('/api/crm/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_reminder',
          contactId: record.contact_id,
          reminderType,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `${reminderType.toUpperCase()} alert sent.`)
        await loadRenewals()
      } else {
        toast.error(data.error || 'Failed to dispatch alert')
      }
    } catch (err) {
      toast.error('Alert dispatch error')
    } finally {
      setActionInProgress(null)
    }
  }

  // 1-Click Renew License
  async function handleRenewLicense(record: RenewalRecord) {
    const key = `${record.id}-renew`
    setActionInProgress(key)
    try {
      const res = await fetch('/api/crm/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew_license',
          contactId: record.contact_id,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'License extended for +1 year.')
        await loadRenewals()
      } else {
        toast.error(data.error || 'Renewal failed')
      }
    } catch (err) {
      toast.error('Renewal request failed')
    } finally {
      setActionInProgress(null)
    }
  }

  // Batch Renewal Sweep
  async function handleRunBatchSweep() {
    setRunningSweep(true)
    try {
      const res = await fetch('/api/crm/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch_trigger_all' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Automated renewal sweep complete.')
        await loadRenewals()
      } else {
        toast.error(data.error || 'Batch sweep failed')
      }
    } catch (err) {
      toast.error('Batch sweep error')
    } finally {
      setRunningSweep(false)
    }
  }

  return (
    <div className="space-y-6">
      <LeadDrawer
        leadId={selectedLeadId || undefined}
        open={Boolean(selectedLeadId)}
        initialTab={selectedTab}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={() => void loadRenewals()}
      />

      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Annual Renewal & Compliance Ledger
            </h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-black text-blue-700">
              Live Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Automated 60d, 30d, and 7d recurring license renewal triggers, corporate tax deadlines, and ARR forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={runningSweep}
            onClick={handleRunBatchSweep}
            className="flex items-center gap-2 rounded-lg bg-[#0A142F] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
          >
            <Zap size={14} className="text-amber-400" />
            <span>{runningSweep ? 'Sweeping...' : 'Run Automated 60d/30d/7d Sweep'}</span>
          </button>
        </div>
      </div>

      {/* Executive Renewal KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Monitored Entities */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Active Licenses
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.totalLicenses}</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Monitored in PostgreSQL</p>
        </div>

        {/* Critical Expirations (< 7 Days / Expired) */}
        <div className={`rounded-xl border p-4 shadow-xs ${stats.criticalCount > 0 ? 'border-red-300 bg-red-50/40 ring-2 ring-red-500/10' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
              Critical (&lt; 7 Days)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-700">{stats.criticalCount}</p>
          <p className="mt-1 text-[11px] text-red-600 font-medium">Urgent outreach required</p>
        </div>

        {/* 30 Days Warning Window */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Due in 30 Days
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.warningCount}</p>
          <p className="mt-1 text-[11px] text-amber-600 font-medium">Second alert active</p>
        </div>

        {/* Projected Renewal ARR */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Projected Renewal ARR
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(stats.totalARR, 'AED')}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Recurring retainer revenue
          </p>
        </div>

        {/* Renewal Retention Rate */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Client Retention Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats.retentionRate}%</p>
          <p className="mt-1 text-[11px] text-purple-600 font-medium">Annual corporate renewal</p>
        </div>
      </div>

      {/* Quarterly Forecast Matrix */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#0A142F] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-600" />
            Quarterly Renewal Revenue Forecast
          </h3>
          <span className="text-[11px] text-slate-400">Next 4 Quarters Projection</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quarterlyForecast.map((q, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{q.quarter}</span>
                  <span className="text-[10px] font-semibold text-blue-600">{q.status}</span>
                </div>
                <div className="mt-2 font-mono font-black text-base text-[#0A142F]">
                  {formatMoney(q.value, 'AED')}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                {q.count} Entity Licenses Up for Renewal
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ledger Table & Urgency Filters */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
        {/* Filters Header Bar */}
        <div className="p-4 border-b border-[var(--border)] bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadRenewals()}
              placeholder="Search company, license #, client name, email, phone..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Urgency Filter Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'critical', label: 'Critical (< 7d)' },
              { id: 'warning', label: '30 Days' },
              { id: 'upcoming', label: '60 Days' },
              { id: 'healthy', label: 'Healthy (> 60d)' },
              { id: 'expired', label: 'Expired' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  urgencyFilter === tab.id
                    ? 'bg-[#0A142F] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setUrgencyFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desk Filter */}
          <div className="flex items-center gap-2">
            <select
              value={deskFilter}
              onChange={(e) => setDeskFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="all">All Desks</option>
              <option value="Dubai Desk">Dubai Desk</option>
              <option value="Riyadh Desk">Riyadh Desk</option>
              <option value="APAC Desk">APAC Desk</option>
            </select>

            <button
              type="button"
              onClick={() => void loadRenewals()}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
              title="Refresh ledger"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* High Density Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Company &amp; License #</th>
                <th className="py-3 px-3">Jurisdiction &amp; Desk</th>
                <th className="py-3 px-3">UBO / Client Contact</th>
                <th className="py-3 px-3">Trade License Expiry</th>
                <th className="py-3 px-3">Visa / Tax Deadlines</th>
                <th className="py-3 px-3">Retainer Fee</th>
                <th className="py-3 px-3">Reminders Sent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading Annual Renewal Ledger...
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No corporate renewals found under these filter criteria.
                  </td>
                </tr>
              ) : (
                renewals.map((r) => {
                  const days = r.days_until_license_expiry
                  const isCrit = r.urgency === 'critical' || r.urgency === 'expired'
                  const isWarn = r.urgency === 'warning'
                  const isUpc = r.urgency === 'upcoming'

                  const urgencyBadgeClass =
                    isCrit
                      ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                      : isWarn
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : isUpc
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLeadId(r.contact_id)}
                    >
                      {/* Company Name & License # */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {r.company_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {r.license_number}
                        </div>
                      </td>

                      {/* Jurisdiction & Desk */}
                      <td className="py-3 px-3">
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {r.jurisdiction}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {r.desk}
                        </div>
                      </td>

                      {/* Client / UBO Contact */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {r.contact_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {r.email}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          {r.phone}
                        </div>
                      </td>

                      {/* Trade License Expiry & Countdown */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {r.trade_license_expiry}
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black border mt-0.5 ${urgencyBadgeClass}`}>
                          {days <= 0 ? 'EXPIRED' : `${days} Days Left`}
                        </span>
                      </td>

                      {/* Visa & Corporate Tax Deadlines */}
                      <td className="py-3 px-3 text-[10px] space-y-0.5">
                        <div className="text-slate-600">
                          <span className="text-slate-400">Visa:</span> {r.visa_eid_expiry || '—'}
                        </div>
                        <div className="text-slate-600">
                          <span className="text-slate-400">Corp Tax:</span> {r.corporate_tax_deadline || '—'}
                        </div>
                      </td>

                      {/* Annual Retainer Fee */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-xs text-emerald-700">
                          {formatMoney(r.annual_fee, r.currency)}
                        </div>
                        <span className="text-[9px] text-slate-400">Annual Retainer</span>
                      </td>

                      {/* Automated Reminder Status (60d, 30d, 7d) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span
                            title="60-Day Reminder Trigger"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              r.reminders_sent?.d60
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            60D
                          </span>
                          <span
                            title="30-Day Reminder Trigger"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              r.reminders_sent?.d30
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            30D
                          </span>
                          <span
                            title="7-Day Reminder Trigger"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              r.reminders_sent?.d7
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            7D
                          </span>
                        </div>
                      </td>

                      {/* 1-Click Action Buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Trigger 60d Alert */}
                          <button
                            type="button"
                            title="Dispatch 60d Renewal Notice"
                            disabled={actionInProgress === `${r.id}-60d`}
                            className="rounded bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 p-1 text-[10px] font-bold transition-all shadow-2xs disabled:opacity-50"
                            onClick={() => handleTriggerAlert(r, '60d')}
                          >
                            60d
                          </button>

                          {/* Trigger 30d Alert */}
                          <button
                            type="button"
                            title="Dispatch 30d Renewal Notice"
                            disabled={actionInProgress === `${r.id}-30d`}
                            className="rounded bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 p-1 text-[10px] font-bold transition-all shadow-2xs disabled:opacity-50"
                            onClick={() => handleTriggerAlert(r, '30d')}
                          >
                            30d
                          </button>

                          {/* Trigger 7d Alert */}
                          <button
                            type="button"
                            title="Dispatch 7d Urgent Renewal Notice"
                            disabled={actionInProgress === `${r.id}-7d`}
                            className="rounded bg-red-50 hover:bg-red-600 hover:text-white text-red-700 p-1 text-[10px] font-bold transition-all shadow-2xs disabled:opacity-50"
                            onClick={() => handleTriggerAlert(r, '7d')}
                          >
                            7d
                          </button>

                          {/* Extend License (+1 Year) */}
                          <button
                            type="button"
                            title="Extend License +1 Year"
                            disabled={actionInProgress === `${r.id}-renew`}
                            className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-[10px] font-bold transition-all shadow-2xs disabled:opacity-50"
                            onClick={() => handleRenewLicense(r)}
                          >
                            Renew
                          </button>

                          {/* Open 360° Drawer */}
                          <button
                            type="button"
                            title="Open 360° Lead View"
                            className="rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 text-[10px] font-bold transition-all"
                            onClick={() => setSelectedLeadId(r.contact_id)}
                          >
                            360°
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
