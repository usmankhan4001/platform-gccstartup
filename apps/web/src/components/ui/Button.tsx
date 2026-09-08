import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  href?: string
  shimmer?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', shimmer, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
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
        className,
      )}
      {...props}
    />
  ),
)

export function ButtonLink({ href, ...props }: ButtonProps) {
  if (!href) return <Button {...props} />
  return <a href={href}><Button {...props} /></a>
}