import { ReactNode } from 'react'

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
  if (!open) return null
  const close = onClose || (() => onOpenChange?.(false))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={close}>
      <div
        className="rounded-lg bg-[var(--bg)] shadow-lg max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="border-b border-[var(--border)] px-6 py-4 text-lg font-semibold">{title}</div>}
        <div className={size === 'full' ? '' : 'p-6'}>{children}</div>
        {footer && <div className="border-t border-[var(--border)] px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}