'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { getHubByShortcut } from './types'

/** How long a leading `G` stays armed before the sequence is abandoned. */
const SEQUENCE_TIMEOUT_MS = 1600

interface UsePlatformShortcutsOptions {
  /** Opens the universal command palette (Cmd/Ctrl+K). */
  onOpenCommand: () => void
  /** Opens the quick-create modal (bare `C`). */
  onOpenQuickCreate?: () => void
}

/**
 * Bare keys are suppressed while a modal owns the screen, so `C` inside a
 * record drawer never stacks quick-create on top of it.
 */
function isOverlayOpen(): boolean {
  if (typeof document === 'undefined') return false
  return document.querySelector('[role="dialog"][data-state="open"]') !== null
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable === true
  )
}

/**
 * Platform-wide keyboard shortcuts.
 *
 * - `Cmd/Ctrl + K` — universal command palette
 * - `C`            — quick create
 * - `G` then `D/I/M/A/C/O` — jump straight to a hub
 *
 * Single-key shortcuts never fire while the user is typing, and a bare `C` is
 * suppressed while a `G` sequence is armed so `G C` lands on CMS instead of
 * opening the create modal.
 */
export function usePlatformShortcuts({
  onOpenCommand,
  onOpenQuickCreate,
}: UsePlatformShortcutsOptions) {
  const router = useRouter()
  const [pendingPrefix, setPendingPrefix] = React.useState<string | null>(null)

  // Refs mirror state so the listener can read/write without re-binding.
  const pendingRef = React.useRef<string | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlers = React.useRef({ onOpenCommand, onOpenQuickCreate })
  handlers.current = { onOpenCommand, onOpenQuickCreate }

  const clearPending = React.useCallback(() => {
    pendingRef.current = null
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setPendingPrefix(null)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key

      // Cmd/Ctrl+K works everywhere, including inside inputs.
      if ((e.metaKey || e.ctrlKey) && key.toLowerCase() === 'k') {
        e.preventDefault()
        clearPending()
        handlers.current.onOpenCommand()
        return
      }

      // Everything below is a bare key: never hijack modified combos.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (isTypingTarget(e.target) || isOverlayOpen()) {
        clearPending()
        return
      }

      const lower = key.toLowerCase()

      // Second key of a `G …` sequence.
      if (pendingRef.current === 'g') {
        clearPending()
        const hub = getHubByShortcut(lower)
        if (hub) {
          e.preventDefault()
          router.push(hub.href)
        }
        // An unknown follow-up key is swallowed so a stray keystroke is a no-op.
        return
      }

      if (lower === 'g') {
        pendingRef.current = 'g'
        setPendingPrefix('g')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          pendingRef.current = null
          setPendingPrefix(null)
        }, SEQUENCE_TIMEOUT_MS)
        return
      }

      if (lower === 'c') {
        e.preventDefault()
        handlers.current.onOpenQuickCreate?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [clearPending, router])

  return { pendingPrefix }
}
