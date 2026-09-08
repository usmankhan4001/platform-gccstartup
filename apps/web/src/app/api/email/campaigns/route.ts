import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns, email_templates } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const campaigns = await db
      .select()
      .from(email_campaigns)
      .orderBy(desc(email_campaigns.updated_at))
      .limit(200)
    const total = campaigns.length
    return NextResponse.json({ data: campaigns, total })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns] list failed', error)
    return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const body = await request.json()
    const { name, templateId, audienceFilter, scheduledAt, variantBSubject, variantBTemplateId, testSplitPercent, winnerCriteria } = body ?? {}

    if (!name?.trim() || !templateId?.trim()) {
      return NextResponse.json({ error: 'name and templateId are required' }, { status: 400 })
    }

    const template = await db
      .select({ id: email_templates.id })
      .from(email_templates)
      .where(eq(email_templates.id, String(templateId)))
      .limit(1)
    if (!template.length) return NextResponse.json({ error: 'Template not found' }, { status: 400 })

    if (variantBTemplateId) {
      const variantB = await db
        .select({ id: email_templates.id })
        .from(email_templates)
        .where(eq(email_templates.id, String(variantBTemplateId)))
        .limit(1)
      if (!variantB.length) return NextResponse.json({ error: 'Variant B template not found' }, { status: 400 })
    }

    const created = await db
      .insert(email_campaigns)
      .values({
        id: randomUUID(),
        name: String(name).trim().slice(0, 200),
        template_id: String(templateId),
        audience_filter: audienceFilter ?? null,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        variant_b_subject: variantBSubject ? String(variantBSubject).slice(0, 500) : null,
        variant_b_template_id: variantBTemplateId ? String(variantBTemplateId) : null,
        test_split_percent: Number.isInteger(testSplitPercent) ? testSplitPercent : null,
        winner_criteria: winnerCriteria ? String(winnerCriteria).slice(0, 50) : null,
        created_by: user.id,
        updated_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns] create failed', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
