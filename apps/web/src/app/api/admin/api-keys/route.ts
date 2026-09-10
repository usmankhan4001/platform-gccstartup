import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { api_keys } from '@gccstartup/db'
import { handleAdmin, json, errorJson, newId, KNOWN_PERMISSIONS } from '../_lib'

export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    // key_hash is intentionally never selected — it is useless to the UI and
    // must not leak even to admins.
    const rows = await db
      .select({
        id: api_keys.id,
        name: api_keys.name,
        keyPrefix: api_keys.key_prefix,
        permissions: api_keys.permissions,
        rateLimit: api_keys.rate_limit,
        lastUsedAt: api_keys.last_used_at,
        expiresAt: api_keys.expires_at,
        isActive: api_keys.is_active,
        createdAt: api_keys.created_at,
      })
      .from(api_keys)
      .orderBy(desc(api_keys.created_at))
      .limit(500)

    return json(rows)
  })

/**
 * Create a scoped API key. The full `gcc_...` token is returned exactly once,
 * on this response; only its SHA-256 hash and a short display prefix are stored.
 */
export const POST = (request: NextRequest) =>
  handleAdmin(request, async (admin) => {
    const body = await request.json().catch(() => null)
    const { name, permissions, rateLimit, expiresAt } = body ?? {}

    if (!name?.trim()) return errorJson('A key name is required', 400)
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return errorJson('Select at least one permission scope', 400)
    }

    const requested = permissions.map(String)
    const unknown = requested.filter((p) => !(KNOWN_PERMISSIONS as readonly string[]).includes(p))
    if (unknown.length > 0) return errorJson(`Unknown permissions: ${unknown.join(', ')}`, 400)

    const parsedLimit = Number(rateLimit)
    const limit = Number.isFinite(parsedLimit) && parsedLimit >= 1 ? Math.min(10_000, Math.round(parsedLimit)) : 1000

    let expiry: Date | null = null
    if (expiresAt) {
      const parsed = new Date(String(expiresAt))
      if (Number.isNaN(parsed.getTime())) return errorJson('expiresAt must be a valid date', 400)
      if (parsed.getTime() < Date.now()) return errorJson('expiresAt must be in the future', 400)
      expiry = parsed
    }

    const token = `gcc_${randomBytes(24).toString('base64url')}`
    const keyHash = createHash('sha256').update(token).digest('hex')
    const keyPrefix = token.slice(0, 10)

    const created = await db
      .insert(api_keys)
      .values({
        id: newId(),
        name: String(name).trim().slice(0, 200),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: requested,
        rate_limit: limit,
        expires_at: expiry,
        is_active: true,
        created_by: admin.id,
      })
      .returning({
        id: api_keys.id,
        name: api_keys.name,
        key_prefix: api_keys.key_prefix,
        permissions: api_keys.permissions,
        rate_limit: api_keys.rate_limit,
        expires_at: api_keys.expires_at,
        created_at: api_keys.created_at,
      })

    const row = created[0]
    return json(
      {
        id: row.id,
        name: row.name,
        keyPrefix: row.key_prefix,
        permissions: row.permissions ?? [],
        rateLimit: row.rate_limit,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        // Shown once, on create only. Store it now — it cannot be recovered.
        token,
      },
      201,
    )
  })
