'use client'

import React, { useState } from 'react'
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
  PhoneCall,
  Clock,
  Briefcase,
  HelpCircle,
  TrendingDown,
  ChevronDown,
  Star,
  Check,
  Send,
  Loader2,
  Zap,
} from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'

const FREEZONES = [
  {
    name: 'IFZA Dubai (Silicon Oasis)',
    tag: 'Fastest Remote Setup',
    price: 'From AED 12,900',
    turnaround: '3 Days',
    visas: 'Up to 6 Visas',
    features: ['100% Remote Incorporation', 'No Physical Office Required', 'Wio & NeoBiz Bank Eligible'],
    href: '/jurisdictions/uae',
  },
  {
    name: 'Meydan Free Zone',
    tag: 'Downtown Dubai Address',
    price: 'From AED 14,500',
    turnaround: '3 - 4 Days',
    visas: 'Up to 50 Visas',
    features: ['Prestige 5-Star Hotel Address', 'DED Instant License Protocol', 'E-commerce & Consulting'],
    href: '/jurisdictions/uae',
  },
  {
    name: 'DAFZA (Dubai Airport)',
    tag: 'Tier 1 Enterprise Hub',
    price: 'From AED 24,000',
    turnaround: '5 Days',
    visas: 'Custom Quota',
    features: ['Global Brand Prestige', 'Direct Aviation Customs Gateway', 'Dual License Option'],
    href: '/jurisdictions/uae',
  },
  {
    name: 'RAKEZ (Ras Al Khaimah)',
    tag: 'Lowest Overhead Industrial',
    price: 'From AED 11,500',
    turnaround: '3 Days',
    visas: 'Unlimited Capacity',
    features: ['Lowest Annual Renewal Fee', 'Ideal for Global Freelancers & SaaS', 'Co-working included'],
    href: '/jurisdictions/uae',
  },
  {
    name: 'DMCC (JLT Dubai)',
    tag: 'Commodities & Web3 Giant',
    price: 'From AED 28,000',
    turnaround: '7 Days',
    visas: 'Custom Quota',
    features: ['Global #1 Freezone 9x Winner', 'VARA Crypto Licensing Partner', 'Physical Gold & Coffee vault'],
    href: '/jurisdictions/uae',
  },
  {
    name: 'Saudi Arabia MISA RHQ',
    tag: 'Vision 2030 Gateway',
    price: 'From $14,500',
    turnaround: '10 Days',
    visas: 'Executive Visas',
    features: ['100% Foreign Ownership in KSA', '30-Year Zero Corporate Tax for RHQ', 'Government Tender Access'],
    href: '/jurisdictions/ksa',
  },
]

const TOOLS_SHOWCASE = [
  {
    title: 'UAE Corporate Tax Calculator',
    description: 'Calculate 0% Qualifying Freezone & Small Business Relief savings on AED 3M revenue.',
    href: '/tools/tax-calculator',
    badge: '2026 CT Law',
    icon: Calculator,
  },
  {
    title: 'Bank Account Odds Matcher',
    description: 'Predict your approval odds across Wio, Mashreq NeoBiz, ENBD, and FAB.',
    href: '/tools/banking-odds',
    badge: 'High Impact',
    icon: Landmark,
  },
  {
    title: 'Freezone vs Mainland Quiz',
    description: 'Identify the optimal UAE jurisdiction matching your business model in 4 questions.',
    href: '/tools/jurisdiction-quiz',
    badge: 'Interactive',
    icon: Scale,
  },
  {
    title: 'Visa & Emirates ID Estimator',
    description: 'Estimate investor and employee visa costs including VIP medical & biometrics.',
    href: '/tools/visa-estimator',
    badge: 'Transparent',
    icon: Users,
  },
  {
    title: 'Company Name Eligibility',
    description: 'Verify your trade name against UAE Ministry of Economy guidelines.',
    href: '/tools/name-checker',
    badge: 'Instant',
    icon: FileCheck2,
  },
  {
    title: 'VAT Readiness Scorer',
    description: 'Check mandatory vs voluntary 5% UAE VAT thresholds and penalties.',
    href: '/tools/vat-scorer',
    badge: 'Compliance',
    icon: ShieldCheck,
  },
  {
    title: 'QFZP 0% Tax Eligibility',
    description: 'Determine qualifying income rules for 0% corporate tax under Cabinet Decision 55.',
    href: '/tools/qfzp-eligibility',
    badge: 'Zero Tax',
    icon: Sparkles,
  },
  {
    title: 'UBO Privacy Matrix',
    description: 'Review public register disclosure risks and nominee fiduciary privacy options.',
    href: '/tools/ubo-privacy',
    badge: 'Confidential',
    icon: Lock,
  },
  {
    title: 'Annual Compliance Calendar',
    description: 'Track trade license renewal, AML filing, and corporate tax return deadlines.',
    href: '/tools/compliance-calendar',
    badge: 'Essential',
    icon: Clock,
  },
]

