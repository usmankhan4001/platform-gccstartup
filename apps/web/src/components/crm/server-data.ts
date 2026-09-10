/**
 * Server-only reads for the CRM pipeline and the renewal ledger.
 *
 * Every export is failure-tolerant: an unreachable database or an empty table
 * returns empty collections plus a human-readable `error`, so the pages render
 * a helpful empty state instead of throwing during render.
 */
import { asc, desc, eq, isNull } from 'drizzle-orm'
import { contacts, crm_tasks, deals, users } from '@gccstartup/db'
import { calculateLeadScore, resolveDeskTag, resolveEstimatedDealValue } from '@/lib/crm/scoring'
import { normalizeStage, stageMeta } from './stages'
import {
  COMPLIANCE_KINDS,
  type ComplianceKind,
  type DealCard,
  type OwnerOption,
  type PipelineKpis,
  type RenewalForecast,
  type RenewalRow,
  type RenewalStats,
} from './pipeline-types'
import { resolveUrgency } from './types'

/** The dirham is pegged at 3.6725 per USD - used only to normalise KPI totals. */
const USD_TO_AED = 3.6725
const DEFAULT_CURRENCY = 'AED'
const DAY_MS = 24 * 60 * 60 * 1000

const MAX_CONTACTS = 500
const MAX_DEALS = 1000
const MAX_TASKS = 2000

export type PipelineBoardData = {
  cards: DealCard[]
  owners: OwnerOption[]
  kpis: PipelineKpis
  error: string | null
}

export type RenewalLedgerData = {
  rows: RenewalRow[]
  stats: RenewalStats
  forecast: RenewalForecast[]
  error: string | null
}

const EMPTY_KPIS: PipelineKpis = {
  activePipelineValue: 0,
  weightedForecast: 0,
  averageDealCycleDays: 0,
  winRate: 0,
  openDeals: 0,
  wonDeals: 0,
  lostDeals: 0,
  currency: DEFAULT_CURRENCY,
}

const EMPTY_STATS: RenewalStats = {
  total: 0,
  critical: 0,
  warning: 0,
  upcoming: 0,
  healthy: 0,
  expired: 0,
  noDates: 0,
  totalARR: 0,
  dueAlerts: { d60: 0, d30: 0, d7: 0 },
  currency: DEFAULT_CURRENCY,
}

