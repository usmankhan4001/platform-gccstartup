import { Loader2 } from 'lucide-react'

export default function WorkspaceLoading() {
  return (
    <div style={{
      padding: '60px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: '#64748B',
    }}>
      <Loader2 size={28} className="animate-spin" style={{ color: '#0F4C81' }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>Loading workspace module...</span>
    </div>
  )
}
