import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'

/**
 * Promotes a lead to client by moving the contact's lifecycle stage. Only
 * pre-revenue stages can be promoted — an existing client or churned contact is
 * reported back as-is rather than being overwritten.
 */
export async function promoteLeadToClient(leadId: string) {
  try {
    const promoted = await db
      .update(contacts)
      .set({ lifecycle_stage: 'client', updated_at: new Date() })
      .where(
        and(
          eq(contacts.id, leadId),
          inArray(contacts.lifecycle_stage, ['lead', 'subscriber', 'prospect']),
        ),
      )
      .returning({ id: contacts.id })

    if (promoted.length) {
      return { status: 'promoted', clientId: promoted[0].id }
    }

    const existing = await db
      .select({ id: contacts.id, lifecycle_stage: contacts.lifecycle_stage })
      .from(contacts)
      .where(eq(contacts.id, leadId))
      .limit(1)

    if (!existing.length) return { status: 'not_found', clientId: leadId }
    return { status: 'already_client', clientId: existing[0].id }
  } catch (error) {
    console.error('[crm/clients] promoteLeadToClient failed', error)
    return { status: 'error', clientId: leadId }
  }
}
