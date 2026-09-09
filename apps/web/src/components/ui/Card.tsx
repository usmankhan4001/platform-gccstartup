import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  featured,
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { featured?: boolean; children?: ReactNode }) {
  return (
    <div className={['card', featured ? 'card-featured' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={['card-header', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
  return (
    <h3 className={['card-title', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </h3>
  )
}

export function CardDescription({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { children?: ReactNode }) {
  return (
    <p className={['card-description text-sm text-[var(--text-secondary)]', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </p>
  )
}

export function CardContent({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={['card-content', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export function CardFooter({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={['card-footer', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}
