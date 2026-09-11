import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * `tone` is the original public-site API and stays supported; `variant` is the
 * fuller platform set. When both are passed, `variant` wins.
 */
export type BadgeTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'destructive' | 'gold' | 'default'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-normal whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        default: 'border-slate-200 bg-slate-100/80 text-slate-700',
        accent:
          'border-orange-200/70 bg-orange-50 text-orange-700',
        success: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200/70 bg-amber-50 text-amber-800',
        destructive: 'border-rose-200/70 bg-rose-50 text-rose-700',
        danger: 'border-rose-200/70 bg-rose-50 text-rose-700',
        gold: 'border-amber-300 bg-amber-100 text-amber-900',
        info: 'border-blue-200/70 bg-blue-50 text-blue-700',
      },
      size: {
        sm: 'px-1.5 py-0 text-[9px] rounded',
        default: 'px-2 py-0.5 text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ResolvedVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>
type ResolvedSize = NonNullable<VariantProps<typeof badgeVariants>['size']>

const VARIANT_KEYS: ResolvedVariant[] = [
  'default',
  'accent',
  'success',
  'warning',
  'destructive',
  'danger',
  'gold',
  'info',
]

const SIZE_KEYS: ResolvedSize[] = ['sm', 'default']

function resolveVariant(value?: string): ResolvedVariant {
  return value && VARIANT_KEYS.includes(value as ResolvedVariant)
    ? (value as ResolvedVariant)
    : 'default'
}

function resolveSize(value?: string): ResolvedSize {
  return value && SIZE_KEYS.includes(value as ResolvedSize) ? (value as ResolvedSize) : 'default'
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Legacy public-site API. Maps onto the matching variant. */
  tone?: BadgeTone
  variant?: BadgeTone
  size?: 'sm' | 'default' | string
  /** Small leading dot, useful for live/health states. */
  dot?: boolean
  children?: ReactNode
}

export function Badge({
  tone,
  variant,
  size,
  dot,
  className,
  children,
  ...rest
}: BadgeProps) {
  const resolved = resolveVariant(variant ?? tone)

  return (
    <span
      className={cn(badgeVariants({ variant: resolved, size: resolveSize(size) }), className)}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            resolved === 'success' && 'bg-[var(--success)]',
            resolved === 'warning' && 'bg-[var(--warning)]',
            (resolved === 'destructive' || resolved === 'danger') && 'bg-[var(--danger)]',
            resolved === 'accent' && 'bg-[var(--orange)]',
            resolved === 'info' && 'bg-[var(--blue)]',
            resolved === 'gold' && 'bg-white',
            resolved === 'default' && 'bg-[var(--text-tertiary)]'
          )}
        />
      )}
      {children}
    </span>
  )
}

export { badgeVariants }
