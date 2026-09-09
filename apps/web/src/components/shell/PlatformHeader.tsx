'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  ExternalLink,
  Plus,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Shield,
  HelpCircle,
  Command,
  Globe,
  Handshake,
  Users,
  Inbox,
  Megaphone,
  Zap,
  FileText,
  Key,
  Check,
  Building,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HUBS, detectActiveHub, type HubConfig } from './types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface PlatformHeaderProps {
  onOpenCommand: () => void
  onOpenQuickCreate?: (tab?: 'deal' | 'contact' | 'task' | 'campaign') => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export function PlatformHeader({
  onOpenCommand,
  onOpenQuickCreate,
  onToggleSidebar,
}: PlatformHeaderProps) {
  const pathname = usePathname() || '/crm'
  const router = useRouter()
  const activeHub = detectActiveHub(pathname)

  const [user, setUser] = React.useState<{ name: string; email: string; role: string } | null>(null)
  const [activeWorkspace, setActiveWorkspace] = React.useState<'dubai' | 'riyadh'>('dubai')
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Array<{ id: string; title: string; message: string; isRead: boolean; createdAt?: string }>>([])

  // Load user profile & notifications
  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})

    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data?.data || [])
        setUnreadNotifications(data?.meta?.unreadCount || 0)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
  }

  const markNotificationAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setUnreadNotifications((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadNotifications(0)
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-[var(--border)] bg-white px-3 sm:px-4 lg:px-6 select-none shadow-2xs">
      {/* Left: Brand Identity & Mobile Hamburger */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text)] lg:hidden transition-colors"
            title="Toggle Sidebar Navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <Link href="/crm" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A142F] text-white font-black text-xs tracking-wider shadow-xs ring-1 ring-black/10 transition-transform group-hover:scale-102">
            GCC
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--orange)] ring-2 ring-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-[#0A142F]">
                GCC Startup
              </span>
              <span className="rounded bg-slate-100 px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] border border-[var(--border)]">
                PROD
              </span>
            </div>
            <span className="block text-[9px] font-bold text-[var(--orange)] uppercase tracking-wider">
              Enterprise OS
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Standardized 6-Hub Switcher */}
      <nav className="hidden md:flex items-center rounded-lg bg-slate-100/90 p-0.5 border border-[var(--border)] shadow-2xs">
        {HUBS.map((hub) => {
          const isActive = activeHub.id === hub.id
          const Icon = hub.icon
          return (
            <Link
              key={hub.id}
              href={hub.href}
              className={cn(
                'relative flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#0A142F] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text)]'
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-colors',
                  isActive ? 'text-[var(--orange)]' : 'text-[var(--text-tertiary)]'
                )}
              />
              <span className="hidden xl:inline">{hub.label}</span>
              <span className="xl:hidden">{hub.shortLabel}</span>
              {isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: hub.dotColor }}
                />
              )}
            </Link>
          )
        })}

        {/* Public Website External Launcher */}
        <div className="mx-1 h-3.5 w-px bg-slate-300" />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text)] transition-all"
          title="Open Public Website (gccstartup.com) in new tab"
        >
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden 2xl:inline">Public Site</span>
          <ExternalLink className="h-2.5 w-2.5 text-slate-400 opacity-80" />
        </a>
      </nav>

      {/* Right Controls: Telemetry, Search, Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* System Telemetry Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 shadow-2xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span>Meta WhatsApp Active</span>
        </div>

        {/* Universal Search Trigger (Cmd+K) */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[var(--border)] bg-slate-50/80 px-2 sm:px-2.5 py-1 text-xs text-[var(--text-tertiary)] hover:border-slate-300 hover:bg-white hover:text-[var(--text)] transition-all shadow-2xs"
          title="Search anything (Cmd+K / Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden lg:inline font-medium text-[11px]">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.2 text-[9px] font-bold text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick Create Button ('C' shortcut) */}
        <button
          onClick={() => onOpenQuickCreate ? onOpenQuickCreate('deal') : undefined}
          className="flex items-center gap-1 rounded-lg bg-[var(--orange)] px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-[var(--orange-dk)] active:scale-97 transition-all"
          title="Quick Create Record (Press 'C')"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New</span>
          <kbd className="hidden md:inline-flex items-center rounded bg-black/15 px-1 py-0.2 text-[8px] font-bold tracking-wider uppercase text-white/90">
            C
          </kbd>
        </button>

        {/* Notification Drawer Popover */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-100 hover:text-[var(--text)] transition-colors"
              title="Platform Notifications & Telemetry"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--orange)] text-[8px] font-black text-white shadow-xs">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl rounded-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3.5 py-2.5 bg-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text)]">Platform Alerts</span>
                {unreadNotifications > 0 && (
                  <span className="rounded-full bg-[var(--orange)]/10 px-1.5 py-0.2 text-[9px] font-black text-[var(--orange)]">
                    {unreadNotifications} new
                  </span>
                )}
              </div>
              {unreadNotifications > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--orange)] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-5 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 opacity-80" />
                  <p className="mt-1.5 text-xs font-semibold text-[var(--text)]">All Systems Operational</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">No pending alerts or renewal notices.</p>
                </div>
              ) : (
                notifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={cn(
                      'p-3 cursor-pointer hover:bg-slate-50 transition-colors text-left',
                      !notif.isRead && 'bg-blue-50/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text)] truncate">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--orange)]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[var(--border)] p-2 bg-slate-50 text-center">
              <Link
                href="/admin/audit-log"
                onClick={() => setNotificationsOpen(false)}
                className="text-[11px] font-semibold text-[#0A142F] hover:text-[var(--orange)] transition-colors"
              >
                View Full Audit Logs &rarr;
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile & Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-lg p-0.5 hover:bg-slate-100 transition-all text-left outline-hidden">
              <div className="relative flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#0A142F] text-[11px] font-bold text-white ring-1 ring-black/10 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden xl:block leading-tight">
                <span className="block text-xs font-bold text-[var(--text)] truncate max-w-[90px]">
                  {user?.name || 'Admin'}
                </span>
                <span className="block text-[9px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  {user?.role || 'SUPERADMIN'}
                </span>
              </div>
              <ChevronDown className="hidden sm:block h-3 w-3 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 shadow-2xl rounded-xl">
            <div className="px-3 py-2 border-b border-[var(--border)] bg-slate-50/50">
              <p className="text-xs font-bold text-[var(--text)]">{user?.name || 'Platform Administrator'}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] truncate">{user?.email || 'admin@gccstartup.com'}</p>
            </div>

            {/* Active Desk / Workspace Switcher */}
            <DropdownMenuLabel>Active Desk Workspace</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setActiveWorkspace('dubai')}
              className={cn(
                'flex items-center justify-between',
                activeWorkspace === 'dubai' && 'bg-blue-50/60 font-semibold'
              )}
            >
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-[#1B4FD8]" />
                <span>Dubai Desk (UAE Freezone / Mainland)</span>
              </div>
              {activeWorkspace === 'dubai' && <Check className="h-3.5 w-3.5 text-[#1B4FD8]" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setActiveWorkspace('riyadh')}
              className={cn(
                'flex items-center justify-between',
                activeWorkspace === 'riyadh' && 'bg-blue-50/60 font-semibold'
              )}
            >
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-emerald-600" />
                <span>Riyadh Desk (KSA MISA LLC)</span>
              </div>
              {activeWorkspace === 'riyadh' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/users')}>
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>Team &amp; RBAC Roles</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenCommand}>
              <Command className="h-3.5 w-3.5 text-slate-500" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/health')}>
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>System Health Diagnostics</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('https://gccstartup.com/contact', '_blank')}>
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>Support &amp; Knowledge Base</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out of Platform</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
