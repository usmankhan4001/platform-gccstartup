import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { asc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { ticket_messages, tickets } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const ticket = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1)
    if (!ticket[0]) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const rows = await db
      .select()
      .from(ticket_messages)
      .where(eq(ticket_messages.ticket_id, id))
      .orderBy(asc(ticket_messages.created_at))
      .limit(500)

    return NextResponse.json({ data: rows, messages: rows })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[tickets/[id]/messages] list failed', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!text) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })

    const ticket = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1)
    if (!ticket[0]) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const inserted = await db
      .insert(ticket_messages)
      .values({
        id: randomUUID(),
        ticket_id: id,
        author_type: 'staff',
        author_id: user.id,
        author_name: user.name,
        body: text,
      })
      .returning()

    // A staff reply reopens a resolved/closed ticket and bumps it in the queue.
    await db
      .update(tickets)
      .set({ status: 'pending', updated_at: new Date() })
      .where(eq(tickets.id, id))

    return NextResponse.json({ data: inserted[0], message: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[tickets/[id]/messages] create failed', error)
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 })
  }
}
