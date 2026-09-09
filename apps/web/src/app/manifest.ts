import type { MetadataRoute } from 'next'

/**
 * PWA manifest. The platform is used in the field by agents and legal desks, so
 * it installs as a standalone app (no browser chrome) and deep-links straight
 * into the four screens they actually open on a phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GCC Startup Platform',
    short_name: 'GCC Startup',
    description: 'Unified CRM, CMS, inbox and automation platform for GCC company formation.',
    start_url: '/crm',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0A142F',
    theme_color: '#0A142F',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Deals Pipeline', url: '/crm' },
      { name: 'WhatsApp Inbox', url: '/crm/inbox' },
      { name: 'Renewals Ledger', url: '/crm/renewals' },
      { name: 'Quick Lead Capture', url: '/crm?action=new-lead' },
    ],
  }
}
