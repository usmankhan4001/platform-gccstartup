import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_templates } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const templates = await db
      .select()
      .from(email_templates)
      .orderBy(desc(email_templates.updated_at))
      .limit(200)
    return NextResponse.json({ data: templates, total: templates.length })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/templates] list failed', error)
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const body = await request.json()
    const { name, subject, html, text, blocks, category, description } = body ?? {}

    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: 'name, subject and html are required' }, { status: 400 })
    }

    const created = await db
      .insert(email_templates)
      .values({
        id: randomUUID(),
        name: String(name).trim().slice(0, 200),
        subject: String(subject).trim().slice(0, 500),
        html_body: String(html),
        text_body: text ? String(text) : null,
        blocks: Array.isArray(blocks) ? blocks : [],
        description: description ? String(description) : null,
        category: ['marketing', 'transactional', 'flow', 'notification'].includes(category) ? category : 'marketing',
        created_by: user.id,
        updated_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/templates] create failed', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
