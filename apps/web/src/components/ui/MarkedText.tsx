import { Fragment, type ReactNode } from 'react'

/**
 * Draws the Babun hand-drawn underline under one phrase inside a headline.
 *
 * Editors pick the phrase with a plain text field rather than writing markup, so a
 * headline stays a headline in the CMS — no HTML in content fields, nothing to
 * sanitise, and a typo in the highlight just means no underline rather than broken
 * output. See `.mark` in components.css for the stroke itself.
 *
 * Matching is case-insensitive and marks every occurrence, which is almost always
 * one. An empty or unmatched `highlight` renders the text untouched.
 */
export function MarkedText({ text, highlight }: { text: string; highlight?: string }): ReactNode {
  const needle = highlight?.trim()
  if (!needle) return text

  // Escape the needle so a highlight containing regex punctuation (a "." or "0%")
  // matches literally instead of blowing up or matching the wrong span.
  const pattern = new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(pattern)
  if (parts.length === 1) return text

  return parts.map((part, i) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <span className="mark" key={i}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
