import Link from 'next/link'
import { LifeBuoy } from 'lucide-react'
import './support.css'

/**
 * Floating customer-support widget mounted once in the site layout. Opens the
 * support portal at /support. Pure Link, so no client state.
 */
export function SupportWidget() {
  return (
    <Link href="/support" className="support-widget" aria-label="Open support portal">
      <LifeBuoy size={20} aria-hidden />
      <span>Support</span>
    </Link>
  )
}
