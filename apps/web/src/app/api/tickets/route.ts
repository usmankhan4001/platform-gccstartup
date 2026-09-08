import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, tickets, users } from '@gccstartup/db'

const TICKET_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const
const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
const TICKET_CHANNELS = ['portal', 'email', 'whatsapp'] as const

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assigned_to')

    const filters = []
    if (status && (TICKET_STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(tickets.status, status as (typeof TICKET_STATUSES)[number]))
    }
    if (priority && (TICKET_PRIORITIES as readonly string[]).includes(priority)) {
      filters.push(eq(tickets.priority, priority as (typeof TICKET_PRIORITIES)[number]))
    }
    if (assignedTo) filters.push(eq(tickets.assigned_to, assignedTo))

    const rows = await db
      .select({
        id: tickets.id,
        ticket_number: tickets.ticket_number,
        subject: tickets.subject,
        status: tickets.status,
        priority: tickets.priority,
        channel: tickets.channel,
        assigned_to: tickets.assigned_to,
        assignee_name: users.name,
        contact_id: tickets.contact_id,
        contact_name: sql<string>`COALESCE(NULLIF(CONCAT_WS(' ', ${contacts.first_name}, ${contacts.last_name}), ''), ${contacts.display_name}, ${contacts.email}, ${contacts.phone})`,
        created_at: tickets.created_at,
        updated_at: tickets.updated_at,
      })
      .from(tickets)
      .leftJoin(users, eq(users.id, tickets.assigned_to))
      .innerJoin(contacts, eq(contacts.id, tickets.contact_id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(tickets.updated_at))
      .limit(200)

    return NextResponse.json({ data: rows, total: rows.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[tickets] list failed', error)
    return NextResponse.json({ error: 'Failed to list tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const contactId = typeof body.contact_id === 'string' ? body.contact_id : typeof body.contactId === 'string' ? body.contactId : null
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 300) : ''
    if (!contactId || !subject) {
      return NextResponse.json({ error: 'contact_id and subject are required' }, { status: 400 })
    }

    const contact = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, contactId)).limit(1)
    if (!contact[0]) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const channel = TICKET_CHANNELS.find((c) => c === body.channel) || 'portal'
    const priority = TICKET_PRIORITIES.find((p) => p === body.priority) || 'normal'
    const ticketNumber = `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()

    const inserted = await db
      .insert(tickets)
      .values({
        id: randomUUID(),
        ticket_number: ticketNumber,
        contact_id: contactId,
        subject,
        priority,
        channel,
        assigned_to: typeof body.assigned_to === 'string' ? body.assigned_to : null,
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[tickets] create failed', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const id = typeof body.id === 'string' ? body.id : null
    if (!id) return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (TICKET_STATUSES.find((s) => s === body.status)) updates.status = body.status
    if (TICKET_PRIORITIES.find((p) => p === body.priority)) updates.priority = body.priority
    if (body.assigned_to === null || typeof body.assigned_to === 'string') updates.assigned_to = body.assigned_to

    const updated = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[tickets] update failed', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
