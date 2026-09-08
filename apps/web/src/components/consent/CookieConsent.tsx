'use client'
export function CookieConsent() { return null }
export function useCookieConsent() { return { consented: true, choice: { analytics: true, advertising: true }, ready: true, acceptAll: () => {}, rejectAll: () => {} } }