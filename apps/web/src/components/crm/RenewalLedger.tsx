'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BellRing,
  Building2,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/ToastProvider'
import { renewTradeLicense, runRenewalSweep, triggerRenewalReminder } from './actions'
import { Lead360Drawer } from './Lead360Drawer'
import { COMPLIANCE_KINDS, COMPLIANCE_LABELS, type RenewalForecast, type RenewalRow, type RenewalStats } from './pipeline-types'
import { formatCountdown, formatCurrency, urgencyLabel, urgencyTone } from './format'
import type { RenewalUrgency } from './types'

const URGENCY_FILTERS: Array<{ id: 'all' | RenewalUrgency | 'unknown'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'expired', label: 'Expired' },
  { id: 'critical', label: 'Critical (<7d)' },
  { id: 'warning', label: 'Warning (<30d)' },
  { id: 'upcoming', label: 'Upcoming (<60d)' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'unknown', label: 'No dates' },
]

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: 'default' | 'danger' | 'warning' | 'gold' | 'success'
}) {
  const border =
    tone === 'danger'
      ? 'border-[var(--danger-border)] bg-[var(--danger-lt)]'
      : tone === 'warning'
        ? 'border-[rgba(217,119,6,0.25)] bg-[var(--gold-lt)]'
        : tone === 'gold'
          ? 'border-[var(--gold)]/25 bg-[var(--gold-lt)]'
          : tone === 'success'
            ? 'border-[var(--green-border)] bg-[var(--green-lt)]'
            : 'border-[var(--border)] bg-white'

  return (
    <div className={`rounded-xl border px-4 py-3 ${border}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{hint}</p>
    </div>
  )
}

export function RenewalLedger({
  rows,
  stats,
  forecast,
  error,
}: {
  rows: RenewalRow[]
  stats: RenewalStats
  forecast: RenewalForecast[]
  error: string | null
}) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [urgency, setUrgency] = useState<'all' | RenewalUrgency | 'unknown'>('all')
  const [jurisdiction, setJurisdiction] = useState('all')
  const [desk, setDesk] = useState('all')
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)

  const jurisdictions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.jurisdiction).filter((value): value is string => Boolean(value)))),
    [rows]
  )
  const desks = useMemo(
    () => Array.from(new Set(rows.map((row) => row.desk).filter((value): value is string => Boolean(value)))),
    [rows]
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (urgency !== 'all' && row.urgency !== urgency) return false
      if (jurisdiction !== 'all' && row.jurisdiction !== jurisdiction) return false
      if (desk !== 'all' && row.desk !== desk) return false
      if (!needle) return true
      return [row.companyName, row.licenseNumber, row.contactName, row.email, row.phone, row.jurisdiction]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [rows, search, urgency, jurisdiction, desk])

  function refresh() {
    startTransition(() => router.refresh())
  }

  function runSweep() {
    startTransition(async () => {
      const result = await runRenewalSweep()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      router.refresh()
    })
  }

  function dispatchReminder(row: RenewalRow, tier: '60d' | '30d' | '7d') {
    setBusyKey(`${row.id}-${tier}`)
    startTransition(async () => {
      const result = await triggerRenewalReminder(row.contactId, tier)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      setBusyKey(null)
      router.refresh()
    })
  }

  function renew(row: RenewalRow) {
    setBusyKey(`${row.id}-renew`)
    startTransition(async () => {
      const result = await renewTradeLicense(row.contactId)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      setBusyKey(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Tracked entities"
          value={String(stats.total)}
          hint={`${stats.noDates} missing compliance dates`}
          tone="default"
        />
        <StatTile
          label="Critical / expired"
          value={String(stats.critical + stats.expired)}
          hint="Inside the 7-day window"
          tone="danger"
        />
        <StatTile label="Due within 30d" value={String(stats.warning)} hint="Renewal outreach window" tone="warning" />
        <StatTile label="Due within 60d" value={String(stats.upcoming)} hint="Reminder ladder armed" tone="gold" />
        <StatTile
          label="Annual recurring"
          value={formatCurrency(stats.totalARR, stats.currency)}
          hint="Retainer value under management"
          tone="success"
        />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
              <BellRing className="h-4 w-4 text-[var(--accent)]" />
              60 / 30 / 7-day alert ladder
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Reminders are enqueued on the durable outbox so WhatsApp and email delivery stay retryable. Each
              contact and tier is idempotent, so a repeat sweep never double-sends.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge size="sm" variant={stats.dueAlerts.d60 > 0 ? 'warning' : 'default'}>
                60d due: {stats.dueAlerts.d60}
              </Badge>
              <Badge size="sm" variant={stats.dueAlerts.d30 > 0 ? 'warning' : 'default'}>
                30d due: {stats.dueAlerts.d30}
              </Badge>
              <Badge size="sm" variant={stats.dueAlerts.d7 > 0 ? 'danger' : 'default'}>
                7d due: {stats.dueAlerts.d7}
              </Badge>
            </div>
          </div>
          <Button size="sm" onClick={runSweep} disabled={isPending}>
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            Run alert sweep
          </Button>
        </div>

        {forecast.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 lg:grid-cols-4">
            {forecast.map((quarter) => (
              <div key={quarter.quarter} className="rounded-lg border border-[var(--border)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  {quarter.quarter}
                </p>
                <p className="mt-0.5 text-sm font-black text-[var(--text)]">{quarter.count} renewals</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {formatCurrency(quarter.value, stats.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-lt)] px-4 py-3 text-xs text-[var(--danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">{error}</p>
            <p className="mt-0.5 text-[var(--text-secondary)]">
              The ledger is showing an empty state until the connection is restored.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, license number, contact..."
            aria-label="Search renewals"
            className="w-full rounded-full border border-[var(--border)] bg-white py-2 pl-9 pr-3 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <select
          aria-label="Filter by health"
          value={urgency}
          onChange={(event) => setUrgency(event.target.value as 'all' | RenewalUrgency | 'unknown')}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          {URGENCY_FILTERS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by jurisdiction"
          value={jurisdiction}
          onChange={(event) => setJurisdiction(event.target.value)}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <option value="all">All jurisdictions</option>
          {jurisdictions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by desk"
          value={desk}
          onChange={(event) => setDesk(event.target.value)}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <option value="all">All desks</option>
          {desks.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <Button variant="secondary" size="sm" onClick={refresh} disabled={isPending}>
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={rows.length === 0 ? 'No entities in the renewal ledger' : 'No records match these filters'}
          description={
            rows.length === 0
              ? 'Add trade license and compliance dates from the 360-degree lead drawer and they will appear here with live countdowns.'
              : 'Clear the search box or widen the health and jurisdiction filters.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Entity
                </th>
                {COMPLIANCE_KINDS.map((kind) => (
                  <th
                    key={kind}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
                  >
                    {COMPLIANCE_LABELS[kind]}
                  </th>
                ))}
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Health
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Annual fee
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)]">
                  <td className="max-w-[240px] px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenLeadId(row.contactId)}
                      className="block max-w-full text-left"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] hover:underline">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
                        <span className="truncate">{row.companyName}</span>
                      </span>
                    </button>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--text-tertiary)]">
                      {row.licenseNumber ? (
                        <span className="font-mono">{row.licenseNumber}</span>
                      ) : (
                        'No license number'
                      )}
                      {row.jurisdiction ? ` - ${row.jurisdiction}` : ''}
                    </p>
                  </td>

                  {COMPLIANCE_KINDS.map((kind) => {
                    const days = row.daysRemaining[kind]
                    const tone =
                      days === null
                        ? 'default'
                        : days < 7
                          ? 'danger'
                          : days < 30
                            ? 'warning'
                            : days < 60
                              ? 'gold'
                              : 'success'
                    return (
                      <td key={kind} className="px-3 py-2.5">
                        <Badge size="sm" variant={tone}>
                          {formatCountdown(days)}
                        </Badge>
                        <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                          {row.deadlines[kind] ?? 'Not set'}
                        </p>
                      </td>
                    )
                  })}

                  <td className="px-3 py-2.5">
                    <Badge size="sm" variant={urgencyTone(row.urgency)} dot>
                      {urgencyLabel(row.urgency)}
                    </Badge>
                    <p className="mt-0.5 text-[10px] capitalize text-[var(--text-tertiary)]">
                      {row.status.replace(/_/g, ' ')}
                    </p>
                  </td>

                  <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums text-[var(--text)]">
                    {formatCurrency(row.annualFee, row.currency)}
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {(['60d', '30d', '7d'] as const).map((tier) => {
                        const sent =
                          tier === '60d' ? row.remindersSent.d60 : tier === '30d' ? row.remindersSent.d30 : row.remindersSent.d7
                        return (
                          <button
                            key={tier}
                            type="button"
                            disabled={isPending || busyKey === `${row.id}-${tier}`}
                            onClick={() => dispatchReminder(row, tier)}
                            title={sent ? `${tier} reminder already dispatched` : `Dispatch ${tier} reminder`}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors disabled:opacity-60 ${
                              sent
                                ? 'border-[var(--green-border)] bg-[var(--green-lt)] text-[var(--green-dk)]'
                                : 'border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                            }`}
                          >
                            {sent ? <CheckCircle2 className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
                            {tier}
                          </button>
                        )
                      })}
                      <Button
                        size="xs"
                        variant="secondary"
                        disabled={isPending || busyKey === `${row.id}-renew`}
                        onClick={() => renew(row)}
                      >
                        <ShieldCheck className="h-3 w-3" /> Renew
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openLeadId && (
        <Lead360Drawer
          leadId={openLeadId}
          open
          initialTab="note"
          onClose={() => setOpenLeadId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  )
}
