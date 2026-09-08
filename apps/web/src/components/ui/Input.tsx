import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || props.name
    const input = <input ref={ref} id={inputId} className={cn('flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50', className)} {...props} />
    if (label) return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}><label htmlFor={inputId} style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>{input}</div>
    return input
  },
)

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || props.name
    const textarea = <textarea ref={ref} id={inputId} className={cn('flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50', className)} {...props} />
    if (label) return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}><label htmlFor={inputId} style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>{textarea}</div>
    return textarea
  },
)

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const inputId = id || props.name
    const select = <select ref={ref} id={inputId} className={cn('flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50', className)} {...props}>{children}</select>
    if (label) return <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}><label htmlFor={inputId} style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>{select}</div>
    return select
  },
)