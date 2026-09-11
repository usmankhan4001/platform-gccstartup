import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Variant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'danger'
  | 'gold'
  | 'wa'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'default' | 'lg' | 'icon' | string

export type StyleProps = {
  variant?: Variant
  size?: ButtonSize
  /** Reserve for at most one high-intent CTA per page — DESIGN.md §8. */
  shimmer?: boolean
  className?: string
}

export type CommonProps = StyleProps & { children?: ReactNode }

/**
 * Base geometry mirrors the `.btn` rule in `styles/components.css` (17px type,
 * 15px/32px padding, pill radius) so public-site CTAs keep their established
 * scale. Sizes are applied here rather than through `btn-*` classes because
 * those never existed in the stylesheet — `size="sm"` used to be a no-op.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-[#0A142F] text-white hover:bg-slate-800 shadow-2xs active:scale-[0.98]',
        accent: 'bg-[var(--orange)] text-white hover:bg-[var(--orange-dk)] shadow-xs active:scale-[0.98]',
        secondary:
          'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:scale-[0.98]',
        outline:
          'border border-slate-200 bg-transparent text-slate-800 hover:bg-slate-100 active:scale-[0.98]',
        ghost:
          'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs active:scale-[0.98]',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs active:scale-[0.98]',
        gold: 'bg-amber-600 text-white hover:bg-amber-700 shadow-2xs active:scale-[0.98]',
        wa: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs active:scale-[0.98]',
      },
      size: {
        xs: 'h-7 px-2.5 text-[11px] rounded-md',
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-9 px-4 text-xs rounded-lg',
        default: 'h-8.5 px-3.5 text-xs rounded-lg',
        lg: 'h-10 px-5 text-sm rounded-lg',
        icon: 'h-8.5 w-8.5 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

type ResolvedVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
type ResolvedSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

const VARIANT_KEYS: ResolvedVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'danger',
  'gold',
  'wa',
]

const SIZE_KEYS: ResolvedSize[] = ['xs', 'sm', 'md', 'default', 'lg', 'icon']

/** Unknown values fall back to the defaults instead of rendering unstyled. */
function resolveVariant(variant?: string): ResolvedVariant {
  return variant && VARIANT_KEYS.includes(variant as ResolvedVariant)
    ? (variant as ResolvedVariant)
    : 'primary'
}

function resolveSize(size?: string): ResolvedSize {
  return size && SIZE_KEYS.includes(size as ResolvedSize) ? (size as ResolvedSize) : 'default'
}

function classes({ variant, size, shimmer, className }: StyleProps) {
  return cn(
    buttonVariants({ variant: resolveVariant(variant), size: resolveSize(size) }),
    shimmer && 'btn-shimmer',
    className
  )
}

export function Button({
  variant,
  size,
  shimmer,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes({ variant, size, shimmer, className })} {...rest}>
      {children}
    </button>
  )
}

import Link from 'next/link'

export function ButtonLink({
  variant,
  size,
  shimmer,
  className,
  children,
  href = '#',
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = typeof href === 'string' && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))
  const combinedClassName = classes({ variant, size, shimmer, className })

  if (isExternal) {
    return (
      <a href={href} className={combinedClassName} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={combinedClassName} {...(rest as any)}>
      {children}
    </Link>
  )
}

/** Exposed so links and custom triggers can borrow the exact button styling. */
export { buttonVariants }
