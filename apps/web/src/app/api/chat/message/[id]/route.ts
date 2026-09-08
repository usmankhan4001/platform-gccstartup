// Message status updates (e.g. mark delivered/read from the inbox UI).
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { messages } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const STATUSES = ['queued', 'sent', 'delivered', 'read', 'failed'] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json()

    if (body.status === undefined || !STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const patch: Partial<typeof messages.$inferInsert> = { status: body.status, updated_at: new Date() }
    if (body.status === 'sent') patch.sent_at = new Date()
    if (body.status === 'delivered') patch.delivered_at = new Date()
    if (body.status === 'read') patch.read_at = new Date()
    if (body.status === 'failed') patch.failure_reason = body.failureReason ?? 'Marked failed manually'

    const updated = await db
      .update(messages)
      .set(patch)
      .where(eq(messages.id, id))
      .returning()

 

    if (!updated[0]) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ message: updated[0] })
  } catch (error) {
    console.error('Error updating message status', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}
