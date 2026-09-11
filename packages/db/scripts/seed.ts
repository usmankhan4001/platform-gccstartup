/**
 * Seed the platform with the minimum data it needs to function:
 *   - roles (viewer/staff/admin/super_admin) + permissions
 *   - the initial super_admin user (from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
 *   - a default pipeline with the standard stage set
 *   - one API key (printed once — the raw key is not stored, only its hash)
 *
 * Idempotent: every step upserts by its natural key, so it is safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npx tsx scripts/seed.ts
 */
import { randomUUID, createHash, randomBytes } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../src/schema'
import { hashPassword } from '../../shared/src/auth/password'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@gccstartup.com').toLowerCase()
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026'

const client = postgres(connectionString)
const db = drizzle(client, { schema })

const ROLES = [
  { id: 'role_viewer', name: 'viewer', description: 'Read-only access' },
  { id: 'role_staff', name: 'staff', description: 'CRM + content editing' },
  { id: 'role_admin', name: 'admin', description: 'Full admin access' },
  { id: 'role_super_admin', name: 'super_admin', description: 'Unrestricted access' },
]

const PERMISSIONS_LIST = [
  { id: 'perm_users_all', name: 'users:*', description: 'Full user administration' },
  { id: 'perm_contacts_all', name: 'contacts:*', description: 'Full contact management' },
  { id: 'perm_contacts_read', name: 'contacts:read', description: 'Read-only contact access' },
  { id: 'perm_deals_all', name: 'deals:*', description: 'Full deal management' },
  { id: 'perm_deals_read', name: 'deals:read', description: 'Read-only deal access' },
  { id: 'perm_content_all', name: 'content:*', description: 'Full content & CMS management' },
  { id: 'perm_content_read', name: 'content:read', description: 'Read-only CMS access' },
  { id: 'perm_campaigns_all', name: 'campaigns:*', description: 'Full campaign management' },
  { id: 'perm_settings_all', name: 'settings:*', description: 'Full settings access' },
  { id: 'perm_reports_read', name: 'reports:read', description: 'Read analytics and reports' },
]

const ROLE_PERM_MAP: Record<string, string[]> = {
  role_super_admin: ['perm_users_all', 'perm_contacts_all', 'perm_deals_all', 'perm_content_all', 'perm_campaigns_all', 'perm_settings_all', 'perm_reports_read'],
  role_admin: ['perm_users_all', 'perm_contacts_all', 'perm_deals_all', 'perm_content_all', 'perm_campaigns_all', 'perm_settings_all', 'perm_reports_read'],
  role_staff: ['perm_contacts_all', 'perm_deals_all', 'perm_content_all', 'perm_campaigns_all', 'perm_reports_read'],
  role_viewer: ['perm_contacts_read', 'perm_deals_read', 'perm_content_read', 'perm_reports_read'],
}

async function seedRoles() {
  for (const role of ROLES) {
    await db
      .insert(schema.roles)
      .values(role)
      .onConflictDoNothing({ target: schema.roles.id })
  }

  for (const perm of PERMISSIONS_LIST) {
    await db
      .insert(schema.permissions)
      .values(perm)
      .onConflictDoNothing({ target: schema.permissions.id })
  }

  for (const [roleId, permIds] of Object.entries(ROLE_PERM_MAP)) {
    for (const permId of permIds) {
      await db
        .insert(schema.role_permissions)
        .values({ role_id: roleId, permission_id: permId })
        .onConflictDoNothing()
    }
  }

  console.log(`roles and permissions ensured`)
}

async function seedAdminUser() {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1)

  const passwordHash = await hashPassword(adminPassword)

  if (existing[0]) {
    await db
      .update(schema.users)
      .set({ role_id: 'super_admin', is_active: true, password_hash: passwordHash, updated_at: new Date() })
      .where(eq(schema.users.id, existing[0].id))
    console.log(`admin user: ${adminEmail} updated to super_admin`)
    return
  }

  await db.insert(schema.users).values({
    id: randomUUID(),
    email: adminEmail,
    name: 'Platform Admin',
    password_hash: passwordHash,
    role_id: 'super_admin',
    email_verified: true,
    is_active: true,
  })
  console.log(`admin user: ${adminEmail} created (super_admin)`)
}

const DEFAULT_STAGES = [
  { name: 'New', kind: 'open' as const, position: 1, probability: 10 },
  { name: 'Contacted', kind: 'open' as const, position: 2, probability: 25 },
  { name: 'Qualified', kind: 'open' as const, position: 3, probability: 40 },
  { name: 'Proposal Sent', kind: 'open' as const, position: 4, probability: 60 },
  { name: 'Negotiation', kind: 'open' as const, position: 5, probability: 75 },
  { name: 'Won', kind: 'won' as const, position: 6, probability: 100 },
  { name: 'Lost', kind: 'lost' as const, position: 7, probability: 0 },
]

async function seedPipeline() {
  const existing = await db
    .select({ id: schema.pipelines.id })
    .from(schema.pipelines)
    .where(eq(schema.pipelines.is_default, true))
    .limit(1)

  let pipelineId: string
  if (existing[0]) {
    pipelineId = existing[0].id
  } else {
    pipelineId = randomUUID()
    await db.insert(schema.pipelines).values({
      id: pipelineId,
      name: 'Default Sales Pipeline',
      is_default: true,
    })
    console.log('pipeline: default created')
  }

  for (const stage of DEFAULT_STAGES) {
    const found = await db
      .select({ id: schema.pipeline_stages.id })
      .from(schema.pipeline_stages)
      .where(sql`${schema.pipeline_stages.pipeline_id} = ${pipelineId} and ${schema.pipeline_stages.name} = ${stage.name}`)
      .limit(1)
    if (!found[0]) {
      await db.insert(schema.pipeline_stages).values({
        id: randomUUID(),
        pipeline_id: pipelineId,
        ...stage,
      })
    }
  }
  console.log(`pipeline stages: ${DEFAULT_STAGES.length} ensured`)
}

async function seedApiKey() {
  const found = await db
    .select({ id: schema.api_keys.id })
    .from(schema.api_keys)
    .where(eq(schema.api_keys.name, 'Default Platform Key'))
    .limit(1)

  // The raw key is only ever shown once, so an operator who lost it needs a way
  // to mint a new one without shell access to the database.
  if (found[0] && process.env.SEED_API_KEY_ROTATE !== 'true') {
    console.log('api key: Default Platform Key already exists (raw key not re-printed)')
    return
  }

  if (found[0]) {
    await db.delete(schema.api_keys).where(eq(schema.api_keys.id, found[0].id))
    console.log('api key: rotating Default Platform Key')
  }

  const raw = `gcc_${randomBytes(24).toString('hex')}`
  await db.insert(schema.api_keys).values({
    id: randomUUID(),
    name: 'Default Platform Key',
    key_hash: createHash('sha256').update(raw).digest('hex'),
    key_prefix: raw.slice(0, 10),
    permissions: ['*'],
    rate_limit: 1000,
    is_active: true,
  })
  console.log('api key: created — SAVE THIS, it is shown only once:')
  console.log(`  ${raw}`)
}

async function main() {
  await seedRoles()
  await seedAdminUser()
  await seedPipeline()
  await seedApiKey()
  console.log('seed complete')
  await client.end()
}

main().catch(async (err) => {
  console.error('seed failed:', err)
  await client.end()
  process.exit(1)
})
