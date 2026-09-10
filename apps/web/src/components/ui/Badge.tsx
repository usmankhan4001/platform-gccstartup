import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * `tone` is the original public-site API and stays supported; `variant` is the
 * fuller platform set. When both are passed, `variant` wins.
 */
export type BadgeTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'destructive' | 'gold' | 'default'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-[5px] text-xs font-bold tracking-[0.03em] whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)]',
        accent:
          'border-[rgba(242,101,34,0.2)] bg-[var(--orange-lt)] text-[var(--orange-dk)]',
        success: 'border-[var(--green-border)] bg-[var(--green-lt)] text-[var(--green-dk)]',
        warning: 'border-[rgba(217,119,6,0.25)] bg-[var(--gold-lt)] text-[var(--gold-dk)]',
        destructive: 'border-[var(--danger-border)] bg-[var(--danger-lt)] text-[var(--danger)]',
        danger: 'border-[var(--danger-border)] bg-[var(--danger-lt)] text-[var(--danger)]',
        gold: 'border-[var(--gold)] bg-[var(--gold)] text-white',
        info: 'border-[rgba(27,79,216,0.15)] bg-[var(--blue-lt)] text-[var(--blue-dk)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-3 py-[5px] text-xs',
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