function toAed(value: number, currency?: string | null): number {
  if (!Number.isFinite(value)) return 0
  if (!currency || currency.toUpperCase() === 'AED') return value
  if (currency.toUpperCase() === 'USD') return value * USD_TO_AED
  return value
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function daysUntil(value: string | null): number | null {
  if (!value) return null
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return null
  return Math.ceil((target - Date.now()) / DAY_MS)
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

function num(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function contactName(row: {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  phone: string | null
}): string {
  const joined = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
  return joined || row.display_name || row.email || row.phone || 'Unnamed contact'
}

/* -------------------------------------------------------------------------- */
/* Pipeline board                                                             */
/* -------------------------------------------------------------------------- */

export async function loadPipelineBoardData(): Promise<PipelineBoardData> {
  try {
    const { db } = await import('@/lib/db')

    const [contactRows, dealRows, taskRows, ownerRows] = await Promise.all([
      db
        .select({
          id: contacts.id,
          first_name: contacts.first_name,
          last_name: contacts.last_name,
          display_name: contacts.display_name,
          email: contacts.email,
          phone: contacts.phone,
          company: contacts.company,
          job_title: contacts.job_title,
          lifecycle_stage: contacts.lifecycle_stage,
          source: contacts.source,
          tags: contacts.tags,
          custom_fields: contacts.custom_fields,
          owner_id: contacts.owner_id,
          owner_name: users.name,
          created_at: contacts.created_at,
          updated_at: contacts.updated_at,
        })
        .from(contacts)
        .leftJoin(users, eq(users.id, contacts.owner_id))
        .where(isNull(contacts.deleted_at))
        .orderBy(desc(contacts.created_at))
        .limit(MAX_CONTACTS),
      db
        .select({
          id: deals.id,
          contact_id: deals.contact_id,
          title: deals.title,
          value: deals.value,
          currency: deals.currency,
          expected_close_date: deals.expected_close_date,
          closed_at: deals.closed_at,
          created_at: deals.created_at,
        })
        .from(deals)
        .orderBy(desc(deals.created_at))
        .limit(MAX_DEALS),
      db
        .select({
          id: crm_tasks.id,
          contact_id: crm_tasks.contact_id,
          title: crm_tasks.title,
          due_at: crm_tasks.due_at,
        })
        .from(crm_tasks)
        .where(isNull(crm_tasks.completed_at))
        .orderBy(asc(crm_tasks.due_at))
        .limit(MAX_TASKS),
      db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.is_active, true))
        .orderBy(asc(users.name))
        .limit(200),
    ])

    // `deals` is newest-first, so the first hit per contact is their live deal.
    const dealByContact = new Map<string, (typeof dealRows)[number]>()
    for (const deal of dealRows) {
      if (!deal.contact_id) continue
      if (!dealByContact.has(deal.contact_id)) dealByContact.set(deal.contact_id, deal)
    }

    // Open tasks are due-date ascending, so the first hit is the next task.
    const tasksByContact = new Map<string, { next: (typeof taskRows)[number]; count: number }>()
    for (const task of taskRows) {
      if (!task.contact_id) continue
      const existing = tasksByContact.get(task.contact_id)
      if (existing) existing.count += 1
      else tasksByContact.set(task.contact_id, { next: task, count: 1 })
    }

    const cards: DealCard[] = contactRows.map((row) => {
      const cf = asRecord(row.custom_fields)
      const deal = dealByContact.get(row.id)
      const tasks = tasksByContact.get(row.id)

      const explicitValue = num(cf.deal_value) ?? num(cf.estimated_value)
      const estimated = resolveEstimatedDealValue({
        jurisdiction: cf.jurisdiction ?? null,
        deal_value: explicitValue ?? undefined,
        custom_fields: cf,
      })
      const value = deal?.value ?? explicitValue ?? estimated.value
      const currency = cf.currency || deal?.currency || DEFAULT_CURRENCY

      const score = calculateLeadScore({
        email: row.email,
        phone: row.phone,
        jurisdiction: cf.jurisdiction ?? null,
        deal_value: value,
        status: cf.status ?? row.lifecycle_stage,
        custom_fields: cf,
      })

      const company = row.company || cf.company_name_choice_1 || null

      return {
        id: row.id,
        title: company || contactName(row),
        company,
        contactName: contactName(row),
        email: row.email,
        phone: row.phone,
        stage: normalizeStage(cf.status ?? row.lifecycle_stage),
        value,
        currency,
        jurisdiction: cf.jurisdiction ?? null,
        desk: cf.desk ?? resolveDeskTag({ jurisdiction: cf.jurisdiction ?? null, custom_fields: cf }),
        score: score.score,
        scoreTier: score.tier,
        ownerId: row.owner_id,
        ownerName: row.owner_name ?? null,
        kycStatus: cf.kyc_status ?? null,
        tradeLicenseNumber: cf.trade_license_number ?? null,
        nextTask: tasks ? { id: tasks.next.id, title: tasks.next.title, dueAt: iso(tasks.next.due_at) } : null,
        openTaskCount: tasks?.count ?? 0,
        expectedCloseDate: iso(deal?.expected_close_date),
        createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
        updatedAt: iso(row.updated_at),
        lifecycleStage: row.lifecycle_stage,
        source: row.source,
        tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      }
    })

    const owners: OwnerOption[] = ownerRows.map((owner) => ({
      id: owner.id,
      name: owner.name || owner.email || owner.id,
      email: owner.email,
    }))

    return { cards, owners, kpis: computeKpis(cards, dealRows), error: null }
  } catch (error) {
    console.error('[crm/pipeline] load failed', error)
    return { cards: [], owners: [], kpis: EMPTY_KPIS, error: 'Could not reach the CRM database.' }
  }
}

function computeKpis(
  cards: DealCard[],
  dealRows: Array<{ contact_id: string | null; closed_at: Date | null; created_at: Date }>
): PipelineKpis {
  let activePipelineValue = 0
  let weightedForecast = 0
  let openDeals = 0
  let wonDeals = 0
  let lostDeals = 0

  for (const card of cards) {
    const meta = stageMeta(card.stage)
    if (meta.kind === 'won') {
      wonDeals += 1
      continue
    }
    if (meta.kind === 'lost') {
      lostDeals += 1
      continue
    }
    openDeals += 1
    const aed = toAed(card.value, card.currency)
    activePipelineValue += aed
    weightedForecast += (aed * meta.probability) / 100
  }

  // Average cycle: closed `deals` rows first, then closed contacts as a fallback.
  const closedCycles = dealRows
    .filter((deal) => deal.closed_at)
    .map((deal) => (new Date(deal.closed_at as Date).getTime() - new Date(deal.created_at).getTime()) / DAY_MS)
    .filter((days) => Number.isFinite(days) && days >= 0)

  let averageDealCycleDays = 0
  if (closedCycles.length > 0) {
    averageDealCycleDays = closedCycles.reduce((sum, days) => sum + days, 0) / closedCycles.length
  } else {
    const contactCycles = cards
      .filter((card) => stageMeta(card.stage).kind !== 'open' && card.updatedAt)
      .map((card) => (new Date(card.updatedAt as string).getTime() - new Date(card.createdAt).getTime()) / DAY_MS)
      .filter((days) => Number.isFinite(days) && days >= 0)
    if (contactCycles.length > 0) {
      averageDealCycleDays = contactCycles.reduce((sum, days) => sum + days, 0) / contactCycles.length
    }
  }

  const decided = wonDeals + lostDeals

  return {
    activePipelineValue: Math.round(activePipelineValue),
    weightedForecast: Math.round(weightedForecast),
    averageDealCycleDays: Math.round(averageDealCycleDays * 10) / 10,
    winRate: decided > 0 ? Math.round((wonDeals / decided) * 1000) / 10 : 0,
    openDeals,
    wonDeals,
    lostDeals,
    currency: DEFAULT_CURRENCY,
  }
}

/* -------------------------------------------------------------------------- */
/* Annual renewal & compliance ledger                                         */
/* -------------------------------------------------------------------------- */

/** `custom_fields` keys that carry each compliance deadline. */
const DEADLINE_KEYS: Record<ComplianceKind, string[]> = {
  trade_license: ['trade_license_expiry', 'annual_renewal_date'],
  visa_eid: ['visa_eid_expiry'],
  corporate_tax: ['tax_filing_deadline', 'corporate_tax_deadline'],
  ubo_declaration: ['ubo_declaration_deadline', 'ubo_deadline'],
}

function deadlineFor(cf: Record<string, any>, kind: ComplianceKind): string | null {
  for (const key of DEADLINE_KEYS[kind]) {
    const raw = cf[key]
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = new Date(raw)
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
    }
  }
  return null
}

