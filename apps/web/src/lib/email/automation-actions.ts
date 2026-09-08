/**
 * Email actions for the Automation Builder.
 *
 * Track A owns the automation engine and its registry (`src/lib/automation/*`). This
 * module is Track B's self-registration point: it exposes `registerEmailActions()`
 * which Track A's registry calls with its own `register` function.
 *
 * Every action that sends mail goes through the SAME suppression-gated path the
 * outbox uses (`sendMarketingMessage` -> `assertMarketable`), never a shortcut. The
 * non-sending actions (`start_flow`, `stop_flow`) use the flow engine's own
 * enrollment functions.
 */
import { db } from '@/lib/db'
import { email_campaigns } from '@gccstartup/db'
import { eq } from 'drizzle-orm'
import type { ActionPayload, AutomationActionName } from '@/lib/automation/contract'
import { sendMarketingMessage } from './send'
import { cancelEnrollmentsForLead, enrollLead } from './flows'

export type EmailActionResult = { ok: boolean; error?: string; data?: unknown }

export type EmailActionHandler<N extends AutomationActionName> = (payload: ActionPayload[N]) => Promise<EmailActionResult>

/** The narrow slice of Track A's registry this module needs. */
export type EmailActionRegistry = {
  register<N extends AutomationActionName>(name: N, handler: EmailActionHandler<N>): void
}

export function registerEmailActions(registry: EmailActionRegistry): void {
  registry.register('email.send_template', async (payload) => {
    const result = await sendMarketingMessage(null, {
      leadId: payload.leadId,
      templateId: payload.templateId,
      eventKey: `automation:send_template:${payload.leadId}:${payload.templateId}`,
      activityTitle: 'Automation template send',
    })
    return { ok: result.ok, error: result.error }
  })

  registry.register('email.send_campaign', async (payload) => {
    const rows = await db
      .select({ id: email_campaigns.id, name: email_campaigns.name, template_id: email_campaigns.template_id })
      .from(email_campaigns)
      .where(eq(email_campaigns.id, payload.campaignId))
      .limit(1)
    const campaign = rows[0]
    if (!campaign) return { ok: false, error: `Campaign ${payload.campaignId} not found` }
    if (!campaign.template_id) return { ok: false, error: 'Campaign has no template to send' }
    const result = await sendMarketingMessage(null, {
      leadId: payload.leadId,
      templateId: campaign.template_id,
      eventKey: `automation:send_campaign:${payload.campaignId}:${payload.leadId}`,
      activityTitle: `Campaign "${campaign.name ?? payload.campaignId}"`,
    })
    return { ok: result.ok, error: result.error }
  })

  // Audiences are filters over `contacts`, not membership lists, so there is no
  // stored membership to add or remove. These actions are accepted for contract
  // completeness and report that no change was needed — the contact already matches
  // (or not) by definition of the filter.
  registry.register('email.add_to_segment', async (payload) => {
    return { ok: true, data: { note: 'segments are filter-based; no membership stored', segmentId: payload.segmentId } }
  })

  registry.register('email.remove_from_segment', async (payload) => {
    return { ok: true, data: { note: 'segments are filter-based; no membership stored', segmentId: payload.segmentId } }
  })

  registry.register('email.start_flow', async (payload) => {
    const result = await enrollLead(null, { flowId: payload.flowId, leadId: payload.leadId })
    return { ok: result.ok, error: result.ok ? undefined : result.reason }
  })

  registry.register('email.stop_flow', async (payload) => {
    const cancelled = await cancelEnrollmentsForLead(null, payload.leadId, 'automation stop_flow')
    return { ok: true, data: { cancelled } }
  })
}
