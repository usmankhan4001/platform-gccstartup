/** Real flag graphics (flagcdn.com — free, no API key) instead of emoji flags, which
 * render inconsistently across platforms and read as unpolished on a corporate site. */
const SIZES = { sm: 18, md: 24, lg: 32 } as const

export function Flag({ code, size = 'md', className }: { code?: string | null; size?: keyof typeof SIZES; className?: string }) {
  const px = SIZES[size]
  // Content-editable field (e.g. a Puck jurisdiction item saved without a flag code) —
  // render an empty placeholder circle rather than crashing the whole page on `undefined`.
  if (!code) {
    return (
      <span
        aria-hidden
        className={className}
        style={{ width: px, height: px, borderRadius: '50%', border: '1px solid var(--border)', display: 'inline-block', flexShrink: 0 }}
      />
    )
  }
  return (
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      width={px}
      height={px}
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid var(--border)',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}
