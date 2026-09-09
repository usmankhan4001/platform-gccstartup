import type { HTMLAttributes, ReactNode } from 'react'

type Tone = 'accent' | 'info' | 'success'

export function Badge({
  tone = 'accent',
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <span className={['badge', `badge-${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  )
}
