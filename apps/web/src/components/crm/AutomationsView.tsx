'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  CalendarCheck,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Bot,
  Activity,
  Layers,
  GitBranch,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { crmFetch, formatShortDate } from './types'
import { VisualWorkflowBuilder } from './VisualWorkflowBuilder'

type SystemActivity = {
  id: string
  title: string
  description: string
  occurred_at: string
  lead_id?: { id: string; name?: string; order_number?: string } | string
}

export function AutomationsView() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'radar' | 'logs'>('canvas')
  const [runningTick, setRunningTick] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    loadRecentAutomations()
  }, [])

  async function loadRecentAutomations() {
    setLoadingActivities(true)
    try {
      const res = await crmFetch<{ activities: SystemActivity[] }>('/api/crm/activities?type=system&limit=20').catch(() => ({ activities: [] }))
      setActivities(res.activities || [])
    } catch {
      // Fallback graceful
    } finally {
      setLoadingActivities(false)
    }
  }

  async function runTick() {
    setRunningTick(true)
    try {
      const res = await fetch('/api/jobs/tick', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Automation engine tick failed')
      setLastResult(data)
      showSuccess(`Automation engine executed successfully: ${data.senderJobsProcessed || 0} jobs processed, ${data.renewalsChecked || 0} renewals evaluated.`)
      await loadRecentAutomations()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error executing automation tick')
    } finally {
      setRunningTick(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Hub Navigation Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'canvas'
                ? 'bg-[var(--navy)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            Visual Workflow Canvas
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'radar'
                ? 'bg-[var(--navy)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Zap className="h-4 w-4" />
            Autonomous Execution Radar
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-[var(--navy)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Activity className="h-4 w-4" />
            Recent Dispatches &amp; Activity ({activities.length})
          </button>
        </div>

        <button
          type="button"
          onClick={runTick}
          disabled={runningTick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--orange)] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5" />
          {runningTick ? 'Executing Tick…' : 'Trigger Engine Tick'}
        </button>
      </div>

      {/* VIEW 1: VISUAL FLOW AUTOMATIONS CANVAS */}
      {activeTab === 'canvas' && <VisualWorkflowBuilder />}

      {/* VIEW 2: AUTONOMOUS CRM EXECUTION RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                AUTONOMOUS BACKEND WORKER ACTIVE
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
                CRM Event Routing &amp; Compliance Mesh
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Background worker orchestrates multi-channel client alerts, stage advancement triggers, KYC compliance outreach, and annual renewal deadlines with at-least-once durable delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={runTick}
              disabled={runningTick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-[var(--navy)]/90 transition-all shrink-0"
            >
              <Zap className="h-4 w-4 text-[var(--orange)]" />
              {runningTick ? 'Running Automation Tick…' : 'Trigger Engine Tick Now'}
            </button>
          </div>

          {/* Last Result Banner if triggered */}
          {lastResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Engine Heartbeat Succeeded · Processed {Number(lastResult.senderJobsProcessed || 0)} outbox jobs · Evaluated {Number(lastResult.renewalsChecked || 0)} entity renewals
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                Status: {String(lastResult.ok ? 'OK (200)' : 'Error')}
              </span>
            </div>
          )}

          {/* 4 Active Autonomous Engines */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 1. Stage Triggers */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Send className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                  ACTIVE · EVENT-DRIVEN
                </span>
              </div>
              <h4 className="font-bold text-sm text-[var(--text)]">Multi-Channel Client Dispatches</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Fires automatically whenever a deal moves stage. Dispatches branded emails, WhatsApp messages, and updates the public shipment status tracker (`/track/[token]`).
              </p>
            </div>

            {/* 2. Client & Invoice Promotion */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                  ACTIVE · CLOSED STAGE
                </span>
              </div>
              <h4 className="font-bold text-sm text-[var(--text)]">Client Profile &amp; Invoice Generation</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Promotes leads into permanent Client Accounts, creates Company Entities with statutory registers, and generates primary fulfillment invoices on stage `closed`.
              </p>
            </div>

            {/* 3. Renewal Radar */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                  ACTIVE · DAILY RADAR
                </span>
              </div>
              <h4 className="font-bold text-sm text-[var(--text)]">Statutory Renewal &amp; Tax Radar</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Scans government registry deadlines 30 days ahead of time. Auto-creates CRM follow-up tasks and dispatches proactive WhatsApp renewal notices to company owners.
              </p>
            </div>

            {/* 4. AI Lead Scoring */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                  ACTIVE · REAL-TIME
                </span>
              </div>
              <h4 className="font-bold text-sm text-[var(--text)]">Automated Lead Scoring Engine</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Evaluates corporate domain authenticity, nominee packages, and GCC target markets in real-time. Instantly tags incoming leads with VIP, High, and Medium priority badges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE DISPATCHES & ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Recent Automated Dispatches &amp; Execution Events
            </h3>
            <button
              type="button"
              onClick={loadRecentAutomations}
              disabled={loadingActivities}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingActivities ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>

          {activities.length === 0 && !loadingActivities ? (
            <div className="p-12 text-center text-xs text-[var(--text-tertiary)]">
              No automated actions logged yet. When leads move stage or background cron fires, their executions will stream here.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activities.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[var(--orange)] border border-orange-200 shrink-0 mt-0.5">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold text-[var(--text)]">{act.title}</strong>
                      <time className="text-[11px] text-[var(--text-tertiary)] font-mono">
                        {formatShortDate(act.occurred_at, true)}
                      </time>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
