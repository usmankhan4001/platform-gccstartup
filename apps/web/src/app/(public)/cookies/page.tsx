import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Cookie Notice',
  description: 'The current operational draft explaining cookies, analytics, advertising tags, Cloudflare security storage, and visitor choices on GCCStartup.com.',
  alternates: { canonical: '/cookies' },
}

const sections: LegalSection[] = [
  {
    id: 'what-they-are',
    title: 'Cookies and similar storage',
    content: <>
      <p>Cookies are small values a website or provider stores in a browser. Similar technologies include local storage, pixels, tags, and identifiers attached to requests. They can maintain a session, protect a site, remember a choice, measure a visit, or connect an advertising interaction to a later enquiry.</p>
      <p>The exact values visible in a browser can vary by provider configuration, device, region, and whether a visitor has blocked or cleared storage.</p>
    </>,
  },
  {
    id: 'categories',
    title: 'Current categories',
    content: <>
      <p><strong>Essential and security.</strong> These support request routing, administrator sessions, abuse protection, load delivery, and security. Cloudflare may set or read security-related values when a challenge, bot check, or delivery feature requires them.</p>
      <p><strong>Measurement.</strong> Google Analytics, Google Tag Manager, and Cloudflare analytics may collect visit, device, referrer, campaign, performance, and interaction data. Some Cloudflare measurement can operate without a traditional analytics cookie, while request and security logs may still contain technical identifiers.</p>
      <p><strong>Advertising and attribution.</strong> A configured Meta Pixel may use browser storage and event identifiers to measure campaigns, attribute enquiries, control audiences, and report advertising performance. Campaign parameters and a Meta click identifier may also be stored with an enquiry.</p>
      <p><strong>Preferences and form attribution.</strong> The site may retain campaign or navigation context in browser storage so it can be attached consistently to a later form submission.</p>
    </>,
  },
  {
    id: 'providers',
    title: 'Provider detail',
    content: <>
      <p><strong>Google.</strong> Google Analytics and Tag Manager load only when their identifiers are configured for the site. Google can receive page, browser, device, network, campaign, and interaction information under Google&apos;s own terms.</p>
      <p><strong>Meta.</strong> Meta&apos;s browser tag and any related conversion integration can receive event, page, advertising, and matching data. Meta determines aspects of its subsequent processing under its own policies.</p>
      <p><strong>Cloudflare.</strong> Cloudflare sits in the website delivery and security path and may process every request, not only requests from visitors who accept optional analytics. This can include IP address, request headers, device signals, challenge state, and security events.</p>
      <p><strong>Directus, Sender.net, n8n, and WhatsApp.</strong> These are explained in the privacy notice. They primarily support content, records, email, automation, and messaging rather than general browser analytics, although links and messages can contain campaign or delivery identifiers.</p>
    </>,
  },
  {
    id: 'controls',
    title: 'Your controls',
    content: <>
      <ul>
        <li>Use browser controls to inspect, block, or delete cookies and site storage.</li>
        <li>Use device or browser tracking protection and the advertising controls provided by Google and Meta.</li>
        <li>Avoid submitting a form if you do not want its campaign and technical context attached to the enquiry.</li>
        <li>Contact the site using the route in the footer for a privacy request or question.</li>
      </ul>
      <p>Blocking essential or security storage may prevent parts of the site from working. Clearing attribution storage does not delete a lead record already submitted; that requires a separate privacy request.</p>
    </>,
  },
  {
    id: 'consent-status',
    title: 'Consent implementation status',
    content: <>
      <p>Analytics and advertising tags may load when their identifiers are configured. Publication of this draft is not a claim that a jurisdiction-aware consent management platform has already been implemented or independently audited.</p>
      <p>Where prior consent is required, optional tags should be connected to a suitable consent mechanism before relying on this notice alone. The implemented tag and consent configuration should be tested whenever analytics settings change.</p>
    </>,
  },
  {
    id: 'retention-updates',
    title: 'Duration and updates',
    content: <>
      <p>Session and security values may be short-lived; analytics and advertising identifiers may remain longer according to the configured provider setting. Browser tools show the most reliable current expiry information for a particular device.</p>
      <p>This notice should be reviewed when a tag, provider, consent tool, or retention setting is added or changed. It deliberately avoids promising fixed cookie names or durations that have not been verified against the live configuration.</p>
    </>,
  },
]

export default function CookiesPage() {
  return <LegalPage
    eyebrow="Browser data"
    title="Cookie notice"
    description="What the website and its delivery, analytics, and advertising providers may store or read in your browser."
    summary={<p>The site uses essential delivery and security technology and can load Google, Meta, and Cloudflare measurement services. This draft distinguishes current technology from consent controls that still require jurisdiction-specific implementation and verification.</p>}
    sections={sections}
  />
}
