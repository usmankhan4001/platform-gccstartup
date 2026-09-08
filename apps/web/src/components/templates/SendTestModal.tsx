'use client'
export default function SendTestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
    <div className="rounded-lg bg-[var(--bg)] p-6 shadow-lg" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold mb-2">Send Test</h2>
      <p className="text-sm text-[var(--text-secondary)]">Test sending will be connected.</p>
      <button onClick={onClose} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white">Close</button>
    </div>
  </div>
}