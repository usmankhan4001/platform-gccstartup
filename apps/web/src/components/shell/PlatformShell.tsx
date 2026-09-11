'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PlatformHeader } from './PlatformHeader'
import { PlatformSidebar } from './PlatformSidebar'
import { PlatformBreadcrumbs } from './PlatformBreadcrumbs'
import { CommandPalette } from './CommandPalette'
import { QuickCreateModal } from './QuickCreateModal'
import { PwaProvider } from './PwaProvider'
import { MobilePwaNav } from './MobilePwaNav'
import { usePlatformShortcuts } from './usePlatformShortcuts'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { cn } from '@/lib/utils'

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/crm'
  const [commandOpen, setCommandOpen] = React.useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false)
  const [quickCreateTab, setQuickCreateTab] = React.useState<'deal' | 'contact' | 'task' | 'campaign'>('deal')
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Persist collapse preference
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('gcc_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('gcc_sidebar_collapsed', String(next))
      } catch {
        // Ignore
      }
      return next
    })
  }

  const handleOpenQuickCreate = (tab?: 'deal' | 'contact' | 'task' | 'campaign') => {
    if (tab) setQuickCreateTab(tab)
    setQuickCreateOpen(true)
  }

  // Cmd/Ctrl+K opens the palette, `C` opens quick create, `G` then a hub key jumps.
  const { pendingPrefix } = usePlatformShortcuts({
    onOpenCommand: () => setCommandOpen(true),
    onOpenQuickCreate: () => setQuickCreateOpen(true),
  })

  // Detect if page is full-height optimized (e.g. WhatsApp Inbox)
  const isFullHeightPage = pathname.startsWith('/crm/inbox')

  return (
    <ToastProvider>
      <TooltipProvider delayDuration={150}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--surface-alt)] font-sans antialiased text-[var(--text)]">
          {/* Universal Command Palette (Cmd+K / Ctrl+K) */}
          <CommandPalette
            open={commandOpen}
            onOpenChange={setCommandOpen}
            onOpenQuickCreate={handleOpenQuickCreate}
          />

          {/* Quick Create Modal ('C' Shortcut) */}
          <QuickCreateModal
            open={quickCreateOpen}
            onOpenChange={setQuickCreateOpen}
            initialTab={quickCreateTab}
          />

          {/* Service worker + install prompt (progressive enhancement) */}
          <PwaProvider />

          {/* Top Platform Header (Standardized 56px Full Width) */}
          <PlatformHeader
            onOpenCommand={() => setCommandOpen(true)}
            onOpenQuickCreate={handleOpenQuickCreate}
            onToggleSidebar={() => setMobileOpen((prev) => !prev)}
            isSidebarOpen={mobileOpen}
            pendingPrefix={pendingPrefix}
          />

          {/* Body: Sidebar + Main Content */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Desktop Sidebar (Collapsible) */}
            <div className={cn('hidden lg:flex shrink-0 transition-all duration-200', isCollapsed ? 'w-16' : 'w-64')}>
              <PlatformSidebar
                isCollapsed={isCollapsed}
                onToggleCollapse={handleToggleCollapse}
              />
            </div>

            {/* Mobile Sidebar Overlay Drawer */}
            {mobileOpen && (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                <div
                  className="fixed inset-0 bg-[#0A142F]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                  onClick={() => setMobileOpen(false)}
                />
                <div className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                  <PlatformSidebar
                    isCollapsed={false}
                    onToggleCollapse={() => setMobileOpen(false)}
                    onCloseMobile={() => setMobileOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Main Application Area */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
              {/* Breadcrumbs Ribbon */}
              <PlatformBreadcrumbs />

              {/* Main Scrollable Viewport */}
              <main
                className={cn(
                  'flex-1 overflow-y-auto bg-[var(--surface-alt)]',
                  isFullHeightPage ? 'p-2 sm:p-3 lg:p-4 flex flex-col' : 'p-3 sm:p-5 lg:p-6',
                  // Clear the fixed mobile tab bar so content is never hidden behind it.
                  'pb-20 lg:pb-0'
                )}
              >
                {children}
              </main>
            </div>
          </div>

          {/* Mobile bottom tab bar (PWA shell) */}
          <MobilePwaNav onQuickCreate={() => handleOpenQuickCreate('deal')} />
        </div>
      </TooltipProvider>
    </ToastProvider>
  )
}
