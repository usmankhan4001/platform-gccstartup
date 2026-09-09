export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_CONSENT_STORAGE_KEY = 'gcc-cookie-consent'
export const COOKIE_CONSENT_OPEN_EVENT = 'gcc:cookie-consent:open'
export const COOKIE_CONSENT_CHANGE_EVENT = 'gcc:cookie-consent:change'

export type CookieConsentChoice = {
  version: typeof COOKIE_CONSENT_VERSION
  necessary: true
  analytics: boolean
  advertising: boolean
  savedAt: number
}

export function createCookieConsentChoice(
  categories: Pick<CookieConsentChoice, 'analytics' | 'advertising'>,
  savedAt = Date.now(),
): CookieConsentChoice {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: categories.analytics,
    advertising: categories.advertising,
    savedAt,
  }
}

export function parseCookieConsent(value: string | null): CookieConsentChoice | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null

    const candidate = parsed as Record<string, unknown>
    if (
      candidate.version !== COOKIE_CONSENT_VERSION ||
      candidate.necessary !== true ||
      typeof candidate.analytics !== 'boolean' ||
      typeof candidate.advertising !== 'boolean' ||
      typeof candidate.savedAt !== 'number' ||
      !Number.isFinite(candidate.savedAt) ||
      candidate.savedAt <= 0
    ) {
      return null
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: candidate.analytics,
      advertising: candidate.advertising,
      savedAt: candidate.savedAt,
    }
  } catch {
    return null
  }
}

export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT))
  }
}

export function getCookieConsent(): string {
  return 'granted'
}
