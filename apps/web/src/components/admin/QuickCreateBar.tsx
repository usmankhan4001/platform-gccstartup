'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export function QuickCreateBar({ onLead }: { onLead?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2">
      <Plus size={16} />
      <span className="text-sm text-[var(--text-secondary)]">Quick actions</span>
    </div>
  )
}