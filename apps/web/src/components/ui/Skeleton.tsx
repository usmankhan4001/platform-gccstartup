export function Skeleton({ className }: { className?: string }) { return <div className={['animate-pulse rounded bg-[var(--border)]', className].filter(Boolean).join(' ')} /> }
