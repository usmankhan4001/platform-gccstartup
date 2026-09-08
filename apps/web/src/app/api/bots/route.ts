// Bots endpoint. Schema mapping: the platform DB has no bots table, so a bot is
// a `flows` row with trigger_config.entityKind = 'bot'. The bot payload lives in
// trigger_config ({ botKind, keywords, matchType, aiConfig, actions,
// knowledgeBaseId, cooldownSeconds, dailyCap }), flows.status maps isActive
// ('active' | 'paused'), and flows.trigger_type is always 'manual' (the enum has
// no keyword/menu trigger types).
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const BOT_KINDS = ['KEYWORD', 'MENU', 'AI']

function botFilter() {
  return sql`${flows.trigger_config}->>'entityKind' = 'bot'`
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
    const rows = await db.select().from(flows).where(botFilter()).orderBy(desc(flows.created_at))
    return NextResponse.json(rows.map(serializeBot))
  } catch (error) {
    console.error('Error fetching bots', error)
    return NextResponse.json({ error: 'Failed to retrieve bots' }, { status: 500 })
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
    const {
      name,
      description,
      kind = 'KEYWORD',
      triggerConfig,
      aiConfig,
      actionsJson,
      knowledgeBaseId,
      isActive = true,
      cooldownSeconds = 60,
      dailyCap = 100,
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Bot name is required' }, { status: 400 })
    }
    if (!BOT_KINDS.includes(String(kind).toUpperCase())) {
      return NextResponse.json({ error: `Bot kind must be one of: ${BOT_KINDS.join(', ')}` }, { status: 400 })
    }

    const tc = (triggerConfig ?? {}) as Record<string, unknown>
    const cfg: BotConfig = {
      entityKind: 'bot',
      botKind: String(kind).toUpperCase(),
      keywords: Array.isArray(tc.keywords) ? (tc.keywords as unknown[]).map(String) : [],
      matchType: typeof tc.matchType === 'string' ? tc.matchType : 'contains',
      aiConfig: (aiConfig ?? null) as Record<string, unknown> | null,
      actions: (actionsJson ?? null) as Record<string, unknown> | null,
      knowledgeBaseId: knowledgeBaseId ?? null,
      cooldownSeconds,
      dailyCap,
    }

    const inserted = await db
      .insert(flows)
      .values({
        id: randomUUID(),
        name: name.trim(),
        description: description ?? null,
        status: isActive ? 'active' : 'paused',
        trigger_type: 'manual',
        trigger_config: cfg,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ success: true, bot: serializeBot(inserted[0]) })
  } catch (error) {
    console.error('Error creating bot', error)
    return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 })
  }
}
