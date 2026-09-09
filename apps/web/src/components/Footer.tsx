import Link from 'next/link'
import { ShieldCheck, Lock, Award, Mail, Phone, ExternalLink } from 'lucide-react'
import type { PublicContact } from '@/lib/contact-routing'

const services = [
  { label: 'Company Registration', href: '/services/company-registration' },
  { label: 'Corporate Banking Setup', href: '/services/bank-account' },
  { label: 'Nominee UBO & Fiduciary', href: '/services/nominee-ubo' },
  { label: 'Shelf Companies & Aged Entities', href: '/services/shelf-company' },
  { label: '10-Year UAE Golden Visa', href: '/services/tax-residency' },
  { label: 'Annual Renewals & Compliance', href: '/services/annual-renewals' },
]

const jurisdictions = [
  { label: 'Dubai Freezones (IFZA, Meydan, DMCC)', href: '/jurisdictions/uae' },
  { label: 'UAE Mainland (DED)', href: '/jurisdictions/uae' },
  { label: 'Saudi Arabia (MISA RHQ)', href: '/jurisdictions/ksa' },
  { label: 'Qatar Financial Centre (QFC)', href: '/jurisdictions/qatar' },
  { label: 'Oman & Bahrain Commercial', href: '/jurisdictions/oman' },
  { label: 'Singapore & Hong Kong Hubs', href: '/jurisdictions/singapore' },
]

const tools = [
  { label: 'Corporate Tax Calculator', href: '/tools/tax-calculator' },
  { label: 'Bank Account Odds Matcher', href: '/tools/banking-odds' },
  { label: 'Jurisdiction Fit Quiz', href: '/tools/jurisdiction-quiz' },
  { label: 'QFZP 0% Tax Eligibility', href: '/tools/qfzp-eligibility' },
  { label: 'Visa Cost & Biometrics Estimator', href: '/tools/visa-estimator' },
  { label: 'Freezone vs Mainland Matrix', href: '/compare' },
]

const resources = [
  { label: 'Compare Jurisdictions', href: '/compare' },
  { label: 'Knowledge Base & Playbooks', href: '/guides' },
  { label: 'Market Insights & Tax Law', href: '/blog' },
  { label: 'Pricing & Transparent Fees', href: '/pricing' },
  { label: 'FAQ & Compliance Deadlines', href: '/#faq' },
]

const legal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Settings', href: '/cookies' },
  { label: 'Terms of Engagement', href: '/terms' },
  { label: 'Staff Login', href: '/login' },
]

export function Footer({ contact }: { contact: PublicContact }) {
  return (
    <footer className="bg-[#0A142F] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white text-[#0A142F] font-black text-lg flex items-center justify-center shadow-md">
                GCC
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                  GCC <span className="text-[#F26522]">Startup</span>
                </span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">
                  Corporate Advisory &amp; Tax Solutions
                </span>
              </div>
            </Link>

            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm">
              The premier institution for global founders, tech scaleups, and family offices incorporating in the UAE, Saudi Arabia, and the broader GCC. Direct authorized registry access with zero middlemen.
            </p>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/80">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-[#F26522]" />
                <span>Licensed Corporate Agent</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>Strict UBO Privacy</span>
              </div>
            </div>

            {/* Contact Details */}
            {(contact.email || contact.phone || contact.whatsappHref) && (
              <div className="mt-6 space-y-2 text-sm text-white/80">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-[#F26522] transition-colors">
                    <Mail className="h-4 w-4 text-[#F26522]" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-[#F26522] transition-colors">
                    <Phone className="h-4 w-4 text-[#F26522]" />
                    {contact.phone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links Col 1: Services */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
              Corporate Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {services.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Col 2: Jurisdictions */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
              Jurisdictions
            </h4>
            <ul className="space-y-2.5 text-sm">
              {jurisdictions.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Col 3: Tools & Resources */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-4">
              Decision Engines
            </h4>
            <ul className="space-y-2.5 text-sm">
              {tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>&copy; {new Date().getFullYear()} GCCStartup.com. All rights reserved. Dubai &amp; Riyadh Corporate Desks.</p>
          <div className="flex flex-wrap items-center gap-6">
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
