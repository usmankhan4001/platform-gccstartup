'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Image, Settings, LogOut, Search } from 'lucide-react'

const navItems = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/pages', label: 'Pages', icon: FileText },
  { href: '/cms/posts', label: 'Posts', icon: FileText },
  { href: '/cms/media', label: 'Media', icon: Image },
  { href: '/cms/seo', label: 'SEO', icon: Search },
  { href: '/cms/settings', label: 'Settings', icon: Settings },
]

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex h-screen bg-[var(--bg-secondary)]">
      <aside className="flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg)]">
        <div className="border-b border-[var(--border)] px-6 py-4"><Link href="/cms" className="text-lg font-bold text-[var(--text)]">GCC Platform</Link><p className="text-xs text-[var(--text-secondary)]">CMS</p></div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]')}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-[var(--border)] px-3 py-4">
          <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"><LogOut className="h-4 w-4" />Back to Site</Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6"><h2 className="text-sm font-semibold text-[var(--text)]">Content Management</h2></header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}