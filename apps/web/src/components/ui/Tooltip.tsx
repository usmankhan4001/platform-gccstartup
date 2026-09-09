'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-[#0A142F] px-2.5 py-1 text-[11px] font-medium text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

export function Tooltip({
  content,
  children,
  className,
  side = 'top',
  align = 'center',
  delayDuration = 200,
}: TooltipProps) {
  if (!content) return <>{children}</>

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild className={className}>
          {React.isValidElement(children) ? children : <span>{children}</span>}
        </TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export function InfoTooltip({
  content,
  size,
  className,
}: {
  content: string
  size?: string
  className?: string
}) {
  return (
    <Tooltip content={content}>
      <span
        className={cn(
          'inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-[var(--text-tertiary)] hover:bg-slate-200 hover:text-[var(--text)] transition-colors',
          size,
          className
        )}
      >
        i
      </span>
    </Tooltip>
  )
}

export {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
}
