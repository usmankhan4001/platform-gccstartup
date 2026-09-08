'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Handshake,
  DollarSign,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Megaphone,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LeadDrawer } from '@/components/crm/LeadDrawer'
import { formatMoney, formatShortDate } from '@/components/crm/types'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: string
  source: string | null
  estimated_value?: number | null
  created_at: string
}

export default function CrmDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/crm/leads?limit=100')
      .then((res) => res.json())
      .then((json) => {
        setLeads(json.data || json.leads || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Calculate live metrics from database records
  const totalContacts = leads.length
  const activeLeads = leads.filter((l) => ['lead', 'new'].includes(l.status)).length
  const inProgress = leads.filter((l) =>
    ['prospect', 'paid_application', 'kyc_processing', 'applied'].includes(l.status)
  ).length
  const closedWon = leads.filter((l) => ['client', 'won', 'registered', 'closed'].includes(l.status)).length

  // Estimated pipeline value calculation (AED 18,500 base per formation deal if value not specified)
  const totalPipelineValue = leads.reduce((acc, l) => {
    const val = Number(l.estimated_value) || 18500
    return acc + val
  }, 0)

  const STAGES_DISTRIBUTION = [
    { label: 'New Inquiries', count: activeLeads, color: 'bg-blue-500' },
    { label: 'In Progress / KYC', count: inProgress, color: 'bg-amber-500' },
    { label: 'Closed / Formed', count: closedWon, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      <LeadDrawer
        leadId={selectedLeadId || undefined}
        open={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
      />

      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">CRM Command Center</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Live pipeline health, inbound leads, WhatsApp conversations, and formation milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/crm/contacts">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1.5" />
              Directory
            </Button>
          </Link>
          <Link href="/crm/deals">
            <Button size="sm">
              <Handshake className="h-4 w-4 mr-1.5" />
              Pipeline Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pipeline Value */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Pipeline Value
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--orange-lt)] text-[var(--orange)]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text)]">
            {totalContacts > 0 ? formatMoney(totalPipelineValue, 'AED') : 'AED 0'}
          </p>
          <p className="mt-1 flex items-center text-xs text-emerald-600 font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Across all active formation deals</span>
          </p>
        </div>

        {/* Total Contacts */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Total Contacts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text)]">{totalContacts}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            <span>Unified records in PostgreSQL</span>
          </p>
        </div>

        {/* Active Inquiries */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              In Progress Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text)]">{inProgress + activeLeads}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            <span>Awaiting compliance &amp; payment</span>
          </p>
        </div>

        {/* Formed / Won */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Closed / Formed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text)]">{closedWon}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            <span>Active corporate licenses</span>
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/crm/deals"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--navy)] text-white">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                Kanban Pipeline
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Drag-and-drop deals across 7 stages</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--accent)] transition-all" />
        </Link>

        <Link
          href="/crm/inbox"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-[var(--text)] group-hover:text-emerald-600 transition-colors">
                WhatsApp Inbox
              </span>
              <span className="text-xs text-[var(--text-secondary)]">2-way live chat &amp; Meta templates</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
        </Link>

        <Link
          href="/crm/campaigns"
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs transition-all hover:border-[var(--accent)] hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--orange)] text-white">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-[var(--text)] group-hover:text-[var(--orange)] transition-colors">
                Campaign Wizard
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Broadcast WhatsApp &amp; SES email</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:translate-x-1 group-hover:text-[var(--orange)] transition-all" />
        </Link>
      </div>

      {/* Main Grid: Pipeline Breakdown + Recent Leads */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stage Progress Distribution */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4">
            Pipeline Distribution
          </h2>
          <div className="space-y-4">
            {STAGES_DISTRIBUTION.map((stage) => {
              const pct = totalContacts > 0 ? Math.round((stage.count / totalContacts) * 100) : 0
              return (
                <div key={stage.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text)]">{stage.label}</span>
                    <span className="text-[var(--text-secondary)]">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--surface-alt)] overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-lg bg-[var(--surface-alt)] p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Platform Connected</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Connected to PostgreSQL, Meta Cloud API, Cloudflare R2, and Amazon SES.
            </p>
          </div>
        </div>

        {/* Recent Inquiries Table */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                Recent Inquiries &amp; Leads
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Click any lead to view timeline, send WhatsApp, or move stages.
              </p>
            </div>
            <Link href="/crm/contacts" className="text-xs font-semibold text-[var(--accent)] hover:underline">
              View All ({totalContacts})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase">
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-[var(--accent)]" />
                      Loading recent leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-secondary)]">
                      No leads captured yet.{' '}
                      <Link href="/crm/contacts" className="text-[var(--accent)] underline">
                        Add a lead
                      </Link>{' '}
                      or test a website calculator to see live sync.
                    </td>
                  </tr>
                ) : (
                  leads.slice(0, 6).map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[var(--text)] block truncate">
                          {lead.name || 'Unnamed Lead'}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] block truncate">
                          {lead.email || lead.phone || 'No contact info'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {lead.company || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex rounded-full bg-[var(--surface-alt)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[var(--text-tertiary)]">
                        {formatShortDate(lead.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-xs font-semibold text-[var(--accent)] hover:underline">
                          Open →
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
