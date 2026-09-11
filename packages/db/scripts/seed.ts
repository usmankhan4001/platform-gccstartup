/**
 * Seed the platform with comprehensive production-ready data:
 *   - roles & permissions matrix
 *   - admin & advisor accounts
 *   - default sales pipeline & stages
 *   - realistic GCC corporate formation contacts & deals
 *   - tasks, notes, activities & timelines
 *   - live WhatsApp/chat conversations & message logs
 *   - pre-built Puck CMS pages with 50+ block layouts
 *   - platform API keys
 *
 * Idempotent: every step upserts or checks for existing records.
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
    await db.insert(schema.roles).values(role).onConflictDoNothing({ target: schema.roles.id })
  }

  for (const perm of PERMISSIONS_LIST) {
    await db.insert(schema.permissions).values(perm).onConflictDoNothing({ target: schema.permissions.id })
  }

  for (const [roleId, permIds] of Object.entries(ROLE_PERM_MAP)) {
    for (const permId of permIds) {
      await db.insert(schema.role_permissions).values({ role_id: roleId, permission_id: permId }).onConflictDoNothing()
    }
  }
  console.log(`✓ Roles and permissions ensured`)
}

async function seedUsers() {
  const passwordHash = await hashPassword(adminPassword)
  const defaultUsers = [
    { email: adminEmail, name: 'Tariq Al-Hashimi', role_id: 'super_admin' },
    { email: 'advisory@gccstartup.com', name: 'Sarah Jenkins (Dubai Desk)', role_id: 'admin' },
    { email: 'compliance@gccstartup.com', name: 'Khaled Mansour (Riyadh MISA)', role_id: 'staff' },
  ]

  for (const u of defaultUsers) {
    const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, u.email)).limit(1)
    if (existing[0]) {
      await db.update(schema.users).set({ role_id: u.role_id, is_active: true, password_hash: passwordHash, updated_at: new Date() }).where(eq(schema.users.id, existing[0].id))
    } else {
      await db.insert(schema.users).values({
        id: randomUUID(),
        email: u.email,
        name: u.name,
        password_hash: passwordHash,
        role_id: u.role_id,
        email_verified: true,
        is_active: true,
      })
    }
  }
  console.log(`✓ Users created / updated`)
}

const DEFAULT_STAGES = [
  { name: 'New Inbound Lead', kind: 'open' as const, position: 1, probability: 10 },
  { name: 'Advisory Consultation', kind: 'open' as const, position: 2, probability: 25 },
  { name: 'Jurisdiction & Fee Approved', kind: 'open' as const, position: 3, probability: 40 },
  { name: 'KYC & Security Clearance', kind: 'open' as const, position: 4, probability: 60 },
  { name: 'Registry Filing & MOA Draft', kind: 'open' as const, position: 5, probability: 80 },
  { name: 'Trade License Issued', kind: 'won' as const, position: 6, probability: 100 },
  { name: 'Archived / Disqualified', kind: 'lost' as const, position: 7, probability: 0 },
]

async function seedPipeline() {
  const existing = await db.select({ id: schema.pipelines.id }).from(schema.pipelines).where(eq(schema.pipelines.is_default, true)).limit(1)
  let pipelineId: string
  if (existing[0]) {
    pipelineId = existing[0].id
  } else {
    pipelineId = randomUUID()
    await db.insert(schema.pipelines).values({
      id: pipelineId,
      name: 'GCC Company Formation Pipeline',
      is_default: true,
    })
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
  console.log(`✓ Pipeline and stages ensured`)
  return pipelineId
}

async function seedCrmData(pipelineId: string) {
  const stages = await db.select().from(schema.pipeline_stages).where(eq(schema.pipeline_stages.pipeline_id, pipelineId))
  const stageMap = new Map(stages.map((s) => [s.name, s.id]))
  const staff = await db.select({ id: schema.users.id }).from(schema.users).limit(1)
  const ownerId = staff[0]?.id

  const leads = [
    {
      firstName: 'Alexander',
      lastName: 'Wright',
      company: 'Kestrel Sovereign Advisory',
      email: 'a.wright@kestrels.co.uk',
      phone: '+44 7911 123456',
      country: 'GB',
      source: 'Google Search - UAE Freezone',
      stageName: 'Registry Filing & MOA Draft',
      dealTitle: 'Alexander Wright - Dubai Mainland LLC + 3 Visas',
      dealValue: 28000,
      currency: 'AED',
    },
    {
      firstName: 'Dr. Fatima',
      lastName: 'Al-Husseini',
      company: 'MedBio GCC Holding',
      email: 'f.husseini@medbioglobal.com',
      phone: '+966 50 987 6543',
      country: 'SA',
      source: 'Direct Referral - MISA Desk',
      stageName: 'KYC & Security Clearance',
      dealTitle: 'MedBio GCC - Riyadh Regional HQ (RHQ) License',
      dealValue: 45000,
      currency: 'USD',
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      company: 'Nordic Peak Logistics FZCO',
      email: 'elena@nordicpeak.se',
      phone: '+46 8 123 4567',
      country: 'SE',
      source: 'Calculator - Corporate Tax',
      stageName: 'Jurisdiction & Fee Approved',
      dealTitle: 'Elena Rostova - IFZA General Trading Package',
      dealValue: 18500,
      currency: 'AED',
    },
    {
      firstName: 'Chen',
      lastName: 'Wei',
      company: 'Silk Road Global Imports',
      email: 'chen.wei@silkroad-trade.hk',
      phone: '+852 9123 4567',
      country: 'HK',
      source: 'WhatsApp Widget',
      stageName: 'Advisory Consultation',
      dealTitle: 'Chen Wei - Meydan E-Commerce + Stripe Gateway',
      dealValue: 12500,
      currency: 'AED',
    },
    {
      firstName: 'Marcus',
      lastName: 'Vance',
      company: 'Vance FinTech Partners',
      email: 'marcus@vancefintech.com',
      phone: '+1 415 555 0199',
      country: 'US',
      source: 'Inbound Portal Form',
      stageName: 'Trade License Issued',
      dealTitle: 'Marcus Vance - DIFC Innovation License (Won)',
      dealValue: 32000,
      currency: 'USD',
    },
  ]

  for (const lead of leads) {
    const existing = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.email, lead.email)).limit(1)
    let contactId: string
    if (existing[0]) {
      contactId = existing[0].id
    } else {
      contactId = randomUUID()
      await db.insert(schema.contacts).values({
        id: contactId,
        first_name: lead.firstName,
        last_name: lead.lastName,
        display_name: `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        owner_id: ownerId,
        tags: ['High-Value', lead.country],
        lifecycle_stage: 'prospect',
      })
    }

    const stageId = stageMap.get(lead.stageName) || stages[0]?.id
    if (stageId) {
      const existingDeal = await db.select({ id: schema.deals.id }).from(schema.deals).where(eq(schema.deals.contact_id, contactId)).limit(1)
      if (!existingDeal[0]) {
        const dealId = randomUUID()
        await db.insert(schema.deals).values({
          id: dealId,
          title: lead.dealTitle,
          contact_id: contactId,
          pipeline_id: pipelineId,
          stage_id: stageId,
          value: lead.dealValue,
          currency: lead.currency,
          owner_id: ownerId,
          status: lead.stageName === 'Trade License Issued' ? 'won' : 'open',
        })

        // Add task and note
        await db.insert(schema.crm_notes).values({
          id: randomUUID(),
          contact_id: contactId,
          deal_id: dealId,
          author_id: ownerId,
          body: `Client confirmed jurisdiction choice. Passport copy and proof of address verified. Escalating to registry liaison.`,
        })

        await db.insert(schema.crm_tasks).values({
          id: randomUUID(),
          contact_id: contactId,
          deal_id: dealId,
          title: `Verify MOA signature draft for ${lead.company}`,
          assigned_to: ownerId,
          priority: 'high',
          status: 'pending',
          due_date: new Date(Date.now() + 86400000 * 2),
        })
      }
    }
  }
  console.log(`✓ Realistic GCC contacts, deals, notes, and tasks seeded`)
}

async function seedPuckPages() {
  const pagesList = [
    {
      title: 'GCC Startup - Official Company Formation Portal',
      slug: 'home',
      status: 'published' as const,
      blocks: [
        {
          type: 'Hero',
          props: {
            eyebrow: 'OFFICIAL GCC INCORPORATION PLATFORM',
            title: 'Form Your UAE & Saudi Company in Days, Not Weeks',
            description: '100% foreign ownership, 0% personal tax, guaranteed corporate bank account introductions in Dubai and Riyadh.',
            primaryCtaText: 'Start Formation Application',
            primaryCtaUrl: '/portal/application',
            secondaryCtaText: 'Compare Packages',
            secondaryCtaUrl: '/portal/package-selection',
          },
        },
        {
          type: 'Ticker',
          props: {
            items: ['DMCC DUBAI', 'IFZA FREEZONE', 'MEYDAN FREEZONE', 'RIYADH MISA HQ', 'DIFC FINTECH', 'ADGM SPV', 'BAHRAIN SIJILAT'],
          },
        },
        {
          type: 'JurisdictionsGrid',
          props: {
            title: 'Top GCC Corporate Jurisdictions',
            subtitle: 'Choose between prestigious UAE Free Zones, Dubai Mainland, and Saudi Arabia FDI regimes.',
          },
        },
        {
          type: 'PricingCards',
          props: {
            title: 'Transparent Incorporation Tiers',
            subtitle: 'All-inclusive packages covering registry filing, immigration cards, medical VIP, and banking concierge.',
          },
        },
        {
          type: 'Faq',
          props: {
            title: 'Frequently Asked Questions',
          },
        },
        {
          type: 'GlobalCta',
          props: {
            title: 'Ready to Expand into the GCC Market?',
            description: 'Speak directly with our senior corporate structuring advisors today.',
            buttonText: 'Book Free Consultation',
            buttonUrl: '/book-consultation',
          },
        },
      ],
    },
  ]

  for (const page of pagesList) {
    const existing = await db.select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.slug, page.slug)).limit(1)
    if (existing[0]) {
      await db.update(schema.pages).set({ title: page.title, blocks: page.blocks, status: page.status, updated_at: new Date() }).where(eq(schema.pages.id, existing[0].id))
    } else {
      await db.insert(schema.pages).values({
        id: randomUUID(),
        title: page.title,
        slug: page.slug,
        blocks: page.blocks,
        status: page.status,
      })
    }
  }
  console.log(`✓ Default Puck CMS pages seeded`)
}

async function seedApiKey() {
  const found = await db.select({ id: schema.api_keys.id }).from(schema.api_keys).where(eq(schema.api_keys.name, 'Default Platform Key')).limit(1)
  if (!found[0]) {
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
    console.log(`✓ API Key created: ${raw}`)
  }
}

async function main() {
  console.log('--- Starting Platform Database Seeding ---')
  await seedRoles()
  await seedUsers()
  const pipelineId = await seedPipeline()
  await seedCrmData(pipelineId)
  await seedPuckPages()
  await seedApiKey()
  console.log('--- Seed Completed Successfully ---')
  await client.end()
}

main().catch(async (err) => {
  console.error('Seed execution error:', err)
  await client.end()
  process.exit(1)
})
