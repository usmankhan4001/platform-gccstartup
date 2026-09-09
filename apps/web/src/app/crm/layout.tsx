import React from 'react'
import { PlatformShell } from '@/components/shell'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
