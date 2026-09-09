'use client'

import type { ReactNode } from 'react'
import { Eyebrow } from './Section'

export type QuizShellProps = {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}

/** Shared two-column quiz/calculator layout (copy left, interactive card right) — extracted so
 * each of the 15 lead-magnet blocks doesn't re-duplicate this grid, matching JurisdictionQuiz's
 * original inline layout. */
export function QuizShell({ eyebrow, title, description, children }: QuizShellProps) {
  return (
    <section className="section" id="lead-magnet">
      <div className="wrap grid-2-split">
        <div className="reveal">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="card reveal">{children}</div>
      </div>
    </section>
  )
}

export type ProgressBarProps = {
  step: number
  totalSteps: number
  label?: string
}

export function ProgressBar({ step, totalSteps, label }: ProgressBarProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
          fontSize: 13,
          color: 'var(--text-tertiary)',
        }}
      >
        <span>{label}</span>
        <span>
          Step {step} of {totalSteps}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            height: '100%',
            width: `${(step / totalSteps) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width .2s ease',
          }}
        />
      </div>
    </>
  )
}

export type QuizBackButtonProps = {
  onClick: () => void
  label?: string
}

export function QuizBackButton({ onClick, label = '← Back' }: QuizBackButtonProps) {
  return (
    <button onClick={onClick} type="button" className="quiz-back-btn">
      {label}
    </button>
  )
}

export type QuizOptionButtonProps = {
  onClick: () => void
  children: ReactNode
  selected?: boolean
  className?: string
}

export function QuizOptionButton({ onClick, children, selected, className = '' }: QuizOptionButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`quiz-option-btn ${selected ? 'selected' : ''} ${className}`.trim()}
    >
      {children}
    </button>
  )
}
