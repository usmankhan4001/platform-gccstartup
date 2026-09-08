import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_sends } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params

    const campaigns = await db.select().from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
    const campaign = campaigns[0]
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const sends = await db
      .select({ status: email_sends.status, count: email_sends.id })
      .from(email_sends)
      .where(eq(email_sends.campaign_id, id))
      .limit(5_000)
    const stats = sends.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({ data: campaign, stats })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns/id] get failed', error)
    return NextResponse.json({ error: 'Failed to load campaign' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = { updated_at: new Date(), updated_by: user.id }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (typeof body.templateId === 'string' && body.templateId.trim()) updates.template_id = body.templateId.trim()
    if (body.audienceFilter !== undefined) updates.audience_filter = body.audienceFilter
    if (body.scheduledAt !== undefined) {
      updates.scheduled_at = body.scheduledAt ? new Date(body.scheduledAt) : null
      updates.status = body.scheduledAt ? 'scheduled' : 'draft'
    }
    if (['draft', 'scheduled', 'paused', 'cancelled'].includes(body.status)) updates.status = body.status
    if (typeof body.variantBSubject === 'string' || body.variantBSubject === null) {
      updates.variant_b_subject = body.variantBSubject ? String(body.variantBSubject).slice(0, 500) : null
    }
    if (typeof body.variantBTemplateId === 'string' || body.variantBTemplateId === null) {
      updates.variant_b_template_id = body.variantBTemplateId || null
    }
    if (Number.isInteger(body.testSplitPercent)) updates.test_split_percent = body.testSplitPercent
    if (typeof body.winnerCriteria === 'string' || body.winnerCriteria === null) {
      updates.winner_criteria = body.winnerCriteria ? String(body.winnerCriteria).slice(0, 50) : null
    }

    const updated = await db
      .update(email_campaigns)
      .set(updates)
      .where(eq(email_campaigns.id, id))
      .returning()
    if (!updated.length) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns/id] update failed', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['super_admin'])
    const { id } = await params

    // Campaign deletes cascade to email_sends; only a draft may be deleted, so a
    // campaign that has started sending can never be silently destroyed.
    const deleted = await db
      .delete(email_campaigns)
      .where(eq(email_campaigns.id, id))
      .returning({ id: email_campaigns.id, status: email_campaigns.status })
    if (!deleted.length) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    if (deleted[0].status !== 'draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be deleted' }, { status: 409 })
    }

    return NextResponse.json({ data: { deleted: true, id } })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns/id] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
