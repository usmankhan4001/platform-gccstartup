import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

export type Variant = 'primary' | 'outline' | 'danger' | 'ghost' | 'secondary' | 'wa'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xs' | string

export type StyleProps = {
  variant?: Variant
  size?: ButtonSize
  /** Reserve for at most one high-intent CTA per page — DESIGN.md §8. */
  shimmer?: boolean
  className?: string
}

export type CommonProps = StyleProps & { children?: ReactNode }

const VARIANT_CLASS: Record<string, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  secondary: 'btn-secondary',
  wa: 'btn-wa',
}

const SIZE_CLASS: Record<string, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

function classes({ variant = 'primary', size, shimmer, className = '' }: StyleProps) {
  return [
    'btn',
    VARIANT_CLASS[variant] || 'btn-primary',
    size && (SIZE_CLASS[size] || `btn-${size}`),
    shimmer ? 'btn-shimmer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
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
