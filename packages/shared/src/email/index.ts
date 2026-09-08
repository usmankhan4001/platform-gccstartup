export type { EmailProvider, EmailSendParams, EmailBulkSendParams, EmailSendResult } from './provider.js'
export {
  type SenderResult,
  type SenderCampaign,
  type SenderCampaignInput,
  type SenderGroup,
  type SenderRateLimit,
  type SenderSubscriber,
  type SenderSubscriberInput,
  type SenderTransactionalInput,
  type SenderTemplateTransactionalInput,
  type EmailSender,
  senderAdapter,
} from './provider.js'
export { createSESProvider } from './ses.js'
