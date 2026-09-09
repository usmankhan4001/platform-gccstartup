'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { ButtonLink, Flag } from '@/components/ui'
import { COUNTRY_FLAG_CODE } from '@/lib/flag-codes'
import type { PublicContact } from '@/lib/contact-routing'

type NavItem = { label: string; href: string; flagCode?: string }

const services: NavItem[] = [
  { label: 'Company Registration', href: '/services/company-registration' },
  { label: 'Bank Account Setup', href: '/services/bank-account' },
  { label: 'Nominee UBO Service', href: '/services/nominee-ubo' },
  { label: 'Shelf Companies', href: '/services/shelf-company' },
  { label: 'Tax Residency', href: '/services/tax-residency' },
  { label: 'Annual Renewals', href: '/services/annual-renewals' },
]

const jurisdictions: NavItem[] = [
  { label: 'UAE', flagCode: COUNTRY_FLAG_CODE.uae, href: '/uae' },
  { label: 'Bahrain', flagCode: COUNTRY_FLAG_CODE.bahrain, href: '/bahrain' },
  { label: 'Oman', flagCode: COUNTRY_FLAG_CODE.oman, href: '/oman' },
  { label: 'Qatar', flagCode: COUNTRY_FLAG_CODE.qatar, href: '/qatar' },
  { label: 'Hong Kong', flagCode: COUNTRY_FLAG_CODE.hongkong, href: '/hongkong' },
  { label: 'Singapore', flagCode: COUNTRY_FLAG_CODE.singapore, href: '/singapore' },
  { label: 'Ireland', flagCode: COUNTRY_FLAG_CODE.ireland, href: '/ireland' },
  { label: 'BVI & Cayman', flagCode: COUNTRY_FLAG_CODE['bvi-cayman'], href: '/bvi-cayman' },
]

const pricing: NavItem[] = [
  { label: 'Self as UBO', href: '/pricing/self-ubo' },
  { label: 'Nominee UBO', href: '/pricing/nominee-ubo' },
  { label: 'Shelf Company', href: '/pricing/shelf-company' },
]

const resources: NavItem[] = [
  { label: 'Compare Jurisdictions', href: '/compare' },
  { label: 'Business Models', href: '/business' },
  { label: 'Guides & Playbooks', href: '/guides' },
  { label: 'Blog & Insights', href: '/blog' },
  { label: 'FAQ', href: '/#faq' },
]

function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div 
      style={{ position: 'relative' }} 
      onMouseEnter={() => setOpen(true)} 
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false)
        }
      }}
    >
      <button
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          fontSize: 15,
          padding: '10px 6px',
        }}
        className="focus-ring"
      >
        {label} <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-elevated)',
            padding: 'var(--space-2)',
            minWidth: 220,
            zIndex: 50,
          }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              {item.flagCode && <Flag code={item.flagCode} size="sm" />}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar({ contact }: { contact: PublicContact }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: 22, color: 'var(--blue-dkr)' }}>
          GCC <span style={{ color: 'var(--orange)' }}>Startup</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }} className="nav-menu-desktop">
          <NavDropdown label="Services" items={services} />
          <NavDropdown label="Jurisdictions" items={jurisdictions} />
          <NavDropdown label="Pricing" items={pricing} />
          <NavDropdown label="Resources" items={resources} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="nav-actions-desktop">
          {contact.whatsappHref && (
            <ButtonLink href={contact.whatsappHref} variant="outline" target="_blank" rel="noreferrer">
              WhatsApp
            </ButtonLink>
          )}
          <ButtonLink href="/#lead-form">Book a Call</ButtonLink>
        </div>
        <button
          className="nav-burger-mobile focus-ring"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          style={{ all: 'unset', cursor: 'pointer', display: 'none', padding: '8px' }}
        >
          {drawerOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 39 }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 41,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              padding: 'var(--space-4)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <NavDrawerSection title="Services" items={services} onNavigate={() => setDrawerOpen(false)} />
            <NavDrawerSection title="Jurisdictions" items={jurisdictions} onNavigate={() => setDrawerOpen(false)} />
            <NavDrawerSection title="Pricing" items={pricing} onNavigate={() => setDrawerOpen(false)} />
            <NavDrawerSection title="Resources" items={resources} onNavigate={() => setDrawerOpen(false)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              {contact.whatsappHref && (
                <ButtonLink
                  href={contact.whatsappHref}
                  variant="outline"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setDrawerOpen(false)}
                >
                  WhatsApp
                </ButtonLink>
              )}
              <ButtonLink href="/#lead-form" onClick={() => setDrawerOpen(false)}>
                Book a Call
              </ButtonLink>
            </div>
          </div>
        </>
      )}
      <style>{`
        @media (max-width: 1024px) {
          .nav-menu-desktop, .nav-actions-desktop { display: none !important; }
          .nav-burger-mobile { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

function NavDrawerSection({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 'var(--space-3) 0',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '.03em',
        }}
      >
        {title}
        <ChevronDown size={16} aria-hidden style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 'var(--space-2)' }}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontSize: 15 }}
              onClick={onNavigate}
            >
              {item.flagCode && <Flag code={item.flagCode} size="sm" />}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
