'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Search,
  Handshake,
  Users,
  Inbox,
  Megaphone,
  Mail,
  Zap,
  Bot,
  FileText,
  Key,
  Webhook,
  Activity,
  Globe,
  Plus,
  ArrowRight,
  Sparkles,
  Command as CommandIcon,
  Calculator,
  HelpCircle,
  Scale,
  ShieldCheck,
  Building,
  CreditCard,
  FileCheck,
  FileSignature,
  FileSearch,
  Lock,
  Calendar,
  X,
  Workflow,
  Sliders,
  Database,
  Image as ImageIcon,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Hubs' | 'Quick Actions' | 'Interactive Tools' | 'CRM & Deals' | 'CMS Studio' | 'Platform Ops'
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  action?: () => void
  external?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenQuickCreate?: (tab: 'deal' | 'contact' | 'task' | 'campaign') => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenQuickCreate,
}: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const items: CommandItem[] = React.useMemo(() => [
    // 1. Hubs
    { id: 'hub-crm', title: 'CRM — deals & pipeline', subtitle: 'Track every incorporation deal from lead to license', category: 'Hubs', href: '/crm', icon: Handshake, badge: 'G D' },
    { id: 'hub-inbox', title: 'Inbox — WhatsApp & live chat', subtitle: 'Reply to every conversation in one place', category: 'Hubs', href: '/crm/inbox', icon: MessageSquare, badge: 'G I' },
    { id: 'hub-marketing', title: 'Marketing — campaigns & sequences', subtitle: 'Broadcast, nurture and measure outreach', category: 'Hubs', href: '/crm/campaigns', icon: Megaphone, badge: 'G M' },
    { id: 'hub-automations', title: 'Automations — workflows & bots', subtitle: 'Let triggers do the follow-up for you', category: 'Hubs', href: '/crm/automations', icon: Zap, badge: 'G A' },
    { id: 'hub-cms', title: 'CMS — pages, posts & SEO', subtitle: 'Edit the public website without a deploy', category: 'Hubs', href: '/cms', icon: FileText, badge: 'G C' },
    { id: 'hub-admin', title: 'Ops — users, API keys & health', subtitle: 'Control access, integrations and uptime', category: 'Hubs', href: '/admin', icon: Key, badge: 'G O' },
    { id: 'hub-public', title: 'Public Website (gccstartup.com)', subtitle: 'Launch live public website', category: 'Hubs', href: '/', icon: Globe, external: true },

    // 2. Quick Actions
    {
      id: 'act-new-deal',
      title: 'Create Pipeline Deal',
      subtitle: 'Add company incorporation lead to pipeline',
      category: 'Quick Actions',
      icon: Plus,
      badge: 'C',
      action: () => onOpenQuickCreate ? onOpenQuickCreate('deal') : router.push('/crm/deals'),
    },
    {
      id: 'act-new-contact',
      title: 'Add New Contact',
      subtitle: 'Register client profile with KYC details',
      category: 'Quick Actions',
      icon: Plus,
      badge: 'C',
      action: () => onOpenQuickCreate ? onOpenQuickCreate('contact') : router.push('/crm/contacts'),
    },
    {
      id: 'act-new-task',
      title: 'Schedule Compliance Task',
      subtitle: 'Create follow-up, renewal or filing task',
      category: 'Quick Actions',
      icon: Calendar,
      badge: 'C',
      action: () => onOpenQuickCreate ? onOpenQuickCreate('task') : router.push('/crm'),
    },
    {
      id: 'act-new-campaign',
      title: 'Launch Outbound Campaign',
      subtitle: 'Broadcast WhatsApp HSM or SES sequence',
      category: 'Quick Actions',
      icon: Megaphone,
      badge: 'Wizard',
      action: () => onOpenQuickCreate ? onOpenQuickCreate('campaign') : router.push('/crm/campaigns/new'),
    },

    // 3. Interactive Tools & Calculators
    { id: 'tool-tax', title: 'UAE Corporate Tax Calculator', subtitle: '9% statutory rate & qualifying freezone tax relief model', category: 'Interactive Tools', href: '/tools/tax-calculator', icon: Calculator, badge: 'Tool' },
    { id: 'tool-quiz', title: 'Jurisdiction Fit Quiz', subtitle: '6-question algorithmic matching for Freezone vs Mainland', category: 'Interactive Tools', href: '/tools/jurisdiction-quiz', icon: HelpCircle, badge: 'Tool' },
    { id: 'tool-qfzp', title: 'QFZP 0% Tax Eligibility Checker', subtitle: 'Qualifying Free Zone Person compliance verification', category: 'Interactive Tools', href: '/tools/qfzp-eligibility', icon: Scale, badge: 'Tool' },
    { id: 'tool-visa', title: 'UAE Residency & Golden Visa Estimator', subtitle: 'Investor, Green & Golden Visa points calculator', category: 'Interactive Tools', href: '/tools/visa-estimator', icon: FileCheck, badge: 'Tool' },
    { id: 'tool-banking', title: 'Corporate Banking Odds Predictor', subtitle: 'WIO, Mashreq Neo, FAB & Emirates NBD approval odds', category: 'Interactive Tools', href: '/tools/banking-odds', icon: CreditCard, badge: 'Tool' },
    { id: 'tool-nda', title: 'Instant Bilingual NDA Generator', subtitle: 'DIFC / ADGM enforceable non-disclosure generator', category: 'Interactive Tools', href: '/tools/generate-nda', icon: FileSignature, badge: 'Tool' },
    { id: 'tool-name', title: 'Trade Name Availability Checker', subtitle: 'DED & Freezone naming rules verification', category: 'Interactive Tools', href: '/tools/name-checker', icon: FileSearch, badge: 'Tool' },
    { id: 'tool-ubo', title: 'UBO & Privacy Assessment', subtitle: 'Ultimate Beneficial Owner disclosure risk evaluation', category: 'Interactive Tools', href: '/tools/ubo-privacy', icon: Lock, badge: 'Tool' },
    { id: 'tool-vat', title: 'VAT Registration Scorer', subtitle: 'AED 375k threshold & voluntary registration scorer', category: 'Interactive Tools', href: '/tools/vat-scorer', icon: Calculator, badge: 'Tool' },
    { id: 'tool-cal', title: 'Annual Compliance & Renewal Calendar', subtitle: 'Corporate tax, VAT, ESR & license renewal schedule', category: 'Interactive Tools', href: '/tools/compliance-calendar', icon: Calendar, badge: 'Tool' },

    // 4. CRM & Operations
    { id: 'page-deals', title: 'Deals Pipeline Kanban', subtitle: 'High-density drag-and-drop sales pipeline', category: 'CRM & Deals', href: '/crm/deals', icon: Handshake },
    { id: 'page-contacts', title: 'Contacts & Directory', subtitle: 'Searchable lead directory with KYC profiles', category: 'CRM & Deals', href: '/crm/contacts', icon: Users },
    { id: 'page-inbox-all', title: 'WhatsApp Live Chat Inbox', subtitle: '2-way Meta WhatsApp conversation stream', category: 'CRM & Deals', href: '/crm/inbox', icon: MessageSquare },
    { id: 'page-email', title: 'Amazon SES Email Operations', subtitle: 'Dispatch stats, bounce rates & suppressions', category: 'CRM & Deals', href: '/crm/email', icon: Mail },
    { id: 'page-flows', title: 'Automated Sequences (Drips)', subtitle: 'Multi-step email & WhatsApp lead nurturing', category: 'CRM & Deals', href: '/crm/flows', icon: Workflow },
    { id: 'page-bots', title: 'AI Copilot & Bots', subtitle: 'Claude-powered WhatsApp lead qualifier', category: 'CRM & Deals', href: '/crm/automations/bots', icon: Bot },

    // 5. CMS Studio
    { id: 'page-cms-pages', title: 'Landing Pages (Puck Editor)', subtitle: 'Visual block-based landing page engine', category: 'CMS Studio', href: '/cms/pages', icon: FileText },
    { id: 'page-cms-posts', title: 'Blog & Articles Studio', subtitle: 'SEO guides, news & formation handbooks', category: 'CMS Studio', href: '/cms/posts', icon: FileText },
    { id: 'page-cms-media', title: 'Media Library & CDN', subtitle: 'Cloudflare R2 image and document repository', category: 'CMS Studio', href: '/cms/media', icon: ImageIcon },
    { id: 'page-cms-seo', title: 'SEO & Schema Markup', subtitle: 'AEO, JSON-LD, sitemaps & meta config', category: 'CMS Studio', href: '/cms/seo', icon: Search },

    // 6. Platform Ops
    { id: 'page-api-keys', title: 'REST API Keys (v2)', subtitle: 'Bearer tokens with scoped RBAC permissions', category: 'Platform Ops', href: '/admin/api-keys', icon: Key },
    { id: 'page-webhooks', title: 'Webhooks & HMAC Subscriptions', subtitle: '24 outbound event triggers with delivery log', category: 'Platform Ops', href: '/admin/webhooks', icon: Webhook },
    { id: 'page-audit-log', title: 'Security Audit Logs', subtitle: 'Tamper-evident system activity ledger', category: 'Platform Ops', href: '/admin/audit-log', icon: ShieldCheck },
    { id: 'page-health', title: 'System Diagnostics & Telemetry', subtitle: 'PostgreSQL, Redis, Meta API & R2 health', category: 'Platform Ops', href: '/admin/health', icon: Activity },
    { id: 'page-database', title: 'PostgreSQL Studio', subtitle: 'Drizzle ORM schema viewer and SQL console', category: 'Platform Ops', href: '/admin/database', icon: Database },
  ], [router, onOpenQuickCreate])

  // Cmd+K / Ctrl+K is owned by `usePlatformShortcuts` in PlatformShell so the
  // palette, quick create and hub jumps never fight over the same keystroke.

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [items, query])

  // Reset selected index on query change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item: CommandItem) => {
    onOpenChange(false)
    if (item.action) {
      item.action()
    } else if (item.href) {
      if (item.external) {
        window.open(item.href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(item.href)
      }
    }
  }

  const handleKeyDownDialog = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0A142F]/50 backdrop-blur-xs transition-opacity animate-in fade-in-0" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDownDialog}
          className="fixed left-[50%] top-[15%] sm:top-[20%] z-50 w-full max-w-2xl translate-x-[-50%] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95"
        >
          {/* Header Search Input */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 bg-white">
            <Search className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hubs, deals, contacts, campaigns, pages and API keys..."
              className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-1 text-[var(--text-tertiary)] hover:bg-slate-100 hover:text-[var(--text)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)] shadow-2xs">
              ESC
            </kbd>
          </div>

          {/* Results Viewport */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-[var(--text-tertiary)] opacity-40" />
                <p className="mt-2 text-xs font-semibold text-[var(--text)]">
                  Nothing matches &ldquo;{query}&rdquo; yet
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  Try &ldquo;pipeline&rdquo;, &ldquo;WhatsApp&rdquo;, &ldquo;campaign&rdquo; or &ldquo;API keys&rdquo; — or press C to create something new.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((item, index) => {
                  const isSelected = index === selectedIndex
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl px-3 py-2 cursor-pointer text-left transition-colors',
                        isSelected
                          ? 'bg-[#0A142F] text-white shadow-xs'
                          : 'text-[var(--text)] hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                            isSelected
                              ? 'bg-white/10 text-[var(--orange)]'
                              : 'bg-slate-100 text-[var(--text-secondary)]'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold truncate leading-tight">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                                  isSelected
                                    ? 'bg-[var(--orange)] text-white'
                                    : 'bg-slate-100 text-[var(--text-secondary)]'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <span
                              className={cn(
                                'block text-[11px] truncate',
                                isSelected ? 'text-slate-300' : 'text-[var(--text-tertiary)]'
                              )}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'text-[10px] uppercase font-bold tracking-wider',
                            isSelected ? 'text-slate-300' : 'text-[var(--text-tertiary)]'
                          )}
                        >
                          {item.category}
                        </span>
                        <ArrowRight
                          className={cn(
                            'h-3.5 w-3.5',
                            isSelected ? 'text-[var(--orange)]' : 'text-slate-300'
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between border-t border-[var(--border)] bg-slate-50 px-4 py-2.5 text-[10px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">↑</kbd>{' '}
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">↓</kbd> navigate
              </span>
              <span>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">↵</kbd> select
              </span>
              <span>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">C</kbd> create new
              </span>
              <span className="hidden sm:inline">
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">G</kbd>{' '}
                then{' '}
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">D</kbd>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">I</kbd>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">M</kbd>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">A</kbd>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">C</kbd>
                <kbd className="rounded border border-[var(--border)] bg-white px-1 py-0.5 font-bold shadow-2xs">O</kbd>{' '}
                jump hubs
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-secondary)]">
              <CommandIcon className="h-3 w-3" />
              <span>GCC Platform OS</span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
