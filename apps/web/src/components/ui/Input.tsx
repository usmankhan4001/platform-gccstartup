import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, invalid, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        id={id}
        ref={ref}
        aria-invalid={invalid ? 'true' : undefined}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-800 disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-rose-500 focus-visible:ring-rose-500',
          className
        )}
        {...props}
      />
    )

    if (label) {
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          {inputElement}
        </div>
      )
    }

    return inputElement
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  invalid?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, invalid, ...props }, ref) => {
    const textareaElement = (
      <textarea
        id={id}
        ref={ref}
        aria-invalid={invalid ? 'true' : undefined}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-800 disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-rose-500 focus-visible:ring-rose-500',
          className
        )}
        {...props}
      />
    )

    if (label) {
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          {textareaElement}
        </div>
      )
    }

    return textareaElement
  }
)
Textarea.displayName = 'Textarea'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  invalid?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, invalid, children, ...props }, ref) => {
    const selectElement = (
      <select
        id={id}
        ref={ref}
        aria-invalid={invalid ? 'true' : undefined}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition-colors focus-visible:outline-none focus-visible:border-slate-800 focus-visible:ring-1 focus-visible:ring-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          invalid && 'border-rose-500 focus-visible:ring-rose-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )

    if (label) {
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          {selectElement}
        </div>
      )
    }

    return selectElement
  }
)
Select.displayName = 'Select'

