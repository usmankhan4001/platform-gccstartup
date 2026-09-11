import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: 'var(--text-muted, #64748B)',
    }}>
      <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary, #0F4C81)' }} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>Loading GCC Startup platform...</span>
    </div>
  )
}
