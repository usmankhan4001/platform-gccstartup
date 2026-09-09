'use client'

import type { ReactNode } from 'react'
import { ButtonLink } from './Button'
import { Badge } from './Badge'

export type ResultCardProps = {
  headline: string
  subheadline?: string
  tags?: string[]
  ctaHref?: string
  ctaLabel?: string
  onRestart?: () => void
  children?: ReactNode
}

/** Shared personalized-result shell shown after GateForm succeeds — each lead-magnet tool
 * renders its own computed content into `children` (a table, a number, a route recommendation)
 * rather than re-implementing this card chrome per tool. */
export function ResultCard({ headline, subheadline, tags, ctaHref = '#lead-magnet', ctaLabel = 'Get started', onRestart, children }: ResultCardProps) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{headline}</div>
      {subheadline && <div style={{ color: 'var(--accent)', fontSize: 14, marginTop: 4 }}>{subheadline}</div>}
      {children && <div style={{ marginTop: 'var(--space-4)' }}>{children}</div>}
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
          {tags.map((tag) => (
            <Badge key={tag} tone="info">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center', marginTop: 'var(--space-6)' }}>
        <ButtonLink href={ctaHref}>{ctaLabel}</ButtonLink>
        {onRestart && (
          <button
            onClick={onRestart}
            style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 14, padding: '14px 20px' }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
