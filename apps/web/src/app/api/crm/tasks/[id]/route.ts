import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { crm_tasks } from '@gccstartup/db'

const PRIORITIES = ['low', 'normal', 'high'] as const

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const rows = await db.select().from(crm_tasks).where(eq(crm_tasks.id, id)).limit(1)
    if (!rows[0]) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ data: rows[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/tasks/[id]] detail failed', error)
    return NextResponse.json({ error: 'Failed to load task' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim().slice(0, 200)
    if (body.details === null || typeof body.details === 'string') updates.details = body.details ?? null
    if (body.assignee_id === null || typeof body.assignee_id === 'string') updates.assignee_id = body.assignee_id
    if (body.due_at === null || typeof body.due_at === 'string') {
      updates.due_at =
        typeof body.due_at === 'string' && !Number.isNaN(Date.parse(body.due_at)) ? new Date(body.due_at) : null
    }
    if (PRIORITIES.find((p) => p === body.priority)) updates.priority = body.priority
    if (typeof body.completed === 'boolean') {
      updates.completed_at = body.completed ? new Date() : null
      updates.completed_by = body.completed ? user.id : null
    }

    const updated = await db.update(crm_tasks).set(updates).where(eq(crm_tasks.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/tasks/[id]] update failed', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params

    const deleted = await db.delete(crm_tasks).where(eq(crm_tasks.id, id)).returning({ id: crm_tasks.id })
    if (!deleted.length) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/tasks/[id]] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
