// Inbound WhatsApp message router — processes incoming messages through keyword
// automations stored as `flows` rows.
//
// Storage mapping (no automation_workflows table exists in the platform schema):
// an inbound automation is a `flows` row with
//   trigger_type = 'event_based'
//   status       = 'active'
//   trigger_config.trigger = 'whatsapp.message_received'
//   trigger_config.{keyword, match_type}   — optional keyword filter
//   nodes / edges                           — the flow graph (see default-flow-seed.ts)
//
// When a message arrives the router:
//   1. Queries every active whatsapp.message_received flow
//   2. Evaluates the keyword filter in trigger_config against the message body
//   3. For each match, interprets the flow's nodes (send/message, quick_reply,
//      condition gates, ADD_TAG actions) with real DB writes
//   4. Returns true when at least one automation handled the message
//
// The 24-hour Meta customer-service window is enforced: inside the window
// free-form text replies are allowed; outside it only template sends go through.

import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, flows, messages } from '@gccstartup/db'
import { sendWhatsappText, sendWhatsappTemplate } from './client'
import { logAutomationError } from '@/lib/automation/registry'

// --- types -------------------------------------------------------------------

export type InboundParams = {
  conversationId: string
  leadId?: string | null
  phoneNumber: string
  body: string
  messageType: string
}

type FlowNode = {
  id?: string
  action?: string
  type?: string
  config?: Record<string, unknown>
  data?: Record<string, unknown>
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
      ? (config.match_type as MatchType)
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
async function isInCustomerServiceWindow(conversationId: string): Promise<boolean> {
  try {
    const last = await db
      .select({ occurred_at: messages.occurred_at })
      .from(messages)
      .where(and(eq(messages.conversation_id, conversationId), eq(messages.direction, 'inbound')))
      .orderBy(desc(messages.occurred_at))
      .limit(1)
    const row = last[0]
    if (!row?.occurred_at) return false
    return Date.now() - new Date(row.occurred_at).getTime() < TWENTY_FOUR_HOURS_MS
  } catch (error) {
    logAutomationError('inbound-router:customerServiceWindow', error)
    return false
  }
}

// --- contact fields for template variables -----------------------------------

// Resolves {{field}} placeholders using the contact record. Only scalar string
// values are substituted; objects and arrays are ignored.
type ContactRow = typeof contacts.$inferSelect

function contactFieldMap(contact: ContactRow): Record<string, unknown> {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    display_name: contact.display_name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    job_title: contact.job_title,
    lifecycle_stage: contact.lifecycle_stage,
    company_name: contact.company,
  }
}

function resolveTemplateVariables(text: string, contact: ContactRow | null): string {
  const fields = contact ? contactFieldMap(contact) : {}
  return text.replace(/\{\{(\w+)\}\}/g, (_match, field: string) => {
    const value = fields[field]
    if (value === null || value === undefined) return ''
    return String(value)
  })
}

// --- tag writes ---------------------------------------------------------------

// Contact tags are a jsonb string array. Read-modify-write; duplicates ignored.
async function addContactTag(contactId: string, tagName: string): Promise<void> {
  const rows = await db
    .select({ tags: contacts.tags })
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1)
  const current = rows[0]
  const tags = Array.isArray(current?.tags) ? [...current.tags] : []
  if (tags.includes(tagName)) return
  tags.push(tagName)
  await db.update(contacts).set({ tags, updated_at: new Date() }).where(eq(contacts.id, contactId))
}

// --- node interpretation ------------------------------------------------------

type ExecCtx = {
  phoneNumber: string
  contactId: string | null
  contact: ContactRow | null
  inWindow: boolean
  body: string
}

// Normalizes the two node spellings into one action/config pair. Seed flows use
// { type, data }; other producers may use { action, config }.
function normalizeNode(raw: FlowNode): { action: string; config: Record<string, unknown> } {
  const action = raw.action ?? raw.type ?? ''
  const config = (raw.config ?? raw.data ?? {}) as Record<string, unknown>
  return { action, config }
}

function conditionPasses(config: Record<string, unknown>, body: string): boolean {
  const value = typeof config.value === 'string' ? config.value.toLowerCase() : ''
  const cleanBody = body.trim().toLowerCase()
  const operator = typeof config.operator === 'string' ? config.operator : 'contains'
  if (operator === 'exact') return cleanBody === value
  if (operator === 'starts_with') return cleanBody.startsWith(value)
  return cleanBody.includes(value)
}

