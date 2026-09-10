'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { detectActiveHub, type HubConfig, type NavItem } from './types'
import { Tooltip } from '@/components/ui/Tooltip'

interface PlatformSidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  onCloseMobile?: () => void
}

export function PlatformSidebar({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}: PlatformSidebarProps) {
  const pathname = usePathname() || '/crm'
  const activeHub = detectActiveHub(pathname)
  const HubIcon = activeHub.icon

  return (
    <aside
      aria-label={`${activeHub.label} navigation`}
      className={cn(
        'relative flex flex-col border-r border-[var(--border)] bg-white transition-all duration-200 select-none z-30 shrink-0 h-full',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Current Hub Banner Header */}
      <div
        className={cn(
          'flex items-center border-b border-[var(--border)] transition-all bg-slate-50/40',
          isCollapsed ? 'h-14 justify-center px-2' : 'h-14 justify-between px-3.5'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs font-bold text-xs',
              'bg-[#0A142F] text-white'
            )}
            style={{ borderLeft: `3px solid ${activeHub.dotColor}` }}
          >
            <HubIcon className="h-3.5 w-3.5 text-white" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block text-xs font-black text-[#0A142F] tracking-tight truncate leading-tight">
                {activeHub.label}
              </span>
              <span className="block text-[10px] text-[var(--text-tertiary)] truncate leading-tight">
                {activeHub.subtitle}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && activeHub.badgeText && (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-emerald-700">
            {activeHub.badgeText}
          </span>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4">
        {activeHub.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  (item.href !== '/crm' &&
                    item.href !== '/cms' &&
                    item.href !== '/admin' &&
                    pathname.startsWith(item.href))
              const Icon = item.icon

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg text-xs font-semibold transition-all duration-150',
                    isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'px-2.5 py-1.5',
                    isActive
                      ? 'bg-[#0A142F] text-white shadow-xs font-bold'
                      : 'text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text)]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-[var(--orange)]' : 'text-[var(--text-tertiary)]'
                    )}
                  />

                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1 leading-tight">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider shrink-0 transition-colors',
                            isActive
                              ? 'bg-[var(--orange)] text-white'
                              : 'bg-slate-100 text-[var(--text-tertiary)] group-hover:bg-slate-200 group-hover:text-[var(--text-secondary)]'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Active Indicator bar on collapse */}
                  {isCollapsed && isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--orange)]" />
                  )}
                </Link>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href} content={item.label} side="right">
                    {linkContent}
                  </Tooltip>
                )
              }

              return <div key={item.href}>{linkContent}</div>
            })}
          </div>
        ))}
      </div>

      {/* Footer Info & Collapse Toggle */}
      <div className="border-t border-[var(--border)] p-2 bg-slate-50/60">
        {!isCollapsed ? (
          <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-[var(--border)] shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-[var(--text)] leading-none truncate">
                  Platform engine
                </span>
                <span className="block text-[8px] text-[var(--text-tertiary)] leading-tight mt-0.5">
                  Postgres &middot; SES &middot; R2
                </span>
              </div>
            </div>

            <button
              onClick={onToggleCollapse}
              className="rounded p-1 text-[var(--text-tertiary)] hover:bg-slate-100 hover:text-[var(--text)] transition-colors"
              title="Collapse navigation"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--text-tertiary)] hover:bg-slate-100 hover:text-[var(--text)] shadow-2xs transition-colors"
              title="Expand navigation"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
