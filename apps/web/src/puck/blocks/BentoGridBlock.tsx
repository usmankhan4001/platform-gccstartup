import type { ComponentConfig } from '@puckeditor/core'
import { Building2, Landmark, ShieldCheck, PackageCheck, IdCard, RefreshCw, Briefcase, type LucideIcon } from 'lucide-react'
import { Eyebrow, BentoGrid } from '@/components/ui'
import type { BentoItem } from '@/components/ui'

const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  bank: Landmark,
  shield: ShieldCheck,
  package: PackageCheck,
  'id-card': IdCard,
  refresh: RefreshCw,
}

const ICON_OPTIONS = [
  { label: 'Building', value: 'building' },
  { label: 'Bank', value: 'bank' },
  { label: 'Shield', value: 'shield' },
  { label: 'Package', value: 'package' },
  { label: 'ID card', value: 'id-card' },
  { label: 'Refresh', value: 'refresh' },
]

export type BentoGridBlockProps = {
  eyebrow: string
  title: string
  featured: { icon: string; title: string; desc: string; href: string }
  items: Array<{ icon: string; title: string; desc: string; href: string; tint: 'orange' | 'sand' | 'blue' | 'none' }>
}

/** Puck-editable version of the v7 bento grid — one large featured tile (always
 * first, always dark) plus tonal smaller tiles, replacing a uniform card grid. */
export const BentoGridBlock: ComponentConfig<BentoGridBlockProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    featured: {
      type: 'object',
      objectFields: {
        icon: { type: 'select', options: ICON_OPTIONS },
        title: { type: 'text' },
        desc: { type: 'textarea' },
        href: { type: 'text' },
      },
    },
    items: {
      type: 'array',
      arrayFields: {
        icon: { type: 'select', options: ICON_OPTIONS },
        title: { type: 'text' },
        desc: { type: 'textarea' },
        href: { type: 'text' },
        tint: {
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Orange', value: 'orange' },
            { label: 'Sand', value: 'sand' },
            { label: 'Blue', value: 'blue' },
          ],
        },
      },
      getItemSummary: (item) => item.title || 'Item',
    },
  },
  defaultProps: {
    eyebrow: 'Services',
    title: 'What we handle for you, end to end.',
    featured: {
      icon: 'building',
      title: 'Company Formation',
      desc: 'Full registration and licensing across six jurisdictions — the core engagement, filed start to finish.',
      href: '/services/company-registration',
    },
    items: [
      { icon: 'bank', title: 'Corporate Banking', desc: 'Multi-currency accounts, opened remotely.', href: '/services/bank-account', tint: 'orange' },
      { icon: 'shield', title: 'Nominee Structuring', desc: 'Privacy-first, fully compliant ownership.', href: '/services/nominee-ubo', tint: 'sand' },
      { icon: 'refresh', title: 'Annual Renewals', desc: 'Compliance filings, handled automatically.', href: '/services/annual-renewals', tint: 'blue' },
      { icon: 'id-card', title: 'Tax Residency', desc: 'Certificate support for founders and staff.', href: '/services/tax-residency', tint: 'none' },
    ],
  },
  render: ({ eyebrow = 'Strategic Advantages', title = 'Why Global Founders Structure with GCC Startup', featured, items = [] }) => {
    const feat = featured || {
      icon: 'Shield',
      title: 'Direct Government Desk & Fast-Track Processing',
      desc: 'Direct integration with Dubai, Abu Dhabi, and Riyadh registries guarantees zero delays.',
      href: '/services',
    }
    const FeaturedIcon = ICONS[feat.icon] ?? Briefcase
    const featuredItem: BentoItem = {
      icon: <FeaturedIcon size={24} strokeWidth={1.6} />,
      title: feat.title,
      desc: feat.desc,
      href: feat.href,
    }
    const gridItems: BentoItem[] = (items || []).map((it) => {
      const Icon = ICONS[it.icon] ?? Briefcase
      return {
        icon: <Icon size={24} strokeWidth={1.6} />,
        title: it.title,
        desc: it.desc,
        href: it.href,
        tint: it.tint === 'none' ? undefined : it.tint,
      }
    })
    return (
      <section className="section">
        <div className="wrap">
          <div className="reveal" style={{ maxWidth: 640, marginBottom: 'var(--space-12)' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 style={{ marginTop: 'var(--space-2)' }}>{title}</h2>
          </div>
          <BentoGrid featured={featuredItem} items={gridItems} />
        </div>
      </section>
    )
  },
}
