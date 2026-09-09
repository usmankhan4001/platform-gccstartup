import React from 'react'
import { PlatformShell } from '@/components/shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
