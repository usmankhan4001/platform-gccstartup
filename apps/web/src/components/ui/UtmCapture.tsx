'use client'

import { useUtmCapture } from '@/lib/attribution'

/** Renders nothing — just runs the capture hook. Mounted once in (site)/layout.tsx. */
export function UtmCapture() {
  useUtmCapture()
  return null
}
