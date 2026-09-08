'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Inbox,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const SYSTEM_FLOWS = [
  {
    name: 'Welcome & Discovery Call Sequence',
    trigger: 'New lead captures on Tax Calculator or Banking Quiz',
    status: 'ACTIVE',
    provider: 'Amazon SES',
    subject: 'Welcome to GCC Startup — Your UAE Formation Blueprint',
    openRate: '68%',
  },
  {
    name: 'KYC & Passport Collection Reminder',
    trigger: 'Deal moves to KYC Review stage',
    status: 'ACTIVE',
    provider: 'Amazon SES',
    subject: 'Action Required: Encrypted Passport Upload for {{company_name}}',
    openRate: '84%',
  },
  {
    name: 'Company Trade License Delivery',
    trigger: 'Deal moves to Registered stage',
    status: 'ACTIVE',
    provider: 'Amazon SES',
    subject: 'Congratulations! Official Trade License Issued: {{license_number}}',
    openRate: '92%',
  },
  {
    name: 'Annual License & Compliance Renewal',
    trigger: '30 days prior to license expiry date',
    status: 'ACTIVE',
    provider: 'Amazon SES',
    subject: 'UAE Compliance Notice: Annual License Renewal for {{company_name}}',
    openRate: '79%',
  },
]

export default function EmailPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Email Operations</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              SES Provider Active
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            High-deliverability transactional &amp; marketing flows powered by Amazon SES with strict consent filtering.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/crm/campaigns/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Email Sequence
            </Button>
          </Link>
        </div>
      </div>

      {/* Provider Status Band */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Provider Engine</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--text)]">Amazon SES</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">us-east-1 · Dedicated IP pool</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Verified Sender</span>
            <Mail className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <p className="mt-2 text-xl font-bold text-[var(--text)] truncate">noreply@gccstartup.com</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">DKIM &amp; SPF 100% verified</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Reputation Health</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600">0.02% Bounce</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Complaint rate &lt; 0.01%</p>
        </div>
      </div>

      {/* Automated Sequences */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="border-b border-[var(--border)] pb-3 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
              Automated Formation Sequences
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Event-driven sequences triggered by CRM deals, stages, and customer portal actions.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {SYSTEM_FLOWS.length} Active Flows
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {SYSTEM_FLOWS.map((flow) => (
            <div key={flow.name} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text)]">{flow.name}</span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 text-[9px] font-bold text-emerald-700">
                    {flow.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Subject: <span className="font-medium text-[var(--text)]">{flow.subject}</span>
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Trigger: {flow.trigger}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="block text-xs font-bold text-emerald-600">{flow.openRate}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Open Rate</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
