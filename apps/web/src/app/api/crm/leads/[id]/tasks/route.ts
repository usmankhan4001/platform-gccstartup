import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, crm_tasks } from '@gccstartup/db'

const PRIORITIES = ['low', 'normal', 'high'] as const

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const rows = await db
      .select()
      .from(crm_tasks)
      .where(eq(crm_tasks.contact_id, id))
      .orderBy(desc(crm_tasks.created_at))
      .limit(200)

    return NextResponse.json({ data: rows })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/tasks] list failed', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const lead = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, id)).limit(1)
    if (!lead[0]) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
    if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 })

    const inserted = await db
      .insert(crm_tasks)
      .values({
        id: randomUUID(),
        title,
        details: typeof body.details === 'string' ? body.details : null,
        assignee_id: typeof body.assignee_id === 'string' ? body.assignee_id : user.id,
        due_at:
          typeof body.due_at === 'string' && !Number.isNaN(Date.parse(body.due_at)) ? new Date(body.due_at) : null,
        priority: PRIORITIES.find((p) => p === body.priority) || 'normal',
        contact_id: id,
        deal_id: typeof body.deal_id === 'string' ? body.deal_id : null,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/tasks] create failed', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const taskId = typeof body.task_id === 'string' ? body.task_id : null
    if (!taskId) return NextResponse.json({ error: 'task_id is required' }, { status: 400 })

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

    const updated = await db
      .update(crm_tasks)
      .set(updates)
      .where(and(eq(crm_tasks.id, taskId), eq(crm_tasks.contact_id, id)))
      .returning()

    if (!updated.length) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/tasks] update failed', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')
    if (!taskId) return NextResponse.json({ error: 'task_id is required' }, { status: 400 })

    const deleted = await db
      .delete(crm_tasks)
      .where(and(eq(crm_tasks.id, taskId), eq(crm_tasks.contact_id, id)))
      .returning({ id: crm_tasks.id })

    if (!deleted.length) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/tasks] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
