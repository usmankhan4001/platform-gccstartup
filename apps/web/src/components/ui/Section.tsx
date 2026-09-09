import type { HTMLAttributes, ReactNode } from 'react'

export function Section({
  alt,
  narrow,
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { alt?: boolean; narrow?: boolean; children: ReactNode }) {
  return (
    <section className={['section', alt ? 'section-alt' : '', className].filter(Boolean).join(' ')} {...rest}>
      <div className={narrow ? 'wrap-narrow' : 'wrap'}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>
}
