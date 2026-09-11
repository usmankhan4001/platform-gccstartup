import { Loader2 } from 'lucide-react'

export default function PublicLoading() {
  return (
    <div style={{
      minHeight: '65vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-muted, #64748B)',
    }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary, #0F4C81)' }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading information...</span>
    </div>
  )
}
