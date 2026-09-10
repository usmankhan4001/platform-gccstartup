import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Handshake,
  TrendingUp,
  Inbox,
  Megaphone,
  Mail,
  FileText,
  FileCode,
  Workflow,
  Zap,
  Bot,
  BookOpen,
  Image as ImageIcon,
  Search,
  Settings,
  ShieldCheck,
  Key,
  Webhook,
  ScrollText,
  Activity,
  Database,
  Cpu,
  PenSquare,
  MessageSquare,
  CalendarCheck,
} from 'lucide-react'

export type HubId = 'crm' | 'inbox' | 'marketing' | 'automations' | 'cms' | 'admin'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: 'default' | 'orange' | 'green' | 'blue' | 'purple'
  exact?: boolean
  description?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface HubConfig {
  id: HubId
  label: string
  shortLabel: string
  subtitle: string
  href: string
  icon: LucideIcon
  accentColor: string
  dotColor: string
  badgeText?: string
  /** Second key of the `G then …` jump sequence. Unique across hubs. */
  shortcut: string
  sections: NavSection[]
  match: (pathname: string) => boolean
}

export const HUBS: HubConfig[] = [
  {
    id: 'crm',
    label: 'CRM & Deals',
    shortLabel: 'CRM',
    subtitle: 'Pipeline & Deals Hub',
    href: '/crm',
    icon: Handshake,
    accentColor: 'text-[#1B4FD8]',
    dotColor: '#1B4FD8',
    shortcut: 'd',
    match: (pathname: string) => {
      if (
        pathname.startsWith('/crm/inbox') ||
        pathname.startsWith('/crm/campaigns') ||
        pathname.startsWith('/crm/email') ||
        pathname.startsWith('/crm/flows') ||
        pathname.startsWith('/crm/templates') ||
        pathname.startsWith('/crm/automations')
      ) {
        return false
      }
      return pathname === '/crm' || pathname.startsWith('/crm/')
    },
    sections: [
      {
        title: 'Pipeline Operations',
        items: [
          { href: '/crm', label: 'CRM Overview', icon: LayoutDashboard, exact: true },
          { href: '/crm/deals', label: 'Pipeline Deals', icon: Handshake, badge: 'Live Kanban' },
          { href: '/crm/renewals', label: 'Renewals & Compliance', icon: CalendarCheck, badge: 'Ledger' },
          { href: '/crm/contacts', label: 'Contacts & Directory', icon: Users, badge: 'Leads' },
          { href: '/crm/analytics', label: 'Revenue Analytics', icon: TrendingUp },
        ],
      },
      {
        title: 'Connected Hubs',
        items: [
          { href: '/crm/inbox', label: 'Unified Inbox', icon: Inbox, badge: 'WhatsApp' },
          { href: '/crm/automations', label: 'Automations', icon: Zap },
        ],
      },
    ],
  },
  {
    id: 'inbox',
    label: 'Unified Inbox',
    shortLabel: 'Inbox',
    subtitle: 'Meta WhatsApp & Live Chat',
    href: '/crm/inbox',
    icon: MessageSquare,
    accentColor: 'text-[#25D366]',
    dotColor: '#25D366',
    badgeText: '2-Way Meta API',
    shortcut: 'i',
    match: (pathname: string) => pathname.startsWith('/crm/inbox'),
    sections: [
      {
        title: 'Conversations & Channels',
        items: [
          { href: '/crm/inbox', label: 'All Conversations', icon: Inbox, exact: true, badge: 'Live' },
          { href: '/crm/templates', label: 'WhatsApp Templates', icon: FileText, badge: 'HSM' },
          { href: '/crm/contacts', label: 'Customer Directory', icon: Users },
        ],
      },
      {
        title: 'Intelligence & Routing',
        items: [
          { href: '/crm/automations/bots', label: 'AI Support Copilot', icon: Bot, badge: 'Claude' },
          { href: '/crm/automations/knowledge', label: 'Chat Knowledge Base', icon: BookOpen },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing Hub',
    shortLabel: 'Marketing',
    subtitle: 'Campaigns & Sequences',
    href: '/crm/campaigns',
    icon: Megaphone,
    accentColor: 'text-[#F26522]',
    dotColor: '#F26522',
    shortcut: 'm',
    match: (pathname: string) =>
      pathname.startsWith('/crm/campaigns') ||
      pathname.startsWith('/crm/email') ||
      pathname.startsWith('/crm/flows') ||
      (pathname.startsWith('/crm/templates') && !pathname.startsWith('/crm/inbox')),
    sections: [
      {
        title: 'Outbound Campaigns',
        items: [
          { href: '/crm/campaigns', label: 'All Campaigns', icon: Megaphone, exact: true },
          { href: '/crm/campaigns/new', label: 'Create Campaign', icon: PenSquare, badge: 'Wizard' },
          { href: '/crm/email', label: 'Email Operations', icon: Mail, badge: 'SES' },
          { href: '/crm/flows', label: 'Automated Sequences', icon: Workflow, badge: 'Drips' },
          { href: '/crm/templates', label: 'Message Templates', icon: FileCode },
        ],
      },
      {
        title: 'Audience & Engagement',
        items: [
          { href: '/crm/contacts', label: 'Audience Contacts', icon: Users },
          { href: '/crm/analytics', label: 'Campaign Analytics', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    id: 'automations',
    label: 'Automations',
    shortLabel: 'Automations',
    subtitle: 'Workflows & Bot Mesh',
    href: '/crm/automations',
    icon: Zap,
    accentColor: 'text-[#D97706]',
    dotColor: '#D97706',
    shortcut: 'a',
    match: (pathname: string) => pathname.startsWith('/crm/automations'),
    sections: [
      {
        title: 'Automation Suite',
        items: [
          { href: '/crm/automations', label: 'Workflow Engine', icon: Zap, exact: true, badge: 'Active' },
          { href: '/crm/automations/bots', label: 'AI Bots & Copilot', icon: Bot, badge: 'AI' },
          { href: '/crm/automations/knowledge', label: 'Knowledge Base', icon: BookOpen },
        ],
      },
      {
        title: 'Operations Linked',
        items: [
          { href: '/crm/flows', label: 'Sequence Pipelines', icon: Workflow },
          { href: '/admin/webhooks', label: 'Webhook Triggers', icon: Webhook },
        ],
      },
    ],
  },
  {
    id: 'cms',
    label: 'CMS & Content',
    shortLabel: 'CMS',
    subtitle: 'Visual Pages & SEO Studio',
    href: '/cms',
    icon: FileText,
    accentColor: 'text-[#16A34A]',
    dotColor: '#16A34A',
    shortcut: 'c',
    match: (pathname: string) => pathname === '/cms' || pathname.startsWith('/cms/'),
    sections: [
      {
        title: 'Content Management',
        items: [
          { href: '/cms', label: 'CMS Dashboard', icon: LayoutDashboard, exact: true },
          { href: '/cms/pages', label: 'Landing Pages', icon: FileText, badge: 'Puck' },
          { href: '/cms/posts', label: 'Blog & Articles', icon: PenSquare },
          { href: '/cms/media', label: 'Media Library', icon: ImageIcon, badge: 'R2' },
          { href: '/cms/seo', label: 'SEO & Meta Tags', icon: Search, badge: 'Schema' },
          { href: '/cms/settings', label: 'Site Settings', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Platform Ops & API',
    shortLabel: 'Ops',
    subtitle: 'Platform & Developer Ops',
    href: '/admin',
    icon: ShieldCheck,
    accentColor: 'text-[#6366F1]',
    dotColor: '#6366F1',
    shortcut: 'o',
    match: (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/'),
    sections: [
      {
        title: 'Access & Control',
        items: [
          { href: '/admin', label: 'System Overview', icon: LayoutDashboard, exact: true },
          { href: '/admin/users', label: 'User Directory', icon: Users },
          { href: '/admin/roles', label: 'Roles & RBAC', icon: ShieldCheck },
        ],
      },
      {
        title: 'Developer & API',
        items: [
          { href: '/admin/api-keys', label: 'API Keys (REST v2)', icon: Key, badge: 'gcc_' },
          { href: '/admin/webhooks', label: 'Webhooks & HMAC', icon: Webhook, badge: 'Events' },
          { href: '/admin/audit-log', label: 'Security Audit Log', icon: ScrollText },
          { href: '/admin/integrations', label: 'Cloud Integrations', icon: Cpu },
        ],
      },
      {
        title: 'Infrastructure',
        items: [
          { href: '/admin/health', label: 'System Health', icon: Activity, badge: '99.9%' },
          { href: '/admin/database', label: 'PostgreSQL Studio', icon: Database },
        ],
      },
    ],
  },
]

export function detectActiveHub(pathname: string): HubConfig {
  for (const hub of HUBS) {
    if (hub.match(pathname)) {
      return hub
    }
  }
  return HUBS[0]
}

/**
 * Resolves the second key of a `G then …` sequence to a hub.
 * Keys: D = CRM, I = Inbox, M = Marketing, A = Automations, C = CMS, O = Ops.
 */
export function getHubByShortcut(key: string): HubConfig | undefined {
  const normalized = key.toLowerCase()
  return HUBS.find((hub) => hub.shortcut === normalized)
}
