'use client'

import { useEffect } from 'react'

/** One shared IntersectionObserver + MutationObserver for every `.reveal` element on the page — DESIGN.md §7.
 * MutationObserver ensures dynamically mounted Puck blocks are also observed without requiring page reloads. */
export function RevealObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.05, rootMargin: '50px 0px' },
    )

    const observeElements = () => {
      document.querySelectorAll('.reveal:not(.in-view), .reveal-l:not(.in-view), .reveal-r:not(.in-view)').forEach((el) => {
        observer.observe(el)
      })
    }

    // Initial observe
    observeElements()

    // Watch for dynamically added DOM nodes (e.g. Puck blocks / async components)
    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    // Safety fallback: if anything isn't in-view after 2s, reveal it so nothing stays invisible
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach((el) => {
        el.classList.add('in-view')
      })
    }, 2000)

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return null
}
