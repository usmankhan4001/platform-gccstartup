import { NextRequest } from 'next/server'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  users,
  contacts,
  deals,
  api_keys,
  webhooks,
  webhook_deliveries,
  outbox_jobs,
  events,
} from '@gccstartup/db'
import { handleAdmin, json, safeCount } from '../_lib'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Aggregates for the admin dashboard. Every card is computed independently so a
 * single failing table degrades that card to `null` (rendered as "—") instead of
 * blanking the whole overview.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const since24h = new Date(Date.now() - DAY_MS)

    const [
      usersTotal,
      usersActive,
      contactsTotal,
      dealsOpen,
      apiKeysActive,
      webhooksActive,
      deliveries24h,
      deliveriesFailed24h,
      outboxPending,
      outboxFailed,
      events24h,
    ] = await Promise.all([
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(users)),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.is_active, true))),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(isNull(contacts.deleted_at))),
      safeCount(
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(deals)
          .where(eq(deals.status, 'open')),
      ),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(api_keys).where(eq(api_keys.is_active, true))),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(webhooks).where(eq(webhooks.is_active, true))),
      safeCount(
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(webhook_deliveries)
          .where(gte(webhook_deliveries.created_at, since24h)),
      ),
      safeCount(
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(webhook_deliveries)
          .where(and(gte(webhook_deliveries.created_at, since24h), eq(webhook_deliveries.status, 'failed'))),
      ),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(outbox_jobs).where(eq(outbox_jobs.status, 'pending'))),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(outbox_jobs).where(eq(outbox_jobs.status, 'failed'))),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(events).where(gte(events.created_at, since24h))),
    ])

    return json({
      cards: {
        usersTotal,
        usersActive,
        contactsTotal,
        dealsOpen,
        apiKeysActive,
        webhooksActive,
        deliveries24h,
        deliveriesFailed24h,
        outboxPending,
        outboxFailed,
        events24h,
      },
      generatedAt: new Date().toISOString(),
    })
  })
