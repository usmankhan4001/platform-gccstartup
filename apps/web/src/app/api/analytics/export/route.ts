import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, email_campaigns, email_sends, email_templates } from '@gccstartup/db'

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = value instanceof Date ? value.toISOString() : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const exportType = searchParams.get('type') || 'campaigns'

    let csv = ''
    if (exportType === 'contacts') {
      const rows = await db
        .select({
          id: contacts.id,
          email: contacts.email,
          phone: contacts.phone,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          company: contacts.company,
          lifecycle_stage: contacts.lifecycle_stage,
          email_consent: contacts.email_consent,
          created_at: contacts.created_at,
        })
        .from(contacts)
        .orderBy(desc(contacts.created_at))
        .limit(10000)
      csv = toCsv(
        ['Id', 'Email', 'Phone', 'First Name', 'Last Name', 'Company', 'Lifecycle Stage', 'Email Consent', 'Created At'],
        rows.map((r) => [r.id, r.email, r.phone, r.first_name, r.last_name, r.company, r.lifecycle_stage, r.email_consent, r.created_at]),
      )
    } else if (exportType === 'messages') {
      const rows = await db
        .select({
          id: email_sends.id,
          to_email: email_sends.to_email,
          subject: email_sends.subject,
          status: email_sends.status,
          sent_at: email_sends.sent_at,
          delivered_at: email_sends.delivered_at,
          bounced_at: email_sends.bounced_at,
          failure_reason: email_sends.failure_reason,
          created_at: email_sends.created_at,
        })
        .from(email_sends)
        .orderBy(desc(email_sends.created_at))
        .limit(10000)
      csv = toCsv(
        ['Id', 'To', 'Subject', 'Status', 'Sent At', 'Delivered At', 'Bounced At', 'Failure Reason', 'Created At'],
        rows.map((r) => [r.id, r.to_email, r.subject, r.status, r.sent_at, r.delivered_at, r.bounced_at, r.failure_reason, r.created_at]),
      )
    } else {
      const rows = await db
        .select({
          id: email_campaigns.id,
          name: email_campaigns.name,
          template: email_templates.name,
          status: email_campaigns.status,
          recipient_count: email_campaigns.recipient_count,
          scheduled_at: email_campaigns.scheduled_at,
          started_at: email_campaigns.started_at,
          completed_at: email_campaigns.completed_at,
          created_at: email_campaigns.created_at,
        })
        .from(email_campaigns)
        .leftJoin(email_templates, eq(email_templates.id, email_campaigns.template_id))
        .orderBy(desc(email_campaigns.created_at))
        .limit(10000)
      csv = toCsv(
        ['Id', 'Name', 'Template', 'Status', 'Recipients', 'Scheduled At', 'Started At', 'Completed At', 'Created At'],
        rows.map((r) => [r.id, r.name, r.template, r.status, r.recipient_count, r.scheduled_at, r.started_at, r.completed_at, r.created_at]),
      )
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics_${exportType}_${range}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[analytics/export] failed', error)
    return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 })
  }
}
