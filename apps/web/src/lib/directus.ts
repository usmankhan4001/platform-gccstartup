// Compatibility layer — will be replaced with Drizzle queries
// This file exists so Puck blocks can import without errors during migration

export type SiteSettings = Record<string, any>
export type ContactRouteItem = Record<string, any>
export type CountryItem = Record<string, any>
export type LeadStatus = string
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type LeadItem = Record<string, any>
export type LeadActivityItem = Record<string, any>
export type LeadConsentItem = Record<string, any>
export type LeadStageHistoryItem = Record<string, any>
export type LeadTaskItem = Record<string, any>
export type DirectusUserSummary = Record<string, any>
export type EmailEventItem = Record<string, any>
export type EmailSyncJobItem = Record<string, any>
export type PuckData = { content: unknown[]; root: Record<string, unknown>; zones?: Record<string, unknown> }

export function directus() { return null }

export function getPageBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getPostBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getCountryBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getServiceBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getPricingTierBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getComparisonBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getBusinessModelBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getGuideBySlug(slug: string): Promise<any> { return Promise.resolve(null) }
export function getSiteSettings(): Promise<any> { return Promise.resolve({}) }
export function getAllComparisons(): Promise<any[]> { return Promise.resolve([]) }
export function getAllBusinessModels(): Promise<any[]> { return Promise.resolve([]) }
export function getAllGuides(): Promise<any[]> { return Promise.resolve([]) }
export function getAllSitemapEntries(): Promise<any> { return Promise.resolve({}) }
export function getPublicContactRoutes(): Promise<any[]> { return Promise.resolve([]) }
export function getRedirect(slug: string): Promise<any> { return Promise.resolve(null) }
export function getPageById(id: string): Promise<any> { return Promise.resolve(null) }
export function logDirectusError(error: any, context: string): void { console.error(`[${context}]`, error) }
export function describeDirectusError(error: any): string { return error?.message || 'Unknown error' }