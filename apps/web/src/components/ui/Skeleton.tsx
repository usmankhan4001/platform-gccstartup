import { cn } from '@/lib/utils'

export interface SkeletonProps {
  width?: number | string
  height?: number | string
  /** Render a stack of shimmering lines instead of a single block. */
  lines?: number
  variant?: 'rounded' | 'circle' | 'text'
  className?: string
}

function toSize(value?: number | string, fallback?: string) {
  if (value === undefined) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

export function Skeleton({ width, height, lines, variant, className }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn('animate-pulse rounded bg-[var(--border)]', className)}
            style={{
              height: toSize(height, '12px'),
              width: i === lines - 1 && !width ? '70%' : toSize(width, '100%'),
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-[var(--border)]',
        variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg',
        className
      )}
      style={{
        width: toSize(width, '100%'),
        height: toSize(height, '12px'),
      }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-[var(--border)]', className)}
    />
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return <SkeletonCard className={cn('h-48', className)} />
}

export function SkeletonConversation({ className }: { className?: string }) {
  return <SkeletonCard className={cn('h-16', className)} />
}

/** Table-shaped placeholder: header row plus `rows` body rows. */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton height={32} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={44} />
      ))}
    </div>
  )
}

export default SkeletonCard
