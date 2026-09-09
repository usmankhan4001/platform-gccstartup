import type { ContactRouteItem, SiteSettings } from '@/lib/directus'

export type PublicContact = {
  routeKey: string
  source: 'contact_routes' | 'site_settings'
  email: string | null
  phone: string | null
  whatsappDigits: string | null
  whatsappHref: string | null
}

type HeaderReader = { get(name: string): string | null }

const COUNTRY_ALIASES: Record<string, string[]> = {
  AE: ['ae', 'uae', 'united-arab-emirates'],
  BH: ['bh', 'bahrain'],
  GB: ['gb', 'uk', 'united-kingdom'],
  HK: ['hk', 'hong-kong', 'hongkong'],
  IE: ['ie', 'ireland'],
  SG: ['sg', 'singapore'],
}

const REGION_COUNTRIES: Array<{ keys: string[]; countries: string[] }> = [
  { keys: ['gcc', 'gulf', 'mena', 'middle-east'], countries: ['AE', 'BH', 'SA', 'QA', 'KW', 'OM'] },
  {
    keys: ['europe', 'eu'],
    countries: [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HU', 'IE', 'IS', 'IT',
      'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'CH',
    ],
  },
  { keys: ['asia', 'apac'], countries: ['CN', 'HK', 'ID', 'IN', 'JP', 'KR', 'MY', 'PH', 'SG', 'TH', 'TW', 'VN'] },
  { keys: ['north-america', 'americas'], countries: ['CA', 'MX', 'US'] },
]

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function values(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(values)
  if (typeof value !== 'string') return []
  return value.split(',').map(normalizeKey).filter(Boolean)
}

function requestCountry(requestHeaders: HeaderReader): string | null {
  for (const name of ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country', 'x-country-code']) {
    const country = requestHeaders.get(name)?.trim().toUpperCase()
    if (country && /^[A-Z]{2}$/.test(country) && country !== 'XX') return country
  }
  return null
}

function validEmail(value: string | null) {
  const email = value?.trim() || null
  return email?.includes('@') ? email : null
}

function validPhone(value: string | null) {
  const phone = value?.trim() || null
  const digits = phone?.replace(/[^\d]/g, '') || ''
  if (digits.length < 7) return null
  return { phone: /^https?:/i.test(phone || '') ? `+${digits}` : phone, digits }
}

function routeScore(route: ContactRouteItem, country: string | null) {
  const { route_key: routeKey, metadata } = route
  const key = normalizeKey(routeKey)
  const fallback = route.is_default || ['default', 'global', 'fallback'].includes(key) || metadata?.default === true
  if (!country) return fallback ? 100 : -1

  const countryKey = country.toLowerCase()
  const exactKeys = new Set([countryKey, ...(COUNTRY_ALIASES[country] || [])])
  const regionKeys = new Set(REGION_COUNTRIES.filter((region) => region.countries.includes(country)).flatMap((region) => region.keys))
  const metadataCountries = new Set([...values(metadata?.countries), ...values(metadata?.country_codes), ...values(route.country)])
  const metadataRegions = new Set([...values(metadata?.regions), ...values(route.region)])

  if (metadataCountries.has(countryKey) || [...exactKeys].some((candidate) => metadataCountries.has(candidate))) return 400
  if (exactKeys.has(key)) return 350
  if ([...regionKeys].some((candidate) => metadataRegions.has(candidate))) return 300
  if (regionKeys.has(key)) return 250
  return fallback ? 100 : -1
}

/** Resolve once per request and pass the result through all public site chrome. */
export function resolvePublicContact(
  settings: SiteSettings,
  routes: ContactRouteItem[],
  requestHeaders: HeaderReader,
): PublicContact {
  const country = requestCountry(requestHeaders)
  const selected = routes
    .filter((route) => route.active && (route.email || route.phone || route.whatsapp))
    .map((route) => ({
      route,
      key: normalizeKey(route.route_key),
      score: routeScore(route, country),
      priority: route.priority ?? 100,
    }))
    .filter((route) => route.score >= 0)
    .sort((a, b) => b.score - a.score || a.priority - b.priority)[0]

  const routeEmail = selected?.route.email?.trim() || null
  const routeWhatsapp = selected?.route.whatsapp?.trim() || null
  const routePhone = selected?.route.phone?.trim() || null
  const email = validEmail(routeEmail) || validEmail(settings.contact_email)
  const phone = validPhone(routePhone) || validPhone(routeWhatsapp) || validPhone(settings.contact_phone)
  const whatsapp = validPhone(routeWhatsapp) || phone

  return {
    routeKey: selected?.key || 'site-settings',
    source: selected ? 'contact_routes' : 'site_settings',
    email,
    phone: phone?.phone || null,
    whatsappDigits: whatsapp?.digits || null,
    whatsappHref: whatsapp ? `https://wa.me/${whatsapp.digits}` : null,
  }
}
