import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, crm_tasks, users } from '@gccstartup/db'

const PRIORITIES = ['low', 'normal', 'high'] as const

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const assigneeId = searchParams.get('assigned_to') || searchParams.get('assignee_id')
    const contactId = searchParams.get('contact_id') || searchParams.get('lead_id')
    const completed = searchParams.get('completed')

    const filters = []
    if (assigneeId) filters.push(eq(crm_tasks.assignee_id, assigneeId))
    if (contactId) filters.push(eq(crm_tasks.contact_id, contactId))
    if (completed === 'true') filters.push(sql`${crm_tasks.completed_at} IS NOT NULL`)
    if (completed === 'false') filters.push(isNull(crm_tasks.completed_at))

    const rows = await db
      .select({
        id: crm_tasks.id,
        title: crm_tasks.title,
        details: crm_tasks.details,
        assignee_id: crm_tasks.assignee_id,
        assignee_name: users.name,
        due_at: crm_tasks.due_at,
        completed_at: crm_tasks.completed_at,
        completed_by: crm_tasks.completed_by,
        priority: crm_tasks.priority,
        contact_id: crm_tasks.contact_id,
        deal_id: crm_tasks.deal_id,
        created_by: crm_tasks.created_by,
        created_at: crm_tasks.created_at,
        updated_at: crm_tasks.updated_at,
        contact_name: sql<string | null>`COALESCE(NULLIF(CONCAT_WS(' ', ${contacts.first_name}, ${contacts.last_name}), ''), ${contacts.display_name}, ${contacts.email})`,
      })
      .from(crm_tasks)
      .leftJoin(users, eq(users.id, crm_tasks.assignee_id))
      .leftJoin(contacts, eq(contacts.id, crm_tasks.contact_id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(crm_tasks.due_at))
      .limit(200)

    return NextResponse.json({ data: rows, total: rows.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/tasks] list failed', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
    if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 })

    const priority = PRIORITIES.find((p) => p === body.priority) || 'normal'
    const dueAt =
      typeof body.due_at === 'string' && !Number.isNaN(Date.parse(body.due_at)) ? new Date(body.due_at) : null

    const inserted = await db
      .insert(crm_tasks)
      .values({
        id: randomUUID(),
        title,
        details: typeof body.details === 'string' ? body.details : null,
        assignee_id: typeof body.assignee_id === 'string' ? body.assignee_id : user.id,
        due_at: dueAt,
        priority,
        contact_id: typeof body.contact_id === 'string' ? body.contact_id : null,
        deal_id: typeof body.deal_id === 'string' ? body.deal_id : null,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/tasks] create failed', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
