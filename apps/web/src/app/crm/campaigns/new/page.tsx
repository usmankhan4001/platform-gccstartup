'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Megaphone } from 'lucide-react'
import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import { Button } from '@/components/ui/Button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export default function NewCampaignPage() {
  const [templates, setTemplates] = useState<AnyRecord[]>([])
  const [groups, setGroups] = useState<AnyRecord[]>([])
  const [tags, setTags] = useState<AnyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then((res) => res.json()).catch(() => []),
      fetch('/api/groups').then((res) => res.json()).catch(() => []),
      fetch('/api/tags').then((res) => res.json()).catch(() => []),
    ])
      .then(([tpls, grps, tgs]) => {
        // Only Meta-approved templates can be broadcast — the API rejects the
        // rest at create time, so filter here to fail in the UI instead.
        const approved = (Array.isArray(tpls) ? tpls : []).filter(
          (t: AnyRecord) => String(t?.status || '').toLowerCase() === 'approved'
        )
        setTemplates(approved)
        setGroups(Array.isArray(grps) ? grps : [])
        setTags(Array.isArray(tgs) ? tgs : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-6 w-48 rounded bg-[var(--surface-alt)] animate-pulse" />
        <div className="h-64 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <Link href="/crm/campaigns">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
            New Broadcast Campaign
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Launch rate-limited WhatsApp template sequences and automated email flows to your targeted leads.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <CampaignWizard templates={templates} groups={groups} tags={tags} />
      </div>
    </div>
  )
}
