import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, email_sends, outbox_jobs } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const rows = await db
      .select()
      .from(email_sends)
      .where(eq(email_sends.contact_id, id))
      .orderBy(desc(email_sends.created_at))
      .limit(200)

    return NextResponse.json({ data: rows, total: rows.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/email] list failed', error)
    return NextResponse.json({ error: 'Failed to list email history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const leadRows = await db
      .select({ id: contacts.id, email: contacts.email })
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1)
    const lead = leadRows[0]
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (!lead.email) {
      return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })
    }

    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 500) : ''
    const html = typeof body.html === 'string' ? body.html : typeof body.body === 'string' ? body.body : ''
    if (!subject || !html) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Manual sends go through the durable outbox like every other email lane —
    // the worker owns provider delivery, retries and suppression checks.
    const jobId = randomUUID()
    await db.insert(outbox_jobs).values({
      id: jobId,
      job_type: 'send_email',
      payload: {
        contactId: lead.id,
        to: lead.email,
        subject,
        html,
        text: typeof body.text === 'string' ? body.text : null,
        source: 'crm_manual',
      },
      status: 'pending',
      next_run_at: new Date(),
    })

    return NextResponse.json({ data: { id: jobId, status: 'queued' }, id: jobId })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/email] queue failed', error)
    return NextResponse.json({ error: 'Failed to queue email' }, { status: 500 })
  }
}
