// The four canonical drip sequences the platform ships with.
//
// A sequence is a *definition*, not a row: it exists here so the manager can show
// the intended programme even before an operator provisions it into `flows`.
// Provisioning writes a real flow whose `trigger_config.sequenceKey` points back at
// the definition, which is how the two are re-associated on every page load.

import type { SequenceStep } from './types'

export type SequenceDefinition = {
  key: string
  name: string
  description: string
  /** Must be a member of the `trigger_type` enum in `packages/db/src/schema/automation.ts`. */
  triggerType: 'manual' | 'lead_created' | 'form_submitted' | 'tag_added' | 'deal_stage_changed' | 'date_based' | 'event_based'
  triggerLabel: string
  steps: SequenceStep[]
}

export const SEQUENCE_DEFINITIONS: SequenceDefinition[] = [
  {
    key: 'welcome_nurture',
    name: 'Welcome nurture',
    description:
      'Turns a calculator or quiz capture into a booked consultation over three touches, leading with the personalised tax blueprint.',
    triggerType: 'lead_created',
    triggerLabel: 'Lead created via tax calculator / banking quiz',
    steps: [
      {
        id: 'welcome-1',
        title: 'Instant calculation summary & UAE tax report',
        delay: 'Immediate',
        channel: 'SES Email + WhatsApp HSM',
        template: 'UAE Freezone Tax & Formation Blueprint',
        subject: '{{first_name}}, your {{jurisdiction}} tax blueprint is ready',
      },
      {
        id: 'welcome-2',
        title: 'Freezone vs mainland jurisdiction matrix',
        delay: '+1 day',
        channel: 'SES Email',
        template: 'Freezone vs Mainland Advisory Comparison',
        subject: 'Freezone or mainland for {{company_name}}?',
      },
      {
        id: 'welcome-3',
        title: 'VIP banking odds & pre-approval consultation',
        delay: '+3 days',
        channel: 'SES Email + desk task',
        template: 'Corporate Bank Account Pre-Qualification',
        subject: '{{first_name}}, your corporate banking odds',
      },
    ],
  },
  {
    key: 'kyc_collection',
    name: 'KYC collection',
    description:
      'Chases passport, UBO and source-of-funds documents with an escalating ladder until the compliance pack is complete.',
    triggerType: 'deal_stage_changed',
    triggerLabel: 'Deal moves to KYC Review',
    steps: [
      {
        id: 'kyc-1',
        title: 'Secure passport & UBO document upload request',
        delay: 'Immediate on stage move',
        channel: 'SES Email + encrypted portal link',
        template: 'Action Required: KYC Upload for {{company_name}}',
        subject: 'Action required: KYC documents for {{company_name}}',
      },
      {
        id: 'kyc-2',
        title: '24-hour expedited processing reminder',
        delay: '+1 day while pending',
        channel: 'SES Email + WhatsApp HSM',
        template: 'Urgent: Complete KYC for Dubai Department of Economy',
        subject: 'Still need your KYC pack, {{first_name}}',
      },
      {
        id: 'kyc-3',
        title: 'Specialist desk direct intervention',
        delay: '+2 days while unfulfilled',
        channel: 'SES Email + advisor call task',
        template: 'Direct Assistance from {{advisor_name}}',
        subject: '{{advisor_name}} is picking this up personally',
      },
    ],
  },
  {
    key: 'post_incorporation',
    name: 'Post-incorporation onboarding',
    description:
      'Hands over the trade license, then drives banking, tax registration and visa allocation for newly incorporated entities.',
    triggerType: 'deal_stage_changed',
    triggerLabel: 'Deal moves to Registered / license issued',
    steps: [
      {
        id: 'onboard-1',
        title: 'Trade license delivery & certificate of incorporation',
        delay: 'Immediate on issuance',
        channel: 'SES Transactional + license PDF',
        template: 'Official License Issued: {{license_number}}',
        subject: 'Your trade license {{license_number}} is issued',
      },
      {
        id: 'onboard-2',
        title: 'Corporate bank account opening dossier',
        delay: '+1 day',
        channel: 'SES Email + compliance guide',
        template: 'Wio / Emirates NBD Corporate Account Onboarding',
        subject: 'Open your corporate account with {{company_name}}',
      },
      {
        id: 'onboard-3',
        title: 'Corporate tax & VAT registration briefing',
        delay: '+3 days',
        channel: 'SES Email',
        template: 'UAE Corporate Tax Registration Briefing',
        subject: '{{company_name}}: tax registration next steps',
      },
      {
        id: 'onboard-4',
        title: 'Visa & Emirates ID allocation',
        delay: '+7 days',
        channel: 'SES Email + WhatsApp HSM',
        template: 'Investor Visa Allocation & Medical Booking',
        subject: 'Your investor visa allocation for {{company_name}}',
      },
    ],
  },
  {
    key: 'annual_renewal',
    name: 'Annual renewal reminders',
    description:
      'Runs the 60/30/7-day statutory renewal ladder against every expiring trade license, visa and tax filing.',
    triggerType: 'date_based',
    triggerLabel: 'License expiring within 30 days',
    steps: [
      {
        id: 'renewal-1',
        title: '60-day renewal heads-up & authority fee estimate',
        delay: '60 days before expiry',
        channel: 'SES Email',
        template: 'Upcoming Renewal: {{company_name}}',
        subject: '{{company_name}} renews in 60 days',
      },
      {
        id: 'renewal-2',
        title: '30-day renewal reminder with pro-forma invoice',
        delay: '30 days before expiry',
        channel: 'SES Email + WhatsApp HSM',
        template: 'Renewal Invoice & Authority Fees',
        subject: 'Renew {{license_number}} before {{trade_license_expiry}}',
      },
      {
        id: 'renewal-3',
        title: '7-day final notice & desk escalation',
        delay: '7 days before expiry',
        channel: 'SES Email + WhatsApp HSM + task',
        template: 'Final Notice: License Expiry in 7 Days',
        subject: 'Final notice: {{license_number}} expires in 7 days',
      },
      {
        id: 'renewal-4',
        title: 'Post-expiry grace-period recovery',
        delay: '+7 days after expiry',
        channel: 'SES Email + advisor task',
        template: 'Grace Period Reinstatement Options',
        subject: '{{company_name}}: reinstatement options',
      },
    ],
  },
]

export function findSequenceDefinition(key: string): SequenceDefinition | null {
  return SEQUENCE_DEFINITIONS.find((definition) => definition.key === key) ?? null
}
