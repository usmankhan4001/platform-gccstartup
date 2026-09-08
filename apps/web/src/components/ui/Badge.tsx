import { ReactNode } from 'react'

export function Badge({ children, variant }: { children: ReactNode; variant?: string }) {
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variant === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' : variant === 'warning' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' : variant === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-primary/10 text-primary'].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}

export function StatusBadge({ variant, children }: { variant?: string; children: ReactNode }) {
  return <Badge variant={variant}>{children}</Badge>
}