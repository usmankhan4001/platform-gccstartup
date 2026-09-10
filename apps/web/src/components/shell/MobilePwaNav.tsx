'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  MessageSquare,
  Plus,
  CalendarClock,
  Workflow,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HUBS, detectActiveHub } from './types'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet'

/**
 * Mobile bottom tab bar. Only rendered under `lg` — the desktop sidebar covers
 * the same destinations above that breakpoint.
 *
 * Padding uses `env(safe-area-inset-bottom)` so the bar clears the iOS home
 * indicator when the app runs in standalone PWA mode.
 */
export function MobilePwaNav({ onQuickCreate }: { onQuickCreate: () => void }) {
  const pathname = usePathname() || ''
  const [unread, setUnread] = React.useState(0)
  const [hubsOpen, setHubsOpen] = React.useState(false)
  const activeHub = detectActiveHub(pathname || '/crm')

  // Unread badge is a nice-to-have: a failed fetch must never break the nav.
  React.useEffect(() => {
    let cancelled = false
    fetch('/api/chat?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const list = Array.isArray(data) ? data : data?.conversations || []
        setUnread(list.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pathname])

  // Never leave the hub sheet hanging open after a navigation.
  React.useEffect(() => {
    setHubsOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/crm' ? pathname === '/crm' || pathname === '/crm/deals' : pathname.startsWith(href)

  const tabs = [
    { href: '/crm', label: 'Deals', icon: LayoutGrid },
    { href: '/crm/inbox', label: 'Inbox', icon: MessageSquare, badge: unread },
    { href: '/crm/renewals', label: 'Renewals', icon: CalendarClock },
    { href: '/crm/automations', label: 'Flows', icon: Workflow },
  ]

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[var(--border)] bg-white lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {tabs.slice(0, 2).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}

        {/* Elevated centre action */}
        <div className="relative flex w-16 shrink-0 items-center justify-center">
          <button
            onClick={onQuickCreate}
            aria-label="Create a deal, contact, task or campaign"
            className="absolute -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F26522] text-white shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {tabs.slice(2).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}

        {/* Every hub, one tap away — the header switcher is desktop-only */}
        <button
          type="button"
          onClick={() => setHubsOpen(true)}
          aria-label="Switch hub"
          className={cn(
            'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-medium',
            'text-[var(--text-tertiary)]'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      <Sheet open={hubsOpen} onOpenChange={setHubsOpen}>
        <SheetContent side="bottom" closeLabel="Close hub switcher">
          <SheetHeader>
            <SheetTitle>Switch hub</SheetTitle>
            <SheetDescription>
              You&rsquo;re in {activeHub.label}. Jump to another part of the platform.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 px-5 pb-5">
            {HUBS.map((hub) => {
              const Icon = hub.icon
              const isCurrent = hub.id === activeHub.id
              return (
                <SheetClose asChild key={hub.id}>
                  <Link
                    href={hub.href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors',
                      isCurrent
                        ? 'border-[#0A142F] bg-[#0A142F] text-white'
                        : 'border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface-alt)]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        isCurrent ? 'bg-white/10 text-[var(--orange)]' : 'bg-slate-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold truncate">{hub.shortLabel}</span>
                      <span
                        className={cn(
                          'block text-[10px] truncate',
                          isCurrent ? 'text-slate-300' : 'text-[var(--text-tertiary)]'
                        )}
                      >
                        {hub.subtitle}
                      </span>
                    </span>
                  </Link>
                </SheetClose>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Tab({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10px] font-medium',
        active ? 'text-[#F26522]' : 'text-[var(--text-tertiary)]'
      )}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F26522] px-1 text-[9px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      {label}
    </Link>
  )
}