const FAQS = [
  {
    q: 'How does the 0% UAE Corporate Tax work in 2026?',
    a: 'Under Federal Decree-Law No. 47 on Corporate Tax, businesses can benefit from 0% tax through two primary mechanisms: (1) Small Business Relief for entities with annual revenue up to AED 3,000,000, and (2) Qualifying Free Zone Persons (QFZP) earning qualifying income from transactions with other freezones or international entities.',
  },
  {
    q: 'Can I incorporate 100% remotely without visiting the UAE?',
    a: 'Yes! The entire company registration and trade license issuance is completed 100% digitally. You only need to visit the UAE for 2–3 business days later when completing your Emirates ID biometric scan and VIP medical test for your residency visa.',
  },
  {
    q: 'How long does corporate bank account opening take?',
    a: 'Digital banking platforms (Wio Bank, Mashreq NeoBiz) approve accounts in 2 to 5 working days with our direct relationship manager routing. Traditional tier-1 banks (Emirates NBD, ADCB, FAB) take 10 to 20 business days.',
  },
  {
    q: 'What is the Nominee UBO service and is it legal?',
    a: 'Nominee UBO & fiduciary director structures are 100% legal instruments backed by an institutional Declaration of Trust, Power of Attorney, and non-beneficial agreements. This ensures your personal name does not appear in public commercial registries while retaining 100% economic control and banking signature power.',
  },
  {
    q: 'What is the difference between a Freezone and a Mainland license?',
    a: 'Freezone entities enjoy 0% personal tax, fast setup, and 100% foreign ownership with zero customs duties in the zone. Mainland (DED) licenses allow direct commercial contracting anywhere inside the local UAE mainland market without a local agent.',
  },
]

