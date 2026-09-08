// ─── Auth ────────────────────────────────────────────────────────────────────
export {
  createSession,
  verifySession,
  refreshSession,
  getSessionFromCookie,
  type SessionPayload,
  hashPassword,
  verifyPassword,
  hasPermission,
  canAccess,
  getRoleLevel,
  type Role,
} from './auth/index.js'

// ─── Email ───────────────────────────────────────────────────────────────────
export {
  type EmailProvider,
  type EmailSendParams,
  type EmailBulkSendParams,
  type EmailSendResult,
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
  createSESProvider,
} from './email/index.js'

// ─── WhatsApp ────────────────────────────────────────────────────────────────
export { sendText, sendTemplate, sendTemplateWithMedia } from './whatsapp/index.js'

// ─── Storage ─────────────────────────────────────────────────────────────────
export {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteFile,
  listFiles,
} from './storage/index.js'

// ─── Queue ───────────────────────────────────────────────────────────────────
export {
  enqueueJob,
  claimJob,
  completeJob,
  failJob,
  deferJob,
  reapStaleJobs,
  type JobType,
  type JobStatus,
  type Job,
  type OutboxRow,
  type JobDB,
} from './queue/index.js'

// ─── Events ──────────────────────────────────────────────────────────────────
export {
  on,
  emit,
  off,
  clearAllListeners,
  type EventHandler,
  type EventMap,
} from './events/index.js'

// ─── Utils ───────────────────────────────────────────────────────────────────
export {
  AppError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ConflictError,
  logError,
  handleApiError,
  logger,
  checkRateLimit,
  type RateLimitResult,
  emailSchema,
  phoneSchema,
  uuidSchema,
  paginationSchema,
  dateRangeSchema,
  validate,
  type PaginationInput,
  type DateRangeInput,
} from './utils/index.js'
