import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  contacts,
  deals,
  email_campaigns,
  email_sends,
  email_templates,
  message_templates,
  messages,
  pipeline_stages,
} from '@gccstartup/db'

const RANGES: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  const wrapped = result as { rows?: T[] }
  return wrapped?.rows || []
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const days = RANGES[range] || 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Each section degrades independently — one failing aggregate must not blank
    // the dashboard (the sitemap lesson: never batch Directus/DB reads behind one
    // all-or-nothing catch).
    const summary = {
      totalContacts: 0,
      totalGroups: 0,
      totalTemplates: 0,
      totalCampaigns: 0,
      totalMessages: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalReplied: 0,
      totalFailed: 0,
      deliveryRate: '0.0',
      readRate: '0.0',
      replyRate: '0.0',
      failureRate: '0.0',
    }
    let funnel: Array<{ stage: string; count: number }> = []
    let dailyVolume: Array<{ day: string; sent: number; delivered: number; failed: number }> = []
    let categoryCounts: Record<string, number> = { MARKETING: 0, UTILITY: 0, AUTHENTICATION: 0, SERVICE: 0 }
    let errorBreakdown: Array<{ reason: string | null; count: number }> = []
    let recentCampaigns: Array<Record<string, unknown>> = []
    let pipeline: Array<{ stage: string; count: number; value: number }> = []

    try {
      const [contactRows, groupResult, templateRows, campaignRows, messageRows] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(isNull(contacts.deleted_at)),
        db.execute(sql`
          SELECT count(DISTINCT tag)::int AS count
          FROM ${contacts}, jsonb_array_elements_text(${contacts.tags}) AS tag
          WHERE ${contacts.deleted_at} IS NULL
        `),
        db.select({ count: sql<number>`count(*)::int` }).from(message_templates),
        db.select({ count: sql<number>`count(*)::int` }).from(email_templates),
        db.select({ count: sql<number>`count(*)::int` }).from(messages),
      ])
      summary.totalContacts = Number(contactRows[0]?.count) || 0
      summary.totalGroups = Number(rowsOf<{ count: number }>(groupResult)[0]?.count) || 0
      summary.totalTemplates = (Number(templateRows[0]?.count) || 0) + (Number(campaignRows[0]?.count) || 0)
      summary.totalMessages = Number(messageRows[0]?.count) || 0
    } catch (error) {
      console.error('[analytics] summary failed', error)
    }

    try {
      const statusRows = await db
        .select({ status: email_sends.status, count: sql<number>`count(*)::int` })
        .from(email_sends)
        .groupBy(email_sends.status)
      const counts: Record<string, number> = {}
      for (const row of statusRows) counts[row.status] = Number(row.count) || 0
      summary.totalSent = counts.sent || 0
      summary.totalDelivered = counts.delivered || 0
      summary.totalRead = counts.delivered || 0
      summary.totalFailed = (counts.failed || 0) + (counts.bounced || 0)
      summary.deliveryRate = summary.totalSent > 0 ? ((summary.totalDelivered / summary.totalSent) * 100).toFixed(1) : '0.0'
      summary.readRate = summary.totalDelivered > 0 ? ((summary.totalRead / summary.totalDelivered) * 100).toFixed(1) : '0.0'
      summary.failureRate =
        summary.totalSent + summary.totalFailed > 0
          ? ((summary.totalFailed / (summary.totalSent + summary.totalFailed)) * 100).toFixed(1)
          : '0.0'
    } catch (error) {
      console.error('[analytics] send status failed', error)
    }

    try {
      const campaignCount = await db.select({ count: sql<number>`count(*)::int` }).from(email_campaigns)
      summary.totalCampaigns = Number(campaignCount[0]?.count) || 0
    } catch (error) {
      console.error('[analytics] campaign count failed', error)
    }

    try {
      funnel = await db
        .select({ stage: contacts.lifecycle_stage, count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(isNull(contacts.deleted_at))
        .groupBy(contacts.lifecycle_stage)
    } catch (error) {
      console.error('[analytics] funnel failed', error)
    }

    try {
      const volumeRows = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${email_sends.created_at}), 'YYYY-MM-DD')`,
          sent: sql<number>`count(*) FILTER (WHERE ${email_sends.status} <> 'queued')::int`,
          delivered: sql<number>`count(*) FILTER (WHERE ${email_sends.status} = 'delivered')::int`,
          failed: sql<number>`count(*) FILTER (WHERE ${email_sends.status} IN ('failed', 'bounced'))::int`,
        })
        .from(email_sends)
        .where(gte(email_sends.created_at, since))
        .groupBy(sql`date_trunc('day', ${email_sends.created_at})`)
        .orderBy(sql`date_trunc('day', ${email_sends.created_at})`)
      dailyVolume = volumeRows.map((row) => ({
        day: String(row.day),
        sent: Number(row.sent) || 0,
        delivered: Number(row.delivered) || 0,
        failed: Number(row.failed) || 0,
      }))
    } catch (error) {
      console.error('[analytics] daily volume failed', error)
    }

    try {
      const categoryRows = await db
        .select({ category: message_templates.category, count: sql<number>`count(*)::int` })
        .from(message_templates)
        .groupBy(message_templates.category)
      const normalized: Record<string, number> = { MARKETING: 0, UTILITY: 0, AUTHENTICATION: 0, SERVICE: 0 }
      for (const row of categoryRows) {
        const key = String(row.category || 'UTILITY').toUpperCase()
        normalized[key] = (normalized[key] || 0) + (Number(row.count) || 0)
      }
      categoryCounts = normalized
    } catch (error) {
      console.error('[analytics] categories failed', error)
    }

    try {
      const errorRows = await db
        .select({ reason: email_sends.failure_reason, count: sql<number>`count(*)::int` })
        .from(email_sends)
        .where(and(isNotNull(email_sends.failure_reason), gte(email_sends.created_at, since)))
        .groupBy(email_sends.failure_reason)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
      errorBreakdown = errorRows.map((row) => ({ reason: row.reason, count: Number(row.count) || 0 }))
    } catch (error) {
      console.error('[analytics] error breakdown failed', error)
    }

    try {
      const campaignRows = await db
        .select({
          id: email_campaigns.id,
          name: email_campaigns.name,
          status: email_campaigns.status,
          recipientCount: email_campaigns.recipient_count,
          startedAt: email_campaigns.started_at,
          createdAt: email_campaigns.created_at,
        })
        .from(email_campaigns)
        .orderBy(desc(email_campaigns.created_at))
        .limit(5)
      recentCampaigns = campaignRows
    } catch (error) {
      console.error('[analytics] recent campaigns failed', error)
    }

    try {
      const pipelineRows = await db
        .select({
          stage: pipeline_stages.name,
          count: sql<number>`count(*)::int`,
          value: sql<number>`COALESCE(SUM(${deals.value}), 0)::double precision`,
        })
        .from(deals)
        .innerJoin(pipeline_stages, eq(pipeline_stages.id, deals.stage_id))
        .where(eq(deals.status, 'open'))
        .groupBy(pipeline_stages.name, pipeline_stages.position)
        .orderBy(pipeline_stages.position)
      pipeline = pipelineRows.map((row) => ({
        stage: row.stage,
        count: Number(row.count) || 0,
        value: Number(row.value) || 0,
      }))
    } catch (error) {
      console.error('[analytics] pipeline failed', error)
    }

    return NextResponse.json({
      range,
      summary,
      funnel,
      dailyVolume,
      categoryCounts,
      errorBreakdown,
      recentCampaigns,
      pipeline,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[analytics] failed', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
