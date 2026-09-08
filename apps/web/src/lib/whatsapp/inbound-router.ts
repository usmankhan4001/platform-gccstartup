// Inbound WhatsApp message router — processes incoming messages through keyword
// automations defined on automation_workflows with trigger whatsapp.message_received.
//
// When a message arrives the router:
//   1. Queries every active workflow whose trigger_name is whatsapp.message_received
//   2. Evaluates the keyword filter in trigger_config against the message body
//   3. For each match, executes the workflow's graph actions via the automation engine
//   4. Returns true when at least one automation handled the message
//
// The 24-hour Meta customer-service window is enforced: inside the window free-form
// text replies are allowed; outside it only template sends go through.

// TODO: Replace with Drizzle queries
const readItems = (...args: any[]) => ([] as any)
import {
  automationDirectus,
  getActionHandler,
  logAutomationError,
  type AutomationWorkflowItem,
  type AutomationClient,
} from '@/lib/automation/registry'
import { graphNodes, type AutomationNode } from '@/lib/automation/nodes'
import { sendWhatsappText, sendWhatsappTemplate } from '@/lib/whatsapp/client'

// --- types -------------------------------------------------------------------

export type InboundParams = {
  conversationId: string
  leadId?: string | null
  phoneNumber: string
  body: string
  messageType: string
}

// --- keyword matching --------------------------------------------------------

// Keywords are matched case-insensitively against the trimmed message body.
// match_type controls the comparison strategy.
type MatchType = 'exact' | 'contains' | 'starts_with'

function keywordMatches(body: string, config: Record<string, unknown>): boolean {
  const keyword = typeof config.keyword === 'string' ? config.keyword.trim().toLowerCase() : ''
  if (!keyword) return true // no keyword filter — always matches

  const matchType: MatchType =
    config.match_type === 'exact' || config.match_type === 'starts_with'
      ? config.match_type
      : 'contains'

  const cleanBody = body.trim().toLowerCase()

  if (matchType === 'exact') return cleanBody === keyword
  if (matchType === 'starts_with') return cleanBody.startsWith(keyword)
  return cleanBody.includes(keyword)
}

// --- 24-hour customer service window -----------------------------------------

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

// Within Meta's 24-hour customer-service window the business may send free-form
// text. Outside it only approved template messages are permitted. The window is
// measured from the most recent inbound message on the conversation.
async function isInCustomerServiceWindow(
  client: AutomationClient,
  conversationId: string,
): Promise<boolean> {
  try {
    const messages = await client.request(
      readItems('whatsapp_messages', {
        fields: ['date_created'],
        filter: {
          conversation: { _eq: conversationId },
          direction: { _eq: 'inbound' },
        },
        sort: ['-date_created'],
        limit: 1,
      }),
    )
    const last = messages[0]
    if (!last?.date_created) return false
    return Date.now() - new Date(last.date_created).getTime() < TWENTY_FOUR_HOURS_MS
  } catch (error) {
    logAutomationError('inbound-router:customerServiceWindow', error)
    return false
  }
}

// --- template variable resolution --------------------------------------------

// Resolves {{field}} placeholders using the lead record. Only scalar string
// values are substituted; objects and arrays are ignored.
function resolveTemplateVariables(text: string, lead: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, field) => {
    const value = lead[field]
    if (value === null || value === undefined) return ''
    return String(value)
  })
}

// --- action execution --------------------------------------------------------

