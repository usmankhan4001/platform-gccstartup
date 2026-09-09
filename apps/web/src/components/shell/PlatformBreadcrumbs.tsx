'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { detectActiveHub } from './types'

export function PlatformBreadcrumbs() {
  const pathname = usePathname() || '/crm'
  const hub = detectActiveHub(pathname)

  // Segment analysis
  const segments = React.useMemo(() => {
    const raw = pathname.split('?')[0].split('/').filter(Boolean)
    return raw.map((segment, idx) => {
      const href = '/' + raw.slice(0, idx + 1).join('/')
      const formatted = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      return { segment, formatted, href, isLast: idx === raw.length - 1 }
    })
  }, [pathname])

  return (
    <div className="flex h-8.5 w-full shrink-0 items-center justify-between border-b border-[var(--border)] bg-white px-3 sm:px-4 lg:px-6 select-none shadow-2xs">
      {/* Breadcrumb Navigation Path */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] overflow-x-auto no-scrollbar">
        <Link
          href={hub.href}
          className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)] hover:text-[#0A142F] transition-colors"
          title={`Go to ${hub.label}`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: hub.dotColor }}
          />
          <span className="text-[11px]">{hub.label}</span>
        </Link>

        {segments.length > 1 && (
          <>
            {segments.slice(1).map((s) => (
              <React.Fragment key={s.href}>
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                {s.isLast ? (
                  <span className="font-bold text-[#0A142F] text-[11px] truncate">
                    {s.formatted}
                  </span>
                ) : (
                  <Link
                    href={s.href}
                    className="font-medium text-[var(--text-secondary)] hover:text-[#0A142F] text-[11px] transition-colors truncate"
                  >
                    {s.formatted}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </nav>

      {/* Right Micro Route Tag */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] text-slate-600 border border-[var(--border)]">
          {pathname}
        </span>
      </div>
    </div>
  )
}
