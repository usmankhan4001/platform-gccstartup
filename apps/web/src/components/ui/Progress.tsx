export function Progress({ value, className }: { value: number; className?: string }) {
  const width = `${Math.min(100, Math.max(0, value))}%`
  return (
    <div className={['h-2 rounded bg-[var(--border)] overflow-hidden', className].filter(Boolean).join(' ')}>
      <div className="h-full bg-primary transition-all" style={{ width }} />
    </div>
  )
}