'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Menu,
  X,
  Building2,
  Landmark,
  ShieldCheck,
  Calculator,
  Scale,
  FileCheck2,
  Users,
  Briefcase,
  Sparkles,
  Lock,
  ArrowRight,
  PhoneCall,
  CalendarCheck2,
  Receipt,
  Layers,
} from 'lucide-react'
import { Button, ButtonLink, Flag } from '@/components/ui'
import { COUNTRY_FLAG_CODE } from '@/lib/flag-codes'
import type { PublicContact } from '@/lib/contact-routing'

interface MegaItem {
  label: string
  href: string
  description?: string
  badge?: string
  icon?: any
  flagCode?: string
}

const servicesList: MegaItem[] = [
  {
    label: 'Company Registration',
    href: '/services/company-registration',
    description: 'Fast-track UAE freezone & mainland trade license formation.',
    badge: 'Fast-Track',
    icon: Building2,
  },
  {
    label: 'Bank Account Opening',
    href: '/services/bank-account',
    description: 'Guaranteed tier-1 UAE & international corporate bank filing.',
    badge: 'High Odds',
    icon: Landmark,
  },
  {
    label: 'Nominee UBO & Fiduciary',
    href: '/services/nominee-ubo',
    description: 'Institutional-grade privacy, trustee ownership, and nominee directors.',
    badge: 'VIP Privacy',
    icon: ShieldCheck,
  },
  {
    label: 'Shelf Companies',
    href: '/services/shelf-company',
    description: 'Aged UAE entities with clean history and immediate bankability.',
    badge: 'Instant Transfer',
    icon: Layers,
  },
  {
    label: 'Tax Residency & Golden Visas',
    href: '/services/tax-residency',
    description: '10-Year UAE Golden Visa & physical tax residence certificates.',
    badge: '0% Tax',
    icon: Users,
  },
  {
    label: 'Annual Renewals & Compliance',
    href: '/services/annual-renewals',
    description: 'Trade license renewal, AML filing, accounting, and VAT audits.',
    badge: 'Recurring',
    icon: CalendarCheck2,
  },
]

const jurisdictionsList: MegaItem[] = [
  {
    label: 'United Arab Emirates (UAE)',
    href: '/jurisdictions/uae',
    description: 'IFZA, Meydan, RAKEZ, DAFZA, DMCC & Mainland.',
    flagCode: COUNTRY_FLAG_CODE.uae,
    badge: '0% - 9%',
  },
  {
    label: 'Saudi Arabia (KSA)',
    href: '/jurisdictions/ksa',
    description: 'MISA 100% Foreign Ownership & Regional HQ (RHQ).',
    flagCode: COUNTRY_FLAG_CODE.bahrain,
    badge: 'Vision 2030',
  },
  {
    label: 'Qatar (QFC)',
    href: '/jurisdictions/qatar',
    description: 'Qatar Financial Centre with 100% foreign repatriation.',
    flagCode: COUNTRY_FLAG_CODE.qatar,
    badge: '10% Tax',
  },
  {
    label: 'Oman & Bahrain',
    href: '/jurisdictions/oman',
    description: 'Strategic Gulf trade gateways with zero personal tax.',
    flagCode: COUNTRY_FLAG_CODE.oman,
    badge: 'GCC Market',
  },
  {
    label: 'Hong Kong & Singapore',
    href: '/jurisdictions/singapore',
    description: 'Top-tier Asian financial hubs with territorial tax systems.',
    flagCode: COUNTRY_FLAG_CODE.singapore,
    badge: 'APAC',
  },
  {
    label: 'BVI & Cayman Islands',
    href: '/jurisdictions/bvi-cayman',
    description: 'Pure tax neutrality and international holding structures.',
    flagCode: COUNTRY_FLAG_CODE['bvi-cayman'],
    badge: 'Offshore',
  },
]

