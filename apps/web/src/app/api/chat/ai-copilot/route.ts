// AI copilot suggestions. No AI provider is wired; the suggestion is derived
// deterministically from real data: the conversation's last inbound message is
// scored against `canned_responses` content (token overlap) and the best match
// is returned with its source snippet.
import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { canned_responses, conversations, messages } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'in', 'for', 'on',
  'i', 'you', 'my', 'we', 'it', 'this', 'that', 'with', 'have', 'has',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
}

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

    const convRows = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    if (!convRows[0]) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const lastInbound = await db
      .select({ body: messages.body })
      .from(messages)
      .where(and(eq(messages.conversation_id, conversationId), eq(messages.direction, 'inbound')))
      .orderBy(desc(messages.occurred_at))
      .limit(1)

    const inboundBody = lastInbound[0]?.body
    if (!inboundBody) {
      return NextResponse.json({ suggestion: null, message: 'No inbound message to suggest a reply for' })
    }

    const tokens = tokenize(inboundBody)
    if (tokens.length === 0) {
      return NextResponse.json({ suggestion: null, message: 'Inbound message has no scoreable tokens' })
    }

    const snippets = await db
      .select({ id: canned_responses.id, title: canned_responses.title, content: canned_responses.content })
      .from(canned_responses)
      .limit(500)

    let best: { id: string; title: string; content: string; score: number } | null = null
    for (const snippet of snippets) {
      const haystack = `${snippet.title} ${snippet.content}`.toLowerCase()
      const score = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0)
      if (score > 0 && (!best || score > best.score)) {
        best = { ...snippet, score }
      }
    }

    if (!best) {
      return NextResponse.json({ suggestion: null, message: 'No matching snippet for the last inbound message' })
    }

    return NextResponse.json({
      suggestion: best.content,
      source: { snippetId: best.id, title: best.title, score: best.score },
      basedOn: inboundBody,
    })
  } catch (error) {
    console.error('Error generating copilot suggestion', error)
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}
