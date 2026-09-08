import React from 'react'
import Link from 'next/link'
import {
  Building2,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Landmark,
  Scale,
  FileCheck2,
  Users,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  ExternalLink,
  PhoneCall,
  Clock,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const TOOLS = [
  {
    title: 'UAE Corporate Tax Calculator',
    description: 'Calculate your exact tax liability with Small Business Relief & 0% Qualifying Freezone Person rules.',
    href: '/tools/tax-calculator',
    badge: 'Updated 2026',
    icon: Calculator,
  },
  {
    title: 'Bank Account Odds Predictor',
    description: 'Evaluate your corporate bank approval probability across Wio, Mashreq, ENBD & FAB before applying.',
    href: '/tools/banking-odds',
    badge: 'High Impact',
    icon: Landmark,
  },
  {
    title: 'Freezone vs Mainland Quiz',
    description: 'Answer 5 questions to identify the exact UAE jurisdiction that minimizes cost and fits your business model.',
    href: '/tools/jurisdiction-quiz',
    badge: 'Interactive',
    icon: Scale,
  },
  {
    title: 'Visa & Emirates ID Estimator',
    description: 'Estimate investor, partner, and employee visa costs including medical VIP and Emirates ID biometric fees.',
    href: '/tools/visa-estimator',
    badge: 'Transparent',
    icon: Users,
  },
  {
    title: 'Company Name Eligibility Checker',
    description: 'Check your proposed business name against UAE Ministry of Economy reservation guidelines.',
    href: '/tools/name-checker',
    badge: 'Instant',
    icon: FileCheck2,
  },
  {
    title: 'VAT Registration Readiness Scorer',
    description: 'Determine whether voluntary or mandatory 5% UAE VAT registration applies to your turnover.',
    href: '/tools/vat-scorer',
    badge: 'Compliance',
    icon: ShieldCheck,
  },
]

const FREEZONES = [
  { name: 'IFZA Dubai', tag: 'Fastest Remote Setup', price: 'From AED 12,900' },
  { name: 'Meydan Free Zone', tag: 'Downtown Dubai Address', price: 'From AED 14,500' },
  { name: 'DAFZA (Dubai Airport)', tag: 'Tier 1 Global Hub', price: 'From AED 22,000' },
  { name: 'RAKEZ Ras Al Khaimah', tag: 'Cost Effective Industrial', price: 'From AED 11,500' },
  { name: 'DMCC Dubai', tag: 'Commodities & Web3', price: 'From AED 28,000' },
  { name: 'Shams Sharjah', tag: 'Media & Tech Specialists', price: 'From AED 9,500' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--surface-alt)] font-sans text-[var(--text)] antialiased">
      {/* Top Notification Bar */}
      <div className="bg-[var(--navy)] px-4 py-2 text-center text-xs text-white/90">
        <span className="font-semibold text-[var(--orange)]">2026 UAE Corporate Tax Law:</span> Small business relief threshold confirmed at AED 3M revenue (0% tax rate).
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--navy)] text-white font-black text-base shadow-sm">
              GCC
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-[var(--text)] leading-none">
                GCC Startup
              </span>
              <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                UAE Company Formation
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
            <Link href="#tools" className="hover:text-[var(--text)] transition-colors">
              Calculators &amp; Tools
            </Link>
            <Link href="#freezones" className="hover:text-[var(--text)] transition-colors">
              Freezones &amp; Pricing
            </Link>
            <Link href="/tools/tax-calculator" className="hover:text-[var(--text)] transition-colors">
              Corporate Tax
            </Link>
            <Link href="/crm" className="text-[var(--navy)] font-bold hover:underline">
              Staff CRM
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Staff Login
              </Button>
            </Link>
            <Link href="/tools/tax-calculator">
              <Button size="sm">
                Calculate Cost
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 mb-6">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Official Registered Agent &amp; Corporate Banking Specialist</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--navy)] sm:text-6xl sm:leading-tight">
            UAE Company Formation &amp; Banking{' '}
            <span className="text-[var(--orange)]">Engineered for Global Founders</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--text-secondary)] leading-relaxed">
            Incorporate remotely in Dubai or Abu Dhabi freezones with guaranteed corporate bank account filing, 0% personal tax, and zero paperwork headaches.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools/tax-calculator">
              <Button size="lg" className="shadow-md">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Setup Cost
              </Button>
            </Link>
            <Link href="/crm">
              <Button variant="outline" size="lg">
                <Briefcase className="h-4 w-4 mr-2" />
                Access CRM &amp; Pipeline
              </Button>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-4">
            <div>
              <span className="block text-2xl font-bold text-[var(--navy)]">0%</span>
              <span className="text-xs text-[var(--text-secondary)]">Personal Income Tax</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-[var(--navy)]">100%</span>
              <span className="text-xs text-[var(--text-secondary)]">Foreign Ownership</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-[var(--navy)]">3 - 5 Days</span>
              <span className="text-xs text-[var(--text-secondary)]">Fast-Track Incorporation</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-[var(--navy)]">Top Tier</span>
              <span className="text-xs text-[var(--text-secondary)]">UAE Banking Partnerships</span>
            </div>
          </div>
        </div>
      </section>

      {/* Freezones Supported */}
      <section id="freezones" className="px-6 py-16 bg-[var(--surface-alt)]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
              Premier UAE Freezone Authorities
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Direct authorized integration with Dubai and Northern Emirates licensing registries.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FREEZONES.map((fz) => (
              <div
                key={fz.name}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[var(--orange-lt)] px-2 py-0.5 text-[10px] font-bold text-[var(--orange)] uppercase">
                    {fz.tag}
                  </span>
                  <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-[var(--text)]">{fz.name}</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Complete trade license, lease agreement, and investor visa eligibility.
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                  <span className="font-bold text-[var(--navy)]">{fz.price}</span>
                  <Link href="/tools/jurisdiction-quiz" className="font-semibold text-[var(--accent)] hover:underline">
                    Compare →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Calculators & Tools */}
      <section id="tools" className="px-6 py-20 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[var(--orange)]" />
              <span>Proprietary Decision Engines</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--navy)]">
              Interactive UAE Formation &amp; Tax Calculators
            </h2>
            <p className="mt-2 max-w-xl mx-auto text-sm text-[var(--text-secondary)]">
              Use our live calculators to estimate taxes, verify bankability, and determine the exact license structure you need.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--navy)] group-hover:bg-[var(--navy)] group-hover:text-white transition-colors">
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-[var(--orange-lt)] border border-orange-200 px-2.5 py-0.5 text-[10px] font-bold text-[var(--orange)]">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                  <span>Launch Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--navy)] text-white px-6 py-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--navy)] font-black text-sm">
              GCC
            </div>
            <div>
              <span className="block text-sm font-bold">GCC Startup Platform</span>
              <span className="text-xs text-white/60">Dubai &amp; Abu Dhabi Corporate Services</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/70">
            <Link href="/crm" className="hover:text-white transition-colors">
              CRM Pipeline
            </Link>
            <Link href="/crm/inbox" className="hover:text-white transition-colors">
              WhatsApp Inbox
            </Link>
            <Link href="/tools/tax-calculator" className="hover:text-white transition-colors">
              Tax Calculator
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Staff Login
            </Link>
          </div>

          <p className="text-xs text-white/50">
            &copy; 2026 GCC Startup. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