export default function HomePage() {
  // Live Cost Estimator State
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('ifza')
  const [visasCount, setVisasCount] = useState(1)
  const [needBanking, setNeedBanking] = useState(true)
  const [needNominee, setNeedNominee] = useState(false)

  // Lead Form State
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: 'UAE',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Calculate live estimation
  const baseCost = selectedJurisdiction === 'ifza' ? 12900 : selectedJurisdiction === 'meydan' ? 14500 : selectedJurisdiction === 'dmcc' ? 28000 : 11500
  const visaCost = visasCount * 4500
  const bankingCost = needBanking ? 3500 : 0
  const nomineeCost = needNominee ? 25000 : 0
  const totalCostAED = baseCost + visaCost + bankingCost + nomineeCost
  const totalCostUSD = Math.round(totalCostAED / 3.6725)

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          source: 'homepage_cost_estimator',
          estimated_value: totalCostUSD,
          calculator_data: {
            jurisdiction: selectedJurisdiction,
            visas: visasCount,
            needBanking,
            needNominee,
            totalCostAED,
            totalCostUSD,
          },
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Lead submit failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#FFFFFF] text-[#0F172A]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC] pt-16 pb-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-xs mb-8">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Official Registered Agent &amp; Tier-1 Banking Specialist</span>
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">500+ Entities Formed</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0A142F] leading-[1.08]">
              Incorporate in the UAE with{' '}
              <span className="text-[#F26522] underline decoration-[#F26522]/30 decoration-wavy">
                Guaranteed Banking
              </span>{' '}
              &amp; 0% Corporate Tax
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg sm:text-xl text-[#334155] leading-relaxed max-w-2xl mx-auto">
              Fast-track remote incorporation in Dubai &amp; Abu Dhabi freezones. Transparent registry pricing, fast Emirates ID biometrics, and zero paperwork headaches.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#estimator"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-base shadow-lg shadow-orange-500/20 transition-all hover:scale-102"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calculate Exact Setup Fee
              </a>
              <Link
                href="/tools/jurisdiction-quiz"
                className="inline-flex items-center justify-center px-7 py-4 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white font-bold text-base shadow-md transition-all hover:scale-102"
              >
                <Scale className="h-5 w-5 mr-2" />
                Take Freezone Quiz
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="mt-14 pt-8 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="block text-3xl font-black text-[#0A142F]">0%</span>
                <span className="text-xs font-semibold text-[#64748B]">Personal Income Tax Rate</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="block text-3xl font-black text-[#F26522]">3 - 5 Days</span>
                <span className="text-xs font-semibold text-[#64748B]">Average License Delivery</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="block text-3xl font-black text-[#0A142F]">100%</span>
                <span className="text-xs font-semibold text-[#64748B]">Foreign Equity Ownership</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="block text-3xl font-black text-[#1039AC]">99.2%</span>
                <span className="text-xs font-semibold text-[#64748B]">Bank Approval Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE COST ESTIMATOR WIDGET */}
      <section id="estimator" className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
              Transparent Calculator
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F]">
              Real-Time UAE Incorporation Fee Estimator
            </h2>
            <p className="mt-2 text-[#334155] text-sm">
              Adjust your jurisdiction, visa requirements, and banking preferences for an instant transparent quote.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-[#0A142F] uppercase tracking-wider mb-2">
                  1. Select Freezone Authority
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ifza', name: 'IFZA Dubai', price: 'AED 12,900', note: 'Fast remote setup' },
                    { id: 'meydan', name: 'Meydan Free Zone', price: 'AED 14,500', note: 'Downtown Dubai' },
                    { id: 'rakez', name: 'RAKEZ Northern', price: 'AED 11,500', note: 'Low renewal fee' },
                    { id: 'dmcc', name: 'DMCC Dubai', price: 'AED 28,000', note: 'Tier 1 Commodity/Crypto' },
                  ].map((fz) => (
                    <button
                      key={fz.id}
                      type="button"
                      onClick={() => setSelectedJurisdiction(fz.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedJurisdiction === fz.id
                          ? 'border-[#F26522] bg-white ring-2 ring-[#F26522]/20 shadow-sm'
                          : 'border-[#E2E8F0] bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#0F172A]">{fz.name}</span>
                        {selectedJurisdiction === fz.id && <CheckCircle2 className="h-4 w-4 text-[#F26522]" />}
                      </div>
                      <div className="mt-1 text-xs font-extrabold text-[#0A142F]">{fz.price}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">{fz.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-[#0A142F] uppercase tracking-wider">
                    2. Residency Visas Needed (Investor / Partner / Employee)
                  </label>
                  <span className="text-sm font-black text-[#F26522]">{visasCount} Visa{visasCount > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={visasCount}
                  onChange={(e) => setVisasCount(Number(e.target.value))}
                  className="w-full accent-[#F26522] h-2 bg-[#E2E8F0] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-semibold text-[#64748B] mt-1">
                  <span>0 (License Only)</span>
                  <span>1 Visa</span>
                  <span>2 Visas</span>
                  <span>3 Visas</span>
                  <span>4+ Visas</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-black text-[#0A142F] uppercase tracking-wider block">
                  3. Executive Add-Ons
                </label>
                <div
                  onClick={() => setNeedBanking((v) => !v)}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    needBanking ? 'border-[#1B4FD8] bg-blue-50/40' : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-[#1B4FD8]" />
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">VIP Corporate Bank Guarantee Filing</div>
                      <div className="text-[11px] text-[#64748B]">Wio, NeoBiz &amp; ENBD dedicated manager filing</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0A142F]">+AED 3,500</span>
                </div>

                <div
                  onClick={() => setNeedNominee((v) => !v)}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    needNominee ? 'border-[#F26522] bg-orange-50/40' : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#F26522]" />
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Nominee UBO &amp; Fiduciary Privacy Shield</div>
                      <div className="text-[11px] text-[#64748B]">Complete public register concealment &amp; trust deed</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0A142F]">+AED 25,000</span>
                </div>
              </div>
            </div>

            {/* Right Result & Booking Card */}
            <div className="lg:col-span-5 bg-[#0A142F] text-white rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#F26522]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Estimated Total Fee</span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#F26522] text-[10px] font-black uppercase">All-Inclusive</span>
              </div>

              <div className="my-6">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  AED {totalCostAED.toLocaleString()}
                </div>
                <div className="text-sm font-semibold text-[#F26522] mt-1">
                  Approx. ${totalCostUSD.toLocaleString()} USD
                </div>
                <p className="text-xs text-white/60 mt-2">
                  Includes government registration fees, electronic memorandum (MOA), establishment card, and compliance clearance.
                </p>
              </div>

              <div className="space-y-2 text-xs text-white/80 py-4 border-t border-b border-white/10">
                <div className="flex justify-between">
                  <span>Trade License &amp; Lease:</span>
                  <span className="font-bold">AED {baseCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Residency Visa Quota ({visasCount}x):</span>
                  <span className="font-bold">AED {visaCost.toLocaleString()}</span>
                </div>
                {needBanking && (
                  <div className="flex justify-between text-blue-300">
                    <span>Corporate Banking Concierge:</span>
                    <span className="font-bold">AED 3,500</span>
                  </div>
                )}
                {needNominee && (
                  <div className="flex justify-between text-orange-300">
                    <span>Fiduciary UBO Protection:</span>
                    <span className="font-bold">AED 25,000</span>
                  </div>
                )}
              </div>

              {/* Instant Inquiry Form */}
              <div className="mt-6" id="lead-form">
                {submitted ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-white">Quotation Request Received!</h4>
                    <p className="text-xs text-white/80 mt-1">
                      Our senior Dubai formation advisor has been assigned and will connect over WhatsApp within 15 minutes.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Corporate Email *"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp Phone *"
                        required
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {submitting ? 'Submitting Quote...' : 'Lock In Quote & Book Advisor'}
                    </button>
                    <p className="text-[10px] text-white/40 text-center">
                      🔒 Zero spam. Strict confidentiality. Instant PDF quotation dispatch.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR FREEZONES MATRIX */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8]">
                Licensing Authorities
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#0A142F]">
                Premier UAE &amp; GCC Jurisdictions
              </h2>
            </div>
            <Link
              href="/compare"
              className="mt-4 md:mt-0 text-sm font-bold text-[#1B4FD8] hover:underline flex items-center gap-1"
            >
              View Freezone vs Mainland Matrix →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FREEZONES.map((fz) => (
              <div
                key={fz.name}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#FEF1E9] text-[#F26522]">
                      {fz.tag}
                    </span>
                    <Building2 className="h-4 w-4 text-[#64748B]" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#0F172A]">{fz.name}</h3>
                  <div className="mt-2 text-2xl font-black text-[#0A142F]">{fz.price}</div>

                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2 text-xs text-[#334155]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Turnaround: {fz.turnaround}</span>
                      <span>Visa Quota: {fz.visas}</span>
                    </div>
                    {fz.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <Link
                    href={fz.href}
                    className="text-xs font-bold text-[#1B4FD8] hover:underline"
                  >
                    Jurisdiction Guide
                  </Link>
                  <a
                    href="#estimator"
                    className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
                  >
                    Get Quote →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 10 PROPRIETARY TOOLS BENTO SHOWCASE */}
      <section className="py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
              Founder Toolkit
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F]">
              10 Interactive Formation &amp; Tax Decision Engines
            </h2>
            <p className="mt-2 text-[#334155] text-sm">
              Instant answers without paying hourly legal consultation fees. Built with real 2026 UAE Corporate Tax rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS_SHOWCASE.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group bg-[#F8FAFC] hover:bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#1B4FD8] p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#E2E8F0] text-[#0A142F] group-hover:bg-[#0A142F] group-hover:text-white flex items-center justify-center transition-colors">
                      <tool.icon className="h-5 w-5" />
                    </div>
                    {tool.badge && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1B4FD8]">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-[#1B4FD8] group-hover:translate-x-1 transition-transform">
                  <span>Launch Interactive Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section id="faq" className="py-20 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8]">
              Frequently Answered
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-[#0A142F]">
              UAE Formation &amp; Tax Compliance FAQ
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={faq.q}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left font-bold text-sm text-[#0F172A] flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#64748B] transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-[#F26522]' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-[#334155] leading-relaxed border-t border-[#F1F5F9]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
