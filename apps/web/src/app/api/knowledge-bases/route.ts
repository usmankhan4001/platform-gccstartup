// Knowledge-bases endpoint. Schema mapping: the platform DB has no knowledge
// base table, so a KB is a `flows` row with trigger_config.entityKind =
// 'knowledge_base' and trigger_config carrying { sourceType, rawNotes,
// contentMarkdown, chunks, status }. KB rows referenced by bots (see
// /api/bots) via that flows id. Content is chunked on write (paragraph split)
// so the bot test endpoint can score real chunks.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, sql } from 'drizzle-orm'
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

// Splits markdown into paragraph-level chunks on blank lines, merging tiny
// fragments so a chunk always carries some retrieval value.
function chunkMarkdown(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function kbFilter() {
  return sql`${flows.trigger_config}->>'entityKind' = 'knowledge_base'`
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

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const rows = await db.select().from(flows).where(kbFilter()).orderBy(desc(flows.created_at))
    return NextResponse.json(rows.map(serializeKb))
  } catch (error) {
    console.error('Error fetching knowledge bases', error)
    return NextResponse.json({ error: 'Failed to retrieve knowledge bases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { name, sourceType = 'GENERATED', rawNotes, contentMarkdown, status = 'READY' } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Knowledge Base name is required' }, { status: 400 })
    }
    if (!SOURCE_TYPES.includes(String(sourceType).toUpperCase())) {
      return NextResponse.json({ error: `sourceType must be one of: ${SOURCE_TYPES.join(', ')}` }, { status: 400 })
    }

    const markdown = typeof contentMarkdown === 'string' && contentMarkdown.trim()
      ? contentMarkdown
      : typeof rawNotes === 'string' && rawNotes.trim()
        ? rawNotes
        : ''
    if (!markdown.trim()) {
      return NextResponse.json(
        { error: 'Knowledge Base requires contentMarkdown or rawNotes to store' },
        { status: 400 }
      )
    }

    const cfg: KbConfig = {
      entityKind: 'knowledge_base',
      sourceType: String(sourceType).toUpperCase(),
      rawNotes: typeof rawNotes === 'string' ? rawNotes : null,
      contentMarkdown: markdown,
      chunks: chunkMarkdown(markdown),
      status: KB_STATUSES.includes(String(status).toUpperCase()) ? String(status).toUpperCase() : 'READY',
    }

    const inserted = await db
      .insert(flows)
      .values({
        id: randomUUID(),
        name: name.trim(),
        description: body.description ?? null,
        status: cfg.status === 'DISABLED' ? 'paused' : 'active',
        trigger_type: 'manual',
        trigger_config: cfg,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ success: true, knowledgeBase: serializeKb(inserted[0]) })
  } catch (error) {
    console.error('Error creating knowledge base', error)
    return NextResponse.json({ error: 'Failed to create Knowledge Base' }, { status: 500 })
  }
}
