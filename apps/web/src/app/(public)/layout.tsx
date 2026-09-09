import { Suspense } from 'react'
import { headers } from 'next/headers'
import { RevealObserver } from '@/components/ui/RevealObserver'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WhatsAppWidget, MobileCtaBar, ExitIntentModal } from '@/components/ui'
import { UtmCapture } from '@/components/ui/UtmCapture'
import { AnalyticsScripts } from '@/components/seo/AnalyticsScripts'
import { CookieConsent } from '@/components/consent/CookieConsent'
import { SupportWidget } from '@/components/support/SupportWidget'
import { getPublicContactRoutes, getSiteSettings } from '@/lib/directus'
import { resolvePublicContact } from '@/lib/contact-routing'
import '@/styles/cookie-consent.css'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const [settings, contactRoutes] = await Promise.all([getSiteSettings(), getPublicContactRoutes()])
  const contact = resolvePublicContact(settings, contactRoutes, requestHeaders)

  return (
    <CookieConsent>
      <AnalyticsScripts settings={settings} />
      <Suspense fallback={null}>
        <UtmCapture />
      </Suspense>
      {/* `.site-root` is what scopes the scroll-reveal start state in tokens.css to
          the public site. It has to wrap everything RevealObserver observes, and it
          must exist nowhere else — the Puck editor's preview iframe copies the same
          stylesheets but runs no observer, so an unscoped `.reveal { opacity: 0 }`
          left every block invisible in the editor. */}
      <div className="site-root">
        <RevealObserver />
        <Navbar contact={contact} />
        <main className="site-main">{children}</main>
        <Footer contact={contact} />
        {contact.whatsappDigits && <WhatsAppWidget phoneDigits={contact.whatsappDigits} />}
        {contact.whatsappDigits && <MobileCtaBar whatsappDigits={contact.whatsappDigits} />}
        <ExitIntentModal />
        <SupportWidget />
      </div>
    </CookieConsent>
  )
}
