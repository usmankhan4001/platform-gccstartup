import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
import '@/styles/tokens.css'
import '@/styles/components.css'
import '@/styles/crm.css'
import '@/styles/admin.css'
import '@/styles/operations.css'
import '@/styles/whatsapp.css'
import '@/styles/breakpoints.css'
import './globals.css'

const satoshi = localFont({
  variable: '--font-satoshi',
  display: 'swap',
  src: [
    { path: '../../../public/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../../public/fonts/Satoshi-Black.woff2', weight: '900', style: 'normal' },
  ],
})

const clash = localFont({
  variable: '--font-clash',
  display: 'swap',
  src: [
    { path: '../../../public/fonts/ClashDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../public/fonts/ClashDisplay-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../../public/fonts/ClashDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
})

const magnita = localFont({
  variable: '--font-magnita',
  display: 'swap',
  src: [{ path: '../../../public/fonts/Magnita.woff2', weight: '400', style: 'normal' }],
})

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono-fallback',
})

export const viewport: Viewport = {
  themeColor: '#081828',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: { default: 'GCC Startup Platform', template: '%s | GCC Startup' },
  description: 'CRM, CMS, and API platform for GCC startups and international incorporation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${clash.variable} ${magnita.variable} ${jbMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
