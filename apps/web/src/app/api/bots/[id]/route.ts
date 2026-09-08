// Single-bot CRUD. See ./route.ts for the bot → `flows` row schema mapping.
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const BOT_KINDS = ['KEYWORD', 'MENU', 'AI']

function botFilter(id: string) {
  return and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'bot'`)
}

type BotConfig = {
  entityKind: 'bot'
  botKind: string
  keywords?: string[]
  matchType?: string
  aiConfig?: Record<string, unknown> | null
  actions?: Record<string, unknown> | null
  knowledgeBaseId?: string | null
  cooldownSeconds?: number
  dailyCap?: number
}

function serializeBot(row: typeof flows.$inferSelect) {
  const cfg = row.trigger_config as unknown as BotConfig
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    kind: cfg.botKind,
    triggerConfig: {
      keywords: cfg.keywords ?? [],
      matchType: cfg.matchType ?? 'contains',
    },
    aiConfig: cfg.aiConfig ?? null,
    actionsJson: cfg.actions ?? null,
    knowledgeBaseId: cfg.knowledgeBaseId ?? null,
    isActive: row.status === 'active',
    cooldownSeconds: cfg.cooldownSeconds ?? 60,
    dailyCap: cfg.dailyCap ?? 100,
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
    const rows = await db.select().from(flows).where(botFilter(id)).limit(1)
    if (!rows[0]) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    return NextResponse.json(serializeBot(rows[0]))
  } catch (error) {
    console.error('Error fetching bot', error)
    return NextResponse.json({ error: 'Failed to retrieve bot' }, { status: 500 })
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

    const existingRows = await db.select().from(flows).where(botFilter(id)).limit(1)
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const cfg = existing.trigger_config as unknown as BotConfig
    const tc = (body.triggerConfig ?? {}) as Record<string, unknown>

    if (body.kind && !BOT_KINDS.includes(String(body.kind).toUpperCase())) {
      return NextResponse.json({ error: `Bot kind must be one of: ${BOT_KINDS.join(', ')}` }, { status: 400 })
    }

    const nextCfg: BotConfig = {
      ...cfg,
      botKind: body.kind ? String(body.kind).toUpperCase() : cfg.botKind,
      keywords: Array.isArray(tc.keywords) ? (tc.keywords as unknown[]).map(String) : cfg.keywords ?? [],
      matchType: typeof tc.matchType === 'string' ? tc.matchType : cfg.matchType ?? 'contains',
      aiConfig: body.aiConfig !== undefined ? body.aiConfig : cfg.aiConfig ?? null,
      actions: body.actionsJson !== undefined ? body.actionsJson : cfg.actions ?? null,
      knowledgeBaseId: body.knowledgeBaseId !== undefined ? body.knowledgeBaseId : cfg.knowledgeBaseId ?? null,
      cooldownSeconds: body.cooldownSeconds !== undefined ? Number(body.cooldownSeconds) : cfg.cooldownSeconds ?? 60,
      dailyCap: body.dailyCap !== undefined ? Number(body.dailyCap) : cfg.dailyCap ?? 100,
    }

    const updated = await db
      .update(flows)
      .set({
        name: body.name?.trim() || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        status: body.isActive !== undefined ? (body.isActive ? 'active' : 'paused') : existing.status,
        trigger_config: nextCfg,
        updated_at: new Date(),
      })
      .where(botFilter(id))
      .returning()

    return NextResponse.json({ success: true, bot: serializeBot(updated[0]) })
  } catch (error) {
    console.error('Error updating bot', error)
    return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 })
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
    // flows rows cascade-delete their flow_steps / enrollments / logs
    const deleted = await db.delete(flows).where(botFilter(id)).returning({ id: flows.id })
    if (!deleted[0]) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Bot deleted successfully' })
  } catch (error) {
    console.error('Error deleting bot', error)
    return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 })
  }
}
