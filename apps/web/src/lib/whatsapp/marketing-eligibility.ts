// Marketing-message eligibility gate. All checks are real Drizzle queries
// against the platform schema:
//   - contacts.whatsapp_consent / unsubscribed_at / deleted_at
//   - email_suppressions (shared suppression list, keyed by contact_id)
//   - flow_enrollments (active automation run guard)
//   - conversations (active human handoff guard)

import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contacts,
  conversations,
  email_suppressions,
  flow_enrollments,
} from '@gccstartup/db'

export interface EligibilityResult {
  allowed: boolean
  reason?:
    | 'OPTED_OUT'
    | 'SUPPRESSED'
    | 'CONTACT_NOT_ACTIVE'
    | 'TEMPLATE_NOT_MARKETING'
    | 'TEMPLATE_NOT_APPROVED'
    | 'ACTIVE_HUMAN_HANDOFF'
    | 'ACTIVE_FLOW_RUN'
    | 'OK'
  details?: string
}

export interface CheckMarketingEligibilityParams {
  contactId: string
  phoneNumber: string
  templateCategory?: string
  templateStatus?: string
  checkHandoff?: boolean
}

/**
 * Evaluates whether a contact is eligible to receive an outbound marketing message
 */
export async function checkMarketingEligibility(
  params: CheckMarketingEligibilityParams
): Promise<EligibilityResult> {
  const { contactId, templateCategory, templateStatus, checkHandoff = false } = params

  // 1. Contact status / WhatsApp consent
  const contactRows = await db
    .select({
      whatsapp_consent: contacts.whatsapp_consent,
      unsubscribed_at: contacts.unsubscribed_at,
      deleted_at: contacts.deleted_at,
    })
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1)
  const contact = contactRows[0]

  if (!contact || contact.whatsapp_consent === 'denied' || contact.unsubscribed_at) {
    return {
      allowed: false,
      reason: 'OPTED_OUT',
      details: 'Contact has opted out, revoked WhatsApp consent, or does not exist.',
    }
  }

  if (contact.deleted_at) {
    return {
      allowed: false,
      reason: 'CONTACT_NOT_ACTIVE',
      details: 'Contact is soft-deleted.',
    }
  }

  // 2. Suppression list
  const suppressionRows = await db
    .select({ reason: email_suppressions.reason, detail: email_suppressions.detail })
    .from(email_suppressions)
    .where(eq(email_suppressions.contact_id, contactId))
    .limit(1)
  const suppression = suppressionRows[0]

  if (suppression) {
    return {
      allowed: false,
      reason: 'SUPPRESSED',
      details: `Contact is on the suppression list: ${suppression.reason} (${suppression.detail || 'No detail provided'}).`,
    }
  }

  // 3. Template requirements
  if (templateCategory && templateCategory.toUpperCase() !== 'MARKETING') {
    return {
      allowed: false,
      reason: 'TEMPLATE_NOT_MARKETING',
      details: `Template category is ${templateCategory}, not MARKETING.`,
    }
  }

  if (templateStatus && templateStatus.toUpperCase() !== 'APPROVED') {
    return {
      allowed: false,
      reason: 'TEMPLATE_NOT_APPROVED',
      details: `Template status is ${templateStatus}, must be APPROVED by Meta.`,
    }
  }

  // 4. Active human handoff (optional guardrail)
  if (checkHandoff) {
    const activeEnrollmentRows = await db
      .select({ id: flow_enrollments.id })
      .from(flow_enrollments)
      .where(and(eq(flow_enrollments.contact_id, contactId), eq(flow_enrollments.status, 'active')))
      .limit(1)

    if (activeEnrollmentRows.length > 0) {
      return {
        allowed: false,
        reason: 'ACTIVE_FLOW_RUN',
        details:
          'Contact is mid-way through an active automated flow; sending a marketing broadcast now could derail it.',
      }
    }

    const openConversationRows = await db
      .select({ assigned_to: conversations.assigned_to })
      .from(conversations)
      .where(
        and(
          eq(conversations.contact_id, contactId),
          eq(conversations.state, 'open'),
          isNotNull(conversations.assigned_to)
        )
      )
      .limit(1)

    if (openConversationRows.length > 0) {
      return {
        allowed: false,
        reason: 'ACTIVE_HUMAN_HANDOFF',
        details: 'Contact is currently in active conversation with a live human advisor.',
      }
    }
  }

  return {
    allowed: true,
    reason: 'OK',
  }
}
