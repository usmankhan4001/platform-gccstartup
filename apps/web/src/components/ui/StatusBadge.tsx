import { ReactNode } from 'react'
export function StatusBadge({ variant, tone, children }: { variant?: string; tone?: string; children: ReactNode }) {
  const v = variant || tone
  return (
    <span className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', v === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' : v === 'warning' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' : v === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : v === 'outline' ? 'border border-[var(--border)] text-[var(--text)]' : 'bg-primary/10 text-primary'].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}