import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/directus'
import { ConsultationRequestForm } from '@/components/public-hubs/ConsultationRequestForm'
import { HubHero, HubPage, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Book a Structure Consultation',
  description: 'Schedule a 15-minute 1-on-1 structure consultation. We map the exact jurisdiction, banking fit, tax implications, and costs for your business.',
  alternates: { canonical: '/book-consultation' },
  openGraph: {
    title: 'Book a Structure Consultation | GCC Startup',
    description: 'Submit your formation brief for review. A senior structuring advisor reviews your business model and maps your setup roadmap.',
    url: '/book-consultation',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Structure Consultation | GCC Startup',
    description: 'Schedule a 15-minute 1-on-1 structure consultation with a senior cross-border corporate specialist.',
  },
}

const DEFAULT_COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Bahrain', 'Oman', 'Qatar', 'Singapore', 'Hong Kong', 'United Kingdom', 'United States']
const DEFAULT_SERVICES = ['Company Registration', 'Corporate Banking', 'Nominee UBO Service', 'Shelf Companies', 'Tax Residency & Visas', 'Annual Renewals']

export default async function BookConsultationPage() {
  const settings = await getSiteSettings()
  const countries = DEFAULT_COUNTRIES
  const interests = DEFAULT_SERVICES
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/book-consultation`

  return (
    <HubPage>
      <HubHero
        eyebrow="Consultation request"
        title="Request a focused company formation consultation."
        description="Share the operating facts behind your decision. A specialist will review your request and contact you to clarify scope and agree a suitable time. This page does not confirm a calendar booking."
        activeStage="jurisdiction"
        primaryHref="#consultation-request"
        primaryLabel="Complete request form"
        secondaryHref="/contact"
        secondaryLabel="Send a general enquiry"
        canonicalUrl={canonicalUrl}
      />

      <section id="consultation-request" className={styles.section} aria-labelledby="consultation-request-title">
        <div className="wrap">
          <div className={styles.leadLayout}>
            <aside className={styles.leadAside}>
              <span className="eyebrow">What to expect</span>
              <h2 id="consultation-request-title">The request starts with fit, not a sales calendar.</h2>
              <p>We review your brief first so the eventual conversation can focus on the decisions that matter. No appointment is confirmed until a specialist contacts you.</p>
              <div className={styles.expectations}>
                {[
                  ['01', 'Submit the brief', 'Describe owners, activity, markets, banking, timing, and uncertainties.'],
                  ['02', 'Specialist review', 'We assess whether more information is needed and who should respond.'],
                  ['03', 'Agree the next step', 'If a consultation is appropriate, the time and format are confirmed separately.'],
                ].map(([number, title, text]) => (
                  <div key={title} className={styles.expectation}>
                    <span className={styles.expectationMark}>{number}</span>
                    <div><strong>{title}</strong><p>{text}</p></div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 'var(--space-6)', fontSize: 13 }}>For how we handle enquiry data, read our <Link href="/privacy" className={styles.textLink}>privacy notice</Link>.</p>
            </aside>
            <ConsultationRequestForm source="Book Consultation Hub" countries={countries} interests={interests} />
          </div>
        </div>
      </section>
    </HubPage>
  )
}
