/** One featured testimonial as a contained dark card — not a full-bleed section, not
 * one tile among an equal-weight grid. Paired with a real proof-metric badge. */
export function QuotePhotoCard({
  quote,
  cite,
  statValue,
  statLabel,
}: {
  quote: string
  cite: string
  statValue: string
  statLabel: string
}) {
  return (
    <div className="quote-photo-card reveal">
      <div className="quote-photo-stat">
        <div className="quote-photo-stat-n">{statValue}</div>
        <div className="quote-photo-stat-l">{statLabel}</div>
      </div>
      <div>
        <blockquote>&ldquo;{quote}&rdquo;</blockquote>
        <cite>— {cite}</cite>
      </div>
    </div>
  )
}
