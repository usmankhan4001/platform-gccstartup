'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export type ProgressTone = 'accent' | 'blue' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<ProgressTone, string> = {
  accent: 'bg-[var(--orange)]',
  blue: 'bg-[var(--blue)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger: 'bg-[var(--danger)]',
}

const SIZE_CLASS = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3',
} as const

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Completion percentage, 0–100 unless `max` is provided. */
  value?: number | null
  max?: number
  tone?: ProgressTone
  size?: keyof typeof SIZE_CLASS
  /** Classes for the filled bar (e.g. a gradient). */
  indicatorClassName?: string
  /** Announce progress to screen readers with a meaningful label. */
  label?: string
}

export function Progress({
  value,
  max = 100,
  tone = 'accent',
  size = 'default',
  indicatorClassName,
  label,
  className,
  ...rest
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100
  const raw = typeof value === 'number' && Number.isFinite(value) ? value : 0
  const pct = Math.min(100, Math.max(0, (raw / safeMax) * 100))

  return (
    <ProgressPrimitive.Root
      value={pct}
      aria-label={label}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-[var(--border)]',
        SIZE_CLASS[size] ?? SIZE_CLASS.default,
        className
      )}
      {...rest}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 rounded-full transition-transform duration-300 ease-out',
          TONE_CLASS[tone] ?? TONE_CLASS.accent,
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export default Progress
