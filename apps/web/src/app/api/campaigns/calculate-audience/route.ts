// Live audience count for the campaign wizard. Delegates to the same resolver
// the dispatcher uses at send time (phone + not deleted + tag filters), so the
// pre-flight number can never drift from what a launch actually delivers.
import { NextRequest, NextResponse } from 'next/server'
import { authGuard, AuthError } from '@/lib/auth'
import { resolveAudience } from '@/lib/whatsapp/dispatcher'

type AudienceFilter = {
  sendToAll?: boolean
  includeGroups?: string[]
  includeTags?: string[]
  excludeGroups?: string[]
  excludeTags?: string[]
}

function parseAudienceFilter(value: unknown): AudienceFilter {
  let candidate = value
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate || '{}')
    } catch {
      candidate = {}
    }
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {}
  const raw = candidate as Record<string, unknown>
  const toStringArray = (input: unknown): string[] =>
    Array.isArray(input) ? input.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : []
  return {
    sendToAll: raw.sendToAll === true,
    includeGroups: toStringArray(raw.includeGroups),
    includeTags: toStringArray(raw.includeTags),
    excludeGroups: toStringArray(raw.excludeGroups),
    excludeTags: toStringArray(raw.excludeTags),
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const wizardFilter = parseAudienceFilter(body.audienceFilter)

    // Groups and tags are the same mechanism (contacts.tags jsonb) — union each
    // side exactly like the campaigns POST does, so count == dispatch.
    const includeTags = [...new Set([...(wizardFilter.includeGroups || []), ...(wizardFilter.includeTags || [])])]
    const excludeTags = [...new Set([...(wizardFilter.excludeGroups || []), ...(wizardFilter.excludeTags || [])])]
    const filter =
      wizardFilter.sendToAll || includeTags.length === 0
        ? excludeTags.length
          ? { excludeTags }
          : {}
        : { includeTags, excludeTags }

    const audience = await resolveAudience(null, filter)

    const sampleContacts = audience.slice(0, 5).map((c) => ({
      id: c.id,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Customer',
      phone: c.phone,
      email: c.email,
    }))

    return NextResponse.json({ count: audience.length, sampleContacts })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns/calculate-audience] failed', error)
    return NextResponse.json({ error: 'Failed to calculate audience' }, { status: 500 })
  }
}
