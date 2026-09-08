import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'

// The current schema has no dedicated `groups` table — the grouping mechanism on
// `contacts` is the GIN-indexed `tags` jsonb array. A group is therefore a tag:
// listing reads distinct tags with live membership counts, and deleting a group
// removes that tag from every contact. When a real groups table lands in
// @gccstartup/db, this file is the only place that needs to change.

type TagCountRow = { name: string; contact_count: number }

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  const wrapped = result as { rows?: T[] }
  return wrapped?.rows || []
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const result = await db.execute(sql`
      SELECT tag AS name, count(*)::int AS contact_count
      FROM ${contacts}, jsonb_array_elements_text(${contacts.tags}) AS tag
      WHERE ${contacts.deleted_at} IS NULL
      GROUP BY tag
      ORDER BY tag
    `)

    const groups = rowsOf<TagCountRow>(result).map((row) => ({
      id: row.name,
      name: row.name,
      description: null,
      color: '#25D366',
      _count: { contacts: Number(row.contact_count) || 0 },
    }))

    return NextResponse.json(groups)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[groups] list failed', error)
    return NextResponse.json({ error: 'Failed to list groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    if (name.length > 100) {
      return NextResponse.json({ error: 'Group name must be 100 characters or fewer' }, { status: 400 })
    }

    // Tags only exist once a contact carries them, so creation validates and
    // echoes the group back with zero membership.
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(and(isNull(contacts.deleted_at), sql`${contacts.tags} @> ${JSON.stringify(name)}::jsonb`))

    return NextResponse.json({
      success: true,
      group: {
        id: name,
        name,
        description: typeof body.description === 'string' ? body.description : null,
        color: typeof body.color === 'string' ? body.color : '#25D366',
        _count: { contacts: Number(existing[0]?.count) || 0 },
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[groups] create failed', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })

    await db
      .update(contacts)
      .set({
        tags: sql`(
          SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
          FROM jsonb_array_elements_text(COALESCE(${contacts.tags}, '[]'::jsonb)) AS t
          WHERE t <> ${id}
        )`,
        updated_at: new Date(),
      })
      .where(and(isNull(contacts.deleted_at), sql`${contacts.tags} @> ${JSON.stringify(id)}::jsonb`))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[groups] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
