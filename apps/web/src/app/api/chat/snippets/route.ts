// Agent reply snippets. Schema mapping: snippets are `canned_responses` rows
// (title / shortcut / content / category / usage_count) — the closest existing
// table and an exact structural fit.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { canned_responses } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const snippets = await db
      .select()
      .from(canned_responses)
      .orderBy(desc(canned_responses.usage_count), desc(canned_responses.created_at))
      .limit(200)
    return NextResponse.json({ snippets })
  } catch (error) {
    console.error('Error fetching snippets', error)
    return NextResponse.json({ error: 'Failed to retrieve snippets' }, { status: 500 })
  }
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
    const { title, content, shortcut, category } = body as {
      title?: string
      content?: string
      shortcut?: string
      category?: string
    }

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const inserted = await db
      .insert(canned_responses)
      .values({
        id: randomUUID(),
        title: title.trim(),
        shortcut: shortcut?.trim() || null,
        content: content.trim(),
        category: category?.trim() || null,
      })
      .returning()

    return NextResponse.json({ snippet: inserted[0] })
  } catch (error) {
    console.error('Error creating snippet', error)
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }

    const deleted = await db
      .delete(canned_responses)
      .where(eq(canned_responses.id, id))
      .returning({ id: canned_responses.id })
    if (!deleted[0]) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snippet', error)
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 })
  }
}

// Records a snippet usage (increments usage_count) — called by the inbox when
// an agent inserts a snippet into a reply.
export async function PATCH(request: NextRequest) {
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
    const { id } = body as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updated = await db
      .update(canned_responses)
      .set({ usage_count: sql`${canned_responses.usage_count} + 1` })
      .where(eq(canned_responses.id, id))
      .returning({ id: canned_responses.id, usage_count: canned_responses.usage_count })

    if (!updated[0]) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 })
    }
    return NextResponse.json({ snippet: updated[0] })
  } catch (error) {
    console.error('Error updating snippet usage', error)
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 })
  }
}