export async function loadRenewalLedgerData(): Promise<RenewalLedgerData> {
  try {
    const { db } = await import('@/lib/db')

    const rows = await db
      .select({
        id: contacts.id,
        first_name: contacts.first_name,
        last_name: contacts.last_name,
        display_name: contacts.display_name,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        custom_fields: contacts.custom_fields,
        created_at: contacts.created_at,
      })
      .from(contacts)
      .where(isNull(contacts.deleted_at))
      .orderBy(desc(contacts.created_at))
      .limit(MAX_CONTACTS)

    const ledger: RenewalRow[] = rows.map((row) => {
      const cf = asRecord(row.custom_fields)
      const deadlines = {} as Record<ComplianceKind, string | null>
      const remaining = {} as Record<ComplianceKind, number | null>

      for (const kind of COMPLIANCE_KINDS) {
        const date = deadlineFor(cf, kind)
        deadlines[kind] = date
        remaining[kind] = daysUntil(date)
      }

      const known = COMPLIANCE_KINDS.map((kind) => remaining[kind]).filter(
        (days): days is number => typeof days === 'number'
      )
      const soonest = known.length > 0 ? Math.min(...known) : null
      const urgency = soonest === null ? 'unknown' : resolveUrgency(soonest)

      const reminders = asRecord(cf.reminders_sent)

      return {
        id: `ren-${row.id}`,
        contactId: row.id,
        companyName: row.company || cf.company_name_choice_1 || contactName(row),
        licenseNumber: typeof cf.trade_license_number === 'string' ? cf.trade_license_number : null,
        jurisdiction: typeof cf.jurisdiction === 'string' ? cf.jurisdiction : null,
        desk: typeof cf.desk === 'string' ? cf.desk : null,
        contactName: contactName(row),
        email: row.email,
        phone: row.phone,
        deadlines,
        daysRemaining: remaining,
        urgency,
        annualFee: num(cf.annual_retainer_fee) ?? 0,
        currency: typeof cf.currency === 'string' ? cf.currency : DEFAULT_CURRENCY,
        remindersSent: {
          d60: Boolean(reminders.d60),
          d30: Boolean(reminders.d30),
          d7: Boolean(reminders.d7),
        },
        lastRemindedAt: typeof cf.last_reminded_at === 'string' ? cf.last_reminded_at : null,
        status:
          soonest === null
            ? 'no_dates'
            : soonest < 0
              ? 'action_required'
              : soonest <= 7
                ? 'grace_period'
                : soonest <= 30
                  ? 'renewing'
                  : 'active',
      }
    })

    // Records with a live deadline first (soonest expiry at the top), then the
    // ones still missing compliance dates so they can be backfilled.
    ledger.sort((a, b) => {
      const aDays = Math.min(...COMPLIANCE_KINDS.map((k) => a.daysRemaining[k] ?? Number.POSITIVE_INFINITY))
      const bDays = Math.min(...COMPLIANCE_KINDS.map((k) => b.daysRemaining[k] ?? Number.POSITIVE_INFINITY))
      if (aDays !== bDays) return aDays - bDays
      return a.companyName.localeCompare(b.companyName)
    })

    return { rows: ledger, stats: computeRenewalStats(ledger), forecast: computeForecast(ledger), error: null }
  } catch (error) {
    console.error('[crm/renewals] load failed', error)
    return { rows: [], stats: EMPTY_STATS, forecast: [], error: 'Could not reach the CRM database.' }
  }
}

