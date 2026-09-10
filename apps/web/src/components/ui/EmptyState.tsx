import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  title: string
  /** Say what to do next, not just that the list is empty. */
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: ReactNode
  secondaryAction?: ReactNode
  size?: 'sm' | 'default'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondaryAction,
  size = 'default',
  className,
}: EmptyStateProps) {
  const compact = size === 'sm'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] text-center',
        compact ? 'gap-1.5 px-4 py-6' : 'gap-2 px-6 py-12',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-white text-[var(--text-tertiary)] shadow-2xs ring-1 ring-[var(--border)]',
          compact ? 'h-8 w-8' : 'h-11 w-11'
        )}
      >
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      <h3 className={cn('font-bold text-[var(--text)]', compact ? 'text-xs' : 'text-sm')}>
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'max-w-sm text-[var(--text-secondary)]',
            compact ? 'text-[11px]' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-2', compact ? 'mt-1' : 'mt-3')}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/**
 * Ready-made copy for the objects the platform lists most. Every entry names the
 * object and the next action, so screens never ship a bare "No data" panel.
 */
export const EMPTY_COPY = {
  deals: {
    title: 'No deals yet',
    description: 'Create your first deal to start tracking pipeline and forecast revenue.',
  },
  contacts: {
    title: 'No contacts yet',
    description: 'Add a contact to build your directory — or import a CSV from your old CRM.',
  },
  conversations: {
    title: 'No conversations yet',
    description: 'Inbound WhatsApp and live-chat messages will appear here the moment they arrive.',
  },
  campaigns: {
    title: 'No campaigns yet',
    description: 'Launch your first campaign to reach leads over WhatsApp or email.',
  },
  templates: {
    title: 'No message templates yet',
    description: 'Create a template and submit it to Meta for approval before broadcasting.',
  },
  tasks: {
    title: 'Nothing due — you are all caught up',
    description: 'Schedule a task when a deal needs a document, call or compliance check.',
  },
  automations: {
    title: 'No automations yet',
    description: 'Build your first workflow to follow up on new leads without lifting a finger.',
  },
  pages: {
    title: 'No pages yet',
    description: 'Create a landing page to capture leads for a jurisdiction or service.',
  },
  posts: {
    title: 'No posts yet',
    description: 'Write your first article to start ranking for incorporation keywords.',
  },
  media: {
    title: 'Media library is empty',
    description: 'Upload images and documents here to reuse them across pages and campaigns.',
  },
  apiKeys: {
    title: 'No API keys yet',
    description: 'Generate a key to let the customer portal and partner systems talk to the API.',
  },
  webhooks: {
    title: 'No webhook endpoints yet',
    description: 'Add an endpoint to receive signed events when deals, orders or messages change.',
  },
  users: {
    title: 'No team members yet',
    description: 'Invite a colleague and choose what they can see and do.',
  },
  notifications: {
    title: 'You are all caught up',
    description: 'New leads, replies and renewal reminders will show up here.',
  },
  orders: {
    title: 'No orders yet',
    description: 'Orders raised in the customer portal will appear here once payment succeeds.',
  },
  search: {
    title: 'No matches',
    description: 'Try a different name, company or phone number.',
  },
} as const

export type EmptyCopyKey = keyof typeof EMPTY_COPY

export default EmptyState