// Interprets one flow's node list. Iteration is order-based (no edge walking):
// condition nodes gate the immediately following action node, matching how the
// seed graph sequences check_hot → tag_hot etc.
async function interpretFlow(nodes: unknown[], ctx: ExecCtx): Promise<void> {
  let pendingCondition: Record<string, unknown> | null = null

  for (const raw of nodes) {
    const { action, config } = normalizeNode(raw as FlowNode)

    if (action === 'condition') {
      pendingCondition = config
      continue
    }

    let gate: boolean | null = null
    if (pendingCondition) {
      gate = conditionPasses(pendingCondition, ctx.body)
      pendingCondition = null
    }
    if (gate === false) continue

    if (action === 'send_whatsapp' || action === 'message' || action === 'quick_reply') {
      const text = typeof config.text === 'string' ? config.text : ''
      if (!text.trim()) continue

      if (typeof config.templateId === 'string' && config.templateId.trim()) {
        // Templates are always allowed regardless of the 24h window
        await sendWhatsappTemplate(ctx.phoneNumber, config.templateId.trim())
      } else {
        // Free-form text is only allowed inside the customer-service window
        if (!ctx.inWindow) {
          console.warn(
            `[whatsapp-inbound] skipping free-text send outside 24 h window for ${ctx.phoneNumber}`,
          )
          continue
        }
        await sendWhatsappText(ctx.phoneNumber, resolveTemplateVariables(text, ctx.contact))
      }
      continue
    }

    if (action === 'add_tag' || action === 'ADD_TAG') {
      const tagName =
        typeof config.tagName === 'string' && config.tagName.trim()
          ? config.tagName.trim()
          : typeof config.text === 'string'
            ? config.text.trim()
            : ''
      if (tagName && ctx.contactId) {
        await addContactTag(ctx.contactId, resolveTemplateVariables(tagName, ctx.contact))
      }
      continue
    }

    console.warn(`[whatsapp-inbound] no handler for action "${action}" — skipped`)
  }
}

// --- contact lookup for template variables ------------------------------------

async function loadContact(contactId: string): Promise<ContactRow | null> {
  try {
    const rows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    return rows[0] ?? null
  } catch (error) {
    logAutomationError('inbound-router:contactLookup', error)
    return null
  }
}

// --- public entry point --------------------------------------------------------

/**
 * Processes an inbound WhatsApp message through keyword automations.
 *
 * Returns `true` when at least one automation flow matched and executed its
 * actions. When no automation matches the message remains in the inbox with no
 * side effects.
 */
export async function processInboundWhatsAppMessage(
  params: InboundParams,
): Promise<boolean> {
  const { conversationId, leadId, phoneNumber, body, messageType } = params

  // Only text messages carry typed keywords — templates and media skip routing.
  if (messageType !== 'text') return false

  // ── 1. Find active keyword automations ──────────────────────────────────
  let automationFlows: Array<{
    id: string
    nodes: unknown[] | null
    trigger_config: Record<string, unknown> | null
  }> = []
  try {
    automationFlows = await db
      .select({
        id: flows.id,
        nodes: flows.nodes,
        trigger_config: flows.trigger_config,
      })
      .from(flows)
      .where(
        and(
          eq(flows.status, 'active'),
          eq(flows.trigger_type, 'event_based'),
          sql`${flows.trigger_config}->>'trigger' = 'whatsapp.message_received'`
        )
      )
  } catch (error) {
    logAutomationError('inbound-router:flowLookup', error)
    return false
  }

  if (!automationFlows.length) return false

  // ── 2. Evaluate keyword filters ─────────────────────────────────────────
  const matched = automationFlows
    .map((flow) => ({
      ...flow,
      nodes: flow.nodes ?? [],
      trigger_config: flow.trigger_config ?? {},
    }))
    .filter((flow) => keywordMatches(body, flow.trigger_config))

  if (!matched.length) return false

  // ── 3. Enrich context ───────────────────────────────────────────────────
  const inWindow = await isInCustomerServiceWindow(conversationId)
  const contact = leadId ? await loadContact(leadId) : null

  // ── 4. Interpret each matching flow's graph ─────────────────────────────
  for (const flow of matched) {
    const nodes = Array.isArray(flow.nodes) ? flow.nodes : []
    if (!nodes.length) continue
    try {
      await interpretFlow(nodes, {
        phoneNumber,
        contactId: leadId ?? null,
        contact,
        inWindow,
        body,
      })
    } catch (error) {
      logAutomationError(`inbound-router:interpret:${flow.id}`, error)
    }
  }

  return true
}