const pricingList: MegaItem[] = [
  {
    label: 'Self as UBO Package',
    href: '/pricing/self-ubo',
    description: 'Full 100% direct founder ownership, trade license, and visa quota.',
    badge: 'From $4,800',
    icon: Building2,
  },
  {
    label: 'Nominee UBO Service',
    href: '/pricing/nominee-ubo',
    description: 'Ultimate privacy shielding with declaration of trust & nominee director.',
    badge: 'From $12,500',
    icon: ShieldCheck,
  },
  {
    label: 'Aged Shelf Company',
    href: '/pricing/shelf-company',
    description: 'Immediate operational age with existing trade license and good standing.',
    badge: 'From $11,000',
    icon: Layers,
  },
  {
    label: 'Compare All Packages',
    href: '/pricing',
    description: 'Full transparent breakdown of registry fees, visa costs, and renewals.',
    icon: Scale,
  },
]

const toolsList: MegaItem[] = [
  {
    label: 'Corporate Tax Calculator',
    href: '/tools/tax-calculator',
    description: 'Calculate 0% Qualifying Freezone & Small Business Relief savings.',
    badge: '2026 CT Law',
    icon: Calculator,
  },
  {
    label: 'Bank Account Odds Predictor',
    href: '/tools/banking-odds',
    description: 'Test approval odds across Wio, Mashreq, ENBD & FAB before filing.',
    badge: 'High Impact',
    icon: Landmark,
  },
  {
    label: 'Jurisdiction Fit Quiz',
    href: '/tools/jurisdiction-quiz',
    description: 'Identify the ideal UAE or GCC freezone for your business model in 2 mins.',
    badge: 'Interactive',
    icon: Scale,
  },
  {
    label: 'QFZP 0% Tax Eligibility',
    href: '/tools/qfzp-eligibility',
    description: 'Verify qualifying income requirements for zero corporate tax.',
    icon: ShieldCheck,
  },
  {
    label: 'Visa & Emirates ID Estimator',
    href: '/tools/visa-estimator',
    description: 'Estimate investor, partner, and employee visa costs.',
    icon: Users,
  },
  {
    label: 'Company Name Checker',
    href: '/tools/name-checker',
    description: 'Verify proposed entity names against UAE Ministry guidelines.',
    icon: FileCheck2,
  },
  {
    label: 'UBO Privacy Matrix',
    href: '/tools/ubo-privacy',
    description: 'Evaluate public registry disclosure risks and protection tiers.',
    icon: Lock,
  },
  {
    label: 'VAT Readiness Scorer',
    href: '/tools/vat-scorer',
    description: 'Check mandatory vs voluntary 5% UAE VAT threshold status.',
    icon: Receipt,
  },
  {
    label: 'Compliance Calendar',
    href: '/tools/compliance-calendar',
    description: 'Track trade license, visa, and corporate tax deadlines.',
    icon: CalendarCheck2,
  },
  {
    label: 'Instant NDA Generator',
    href: '/tools/generate-nda',
    description: 'Draft DIFC/ADGM compliant bilateral non-disclosure agreements.',
    icon: Sparkles,
  },
]

