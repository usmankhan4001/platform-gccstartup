import { ReactNode } from 'react'

export function Tooltip({ content, children, className }: { content: string; children: ReactNode; className?: string }) {
  return <div title={content} className={className}>{children}</div>
}

export function InfoTooltip({ content, size, className }: { content: string; size?: string; className?: string }) {
  return <span title={content} className={className}>ⓘ</span>
}