import { NextRequest } from 'next/server'
import { eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, deals, conversations, outbox_jobs } from '@gccstartup/db'
import { handleAdmin, json, safeCount } from '../_lib'

function hasEnv(...names: string[]): boolean {
  return names.every((name) => Boolean(process.env[name]?.trim()))
}

/**
 * Integration readiness, derived from the same environment variables the
 * provider adapters read at send time — so "Active" here means "this would
 * actually work", never a hardcoded badge.
 */
export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const ses = hasEnv('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION')
    const sesFrom = hasEnv('EMAIL_FROM_ADDRESS')
    const whatsapp = hasEnv('META_WHATSAPP_ACCESS_TOKEN', 'META_WHATSAPP_PHONE_NUMBER_ID')
    const r2 = hasEnv('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY')
    const r2Bucket = hasEnv('R2_BUCKET')
    const aiProviders = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENROUTER_API_KEY']
    const ai = aiProviders.some((name) => Boolean(process.env[name]?.trim()))

    // Live usage counters give the badges context without fabricating activity.
    const [contactCount, dealCount, conversationCount, pendingJobs] = await Promise.all([
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(isNull(contacts.deleted_at))),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(deals)),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(conversations)),
      safeCount(db.select({ count: sql<number>`count(*)::int` }).from(outbox_jobs).where(eq(outbox_jobs.status, 'pending'))),
    ])

    return json({
      integrations: [
        {
          id: 'ses',
          name: 'Amazon SES',
          description: 'Transactional + campaign email',
          configured: ses,
          detail: ses ? (sesFrom ? 'Provider ready' : 'Credentials set — EMAIL_FROM_ADDRESS missing') : 'Set AWS credentials + region',
        },
        {
          id: 'whatsapp',
          name: 'Meta WhatsApp',
          description: 'WhatsApp Cloud API messaging',
          configured: whatsapp,
          detail: whatsapp ? 'Cloud API credentials present' : 'Set META_WHATSAPP_ACCESS_TOKEN + phone number ID',
        },
        {
          id: 'r2',
          name: 'Cloudflare R2',
          description: 'Media + document storage',
          configured: r2,
          detail: r2 ? (r2Bucket ? 'Bucket configured' : 'Credentials set — R2_BUCKET missing') : 'Set R2_ACCOUNT_ID + access keys',
        },
        {
          id: 'ai',
          name: 'AI Copilot',
          description: 'OpenAI / Anthropic / Gemini / OpenRouter',
          configured: ai,
          detail: ai ? 'A provider key is present' : 'Set a provider API key to enable the copilot',
        },
      ],
      usage: {
        contacts: contactCount,
        deals: dealCount,
        conversations: conversationCount,
        pendingJobs,
      },
      checkedAt: new Date().toISOString(),
    })
  })
