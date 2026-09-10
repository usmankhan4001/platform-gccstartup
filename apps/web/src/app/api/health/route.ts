import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Public liveness probe. Only the database is actively pinged — provider
 * integrations report configuration state because a health check must never
 * send a paid message. Any failure degrades the status instead of throwing.
 */
export async function GET() {
  let database: 'ok' | 'down' = 'down'
  let latencyMs: number | null = null

  const started = Date.now()
  try {
    await db.execute('select 1')
    database = 'ok'
    latencyMs = Date.now() - started
  } catch (error) {
    console.error('[api/health] database check failed', error)
  }

  const emailConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      process.env.AWS_REGION?.trim(),
  )
  const whatsappConfigured = Boolean(
    process.env.META_WHATSAPP_ACCESS_TOKEN?.trim() && process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim(),
  )
  const storageConfigured = Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  )

  return NextResponse.json({
    status: database === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      database: database === 'ok' ? 'ok' : 'down',
      databaseLatencyMs: latencyMs,
      email: emailConfigured ? 'configured' : 'not_configured',
      whatsapp: whatsappConfigured ? 'configured' : 'not_configured',
      storage: storageConfigured ? 'configured' : 'not_configured',
    },
  })
}
