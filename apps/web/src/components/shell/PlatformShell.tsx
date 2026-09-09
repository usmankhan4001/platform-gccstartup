'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { PlatformHeader } from './PlatformHeader'
import { PlatformSidebar } from './PlatformSidebar'
import { PlatformBreadcrumbs } from './PlatformBreadcrumbs'
import { CommandPalette } from './CommandPalette'
import { QuickCreateModal } from './QuickCreateModal'
import { TooltipProvider } from '@/components/ui/Tooltip'
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

  // Detect if page is full-height optimized (e.g. WhatsApp Inbox)
  const isFullHeightPage = pathname.startsWith('/crm/inbox')

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--surface-alt)] font-sans antialiased text-[var(--text)]">
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

        {/* Desktop Sidebar (Collapsible) */}
        <div className="hidden lg:flex shrink-0">
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

        {/* Main Application Column */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Top Platform Header (Standardized 56px) */}
          <PlatformHeader
            onOpenCommand={() => setCommandOpen(true)}
            onOpenQuickCreate={handleOpenQuickCreate}
            onToggleSidebar={() => setMobileOpen((prev) => !prev)}
            isSidebarOpen={mobileOpen}
          />

          {/* Breadcrumbs Ribbon */}
          <PlatformBreadcrumbs />

          {/* Main Scrollable Viewport */}
          <main
            className={cn(
              'flex-1 overflow-y-auto bg-[var(--surface-alt)]',
              isFullHeightPage ? 'p-2 sm:p-3 lg:p-4 flex flex-col' : 'p-3 sm:p-5 lg:p-6'
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
