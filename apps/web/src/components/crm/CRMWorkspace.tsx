'use client'

import { useState } from 'react'
import { PipelineBoard } from './PipelineBoard'

export function CRMWorkspace() {
  const [selectedTab, setSelectedTab] = useState<string>('board')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {['board', 'tasks'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedTab === tab
                ? 'bg-primary text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            {tab === 'board' ? 'Pipeline Board' : 'Tasks'}
          </button>
        ))}
      </div>
      {selectedTab === 'board' ? <PipelineBoard leads={[]} movingId={null} onOpen={() => {}} onMove={() => {}} /> : <p className="text-sm text-[var(--text-secondary)]">Tasks will be connected to the database.</p>}
    </div>
  )
}