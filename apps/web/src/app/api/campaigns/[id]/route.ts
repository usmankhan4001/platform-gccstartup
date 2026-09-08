import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { email_campaigns, email_sends, email_templates } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const rows = await db
      .select({
        id: email_campaigns.id,
        name: email_campaigns.name,
        templateId: email_campaigns.template_id,
        templateName: email_templates.name,
        audienceFilter: email_campaigns.audience_filter,
        status: email_campaigns.status,
        scheduledAt: email_campaigns.scheduled_at,
        startedAt: email_campaigns.started_at,
        completedAt: email_campaigns.completed_at,
        recipientCount: email_campaigns.recipient_count,
        error: email_campaigns.error,
        createdAt: email_campaigns.created_at,
      })
      .from(email_campaigns)
      .leftJoin(email_templates, eq(email_templates.id, email_campaigns.template_id))
      .where(eq(email_campaigns.id, id))
      .limit(1)
    const campaign = rows[0]
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const statusCounts = await db
      .select({ status: email_sends.status, count: sql<number>`count(*)::int` })
      .from(email_sends)
      .where(eq(email_sends.campaign_id, id))
      .groupBy(email_sends.status)

    const counts: Record<string, number> = {}
    for (const row of statusCounts) counts[row.status] = Number(row.count) || 0
    const total = campaign.recipientCount || 0
    const sent = counts.sent || 0
    const delivered = counts.delivered || 0
    const read = counts.delivered || 0
    const replied = 0
    const failed = (counts.failed || 0) + (counts.bounced || 0)

    const stats = {
      total,
      sent,
      delivered,
      read,
      replied,
      failed,
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
      readRate: delivered > 0 ? ((read / delivered) * 100).toFixed(1) : '0',
      replyRate: delivered > 0 ? ((replied / delivered) * 100).toFixed(1) : '0',
      failureRate: total > 0 ? ((failed / total) * 100).toFixed(1) : '0',
    }

    return NextResponse.json({ campaign, stats })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns/[id]] detail failed', error)
    return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params

    // Only terminal-state campaigns can be removed — an in-flight campaign must
    // be paused or cancelled first so queued outbox jobs are never orphaned.
    const deleted = await db
      .delete(email_campaigns)
      .where(sql`${email_campaigns.id} = ${id} AND ${email_campaigns.status} IN ('draft', 'cancelled', 'failed', 'sent')`)
      .returning({ id: email_campaigns.id })

    if (!deleted.length) {
      return NextResponse.json(
        { error: 'Campaign not found or still active — pause or cancel it first' },
        { status: 409 },
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns/[id]] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
