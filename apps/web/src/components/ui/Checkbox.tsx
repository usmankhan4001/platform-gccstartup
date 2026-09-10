'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded border border-[var(--border-hover)] bg-white shadow-2xs transition-colors',
      'focus-visible:outline-[2px_solid_var(--accent)] focus-visible:outline-offset-2',
      'data-[state=checked]:border-[var(--navy)] data-[state=checked]:bg-[var(--navy)] data-[state=checked]:text-white',
      'data-[state=indeterminate]:border-[var(--navy)] data-[state=indeterminate]:bg-[var(--navy)] data-[state=indeterminate]:text-white',
      'disabled:cursor-not-allowed disabled:bg-[var(--surface-alt)] disabled:opacity-60',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {props.checked === 'indeterminate' ? (
        <Minus className="h-3 w-3 stroke-[3]" />
      ) : (
        <Check className="h-3 w-3 stroke-[3]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
