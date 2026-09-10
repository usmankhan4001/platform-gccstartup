'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  X,
  Handshake,
  Users,
  CheckSquare,
  Megaphone,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type QuickCreateTab = 'deal' | 'contact' | 'task' | 'campaign'

interface QuickCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: QuickCreateTab
}

const JURISDICTIONS = [
  'IFZA Dubai Freezone',
  'Meydan Freezone Dubai',
  'DED Dubai Mainland LLC',
  'DMCC Freezone Dubai',
  'RAKEZ Ras Al Khaimah',
  'ADGM Abu Dhabi Global Market',
  'KSA MISA Foreign LLC (Riyadh)',
]

/** Verb-led submit labels — the button always names the thing being created. */
const SUBMIT_COPY: Record<QuickCreateTab, string> = {
  deal: 'Create deal',
  contact: 'Create contact',
  task: 'Create task',
  campaign: 'Continue to wizard',
}

const CAMPAIGN_SEGMENTS = [
  'All Active Leads (1,240)',
  'High-Value Freezone Prospects ($8,000+)',
  'Annual License Renewals Due (60 Days)',
  'Saudi Arabia (KSA) Inbound Inquiries',
  'Qualified Golden Visa Inquiries',
]

export function QuickCreateModal({
  open,
  onOpenChange,
  initialTab = 'deal',
}: QuickCreateModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<QuickCreateTab>(initialTab)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Form State: Deal
  const [dealForm, setDealForm] = React.useState({
    dealName: '',
    contactName: '',
    email: '',
    phone: '',
    jurisdiction: 'IFZA Dubai Freezone',
    value: '6500',
    stage: 'lead',
    desk: 'Dubai Desk (UAE)',
  })

  // Form State: Contact
  const [contactForm, setContactForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: 'United Arab Emirates',
    intent: 'Freezone Company Formation',
    source: 'crm_quick_create',
  })

  // Form State: Task
  const [taskForm, setTaskForm] = React.useState({
    title: '',
    details: '',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    desk: 'Dubai Desk (UAE)',
  })

  // Form State: Campaign
  const [campaignForm, setCampaignForm] = React.useState({
    name: '',
    channel: 'whatsapp_hsm',
    segment: 'High-Value Freezone Prospects ($8,000+)',
    scheduledDate: 'immediate',
  })

  // The bare `C` shortcut is owned by `usePlatformShortcuts` in PlatformShell so
  // it can be suppressed while a `G then …` hub jump is armed.

  // Sync tab when initialTab changes
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
      setSuccessMessage(null)
      setErrorMessage(null)
    }
  }, [open, initialTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (activeTab === 'deal') {
        if (!dealForm.dealName || (!dealForm.email && !dealForm.phone)) {
          throw new Error('Add a deal name plus an email or phone number so the desk can follow up.')
        }

        const res = await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: dealForm.contactName || dealForm.dealName,
            company: dealForm.dealName,
            email: dealForm.email || undefined,
            phone: dealForm.phone || undefined,
            status: dealForm.stage,
            source: 'quick_create_deal',
            tags: [dealForm.jurisdiction, `value_$${dealForm.value}`, dealForm.desk],
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'We couldn\u2019t create that deal. Check the details and try again.')
        }

        setSuccessMessage(`Deal \u201c${dealForm.dealName}\u201d created \u2014 opening your pipeline.`)
        setTimeout(() => {
          onOpenChange(false)
          router.push('/crm/deals')
        }, 900)
      } else if (activeTab === 'contact') {
        if (!contactForm.email && !contactForm.phone) {
          throw new Error('Add an email or phone number so we can reach this contact.')
        }

        const res = await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: contactForm.firstName,
            last_name: contactForm.lastName,
            email: contactForm.email || undefined,
            phone: contactForm.phone || undefined,
            company: contactForm.company || undefined,
            source: contactForm.source,
            tags: [contactForm.intent, contactForm.country],
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'We couldn\u2019t save that contact. Check the details and try again.')
        }

        setSuccessMessage(`Contact \u201c${contactForm.firstName || contactForm.email}\u201d added to your directory.`)
        setTimeout(() => {
          onOpenChange(false)
          router.push('/crm/contacts')
        }, 900)
      } else if (activeTab === 'task') {
        if (!taskForm.title) {
          throw new Error('Give the task a short title so the desk knows what to do.')
        }

        const res = await fetch('/api/crm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskForm.title,
            details: taskForm.details || `Assigned to: ${taskForm.desk}`,
            priority: taskForm.priority,
            due_at: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'We couldn\u2019t schedule that task. Try again in a moment.')
        }

        setSuccessMessage(`Task \u201c${taskForm.title}\u201d scheduled.`)
        setTimeout(() => {
          onOpenChange(false)
          router.push('/crm')
        }, 900)
      } else if (activeTab === 'campaign') {
        if (!campaignForm.name) {
          throw new Error('Name the campaign so you can find it in reporting later.')
        }

        setSuccessMessage(`Campaign \u201c${campaignForm.name}\u201d created \u2014 opening the wizard.`)
        setTimeout(() => {
          onOpenChange(false)
          router.push('/crm/campaigns/new')
        }, 900)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Nothing was saved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0A142F]/50 backdrop-blur-xs transition-opacity animate-in fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[15%] sm:top-[20%] z-50 w-full max-w-xl translate-x-[-50%] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A142F] text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[var(--orange)]" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-sm font-black tracking-tight text-[#0A142F]">
                  Create something new
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[11px] text-[var(--text-tertiary)]">
                  Add a deal, contact, task or campaign without leaving this page
                </DialogPrimitive.Description>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-2xs">
                C
              </kbd>
              <DialogPrimitive.Close className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-slate-200 hover:text-[var(--text)] transition-colors">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] bg-slate-100/60 p-1.5 gap-1 select-none">
            <button
              type="button"
              onClick={() => {
                setActiveTab('deal')
                setSuccessMessage(null)
                setErrorMessage(null)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all',
                activeTab === 'deal'
                  ? 'bg-white text-[#0A142F] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              )}
            >
              <Handshake className="h-3.5 w-3.5 text-[#1B4FD8]" />
              <span>Deal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('contact')
                setSuccessMessage(null)
                setErrorMessage(null)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all',
                activeTab === 'contact'
                  ? 'bg-white text-[#0A142F] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              )}
            >
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>Contact</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('task')
                setSuccessMessage(null)
                setErrorMessage(null)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all',
                activeTab === 'task'
                  ? 'bg-white text-[#0A142F] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              )}
            >
              <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('campaign')
                setSuccessMessage(null)
                setErrorMessage(null)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all',
                activeTab === 'campaign'
                  ? 'bg-white text-[#0A142F] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/50'
              )}
            >
              <Megaphone className="h-3.5 w-3.5 text-[var(--orange)]" />
              <span>Campaign</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in-50">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: DEAL */}
            {activeTab === 'deal' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Company / Deal Name <span className="text-[var(--orange)]">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={dealForm.dealName}
                        onChange={(e) => setDealForm({ ...dealForm, dealName: e.target.value })}
                        placeholder="e.g. Apex Global Tech LLC"
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Contact Person
                    </label>
                    <div className="relative">
                      <Users className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        value={dealForm.contactName}
                        onChange={(e) => setDealForm({ ...dealForm, contactName: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="email"
                        value={dealForm.email}
                        onChange={(e) => setDealForm({ ...dealForm, email: e.target.value })}
                        placeholder="founder@company.com"
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      WhatsApp Phone (E.164)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="tel"
                        value={dealForm.phone}
                        onChange={(e) => setDealForm({ ...dealForm, phone: e.target.value })}
                        placeholder="+971 50 000 0000"
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Jurisdiction
                    </label>
                    <select
                      value={dealForm.jurisdiction}
                      onChange={(e) => setDealForm({ ...dealForm, jurisdiction: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      {JURISDICTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Estimated Value ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="number"
                        value={dealForm.value}
                        onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Assigned Desk
                    </label>
                    <select
                      value={dealForm.desk}
                      onChange={(e) => setDealForm({ ...dealForm, desk: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      <option value="Dubai Desk (UAE)">Dubai Desk (UAE)</option>
                      <option value="Riyadh Desk (KSA)">Riyadh Desk (KSA)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT */}
            {activeTab === 'contact' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={contactForm.firstName}
                      onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                      placeholder="e.g. Sarah"
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={contactForm.lastName}
                      onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                      placeholder="e.g. Al-Mansoor"
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="sarah@company.ae"
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      WhatsApp Phone (E.164)
                    </label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+971 50 123 4567"
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="e.g. Apex Ventures"
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Interest Intent
                    </label>
                    <select
                      value={contactForm.intent}
                      onChange={(e) => setContactForm({ ...contactForm, intent: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      <option value="Freezone Company Formation">Freezone Company Formation</option>
                      <option value="Mainland LLC Setup">Mainland LLC Setup</option>
                      <option value="UAE Golden Visa">UAE Golden Visa</option>
                      <option value="Corporate Tax & QFZP Exemption">Corporate Tax & QFZP Exemption</option>
                      <option value="Corporate Bank Account Assistance">Corporate Bank Account Assistance</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TASK */}
            {activeTab === 'task' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Task Title <span className="text-[var(--orange)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g. Verify passport copy & UBO declaration for IFZA approval"
                    className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Task Notes &amp; Context
                  </label>
                  <textarea
                    rows={2}
                    value={taskForm.details}
                    onChange={(e) => setTaskForm({ ...taskForm, details: e.target.value })}
                    placeholder="Add details, applicant specifics, or compliance reminders..."
                    className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Priority Level
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      <option value="high">High (Urgent)</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Desk Owner
                    </label>
                    <select
                      value={taskForm.desk}
                      onChange={(e) => setTaskForm({ ...taskForm, desk: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      <option value="Dubai Desk (UAE)">Dubai Desk (UAE)</option>
                      <option value="Riyadh Desk (KSA)">Riyadh Desk (KSA)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CAMPAIGN */}
            {activeTab === 'campaign' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Campaign Name <span className="text-[var(--orange)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="e.g. Q4 Corporate Tax Exemption & Freezone Advisory"
                    className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Channel &amp; Engine
                    </label>
                    <select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      <option value="whatsapp_hsm">Meta WhatsApp Cloud HSM Broadcast</option>
                      <option value="ses_email">Amazon SES Visual Email Sequence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                      Audience Segment
                    </label>
                    <select
                      value={campaignForm.segment}
                      onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-slate-50/50 px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[#0A142F] focus:bg-white transition-all"
                    >
                      {CAMPAIGN_SEGMENTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">
                  <span className="font-bold text-[#0A142F]">What happens next:</span> we&rsquo;ll open the 3-step wizard so you can map variables and preview the message before anything is sent.
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-2">
              <span className="text-[10px] text-[var(--text-tertiary)]">
                Nothing is saved until you create it &mdash; press{' '}
                <kbd className="font-mono font-bold">ESC</kbd> to close
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--orange)] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--orange-dk)] active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>{SUBMIT_COPY[activeTab]}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
