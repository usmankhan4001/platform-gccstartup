import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/directus'
import { ConsultationRequestForm } from '@/components/public-hubs/ConsultationRequestForm'
import { HubHero, HubPage, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Contact GCC Startup | Book Structure Review',
  description: 'Speak with an international structuring specialist. Request a customized company formation, banking, or tax residency setup plan within 24 hours.',
  alternates: { canonical: '/contact' },
}

const DEFAULT_COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Bahrain', 'Oman', 'Qatar', 'Singapore', 'Hong Kong', 'United Kingdom', 'United States']
const DEFAULT_SERVICES = ['Company Registration', 'Corporate Banking', 'Nominee UBO Service', 'Shelf Companies', 'Tax Residency & Visas', 'Annual Renewals']

export default async function ContactPage() {
  const settings = await getSiteSettings()
  const countries = DEFAULT_COUNTRIES
  const interests = DEFAULT_SERVICES
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/contact`

  return (
    <HubPage>
      <HubHero
        eyebrow="Contact"
        title="Give us the context needed to answer the right question."
        description="Send a consultation request about jurisdiction choice, company formation, banking, ownership, pricing, or ongoing compliance. We will review the request before proposing a next step."
        activeStage="launch"
        primaryHref="#contact-request"
        primaryLabel="Send your request"
        secondaryHref="/resources"
        secondaryLabel="Prepare with our resources"
        canonicalUrl={canonicalUrl}
      />

      <section id="contact-request" className={styles.section} aria-labelledby="contact-request-title">
        <div className="wrap">
          <div className={styles.leadLayout}>
            <aside className={styles.leadAside}>
              <span className="eyebrow">Before you send</span>
              <h2 id="contact-request-title">A useful request is specific about the business.</h2>
              <p>Include owners, residence, activity, customers, preferred markets, banking needs, and timing. If you are unsure about a field, say so rather than guessing.</p>
              <div className={styles.expectations}>
                {[
                  ['01', 'We review', 'Your details are used to understand and route the enquiry.'],
                  ['02', 'We respond', 'A specialist explains the fit, next step, or request for missing context.'],
                  ['03', 'We scope', 'If you proceed, scope and fee schedule are agreed before work starts.'],
                ].map(([step, title, text]) => (
                  <div key={step} className={styles.expectationCard}>
                    <strong>{step}. {title}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className={styles.leadMain}>
              <ConsultationRequestForm
                countries={countries}
                interests={interests}
                submitLabel="Send consultation request"
              />
            </div>
          </div>
        </div>
      </section>
    </HubPage>
  )
}