function computeRenewalStats(rows: RenewalRow[]): RenewalStats {
  const stats: RenewalStats = { ...EMPTY_STATS, dueAlerts: { d60: 0, d30: 0, d7: 0 }, total: rows.length }

  for (const row of rows) {
    if (row.urgency === 'unknown') {
      stats.noDates += 1
      continue
    }
    if (row.urgency === 'expired') stats.expired += 1
    if (row.urgency === 'critical') stats.critical += 1
    if (row.urgency === 'warning') stats.warning += 1
    if (row.urgency === 'upcoming') stats.upcoming += 1
    if (row.urgency === 'healthy') stats.healthy += 1

    stats.totalARR += toAed(row.annualFee, row.currency)

    const days = row.daysRemaining.trade_license ?? null
    if (days !== null) {
      if (days <= 60 && !row.remindersSent.d60) stats.dueAlerts.d60 += 1
      if (days <= 30 && !row.remindersSent.d30) stats.dueAlerts.d30 += 1
      if (days <= 7 && !row.remindersSent.d7) stats.dueAlerts.d7 += 1
    }
  }

  stats.totalARR = Math.round(stats.totalARR)
  return stats
}

function computeForecast(rows: RenewalRow[]): RenewalForecast[] {
  const quarters: RenewalForecast[] = [
    { quarter: 'Q1 (Jan - Mar)', count: 0, value: 0 },
    { quarter: 'Q2 (Apr - Jun)', count: 0, value: 0 },
    { quarter: 'Q3 (Jul - Sep)', count: 0, value: 0 },
    { quarter: 'Q4 (Oct - Dec)', count: 0, value: 0 },
  ]

  for (const row of rows) {
    const date = row.deadlines.trade_license
    if (!date) continue
    const month = new Date(date).getMonth()
    if (Number.isNaN(month)) continue
    const bucket = quarters[Math.floor(month / 3)]
    bucket.count += 1
    bucket.value += toAed(row.annualFee, row.currency)
  }

  return quarters.map((quarter) => ({ ...quarter, value: Math.round(quarter.value) }))
}
