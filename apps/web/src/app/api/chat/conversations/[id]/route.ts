// Conversation detail (with contact + message thread) and admin updates
// (state, assignment, unread reset) over `conversations` + `messages`.
import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, messages, users } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params

    const rows = await db
      .select({
        conversation: conversations,
        contact: contacts,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contact_id))
      .where(eq(conversations.id, id))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const thread = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, id))
      .orderBy(asc(messages.occurred_at), asc(messages.created_at))
      .limit(500)

    return NextResponse.json({ conversation: row.conversation, contact: row.contact, messages: thread })
  } catch (error) {
    console.error('Error fetching conversation', error)
    return NextResponse.json({ error: 'Failed to retrieve conversation' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params
    const body = await request.json()

    const existingRows = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const patch: Partial<typeof conversations.$inferInsert> = { updated_at: new Date() }

    if (body.state !== undefined) {
      if (body.state !== 'open' && body.state !== 'closed') {
        return NextResponse.json({ error: 'state must be "open" or "closed"' }, { status: 400 })
      }
      patch.state = body.state
      patch.closed_at = body.state === 'closed' ? new Date() : null
    }

    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null || body.assignedTo === '') {
        patch.assigned_to = null
      } else {
        const agentRows = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, body.assignedTo))
          .limit(1)
        if (!agentRows[0]) {
          return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 })
        }
        patch.assigned_to = agentRows[0].id
      }
    }

    if (body.markRead === true) patch.unread_count = 0

    const updated = await db
      .update(conversations)
      .set(patch)
      .where(eq(conversations.id, id))
      .returning()

    return NextResponse.json({ conversation: updated[0], updatedBy: user.id })
  } catch (error) {
    console.error('Error updating conversation', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
