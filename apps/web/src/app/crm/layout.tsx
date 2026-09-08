'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Handshake,
  Inbox,
  Megaphone,
  Mail,
  FileText,
  Workflow,
  Zap,
  CheckSquare,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Search,
  Bell,
  Globe,
  FileCode,
} from 'lucide-react'

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/deals', label: 'Pipeline Deals', icon: Handshake },
  { href: '/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/crm/inbox', label: 'Unified Inbox', icon: Inbox },
  { href: '/crm/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/crm/email', label: 'Email Operations', icon: Mail },
  { href: '/crm/templates', label: 'WhatsApp Templates', icon: FileText },
  { href: '/crm/automations', label: 'Automations', icon: Zap },
  { href: '/crm/analytics', label: 'Analytics', icon: TrendingUp },
]

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-[var(--surface-alt)] font-sans antialiased text-[var(--text)]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        {/* Brand Top */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <Link href="/crm" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--navy)] text-white font-black text-sm tracking-wider shadow-sm">
              GCC
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-[var(--text)] leading-tight">
                GCC Startup
              </span>
              <span className="block text-[10px] font-semibold text-[var(--orange)] uppercase tracking-wider">
                Sales &amp; CRM OS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Core Relationship Ops
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-[var(--navy)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--orange)]' : 'text-[var(--text-tertiary)]')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / User Badge */}
        <div className="border-t border-[var(--border)] p-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-[var(--surface-alt)] p-2.5 border border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[10px] font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-[var(--text)] leading-tight">
                  {user?.name || 'Platform Admin'}
                </span>
                <span className="block truncate text-[10px] text-[var(--text-tertiary)]">
                  {user?.email || 'admin@gccstartup.com'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded p-1 text-[var(--text-tertiary)] hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Hub Navigation Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
          {/* Product Switcher */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/crm"
              className="rounded-lg bg-[var(--surface-alt)] px-3 py-1.5 text-xs font-bold text-[var(--navy)] border border-[var(--border)] shadow-2xs"
            >
              CRM
            </Link>
            <Link
              href="/cms"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              CMS Editor
            </Link>
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Admin &amp; Keys
            </Link>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Public Site</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </Link>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Meta WhatsApp Connected
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
