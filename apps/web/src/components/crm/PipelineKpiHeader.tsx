'use client'

import { CalendarClock, CircleDollarSign, Target, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import type { PipelineKpis } from './pipeline-types'
import { formatCurrency } from './format'

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  children,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-black tabular-nums text-[var(--text)]">{value}</p>
          <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">{hint}</p>
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      {children}
    </div>
  )
}

export function PipelineKpiHeader({ kpis }: { kpis: PipelineKpis }) {
  const decided = kpis.wonDeals + kpis.lostDeals

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        label="Active pipeline"
        value={formatCurrency(kpis.activePipelineValue, kpis.currency)}
        hint={`${kpis.openDeals} open deal${kpis.openDeals === 1 ? '' : 's'} in flight`}
        icon={CircleDollarSign}
        accent="rgba(242, 101, 34, 0.12)"
      />

      <KpiTile
        label="Weighted forecast"
        value={formatCurrency(kpis.weightedForecast, kpis.currency)}
        hint="Value x stage close probability"
        icon={TrendingUp}
        accent="rgba(27, 79, 216, 0.12)"
      />

      <KpiTile
        label="Avg deal cycle"
        value={kpis.averageDealCycleDays > 0 ? `${kpis.averageDealCycleDays}d` : 'No data'}
        hint={
          kpis.averageDealCycleDays > 0
            ? 'Mean days from creation to close'
            : 'Closes a deal to start measuring cycle time'
        }
        icon={CalendarClock}
        accent="rgba(16, 185, 129, 0.12)"
      />

      <KpiTile
        label="Win rate"
        value={decided > 0 ? `${kpis.winRate}%` : 'No data'}
        hint={decided > 0 ? `${kpis.wonDeals} won / ${kpis.lostDeals} lost` : 'No closed deals recorded yet'}
        icon={Target}
        accent="rgba(217, 119, 6, 0.12)"
      >
        <Progress
          className="mt-3"
          value={kpis.winRate}
          tone={kpis.winRate >= 50 ? 'success' : kpis.winRate >= 25 ? 'warning' : 'danger'}
          label={`Win rate ${kpis.winRate} percent`}
        />
      </KpiTile>
    </div>
  )
}
