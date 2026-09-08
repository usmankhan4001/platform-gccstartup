// Conversation notes. Schema mapping: notes are `crm_notes` rows keyed by the
// conversation's contact_id — the notes are about the person, so they follow
// the contact across conversations.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations, crm_notes } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

async function resolveContactId(conversationId: string): Promise<string | null> {
  const rows = await db
    .select({ contact_id: conversations.contact_id })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
  return rows[0]?.contact_id ?? null
}

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
    const contactId = await resolveContactId(id)
    if (!contactId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const notes = await db
      .select()
      .from(crm_notes)
      .where(eq(crm_notes.contact_id, contactId))
      .orderBy(desc(crm_notes.created_at))
      .limit(200)

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching conversation notes', error)
    return NextResponse.json({ error: 'Failed to retrieve notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: { id: string; name: string | null }
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
    const noteBody = typeof body.body === 'string' ? body.body.trim() : ''
    if (!noteBody) {
      return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
    }

    const contactId = await resolveContactId(id)
    if (!contactId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const inserted = await db
      .insert(crm_notes)
      .values({
        id: randomUUID(),
        contact_id: contactId,
        body: noteBody,
        author_id: user.id,
        author_name: user.name,
      })
      .returning()

    return NextResponse.json({ note: inserted[0] })
  } catch (error) {
    console.error('Error creating conversation note', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
