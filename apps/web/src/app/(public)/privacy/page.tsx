import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How GCC Startup currently intends to collect, use, share, retain, and protect personal information across its website and communications.',
  alternates: { canonical: '/privacy' },
}

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope and responsibility',
    content: <>
      <p>This notice covers information handled through GCCStartup.com, its public forms, email communications, analytics, and WhatsApp contact flows.</p>
      <p>GCC Startup operates the website and determines the immediate purpose of this processing. The precise contracting entity and any additional jurisdiction-specific terms should be confirmed in a proposal or engagement document before paid work begins.</p>
    </>,
  },
  {
    id: 'information',
    title: 'Information we handle',
    content: <>
      <p>Information you provide may include your name, email, telephone or WhatsApp number, country, business interests, form answers, messages, appointment details, and information needed to discuss a company setup.</p>
      <p>Technical and attribution data may include IP address, browser and device details, page URL, referrer, timestamps, cookie or advertising identifiers, campaign parameters, and identifiers such as <code>fbclid</code>. Operational records may include consent status, communication history, lead status, assigned team member, and suppression preferences.</p>
      <p>Do not send passports, bank credentials, or other sensitive documents through an ordinary website form or WhatsApp unless an authorised team member has confirmed an appropriate secure process.</p>
    </>,
  },
  {
    id: 'purposes',
    title: 'Why information is used',
    content: <>
      <ul>
        <li>Responding to enquiries, assessing service fit, arranging calls, and preparing requested information.</li>
        <li>Operating, securing, debugging, and measuring the website and its campaigns.</li>
        <li>Maintaining lead, consent, communication, and service records.</li>
        <li>Sending service messages and, where the relevant permission has been captured, marketing email.</li>
        <li>Preventing duplicate, abusive, fraudulent, or unsafe submissions and meeting applicable record-keeping duties.</li>
      </ul>
      <p>Depending on the context and applicable law, the working basis may be your request or consent, steps toward a service engagement, compliance with a legal obligation, or a proportionate operational interest such as security and enquiry management. This draft does not claim one legal basis applies in every country.</p>
    </>,
  },
  {
    id: 'systems',
    title: 'Systems and service providers',
    content: <>
      <p><strong>Directus.</strong> Directus is used as the website content system and internal operational record for enquiries, leads, consent events, tasks, and related communication history. Hosting and database infrastructure supporting Directus may process the same records.</p>
      <p><strong>Sender.net.</strong> Sender.net may receive email address, name, subscription state, tags, and delivery or engagement events to manage permitted email communications, transactional messages, unsubscribes, bounces, and suppression.</p>
      <p><strong>Meta.</strong> When a Meta Pixel or conversion integration is configured, Meta may receive browser events or server-side campaign and conversion events, together with identifiers used for attribution, measurement, audience controls, and advertising.</p>
      <p><strong>Google and Cloudflare.</strong> Google Analytics or Google Tag Manager may measure visits, campaigns, devices, and interactions when configured. Cloudflare may process request, IP, device, security, performance, and analytics data while providing DNS, delivery, bot protection, and website security.</p>
      <p><strong>n8n and WhatsApp.</strong> n8n may move authorised data between operational systems and trigger follow-up workflows. Choosing WhatsApp sends your telephone number, message, and related metadata to WhatsApp/Meta under their own terms and privacy practices.</p>
      <p>Professional advisers, authorities, or transaction providers may receive information where necessary for a requested service, with context provided before sensitive onboarding information is shared.</p>
    </>,
  },
  {
    id: 'sharing-transfers',
    title: 'Sharing and international processing',
    content: <>
      <p>The website is intended for an international audience and its providers may process information in more than one country. Provider locations, subprocessors, and transfer safeguards can change, so they should be checked during formal compliance review and vendor onboarding.</p>
      <p>Personal information is not intended to be sold as a standalone data product. Advertising and analytics disclosures above still matter because those providers may use event data under their own service terms.</p>
    </>,
  },
  {
    id: 'retention',
    title: 'Retention approach',
    content: <>
      <p>Working records are retained only while they remain reasonably useful for the enquiry, an active or anticipated engagement, required financial or compliance records, dispute handling, security, or suppression of communications.</p>
      <p>Unsuccessful and inactive enquiries should be reviewed and removed or minimised on a recurring schedule rather than kept indefinitely. Consent, unsubscribe, and suppression evidence may need to remain longer so a communication preference can be honoured. Analytics, security, email, and WhatsApp providers apply their own retention settings and backups.</p>
      <p>No fixed deletion period is promised here until the operational retention schedule has been formally approved and implemented across every connected system.</p>
    </>,
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    content: <>
      <p>Depending on where you live, you may be able to request access, correction, deletion, portability, restriction, or objection; withdraw consent; opt out of marketing; or complain to an appropriate privacy authority.</p>
      <p>Requests can be made using the contact route in the footer. Enough information may be requested to verify identity and locate records. A request may be limited where retention is required by law, security, legal claims, another person&apos;s rights, or another applicable exception. Marketing email can also be stopped using its unsubscribe control.</p>
    </>,
  },
  {
    id: 'security-changes',
    title: 'Security and changes',
    content: <>
      <p>Access controls, service credentials, transport security, logging, and operational review are intended to reduce risk, but no internet transmission or storage system can be described as completely secure.</p>
      <p>This notice should be updated when systems, providers, retention rules, the contracting entity, or applicable legal requirements change. Material changes should be dated and communicated where required.</p>
    </>,
  },
]

export default function PrivacyPage() {
  return <LegalPage
    eyebrow="Data practice"
    title="Privacy notice"
    description="A plain-language record of how personal information currently moves through the website and its operating systems."
    summary={<p>The short version: information is used to answer enquiries, deliver requested services, run communications, secure the site, and understand performance. Connected providers are identified below, together with the current retention approach and available request channels.</p>}
    sections={sections}
  />
}
