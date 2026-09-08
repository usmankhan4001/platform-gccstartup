// Bot simulator. No AI provider is wired; instead the reply is derived
// deterministically from the bot's REAL stored configuration:
//   1. KEYWORD bots only trigger when the test message matches their stored
//      keywords/matchType (real matching, not a canned "true").
//   2. If the bot references a knowledge base, the best-scoring chunk (token
//      overlap between the test message and each stored chunk) becomes the reply.
//   3. Otherwise the first message/quick_reply node text on the flow graph is
//      used, falling back to aiConfig.fallbackReply.
import { NextRequest, NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type BotConfig = {
  botKind?: string
  keywords?: string[]
  matchType?: string
  aiConfig?: { fallbackReply?: string; greeting?: string } | null
  knowledgeBaseId?: string | null
}

type KbConfig = {
  entityKind?: string
  chunks?: string[]
  contentMarkdown?: string
}

function matchesTrigger(message: string, cfg: BotConfig): boolean {
  const keywords = Array.isArray(cfg.keywords) ? cfg.keywords : []
  if (keywords.length === 0) return true // keyword-less bots always trigger
  const clean = message.trim().toLowerCase()
  const matchType = cfg.matchType ?? 'contains'
  return keywords.some((kw) => {
    const k = kw.trim().toLowerCase()
    if (!k) return false
    if (matchType === 'exact') return clean === k
    if (matchType === 'starts_with') return clean.startsWith(k)
    return clean.includes(k)
  })
}

// Best chunk by token overlap with the test message; null when nothing scores.
function bestChunk(chunks: string[], message: string): string | null {
  const stop = new Set(['the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'in', 'for', 'on', 'i', 'you', 'my'])
  const tokens = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !stop.has(t))
  if (tokens.length === 0) return null

  let best: { text: string; score: number } | null = null
  for (const chunk of chunks) {
    const lower = chunk.toLowerCase()
    const score = tokens.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { text: chunk, score }
  }
  return best?.text ?? null
}

function firstMessageNodeText(nodes: unknown[]): string | null {
  for (const raw of nodes) {
    const node = raw as { type?: string; data?: { text?: string } }
    if ((node.type === 'message' || node.type === 'quick_reply') && node.data?.text) {
      return node.data.text
    }
  }
  return null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json()
    const testMessage = String(body.message ?? '').trim()
    if (!testMessage) {
      return NextResponse.json({ error: 'A test message is required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(flows)
      .where(and(eq(flows.id, id), sql`${flows.trigger_config}->>'entityKind' = 'bot'`))
      .limit(1)
    const bot = rows[0]
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    const cfg = bot.trigger_config as unknown as BotConfig

    const triggerMatched = matchesTrigger(testMessage, cfg)
    if (!triggerMatched) {
      return NextResponse.json({
        triggerMatched: false,
        reply: null,
        note: 'Test message did not match the bot keyword configuration',
      })
    }

    // 1. Knowledge-base lookup — best matching stored chunk
    let reply: string | null = null
    let source = 'none'
    if (cfg.knowledgeBaseId) {
      const kbRows = await db
        .select()
        .from(flows)
        .where(eq(flows.id, cfg.knowledgeBaseId))
        .limit(1)
      const kb = kbRows[0]
      const kbCfg = (kb?.trigger_config ?? {}) as KbConfig
      const chunks = Array.isArray(kbCfg.chunks)
        ? kbCfg.chunks
        : typeof kbCfg.contentMarkdown === 'string'
          ? kbCfg.contentMarkdown.split(/\n\s*\n/).filter((p) => p.trim())
          : []
      const match = bestChunk(chunks, testMessage)
      if (match) {
        reply = match.trim()
        source = 'knowledge_base'
      }
    }

    // 2. Flow graph message node
    if (!reply) {
      reply = firstMessageNodeText(Array.isArray(bot.nodes) ? bot.nodes : [])
      if (reply) source = 'flow_node'
    }

    // 3. Configured fallback
    if (!reply) {
      reply = cfg.aiConfig?.fallbackReply ?? cfg.aiConfig?.greeting ?? null
      if (reply) source = 'fallback_config'
    }

    return NextResponse.json({
      triggerMatched: true,
      reply,
      source,
      note:
        reply === null
          ? 'Bot triggered but has no configured reply source (no knowledge base match, message node, or fallback)'
          : 'Deterministic simulation from the stored bot configuration — connect an AI provider for generative replies',
    })
  } catch (error) {
    console.error('[BotTest] Unexpected error', error)
    return NextResponse.json({ error: 'Bot test failed' }, { status: 500 })
  }
}
