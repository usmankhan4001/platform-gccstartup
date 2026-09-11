'use client'

import { ReactNode, useEffect, useId } from 'react'

export function Modal({
  open,
  onClose,
  onOpenChange,
  children,
  size,
  title,
  footer,
  description,
}: {
  open: boolean
  onClose?: () => void
  onOpenChange?: (o: boolean) => void
  children: ReactNode
  size?: string
  title?: ReactNode
  footer?: ReactNode
  description?: string
}) {
  const titleId = useId()
  const descId = useId()
  const close = onClose || (() => onOpenChange?.(false))

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={close}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className="rounded-lg bg-[var(--bg)] shadow-lg max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div id={titleId} className="border-b border-[var(--border)] px-6 py-4 text-lg font-semibold">
            {title}
          </div>
        )}
        {description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}
        <div className={size === 'full' ? '' : 'p-6'}>{children}</div>
        {footer && <div className="border-t border-[var(--border)] px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}