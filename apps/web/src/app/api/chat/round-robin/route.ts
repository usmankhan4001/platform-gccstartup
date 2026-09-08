// Auto-assigns an unassigned open conversation to the least-loaded active
// agent via the real AssignmentEngine (users + conversations queries).
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { conversations, users } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { AssignmentEngine } from '@/lib/whatsapp/routing'

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { conversationId } = body as { conversationId?: string }
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const rows = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    if (!rows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    await AssignmentEngine.routeConversation(conversationId)

    const updated = await db
      .select({
        conversationId: conversations.id,
        assignedTo: conversations.assigned_to,
        assignedToName: users.name,
      })
      .from(conversations)
      .leftJoin(users, eq(users.id, conversations.assigned_to))
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!updated[0]?.assignedTo) {
      return NextResponse.json({ assigned: false, message: 'No available agent could be selected' })
    }

    return NextResponse.json({ assigned: true, ...updated[0] })
  } catch (error) {
    console.error('Error in round-robin assignment', error)
    return NextResponse.json({ error: 'Round-robin assignment failed' }, { status: 500 })
  }
}
