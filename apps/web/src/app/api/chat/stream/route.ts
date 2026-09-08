// Streams new messages for a conversation as Server-Sent Events. Each poll is
// a real Drizzle query for messages newer than the client's cursor; the stream
// closes after the first batch (the inbox re-opens it), keeping the handler
// stateless and serverless-friendly.
import { NextRequest } from 'next/server'
import { and, asc, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { messages } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { conversationId, since } = body as { conversationId?: string; since?: string }

    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cursor = since ? new Date(since) : new Date(Date.now() - 60 * 1000)
    if (Number.isNaN(cursor.getTime())) {
      return new Response(JSON.stringify({ error: 'since must be an ISO timestamp' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const rows = await db
      .select()
      .from(messages)
      .where(and(eq(messages.conversation_id, conversationId), gt(messages.created_at, cursor)))
      .orderBy(asc(messages.created_at))
      .limit(100)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const message of rows) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ cursor: rows.length ? rows[rows.length - 1].created_at : cursor.toISOString(), done: true })}\n\n`
          )
        )
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error streaming conversation messages', error)
    return new Response(JSON.stringify({ error: 'Failed to stream messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
