import { NextRequest } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhook_deliveries } from '@gccstartup/db'
import { handleAdmin, json, errorJson, type RouteContext } from '../../../_lib'

export const GET = async (request: NextRequest, context: RouteContext) =>
  handleAdmin(request, async () => {
    const { id } = await context.params

    const rows = await db
      .select({
        id: webhook_deliveries.id,
        eventType: webhook_deliveries.event_type,
        status: webhook_deliveries.status,
        attempts: webhook_deliveries.attempts,
        responseStatus: webhook_deliveries.response_status,
        lastError: webhook_deliveries.last_error,
        createdAt: webhook_deliveries.created_at,
        deliveredAt: webhook_deliveries.delivered_at,
      })
      .from(webhook_deliveries)
      .where(eq(webhook_deliveries.webhook_id, id))
      .orderBy(desc(webhook_deliveries.created_at))
      .limit(25)

    if (rows.length === 0) {
      // Distinguish "no deliveries yet" from "unknown webhook" for the UI.
      return errorJson('No deliveries recorded for this webhook', 404)
    }

    return json(rows)
  })
