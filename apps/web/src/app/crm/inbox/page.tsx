'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  UserPlus,
  Sparkles,
  CheckCheck,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/utils'
import { ChatWindow } from '@/components/inbox/ChatWindow'
import { NewChatModal } from '@/components/inbox/NewChatModal'
import { Button } from '@/components/ui/Button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

function InboxContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlContactId = searchParams.get('contactId')

  const [conversations, setConversations] = useState<AnyRecord[]>([])
  const [selectedContact, setSelectedContact] = useState<AnyRecord | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'whatsapp'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)

  const fetchConversations = useCallback(() => {
    const controller = new AbortController()
    const channelParam = filter === 'whatsapp' ? '&channel=whatsapp' : ''
    const url = `/api/chat?limit=50${channelParam}`

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const list: AnyRecord[] = Array.isArray(data)
          ? data
          : data?.conversations || []
        
        // Map database columns to the format ChatWindow expects
        const normalized = list.map((c) => ({
          ...c,
          id: c.id,
          contactId: c.contact_id || c.contactId,
          phoneNumber: c.contact_phone || c.phoneNumber || '',
          firstName: c.contact_first_name || '',
          lastName: c.contact_last_name || '',
          name: c.contact_name || [c.contact_first_name, c.contact_last_name].filter(Boolean).join(' ') || 'Customer',
          email: c.contact_email || '',
          channel: c.channel || 'whatsapp',
          unreadCount: c.unread_count ?? c.unreadCount ?? 0,
          lastMessageAt: c.last_message_at || c.lastMessageAt || c.created_at,
        }))

        // Filter by unread if selected
        const filtered = filter === 'unread' 
          ? normalized.filter((c) => (c.unreadCount || 0) > 0)
          : normalized

        setConversations(filtered)

        if (
          filtered.length > 0 &&
          !selectedContact &&
          !urlContactId &&
          typeof window !== 'undefined' &&
          window.innerWidth >= 1024
        ) {
          const first = filtered[0]
          setSelectedContact({
            id: first.contactId || first.id,
            conversationId: first.id,
            name: first.name,
            phoneNumber: first.phoneNumber,
            email: first.email,
            channel: first.channel,
          })
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Failed to load conversations.')
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [filter, selectedContact, urlContactId])

  useEffect(() => {
    if (urlContactId) {
      fetch(`/api/crm/leads/${urlContactId}`)
        .then((res) => res.json())
        .then((json) => {
          const lead = json.data?.lead || json.lead
          if (lead) {
            setSelectedContact({
              id: lead.id,
              name: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.name || 'Lead',
              phoneNumber: lead.phone,
              email: lead.email,
              channel: 'whatsapp',
            })
          }
        })
        .catch(() => {})
    } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSelectedContact(null)
    }
  }, [urlContactId])

  useEffect(() => {
    const cancel = fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => {
      cancel?.()
      clearInterval(interval)
    }
  }, [fetchConversations])

  const handleSelect = (conv: AnyRecord) => {
    setSelectedContact({
      id: conv.contactId || conv.id,
      conversationId: conv.id,
      name: conv.name,
      phoneNumber: conv.phoneNumber,
      email: conv.email,
      channel: conv.channel,
    })
  }

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phoneNumber && c.phoneNumber.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    )
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectContact={(contact) => {
          setSelectedContact(contact)
          fetchConversations()
        }}
      />

      {/* Conversations List Left Panel */}
      <div
        className={cn(
          'flex h-full w-full shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:w-96 lg:min-w-[340px] lg:max-w-[380px]',
          selectedContact ? 'hidden lg:flex' : 'flex'
        )}
      >
        {/* Panel Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] p-3.5 bg-[var(--surface-alt)]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text)]">Unified Inbox</h2>
            {filteredConversations.length > 0 && (
              <span className="rounded-full bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                {filteredConversations.length}
              </span>
            )}
          </div>
          <Button size="xs" onClick={() => setIsNewChatOpen(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search & Channel Filter */}
        <div className="shrink-0 space-y-2 border-b border-[var(--border)] p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <input
              placeholder="Search chat or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-[var(--text-tertiary)] hover:text-[var(--text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition-all ${
                  filter === tab.value
                    ? 'bg-[var(--navy)] text-white shadow-xs'
                    : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of active threads */}
        <div className="flex-1 divide-y divide-[var(--border)] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--accent)]" />
              Loading conversations...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-600">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-rose-500" />
              <p>{error}</p>
              <button
                onClick={() => fetchConversations()}
                className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
              <p className="text-xs font-semibold text-[var(--text)]">No conversations</p>
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                Inbound WhatsApp chats and inquiries will appear here automatically.
              </p>
              <Button size="xs" className="mt-3" onClick={() => setIsNewChatOpen(true)}>
                Start New Chat
              </Button>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedContact?.id === (c.contactId || c.id)
              const initials = c.name
                ? c.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?'

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'flex cursor-pointer select-none items-start gap-3 p-3 transition-colors',
                    isSelected
                      ? 'border-l-4 border-[var(--accent)] bg-[var(--surface-hover)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  )}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-xs font-bold text-white shadow-xs">
                    {initials}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-[var(--text)]">{c.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--text-tertiary)]">
                        {c.lastMessageAt ? formatTimeAgo(new Date(c.lastMessageAt)) : ''}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-1 truncate text-[11px] text-[var(--text-secondary)]">
                      <span className="truncate">{c.phoneNumber || c.email || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700 border border-emerald-200 uppercase">
                        {c.channel || 'WhatsApp'}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn('flex h-full min-w-0 flex-1 flex-col bg-[var(--surface-alt)]', selectedContact ? 'flex' : 'hidden lg:flex')}>
        {selectedContact ? (
          <ChatWindow
            contact={selectedContact}
            onRefreshList={() => fetchConversations()}
            onBackMobile={() => setSelectedContact(null)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-4 bg-[var(--surface)] p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--orange-lt)] text-[var(--orange)] shadow-xs">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-base font-bold text-[var(--text)]">GCC Startup Unified Inbox</h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Select a conversation thread to send official WhatsApp messages, insert approved templates, voice notes, and formation documents.
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-4 text-xs font-medium text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              <span>Official Meta WhatsApp Cloud API Connected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center bg-[var(--surface)]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--accent)] border-t-transparent" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  )
}
