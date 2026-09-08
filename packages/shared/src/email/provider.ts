export interface EmailSendParams {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: Record<string, string>
}

export interface EmailBulkSendParams {
  from: string
  to: string[]
  subject: string
  html: string
  text?: string
  tags?: Record<string, string>
}

export interface EmailSendResult {
  id: string
  status: string
}

export interface EmailProvider {
  /** Send a single email. */
  send(params: EmailSendParams): Promise<EmailSendResult>
  /** Send a bulk email to multiple recipients. */
  sendBulk(params: EmailBulkSendParams): Promise<EmailSendResult[]>
}

// ─── Sender types (used by the web app's EmailSender contract) ──────────────

export type SenderResult<T = unknown> = {
  ok: boolean
  operation: string
  status?: string
  retryable?: boolean
  ambiguous?: boolean
  data?: T
  error?: string
  deferralSeconds?: number
  rateLimit?: SenderRateLimit
}

export type SenderCampaign = Record<string, unknown>
export type SenderCampaignInput = Record<string, unknown>
export type SenderGroup = Record<string, unknown>
export type SenderRateLimit = Record<string, unknown>
export type SenderSubscriber = Record<string, unknown>
export type SenderSubscriberInput = Record<string, unknown>
export type SenderTransactionalInput = Record<string, unknown>
export type SenderTemplateTransactionalInput = Record<string, unknown>

export interface EmailSender {
  upsertSubscriber(input: SenderSubscriberInput): Promise<SenderResult<SenderSubscriber>>
  listGroups(): Promise<SenderResult<Array<{ id: string; title: string }>>>
  sendTransactional(input: SenderTransactionalInput | SenderTemplateTransactionalInput, templateId?: string): Promise<SenderResult<{ emailId?: string; success?: boolean; message?: string }>>
  sendConfiguredTransactional(input: { email: string; name?: string; variables?: Record<string, unknown>; eventId?: string }): Promise<SenderResult>
  createGroup(title: string): Promise<SenderResult<SenderGroup>>
  createCampaign(input: SenderCampaignInput): Promise<SenderResult<SenderCampaign>>
  sendCampaign(campaignId: string): Promise<SenderResult<SenderCampaign>>
  scheduleCampaign(campaignId: string, scheduledAt: Date | string): Promise<SenderResult<SenderCampaign>>
  throttleMs(rateLimit?: SenderRateLimit): number
}

export const senderAdapter: EmailSender = {
  upsertSubscriber: async () => ({ ok: true, operation: 'upsertSubscriber', data: {} }),
  listGroups: async () => ({ ok: true, operation: 'listGroups', data: [] }),
  sendTransactional: async () => ({ ok: true, operation: 'sendTransactional', data: {} }),
  sendConfiguredTransactional: async () => ({ ok: true, operation: 'sendConfiguredTransactional' }),
  createGroup: async () => ({ ok: true, operation: 'createGroup', data: {} }),
  createCampaign: async () => ({ ok: true, operation: 'createCampaign', data: {} }),
  sendCampaign: async () => ({ ok: true, operation: 'sendCampaign', data: {} }),
  scheduleCampaign: async () => ({ ok: true, operation: 'scheduleCampaign', data: {} }),
  throttleMs: () => 0,
}
