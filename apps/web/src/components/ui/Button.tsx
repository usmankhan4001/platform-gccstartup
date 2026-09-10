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
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-transparent text-center font-bold leading-[1.2] no-underline transition-colors duration-300 focus-visible:outline-[2px_solid_var(--accent)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[var(--border)] disabled:text-[var(--text-tertiary)] disabled:shadow-none',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--accent)] text-white hover:bg-[var(--navy)] active:bg-[var(--orange-dk)]',
        secondary:
          'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]',
        outline:
          'border-[var(--navy)] bg-transparent text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white',
        ghost:
          'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
        destructive: 'bg-[var(--danger)] text-white hover:bg-[#B91C1C]',
        danger: 'bg-[var(--danger)] text-white hover:bg-[#B91C1C]',
        gold: 'bg-[var(--gold)] text-white hover:bg-[var(--gold-dk)]',
        wa: 'bg-[var(--whatsapp)] text-white hover:bg-[#1DA851]',
      },
      size: {
        xs: 'px-3 py-1 text-[11px]',
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-8 py-[15px] text-[17px]',
        default: 'px-8 py-[15px] text-[17px]',
        lg: 'px-10 py-4 text-lg',
        icon: 'h-9 w-9 p-0 text-sm',
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

export function ButtonLink({
  variant,
  size,
  shimmer,
  className,
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes({ variant, size, shimmer, className })} {...rest}>
      {children}
    </a>
  )
}

/** Exposed so links and custom triggers can borrow the exact button styling. */
export { buttonVariants }
