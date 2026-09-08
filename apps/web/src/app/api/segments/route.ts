import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { events } from '@gccstartup/db'

// The schema has no dedicated `segments` table yet. Saved segment definitions are
// persisted as `events` rows with event_type 'segment' and the definition in the
// jsonb payload — a real durable store using existing columns. When a proper
// email_segments-style table lands in @gccstartup/db, only this file changes.

const SEGMENT_EVENT_TYPE = 'segment'
const MAX_RULES_BYTES = 20000

type SegmentPayload = {
  name: string
  description: string | null
  rules: Record<string, unknown>
}

function normalizeRules(value: unknown): Record<string, unknown> | null {
  let candidate = value
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    if (!trimmed) return null
    try {
      candidate = JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  return candidate as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const rows = await db
      .select()
      .from(events)
      .where(eq(events.event_type, SEGMENT_EVENT_TYPE))
      .orderBy(desc(events.created_at))
      .limit(200)

    const segments = rows.map((row) => {
      const payload = (row.payload || {}) as Partial<SegmentPayloadShape>
      return {
        id: row.id,
        name: String(payload.name || 'Untitled segment'),
        description: payload.description ?? null,
        rulesJson: payload.rules ?? {},
        createdAt: row.created_at,
      }
    })

    return NextResponse.json(segments)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[segments] list failed', error)
    return NextResponse.json({ error: 'Failed to list segments' }, { status: 500 })
  }
}

type SegmentPayloadShape = {
  name?: unknown
  description?: unknown
  rules?: unknown
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Segment name is required' }, { status: 400 })

    const rules = normalizeRules(body.rulesJson ?? body.rules)
    if (!rules) {
      return NextResponse.json({ error: 'rulesJson must be a JSON object' }, { status: 400 })
    }
    if (JSON.stringify(rules).length > MAX_RULES_BYTES) {
      return NextResponse.json({ error: 'Segment rules are too large' }, { status: 400 })
    }

    const payload: SegmentPayloadShape = {
      name,
      description: typeof body.description === 'string' ? body.description : null,
      rules,
    }

    const inserted = await db
      .insert(events)
      .values({
        id: randomUUID(),
        event_type: SEGMENT_EVENT_TYPE,
        payload: payload as unknown as Record<string, unknown>,
        source: 'api/segments',
      })
      .returning()

    const row = inserted[0]
    return NextResponse.json({
      success: true,
      segment: {
        id: row.id,
        name,
        description: payload.description,
        rulesJson: rules,
        createdAt: row.created_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[segments] create failed', error)
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 })

    const deleted = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.event_type, SEGMENT_EVENT_TYPE)))
      .returning({ id: events.id })

    if (!deleted.length) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[segments] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 })
  }
}
