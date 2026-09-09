import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldWrapperProps = { label?: string; htmlFor: string; children: ReactNode }

function FieldWrapper({ label, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  )
}

export function Input({
  label,
  id,
  invalid,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; invalid?: boolean }) {
  return (
    <FieldWrapper label={label} htmlFor={id ?? rest.name ?? ''}>
      <input id={id ?? rest.name} className={[invalid ? 'invalid' : '', className].filter(Boolean).join(' ')} aria-invalid={invalid ? 'true' : undefined} {...rest} />
    </FieldWrapper>
  )
}

export function Textarea({
  label,
  id,
  invalid,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; invalid?: boolean }) {
  return (
    <FieldWrapper label={label} htmlFor={id ?? rest.name ?? ''}>
      <textarea id={id ?? rest.name} className={[invalid ? 'invalid' : '', className].filter(Boolean).join(' ')} aria-invalid={invalid ? 'true' : undefined} {...rest} />
    </FieldWrapper>
  )
}

export function Select({
  label,
  id,
  invalid,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; invalid?: boolean; children: ReactNode }) {
  return (
    <FieldWrapper label={label} htmlFor={id ?? rest.name ?? ''}>
      <select id={id ?? rest.name} className={[invalid ? 'invalid' : '', className].filter(Boolean).join(' ')} aria-invalid={invalid ? 'true' : undefined} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  )
}
