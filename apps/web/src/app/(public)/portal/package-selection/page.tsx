import type { Metadata } from 'next'
import { PackageSelectorClient } from './PackageSelectorClient'

export const metadata: Metadata = {
  title: 'Company Formation Portal & Package Selection | GCC Startup',
  description: 'Select your target incorporation jurisdiction, configure ownership structures (Self as UBO, Nominee UBO, Nominee Director), and view compliance checklists before checkout.',
}

export default function PackageSelectionPage() {
  return (
    <div style={{ minHeight: '85vh', background: 'var(--surface-alt, #F8FAFC)', paddingBottom: 60 }}>
      <PackageSelectorClient />
    </div>
  )
}
