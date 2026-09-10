import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { handleAdmin, json } from '../_lib'

type Status = 'ok' | 'degraded' | 'down' | 'not_configured'

type ServiceCheck = {
  status: Status
  detail: string
  latencyMs?: number | null
}

function ok(detail: string, latencyMs?: number): ServiceCheck {
  return { status: 'ok', detail, latencyMs: latencyMs ?? null }
}

function degraded(detail: string): ServiceCheck {
  return { status: 'degraded', detail }
}

function down(detail: string): ServiceCheck {
  return { status: 'down', detail }
}

function notConfigured(detail: string): ServiceCheck {
  return { status: 'not_configured', detail }
}

function hasEnv(...names: string[]): boolean {
  return names.every((name) => Boolean(process.env[name]?.trim()))
}

function minutesSince(date: Date | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER
  return Math.round((Date.now() - date.getTime()) / 60_000)
}

async function checkDatabase(): Promise<ServiceCheck> {
  const started = Date.now()
  try {
    const rows = (await db.execute(sql`select version() as version`)) as Array<{ version?: string }>
    const version = rows[0]?.version?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL'
    return ok(version, Date.now() - started)
  } catch (error) {
    console.error('[api/admin/health] database check failed', error)
    return down(error instanceof Error ? error.message : 'Connection failed')
  }
}

/**
 * The outbox doubles as the worker heartbeat: the worker stamps `completed_at`
 * on every job it finishes, so the freshest completion tells us when it last ran.
 */
async function checkWorker(): Promise<ServiceCheck> {
  try {
    const rows = (await db.execute(sql`
      select
        count(*) filter (where status = 'pending')::int as pending,
        count(*) filter (where status = 'processing')::int as processing,
        count(*) filter (where status = 'failed')::int as failed,
        max(completed_at) as last_completed
      from outbox_jobs
    `)) as Array<{
      pending?: number
      processing?: number
      failed?: number
      last_completed?: string | null
    }>
    const row = rows[0] ?? {}

    const lastCompleted = row.last_completed ? new Date(row.last_completed) : null
    const sinceLast = minutesSince(lastCompleted)

    // No jobs at all is normal on a fresh install — report honestly rather than "down".
    if (!lastCompleted && (row.pending ?? 0) === 0 && (row.processing ?? 0) === 0) {
      return degraded('No jobs processed yet — the worker has nothing on record')
    }

    // The tick interval is 60s; anything over 15 minutes stale means the worker is not looping.
    if (sinceLast > 15) {
      return down(`Last completed job ${sinceLast}m ago (expected < 15m)`)
    }

    return ok(
      `Pending: ${row.pending ?? 0} · Processing: ${row.processing ?? 0} · Failed: ${row.failed ?? 0} · Last completion: ${
        lastCompleted ? `${sinceLast}m ago` : 'never'
      }`,
    )
  } catch (error) {
    console.error('[api/admin/health] worker check failed', error)
    return down('Could not read outbox_jobs')
  }
}

function checkEmail(): ServiceCheck {
  if (hasEnv('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION')) {
    return ok(hasEnv('EMAIL_FROM_ADDRESS') ? 'SES credentials and from-address configured' : 'SES credentials set — EMAIL_FROM_ADDRESS missing')
  }
  return notConfigured('Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION to enable email')
}

function checkWhatsapp(): ServiceCheck {
  if (hasEnv('META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_PHONE_NUMBER_ID')) {
    return ok('Meta Cloud API credentials present')
  }
  return notConfigured('Set META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID to enable WhatsApp')
}

function checkStorage(): ServiceCheck {
  if (hasEnv('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY')) {
    return ok(process.env.R2_BUCKET ? `Bucket "${process.env.R2_BUCKET}" configured` : 'Credentials set — R2_BUCKET missing')
  }
  return notConfigured('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to enable storage')
}

function checkAi(): ServiceCheck {
  const providers = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENROUTER_API_KEY']
  const configured = providers.filter((name) => Boolean(process.env[name]?.trim()))
  if (configured.length > 0) {
    return ok(`Provider key present (${configured.map((p) => p.replace('_API_KEY', '')).join(', ')})`)
  }
  return notConfigured('No AI provider key set — the copilot stays disabled')
}

/**
 * Real diagnostics for the admin health page. Only the database and the outbox
 * are actively pinged; provider checks report configuration state because a
 * health probe must never send a paid message or email.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const [database, worker] = await Promise.all([checkDatabase(), checkWorker()])

    const services: Record<string, ServiceCheck> = {
      database,
      worker,
      email: checkEmail(),
      whatsapp: checkWhatsapp(),
      storage: checkStorage(),
      ai: checkAi(),
      // No Redis client exists anywhere in this codebase — report that honestly
      // instead of pretending a cache is healthy.
      redis: notConfigured('No Redis client is configured in this deployment'),
    }

    const overall: Status = database.status === 'ok' ? 'ok' : 'down'

    return json({
      status: overall,
      services,
      checkedAt: new Date().toISOString(),
    })
  })
