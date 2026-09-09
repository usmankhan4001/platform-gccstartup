import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  href?: string
  shimmer?: boolean
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  href: string
  shimmer?: boolean
}

const buttonVariantClasses = (variant: string = 'primary', size: string = 'md', shimmer?: boolean) =>
  cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer',
    variant === 'primary' && 'bg-primary text-white hover:bg-primary-hover',
    variant === 'secondary' && 'bg-[var(--bg-secondary)] text-[var(--text)] hover:bg-[var(--border)]',
    variant === 'ghost' && 'text-[var(--text-secondary)] hover:text-[var(--text)]',
    variant === 'danger' && 'bg-danger text-white hover:opacity-90',
    variant === 'outline' && 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-secondary)]',
    size === 'xs' && 'px-2 py-1 text-xs',
    size === 'sm' && 'px-2.5 py-1.5 text-xs',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    shimmer && 'animate-shimmer',
  )

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', shimmer, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariantClasses(variant, size, shimmer), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export function ButtonLink({ className, variant = 'primary', size = 'md', shimmer, href, children, ...props }: ButtonLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
  const classes = cn(buttonVariantClasses(variant, size, shimmer), className)
  if (isExternal) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link
      href={href}
      className={classes}
      {...props}
    >
      {children}
    </Link>
  )
}