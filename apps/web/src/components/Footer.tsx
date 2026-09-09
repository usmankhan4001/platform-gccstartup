import Link from 'next/link'
import type { PublicContact } from '@/lib/contact-routing'

const serviceLinks = [
  { label: 'Company Registration', href: '/services/company-registration' },
  { label: 'Bank Account Setup', href: '/services/bank-account' },
  { label: 'Nominee UBO Service', href: '/services/nominee-ubo' },
  { label: 'Shelf Companies', href: '/services/shelf-company' },
  { label: 'Tax Residency', href: '/services/tax-residency' },
  { label: 'Annual Renewals', href: '/services/annual-renewals' },
]

const pricingLinks = [
  { label: 'Self as UBO', href: '/pricing/self-ubo' },
  { label: 'Nominee UBO', href: '/pricing/nominee-ubo' },
  { label: 'Shelf Company', href: '/pricing/shelf-company' },
]

const jurisdictionLinks = [
  { label: 'UAE', href: '/uae' },
  { label: 'Bahrain', href: '/bahrain' },
  { label: 'Oman', href: '/oman' },
  { label: 'Qatar', href: '/qatar' },
  { label: 'Hong Kong', href: '/hongkong' },
  { label: 'Singapore', href: '/singapore' },
  { label: 'Ireland', href: '/ireland' },
  { label: 'BVI & Cayman', href: '/bvi-cayman' },
]

const resourceLinks = [
  { label: 'Compare Jurisdictions', href: '/compare' },
  { label: 'Business Models', href: '/business' },
  { label: 'Guides & Playbooks', href: '/guides' },
  { label: 'Blog & Insights', href: '/blog' },
]

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Terms', href: '/terms' },
]

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h5 style={{ color: 'var(--white)', fontSize: 16, marginBottom: 'var(--space-3)' }}>{title}</h5>
      <ul style={{ listStyle: 'none', display: 'grid', gap: 'var(--space-2)' }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} style={{ color: 'rgba(255,255,255,.6)', fontSize: 16, display: 'inline-block', padding: '4px 0' }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer({ contact }: { contact: PublicContact }) {
  return (
    <footer style={{ background: '#0B1526', paddingTop: 'var(--space-16)' }}>
      <div className="wrap">
        <div
          className="footer-grid"
          style={{
            paddingBottom: 'var(--space-12)',
            borderBottom: '1px solid rgba(255,255,255,.07)',
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--white)' }}>
              GCC <span style={{ color: 'var(--orange)' }}>Startup</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,.6)', marginTop: 'var(--space-3)', fontSize: 16 }}>
              Global company registration and tax optimization. Founded by a Finance Director with deep UAE oil &amp;
              gas corporate finance expertise. Trusted by 500+ entrepreneurs worldwide.
            </p>
          </div>
          <FooterCol title="Services" links={serviceLinks} />
          <FooterCol title="Jurisdictions" links={jurisdictionLinks} />
          <FooterCol title="Resources" links={resourceLinks} />
          <div>
            <FooterCol title="Pricing" links={pricingLinks} />
            {(contact.email || contact.phone || contact.whatsappHref) && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <h5 style={{ color: 'var(--white)', fontSize: 16, marginBottom: 'var(--space-2)' }}>Contact</h5>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} style={{ color: 'rgba(255,255,255,.6)', fontSize: 16, display: 'block', wordBreak: 'break-word' }}>
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} style={{ color: 'rgba(255,255,255,.6)', fontSize: 16, display: 'block' }}>
                    {contact.phone}
                  </a>
                )}
                {contact.whatsappHref && (
                  <a href={contact.whatsappHref} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,.6)', fontSize: 16, display: 'block' }}>
                    WhatsApp consultation
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            padding: 'var(--space-6) 0',
            fontSize: 14,
            color: 'rgba(255,255,255,.6)',
          }}
        >
          <span>&copy; {new Date().getFullYear()} GCCStartup.com. All rights reserved.</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </div>
          <span>Information only. Professional advice depends on your circumstances and jurisdiction.</span>
        </div>
      </div>
    </footer>
  )
}
