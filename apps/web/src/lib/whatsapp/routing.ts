// Conversation auto-assignment (least-active routing, WATI-style). Real Drizzle
// queries: agents come from `users` (role_id in staff/admin/super_admin and
// is_active), open-conversation load is counted on `conversations`, and the
// assignment is recorded as a `conversation.assigned` event.

import { and, count, eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { conversations, events, users } from '@gccstartup/db'

const logger = {
  warn: (...args: unknown[]) => console.warn('[AssignmentEngine]', ...args),
  error: (...args: unknown[]) => console.error('[AssignmentEngine]', ...args),
  info: (...args: unknown[]) => console.info('[AssignmentEngine]', ...args),
}

const AGENT_ROLES = ['staff', 'admin', 'super_admin']

export class AssignmentEngine {
  /**
   * Automatically routes an incoming conversation to the most available online agent.
   */
  static async routeConversation(conversationId: string): Promise<void> {
    try {
      const convRows = await db
        .select({ id: conversations.id, assigned_to: conversations.assigned_to })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1)
      const conv = convRows[0]
      if (!conv || conv.assigned_to) return // Already assigned

      // 1. Fetch available agents
      const availableAgents = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.is_active, true), inArray(users.role_id, AGENT_ROLES)))

      if (availableAgents.length === 0) {
        logger.warn('AssignmentEngine: No available agents to route to.')
        return
      }

      // 2. Capacity check: how many OPEN conversations each agent carries
      const agentLoads = await db
        .select({ assignedToId: conversations.assigned_to, load: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.state, 'open'),
            inArray(conversations.assigned_to, availableAgents.map((a) => a.id))
          )
        )
        .groupBy(conversations.assigned_to)

      const loadMap = new Map<string, number>()
      for (const agent of availableAgents) loadMap.set(agent.id, 0)
      for (const load of agentLoads) {
        if (load.assignedToId) loadMap.set(load.assignedToId, Number(load.load))
      }

      // 3. Least-active routing
      let selectedAgentId = availableAgents[0].id
      let minLoad = Number.POSITIVE_INFINITY
      for (const [agentId, load] of loadMap.entries()) {
        if (load < minLoad) {
          minLoad = load
          selectedAgentId = agentId
        }
      }

      // 4. Assign the conversation
      await db
        .update(conversations)
        .set({ assigned_to: selectedAgentId, updated_at: new Date() })
        .where(eq(conversations.id, conversationId))

      await db.insert(events).values({
        id: randomUUID(),
        event_type: 'conversation.assigned',
        payload: { conversationId, assignedToId: selectedAgentId, load: minLoad, reason: 'auto_capacity_routing' },
        source: 'whatsapp-routing',
      })

      logger.info(
        `Conversation auto-assigned: conversationId=${conversationId}, assignedToId=${selectedAgentId}, load=${minLoad}`
      )
    } catch (error) {
      logger.error(`Error in AssignmentEngine routing: conversationId=${conversationId}, error=${error}`)
    }
  }
}
