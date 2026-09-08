export function StatusBadge({ status, label }: { status: 'success' | 'warning' | 'error' | 'info'; label: string }) {
  const colors = { success: 'bg-[var(--success)]/10 text-[var(--success)]', warning: 'bg-[var(--warning)]/10 text-[var(--warning)]', error: 'bg-[var(--danger)]/10 text-[var(--danger)]', info: 'bg-primary/10 text-primary' }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>{label}</span>
}