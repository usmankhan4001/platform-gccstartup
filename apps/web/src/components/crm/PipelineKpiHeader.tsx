'use client'

import { CalendarClock, CircleDollarSign, Target, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'
import type { PipelineKpis } from './pipeline-types'
import { formatCurrency } from './format'

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
  iconColor,
  children,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-black tabular-nums text-[var(--text)] tracking-tight">{value}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-[var(--text-secondary)]">{hint}</p>
        </div>
        <span
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}
          aria-hidden="true"
        >
          <Icon className={cn('h-4.5 w-4.5', iconColor)} />
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
        iconBg="bg-orange-50 border border-orange-200/70"
        iconColor="text-[var(--orange)]"
      />

      <KpiTile
        label="Weighted forecast"
        value={formatCurrency(kpis.weightedForecast, kpis.currency)}
        hint="Value x stage probability"
        icon={TrendingUp}
        iconBg="bg-blue-50 border border-blue-200/70"
        iconColor="text-[#1B4FD8]"
      />

      <KpiTile
        label="Avg deal cycle"
        value={kpis.averageDealCycleDays > 0 ? `${kpis.averageDealCycleDays}d` : 'No data'}
        hint={
          kpis.averageDealCycleDays > 0
            ? 'Mean days to close'
            : 'Closes a deal to start measuring'
        }
        icon={CalendarClock}
        iconBg="bg-emerald-50 border border-emerald-200/70"
        iconColor="text-emerald-600"
      />

      <KpiTile
        label="Win rate"
        value={decided > 0 ? `${kpis.winRate}%` : 'No data'}
        hint={decided > 0 ? `${kpis.wonDeals} won / ${kpis.lostDeals} lost` : 'No closed deals recorded'}
        icon={Target}
        iconBg="bg-amber-50 border border-amber-200/70"
        iconColor="text-amber-600"
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