// Executes a single graph node. WhatsApp sends are handled directly (the
// send_whatsapp action is not registered in the engine's ACTION_HANDLERS map
// at the inbound-router level). All other actions delegate to the registered
// handler so the engine's existing create_task / update_lead_field / etc.
// logic is reused.
async function executeNode(
  node: AutomationNode,
  ctx: {
    phoneNumber: string
    leadId: string | null
    lead: Record<string, unknown> | null
    inWindow: boolean
  },
): Promise<void> {
  const { action, config } = node
  const { phoneNumber, leadId, lead, inWindow } = ctx

  if (action === 'send_whatsapp') {
    const recipient =
      typeof config.recipient === 'string' && config.recipient.trim()
        ? config.recipient.trim()
        : phoneNumber

    if (typeof config.templateId === 'string' && config.templateId.trim()) {
      // Templates are always allowed regardless of the 24h window
      await sendWhatsappTemplate(recipient, config.templateId.trim())
    } else if (typeof config.text === 'string' && config.text.trim()) {
      // Free-form text is only allowed inside the customer-service window
      if (!inWindow) {
        console.warn(
          `[whatsapp-inbound] skipping free-text send outside 24 h window for ${recipient}`,
        )
        return
      }
      const text = lead ? resolveTemplateVariables(config.text, lead) : config.text
      await sendWhatsappText(recipient, text)
    }
    return
  }

  // All non-WhatsApp actions go through the engine's registered handlers.
  const handler = getActionHandler(action)
  if (!handler) {
    console.warn(`[whatsapp-inbound] no handler for action "${action}" — skipped`)
    return
  }

  // Build the payload the handler expects, injecting leadId when the workflow
  // config uses the {{leadId}} placeholder or omits it entirely.
  const payload: Record<string, unknown> = { ...config }
  if (!payload.leadId || payload.leadId === '{{leadId}}') {
    payload.leadId = leadId
  }

  // Resolve template variables in every string value of the payload.
  if (lead) {
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string') {
        payload[key] = resolveTemplateVariables(value, lead)
      }
    }
  }

  // The handler needs an ActionHandlerContext — we construct a minimal one.
  // The execution and node fields are used only for logging; a stub is safe.
  await handler(
    {
      client: automationDirectus(),
      execution: { id: 'inbound', workflow: 'inbound', status: 'running' } as any,
      node: node as any,
    },
    payload,
  )
}

// --- lead lookup for template variables --------------------------------------

async function loadLead(
  client: AutomationClient,
  leadId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const leads = await client.request(
      readItems('leads', {
        fields: [
          'id', 'name', 'email', 'phone', 'status', 'interest',
          'country', 'source', 'company_name_choice_1',
        ],
        filter: { id: { _eq: leadId } },
        limit: 1,
      }),
    )
    return (leads[0] as Record<string, unknown>) ?? null
  } catch (error) {
    logAutomationError('inbound-router:leadLookup', error)
    return null
  }
}

// --- public entry point ------------------------------------------------------

/**
 * Processes an inbound WhatsApp message through keyword automations.
 *
 * Returns `true` when at least one automation workflow matched and executed its
 * actions. When no automation matches the message remains in the inbox with no
 * side effects.
 */
export async function processInboundWhatsAppMessage(
  params: InboundParams,
): Promise<boolean> {
  const { conversationId, leadId, phoneNumber, body, messageType } = params

  // Only text messages carry typed keywords — templates and media skip routing.
  if (messageType !== 'text') return false

  const client = automationDirectus()

  // ── 1. Find active keyword automations ──────────────────────────────────
  let workflows: AutomationWorkflowItem[]
  try {
    workflows = await client.request(
      readItems('automation_workflows', {
        filter: {
          status: { _eq: 'active' },
          trigger_name: { _eq: 'whatsapp.message_received' },
        },
        limit: -1,
      }),
    )
  } catch (error) {
    logAutomationError('inbound-router:workflowLookup', error)
    return false
  }

  if (!workflows.length) return false

  // ── 2. Evaluate keyword filters ─────────────────────────────────────────
  const matched = workflows.filter((wf) => {
    const config = (wf.trigger_config ?? {}) as Record<string, unknown>
    return keywordMatches(body, config)
  })

  if (!matched.length) return false

  // ── 3. Enrich context ───────────────────────────────────────────────────
  const inWindow = await isInCustomerServiceWindow(client, conversationId)
  const lead = leadId ? await loadLead(client, leadId) : null

  // ── 4. Execute each matching workflow's graph ────────────────────────────
  for (const workflow of matched) {
    const nodes = graphNodes(workflow.graph)
    for (const node of nodes) {
      try {
        await executeNode(node, {
          phoneNumber,
          leadId: leadId ?? null,
          lead,
          inWindow,
        })
      } catch (error) {
        logAutomationError(`inbound-router:execute:${workflow.id}:${node.action}`, error)
      }
    }
  }

  return true
}
