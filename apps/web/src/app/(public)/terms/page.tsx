import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Website Terms',
  description: 'Operational draft terms for using GCCStartup.com, including informational limits, third-party services, acceptable use, and engagement boundaries.',
  alternates: { canonical: '/terms' },
}

const sections: LegalSection[] = [
  {
    id: 'status',
    title: 'Status of these terms',
    content: <>
      <p>These draft terms describe intended rules for using GCCStartup.com. They are not a substitute for a signed client engagement, provider terms, invoice terms, or jurisdiction-specific notices.</p>
      <p>The legal name, registered address, governing law, courts, and any mandatory consumer wording must be confirmed from formal business records before this draft is treated as final legal documentation.</p>
    </>,
  },
  {
    id: 'information',
    title: 'Information, not professional advice',
    content: <>
      <p>Website material is general information about company formation, banking support, ownership structures, tax residency, renewals, and related topics. It is not legal, tax, accounting, investment, immigration, or financial advice for a specific person.</p>
      <p>Rules, fees, processing times, eligibility, and authority practices change. Obtain qualified advice and current written confirmation before acting, transferring money, changing residency, or selecting a structure.</p>
    </>,
  },
  {
    id: 'engagement',
    title: 'Enquiries and service engagements',
    content: <>
      <p>Submitting a form, booking a call, sending a WhatsApp message, or receiving preliminary information does not by itself create an adviser-client relationship or oblige either side to proceed.</p>
      <p>A service begins only when scope, responsible contracting party, price, payment, required checks, and engagement terms are confirmed through the applicable written process. Identity, source-of-funds, sanctions, eligibility, and other compliance checks may be required before acceptance.</p>
    </>,
  },
  {
    id: 'outcomes',
    title: 'No guaranteed outcome',
    content: <>
      <p>Company registrations, bank accounts, licences, visas, tax positions, and authority decisions depend on third parties and individual facts. Estimates and examples are not promises of approval, timing, savings, account opening, or a particular legal or tax result.</p>
      <p>Any claim or illustration should be read with its stated assumptions and rechecked in the final proposal. A legitimate service fee does not purchase or guarantee a government, bank, or regulator decision.</p>
    </>,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: <>
      <p>You must not use the site to submit false or unlawful material, impersonate another person, interfere with security, probe systems without authorisation, introduce malicious code, scrape at a harmful rate, or pursue fraud, sanctions evasion, money laundering, tax evasion, or concealment of unlawful ownership.</p>
      <p>You are responsible for information you submit and for ensuring you have authority to share information about another person. Access may be limited where necessary to protect the website, its users, providers, or legal obligations.</p>
    </>,
  },
  {
    id: 'third-parties',
    title: 'Third-party services and links',
    content: <>
      <p>The site can link to or use Directus, Sender.net, Meta, Google, Cloudflare, n8n, WhatsApp, scheduling tools, payment providers, professional advisers, banks, and public authorities. Their availability, decisions, content, and processing are governed by their own terms.</p>
      <p>A link or integration does not mean GCC Startup controls or guarantees that provider. Review third-party terms before using the relevant service or sending sensitive information.</p>
    </>,
  },
  {
    id: 'content-ip',
    title: 'Content and intellectual property',
    content: <>
      <p>Unless another owner is identified, website copy, design, graphics, tools, and branding are intended to remain protected by applicable intellectual property rules. You may use the site for ordinary personal or internal business evaluation.</p>
      <p>Do not republish, sell, frame, systematically extract, or present site content as your own without written permission. Fair quotation and rights that cannot lawfully be restricted remain unaffected.</p>
    </>,
  },
  {
    id: 'availability-liability',
    title: 'Availability and responsibility',
    content: <>
      <p>The site may be corrected, updated, interrupted, or withdrawn. Reasonable care is intended, but online content and availability cannot be promised as complete, current, error-free, or uninterrupted.</p>
      <p>Any limitation of responsibility must be interpreted under applicable law and the signed engagement terms. This operational draft does not attempt to exclude liability that cannot legally be excluded, nor does it fabricate a universal liability cap before the contracting entity and governing law are confirmed.</p>
    </>,
  },
  {
    id: 'privacy-changes',
    title: 'Privacy, changes, and questions',
    content: <>
      <p>The privacy and cookie notices explain current intended handling of personal and browser data. They form part of the website transparency record but may require additional consent or contract wording for a particular service.</p>
      <p>These terms should be revised when the operating entity, services, providers, or legal requirements change. The review date should identify the version in use. Questions can be sent through the region-aware contact shown in the footer.</p>
    </>,
  },
]

export default function TermsPage() {
  return <LegalPage
    eyebrow="Website use"
    title="Website terms"
    description="The operating boundaries for website information, enquiries, third-party services, and acceptable use."
    summary={<p>Using the site gives you access to general information and enquiry channels. It does not guarantee an outcome or create a professional engagement. Formal scope, entity details, fees, and jurisdiction terms belong in a written engagement.</p>}
    sections={sections}
  />
}
