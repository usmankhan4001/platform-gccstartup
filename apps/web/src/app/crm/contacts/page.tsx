'use client'

import React, { useState, useEffect, useCallback, useDeferredValue } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building2,
  Filter,
  CheckCircle2,
  Sparkles,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Lead360Drawer } from '@/components/crm/Lead360Drawer'
import { useToast } from '@/components/ui/ToastProvider'
import { formatShortDate } from '@/components/crm/types'

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null
  status: string
  source: string | null
  tags: string[] | null
  owner_id: string | null
  owner_name: string | null
  created_at: string
  updated_at: string
}

const STAGES = [
  { id: 'all', label: 'All Contacts' },
  { id: 'lead', label: 'Leads' },
  { id: 'prospect', label: 'Prospects' },
  { id: 'client', label: 'Clients' },
  { id: 'subscriber', label: 'Subscribers' },
  { id: 'churned', label: 'Churned' },
]

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-blue-50 text-blue-700 border-blue-200',
  prospect: 'bg-amber-50 text-amber-700 border-amber-200',
  client: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  subscriber: 'bg-purple-50 text-purple-700 border-purple-200',
  churned: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedStage, setSelectedStage] = useState('all')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success: showSuccess, error: showError } = useToast()

  // New contact form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'lead',
    source: 'crm_manual',
  })

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStage !== 'all') params.set('status', selectedStage)
      if (deferredSearch.trim()) params.set('search', deferredSearch.trim())
      params.set('limit', '100')

      const res = await fetch(`/api/crm/leads?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setContacts(json.data || json.leads || [])
      } else {
        showError(json.error || 'Failed to fetch contacts')
      }
    } catch {
      showError('Network error loading contacts')
    } finally {
      setLoading(false)
    }
  }, [selectedStage, deferredSearch, showError])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email && !formData.phone) {
      showError('Please provide either an email or phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (res.ok) {
        showSuccess('Contact created successfully')
        setIsAddModalOpen(false)
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          job_title: '',
          status: 'lead',
          source: 'crm_manual',
        })
        fetchContacts()
      } else {
        showError(json.error || 'Failed to create contact')
      }
    } catch {
      showError('Network error creating contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Drawer */}
      <Lead360Drawer
        leadId={selectedLeadId || undefined}
        open={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
        onUpdated={() => void fetchContacts()}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Contacts Directory</h1>
            <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)]">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Single record of truth for leads, clients, subscribers, and partners across WhatsApp, Web &amp; Portal.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => fetchContacts()}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Stage Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStage(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStage === s.id
                  ? 'bg-[var(--navy)] text-white shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search name, email, phone, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-[var(--text-tertiary)] hover:text-[var(--text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Company &amp; Role</th>
                <th className="py-3 px-4">Lifecycle Stage</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-secondary)]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                    Loading contacts from database...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-tertiary)] mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)]">No contacts found</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {search ? 'Try adjusting your search criteria.' : 'Create your first lead to begin tracking interactions.'}
                    </p>
                    <Button size="sm" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Contact
                    </Button>
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const initials = c.name
                    ? c.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : '?'
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedLeadId(c.id)}
                      className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-[11px] font-bold text-white shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                              {c.name || 'Unnamed Contact'}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              {c.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <MessageSquare className="h-2.5 w-2.5" />
                            </span>
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-[var(--text)] block truncate">
                            {c.company || '—'}
                          </span>
                          {c.job_title && (
                            <span className="text-[11px] text-[var(--text-tertiary)] block truncate">
                              {c.job_title}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            STAGE_COLORS[c.status] || STAGE_COLORS.lead
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] border border-[var(--border)]">
                          {c.source || 'website'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-tertiary)]">
                        {formatShortDate(c.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center text-xs font-semibold text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                          Profile
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-[var(--surface)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--orange-lt)] text-[var(--orange)]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">Create New Contact</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Adds immediately to CRM pipeline and unified database.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mansoor"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="tariq@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Global FZCO"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Lifecycle Stage</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="client">Client</option>
                    <option value="subscriber">Subscriber</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="crm_manual">Manual Entry</option>
                    <option value="whatsapp_inbound">WhatsApp Inbound</option>
                    <option value="website_lead">Website Calculator</option>
                    <option value="referral">Referral / Partner</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
