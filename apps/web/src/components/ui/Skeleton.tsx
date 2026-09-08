export function Skeleton({ width, height, lines, variant, className }: {
  width?: number;
  height?: number;
  lines?: number;
  variant?: 'rounded' | 'circle';
  className?: string;
}) {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-[var(--border)]"
            style={{ height: height || 12, width: width ? `${width}px` : '100%' }}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={['animate-pulse', variant === 'rounded' ? 'rounded-lg' : 'rounded', className || ''].filter(Boolean).join(' ')}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 12,
      }}
    />
  );
}

export default function SkeletonCard({ className }: { className?: string }) {
  return <div className={['animate-pulse rounded bg-[var(--border)]', className].filter(Boolean).join(' ')} />;
}

export function SkeletonChart() {
  return <div className="animate-pulse rounded-lg bg-[var(--border)] h-48" />;
}

export function SkeletonConversation() {
  return <div className="animate-pulse rounded-lg bg-[var(--border)] h-16" />;
}