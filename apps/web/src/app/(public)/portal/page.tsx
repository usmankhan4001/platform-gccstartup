import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Search, Headphones, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Client Incorporation Portal | GCC Startup',
  description: 'Manage your GCC company formation, explore packages, submit incorporation applications, and track government dossier filings.',
}

export default function PortalHubPage() {
  const options = [
    {
      title: 'Choose Formation Package',
      description: 'Compare UAE, Saudi Arabia, Qatar, and Bahrain company formation tiers with transparent government and processing fee breakdowns.',
      href: '/portal/package-selection',
      icon: Sparkles,
      actionText: 'Browse Packages',
      badge: 'Popular Entry',
      badgeColor: '#0F4C81',
    },
    {
      title: 'Submit Formation Application',
      description: 'Fill out your shareholder details, business activities, jurisdiction preferences, and submit your KYC documents directly to our formation team.',
      href: '/portal/application',
      icon: FileText,
      actionText: 'Start Application',
      badge: 'Direct Filing',
      badgeColor: '#16A34A',
    },
    {
      title: 'Track Existing Dossier',
      description: 'Enter your tracking token or reference number to view real-time department approvals, MOA drafts, and trade license issuance milestones.',
      href: '/track',
      icon: Search,
      actionText: 'Track Progress',
      badge: 'Real-time',
      badgeColor: '#D97706',
    },
    {
      title: 'Client Support & Inquiries',
      description: 'Connect with a certified GCC incorporation specialist, submit a priority support ticket, or schedule a corporate structuring consultation.',
      href: '/support',
      icon: Headphones,
      actionText: 'Get Support',
      badge: '24/7 Advisory',
      badgeColor: '#6366F1',
    },
  ]

  return (
    <div style={{ minHeight: '85vh', background: 'var(--surface-alt, #F8FAFC)', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(15, 76, 129, 0.08)',
            color: 'var(--primary, #0F4C81)',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            <ShieldCheck size={16} />
            GCC Enterprise Onboarding Hub
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Cinzel", serif)',
            fontSize: 'clamp(30px, 4vw, 42px)',
            fontWeight: 700,
            color: 'var(--navy-900, #0A192F)',
            margin: '0 0 12px 0',
          }}>
            Client Incorporation Portal
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-muted, #64748B)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Welcome to the GCC Startup portal. Select your desired service below to begin your corporate structuring, continue an application, or monitor active registry filings.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}>
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <div
                key={opt.title}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid var(--border, #E2E8F0)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(15, 76, 129, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary, #0F4C81)',
                    }}>
                      <Icon size={24} />
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: `${opt.badgeColor}15`,
                      color: opt.badgeColor,
                    }}>
                      {opt.badge}
                    </span>
                  </div>

                  <h2 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--navy-900, #0A192F)',
                    margin: '0 0 10px 0',
                  }}>
                    {opt.title}
                  </h2>

                  <p style={{
                    fontSize: 14,
                    color: 'var(--text-muted, #64748B)',
                    lineHeight: 1.5,
                    margin: '0 0 24px 0',
                  }}>
                    {opt.description}
                  </p>
                </div>

                <Link
                  href={opt.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 10,
                    background: 'var(--primary, #0F4C81)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <span>{opt.actionText}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border-light, #F1F5F9)',
          padding: '24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--navy-800, #1E293B)', fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span>100% Guaranteed Official Trade Licenses</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--navy-800, #1E293B)', fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span>Full VIP Bank Account Assistance</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--navy-800, #1E293B)', fontWeight: 600 }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span>Dedicated Corporate Relationship Manager</span>
          </div>
        </div>
      </div>
    </div>
  )
}
