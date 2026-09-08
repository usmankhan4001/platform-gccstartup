// Single knowledge-base CRUD. See ../route.ts for the KB → `flows` row mapping.
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const SOURCE_TYPES = ['GENERATED', 'MANUAL', 'IMPORTED']
const KB_STATUSES = ['DRAFT', 'READY', 'DISABLED']

type KbConfig = {
  entityKind: 'knowledge_base'
  sourceType: string
  rawNotes?: string | null
  contentMarkdown: string
  chunks: string[]
  status: string
}

function chunkMarkdown(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function kbFilter(id: string) {
  return and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'knowledge_base'`)
}

function serializeKb(row: typeof flows.$inferSelect) {
  const cfg = row.trigger_config as unknown as KbConfig
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sourceType: cfg.sourceType,
    rawNotes: cfg.rawNotes ?? null,
    contentMarkdown: cfg.contentMarkdown,
    chunks: JSON.stringify(cfg.chunks ?? []),
    chunkCount: (cfg.chunks ?? []).length,
    status: cfg.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params
    const rows = await db.select().from(flows).where(kbFilter(id)).limit(1)
    if (!rows[0]) {
      return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 })
    }
    return NextResponse.json(serializeKb(rows[0]))
  } catch (error) {
    console.error('Error fetching knowledge base', error)
    return NextResponse.json({ error: 'Failed to retrieve Knowledge Base' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params
    const body = await request.json()

    const existingRows = await db.select().from(flows).where(kbFilter(id)).limit(1)
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 })
    }

    const cfg = existing.trigger_config as unknown as KbConfig

    if (body.sourceType && !SOURCE_TYPES.includes(String(body.sourceType).toUpperCase())) {
      return NextResponse.json({ error: `sourceType must be one of: ${SOURCE_TYPES.join(', ')}` }, { status: 400 })
    }

    const markdown =
      body.contentMarkdown !== undefined
        ? String(body.contentMarkdown ?? '')
        : body.rawNotes !== undefined && !cfg.contentMarkdown
          ? String(body.rawNotes ?? '')
          : cfg.contentMarkdown

    const nextCfg: KbConfig = {
      ...cfg,
      sourceType: body.sourceType ? String(body.sourceType).toUpperCase() : cfg.sourceType,
      rawNotes: body.rawNotes !== undefined ? body.rawNotes : cfg.rawNotes ?? null,
      contentMarkdown: markdown,
      chunks: markdown.trim() ? chunkMarkdown(markdown) : cfg.chunks ?? [],
      status:
        body.status && KB_STATUSES.includes(String(body.status).toUpperCase())
          ? String(body.status).toUpperCase()
          : cfg.status,
    }

    const updated = await db
      .update(flows)
      .set({
        name: body.name?.trim() || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        status: nextCfg.status === 'DISABLED' ? 'paused' : 'active',
        trigger_config: nextCfg,
        updated_at: new Date(),
      })
      .where(kbFilter(id))
      .returning()

    return NextResponse.json({ success: true, knowledgeBase: serializeKb(updated[0]) })
  } catch (error) {
    console.error('Error updating knowledge base', error)
    return NextResponse.json({ error: 'Failed to update Knowledge Base' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { id } = await params
    const deleted = await db.delete(flows).where(kbFilter(id)).returning({ id: flows.id })
    if (!deleted[0]) {
      return NextResponse.json({ error: 'Knowledge Base not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Knowledge Base deleted' })
  } catch (error) {
    console.error('Error deleting knowledge base', error)
    return NextResponse.json({ error: 'Failed to delete Knowledge Base' }, { status: 500 })
  }
}
