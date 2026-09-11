import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: 'default' | 'danger' | 'warning' | 'gold' | 'success' | 'info'
}

export function Stat({ label, value, hint, icon: Icon, tone = 'default', className, ...props }: StatProps) {
  const toneClasses = {
    default: 'border-border bg-white text-text',
    danger: 'border-danger-border bg-danger-lt text-danger',
    warning: 'border-[rgba(217,119,6,0.25)] bg-gold-lt text-warning',
    gold: 'border-gold/25 bg-gold-lt text-gold-dk',
    success: 'border-green-border bg-green-lt text-success',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }

  return (
    <div className={cn('rounded-xl border px-4 py-3 shadow-xs transition-all', toneClasses[tone], className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary opacity-90">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-70 shrink-0 mt-0.5" />}
      </div>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] opacity-75">{hint}</p>}
    </div>
  )
}