export function Navbar({ contact }: { contact: PublicContact }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* Top Banner */}
      <div className="bg-[#0A142F] text-white/90 text-xs py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
            <span className="font-semibold text-[#F26522]">2026 Corporate Tax Update:</span>
            <span className="hidden sm:inline text-white/80">Small Business Relief threshold confirmed at AED 3M revenue (0% tax).</span>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <Link href="/tools" className="hover:text-white transition-colors">
              10 Free Tools
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/crm" className="hover:text-[#F26522] font-semibold transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-[#0A142F] text-white font-black text-lg flex items-center justify-center shadow-md group-hover:bg-[#F26522] transition-colors">
                GCC
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-[#0A142F] leading-none">
                  GCC <span className="text-[#F26522]">Startup</span>
                </span>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                  Corporate &amp; Tax Advisory
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Mega-Menus */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('services')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors cursor-pointer"
                >
                  Services
                  <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${activeMenu === 'services' ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === 'services' && (
                  <div className="absolute top-full left-0 w-[580px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-4 grid grid-cols-2 gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {servicesList.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#1B4FD8] flex items-center justify-center shrink-0 group-hover:bg-[#0A142F] group-hover:text-white transition-colors">
                          <item.icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-[#FEF1E9] text-[#F26522] uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Jurisdictions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('jurisdictions')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors cursor-pointer"
                >
                  Jurisdictions
                  <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${activeMenu === 'jurisdictions' ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === 'jurisdictions' && (
                  <div className="absolute top-full left-0 w-[540px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-4 grid grid-cols-2 gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {jurisdictionsList.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="pt-0.5">
                          {item.flagCode && <Flag code={item.flagCode} size="sm" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-[#EFF6FF] text-[#1B4FD8] uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#1B4FD8]">
                      <Link href="/compare" className="hover:underline flex items-center gap-1">
                        Compare Freezone vs Mainland Matrix →
                      </Link>
                      <Link href="/jurisdictions" className="hover:underline">
                        View All Jurisdictions →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('pricing')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors cursor-pointer"
                >
                  Pricing
                  <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${activeMenu === 'pricing' ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === 'pricing' && (
                  <div className="absolute top-full left-0 w-[420px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-4 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {pricingList.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-[#FEF1E9] text-[#F26522] flex items-center justify-center shrink-0">
                          {item.icon && <item.icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-xs font-black text-[#0A142F]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculators & Tools Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('tools')}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#F26522]" />
                  Tools &amp; Quiz
                  <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform ${activeMenu === 'tools' ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === 'tools' && (
                  <div className="absolute top-full -left-20 w-[640px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-4 grid grid-cols-2 gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {toolsList.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] text-[#0A142F] border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:bg-[#0A142F] group-hover:text-white transition-colors">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-[#FEF1E9] text-[#F26522] uppercase">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-[#E2E8F0] text-center">
                      <Link href="/tools" className="text-xs font-bold text-[#1B4FD8] hover:underline">
                        Explore All 10 Interactive Decision Engines →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Compare & Resources Direct Links */}
              <Link
                href="/compare"
                className="px-3 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors"
              >
                Compare
              </Link>
              <Link
                href="/blog"
                className="px-3 py-2 text-sm font-semibold text-[#334155] hover:text-[#0A142F] rounded-lg transition-colors"
              >
                Insights
              </Link>
            </div>

            {/* Desktop Right CTA Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {contact.whatsappHref ? (
                <ButtonLink
                  href={contact.whatsappHref}
                  variant="outline"
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className="gap-1.5 border-[#CBD5E1] text-[#0A142F] hover:bg-[#F8FAFC]"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#25D366]" />
                  WhatsApp
                </ButtonLink>
              ) : (
                <ButtonLink
                  href="/tools/tax-calculator"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Calculator className="h-3.5 w-3.5 text-[#F26522]" />
                  Calculate Cost
                </ButtonLink>
              )}

              <ButtonLink
                href="/#lead-form"
                size="sm"
                className="bg-[#0A142F] hover:bg-[#1039AC] text-white font-bold shadow-sm"
              >
                Book a Call
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </ButtonLink>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen((o) => !o)}
                className="p-2 rounded-lg text-[#0A142F] hover:bg-[#F8FAFC] focus:outline-none"
                aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {drawerOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {drawerOpen && (
          <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-4 pb-8 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Services</div>
              <div className="grid grid-cols-1 gap-1">
                {servicesList.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    <item.icon className="h-4 w-4 text-[#1B4FD8]" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Jurisdictions</div>
              <div className="grid grid-cols-1 gap-1">
                {jurisdictionsList.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    {item.flagCode && <Flag code={item.flagCode} size="sm" />}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#64748B] mb-2">Interactive Tools</div>
              <div className="grid grid-cols-2 gap-1.5">
                {toolsList.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#F26522]" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2.5">
              {contact.whatsappHref && (
                <ButtonLink
                  href={contact.whatsappHref}
                  variant="outline"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <PhoneCall className="h-4 w-4 text-[#25D366]" />
                  Chat on WhatsApp
                </ButtonLink>
              )}
              <ButtonLink
                href="/#lead-form"
                onClick={() => setDrawerOpen(false)}
                className="w-full bg-[#0A142F] text-white font-bold"
              >
                Book a Free Consultation
              </ButtonLink>
              <ButtonLink
                href="/crm"
                variant="ghost"
                onClick={() => setDrawerOpen(false)}
                className="w-full text-xs font-bold text-[#64748B]"
              >
                Staff Portal Login →
              </ButtonLink>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
